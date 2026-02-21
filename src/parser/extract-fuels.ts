import { readFileSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';
import { parseEnergyKilo } from '../calculator/energy.js';
import type { Fuel } from '../data/schema.js';

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

    const fuel_value_kj = parseEnergyKilo(fuel_value);
    if (fuel_value_kj <= 0) continue;

    fuels.push({ name, fuel_value, fuel_value_kj, fuel_category });
  }

  return fuels;
}
