import type { Recipe, Machine } from '../data/schema.js';

/** Lookup maps for navigating the recipe/machine dependency graph. */
export interface RecipeGraph {
  /** Map from item/fluid name to the recipe that produces it. */
  itemToRecipe: Map<string, Recipe>;
  /** Map from recipe category to machines that can handle it. */
  categoryToMachines: Map<string, Machine[]>;
  /** Get the default (highest-tier) machine for a recipe category. */
  defaultMachine: (category: string) => Machine | undefined;
  /** All recipe names. */
  allRecipes: Recipe[];
  /** All producible item/fluid names. */
  allProducts: string[];
}

/** Resources that are mined/pumped, not crafted. */
export const RAW_RESOURCES = new Set([
  'iron-ore',
  'copper-ore',
  'coal',
  'stone',
  'wood',
  'crude-oil',
  'water',
  'uranium-ore',
]);

export function buildRecipeGraph(recipes: Recipe[], machines: Machine[]): RecipeGraph {
  const itemToRecipe = new Map<string, Recipe>();
  const categoryToMachines = new Map<string, Machine[]>();

  // Build item -> recipe map
  for (const recipe of recipes) {
    for (const result of recipe.results) {
      // Don't override: first recipe wins (some items have multiple recipes)
      if (!itemToRecipe.has(result.name)) {
        itemToRecipe.set(result.name, recipe);
      }
    }
  }

  // Build category -> machines map, sorted by crafting_speed (ascending)
  for (const machine of machines) {
    for (const category of machine.crafting_categories) {
      let list = categoryToMachines.get(category);
      if (!list) {
        list = [];
        categoryToMachines.set(category, list);
      }
      list.push(machine);
    }
  }

  // Sort each machine list by crafting_speed (highest last = best tier)
  for (const [, list] of categoryToMachines) {
    list.sort((a, b) => a.crafting_speed - b.crafting_speed);
  }

  const defaultMachine = (category: string): Machine | undefined => {
    const list = categoryToMachines.get(category);
    if (!list || list.length === 0) return undefined;
    return list[list.length - 1]; // highest crafting speed
  };

  const allProducts = [...itemToRecipe.keys()].sort();

  return {
    itemToRecipe,
    categoryToMachines,
    defaultMachine,
    allRecipes: recipes,
    allProducts,
  };
}
