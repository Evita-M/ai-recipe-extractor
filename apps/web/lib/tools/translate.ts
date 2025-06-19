import { z } from 'zod';
import { tool } from '@openai/agents';
import OpenAI from 'openai';
import { recipeSchema, type Recipe } from '../types/recipe';
import { supportedLanguages } from '../types/language';

const openai = new OpenAI();

async function translateText(
  text: string | null,
  targetLanguage: string
): Promise<string> {
  if (!text) return '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following text to ${targetLanguage}. Preserve any cooking terminology and measurements in their proper form. Only respond with the translation, no explanations.`,
      },
      {
        role: 'user',
        content: text,
      },
    ],
    temperature: 0.3,
  });

  const translation = response.choices[0]?.message?.content;
  if (!translation) {
    throw new Error('Translation failed: No response content');
  }

  return translation;
}

async function translateArray(
  items: string[],
  targetLanguage: string
): Promise<string[]> {
  return Promise.all(items.map((item) => translateText(item, targetLanguage)));
}

export const translateRecipeTool = tool({
  name: 'translate_recipe',
  description:
    'Translates a recipe from one language to the target language while preserving the recipe structure and cooking terminology. Returns a complete recipe object with translated text fields and preserved non-text fields.',
  parameters: z.object({
    recipe: recipeSchema.describe('The complete recipe object to translate'),
    targetLanguage: supportedLanguages.describe('The target language code'),
  }),
  execute: async ({
    recipe,
    targetLanguage,
  }: {
    recipe: Recipe;
    targetLanguage: string;
  }) => {
    console.log(`Translating recipe "${recipe.title}" to ${targetLanguage}`);

    try {
      // Translate all text fields including section headings
      const [
        translatedTitle,
        translatedDescription,
        translatedIngredients,
        translatedInstructions,
        translatedIngredientsHeading,
        translatedInstructionsHeading,
      ] = await Promise.all([
        translateText(recipe.title, targetLanguage),
        translateText(recipe.description, targetLanguage),
        translateArray(recipe.ingredients, targetLanguage),
        translateArray(recipe.instructions, targetLanguage),
        translateText('Ingredients', targetLanguage),
        translateText('Instructions', targetLanguage),
      ]);

      const translatedRecipe: Recipe = {
        // Translated text fields
        title: translatedTitle,
        description: translatedDescription,
        ingredients: translatedIngredients,
        instructions: translatedInstructions,
        // Add translated headings to the title to pass them through
        translatedHeadings: {
          ingredients: translatedIngredientsHeading,
          instructions: translatedInstructionsHeading,
        },

        // Preserve non-translatable fields
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookingTime: recipe.cookingTime,
        totalTime: recipe.totalTime,
        difficulty: recipe.difficulty,
        type: recipe.type,
      };

      // Validate the translated recipe against the schema
      return recipeSchema.parse(translatedRecipe);
    } catch (error) {
      console.error('Error translating recipe:', error);
      throw new Error(
        `Failed to translate recipe: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
