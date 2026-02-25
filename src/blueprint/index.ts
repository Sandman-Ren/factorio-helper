// Codec
export { decode, encode } from "./codec";

// Version utilities
export {
  decodeVersion,
  encodeVersion,
  FACTORIO_2_0_VERSION,
  formatVersion,
} from "./version";

// Builders
export { BlueprintBookBuilder, BlueprintBuilder } from "./builder";

// Wire helpers
export { connectGreen, connectPower, connectRed } from "./wire";

// Transforms
export {
  computeBounds,
  mirrorHorizontal,
  mirrorVertical,
  rotate90CCW,
  rotate90CW,
  translateBy,
  translateToOrigin,
} from "./transforms";

// Entity operations
export { getEntityNames, removeByType, replaceEntity } from "./entity-ops";

// Types
export type {
  AlertParameters,
  AsteroidChunkFilter,
  Blueprint,
  BlueprintBook,
  BlueprintBookChild,
  BlueprintString,
  Color,
  Comparator,
  Condition,
  ControlBehavior,
  DeciderCondition,
  DeciderOutput,
  DeconstructionPlanner,
  DisplayPanelMessage,
  Entity,
  EquipmentComponent,
  Icon,
  IdParameter,
  InsertPlan,
  Inventory,
  InventoryPosition,
  ItemAndQualityId,
  ItemFilter,
  ItemInventoryPositions,
  LogisticFilter,
  LogisticSection,
  Mapper,
  MapperFromId,
  MapperToId,
  NetworkSpecification,
  NumberParameter,
  Position,
  QualityFilter,
  QualityName,
  RequestFilters,
  Schedule,
  SignalID,
  SignalType,
  SpacePlatformInterrupt,
  SpacePlatformSchedule,
  SpacePlatformStop,
  SpacePlatformWaitCondition,
  SpacePlatformWaitConditionType,
  SpeakerParameters,
  StockConnection,
  Tile,
  TrainInterrupt,
  TrainInterruptCondition,
  TrainInterruptConditionType,
  TrainSchedule,
  TrainScheduleStop,
  TrainWaitCondition,
  TrainWaitConditionType,
  UpgradePlanner,
  WireConnection,
} from "./types";

// Re-export enums (const enums are erased at runtime, but re-exporting
// makes them available for consumers using the same TypeScript config)
export { Direction, WireConnectorId } from "./types";
