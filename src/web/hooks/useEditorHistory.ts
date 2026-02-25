import { useCallback, useRef, useState } from 'react';
import type { DecodedResult } from './useBlueprintEditor.js';
import type { NodePath } from './useBlueprintEditor.js';

interface HistorySnapshot {
  raw: DecodedResult['raw'];
  selectedPath: NodePath;
}

const MAX_HISTORY = 50;

export function useEditorHistory(
  decoded: DecodedResult | null,
  selectedPath: NodePath,
  setDecoded: React.Dispatch<React.SetStateAction<DecodedResult | null>>,
  setSelectedPath: React.Dispatch<React.SetStateAction<NodePath>>,
) {
  const pastRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  // Counter to trigger re-renders when stacks change
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion(v => v + 1), []);

  /** Push the current state onto the undo stack. Call before applying a mutation. */
  const pushSnapshot = useCallback(() => {
    if (!decoded) return;
    pastRef.current.push({ raw: decoded.raw, selectedPath });
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift();
    }
    futureRef.current = [];
    bump();
  }, [decoded, selectedPath, bump]);

  const undo = useCallback(() => {
    if (!decoded || pastRef.current.length === 0) return;
    const prev = pastRef.current.pop()!;
    futureRef.current.push({ raw: decoded.raw, selectedPath });
    setDecoded(d => d ? { ...d, raw: prev.raw } : d);
    setSelectedPath(prev.selectedPath);
    bump();
  }, [decoded, selectedPath, setDecoded, setSelectedPath, bump]);

  const redo = useCallback(() => {
    if (!decoded || futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push({ raw: decoded.raw, selectedPath });
    setDecoded(d => d ? { ...d, raw: next.raw } : d);
    setSelectedPath(next.selectedPath);
    bump();
  }, [decoded, selectedPath, setDecoded, setSelectedPath, bump]);

  const reset = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    bump();
  }, [bump]);

  return {
    pushSnapshot,
    undo,
    redo,
    reset,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
  };
}
