import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Input, Button } from '../../ui/index.js';
import CrosshairIcon from 'lucide-react/dist/esm/icons/crosshair';

const STORAGE_KEY = 'techTree.autoFocus';

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

  const [autoFocus, setAutoFocus] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'false'; }
    catch { return true; }
  });

  const toggleAutoFocus = useCallback(() => {
    setAutoFocus(prev => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const zoomToTech = useCallback((techName: string) => {
    const instance = rfInstance.current;
    if (!instance) return;
    const node = instance.getNode(techName);
    if (!node) return;
    const x = node.position.x + (node.measured?.width ?? 180) / 2;
    const y = node.position.y + (node.measured?.height ?? 60) / 2;
    instance.setCenter(x, y, { zoom: 1.2, duration: 400 });
  }, []);

  const handledPendingRef = useRef<string | null>(null);
  useEffect(() => {
    if (pendingTechSelect && pendingTechSelect !== handledPendingRef.current) {
      handledPendingRef.current = pendingTechSelect;
      selectTech(pendingTechSelect);
      onPendingHandled?.();
    }
  }, [pendingTechSelect, selectTech, onPendingHandled]);

  const onNodeClick: NodeMouseHandler<TechNode> = useCallback(
    (_event, node) => {
      selectTech(node.id);
      if (autoFocus) zoomToTech(node.id);
    },
    [selectTech, autoFocus, zoomToTech],
  );

  const navigateToTech = useCallback((name: string) => {
    selectTech(name);
    zoomToTech(name);
  }, [selectTech, zoomToTech]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Input
          ref={searchRef}
          placeholder="Search technologies..."
          value={searchQuery}
          onChange={e => updateSearch(e.target.value)}
          className="bg-card/90 backdrop-blur-sm"
          style={{ width: 280 }}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleAutoFocus}
          title={autoFocus ? 'Auto-focus on select: ON' : 'Auto-focus on select: OFF'}
          className="bg-card/90 backdrop-blur-sm"
          style={{ opacity: autoFocus ? 1 : 0.5 }}
        >
          <CrosshairIcon />
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
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
          pannable
          zoomable
          nodeColor={node => {
            if (node.data?.selected) return 'var(--primary)';
            if (node.data?.highlighted) return 'var(--factorio-orange-bright)';
            if (node.data?.dimmed) return 'var(--accent)';
            return 'var(--card)';
          }}
          maskColor="color-mix(in srgb, var(--background) 60%, transparent)"
          style={{ bottom: 12, right: 12 }}
        />
      </ReactFlow>

      <TechDetailPanel
        technology={selectedTech}
        open={selectedTech != null}
        onClose={clearSelection}
        onCalculateRecipe={onCalculateRecipe}
        onZoomToTech={zoomToTech}
        onSelectTech={navigateToTech}
      />
    </div>
  );
}
