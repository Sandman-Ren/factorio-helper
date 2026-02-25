import { useState } from 'react';
import fluidsData from '../../data/generated/fluids.json';

const fluidNames = new Set(fluidsData.map(f => f.name));

export type IconCategory = 'item' | 'fluid' | 'technology';

export function getIconUrl(name: string, category?: IconCategory): string {
  const resolved = category ?? (fluidNames.has(name) ? 'fluid' : 'item');
  return `${import.meta.env.BASE_URL}icons/${resolved}/${name}.png`;
}

interface Props {
  name: string;
  size?: number;
  category?: IconCategory;
}

export function ItemIcon({ name, size = 20, category }: Props) {
  const [failed, setFailed] = useState(false);
  const label = name.replace(/-/g, ' ');

  if (failed) {
    return <span title={label} style={{ fontSize: size * 0.6 }}>{label}</span>;
  }

  return (
    <img
      src={getIconUrl(name, category)}
      alt={label}
      title={label}
      width={size}
      height={size}
      style={{ verticalAlign: 'middle', imageRendering: 'pixelated' }}
      onError={() => setFailed(true)}
    />
  );
}
