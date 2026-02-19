import { readFileSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';
import type { Item } from '../data/schema.js';

const ITEM_TYPES = new Set([
  'item', 'tool', 'ammo', 'capsule', 'module', 'armor', 'gun',
  'item-with-entity-data', 'rail-planner', 'item-with-label',
  'item-with-inventory', 'item-with-tags', 'repair-tool',
  'blueprint', 'blueprint-book', 'copy-paste-tool',
  'deconstruction-item', 'upgrade-item', 'selection-tool',
  'spidertron-remote', 'space-platform-starter-pack',
]);

export function extractItems(luaPath: string): Item[] {
  const source = readFileSync(luaPath, 'utf-8');
  const entries = parseLuaPrototypes(source);
  const items: Item[] = [];

  for (const entry of entries) {
    const type = entry['type'];
    if (typeof type !== 'string' || !ITEM_TYPES.has(type)) continue;

    const name = entry['name'];
    if (typeof name !== 'string') continue;

    const subgroup = typeof entry['subgroup'] === 'string' ? entry['subgroup'] : '';
    const stack_size = typeof entry['stack_size'] === 'number' ? entry['stack_size'] : 1;

    items.push({ name, type, subgroup, stack_size });
  }

  return items;
}
