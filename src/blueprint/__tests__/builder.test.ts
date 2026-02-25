import { describe, expect, it } from "vitest";
import { BlueprintBookBuilder, BlueprintBuilder } from "../builder";
import { decode, encode } from "../codec";
import { Direction, WireConnectorId } from "../types";
import { decodeVersion, encodeVersion } from "../version";

describe("BlueprintBuilder", () => {
  it("builds a minimal blueprint", () => {
    const bp = new BlueprintBuilder().build();
    expect(bp.item).toBe("blueprint");
    expect(bp.version).toBe(encodeVersion(2, 0, 28));
  });

  it("sets label and description", () => {
    const bp = new BlueprintBuilder()
      .setLabel("Test Blueprint")
      .setDescription("A test")
      .build();
    expect(bp.label).toBe("Test Blueprint");
    expect(bp.description).toBe("A test");
  });

  it("sets custom version", () => {
    const bp = new BlueprintBuilder().setVersion(2, 0, 30, 1).build();
    const v = decodeVersion(bp.version);
    expect(v).toEqual({ major: 2, minor: 0, patch: 30, build: 1 });
  });

  it("auto-assigns entity_number", () => {
    const builder = new BlueprintBuilder();
    const e1 = builder.addEntity({
      name: "transport-belt",
      position: { x: 0, y: 0 },
    });
    const e2 = builder.addEntity({
      name: "transport-belt",
      position: { x: 1, y: 0 },
    });
    expect(e1).toBe(1);
    expect(e2).toBe(2);

    const bp = builder.build();
    expect(bp.entities![0]!.entity_number).toBe(1);
    expect(bp.entities![1]!.entity_number).toBe(2);
  });

  it("adds icons", () => {
    const bp = new BlueprintBuilder()
      .addIcon(1, { name: "electronic-circuit" })
      .addIcon(2, { name: "copper-plate" })
      .build();
    expect(bp.icons).toHaveLength(2);
    expect(bp.icons![0]!.signal.name).toBe("electronic-circuit");
  });

  it("adds tiles", () => {
    const bp = new BlueprintBuilder()
      .addTile("stone-path", { x: 0, y: 0 })
      .addTile("stone-path", { x: 1, y: 0 })
      .build();
    expect(bp.tiles).toHaveLength(2);
  });

  it("adds wire connections", () => {
    const builder = new BlueprintBuilder();
    builder.addEntity({
      name: "arithmetic-combinator",
      position: { x: 0, y: 0 },
    });
    builder.addEntity({
      name: "constant-combinator",
      position: { x: 2, y: 0 },
    });
    builder.addWire(
      1,
      WireConnectorId.CircuitRed,
      2,
      WireConnectorId.CircuitRed,
    );
    const bp = builder.build();
    expect(bp.wires).toHaveLength(1);
    expect(bp.wires![0]).toEqual([1, 1, 2, 1]);
  });

  it("sets snap-to-grid", () => {
    const bp = new BlueprintBuilder()
      .setSnapToGrid(3, 3)
      .setAbsoluteSnapping(true)
      .build();
    expect(bp["snap-to-grid"]).toEqual({ x: 3, y: 3 });
    expect(bp["absolute-snapping"]).toBe(true);
  });

  it("omits empty arrays from output", () => {
    const bp = new BlueprintBuilder().build();
    expect(bp.entities).toBeUndefined();
    expect(bp.tiles).toBeUndefined();
    expect(bp.wires).toBeUndefined();
    expect(bp.icons).toBeUndefined();
  });

  it("builds entity with direction", () => {
    const builder = new BlueprintBuilder();
    builder.addEntity({
      name: "inserter",
      position: { x: 0, y: 0 },
      direction: Direction.West,
    });
    const bp = builder.build();
    expect(bp.entities![0]!.direction).toBe(Direction.West);
  });

  it("round-trips through encode/decode", () => {
    const builder = new BlueprintBuilder()
      .setLabel("Round-trip Test")
      .setVersion(2, 0, 28);

    builder.addEntity({
      name: "assembling-machine-3",
      position: { x: 0, y: 0 },
      recipe: "electronic-circuit",
    });
    builder.addEntity({
      name: "inserter",
      position: { x: 2, y: 0 },
      direction: Direction.West,
    });
    builder.addWire(
      1,
      WireConnectorId.CircuitRed,
      2,
      WireConnectorId.CircuitRed,
    );
    builder.addIcon(1, { name: "electronic-circuit" });

    const bp = builder.build();
    const encoded = encode({ blueprint: bp });
    const decoded = decode(encoded);

    expect("blueprint" in decoded).toBe(true);
    if ("blueprint" in decoded) {
      expect(decoded.blueprint.label).toBe("Round-trip Test");
      expect(decoded.blueprint.entities).toHaveLength(2);
      expect(decoded.blueprint.wires).toHaveLength(1);
      expect(decoded.blueprint.icons).toHaveLength(1);
    }
  });
});

describe("BlueprintBookBuilder", () => {
  it("builds a minimal book", () => {
    const book = new BlueprintBookBuilder().build();
    expect(book.item).toBe("blueprint-book");
    expect(book.active_index).toBe(0);
    expect(book.blueprints).toEqual([]);
  });

  it("adds blueprints with auto-indexing", () => {
    const bp1 = new BlueprintBuilder().setLabel("BP 1").build();
    const bp2 = new BlueprintBuilder().setLabel("BP 2").build();

    const book = new BlueprintBookBuilder()
      .setLabel("My Book")
      .addBlueprint(bp1)
      .addBlueprint(bp2)
      .setActiveIndex(1)
      .build();

    expect(book.label).toBe("My Book");
    expect(book.active_index).toBe(1);
    expect(book.blueprints).toHaveLength(2);
    expect(book.blueprints[0]).toEqual({ index: 0, blueprint: bp1 });
    expect(book.blueprints[1]).toEqual({ index: 1, blueprint: bp2 });
  });

  it("supports nested books", () => {
    const innerBp = new BlueprintBuilder().setLabel("Inner").build();
    const innerBook = new BlueprintBookBuilder()
      .setLabel("Inner Book")
      .addBlueprint(innerBp)
      .build();
    const outerBook = new BlueprintBookBuilder()
      .setLabel("Outer Book")
      .addBook(innerBook)
      .build();

    expect(outerBook.blueprints).toHaveLength(1);
    const child = outerBook.blueprints[0]!;
    expect("blueprint_book" in child).toBe(true);
  });

  it("round-trips through encode/decode", () => {
    const bp = new BlueprintBuilder()
      .setLabel("Child BP")
      .build();

    const book = new BlueprintBookBuilder()
      .setLabel("Test Book")
      .addBlueprint(bp)
      .build();

    const encoded = encode({ blueprint_book: book });
    const decoded = decode(encoded);

    expect("blueprint_book" in decoded).toBe(true);
    if ("blueprint_book" in decoded) {
      expect(decoded.blueprint_book.label).toBe("Test Book");
      expect(decoded.blueprint_book.blueprints).toHaveLength(1);
    }
  });
});
