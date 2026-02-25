import { useState, useCallback } from 'react';
import type { Direction } from '../../blueprint/types.js';

export type EditorMode =
  | { type: 'select' }
  | { type: 'place'; entityName: string; direction: Direction }
  | { type: 'wire'; color: 'red' | 'green' | 'copper' };

const DEFAULT_MODE: EditorMode = { type: 'select' };

export function useEditorMode() {
  const [mode, setMode] = useState<EditorMode>(DEFAULT_MODE);

  const resetMode = useCallback(() => setMode(DEFAULT_MODE), []);

  const startPlacing = useCallback((entityName: string, direction: Direction = 0) => {
    setMode({ type: 'place', entityName, direction });
  }, []);

  const rotatePlacementDirection = useCallback((clockwise = true) => {
    setMode(prev => {
      if (prev.type !== 'place') return prev;
      const step = clockwise ? 4 : 12;
      return { ...prev, direction: ((prev.direction + step) % 16) as Direction };
    });
  }, []);

  const startWiring = useCallback((color: 'red' | 'green' | 'copper') => {
    setMode({ type: 'wire', color });
  }, []);

  return {
    mode,
    setMode,
    resetMode,
    startPlacing,
    rotatePlacementDirection,
    startWiring,
  };
}
