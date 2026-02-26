import type { Blueprint } from '../../../../blueprint/types.js';
import type { WireSegment } from './useBlueprintLayout.js';
import { TILE_SIZE, TILE_COLORS, DEFAULT_TILE_COLOR, WIRE_COLORS } from './constants.js';
import { getIconUrl } from '../../ItemIcon.js';
import { computeBounds } from '../../../../blueprint/transforms.js';

export interface ExportOptions {
  scale?: number;
  showGrid?: boolean;
  showTiles?: boolean;
  showEntities?: boolean;
  showWires?: boolean;
  backgroundColor?: string;
  padding?: number;
}

export async function exportPreviewPng(
  blueprint: Blueprint,
  wireSegments: WireSegment[],
  options: ExportOptions = {},
): Promise<void> {
  const {
    scale = TILE_SIZE * 2,
    showGrid = false,
    showTiles = true,
    showEntities = true,
    showWires = true,
    backgroundColor = '#1a1a1a',
    padding = 1,
  } = options;

  const bounds = computeBounds(blueprint);
  if (!bounds) return;

  const minX = bounds.minX - padding;
  const minY = bounds.minY - padding;
  const tilesW = bounds.maxX - bounds.minX + 1 + padding * 2;
  const tilesH = bounds.maxY - bounds.minY + 1 + padding * 2;
  const width = tilesW * scale;
  const height = tilesH * scale;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Grid
  if (showGrid) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }
  }

  // Tiles
  if (showTiles && blueprint.tiles) {
    ctx.globalAlpha = 0.6;
    for (const tile of blueprint.tiles) {
      ctx.fillStyle = TILE_COLORS[tile.name] ?? DEFAULT_TILE_COLOR;
      ctx.fillRect(
        (tile.position.x - minX) * scale,
        (tile.position.y - minY) * scale,
        scale,
        scale,
      );
    }
    ctx.globalAlpha = 1;
  }

  // Wires
  if (showWires && wireSegments.length > 0) {
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 2;
    for (const seg of wireSegments) {
      ctx.strokeStyle = WIRE_COLORS[seg.color] ?? '#fff';
      ctx.beginPath();
      ctx.moveTo(
        (seg.from.x - minX) * scale,
        (seg.from.y - minY) * scale,
      );
      ctx.lineTo(
        (seg.to.x - minX) * scale,
        (seg.to.y - minY) * scale,
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Entities
  if (showEntities && blueprint.entities) {
    const imageCache = new Map<string, HTMLImageElement>();
    const uniqueNames = [...new Set(blueprint.entities.map(e => e.name))];

    await Promise.allSettled(
      uniqueNames.map(name =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { imageCache.set(name, img); resolve(); };
          img.onerror = () => resolve();
          img.src = getIconUrl(name);
        })
      )
    );

    for (const entity of blueprint.entities) {
      const img = imageCache.get(entity.name);
      const cx = (entity.position.x - minX) * scale;
      const cy = (entity.position.y - minY) * scale;
      const deg = (entity.direction ?? 0) * 22.5;

      if (img) {
        ctx.save();
        ctx.translate(cx, cy);
        if (deg) ctx.rotate(deg * Math.PI / 180);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, -scale / 2, -scale / 2, scale, scale);
        ctx.restore();
      } else {
        ctx.fillStyle = '#666';
        ctx.fillRect(cx - scale / 2, cy - scale / 2, scale, scale);
        ctx.fillStyle = '#ccc';
        ctx.font = `${Math.max(8, scale / 4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(entity.name.replace(/-/g, ' '), cx, cy);
      }
    }
  }

  // Trigger download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.label || 'blueprint'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
