import { useState, useMemo, useCallback } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Technology } from '../../../data/schema.js';
import type { TechNode, TechEdge } from './types.js';
import { buildTechTree, getPrerequisiteChain } from './layout.js';
import { formatName } from './format.js';
import technologiesData from '../../../data/generated/technologies.json';

export function useTechTree() {
  const technologies = technologiesData as Technology[];

  const techMap = useMemo(
    () => new Map(technologies.map(t => [t.name, t])),
    [technologies],
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildTechTree(technologies),
    [technologies],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<TechNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TechEdge>(initialEdges);

  const [selectedTech, setSelectedTech] = useState<Technology | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubtreeFocused, setIsSubtreeFocused] = useState(false);

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

  const unfocusSubtree = useCallback(() => {
    setNodes(prev => {
      if (!prev.some(n => n.hidden)) return prev;
      return prev.map(node => node.hidden ? { ...node, hidden: false } : node);
    });
    setEdges(prev => {
      if (!prev.some(e => e.hidden)) return prev;
      return prev.map(edge => edge.hidden ? { ...edge, hidden: false } : edge);
    });
    setIsSubtreeFocused(false);
  }, [setNodes, setEdges]);

  const focusSubtree = useCallback(() => {
    if (!selectedTech) return;
    const chain = getPrerequisiteChain(selectedTech.name, techMap);

    setNodes(prev =>
      prev.map(node => {
        const shouldHide = !chain.has(node.id);
        if (node.hidden === shouldHide) return node;
        return { ...node, hidden: shouldHide };
      }),
    );
    setEdges(prev =>
      prev.map(edge => {
        const shouldHide = !chain.has(edge.source) || !chain.has(edge.target);
        if (edge.hidden === shouldHide) return edge;
        return { ...edge, hidden: shouldHide };
      }),
    );
    setIsSubtreeFocused(true);
  }, [selectedTech, techMap, setNodes, setEdges]);

  const clearSelection = useCallback(() => {
    setSelectedTech(null);
    applyHighlights(null, searchQuery);
    unfocusSubtree();
  }, [searchQuery, applyHighlights, unfocusSubtree]);

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
    techMap,
    isSubtreeFocused,
    focusSubtree,
    unfocusSubtree,
  };
}
