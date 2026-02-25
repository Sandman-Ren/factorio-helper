import { useState, useCallback, useRef, useEffect } from 'react';
import type { Blueprint, Entity } from '../../../../blueprint/types.js';
import { useViewport } from './useViewport.js';
import { useBlueprintLayout } from './useBlueprintLayout.js';
import { BlueprintTileLayer } from './BlueprintTileLayer.js';
import { BlueprintEntityLayer } from './BlueprintEntityLayer.js';
import { BlueprintWireLayer } from './BlueprintWireLayer.js';
import { exportPreviewPng } from './exportImage.js';
import { TILE_SIZE } from './constants.js';
import { Button } from '../../../ui/index.js';
import MaximizeIcon from 'lucide-react/dist/esm/icons/maximize';
import DownloadIcon from 'lucide-react/dist/esm/icons/download';
import GridIcon from 'lucide-react/dist/esm/icons/grid-3x3';
import BoxIcon from 'lucide-react/dist/esm/icons/box';
import SquareIcon from 'lucide-react/dist/esm/icons/square';
import CableIcon from 'lucide-react/dist/esm/icons/cable';

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
  onEntityHover?: (entity: Entity | null) => void;
}

export function BlueprintPreview({
  blueprint,
  selectedEntityNumbers,
  onEntitySelect,
  onClearSelection,
  onEntityHover: onEntityHoverProp,
}: BlueprintPreviewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { panX, panY, zoom, isPanning, onWheel, onMouseDown, onMouseMove, onMouseUp, fitToBounds } = useViewport();
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

  const entities = blueprint.entities ?? [];
  const tiles = blueprint.tiles ?? [];

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Controls bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border">
        <span className="text-xs text-muted-foreground mr-1">Preview</span>
        <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleFit} title="Fit to view">
          <MaximizeIcon className="size-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleExport} disabled={exporting} title="Export as PNG">
          <DownloadIcon className="size-3.5" />
        </Button>
        <span className="w-px h-4 bg-border mx-0.5" />
        <Button
          variant={layers.grid ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('grid')}
          title="Toggle grid"
        >
          <GridIcon className="size-3.5" />
        </Button>
        <Button
          variant={layers.tiles ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('tiles')}
          title="Toggle tiles"
        >
          <SquareIcon className="size-3.5" />
        </Button>
        <Button
          variant={layers.entities ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('entities')}
          title="Toggle entities"
        >
          <BoxIcon className="size-3.5" />
        </Button>
        <Button
          variant={layers.wires ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 px-1.5"
          onClick={() => toggleLayer('wires')}
          title="Toggle wires"
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
        style={{
          position: 'relative',
          height: 400,
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : 'grab',
          backgroundColor: 'var(--background)',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onClearSelection}
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
              entityPositions={new Map()}
            />
          )}

          {/* Entities */}
          {layers.entities && entities.length > 0 && (
            <BlueprintEntityLayer
              entities={entities}
              selectedEntityNumbers={selectedEntityNumbers}
              onEntitySelect={onEntitySelect}
              onEntityHover={handleEntityHover}
            />
          )}
        </div>
      </div>
    </div>
  );
}
