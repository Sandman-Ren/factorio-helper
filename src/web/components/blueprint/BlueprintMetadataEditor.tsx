import { useCallback } from 'react';
import type { BlueprintType, BlueprintNode } from '../../hooks/useBlueprintEditor.js';
import type { Blueprint, BlueprintBook, UpgradePlanner, DeconstructionPlanner } from '../../../blueprint/index.js';
import { Card, CardContent, CardHeader, CardTitle, Badge, Input, Label } from '../../ui/index.js';

const TYPE_LABELS: Record<BlueprintType, string> = {
  blueprint: 'Blueprint',
  blueprint_book: 'Blueprint Book',
  upgrade_planner: 'Upgrade Planner',
  deconstruction_planner: 'Deconstruction Planner',
};

interface BlueprintMetadataEditorProps {
  node: BlueprintNode;
  nodeType: BlueprintType;
  onUpdate: (updater: (node: BlueprintNode, type: BlueprintType) => BlueprintNode) => void;
}

function getLabel(node: BlueprintNode): string {
  return node.label ?? '';
}

function getDescription(node: BlueprintNode, nodeType: BlueprintType): string {
  if (nodeType === 'upgrade_planner' || nodeType === 'deconstruction_planner') {
    return (node as UpgradePlanner | DeconstructionPlanner).settings?.description ?? '';
  }
  return (node as Blueprint | BlueprintBook).description ?? '';
}

function hasSnapToGrid(node: BlueprintNode, nodeType: BlueprintType): boolean {
  return nodeType === 'blueprint' && !!(node as Blueprint)['snap-to-grid'];
}

function getSnapToGrid(node: BlueprintNode): { x: number; y: number } {
  const bp = node as Blueprint;
  return bp['snap-to-grid'] ?? { x: 1, y: 1 };
}

export function BlueprintMetadataEditor({ node, nodeType, onUpdate }: BlueprintMetadataEditorProps) {
  const label = getLabel(node);
  const description = getDescription(node, nodeType);
  const snap = hasSnapToGrid(node, nodeType) ? getSnapToGrid(node) : null;

  const handleLabelChange = useCallback((value: string) => {
    onUpdate((n) => {
      const updated = { ...n };
      if (value) {
        updated.label = value;
      } else {
        delete updated.label;
      }
      return updated;
    });
  }, [onUpdate]);

  const handleDescriptionChange = useCallback((value: string) => {
    onUpdate((n, type) => {
      if (type === 'upgrade_planner' || type === 'deconstruction_planner') {
        const planner = n as UpgradePlanner | DeconstructionPlanner;
        return {
          ...planner,
          settings: {
            ...planner.settings,
            description: value || undefined,
          },
        };
      }
      const bp = n as Blueprint | BlueprintBook;
      const updated = { ...bp };
      if (value) {
        updated.description = value;
      } else {
        delete updated.description;
      }
      return updated;
    });
  }, [onUpdate]);

  const handleSnapXChange = useCallback((value: number) => {
    onUpdate((n) => {
      const bp = { ...n } as Blueprint;
      bp['snap-to-grid'] = { x: value, y: bp['snap-to-grid']?.y ?? 1 };
      return bp;
    });
  }, [onUpdate]);

  const handleSnapYChange = useCallback((value: number) => {
    onUpdate((n) => {
      const bp = { ...n } as Blueprint;
      bp['snap-to-grid'] = { x: bp['snap-to-grid']?.x ?? 1, y: value };
      return bp;
    });
  }, [onUpdate]);

  const handleToggleSnap = useCallback(() => {
    onUpdate((n) => {
      const bp = { ...n } as Blueprint;
      if (bp['snap-to-grid']) {
        delete bp['snap-to-grid'];
        delete bp['absolute-snapping'];
        delete bp['position-relative-to-grid'];
      } else {
        bp['snap-to-grid'] = { x: 1, y: 1 };
      }
      return bp;
    });
  }, [onUpdate]);

  const handleToggleAbsolute = useCallback(() => {
    onUpdate((n) => {
      const bp = { ...n } as Blueprint;
      if (bp['absolute-snapping']) {
        delete bp['absolute-snapping'];
      } else {
        bp['absolute-snapping'] = true;
      }
      return bp;
    });
  }, [onUpdate]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TYPE_LABELS[nodeType]}</Badge>
          <CardTitle className="text-sm">Edit Metadata</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Label</Label>
          <Input
            value={label}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder="Blueprint name..."
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <textarea
            className="bg-input/30 border-input text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-y mt-1"
            rows={3}
            value={description}
            onChange={e => handleDescriptionChange(e.target.value)}
            placeholder="Description..."
          />
        </div>

        {nodeType === 'blueprint' && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label className="text-xs text-muted-foreground">Snap to Grid</Label>
              <button
                onClick={handleToggleSnap}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  snap ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-foreground transition-transform ${
                    snap ? 'translate-x-[18px]' : 'translate-x-[3px]'
                  }`}
                />
              </button>
            </div>
            {snap && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">X</Label>
                  <Input
                    type="number"
                    min={1}
                    value={snap.x}
                    onChange={e => handleSnapXChange(Number(e.target.value) || 1)}
                    className="w-16"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Y</Label>
                  <Input
                    type="number"
                    min={1}
                    value={snap.y}
                    onChange={e => handleSnapYChange(Number(e.target.value) || 1)}
                    className="w-16"
                  />
                </div>
                <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!(node as Blueprint)['absolute-snapping']}
                    onChange={handleToggleAbsolute}
                    className="accent-primary"
                  />
                  Absolute
                </label>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
