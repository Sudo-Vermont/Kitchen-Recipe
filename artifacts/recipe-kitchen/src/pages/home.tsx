import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChefHat,
  ChevronLeft,
  Film,
  Flame,
  Leaf,
  ListOrdered,
  Search,
  Sparkles,
  Utensils,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getGetRecipeSummaryQueryKey, getListRecipesQueryKey, useGetRecipeSummary, useListRecipes } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeSkeleton } from '@/components/RecipeSkeleton';

const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free'];
const heroImage = `${import.meta.env.BASE_URL}garlic-mushroom-pasta.jpg`;

function Ribbon({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center">
      <h2 className="ribbon text-[17px] tracking-[0.01em]">{children}</h2>
    </div>
  );
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="ribbon-flat inline-block px-5 py-2 text-[15px] font-semibold uppercase tracking-[0.03em]">
      {children}
    </h2>
  );
}

function StatBox({ value, label, icon: Icon }: { value: string | number; label: string; icon: typeof ChefHat }) {
  return (
    <div className="flex flex-col items-center border border-card-border bg-card px-3 py-6 panel-shadow" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <Icon className="h-8 w-8 text-primary/70" strokeWidth={1.2} />
      <p className="mt-4 text-[30px] leading-none text-primary">{value}</p>
      <p className="mt-2 text-center text-[12px] text-muted-foreground">{label}</p>
    </div>
  );
}

