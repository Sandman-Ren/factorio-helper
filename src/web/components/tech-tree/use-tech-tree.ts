import { useState, useMemo, useCallback } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Technology } from '../../../data/schema.js';
import type { TechNode, TechEdge } from './types.js';
import { layoutTechTree, getPrerequisiteChain } from './layout.js';
import { formatName } from './format.js';
import technologiesData from '../../../data/generated/technologies.json';

export function useTechTree() {
  const technologies = technologiesData as Technology[];

  const techMap = useMemo(
    () => new Map(technologies.map(t => [t.name, t])),
    [technologies],
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutTechTree(technologies),
    [technologies],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<TechNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TechEdge>(initialEdges);

  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const applyHighlights = useCallback(
    (selected: string | null, search: string) => {
      const lowerSearch = search.toLowerCase().trim();
      const hasSearch = lowerSearch.length > 0;

      // Build combined prerequisite chain from selection + search matches
      const chainSet = new Set<string>();
      const searchMatches = new Set<string>();

      if (selected) {
        for (const name of getPrerequisiteChain(selected, techMap)) {
          chainSet.add(name);
        }
      }

      if (hasSearch) {
        for (const [name] of techMap) {
          const label = formatName(name).toLowerCase();
          if (label.includes(lowerSearch) || name.includes(lowerSearch)) {
            searchMatches.add(name);
            for (const chainName of getPrerequisiteChain(name, techMap)) {
              chainSet.add(chainName);
            }
          }
        }
      }

      const hasChain = chainSet.size > 0;

      setNodes(prev =>
        prev.map(node => {
          const isSelected = node.id === selected || searchMatches.has(node.id);
          const isHighlighted = hasChain && chainSet.has(node.id) && !isSelected;
          const isDimmed = (hasChain && !chainSet.has(node.id)) ||
            (hasSearch && !searchMatches.has(node.id) && !hasChain);

          if (
            node.data.highlighted === isHighlighted &&
            node.data.dimmed === isDimmed &&
            node.data.selected === isSelected
          ) {
            return node;
          }

          return {
            ...node,
            data: {
              ...node.data,
              highlighted: isHighlighted,
              dimmed: isDimmed,
              selected: isSelected,
            },
          };
        }),
      );

      setEdges(prev =>
        prev.map(edge => {
          const inChain = hasChain &&
            chainSet.has(edge.source) &&
            chainSet.has(edge.target);

          const newStyle = inChain
            ? { stroke: 'var(--factorio-orange-bright)', strokeWidth: 2 }
            : { stroke: 'var(--border)', strokeWidth: 1 };

          const newAnimated = inChain;

          if (
            edge.style?.stroke === newStyle.stroke &&
            edge.style?.strokeWidth === newStyle.strokeWidth &&
            edge.animated === newAnimated
          ) {
            return edge;
          }

          return { ...edge, style: newStyle, animated: newAnimated };
        }),
      );
    },
    [techMap, setNodes, setEdges],
  );

  const selectTech = useCallback(
    (techName: string) => {
      const tech = techMap.get(techName) ?? null;
      setSelectedTech(tech);
      applyHighlights(techName, searchQuery);
    },
    [techMap, searchQuery, applyHighlights],
  );

  const clearSelection = useCallback(() => {
    setSelectedTech(null);
    applyHighlights(null, searchQuery);
  }, [searchQuery, applyHighlights]);

  const updateSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      applyHighlights(selectedTech?.name ?? null, query);
    },
    [selectedTech, applyHighlights],
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    selectedTech,
    selectTech,
    clearSelection,
    searchQuery,
    updateSearch,
  };
}
