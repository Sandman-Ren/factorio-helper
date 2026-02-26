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

  // Keep refs in sync with latest state to avoid stale closures
  const decodedRef = useRef(decoded);
  decodedRef.current = decoded;
  const selectedPathRef = useRef(selectedPath);
  selectedPathRef.current = selectedPath;

  /** Push the current state onto the undo stack. Call before applying a mutation. */
  const pushSnapshot = useCallback(() => {
    const d = decodedRef.current;
    if (!d) return;
    pastRef.current.push({ raw: d.raw, selectedPath: selectedPathRef.current });
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift();
    }
    futureRef.current = [];
    bump();
  }, [bump]);

  const undo = useCallback(() => {
    const d = decodedRef.current;
    if (!d || pastRef.current.length === 0) return;
    const prev = pastRef.current.pop()!;
    futureRef.current.push({ raw: d.raw, selectedPath: selectedPathRef.current });
    setDecoded(curr => curr ? { ...curr, raw: prev.raw } : curr);
    setSelectedPath(prev.selectedPath);
    bump();
  }, [setDecoded, setSelectedPath, bump]);

  const redo = useCallback(() => {
    const d = decodedRef.current;
    if (!d || futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    pastRef.current.push({ raw: d.raw, selectedPath: selectedPathRef.current });
    setDecoded(curr => curr ? { ...curr, raw: next.raw } : curr);
    setSelectedPath(next.selectedPath);
    bump();
  }, [setDecoded, setSelectedPath, bump]);

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
