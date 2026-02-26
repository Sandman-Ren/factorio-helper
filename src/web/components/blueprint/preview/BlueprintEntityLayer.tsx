import { useState } from 'react';
import type { Entity } from '../../../../blueprint/types.js';
import { getIconUrl } from '../../ItemIcon.js';
import { getEntitySize } from '../../../../data/entity-sizes.js';
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
  const [tw, th] = getEntitySize(entity.name);
  const pixW = tw * TILE_SIZE;
  const pixH = th * TILE_SIZE;
  const left = (entity.position.x - tw / 2) * TILE_SIZE;
  const top = (entity.position.y - th / 2) * TILE_SIZE;

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={entity.name.replace(/-/g, ' ')}
      style={{
        position: 'absolute',
        left,
        top,
        width: pixW,
        height: pixH,
        cursor: 'pointer',
        outline: isSelected ? '2px solid var(--primary)' : undefined,
        outlineOffset: -1,
        borderRadius: 2,
        zIndex: isSelected ? 10 : undefined,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(entity, e.ctrlKey || e.metaKey); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect(entity, e.ctrlKey || e.metaKey); } }}
      onMouseEnter={() => onHover(entity)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(entity)}
      onBlur={() => onHover(null)}
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
          width={pixW}
          height={pixH}
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
