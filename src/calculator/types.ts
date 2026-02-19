import type { Recipe, Machine } from '../data/schema.js';

/** Per-item machine overrides: item name → machine name. */
export type MachineOverrides = Record<string, string>;

/** A node in the production chain tree. */
export interface ProductionNode {
  item: string;
  itemType: 'item' | 'fluid';
  recipe: Recipe | null;       // null for raw resources
  machine: Machine | null;     // null for raw resources
  ratePerSecond: number;       // items/s or fluid units/s needed
  machinesNeeded: number;      // fractional count of machines
  children: ProductionNode[];  // ingredient sub-trees
}

/** The full production plan. */
export interface ProductionPlan {
  root: ProductionNode;
  totalMachines: Record<string, number>;    // machine name -> count
  rawResources: Record<string, number>;     // resource name -> items/s
}
