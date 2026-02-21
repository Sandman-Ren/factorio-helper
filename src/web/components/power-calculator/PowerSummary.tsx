import { ItemIcon } from '../ItemIcon.js';
import { Card, CardHeader, CardTitle, CardContent, Separator } from '../../ui/index.js';
import type { CategorySummary, FuelSummaryEntry } from '../../hooks/usePowerCalculator.js';

interface Props {
  electricSummary: CategorySummary[];
  fuelSummary: FuelSummaryEntry[];
  totalElectricDisplay: string;
  totalPeakDisplay: string;
  hasPeakDifference: boolean;
  totalElectricKW: number;
}

export function PowerSummary({
  electricSummary,
  fuelSummary,
  totalElectricDisplay,
  totalPeakDisplay,
  hasPeakDifference,
  totalElectricKW,
}: Props) {
  if (totalElectricKW <= 0 && fuelSummary.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {totalElectricKW > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Electric Power</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {electricSummary.map(cat => (
                <div key={cat.category} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{cat.category}</span>
                  <span className="tabular-nums font-medium">{cat.displayPower}</span>
                </div>
              ))}
            </div>

            <Separator className="my-3" />

            <div className="flex items-center justify-between">
              <span className="font-bold">Total</span>
              <span className="text-lg font-bold tabular-nums">{totalElectricDisplay}</span>
            </div>

            {hasPeakDifference && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-muted-foreground text-sm">Peak</span>
                <span className="text-sm text-muted-foreground tabular-nums">{totalPeakDisplay}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {fuelSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fuel Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {fuelSummary.map(f => (
                <div key={f.fuelName} className="flex items-center gap-2 text-sm">
                  <ItemIcon name={f.fuelName} size={20} />
                  <span className="flex-1">{f.fuelName.replace(/-/g, ' ')}</span>
                  <span className="tabular-nums font-medium">{f.totalPerSecond.toFixed(2)}/s</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
