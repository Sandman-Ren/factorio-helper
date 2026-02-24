// Factorio 2.0 Blueprint JSON Schema Types
// Based on https://github.com/redruin1/factorio-blueprint-schemas (2.0.0)

// ── Enums ──────────────────────────────────────────────────────────────────

export const enum Direction {
  North = 0,
  NorthNorthEast = 1,
  NorthEast = 2,
  EastNorthEast = 3,
  East = 4,
  EastSouthEast = 5,
  SouthEast = 6,
  SouthSouthEast = 7,
  South = 8,
  SouthSouthWest = 9,
  SouthWest = 10,
  WestSouthWest = 11,
  West = 12,
  WestNorthWest = 13,
  NorthWest = 14,
  NorthNorthWest = 15,
}

export const enum WireConnectorId {
  CircuitRed = 1,
  CircuitGreen = 2,
  CombinatorOutputRed = 3,
  CombinatorOutputGreen = 4,
  PoleCopperOrPowerSwitchLeft = 5,
  PowerSwitchRight = 6,
}

// ── Primitives ─────────────────────────────────────────────────────────────

export interface Position {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number | null;
}

export type SignalType =
  | "item"
  | "fluid"
  | "virtual"
  | "recipe"
  | "entity"
  | "space-location"
  | "asteroid-chunk"
  | "quality";

export interface SignalID {
  name: string;
  type?: SignalType;
  quality?: QualityName;
}

export type QualityName =
  | "normal"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "quality-unknown";

export type Comparator = ">" | "<" | "=" | "\u2265" | "\u2264" | "\u2260";

export interface Icon {
  index: number;
  signal: SignalID;
}

// ── Wire Connection ────────────────────────────────────────────────────────

/** [entity1_number, connector1_id, entity2_number, connector2_id] */
export type WireConnection = [number, WireConnectorId, number, WireConnectorId];

// ── Conditions ─────────────────────────────────────────────────────────────

export interface Condition {
  first_signal?: SignalID | null;
  comparator?: Comparator;
  constant?: number | null;
  second_signal?: SignalID | null;
}

export interface NetworkSpecification {
  red?: boolean;
  green?: boolean;
}

export interface QualityFilter {
  quality?: QualityName;
  comparator?: Comparator;
}

// ── Items & Inventory ──────────────────────────────────────────────────────

export interface ItemAndQualityId {
  name: string;
  quality?: QualityName;
}

export interface InventoryPosition {
  inventory: number;
  stack: number;
  count?: number;
}

export interface ItemInventoryPositions {
  in_inventory?: InventoryPosition[];
  grid_count?: number;
}

export interface InsertPlan {
  id: ItemAndQualityId;
  items: ItemInventoryPositions;
}

export interface ItemFilter {
  index: number;
  name: string;
  quality?: QualityName;
  comparator?: Comparator;
}

export interface Inventory {
  filters?: ItemFilter[];
  bar?: number;
}

// ── Logistics ──────────────────────────────────────────────────────────────

export interface LogisticFilter {
  index: number;
  name: string;
  type?: SignalType;
  quality?: QualityName;
  comparator?: Comparator;
  count: number;
  max_count?: number;
}

export interface LogisticSection {
  index: number;
  filters?: LogisticFilter[];
  group?: string;
  active?: boolean;
}

export interface RequestFilters {
  trash_not_requested?: boolean;
  request_from_buffers?: boolean;
  enabled?: boolean;
  sections?: LogisticSection[];
}

// ── Control Behaviors ──────────────────────────────────────────────────────

export interface DeciderCondition extends Condition {
  first_signal_networks?: NetworkSpecification;
  second_signal_networks?: NetworkSpecification;
  compare_type?: "or" | "and";
}

export interface DeciderOutput {
  signal?: SignalID | null;
  copy_count_from_input?: boolean;
  networks?: NetworkSpecification;
  constant?: number;
}

export interface DisplayPanelMessage {
  icon?: SignalID | null;
  text?: string;
  condition?: Condition;
}

// ── Schedules ──────────────────────────────────────────────────────────────

export type TrainWaitConditionType =
  | "time"
  | "inactivity"
  | "full"
  | "empty"
  | "not_empty"
  | "item_count"
  | "fluid_count"
  | "circuit"
  | "passenger_present"
  | "passenger_not_present"
  | "fuel_full"
  | "fuel_item_count_all"
  | "fuel_item_count_any"
  | "specific_destination_full"
  | "specific_destination_not_full";

