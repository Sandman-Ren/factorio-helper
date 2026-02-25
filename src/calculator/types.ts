import type { Recipe, Machine } from '../data/schema.js';

/** Per-item machine overrides: item name → machine name. */
export type MachineOverrides = Record<string, string>;

/** Per-item fuel overrides: item name → fuel name. */
export type FuelOverrides = Record<string, string>;

/** A node in the production chain tree. */
export interface ProductionNode {
  item: string;
  itemType: 'item' | 'fluid';
  recipe: Recipe | null;       // null for raw resources
  machine: Machine | null;     // null for raw resources
  ratePerSecond: number;       // items/s or fluid units/s needed
  machinesNeeded: number;      // fractional count of machines
  children: ProductionNode[];  // ingredient sub-trees
  powerKW: number;             // electric power draw (0 for burner/void machines)
  fuelPerSecond: number;       // fuel consumption rate (0 for electric machines)
  fuel: string | null;         // fuel item name (null for electric machines)
}

/** The full production plan. */
export interface ProductionPlan {
  root: ProductionNode;
  totalMachines: Record<string, number>;    // machine name -> count
  rawResources: Record<string, number>;     // resource name -> items/s
  totalElectricPowerKW: number;             // sum of electric power across all nodes
  totalFuel: Record<string, number>;        // fuel name -> items/s
}
