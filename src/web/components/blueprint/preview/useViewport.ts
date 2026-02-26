import { useState, useCallback, useRef, useEffect } from 'react';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_FACTOR = 1.1;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

export function useViewport(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<ViewportState>({ panX: 0, panY: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Native wheel handler with { passive: false } to prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      setState(prev => {
        const newZoom = clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM);
        const ratio = newZoom / prev.zoom;
        return {
          zoom: newZoom,
          panX: cx - (cx - prev.panX) * ratio,
          panY: cy - (cy - prev.panY) * ratio,
        };
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [containerRef]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Pan with middle mouse or left + alt
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setState(prev => {
        panStartRef.current = { x: e.clientX, y: e.clientY, panX: prev.panX, panY: prev.panY };
        return prev;
      });
      setIsPanning(true);
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const start = panStartRef.current;
    if (!start) return;
    setState(prev => ({
      ...prev,
      panX: start.panX + (e.clientX - start.x),
      panY: start.panY + (e.clientY - start.y),
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  const fitToBounds = useCallback((
    bounds: { minX: number; minY: number; maxX: number; maxY: number },
    viewportWidth: number,
    viewportHeight: number,
    tileSize: number,
    padding = 32,
  ) => {
    const worldW = (bounds.maxX - bounds.minX + 1) * tileSize;
    const worldH = (bounds.maxY - bounds.minY + 1) * tileSize;
    const availW = viewportWidth - padding * 2;
    const availH = viewportHeight - padding * 2;
    const zoom = clamp(Math.min(availW / worldW, availH / worldH), MIN_ZOOM, MAX_ZOOM);
    const panX = (viewportWidth - worldW * zoom) / 2 - bounds.minX * tileSize * zoom;
    const panY = (viewportHeight - worldH * zoom) / 2 - bounds.minY * tileSize * zoom;
    setState({ panX, panY, zoom });
  }, []);

  return {
    ...state,
    isPanning,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    fitToBounds,
  };
}
