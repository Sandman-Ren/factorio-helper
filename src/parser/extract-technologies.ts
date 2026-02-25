import { readFileSync } from 'fs';
import { parseLuaPrototypes, type LuaValue } from './lua-table-parser.js';
import type { Technology, TechIngredient, TechUnit, ResearchTrigger, TechEffect } from '../data/schema.js';

function parseTechIngredient(entry: LuaValue): TechIngredient | undefined {
  if (!entry || typeof entry !== 'object') return undefined;

  // Tuple form: {"automation-science-pack", 1} -> parsed as {"1": "name", "2": amount}
  if (!Array.isArray(entry)) {
    const obj = entry as Record<string, LuaValue>;
    const name = obj['1'];
    const amount = obj['2'];
    if (typeof name === 'string' && typeof amount === 'number') {
      return { name, amount };
    }
    // Named form: {name = "...", amount = N}
    if (typeof obj['name'] === 'string' && typeof obj['amount'] === 'number') {
      return { name: obj['name'] as string, amount: obj['amount'] as number };
    }
    return undefined;
  }

  // Array form: ["name", amount]
  if (entry.length >= 2 && typeof entry[0] === 'string' && typeof entry[1] === 'number') {
    return { name: entry[0], amount: entry[1] };
  }
  return undefined;
}

function parseTechUnit(value: LuaValue): TechUnit | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const obj = value as Record<string, LuaValue>;

  const time = typeof obj['time'] === 'number' ? obj['time'] : 30;

  const ingredients: TechIngredient[] = [];
  const rawIngredients = obj['ingredients'];
  if (Array.isArray(rawIngredients)) {
    for (const entry of rawIngredients) {
      const ing = parseTechIngredient(entry);
      if (ing) ingredients.push(ing);
    }
  }

  const unit: TechUnit = { time, ingredients };

  if (typeof obj['count'] === 'number') {
    unit.count = obj['count'];
  }
  if (typeof obj['count_formula'] === 'string') {
    unit.count_formula = obj['count_formula'];
  }

  return unit;
}

function parseResearchTrigger(value: LuaValue): ResearchTrigger | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const obj = value as Record<string, LuaValue>;

  const type = obj['type'];
  if (typeof type !== 'string') return undefined;

  const trigger: ResearchTrigger = { type };
  if (typeof obj['item'] === 'string') trigger.item = obj['item'];
  if (typeof obj['count'] === 'number') trigger.count = obj['count'];

  return trigger;
}

function parseTechEffects(value: LuaValue): TechEffect[] {
  if (!Array.isArray(value)) return [];
  const effects: TechEffect[] = [];

  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const obj = entry as Record<string, LuaValue>;
    const type = obj['type'];
    if (typeof type !== 'string') continue;

    const effect: TechEffect = { type };
    if (typeof obj['recipe'] === 'string') effect.recipe = obj['recipe'];
    if (typeof obj['modifier'] === 'number') effect.modifier = obj['modifier'];
    if (typeof obj['quality'] === 'string') effect.quality = obj['quality'];
    if (typeof obj['ammo_category'] === 'string') effect.ammo_category = obj['ammo_category'];
    if (typeof obj['turret_id'] === 'string') effect.turret_id = obj['turret_id'];

    effects.push(effect);
  }

  return effects;
}

function parsePrerequisites(value: LuaValue): string[] {
  if (!value) return [];

  // Array form
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }

  // Object with numeric keys (parsed from Lua tuple): {"1": "tech-a", "2": "tech-b"}
  if (typeof value === 'object') {
    const obj = value as Record<string, LuaValue>;
    const result: string[] = [];
    for (let i = 1; ; i++) {
      const v = obj[String(i)];
      if (typeof v !== 'string') break;
      result.push(v);
    }
    return result;
  }

  return [];
}

export function extractTechnologies(...luaPaths: string[]): Technology[] {
  const technologies: Technology[] = [];
  const seen = new Set<string>();

  for (const luaPath of luaPaths) {
    const source = readFileSync(luaPath, 'utf-8');
    const entries = parseLuaPrototypes(source);

    for (const entry of entries) {
      if (entry['type'] !== 'technology') continue;
      const name = entry['name'];
      if (typeof name !== 'string') continue;
      if (seen.has(name)) continue;
      seen.add(name);

      const prerequisites = parsePrerequisites(entry['prerequisites'] as LuaValue);
      const effects = parseTechEffects(entry['effects'] as LuaValue);
      const unit = parseTechUnit(entry['unit'] as LuaValue);
      const research_trigger = parseResearchTrigger(entry['research_trigger'] as LuaValue);

      const tech: Technology = { name, prerequisites, effects };

      if (unit) tech.unit = unit;
      if (research_trigger) tech.research_trigger = research_trigger;
      if (typeof entry['order'] === 'string') tech.order = entry['order'];
      if (entry['upgrade'] === true) tech.upgrade = true;

      const maxLevel = entry['max_level'];
      if (maxLevel === 'infinite' || typeof maxLevel === 'string') {
        tech.max_level = maxLevel;
      } else if (typeof maxLevel === 'number') {
        tech.max_level = maxLevel;
      }

      technologies.push(tech);
    }
  }

  return technologies;
}
