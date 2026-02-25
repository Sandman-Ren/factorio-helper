import type { Technology } from '../../../data/schema.js';
import type { TechNode, TechEdge, TechNodeData } from './types.js';
import { formatName } from './format.js';
import techTreeLayout from '../../../data/generated/tech-tree-layout.json';

const layout = techTreeLayout as {
  positions: Record<string, { x: number; y: number }>;
  edges: { source: string; target: string }[];
};

export function buildTechTree(technologies: Technology[]): { nodes: TechNode[]; edges: TechEdge[] } {
  const nodes: TechNode[] = technologies.map(tech => {
    const pos = layout.positions[tech.name];
    if (!pos && import.meta.env.DEV) {
      console.warn(`[tech-tree] Missing layout position for "${tech.name}", falling back to (0,0)`);
    }

    return {
      id: tech.name,
      type: 'tech' as const,
      position: pos ?? { x: 0, y: 0 },
      data: {
        label: formatName(tech.name),
        technology: tech,
        highlighted: false,
        dimmed: false,
        selected: false,
      } satisfies TechNodeData,
      draggable: false,
    };
  });

  const edges: TechEdge[] = layout.edges.map(e => ({
    id: `${e.source}->${e.target}`,
    source: e.source,
    target: e.target,
    type: 'default',
  }));

  return { nodes, edges };
}

/** Walk up the prerequisite DAG and return all ancestor technology names. */
export function getPrerequisiteChain(
  techName: string,
  techMap: Map<string, Technology>,
): Set<string> {
  const chain = new Set<string>();
  const stack = [techName];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (chain.has(current)) continue;
    chain.add(current);
    const tech = techMap.get(current);
    if (tech) {
      for (const prereq of tech.prerequisites) {
        if (!chain.has(prereq)) stack.push(prereq);
      }
    }
  }
  return chain;
}
