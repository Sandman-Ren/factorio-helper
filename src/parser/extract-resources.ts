import { readFileSync } from 'fs';
import { parseLuaPrototypes, type LuaValue } from './lua-table-parser.js';
import type { Resource, RecipeItem } from '../data/schema.js';

/**
 * Extract resource entities from Lua data files.
 * Handles both inline table definitions (uranium-ore, crude-oil) and
 * resource() helper function calls (iron-ore, copper-ore, coal, stone).
 */
export function extractResources(luaPath: string): Resource[] {
  const source = readFileSync(luaPath, 'utf-8');
  const resources: Resource[] = [];
  const seen = new Set<string>();

  // Pass 1: Parse inline table entries via the Lua parser
  // (handles uranium-ore, crude-oil which are defined as plain tables)
  const entries = parseLuaPrototypes(source);
  for (const entry of entries) {
    if (entry['type'] !== 'resource') continue;
    const name = entry['name'];
    if (typeof name !== 'string' || seen.has(name)) continue;

    const category = typeof entry['category'] === 'string' ? entry['category'] : 'basic-solid';

    const minable = entry['minable'];
    if (!minable || typeof minable !== 'object' || Array.isArray(minable)) continue;
    const minableObj = minable as Record<string, LuaValue>;

    const mining_time = typeof minableObj['mining_time'] === 'number' ? minableObj['mining_time'] : 1;

    // Parse results array (e.g., crude-oil has a results table)
    const results: RecipeItem[] = [];
    const rawResults = minableObj['results'];
    if (Array.isArray(rawResults)) {
      for (const r of rawResults) {
        if (r && typeof r === 'object' && !Array.isArray(r)) {
          const rObj = r as Record<string, LuaValue>;
          const rType = typeof rObj['type'] === 'string' ? rObj['type'] : 'item';
          const rName = typeof rObj['name'] === 'string' ? rObj['name'] : name;
          // Use amount_min as fallback for variable-yield resources
          const rAmount = typeof rObj['amount'] === 'number'
            ? rObj['amount']
            : typeof rObj['amount_min'] === 'number' ? rObj['amount_min'] : 1;
          results.push({ type: rType as 'item' | 'fluid', name: rName, amount: rAmount });
        }
      }
    }
    if (results.length === 0) {
      // Single result (e.g., result = "uranium-ore")
      const result = typeof minableObj['result'] === 'string' ? minableObj['result'] : name;
      results.push({ type: 'item', name: result, amount: 1 });
    }

    // Parse required fluid (uranium-ore needs sulfuric-acid)
    let required_fluid: Resource['required_fluid'];
    const reqFluid = minableObj['required_fluid'];
    const fluidAmount = minableObj['fluid_amount'];
    if (typeof reqFluid === 'string' && typeof fluidAmount === 'number') {
      required_fluid = { name: reqFluid, amount: fluidAmount };
    }

    resources.push({ name, category, mining_time, results, required_fluid });
    seen.add(name);
  }

  // Pass 2: Extract resources defined via resource() helper function.
  // The Lua parser skips function calls, so we use regex to extract
  // name and mining_time from the first argument table of each resource() call.
  const helperRegex = /resource\s*\(\s*\{([\s\S]*?)\}\s*,\s*\{/g;
  let match;
  while ((match = helperRegex.exec(source)) !== null) {
    const content = match[1]!;
    const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
    const timeMatch = content.match(/mining_time\s*=\s*(\d+(?:\.\d+)?)/);
    if (!nameMatch?.[1] || !timeMatch?.[1]) continue;

    const name = nameMatch[1];
    if (seen.has(name)) continue;

    const mining_time = parseFloat(timeMatch[1]);
    resources.push({
      name,
      category: 'basic-solid', // resource() helper always creates basic-solid resources
      mining_time,
      results: [{ type: 'item', name, amount: 1 }],
    });
    seen.add(name);
  }

  return resources;
}
