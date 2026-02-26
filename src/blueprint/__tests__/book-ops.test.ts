import { describe, it, expect } from "vitest";
import {
  removeChild,
  moveChild,
  setActiveIndex,
  addEmptyBlueprint,
  addEmptyBook,
  duplicateChild,
} from "../book-ops";
import type { BlueprintBook, BlueprintBookChild } from "../types";

function makeBook(childCount: number, activeIndex = 0): BlueprintBook {
  const blueprints: BlueprintBookChild[] = Array.from({ length: childCount }, (_, i) => ({
    index: i,
    blueprint: { item: "blueprint", version: 0, label: `bp-${i}` },
  }));
  return {
    item: "blueprint-book",
    version: 0,
    active_index: activeIndex,
    blueprints,
  };
}

describe("removeChild", () => {
  it("returns same book for invalid index", () => {
    const book = makeBook(3);
    expect(removeChild(book, -1)).toBe(book);
    expect(removeChild(book, 5)).toBe(book);
  });

  it("removes child and re-indexes", () => {
    const book = makeBook(3);
    const result = removeChild(book, 1);
    expect(result.blueprints).toHaveLength(2);
    expect(result.blueprints![0]!.index).toBe(0);
    expect(result.blueprints![1]!.index).toBe(1);
    // Labels should show first and third child
    expect((result.blueprints![0]! as any).blueprint.label).toBe("bp-0");
    expect((result.blueprints![1]! as any).blueprint.label).toBe("bp-2");
  });

  it("clamps active_index when removing last child", () => {
    const book = makeBook(3, 2);
    const result = removeChild(book, 2);
    expect(result.active_index).toBe(1);
  });

  it("preserves active_index when removing before it", () => {
    const book = makeBook(3, 2);
    const result = removeChild(book, 0);
    // active_index 2 is still valid (now 1 items left with indices 0,1)
    expect(result.active_index).toBe(1); // clamped to length-1
  });

  it("does not mutate the original", () => {
    const book = makeBook(3);
    removeChild(book, 1);
    expect(book.blueprints).toHaveLength(3);
  });
});

describe("moveChild", () => {
  it("returns same book for same indices", () => {
    const book = makeBook(3);
    expect(moveChild(book, 1, 1)).toBe(book);
  });

  it("returns same book for out-of-range indices", () => {
    const book = makeBook(3);
    expect(moveChild(book, -1, 0)).toBe(book);
    expect(moveChild(book, 0, 5)).toBe(book);
  });

  it("moves first to last", () => {
    const book = makeBook(3);
    const result = moveChild(book, 0, 2);
    expect((result.blueprints![0]! as any).blueprint.label).toBe("bp-1");
    expect((result.blueprints![1]! as any).blueprint.label).toBe("bp-2");
    expect((result.blueprints![2]! as any).blueprint.label).toBe("bp-0");
    // Re-indexed
    expect(result.blueprints![0]!.index).toBe(0);
    expect(result.blueprints![1]!.index).toBe(1);
    expect(result.blueprints![2]!.index).toBe(2);
  });

  it("moves last to first", () => {
    const book = makeBook(3);
    const result = moveChild(book, 2, 0);
    expect((result.blueprints![0]! as any).blueprint.label).toBe("bp-2");
    expect((result.blueprints![1]! as any).blueprint.label).toBe("bp-0");
    expect((result.blueprints![2]! as any).blueprint.label).toBe("bp-1");
  });
});

describe("setActiveIndex", () => {
  it("returns same book if index unchanged", () => {
    const book = makeBook(3, 1);
    expect(setActiveIndex(book, 1)).toBe(book);
  });

  it("sets active index", () => {
    const book = makeBook(3, 0);
    const result = setActiveIndex(book, 2);
    expect(result.active_index).toBe(2);
  });

  it("clamps to valid range", () => {
    const book = makeBook(3);
    expect(setActiveIndex(book, -1).active_index).toBe(0);
    expect(setActiveIndex(book, 10).active_index).toBe(2);
  });
});

describe("addEmptyBlueprint", () => {
  it("appends a new blueprint child", () => {
    const book = makeBook(2);
    const result = addEmptyBlueprint(book);
    expect(result.blueprints).toHaveLength(3);
    const last = result.blueprints![2]!;
    expect(last.index).toBe(2);
    expect("blueprint" in last).toBe(true);
    expect((last as any).blueprint.item).toBe("blueprint");
  });

  it("works on empty book", () => {
    const book: BlueprintBook = {
      item: "blueprint-book",
      version: 100,
      active_index: 0,
      blueprints: [],
    };
    const result = addEmptyBlueprint(book);
    expect(result.blueprints).toHaveLength(1);
    expect((result.blueprints![0]! as any).blueprint.version).toBe(100);
  });
});

describe("addEmptyBook", () => {
  it("appends a new sub-book child", () => {
    const book = makeBook(1);
    const result = addEmptyBook(book);
    expect(result.blueprints).toHaveLength(2);
    const last = result.blueprints![1]!;
    expect("blueprint_book" in last).toBe(true);
    expect((last as any).blueprint_book.item).toBe("blueprint-book");
    expect((last as any).blueprint_book.blueprints).toEqual([]);
  });
});

describe("duplicateChild", () => {
  it("returns same book for invalid index", () => {
    const book = makeBook(2);
    expect(duplicateChild(book, -1)).toBe(book);
    expect(duplicateChild(book, 5)).toBe(book);
  });

  it("duplicates and inserts after original", () => {
    const book = makeBook(3);
    const result = duplicateChild(book, 1);
    expect(result.blueprints).toHaveLength(4);
    expect((result.blueprints![1]! as any).blueprint.label).toBe("bp-1");
    expect((result.blueprints![2]! as any).blueprint.label).toBe("bp-1"); // copy
    expect((result.blueprints![3]! as any).blueprint.label).toBe("bp-2");
    // Re-indexed
    expect(result.blueprints![2]!.index).toBe(2);
    expect(result.blueprints![3]!.index).toBe(3);
  });

  it("produces an independent copy", () => {
    const book = makeBook(2);
    const result = duplicateChild(book, 0);
    // Mutate the copy
    (result.blueprints![1]! as any).blueprint.label = "modified";
    // Original should be unchanged
    expect((result.blueprints![0]! as any).blueprint.label).toBe("bp-0");
  });
});
