import type { Tile } from '../../../../blueprint/types.js';
import { TILE_SIZE, TILE_COLORS, DEFAULT_TILE_COLOR } from './constants.js';

interface BlueprintTileLayerProps {
  tiles: Tile[];
}

export function BlueprintTileLayer({ tiles }: BlueprintTileLayerProps) {
  return (
    <>
      {tiles.map((tile, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: tile.position.x * TILE_SIZE,
            top: tile.position.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            backgroundColor: TILE_COLORS[tile.name] ?? DEFAULT_TILE_COLOR,
            opacity: 0.6,
          }}
        />
      ))}
    </>
  );
}
