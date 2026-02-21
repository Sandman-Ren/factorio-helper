import type { LuaValue } from './lua-table-parser.js';

export interface EnergySourceInfo {
  energy_type: 'electric' | 'burner' | 'void';
  fuel_categories?: string[];
  drain?: string;
  buffer_capacity?: string;
  input_flow_limit?: string;
  usage_priority?: string;
}

/**
 * Extract energy_source info from a Lua prototype entry.
 */
export function extractEnergySource(entry: Record<string, LuaValue>): EnergySourceInfo {
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

  // Electric — extract optional fields
  const result: EnergySourceInfo = { energy_type: 'electric' };

  const drain = sourceObj['drain'];
  if (typeof drain === 'string') result.drain = drain;

  const buffer_capacity = sourceObj['buffer_capacity'];
  if (typeof buffer_capacity === 'string') result.buffer_capacity = buffer_capacity;

  const input_flow_limit = sourceObj['input_flow_limit'];
  if (typeof input_flow_limit === 'string') result.input_flow_limit = input_flow_limit;

  const usage_priority = sourceObj['usage_priority'];
  if (typeof usage_priority === 'string') result.usage_priority = usage_priority;

  return result;
}
