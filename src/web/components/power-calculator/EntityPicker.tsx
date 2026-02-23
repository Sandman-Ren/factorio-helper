import { useState, useMemo, useRef, useEffect } from 'react';
import { allEntities } from '../../hooks/usePowerCalculator.js';
import { ItemIcon } from '../ItemIcon.js';
import { formatPower } from '../../../calculator/energy.js';
import { Input } from '../../ui/index.js';
import type { PowerEntity } from '../../../data/schema.js';

const CATEGORIES = [
  'Assemblers',
  'Furnaces',
  'Mining',
  'Science',
  'Logistics',
  'Combat',
  'Infrastructure',
  'Space',
  'Circuit',
] as const;

const entitiesByCategory = new Map<string, PowerEntity[]>();
for (const entity of allEntities) {
  let list = entitiesByCategory.get(entity.category);
  if (!list) {
    list = [];
    entitiesByCategory.set(entity.category, list);
  }
  list.push(entity);
}

const availableCategories = CATEGORIES.filter(c => {
  const list = entitiesByCategory.get(c);
  return list && list.length > 0;
});

function entityAnnotation(e: PowerEntity): string {
  const kw = e.energy_usage_kw || e.drain_kw || e.active_energy_usage_kw || 0;
  const label = formatPower(kw);
  if (e.energy_type === 'burner') return `${label} burner`;
  return label;
}

interface Props {
  onSelect: (entityName: string) => void;
}

export function EntityPicker({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(availableCategories[0] ?? 'Assemblers');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeEntities = useMemo(() => {
    return entitiesByCategory.get(activeCategory) ?? [];
  }, [activeCategory]);

  const searchResults = useMemo(() => {
    if (!query) return null;
    const lower = query.toLowerCase();
    return allEntities
      .filter(e => e.name.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        if (aLower === lower) return -1;
        if (bLower === lower) return 1;
        if (aLower.startsWith(lower) && !bLower.startsWith(lower)) return -1;
        if (bLower.startsWith(lower) && !aLower.startsWith(lower)) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 50);
  }, [query]);

  const isSearching = query.length > 0;

  function selectEntity(name: string) {
    setQuery('');
    setIsOpen(false);
    onSelect(name);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={query}
        placeholder="Add entity..."
        onFocus={() => setIsOpen(true)}
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-0.5 rounded-md bg-popover border border-border shadow-lg z-20 overflow-hidden">
          {!isSearching && (
            <div className="flex bg-muted border-b border-border overflow-x-auto">
              {availableCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-semibold cursor-pointer border-0 border-b-[3px] border-solid whitespace-nowrap transition-[background,color] duration-100 ${
                    cat === activeCategory
                      ? 'border-b-primary bg-popover text-[var(--color-factorio-highlight)]'
                      : 'border-b-transparent bg-transparent text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {isSearching ? (
              searchResults && searchResults.length > 0 ? (
                searchResults.map(entity => (
                  <EntityRow key={entity.name} entity={entity} onClick={() => selectEntity(entity.name)} />
                ))
              ) : (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No entities found
                </div>
              )
            ) : (
              activeEntities.map(entity => (
                <EntityRow key={entity.name} entity={entity} onClick={() => selectEntity(entity.name)} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EntityRow({ entity, onClick }: { entity: PowerEntity; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-accent/50 transition-[background] duration-100"
    >
      <ItemIcon name={entity.name} size={24} />
      <span className="flex-1 text-sm">{entity.name.replace(/-/g, ' ')}</span>
      <span className="text-xs text-foreground/70 tabular-nums">{entityAnnotation(entity)}</span>
    </div>
  );
}
