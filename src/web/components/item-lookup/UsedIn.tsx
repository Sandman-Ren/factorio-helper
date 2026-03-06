import type { Recipe, Machine } from '../../../data/schema.js';
import type { ProducedByEntry } from '../../hooks/use-item-lookup-maps.js';
import { RecipeCard } from './RecipeCard.js';

interface Props {
  recipes: Recipe[];
  itemToProducingRecipes: Map<string, ProducedByEntry[]>;
  onItemClick: (itemName: string) => void;
  onCalculateItem: (itemName: string) => void;
}

export function UsedIn({ recipes, itemToProducingRecipes, onItemClick, onCalculateItem }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Used In
        {recipes.length > 0 && (
          <span className="ml-1.5 text-xs font-normal">({recipes.length})</span>
        )}
      </h3>
      {recipes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not used as an ingredient in any recipe.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.name}
              recipe={recipe}
              machines={findMachinesForRecipe(recipe, itemToProducingRecipes)}
              onItemClick={onItemClick}
              onCalculateItem={onCalculateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function findMachinesForRecipe(recipe: Recipe, itemToProducingRecipes: Map<string, ProducedByEntry[]>): Machine[] {
  for (const result of recipe.results) {
    const entries = itemToProducingRecipes.get(result.name);
    if (entries) {
      const match = entries.find(e => e.recipe.name === recipe.name);
      if (match) return match.machines;
    }
  }
  return [];
}
