import { useMemo, useState } from 'react';
import { buildRecipeGraph, solve } from '../../calculator/index.js';
import type { RecipeGraph, ProductionPlan, MachineOverrides, FuelOverrides, SolverOptions } from '../../calculator/index.js';
import recipesData from '../../data/generated/recipes.json';
import machinesData from '../../data/generated/machines.json';
import minersData from '../../data/generated/miners.json';
import resourcesData from '../../data/generated/resources.json';
import fuelsData from '../../data/generated/fuels.json';
import type { Recipe, Machine, MiningDrill, Resource, Fuel } from '../../data/schema.js';

const fuels = fuelsData as Fuel[];

export type TimeUnit = 'sec' | 'min' | 'hour';

const TIME_MULTIPLIERS: Record<TimeUnit, number> = {
  sec: 1,
  min: 1 / 60,
  hour: 1 / 3600,
};

export function useCalculator() {
  const [targetItem, setTargetItem] = useState('');
  const [amount, setAmount] = useState(1);
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('sec');
  const [machineOverrides, setMachineOverrides] = useState<MachineOverrides>({});
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, string>>({
    'basic-solid': 'electric-mining-drill',
  });
  const [defaultFuel, setDefaultFuel] = useState('coal');
  const [fuelOverrides, setFuelOverrides] = useState<FuelOverrides>({});

  const graph: RecipeGraph = useMemo(
    () => buildRecipeGraph(
      recipesData as Recipe[],
      machinesData as Machine[],
      minersData as MiningDrill[],
      resourcesData as Resource[],
    ),
    [],
  );

  const plan: ProductionPlan | null = useMemo(() => {
    if (!targetItem || amount <= 0) return null;
    if (!graph.itemToRecipe.has(targetItem) && !graph.allProducts.includes(targetItem)) {
      return null;
    }
    const ratePerSecond = amount * TIME_MULTIPLIERS[timeUnit];
    const solverOptions: SolverOptions = {
      fuelOverrides,
      defaultFuel,
      fuels,
    };
    return solve(graph, targetItem, ratePerSecond, machineOverrides, categoryOverrides, solverOptions);
  }, [graph, targetItem, amount, timeUnit, machineOverrides, categoryOverrides, defaultFuel, fuelOverrides]);

  return {
    graph,
    targetItem,
    setTargetItem,
    amount,
    setAmount,
    timeUnit,
    setTimeUnit,
    machineOverrides,
    setMachineOverrides,
    categoryOverrides,
    setCategoryOverrides,
    defaultFuel,
    setDefaultFuel,
    fuelOverrides,
    setFuelOverrides,
    fuels,
    plan,
  };
}
