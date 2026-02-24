import { describe, expect, it } from "vitest";
import {
  decodeVersion,
  encodeVersion,
  FACTORIO_2_0_VERSION,
  formatVersion,
} from "../version";

describe("encodeVersion", () => {
  it("encodes 2.0.28.0", () => {
    const v = encodeVersion(2, 0, 28);
    const parts = decodeVersion(v);
    expect(parts).toEqual({ major: 2, minor: 0, patch: 28, build: 0 });
  });

  it("encodes 2.0.28.2", () => {
    const v = encodeVersion(2, 0, 28, 2);
    const parts = decodeVersion(v);
    expect(parts).toEqual({ major: 2, minor: 0, patch: 28, build: 2 });
  });

  it("encodes 0.0.0.0", () => {
    const v = encodeVersion(0, 0, 0, 0);
    expect(v).toBe(0);
    expect(decodeVersion(v)).toEqual({ major: 0, minor: 0, patch: 0, build: 0 });
  });

  it("encodes 1.1.110.0 (Factorio 1.1)", () => {
    const v = encodeVersion(1, 1, 110);
    const parts = decodeVersion(v);
    expect(parts).toEqual({ major: 1, minor: 1, patch: 110, build: 0 });
  });

  it("handles large patch numbers", () => {
    const v = encodeVersion(2, 0, 65535, 65535);
    const parts = decodeVersion(v);
    expect(parts).toEqual({ major: 2, minor: 0, patch: 65535, build: 65535 });
  });
});

describe("decodeVersion", () => {
  it("round-trips correctly", () => {
    for (const [major, minor, patch, build] of [
      [0, 0, 0, 0],
      [1, 0, 0, 0],
      [1, 1, 110, 1],
      [2, 0, 28, 0],
      [2, 0, 28, 2],
      [31, 65535, 65535, 65535],
    ] as const) {
      const encoded = encodeVersion(major, minor, patch, build);
      const decoded = decodeVersion(encoded);
      expect(decoded).toEqual({ major, minor, patch, build });
    }
  });
});

describe("formatVersion", () => {
  it("formats as major.minor.patch (dropping build)", () => {
    const v = encodeVersion(2, 0, 28, 5);
    expect(formatVersion(v)).toBe("2.0.28");
  });

  it("formats 1.1.110", () => {
    const v = encodeVersion(1, 1, 110);
    expect(formatVersion(v)).toBe("1.1.110");
  });
});

describe("FACTORIO_2_0_VERSION", () => {
  it("decodes to 2.0.28.0", () => {
    const parts = decodeVersion(FACTORIO_2_0_VERSION);
    expect(parts).toEqual({ major: 2, minor: 0, patch: 28, build: 0 });
  });
});
