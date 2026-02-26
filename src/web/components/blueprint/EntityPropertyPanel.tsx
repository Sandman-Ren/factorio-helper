import { useCallback } from 'react';
import type { Entity, Blueprint } from '../../../blueprint/types.js';
import { updateEntity } from '../../../blueprint/entity-ops.js';
import { getIconUrl } from '../ItemIcon.js';
import { Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/index.js';

interface EntityPropertyPanelProps {
  entity: Entity;
  onUpdate: (updater: (bp: Blueprint) => Blueprint) => void;
}

const DIRECTION_LABELS: Record<number, string> = {
  0: 'North', 2: 'NE', 4: 'East', 6: 'SE',
  8: 'South', 10: 'SW', 12: 'West', 14: 'NW',
};

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="text-xs text-right">{children}</div>
    </div>
  );
}

export function EntityPropertyPanel({ entity, onUpdate }: EntityPropertyPanelProps) {
  const handleDirectionChange = useCallback((dir: string) => {
    onUpdate(bp => updateEntity(bp, entity.entity_number, { direction: Number(dir) }));
  }, [entity.entity_number, onUpdate]);

  const handleRecipeChange = useCallback((recipe: string) => {
    onUpdate(bp => updateEntity(bp, entity.entity_number, {
      recipe: recipe || undefined,
    }));
  }, [entity.entity_number, onUpdate]);

  const handleStationChange = useCallback((station: string) => {
    onUpdate(bp => updateEntity(bp, entity.entity_number, { station }));
  }, [entity.entity_number, onUpdate]);

  const hasDirection = entity.direction !== undefined || isDirectionalEntity(entity.name);

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 pb-1 border-b border-border">
        <img
          src={getIconUrl(entity.name)}
          alt=""
          width={24}
          height={24}
          style={{ imageRendering: 'pixelated' }}
          draggable={false}
        />
        <div>
          <div className="text-sm font-medium">{entity.name.replace(/-/g, ' ')}</div>
          <div className="text-xs text-muted-foreground">#{entity.entity_number}</div>
        </div>
      </div>

      {/* Position */}
      <PropertyRow label="Position">
        ({entity.position.x}, {entity.position.y})
      </PropertyRow>

      {/* Direction */}
      {hasDirection && (
        <PropertyRow label="Direction">
          <Select value={String(entity.direction ?? 0)} onValueChange={handleDirectionChange}>
            <SelectTrigger size="sm" className="h-7 text-xs min-w-[80px]" aria-label="Entity direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DIRECTION_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PropertyRow>
      )}

      {/* Recipe (assemblers/furnaces) */}
      {entity.recipe !== undefined && (
        <PropertyRow label="Recipe">
          <Input
            className="h-7 w-28 text-xs"
            value={entity.recipe ?? ''}
            onChange={e => handleRecipeChange(e.target.value)}
            placeholder="none"
            aria-label="Entity recipe"
            name="entity-recipe"
            autoComplete="off"
          />
        </PropertyRow>
      )}

      {/* Underground belt type */}
      {entity.type !== undefined && (
        <PropertyRow label="Type">
          <span className="text-xs">{entity.type}</span>
        </PropertyRow>
      )}

      {/* Splitter priorities */}
      {entity.input_priority !== undefined && (
        <PropertyRow label="Input priority">
          <span className="text-xs">{entity.input_priority}</span>
        </PropertyRow>
      )}
      {entity.output_priority !== undefined && (
        <PropertyRow label="Output priority">
          <span className="text-xs">{entity.output_priority}</span>
        </PropertyRow>
      )}

      {/* Train stop */}
      {entity.station !== undefined && (
        <PropertyRow label="Station">
          <Input
            className="h-7 w-28 text-xs"
            value={entity.station}
            onChange={e => handleStationChange(e.target.value)}
            aria-label="Train station name"
            name="station-name"
            autoComplete="off"
          />
        </PropertyRow>
      )}

      {/* Override stack size */}
      {entity.override_stack_size != null && (
        <PropertyRow label="Stack size">
          <span className="text-xs">{entity.override_stack_size}</span>
        </PropertyRow>
      )}

      {/* Quality */}
      {entity.quality && (
        <PropertyRow label="Quality">
          <span className="text-xs">{entity.quality}</span>
        </PropertyRow>
      )}
    </div>
  );
}

function isDirectionalEntity(name: string): boolean {
  return name.includes('belt') || name.includes('inserter') ||
    name.includes('splitter') || name.includes('loader') ||
    name.includes('pump') || name.includes('mining-drill') ||
    name.includes('assembling') || name.includes('chemical-plant') ||
    name.includes('oil-refinery') || name.includes('centrifuge');
}
