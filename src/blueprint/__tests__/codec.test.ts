import { describe, expect, it } from "vitest";
import { decode, encode } from "../codec";
import type { BlueprintString } from "../types";
import { encodeVersion } from "../version";
import {
  COMBINATOR_CIRCUIT,
  SIMPLE_BELT_LINE,
  SIMPLE_BLUEPRINT_BOOK,
} from "./fixtures";

describe("decode", () => {
  it("decodes a simple belt blueprint", () => {
    const result = decode(SIMPLE_BELT_LINE);
    expect("blueprint" in result).toBe(true);
    if ("blueprint" in result) {
      expect(result.blueprint.item).toBe("blueprint");
      expect(result.blueprint.entities).toBeDefined();
      expect(result.blueprint.entities!.length).toBeGreaterThan(0);
    }
  });

  it("decodes a combinator circuit blueprint", () => {
    const result = decode(COMBINATOR_CIRCUIT);
    expect("blueprint" in result).toBe(true);
    if ("blueprint" in result) {
      expect(result.blueprint.item).toBe("blueprint");
    }
  });

  it("decodes a blueprint book", () => {
    const result = decode(SIMPLE_BLUEPRINT_BOOK);
    expect("blueprint_book" in result).toBe(true);
    if ("blueprint_book" in result) {
      expect(result.blueprint_book.item).toBe("blueprint-book");
      expect(result.blueprint_book.blueprints).toBeDefined();
      expect(result.blueprint_book.blueprints.length).toBeGreaterThan(0);
    }
  });

  it("throws on empty string", () => {
    expect(() => decode("")).toThrow("empty or too short");
  });

  it("throws on missing version byte", () => {
    expect(() => decode("1" + SIMPLE_BELT_LINE.slice(1))).toThrow(
      "Unsupported blueprint version byte",
    );
  });

  it("throws on corrupted base64", () => {
    expect(() => decode("0!!!invalid-base64!!!")).toThrow();
  });

  it("throws on invalid compressed data", () => {
    // Valid base64 but not valid zlib
    expect(() => decode("0" + btoa("this is not zlib data"))).toThrow();
  });
});

describe("encode", () => {
  it("produces a string starting with '0'", () => {
    const data: BlueprintString = {
      blueprint: {
        item: "blueprint",
        version: encodeVersion(2, 0, 28),
      },
    };
    const result = encode(data);
    expect(result[0]).toBe("0");
    expect(result.length).toBeGreaterThan(1);
  });

  it("produces valid base64 after version byte", () => {
    const data: BlueprintString = {
      blueprint: {
        item: "blueprint",
        version: encodeVersion(2, 0, 28),
        entities: [
          {
            entity_number: 1,
            name: "transport-belt",
            position: { x: 0, y: 0 },
          },
        ],
      },
    };
    const result = encode(data);
    const base64Part = result.slice(1);
    // Should not throw when decoded
    expect(() => atob(base64Part)).not.toThrow();
  });
});

describe("round-trip", () => {
  it("encode then decode preserves structure (minimal blueprint)", () => {
    const original: BlueprintString = {
      blueprint: {
        item: "blueprint",
        version: encodeVersion(2, 0, 28),
        entities: [
          {
            entity_number: 1,
            name: "assembling-machine-3",
            position: { x: 0, y: 0 },
            recipe: "electronic-circuit",
          },
          {
            entity_number: 2,
            name: "inserter",
            position: { x: 2, y: 0 },
            direction: 12,
          },
        ],
        wires: [[1, 1, 2, 1]],
      },
    };

    const encoded = encode(original);
    const decoded = decode(encoded);
    expect(decoded).toEqual(original);
  });

  it("encode then decode preserves blueprint book structure", () => {
    const original: BlueprintString = {
      blueprint_book: {
        item: "blueprint-book",
        version: encodeVersion(2, 0, 28),
        active_index: 0,
        blueprints: [
          {
            index: 0,
            blueprint: {
              item: "blueprint",
              version: encodeVersion(2, 0, 28),
              entities: [
                {
                  entity_number: 1,
                  name: "transport-belt",
                  position: { x: 0, y: 0 },
                },
              ],
            },
          },
          {
            index: 1,
            blueprint: {
              item: "blueprint",
              version: encodeVersion(2, 0, 28),
            },
          },
        ],
      },
    };

    const encoded = encode(original);
    const decoded = decode(encoded);
    expect(decoded).toEqual(original);
  });

  it("decode then re-encode fixture strings", () => {
    for (const fixture of [SIMPLE_BELT_LINE, COMBINATOR_CIRCUIT, SIMPLE_BLUEPRINT_BOOK]) {
      const decoded = decode(fixture);
      const reEncoded = encode(decoded);
      const reDecoded = decode(reEncoded);
      // Structural equality (re-encoding may differ in compression but decode identically)
      expect(reDecoded).toEqual(decoded);
    }
  });
});
