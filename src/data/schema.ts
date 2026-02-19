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
}
