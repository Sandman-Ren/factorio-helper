import type { RecipeGraph } from './recipe-graph.js';
import { RAW_RESOURCES } from './recipe-graph.js';
import type { ProductionNode, ProductionPlan } from './types.js';

/**
 * Recursively solve the production chain for a target item at a desired rate.
 *
 * @param graph - The recipe/machine dependency graph
 * @param targetItem - The item or fluid to produce
 * @param desiredRatePerSecond - How many per second to produce
 * @returns A production plan with the full tree, aggregated machines, and raw resources
 */
export function solve(
  graph: RecipeGraph,
  targetItem: string,
  desiredRatePerSecond: number,
): ProductionPlan {
  const totalMachines: Record<string, number> = {};
  const rawResources: Record<string, number> = {};

  const root = solveNode(graph, targetItem, desiredRatePerSecond, totalMachines, rawResources, new Set());

  return { root, totalMachines, rawResources };
}

function solveNode(
  graph: RecipeGraph,
  itemName: string,
  ratePerSecond: number,
  totalMachines: Record<string, number>,
  rawResources: Record<string, number>,
  visited: Set<string>,
): ProductionNode {
  // Determine item type by checking if it's a fluid recipe result
  const recipe = graph.itemToRecipe.get(itemName);
  const itemType = recipe?.results.find(r => r.name === itemName)?.type ?? 'item';

  // Base case: raw resource
  if (RAW_RESOURCES.has(itemName) || !recipe) {
    rawResources[itemName] = (rawResources[itemName] ?? 0) + ratePerSecond;
    return {
      item: itemName,
      itemType: itemType as 'item' | 'fluid',
      recipe: null,
      machine: null,
      ratePerSecond,
      machinesNeeded: 0,
      children: [],
    };
  }

  // Cycle detection
  if (visited.has(itemName)) {
    rawResources[itemName] = (rawResources[itemName] ?? 0) + ratePerSecond;
    return {
      item: itemName,
      itemType: itemType as 'item' | 'fluid',
      recipe: null,
      machine: null,
      ratePerSecond,
      machinesNeeded: 0,
      children: [],
    };
  }

  visited = new Set(visited);
  visited.add(itemName);

  // Find the machine for this recipe
  const machine = graph.defaultMachine(recipe.category) ?? null;
  const craftingSpeed = machine?.crafting_speed ?? 1;

  // How many items does one craft produce?
  const resultEntry = recipe.results.find(r => r.name === itemName);
  const resultAmount = resultEntry?.amount ?? 1;

  // Crafts per second needed
  const craftsPerSecond = ratePerSecond / resultAmount;

  // Time per craft in this machine
  const timePerCraft = recipe.energy_required / craftingSpeed;

  // Machines needed (each machine does 1/timePerCraft crafts per second)
  const machinesNeeded = craftsPerSecond * timePerCraft;

  if (machine) {
    totalMachines[machine.name] = (totalMachines[machine.name] ?? 0) + machinesNeeded;
  }

  // Recurse into ingredients
  const children: ProductionNode[] = [];
  for (const ingredient of recipe.ingredients) {
    const ingredientRate = craftsPerSecond * ingredient.amount;
    const child = solveNode(graph, ingredient.name, ingredientRate, totalMachines, rawResources, visited);
    children.push(child);
  }

  return {
    item: itemName,
    itemType: itemType as 'item' | 'fluid',
    recipe,
    machine,
    ratePerSecond,
    machinesNeeded,
    children,
  };
}
