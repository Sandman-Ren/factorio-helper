import { describe, it, expect, vi } from 'vitest';
import { extractFuels } from './extract-fuels.js';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}));

import { readFileSync } from 'fs';
const mockReadFileSync = vi.mocked(readFileSync);

// Minimal Lua prototype format that parseLuaPrototypes can handle
function luaItem(fields: Record<string, string | number>) {
  const entries = Object.entries(fields)
    .map(([k, v]) => `${k} = ${typeof v === 'string' ? `"${v}"` : v}`)
    .join(', ');
  return `{ ${entries} }`;
}

function luaFile(...items: string[]) {
  return `data:extend({${items.join(',')}})`;
}

describe('extractFuels', () => {
  it('extracts a standard fuel item', () => {
    mockReadFileSync.mockReturnValue(luaFile(
      luaItem({ name: 'coal', fuel_value: '4MJ', fuel_category: 'chemical' }),
    ));

    const fuels = extractFuels('/fake/path.lua');
    expect(fuels).toEqual([
      { name: 'coal', fuel_value: '4MJ', fuel_value_kj: 4000, fuel_category: 'chemical' },
    ]);
  });

  it('extracts multiple fuels from one file', () => {
    mockReadFileSync.mockReturnValue(luaFile(
      luaItem({ name: 'coal', fuel_value: '4MJ', fuel_category: 'chemical' }),
      luaItem({ name: 'solid-fuel', fuel_value: '12MJ', fuel_category: 'chemical' }),
    ));

    const fuels = extractFuels('/fake/path.lua');
    expect(fuels).toHaveLength(2);
    expect(fuels[0]!.name).toBe('coal');
    expect(fuels[1]!.name).toBe('solid-fuel');
    expect(fuels[1]!.fuel_value_kj).toBe(12000);
  });

  it('skips items without fuel_value', () => {
    mockReadFileSync.mockReturnValue(luaFile(
      luaItem({ name: 'iron-plate', fuel_category: 'chemical' }),
    ));

    const fuels = extractFuels('/fake/path.lua');
    expect(fuels).toEqual([]);
  });

  it('skips items without fuel_category', () => {
    mockReadFileSync.mockReturnValue(luaFile(
      luaItem({ name: 'mystery', fuel_value: '4MJ' }),
    ));

    const fuels = extractFuels('/fake/path.lua');
    expect(fuels).toEqual([]);
  });

  it('skips items with unparseable fuel_value', () => {
    mockReadFileSync.mockReturnValue(luaFile(
      luaItem({ name: 'bad-fuel', fuel_value: 'notavalue', fuel_category: 'chemical' }),
    ));

    const fuels = extractFuels('/fake/path.lua');
    expect(fuels).toEqual([]);
  });
});
