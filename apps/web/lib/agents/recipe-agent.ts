import { Agent } from '@openai/agents';
import { extractTextFromUrlTool } from '../tools/crawl';
import { createNotionDatabaseItemTool } from '../tools/notion';
import { parseRecipeFromTextTool } from '../tools/recipe-parser';
import { translateRecipeTool } from '../tools/translate';

export const recipeAgent = new Agent({
  name: 'Recipe Agent',
  instructions: `
    You are a specialized agent tasked to get a recipe from the web, validate its language, parse it into structured JSON, and optionally translate it. After that, you will create a new item in a Notion database with the final recipe data that contains both the original and the translated recipe if available.

    Translation Rules:
    1. Skip translation if no target language is provided
    2. Skip translation if the detected language matches the target language
    3. Only translate if the target language differs from the detected language

    IMPORTANT:
    - Do NOT skip steps
    - Each step must use the output from the previous step
    - Never translate back to the original language
    - Only proceed to Notion after handling translation (if needed)
    - When skipping translation, pass the original recipe directly to Notion
  `,
  tools: [
    extractTextFromUrlTool,
    parseRecipeFromTextTool,
    translateRecipeTool,
    createNotionDatabaseItemTool,
  ],
  model: 'gpt-4o-mini',
  modelSettings: {
    temperature: 0.1,
    maxTokens: 4000,
  },
});
