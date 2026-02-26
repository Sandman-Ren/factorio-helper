import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { decode, encode, formatVersion } from '../../blueprint/index.js';
import type {
  BlueprintString,
  Blueprint,
  BlueprintBook,
  BlueprintBookChild,
  UpgradePlanner,
  DeconstructionPlanner,
} from '../../blueprint/index.js';
import { useEditorHistory } from './useEditorHistory.js';
import { useEditorMode } from './useEditorMode.js';

export type BlueprintType =
  | 'blueprint'
  | 'blueprint_book'
  | 'upgrade_planner'
  | 'deconstruction_planner';

/** Path into a blueprint book tree. Empty array = root. */
export type NodePath = number[];

export type BlueprintNode = Blueprint | BlueprintBook | UpgradePlanner | DeconstructionPlanner;

export interface DecodedResult {
  raw: BlueprintString;
  type: BlueprintType;
  originalString: string;
}

/** Detect which top-level key is present in a decoded BlueprintString. */
function detectType(data: BlueprintString): BlueprintType {
  if ('blueprint' in data) return 'blueprint';
  if ('blueprint_book' in data) return 'blueprint_book';
  if ('upgrade_planner' in data) return 'upgrade_planner';
  return 'deconstruction_planner';
}

/** Extract the root node from a decoded BlueprintString. */
function getRootNode(data: BlueprintString): BlueprintNode {
  if ('blueprint' in data) return data.blueprint;
  if ('blueprint_book' in data) return data.blueprint_book;
  if ('upgrade_planner' in data) return data.upgrade_planner;
  return (data as { deconstruction_planner: DeconstructionPlanner }).deconstruction_planner;
}

/** Get the node type from a BlueprintBookChild. */
function getChildType(child: BlueprintBookChild): BlueprintType {
  if ('blueprint' in child) return 'blueprint';
  if ('blueprint_book' in child) return 'blueprint_book';
  if ('upgrade_planner' in child) return 'upgrade_planner';
  return 'deconstruction_planner';
}

/** Get the node from a BlueprintBookChild. */
function getChildNode(child: BlueprintBookChild): BlueprintNode {
  if ('blueprint' in child) return child.blueprint;
  if ('blueprint_book' in child) return child.blueprint_book;
  if ('upgrade_planner' in child) return child.upgrade_planner;
  return (child as { deconstruction_planner: DeconstructionPlanner }).deconstruction_planner;
}

/** Walk a decoded BlueprintString to find the node at the given path. */
export function resolveNodeAtPath(
  data: BlueprintString,
  path: NodePath,
): { node: BlueprintNode; type: BlueprintType } | null {
  if (path.length === 0) {
    return { node: getRootNode(data), type: detectType(data) };
  }

  // Path must start from a blueprint book
  if (!('blueprint_book' in data)) return null;

  let currentBook = data.blueprint_book;
  for (let i = 0; i < path.length; i++) {
    const childIndex = path[i]!;
    if (!currentBook.blueprints || childIndex >= currentBook.blueprints.length) return null;
    const child = currentBook.blueprints[childIndex]!;

    if (i === path.length - 1) {
      return { node: getChildNode(child), type: getChildType(child) };
    }

    // Must be a book to continue traversal
    if (!('blueprint_book' in child)) return null;
    currentBook = child.blueprint_book;
  }

  return null;
}

/** Wrap a node back into a BlueprintString envelope for encoding. */
function wrapNode(node: BlueprintNode, type: BlueprintType): BlueprintString {
  switch (type) {
    case 'blueprint': return { blueprint: node as Blueprint };
    case 'blueprint_book': return { blueprint_book: node as BlueprintBook };
    case 'upgrade_planner': return { upgrade_planner: node as UpgradePlanner };
    case 'deconstruction_planner': return { deconstruction_planner: node as DeconstructionPlanner };
  }
}

/** Set the root node in a BlueprintString. */
function setRootNode(_data: BlueprintString, node: BlueprintNode, type: BlueprintType): BlueprintString {
  return wrapNode(node, type);
}

/** Replace a child node in a BlueprintBookChild. */
function setChildNode(child: BlueprintBookChild, node: BlueprintNode, type: BlueprintType): BlueprintBookChild {
  const index = child.index;
  switch (type) {
    case 'blueprint': return { index, blueprint: node as Blueprint };
    case 'blueprint_book': return { index, blueprint_book: node as BlueprintBook };
    case 'upgrade_planner': return { index, upgrade_planner: node as UpgradePlanner };
    case 'deconstruction_planner': return { index, deconstruction_planner: node as DeconstructionPlanner };
  }
}

/**
 * Apply an updater to the node at the given path within a BlueprintString.
 * Returns a new BlueprintString with the updated node; the input is not mutated.
 */
export function applyAtPath(
  data: BlueprintString,
  path: NodePath,
  updater: (node: BlueprintNode, type: BlueprintType) => BlueprintNode,
): BlueprintString {
  if (path.length === 0) {
    const rootType = detectType(data);
    const rootNode = getRootNode(data);
    return setRootNode(data, updater(rootNode, rootType), rootType);
  }

  if (!('blueprint_book' in data)) return data;

  // Recursive helper to rebuild the book tree immutably
  function rebuildBook(book: BlueprintBook, remainingPath: number[]): BlueprintBook {
    const [idx, ...rest] = remainingPath;
    if (idx === undefined || !book.blueprints || idx >= book.blueprints.length) return book;
    const child = book.blueprints[idx]!;

    let newChild: BlueprintBookChild;
    if (rest.length === 0) {
      // Apply updater to this child
      const childType = getChildType(child);
      const childNode = getChildNode(child);
      newChild = setChildNode(child, updater(childNode, childType), childType);
    } else {
      // Recurse into nested book
      if (!('blueprint_book' in child)) return book;
      const nestedBook = rebuildBook(child.blueprint_book, rest);
      newChild = { ...child, blueprint_book: nestedBook };
    }

    const newChildren = [...book.blueprints];
    newChildren[idx] = newChild;
    return { ...book, blueprints: newChildren };
  }

  return { blueprint_book: rebuildBook(data.blueprint_book, path) };
}

