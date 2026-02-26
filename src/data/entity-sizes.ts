/**
 * Entity tile sizes for rendering.
 * Maps entity name → [width, height] in tiles.
 * Entities not listed here default to 1×1.
 *
 * Sourced from Factorio 2.0 vanilla prototypes (collision_box).
 */

const SIZES_2x2: string[] = [
  'small-electric-pole',
  'gate',
  'land-mine',
  'stone-wall',
];

const SIZES_3x3: string[] = [
  // Assemblers
  'assembling-machine-1',
  'assembling-machine-2',
  'assembling-machine-3',
  // Furnaces
  'electric-furnace',
  // Chemical / production
  'chemical-plant',
  'centrifuge',
  // Power
  'boiler',
  'steam-engine',
  'solar-panel',
  'accumulator',
  'heat-exchanger',
  'steam-turbine',
  'fusion-reactor',
  'fusion-generator',
  // Electric poles
  'big-electric-pole',
  'substation',
  // Logistics
  'roboport',
  'radar',
  'lab',
  'beacon',
  // Mining
  'electric-mining-drill',
  // Fluid
  'storage-tank',
  // Nuclear
  'nuclear-reactor',
  // Other
  'arithmetic-combinator',
  'decider-combinator',
  'selector-combinator',
  'display-panel',
];

const SIZES_5x5: string[] = [
  'oil-refinery',
  'biochamber',
];

const SIZES_9x9: string[] = [
  'rocket-silo',
];

const SIZES_1x2: string[] = [
  'stone-furnace',
  'steel-furnace',
];

const SIZES_2x1: string[] = [
  'pump',
];

// Build the lookup map
const sizeMap = new Map<string, [number, number]>();

for (const name of SIZES_2x2) sizeMap.set(name, [2, 2]);
for (const name of SIZES_3x3) sizeMap.set(name, [3, 3]);
for (const name of SIZES_5x5) sizeMap.set(name, [5, 5]);
for (const name of SIZES_9x9) sizeMap.set(name, [9, 9]);
for (const name of SIZES_1x2) sizeMap.set(name, [1, 2]);
for (const name of SIZES_2x1) sizeMap.set(name, [2, 1]);

/**
 * Get entity size in tiles [width, height].
 * Returns [1, 1] for unknown entities.
 */
export function getEntitySize(name: string): [number, number] {
  return sizeMap.get(name) ?? [1, 1];
}

/**
 * Upgrade paths for common entity chains.
 * Each array is ordered from lowest to highest tier.
 */
export const UPGRADE_PATHS: string[][] = [
  // Belts
  ['transport-belt', 'fast-transport-belt', 'express-transport-belt', 'turbo-transport-belt'],
  ['underground-belt', 'fast-underground-belt', 'express-underground-belt', 'turbo-underground-belt'],
  ['splitter', 'fast-splitter', 'express-splitter', 'turbo-splitter'],
  ['loader', 'fast-loader', 'express-loader', 'turbo-loader'],
  // Inserters
  ['burner-inserter', 'inserter', 'long-handed-inserter', 'fast-inserter', 'bulk-inserter', 'stack-inserter'],
  // Assemblers
  ['assembling-machine-1', 'assembling-machine-2', 'assembling-machine-3'],
  // Furnaces
  ['stone-furnace', 'steel-furnace', 'electric-furnace'],
  // Electric poles
  ['small-electric-pole', 'medium-electric-pole', 'big-electric-pole', 'substation'],
  // Pipes
  ['pipe', 'pipe-to-ground'],
  // Chests
  ['wooden-chest', 'iron-chest', 'steel-chest'],
  // Logistic chests
  ['passive-provider-chest', 'active-provider-chest', 'storage-chest', 'buffer-chest', 'requester-chest'],
  // Mining
  ['burner-mining-drill', 'electric-mining-drill', 'big-mining-drill'],
  // Modules
  ['speed-module', 'speed-module-2', 'speed-module-3'],
  ['efficiency-module', 'efficiency-module-2', 'efficiency-module-3'],
  ['productivity-module', 'productivity-module-2', 'productivity-module-3'],
  ['quality-module', 'quality-module-2', 'quality-module-3'],
];

// Build upgrade/downgrade lookup: entity name → { upgrade?, downgrade? }
const upgradeMap = new Map<string, { upgrade?: string; downgrade?: string }>();

for (const chain of UPGRADE_PATHS) {
  for (let i = 0; i < chain.length; i++) {
    const entry: { upgrade?: string; downgrade?: string } = {};
    if (i < chain.length - 1) entry.upgrade = chain[i + 1]!;
    if (i > 0) entry.downgrade = chain[i - 1]!;
    upgradeMap.set(chain[i]!, entry);
  }
}

/**
 * Get the next tier upgrade for an entity, or undefined if at max tier.
 */
export function getUpgrade(name: string): string | undefined {
  return upgradeMap.get(name)?.upgrade;
}

/**
 * Get the previous tier downgrade for an entity, or undefined if at min tier.
 */
export function getDowngrade(name: string): string | undefined {
  return upgradeMap.get(name)?.downgrade;
}
