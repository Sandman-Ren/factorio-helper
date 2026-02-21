import type { LuaValue } from './lua-table-parser.js';

/**
 * Extract energy_source.type and fuel_categories from a Lua prototype entry.
 * Returns the energy type and optional fuel categories for burner machines.
 */
export function extractEnergySource(entry: Record<string, LuaValue>): {
  energy_type: 'electric' | 'burner' | 'void';
  fuel_categories?: string[];
} {
  const energySource = entry['energy_source'];
  if (!energySource || typeof energySource !== 'object' || Array.isArray(energySource)) {
    return { energy_type: 'electric' };
  }

  const sourceObj = energySource as Record<string, LuaValue>;
  const sourceType = sourceObj['type'];

  if (sourceType === 'burner') {
    const rawCats = sourceObj['fuel_categories'];
    const fuel_categories: string[] = [];
    if (Array.isArray(rawCats)) {
      for (const cat of rawCats) {
        if (typeof cat === 'string') fuel_categories.push(cat);
      }
    }
    return {
      energy_type: 'burner',
      fuel_categories: fuel_categories.length > 0 ? fuel_categories : ['chemical'],
    };
  }

  if (sourceType === 'void') {
    return { energy_type: 'void' };
  }

  return { energy_type: 'electric' };
}
