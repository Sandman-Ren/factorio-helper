import { useState, useCallback, useEffect } from 'react';

const VALID_TABS = new Set(['item-lookup', 'calculator', 'tech-tree', 'power', 'blueprint']);
const DEFAULT_TAB = 'item-lookup';

interface HashState {
  tab: string;
  subpath: string;
}

function parseHash(hash: string): HashState {
  if (!hash || hash === '#') return { tab: DEFAULT_TAB, subpath: '' };
  if (hash.startsWith('#blueprint')) return { tab: 'blueprint', subpath: '' };

  const raw = hash.slice(1);
  const slashIdx = raw.indexOf('/');
  if (slashIdx === -1) {
    return { tab: VALID_TABS.has(raw) ? raw : DEFAULT_TAB, subpath: '' };
  }

  const tab = raw.slice(0, slashIdx);
  const subpath = decodeURIComponent(raw.slice(slashIdx + 1));
  return { tab: VALID_TABS.has(tab) ? tab : DEFAULT_TAB, subpath };
}

function buildHash(tab: string, subpath?: string): string {
  return subpath ? `#${tab}/${encodeURIComponent(subpath)}` : `#${tab}`;
}

/**
 * Syncs the active tab (and optional sub-path) with the URL hash and browser
 * history.  Every navigation pushes a history entry so the browser back/forward
 * buttons work.
 *
 * - `setTab(tab)` — switch tabs (clears subpath).  Used by the Tabs component.
 * - `navigate(tab, subpath?)` — switch tab and/or set a subpath.  Used for
 *    in-tab navigation like clicking items in Item Lookup.
 */
export function useHashTab() {
  const [state, setState] = useState<HashState>(() => parseHash(window.location.hash));

  const navigate = useCallback((tab: string, subpath?: string) => {
    const next: HashState = { tab, subpath: subpath ?? '' };
    setState(next);
    const newHash = buildHash(tab, subpath);
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash);
    }
  }, []);

  const setTab = useCallback((tab: string) => navigate(tab), [navigate]);

  useEffect(() => {
    const handlePopState = () => {
      setState(parseHash(window.location.hash));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Set the initial hash if the page was loaded without one
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', `#${DEFAULT_TAB}`);
    }
  }, []);

  return { tab: state.tab, subpath: state.subpath, setTab, navigate };
}
