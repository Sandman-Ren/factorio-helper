import { readFileSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';
import type { Machine } from '../data/schema.js';
import { extractEnergySource } from './extract-energy-source.js';

const MACHINE_TYPES = new Set([
  'assembling-machine', 'furnace', 'rocket-silo',
]);

export function extractMachines(luaPath: string): Machine[] {
  const source = readFileSync(luaPath, 'utf-8');
  const entries = parseLuaPrototypes(source);
  const machines: Machine[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const type = entry['type'];
    if (typeof type !== 'string' || !MACHINE_TYPES.has(type)) continue;

    const name = entry['name'];
    if (typeof name !== 'string' || seen.has(name)) continue;

    const crafting_speed = typeof entry['crafting_speed'] === 'number' ? entry['crafting_speed'] : 1;
    const energy_usage = typeof entry['energy_usage'] === 'string' ? entry['energy_usage'] : '0kW';
    const module_slots = typeof entry['module_slots'] === 'number' ? entry['module_slots'] : 0;

    const rawCategories = entry['crafting_categories'];
    const crafting_categories: string[] = [];
    if (Array.isArray(rawCategories)) {
      for (const cat of rawCategories) {
        if (typeof cat === 'string') crafting_categories.push(cat);
      }
    }

    if (crafting_categories.length === 0) continue;

    const { energy_type, fuel_categories } = extractEnergySource(entry);

    const machine: Machine = { name, type, crafting_speed, crafting_categories, energy_usage, module_slots, energy_type };
    if (fuel_categories) machine.fuel_categories = fuel_categories;
    machines.push(machine);
    seen.add(name);
  }

  // Also extract chemical-plant and oil-refinery which are type "assembling-machine" in the data
  // but might appear as different types. Let's also check for any we missed by looking for
  // crafting_speed + crafting_categories on any entity type.
  for (const entry of entries) {
    const type = entry['type'];
    const name = entry['name'];
    if (typeof type !== 'string' || typeof name !== 'string') continue;
    if (MACHINE_TYPES.has(type) || seen.has(name)) continue;

    // Check if it has crafting_speed and crafting_categories (i.e., it's a crafting machine)
    if (typeof entry['crafting_speed'] !== 'number') continue;
    const rawCategories = entry['crafting_categories'];
    if (!Array.isArray(rawCategories)) continue;

    const crafting_categories: string[] = [];
    for (const cat of rawCategories) {
      if (typeof cat === 'string') crafting_categories.push(cat);
    }
    if (crafting_categories.length === 0) continue;

    const crafting_speed = entry['crafting_speed'] as number;
    const energy_usage = typeof entry['energy_usage'] === 'string' ? entry['energy_usage'] : '0kW';
    const module_slots = typeof entry['module_slots'] === 'number' ? entry['module_slots'] : 0;

    const { energy_type, fuel_categories } = extractEnergySource(entry);

    const machine: Machine = { name, type, crafting_speed, crafting_categories, energy_usage, module_slots, energy_type };
    if (fuel_categories) machine.fuel_categories = fuel_categories;
    machines.push(machine);
    seen.add(name);
  }

  return machines;
}
