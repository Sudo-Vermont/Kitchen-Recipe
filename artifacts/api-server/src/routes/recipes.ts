import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ilike, lte, or, sql } from "drizzle-orm";
import {
  CreateRecipeBody,
  CreateRecipeResponse,
  DeleteRecipeParams,
  GetRecipeParams,
  GetRecipeResponse,
  GetRecipeSummaryResponse,
  ListRecipesQueryParams,
  ListRecipesResponse,
  UpdateRecipeBody,
  UpdateRecipeParams,
  UpdateRecipeResponse,
} from "@workspace/api-zod";
import { db, recipesTable } from "@workspace/db";

const router: IRouter = Router();

function normalizeIngredients(
  ingredients: Array<{
    name: string;
    quantity: string;
    aisle: string;
    shoppingUrl: string;
    price: number;
  }>,
) {
  return ingredients.map((ingredient) => ({
    ...ingredient,
    shoppingUrl:
      ingredient.shoppingUrl.trim() ||
      `https://www.walmart.com/search?q=${encodeURIComponent(ingredient.name)}`,
  }));
}

function calculateWholeItemCost(
  ingredients: Array<{ price: number }>,
): number {
  return Math.round(
    ingredients.reduce((total, ingredient) => total + ingredient.price, 0) * 100,
  ) / 100;
}

function toRecipeResponse(recipe: typeof recipesTable.$inferSelect) {
  const wholeItemCost = calculateWholeItemCost(recipe.ingredients);
  return {
    ...recipe,
    mealPrice:
      Math.round((wholeItemCost / Math.max(1, recipe.servings)) * 100) / 100,
    wholeItemCost,
  };
}

router.get("/recipes", async (req, res): Promise<void> => {
  const parsedQuery = ListRecipesQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const { search, category, dietary, maxCalories } = parsedQuery.data;
  const filters = [];
  if (search) {
    const searchPattern = `%${search}%`;
    filters.push(
      or(
        ilike(recipesTable.title, searchPattern),
        ilike(recipesTable.description, searchPattern),
        sql`${recipesTable.ingredients}::text ILIKE ${searchPattern}`,
      ),
    );
  }
  if (category && category !== "All") {
    filters.push(eq(recipesTable.category, category));
  }
  if (maxCalories !== undefined) {
    filters.push(lte(recipesTable.calories, maxCalories));
  }

  const recipes = await db
    .select()
    .from(recipesTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(recipesTable.createdAt), asc(recipesTable.title));

  const dietaryFiltered = dietary
    ? recipes.filter((recipe) => recipe.dietary.includes(dietary))
    : recipes;

  res.json(ListRecipesResponse.parse(dietaryFiltered.map(toRecipeResponse)));
});

router.post("/recipes", async (req, res): Promise<void> => {
  const parsedBody = CreateRecipeBody.safeParse(req.body);
  if (!parsedBody.success) {
    req.log.warn({ errors: parsedBody.error.message }, "Invalid recipe body");
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const [recipe] = await db
    .insert(recipesTable)
    .values({
      ...parsedBody.data,
      ingredients: normalizeIngredients(parsedBody.data.ingredients),
    })
    .returning();

  res.status(201).json(CreateRecipeResponse.parse(toRecipeResponse(recipe)));
});

router.get("/recipes/summary", async (_req, res): Promise<void> => {
  const recipes = await db.select().from(recipesTable);
  const categories = new Set(recipes.map((recipe) => recipe.category));
  const categoryCounts = recipes.reduce<Record<string, number>>((counts, recipe) => {
    counts[recipe.category] = (counts[recipe.category] ?? 0) + 1;
    return counts;
  }, {});
  const popularCategory =
    Object.entries(categoryCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0] ??
    "Explore";
  const totalIngredients = recipes.reduce(
    (total, recipe) => total + recipe.ingredients.length,
    0,
  );
  const averageCalories = recipes.length
    ? Math.round(recipes.reduce((total, recipe) => total + recipe.calories, 0) / recipes.length)
    : 0;

  res.json(
    GetRecipeSummaryResponse.parse({
      totalRecipes: recipes.length,
      totalCategories: categories.size,
      averageCalories,
      popularCategory,
      totalIngredients,
    }),
  );
});

router.get("/recipes/:id", async (req, res): Promise<void> => {
  const parsedParams = GetRecipeParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const [recipe] = await db
    .select()
    .from(recipesTable)
    .where(eq(recipesTable.id, parsedParams.data.id));

  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.json(GetRecipeResponse.parse(toRecipeResponse(recipe)));
});

router.patch("/recipes/:id", async (req, res): Promise<void> => {
  const parsedParams = UpdateRecipeParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }
  const parsedBody = UpdateRecipeBody.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const [recipe] = await db
    .update(recipesTable)
    .set({
      ...parsedBody.data,
      ...(parsedBody.data.ingredients
        ? { ingredients: normalizeIngredients(parsedBody.data.ingredients) }
        : {}),
    })
    .where(eq(recipesTable.id, parsedParams.data.id))
    .returning();

  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.json(UpdateRecipeResponse.parse(toRecipeResponse(recipe)));
});

router.delete("/recipes/:id", async (req, res): Promise<void> => {
  const parsedParams = DeleteRecipeParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const [recipe] = await db
    .delete(recipesTable)
    .where(eq(recipesTable.id, parsedParams.data.id))
    .returning({ id: recipesTable.id });

  if (!recipe) {
    res.status(404).json({ error: "Recipe not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;