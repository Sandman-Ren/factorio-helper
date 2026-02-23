import { ItemIcon } from '../ItemIcon.js';
import { Input, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/index.js';
import XIcon from 'lucide-react/dist/esm/icons/x';
import type { ComputedEntry } from '../../hooks/usePowerCalculator.js';
import type { Fuel } from '../../../data/schema.js';

interface Props {
  entries: ComputedEntry[];
  onUpdateCount: (id: string, count: number) => void;
  onUpdateFuel: (id: string, fuel: string) => void;
  onRemove: (id: string) => void;
  defaultFuel: string;
  fuels: Fuel[];
}

export function EntityList({ entries, onUpdateCount, onUpdateFuel, onRemove, defaultFuel, fuels }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12 text-sm">
        Add entities above to calculate power draw
      </div>
    );
  }

  return (
    <div>
      {entries.map((entry, i) => {
        const fuelCategories = entry.entity.fuel_categories;
        const availableFuels = fuelCategories
          ? fuels.filter(f => fuelCategories.includes(f.fuel_category))
          : [];

        return (
          <div
            key={entry.id}
            className={`flex items-center gap-3 py-2 ${i < entries.length - 1 ? 'border-b border-border' : ''}`}
          >
            <ItemIcon name={entry.entityName} size={24} />
            <span className="flex-1 text-sm min-w-0 truncate">
              {entry.entityName.replace(/-/g, ' ')}
            </span>

            <Input
              type="number"
              min={0}
              step={1}
              value={entry.count}
              onChange={e => onUpdateCount(entry.id, parseInt(e.target.value, 10) || 0)}
              className="w-20 tabular-nums text-right"
            />

            <span className="text-sm font-medium tabular-nums w-24 text-right shrink-0">
              {entry.displayPower}
            </span>

            {entry.entity.energy_type === 'burner' && availableFuels.length > 0 && (
              <Select
                value={entry.fuel || defaultFuel}
                onValueChange={v => onUpdateFuel(entry.id, v)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableFuels.map(f => (
                    <SelectItem key={f.name} value={f.name}>
                      <ItemIcon name={f.name} size={16} /> {f.name.replace(/-/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {entry.displayFuel && (
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {entry.displayFuel}
              </span>
            )}

            {entry.displayPeak && (
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                (peak: {entry.displayPeak})
              </span>
            )}

            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Remove entry"
              onClick={() => onRemove(entry.id)}
            >
              <XIcon />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
