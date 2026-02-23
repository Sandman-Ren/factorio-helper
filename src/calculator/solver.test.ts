import { describe, it, expect } from 'vitest';
import { buildRecipeGraph } from './recipe-graph.js';
import { solve } from './solver.js';
import type { MachineOverrides } from './types.js';
import type { Recipe, Machine, MiningDrill, Resource, Fuel } from '../data/schema.js';

const testFuels: Fuel[] = [
  { name: 'coal', fuel_value: '4MJ', fuel_value_kj: 4000, fuel_category: 'chemical' },
  { name: 'solid-fuel', fuel_value: '12MJ', fuel_value_kj: 12000, fuel_category: 'chemical' },
];

// Minimal test data matching Factorio base game values
const testRecipes: Recipe[] = [
  {
    name: 'iron-plate',
    category: 'smelting',
    energy_required: 3.2,
    ingredients: [{ type: 'item', name: 'iron-ore', amount: 1 }],
    results: [{ type: 'item', name: 'iron-plate', amount: 1 }],
  },
  {
    name: 'copper-plate',
    category: 'smelting',
    energy_required: 3.2,
    ingredients: [{ type: 'item', name: 'copper-ore', amount: 1 }],
    results: [{ type: 'item', name: 'copper-plate', amount: 1 }],
  },
  {
    name: 'iron-gear-wheel',
    category: 'crafting',
    energy_required: 0.5,
    ingredients: [{ type: 'item', name: 'iron-plate', amount: 2 }],
    results: [{ type: 'item', name: 'iron-gear-wheel', amount: 1 }],
  },
  {
    name: 'copper-cable',
    category: 'crafting',
    energy_required: 0.5,
    ingredients: [{ type: 'item', name: 'copper-plate', amount: 1 }],
    results: [{ type: 'item', name: 'copper-cable', amount: 2 }],
  },
  {
    name: 'electronic-circuit',
    category: 'crafting',
    energy_required: 0.5,
    ingredients: [
      { type: 'item', name: 'iron-plate', amount: 1 },
      { type: 'item', name: 'copper-cable', amount: 3 },
    ],
    results: [{ type: 'item', name: 'electronic-circuit', amount: 1 }],
  },
  {
    name: 'automation-science-pack',
    category: 'crafting',
    energy_required: 5,
    ingredients: [
      { type: 'item', name: 'copper-plate', amount: 1 },
      { type: 'item', name: 'iron-gear-wheel', amount: 1 },
    ],
    results: [{ type: 'item', name: 'automation-science-pack', amount: 1 }],
  },
];

const testMachines: Machine[] = [
  {
    name: 'stone-furnace',
    type: 'furnace',
    crafting_speed: 1,
    crafting_categories: ['smelting'],
    energy_usage: '90kW',
    module_slots: 0,
    energy_type: 'burner',
    fuel_categories: ['chemical'],
  },
  {
    name: 'electric-furnace',
    type: 'furnace',
    crafting_speed: 2,
    crafting_categories: ['smelting'],
    energy_usage: '180kW',
    module_slots: 2,
    energy_type: 'electric',
  },
  {
    name: 'assembling-machine-1',
    type: 'assembling-machine',
    crafting_speed: 0.5,
    crafting_categories: ['crafting', 'basic-crafting', 'advanced-crafting'],
    energy_usage: '75kW',
    module_slots: 0,
    energy_type: 'electric',
  },
  {
    name: 'assembling-machine-3',
    type: 'assembling-machine',
    crafting_speed: 1.25,
    crafting_categories: ['basic-crafting', 'crafting', 'advanced-crafting', 'crafting-with-fluid'],
    energy_usage: '375kW',
    module_slots: 4,
    energy_type: 'electric',
  },
];

