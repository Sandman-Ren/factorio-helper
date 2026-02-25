import type { usePowerCalculator } from '../../hooks/usePowerCalculator.js';
import { allFuels } from '../../hooks/usePowerCalculator.js';
import { ItemIcon } from '../ItemIcon.js';
import { EntityPicker } from './EntityPicker.js';
import { EntityList } from './EntityList.js';
import { PowerSummary } from './PowerSummary.js';
import {
  Label,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../ui/index.js';

type PowerCalcState = ReturnType<typeof usePowerCalculator>;

export function PowerCalculator(props: PowerCalcState) {
  const {
    entries,
    computedEntries,
    addEntity,
    removeEntry,
    updateCount,
    updateFuel,
    defaultFuel,
    setDefaultFuel,
    clearAll,
    roundUpAll,
    hasFractional,
    electricSummary,
    fuelSummary,
    totalElectricKW,
    totalElectricDisplay,
    totalPeakDisplay,
    hasPeakDifference,
  } = props;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      {/* Headline banner */}
      {computedEntries.length > 0 && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-muted-foreground text-sm">Total Electric</span>
            <div className="text-2xl font-bold tabular-nums">{totalElectricDisplay}</div>
          </div>
          {fuelSummary.length > 0 && (
            <div>
              <span className="text-muted-foreground text-sm">Fuel</span>
              <div className="text-2xl font-bold tabular-nums">
                {fuelSummary.map(f => `${f.totalPerSecond.toFixed(2)} ${f.fuelName.replace(/-/g, ' ')}/s`).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-end gap-4 mb-6 flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <Label className="mb-1">Entity</Label>
          <EntityPicker onSelect={addEntity} />
        </div>
        <div>
          <Label className="mb-1">Default Fuel</Label>
          <Select value={defaultFuel} onValueChange={setDefaultFuel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allFuels.filter(f => f.fuel_category === 'chemical').map(f => (
                <SelectItem key={f.name} value={f.name}>
                  <ItemIcon name={f.name} size={16} /> {f.name.replace(/-/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFractional && (
          <Button variant="outline" onClick={roundUpAll}>Round Up</Button>
        )}
        {entries.length > 0 && (
          <Button variant="ghost" onClick={clearAll}>Clear All</Button>
        )}
      </div>

      {/* Entity list */}
      <EntityList
        entries={computedEntries}
        onUpdateCount={updateCount}
        onUpdateFuel={updateFuel}
        onRemove={removeEntry}
        defaultFuel={defaultFuel}
        fuels={allFuels}
      />

      {/* Summary */}
      <div className="mt-6">
        <PowerSummary
          electricSummary={electricSummary}
          fuelSummary={fuelSummary}
          totalElectricDisplay={totalElectricDisplay}
          totalPeakDisplay={totalPeakDisplay}
          hasPeakDifference={hasPeakDifference}
          totalElectricKW={totalElectricKW}
        />
      </div>
    </div>
  );
}
