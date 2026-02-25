import type { Blueprint } from "./types";

/**
 * Get a sorted array of unique entity names in the blueprint.
 */
export function getEntityNames(bp: Blueprint): string[] {
  if (!bp.entities || bp.entities.length === 0) return [];
  const names = new Set<string>();
  for (const e of bp.entities) names.add(e.name);
  return [...names].sort();
}

/**
 * Remove all entities matching the given name.
 * Re-numbers remaining entities sequentially.
 * Returns a new blueprint; the input is not mutated.
 */
export function removeByType(bp: Blueprint, entityName: string): Blueprint {
  if (!bp.entities) return bp;
  const filtered = bp.entities.filter((e) => e.name !== entityName);
  if (filtered.length === bp.entities.length) return bp;
  return {
    ...bp,
    entities: filtered.map((e, i) => ({ ...e, entity_number: i + 1 })),
  };
}

/**
 * Replace all entities of one type with another type.
 * Returns a new blueprint; the input is not mutated.
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
