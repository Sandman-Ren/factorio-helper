import type { Recipe, Machine, Technology } from '../../../data/schema.js';
import { ItemIcon } from '../ItemIcon.js';
import { Button } from '../../ui/index.js';
import CalculatorIcon from 'lucide-react/dist/esm/icons/calculator';
import ArrowRightIcon from 'lucide-react/dist/esm/icons/arrow-right';

interface Props {
  recipe: Recipe;
  machines: Machine[];
  techs?: Technology[];
  onItemClick: (itemName: string) => void;
  onCalculateItem?: (itemName: string) => void;
}

export function RecipeCard({ recipe, machines, techs, onItemClick, onCalculateItem }: Props) {
  const firstProduct = recipe.results[0]?.name;
  const isMiningRecipe = recipe.name.endsWith('-mining') || recipe.name === 'water-pumping';

  return (
    <div className="rounded-md border border-border bg-card/50 p-3">
      {/* Recipe name + calculate button */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">
          {formatRecipeName(recipe.name)}
        </div>
        {onCalculateItem && firstProduct && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 shrink-0"
            onClick={() => onCalculateItem(firstProduct)}
          >
            <CalculatorIcon className="size-3" />
            Calculate
          </Button>
        )}
      </div>

      {/* Ingredients → Products */}
      <div className="flex items-center gap-2 flex-wrap">
        {recipe.ingredients.length > 0 ? (
          recipe.ingredients.map((ing, i) => (
            <RecipeItemChip
              key={`${ing.name}-${i}`}
              name={ing.name}
              type={ing.type}
              amount={ing.amount}
              onClick={() => onItemClick(ing.name)}
            />
          ))
        ) : (
          <span className="text-xs text-muted-foreground italic">no ingredients</span>
        )}

        <ArrowRightIcon className="size-4 text-muted-foreground shrink-0" />

        {recipe.results.map((res, i) => (
          <RecipeItemChip
            key={`${res.name}-${i}`}
            name={res.name}
            type={res.type}
            amount={res.amount}
            onClick={() => onItemClick(res.name)}
          />
        ))}
      </div>

      {/* Craft time + machines */}
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
        <span>{recipe.energy_required}s craft time</span>
        {machines.length > 0 && (
          <span className="flex items-center gap-1">
            {isMiningRecipe ? 'Mined by' : 'Made in'}:
            {machines.map(m => (
              <button
                key={m.name}
                onClick={() => onItemClick(m.name)}
                className="inline-flex items-center gap-0.5 cursor-pointer bg-transparent border-none p-0 text-xs text-muted-foreground hover:text-foreground transition-colors duration-100"
                title={m.name.replace(/-/g, ' ')}
              >
                <ItemIcon name={m.name} size={16} />
              </button>
            ))}
          </span>
        )}
        {techs && techs.length > 0 && (
          <span className="flex items-center gap-1">
            Unlocked by:
            {techs.map(t => (
              <span key={t.name} className="inline-flex items-center gap-0.5" title={t.name.replace(/-/g, ' ')}>
                <ItemIcon name={t.name} size={16} category="technology" />
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

function RecipeItemChip({ name, type, amount, onClick }: {
  name: string;
  type: 'item' | 'fluid';
  amount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded border border-border bg-accent/50 px-1.5 py-0.5 cursor-pointer hover:bg-accent transition-colors duration-100"
      title={name.replace(/-/g, ' ')}
    >
      <ItemIcon name={name} size={20} category={type} />
      <span className="text-xs">{amount}x</span>
    </button>
  );
}

function formatRecipeName(name: string): string {
  if (name === 'water-pumping') return 'Water Pumping';
  if (name.endsWith('-mining')) {
    return name.replace(/-mining$/, '').replace(/-/g, ' ') + ' (mining)';
  }
  return name.replace(/-/g, ' ');
}
