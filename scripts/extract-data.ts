import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { extractRecipes } from '../src/parser/extract-recipes.js';
import { extractItems } from '../src/parser/extract-items.js';
import { extractFluids } from '../src/parser/extract-fluids.js';
import { extractMachines } from '../src/parser/extract-machines.js';
import { extractMiners } from '../src/parser/extract-miners.js';
import { extractResources } from '../src/parser/extract-resources.js';
import { extractItemGroups } from '../src/parser/extract-item-groups.js';
import { extractTechnologies } from '../src/parser/extract-technologies.js';
import { extractFuels } from '../src/parser/extract-fuels.js';
import { extractPowerEntities } from '../src/parser/extract-power-entities.js';
import { generateTechLayout } from './generate-tech-layout.js';

const DATA_ROOT = join(import.meta.dirname, '..', 'factorio-data', 'base', 'prototypes');
const SPACE_AGE_ROOT = join(import.meta.dirname, '..', 'factorio-data', 'space-age', 'prototypes');
const QUALITY_ROOT = join(import.meta.dirname, '..', 'factorio-data', 'quality', 'prototypes');
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

console.log('Extracting technologies...');
const technologies = extractTechnologies(
  join(DATA_ROOT, 'technology.lua'),
  join(SPACE_AGE_ROOT, 'technology.lua'),
  join(QUALITY_ROOT, 'technology.lua'),
);
writeFileSync(join(OUT_DIR, 'technologies.json'), JSON.stringify(technologies, null, 2));
console.log(`  ${technologies.length} technologies`);

console.log('Generating tech tree layout...');
const techLayout = generateTechLayout(technologies);
writeFileSync(join(OUT_DIR, 'tech-tree-layout.json'), JSON.stringify(techLayout, null, 2));
console.log(`  ${Object.keys(techLayout.positions).length} positions, ${techLayout.edges.length} edges`);

console.log('Extracting fuels...');
const fuels = [
  ...extractFuels(join(DATA_ROOT, 'item.lua')),
  ...extractFuels(join(SPACE_AGE_ROOT, 'item.lua')),
];
// Deduplicate by name
const uniqueFuels = [...new Map(fuels.map(f => [f.name, f])).values()];
writeFileSync(join(OUT_DIR, 'fuels.json'), JSON.stringify(uniqueFuels, null, 2));
console.log(`  ${uniqueFuels.length} fuels`);

console.log('Extracting power entities...');
const powerEntities = extractPowerEntities(
  join(DATA_ROOT, 'entity', 'entities.lua'),
  join(DATA_ROOT, 'entity', 'turrets.lua'),
  join(DATA_ROOT, 'entity', 'circuit-network.lua'),
  join(DATA_ROOT, 'entity', 'mining-drill.lua'),
  join(SPACE_AGE_ROOT, 'entity', 'entities.lua'),
  join(SPACE_AGE_ROOT, 'entity', 'turrets.lua'),
  join(SPACE_AGE_ROOT, 'entity', 'circuit-network.lua'),
  join(SPACE_AGE_ROOT, 'entity', 'big-mining-drill.lua'),
);
writeFileSync(join(OUT_DIR, 'power-entities.json'), JSON.stringify(powerEntities, null, 2));
console.log(`  ${powerEntities.length} power entities`);

console.log('\nDone! Output written to src/data/generated/');