export default function Home() {
  const [location] = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All recipes');
  const [dietary, setDietary] = useState('');
  const [maxCalories, setMaxCalories] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLElement>(null);
  const params = useMemo(() => ({
    search: search.trim() || undefined,
    category: category === 'All recipes' ? undefined : category,
    dietary: dietary || undefined,
    maxCalories: maxCalories ? Number(maxCalories) : undefined,
  }), [search, category, dietary, maxCalories]);
  const recipesQuery = useListRecipes(params, { query: { queryKey: getListRecipesQueryKey(params) } });
  const summaryQuery = useGetRecipeSummary({ query: { queryKey: getGetRecipeSummaryQueryKey() } });
  const allRecipesQuery = useListRecipes({}, { query: { queryKey: getListRecipesQueryKey({}) } });
  const recipes = recipesQuery.data ?? [];
  const categories = useMemo(
    () => Array.from(new Set((allRecipesQuery.data ?? []).map((recipe) => recipe.category).filter(Boolean))).sort(),
    [allRecipesQuery.data],
  );
  const hasFilters = Boolean(search || dietary || maxCalories || category !== 'All recipes');
  const featured = (allRecipesQuery.data ?? [])[0];
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const countSaved = () =>
      setSavedCount(
        Object.keys(localStorage).filter(
          (key) => key.startsWith('recipe-kitchen-saved-') && localStorage.getItem(key) === 'true',
        ).length,
      );
    countSaved();
    window.addEventListener('recipe-saved', countSaved);
    return () => window.removeEventListener('recipe-saved', countSaved);
  }, []);

  useEffect(() => {
    if (location.includes('focus=search')) searchRef.current?.focus();
    if (location.includes('view=recipes')) gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location]);

  const clearFilters = () => {
    setSearch('');
    setDietary('');
    setMaxCalories('');
    setCategory('All recipes');
  };

  const selectCategory = (item: string) => {
    setCategory(item);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      {/* Hero: photo band with an overlaid search card, as in the reference. */}
      <section className="relative mt-5 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} aria-hidden="true" />
        <div className="absolute inset-0 bg-[#8d4a3e]/70" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1200px] gap-8 px-6 py-14 lg:grid-cols-[1.35fr_0.65fr] lg:py-20">
          <div className="animate-rise text-white">
            <h1 className="text-[clamp(2.2rem,5vw,3.4rem)] font-light leading-tight">Welcome to Recipe Kitchen!</h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/85">
              Recipe Kitchen is where dinner gets decided. Browse recipes with the calories already worked out, see what
              every ingredient costs before you shop, and keep the ones you love in one place.
            </p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/85">
              Add your own recipes, or drop in a cooking video and let us read it for you.
            </p>
            <Link
              href="/add"
              className="mt-8 inline-flex items-center gap-2 bg-primary px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.03em] text-primary-foreground transition-colors hover:bg-accent"
              data-testid="link-hero-add"
            >
              Share your recipe <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="animate-rise bg-card p-6 panel-shadow [animation-delay:120ms]">
            <h2 className="text-[19px] text-foreground">Search for recipes</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Enter an ingredient, a dish, or a keyword. You can also narrow it down to a category.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">There is something here for tonight.</p>
            <Input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Enter your search term"
              className="mt-5 h-10 bg-card"
              data-testid="input-search-recipes"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-3 h-10 w-full border border-input bg-card px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
              aria-label="Recipe category"
              data-testid="select-hero-category"
            >
              {['All recipes', ...categories].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="mt-3 w-full bg-primary py-3 text-[13px] font-semibold uppercase tracking-[0.03em] text-primary-foreground transition-colors hover:bg-accent"
              data-testid="button-start-cooking"
            >
              Start cooking!
            </button>
          </div>
        </div>
      </section>

      {/* Numbers strip */}
      <section className="mx-auto max-w-[1200px] px-6 pt-12">
        <Ribbon>Recipe Kitchen in numbers</Ribbon>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatBox value={summaryQuery.data?.totalRecipes ?? 0} label="recipes" icon={ChefHat} />
          <StatBox value={summaryQuery.data?.totalIngredients ?? 0} label="ingredients" icon={Utensils} />
          <StatBox value={summaryQuery.data?.averageCalories ?? 0} label="avg. calories" icon={Flame} />
          <StatBox value={categories.length} label="categories" icon={ListOrdered} />
          <StatBox value={savedCount} label="saved by you" icon={BookOpen} />
        </div>
      </section>

      {/* Recipe of the day + featured cook */}
      {featured && (
        <section className="mx-auto max-w-[1200px] px-6 pt-14">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="border border-card-border bg-card panel-shadow" data-testid="card-recipe-of-the-day">
              <div className="relative">
                <Link href={`/recipes/${featured.id}`} className="group block overflow-hidden">
                  <div
                    className="aspect-[16/8] bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${featured.imageUrl || heroImage})`,
                    }}
                  />
                </Link>
                <span className="absolute left-0 top-4 bg-primary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
                  Recipe of the day
                </span>
              </div>
              <div className="border-t-[3px] border-primary p-5">
                <h3 className="text-[22px] text-foreground">{featured.title}</h3>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{featured.description}</p>
                <Link
                  href={`/recipes/${featured.id}`}
                  className="mt-4 inline-block bg-primary px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.03em] text-primary-foreground transition-colors hover:bg-accent"
                  data-testid="link-featured-recipe"
                >
                  See the full recipe
                </Link>
              </div>
            </div>

            <Link
              href="/from-video"
              className="group relative flex flex-col justify-between overflow-hidden bg-primary p-7 text-primary-foreground panel-shadow"
              data-testid="card-video-import"
            >
              <div className="absolute -bottom-16 -right-10 h-48 w-48 rounded-full border-[22px] border-white/10 transition-transform duration-500 group-hover:scale-110" />
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center bg-white/20">
                  <Film className="h-5 w-5" />
                </div>
                <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.06em] text-white/75">
                  Have a recipe on video?
                </p>
                <h3 className="mt-2 text-[26px] leading-tight">Turn a cooking clip into dinner.</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/80">
                  Upload a short video and we will find the ingredients, steps, nutrition, and an estimated shopping list.
                </p>
              </div>
              <span className="relative mt-7 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.03em]">
                Try video import <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Grid + category sidebar */}
      <section ref={gridRef} className="mx-auto max-w-[1200px] scroll-mt-6 px-6 pt-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <SectionHeading>{category === 'All recipes' ? 'Latest recipes' : category}</SectionHeading>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.03em] text-muted-foreground transition-colors hover:text-primary"
                  data-testid="button-clear-filters"
                >
                  <X className="h-3.5 w-3.5" /> Clear filters
                </button>
              )}
            </div>

            {recipesQuery.isLoading && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <RecipeSkeleton key={item} />
                ))}
              </div>
            )}
            {recipesQuery.isError && (
              <div className="border border-destructive/30 bg-card p-10 text-center" data-testid="state-recipes-error">
                <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
                <h3 className="mt-4 text-[24px]">The pantry door is stuck.</h3>
                <p className="mt-2 text-sm text-muted-foreground">We couldn't load the recipes right now. Give it another try.</p>
                <Button onClick={() => recipesQuery.refetch()} variant="outline" className="mt-5" data-testid="button-retry-recipes">
                  Try again
                </Button>
              </div>
            )}
            {!recipesQuery.isLoading && !recipesQuery.isError && recipes.length === 0 && (
              <div className="border border-dashed border-primary/40 bg-card px-6 py-16 text-center" data-testid="state-recipes-empty">
                <Leaf className="mx-auto h-10 w-10 text-primary" />
                <h3 className="mt-4 text-[26px]">Nothing on this plate yet.</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Try a broader search, or be the first to add something that makes dinner better.
                </p>
                <Button asChild className="mt-6" data-testid="button-empty-add">
                  <Link href="/add">
                    Add a recipe <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
            {recipes.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe, index) => (
                  <RecipeCard key={recipe.id} recipe={recipe} index={index} />
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <div className="border border-card-border bg-card panel-shadow" data-testid="sidebar-categories">
              <button
                type="button"
                onClick={() => selectCategory('All recipes')}
                className={`flex w-full items-center gap-2 px-4 py-3 text-left text-[13px] font-semibold transition-colors ${
                  category === 'All recipes' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:text-primary'
                }`}
                data-testid="button-category-all-recipes"
              >
                <ChevronLeft className="h-4 w-4" /> All recipes
              </button>
              {categories.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => selectCategory(item)}
                  className={`flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-[13px] transition-colors ${
                    category === item ? 'bg-primary font-semibold text-primary-foreground' : 'text-foreground hover:text-primary'
                  }`}
                  data-testid={`button-category-${item.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <ChevronLeft className="h-4 w-4" /> {item}
                </button>
              ))}
            </div>

            <div className="border border-card-border bg-card panel-shadow" data-testid="panel-filters">
              <p className="bg-primary px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
                Narrow it down
              </p>
              <div className="p-4">
                <p className="text-[12px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">Dietary</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {dietaryOptions.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setDietary(dietary === item ? '' : item)}
                      className={`border px-3 py-1.5 text-[12px] transition-colors ${
                        dietary === item
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border text-foreground hover:border-primary hover:text-primary'
                      }`}
                      data-testid={`button-dietary-${item.toLowerCase().replace('-', '')}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <label className="mt-5 block text-[12px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                  Max calories
                  <Input
                    type="number"
                    min="1"
                    value={maxCalories}
                    onChange={(event) => setMaxCalories(event.target.value)}
                    placeholder="650"
                    className="mt-2 h-9 bg-card"
                    data-testid="input-max-calories"
                  />
                </label>
              </div>
            </div>

            <div className="border border-card-border bg-card panel-shadow">
              <p className="bg-primary px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
                Your collection
              </p>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                  <span className="text-muted-foreground">Most cooked</span>
                  <span className="font-semibold text-foreground">{summaryQuery.data?.popularCategory || '—'}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                  <span className="text-muted-foreground">Showing</span>
                  <span className="font-semibold text-foreground">{recipes.length} recipes</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                  <span className="text-muted-foreground">Saved</span>
                  <span className="font-semibold text-foreground">{savedCount}</span>
                </div>
              </div>
              <Link
                href="/add"
                className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.03em] text-primary transition-colors hover:bg-secondary"
                data-testid="link-add-from-library"
              >
                <Sparkles className="h-3.5 w-3.5" /> Add a recipe
              </Link>
            </div>

            <div className="hidden overflow-hidden border border-card-border bg-card panel-shadow lg:block">
              <p className="bg-primary px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-primary-foreground">
                Search
              </p>
              <div className="p-4">
                <div className="flex items-center gap-2 border border-input bg-card px-3">
                  <Search className="h-4 w-4 shrink-0 text-primary" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ingredient or dish"
                    className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    data-testid="input-sidebar-search"
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
