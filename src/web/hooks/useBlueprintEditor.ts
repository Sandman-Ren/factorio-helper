import { useState, useCallback, useMemo } from 'react';
import { decode, encode, formatVersion } from '../../blueprint/index.js';
import type {
  BlueprintString,
  Blueprint,
  BlueprintBook,
  BlueprintBookChild,
  UpgradePlanner,
  DeconstructionPlanner,
} from '../../blueprint/index.js';

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
    const child = currentBook.blueprints[childIndex]!
    if (!child) return null;

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

export function useBlueprintEditor() {
  const [inputString, setInputString] = useState('');
  const [decoded, setDecoded] = useState<DecodedResult | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<NodePath>([]);

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
  }, [inputString]);

  const handleClear = useCallback(() => {
    setInputString('');
    setDecoded(null);
    setDecodeError(null);
    setSelectedPath([]);
  }, []);

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
    reEncodedString: reEncoded.string,
    reEncodeError: reEncoded.error,
    formattedVersion,
  };
}
