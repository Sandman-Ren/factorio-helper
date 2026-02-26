import type { Blueprint, Entity, WireConnection } from "./types";
import { getUpgrade, getDowngrade } from "../data/entity-sizes";

/**
 * Get a sorted array of unique entity names in the blueprint.
 */
export function getEntityNames(bp: Blueprint): string[] {
  if (!bp.entities || bp.entities.length === 0) return [];
  const names = new Set<string>();
  for (const e of bp.entities) names.add(e.name);
  return [...names].sort();
}

/** Build a renumber mapping and fix wires accordingly. */
function renumberEntities(
  entities: Entity[],
  wires?: WireConnection[],
): { entities: Entity[]; wires?: WireConnection[] } {
  const mapping = new Map<number, number>();
  const newEntities = entities.map((e, i) => {
    const newNum = i + 1;
    mapping.set(e.entity_number, newNum);
    return { ...e, entity_number: newNum };
  });
  const newWires = remapWires(wires, mapping);
  return { entities: newEntities, wires: newWires };
}

/** Remap wire entity references using a number mapping. Drops wires with unmapped endpoints. */
function remapWires(
  wires: WireConnection[] | undefined,
  mapping: Map<number, number>,
): WireConnection[] | undefined {
  if (!wires || wires.length === 0) return wires;
  const result: WireConnection[] = [];
  for (const [e1, c1, e2, c2] of wires) {
    const ne1 = mapping.get(e1);
    const ne2 = mapping.get(e2);
    if (ne1 !== undefined && ne2 !== undefined) {
      result.push([ne1, c1, ne2, c2]);
    }
  }
  return result.length > 0 ? result : undefined;
}

/**
 * Remove all entities matching the given name.
 * Re-numbers remaining entities and fixes wire references.
 */
export function removeByType(bp: Blueprint, entityName: string): Blueprint {
  if (!bp.entities) return bp;
  const filtered = bp.entities.filter((e) => e.name !== entityName);
  if (filtered.length === bp.entities.length) return bp;
  const { entities, wires } = renumberEntities(filtered, bp.wires);
  return { ...bp, entities, wires };
}

/**
 * Replace all entities of one type with another type.
 */
export function replaceEntity(
  bp: Blueprint,
  fromName: string,
  toName: string,
): Blueprint {
  if (!bp.entities || fromName === toName) return bp;
  let changed = false;
  const entities = bp.entities.map((e) => {
    if (e.name !== fromName) return e;
    changed = true;
    return { ...e, name: toName };
  });
  return changed ? { ...bp, entities } : bp;
}

/**
 * Remove entities by entity_number set.
 * Re-numbers remaining entities and fixes wire references.
 */
export function removeEntities(bp: Blueprint, entityNumbers: ReadonlySet<number>): Blueprint {
  if (!bp.entities || entityNumbers.size === 0) return bp;
  const filtered = bp.entities.filter((e) => !entityNumbers.has(e.entity_number));
  if (filtered.length === bp.entities.length) return bp;
  const { entities, wires } = renumberEntities(filtered, bp.wires);
  return { ...bp, entities, wires };
}

/**
 * Move entities by entity_number set, applying a delta to their positions.
 */
export function moveEntities(
  bp: Blueprint,
  entityNumbers: ReadonlySet<number>,
  dx: number,
  dy: number,
): Blueprint {
  if (!bp.entities || entityNumbers.size === 0 || (dx === 0 && dy === 0)) return bp;
  const entities = bp.entities.map((e) => {
    if (!entityNumbers.has(e.entity_number)) return e;
    return { ...e, position: { x: e.position.x + dx, y: e.position.y + dy } };
  });
  return { ...bp, entities };
}

/**
 * Rotate selected entities' direction in-place (not position).
 */
export function rotateEntities(
  bp: Blueprint,
  entityNumbers: ReadonlySet<number>,
  clockwise = true,
): Blueprint {
  if (!bp.entities || entityNumbers.size === 0) return bp;
  const step = clockwise ? 4 : 12;
  const entities = bp.entities.map((e) => {
    if (!entityNumbers.has(e.entity_number)) return e;
    const dir = ((e.direction ?? 0) + step) % 16;
    return { ...e, direction: dir };
  });
  return { ...bp, entities };
}

/**
 * Clone entities at an offset. Wire connections within the cloned group are preserved.
 */
