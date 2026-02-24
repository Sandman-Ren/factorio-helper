import { WireConnectorId, type WireConnection } from "./types";

/**
 * Create a red circuit wire connection between two entities.
 * For combinators, connects to the input side by default.
 */
export function connectRed(
  entity1: number,
  entity2: number,
  connector1: WireConnectorId = WireConnectorId.CircuitRed,
  connector2: WireConnectorId = WireConnectorId.CircuitRed,
): WireConnection {
  return [entity1, connector1, entity2, connector2];
}

/**
 * Create a green circuit wire connection between two entities.
 * For combinators, connects to the input side by default.
 */
export function connectGreen(
  entity1: number,
  entity2: number,
  connector1: WireConnectorId = WireConnectorId.CircuitGreen,
  connector2: WireConnectorId = WireConnectorId.CircuitGreen,
): WireConnection {
  return [entity1, connector1, entity2, connector2];
}

/**
 * Create a copper (power) wire connection between two electric poles.
 */
export function connectPower(
  entity1: number,
  entity2: number,
): WireConnection {
  return [
    entity1,
    WireConnectorId.PoleCopperOrPowerSwitchLeft,
    entity2,
    WireConnectorId.PoleCopperOrPowerSwitchLeft,
  ];
}
