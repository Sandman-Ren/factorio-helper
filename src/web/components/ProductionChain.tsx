import { useState } from 'react';
import type { ProductionNode } from '../../calculator/types.js';
import type { MachineOverrides } from '../../calculator/types.js';
import type { Machine, Technology } from '../../data/schema.js';
import type { TimeUnit } from '../hooks/useCalculator.js';
import { ItemIcon } from './ItemIcon.js';
import {
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '../ui/index.js';
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down';

interface Props {
  node: ProductionNode;
  timeUnit: TimeUnit;
  depth?: number;
  categoryMachines?: Map<string, Machine[]>;
  machineOverrides?: MachineOverrides;
  onMachineChange?: (item: string, machineName: string) => void;
  itemToTech?: Map<string, Technology>;
  onTechClick?: (techName: string) => void;
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

function MachineSelector({ current, alternatives, onSelect }: {
  current: Machine;
  alternatives: Machine[];
  onSelect: (name: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={e => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded bg-card border border-border px-1 py-0.5 cursor-pointer"
      >
        <ItemIcon name={current.name} size={24} />
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        <DropdownMenuRadioGroup value={current.name} onValueChange={onSelect}>
          {alternatives.map(m => (
            <DropdownMenuRadioItem key={m.name} value={m.name}>
              <ItemIcon name={m.name} size={24} />
              <span className="text-foreground">
                {m.name.replace(/-/g, ' ')}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {'\u00D7'}{m.crafting_speed}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductionChain({ node, timeUnit, depth = 0, categoryMachines, machineOverrides, onMachineChange, itemToTech, onTechClick }: Props) {
  const [expanded, setExpanded] = useState(depth < 3);
  const hasChildren = node.children.length > 0;
  const isRaw = !node.recipe;
  const tech = itemToTech?.get(node.item);

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
          background: depth === 0 ? 'var(--card)' : 'transparent',
          userSelect: 'none',
        }}
      >
        {hasChildren && (
          <span style={{ fontSize: 12, width: 16, color: 'var(--muted-foreground)' }}>
            {expanded ? '\u25BC' : '\u25B6'}
          </span>
        )}
        {!hasChildren && <span style={{ width: 16 }} />}

        <ItemIcon name={node.item} size={depth === 0 ? 32 : 28} />

        <span style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
          {formatRate(node.ratePerSecond, timeUnit)}{TIME_LABELS[timeUnit]}
        </span>

        {tech && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                onClick={e => {
                  e.stopPropagation();
                  onTechClick?.(tech.name);
                }}
                className={onTechClick ? 'cursor-pointer' : undefined}
              >
                <Badge variant="outline" className="text-[10px] text-muted-foreground gap-1 py-0 px-1.5">
                  <ItemIcon name={tech.name} size={12} />
                  {tech.name.replace(/-/g, ' ')}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent>Requires: {tech.name.replace(/-/g, ' ')}</TooltipContent>
          </Tooltip>
        )}

        {node.machine && (() => {
          const alternatives = categoryMachines?.get(node.recipe?.category ?? '');
          const hasAlternatives = alternatives && alternatives.length > 1;

          return (
            <span style={{
              marginLeft: 'auto',
              fontSize: 13,
              color: 'var(--foreground)',
              background: 'var(--accent)',
              padding: '2px 8px',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {formatMachines(node.machinesNeeded)} x{' '}
              {hasAlternatives ? (
                <MachineSelector
                  current={node.machine}
                  alternatives={alternatives}
                  onSelect={name => onMachineChange?.(node.item, name)}
                />
              ) : (
                <ItemIcon name={node.machine.name} size={24} />
              )}
            </span>
          );
        })()}

        {isRaw && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 13,
            color: 'var(--primary)',
            fontStyle: 'italic',
          }}>
            raw resource
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: '2px solid var(--border)', marginLeft: 7 }}>
          {node.children.map((child, i) => (
            <ProductionChain key={`${child.item}-${i}`} node={child} timeUnit={timeUnit} depth={depth + 1} categoryMachines={categoryMachines} machineOverrides={machineOverrides} onMachineChange={onMachineChange} itemToTech={itemToTech} onTechClick={onTechClick} />
          ))}
        </div>
      )}
    </div>
  );
}
