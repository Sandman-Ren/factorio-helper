import { readFileSync, existsSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';
import { extractEnergySource } from './extract-energy-source.js';
import { parseEnergyKilo } from '../calculator/energy.js';
import type { PowerEntity } from '../data/schema.js';
import type { LuaValue } from './lua-table-parser.js';

const TYPE_TO_CATEGORY: Record<string, string> = {
  'assembling-machine': 'Assemblers',
  'furnace': 'Furnaces',
  'rocket-silo': 'Space',
  'mining-drill': 'Mining',
  'lab': 'Science',
  'inserter': 'Logistics',
  'beacon': 'Infrastructure',
  'radar': 'Infrastructure',
  'roboport': 'Infrastructure',
  'lamp': 'Infrastructure',
  'programmable-speaker': 'Infrastructure',
  'pump': 'Logistics',
  'electric-turret': 'Combat',
  'arithmetic-combinator': 'Circuit',
  'decider-combinator': 'Circuit',
  'selector-combinator': 'Circuit',
  'agricultural-tower': 'Space',
};

const INCLUDED_TYPES = new Set(Object.keys(TYPE_TO_CATEGORY));

const OUTPUT_PRIORITIES = new Set(['secondary-output', 'primary-output']);

export function extractPowerEntities(...luaPaths: string[]): PowerEntity[] {
  const allEntries: Record<string, LuaValue>[] = [];

  for (const luaPath of luaPaths) {
    if (!existsSync(luaPath)) continue;
    const source = readFileSync(luaPath, 'utf-8');
    const entries = parseLuaPrototypes(source);
    allEntries.push(...entries);
  }

  const seen = new Set<string>();
  const entities: PowerEntity[] = [];

  for (const entry of allEntries) {
    const entryType = entry['type'];
    const name = entry['name'];
    if (typeof entryType !== 'string' || typeof name !== 'string') continue;
    if (!INCLUDED_TYPES.has(entryType)) continue;
    if (seen.has(name)) continue;

    const energyInfo = extractEnergySource(entry);

    // Exclude void energy (e.g. offshore-pump)
    if (energyInfo.energy_type === 'void') continue;

    // Exclude power producers (solar panels, steam engines, etc.)
    if (energyInfo.usage_priority && OUTPUT_PRIORITIES.has(energyInfo.usage_priority)) continue;

    seen.add(name);

    const category = TYPE_TO_CATEGORY[entryType]!;

    const pe: PowerEntity = {
      name,
      type: entryType,
      category,
      energy_type: energyInfo.energy_type,
    };

    // Standard energy_usage
    const energyUsage = entry['energy_usage'];
    if (typeof energyUsage === 'string') {
      pe.energy_usage = energyUsage;
      pe.energy_usage_kw = parseEnergyKilo(energyUsage);
    }

    // Drain from energy_source
    if (energyInfo.drain) {
      pe.drain = energyInfo.drain;
      pe.drain_kw = parseEnergyKilo(energyInfo.drain);
    }

    // Buffer capacity from energy_source
    if (energyInfo.buffer_capacity) {
      pe.buffer_capacity = energyInfo.buffer_capacity;
      pe.buffer_capacity_kj = parseEnergyKilo(energyInfo.buffer_capacity);
    }

    // Input flow limit from energy_source
    if (energyInfo.input_flow_limit) {
      pe.input_flow_limit = energyInfo.input_flow_limit;
      pe.input_flow_limit_kw = parseEnergyKilo(energyInfo.input_flow_limit);
    }

    // Active energy usage (rocket silo, combinators)
    const activeUsage = entry['active_energy_usage'];
    if (typeof activeUsage === 'string') {
      pe.active_energy_usage = activeUsage;
      pe.active_energy_usage_kw = parseEnergyKilo(activeUsage);
    }

    // Tick-based energy (lamp, speaker) — value is already in power units
    const perTick = entry['energy_usage_per_tick'];
    if (typeof perTick === 'string') {
      pe.energy_usage_per_tick = perTick;
      pe.energy_usage_kw = parseEnergyKilo(perTick);
    }

    // Burner specifics
    if (energyInfo.energy_type === 'burner' && energyInfo.fuel_categories) {
      pe.fuel_categories = energyInfo.fuel_categories;
    }

    // Roboport charging energy
    const chargingEnergy = entry['charging_energy'];
    if (typeof chargingEnergy === 'string') {
      pe.charging_energy = chargingEnergy;
      pe.charging_energy_kw = parseEnergyKilo(chargingEnergy);
    }

    entities.push(pe);
  }

  return entities;
}
