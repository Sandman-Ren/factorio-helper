import { useMemo } from 'react';
import type { Technology, Recipe } from '../../data/schema.js';
import technologiesData from '../../data/generated/technologies.json';
import recipesData from '../../data/generated/recipes.json';

export function useRecipeTechMaps() {
  const technologies = technologiesData as Technology[];
  const recipes = recipesData as Recipe[];

  return useMemo(() => {
    const recipesByName = new Map(recipes.map(r => [r.name, r]));
    const recipeToTech = new Map<string, Technology>();
    const itemToTech = new Map<string, Technology>();

    for (const tech of technologies) {
      for (const effect of tech.effects) {
        if (effect.type !== 'unlock-recipe' || !effect.recipe) continue;

        // First tech wins for duplicates
        if (!recipeToTech.has(effect.recipe)) {
          recipeToTech.set(effect.recipe, tech);
        }

        const recipe = recipesByName.get(effect.recipe);
        if (!recipe) continue;

        for (const result of recipe.results) {
          if (!itemToTech.has(result.name)) {
            itemToTech.set(result.name, tech);
          }
        }
      }
    }

    return { recipeToTech, itemToTech };
  }, [technologies, recipes]);
}
