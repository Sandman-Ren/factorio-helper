import { readFileSync } from 'fs';
import { parseLuaPrototypes, type LuaValue } from './lua-table-parser.js';
import type { Recipe, RecipeItem } from '../data/schema.js';

function parseRecipeItem(entry: LuaValue): RecipeItem | undefined {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return undefined;
  const obj = entry as Record<string, LuaValue>;
  const type = obj['type'];
  const name = obj['name'];
  const amount = obj['amount'];
  if (typeof type !== 'string' || typeof name !== 'string' || typeof amount !== 'number') {
    return undefined;
  }
  return { type: type as 'item' | 'fluid', name, amount };
}

function parseRecipeItems(value: LuaValue): RecipeItem[] {
  if (!Array.isArray(value)) return [];
  const items: RecipeItem[] = [];
  for (const entry of value) {
    const item = parseRecipeItem(entry);
    if (item) items.push(item);
  }
  return items;
}

export function extractRecipes(luaPath: string): Recipe[] {
  const source = readFileSync(luaPath, 'utf-8');
  const entries = parseLuaPrototypes(source);
  const recipes: Recipe[] = [];

  for (const entry of entries) {
    if (entry['type'] !== 'recipe') continue;
    const name = entry['name'];
    if (typeof name !== 'string') continue;

    const category = typeof entry['category'] === 'string' ? entry['category'] : 'crafting';
    const energy_required = typeof entry['energy_required'] === 'number' ? entry['energy_required'] : 0.5;

    const ingredients = parseRecipeItems(entry['ingredients'] as LuaValue);
    const results = parseRecipeItems(entry['results'] as LuaValue);

    // Skip recipes with no parseable ingredients or results (e.g. parameter recipes with string concat)
    if (ingredients.length === 0 && results.length === 0) continue;

    recipes.push({ name, category, energy_required, ingredients, results });
  }

  return recipes;
}
