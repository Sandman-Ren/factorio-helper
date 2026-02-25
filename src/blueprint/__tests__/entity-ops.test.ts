import { describe, it, expect } from "vitest";
import {
  addEntity,
  cloneEntities,
  getEntityNames,
  moveEntities,
  removeByType,
  removeEntities,
  replaceEntity,
  rotateEntities,
  updateEntity,
} from "../entity-ops";
import type { Blueprint, WireConnection } from "../types";
import { WireConnectorId } from "../types";

function makeBlueprint(names: string[]): Blueprint {
  return {
    item: "blueprint",
    version: 0,
    entities: names.map((name, i) => ({
      entity_number: i + 1,
      name,
      position: { x: i, y: 0 },
    })),
  };
}

describe("getEntityNames", () => {
  it("returns empty array for no entities", () => {
    const bp: Blueprint = { item: "blueprint", version: 0 };
    expect(getEntityNames(bp)).toEqual([]);
  });

  it("returns sorted unique names", () => {
    const bp = makeBlueprint([
      "transport-belt",
      "inserter",
      "transport-belt",
      "assembling-machine-3",
      "inserter",
    ]);
    expect(getEntityNames(bp)).toEqual([
      "assembling-machine-3",
      "inserter",
      "transport-belt",
    ]);
  });
});

describe("removeByType", () => {
  it("returns same blueprint if name not found", () => {
    const bp = makeBlueprint(["transport-belt", "inserter"]);
    expect(removeByType(bp, "splitter")).toBe(bp);
  });

  it("removes matching entities and re-numbers", () => {
    const bp = makeBlueprint(["transport-belt", "inserter", "transport-belt"]);
    const result = removeByType(bp, "transport-belt");
    expect(result.entities).toHaveLength(1);
    expect(result.entities![0]!.name).toBe("inserter");
    expect(result.entities![0]!.entity_number).toBe(1);
  });

  it("does not mutate the original", () => {
    const bp = makeBlueprint(["transport-belt", "inserter"]);
    removeByType(bp, "transport-belt");
    expect(bp.entities).toHaveLength(2);
  });

  it("handles blueprint with no entities field", () => {
    const bp: Blueprint = { item: "blueprint", version: 0 };
    expect(removeByType(bp, "belt")).toBe(bp);
  });
});

