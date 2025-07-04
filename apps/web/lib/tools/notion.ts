import { tool } from '@openai/agents';
import { BlockObjectRequest, Client } from '@notionhq/client';
import { z } from 'zod';
import { recipeSchema, type Recipe } from '../types/recipe';
import { normalizeRecipe } from '../utils/normalize-recipe';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const databaseId = process.env.NOTION_DATABASE_ID;

function createRichText(content: string) {
  return [{ text: { content } }];
}

function createIngredientBlocks(ingredients: string[]): BlockObjectRequest[] {
  return ingredients.map((ingredient) => ({
    object: 'block',
    type: 'to_do',
    to_do: {
      rich_text: createRichText(`${ingredient}`),
      checked: false,
    },
  }));
}

function createInstructionBlocks(instructions: string[]): BlockObjectRequest[] {
  return instructions.map((instruction) => ({
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: createRichText(`${instruction}`),
    },
  }));
}

function createRecipeBlocks(recipe: Recipe): BlockObjectRequest[] {
  const blocks: BlockObjectRequest[] = [];

  if (recipe.description) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: createRichText(recipe.description),
      },
    });
  }

  if (recipe.ingredients.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: createRichText(
          recipe.translatedHeadings?.ingredients ?? '🥘 Ingredients'
        ),
      },
    });
    blocks.push(...createIngredientBlocks(recipe.ingredients));
  }

  if (recipe.instructions.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: createRichText(
          recipe.translatedHeadings?.instructions ?? '👩‍🍳 Instructions'
        ),
      },
    });
    blocks.push(...createInstructionBlocks(recipe.instructions));
  }

  return blocks;
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export const createNotionDatabaseItemTool = tool({
  name: 'publish_recipe_to_notion',
  description:
    'Creates a new database item in a Notion database with both original and translated recipe versions if available.',
  strict: true,
  parameters: z.object({
    recipeData: z
      .string()
      .describe('JSON string containing the original recipe data'),
    translatedRecipeData: z
      .string()
      .nullish()
      .describe('Optional JSON string containing the translated recipe data'),
    sourceUrl: z.string().describe('Original recipe URL'),
    targetLanguage: z
      .string()
      .nullish()
      .describe('The language code of the translation if provided'),
  }),
  execute: async ({
    recipeData,
    translatedRecipeData,
    sourceUrl,
    targetLanguage,
  }: {
    recipeData: string;
    translatedRecipeData?: string | null;
    sourceUrl: string;
    targetLanguage?: string | null;
  }) => {
    try {
      console.log(
        `Creating database item for recipe in database: ${databaseId}`
      );

      let recipe: Recipe;
      let translatedRecipe: Recipe | undefined;

      try {
        recipe = recipeSchema.parse(normalizeRecipe(JSON.parse(recipeData)));
        if (translatedRecipeData && translatedRecipeData !== null) {
          translatedRecipe = recipeSchema.parse(
            normalizeRecipe(JSON.parse(translatedRecipeData))
          );
        }
      } catch (error) {
        throw new Error(
          `Invalid recipe data format: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      if (!databaseId) {
        throw new Error(
          'NOTION_DATABASE_ID is not set in the environment variables'
        );
      }

      const page = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          'Cover Image': {
            files: [
              {
                name: 'cover-image',
                type: 'external',
                external: {
                  url: 'https://cdn.pixabay.com/photo/2021/01/01/21/56/cooking-5880136_1280.jpg',
                },
              },
            ],
          },
          Name: {
            title: createRichText(recipe.title),
          },
          Type: {
            select: {
              name: recipe.type ? capitalize(recipe.type) : 'Varied',
            },
          },
          Difficulty: {
            select: {
              name: recipe.difficulty ? capitalize(recipe.difficulty) : 'Easy',
            },
          },
          ...(recipe.prepTime && {
            'Prep Time': { rich_text: createRichText(recipe.prepTime) },
          }),
          ...(recipe.cookingTime && {
            'Cooking Time': {
              rich_text: createRichText(recipe.cookingTime),
            },
          }),
          ...(recipe.totalTime && {
            'Total Time': { rich_text: createRichText(recipe.totalTime) },
          }),
          ...(recipe.servings && {
            Servings: { number: Number(recipe.servings) },
          }),
          Link: { rich_text: createRichText(sourceUrl) },
          ...(targetLanguage && {
            Translation: {
              rich_text: createRichText(
                translatedRecipeData
                  ? `Includes ${targetLanguage.toUpperCase()} translation`
                  : 'No translation available'
              ),
            },
          }),
        },
        cover: {
          type: 'external',
          external: {
            url: 'https://www.notion.so/images/page-cover/gradients_4.png',
          },
        },
        icon: {
          type: 'emoji',
          emoji: '👩🏼‍🍳',
        },
      });

      const blocks: BlockObjectRequest[] = [];

      blocks.push(...createRecipeBlocks(recipe));

      // Recipe translation if available
      if (translatedRecipe && targetLanguage) {
        blocks.push({
          object: 'block',
          type: 'divider',
          divider: {},
        });

        blocks.push({
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: createRichText(`${targetLanguage.toUpperCase()}`),
          },
        });
        blocks.push(...createRecipeBlocks(translatedRecipe));
      }

      await notion.blocks.children.append({
        block_id: page.id,
        children: blocks,
      });

      return {
        success: true,
        pageId: page.id,
        url: `https://notion.so/${page.id.replace(/-/g, '')}`,
      };
    } catch (error) {
      console.error('Error creating Notion database item:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(
          `Notion API error: ${(error as { message?: string }).message || 'Unknown error'}`
        );
      }

      throw new Error(
        `Failed to create Notion database item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});
