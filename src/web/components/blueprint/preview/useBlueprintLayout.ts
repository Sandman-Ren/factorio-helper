import { useMemo } from 'react';
import type { Blueprint, Entity, Position } from '../../../../blueprint/types.js';
import { WireConnectorId } from '../../../../blueprint/types.js';
import { computeBounds } from '../../../../blueprint/transforms.js';

export type WireColor = 'red' | 'green' | 'copper';

export interface WireSegment {
  from: Position;
  to: Position;
  color: WireColor;
}

function connectorColor(id: WireConnectorId): WireColor {
  switch (id) {
    case WireConnectorId.CircuitRed:
    case WireConnectorId.CombinatorOutputRed:
      return 'red';
    case WireConnectorId.CircuitGreen:
    case WireConnectorId.CombinatorOutputGreen:
      return 'green';
    case WireConnectorId.PoleCopperOrPowerSwitchLeft:
    case WireConnectorId.PowerSwitchRight:
      return 'copper';
  }
}

export function useBlueprintLayout(bp: Blueprint) {
  return useMemo(() => {
    const bounds = computeBounds(bp);

    // Entity lookup by entity_number
    const entityMap = new Map<number, Entity>();
    if (bp.entities) {
      for (const e of bp.entities) entityMap.set(e.entity_number, e);
    }

    // Wire segments
    const wireSegments: WireSegment[] = [];
    if (bp.wires) {
      for (const [e1, c1, e2] of bp.wires) {
        const from = entityMap.get(e1);
        const to = entityMap.get(e2);
        if (from && to) {
          wireSegments.push({
            from: from.position,
            to: to.position,
            color: connectorColor(c1),
          });
        }
      }
    }

    return { bounds, entityMap, wireSegments };
  }, [bp]);
}
