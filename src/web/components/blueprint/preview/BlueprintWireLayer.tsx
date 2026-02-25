import type { WireSegment } from './useBlueprintLayout.js';
import { TILE_SIZE, WIRE_COLORS } from './constants.js';

interface BlueprintWireLayerProps {
  wireSegments: WireSegment[];
  highlightEntity: number | null;
  entityPositions: Map<number, { x: number; y: number }>;
}

export function BlueprintWireLayer({ wireSegments }: BlueprintWireLayerProps) {
  if (wireSegments.length === 0) return null;

  // Compute SVG bounds from wire endpoints
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const seg of wireSegments) {
    const x1 = seg.from.x * TILE_SIZE, y1 = seg.from.y * TILE_SIZE;
    const x2 = seg.to.x * TILE_SIZE, y2 = seg.to.y * TILE_SIZE;
    if (x1 < minX) minX = x1; if (y1 < minY) minY = y1;
    if (x1 > maxX) maxX = x1; if (y1 > maxY) maxY = y1;
    if (x2 < minX) minX = x2; if (y2 < minY) minY = y2;
    if (x2 > maxX) maxX = x2; if (y2 > maxY) maxY = y2;
  }

  const pad = TILE_SIZE;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;

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
      {wireSegments.map((seg, i) => (
        <line
          key={i}
          x1={seg.from.x * TILE_SIZE - minX}
          y1={seg.from.y * TILE_SIZE - minY}
          x2={seg.to.x * TILE_SIZE - minX}
          y2={seg.to.y * TILE_SIZE - minY}
          stroke={WIRE_COLORS[seg.color]}
          strokeWidth={1.5}
          opacity={0.8}
        />
      ))}
    </svg>
  );
}
