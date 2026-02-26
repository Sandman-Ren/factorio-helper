import { Direction } from "./types";
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

/** Avoid JavaScript's -0 in position values. */
function n(v: number): number {
  return v === 0 ? 0 : v;
}

// ── Direction helpers ──────────────────────────────────────────────────────

/** Rotate a 16-direction value clockwise by 90 degrees (add 4, mod 16). */
function rotateDirCW(dir: Direction): Direction {
  return ((dir + 4) % 16) as Direction;
}

/** Rotate a 16-direction value counter-clockwise by 90 degrees (add 12, mod 16). */
function rotateDirCCW(dir: Direction): Direction {
  return ((dir + 12) % 16) as Direction;
}

// Horizontal mirror: flip East↔West. For 16-direction, reflect across the N-S axis.
// Formula: (16 - dir) % 16
function mirrorDirH(dir: Direction): Direction {
  return ((16 - dir) % 16) as Direction;
}

// Vertical mirror: flip North↔South. For 16-direction, reflect across the E-W axis.
// Formula: (8 - dir + 16) % 16 = (24 - dir) % 16
function mirrorDirV(dir: Direction): Direction {
  return ((24 - dir) % 16) as Direction;
}

/** Mirror an orientation (0..1 float) horizontally. */
function mirrorOrientationH(o: number): number {
  return o === 0 ? 0 : 1 - o;
}

/** Mirror an orientation (0..1 float) vertically. */
function mirrorOrientationV(o: number): number {
  return (0.5 - o + 1) % 1;
}

// ── Rotation ───────────────────────────────────────────────────────────────

/**
 * Rotate all entity and tile positions 90° clockwise around the blueprint center.
 * Also rotates entity directions and orientations.
 * The result is then translated back to the origin.
 */
export function rotate90CW(bp: Blueprint): Blueprint {
  const result = { ...bp };

  if (result.entities) {
    result.entities = result.entities.map((e) => ({
      ...e,
      // CW rotation: (x, y) → (-y, x)
      position: { x: n(-e.position.y), y: e.position.x },
      ...(e.direction != null ? { direction: rotateDirCW(e.direction) } : {}),
      ...(e.orientation != null ? { orientation: (e.orientation + 0.25) % 1 } : {}),
    }));
  }

  if (result.tiles) {
    result.tiles = result.tiles.map((t) => ({
      ...t,
      position: { x: n(-t.position.y), y: t.position.x },
    }));
  }

  if (result["snap-to-grid"]) {
    const snap = result["snap-to-grid"];
    result["snap-to-grid"] = { x: snap.y, y: snap.x };
  }

  return translateToOrigin(result);
}

/**
 * Rotate all entity and tile positions 90° counter-clockwise around the blueprint center.
 * Also rotates entity directions and orientations.
 * The result is then translated back to the origin.
 */
export function rotate90CCW(bp: Blueprint): Blueprint {
  const result = { ...bp };

  if (result.entities) {
    result.entities = result.entities.map((e) => ({
      ...e,
      // CCW rotation: (x, y) → (y, -x)
      position: { x: e.position.y, y: n(-e.position.x) },
      ...(e.direction != null ? { direction: rotateDirCCW(e.direction) } : {}),
      ...(e.orientation != null ? { orientation: (e.orientation + 0.75) % 1 } : {}),
    }));
  }

  if (result.tiles) {
    result.tiles = result.tiles.map((t) => ({
      ...t,
      position: { x: t.position.y, y: n(-t.position.x) },
    }));
  }

  if (result["snap-to-grid"]) {
    const snap = result["snap-to-grid"];
    result["snap-to-grid"] = { x: snap.y, y: snap.x };
  }

  return translateToOrigin(result);
}

// ── Mirror ─────────────────────────────────────────────────────────────────

/**
 * Mirror a blueprint horizontally (flip left↔right, across the vertical center axis).
 * Negates X positions, mirrors entity directions and orientations.
 * The result is then translated back to the origin.
 */
export function mirrorHorizontal(bp: Blueprint): Blueprint {
  const result = { ...bp };

  if (result.entities) {
    result.entities = result.entities.map((e) => ({
      ...e,
      position: { x: n(-e.position.x), y: e.position.y },
      ...(e.direction != null ? { direction: mirrorDirH(e.direction) } : {}),
      ...(e.orientation != null ? { orientation: mirrorOrientationH(e.orientation) } : {}),
    }));
  }

  if (result.tiles) {
    result.tiles = result.tiles.map((t) => ({
      ...t,
      position: { x: n(-t.position.x), y: t.position.y },
    }));
  }

  return translateToOrigin(result);
}

/**
 * Mirror a blueprint vertically (flip top↔bottom, across the horizontal center axis).
 * Negates Y positions, mirrors entity directions and orientations.
 * The result is then translated back to the origin.
 */
export function mirrorVertical(bp: Blueprint): Blueprint {
  const result = { ...bp };

  if (result.entities) {
    result.entities = result.entities.map((e) => ({
      ...e,
      position: { x: e.position.x, y: n(-e.position.y) },
      ...(e.direction != null ? { direction: mirrorDirV(e.direction) } : {}),
      ...(e.orientation != null ? { orientation: mirrorOrientationV(e.orientation) } : {}),
    }));
  }

  if (result.tiles) {
    result.tiles = result.tiles.map((t) => ({
      ...t,
      position: { x: t.position.x, y: n(-t.position.y) },
    }));
  }

  return translateToOrigin(result);
}
