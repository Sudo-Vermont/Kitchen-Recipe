# Recipe Kitchen

Recipe Kitchen helps home cooks discover, understand, shop for, and share recipes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/recipe-kitchen/src/` — React pages, app shell, recipe cards, and visual styling
- `artifacts/api-server/src/routes/recipes.ts` — recipe CRUD, filtering, summaries, and shopping-link normalization
- `artifacts/api-server/src/routes/video-import.ts` — protected video upload/URL analysis and recipe draft generation
- `lib/api-spec/openapi.yaml` — source of truth for recipe API contracts
- `lib/db/src/schema/recipes.ts` — PostgreSQL recipe schema and nested JSON fields
- `artifacts/recipe-kitchen/public/` — starter recipe photography

## Architecture decisions

- Recipe ingredients and instructions are stored as JSONB arrays so recipes remain a single portable record.
- Empty ingredient shopping links are normalized to Walmart search URLs on the server.
- Meal cost is an estimated total of the Walmart ingredient prices supplied with each recipe.
- Video imports require Clerk sign-in, use private App Storage uploads, split videos with ffmpeg, and analyze chunks with Gemini before producing a reviewable draft.
- Recipe images are optional; the UI renders a warm generated visual fallback when no image URL is supplied.

## Product

- Browse and search a seeded recipe library
- Filter by category, dietary preference, and maximum calories
- Open recipe details with per-serving nutrition, instructions, and ingredient shopping links
- Add, edit, and delete recipes
- Save recipes and maintain a local shopping list in the browser
- Upload a cooking video or provide a direct video file URL, review the detected recipe, and save it to the library

## User preferences

The user asked for recipes, the ability to add recipes, calorie information, and where to buy ingredients.

## Gotchas

- The recipe frontend expects the managed workflow to provide `PORT` and `BASE_PATH`; direct Vite builds need those variables set.
- Video URLs must point directly to an `.mp4`, `.mov`, or `.webm` file; platform page URLs are not downloadable video files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
