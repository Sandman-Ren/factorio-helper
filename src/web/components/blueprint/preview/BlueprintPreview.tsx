import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Blueprint, Entity } from '../../../../blueprint/types.js';
import type { EditorMode } from '../../../hooks/useEditorMode.js';
import { useViewport } from './useViewport.js';
import { useBlueprintLayout } from './useBlueprintLayout.js';
import { BlueprintTileLayer } from './BlueprintTileLayer.js';
import { BlueprintEntityLayer } from './BlueprintEntityLayer.js';
import { BlueprintWireLayer } from './BlueprintWireLayer.js';
import { WireToolOverlay } from './WireToolOverlay.js';
import { PlacementGhost, screenToWorld, snapToGrid } from './PlacementGhost.js';
import { exportPreviewPng } from './exportImage.js';
import { getEntitySize } from '../../../../data/entity-sizes.js';
import { TILE_SIZE } from './constants.js';
import { Button } from '../../../ui/index.js';
import MaximizeIcon from 'lucide-react/dist/esm/icons/maximize';
import DownloadIcon from 'lucide-react/dist/esm/icons/download';
import GridIcon from 'lucide-react/dist/esm/icons/grid-3x3';
import BoxIcon from 'lucide-react/dist/esm/icons/box';
import SquareIcon from 'lucide-react/dist/esm/icons/square';
import CableIcon from 'lucide-react/dist/esm/icons/cable';

const EMPTY_POSITION_MAP = new Map<number, { x: number; y: number }>();

interface LayerVisibility {
  grid: boolean;
  tiles: boolean;
  entities: boolean;
  wires: boolean;
}

interface BlueprintPreviewProps {
  blueprint: Blueprint;
  selectedEntityNumbers: ReadonlySet<number>;
  onEntitySelect: (entity: Entity, ctrlKey: boolean) => void;
  onClearSelection: () => void;
  onBoxSelect?: (entityNumbers: number[]) => void;
  onEntityHover?: (entity: Entity | null) => void;
  editorMode?: EditorMode;
  onPlaceEntity?: (name: string, x: number, y: number, direction: number) => void;
  onWireConnect?: (fromEntityNumber: number, toEntityNumber: number) => void;
}

