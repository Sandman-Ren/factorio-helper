import { useState } from 'react';
import type { ProductionNode } from '../../calculator/types.js';
import type { TimeUnit } from '../hooks/useCalculator.js';

interface Props {
  node: ProductionNode;
  timeUnit: TimeUnit;
  depth?: number;
}

const TIME_LABELS: Record<TimeUnit, string> = { sec: '/s', min: '/min', hour: '/hr' };
const TIME_MULTIPLIERS: Record<TimeUnit, number> = { sec: 1, min: 60, hour: 3600 };

function formatRate(ratePerSecond: number, timeUnit: TimeUnit): string {
  const rate = ratePerSecond * TIME_MULTIPLIERS[timeUnit];
  return rate < 0.01 ? rate.toExponential(2) : rate.toFixed(2).replace(/\.?0+$/, '');
}

function formatMachines(n: number): string {
  if (n === 0) return '';
  const rounded = Math.ceil(n * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

export function ProductionChain({ node, timeUnit, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(depth < 3);
  const hasChildren = node.children.length > 0;
  const isRaw = !node.recipe;

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          cursor: hasChildren ? 'pointer' : 'default',
          borderRadius: 4,
          background: depth === 0 ? '#f5f5f5' : 'transparent',
          userSelect: 'none',
        }}
      >
        {hasChildren && (
          <span style={{ fontSize: 12, width: 16, color: '#888' }}>
            {expanded ? '\u25BC' : '\u25B6'}
          </span>
        )}
        {!hasChildren && <span style={{ width: 16 }} />}

        <span style={{
          fontWeight: depth === 0 ? 600 : 400,
          color: isRaw ? '#d97706' : '#1a1a1a',
        }}>
          {node.item}
        </span>

        <span style={{ color: '#666', fontSize: 14 }}>
          {formatRate(node.ratePerSecond, timeUnit)}{TIME_LABELS[timeUnit]}
        </span>

        {node.machine && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 13,
            color: '#444',
            background: '#e8e8e8',
            padding: '2px 8px',
            borderRadius: 4,
          }}>
            {formatMachines(node.machinesNeeded)} x {node.machine.name}
          </span>
        )}

        {isRaw && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 13,
            color: '#d97706',
            fontStyle: 'italic',
          }}>
            raw resource
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: '2px solid #e0e0e0', marginLeft: 7 }}>
          {node.children.map((child, i) => (
            <ProductionChain key={`${child.item}-${i}`} node={child} timeUnit={timeUnit} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