export interface TrainWaitCondition {
  type: TrainWaitConditionType;
  compare_type: "and" | "or";
  ticks?: number;
  condition?: Condition;
  station?: string;
}

export interface TrainScheduleStop {
  station: string;
  wait_conditions?: TrainWaitCondition[];
}

export type TrainInterruptConditionType =
  | Exclude<TrainWaitConditionType, "inactivity" | "time">
  | "at_station"
  | "not_at_station"
  | "destination_full_or_no_path";

export interface TrainInterruptCondition {
  type: TrainInterruptConditionType;
  compare_type: "and" | "or";
  condition?: Condition;
  station?: string;
}

export interface TrainInterrupt {
  name?: string;
  conditions?: TrainInterruptCondition[];
  targets?: TrainScheduleStop[];
  inside_interrupt?: boolean;
}

export interface TrainSchedule {
  records?: TrainScheduleStop[];
  interrupts?: TrainInterrupt[];
}

export type SpacePlatformWaitConditionType =
  | "time"
  | "inactivity"
  | "item_count"
  | "circuit"
  | "passenger_present"
  | "passenger_not_present"
  | "all_requests_satisfied"
  | "any_request_not_satisfied"
  | "any_request_zero"
  | "damage_taken"
  | "request_not_satisfied"
  | "request_satisfied";

export interface SpacePlatformWaitCondition {
  type: SpacePlatformWaitConditionType;
  compare_type: "and" | "or";
  ticks?: number;
  condition?: Condition;
  damage?: number;
}

export interface SpacePlatformStop {
  station: string;
  wait_conditions?: SpacePlatformWaitCondition[];
  allows_unloading?: boolean;
}

export interface SpacePlatformInterrupt {
  name?: string;
  conditions?: SpacePlatformWaitCondition[];
  targets?: SpacePlatformStop[];
}

export interface SpacePlatformSchedule {
  records?: SpacePlatformStop[];
  interrupts?: SpacePlatformInterrupt[];
}

export interface Schedule {
  locomotives: number[];
  schedule: TrainSchedule | SpacePlatformSchedule;
}

// ── Stock Connections ──────────────────────────────────────────────────────

export interface StockConnection {
  stock: number;
  front?: number;
  back?: number;
}

// ── Parameters ─────────────────────────────────────────────────────────────

export interface IdParameter {
  type: "id";
  name?: string;
  id?: string;
  "quality-condition"?: QualityFilter;
  "ingredient-of"?: string | null;
  parameter?: boolean;
}

export interface NumberParameter {
  type: "number";
  name?: string;
  number?: string;
  variable?: string;
  formula?: string;
  dependent?: boolean;
  "not-parametrised"?: boolean;
}

// ── Entity ─────────────────────────────────────────────────────────────────

/**
 * Single Entity interface with optional fields covering all entity types.
 * This matches how the JSON comes from the game — no discriminated subtypes.
 */
export interface Entity {
  entity_number: number;
  name: string;
  position: Position;
  direction?: Direction;
  mirror?: boolean;
  quality?: QualityName;
  items?: InsertPlan[];
  tags?: Record<string, unknown>;

  // Assembling machine / Furnace
  recipe?: string | null;
  recipe_quality?: QualityName;

  // Inserter
  override_stack_size?: number | null;
  pickup_position?: [number, number] | null;
  drop_position?: [number, number] | null;
  spoil_priority?: "spoiled-first" | "fresh-first" | null;
  use_filters?: boolean;
  filter_mode?: "whitelist" | "blacklist";
  filters?: ItemFilter[];

  // Underground belt / Loader
  type?: string;

  // Splitter
  input_priority?: "left" | "none" | "right";
  output_priority?: "left" | "none" | "right";
  filter?: SignalID;

  // Container
  bar?: number;

  // Logistic container / Space Platform Hub / Cargo Bay / Cargo Landing Pad
  request_filters?: RequestFilters;
  request_missing_construction_materials?: boolean;

  // Train stop
  station?: string;
  manual_trains_limit?: number;
  priority?: number;
  color?: Color;

  // Locomotive / Wagons / Vehicles
  orientation?: number;
  inventory?: Inventory;

