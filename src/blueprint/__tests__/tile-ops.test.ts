import { describe, it, expect } from "vitest";
import {
  getTileNames,
  addTilesUnderEntities,
  addTilesFillBounds,
  removeTilesByType,
  clearAllTiles,
} from "../tile-ops";
import type { Blueprint } from "../types";

function makeBlueprint(
  entities: { name: string; x: number; y: number }[],
  tiles?: { name: string; x: number; y: number }[],
): Blueprint {
  return {
    item: "blueprint",
    version: 0,
    entities: entities.map((e, i) => ({
      entity_number: i + 1,
      name: e.name,
      position: { x: e.x, y: e.y },
    })),
    tiles: tiles?.map((t) => ({
      name: t.name,
      position: { x: t.x, y: t.y },
    })),
  };
}

describe("getTileNames", () => {
  it("returns empty array for no tiles", () => {
    const bp = makeBlueprint([{ name: "belt", x: 0, y: 0 }]);
    expect(getTileNames(bp)).toEqual([]);
  });

  it("returns sorted unique names", () => {
    const bp = makeBlueprint([], [
      { name: "landfill", x: 0, y: 0 },
      { name: "concrete", x: 1, y: 0 },
      { name: "landfill", x: 2, y: 0 },
    ]);
    expect(getTileNames(bp)).toEqual(["concrete", "landfill"]);
  });
});

describe("addTilesUnderEntities", () => {
  it("returns same blueprint if no entities", () => {
    const bp = makeBlueprint([]);
    expect(addTilesUnderEntities(bp)).toBe(bp);
  });

  it("adds tiles at floored entity positions", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0.5, y: 0.5 },
      { name: "belt", x: 1.5, y: 0.5 },
    ]);
    const result = addTilesUnderEntities(bp);
    expect(result.tiles).toHaveLength(2);
    expect(result.tiles![0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.tiles![1]!.position).toEqual({ x: 1, y: 0 });
    expect(result.tiles![0]!.name).toBe("landfill");
  });

  it("uses custom tile name", () => {
    const bp = makeBlueprint([{ name: "belt", x: 0.5, y: 0.5 }]);
    const result = addTilesUnderEntities(bp, "concrete");
    expect(result.tiles![0]!.name).toBe("concrete");
  });

  it("does not duplicate existing tile positions", () => {
    const bp = makeBlueprint(
      [{ name: "belt", x: 0.5, y: 0.5 }],
      [{ name: "landfill", x: 0, y: 0 }],
    );
    const result = addTilesUnderEntities(bp);
    expect(result).toBe(bp); // no change
  });

  it("skips duplicate entity positions", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0.5, y: 0.5 },
      { name: "inserter", x: 0.9, y: 0.9 }, // same tile: floor(0.9) = 0
    ]);
    const result = addTilesUnderEntities(bp);
    expect(result.tiles).toHaveLength(1);
  });

  it("does not mutate the original", () => {
    const bp = makeBlueprint([{ name: "belt", x: 0.5, y: 0.5 }]);
    addTilesUnderEntities(bp);
    expect(bp.tiles).toBeUndefined();
  });
});

describe("addTilesFillBounds", () => {
  it("returns same blueprint if no bounds", () => {
    const bp: Blueprint = { item: "blueprint", version: 0 };
    expect(addTilesFillBounds(bp)).toBe(bp);
  });

  it("fills rectangular area", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0.5, y: 0.5 },
      { name: "belt", x: 2.5, y: 1.5 },
    ]);
    const result = addTilesFillBounds(bp);
    // Bounds: minX=0.5, minY=0.5, maxX=2.5, maxY=1.5
    // Floor: 0..2 x 0..1 = 6 tiles
    expect(result.tiles).toHaveLength(6);
  });

  it("skips existing tiles", () => {
    const bp = makeBlueprint(
      [
        { name: "belt", x: 0.5, y: 0.5 },
        { name: "belt", x: 1.5, y: 0.5 },
      ],
      [{ name: "concrete", x: 0, y: 0 }],
    );
    const result = addTilesFillBounds(bp);
    // 2 positions (0,0 and 1,0), one already has a tile
    expect(result.tiles).toHaveLength(2); // existing + 1 new
    expect(result.tiles![0]!.name).toBe("concrete"); // preserved
    expect(result.tiles![1]!.name).toBe("landfill"); // new
  });
});

describe("removeTilesByType", () => {
  it("returns same blueprint if name not found", () => {
    const bp = makeBlueprint([], [{ name: "landfill", x: 0, y: 0 }]);
    expect(removeTilesByType(bp, "concrete")).toBe(bp);
  });

  it("returns same blueprint if no tiles", () => {
    const bp = makeBlueprint([{ name: "belt", x: 0, y: 0 }]);
    expect(removeTilesByType(bp, "landfill")).toBe(bp);
  });

  it("removes matching tiles", () => {
    const bp = makeBlueprint([], [
      { name: "landfill", x: 0, y: 0 },
      { name: "concrete", x: 1, y: 0 },
      { name: "landfill", x: 2, y: 0 },
    ]);
    const result = removeTilesByType(bp, "landfill");
    expect(result.tiles).toHaveLength(1);
    expect(result.tiles![0]!.name).toBe("concrete");
  });

  it("sets tiles to undefined when all removed", () => {
    const bp = makeBlueprint([], [{ name: "landfill", x: 0, y: 0 }]);
    const result = removeTilesByType(bp, "landfill");
    expect(result.tiles).toBeUndefined();
  });
});

describe("clearAllTiles", () => {
  it("returns same blueprint if no tiles", () => {
    const bp = makeBlueprint([{ name: "belt", x: 0, y: 0 }]);
    expect(clearAllTiles(bp)).toBe(bp);
  });

  it("removes all tiles", () => {
    const bp = makeBlueprint(
      [{ name: "belt", x: 0, y: 0 }],
      [
        { name: "landfill", x: 0, y: 0 },
        { name: "concrete", x: 1, y: 0 },
      ],
    );
    const result = clearAllTiles(bp);
    expect(result.tiles).toBeUndefined();
    expect(result.entities).toHaveLength(1); // entities preserved
  });
});
