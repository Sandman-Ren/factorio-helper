import type { TimeUnit } from '../hooks/useCalculator.js';

interface Props {
  amount: number;
  onAmountChange: (n: number) => void;
  timeUnit: TimeUnit;
  onTimeUnitChange: (u: TimeUnit) => void;
}

export function RateInput({ amount, onAmountChange, timeUnit, onTimeUnitChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Amount
        </label>
        <input
          type="number"
          min={0.01}
          step="any"
          value={amount}
          onChange={e => onAmountChange(parseFloat(e.target.value) || 0)}
          style={{
            width: 100,
            padding: '8px 12px',
            fontSize: 16,
            border: '1px solid var(--border)',
            borderRadius: 6,
            background: 'var(--card)',
            color: 'var(--foreground)',
          }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Per
        </label>
        <select
          value={timeUnit}
          onChange={e => onTimeUnitChange(e.target.value as TimeUnit)}
          style={{
            padding: '8px 12px',
            fontSize: 16,
            border: '1px solid var(--border)',
            borderRadius: 6,
            background: 'var(--card)',
            color: 'var(--foreground)',
          }}
        >
          <option value="sec">second</option>
          <option value="min">minute</option>
          <option value="hour">hour</option>
        </select>
      </div>
    </div>
  );
}
