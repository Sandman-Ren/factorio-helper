import { useState, useMemo } from 'react';
import fluidsData from '../../data/generated/fluids.json';
import itemsData from '../../data/generated/items.json';
import itemGroupsData from '../../data/generated/item-groups.json';

// ── Data lookups ────────────────────────────────────────────────────────────

const fluidNames = new Set(fluidsData.map(f => f.name));

const itemSubgroupLookup = new Map<string, string>();
for (const item of itemsData) {
  itemSubgroupLookup.set(item.name, item.subgroup);
}
for (const fluid of fluidsData) {
  itemSubgroupLookup.set(fluid.name, 'fluid');
}

const subgroupDefs = itemGroupsData.subgroups as Record<string, { group: string; order: string }>;

/** The 5 crafting-menu groups, in display order. Fluids merged into intermediates. */
const DISPLAY_GROUPS = itemGroupsData.groups.filter(g => g.name !== 'fluids');

const GROUP_LABELS: Record<string, string> = {
  'logistics': 'Logistics',
  'production': 'Production',
  'intermediate-products': 'Intermediates',
  'space': 'Space',
  'combat': 'Combat',
};

function getIconUrl(item: string): string {
  const category = fluidNames.has(item) ? 'fluid' : 'item';
  return `${import.meta.env.BASE_URL}icons/${category}/${item}.png`;
}

function resolveGroup(name: string): string {
  const subgroup = itemSubgroupLookup.get(name) ?? '';
  const group = subgroupDefs[subgroup]?.group ?? 'intermediate-products';
  // Merge fluids into intermediate-products (matches wiki layout)
  if (group === 'fluids') return 'intermediate-products';
  return group;
}

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  items: string[];
  value: string;
  onChange: (item: string) => void;
}

export function ItemSelector({ items: allItems, value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('intermediate-products');

  // Organize items by group → subgroup
  const itemsByGroup = useMemo(() => {
    const grouped: Record<string, Record<string, string[]>> = {};

    for (const item of allItems) {
      const group = resolveGroup(item);
      const subgroup = itemSubgroupLookup.get(item) ?? '_unknown';

      if (!grouped[group]) grouped[group] = {};
      if (!grouped[group][subgroup]) grouped[group][subgroup] = [];
      grouped[group][subgroup].push(item);
    }

    return grouped;
  }, [allItems]);

  // Only show tabs that have items
  const availableGroups = useMemo(() => {
    return DISPLAY_GROUPS.filter(g => {
      const subs = itemsByGroup[g.name];
      return subs && Object.values(subs).some(arr => arr.length > 0);
    });
  }, [itemsByGroup]);

  // Sorted subgroup rows for the active tab
  const activeRows = useMemo(() => {
    const subs = itemsByGroup[activeGroup] ?? {};
    return Object.entries(subs)
      .sort(([a], [b]) => {
        const orderA = subgroupDefs[a]?.order ?? 'zzz';
        const orderB = subgroupDefs[b]?.order ?? 'zzz';
        return orderA.localeCompare(orderB);
      });
  }, [itemsByGroup, activeGroup]);

  // Search results (flat, across all groups)
  const searchResults = useMemo(() => {
    if (!query) return null;
    const lower = query.toLowerCase();
    return allItems
      .filter(item => item.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        if (aLower === lower) return -1;
        if (bLower === lower) return 1;
        if (aLower.startsWith(lower) && !bLower.startsWith(lower)) return -1;
        if (bLower.startsWith(lower) && !aLower.startsWith(lower)) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 100);
  }, [allItems, query]);

  const isSearching = query.length > 0;

  function selectItem(item: string) {
    setQuery('');
    onChange(item);
  }

  return (
    <div style={{ flex: '1 1 300px' }}>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        Target Item
      </label>

      {/* Search bar */}
      <input
        type="text"
        value={query}
        placeholder="Search items..."
        onChange={e => {
          setQuery(e.target.value);
          if (!e.target.value) onChange('');
        }}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 16,
          border: '1px solid #555',
          borderRadius: '6px 6px 0 0',
          boxSizing: 'border-box',
          background: '#fff',
        }}
      />

      {/* Inventory container */}
      <div style={{
        border: '1px solid #555',
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        background: '#3d3d3d',
        overflow: 'hidden',
      }}>

        {/* Tab bar (hidden during search) */}
        {!isSearching && (
          <div style={{
            display: 'flex',
            background: '#2a2a2a',
            borderBottom: '2px solid #e09030',
          }}>
            {availableGroups.map(g => (
              <button
                key={g.name}
                onClick={() => setActiveGroup(g.name)}
                style={{
                  flex: '1 1 0',
                  padding: '6px 4px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: g.name === activeGroup ? '3px solid #e09030' : '3px solid transparent',
                  background: g.name === activeGroup ? '#3d3d3d' : 'transparent',
                  color: g.name === activeGroup ? '#f0c050' : '#aaa',
                  transition: 'background 0.1s, color 0.1s',
                  whiteSpace: 'nowrap',
                }}
              >
                {GROUP_LABELS[g.name] ?? g.name}
              </button>
            ))}
          </div>
        )}

        {/* Item grid area */}
        <div style={{
          maxHeight: 320,
          overflowY: 'auto',
          padding: 6,
        }}>
          {isSearching ? (
            searchResults && searchResults.length > 0 ? (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
              }}>
                {searchResults.map(item => (
                  <IconCell
                    key={item}
                    item={item}
                    selected={item === value}
                    onClick={() => selectItem(item)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ color: '#888', padding: 16, textAlign: 'center', fontSize: 14 }}>
                No items found
              </div>
            )
          ) : (
            activeRows.map(([subgroup, items]) => (
              <div
                key={subgroup}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  marginBottom: 4,
                }}
              >
                {items.map(item => (
                  <IconCell
                    key={item}
                    item={item}
                    selected={item === value}
                    onClick={() => selectItem(item)}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Icon cell ───────────────────────────────────────────────────────────────

function IconCell({ item, selected, onClick }: {
  item: string;
  selected: boolean;
  onClick: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const label = item.replace(/-/g, ' ');

  return (
    <div
      title={label}
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: 3,
        border: selected ? '2px solid #f0c050' : '1px solid #555',
        background: selected ? '#5a4520' : '#4a4a4a',
        flexShrink: 0,
      }}
    >
      {imgFailed ? (
        <span style={{
          fontSize: 9,
          color: '#ccc',
          textAlign: 'center',
          lineHeight: 1.1,
          overflow: 'hidden',
          wordBreak: 'break-all',
          maxHeight: 36,
          padding: 1,
        }}>
          {label.slice(0, 8)}
        </span>
      ) : (
        <img
          src={getIconUrl(item)}
          alt={label}
          width={32}
          height={32}
          style={{ imageRendering: 'pixelated' }}
          onError={() => setImgFailed(true)}
        />
      )}
    </div>
  );
}
