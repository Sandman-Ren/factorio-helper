import { useState } from 'react';
import fluidsData from '../../data/generated/fluids.json';

const fluidNames = new Set(fluidsData.map(f => f.name));

export function getIconUrl(name: string): string {
  const category = fluidNames.has(name) ? 'fluid' : 'item';
  return `${import.meta.env.BASE_URL}icons/${category}/${name}.png`;
}

interface Props {
  name: string;
  size?: number;
}

export function ItemIcon({ name, size = 20 }: Props) {
  const [failed, setFailed] = useState(false);
  const label = name.replace(/-/g, ' ');

  if (failed) {
    return <span title={label} style={{ fontSize: size * 0.6 }}>{label}</span>;
  }

  return (
    <img
      src={getIconUrl(name)}
      alt={label}
      title={label}
      width={size}
      height={size}
      style={{ verticalAlign: 'middle', imageRendering: 'pixelated' }}
      onError={() => setFailed(true)}
    />
  );
}
