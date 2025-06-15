import { tool } from '@openai/agents';
import {
  BlockObjectRequest,
  Client,
  NotionClientError,
} from '@notionhq/client';
import { z } from 'zod';
import { recipeSchema, type Recipe } from '../types/recipe';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const databaseId = process.env.NOTION_DATABASE_ID;

/**
 * Create rich text content for Notion
 */
function createRichText(content: string) {
  return [{ text: { content } }];
}

/**
 * Create formatted ingredient list as checkbox list
 */
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

/**
 * Create formatted instruction list as numbered list
 */
function createInstructionBlocks(instructions: string[]): BlockObjectRequest[] {
  return instructions.map((instruction) => ({
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: {
      rich_text: createRichText(`${instruction}`),
    },
  }));
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export const createNotionDatabaseItemTool = tool({
  name: 'notion_publisher',
  description:
    'Can be used to create a new database item in a Notion database.',
  parameters: z.object({
    recipeData: z
      .string()
      .describe('JSON string containing the parsed recipe data'),
    sourceUrl: z.string().describe('Original recipe URL'),
  }),
  execute: async ({
    recipeData,
    sourceUrl,
  }: {
    recipeData: string;
    sourceUrl: string;
  }) => {
    try {
      console.log(
        `Creating database item for recipe in database: ${databaseId}`
      );
      let recipe: Recipe;
      try {
        recipe = JSON.parse(recipeData);
        recipe = recipeSchema.parse(recipe);
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

      // Create a new database item (page) in the database
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
          ...(recipe.difficulty && {
            Difficulty: { select: { name: recipe.difficulty } },
          }),
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
          ...(recipe.servings &&
            !isNaN(Number(recipe.servings)) && {
              Servings: { number: Number(recipe.servings) },
            }),
        },
      });

      await notion.pages.update({
        page_id: page.id,
        icon: {
          type: 'emoji',
          emoji: '👩🏼‍🍳',
        },
        cover: {
          type: 'external',
          external: {
            url: 'https://www.notion.so/images/page-cover/gradients_4.png',
          },
        },
      });

      console.log(`Created database item with ID: ${page.id}`);

      const blocks: BlockObjectRequest[] = [];

      // Add recipe description
      if (recipe.description) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: createRichText(recipe.description),
          },
        });
      }

      // Add divider
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {},
      });

      // Add ingredients section
      if (recipe.ingredients.length > 0) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: createRichText('🥘 Ingredients'),
          },
        });
        blocks.push(...createIngredientBlocks(recipe.ingredients));
      }

      // Add instructions section
      if (recipe.instructions.length > 0) {
        blocks.push({
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: createRichText('👩‍🍳 Instructions'),
          },
        });
        blocks.push(...createInstructionBlocks(recipe.instructions));
      }

      // Add all blocks to the page in batches (max 100 blocks per request)
      const batchSize = 100;
      let totalBlocksAdded = 0;
      for (let i = 0; i < blocks.length; i += batchSize) {
        const batch = blocks.slice(i, i + batchSize);
        await notion.blocks.children.append({
          block_id: page.id,
          children: batch,
        });
        totalBlocksAdded += batch.length;
        console.log(
          `Added batch of ${batch.length} blocks (${totalBlocksAdded}/${blocks.length} total)`
        );
      }

      // Return only the essential page ID - no verbose description
      return page.id;
    } catch (error) {
      console.error('Error creating Notion database item:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        const notionError = error as NotionClientError;
        switch (notionError.code) {
          case 'object_not_found':
            throw new Error(
              `Notion database not found. Please check your database ID: ${databaseId}`
            );
          case 'unauthorized':
            throw new Error(
              'Unauthorized access to Notion. Please check your NOTION_TOKEN and database permissions.'
            );
          case 'validation_error':
            throw new Error(
              `Notion validation error: ${notionError.message || 'Invalid data format'}`
            );
          default:
            throw new Error(
              `Notion API error (${notionError.code}): ${notionError.message || 'Unknown error'}`
            );
        }
      }
      throw new Error(
        `Failed to create Notion database item: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});
