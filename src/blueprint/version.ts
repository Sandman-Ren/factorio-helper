/**
 * Factorio version number encoding/decoding.
 *
 * The `version` field in blueprints is a uint64 with four 16-bit components:
 * [major:16][minor:16][patch:16][build:16]
 *
 * We use BigInt internally for correct bit manipulation, but accept and
 * return regular numbers (safe for all realistic Factorio versions).
 */

export function encodeVersion(
  major: number,
  minor: number,
  patch: number,
  build = 0,
): number {
  const v =
    (BigInt(major) << 48n) |
    (BigInt(minor) << 32n) |
    (BigInt(patch) << 16n) |
    BigInt(build);
  const num = Number(v);
  if (!Number.isSafeInteger(num)) {
    throw new Error(
      `Version ${major}.${minor}.${patch}.${build} exceeds Number.MAX_SAFE_INTEGER`,
    );
  }
  return num;
}

export function decodeVersion(version: number): {
  major: number;
  minor: number;
  patch: number;
  build: number;
} {
  const v = BigInt(version);
  return {
    major: Number((v >> 48n) & 0xffffn),
    minor: Number((v >> 32n) & 0xffffn),
    patch: Number((v >> 16n) & 0xffffn),
    build: Number(v & 0xffffn),
  };
}

export function formatVersion(version: number): string {
  const { major, minor, patch } = decodeVersion(version);
  return `${major}.${minor}.${patch}`;
}

/** Factorio 2.0.28 encoded version (build 0). */
export const FACTORIO_2_0_VERSION = encodeVersion(2, 0, 28);
