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

/** A fuel item (wood, coal, solid fuel, etc.). */
export interface Fuel {
  name: string;
  fuel_value: string;    // raw from prototype, e.g. "4MJ"
  fuel_value_kj: number; // parsed to kJ for calculation
  fuel_category: string; // e.g. "chemical", "nuclear"
}

/** An entity that consumes power (electric or burner). */
export interface PowerEntity {
  name: string;
  type: string;                              // Lua prototype type
  category: string;                          // UI grouping category
  energy_type: 'electric' | 'burner' | 'void';

  // Standard power draw
  energy_usage?: string;
  energy_usage_kw?: number;

  // Drain (inserters, turrets, pumps)
  drain?: string;
  drain_kw?: number;

  // Turret buffer model
  buffer_capacity?: string;
  buffer_capacity_kj?: number;
  input_flow_limit?: string;
  input_flow_limit_kw?: number;

  // Multi-mode (rocket silo)
  active_energy_usage?: string;
  active_energy_usage_kw?: number;

  // Tick-based (lamp, speaker) - converted to kW at extraction
  energy_usage_per_tick?: string;

  // Burner specifics
  fuel_categories?: string[];

  // Roboport specifics
  charging_energy?: string;
  charging_energy_kw?: number;
}
