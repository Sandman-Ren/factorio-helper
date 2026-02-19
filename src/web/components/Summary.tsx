import type { ProductionPlan } from '../../calculator/types.js';
import type { TimeUnit } from '../hooks/useCalculator.js';
import { ItemIcon } from './ItemIcon.js';

interface Props {
  plan: ProductionPlan;
  timeUnit: TimeUnit;
}

const TIME_LABELS: Record<TimeUnit, string> = { sec: '/s', min: '/min', hour: '/hr' };
const TIME_MULTIPLIERS: Record<TimeUnit, number> = { sec: 1, min: 60, hour: 3600 };

export function Summary({ plan, timeUnit }: Props) {
  const machineEntries = Object.entries(plan.totalMachines).sort(
    ([, a], [, b]) => b - a,
  );
  const rawEntries = Object.entries(plan.rawResources).sort(
    ([, a], [, b]) => b - a,
  );

  if (machineEntries.length === 0 && rawEntries.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
      {machineEntries.length > 0 && (
        <div style={{
          flex: '1 1 250px',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Machines Required</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Machine</th>
                <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {machineEntries.map(([name, count]) => (
                <tr key={name} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '4px 0' }}>
                    <ItemIcon name={name} size={32} />
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 0', fontVariantNumeric: 'tabular-nums' }}>
                    {Math.ceil(count)}
                    <span style={{ color: '#999', fontSize: 12 }}>
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
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 16,
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Raw Resources</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '4px 0', fontWeight: 500 }}>Resource</th>
                <th style={{ textAlign: 'right', padding: '4px 0', fontWeight: 500 }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {rawEntries.map(([name, rate]) => {
                const displayRate = rate * TIME_MULTIPLIERS[timeUnit];
                return (
                  <tr key={name} style={{ borderBottom: '1px solid #f5f5f5' }}>
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
    </div>
  );
}
