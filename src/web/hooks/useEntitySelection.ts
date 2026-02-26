import { useState, useCallback } from 'react';

const EMPTY_SET: ReadonlySet<number> = new Set();

export function useEntitySelection() {
  const [selected, setSelected] = useState<ReadonlySet<number>>(EMPTY_SET);

  const selectOne = useCallback((entityNumber: number) => {
    setSelected(new Set([entityNumber]));
  }, []);

  const toggleOne = useCallback((entityNumber: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(entityNumber)) next.delete(entityNumber);
      else next.add(entityNumber);
      return next;
    });
  }, []);

  const selectBox = useCallback((entityNumbers: number[]) => {
    setSelected(new Set(entityNumbers));
  }, []);

  const addToSelection = useCallback((entityNumbers: number[]) => {
    setSelected(prev => {
      const next = new Set(prev);
      for (const n of entityNumbers) next.add(n);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(EMPTY_SET);
  }, []);

  const selectAll = useCallback((allEntityNumbers: number[]) => {
    setSelected(new Set(allEntityNumbers));
  }, []);

  return {
    selected,
    selectOne,
    toggleOne,
    selectBox,
    addToSelection,
    clearSelection,
    selectAll,
  };
}
