import { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Film, Loader2, LockKeyhole, Sparkles, Upload, WandSparkles } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@clerk/react';
import {
  getVideoRecipeImportJob,
  getGetRecipeSummaryQueryKey,
  getListRecipesQueryKey,
  useAnalyzeRecipeFromVideo,
  useCreateRecipe,
  useRequestUploadUrl,
  type RecipeInput,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type SourceMode = 'upload' | 'url';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function FromVideo() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const requestUploadUrl = useRequestUploadUrl();
  const analyzeVideo = useAnalyzeRecipeFromVideo();
  const createRecipe = useCreateRecipe();
  const [mode, setMode] = useState<SourceMode>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [draft, setDraft] = useState<RecipeInput | null>(null);
  const [analysisStage, setAnalysisStage] = useState('');

  const wholeItemCost = useMemo(
    () => draft?.ingredients.reduce((total, ingredient) => total + Number(ingredient.price || 0), 0) ?? 0,
    [draft],
  );
  const perServingCost = draft ? wholeItemCost / Math.max(1, draft.servings) : 0;

  const updateDraft = (key: 'title' | 'description', value: string) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const analyze = async () => {
    try {
      let data: { sourceType: 'upload' | 'url'; source: string; mimeType?: string };
      if (mode === 'upload') {
        if (!file) {
          toast({ title: 'Choose a video first', description: 'Upload a cooking video to get started.', variant: 'destructive' });
          return;
        }
        if (file.size > 100 * 1024 * 1024) {
          toast({ title: 'Video is too large', description: 'Choose a video under 100 MB.', variant: 'destructive' });
          return;
        }
        setAnalysisStage('Uploading your video…');
        const upload = await requestUploadUrl.mutateAsync({
          data: { name: file.name, size: file.size, contentType: file.type || 'video/mp4' },
        });
        const uploadResponse = await fetch(upload.uploadURL, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'video/mp4' },
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error('The video upload did not complete.');
        }
        data = { sourceType: 'upload', source: upload.objectPath, mimeType: file.type || 'video/mp4' };
      } else {
        if (!videoUrl.trim()) {
          toast({ title: 'Paste a video URL first', description: 'Use a direct .mp4, .mov, or .webm file URL.', variant: 'destructive' });
          return;
        }
        data = { sourceType: 'url', source: videoUrl.trim() };
      }
      setAnalysisStage('Preparing the video…');
      const job = await analyzeVideo.mutateAsync({ data });
      setAnalysisStage('AI is watching the video…');
      for (let attempt = 0; attempt < 450; attempt += 1) {
        const result = await getVideoRecipeImportJob(job.jobId);
        if ('recipe' in result && result.recipe) {
          setDraft(result.recipe);
          toast({ title: 'Recipe detected', description: 'Review the draft before saving it to your kitchen.' });
          return;
        }
        if ('status' in result && result.status === 'failed') {
          throw new Error(result.error || 'The video could not be analyzed.');
        }
        await delay(2000);
      }
      throw new Error('The video is taking longer than expected. Please try a shorter clip.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The video could not be analyzed.';
      toast({ title: 'Could not read that video', description: message, variant: 'destructive' });
    } finally {
      setAnalysisStage('');
    }
  };

  const saveDraft = () => {
    if (!draft) return;
    createRecipe.mutate({ data: draft }, {
      onSuccess: (recipe) => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecipeSummaryQueryKey() });
        toast({ title: 'Recipe saved to the kitchen', description: 'Your video recipe is ready to cook.' });
        setLocation(`/recipes/${recipe.id}`);
      },
      onError: () => toast({ title: 'Could not save recipe', description: 'Review the detected details and try again.', variant: 'destructive' }),
    });
  };

  const busy = requestUploadUrl.isPending || analyzeVideo.isPending || createRecipe.isPending || Boolean(analysisStage);

  if (!isLoaded) {
    return <div className="mx-auto max-w-5xl px-5 py-24 text-center text-muted-foreground">Loading your kitchen…</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-12 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Back to library</Link>
        <div className="mt-16 border border-card-border bg-card p-8 text-center panel-shadow sm:p-14">
          <LockKeyhole className="mx-auto h-10 w-10 text-primary" />
          <p className="ribbon-flat mt-6 inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">Private video imports</p>
          <h1 className="mt-3 text-[30px]">Sign in to turn videos into recipes.</h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">Your uploaded cooking videos stay protected while Recipe Kitchen reads the ingredients and steps.</p>
          <Button asChild className="mt-8 px-6"><Link href="/sign-in">Sign in to continue</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary" data-testid="link-video-back"><ArrowLeft className="h-4 w-4" /> Back to library</Link>
      <div className="mt-10 max-w-3xl animate-rise">
        <p className="ribbon-flat inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]"><WandSparkles className="h-3.5 w-3.5" /> Recipe from video</p>
        <h1 className="mt-4 text-[clamp(2rem,4.5vw,3rem)] tracking-normal font-light">Watch it once.<br /><em className="font-normal text-primary">Cook it forever.</em></h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">Upload a cooking video or paste a direct video file URL. AI will find the ingredients, instructions, nutrition, and estimated Walmart prices for your review.</p>
      </div>

      {!draft ? (
        <section className="mt-12 border border-card-border bg-card p-6 panel-shadow sm:p-9" data-testid="section-video-source">
          <div className="flex flex-wrap gap-2 border-b border-border/70 pb-5">
            <button type="button" onClick={() => setMode('upload')} className={`px-4 py-2 text-sm font-semibold transition-colors ${mode === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`} data-testid="button-video-upload-mode"><Upload className="mr-2 inline h-4 w-4" /> Upload video</button>
            <button type="button" onClick={() => setMode('url')} className={`px-4 py-2 text-sm font-semibold transition-colors ${mode === 'url' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`} data-testid="button-video-url-mode"><Film className="mr-2 inline h-4 w-4" /> Paste video URL</button>
          </div>
          {mode === 'upload' ? (
            <label className="mt-8 flex cursor-pointer flex-col items-center justify-center border border-dashed border-primary/40 bg-secondary/35 px-6 py-14 text-center transition-colors hover:bg-secondary/60">
              <input type="file" accept="video/*" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} data-testid="input-video-file" />
              <span className="flex h-14 w-14 items-center justify-center bg-primary text-primary-foreground"><Upload className="h-6 w-6" /></span>
              <span className="mt-5 text-[22px]">{file ? file.name : 'Choose a cooking video'}</span>
              <span className="mt-2 text-sm text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB ready to analyze` : 'MP4, MOV, or WebM · up to 100 MB'}</span>
            </label>
          ) : (
            <div className="mt-8">
              <label className="text-sm font-semibold">Direct video file URL<Input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://example.com/recipe-video.mp4" className="mt-2 bg-card" data-testid="input-video-url" /></label>
              <p className="mt-3 text-xs text-muted-foreground">Use a direct .mp4, .mov, or .webm URL. Video platform page links are not supported yet.</p>
            </div>
          )}
          <div className="mt-8 flex flex-col gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole className="h-4 w-4 text-primary" /> Your upload is private and used only for this import.</p>
            <Button onClick={analyze} disabled={busy} className="px-6" data-testid="button-analyze-video">{busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {analysisStage || 'Reading your video…'}</> : <><Sparkles className="h-4 w-4" /> Find the recipe</>}</Button>
          </div>
        </section>
      ) : (
        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.8fr]" data-testid="section-video-draft">
          <div className="border border-card-border bg-card p-6 panel-shadow sm:p-9">
            <div className="flex items-start justify-between gap-5"><div><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">Review the draft</p><h2 className="mt-3 text-[26px]">Looks like a keeper.</h2></div><CheckCircle2 className="h-7 w-7 text-primary" /></div>
            <label className="mt-8 block text-sm font-semibold">Recipe title<Input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} className="mt-2 bg-card text-lg" data-testid="input-draft-title" /></label>
            <label className="mt-5 block text-sm font-semibold">Description<Textarea value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} className="mt-2 min-h-24 bg-card" data-testid="textarea-draft-description" /></label>
           <div className="mt-8 border-t border-border/70 pt-6"><div className="flex items-end justify-between gap-4"><div><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">Detected ingredients</p><h3 className="mt-3 text-[22px]">The Walmart list</h3></div><div className="text-right"><p className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">1 serving</p><p className="text-xs font-semibold text-primary">{money.format(perServingCost)}</p><p className="mt-1 text-[9px] uppercase tracking-[0.08em] text-muted-foreground">Buy whole items {money.format(wholeItemCost)}</p></div></div><div className="mt-5 divide-y divide-border/70">{draft.ingredients.map((ingredient, index) => <div key={`${ingredient.name}-${index}`} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div><p className="text-sm font-semibold">{ingredient.name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">{ingredient.quantity} · whole Walmart item</p></div><span className="text-xs font-semibold">${Number(ingredient.price || 0).toFixed(2)}</span></div>)}</div></div>
          </div>
          <div className="border border-border bg-secondary/35 p-6 sm:p-9"><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">The method</p><h3 className="mt-3 text-[26px]">Take it step by step</h3><ol className="mt-7 space-y-5">{draft.instructions.map((instruction, index) => <li key={`${instruction}-${index}`} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-[10px] font-semibold text-primary-foreground">{String(index + 1).padStart(2, '0')}</span><p className="pt-1 text-sm leading-relaxed text-foreground/80">{instruction}</p></li>)}</ol><div className="mt-8 border-t border-border/70 pt-6"><p className="ribbon-flat inline-block px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em]">Nutrition estimate</p><p className="mt-3 text-sm text-muted-foreground">{draft.calories ? `${draft.calories} calories · ${draft.protein}g protein · ${draft.carbs}g carbs · ${draft.fat}g fat` : 'Nutrition was not clear in the video.'}</p></div><div className="mt-8 flex flex-col gap-3"><Button onClick={saveDraft} disabled={busy} className="w-full" data-testid="button-save-video-recipe">{createRecipe.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving recipe…</> : 'Save as recipe'}</Button><Button type="button" variant="outline" onClick={() => setDraft(null)} disabled={busy} className="w-full" data-testid="button-analyze-another">Analyze another video</Button></div></div>
        </section>
      )}
    </div>
  );
}