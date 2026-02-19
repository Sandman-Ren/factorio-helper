import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { extractRecipes } from '../src/parser/extract-recipes.js';
import { extractItems } from '../src/parser/extract-items.js';
import { extractFluids } from '../src/parser/extract-fluids.js';
import { extractMachines } from '../src/parser/extract-machines.js';
import { extractMiners } from '../src/parser/extract-miners.js';
import { extractResources } from '../src/parser/extract-resources.js';
import { extractItemGroups } from '../src/parser/extract-item-groups.js';

const DATA_ROOT = join(import.meta.dirname, '..', 'factorio-data', 'base', 'prototypes');
const SPACE_AGE_ROOT = join(import.meta.dirname, '..', 'factorio-data', 'space-age', 'prototypes');
const OUT_DIR = join(import.meta.dirname, '..', 'src', 'data', 'generated');

mkdirSync(OUT_DIR, { recursive: true });

console.log('Extracting recipes...');
const recipes = extractRecipes(join(DATA_ROOT, 'recipe.lua'));
writeFileSync(join(OUT_DIR, 'recipes.json'), JSON.stringify(recipes, null, 2));
console.log(`  ${recipes.length} recipes`);

console.log('Extracting items...');
const items = extractItems(join(DATA_ROOT, 'item.lua'));
writeFileSync(join(OUT_DIR, 'items.json'), JSON.stringify(items, null, 2));
console.log(`  ${items.length} items`);

console.log('Extracting fluids...');
const fluids = extractFluids(join(DATA_ROOT, 'fluid.lua'));
writeFileSync(join(OUT_DIR, 'fluids.json'), JSON.stringify(fluids, null, 2));
console.log(`  ${fluids.length} fluids`);

console.log('Extracting machines...');
const machines = extractMachines(join(DATA_ROOT, 'entity', 'entities.lua'));
writeFileSync(join(OUT_DIR, 'machines.json'), JSON.stringify(machines, null, 2));
console.log(`  ${machines.length} machines`);

console.log('Extracting miners...');
const miners = extractMiners(
  join(DATA_ROOT, 'entity', 'mining-drill.lua'),
  join(DATA_ROOT, 'entity', 'entities.lua'),
  join(SPACE_AGE_ROOT, 'entity', 'big-mining-drill.lua'),
);
writeFileSync(join(OUT_DIR, 'miners.json'), JSON.stringify(miners, null, 2));
console.log(`  ${miners.length} miners`);

console.log('Extracting resources...');
const resources = extractResources(join(DATA_ROOT, 'entity', 'resources.lua'));
writeFileSync(join(OUT_DIR, 'resources.json'), JSON.stringify(resources, null, 2));
console.log(`  ${resources.length} resources`);

console.log('Extracting item groups...');
const itemGroups = extractItemGroups([
  join(DATA_ROOT, 'item-groups.lua'),
  join(SPACE_AGE_ROOT, 'item-groups.lua'),
]);
writeFileSync(join(OUT_DIR, 'item-groups.json'), JSON.stringify(itemGroups, null, 2));
console.log(`  ${itemGroups.groups.length} groups, ${Object.keys(itemGroups.subgroups).length} subgroups`);

console.log('\nDone! Output written to src/data/generated/');
