import type { Recipe, Machine, MiningDrill, Resource } from '../data/schema.js';

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
  /** Items produced by mining/pumping (tracked in raw resources summary). */
  minedResources: Set<string>;
}

export function buildRecipeGraph(
  recipes: Recipe[],
  machines: Machine[],
  miners?: MiningDrill[],
  resources?: Resource[],
): RecipeGraph {
  const combinedRecipes = [...recipes];
  const combinedMachines = [...machines];
  const minedResources = new Set<string>();

  if (miners && resources) {
    // Convert miners → Machine objects
    for (const miner of miners) {
      // Offshore pumps get crafting_speed=1; rate is encoded in the water recipe
      const craftingSpeed = miner.type === 'offshore-pump' ? 1 : miner.mining_speed;
      const machine: Machine = {
        name: miner.name,
        type: miner.type,
        crafting_speed: craftingSpeed,
        crafting_categories: miner.resource_categories,
        energy_usage: miner.energy_usage,
        module_slots: miner.module_slots,
        energy_type: miner.energy_type,
      };
      if (miner.fuel_categories) machine.fuel_categories = miner.fuel_categories;
      combinedMachines.push(machine);
    }

    // Convert resources → synthetic Recipe objects
    for (const resource of resources) {
      const ingredients: Recipe['ingredients'] = [];
      if (resource.required_fluid) {
        ingredients.push({
          type: 'fluid',
          name: resource.required_fluid.name,
          amount: resource.required_fluid.amount,
        });
      }

      combinedRecipes.push({
        name: `${resource.name}-mining`,
        category: resource.category,
        energy_required: resource.mining_time,
        ingredients,
        results: resource.results,
      });

      for (const result of resource.results) {
        minedResources.add(result.name);
      }
    }

    // Add synthetic water recipe if an offshore pump exists
    const offshorePump = miners.find(m => m.type === 'offshore-pump');
    if (offshorePump) {
      // pumping_speed is in fluid/tick; × 60 ticks/s = fluid/s
      const waterPerSecond = offshorePump.mining_speed * 60;
      combinedRecipes.push({
        name: 'water-pumping',
        category: 'water-pumping',
        energy_required: 1,
        ingredients: [],
        results: [{ type: 'fluid', name: 'water', amount: waterPerSecond }],
      });
      minedResources.add('water');
    }
  }

  const itemToRecipe = new Map<string, Recipe>();
  const categoryToMachines = new Map<string, Machine[]>();

  // Build item -> recipe map
  for (const recipe of combinedRecipes) {
    for (const result of recipe.results) {
      // Don't override: first recipe wins (some items have multiple recipes)
      if (!itemToRecipe.has(result.name)) {
        itemToRecipe.set(result.name, recipe);
      }
    }
  }

  // Build category -> machines map, sorted by crafting_speed (ascending)
  for (const machine of combinedMachines) {
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
    allRecipes: combinedRecipes,
    allProducts,
    minedResources,
  };
}
