import { getIconUrl } from '../../ItemIcon.js';
import { TILE_SIZE } from './constants.js';

interface PlacementGhostProps {
  entityName: string;
  worldX: number;
  worldY: number;
  direction: number;
}

export function PlacementGhost({ entityName, worldX, worldY, direction }: PlacementGhostProps) {
  const deg = direction * 22.5;
  // Snap to 0.5 grid (center of 1x1 entity)
  const snappedX = Math.round(worldX - 0.5) + 0.5;
  const snappedY = Math.round(worldY - 0.5) + 0.5;
  const left = (snappedX - 0.5) * TILE_SIZE;
  const top = (snappedY - 0.5) * TILE_SIZE;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: TILE_SIZE,
        height: TILE_SIZE,
        opacity: 0.5,
        pointerEvents: 'none',
        outline: '2px solid var(--primary)',
        outlineOffset: -1,
        borderRadius: 2,
      }}
    >
      <img
        src={getIconUrl(entityName)}
        alt=""
        width={TILE_SIZE}
        height={TILE_SIZE}
        style={{
          imageRendering: 'pixelated',
          transform: deg ? `rotate(${deg}deg)` : undefined,
        }}
        draggable={false}
      />
    </div>
  );
}

/** Convert screen coordinates to world tile coordinates */
export function screenToWorld(
  clientX: number,
  clientY: number,
  viewportRect: DOMRect,
  panX: number,
  panY: number,
  zoom: number,
): { x: number; y: number } {
  return {
    x: (clientX - viewportRect.left - panX) / zoom / TILE_SIZE,
    y: (clientY - viewportRect.top - panY) / zoom / TILE_SIZE,
  };
}
