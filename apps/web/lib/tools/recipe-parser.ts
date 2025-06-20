import { z } from 'zod';
import { tool } from '@openai/agents';
import { recipeSchema, type Recipe } from '../types/recipe';

export const parseRecipeFromTextTool = tool({
  name: 'parse_recipe_from_text',
  description:
    'Parses a plain text recipe and converts it into a structured JSON object following the recipe schema. Extracts title, ingredients, instructions, timing, difficulty, and other recipe details. The AI should analyze the plainTextRecipe and provide the structured recipe data.',
  parameters: z.object({
    plainTextRecipe: z
      .string()
      .describe('The plain text recipe content to parse'),
    parsedRecipe: recipeSchema.describe(
      'The structured recipe data extracted from the plain text'
    ),
  }),
  execute: async ({
    plainTextRecipe,
    parsedRecipe,
  }: {
    plainTextRecipe: string;
    parsedRecipe: Recipe;
  }) => {
    try {
      console.log(
        `Processing text of length ${plainTextRecipe.length} characters`
      );
      console.log(`Parsed recipe: ${parsedRecipe.title}`);
      const validatedRecipe = recipeSchema.parse(parsedRecipe);

      return validatedRecipe;
    } catch (error) {
      throw new Error(
        `Failed to validate parsed recipe: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
