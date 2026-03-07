import { lazy, Suspense, useState, useCallback, useEffect, useMemo } from 'react';
import { useHashTab } from './hooks/useHashTab.js';
import RotateCcwIcon from 'lucide-react/dist/esm/icons/rotate-ccw';
import { findIntegerMultiplier } from '../calculator/index.js';
import { useCalculator } from './hooks/useCalculator.js';
import { useRecipeTechMaps } from './hooks/use-recipe-tech-map.js';
import { usePowerCalculator } from './hooks/usePowerCalculator.js';
import { useBlueprintEditor } from './hooks/useBlueprintEditor.js';
import { ItemSelector } from './components/ItemSelector.js';
import { RateInput } from './components/RateInput.js';
import { ProductionChain } from './components/ProductionChain.js';
import { Summary } from './components/Summary.js';
import { RatioStrip } from './components/RatioStrip.js';
import { ItemIcon } from './components/ItemIcon.js';
import {
  Button,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './ui/index.js';

const TechTree = lazy(() =>
  import('./components/tech-tree/TechTree.js').then(m => ({ default: m.TechTree })),
);

const PowerCalculator = lazy(() =>
  import('./components/power-calculator/PowerCalculator.js').then(m => ({ default: m.PowerCalculator })),
);

const BlueprintTab = lazy(() =>
  import('./components/blueprint/BlueprintTab.js').then(m => ({ default: m.BlueprintTab })),
);

const ItemLookup = lazy(() =>
  import('./components/item-lookup/ItemLookup.js').then(m => ({ default: m.ItemLookup })),
);

/** All categories that assembling machines can handle. */
const ASSEMBLER_CATEGORIES = ['crafting', 'basic-crafting', 'advanced-crafting', 'crafting-with-fluid'];

export function App() {
  const { tab: activeTab, subpath, setTab, navigate } = useHashTab();
  const [pendingTech, setPendingTech] = useState<string | null>(null);

  // Persist the lookup item across tab switches
  const [lookupItem, setLookupItem] = useState(() =>
    activeTab === 'item-lookup' ? subpath : '',
  );

  // Sync from hash on back/forward within item-lookup
  useEffect(() => {
    if (activeTab === 'item-lookup') setLookupItem(subpath);
  }, [activeTab, subpath]);

  // When clicking the Item Lookup tab, restore the previous item in the URL
  const setActiveTab = useCallback((tab: string) => {
    if (tab === 'item-lookup' && lookupItem) {
      navigate('item-lookup', lookupItem);
    } else {
      setTab(tab);
    }
  }, [lookupItem, navigate, setTab]);

  const handleSelectLookupItem = useCallback((item: string) => {
    setLookupItem(item);
    navigate('item-lookup', item || undefined);
  }, [navigate]);

  const {
    graph,
    targetItem,
    setTargetItem,
    amount,
    setAmount,
    timeUnit,
    setTimeUnit,
    machineOverrides,
    setMachineOverrides,
    categoryOverrides,
    setCategoryOverrides,
    defaultFuel,
    setDefaultFuel,
    fuelOverrides,
    setFuelOverrides,
    fuels,
    plan,
  } = useCalculator();

  const { itemToTech } = useRecipeTechMaps();
  const powerCalc = usePowerCalculator();
  const blueprintEditor = useBlueprintEditor();

  const handleApplyToPower = useCallback(() => {
    if (!plan) return;
    powerCalc.loadFromPlan(plan.totalMachines);
    setActiveTab('power');
  }, [plan, powerCalc.loadFromPlan]);

  const handleCalculateRecipe = useCallback(
    (recipeName: string) => {
      const recipe = graph.allRecipes.find(r => r.name === recipeName);
      if (!recipe) return;
      const resultName = recipe.results[0]?.name;
      if (!resultName || !graph.allProducts.includes(resultName)) return;
      setTargetItem(resultName);
      setActiveTab('calculator');
    },
    [graph, setTargetItem],
  );

  const handleViewTech = useCallback(
    (techName: string) => {
      setPendingTech(techName);
      setActiveTab('tech-tree');
    },
    [],
  );

  const handleCalculateItem = useCallback(
    (itemName: string) => {
      if (!graph.allProducts.includes(itemName)) return;
      setTargetItem(itemName);
      setActiveTab('calculator');
    },
    [graph, setTargetItem],
  );

  const smeltingMachines = graph.categoryToMachines.get('smelting') ?? [];
  const assemblingMachines = graph.categoryToMachines.get('crafting') ?? [];
  const miningDrills = graph.categoryToMachines.get('basic-solid') ?? [];

  // Count per-item overrides by category type for global reset buttons
  const overrideCounts = useMemo(() => {
    const counts = { smelting: 0, assembler: 0, miner: 0, fuel: Object.keys(fuelOverrides).length };
    for (const item of Object.keys(machineOverrides)) {
      const recipe = graph.itemToRecipe.get(item);
      if (!recipe) continue;
      if (recipe.category === 'smelting') counts.smelting++;
      else if (recipe.category === 'basic-solid') counts.miner++;
      else if (ASSEMBLER_CATEGORIES.includes(recipe.category)) counts.assembler++;
    }
    return counts;
  }, [machineOverrides, fuelOverrides, graph]);

  const handleMachineReset = useCallback((item: string) => {
    setMachineOverrides(prev => {
      const next = { ...prev };
      delete next[item];
      return next;
    });
  }, [setMachineOverrides]);

  const handleFuelReset = useCallback((item: string) => {
    setFuelOverrides(prev => {
      const next = { ...prev };
      delete next[item];
      return next;
    });
  }, [setFuelOverrides]);

  const resetMachineOverridesByCategory = useCallback((categoryTest: (cat: string) => boolean) => {
    setMachineOverrides(prev => {
      const next = { ...prev };
      for (const item of Object.keys(next)) {
        const recipe = graph.itemToRecipe.get(item);
        if (recipe && categoryTest(recipe.category)) delete next[item];
      }
      return next;
    });
  }, [setMachineOverrides, graph]);

  return (
    <TooltipProvider>
      <Tabs value={activeTab} onValueChange={setActiveTab} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ marginBottom: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Factorio Helper</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: 0 }}>
              Production calculator, item lookup, tech tree, power &amp; blueprint tools for Factorio 2.0
            </p>
          </div>
          <TabsList variant="line">
            <TabsTrigger value="item-lookup">Item Lookup</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="tech-tree">Tech Tree</TabsTrigger>
            <TabsTrigger value="power">Power</TabsTrigger>
            <TabsTrigger value="blueprint">Blueprint</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="item-lookup" style={{ overflow: 'auto', flex: 1 }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>
                Loading item lookup...
              </div>
            }
          >
            <ItemLookup
              selectedItem={lookupItem}
              onSelectItem={handleSelectLookupItem}
              onCalculateItem={handleCalculateItem}
              onViewTech={handleViewTech}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="calculator" style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <ItemSelector
                items={graph.allProducts}
                value={targetItem}
                onChange={setTargetItem}
              />
              <RateInput
                amount={amount}
                onAmountChange={setAmount}
                timeUnit={timeUnit}
                onTimeUnitChange={setTimeUnit}
              />
            </div>

            <details className="group mb-6 rounded-md border border-border bg-card/50 p-3">
              <summary className="cursor-pointer text-sm text-muted-foreground select-none rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Machine &amp; Fuel Defaults
              </summary>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
                {smeltingMachines.length > 0 && (
                  <div>
                    <Label className="mb-1">Furnace</Label>
                    <Select
                      value={categoryOverrides['smelting'] ?? '__default__'}
                      onValueChange={v => {
                        setCategoryOverrides(prev => {
                          if (v === '__default__') {
                            const { smelting: _, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, smelting: v };
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">Default (best)</SelectItem>
                        {smeltingMachines.map(m => (
                          <SelectItem key={m.name} value={m.name}>
                            <ItemIcon name={m.name} size={16} />
                            {m.name.replace(/-/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {overrideCounts.smelting > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => resetMachineOverridesByCategory(c => c === 'smelting')}
                            className="flex items-center gap-1 mt-1 text-xs cursor-pointer"
                            style={{ color: 'var(--color-factorio-orange-bright)' }}
                          >
                            <RotateCcwIcon className="size-3" />
                            {overrideCounts.smelting} item override{overrideCounts.smelting > 1 ? 's' : ''}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Reset all per-item furnace overrides</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
                {assemblingMachines.length > 0 && (
                  <div>
                    <Label className="mb-1">Assembler</Label>
                    <Select
                      value={categoryOverrides['crafting'] ?? '__default__'}
                      onValueChange={v => {
                        setCategoryOverrides(prev => {
                          const next = { ...prev };
                          for (const cat of ASSEMBLER_CATEGORIES) delete next[cat];
                          if (v === '__default__') return next;
                          const machine = assemblingMachines.find(m => m.name === v);
                          if (machine) {
                            for (const cat of machine.crafting_categories) {
                              if (ASSEMBLER_CATEGORIES.includes(cat)) next[cat] = v;
                            }
                          }
                          return next;
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">Default (best)</SelectItem>
                        {assemblingMachines.map(m => (
                          <SelectItem key={m.name} value={m.name}>
                            <ItemIcon name={m.name} size={16} />
                            {m.name.replace(/-/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {overrideCounts.assembler > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => resetMachineOverridesByCategory(c => ASSEMBLER_CATEGORIES.includes(c))}
                            className="flex items-center gap-1 mt-1 text-xs cursor-pointer"
                            style={{ color: 'var(--color-factorio-orange-bright)' }}
                          >
                            <RotateCcwIcon className="size-3" />
                            {overrideCounts.assembler} item override{overrideCounts.assembler > 1 ? 's' : ''}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Reset all per-item assembler overrides</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
                {miningDrills.length > 0 && (
                  <div>
                    <Label className="mb-1">Mining Drill</Label>
                    <Select
                      value={categoryOverrides['basic-solid'] ?? '__default__'}
                      onValueChange={v => {
                        setCategoryOverrides(prev => {
                          if (v === '__default__') {
                            const { 'basic-solid': _, ...rest } = prev;
                            return rest;
                          }
                          return { ...prev, 'basic-solid': v };
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__default__">Default (best)</SelectItem>
                        {miningDrills.map(m => (
                          <SelectItem key={m.name} value={m.name}>
                            <ItemIcon name={m.name} size={16} />
                            {m.name.replace(/-/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {overrideCounts.miner > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => resetMachineOverridesByCategory(c => c === 'basic-solid')}
                            className="flex items-center gap-1 mt-1 text-xs cursor-pointer"
                            style={{ color: 'var(--color-factorio-orange-bright)' }}
                          >
                            <RotateCcwIcon className="size-3" />
                            {overrideCounts.miner} item override{overrideCounts.miner > 1 ? 's' : ''}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Reset all per-item mining drill overrides</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
                {fuels.length > 0 && (
                  <div>
                    <Label className="mb-1">Default Fuel</Label>
                    <Select
                      value={defaultFuel}
                      onValueChange={setDefaultFuel}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(
                          fuels.reduce<Record<string, typeof fuels>>((groups, f) => {
                            (groups[f.fuel_category] ??= []).push(f);
                            return groups;
                          }, {}),
                        ).map(([category, categoryFuels]) => (
                          <SelectGroup key={category}>
                            <SelectLabel>{category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectLabel>
                            {categoryFuels.map(f => (
                              <SelectItem key={f.name} value={f.name}>
                                <ItemIcon name={f.name} size={16} />
                                {f.name.replace(/-/g, ' ')}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    {overrideCounts.fuel > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setFuelOverrides({})}
                            className="flex items-center gap-1 mt-1 text-xs cursor-pointer"
                            style={{ color: 'var(--color-factorio-orange-bright)' }}
                          >
                            <RotateCcwIcon className="size-3" />
                            {overrideCounts.fuel} item override{overrideCounts.fuel > 1 ? 's' : ''}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Reset all per-item fuel overrides</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            </details>

            {plan && (
              <>
                <Summary
                  plan={plan}
                  timeUnit={timeUnit}
                  integerMultiplier={findIntegerMultiplier(plan)}
                  onApplyMultiplier={(k) => setAmount(prev => prev * k)}
                />
                <div className="flex items-center gap-3 mb-4">
                  <Button variant="outline" size="sm" onClick={handleApplyToPower}>
                    Open in Power Calculator
                  </Button>
                </div>
                <RatioStrip plan={plan} />
                <ProductionChain
                  node={plan.root}
                  timeUnit={timeUnit}
                  categoryMachines={graph.categoryToMachines}
                  machineOverrides={machineOverrides}
                  onMachineChange={(item, machine) =>
                    setMachineOverrides(prev => ({ ...prev, [item]: machine }))
                  }
                  onMachineReset={handleMachineReset}
                  itemToTech={itemToTech}
                  onTechClick={handleViewTech}
                  fuels={fuels}
                  fuelOverrides={fuelOverrides}
                  onFuelChange={(item, fuel) =>
                    setFuelOverrides(prev => ({ ...prev, [item]: fuel }))
                  }
                  onFuelReset={handleFuelReset}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tech-tree" style={{ flex: 1, minHeight: 0 }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>
                Loading tech tree...
              </div>
            }
          >
            <TechTree
              onCalculateRecipe={handleCalculateRecipe}
              pendingTechSelect={pendingTech}
              onPendingHandled={() => setPendingTech(null)}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="power" style={{ overflow: 'auto', flex: 1 }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>
                Loading power calculator...
              </div>
            }
          >
            <PowerCalculator {...powerCalc} />
          </Suspense>
        </TabsContent>

        <TabsContent value="blueprint" style={{ overflow: 'auto', flex: 1 }}>
          <Suspense
            fallback={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted-foreground)' }}>
                Loading blueprint editor...
              </div>
            }
          >
            <BlueprintTab {...blueprintEditor} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
