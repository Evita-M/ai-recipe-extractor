import { Recipe } from '../types/recipe';

export function normalizeRecipe(input: Partial<Recipe>): Recipe {
  return {
    title: input.title ?? '',
    ingredients: input.ingredients ?? [],
    instructions: input.instructions ?? [],
    servings: input.servings ?? null,
    prepTime: input.prepTime ?? null,
    cookingTime: input.cookingTime ?? null,
    totalTime: input.totalTime ?? null,
    difficulty: input.difficulty ?? null,
    type: input.type ?? null,
    description: input.description ?? null,
    translatedHeadings: input.translatedHeadings ?? null,
  };
}
