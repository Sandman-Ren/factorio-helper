import type { Node, Edge } from '@xyflow/react';
import type { Technology } from '../../../data/schema.js';

export interface TechNodeData extends Record<string, unknown> {
  label: string;
  technology: Technology;
  highlighted: boolean;
  dimmed: boolean;
  selected: boolean;
}

export type TechNode = Node<TechNodeData, 'tech'>;
export type TechEdge = Edge;
