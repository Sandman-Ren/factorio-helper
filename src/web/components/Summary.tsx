import type { ProductionPlan } from '../../calculator/types.js';
import type { TimeUnit } from '../hooks/useCalculator.js';
import { formatPower } from '../../calculator/energy.js';
import { ItemIcon } from './ItemIcon.js';
import { Button } from '../ui/index.js';

interface Props {
  plan: ProductionPlan;
  timeUnit: TimeUnit;
  integerMultiplier: number | null;
  onApplyMultiplier?: (multiplier: number) => void;
}

const TIME_LABELS: Record<TimeUnit, string> = { sec: '/s', min: '/min', hour: '/hr' };
const TIME_MULTIPLIERS: Record<TimeUnit, number> = { sec: 1, min: 60, hour: 3600 };

export function Summary({ plan, timeUnit, integerMultiplier, onApplyMultiplier }: Props) {
  const machineEntries = Object.entries(plan.totalMachines).sort(
    ([, a], [, b]) => b - a,
  );
  const rawEntries = Object.entries(plan.rawResources).sort(
    ([, a], [, b]) => b - a,
  );
  const fuelEntries = Object.entries(plan.totalFuel).sort(
    ([, a], [, b]) => b - a,
  );

  if (machineEntries.length === 0 && rawEntries.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
      {machineEntries.length > 0 && (
        <div style={{
          flex: '1 1 250px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Machines Required</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Machine</th>
                <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {machineEntries.map(([name, count]) => (
                <tr key={name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '4px 0' }}>
                    <ItemIcon name={name} size={32} />
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 0', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.ceil(count)}
                    <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>
                      {' '}({count.toFixed(2)})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rawEntries.length > 0 && (
        <div style={{
          flex: '1 1 250px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Raw Resources</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Resource</th>
                <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {rawEntries.map(([name, rate]) => {
                const displayRate = rate * TIME_MULTIPLIERS[timeUnit];
                return (
                  <tr key={name} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '4px 0' }}>
                      <ItemIcon name={name} size={32} />
                    </td>
                    <td style={{ textAlign: 'right', padding: '4px 0', fontVariantNumeric: 'tabular-nums' }}>
                      {displayRate.toFixed(2)}{TIME_LABELS[timeUnit]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(plan.totalElectricPowerKW > 0 || fuelEntries.length > 0) && (
        <div style={{
          flex: '1 1 250px',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Power &amp; Fuel</h3>
          {plan.totalElectricPowerKW > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: fuelEntries.length > 0 ? 12 : 0, fontSize: 14 }}>
              <span>{'\u26A1'}</span>
              <span>Electric Power</span>
              <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                {formatPower(plan.totalElectricPowerKW)}
              </span>
            </div>
          )}
          {fuelEntries.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <tbody>
                {fuelEntries.map(([name, rate]) => {
                  const displayRate = rate * TIME_MULTIPLIERS[timeUnit];
                  return (
                    <tr key={name} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '4px 0' }}>
                        <ItemIcon name={name} size={24} />
                      </td>
                      <td style={{ textAlign: 'right', padding: '4px 0', fontVariantNumeric: 'tabular-nums' }}>
                        {displayRate.toFixed(2)}{TIME_LABELS[timeUnit]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {integerMultiplier !== null && integerMultiplier > 1 && (
        <div style={{
          flex: '1 1 100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: 14,
        }}>
          <span>
            Minimum integer ratio: <strong>&times;{integerMultiplier}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onApplyMultiplier?.(integerMultiplier)}
          >
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
