import type { BlueprintBook, BlueprintBookChild } from "./types";

/**
 * Remove the child at the given index from the book.
 * Re-indexes remaining children. Adjusts active_index if needed.
 */
export function removeChild(book: BlueprintBook, childIndex: number): BlueprintBook {
  if (!book.blueprints || childIndex < 0 || childIndex >= book.blueprints.length) return book;
  const newChildren = book.blueprints
    .filter((_, i) => i !== childIndex)
    .map((child, i) => ({ ...child, index: i }));
  const activeIndex = Math.min(book.active_index ?? 0, Math.max(0, newChildren.length - 1));
  return { ...book, blueprints: newChildren, active_index: activeIndex };
}

/**
 * Move a child from one position to another (reorder).
 * Re-indexes children sequentially after the move.
 */
export function moveChild(
  book: BlueprintBook,
  fromIndex: number,
  toIndex: number,
): BlueprintBook {
  if (!book.blueprints || fromIndex === toIndex) return book;
  if (fromIndex < 0 || fromIndex >= book.blueprints.length) return book;
  if (toIndex < 0 || toIndex >= book.blueprints.length) return book;
  const children = [...book.blueprints];
  const [moved] = children.splice(fromIndex, 1);
  children.splice(toIndex, 0, moved!);
  return {
    ...book,
    blueprints: children.map((child, i) => ({ ...child, index: i })),
  };
}

/**
 * Set the active_index of the book.
 * Clamps to valid range.
 */
export function setActiveIndex(book: BlueprintBook, index: number): BlueprintBook {
  const max = Math.max(0, (book.blueprints?.length ?? 1) - 1);
  const clamped = Math.max(0, Math.min(index, max));
  if (clamped === (book.active_index ?? 0)) return book;
  return { ...book, active_index: clamped };
}

/**
 * Add a new empty blueprint as a child at the end of the book.
 */
export function addEmptyBlueprint(book: BlueprintBook): BlueprintBook {
  const children = book.blueprints ?? [];
  const newChild: BlueprintBookChild = {
    index: children.length,
    blueprint: { item: "blueprint", version: book.version ?? 0 },
  };
  return { ...book, blueprints: [...children, newChild] };
}

/**
 * Add a new empty sub-book as a child at the end of the book.
 */
export function addEmptyBook(book: BlueprintBook): BlueprintBook {
  const children = book.blueprints ?? [];
  const newChild: BlueprintBookChild = {
    index: children.length,
    blueprint_book: {
      item: "blueprint-book",
      version: book.version ?? 0,
      active_index: 0,
      blueprints: [],
    },
  };
  return { ...book, blueprints: [...children, newChild] };
}

/**
 * Duplicate the child at the given index, inserting the copy right after.
 */
export function duplicateChild(book: BlueprintBook, childIndex: number): BlueprintBook {
  if (!book.blueprints || childIndex < 0 || childIndex >= book.blueprints.length) return book;
  const original = book.blueprints[childIndex]!;
  const copy = structuredClone(original);
  const children = [...book.blueprints];
  children.splice(childIndex + 1, 0, copy);
  return {
    ...book,
    blueprints: children.map((child, i) => ({ ...child, index: i })),
  };
}
