import { Agent } from '@openai/agents';
import { createNotionDatabaseItemTool } from '../tools/notion';
import { translateRecipeTool } from '../tools/translate';
import { recipeSchema } from '../types/recipe';
import z from 'zod';

const extractStructuredOutputAgent = new Agent({
  name: 'extract_structured_output_agent',
  instructions: `
    You are a specialized agent tasked to extract structured output from a given text.
  `,
  outputType: recipeSchema,
  model: 'gpt-4o-mini',
  modelSettings: {
    temperature: 0.1,
    maxTokens: 2000,
  },
});

export const recipeAgent = new Agent({
  name: 'recipe_agent',
  outputType: z.object({
    success: z
      .boolean()
      .describe('Whether the recipe was successfully created'),
    message: z
      .string()
      .describe('A short message indicating the result of the operation')
      .max(100),
  }),
  instructions: `
    You are a specialized agent tasked to extract structured output from a given text into JSON schema and optionally translate it.
    After that, you will create a new item in a Notion database with the final recipe data that contain both the original and the translated recipe if available.

    Translation Rules:
    1. Skip translation if no target language is provided.
    2. Skip translation if the detected language matches the target language.
    3. Only translate if the target language differs from the detected language.

    IMPORTANT:
    - Do NOT skip steps.
    - Each step must use the output from the previous step.
    - Never translate back to the original language.
    - Only proceed to Notion after handling translation (if needed).
    - When skipping translation, pass the original recipe directly to Notion.
  `,
  tools: [
    extractStructuredOutputAgent.asTool({
      toolName: 'extract_structured_output',
    }),
    translateRecipeTool,
    createNotionDatabaseItemTool,
  ],
  model: 'gpt-4o-mini',
  modelSettings: {
    temperature: 0.1,
    maxTokens: 2000,
  },
});
