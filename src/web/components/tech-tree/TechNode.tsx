import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { TechNode as TechNodeType, TechNodeData } from './types.js';
import { getIconUrl } from '../ItemIcon.js';

/** Science pack colors for the pip indicators. */
const SCIENCE_COLORS: Record<string, string> = {
  'automation-science-pack': '#e05050',
  'logistic-science-pack': '#50c850',
  'military-science-pack': '#404040',
  'chemical-science-pack': '#50b0e0',
  'production-science-pack': '#c050c0',
  'utility-science-pack': '#e0c020',
  'space-science-pack': '#e0e0e0',
  'metallurgic-science-pack': '#e09030',
  'electromagnetic-science-pack': '#80cef0',
  'agricultural-science-pack': '#87d88b',
  'cryogenic-science-pack': '#a0d0f0',
  'promethium-science-pack': '#ff8080',
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
              title={ing.name.replace(/-/g, ' ')}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: SCIENCE_COLORS[ing.name] ?? '#888',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
      )}

      {technology.research_trigger && sciencePacks.length === 0 && (
        <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>
          {technology.research_trigger.type.replace(/-/g, ' ')}
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
      src={getIconUrl(name)}
      alt=""
      width={size}
      height={size}
      style={{ verticalAlign: 'middle', imageRendering: 'pixelated', flexShrink: 0 }}
      onError={() => setFailed(true)}
    />
  );
}

export const TechNodeRenderer = memo(TechNodeComponent);
