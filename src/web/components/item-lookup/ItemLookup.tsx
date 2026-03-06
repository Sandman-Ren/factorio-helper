import { useCallback } from 'react';
import { ItemSelector } from '../ItemSelector.js';
import { useItemLookupMaps } from '../../hooks/use-item-lookup-maps.js';
import { RequiredTechnologies } from './RequiredTechnologies.js';
import { ProducedBy } from './ProducedBy.js';
import { UsedIn } from './UsedIn.js';

interface Props {
  selectedItem: string;
  onSelectItem: (itemName: string) => void;
  onCalculateItem: (itemName: string) => void;
  onViewTech: (techName: string) => void;
}

export function ItemLookup({ selectedItem, onSelectItem, onCalculateItem, onViewTech }: Props) {
  const maps = useItemLookupMaps();

  const handleItemClick = useCallback((itemName: string) => {
    onSelectItem(itemName);
  }, [onSelectItem]);

  const producingRecipes = selectedItem ? maps.itemToProducingRecipes.get(selectedItem) ?? [] : [];
  const consumingRecipes = selectedItem ? maps.itemToConsumingRecipes.get(selectedItem) ?? [] : [];

  // Collect all techs across all producing recipes
  const techSet = new Map<string, import('../../../data/schema.js').Technology>();
  for (const entry of producingRecipes) {
    const techs = maps.recipeToTechs.get(entry.recipe.name);
    if (techs) {
      for (const tech of techs) {
        techSet.set(tech.name, tech);
      }
    }
  }
  const technologies = [...techSet.values()];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div style={{ marginBottom: 16, maxWidth: 400 }}>
        <ItemSelector
          items={maps.allLookupItems}
          value={selectedItem}
          onChange={onSelectItem}
          label="Look Up Item"
        />
      </div>

      {selectedItem && (
        <div className="flex flex-col gap-6">
          <RequiredTechnologies
            technologies={technologies}
            onViewTech={onViewTech}
          />
          <ProducedBy
            entries={producingRecipes}
            recipeToTechs={maps.recipeToTechs}
            onItemClick={handleItemClick}
            onCalculateItem={onCalculateItem}
          />
          <UsedIn
            recipes={consumingRecipes}
            itemToProducingRecipes={maps.itemToProducingRecipes}
            onItemClick={handleItemClick}
            onCalculateItem={onCalculateItem}
          />
        </div>
      )}
    </div>
  );
}