export function useBlueprintEditor() {
  const [inputString, setInputString] = useState('');
  const [decoded, setDecoded] = useState<DecodedResult | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<NodePath>([]);

  // History (undo/redo) — must be before callbacks that reference it
  const history = useEditorHistory(decoded, selectedPath, setDecoded, setSelectedPath);

  // Editor mode (select / place / wire)
  const editorMode = useEditorMode();

  const handleDecode = useCallback((value?: string) => {
    const raw = (value ?? inputString).trim();
    if (!raw) {
      setDecodeError('Please paste a blueprint string');
      return;
    }
    try {
      const data = decode(raw);
      const type = detectType(data);
      setDecoded({ raw: data, type, originalString: raw });
      setDecodeError(null);
      history.reset();
      editorMode.resetMode();

      // Update URL hash with blueprint string for sharing (skip if too large for URL)
      if (raw.length < 8000) {
        try {
          window.history.replaceState(null, '', `#blueprint=${encodeURIComponent(raw)}`);
        } catch { /* ignore hash update failures */ }
      }

      // Auto-select: for books, select the active_index child; otherwise root
      if (type === 'blueprint_book' && 'blueprint_book' in data) {
        const book = data.blueprint_book;
        if (book.blueprints?.length > 0) {
          setSelectedPath([book.active_index ?? 0]);
        } else {
          setSelectedPath([]);
        }
      } else {
        setSelectedPath([]);
      }
    } catch (err) {
      setDecoded(null);
      setDecodeError(err instanceof Error ? err.message : 'Failed to decode blueprint string');
    }
  }, [inputString, history.reset, editorMode.resetMode]);

  const handleClear = useCallback(() => {
    setInputString('');
    setDecoded(null);
    setDecodeError(null);
    setSelectedPath([]);
    history.reset();
    editorMode.resetMode();
    try { window.history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
  }, [history.reset, editorMode.resetMode]);

  // Auto-decode from URL hash on initial load
  const hashLoadedRef = useRef(false);
  useEffect(() => {
    if (hashLoadedRef.current) return;
    hashLoadedRef.current = true;
    const hash = window.location.hash;
    if (!hash.startsWith('#blueprint=')) return;
    const bpStr = decodeURIComponent(hash.slice('#blueprint='.length));
    if (bpStr) {
      setInputString(bpStr);
      handleDecode(bpStr);
    }
  }, [handleDecode]);

  /** Apply an updater function to the currently selected node (raw, no history). */
  const applyNodeUpdate = useCallback((
    updater: (node: BlueprintNode, type: BlueprintType) => BlueprintNode,
  ) => {
    setDecoded(prev => {
      if (!prev) return prev;
      const newRaw = applyAtPath(prev.raw, selectedPath, updater);
      if (newRaw === prev.raw) return prev;
      return { ...prev, raw: newRaw };
    });
  }, [selectedPath]);

  /** Apply an updater function to the currently selected node, with undo support. */
  const updateSelectedNode = useCallback((
    updater: (node: BlueprintNode, type: BlueprintType) => BlueprintNode,
  ) => {
    history.pushSnapshot();
    applyNodeUpdate(updater);
  }, [history.pushSnapshot, applyNodeUpdate]);

  /** Apply an updater to the root book (for structural book mutations), with undo support. */
  const updateRootBook = useCallback((
    updater: (book: BlueprintBook) => BlueprintBook,
  ) => {
    history.pushSnapshot();
    setDecoded(prev => {
      if (!prev || !('blueprint_book' in prev.raw)) return prev;
      const newBook = updater(prev.raw.blueprint_book);
      if (newBook === prev.raw.blueprint_book) return prev;
      return { ...prev, raw: { blueprint_book: newBook } };
    });
  }, [history.pushSnapshot]);

  const resolved = useMemo(() => {
    if (!decoded) return null;
    return resolveNodeAtPath(decoded.raw, selectedPath);
  }, [decoded, selectedPath]);

  const selectedNode = resolved?.node ?? null;
  const selectedNodeType = resolved?.type ?? null;

  const reEncoded = useMemo(() => {
    if (!selectedNode || !selectedNodeType) return { string: null, error: null };
    try {
      const wrapped = wrapNode(selectedNode, selectedNodeType);
      return { string: encode(wrapped), error: null };
    } catch (err) {
      return { string: null, error: err instanceof Error ? err.message : 'Failed to encode' };
    }
  }, [selectedNode, selectedNodeType]);

  const formattedVersion = useMemo(() => {
    if (!selectedNode || !('version' in selectedNode)) return null;
    try {
      return formatVersion(selectedNode.version);
    } catch {
      return null;
    }
  }, [selectedNode]);

  return {
    inputString,
    setInputString,
    decoded,
    decodeError,
    handleDecode,
    handleClear,
    selectedPath,
    setSelectedPath,
    selectedNode,
    selectedNodeType,
    updateSelectedNode,
    updateRootBook,
    reEncodedString: reEncoded.string,
    reEncodeError: reEncoded.error,
    formattedVersion,
    // Undo/redo
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    // Editor mode
    editorMode,
  };
}
