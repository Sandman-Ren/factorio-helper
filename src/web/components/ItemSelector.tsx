import { useState, useMemo, useRef, useEffect } from 'react';

interface Props {
  items: string[];
  value: string;
  onChange: (item: string) => void;
}

export function ItemSelector({ items, value, onChange }: Props) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return items.slice(0, 50);
    const lower = query.toLowerCase();
    return items
      .filter(item => item.toLowerCase().includes(lower))
      .sort((a, b) => {
        // Exact match first, then starts-with, then contains
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        if (aLower === lower) return -1;
        if (bLower === lower) return 1;
        if (aLower.startsWith(lower) && !bLower.startsWith(lower)) return -1;
        if (bLower.startsWith(lower) && !aLower.startsWith(lower)) return 1;
        return a.localeCompare(b);
      })
      .slice(0, 50);
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectItem(item: string) {
    setQuery(item);
    onChange(item);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) selectItem(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: '1 1 300px' }}>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
        Target Item
      </label>
      <input
        type="text"
        value={query}
        placeholder="Search items..."
        onChange={e => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (!e.target.value) onChange('');
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontSize: 16,
          border: '1px solid #ccc',
          borderRadius: 6,
          boxSizing: 'border-box',
        }}
      />
      {isOpen && filtered.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: 300,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '0 0 6px 6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        >
          {filtered.map((item, i) => (
            <li
              key={item}
              onClick={() => selectItem(item)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                background: i === selectedIndex ? '#e8f0fe' : 'transparent',
                fontSize: 14,
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