describe('solver', () => {
  const graph = buildRecipeGraph(testRecipes, testMachines);

  it('resolves raw resource as leaf node', () => {
    const plan = solve(graph, 'iron-ore', 1);
    expect(plan.root.item).toBe('iron-ore');
    expect(plan.root.children).toHaveLength(0);
    expect(plan.root.machinesNeeded).toBe(0);
    expect(plan.rawResources['iron-ore']).toBe(1);
  });

  it('resolves iron-plate smelting', () => {
    const plan = solve(graph, 'iron-plate', 1);
    expect(plan.root.item).toBe('iron-plate');
    // electric-furnace (speed 2): 1 plate/s needs 3.2/2 = 1.6 machines
    expect(plan.root.machinesNeeded).toBeCloseTo(1.6);
    expect(plan.root.machine?.name).toBe('electric-furnace');
    expect(plan.root.children).toHaveLength(1);
    expect(plan.root.children[0]!.item).toBe('iron-ore');
    expect(plan.rawResources['iron-ore']).toBeCloseTo(1);
  });

  it('resolves electronic circuit chain', () => {
    // 1 electronic-circuit/s:
    //   recipe: 0.5s, 1 iron-plate + 3 copper-cable -> 1 circuit
    //   with asm3 (speed 1.25): time = 0.5/1.25 = 0.4s per craft
    //   machines = 1 * 0.4 = 0.4 assemblers
    //   needs: 1 iron-plate/s + 3 copper-cable/s
    //   copper-cable: recipe produces 2, so 3/s needs 1.5 crafts/s
    //     1.5 * 0.5/1.25 = 0.6 assemblers
    //     needs 1.5 copper-plate/s

    const plan = solve(graph, 'electronic-circuit', 1);
    expect(plan.root.machinesNeeded).toBeCloseTo(0.4);
    expect(plan.root.children).toHaveLength(2);

    // Iron plate child
    const ironChild = plan.root.children.find(c => c.item === 'iron-plate');
    expect(ironChild).toBeDefined();
    expect(ironChild!.ratePerSecond).toBeCloseTo(1);

    // Copper cable child
    const cableChild = plan.root.children.find(c => c.item === 'copper-cable');
    expect(cableChild).toBeDefined();
    expect(cableChild!.ratePerSecond).toBeCloseTo(3);
    // Cable recipe makes 2 per craft, so 1.5 crafts/s needed
    expect(cableChild!.machinesNeeded).toBeCloseTo(0.6);

    // Raw resources
    expect(plan.rawResources['iron-ore']).toBeCloseTo(1);
    expect(plan.rawResources['copper-ore']).toBeCloseTo(1.5);
  });

  it('aggregates total machines correctly', () => {
    const plan = solve(graph, 'automation-science-pack', 1);

    // automation-science-pack: 5s craft time, asm3 speed 1.25 → 5/1.25 = 4s → 1*4 = 4 machines
    expect(plan.root.machinesNeeded).toBeCloseTo(4);

    // Should have entries for assembling-machine-3 and electric-furnace
    expect(plan.totalMachines['assembling-machine-3']).toBeGreaterThan(0);
    expect(plan.totalMachines['electric-furnace']).toBeGreaterThan(0);
  });
});

// --- Mining / extraction tests ---

const testMiners: MiningDrill[] = [
  {
    name: 'electric-mining-drill',
    type: 'mining-drill',
    mining_speed: 0.5,
    resource_categories: ['basic-solid'],
    energy_usage: '90kW',
    module_slots: 3,
    energy_type: 'electric',
  },
  {
    name: 'pumpjack',
    type: 'mining-drill',
    mining_speed: 1,
    resource_categories: ['basic-fluid'],
    energy_usage: '90kW',
    module_slots: 2,
    energy_type: 'electric',
  },
  {
    name: 'offshore-pump',
    type: 'offshore-pump',
    mining_speed: 20, // pumping_speed in fluid/tick
    resource_categories: ['water-pumping'],
    energy_usage: '0kW',
    module_slots: 0,
    energy_type: 'void',
  },
];

const testResources: Resource[] = [
  {
    name: 'iron-ore',
    category: 'basic-solid',
    mining_time: 1,
    results: [{ type: 'item', name: 'iron-ore', amount: 1 }],
  },
  {
    name: 'copper-ore',
    category: 'basic-solid',
    mining_time: 1,
    results: [{ type: 'item', name: 'copper-ore', amount: 1 }],
  },
  {
    name: 'uranium-ore',
    category: 'basic-solid',
    mining_time: 2,
    results: [{ type: 'item', name: 'uranium-ore', amount: 1 }],
    required_fluid: { name: 'sulfuric-acid', amount: 10 },
  },
  {
    name: 'crude-oil',
    category: 'basic-fluid',
    mining_time: 1,
    results: [{ type: 'fluid', name: 'crude-oil', amount: 10 }],
  },
];

// Add a sulfuric-acid recipe for uranium mining chain tests
const extendedRecipes: Recipe[] = [
  ...testRecipes,
  {
    name: 'sulfuric-acid',
    category: 'crafting-with-fluid',
    energy_required: 1,
    ingredients: [
      { type: 'item', name: 'iron-plate', amount: 1 },
      { type: 'fluid', name: 'sulfur', amount: 5 },
    ],
    results: [{ type: 'fluid', name: 'sulfuric-acid', amount: 50 }],
  },
];

