import dagre from '@dagrejs/dagre';

export interface TechPosition {
  x: number;
  y: number;
}

export interface TechLayoutEdge {
  source: string;
  target: string;
}

export interface TechTreeLayout {
  positions: Record<string, TechPosition>;
  edges: TechLayoutEdge[];
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

/**
 * Run Dagre layout on the technology list and return pre-computed positions + edges.
 * Called at build time from extract-data.ts — keeps Dagre out of the browser bundle.
 */
export function generateTechLayout(
  technologies: { name: string; prerequisites: string[] }[],
): TechTreeLayout {
  const techNames = new Set(technologies.map(t => t.name));

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 30, ranksep: 80 });

  for (const tech of technologies) {
    g.setNode(tech.name, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edges: TechLayoutEdge[] = [];
  for (const tech of technologies) {
    for (const prereq of tech.prerequisites) {
      if (techNames.has(prereq)) {
        g.setEdge(prereq, tech.name);
        edges.push({ source: prereq, target: tech.name });
      }
    }
  }

  dagre.layout(g);

  const positions: Record<string, TechPosition> = {};
  for (const tech of technologies) {
    const pos = g.node(tech.name);
    // Dagre returns center positions — convert to top-left for React Flow
    positions[tech.name] = {
      x: pos.x - NODE_WIDTH / 2,
      y: pos.y - NODE_HEIGHT / 2,
    };
  }

  return { positions, edges };
}
