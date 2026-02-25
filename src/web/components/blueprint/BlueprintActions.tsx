import { useCallback } from 'react';
import type { BlueprintType, BlueprintNode } from '../../hooks/useBlueprintEditor.js';
import type { Blueprint } from '../../../blueprint/index.js';
import { translateToOrigin } from '../../../blueprint/transforms.js';
import { Button } from '../../ui/index.js';
import CrosshairIcon from 'lucide-react/dist/esm/icons/crosshair';

interface BlueprintActionsProps {
  node: BlueprintNode;
  nodeType: BlueprintType;
  onUpdate: (updater: (node: BlueprintNode, type: BlueprintType) => BlueprintNode) => void;
}

export function BlueprintActions({ node, nodeType, onUpdate }: BlueprintActionsProps) {
  const isBlueprint = nodeType === 'blueprint';
  const bp = isBlueprint ? (node as Blueprint) : null;
  const hasEntities = bp && ((bp.entities?.length ?? 0) > 0 || (bp.tiles?.length ?? 0) > 0);

  const handleRecenter = useCallback(() => {
    onUpdate((n, type) => {
      if (type !== 'blueprint') return n;
      return translateToOrigin(n as Blueprint);
    });
  }, [onUpdate]);

  if (!isBlueprint || !hasEntities) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground mr-1">Actions</span>
      <Button variant="outline" size="sm" onClick={handleRecenter}>
        <CrosshairIcon className="size-3.5 mr-1.5" />
        Re-center
      </Button>
    </div>
  );
}
