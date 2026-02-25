import { useState } from 'react';
import type { ProductionNode } from '../../calculator/types.js';
import type { MachineOverrides, FuelOverrides } from '../../calculator/types.js';
import type { Machine, Fuel, Technology } from '../../data/schema.js';
import type { TimeUnit } from '../hooks/useCalculator.js';
import { formatPower } from '../../calculator/energy.js';
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
  categoryMachines?: Map<string, Machine[]>;
  machineOverrides?: MachineOverrides;
  onMachineChange?: (item: string, machineName: string) => void;
  fuels?: Fuel[];
  fuelOverrides?: FuelOverrides;
  onFuelChange?: (item: string, fuelName: string) => void;
  itemToTech?: Map<string, Technology>;
  onTechClick?: (techName: string) => void;
}

const TIME_LABELS: Record<TimeUnit, string> = { sec: '/s', min: '/min', hour: '/hr' };
const TIME_MULTIPLIERS: Record<TimeUnit, number> = { sec: 1, min: 60, hour: 3600 };
const GRID_COLUMNS = '16px auto auto auto 1fr auto';

function formatRate(ratePerSecond: number, timeUnit: TimeUnit): string {
  const rate = ratePerSecond * TIME_MULTIPLIERS[timeUnit];
  return rate < 0.01 ? rate.toExponential(2) : rate.toFixed(2).replace(/\.?0+$/, '');
}

