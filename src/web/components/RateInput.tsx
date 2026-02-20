import type { TimeUnit } from '../hooks/useCalculator.js';
import { Label, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/index.js';

interface Props {
  amount: number;
  onAmountChange: (n: number) => void;
  timeUnit: TimeUnit;
  onTimeUnitChange: (u: TimeUnit) => void;
}

export function RateInput({ amount, onAmountChange, timeUnit, onTimeUnitChange }: Props) {
  return (
    <div className="flex items-end gap-2">
      <div>
        <Label className="mb-1">Amount</Label>
        <Input
          type="number"
          min={0.01}
          step="any"
          value={amount}
          onChange={e => onAmountChange(parseFloat(e.target.value) || 0)}
          className="w-24"
        />
      </div>
      <div>
        <Label className="mb-1">Per</Label>
        <Select value={timeUnit} onValueChange={v => onTimeUnitChange(v as TimeUnit)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sec">second</SelectItem>
            <SelectItem value="min">minute</SelectItem>
            <SelectItem value="hour">hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
