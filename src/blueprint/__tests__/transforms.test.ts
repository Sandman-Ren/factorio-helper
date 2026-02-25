import { describe, it, expect } from "vitest";
import { translateToOrigin, translateBy, computeBounds } from "../transforms";
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
