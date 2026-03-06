import { useMemo } from 'react';
import type { Technology, Recipe, Resource, Machine } from '../../data/schema.js';
import technologiesData from '../../data/generated/technologies.json';
import recipesData from '../../data/generated/recipes.json';
import resourcesData from '../../data/generated/resources.json';
import machinesData from '../../data/generated/machines.json';
import minersData from '../../data/generated/miners.json';

export interface ProducedByEntry {
  recipe: Recipe;
  machines: Machine[];
}

export interface ItemLookupMaps {
  /** Item → all recipes that produce it (including synthetic mining recipes). */
  itemToProducingRecipes: Map<string, ProducedByEntry[]>;
  /** Item → all recipes that consume it as an ingredient. */
  itemToConsumingRecipes: Map<string, Recipe[]>;
  /** Recipe name → all technologies that unlock it. */
  recipeToTechs: Map<string, Technology[]>;
  /** All item/fluid names that appear in any recipe (as product or ingredient). */
  allLookupItems: string[];
}

export function useItemLookupMaps(): ItemLookupMaps {
  const technologies = technologiesData as Technology[];
  const recipes = recipesData as Recipe[];
  const resources = resourcesData as Resource[];
  const machines = machinesData as Machine[];
  const miners = minersData as { name: string; type: string; mining_speed: number; resource_categories: string[]; energy_usage: string; module_slots: number; energy_type: 'electric' | 'burner' | 'void'; fuel_categories?: string[] }[];

  return useMemo(() => {
    // Build category → machines map (same logic as recipe-graph)
    const categoryToMachines = new Map<string, Machine[]>();

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

    // Add miners as machines for resource categories
    for (const miner of miners) {
      const machine: Machine = {
        name: miner.name,
        type: miner.type,
        crafting_speed: miner.type === 'offshore-pump' ? 1 : miner.mining_speed,
        crafting_categories: miner.resource_categories,
        energy_usage: miner.energy_usage,
        module_slots: miner.module_slots,
        energy_type: miner.energy_type,
      };
      if (miner.fuel_categories) machine.fuel_categories = miner.fuel_categories;
      for (const category of miner.resource_categories) {
        let list = categoryToMachines.get(category);
        if (!list) {
          list = [];
          categoryToMachines.set(category, list);
        }
        list.push(machine);
      }
    }

    // Add synthetic water-pumping category
    const offshorePump = miners.find(m => m.type === 'offshore-pump');
    if (offshorePump) {
      categoryToMachines.set('water-pumping', [{
        name: offshorePump.name,
        type: offshorePump.type,
        crafting_speed: 1,
        crafting_categories: ['water-pumping'],
        energy_usage: offshorePump.energy_usage,
        module_slots: offshorePump.module_slots,
        energy_type: offshorePump.energy_type,
      }]);
    }

    // Build combined recipes (include synthetic mining/pumping recipes)
    const allRecipes = [...recipes];

    for (const resource of resources) {
      const ingredients: Recipe['ingredients'] = [];
      if (resource.required_fluid) {
        ingredients.push({
          type: 'fluid',
          name: resource.required_fluid.name,
          amount: resource.required_fluid.amount,
        });
      }
      allRecipes.push({
        name: `${resource.name}-mining`,
        category: resource.category,
        energy_required: resource.mining_time,
        ingredients,
        results: resource.results,
      });
    }

    if (offshorePump) {
      const waterPerSecond = offshorePump.mining_speed * 60;
      allRecipes.push({
        name: 'water-pumping',
        category: 'water-pumping',
        energy_required: 1,
        ingredients: [],
        results: [{ type: 'fluid', name: 'water', amount: waterPerSecond }],
      });
    }

    // Build inverted indexes
    const itemToProducingRecipes = new Map<string, ProducedByEntry[]>();
    const itemToConsumingRecipes = new Map<string, Recipe[]>();

    for (const recipe of allRecipes) {
      const entry: ProducedByEntry = {
        recipe,
        machines: categoryToMachines.get(recipe.category) ?? [],
      };

      for (const result of recipe.results) {
        let list = itemToProducingRecipes.get(result.name);
        if (!list) {
          list = [];
          itemToProducingRecipes.set(result.name, list);
        }
        list.push(entry);
      }

      for (const ingredient of recipe.ingredients) {
        let list = itemToConsumingRecipes.get(ingredient.name);
        if (!list) {
          list = [];
          itemToConsumingRecipes.set(ingredient.name, list);
        }
        list.push(recipe);
      }
    }

    // Build recipe → technologies map (all techs, not just first)
    const recipeToTechs = new Map<string, Technology[]>();
    for (const tech of technologies) {
      for (const effect of tech.effects) {
        if (effect.type !== 'unlock-recipe' || !effect.recipe) continue;
        let list = recipeToTechs.get(effect.recipe);
        if (!list) {
          list = [];
          recipeToTechs.set(effect.recipe, list);
        }
        list.push(tech);
      }
    }

    // Collect all unique items that appear in any recipe
    const itemSet = new Set<string>();
    for (const recipe of allRecipes) {
      for (const r of recipe.results) itemSet.add(r.name);
      for (const i of recipe.ingredients) itemSet.add(i.name);
    }
    const allLookupItems = [...itemSet].sort();

    return { itemToProducingRecipes, itemToConsumingRecipes, recipeToTechs, allLookupItems };
  }, [technologies, recipes, resources, machines, miners]);
}
