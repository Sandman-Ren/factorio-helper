import { unzlibSync, zlibSync } from "fflate";
import type { BlueprintString } from "./types";

const VERSION_BYTE = "0";

/**
 * Decode a Factorio blueprint string into typed JSON.
 *
 * Pipeline: strip version byte -> base64 decode -> zlib inflate -> UTF-8 decode -> JSON parse
 */
export function decode(blueprintString: string): BlueprintString {
  if (!blueprintString || blueprintString.length < 2) {
    throw new Error("Blueprint string is empty or too short");
  }

  const versionByte = blueprintString[0];
  if (versionByte !== VERSION_BYTE) {
    throw new Error(
      `Unsupported blueprint version byte: '${versionByte}' (expected '${VERSION_BYTE}')`,
    );
  }

  const base64 = blueprintString.slice(1);

  let compressed: Uint8Array;
  try {
    compressed = base64ToBytes(base64);
  } catch {
    throw new Error("Invalid base64 in blueprint string");
  }

  let decompressed: Uint8Array;
  try {
    decompressed = unzlibSync(compressed);
  } catch {
    throw new Error("Failed to decompress blueprint string (invalid zlib data)");
  }

  const json = new TextDecoder().decode(decompressed);

  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Blueprint string contains invalid JSON");
  }

  if (!isValidBlueprintString(data)) {
    throw new Error(
      "Blueprint JSON does not have a recognized top-level key " +
        "(expected 'blueprint', 'blueprint_book', 'upgrade_planner', or 'deconstruction_planner')",
    );
  }

  return data;
}

/**
 * Encode typed blueprint JSON into a Factorio blueprint string.
 *
 * Pipeline: JSON stringify -> UTF-8 encode -> zlib deflate (level 9) -> base64 encode -> prepend version byte
 */
export function encode(data: BlueprintString): string {
  const json = JSON.stringify(data);
  const utf8 = new TextEncoder().encode(json);
  const compressed = zlibSync(utf8, { level: 9 });
  return VERSION_BYTE + bytesToBase64(compressed);
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isValidBlueprintString(data: unknown): data is BlueprintString {
  if (typeof data !== "object" || data === null) return false;
  return (
    "blueprint" in data ||
    "blueprint_book" in data ||
    "upgrade_planner" in data ||
    "deconstruction_planner" in data
  );
}

/** Base64 string -> Uint8Array (works in browser and Node). */
function base64ToBytes(base64: string): Uint8Array {
  // Use atob (available in browsers and Node 16+)
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Uint8Array -> base64 string (works in browser and Node). */
function bytesToBase64(bytes: Uint8Array): string {
  // Build binary string in chunks to avoid stack overflow on large arrays
  const CHUNK_SIZE = 8192;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    parts.push(String.fromCharCode.apply(null, chunk as unknown as number[]));
  }
  return btoa(parts.join(""));
}
