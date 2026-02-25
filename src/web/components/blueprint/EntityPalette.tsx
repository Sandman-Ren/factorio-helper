import { useState, useMemo } from 'react';
import itemsData from '../../../data/generated/items.json';
import itemGroupsData from '../../../data/generated/item-groups.json';
import { getIconUrl } from '../ItemIcon.js';
import { Input } from '../../ui/index.js';

/** Subgroups that represent placeable blueprint entities */
const ENTITY_SUBGROUPS = new Set([
  'belt', 'inserter', 'storage', 'logistic-network',
  'energy-pipe-distribution', 'energy', 'train-transport',
  'transport', 'circuit-network', 'extraction-machine',
  'smelting-machine', 'production-machine', 'space-related',
  'defensive-structure', 'turret', 'terrain',
]);

const subgroupDefs = itemGroupsData.subgroups as Record<string, { group: string; order: string }>;

interface CatalogEntry {
  name: string;
  group: string;
  subgroup: string;
  order: string;
}

// Build catalog once
const CATALOG: CatalogEntry[] = itemsData
  .filter(item => ENTITY_SUBGROUPS.has(item.subgroup))
  .map(item => {
    const sg = subgroupDefs[item.subgroup];
    return {
      name: item.name,
      group: sg?.group ?? 'other',
      subgroup: item.subgroup,
      order: sg?.order ?? 'z',
    };
  })
  .sort((a, b) => a.order.localeCompare(b.order) || a.name.localeCompare(b.name));

const GROUP_LABELS: Record<string, string> = {
  'logistics': 'Log',
  'production': 'Prod',
  'combat': 'Cmbt',
  'space': 'Space',
};

const GROUPS = [...new Set(CATALOG.map(e => e.group))];

interface EntityPaletteProps {
  activeEntity: string | null;
  onSelectEntity: (name: string) => void;
}

export function EntityPalette({ activeEntity, onSelectEntity }: EntityPaletteProps) {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState(GROUPS[0] ?? 'logistics');

  const filtered = useMemo(() => {
    const query = search.toLowerCase().replace(/\s+/g, '-');
    return CATALOG.filter(e => {
      if (query && !e.name.includes(query)) return false;
      if (!query && e.group !== activeGroup) return false;
      return true;
    });
  }, [search, activeGroup]);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden" style={{ maxHeight: 440 }}>
      <div className="px-2 pt-2 pb-1">
        <Input
          placeholder="Search entities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* Group tabs */}
      {!search && (
        <div className="flex gap-0.5 px-2 pb-1">
          {GROUPS.map(g => (
            <button
              key={g}
              className={`text-xs px-2 py-0.5 rounded ${
                g === activeGroup
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveGroup(g)}
            >
              {GROUP_LABELS[g] ?? g}
            </button>
          ))}
        </div>
      )}

      {/* Entity grid */}
      <div className="overflow-y-auto px-2 pb-2" style={{ maxHeight: 340 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 32px)',
          gap: 2,
          justifyContent: 'start',
        }}>
          {filtered.map(entry => (
            <button
              key={entry.name}
              title={entry.name.replace(/-/g, ' ')}
              onClick={() => onSelectEntity(entry.name)}
              style={{
                width: 32,
                height: 32,
                padding: 2,
                borderRadius: 3,
                border: entry.name === activeEntity ? '2px solid var(--primary)' : '1px solid transparent',
                background: entry.name === activeEntity ? 'var(--accent)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <img
                src={getIconUrl(entry.name)}
                alt={entry.name.replace(/-/g, ' ')}
                width={28}
                height={28}
                style={{ imageRendering: 'pixelated' }}
                draggable={false}
              />
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-xs text-muted-foreground py-4 text-center">
            No entities found
          </div>
        )}
      </div>
    </div>
  );
}
