import { useState, useMemo, useRef, useEffect } from 'react';
import itemsData from '../../data/generated/items.json';
import fluidsData from '../../data/generated/fluids.json';
import itemGroupsData from '../../data/generated/item-groups.json';
import { getIconUrl } from './ItemIcon.js';

// ── Data lookups ────────────────────────────────────────────────────────────

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

function resolveGroup(name: string): string {
  const subgroup = itemSubgroupLookup.get(name) ?? '';
  const group = subgroupDefs[subgroup]?.group ?? 'intermediate-products';
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
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('intermediate-products');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when opening from chip click
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Close picker on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setIsOpen(false);
    onChange(item);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: '1 1 300px' }}>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        Target Item
      </label>

      {/* Selected chip or search input */}
      {value && !isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 16,
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxSizing: 'border-box',
            background: 'var(--card)',
            color: 'var(--foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <img
            src={getIconUrl(value)}
            alt={value.replace(/-/g, ' ')}
            width={24}
            height={24}
            style={{ imageRendering: 'pixelated', flexShrink: 0 }}
          />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.replace(/-/g, ' ')}
          </span>
          <span
            onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); }}
            style={{
              fontSize: 20,
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              lineHeight: 1,
              flexShrink: 0,
              padding: '0 2px',
            }}
          >
            ✕
          </span>
        </div>
      ) : (
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search items..."
          onFocus={() => setIsOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value) onChange('');
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: 16,
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxSizing: 'border-box',
            background: 'var(--card)',
            color: 'var(--foreground)',
          }}
        />
      )}

      {/* Picker popover */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: 2,
          borderRadius: 6,
          background: 'var(--popover)',
          border: '1px solid var(--border)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          zIndex: 20,
          overflow: 'hidden',
        }}>

          {/* Tab bar (hidden during search) */}
          {!isSearching && (
            <div style={{
              display: 'flex',
              background: 'var(--muted)',
              borderBottom: '2px solid var(--primary)',
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
                    borderBottom: g.name === activeGroup ? '3px solid var(--primary)' : '3px solid transparent',
                    background: g.name === activeGroup ? 'var(--popover)' : 'transparent',
                    color: g.name === activeGroup ? 'var(--color-factorio-highlight)' : 'var(--muted-foreground)',
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
                <div style={{ color: 'var(--muted-foreground)', padding: 16, textAlign: 'center', fontSize: 14 }}>
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
      )}
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
        border: selected ? '2px solid var(--color-factorio-highlight)' : '1px solid var(--border)',
        background: selected ? 'var(--color-factorio-selected)' : 'var(--accent)',
        flexShrink: 0,
      }}
    >
      {imgFailed ? (
        <span style={{
          fontSize: 9,
          color: 'var(--muted-foreground)',
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
