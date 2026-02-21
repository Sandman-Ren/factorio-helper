/**
 * Parse a Factorio energy/power string to numeric kJ (for energy) or kW (for power).
 * Handles both power units (W, kW, MW, GW) and energy units (J, kJ, MJ, GJ, TJ).
 * Returns the value in kilo-units (kW or kJ).
 */
export function parseEnergyKilo(s: string): number {
  const match = s.match(/^([\d.]+)\s*(W|kW|MW|GW|J|kJ|MJ|GJ|TJ)$/);
  if (!match) return 0;
  const val = parseFloat(match[1]!);
  switch (match[2]) {
    case 'W':  return val / 1_000;
    case 'kW': return val;
    case 'MW': return val * 1_000;
    case 'GW': return val * 1_000_000;
    case 'J':  return val / 1_000;
    case 'kJ': return val;
    case 'MJ': return val * 1_000;
    case 'GJ': return val * 1_000_000;
    case 'TJ': return val * 1_000_000_000;
    default:   return 0;
  }
}

/** Format a power value in kW to a human-readable string. */
export function formatPower(kw: number): string {
  if (kw >= 1_000) return `${(kw / 1_000).toFixed(1)} MW`;
  if (kw >= 1) return `${Math.round(kw)} kW`;
  return `${Math.round(kw * 1_000)} W`;
}
