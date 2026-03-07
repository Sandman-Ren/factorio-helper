import type { Technology } from '../../../data/schema.js';

/** Research time for a single technology (seconds), or null if not computable. */
export function getTechResearchTime(tech: Technology): number | null {
  if (!tech.unit || tech.unit.count == null) return null;
  return tech.unit.count * tech.unit.time;
}

/**
 * Cumulative research time to unlock a technology, including all prerequisites.
 * Returns seconds with 1 lab at speed 1.0. Returns null if any tech in the
 * chain uses a count_formula (infinite/variable cost).
 */
export function getCumulativeResearchTime(
  tech: Technology,
  techMap: Map<string, Technology>,
): number | null {
  const visited = new Set<string>();
  let total = 0;

  const stack = [tech.name];
  while (stack.length > 0) {
    const name = stack.pop()!;
    if (visited.has(name)) continue;
    visited.add(name);

    const t = techMap.get(name);
    if (!t) continue;

    const time = getTechResearchTime(t);
    if (time != null) {
      total += time;
    } else if (t.unit?.count_formula) {
      // Can't sum infinite/formula-based techs
      return null;
    }
    // research_trigger techs contribute 0s — just traverse their prereqs

    for (const prereq of t.prerequisites) {
      stack.push(prereq);
    }
  }

  return total;
}

/** Format seconds into a human-readable duration string. */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return s > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}
