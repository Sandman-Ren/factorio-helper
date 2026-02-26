import { useMemo, useState } from 'react';
import type { Blueprint } from '../../../blueprint/index.js';
import { ItemIcon } from '../ItemIcon.js';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Badge,
  Button,
} from '../../ui/index.js';

interface EntityCount {
  name: string;
  count: number;
}

interface RecipeEntry {
  recipe: string;
  machines: { name: string; count: number }[];
  total: number;
}

interface BlueprintStatistics {
  totalEntities: number;
  totalTiles: number;
  entityCounts: EntityCount[];
  tileCounts: EntityCount[];
  recipes: RecipeEntry[];
}

function computeStatistics(blueprint: Blueprint): BlueprintStatistics {
  const entityMap = new Map<string, number>();
  const tileMap = new Map<string, number>();
  const recipeMap = new Map<string, Map<string, number>>();

  for (const entity of blueprint.entities ?? []) {
    entityMap.set(entity.name, (entityMap.get(entity.name) ?? 0) + 1);

    if (entity.recipe) {
      let machines = recipeMap.get(entity.recipe);
      if (!machines) { machines = new Map(); recipeMap.set(entity.recipe, machines); }
      machines.set(entity.name, (machines.get(entity.name) ?? 0) + 1);
    }
  }

  for (const tile of blueprint.tiles ?? []) {
    tileMap.set(tile.name, (tileMap.get(tile.name) ?? 0) + 1);
  }

  return {
    totalEntities: blueprint.entities?.length ?? 0,
    totalTiles: blueprint.tiles?.length ?? 0,
    entityCounts: [...entityMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    tileCounts: [...tileMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    recipes: [...recipeMap.entries()]
      .map(([recipe, machines]) => ({
        recipe,
        machines: [...machines.entries()].map(([name, count]) => ({ name, count })),
        total: [...machines.values()].reduce((s, c) => s + c, 0),
      }))
      .sort((a, b) => b.total - a.total),
  };
}

const INITIAL_SHOW = 50;

function CountList({ items }: { items: EntityCount[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, INITIAL_SHOW);
  const hasMore = items.length > INITIAL_SHOW;

  return (
    <div className="space-y-1">
      {visible.map(item => (
        <div key={item.name} className="flex items-center gap-2 py-0.5">
          <ItemIcon name={item.name} size={20} />
          <span className="flex-1 text-sm">{item.name.replace(/-/g, ' ')}</span>
          <span className="text-sm tabular-nums text-muted-foreground">{item.count}</span>
        </div>
      ))}
      {hasMore && !showAll && (
        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowAll(true)}>
          Show all ({items.length})
        </Button>
      )}
    </div>
  );
}

interface BlueprintStatsProps {
  blueprint: Blueprint;
}

export function BlueprintStats({ blueprint }: BlueprintStatsProps) {
  const stats = useMemo(() => computeStatistics(blueprint), [blueprint]);

  if (stats.totalEntities === 0 && stats.totalTiles === 0) {
    return (
      <div className="text-sm text-muted-foreground italic py-2">
        This blueprint is empty &mdash; it contains no entities or tiles.
      </div>
    );
  }

  const defaultOpen = ['entities'];
  if (stats.tileCounts.length > 0) defaultOpen.push('tiles');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{stats.totalEntities} entities</Badge>
        {stats.totalTiles > 0 && (
          <Badge variant="secondary">{stats.totalTiles} tiles</Badge>
        )}
        {stats.recipes.length > 0 && (
          <Badge variant="outline">{stats.recipes.length} recipes</Badge>
        )}
      </div>

      <Accordion type="multiple" defaultValue={defaultOpen}>
        <AccordionItem value="entities">
          <AccordionTrigger className="text-sm">
            Entities ({stats.entityCounts.length} types)
          </AccordionTrigger>
          <AccordionContent>
            <CountList items={stats.entityCounts} />
          </AccordionContent>
        </AccordionItem>

        {stats.tileCounts.length > 0 && (
          <AccordionItem value="tiles">
            <AccordionTrigger className="text-sm">
              Tiles ({stats.tileCounts.length} types)
            </AccordionTrigger>
            <AccordionContent>
              <CountList items={stats.tileCounts} />
            </AccordionContent>
          </AccordionItem>
        )}

        {stats.recipes.length > 0 && (
          <AccordionItem value="recipes">
            <AccordionTrigger className="text-sm">
              Recipes ({stats.recipes.length})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {stats.recipes.map(r => (
                  <div key={r.recipe} className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ItemIcon name={r.recipe} size={18} />
                      <span className="text-sm font-medium">{r.recipe.replace(/-/g, ' ')}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">({r.total})</span>
                    </div>
                    {r.machines.map(m => (
                      <div key={m.name} className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
                        <ItemIcon name={m.name} size={14} />
                        <span>{m.name.replace(/-/g, ' ')}</span>
                        <span className="tabular-nums">&times;{m.count}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