describe('solver with mining', () => {
  const graph = buildRecipeGraph(extendedRecipes, testMachines, testMiners, testResources);

  it('resolves iron-ore with electric mining drills', () => {
    // electric-mining-drill speed 0.5, mining_time 1, result 1
    // machinesNeeded = (1/1) * (1/0.5) = 2 drills
    const plan = solve(graph, 'iron-ore', 1);
    expect(plan.root.item).toBe('iron-ore');
    expect(plan.root.machinesNeeded).toBeCloseTo(2);
    expect(plan.root.machine?.name).toBe('electric-mining-drill');
    expect(plan.root.children).toHaveLength(0); // no ingredients
    expect(plan.rawResources['iron-ore']).toBeCloseTo(1);
  });

  it('resolves iron-plate chain including mining drills', () => {
    // iron-plate: 1.6 electric-furnaces (unchanged)
    // iron-ore: 2 electric-mining-drills
    const plan = solve(graph, 'iron-plate', 1);
    expect(plan.root.machinesNeeded).toBeCloseTo(1.6);
    expect(plan.root.machine?.name).toBe('electric-furnace');

    // Iron-ore child now has drills instead of being a bare leaf
    const oreChild = plan.root.children[0]!;
    expect(oreChild.item).toBe('iron-ore');
    expect(oreChild.machinesNeeded).toBeCloseTo(2);
    expect(oreChild.machine?.name).toBe('electric-mining-drill');

    // Raw resources summary still includes iron-ore
    expect(plan.rawResources['iron-ore']).toBeCloseTo(1);

    // Total machines includes both furnaces and drills
    expect(plan.totalMachines['electric-furnace']).toBeCloseTo(1.6);
    expect(plan.totalMachines['electric-mining-drill']).toBeCloseTo(2);
  });

  it('resolves uranium-ore with drills and sulfuric acid chain', () => {
    // uranium-ore: mining_time=2, speed=0.5 → (1/1)*(2/0.5) = 4 drills
    // sulfuric-acid: 10/s needed, recipe produces 50 per craft
    //   crafts/s = 10/50 = 0.2, time = 1/1.25 = 0.8 → 0.2 * 0.8 = 0.16 machines
    const plan = solve(graph, 'uranium-ore', 1);
    expect(plan.root.machinesNeeded).toBeCloseTo(4);
    expect(plan.root.machine?.name).toBe('electric-mining-drill');
    expect(plan.root.children).toHaveLength(1); // sulfuric-acid ingredient

    const acidChild = plan.root.children[0]!;
    expect(acidChild.item).toBe('sulfuric-acid');
    expect(acidChild.ratePerSecond).toBeCloseTo(10);
  });

  it('resolves crude-oil with pumpjacks', () => {
    // crude-oil: mining_time=1, pumpjack speed=1, result=10
    // machinesNeeded = (10/10) * (1/1) = 1 pumpjack
    const plan = solve(graph, 'crude-oil', 10);
    expect(plan.root.machinesNeeded).toBeCloseTo(1);
    expect(plan.root.machine?.name).toBe('pumpjack');
    expect(plan.rawResources['crude-oil']).toBeCloseTo(10);
  });

  it('resolves water with offshore pumps', () => {
    // offshore-pump: crafting_speed=1, water recipe produces 1200/craft
    // 1200 water/s → 1 pump; 2400 water/s → 2 pumps
    const plan = solve(graph, 'water', 1200);
    expect(plan.root.machinesNeeded).toBeCloseTo(1);
    expect(plan.root.machine?.name).toBe('offshore-pump');
    expect(plan.rawResources['water']).toBeCloseTo(1200);

    const plan2 = solve(graph, 'water', 2400);
    expect(plan2.root.machinesNeeded).toBeCloseTo(2);
  });
});

