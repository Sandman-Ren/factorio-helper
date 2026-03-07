import type { RecipeGraph } from './recipe-graph.js';
import type { Fuel } from '../data/schema.js';
import type { ProductionNode, ProductionPlan, MachineOverrides, FuelOverrides } from './types.js';
import { parseEnergyKilo } from './energy.js';

/** Options for the solver beyond the basic graph/target/rate. */
export interface SolverOptions {
  fuelOverrides?: FuelOverrides;
  defaultFuel?: string;
  fuels?: Fuel[];
}

/**
 * Recursively solve the production chain for a target item at a desired rate.
 *
 * @param graph - The recipe/machine dependency graph
 * @param targetItem - The item or fluid to produce
 * @param desiredRatePerSecond - How many per second to produce
 * @returns A production plan with the full tree, aggregated machines, raw resources,
 *          total electric power draw, and fuel consumption by type
 */
export function solve(
  graph: RecipeGraph,
  targetItem: string,
  desiredRatePerSecond: number,
  machineOverrides?: MachineOverrides,
  categoryOverrides?: Record<string, string>,
  options?: SolverOptions,
): ProductionPlan {
  const totalMachines: Record<string, number> = {};
  const rawResources: Record<string, number> = {};
  let totalElectricPowerKW = 0;
  const totalFuel: Record<string, number> = {};

  const fuelMap = new Map<string, Fuel>();
  if (options?.fuels) {
    for (const f of options.fuels) fuelMap.set(f.name, f);
  }

  const root = solveNode(
    graph, targetItem, desiredRatePerSecond,
    totalMachines, rawResources, new Set(),
    machineOverrides, categoryOverrides, options, fuelMap,
    (kw) => { totalElectricPowerKW += kw; },
    (fuelName, rate) => { totalFuel[fuelName] = (totalFuel[fuelName] ?? 0) + rate; },
  );

  return { root, totalMachines, rawResources, totalElectricPowerKW, totalFuel };
}

function solveNode(
  graph: RecipeGraph,
  itemName: string,
  ratePerSecond: number,
  totalMachines: Record<string, number>,
  rawResources: Record<string, number>,
  visited: Set<string>,
  machineOverrides: MachineOverrides | undefined,
  categoryOverrides: Record<string, string> | undefined,
  options: SolverOptions | undefined,
  fuelMap: Map<string, Fuel>,
  addPower: (kw: number) => void,
  addFuel: (fuelName: string, rate: number) => void,
): ProductionNode {
  // Determine item type by checking if it's a fluid recipe result
  const recipe = graph.itemToRecipe.get(itemName);
  const itemType = recipe?.results.find(r => r.name === itemName)?.type ?? 'item';

  const emptyNode = (addToRaw: boolean): ProductionNode => {
    if (addToRaw) rawResources[itemName] = (rawResources[itemName] ?? 0) + ratePerSecond;
    return {
      item: itemName,
      itemType: itemType as 'item' | 'fluid',
      recipe: null,
      machine: null,
      ratePerSecond,
      machinesNeeded: 0,
      children: [],
      powerKW: 0,
      fuelPerSecond: 0,
      fuel: null,
    };
  };

  // Base case: no recipe (truly unproducible items like wood)
  if (!recipe) return emptyNode(true);

  // Cycle detection
  if (visited.has(itemName)) return emptyNode(true);

  // Track mined resources in the raw resources summary
  if (graph.minedResources.has(itemName)) {
    rawResources[itemName] = (rawResources[itemName] ?? 0) + ratePerSecond;
  }

  visited = new Set(visited);
  visited.add(itemName);

  // Find the machine for this recipe (check per-item override first)
  const overrideName = machineOverrides?.[itemName] ?? categoryOverrides?.[recipe.category];
  const machine = (
    overrideName
      ? graph.categoryToMachines.get(recipe.category)?.find(m => m.name === overrideName)
      : undefined
  ) ?? graph.defaultMachine(recipe.category) ?? null;
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

  // Compute power / fuel consumption
  let powerKW = 0;
  let fuelPerSecond = 0;
  let fuel: string | null = null;

  if (machine) {
    const energyKW = parseEnergyKilo(machine.energy_usage);

    if (machine.energy_type === 'electric') {
      powerKW = machinesNeeded * energyKW;
      addPower(powerKW);
    } else if (machine.energy_type === 'burner') {
      // Determine fuel for this machine
      const fuelName = options?.fuelOverrides?.[itemName] || options?.defaultFuel || 'coal';
      const fuelData = fuelMap.get(fuelName);
      if (!fuelData) {
        console.warn(`[solver] Unknown fuel "${fuelName}" for burner machine "${machine.name}" (item: ${itemName})`);
      }
      const compatible = !fuelData || !machine.fuel_categories
        || machine.fuel_categories.includes(fuelData.fuel_category);
      if (!compatible) {
        console.warn(`[solver] Fuel "${fuelName}" (category: ${fuelData!.fuel_category}) incompatible with machine "${machine.name}" (accepts: ${machine.fuel_categories!.join(', ')})`);
      }
      if (fuelData && compatible && fuelData.fuel_value_kj > 0) {
        fuelPerSecond = machinesNeeded * energyKW / fuelData.fuel_value_kj;
        fuel = fuelName;
        addFuel(fuelName, fuelPerSecond);
      }
    }
    // energy_type === 'void' → no power, no fuel (offshore pump)
  }

  // Recurse into ingredients
  const children: ProductionNode[] = [];
  for (const ingredient of recipe.ingredients) {
    const ingredientRate = craftsPerSecond * ingredient.amount;
    const child = solveNode(
      graph, ingredient.name, ingredientRate,
      totalMachines, rawResources, visited,
      machineOverrides, categoryOverrides, options, fuelMap, addPower, addFuel,
    );
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
    powerKW,
    fuelPerSecond,
    fuel,
  };
}

