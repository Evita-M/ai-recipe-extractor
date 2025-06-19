import { z } from 'zod';

const recipeTypeSchema = z.enum([
  'Dessert',
  'Pastry',
  'Appetizer',
  'Sauce',
  'Drink',
  'Snacks',
  'Dinner',
  'Lunch',
  'Breakfast',
  'Soup',
  'Varied',
]);

const difficultySchema = z.enum([
  'Very Easy',
  'Easy',
  'Medium',
  'Hard',
  'Very Hard',
]);

export const recipeSchema = z.object({
  title: z.string().describe('The recipe title'),
  ingredients: z
    .array(z.string())
    .describe('The list of ingredients with quantities'),
  instructions: z
    .array(z.string())
    .describe('The step-by-step cooking instructions'),
  servings: z
    .number()
    .nullable()
    .describe('The number of servings or portion size'),
  prepTime: z.string().nullable().describe('The preparation time'),
  cookingTime: z.string().nullable().describe('The cooking time'),
  totalTime: z.string().nullable().describe('The total time required'),
  difficulty: difficultySchema.nullable().describe('The difficulty level'),
  type: recipeTypeSchema.nullable().describe('The category of the recipe'),
  description: z
    .string()
    .nullable()
    .describe('The recipe description or summary'),
  translatedHeadings: z
    .object({
      ingredients: z.string(),
      instructions: z.string(),
    })
    .nullish()
    .describe('The translated headings for the recipe'),
});

export type Recipe = z.infer<typeof recipeSchema>;
