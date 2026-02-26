import { describe, it, expect } from "vitest";
import {
  translateToOrigin,
  translateBy,
  computeBounds,
  rotate90CW,
  rotate90CCW,
  mirrorHorizontal,
  mirrorVertical,
} from "../transforms";
import { Direction } from "../types";
import type { Blueprint } from "../types";

function makeBlueprint(
  entities: { name: string; x: number; y: number; direction?: Direction }[],
  tiles?: { name: string; x: number; y: number }[],
): Blueprint {
  return {
    item: "blueprint",
    version: 0,
    entities: entities.map((e, i) => ({
      entity_number: i + 1,
      name: e.name,
      position: { x: e.x, y: e.y },
      ...(e.direction != null ? { direction: e.direction } : {}),
    })),
    tiles: tiles?.map((t) => ({
      name: t.name,
      position: { x: t.x, y: t.y },
    })),
  };
}

describe("computeBounds", () => {
  it("returns null for an empty blueprint", () => {
    const bp = makeBlueprint([]);
    expect(computeBounds(bp)).toBeNull();
  });

  it("computes bounds from entities", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 3, y: 5 },
      { name: "belt", x: 7, y: 2 },
      { name: "belt", x: 1, y: 8 },
    ]);
    expect(computeBounds(bp)).toEqual({
      minX: 1,
      minY: 2,
      maxX: 7,
      maxY: 8,
    });
  });

  it("includes tiles in bounds", () => {
    const bp = makeBlueprint(
      [{ name: "belt", x: 5, y: 5 }],
      [{ name: "landfill", x: 0, y: 0 }],
    );
    expect(computeBounds(bp)).toEqual({
      minX: 0,
      minY: 0,
      maxX: 5,
      maxY: 5,
    });
  });

  it("handles negative positions", () => {
    const bp = makeBlueprint([
      { name: "belt", x: -3, y: -2 },
      { name: "belt", x: 1, y: 4 },
    ]);
    expect(computeBounds(bp)).toEqual({
      minX: -3,
      minY: -2,
      maxX: 1,
      maxY: 4,
    });
  });
});

describe("translateToOrigin", () => {
  it("returns the same blueprint if already at origin", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0 },
      { name: "belt", x: 1, y: 1 },
    ]);
    const result = translateToOrigin(bp);
    expect(result).toBe(bp); // identity — no mutation needed
  });

  it("returns the same blueprint if empty", () => {
    const bp = makeBlueprint([]);
    const result = translateToOrigin(bp);
    expect(result).toBe(bp);
  });

  it("translates positive positions to origin", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 3, y: 5 },
      { name: "belt", x: 7, y: 2 },
    ]);
    const result = translateToOrigin(bp);
    expect(result.entities![0]!.position).toEqual({ x: 0, y: 3 });
    expect(result.entities![1]!.position).toEqual({ x: 4, y: 0 });
  });

  it("translates negative positions to origin", () => {
    const bp = makeBlueprint([
      { name: "belt", x: -3, y: -2 },
      { name: "belt", x: 1, y: 4 },
    ]);
    const result = translateToOrigin(bp);
    expect(result.entities![0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.entities![1]!.position).toEqual({ x: 4, y: 6 });
  });

  it("translates tiles alongside entities", () => {
    const bp = makeBlueprint(
      [{ name: "belt", x: 5, y: 5 }],
      [{ name: "landfill", x: 3, y: 2 }],
    );
    const result = translateToOrigin(bp);
    expect(result.entities![0]!.position).toEqual({ x: 2, y: 3 });
    expect(result.tiles![0]!.position).toEqual({ x: 0, y: 0 });
  });

  it("does not mutate the original blueprint", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 5, y: 3 },
      { name: "belt", x: 8, y: 7 },
    ]);
    const original0 = bp.entities![0]!.position;
    translateToOrigin(bp);
    expect(original0).toEqual({ x: 5, y: 3 });
  });

  it("preserves non-position entity fields", () => {
    const bp: Blueprint = {
      item: "blueprint",
      version: 100,
      label: "test",
      entities: [
        { entity_number: 1, name: "assembling-machine-3", position: { x: 5, y: 5 }, recipe: "iron-gear-wheel" },
      ],
    };
    const result = translateToOrigin(bp);
    expect(result.entities![0]!.recipe).toBe("iron-gear-wheel");
    expect(result.entities![0]!.name).toBe("assembling-machine-3");
    expect(result.entities![0]!.entity_number).toBe(1);
    expect(result.label).toBe("test");
    expect(result.version).toBe(100);
  });
});

describe("translateBy", () => {
  it("returns the same blueprint for zero offset", () => {
    const bp = makeBlueprint([{ name: "belt", x: 1, y: 2 }]);
    expect(translateBy(bp, 0, 0)).toBe(bp);
  });

  it("translates by the given offset", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0 },
      { name: "belt", x: 1, y: 1 },
    ]);
    const result = translateBy(bp, 10, -5);
    expect(result.entities![0]!.position).toEqual({ x: 10, y: -5 });
    expect(result.entities![1]!.position).toEqual({ x: 11, y: -4 });
  });

  it("translates tiles too", () => {
    const bp = makeBlueprint([], [{ name: "landfill", x: 0, y: 0 }]);
    const result = translateBy(bp, 3, 4);
    expect(result.tiles![0]!.position).toEqual({ x: 3, y: 4 });
  });
});

