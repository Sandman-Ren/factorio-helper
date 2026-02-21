import { readFileSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';
import type { Fuel } from '../data/schema.js';

/** Parse a Factorio energy string (e.g. "4MJ", "1.21GJ") to kJ. */
function parseToKJ(s: string): number {
  const match = s.match(/^([\d.]+)\s*(J|kJ|MJ|GJ|TJ)$/);
  if (!match) return 0;
  const val = parseFloat(match[1]!);
  switch (match[2]) {
    case 'J':  return val / 1_000;
    case 'kJ': return val;
    case 'MJ': return val * 1_000;
    case 'GJ': return val * 1_000_000;
    case 'TJ': return val * 1_000_000_000;
    default:   return 0;
  }
}

/**
 * Extract fuel items (items with fuel_value and fuel_category) from Lua data files.
 */
export function extractFuels(luaPath: string): Fuel[] {
  const source = readFileSync(luaPath, 'utf-8');
  const entries = parseLuaPrototypes(source);
  const fuels: Fuel[] = [];

  for (const entry of entries) {
    const fuel_value = entry['fuel_value'];
    const fuel_category = entry['fuel_category'];
    const name = entry['name'];

    if (typeof fuel_value !== 'string') continue;
    if (typeof fuel_category !== 'string') continue;
    if (typeof name !== 'string') continue;

    const fuel_value_kj = parseToKJ(fuel_value);
    if (fuel_value_kj <= 0) continue;

    fuels.push({ name, fuel_value, fuel_value_kj, fuel_category });
  }

  return fuels;
}
