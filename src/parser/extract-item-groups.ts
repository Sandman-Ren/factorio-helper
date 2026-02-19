import { readFileSync } from 'fs';
import { parseLuaPrototypes } from './lua-table-parser.js';

interface GroupDef {
  name: string;
  order: string;
}

interface SubgroupDef {
  group: string;
  order: string;
}

export interface ItemGroupData {
  groups: GroupDef[];
  subgroups: Record<string, SubgroupDef>;
}

/** Only include groups relevant to producible items. */
const RELEVANT_GROUPS = new Set([
  'logistics',
  'production',
  'intermediate-products',
  'space',
  'combat',
  'fluids',
]);

export function extractItemGroups(luaPaths: string[]): ItemGroupData {
  const groups: GroupDef[] = [];
  const subgroups: Record<string, SubgroupDef> = {};
  const seenGroups = new Set<string>();

  for (const luaPath of luaPaths) {
    const source = readFileSync(luaPath, 'utf-8');
    const entries = parseLuaPrototypes(source);

    for (const entry of entries) {
      const type = entry['type'];
      if (typeof type !== 'string') continue;

      if (type === 'item-group') {
        const name = entry['name'];
        const order = entry['order'];
        if (
          typeof name === 'string' &&
          typeof order === 'string' &&
          RELEVANT_GROUPS.has(name) &&
          !seenGroups.has(name)
        ) {
          seenGroups.add(name);
          groups.push({ name, order });
        }
      }

      if (type === 'item-subgroup') {
        const name = entry['name'];
        const group = entry['group'];
        const order = entry['order'];
        if (
          typeof name === 'string' &&
          typeof group === 'string' &&
          typeof order === 'string' &&
          RELEVANT_GROUPS.has(group)
        ) {
          subgroups[name] = { group, order };
        }
      }
    }
  }

  groups.sort((a, b) => a.order.localeCompare(b.order));
  return { groups, subgroups };
}
