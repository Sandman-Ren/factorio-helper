import { readFileSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';
import type { MiningDrill } from '../data/schema.js';
import { extractEnergySource } from './extract-energy-source.js';

/**
 * Extract mining drill and offshore pump entities from Lua data files.
 * Accepts multiple file paths to cover base + DLC entity files.
 */
export function extractMiners(...luaPaths: string[]): MiningDrill[] {
  const miners: MiningDrill[] = [];
  const seen = new Set<string>();

  for (const luaPath of luaPaths) {
    const source = readFileSync(luaPath, 'utf-8');
    const entries = parseLuaPrototypes(source);

    for (const entry of entries) {
      const entryType = entry['type'];
      if (typeof entryType !== 'string') continue;

      if (entryType === 'mining-drill') {
        const name = entry['name'];
        if (typeof name !== 'string' || seen.has(name)) continue;

        const mining_speed = typeof entry['mining_speed'] === 'number' ? entry['mining_speed'] : 1;
        const energy_usage = typeof entry['energy_usage'] === 'string' ? entry['energy_usage'] : '0kW';
        const module_slots = typeof entry['module_slots'] === 'number' ? entry['module_slots'] : 0;

        const rawCategories = entry['resource_categories'];
        const resource_categories: string[] = [];
        if (Array.isArray(rawCategories)) {
          for (const cat of rawCategories) {
            if (typeof cat === 'string') resource_categories.push(cat);
          }
        }
        if (resource_categories.length === 0) continue;

        const { energy_type, fuel_categories } = extractEnergySource(entry);

        const miner: MiningDrill = {
          name, type: 'mining-drill', mining_speed, resource_categories, energy_usage, module_slots, energy_type,
        };
        if (fuel_categories) miner.fuel_categories = fuel_categories;
        miners.push(miner);
        seen.add(name);
      } else if (entryType === 'offshore-pump') {
        const name = entry['name'];
        if (typeof name !== 'string' || seen.has(name)) continue;

        const pumping_speed = typeof entry['pumping_speed'] === 'number' ? entry['pumping_speed'] : 20;
        const energy_usage = typeof entry['energy_usage'] === 'string' ? entry['energy_usage'] : '0kW';

        miners.push({
          name,
          type: 'offshore-pump',
          mining_speed: pumping_speed,
          resource_categories: ['water-pumping'],
          energy_usage,
          module_slots: 0,
          energy_type: 'void',
        });
        seen.add(name);
      }
    }
  }

  return miners;
}
