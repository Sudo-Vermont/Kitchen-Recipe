import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export type RecipeIngredient = {
  name: string;
  quantity: string;
  aisle: string;
  shoppingUrl: string;
  price: number;
};

export const recipesTable = pgTable("recipes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  dietary: jsonb("dietary").$type<string[]>().notNull(),
  prepMinutes: integer("prep_minutes").notNull(),
  cookMinutes: integer("cook_minutes").notNull(),
  servings: integer("servings").notNull(),
  calories: integer("calories").notNull(),
  protein: integer("protein").notNull(),
  carbs: integer("carbs").notNull(),
  fat: integer("fat").notNull(),
  ingredients: jsonb("ingredients").$type<RecipeIngredient[]>().notNull(),
  instructions: jsonb("instructions").$type<string[]>().notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecipeSchema = createInsertSchema(recipesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipesTable.$inferSelect;