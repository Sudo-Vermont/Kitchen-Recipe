import { useState } from 'react';
import { ArrowLeft, Check, Clock3, ExternalLink, Flame, Heart, Pencil, ShoppingBag, Trash2, UsersRound, Wallet } from 'lucide-react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getGetRecipeQueryKey, getGetRecipeSummaryQueryKey, getListRecipesQueryKey, useDeleteRecipe, useGetRecipe, useUpdateRecipe } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { IngredientTile } from '@/components/IngredientTile';
import { RecipeVisual } from '@/components/RecipeVisual';
import { useToast } from '@/hooks/use-toast';

type DetailTab = 'ingredients' | 'method' | 'nutrition';


function Nutrition({ label, value, unit, tone }: { label: string; value: number; unit: string; tone: string }) {
  return (
    <div className="border border-card-border bg-card px-4 py-4 panel-shadow">
      <div className={`mb-4 h-1.5 w-9 ${tone}`} />
      <p className="text-[11px] uppercase tracking-[0.04em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[24px] text-foreground">
        {value}
        <span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

function FactRow({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[13px] first:border-t-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function RecipeDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const query = useGetRecipe(id, { query: { queryKey: getGetRecipeQueryKey(id) } });
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const recipe = query.data;
  const [saved, setSaved] = useState(() => typeof window !== 'undefined' && localStorage.getItem(`recipe-kitchen-saved-${id}`) === 'true');
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [addedAll, setAddedAll] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('ingredients');

  if (query.isLoading) return <DetailSkeleton />;
  if (query.isError || !recipe) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center" data-testid="state-recipe-error">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-primary text-primary-foreground">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-[32px]">That recipe wandered off.</h1>
        <p className="mt-3 text-muted-foreground">We couldn't find this one in the kitchen.</p>
        <Button asChild className="mt-7" data-testid="button-back-library">
          <Link href="/">Back to the library</Link>
        </Button>
      </div>
    );
  }

  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const perServingPrice = money.format(recipe.mealPrice);
  const wholeItemCost = money.format(recipe.wholeItemCost);
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;
  const toggleSaved = () => {
    const next = !saved;
    setSaved(next);
    localStorage.setItem(`recipe-kitchen-saved-${id}`, String(next));
    window.dispatchEvent(new Event('recipe-saved'));
    toast({ title: next ? 'Saved to your kitchen' : 'Removed from saved recipes', description: next ? 'You can find it here whenever dinner needs a nudge.' : 'No hard feelings.' });
  };
  const addAllToList = () => {
    const current = JSON.parse(localStorage.getItem('recipe-kitchen-shopping-list') ?? '[]') as unknown[];
    const additions = recipe.ingredients.map((ingredient) => ({ ...ingredient, recipeId: recipe.id }));
    localStorage.setItem('recipe-kitchen-shopping-list', JSON.stringify([...current, ...additions]));
    setAddedAll(true);
    toast({ title: 'Ingredients added', description: `${recipe.ingredients.length} items are ready for your shopping trip.` });
  };
  const walmartUrl = (ingredient: { name: string; shoppingUrl: string }) => ingredient.shoppingUrl?.trim() || `https://www.walmart.com/search?q=${encodeURIComponent(ingredient.name)}`;
  const beginEdit = () => {
    setEditTitle(recipe.title);
    setEditDescription(recipe.description);
    setEditMode(true);
  };
  const saveEdit = () => {
    if (!editTitle.trim()) return;
    updateRecipe.mutate({ id, data: { title: editTitle.trim(), description: editDescription.trim() } }, {
      onSuccess: () => {
        setEditMode(false);
        queryClient.invalidateQueries({ queryKey: getGetRecipeQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        toast({ title: 'Recipe updated', description: 'The new details are tucked in.' });
      },
      onError: () => toast({ title: 'Could not save changes', description: 'Please try again.', variant: 'destructive' }),
    });
  };
  const removeRecipe = () => {
    if (!window.confirm('Delete this recipe from your kitchen?')) return;
    deleteRecipe.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecipesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecipeSummaryQueryKey() });
        toast({ title: 'Recipe deleted' });
        setLocation('/');
      },
      onError: () => toast({ title: 'Could not delete recipe', description: 'Please try again.', variant: 'destructive' }),
    });
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-28 pt-6 lg:pb-16">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary" data-testid="link-back-library">
          <ArrowLeft className="h-4 w-4" /> Back to recipes
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSaved}
            className={`flex h-9 w-9 items-center justify-center border transition-colors ${saved ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-primary hover:bg-primary hover:text-primary-foreground'}`}
            aria-label={saved ? 'Remove saved recipe' : 'Save recipe'}
            data-testid="button-save-detail"
          >
            <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
          <Button variant="outline" size="sm" onClick={beginEdit} className="hidden bg-card sm:flex" data-testid="button-edit-recipe">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={removeRecipe} disabled={deleteRecipe.isPending} className="hidden bg-card text-destructive hover:text-destructive sm:flex" data-testid="button-delete-recipe">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="border border-card-border bg-card panel-shadow">
            <div className="relative">
              <RecipeVisual recipe={recipe} className="aspect-[16/9]" />
              <span className="absolute bottom-0 left-0 bg-primary px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
                {recipe.category}
              </span>
            </div>

            <div className="border-t-[3px] border-primary p-5 sm:p-7">
              {editMode ? (
                <div>
                  <label className="block text-[13px] font-semibold">
                    Recipe title
                    <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className="mt-2 bg-card text-lg" data-testid="input-edit-title" />
                  </label>
                  <label className="mt-4 block text-[13px] font-semibold">
                    Description
                    <Textarea value={editDescription} onChange={(event) => setEditDescription(event.target.value)} className="mt-2 min-h-24 bg-card" data-testid="textarea-edit-description" />
                  </label>
                  <div className="mt-5 flex gap-2">
                    <Button onClick={saveEdit} disabled={updateRecipe.isPending} data-testid="button-save-edit">
                      <Check className="h-4 w-4" /> Save changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-[clamp(1.9rem,4vw,2.6rem)] font-light leading-tight">{recipe.title}</h1>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{recipe.description}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-[12px] uppercase tracking-[0.03em] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-primary" /> {totalMinutes} min</span>
                    <span className="flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 text-primary" /> {recipe.servings} servings</span>
                    <span className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-primary" /> {recipe.calories} cal</span>
                    <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-primary" /> {perServingPrice} per serving</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 border border-card-border bg-card panel-shadow">
            <div className="flex flex-wrap items-stretch border-b border-border">
              {([['ingredients', 'Ingredients'], ['method', 'Method'], ['nutrition', 'Nutrition']] as [DetailTab, string][]).map(([tab, label]) => (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.03em] transition-colors ${
                    activeTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-primary'
                  }`}
                  data-testid={`tab-${tab}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-7">
              {activeTab === 'ingredients' && (
                <div data-testid="section-ingredients">
                  <p className="mb-5 text-[13px] text-muted-foreground">
                    Every whole item adds up to <span className="font-semibold text-primary">{wholeItemCost}</span> at the store.
                  </p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div key={`${ingredient.name}-${index}`} className="group relative" data-testid={`ingredient-${index + 1}`}>
                        <IngredientTile ingredient={ingredient} index={index} />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-muted-foreground">${ingredient.price.toFixed(2)}</p>
                          <a
                            href={walmartUrl(ingredient)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 border border-primary/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.03em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                            aria-label={`Shop for ${ingredient.name} at Walmart`}
                            data-testid={`link-shop-${index + 1}`}
                          >
                            Walmart <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'method' && (
                <ol className="space-y-5" data-testid="section-method">
                  {recipe.instructions.map((instruction, index) => (
                    <li className="flex gap-4" key={`${instruction}-${index}`} data-testid={`instruction-${index + 1}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-[12px] font-semibold text-primary-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="pt-1 text-[15px] leading-relaxed text-foreground/85">{instruction}</p>
                    </li>
                  ))}
                </ol>
              )}
              {activeTab === 'nutrition' && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="section-nutrition">
                  <Nutrition label="Calories" value={recipe.calories} unit="kcal" tone="bg-primary" />
                  <Nutrition label="Protein" value={recipe.protein} unit="g" tone="bg-accent" />
                  <Nutrition label="Carbs" value={recipe.carbs} unit="g" tone="bg-[#e2a97e]" />
                  <Nutrition label="Fat" value={recipe.fat} unit="g" tone="bg-[#c9776e]" />
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="border border-card-border bg-card panel-shadow">
            <p className="bg-primary px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
              At a glance
            </p>
            <FactRow icon={Clock3} label="Prep" value={`${recipe.prepMinutes} min`} />
            <FactRow icon={Clock3} label="Cook" value={`${recipe.cookMinutes} min`} />
            <FactRow icon={UsersRound} label="Servings" value={String(recipe.servings)} />
            <FactRow icon={Flame} label="Calories" value={`${recipe.calories} kcal`} />
            <FactRow icon={Wallet} label="Per serving" value={perServingPrice} />
            <FactRow icon={ShoppingBag} label="Buy it all" value={wholeItemCost} />
          </div>

          <div className="border border-card-border bg-card panel-shadow">
            <p className="bg-primary px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
              Shopping
            </p>
            <div className="p-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
                  <IngredientTile key={`${ingredient.name}-${index}`} ingredient={ingredient} index={index} compact />
                ))}
              </div>
              {recipe.ingredients.length > 3 && (
                <p className="mt-2 text-[11px] text-muted-foreground">+ {recipe.ingredients.length - 3} more in the ingredients tab</p>
              )}
              <Button onClick={addAllToList} className="mt-4 w-full" data-testid="button-add-list-aside">
                <ShoppingBag className="h-4 w-4" /> {addedAll ? 'Added to bag' : 'Add to bag'}
              </Button>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Saves these ingredients to your Recipe Kitchen shopping list.
              </p>
            </div>
          </div>

          <div className="hidden border border-card-border bg-card panel-shadow sm:block">
            <p className="bg-primary px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
              This recipe
            </p>
            <div className="space-y-2 p-4">
              <Button variant="outline" onClick={beginEdit} className="w-full justify-start" data-testid="button-edit-recipe-aside">
                <Pencil className="h-3.5 w-3.5" /> Edit details
              </Button>
              <Button
                variant="outline"
                onClick={removeRecipe}
                disabled={deleteRecipe.isPending}
                className="w-full justify-start text-destructive hover:text-destructive"
                data-testid="button-delete-recipe-aside"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete recipe
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 md:hidden">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button variant="outline" onClick={beginEdit} className="h-12 flex-1" data-testid="button-mobile-modify">
            <Pencil className="h-4 w-4" /> Modify
          </Button>
          <Button onClick={addAllToList} className="h-12 flex-1" data-testid="button-mobile-add">
            <ShoppingBag className="h-4 w-4" /> {addedAll ? 'Added to bag' : 'Add to bag'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-fade px-6 py-8">
      <div className="skeleton-shimmer h-5 w-32" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="skeleton-shimmer aspect-[16/9]" />
          <div className="mt-4 space-y-4">
            <div className="skeleton-shimmer h-10 w-4/5" />
            <div className="skeleton-shimmer h-14 w-full" />
          </div>
        </div>
        <div className="skeleton-shimmer h-72 w-full" />
      </div>
    </div>
  );
}