describe("rotate90CW", () => {
  it("rotates positions and translates to origin", () => {
    // Two belts in a horizontal line: (0,0) and (1,0)
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0 },
      { name: "belt", x: 1, y: 0 },
    ]);
    const result = rotate90CW(bp);
    // CW: (x,y) → (-y,x). (0,0)→(0,0), (1,0)→(0,1). Then translateToOrigin is identity.
    expect(result.entities![0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.entities![1]!.position).toEqual({ x: 0, y: 1 });
  });

  it("rotates entity direction CW", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.North },
    ]);
    const result = rotate90CW(bp);
    expect(result.entities![0]!.direction).toBe(Direction.East);
  });

  it("rotates East to South", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.East },
    ]);
    expect(rotate90CW(bp).entities![0]!.direction).toBe(Direction.South);
  });

  it("rotates tiles", () => {
    const bp = makeBlueprint(
      [],
      [
        { name: "stone-path", x: 0, y: 0 },
        { name: "stone-path", x: 1, y: 0 },
      ],
    );
    const result = rotate90CW(bp);
    // CW: (0,0)→(0,0), (1,0)→(0,1)
    expect(result.tiles![0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.tiles![1]!.position).toEqual({ x: 0, y: 1 });
  });

  it("swaps snap-to-grid dimensions", () => {
    const bp: Blueprint = {
      item: "blueprint",
      version: 0,
      entities: [{ entity_number: 1, name: "belt", position: { x: 0, y: 0 } }],
      "snap-to-grid": { x: 3, y: 5 },
    };
    const result = rotate90CW(bp);
    expect(result["snap-to-grid"]).toEqual({ x: 5, y: 3 });
  });

  it("does not mutate the original", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 1, y: 2, direction: Direction.North },
    ]);
    const origPos = { ...bp.entities![0]!.position };
    rotate90CW(bp);
    expect(bp.entities![0]!.position).toEqual(origPos);
  });
});

describe("rotate90CCW", () => {
  it("rotates positions and translates to origin", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0 },
      { name: "belt", x: 1, y: 0 },
    ]);
    const result = rotate90CCW(bp);
    // CCW: (x,y) → (y,-x). (0,0)→(0,0), (1,0)→(0,-1). After origin: (0,1) and (0,0).
    expect(result.entities![0]!.position).toEqual({ x: 0, y: 1 });
    expect(result.entities![1]!.position).toEqual({ x: 0, y: 0 });
  });

  it("rotates North to West", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.North },
    ]);
    expect(rotate90CCW(bp).entities![0]!.direction).toBe(Direction.West);
  });

  it("is inverse of rotate90CW", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.NorthEast },
      { name: "belt", x: 1, y: 0, direction: Direction.South },
    ]);
    // CW then CCW should give same positions (after origin normalization)
    const cw = rotate90CW(bp);
    const back = rotate90CCW(cw);
    expect(back.entities![0]!.direction).toBe(Direction.NorthEast);
    expect(back.entities![1]!.direction).toBe(Direction.South);
  });
});

describe("mirrorHorizontal", () => {
  it("mirrors positions and translates to origin", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0 },
      { name: "belt", x: 2, y: 0 },
    ]);
    const result = mirrorHorizontal(bp);
    // H mirror: (x,y) → (-x,y). (0,0)→(0,0), (2,0)→(-2,0). After origin: (2,0) and (0,0).
    expect(result.entities![0]!.position).toEqual({ x: 2, y: 0 });
    expect(result.entities![1]!.position).toEqual({ x: 0, y: 0 });
  });

  it("mirrors East to West", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.East },
    ]);
    expect(mirrorHorizontal(bp).entities![0]!.direction).toBe(Direction.West);
  });

  it("keeps North as North", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.North },
    ]);
    expect(mirrorHorizontal(bp).entities![0]!.direction).toBe(Direction.North);
  });

  it("mirrors NorthEast to NorthWest", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.NorthEast },
    ]);
    expect(mirrorHorizontal(bp).entities![0]!.direction).toBe(Direction.NorthWest);
  });

  it("mirrors tiles", () => {
    const bp = makeBlueprint(
      [],
      [
        { name: "stone-path", x: 0, y: 0 },
        { name: "stone-path", x: 3, y: 0 },
      ],
    );
    const result = mirrorHorizontal(bp);
    expect(result.tiles![0]!.position).toEqual({ x: 3, y: 0 });
    expect(result.tiles![1]!.position).toEqual({ x: 0, y: 0 });
  });

  it("is its own inverse (double mirror = identity)", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.NorthEast },
      { name: "belt", x: 1, y: 2, direction: Direction.SouthWest },
    ]);
    const twice = mirrorHorizontal(mirrorHorizontal(bp));
    expect(twice.entities![0]!.direction).toBe(Direction.NorthEast);
    expect(twice.entities![1]!.direction).toBe(Direction.SouthWest);
  });
});

describe("mirrorVertical", () => {
  it("mirrors positions and translates to origin", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0 },
      { name: "belt", x: 0, y: 2 },
    ]);
    const result = mirrorVertical(bp);
    // V mirror: (x,y) → (x,-y). (0,0)→(0,0), (0,2)→(0,-2). After origin: (0,2) and (0,0).
    expect(result.entities![0]!.position).toEqual({ x: 0, y: 2 });
    expect(result.entities![1]!.position).toEqual({ x: 0, y: 0 });
  });

  it("mirrors North to South", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.North },
    ]);
    expect(mirrorVertical(bp).entities![0]!.direction).toBe(Direction.South);
  });

  it("keeps East as East", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.East },
    ]);
    expect(mirrorVertical(bp).entities![0]!.direction).toBe(Direction.East);
  });

  it("mirrors NorthEast to SouthEast", () => {
    const bp = makeBlueprint([
      { name: "belt", x: 0, y: 0, direction: Direction.NorthEast },
    ]);
    expect(mirrorVertical(bp).entities![0]!.direction).toBe(Direction.SouthEast);
  });
});