/** Collect all non-zero machinesNeeded values from a production tree. */
function collectMachinesNeeded(node: ProductionNode): number[] {
  const values: number[] = [];
  if (node.machinesNeeded > 0) values.push(node.machinesNeeded);
  for (const child of node.children) {
    values.push(...collectMachinesNeeded(child));
  }
  return values;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a: number, b: number): number {
  return a && b ? Math.abs(a) / gcd(a, b) * Math.abs(b) : 0;
}

/**
 * Find the smallest denominator q (1..maxDenom) such that v×q ≈ integer.
 */
function findDenominator(v: number, maxDenom = 10000, eps = 0.001): number {
  for (let q = 1; q <= maxDenom; q++) {
    if (Math.abs(v * q - Math.round(v * q)) < eps) return q;
  }
  return 1;
}

/**
 * Find the smallest positive integer k such that every value,
 * when multiplied by k, is an integer (within tolerance).
 *
 * Uses per-value fraction detection + LCM (handles large multipliers
 * that brute-force would miss). Returns null if the resulting k
 * exceeds maxK.
 */
export function findIntegerMultiplierForValues(
  values: number[],
  maxK = 100_000,
): number | null {
  if (values.length === 0) return 1;

  let k = 1;
  for (const v of values) {
    const q = findDenominator(v);
    k = lcm(k, q);
    if (k > maxK) return null;
  }
  return k;
}

/**
 * Compute minimal integer ratios for an array of values.
 * Returns integers divided by their GCD, or null if no multiplier is found.
 */
export function computeIntegerRatios(values: number[]): number[] | null {
  if (values.length === 0) return [];
  const k = findIntegerMultiplierForValues(values);
  if (k === null) return null;

  const ints = values.map(v => Math.round(v * k));
  let d = ints[0]!;
  for (let i = 1; i < ints.length; i++) d = gcd(d, ints[i]!);
  if (d > 1) return ints.map(v => v / d);
  return ints;
}

/**
 * Find the smallest positive integer k such that every machine count
 * in the plan, when multiplied by k, is an integer (within tolerance).
 * Returns null if no k ≤ maxK works.
 */
export function findIntegerMultiplier(
  plan: ProductionPlan,
  maxK = 100_000,
): number | null {
  const values = collectMachinesNeeded(plan.root);
  return findIntegerMultiplierForValues(values, maxK);
}
