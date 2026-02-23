import { useState, useMemo, useCallback, useRef } from 'react';
import powerEntitiesData from '../../data/generated/power-entities.json';
import fuelsData from '../../data/generated/fuels.json';
import { formatPower } from '../../calculator/energy.js';
import type { PowerEntity, Fuel } from '../../data/schema.js';

const entities = powerEntitiesData as PowerEntity[];
const fuels = fuelsData as Fuel[];

const entityMap = new Map(entities.map(e => [e.name, e]));
const fuelMap = new Map(fuels.map(f => [f.name, f]));

export interface PowerEntry {
  id: string;
  entityName: string;
  count: number;
  fuel?: string;
}

export interface ComputedEntry extends PowerEntry {
  entity: PowerEntity;
  sustainedKW: number;
  peakKW?: number;
  fuelPerSecond?: number;
  fuelName?: string;
  displayPower: string;
  displayPeak?: string;
  displayFuel?: string;
}

export interface CategorySummary {
  category: string;
  totalKW: number;
  displayPower: string;
  entries: { name: string; count: number }[];
}

export interface FuelSummaryEntry {
  fuelName: string;
  totalPerSecond: number;
}

export function usePowerCalculator() {
  const [entries, setEntries] = useState<PowerEntry[]>([]);
  const [defaultFuel, setDefaultFuel] = useState('coal');
  const nextIdRef = useRef(0);

  const addEntity = useCallback((entityName: string) => {
    setEntries(prev => [
      ...prev,
      { id: String(++nextIdRef.current), entityName, count: 1 },
    ]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateCount = useCallback((id: string, count: number) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, count: Math.max(0, count) } : e)),
    );
  }, []);

  const updateFuel = useCallback((id: string, fuel: string) => {
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, fuel } : e)),
    );
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
  }, []);

  const computedEntries: ComputedEntry[] = useMemo(() => {
    return entries.map(entry => {
      const entity = entityMap.get(entry.entityName);
      if (!entity) {
        return {
          ...entry,
          entity: { name: entry.entityName, type: 'unknown', category: 'Unknown', energy_type: 'electric' as const },
          sustainedKW: 0,
          displayPower: '0 W',
        };
      }

      let sustainedKW = 0;
      let peakKW: number | undefined;
      let fuelPerSecond: number | undefined;
      let fuelName: string | undefined;

      if (entity.energy_type === 'burner') {
        sustainedKW = entry.count * (entity.energy_usage_kw || 0);
        const selectedFuel = entry.fuel || defaultFuel;
        const fuel = fuelMap.get(selectedFuel);
        if (fuel && fuel.fuel_value_kj > 0) {
          fuelPerSecond = sustainedKW / fuel.fuel_value_kj;
          fuelName = fuel.name;
        }
      } else if (entity.type === 'inserter') {
        sustainedKW = entry.count * (entity.drain_kw || 0);
      } else if (entity.type === 'electric-turret') {
        sustainedKW = entry.count * (entity.drain_kw || 0);
        peakKW = entry.count * (entity.input_flow_limit_kw || 0);
      } else if (entity.type === 'roboport') {
        sustainedKW = entry.count * (entity.energy_usage_kw || 0);
        peakKW = entry.count * ((entity.energy_usage_kw || 0) + 4 * (entity.charging_energy_kw || 0));
      } else if (entity.type === 'rocket-silo') {
        sustainedKW = entry.count * (entity.energy_usage_kw || 0);
        peakKW = entry.count * (entity.active_energy_usage_kw || 0);
      } else if (entity.category === 'Circuit') {
        sustainedKW = entry.count * (entity.active_energy_usage_kw || entity.energy_usage_kw || 0);
      } else {
        sustainedKW = entry.count * (entity.energy_usage_kw || 0);
      }

      const computed: ComputedEntry = {
        ...entry,
        entity,
        sustainedKW,
        displayPower: formatPower(sustainedKW),
      };

      if (peakKW !== undefined && peakKW !== sustainedKW) {
        computed.peakKW = peakKW;
        computed.displayPeak = formatPower(peakKW);
      }

      if (fuelPerSecond !== undefined && fuelName) {
        computed.fuelPerSecond = fuelPerSecond;
        computed.fuelName = fuelName;
        computed.displayFuel = `${fuelPerSecond.toFixed(2)} ${fuelName.replace(/-/g, ' ')}/s`;
      }

      return computed;
    });
  }, [entries, defaultFuel]);

  const totalElectricKW = useMemo(() => {
    return computedEntries
      .filter(e => e.entity.energy_type !== 'burner')
      .reduce((sum, e) => sum + e.sustainedKW, 0);
  }, [computedEntries]);

  const totalPeakKW = useMemo(() => {
    return computedEntries
      .filter(e => e.entity.energy_type !== 'burner')
      .reduce((sum, e) => sum + (e.peakKW ?? e.sustainedKW), 0);
  }, [computedEntries]);

  const hasPeakDifference = totalPeakKW !== totalElectricKW;

  const electricSummary: CategorySummary[] = useMemo(() => {
    const byCategory = new Map<string, { totalKW: number; entries: Map<string, number> }>();

    for (const e of computedEntries) {
      if (e.entity.energy_type === 'burner') continue;
      const cat = e.entity.category;
      let group = byCategory.get(cat);
      if (!group) {
        group = { totalKW: 0, entries: new Map() };
        byCategory.set(cat, group);
      }
      group.totalKW += e.sustainedKW;
      group.entries.set(e.entityName, (group.entries.get(e.entityName) || 0) + e.count);
    }

    return Array.from(byCategory.entries()).map(([category, group]) => ({
      category,
      totalKW: group.totalKW,
      displayPower: formatPower(group.totalKW),
      entries: Array.from(group.entries.entries()).map(([name, count]) => ({ name, count })),
    }));
  }, [computedEntries]);

  const fuelSummary: FuelSummaryEntry[] = useMemo(() => {
    const byFuel = new Map<string, number>();

    for (const e of computedEntries) {
      if (e.fuelPerSecond && e.fuelName) {
        byFuel.set(e.fuelName, (byFuel.get(e.fuelName) || 0) + e.fuelPerSecond);
      }
    }

    return Array.from(byFuel.entries()).map(([fuelName, totalPerSecond]) => ({
      fuelName,
      totalPerSecond,
    }));
  }, [computedEntries]);

  const totalElectricDisplay = formatPower(totalElectricKW);
  const totalPeakDisplay = formatPower(totalPeakKW);

  return {
    entries,
    computedEntries,
    addEntity,
    removeEntry,
    updateCount,
    updateFuel,
    defaultFuel,
    setDefaultFuel,
    clearAll,
    totalElectricKW,
    totalPeakKW,
    hasPeakDifference,
    electricSummary,
    fuelSummary,
    totalElectricDisplay,
    totalPeakDisplay,
  };
}

export const allEntities: PowerEntity[] = entities;
export const allFuels: Fuel[] = fuels;
