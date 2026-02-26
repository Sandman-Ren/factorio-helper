import { computeBounds } from "./transforms";
import type { Blueprint, Tile } from "./types";

/**
 * Get a sorted array of unique tile names in the blueprint.
 */
export function getTileNames(bp: Blueprint): string[] {
  if (!bp.tiles || bp.tiles.length === 0) return [];
  const names = new Set<string>();
  for (const t of bp.tiles) names.add(t.name);
  return [...names].sort();
}

/**
 * Add a tile at every entity position that doesn't already have a tile.
 * Uses Math.floor on entity positions (entities are half-tile offset, tiles are integer).
 * Returns a new blueprint; the input is not mutated.
 */
export function addTilesUnderEntities(
  bp: Blueprint,
  tileName = "landfill",
): Blueprint {
  if (!bp.entities || bp.entities.length === 0) return bp;

  const existing = new Set<string>();
  if (bp.tiles) {
    for (const t of bp.tiles) existing.add(`${t.position.x},${t.position.y}`);
  }

  const newTiles: Tile[] = [];
  for (const e of bp.entities) {
    const tx = Math.floor(e.position.x);
    const ty = Math.floor(e.position.y);
    const key = `${tx},${ty}`;
    if (!existing.has(key)) {
      existing.add(key);
      newTiles.push({ name: tileName, position: { x: tx, y: ty } });
    }
  }

  if (newTiles.length === 0) return bp;
  return { ...bp, tiles: [...(bp.tiles ?? []), ...newTiles] };
}

/**
 * Add tiles filling the entire bounding box of entities and existing tiles.
 * Skips positions that already have a tile.
 * Returns a new blueprint; the input is not mutated.
 */
export function addTilesFillBounds(
  bp: Blueprint,
  tileName = "landfill",
): Blueprint {
  const bounds = computeBounds(bp);
  if (!bounds) return bp;

  const existing = new Set<string>();
  if (bp.tiles) {
    for (const t of bp.tiles) existing.add(`${t.position.x},${t.position.y}`);
  }

  const minX = Math.floor(bounds.minX);
  const minY = Math.floor(bounds.minY);
  const maxX = Math.floor(bounds.maxX);
  const maxY = Math.floor(bounds.maxY);

  const newTiles: Tile[] = [];
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      const key = `${x},${y}`;
      if (!existing.has(key)) {
        existing.add(key);
        newTiles.push({ name: tileName, position: { x, y } });
      }
    }
  }

  if (newTiles.length === 0) return bp;
  return { ...bp, tiles: [...(bp.tiles ?? []), ...newTiles] };
}

/**
 * Remove all tiles matching the given name.
 * Returns a new blueprint; the input is not mutated.
 */
export function removeTilesByType(bp: Blueprint, tileName: string): Blueprint {
  if (!bp.tiles) return bp;
  const filtered = bp.tiles.filter((t) => t.name !== tileName);
  if (filtered.length === bp.tiles.length) return bp;
  return { ...bp, tiles: filtered.length > 0 ? filtered : undefined };
}

/**
 * Remove all tiles from the blueprint.
 * Returns a new blueprint; the input is not mutated.
 */
export function clearAllTiles(bp: Blueprint): Blueprint {
  if (!bp.tiles || bp.tiles.length === 0) return bp;
  const { tiles: _, ...rest } = bp;
  return rest as Blueprint;
}
