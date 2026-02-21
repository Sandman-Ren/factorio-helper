/** A single ingredient or result in a recipe. */
export interface RecipeItem {
  type: 'item' | 'fluid';
  name: string;
  amount: number;
}

/** A crafting recipe. */
export interface Recipe {
  name: string;
  category: string;
  energy_required: number; // craft time in seconds
  ingredients: RecipeItem[];
  results: RecipeItem[];
}

/** An item (anything that goes in an inventory). */
export interface Item {
  name: string;
  type: string; // "item", "tool", "ammo", "module", etc.
  subgroup: string;
  stack_size: number;
}

/** A fluid. */
export interface Fluid {
  name: string;
}

/** A crafting machine (assembler, furnace, chemical plant, etc.). */
export interface Machine {
  name: string;
  type: string; // "assembling-machine", "furnace", etc.
  crafting_speed: number;
  crafting_categories: string[];
  energy_usage: string;
  module_slots: number;
  energy_type: 'electric' | 'burner' | 'void';
  fuel_categories?: string[]; // only present when energy_type is "burner"
}

/** A mining drill or pump entity. */
export interface MiningDrill {
  name: string;
  type: string; // "mining-drill" or "offshore-pump"
  mining_speed: number;
  resource_categories: string[];
  energy_usage: string;
  module_slots: number;
  energy_type: 'electric' | 'burner' | 'void';
  fuel_categories?: string[]; // only present when energy_type is "burner"
}

/** A fuel item (wood, coal, solid fuel, etc.). */
export interface Fuel {
  name: string;
  fuel_value: string;    // raw from prototype, e.g. "4MJ"
  fuel_value_kj: number; // parsed to kJ for calculation
  fuel_category: string; // e.g. "chemical", "nuclear"
}

/** A minable resource entity. */
export interface Resource {
  name: string;
  category: string; // "basic-solid", "basic-fluid", etc.
  mining_time: number;
  results: RecipeItem[];
  required_fluid?: { name: string; amount: number };
}
