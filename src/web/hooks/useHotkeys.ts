import { useEffect } from 'react';

export type HotkeyMap = Record<string, (e: KeyboardEvent) => void>;

function buildKeyString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

/**
 * Register keyboard shortcuts at the document level.
 * Skips events when the target is an input, textarea, or contentEditable element.
 */
export function useHotkeys(hotkeys: HotkeyMap, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return;

      const key = buildKeyString(e);
      const action = hotkeys[key];
      if (action) {
        e.preventDefault();
        action(e);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [hotkeys, enabled]);
}
