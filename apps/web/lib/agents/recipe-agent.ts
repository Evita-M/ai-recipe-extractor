import { Agent } from '@openai/agents';
import { extractTextFromUrlTool } from '../tools/crawl';
import { createNotionDatabaseItemTool } from '../tools/notion';
import { recipeSchema } from '../types/recipe';

const recipeExtractorAgent = new Agent({
  name: 'Recipe Extractor',
  instructions: `
    You are a specialized agent tasked to extract a recipe from the web.
    You are given a URL and you need to extract the recipe from the URL using your tools.`,
  tools: [extractTextFromUrlTool],
  outputType: recipeSchema,
  model: 'gpt-4o-mini',
  modelSettings: {
    temperature: 1,
    maxTokens: 2000,
  },
});

export const recipeAgent = new Agent({
  name: 'Recipe Agent',
  instructions: `
    You are a specialized agent tasked to get a recipe from the web and save it as a new item in a Notion database.
    You can use your tools to achieve this.
  `,
  tools: [recipeExtractorAgent.asTool({}), createNotionDatabaseItemTool],
  model: 'gpt-4o-mini',
});
