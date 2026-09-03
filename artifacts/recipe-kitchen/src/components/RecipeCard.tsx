import { useEffect, useState } from 'react';
import { Clock3, Flame, Heart, SignalHigh } from 'lucide-react';
import { Link } from 'wouter';
import type { Recipe } from '@workspace/api-client-react';
import { RecipeVisual } from '@/components/RecipeVisual';

/** The reference cards label effort; derive it from total cook time. */
function effortFor(totalMinutes: number): string {
  if (totalMinutes <= 25) return 'easy';
  if (totalMinutes <= 55) return 'medium';
  return 'hard';
}

export function RecipeCard({ recipe, index = 0 }: { recipe: Recipe; index?: number }) {
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const perServingPrice = money.format(recipe.mealPrice);
  const wholeItemCost = money.format(recipe.wholeItemCost);
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;
  const savedKey = `recipe-kitchen-saved-${recipe.id}`;
  const [isSaved, setIsSaved] = useState(() => typeof window !== 'undefined' && localStorage.getItem(savedKey) === 'true');
  useEffect(() => {
    const syncSaved = () => setIsSaved(localStorage.getItem(savedKey) === 'true');
    window.addEventListener('recipe-saved', syncSaved);
    return () => window.removeEventListener('recipe-saved', syncSaved);
  }, [savedKey]);
  const save = () => {
    const next = !isSaved;
    localStorage.setItem(savedKey, String(next));
    setIsSaved(next);
    window.dispatchEvent(new Event('recipe-saved'));
  };

  return (
    <article className="group animate-rise" style={{ animationDelay: `${index * 45}ms` }} data-testid={`card-recipe-${recipe.id}`}>
      <div className="flex h-full flex-col border border-card-border bg-card panel-shadow hover-lift">
        <div className="relative">
          <Link href={`/recipes/${recipe.id}`} className="block overflow-hidden" data-testid={`link-recipe-${recipe.id}`}>
            <RecipeVisual recipe={recipe} className="aspect-[4/3]" />
          </Link>
          <span className="absolute bottom-0 left-0 bg-primary px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
            {recipe.category}
          </span>
          <button
            onClick={save}
            className={`absolute right-0 top-0 flex h-9 w-9 items-center justify-center transition-colors ${
              isSaved ? 'bg-primary text-primary-foreground' : 'bg-card/90 text-foreground hover:bg-primary hover:text-primary-foreground'
            }`}
            aria-label={isSaved ? 'Remove saved recipe' : 'Save recipe'}
            data-testid={`button-save-recipe-${recipe.id}`}
          >
            <Heart className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-3 pt-4">
          <Link href={`/recipes/${recipe.id}`} data-testid={`link-title-${recipe.id}`}>
            <h3 className="text-[18px] leading-snug text-foreground transition-colors group-hover:text-primary">{recipe.title}</h3>
          </Link>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{recipe.description}</p>
          <p className="mt-3 text-[12px] text-muted-foreground">
            <span className="font-semibold text-primary">{perServingPrice}</span> per serving
            <span className="px-1.5 text-border">|</span>
            {wholeItemCost} to buy it all
          </p>
        </div>

        <div className="mt-auto flex items-stretch border-t border-border text-[11px] uppercase tracking-[0.03em] text-muted-foreground">
          <span className="flex flex-1 items-center justify-center gap-1.5 py-2.5">
            <SignalHigh className="h-3.5 w-3.5 text-primary" /> {effortFor(totalMinutes)}
          </span>
          <span className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2.5">
            <Clock3 className="h-3.5 w-3.5 text-primary" /> {totalMinutes} min
          </span>
          <span className="flex flex-1 items-center justify-center gap-1.5 border-l border-border py-2.5">
            <Flame className="h-3.5 w-3.5 text-primary" /> {recipe.calories}
          </span>
        </div>
      </div>
    </article>
  );
}
