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
  upgradeEntities,
  downgradeEntities,
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
import ArrowUpIcon from 'lucide-react/dist/esm/icons/arrow-up';
import ArrowDownIcon from 'lucide-react/dist/esm/icons/arrow-down';
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

  const handleUpgrade = useCallback(() => {
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return upgradeEntities(n as Blueprint).bp;
    });
  }, [onUpdate]);

  const handleDowngrade = useCallback(() => {
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return downgradeEntities(n as Blueprint).bp;
    });
  }, [onUpdate]);

  if (!isBlueprint || !hasEntities) return null;

  const labelClass = "text-xs text-muted-foreground shrink-0 w-[70px]";

  return (
    <div className="border-t border-border px-3 py-2 space-y-1.5">
      {/* Transforms */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={labelClass}>Transforms</span>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(translateToOrigin)}>
          <CrosshairIcon className="size-3.5 mr-1.5" aria-hidden="true" />
          Re-center
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(rotate90CW)}>
          <RotateCwIcon className="size-3.5 mr-1.5" aria-hidden="true" />
          CW
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(rotate90CCW)}>
          <RotateCcwIcon className="size-3.5 mr-1.5" aria-hidden="true" />
          CCW
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(mirrorHorizontal)}>
          <FlipHorizontal2Icon className="size-3.5 mr-1.5" aria-hidden="true" />
          Flip H
        </Button>
        <Button variant="outline" size="sm" onClick={makeTransformHandler(mirrorVertical)}>
          <FlipVertical2Icon className="size-3.5 mr-1.5" aria-hidden="true" />
          Flip V
        </Button>
      </div>

      {/* Entities — row 1: upgrade/downgrade + remove */}
      {entityNames.length > 0 && (
        <div className="flex items-end gap-2 flex-wrap">
          <span className={`${labelClass} self-center`}>Entities</span>
          <Button variant="outline" size="sm" className="self-center" onClick={handleUpgrade} title="Upgrade all entities one tier (belts, inserters, assemblers, etc.)">
            <ArrowUpIcon className="size-3.5 mr-1.5" aria-hidden="true" />
            Upgrade
          </Button>
          <Button variant="outline" size="sm" className="self-center" onClick={handleDowngrade} title="Downgrade all entities one tier">
            <ArrowDownIcon className="size-3.5 mr-1.5" aria-hidden="true" />
            Downgrade
          </Button>
          <span className="w-px h-5 bg-border self-center" />
          <div className="flex items-end gap-1">
            <div>
              <Label htmlFor="remove-entity" className="text-xs text-muted-foreground">Remove</Label>
              <select id="remove-entity" className={SELECT_CLASS} value={removeTarget} onChange={e => setRemoveTarget(e.target.value)}>
                <option value="">Select entity…</option>
                {entityNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemove} disabled={!removeTarget}>
              <Trash2Icon className="size-3.5 mr-1.5" aria-hidden="true" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {/* Entities — row 2: replace */}
      {entityNames.length > 0 && (
        <div className="flex items-end gap-2 flex-wrap pl-[78px]">
          <div className="flex items-end gap-1">
            <div>
              <Label htmlFor="replace-from" className="text-xs text-muted-foreground">Replace</Label>
              <select id="replace-from" className={SELECT_CLASS} value={replaceFrom} onChange={e => setReplaceFrom(e.target.value)}>
                <option value="">From…</option>
                {entityNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="replace-to" className="text-xs text-muted-foreground">With</Label>
              <Input
                id="replace-to"
                name="replace-to"
                className="h-8 w-40 text-xs"
                value={replaceTo}
                onChange={e => setReplaceTo(e.target.value)}
                placeholder="fast-transport-belt"
                autoComplete="off"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleReplace} disabled={!replaceFrom || !replaceTo}>
              <ArrowRightLeftIcon className="size-3.5 mr-1.5" aria-hidden="true" />
              Replace
            </Button>
          </div>
        </div>
      )}

      {/* Tiles — row 1: add */}
      <div className="flex items-end gap-2 flex-wrap">
        <span className={`${labelClass} self-center`}>Tiles</span>
        <div className="flex items-end gap-1">
          <div>
            <Label htmlFor="add-tile" className="text-xs text-muted-foreground">Add</Label>
            <select id="add-tile" className={SELECT_CLASS} value={addTileName} onChange={e => setAddTileName(e.target.value)}>
              {COMMON_TILES.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddTilesUnder} disabled={!bp?.entities?.length}>
            <SquareIcon className="size-3.5 mr-1.5" aria-hidden="true" />
            Under entities
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddTilesFill}>
            <GridIcon className="size-3.5 mr-1.5" aria-hidden="true" />
            Fill bounds
          </Button>
        </div>
      </div>

      {/* Tiles — row 2: remove (only when tiles exist) */}
      {tileNames.length > 0 && (
        <div className="flex items-end gap-2 flex-wrap pl-[78px]">
          <div className="flex items-end gap-1">
            <div>
              <Label htmlFor="remove-tile" className="text-xs text-muted-foreground">Remove</Label>
              <select id="remove-tile" className={SELECT_CLASS} value={removeTileTarget} onChange={e => setRemoveTileTarget(e.target.value)}>
                <option value="">Select tile…</option>
                {tileNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleRemoveTiles} disabled={!removeTileTarget}>
              <Trash2Icon className="size-3.5 mr-1.5" aria-hidden="true" />
              Remove
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearTiles}>
              <XIcon className="size-3.5 mr-1.5" aria-hidden="true" />
              Clear all
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
