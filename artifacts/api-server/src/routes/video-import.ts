import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  AnalyzeRecipeFromVideoBody,
  GetVideoRecipeImportJobResponse,
} from "@workspace/api-zod";
import { ObjectStorageService } from "../lib/objectStorage";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const execFileAsync = promisify(execFile);
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_CHUNK_BYTES = 7 * 1024 * 1024;
const MAX_CHUNK_SECONDS = 60;
const objectStorageService = new ObjectStorageService();

type VideoSource = {
  buffer: Buffer;
  mimeType: string;
  label: string;
};

type DetectedIngredient = {
  name: string;
  quantity: string;
  aisle: string;
  price: number;
};

type VideoJob =
  | {
      userId: string;
      status: "processing";
      createdAt: number;
    }
  | {
      userId: string;
      status: "complete";
      createdAt: number;
      recipe: ReturnType<typeof normalizeDraft>;
      sourceLabel: string;
    }
  | {
      userId: string;
      status: "failed";
      createdAt: number;
      error: string;
    };

const videoJobs = new Map<string, VideoJob>();
const VIDEO_JOB_TTL_MS = 30 * 60 * 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  const parsed: unknown = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Gemini returned an invalid recipe shape.");
  }
  return parsed as Record<string, unknown>;
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function safeVideoUrl(rawUrl: string): URL {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Video URL must use http or https.");
  }
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) {
    throw new Error("Local video URLs are not supported.");
  }
  return url;
}

async function readVideoSource(
  sourceType: "url" | "upload",
  source: string,
  requestedMimeType?: string,
): Promise<VideoSource> {
  if (sourceType === "upload") {
    const file = await objectStorageService.getObjectEntityFile(source);
    const [metadata] = await file.getMetadata();
    const size = Number(metadata.size ?? 0);
    if (size > MAX_VIDEO_BYTES) {
      throw new Error("Video uploads must be 100 MB or smaller.");
    }
    const [buffer] = await file.download();
    return {
      buffer,
      mimeType: requestedMimeType || String(metadata.contentType || "video/mp4"),
      label: "Uploaded cooking video",
    };
  }

  const url = safeVideoUrl(source);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(45_000),
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`The video URL returned HTTP ${response.status}.`);
  }
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_VIDEO_BYTES) {
    throw new Error("Video URLs must point to a file 100 MB or smaller.");
  }
  const contentType = response.headers.get("content-type")?.split(";")[0] || "";
  if (!contentType.startsWith("video/")) {
    throw new Error(
      "Use a direct video file URL ending in .mp4, .mov, or .webm. Page URLs from video platforms are not supported yet.",
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_VIDEO_BYTES) {
    throw new Error("Video URLs must point to a file 100 MB or smaller.");
  }
  return {
    buffer,
    mimeType: contentType,
    label: url.hostname,
  };
}

async function splitVideo(source: VideoSource): Promise<Array<{ buffer: Buffer; mimeType: string }>> {
  const workingDir = await mkdtemp(join(tmpdir(), "recipe-video-"));
  const inputPath = join(workingDir, "source-video");
  const outputPattern = join(workingDir, "chunk-%03d.mp4");
  await writeFile(inputPath, source.buffer);

  try {
    await execFileAsync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-map",
      "0:v:0",
      "-map",
      "0:a?",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-vf",
      "scale=w=640:h=-2:force_original_aspect_ratio=decrease",
      "-pix_fmt",
      "yuv420p",
      "-b:v",
      "600k",
      "-maxrate",
      "700k",
      "-bufsize",
      "1400k",
      "-c:a",
      "aac",
      "-b:a",
      "48k",
      "-f",
      "segment",
      "-segment_time",
      String(MAX_CHUNK_SECONDS),
      "-reset_timestamps",
      "1",
      outputPattern,
    ]);
    const names = (await readdir(workingDir))
      .filter((name) => name.startsWith("chunk-") && name.endsWith(".mp4"))
      .sort();
    const chunks = await Promise.all(
      names.map(async (name) => ({
        buffer: await readFile(join(workingDir, name)),
        mimeType: "video/mp4",
      })),
    );
    if (!chunks.length) {
      throw new Error("The video did not contain a readable video track.");
    }
    return chunks;
  } finally {
    await rm(workingDir, { recursive: true, force: true });
  }
}

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Video analysis is not configured.");
  }
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.5-flash",
  });
}

async function generateJson(parts: Part[]): Promise<Record<string, unknown>> {
  const model = getGeminiModel();
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
        },
      });
      return parseJson(result.response.text());
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        const message = error instanceof Error ? error.message : String(error);
        const retryAfterSeconds = Number(message.match(/retry in ([\d.]+)s/i)?.[1] ?? 0);
        const retryDelayMs = retryAfterSeconds > 0
          ? Math.min(90_000, Math.ceil(retryAfterSeconds * 1000) + 500)
          : 900 * (attempt + 1);
        await delay(retryDelayMs);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Video analysis failed.");
}

async function analyzeChunk(
  chunk: { buffer: Buffer; mimeType: string },
  index: number,
  total: number,
): Promise<Record<string, unknown>> {
  if (chunk.buffer.length > MAX_CHUNK_BYTES) {
    throw new Error(
      `Video chunk ${index + 1} is too large to analyze. Try a shorter or lower-resolution video.`,
    );
  }
  if (index > 0) {
    await delay(700);
  }
  return generateJson([
    {
      text: `Analyze cooking video segment ${index + 1} of ${total}. Identify only what is visible or clearly said. Return concise JSON with this shape: {"title":"","description":"","ingredients":[{"name":"","quantity":"","aisle":"","price":0}],"instructions":[""],"category":"","dietary":[],"prepMinutes":0,"cookMinutes":0,"servings":1,"calories":0,"protein":0,"carbs":0,"fat":0}. Estimate missing nutrition and Walmart shelf prices conservatively. Each ingredient price must represent buying the whole Walmart package/item, not only the amount used in the recipe. Do not invent specialty ingredients that are not supported by the segment.`,
    },
    {
      inlineData: {
        mimeType: chunk.mimeType,
        data: chunk.buffer.toString("base64"),
      },
    },
  ]);
}

