import { useCallback } from 'react';
import type { NodePath } from '../../hooks/useBlueprintEditor.js';
import type { BlueprintBook } from '../../../blueprint/index.js';
import {
  removeChild,
  moveChild,
  duplicateChild,
  addEmptyBlueprint,
  addEmptyBook,
  setActiveIndex,
} from '../../../blueprint/index.js';
import { Button } from '../../ui/index.js';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import FolderPlusIcon from 'lucide-react/dist/esm/icons/folder-plus';
import CopyIcon from 'lucide-react/dist/esm/icons/copy';
import ChevronUpIcon from 'lucide-react/dist/esm/icons/chevron-up';
import ChevronDownIcon from 'lucide-react/dist/esm/icons/chevron-down';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import StarIcon from 'lucide-react/dist/esm/icons/star';

interface BlueprintBookActionsProps {
  book: BlueprintBook;
  selectedPath: NodePath;
  onUpdateBook: (updater: (book: BlueprintBook) => BlueprintBook) => void;
  onSelectPath: (path: NodePath) => void;
}

export function BlueprintBookActions({
  book,
  selectedPath,
  onUpdateBook,
  onSelectPath,
}: BlueprintBookActionsProps) {
  const childCount = book.blueprints?.length ?? 0;
  // The selected child index within this book (last segment of path, or -1 if at root)
  const selectedChildIndex = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1]! : -1;
  const hasSelection = selectedChildIndex >= 0 && selectedChildIndex < childCount;

  const handleAddBlueprint = useCallback(() => {
    onUpdateBook(b => addEmptyBlueprint(b));
    onSelectPath([childCount]);
  }, [onUpdateBook, onSelectPath, childCount]);

  const handleAddBook = useCallback(() => {
    onUpdateBook(b => addEmptyBook(b));
    onSelectPath([childCount]);
  }, [onUpdateBook, onSelectPath, childCount]);

  const handleDuplicate = useCallback(() => {
    if (!hasSelection) return;
    onUpdateBook(b => duplicateChild(b, selectedChildIndex));
    onSelectPath([selectedChildIndex + 1]);
  }, [onUpdateBook, onSelectPath, hasSelection, selectedChildIndex]);

  const handleMoveUp = useCallback(() => {
    if (!hasSelection || selectedChildIndex === 0) return;
    onUpdateBook(b => moveChild(b, selectedChildIndex, selectedChildIndex - 1));
    onSelectPath([selectedChildIndex - 1]);
  }, [onUpdateBook, onSelectPath, hasSelection, selectedChildIndex]);

  const handleMoveDown = useCallback(() => {
    if (!hasSelection || selectedChildIndex >= childCount - 1) return;
    onUpdateBook(b => moveChild(b, selectedChildIndex, selectedChildIndex + 1));
    onSelectPath([selectedChildIndex + 1]);
  }, [onUpdateBook, onSelectPath, hasSelection, selectedChildIndex, childCount]);

  const handleRemove = useCallback(() => {
    if (!hasSelection) return;
    onUpdateBook(b => removeChild(b, selectedChildIndex));
    const newCount = childCount - 1;
    if (newCount === 0) {
      onSelectPath([]);
    } else {
      onSelectPath([Math.min(selectedChildIndex, newCount - 1)]);
    }
  }, [onUpdateBook, onSelectPath, hasSelection, selectedChildIndex, childCount]);

  const handleSetActive = useCallback(() => {
    if (!hasSelection) return;
    onUpdateBook(b => setActiveIndex(b, selectedChildIndex));
  }, [onUpdateBook, hasSelection, selectedChildIndex]);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border flex-wrap">
      <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleAddBlueprint} title="Add blueprint">
        <PlusIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleAddBook} title="Add sub-book">
        <FolderPlusIcon className="size-3.5" />
      </Button>

      <span className="w-px h-4 bg-border mx-0.5" />

      <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleDuplicate} disabled={!hasSelection} title="Duplicate">
        <CopyIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleMoveUp} disabled={!hasSelection || selectedChildIndex === 0} title="Move up">
        <ChevronUpIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleMoveDown} disabled={!hasSelection || selectedChildIndex >= childCount - 1} title="Move down">
        <ChevronDownIcon className="size-3.5" />
      </Button>

      <span className="w-px h-4 bg-border mx-0.5" />

      <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={handleSetActive} disabled={!hasSelection || selectedChildIndex === (book.active_index ?? 0)} title="Set as active">
        <StarIcon className="size-3.5" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 px-1.5 text-destructive" onClick={handleRemove} disabled={!hasSelection} title="Remove">
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