function formatMachines(n: number): string {
  if (n === 0) return '';
  const rounded = Math.ceil(n * 100) / 100;
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

function FuelSelector({ current, fuels, onSelect }: {
  current: string;
  fuels: Fuel[];
  onSelect: (name: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={e => e.stopPropagation()}
        className="inline-flex items-center gap-1 rounded bg-card border border-border px-1 py-0.5 cursor-pointer"
      >
        <ItemIcon name={current} size={20} />
        <ChevronDownIcon className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        <DropdownMenuRadioGroup value={current} onValueChange={onSelect}>
          {fuels.map(f => (
            <DropdownMenuRadioItem key={f.name} value={f.name}>
              <ItemIcon name={f.name} size={20} />
              <span className="text-foreground">
                {f.name.replace(/-/g, ' ')}
              </span>
              <span className="ml-auto text-xs text-foreground/80">
                {f.fuel_value}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
              <span className="ml-auto text-xs text-foreground/80">
                {'\u00D7'}{m.crafting_speed}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Renders the tech badge with a technology icon. */
function TechBadge({ tech, onTechClick }: { tech: Technology; onTechClick?: (name: string) => void }) {
  return (
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
            <ItemIcon name={tech.name} size={12} category="technology" />
            {tech.name.replace(/-/g, ' ')}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent>Requires: {tech.name.replace(/-/g, ' ')}</TooltipContent>
    </Tooltip>
  );
}

/** Machine badge content shared between root and node rows. */
function MachineBadge({ node, timeUnit, categoryMachines, onMachineChange, fuels, fuelOverrides, onFuelChange }: {
  node: ProductionNode;
  timeUnit: TimeUnit;
  categoryMachines?: Map<string, Machine[]>;
  onMachineChange?: (item: string, machineName: string) => void;
  fuels?: Fuel[];
  fuelOverrides?: FuelOverrides;
  onFuelChange?: (item: string, fuelName: string) => void;
}) {
  if (!node.machine) return null;

  const alternatives = categoryMachines?.get(node.recipe?.category ?? '');
  const hasAlternatives = alternatives && alternatives.length > 1;
  const isBurner = node.machine.energy_type === 'burner';
  const isElectric = node.machine.energy_type === 'electric';
  const compatibleFuels = fuels?.filter(f => {
    const cats = node.machine?.fuel_categories;
    return cats ? cats.includes(f.fuel_category) : f.fuel_category === 'chemical';
  }) ?? [];

  return (
    <span style={{
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

      {isElectric && node.powerKW > 0 && (
        <span className="text-foreground/80 text-xs ml-1">
          {'\u26A1'}{formatPower(node.powerKW)}
        </span>
      )}
      {isBurner && node.fuel && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
          {compatibleFuels.length > 1 && onFuelChange ? (
            <FuelSelector
              current={fuelOverrides?.[node.item] ?? node.fuel}
              fuels={compatibleFuels}
              onSelect={name => onFuelChange(node.item, name)}
            />
          ) : (
            <ItemIcon name={node.fuel} size={20} />
          )}
          <span className="text-foreground/80 text-xs">
            {formatRate(node.fuelPerSecond, timeUnit)}{TIME_LABELS[timeUnit]}
          </span>
        </span>
      )}
    </span>
  );
}

/** Internal recursive node that renders as grid items (row + children) via subgrid. */
function ProductionChainNode({ node, timeUnit, depth, categoryMachines, onMachineChange, fuels, fuelOverrides, onFuelChange, itemToTech, onTechClick }: Props & { depth: number }) {
  const [expanded, setExpanded] = useState(depth < 3);
  const hasChildren = node.children.length > 0;
  const isRaw = !node.recipe;
  const tech = itemToTech?.get(node.item);

  return (
    <>
      {/* Row — subgrid aligns columns with siblings */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'subgrid',
          gridColumn: '1 / -1',
          alignItems: 'center',
          padding: '6px 8px',
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Col 1: Arrow */}
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          {hasChildren ? (expanded ? '\u25BC' : '\u25B6') : ''}
        </span>

        {/* Col 2: Item icon */}
        <ItemIcon name={node.item} size={28} />

        {/* Col 3: Rate */}
        <span style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
          {formatRate(node.ratePerSecond, timeUnit)}{TIME_LABELS[timeUnit]}
        </span>

        {/* Col 4: Tech badge (wrapped to guarantee single grid item) */}
        <span>
          {tech ? <TechBadge tech={tech} onTechClick={onTechClick} /> : null}
        </span>

        {/* Col 5: Spacer */}
        <span />

        {/* Col 6: Machine badge / raw label */}
        <span style={{ justifySelf: 'end' }}>
          {node.machine ? (
            <MachineBadge
              node={node}
              timeUnit={timeUnit}
              categoryMachines={categoryMachines}
              onMachineChange={onMachineChange}
              fuels={fuels}
              fuelOverrides={fuelOverrides}
              onFuelChange={onFuelChange}
            />
          ) : isRaw ? (
            <span style={{ fontSize: 13, color: 'var(--primary)', fontStyle: 'italic' }}>
              raw resource
            </span>
          ) : null}
        </span>
      </div>

      {/* Children subtree — own grid for next-level sibling alignment */}
      {expanded && hasChildren && (
        <div
          style={{
            gridColumn: '1 / -1',
            borderLeft: '2px solid var(--border)',
            marginLeft: 7,
            paddingLeft: 20,
            display: 'grid',
            gridTemplateColumns: GRID_COLUMNS,
            columnGap: 8,
          }}
        >
          {node.children.map((child, i) => (
            <ProductionChainNode
              key={`${child.item}-${i}`}
              node={child}
              depth={depth + 1}
              timeUnit={timeUnit}
              categoryMachines={categoryMachines}
              onMachineChange={onMachineChange}
              fuels={fuels}
              fuelOverrides={fuelOverrides}
              onFuelChange={onFuelChange}
              itemToTech={itemToTech}
              onTechClick={onTechClick}
            />
          ))}
        </div>
      )}
    </>
  );
}

export function ProductionChain({ node, timeUnit, categoryMachines, onMachineChange, fuels, fuelOverrides, onFuelChange, itemToTech, onTechClick }: Props) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isRaw = !node.recipe;
  const tech = itemToTech?.get(node.item);

  return (
    <div>
      {/* Root row — flex layout (single row, alignment N/A) */}
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          cursor: hasChildren ? 'pointer' : 'default',
          borderRadius: 4,
          background: 'var(--card)',
          userSelect: 'none',
        }}
      >
        {hasChildren ? (
          <span style={{ fontSize: 12, width: 16, color: 'var(--muted-foreground)' }}>
            {expanded ? '\u25BC' : '\u25B6'}
          </span>
        ) : (
          <span style={{ width: 16 }} />
        )}

        <ItemIcon name={node.item} size={32} />

        <span style={{ color: 'var(--muted-foreground)', fontSize: 14 }}>
          {formatRate(node.ratePerSecond, timeUnit)}{TIME_LABELS[timeUnit]}
        </span>

        {tech && <TechBadge tech={tech} onTechClick={onTechClick} />}

        {node.machine && (
          <span style={{ marginLeft: 'auto' }}>
            <MachineBadge
              node={node}
              timeUnit={timeUnit}
              categoryMachines={categoryMachines}
              onMachineChange={onMachineChange}
              fuels={fuels}
              fuelOverrides={fuelOverrides}
              onFuelChange={onFuelChange}
            />
          </span>
        )}

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

      {/* Children — grid container for sibling column alignment */}
      {expanded && hasChildren && (
        <div style={{
          borderLeft: '2px solid var(--border)',
          marginLeft: 7,
          paddingLeft: 20,
          display: 'grid',
          gridTemplateColumns: GRID_COLUMNS,
          columnGap: 8,
        }}>
          {node.children.map((child, i) => (
            <ProductionChainNode
              key={`${child.item}-${i}`}
              node={child}
              depth={1}
              timeUnit={timeUnit}
              categoryMachines={categoryMachines}
              onMachineChange={onMachineChange}
              fuels={fuels}
              fuelOverrides={fuelOverrides}
              onFuelChange={onFuelChange}
              itemToTech={itemToTech}
              onTechClick={onTechClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
