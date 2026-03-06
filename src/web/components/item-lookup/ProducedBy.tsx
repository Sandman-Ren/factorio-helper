import type { Technology } from '../../../data/schema.js';
import type { ProducedByEntry } from '../../hooks/use-item-lookup-maps.js';
import { RecipeCard } from './RecipeCard.js';

interface Props {
  entries: ProducedByEntry[];
  recipeToTechs: Map<string, Technology[]>;
  onItemClick: (itemName: string) => void;
  onCalculateItem: (itemName: string) => void;
}

export function ProducedBy({ entries, recipeToTechs, onItemClick, onCalculateItem }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Produced By
        {entries.length > 0 && (
          <span className="ml-1.5 text-xs font-normal">({entries.length})</span>
        )}
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not produced by any recipe.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map(entry => (
            <RecipeCard
              key={entry.recipe.name}
              recipe={entry.recipe}
              machines={entry.machines}
              techs={recipeToTechs.get(entry.recipe.name)}
              onItemClick={onItemClick}
              onCalculateItem={onCalculateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}
