import { Fragment, useEffect, useMemo, useState } from 'react';
import type { ProductionNode, ProductionPlan } from '../../calculator/types.js';
import { computeIntegerRatios } from '../../calculator/solver.js';
import { ItemIcon } from './ItemIcon.js';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/index.js';
import RotateCcwIcon from 'lucide-react/dist/esm/icons/rotate-ccw';

interface RatioEntry {
  item: string;
  machinesNeeded: number;
  machineName: string;
}

function collectRatioEntries(
  node: ProductionNode,
  map: Map<string, RatioEntry>,
): void {
  if (node.machine && node.machinesNeeded > 0) {
    const existing = map.get(node.item);
    if (existing) {
      existing.machinesNeeded += node.machinesNeeded;
    } else {
      map.set(node.item, {
        item: node.item,
        machinesNeeded: node.machinesNeeded,
        machineName: node.machine.name,
      });
    }
  }
  for (const child of node.children) {
    collectRatioEntries(child, map);
  }
}

interface Props {
  plan: ProductionPlan;
}

export function RatioStrip({ plan }: Props) {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const entries = useMemo(() => {
    const map = new Map<string, RatioEntry>();
    collectRatioEntries(plan.root, map);
    return [...map.values()];
  }, [plan]);

  // Reset exclusions when the target item changes
  const targetItem = plan.root.item;
  useEffect(() => {
    setExcluded(new Set());
  }, [targetItem]);

  // Build a ratio map: item → display string
  // Uses GCD-reduced integer ratios when possible.
  // Falls back to normalized decimals (smallest = 1) when ratios are too large.
  const ratioMap = useMemo(() => {
    const map = new Map<string, string>();
    const included = entries.filter(e => !excluded.has(e.item));
    if (included.length === 0) return map;

    const values = included.map(e => e.machinesNeeded);
    const intRatios = computeIntegerRatios(values);

    // Use integer ratios if found and the largest value is reasonable
    if (intRatios && Math.max(...intRatios) <= 200) {
      for (let i = 0; i < included.length; i++) {
        map.set(included[i]!.item, String(intRatios[i]));
      }
    } else {
      // Normalize so the smallest value is 1
      const minVal = Math.min(...values);
      if (minVal > 0) {
        for (const entry of included) {
          const normalized = entry.machinesNeeded / minVal;
          const rounded = Math.round(normalized);
          const display = Math.abs(normalized - rounded) < 0.05
            ? String(rounded)
            : normalized.toFixed(1);
          map.set(entry.item, display);
        }
      }
    }
    return map;
  }, [entries, excluded]);

  const toggle = (item: string) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  if (entries.length < 2) return null;

  // Build the list of included indices for ':' separator logic
  const includedIndices = new Set(
    entries.map((e, i) => excluded.has(e.item) ? -1 : i).filter(i => i >= 0),
  );
  let prevIncludedSeen = false;

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 16px',
      marginBottom: 16,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        color: 'var(--muted-foreground)',
        marginBottom: 8,
      }}>
        <span>Machine Ratio</span>
        {excluded.size > 0 && (
          <button
            type="button"
            onClick={() => setExcluded(new Set())}
            className="inline-flex items-center gap-1 cursor-pointer"
            style={{
              fontSize: 11,
              color: 'var(--muted-foreground)',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
          >
            <RotateCcwIcon className="size-3" />
            reset
          </button>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {entries.map((entry, i) => {
          const isExcluded = excluded.has(entry.item);
          const ratio = isExcluded ? null : (ratioMap.get(entry.item) ?? null);
          const isIncluded = includedIndices.has(i);

          // Show ':' before this chip if it's included and a previous included chip exists
          const showSeparator = isIncluded && prevIncludedSeen;
          if (isIncluded) prevIncludedSeen = true;

          const label = entry.item.replace(/-/g, ' ');

          return (
            <Fragment key={entry.item}>
              {showSeparator && (
                <span style={{
                  color: 'var(--muted-foreground)',
                  fontSize: 16,
                  userSelect: 'none',
                  lineHeight: 1,
                }}>:</span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggle(entry.item)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: `1px solid ${isExcluded ? 'var(--border)' : 'var(--border)'}`,
                      background: isExcluded ? 'transparent' : 'var(--card)',
                      opacity: isExcluded ? 0.3 : 1,
                      cursor: 'pointer',
                      fontSize: 14,
                      color: 'var(--foreground)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <ItemIcon name={entry.item} size={20} />
                    {ratio !== null && (
                      <span style={{ fontWeight: 600, minWidth: 14, textAlign: 'center' }}>
                        {ratio}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {label} — click to {isExcluded ? 'include' : 'exclude'}
                </TooltipContent>
              </Tooltip>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
