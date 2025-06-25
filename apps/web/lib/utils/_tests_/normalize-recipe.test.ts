import { describe, it, expect } from 'vitest';
import { normalizeRecipe } from '../normalize-recipe';
import { Recipe } from '../../types/recipe';

describe('normalizeRecipe', () => {
  it('returns the same object if all fields are present', () => {
    const input: Recipe = {
      title: 'Cake',
      ingredients: ['Flour', 'Sugar'],
      instructions: ['Mix', 'Bake'],
      servings: 4,
      prepTime: '10 min',
      cookingTime: '30 min',
      totalTime: '40 min',
      difficulty: 'Easy',
      type: 'Dessert',
      description: 'A delicious cake',
      translatedHeadings: { ingredients: 'Suroviny', instructions: 'Postup' },
    };
    expect(normalizeRecipe(input)).toEqual(input);
  });

  it('fills missing fields with defaults', () => {
    const input = {
      title: 'Soup',
      ingredients: ['Water'],
      instructions: ['Boil'],
    };
    expect(normalizeRecipe(input)).toEqual({
      title: 'Soup',
      ingredients: ['Water'],
      instructions: ['Boil'],
      servings: null,
      prepTime: null,
      cookingTime: null,
      totalTime: null,
      difficulty: null,
      type: null,
      description: null,
      translatedHeadings: null,
    });
  });

  it('handles completely empty input', () => {
    expect(normalizeRecipe({})).toEqual({
      title: '',
      ingredients: [],
      instructions: [],
      servings: null,
      prepTime: null,
      cookingTime: null,
      totalTime: null,
      difficulty: null,
      type: null,
      description: null,
      translatedHeadings: null,
    });
  });
});
