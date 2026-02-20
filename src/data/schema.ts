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

/** A mining drill or pump entity. */
export interface MiningDrill {
  name: string;
  type: string; // "mining-drill" or "offshore-pump"
  mining_speed: number;
  resource_categories: string[];
  energy_usage: string;
  module_slots: number;
}

/** A minable resource entity. */
export interface Resource {
  name: string;
  category: string; // "basic-solid", "basic-fluid", etc.
  mining_time: number;
  results: RecipeItem[];
  required_fluid?: { name: string; amount: number };
}

/** A science pack ingredient for research. */
export interface TechIngredient {
  name: string;
  amount: number;
}

/** Research cost for a technology. */
export interface TechUnit {
  count?: number;
  count_formula?: string;
  time: number;
  ingredients: TechIngredient[];
}

/** A trigger-based research requirement (early-game techs). */
export interface ResearchTrigger {
  type: string; // "craft-item", "create-space-platform", etc.
  item?: string;
  count?: number;
}

/** An effect granted by researching a technology. */
export interface TechEffect {
  type: string; // "unlock-recipe", "ammo-damage", "turret-attack", etc.
  recipe?: string;
  modifier?: number;
  quality?: string;
  [key: string]: unknown;
}

/** A technology in the research tree. */
export interface Technology {
  name: string;
  prerequisites: string[];
  unit?: TechUnit;
  research_trigger?: ResearchTrigger;
  effects: TechEffect[];
  order?: string;
  max_level?: string | number; // "infinite" or a number
  upgrade?: boolean;
}