export function BlueprintPreview({
  blueprint,
  selectedEntityNumbers,
  onEntitySelect,
  onClearSelection,
  onBoxSelect,
  onEntityHover: onEntityHoverProp,
  editorMode,
  onPlaceEntity,
  onWireConnect,
}: BlueprintPreviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { panX, panY, zoom, isPanning, onMouseDown, onMouseMove, onMouseUp, fitToBounds } = useViewport(viewportRef);
  const { bounds, wireSegments } = useBlueprintLayout(blueprint);

  const [layers, setLayers] = useState<LayerVisibility>({
    grid: true,
    tiles: true,
    entities: true,
    wires: true,
  });
  const [hoveredEntity, setHoveredEntity] = useState<Entity | null>(null);

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleFit = useCallback(() => {
    if (!bounds || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    fitToBounds(bounds, rect.width, rect.height, TILE_SIZE);
  }, [bounds, fitToBounds]);

  // Auto-fit on first render when bounds are available
  const initialFitDone = useRef(false);
  useEffect(() => {
    if (bounds && !initialFitDone.current) {
      initialFitDone.current = true;
      requestAnimationFrame(handleFit);
    }
  }, [bounds, handleFit]);

  // Reset fit tracking when blueprint changes
  useEffect(() => {
    initialFitDone.current = false;
  }, [blueprint]);

  const handleEntityHover = useCallback((entity: Entity | null) => {
    setHoveredEntity(entity);
    onEntityHoverProp?.(entity);
  }, [onEntityHoverProp]);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportPreviewPng(blueprint, wireSegments, {
        showGrid: layers.grid,
        showTiles: layers.tiles,
        showEntities: layers.entities,
        showWires: layers.wires,
      });
    } finally {
      setExporting(false);
    }
  }, [blueprint, wireSegments, layers]);

  // Place mode: track cursor world position
  const isPlacing = editorMode?.type === 'place';
  const isWiring = editorMode?.type === 'wire';
  const [cursorWorld, setCursorWorld] = useState<{ x: number; y: number } | null>(null);

  // Wire mode: track the source entity for in-progress wire
  const [wireSourceEntity, setWireSourceEntity] = useState<number | null>(null);

  // Reset wire source when leaving wire mode
  useEffect(() => {
    if (!isWiring) setWireSourceEntity(null);
  }, [isWiring]);

  const entities = blueprint.entities ?? [];
  const tiles = blueprint.tiles ?? [];

  // Box-select: drag rectangle in select mode
  const isSelectMode = !isPlacing && !isWiring;
  const boxStartRef = useRef<{ sx: number; sy: number; wx: number; wy: number } | null>(null);
  const [boxRect, setBoxRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const handleViewportMouseDown = useCallback((e: React.MouseEvent) => {
    onMouseDown(e);
    // Start box-select on left click (no Alt) in select mode
    if (e.button === 0 && !e.altKey && isSelectMode && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      const world = screenToWorld(e.clientX, e.clientY, rect, panX, panY, zoom);
      boxStartRef.current = { sx: e.clientX, sy: e.clientY, wx: world.x, wy: world.y };
    }
  }, [onMouseDown, isSelectMode, panX, panY, zoom]);

  const handleViewportMouseMove = useCallback((e: React.MouseEvent) => {
    onMouseMove(e);
    if ((isPlacing || (isWiring && wireSourceEntity !== null)) && viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      setCursorWorld(screenToWorld(e.clientX, e.clientY, rect, panX, panY, zoom));
    }
    // Update box-select rectangle
    if (boxStartRef.current && viewportRef.current) {
      const start = boxStartRef.current;
      const dx = Math.abs(e.clientX - start.sx);
      const dy = Math.abs(e.clientY - start.sy);
      // Only show box after 5px drag threshold
      if (dx > 5 || dy > 5) {
        const rect = viewportRef.current.getBoundingClientRect();
        const end = screenToWorld(e.clientX, e.clientY, rect, panX, panY, zoom);
        setBoxRect({
          x: Math.min(start.wx, end.x),
          y: Math.min(start.wy, end.y),
          w: Math.abs(end.x - start.wx),
          h: Math.abs(end.y - start.wy),
        });
      }
    }
  }, [onMouseMove, isPlacing, isWiring, wireSourceEntity, panX, panY, zoom]);

  // In wire mode, entity clicks start/complete a wire instead of selecting
  const handleEntitySelectOrWire = useCallback((entity: Entity, ctrlKey: boolean) => {
    if (isWiring && onWireConnect) {
      if (wireSourceEntity === null) {
        setWireSourceEntity(entity.entity_number);
      } else if (entity.entity_number !== wireSourceEntity) {
        onWireConnect(wireSourceEntity, entity.entity_number);
        setWireSourceEntity(null);
        setCursorWorld(null);
      }
      return;
    }
    onEntitySelect(entity, ctrlKey);
  }, [isWiring, wireSourceEntity, onWireConnect, onEntitySelect]);

  const handleViewportMouseUp = useCallback((_e: React.MouseEvent) => {
    onMouseUp();
    // Complete box-select
    if (boxRect && onBoxSelect) {
      const bx2 = boxRect.x + boxRect.w;
      const by2 = boxRect.y + boxRect.h;
      const selected = entities
        .filter(ent => {
          const [tw, th] = getEntitySize(ent.name);
          const eMinX = ent.position.x - tw / 2;
          const eMaxX = ent.position.x + tw / 2;
          const eMinY = ent.position.y - th / 2;
          const eMaxY = ent.position.y + th / 2;
          return eMaxX >= boxRect.x && eMinX <= bx2 && eMaxY >= boxRect.y && eMinY <= by2;
        })
        .map(ent => ent.entity_number);
      if (selected.length > 0) onBoxSelect(selected);
    }
    boxStartRef.current = null;
    setBoxRect(null);
  }, [onMouseUp, boxRect, entities, onBoxSelect]);

  const handleViewportClick = useCallback((e: React.MouseEvent) => {
    // Skip click if we just completed a box-select drag
    if (boxRect) return;
    if (isPlacing && editorMode.type === 'place' && cursorWorld && onPlaceEntity) {
      e.stopPropagation();
      const [tw, th] = getEntitySize(editorMode.entityName);
      const snappedX = snapToGrid(cursorWorld.x, tw);
      const snappedY = snapToGrid(cursorWorld.y, th);
      onPlaceEntity(editorMode.entityName, snappedX, snappedY, editorMode.direction);
      return;
    }
    // In wire mode, clicking empty space cancels the in-progress wire
    if (isWiring && wireSourceEntity !== null) {
      setWireSourceEntity(null);
      setCursorWorld(null);
      return;
    }
    onClearSelection();
  }, [boxRect, isPlacing, isWiring, wireSourceEntity, editorMode, cursorWorld, onPlaceEntity, onClearSelection]);

  const handleViewportLeave = useCallback(() => {
    onMouseUp();
    setCursorWorld(null);
    if (isWiring) setWireSourceEntity(null);
    boxStartRef.current = null;
    setBoxRect(null);
  }, [onMouseUp, isWiring]);

  // Memoize wire tool overlay to avoid re-computing on unrelated renders
  const wireOverlay = useMemo(() => {
    if (!isWiring || wireSourceEntity === null || !cursorWorld || editorMode?.type !== 'wire') return null;
    const sourceEntity = entities.find(e => e.entity_number === wireSourceEntity);
    return sourceEntity
      ? <WireToolOverlay fromPos={sourceEntity.position} cursorWorld={cursorWorld} color={editorMode.color} />
      : null;
  }, [isWiring, wireSourceEntity, cursorWorld, editorMode, entities]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Controls bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
        <span className="text-xs text-muted-foreground mr-1">Preview</span>
        <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleFit} title="Fit to view" aria-label="Fit to view">
          <MaximizeIcon className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleExport} disabled={exporting} title="Export as PNG" aria-label="Export as PNG">
          <DownloadIcon className="size-3.5" />
        </Button>
        <span className="w-px h-4 bg-border mx-0.5" />
        <Button
          variant={layers.grid ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('grid')}
          title="Toggle grid"
          aria-label="Toggle grid"
        >
          <GridIcon className="size-3.5" />
        </Button>
        <Button
          variant={layers.tiles ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('tiles')}
          title="Toggle tiles"
          aria-label="Toggle tiles"
        >
          <SquareIcon className="size-3.5" />
        </Button>
        <Button
          variant={layers.entities ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('entities')}
          title="Toggle entities"
          aria-label="Toggle entities"
        >
          <BoxIcon className="size-3.5" />
        </Button>
        <Button
          variant={layers.wires ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('wires')}
          title="Toggle wires"
          aria-label="Toggle wires"
        >
          <CableIcon className="size-3.5" />
        </Button>

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground tabular-nums">
          {zoom < 1 ? `${Math.round(zoom * 100)}%` : `${zoom.toFixed(1)}x`}
        </span>

        {hoveredEntity && (
          <span className="text-xs text-muted-foreground ml-2 truncate" style={{ maxWidth: 200 }}>
            {hoveredEntity.name.replace(/-/g, ' ')}
            {hoveredEntity.recipe ? ` (${hoveredEntity.recipe})` : ''}
          </span>
        )}
      </div>

      {/* Viewport */}
      <div
        ref={viewportRef}
        role="img"
        aria-label="Blueprint preview — use mouse to pan and zoom"
        tabIndex={0}
        style={{
          position: 'relative',
          height: 400,
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : (isPlacing || isWiring) ? 'crosshair' : 'grab',
          backgroundColor: 'var(--background)',
        }}
        onMouseDown={handleViewportMouseDown}
        onMouseMove={handleViewportMouseMove}
        onMouseUp={handleViewportMouseUp}
        onMouseLeave={handleViewportLeave}
        onClick={handleViewportClick}
      >
        {/* World container — transformed by pan/zoom */}
        <div
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            willChange: 'transform',
            imageRendering: 'pixelated',
          }}
        >
          {/* Grid background */}
          {layers.grid && bounds && (
            <div
              style={{
                position: 'absolute',
                left: (bounds.minX - 1) * TILE_SIZE,
                top: (bounds.minY - 1) * TILE_SIZE,
                width: (bounds.maxX - bounds.minX + 3) * TILE_SIZE,
                height: (bounds.maxY - bounds.minY + 3) * TILE_SIZE,
                backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
                opacity: 0.3,
              }}
            />
          )}

          {/* Tiles */}
          {layers.tiles && tiles.length > 0 && (
            <BlueprintTileLayer tiles={tiles} />
          )}

          {/* Wires (behind entities) */}
          {layers.wires && wireSegments.length > 0 && (
            <BlueprintWireLayer
              wireSegments={wireSegments}
              highlightEntity={null}
              entityPositions={EMPTY_POSITION_MAP}
            />
          )}

          {/* Entities */}
          {layers.entities && entities.length > 0 && (
            <BlueprintEntityLayer
              entities={entities}
              selectedEntityNumbers={selectedEntityNumbers}
              onEntitySelect={handleEntitySelectOrWire}
              onEntityHover={handleEntityHover}
            />
          )}

          {/* Wire tool in-progress line */}
          {wireOverlay}

          {/* Box-select rectangle */}
          {boxRect && (
            <div
              style={{
                position: 'absolute',
                left: boxRect.x * TILE_SIZE,
                top: boxRect.y * TILE_SIZE,
                width: boxRect.w * TILE_SIZE,
                height: boxRect.h * TILE_SIZE,
                border: '1.5px dashed var(--primary)',
                backgroundColor: 'var(--primary)',
                opacity: 0.15,
                pointerEvents: 'none',
                borderRadius: 2,
              }}
            />
          )}

          {/* Placement ghost */}
          {isPlacing && editorMode.type === 'place' && cursorWorld && (
            <PlacementGhost
              entityName={editorMode.entityName}
              worldX={cursorWorld.x}
              worldY={cursorWorld.y}
              direction={editorMode.direction}
            />
          )}
        </div>
      </div>
    </div>
  );
}
