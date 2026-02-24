import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TechNode as TechNodeType, TechNodeData } from './types.js';
function getTechIconUrl(name: string): string {
  return `${import.meta.env.BASE_URL}icons/technology/${name}.png`;
}
import { formatName } from './format.js';

/** Science pack colors for the pip indicators (CSS custom properties from app.css). */
const SCIENCE_COLORS: Record<string, string> = {
  'automation-science-pack': 'var(--color-science-automation)',
  'logistic-science-pack': 'var(--color-science-logistic)',
  'military-science-pack': 'var(--color-science-military)',
  'chemical-science-pack': 'var(--color-science-chemical)',
  'production-science-pack': 'var(--color-science-production)',
  'utility-science-pack': 'var(--color-science-utility)',
  'space-science-pack': 'var(--color-science-space)',
  'metallurgic-science-pack': 'var(--color-science-metallurgic)',
  'electromagnetic-science-pack': 'var(--color-science-electromagnetic)',
  'agricultural-science-pack': 'var(--color-science-agricultural)',
  'cryogenic-science-pack': 'var(--color-science-cryogenic)',
  'promethium-science-pack': 'var(--color-science-promethium)',
};

function TechNodeComponent({ data }: NodeProps<TechNodeType>) {
  const { label, technology, highlighted, dimmed, selected } = data as TechNodeData;

  const sciencePacks = technology.unit?.ingredients ?? [];

  let borderColor = 'var(--border)';
  let bgColor = 'var(--card)';
  let opacity = 1;

  if (selected) {
    borderColor = 'var(--primary)';
    bgColor = 'var(--factorio-selected)';
  } else if (highlighted) {
    borderColor = 'var(--factorio-orange-bright)';
  }

  if (dimmed) {
    opacity = 0.25;
  }

  return (
    <div
      style={{
        width: 200,
        height: 80,
        borderRadius: 'var(--radius)',
        border: `2px solid ${borderColor}`,
        backgroundColor: bgColor,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity,
        transition: 'opacity 0.15s, border-color 0.15s, background-color 0.15s',
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <TechIcon name={technology.name} size={24} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--foreground)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={label}
        >
          {label}
        </span>
      </div>

      {sciencePacks.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
          {sciencePacks.map(ing => (
            <div
              key={ing.name}
              title={formatName(ing.name)}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: SCIENCE_COLORS[ing.name] ?? 'var(--color-science-fallback)',
                border: '1px solid color-mix(in srgb, var(--foreground) 15%, transparent)',
              }}
            />
          ))}
        </div>
      )}

      {technology.research_trigger && sciencePacks.length === 0 && (
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>
          {formatName(technology.research_trigger.type)}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
    </div>
  );
}

/** Icon that silently hides if the image fails to load (no text fallback). */
function TechIcon({ name, size = 24 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={getTechIconUrl(name)}
      alt=""
      width={size}
      height={size}
      style={{ verticalAlign: 'middle', imageRendering: 'pixelated', flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  );
}

export const TechNodeRenderer = memo(TechNodeComponent);
