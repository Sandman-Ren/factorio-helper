import { getIconUrl } from '../../ItemIcon.js';
import { getEntitySize } from '../../../../data/entity-sizes.js';
import { TILE_SIZE } from './constants.js';

interface PlacementGhostProps {
  entityName: string;
  worldX: number;
  worldY: number;
  direction: number;
}

/** Snap world coordinate to entity grid center based on tile size. */
export function snapToGrid(world: number, tileSize: number): number {
  if (tileSize % 2 === 1) {
    // Odd-width entities center on half-tile: snap to x.5
    return Math.round(world - 0.5) + 0.5;
  }
  // Even-width entities center on tile edge: snap to integer
  return Math.round(world);
}

export function PlacementGhost({ entityName, worldX, worldY, direction }: PlacementGhostProps) {
  const deg = direction * 22.5;
  const [tw, th] = getEntitySize(entityName);
  const pixW = tw * TILE_SIZE;
  const pixH = th * TILE_SIZE;
  const snappedX = snapToGrid(worldX, tw);
  const snappedY = snapToGrid(worldY, th);
  const left = (snappedX - tw / 2) * TILE_SIZE;
  const top = (snappedY - th / 2) * TILE_SIZE;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: pixW,
        height: pixH,
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
        width={pixW}
        height={pixH}
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
