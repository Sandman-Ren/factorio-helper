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

const hasBurner = (entries: ComputedEntry[]) =>
  entries.some(e => e.entity.energy_type === 'burner');

export function EntityList({ entries, onUpdateCount, onUpdateFuel, onRemove, defaultFuel, fuels }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12 text-sm">
        Add entities above to calculate power draw
      </div>
    );
  }

  const showFuelColumns = hasBurner(entries);

  return (
    <div
      className="grid items-center gap-x-3 gap-y-0"
      style={{
        gridTemplateColumns: showFuelColumns
          ? '24px 1fr 80px 96px 130px auto 24px'
          : '24px 1fr 80px 96px 24px',
      }}
    >
      {entries.map((entry, i) => {
        const fuelCategories = entry.entity.fuel_categories;
        const availableFuels = fuelCategories
          ? fuels.filter(f => fuelCategories.includes(f.fuel_category))
          : [];
        const isBurner = entry.entity.energy_type === 'burner' && availableFuels.length > 0;
        const borderClass = i < entries.length - 1 ? 'border-b border-border' : '';

        return (
          <div key={entry.id} className={`grid grid-cols-subgrid col-span-full items-center py-2 ${borderClass}`}>
            <ItemIcon name={entry.entityName} size={24} />

            <span className="text-sm min-w-0 truncate">
              {entry.entityName.replace(/-/g, ' ')}
            </span>

            <Input
              type="number"
              min={0}
              step="any"
              aria-label={`${entry.entityName.replace(/-/g, ' ')} count`}
              value={entry.count}
              onChange={e => onUpdateCount(entry.id, parseFloat(e.target.value) || 0)}
              className="w-full tabular-nums text-right"
            />

            <span className="text-sm font-medium tabular-nums text-right">
              {entry.displayPower}
              {entry.displayPeak ? (
                <span className="block text-xs text-muted-foreground">
                  peak: {entry.displayPeak}
                </span>
              ) : null}
            </span>

            {showFuelColumns ? (
              isBurner ? (
                <>
                  <Select
                    value={entry.fuel || defaultFuel}
                    onValueChange={v => onUpdateFuel(entry.id, v)}
                  >
                    <SelectTrigger className="w-full">
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
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {entry.displayFuel ?? ''}
                  </span>
                </>
              ) : (
                <>
                  <span />
                  <span />
                </>
              )
            ) : null}

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
