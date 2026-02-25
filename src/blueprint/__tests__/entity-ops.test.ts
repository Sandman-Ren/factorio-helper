import { describe, it, expect } from "vitest";
import { getEntityNames, removeByType, replaceEntity } from "../entity-ops";
import type { Blueprint } from "../types";

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
