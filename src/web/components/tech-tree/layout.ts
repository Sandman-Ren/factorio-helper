import dagre from '@dagrejs/dagre';
import type { Technology } from '../../../data/schema.js';
import type { TechNode, TechEdge, TechNodeData } from './types.js';
import { formatName } from './format.js';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

export function layoutTechTree(technologies: Technology[]): { nodes: TechNode[]; edges: TechEdge[] } {
  const techMap = new Map(technologies.map(t => [t.name, t]));

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 80 });

  // Add nodes
  for (const tech of technologies) {
    g.setNode(tech.name, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // Add edges (prerequisite -> technology)
  const edges: TechEdge[] = [];
  for (const tech of technologies) {
    for (const prereq of tech.prerequisites) {
      if (techMap.has(prereq)) {
        const edgeId = `${prereq}->${tech.name}`;
        g.setEdge(prereq, tech.name);
        edges.push({
          id: edgeId,
          source: prereq,
          target: tech.name,
          type: 'default',
        });
      }
    }
  }

  dagre.layout(g);

  const nodes: TechNode[] = technologies.map(tech => {
    const pos = g.node(tech.name);
    return {
      id: tech.name,
      type: 'tech' as const,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
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
