import { readFileSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';
import type { Fluid } from '../data/schema.js';

export function extractFluids(luaPath: string): Fluid[] {
  const source = readFileSync(luaPath, 'utf-8');
  const entries = parseLuaPrototypes(source);
  const fluids: Fluid[] = [];

  for (const entry of entries) {
    if (entry['type'] !== 'fluid') continue;
    const name = entry['name'];
    if (typeof name !== 'string') continue;
    fluids.push({ name });
  }

  return fluids;
}