describe("replaceEntity", () => {
  it("returns same blueprint if fromName not found", () => {
    const bp = makeBlueprint(["transport-belt"]);
    expect(replaceEntity(bp, "splitter", "fast-splitter")).toBe(bp);
  });

  it("returns same blueprint if fromName equals toName", () => {
    const bp = makeBlueprint(["transport-belt"]);
    expect(replaceEntity(bp, "transport-belt", "transport-belt")).toBe(bp);
  });

  it("replaces matching entity names", () => {
    const bp = makeBlueprint([
      "transport-belt",
      "inserter",
      "transport-belt",
    ]);
    const result = replaceEntity(bp, "transport-belt", "fast-transport-belt");
    expect(result.entities![0]!.name).toBe("fast-transport-belt");
    expect(result.entities![1]!.name).toBe("inserter");
    expect(result.entities![2]!.name).toBe("fast-transport-belt");
  });

  it("does not mutate the original", () => {
    const bp = makeBlueprint(["transport-belt"]);
    replaceEntity(bp, "transport-belt", "fast-transport-belt");
    expect(bp.entities![0]!.name).toBe("transport-belt");
  });

  it("preserves entity positions and other fields", () => {
    const bp = makeBlueprint(["transport-belt"]);
    const result = replaceEntity(bp, "transport-belt", "fast-transport-belt");
    expect(result.entities![0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.entities![0]!.entity_number).toBe(1);
  });
});

function makeBlueprintWithWires(
  names: string[],
  wires: WireConnection[] = [],
): Blueprint {
  return {
    item: "blueprint",
    version: 0,
    entities: names.map((name, i) => ({
      entity_number: i + 1,
      name,
      position: { x: i, y: 0 },
    })),
    wires: wires.length > 0 ? wires : undefined,
  };
}

describe("removeEntities", () => {
  it("removes entities by number set and renumbers", () => {
    const bp = makeBlueprint(["belt", "inserter", "chest"]);
    const result = removeEntities(bp, new Set([2]));
    expect(result.entities).toHaveLength(2);
    expect(result.entities![0]!.name).toBe("belt");
    expect(result.entities![0]!.entity_number).toBe(1);
    expect(result.entities![1]!.name).toBe("chest");
    expect(result.entities![1]!.entity_number).toBe(2);
  });

  it("fixes wire references after removal", () => {
    const wires: WireConnection[] = [
      [1, WireConnectorId.CircuitRed, 3, WireConnectorId.CircuitRed],
      [1, WireConnectorId.CircuitGreen, 2, WireConnectorId.CircuitGreen],
    ];
    const bp = makeBlueprintWithWires(["a", "b", "c"], wires);
    const result = removeEntities(bp, new Set([2]));
    // Wire between 1 and 3 (now 2) should survive; wire to entity 2 should be dropped
    expect(result.wires).toHaveLength(1);
    expect(result.wires![0]).toEqual([1, WireConnectorId.CircuitRed, 2, WireConnectorId.CircuitRed]);
  });

  it("returns same bp if no entities match", () => {
    const bp = makeBlueprint(["belt"]);
    expect(removeEntities(bp, new Set([99]))).toBe(bp);
  });
});

describe("moveEntities", () => {
  it("moves selected entities by delta", () => {
    const bp = makeBlueprint(["a", "b"]);
    const result = moveEntities(bp, new Set([1]), 5, 3);
    expect(result.entities![0]!.position).toEqual({ x: 5, y: 3 });
    expect(result.entities![1]!.position).toEqual({ x: 1, y: 0 }); // unmoved
  });

  it("returns same bp for zero delta", () => {
    const bp = makeBlueprint(["a"]);
    expect(moveEntities(bp, new Set([1]), 0, 0)).toBe(bp);
  });
});

describe("rotateEntities", () => {
  it("rotates direction CW by 90 degrees (4 steps)", () => {
    const bp: Blueprint = {
      item: "blueprint",
      version: 0,
      entities: [
        { entity_number: 1, name: "belt", position: { x: 0, y: 0 }, direction: 0 },
      ],
    };
    const result = rotateEntities(bp, new Set([1]), true);
    expect(result.entities![0]!.direction).toBe(4); // East
  });

  it("rotates direction CCW", () => {
    const bp: Blueprint = {
      item: "blueprint",
      version: 0,
      entities: [
        { entity_number: 1, name: "belt", position: { x: 0, y: 0 }, direction: 4 },
      ],
    };
    const result = rotateEntities(bp, new Set([1]), false);
    expect(result.entities![0]!.direction).toBe(0); // North
  });
});

describe("cloneEntities", () => {
  it("clones entities with offset and new numbers", () => {
    const bp = makeBlueprint(["a", "b"]);
    const result = cloneEntities(bp, new Set([1]), 10, 5);
    expect(result.entities).toHaveLength(3);
    expect(result.entities![2]!.entity_number).toBe(3);
    expect(result.entities![2]!.name).toBe("a");
    expect(result.entities![2]!.position).toEqual({ x: 10, y: 5 });
  });

  it("preserves internal wires in cloned group", () => {
    const wires: WireConnection[] = [
      [1, WireConnectorId.CircuitRed, 2, WireConnectorId.CircuitRed],
    ];
    const bp = makeBlueprintWithWires(["a", "b"], wires);
    const result = cloneEntities(bp, new Set([1, 2]), 5, 0);
    // Should have original wire + cloned wire
    expect(result.wires).toHaveLength(2);
    expect(result.wires![1]).toEqual([3, WireConnectorId.CircuitRed, 4, WireConnectorId.CircuitRed]);
  });
});

describe("addEntity", () => {
  it("adds entity with auto-numbered entity_number", () => {
    const bp = makeBlueprint(["a"]);
    const result = addEntity(bp, { name: "b", position: { x: 5, y: 5 } });
    expect(result.entities).toHaveLength(2);
    expect(result.entities![1]!.entity_number).toBe(2);
    expect(result.entities![1]!.name).toBe("b");
  });

  it("handles blueprint with no entities", () => {
    const bp: Blueprint = { item: "blueprint", version: 0 };
    const result = addEntity(bp, { name: "a", position: { x: 0, y: 0 } });
    expect(result.entities).toHaveLength(1);
    expect(result.entities![0]!.entity_number).toBe(1);
  });
});

describe("updateEntity", () => {
  it("updates properties of matching entity", () => {
    const bp = makeBlueprint(["belt"]);
    const result = updateEntity(bp, 1, { direction: 4 });
    expect(result.entities![0]!.direction).toBe(4);
    expect(result.entities![0]!.name).toBe("belt");
  });

  it("does not modify unmatched entities", () => {
    const bp = makeBlueprint(["a", "b"]);
    const result = updateEntity(bp, 1, { direction: 8 });
    expect(result.entities![1]!.direction).toBeUndefined();
  });
});