  // Vehicle-specific
  ammo_inventory?: Inventory | null;
  trunk_inventory?: Inventory | null;
  driver_is_main_gunner?: boolean;
  selected_gun_index?: number;
  enable_logistics_while_moving?: boolean;
  grid?: EquipmentComponent[];

  // Rocket silo
  auto_launch?: boolean;
  transitional_request_index?: number;

  // Power switch
  switch_state?: boolean;

  // Lamp
  always_on?: boolean;

  // Display panel
  text?: string;
  icon?: SignalID | null;
  always_show?: boolean;
  show_in_chart?: boolean;

  // Programmable speaker
  parameters?: SpeakerParameters;
  alert_parameters?: AlertParameters;

  // Asteroid collector
  result_inventory?: { bar?: number };
  "chunk-filter"?: AsteroidChunkFilter[];

  // Control behavior — union of all entity control behaviors
  control_behavior?: ControlBehavior;
}

export interface EquipmentComponent {
  equipment: { name: string; quality?: QualityName };
  position: Position;
}

export interface SpeakerParameters {
  playback_volume?: number;
  playback_mode?: "local" | "surface" | "global";
  allow_polyphony?: boolean;
  volume_controlled_by_signal?: boolean;
  volume_signal_id?: SignalID | null;
}

export interface AlertParameters {
  show_alert?: boolean;
  icon_signal_id?: SignalID | null;
  show_on_map?: boolean;
  alert_message?: string;
}

export interface AsteroidChunkFilter {
  index: number;
  name: string;
}

/**
 * Merged control_behavior covering all entity types.
 * Only the fields relevant to a given entity will be present.
 */
export interface ControlBehavior {
  // Common circuit enable
  circuit_enabled?: boolean;
  circuit_condition?: Condition;
  connect_to_logistic_network?: boolean;
  logistic_condition?: Condition;

  // Crafting machine
  set_recipe?: boolean;
  read_contents?: boolean;
  include_in_crafting?: boolean;
  read_recipe_finished?: boolean;
  recipe_finished_signal?: SignalID | null;
  read_working?: boolean;
  working_signal?: SignalID | null;

  // Inserter
  circuit_read_hand_contents?: boolean;
  circuit_read_hand_mode?: 0 | 1;
  circuit_set_stack_size?: boolean;
  stack_control_input_signal?: SignalID | null;
  circuit_set_filters?: boolean;

  // Transport belt
  circuit_contents_read_mode?: 0 | 1;

  // Splitter
  set_input_priority?: boolean;
  input_left_condition?: Condition;
  input_right_condition?: Condition;
  set_output_priority?: boolean;
  output_left_condition?: Condition;
  output_right_condition?: Condition;
  set_filter?: boolean;

  // Logistic container
  circuit_mode_of_operation?: 0 | 1 | 2;

  // Arithmetic combinator
  arithmetic_conditions?: {
    first_constant?: number | null;
    first_signal?: SignalID | null;
    first_signal_networks?: NetworkSpecification;
    operation?: "*" | "/" | "+" | "-" | "%" | "^" | "<<" | ">>" | "AND" | "OR" | "XOR";
    second_constant?: number | null;
    second_signal?: SignalID | null;
    second_signal_networks?: NetworkSpecification;
    output_signal?: SignalID | null;
  };

  // Decider combinator
  decider_conditions?: {
    conditions?: DeciderCondition[];
    outputs?: DeciderOutput[];
  };

  // Selector combinator
  operation?: "select" | "count" | "random" | "stack-size"
    | "rocket-capacity" | "quality-filter" | "quality-transfer";
  select_max?: boolean;
  index_constant?: number;
  index_signal?: SignalID | null;
  count_inputs_signal?: SignalID | null;
  random_update_interval?: number;
  quality_filter?: QualityFilter;
  select_quality_from_signal?: boolean;
  quality_source_static?: QualityName;
  quality_source_signal?: SignalID | null;
  quality_destination_signal?: SignalID | null;

  // Constant combinator
  is_on?: boolean;
  sections?: {
    sections?: LogisticSection[];
  };

  // Train stop
  send_to_train?: boolean;
  set_trains_limit?: boolean;
  trains_limit_signal?: SignalID | null;
  read_from_train?: boolean;
  read_stopped_train?: boolean;
  train_stopped_signal?: SignalID | null;
  read_trains_count?: boolean;
  trains_count_signal?: SignalID | null;
  set_priority?: boolean;
  priority_signal?: SignalID | null;

