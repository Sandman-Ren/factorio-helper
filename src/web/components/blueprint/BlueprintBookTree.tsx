import { useState, useCallback } from 'react';
import type { BlueprintBook, BlueprintBookChild } from '../../../blueprint/index.js';
import type { NodePath } from '../../hooks/useBlueprintEditor.js';
import { ScrollArea, Badge } from '../../ui/index.js';
import FolderIcon from 'lucide-react/dist/esm/icons/folder';
import FolderOpenIcon from 'lucide-react/dist/esm/icons/folder-open';
import FileIcon from 'lucide-react/dist/esm/icons/file';
import ArrowUpCircleIcon from 'lucide-react/dist/esm/icons/arrow-up-circle';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import ChevronRightIcon from 'lucide-react/dist/esm/icons/chevron-right';

function pathEquals(a: NodePath, b: NodePath): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function pathKey(path: NodePath): string {
  return path.join('.');
}

function getChildLabel(child: BlueprintBookChild): string | undefined {
  if ('blueprint' in child) return child.blueprint.label;
  if ('blueprint_book' in child) return child.blueprint_book.label;
  if ('upgrade_planner' in child) return child.upgrade_planner.label;
  return (child as { deconstruction_planner: { label?: string } }).deconstruction_planner.label;
}

function isBook(child: BlueprintBookChild): child is { index: number | null; blueprint_book: BlueprintBook } {
  return 'blueprint_book' in child;
}

interface TreeNodeProps {
  child: BlueprintBookChild;
  path: NodePath;
  selectedPath: NodePath;
  onSelectPath: (path: NodePath) => void;
  depth: number;
  isActiveIndex: boolean;
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
}

function TreeNode({
  child,
  path,
  selectedPath,
  onSelectPath,
  depth,
  isActiveIndex,
  expanded,
  onToggleExpand,
}: TreeNodeProps) {
  const key = pathKey(path);
  const isSelected = pathEquals(path, selectedPath);
  const label = getChildLabel(child) || 'Untitled';
  const isBookNode = isBook(child);
  const isExpanded = expanded.has(key);
  const indent = Math.min(depth, 5) * 16;

  const IconComponent = isBookNode
    ? (isExpanded ? FolderOpenIcon : FolderIcon)
    : 'upgrade_planner' in child
      ? ArrowUpCircleIcon
      : 'deconstruction_planner' in child
        ? Trash2Icon
        : FileIcon;

  return (
    <>
      <button
        className={`flex items-center gap-1.5 w-full px-2 py-1 text-sm rounded-md text-left transition-colors ${
          isSelected
            ? 'bg-[var(--color-factorio-selected)] text-foreground'
            : 'hover:bg-accent/50 text-foreground'
        }`}
        style={{ paddingLeft: indent + 8 }}
        onClick={() => onSelectPath(path)}
      >
        {isBookNode && (
          <span
            className="flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(key);
            }}
          >
            <ChevronRightIcon
              className={`size-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </span>
        )}
        <IconComponent className="size-4 flex-shrink-0 text-muted-foreground" />
        <span className={`truncate flex-1 ${!getChildLabel(child) ? 'italic text-muted-foreground' : ''}`}>
          {label}
        </span>
        {isActiveIndex && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">active</Badge>
        )}
      </button>

      {isBookNode && isExpanded && (
        <BookChildren
          book={child.blueprint_book}
          parentPath={path}
          selectedPath={selectedPath}
          onSelectPath={onSelectPath}
          depth={depth + 1}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
        />
      )}
    </>
  );
}

interface BookChildrenProps {
  book: BlueprintBook;
  parentPath: NodePath;
  selectedPath: NodePath;
  onSelectPath: (path: NodePath) => void;
  depth: number;
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
}

function BookChildren({
  book,
  parentPath,
  selectedPath,
  onSelectPath,
  depth,
  expanded,
  onToggleExpand,
}: BookChildrenProps) {
  if (!book.blueprints || book.blueprints.length === 0) {
    return (
      <div
        className="text-xs text-muted-foreground italic px-2 py-1"
        style={{ paddingLeft: Math.min(depth, 5) * 16 + 8 }}
      >
        Empty book
      </div>
    );
  }

  return (
    <>
      {book.blueprints.map((child, i) => (
        <TreeNode
          key={i}
          child={child}
          path={[...parentPath, i]}
          selectedPath={selectedPath}
          onSelectPath={onSelectPath}
          depth={depth}
          isActiveIndex={i === (book.active_index ?? 0)}
          expanded={expanded}
          onToggleExpand={onToggleExpand}
        />
      ))}
    </>
  );
}

interface BlueprintBookTreeProps {
  book: BlueprintBook;
  selectedPath: NodePath;
  onSelectPath: (path: NodePath) => void;
}

export function BlueprintBookTree({ book, selectedPath, onSelectPath }: BlueprintBookTreeProps) {
  // Default: expand the root
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(['root']));

  const onToggleExpand = useCallback((key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const isRootSelected = selectedPath.length === 0;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-0.5 py-1">
        {/* Root book entry */}
        <button
          className={`flex items-center gap-1.5 w-full px-2 py-1 text-sm rounded-md text-left transition-colors ${
            isRootSelected
              ? 'bg-[var(--color-factorio-selected)] text-foreground'
              : 'hover:bg-accent/50 text-foreground'
          }`}
          onClick={() => onSelectPath([])}
        >
          <span
            className="flex-shrink-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand('root');
            }}
          >
            <ChevronRightIcon
              className={`size-3 transition-transform ${expanded.has('root') ? 'rotate-90' : ''}`}
            />
          </span>
          <FolderOpenIcon className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className={`truncate flex-1 font-medium ${!book.label ? 'italic text-muted-foreground' : ''}`}>
            {book.label || 'Untitled Book'}
          </span>
        </button>

        {expanded.has('root') && (
          <BookChildren
            book={book}
            parentPath={[]}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
            depth={1}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
          />
        )}
      </div>
    </ScrollArea>
  );
}