export function cloneEntities(
  bp: Blueprint,
  entityNumbers: ReadonlySet<number>,
  dx: number,
  dy: number,
): Blueprint {
  if (!bp.entities || entityNumbers.size === 0) return bp;
  const sourceEntities = bp.entities.filter((e) => entityNumbers.has(e.entity_number));
  const nextNum = bp.entities.length + 1;

  // Build mapping from old entity_number to new entity_number
  const mapping = new Map<number, number>();
  sourceEntities.forEach((e, i) => mapping.set(e.entity_number, nextNum + i));

  const cloned = sourceEntities.map((e, i) => ({
    ...e,
    entity_number: nextNum + i,
    position: { x: e.position.x + dx, y: e.position.y + dy },
  }));

  // Clone internal wires (both endpoints in the cloned set)
  const clonedWires = remapWires(
    bp.wires?.filter(([e1, , e2]) => entityNumbers.has(e1) && entityNumbers.has(e2)),
    mapping,
  );

  return {
    ...bp,
    entities: [...bp.entities, ...cloned],
    wires: bp.wires || clonedWires
      ? [...(bp.wires ?? []), ...(clonedWires ?? [])]
      : undefined,
  };
}

/**
 * Add a new entity to the blueprint. Auto-assigns the next entity_number.
 */
export function addEntity(bp: Blueprint, entity: Omit<Entity, 'entity_number'>): Blueprint {
  const entities = bp.entities ?? [];
  const nextNum = entities.length > 0 ? Math.max(...entities.map(e => e.entity_number)) + 1 : 1;
  return {
    ...bp,
    entities: [...entities, { ...entity, entity_number: nextNum } as Entity],
  };
}

/**
 * Update properties of a single entity by entity_number.
 */
export function updateEntity(
  bp: Blueprint,
  entityNumber: number,
  updates: Partial<Entity>,
): Blueprint {
  if (!bp.entities) return bp;
  const entities = bp.entities.map((e) => {
    if (e.entity_number !== entityNumber) return e;
    return { ...e, ...updates };
  });
  return { ...bp, entities };
}

// ── Wire Operations ───────────────────────────────────────────────────────

/** Check if two wire connections are the same (order-independent). */
function wiresEqual(a: WireConnection, b: WireConnection): boolean {
  return (
    (a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]) ||
    (a[0] === b[2] && a[1] === b[3] && a[2] === b[0] && a[3] === b[1])
  );
}

/**
 * Add a wire connection between two entities.
 * Returns the same blueprint if the wire already exists.
 */
export function addWire(
  bp: Blueprint,
  wire: WireConnection,
): Blueprint {
  const existing = bp.wires ?? [];
  if (existing.some(w => wiresEqual(w, wire))) return bp;
  return { ...bp, wires: [...existing, wire] };
}

/**
 * Remove a specific wire connection.
 * Matches regardless of endpoint order.
 */
export function removeWire(
  bp: Blueprint,
  wire: WireConnection,
): Blueprint {
  if (!bp.wires) return bp;
  const filtered = bp.wires.filter(w => !wiresEqual(w, wire));
  if (filtered.length === bp.wires.length) return bp;
  return { ...bp, wires: filtered.length > 0 ? filtered : undefined };
}

/**
 * Toggle a wire connection — add if absent, remove if present.
 */
export function toggleWire(
  bp: Blueprint,
  wire: WireConnection,
): Blueprint {
  const existing = bp.wires ?? [];
  if (existing.some(w => wiresEqual(w, wire))) {
    return removeWire(bp, wire);
  }
  return addWire(bp, wire);
}

// ── Upgrade / Downgrade ───────────────────────────────────────────────────

/**
 * Upgrade all entities one tier (e.g. transport-belt → fast-transport-belt).
 * Entities without an upgrade path are left unchanged.
 * Returns the number of entities upgraded via the optional counter.
 */
export function upgradeEntities(bp: Blueprint): { bp: Blueprint; count: number } {
  if (!bp.entities) return { bp, count: 0 };
  let count = 0;
  const entities = bp.entities.map((e) => {
    const up = getUpgrade(e.name);
    if (!up) return e;
    count++;
    return { ...e, name: up };
  });
  return count > 0 ? { bp: { ...bp, entities }, count } : { bp, count: 0 };
}

/**
 * Downgrade all entities one tier (e.g. fast-transport-belt → transport-belt).
 */
export function downgradeEntities(bp: Blueprint): { bp: Blueprint; count: number } {
  if (!bp.entities) return { bp, count: 0 };
  let count = 0;
  const entities = bp.entities.map((e) => {
    const down = getDowngrade(e.name);
    if (!down) return e;
    count++;
    return { ...e, name: down };
  });
  return count > 0 ? { bp: { ...bp, entities }, count } : { bp, count: 0 };
}