  // Roboport
  read_logistics?: boolean;
  read_robot_stats?: boolean;
  available_logistic_output_signal?: SignalID | null;
  total_logistic_output_signal?: SignalID | null;
  available_construction_output_signal?: SignalID | null;
  total_construction_output_signal?: SignalID | null;

  // Lamp
  use_colors?: boolean;
  color_mode?: 0 | 1 | 2;
  red_signal?: SignalID | null;
  green_signal?: SignalID | null;
  blue_signal?: SignalID | null;
  rgb_signal?: SignalID | null;

  // Display panel
  // Uses `parameters` but as DisplayPanelMessage[], not SpeakerParameters
  // The entity.parameters field handles SpeakerParameters; this is for display panel
  "parameters"?: DisplayPanelMessage[];

  // Mining drill
  circuit_read_resources?: boolean;
  circuit_resource_read_mode?: number;

  // Space platform hub
  send_to_platform?: boolean;
  read_moving_from?: boolean;
  read_moving_to?: boolean;
  read_speed?: boolean;
  speed_signal?: SignalID | null;
  read_damage_taken?: boolean;
  damage_taken_signal?: SignalID | null;

  // Asteroid collector
  include_hands?: boolean;
  circuit_read_contents?: boolean;

  // Speaker
  circuit_parameters?: {
    signal_value_is_pitch?: boolean;
    stop_playing_sounds?: boolean;
    instrument_id?: number;
    note_id?: number;
  };
}

// ── Tile ───────────────────────────────────────────────────────────────────

export interface Tile {
  name: string;
  position: Position;
}

// ── Blueprint ──────────────────────────────────────────────────────────────

export interface Blueprint {
  item: "blueprint";
  label?: string;
  label_color?: Color;
  description?: string;
  icons?: Icon[];
  version: number;
  "snap-to-grid"?: Position;
  "absolute-snapping"?: boolean;
  "position-relative-to-grid"?: Position;
  entities?: Entity[];
  tiles?: Tile[];
  wires?: WireConnection[];
  parameters?: (IdParameter | NumberParameter)[];
  schedules?: Schedule[];
  stock_connections?: StockConnection[];
}

// ── Blueprint Book ─────────────────────────────────────────────────────────

export type BlueprintBookChild =
  | { index: number | null; blueprint: Blueprint }
  | { index: number | null; blueprint_book: BlueprintBook }
  | { index: number | null; upgrade_planner: UpgradePlanner }
  | { index: number | null; deconstruction_planner: DeconstructionPlanner };

export interface BlueprintBook {
  item: "blueprint-book";
  label?: string;
  label_color?: Color;
  description?: string;
  icons?: Icon[];
  version: number;
  active_index: number;
  blueprints: BlueprintBookChild[];
}

// ── Upgrade Planner ────────────────────────────────────────────────────────

export interface MapperFromId {
  name: string;
  type: "entity" | "item";
  quality?: QualityName;
  comparator?: Comparator;
}

export interface MapperToId {
  name: string;
  type: "entity" | "item";
  quality?: QualityName;
}

export interface Mapper {
  index: number;
  from?: MapperFromId | null;
  to?: MapperToId | null;
}

export interface UpgradePlanner {
  item: "blueprint";
  label?: string;
  label_color?: Color;
  version: number;
  settings?: {
    description?: string;
    icons?: Icon[];
    mappers?: Mapper[];
  };
}

// ── Deconstruction Planner ─────────────────────────────────────────────────

export interface DeconstructionPlanner {
  item: "deconstruction-planner";
  label?: string;
  label_color?: Color;
  version: number;
  settings?: {
    description?: string;
    icons?: Icon[];
    entity_filter_mode?: 0 | 1;
    entity_filters?: Array<{ index: number; name: string }>;
    trees_and_rocks_only?: boolean;
    tile_filter_mode?: 0 | 1;
    tile_filters?: Array<{ index: number; name: string }>;
    tile_selection_mode?: 0 | 1 | 2 | 3;
  };
}

// ── Top-Level Discriminated Union ──────────────────────────────────────────

export type BlueprintString =
  | { blueprint: Blueprint }
  | { blueprint_book: BlueprintBook }
  | { upgrade_planner: UpgradePlanner }
  | { deconstruction_planner: DeconstructionPlanner };
