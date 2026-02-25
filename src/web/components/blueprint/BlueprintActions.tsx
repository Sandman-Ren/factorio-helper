import { useState, useCallback } from 'react';
import type { BlueprintType, BlueprintNode } from '../../hooks/useBlueprintEditor.js';
import type { Blueprint } from '../../../blueprint/index.js';
import {
  translateToOrigin,
  rotate90CW,
  rotate90CCW,
  mirrorHorizontal,
  mirrorVertical,
  getEntityNames,
  removeByType,
  replaceEntity,
  getTileNames,
  addTilesUnderEntities,
  addTilesFillBounds,
  removeTilesByType,
  clearAllTiles,
} from '../../../blueprint/index.js';
import { Button, Input, Label } from '../../ui/index.js';
import CrosshairIcon from 'lucide-react/dist/esm/icons/crosshair';
import RotateCwIcon from 'lucide-react/dist/esm/icons/rotate-cw';
import RotateCcwIcon from 'lucide-react/dist/esm/icons/rotate-ccw';
import FlipHorizontal2Icon from 'lucide-react/dist/esm/icons/flip-horizontal-2';
import FlipVertical2Icon from 'lucide-react/dist/esm/icons/flip-vertical-2';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import ArrowRightLeftIcon from 'lucide-react/dist/esm/icons/arrow-right-left';
import GridIcon from 'lucide-react/dist/esm/icons/grid-3x3';
import SquareIcon from 'lucide-react/dist/esm/icons/square';
import XIcon from 'lucide-react/dist/esm/icons/x';

const SELECT_CLASS = "bg-input/30 border-input text-foreground h-8 rounded-md border px-2 text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none";

const COMMON_TILES = ["landfill", "stone-path", "concrete", "hazard-concrete-left", "refined-concrete", "refined-hazard-concrete-left"];

interface BlueprintActionsProps {
  node: BlueprintNode;
  nodeType: BlueprintType;
  onUpdate: (updater: (node: BlueprintNode, type: BlueprintType) => BlueprintNode) => void;
}

export function BlueprintActions({ node, nodeType, onUpdate }: BlueprintActionsProps) {
  const isBlueprint = nodeType === 'blueprint';
  const bp = isBlueprint ? (node as Blueprint) : null;
  const hasEntities = bp && ((bp.entities?.length ?? 0) > 0 || (bp.tiles?.length ?? 0) > 0);
  const entityNames = bp ? getEntityNames(bp) : [];
  const tileNames = bp ? getTileNames(bp) : [];

  const [removeTarget, setRemoveTarget] = useState('');
  const [replaceFrom, setReplaceFrom] = useState('');
  const [replaceTo, setReplaceTo] = useState('');
  const [addTileName, setAddTileName] = useState('landfill');
  const [removeTileTarget, setRemoveTileTarget] = useState('');

  const makeTransformHandler = useCallback(
    (fn: (bp: Blueprint) => Blueprint) => () => {
      onUpdate((n, type) => {
        if (type !== 'blueprint') return n;
        return fn(n as Blueprint);
      });
    },
    [onUpdate],
  );

  const handleRemove = useCallback(() => {
    if (!removeTarget) return;
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return removeByType(n as Blueprint, removeTarget);
    });
    setRemoveTarget('');
  }, [onUpdate, removeTarget]);

  const handleReplace = useCallback(() => {
    if (!replaceFrom || !replaceTo) return;
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return replaceEntity(n as Blueprint, replaceFrom, replaceTo);
    });
    setReplaceFrom('');
    setReplaceTo('');
  }, [onUpdate, replaceFrom, replaceTo]);

  const handleAddTilesUnder = useCallback(() => {
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return addTilesUnderEntities(n as Blueprint, addTileName);
    });
  }, [onUpdate, addTileName]);

  const handleAddTilesFill = useCallback(() => {
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return addTilesFillBounds(n as Blueprint, addTileName);
    });
  }, [onUpdate, addTileName]);

  const handleRemoveTiles = useCallback(() => {
    if (!removeTileTarget) return;
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return removeTilesByType(n as Blueprint, removeTileTarget);
    });
    setRemoveTileTarget('');
  }, [onUpdate, removeTileTarget]);

  const handleClearTiles = useCallback(() => {
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return clearAllTiles(n as Blueprint);
    });
  }, [onUpdate]);

  if (!isBlueprint || !hasEntities) return null;

  return (
    <div className="space-y-2">
      {/* Transform buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Transforms</span>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(translateToOrigin)}>
          <CrosshairIcon className="size-3.5 mr-1.5" />
          Re-center
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(rotate90CW)}>
          <RotateCwIcon className="size-3.5 mr-1.5" />
          CW
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(rotate90CCW)}>
          <RotateCcwIcon className="size-3.5 mr-1.5" />
          CCW
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(mirrorHorizontal)}>
          <FlipHorizontal2Icon className="size-3.5 mr-1.5" />
          Flip H
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(mirrorVertical)}>
          <FlipVertical2Icon className="size-3.5 mr-1.5" />
          Flip V
        </Button>
      </div>

      {/* Entity operations */}
      {entityNames.length > 0 && (
        <div className="flex items-end gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1 self-center">Entities</span>

          <div className="flex items-end gap-1">
            <div>
              <Label className="text-xs text-muted-foreground">Remove</Label>
              <select className={SELECT_CLASS} value={removeTarget} onChange={e => setRemoveTarget(e.target.value)}>
                <option value="">Select entity...</option>
                {entityNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemove} disabled={!removeTarget}>
              <Trash2Icon className="size-3.5 mr-1.5" />
              Remove
            </Button>
          </div>

          <div className="flex items-end gap-1">
            <div>
              <Label className="text-xs text-muted-foreground">Replace</Label>
              <select className={SELECT_CLASS} value={replaceFrom} onChange={e => setReplaceFrom(e.target.value)}>
                <option value="">From...</option>
                {entityNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">With</Label>
              <Input
                className="h-8 w-40 text-xs"
                value={replaceTo}
                onChange={e => setReplaceTo(e.target.value)}
                placeholder="fast-transport-belt"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleReplace} disabled={!replaceFrom || !replaceTo}>
              <ArrowRightLeftIcon className="size-3.5 mr-1.5" />
              Replace
            </Button>
          </div>
        </div>
      )}

      {/* Tile operations */}
      <div className="flex items-end gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1 self-center">Tiles</span>

        <div className="flex items-end gap-1">
          <div>
            <Label className="text-xs text-muted-foreground">Add</Label>
            <select className={SELECT_CLASS} value={addTileName} onChange={e => setAddTileName(e.target.value)}>
              {COMMON_TILES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddTilesUnder} disabled={!bp?.entities?.length}>
            <SquareIcon className="size-3.5 mr-1.5" />
            Under entities
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddTilesFill}>
            <GridIcon className="size-3.5 mr-1.5" />
            Fill bounds
          </Button>
        </div>

        {tileNames.length > 0 && (
          <div className="flex items-end gap-1">
            <div>
              <Label className="text-xs text-muted-foreground">Remove</Label>
              <select className={SELECT_CLASS} value={removeTileTarget} onChange={e => setRemoveTileTarget(e.target.value)}>
                <option value="">Select tile...</option>
                {tileNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemoveTiles} disabled={!removeTileTarget}>
              <Trash2Icon className="size-3.5 mr-1.5" />
              Remove
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearTiles}>
              <XIcon className="size-3.5 mr-1.5" />
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
