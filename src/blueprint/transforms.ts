import type { Blueprint, Position } from "./types";

/**
 * Compute the bounding box of all entities and tiles in a blueprint.
 * Returns null if the blueprint has no entities or tiles.
 */
export function computeBounds(bp: Blueprint): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  const positions: Position[] = [];
  if (bp.entities) {
    for (const e of bp.entities) positions.push(e.position);
  }
  if (bp.tiles) {
    for (const t of bp.tiles) positions.push(t.position);
  }
  if (positions.length === 0) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of positions) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Translate all entity and tile positions so the minimum position is at the origin (0, 0).
 * Returns a new blueprint; the input is not mutated.
 */
export function translateToOrigin(bp: Blueprint): Blueprint {
  const bounds = computeBounds(bp);
  if (!bounds) return bp;

  const dx = -bounds.minX;
  const dy = -bounds.minY;
  if (dx === 0 && dy === 0) return bp;

  return translateBy(bp, dx, dy);
}

/**
 * Translate all entity and tile positions by a fixed offset.
 * Returns a new blueprint; the input is not mutated.
 */
export function translateBy(bp: Blueprint, dx: number, dy: number): Blueprint {
  if (dx === 0 && dy === 0) return bp;

  const result = { ...bp };

  if (result.entities) {
    result.entities = result.entities.map((e) => ({
      ...e,
      position: { x: e.position.x + dx, y: e.position.y + dy },
    }));
  }

  if (result.tiles) {
    result.tiles = result.tiles.map((t) => ({
      ...t,
      position: { x: t.position.x + dx, y: t.position.y + dy },
    }));
  }

  return result;
}
