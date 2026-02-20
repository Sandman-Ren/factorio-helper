import { useState, useMemo, useRef, useEffect } from 'react';
import itemsData from '../../data/generated/items.json';
import fluidsData from '../../data/generated/fluids.json';
import itemGroupsData from '../../data/generated/item-groups.json';
import { getIconUrl } from './ItemIcon.js';
import { Label, Input, Button } from '../ui/index.js';
import XIcon from 'lucide-react/dist/esm/icons/x';

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
    <div ref={containerRef} className="relative flex-[1_1_300px]">
      <Label className="mb-1">Target Item</Label>

      {/* Selected chip or search input */}
      {value && !isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center gap-2 rounded-md border border-input bg-input/30 px-3 py-1 h-9 cursor-pointer text-base"
        >
          <img
            src={getIconUrl(value)}
            alt={value.replace(/-/g, ' ')}
            width={24}
            height={24}
            className="shrink-0"
            style={{ imageRendering: 'pixelated' }}
          />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
            {value.replace(/-/g, ' ')}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Clear selection"
            onClick={e => { e.stopPropagation(); onChange(''); setQuery(''); }}
          >
            <XIcon />
          </Button>
        </div>
      ) : (
        <Input
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
        />
      )}

      {/* Picker popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-0.5 rounded-md bg-popover border border-border shadow-lg z-20 overflow-hidden">

          {/* Tab bar (hidden during search) */}
          {!isSearching && (
            <div className="flex bg-muted border-b-2 border-primary">
              {availableGroups.map(g => (
                <button
                  key={g.name}
                  onClick={() => setActiveGroup(g.name)}
                  className={`flex-[1_1_0] px-1 py-1.5 text-xs font-semibold cursor-pointer border-none border-b-[3px] whitespace-nowrap transition-[background,color] duration-100 ${
                    g.name === activeGroup
                      ? 'border-b-primary bg-popover text-[var(--color-factorio-highlight)]'
                      : 'border-b-transparent bg-transparent text-muted-foreground'
                  }`}
                >
                  {GROUP_LABELS[g.name] ?? g.name}
                </button>
              ))}
            </div>
          )}

          {/* Item grid area */}
          <div className="max-h-80 overflow-y-auto p-1.5">
            {isSearching ? (
              searchResults && searchResults.length > 0 ? (
                <div className="flex flex-wrap gap-0.5">
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
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No items found
                </div>
              )
            ) : (
              activeRows.map(([subgroup, items]) => (
                <div
                  key={subgroup}
                  className="flex flex-wrap gap-0.5 mb-1"
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
      className={`flex size-10 shrink-0 items-center justify-center cursor-pointer rounded-sm ${
        selected
          ? 'border-2 border-[var(--color-factorio-highlight)] bg-[var(--color-factorio-selected)]'
          : 'border border-border bg-accent'
      }`}
    >
      {imgFailed ? (
        <span className="text-[9px] text-muted-foreground text-center leading-tight overflow-hidden break-all max-h-9 p-px">
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
