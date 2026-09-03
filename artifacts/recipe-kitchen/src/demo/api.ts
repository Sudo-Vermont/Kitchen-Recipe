import type { Recipe, RecipeInput } from '@workspace/api-client-react';
import { demoRecipes } from '@/demo/recipes';

/**
 * Answers the app's `/api/recipes*` calls from bundled data so the static
 * GitHub Pages build renders a populated interface. Writes are kept in memory
 * for the life of the tab: the forms behave, but nothing is persisted because
 * Pages has no server to persist to.
 */

let recipes: Recipe[] = demoRecipes.map((recipe) => ({ ...recipe }));
let nextId = Math.max(...recipes.map((recipe) => recipe.id)) + 1;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function wholeItemCost(ingredients: Array<{ price: number }>): number {
  return Math.round(ingredients.reduce((total, item) => total + (Number(item.price) || 0), 0) * 100) / 100;
}

function withDerivedCosts(recipe: Recipe): Recipe {
  const cost = wholeItemCost(recipe.ingredients);
  return {
    ...recipe,
    wholeItemCost: cost,
    mealPrice: Math.round((cost / Math.max(1, recipe.servings)) * 100) / 100,
  };
}

function listRecipes(search: URLSearchParams): Recipe[] {
  const term = search.get('search')?.trim().toLowerCase();
  const category = search.get('category');
  const dietary = search.get('dietary');
  const maxCalories = search.get('maxCalories');

  return recipes.filter((recipe) => {
    if (category && recipe.category !== category) return false;
    if (dietary && !recipe.dietary.includes(dietary)) return false;
    if (maxCalories && recipe.calories > Number(maxCalories)) return false;
    if (term) {
      const haystack = [
        recipe.title,
        recipe.description,
        recipe.category,
        ...recipe.ingredients.map((ingredient) => ingredient.name),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });
}

function summary() {
  const counts = new Map<string, number>();
  for (const recipe of recipes) {
    counts.set(recipe.category, (counts.get(recipe.category) ?? 0) + 1);
  }
  const popular = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const totalIngredients = recipes.reduce((total, recipe) => total + recipe.ingredients.length, 0);
  return {
    totalRecipes: recipes.length,
    totalCategories: counts.size,
    totalIngredients,
    averageCalories: recipes.length
      ? Math.round(recipes.reduce((total, recipe) => total + recipe.calories, 0) / recipes.length)
      : 0,
    popularCategory: popular?.[0] ?? '',
  };
}

function fromInput(input: RecipeInput, id: number): Recipe {
  return withDerivedCosts({
    ...input,
    id,
    ingredients: input.ingredients.map((ingredient) => ({
      ...ingredient,
      price: Number(ingredient.price) || 0,
      shoppingUrl:
        ingredient.shoppingUrl?.trim() ||
        `https://www.walmart.com/search?q=${encodeURIComponent(ingredient.name)}`,
    })),
    mealPrice: 0,
    wholeItemCost: 0,
    createdAt: new Date().toISOString(),
  });
}

async function handle(url: URL, method: string, body: string | null): Promise<Response | null> {
  const path = url.pathname.replace(/\/+$/, '');

  if (path === '/api/healthz') return json({ status: 'ok' });
  if (path === '/api/recipes/summary') return json(summary());

  if (path === '/api/recipes') {
    if (method === 'GET') return json(listRecipes(url.searchParams));
    if (method === 'POST') {
      const created = fromInput(JSON.parse(body ?? '{}') as RecipeInput, nextId++);
      recipes = [created, ...recipes];
      return json(created, 201);
    }
  }

  const detail = /^\/api\/recipes\/(\d+)$/.exec(path);
  if (detail) {
    const id = Number(detail[1]);
    const index = recipes.findIndex((recipe) => recipe.id === id);
    if (index === -1) {
      return json({ title: 'Not found', detail: 'That recipe is not in the demo data.' }, 404);
    }
    if (method === 'GET') return json(recipes[index]);
    if (method === 'PATCH' || method === 'PUT') {
      const patch = JSON.parse(body ?? '{}') as Partial<Recipe>;
      const updated = withDerivedCosts({ ...recipes[index], ...patch });
      recipes = recipes.map((recipe, position) => (position === index ? updated : recipe));
      return json(updated);
    }
    if (method === 'DELETE') {
      recipes = recipes.filter((recipe) => recipe.id !== id);
      return new Response(null, { status: 204 });
    }
  }

  if (path.startsWith('/api/recipes/from-video')) {
    return json(
      {
        title: 'Not available in the demo',
        detail:
          'Video import needs the API server, private file storage, and ffmpeg. Run the full app to use it.',
      },
      501,
    );
  }

  return null;
}

/** Patches `window.fetch` so API calls resolve against the bundled data. */
export function installDemoApi(): void {
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : null;
    const rawUrl = request ? request.url : String(input);
    const url = new URL(rawUrl, window.location.origin);

    if (url.origin !== window.location.origin || !url.pathname.includes('/api/')) {
      return original(input as RequestInfo, init);
    }

    const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
    let body: string | null = null;
    if (typeof init?.body === 'string') body = init.body;
    else if (request && method !== 'GET' && method !== 'HEAD') body = await request.clone().text();

    const response = await handle(url, method, body);
    return response ?? original(input as RequestInfo, init);
  };
}