function normalizeDraft(raw: Record<string, unknown>): {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  dietary: string[];
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: DetectedIngredient[];
  instructions: string[];
  author: string;
} {
  const ingredients = arrayValue(raw.ingredients)
    .map((item) => {
      const ingredient = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const name = stringValue(ingredient.name, "");
      return {
        name,
        quantity: stringValue(ingredient.quantity, "to taste"),
        aisle: stringValue(ingredient.aisle, "Pantry"),
        price: Math.round(numberValue(ingredient.price, 0) * 100) / 100,
      };
    })
    .filter((item) => item.name);
  const instructions = arrayValue(raw.instructions)
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  if (!ingredients.length || !instructions.length) {
    throw new Error("The video did not contain enough recipe details to save.");
  }
  return {
    title: stringValue(raw.title, "Recipe from video"),
    description: stringValue(raw.description, "A recipe detected from a cooking video."),
    imageUrl: "",
    category: stringValue(raw.category, "Dinner"),
    dietary: arrayValue(raw.dietary).filter((item): item is string => typeof item === "string"),
    prepMinutes: numberValue(raw.prepMinutes, 15),
    cookMinutes: numberValue(raw.cookMinutes, 30),
    servings: Math.max(1, Math.round(numberValue(raw.servings, 4))),
    calories: numberValue(raw.calories, 0),
    protein: numberValue(raw.protein, 0),
    carbs: numberValue(raw.carbs, 0),
    fat: numberValue(raw.fat, 0),
    ingredients: ingredients.map((ingredient) => ({
      ...ingredient,
      shoppingUrl: `https://www.walmart.com/search?q=${encodeURIComponent(ingredient.name)}`,
    })) as DetectedIngredient[],
    instructions,
    author: "Video import",
  };
}

async function analyzeVideo(
  sourceType: "url" | "upload",
  sourcePath: string,
  mimeType?: string,
): Promise<{ recipe: ReturnType<typeof normalizeDraft>; sourceLabel: string }> {
  const source = await readVideoSource(sourceType, sourcePath, mimeType);
  const chunks = await splitVideo(source);
  const analyses: Record<string, unknown>[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    analyses.push(await analyzeChunk(chunks[index], index, chunks.length));
  }
  if (analyses.length === 1) {
    return {
      recipe: normalizeDraft(analyses[0]),
      sourceLabel: source.label,
    };
  }
  const synthesis = await generateJson([
    {
      text: `Combine these cooking-video segment analyses into one recipe draft. Deduplicate ingredients and order the instructions. Only use evidence from the analyses. Return JSON with title, description, ingredients [{name,quantity,aisle,price}], instructions, category, dietary, prepMinutes, cookMinutes, servings, calories, protein, carbs, fat. Use numeric values for all nutrition, time, serving, and price fields. Ingredient price means the estimated cost to buy the whole Walmart package/item. Segment analyses: ${JSON.stringify(analyses)}`,
    },
  ]);
  return {
    recipe: normalizeDraft(synthesis),
    sourceLabel: source.label,
  };
}

function removeExpiredJobs(): void {
  const cutoff = Date.now() - VIDEO_JOB_TTL_MS;
  for (const [jobId, job] of videoJobs) {
    if (job.createdAt < cutoff) {
      videoJobs.delete(jobId);
    }
  }
}

function userFacingVideoError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/429|quota exceeded|too many requests|rate limit/i.test(message)) {
    return "Video analysis is temporarily rate-limited. Please wait about a minute and try again.";
  }
  return message || "Video analysis failed.";
}

router.post(
  "/recipes/from-video",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = AnalyzeRecipeFromVideoBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Choose an uploaded video or a direct video URL." });
      return;
    }
    removeExpiredJobs();
    const jobId = randomUUID();
    const userId = String(res.locals.userId);
    const createdAt = Date.now();
    videoJobs.set(jobId, { userId, status: "processing", createdAt });

    void analyzeVideo(parsed.data.sourceType, parsed.data.source, parsed.data.mimeType)
      .then(({ recipe, sourceLabel }) => {
        videoJobs.set(jobId, {
          userId,
          status: "complete",
          createdAt,
          recipe,
          sourceLabel,
        });
      })
      .catch((error: unknown) => {
        const message = userFacingVideoError(error);
        req.log.warn({ err: error, jobId }, "Video recipe import failed");
        videoJobs.set(jobId, { userId, status: "failed", createdAt, error: message });
      });

    res.status(202).json({ jobId, status: "processing" });
  },
);

router.get(
  "/recipes/from-video/jobs/:jobId",
  requireAuth,
  (req: Request, res: Response): void => {
    removeExpiredJobs();
    const rawJobId = req.params.jobId;
    const jobId = Array.isArray(rawJobId) ? rawJobId[0] : rawJobId;
    const job = videoJobs.get(jobId);
    if (!job || job.userId !== String(res.locals.userId)) {
      res.status(404).json({ error: "Video analysis job not found." });
      return;
    }
    if (job.status === "processing") {
      res.status(202).json({ jobId, status: job.status });
      return;
    }
    if (job.status === "failed") {
      res.status(422).json({ jobId, status: job.status, error: job.error });
      return;
    }
    res.json(
    GetVideoRecipeImportJobResponse.parse({
        recipe: job.recipe,
        sourceLabel: job.sourceLabel,
      }),
    );
  },
);

export default router;