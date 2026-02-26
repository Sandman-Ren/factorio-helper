import type { Position } from '../../../../blueprint/types.js';
import { TILE_SIZE, WIRE_COLORS } from './constants.js';

interface WireToolOverlayProps {
  /** Entity position where wire starts */
  fromPos: Position;
  /** Current cursor world position (end of in-progress wire) */
  cursorWorld: { x: number; y: number };
  /** Wire color being drawn */
  color: 'red' | 'green' | 'copper';
}

/**
 * Renders a dashed line from the source entity to the cursor
 * while drawing a wire connection.
 */
export function WireToolOverlay({ fromPos, cursorWorld, color }: WireToolOverlayProps) {
  const x1 = fromPos.x * TILE_SIZE;
  const y1 = fromPos.y * TILE_SIZE;
  const x2 = cursorWorld.x * TILE_SIZE;
  const y2 = cursorWorld.y * TILE_SIZE;

  const minX = Math.min(x1, x2) - TILE_SIZE;
  const minY = Math.min(y1, y2) - TILE_SIZE;
  const maxX = Math.max(x1, x2) + TILE_SIZE;
  const maxY = Math.max(y1, y2) + TILE_SIZE;

  return (
    <svg
      style={{
        position: 'absolute',
        left: minX,
        top: minY,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      width={maxX - minX}
      height={maxY - minY}
    >
      <line
        x1={x1 - minX}
        y1={y1 - minY}
        x2={x2 - minX}
        y2={y2 - minY}
        stroke={WIRE_COLORS[color]}
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.8}
      />
      {/* Source entity dot */}
      <circle
        cx={x1 - minX}
        cy={y1 - minY}
        r={4}
        fill={WIRE_COLORS[color]}
        opacity={0.9}
      />
    </svg>
  );
}
