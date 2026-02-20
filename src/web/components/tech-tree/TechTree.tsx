import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type ReactFlowInstance,
  type NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TechNodeRenderer } from './TechNode.js';
import { TechDetailPanel } from './TechDetailPanel.js';
import { useTechTree } from './use-tech-tree.js';
import type { TechNode } from './types.js';
import { Input } from '../../ui/index.js';

const nodeTypes = { tech: TechNodeRenderer };

interface TechTreeProps {
  onCalculateRecipe?: (recipeName: string) => void;
  pendingTechSelect?: string | null;
  onPendingHandled?: () => void;
}

export function TechTree({ onCalculateRecipe, pendingTechSelect, onPendingHandled }: TechTreeProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    selectedTech,
    selectTech,
    clearSelection,
    searchQuery,
    updateSearch,
  } = useTechTree();

  const searchRef = useRef<HTMLInputElement>(null);
  const rfInstance = useRef<ReactFlowInstance<TechNode> | null>(null);

  const zoomToTech = useCallback((techName: string) => {
    const instance = rfInstance.current;
    if (!instance) return;
    const node = instance.getNode(techName);
    if (!node) return;
    const x = node.position.x + (node.measured?.width ?? 180) / 2;
    const y = node.position.y + (node.measured?.height ?? 60) / 2;
    instance.setCenter(x, y, { zoom: 1.2, duration: 400 });
  }, []);

  useEffect(() => {
    if (pendingTechSelect) {
      selectTech(pendingTechSelect);
      onPendingHandled?.();
    }
  }, [pendingTechSelect, selectTech, onPendingHandled]);

  const onNodeClick: NodeMouseHandler<TechNode> = useCallback(
    (_event, node) => {
      selectTech(node.id);
    },
    [selectTech],
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Search overlay */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          width: 280,
        }}
      >
        <Input
          ref={searchRef}
          placeholder="Search technologies..."
          value={searchQuery}
          onChange={e => updateSearch(e.target.value)}
          className="bg-card/90 backdrop-blur-sm"
        />
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onInit={instance => { rfInstance.current = instance; }}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { stroke: 'var(--border)', strokeWidth: 1 },
        }}
      >
        <Background color="var(--border)" gap={20} size={1} />
        <Controls
          showInteractive={false}
          style={{ bottom: 12, left: 12 }}
        />
        <MiniMap
          nodeColor={node => {
            if (node.data?.selected) return 'var(--primary)';
            if (node.data?.highlighted) return 'var(--factorio-orange-bright)';
            if (node.data?.dimmed) return 'var(--accent)';
            return 'var(--card)';
          }}
          maskColor="rgba(0,0,0,0.6)"
          style={{ bottom: 12, right: 12 }}
        />
      </ReactFlow>

      <TechDetailPanel
        technology={selectedTech}
        open={selectedTech != null}
        onClose={clearSelection}
        onCalculateRecipe={onCalculateRecipe}
        onZoomToTech={zoomToTech}
      />
    </div>
  );
}
