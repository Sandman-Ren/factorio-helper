import { useState } from 'react';
import type { Entity } from '../../../../blueprint/types.js';
import { getIconUrl } from '../../ItemIcon.js';
import { TILE_SIZE } from './constants.js';

interface BlueprintEntityLayerProps {
  entities: Entity[];
  selectedEntityNumbers: ReadonlySet<number>;
  onEntitySelect: (entity: Entity, ctrlKey: boolean) => void;
  onEntityHover: (entity: Entity | null) => void;
}

function directionToDegrees(direction: number | undefined): number {
  return (direction ?? 0) * 22.5;
}

function EntityIcon({ entity, isSelected, onSelect, onHover }: {
  entity: Entity;
  isSelected: boolean;
  onSelect: (entity: Entity, ctrlKey: boolean) => void;
  onHover: (entity: Entity | null) => void;
}) {
  const [failed, setFailed] = useState(false);
  const deg = directionToDegrees(entity.direction);
  const left = (entity.position.x - 0.5) * TILE_SIZE;
  const top = (entity.position.y - 0.5) * TILE_SIZE;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: TILE_SIZE,
        height: TILE_SIZE,
        cursor: 'pointer',
        outline: isSelected ? '2px solid var(--primary)' : undefined,
        outlineOffset: -1,
        borderRadius: 2,
        zIndex: isSelected ? 10 : undefined,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(entity, e.ctrlKey || e.metaKey); }}
      onMouseEnter={() => onHover(entity)}
      onMouseLeave={() => onHover(null)}
    >
      {failed ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--muted)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 8,
            color: 'var(--muted-foreground)',
            overflow: 'hidden',
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          {entity.name.replace(/-/g, ' ')}
        </div>
      ) : (
        <img
          src={getIconUrl(entity.name)}
          alt={entity.name.replace(/-/g, ' ')}
          width={TILE_SIZE}
          height={TILE_SIZE}
          style={{
            imageRendering: 'pixelated',
            transform: deg ? `rotate(${deg}deg)` : undefined,
          }}
          onError={() => setFailed(true)}
          draggable={false}
        />
      )}
    </div>
  );
}

export function BlueprintEntityLayer({
  entities,
  selectedEntityNumbers,
  onEntitySelect,
  onEntityHover,
}: BlueprintEntityLayerProps) {
  return (
    <>
      {entities.map((entity) => (
        <EntityIcon
          key={entity.entity_number}
          entity={entity}
          isSelected={selectedEntityNumbers.has(entity.entity_number)}
          onSelect={onEntitySelect}
          onHover={onEntityHover}
        />
      ))}
    </>
  );
}