describe('solver power and fuel', () => {
  const graph = buildRecipeGraph(extendedRecipes, testMachines, testMiners, testResources);

  it('computes electric power for assemblers', () => {
    // iron-gear-wheel: 1/s needs 0.4 asm3 (375kW each)
    // power = 0.4 * 375 = 150 kW
    const plan = solve(graph, 'iron-gear-wheel', 1, undefined, undefined, { fuels: testFuels });
    expect(plan.root.powerKW).toBeCloseTo(150);
    expect(plan.root.fuelPerSecond).toBe(0);
    expect(plan.root.fuel).toBeNull();
  });

  it('computes electric power for electric furnaces', () => {
    // iron-plate: 1/s needs 1.6 electric-furnace (180kW each)
    // power = 1.6 * 180 = 288 kW
    const plan = solve(graph, 'iron-plate', 1, undefined, undefined, { fuels: testFuels });
    expect(plan.root.powerKW).toBeCloseTo(288);
  });

  it('computes fuel consumption for burner furnaces', () => {
    // Use stone-furnace override for smelting
    // iron-plate: 1/s with stone-furnace (speed 1): 3.2 machines, 90kW each
    // fuel = 3.2 * 90 / 4000 = 0.072 coal/s
    const plan = solve(graph, 'iron-plate', 1, undefined, { smelting: 'stone-furnace' }, {
      fuels: testFuels,
      defaultFuel: 'coal',
    });
    expect(plan.root.powerKW).toBe(0); // burner, not electric
    expect(plan.root.fuelPerSecond).toBeCloseTo(0.072);
    expect(plan.root.fuel).toBe('coal');
  });

  it('aggregates totalElectricPowerKW across chain', () => {
    const plan = solve(graph, 'iron-plate', 1, undefined, undefined, { fuels: testFuels });
    // electric-furnace: 1.6 * 180 = 288 kW
    // electric-mining-drill: 2 * 90 = 180 kW
    // total = 468 kW
    expect(plan.totalElectricPowerKW).toBeCloseTo(468);
  });

  it('aggregates totalFuel for burner machines', () => {
    const plan = solve(graph, 'iron-plate', 1, undefined, { smelting: 'stone-furnace' }, {
      fuels: testFuels,
      defaultFuel: 'coal',
    });
    // stone-furnace: 3.2 * 90 / 4000 = 0.072 coal/s
    expect(plan.totalFuel['coal']).toBeCloseTo(0.072);
    // electric-mining-drill is electric, not burner — no fuel
    expect(plan.totalElectricPowerKW).toBeCloseTo(180); // 2 drills * 90kW
  });

  it('supports per-item fuel overrides', () => {
    const plan = solve(graph, 'iron-plate', 1, undefined, { smelting: 'stone-furnace' }, {
      fuels: testFuels,
      defaultFuel: 'coal',
      fuelOverrides: { 'iron-plate': 'solid-fuel' },
    });
    // stone-furnace: 3.2 * 90 / 12000 = 0.024 solid-fuel/s
    expect(plan.root.fuel).toBe('solid-fuel');
    expect(plan.root.fuelPerSecond).toBeCloseTo(0.024);
    expect(plan.totalFuel['solid-fuel']).toBeCloseTo(0.024);
  });

  it('reports zero power for void machines (offshore pump)', () => {
    const plan = solve(graph, 'water', 1200, undefined, undefined, { fuels: testFuels });
    expect(plan.root.powerKW).toBe(0);
    expect(plan.root.fuelPerSecond).toBe(0);
    expect(plan.totalElectricPowerKW).toBe(0);
  });

  it('handles burner machine with empty fuels array', () => {
    const plan = solve(graph, 'iron-plate', 1, undefined, { smelting: 'stone-furnace' }, {
      fuels: [],
      defaultFuel: 'coal',
    });
    // No fuels in map → fuelMap.get returns undefined → 0 fuel
    expect(plan.root.fuelPerSecond).toBe(0);
    expect(plan.root.fuel).toBeNull();
  });

  it('handles burner machine with unknown fuel name', () => {
    const plan = solve(graph, 'iron-plate', 1, undefined, { smelting: 'stone-furnace' }, {
      fuels: testFuels,
      defaultFuel: 'nonexistent-fuel',
    });
    expect(plan.root.fuelPerSecond).toBe(0);
    expect(plan.root.fuel).toBeNull();
  });

  it('rejects fuel with incompatible category', () => {
    const nuclearFuels: Fuel[] = [
      ...testFuels,
      { name: 'uranium-fuel-cell', fuel_value: '8GJ', fuel_value_kj: 8000000, fuel_category: 'nuclear' },
    ];
    // stone-furnace only accepts 'chemical', not 'nuclear'
    const plan = solve(graph, 'iron-plate', 1, undefined, { smelting: 'stone-furnace' }, {
      fuels: nuclearFuels,
      defaultFuel: 'uranium-fuel-cell',
    });
    expect(plan.root.fuelPerSecond).toBe(0);
    expect(plan.root.fuel).toBeNull();
  });

  it('explicit params override options bag', () => {
    const explicitOverrides: MachineOverrides = { 'iron-plate': 'stone-furnace' };
    const optionsOverrides: MachineOverrides = { 'iron-plate': 'electric-furnace' };
    const plan = solve(graph, 'iron-plate', 1, explicitOverrides, undefined, {
      machineOverrides: optionsOverrides,
      fuels: testFuels,
      defaultFuel: 'coal',
    });
    // Explicit param wins — stone-furnace (speed 1, burner)
    expect(plan.root.machine?.name).toBe('stone-furnace');
  });
});
