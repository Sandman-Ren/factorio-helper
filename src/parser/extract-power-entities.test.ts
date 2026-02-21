import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractPowerEntities } from './extract-power-entities.js';

// Mock fs to provide controlled Lua content
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
}));

import { readFileSync, existsSync } from 'fs';

const mockReadFileSync = vi.mocked(readFileSync);
const mockExistsSync = vi.mocked(existsSync);

beforeEach(() => {
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(true);
});

describe('extractPowerEntities', () => {
  it('extracts a standard electric assembling machine', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "assembling-machine",
    name = "assembling-machine-3",
    energy_usage = "375kW",
    energy_source = { type = "electric", usage_priority = "secondary-input" },
    crafting_speed = 1.25,
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'assembling-machine-3',
      type: 'assembling-machine',
      category: 'Assemblers',
      energy_type: 'electric',
      energy_usage: '375kW',
      energy_usage_kw: 375,
    });
  });

  it('extracts a burner furnace with fuel_categories', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "furnace",
    name = "stone-furnace",
    energy_usage = "90kW",
    energy_source = { type = "burner", fuel_categories = {"chemical"} },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'stone-furnace',
      type: 'furnace',
      category: 'Furnaces',
      energy_type: 'burner',
      energy_usage: '90kW',
      energy_usage_kw: 90,
      fuel_categories: ['chemical'],
    });
  });

  it('extracts an inserter with drain', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "inserter",
    name = "fast-inserter",
    energy_source = { type = "electric", usage_priority = "secondary-input", drain = "0.5kW" },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'fast-inserter',
      type: 'inserter',
      category: 'Logistics',
      energy_type: 'electric',
      drain: '0.5kW',
      drain_kw: 0.5,
    });
  });

  it('extracts a turret with drain, buffer_capacity, and input_flow_limit', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "electric-turret",
    name = "laser-turret",
    energy_source = {
      type = "electric",
      usage_priority = "primary-input",
      drain = "24kW",
      buffer_capacity = "801kJ",
      input_flow_limit = "9600kW",
    },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'laser-turret',
      type: 'electric-turret',
      category: 'Combat',
      energy_type: 'electric',
      drain: '24kW',
      drain_kw: 24,
      buffer_capacity: '801kJ',
      buffer_capacity_kj: 801,
      input_flow_limit: '9600kW',
      input_flow_limit_kw: 9600,
    });
  });

  it('extracts a rocket silo with active_energy_usage', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "rocket-silo",
    name = "rocket-silo",
    energy_usage = "250kW",
    active_energy_usage = "3990kW",
    energy_source = { type = "electric", usage_priority = "primary-input" },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'rocket-silo',
      energy_usage_kw: 250,
      active_energy_usage: '3990kW',
      active_energy_usage_kw: 3990,
    });
  });

  it('extracts a roboport with charging_energy', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "roboport",
    name = "roboport",
    energy_usage = "50kW",
    charging_energy = "500kW",
    energy_source = {
      type = "electric",
      usage_priority = "secondary-input",
      buffer_capacity = "100MJ",
      input_flow_limit = "5MW",
    },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'roboport',
      energy_usage_kw: 50,
      charging_energy: '500kW',
      charging_energy_kw: 500,
      buffer_capacity_kj: 100000,
    });
  });

  it('extracts a lamp with energy_usage_per_tick (no multiplication)', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "lamp",
    name = "small-lamp",
    energy_usage_per_tick = "5kW",
    energy_source = { type = "electric", usage_priority = "lamp" },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'small-lamp',
      energy_usage_per_tick: '5kW',
      energy_usage_kw: 5,
    });
  });

  it('excludes void energy entities', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "mining-drill",
    name = "offshore-pump",
    energy_usage = "0kW",
    energy_source = { type = "void" },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(0);
  });

  it('excludes power producers (output usage_priority)', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "assembling-machine",
    name = "solar-panel",
    energy_usage = "0kW",
    energy_source = { type = "electric", usage_priority = "secondary-output" },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(0);
  });

  it('excludes entities with non-included types', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "transport-belt",
    name = "transport-belt",
    speed = 0.03125,
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(0);
  });

  it('deduplicates entities by name across multiple files', () => {
    mockReadFileSync
      .mockReturnValueOnce(`
data:extend({
  {
    type = "lab",
    name = "lab",
    energy_usage = "60kW",
    energy_source = { type = "electric", usage_priority = "secondary-input" },
  },
})
`)
      .mockReturnValueOnce(`
data:extend({
  {
    type = "lab",
    name = "lab",
    energy_usage = "90kW",
    energy_source = { type = "electric", usage_priority = "secondary-input" },
  },
})
`);

    const result = extractPowerEntities('file1.lua', 'file2.lua');
    expect(result).toHaveLength(1);
    expect(result[0]!.energy_usage_kw).toBe(60); // first occurrence wins
  });

  it('assigns correct categories', () => {
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "mining-drill",
    name = "electric-mining-drill",
    energy_usage = "90kW",
    energy_source = { type = "electric", usage_priority = "secondary-input" },
  },
  {
    type = "radar",
    name = "radar",
    energy_usage = "300kW",
    energy_source = { type = "electric", usage_priority = "secondary-input" },
  },
  {
    type = "beacon",
    name = "beacon",
    energy_usage = "480kW",
    energy_source = { type = "electric", usage_priority = "secondary-input" },
  },
})
`);

    const result = extractPowerEntities('test.lua');
    expect(result).toHaveLength(3);
    expect(result.find(e => e.name === 'electric-mining-drill')!.category).toBe('Mining');
    expect(result.find(e => e.name === 'radar')!.category).toBe('Infrastructure');
    expect(result.find(e => e.name === 'beacon')!.category).toBe('Infrastructure');
  });

  it('skips non-existent files gracefully', () => {
    mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(false);
    mockReadFileSync.mockReturnValue(`
data:extend({
  {
    type = "lab",
    name = "lab",
    energy_usage = "60kW",
    energy_source = { type = "electric", usage_priority = "secondary-input" },
  },
})
`);

    const result = extractPowerEntities('exists.lua', 'missing.lua');
    expect(result).toHaveLength(1);
    expect(mockReadFileSync).toHaveBeenCalledTimes(1);
  });
});
