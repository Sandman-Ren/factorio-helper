import { lazy, Suspense, useState, useCallback } from 'react';
import { findIntegerMultiplier } from '../calculator/index.js';
import { useCalculator } from './hooks/useCalculator.js';
import { useRecipeTechMaps } from './hooks/use-recipe-tech-map.js';
import { ItemSelector } from './components/ItemSelector.js';
import { RateInput } from './components/RateInput.js';
import { ProductionChain } from './components/ProductionChain.js';
import { Summary } from './components/Summary.js';
import { ItemIcon } from './components/ItemIcon.js';
import {
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
  TooltipProvider,
} from './ui/index.js';

const TechTree = lazy(() =>
  import('./components/tech-tree/TechTree.js').then(m => ({ default: m.TechTree })),
);

const PowerCalculator = lazy(() =>
  import('./components/power-calculator/PowerCalculator.js').then(m => ({ default: m.PowerCalculator })),
);

/** All categories that assembling machines can handle. */
const ASSEMBLER_CATEGORIES = ['crafting', 'basic-crafting', 'advanced-crafting', 'crafting-with-fluid'];

export function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [pendingTech, setPendingTech] = useState<string | null>(null);

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

  const smeltingMachines = graph.categoryToMachines.get('smelting') ?? [];
  const assemblingMachines = graph.categoryToMachines.get('crafting') ?? [];
  const miningDrills = graph.categoryToMachines.get('basic-solid') ?? [];

  return (
    <TooltipProvider>
      <Tabs value={activeTab} onValueChange={setActiveTab} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ marginBottom: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Factorio Helper</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: 0 }}>
              Production calculator, tech tree &amp; power calculator for Factorio 2.0
            </p>
          </div>
          <TabsList variant="line">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="tech-tree">Tech Tree</TabsTrigger>
            <TabsTrigger value="power">Power</TabsTrigger>
          </TabsList>
        </div>

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
              <summary className="cursor-pointer text-sm text-muted-foreground select-none">
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
                <ProductionChain
                  node={plan.root}
                  timeUnit={timeUnit}
                  categoryMachines={graph.categoryToMachines}
                  machineOverrides={machineOverrides}
                  onMachineChange={(item, machine) =>
                    setMachineOverrides(prev => ({ ...prev, [item]: machine }))
                  }
                  itemToTech={itemToTech}
                  onTechClick={handleViewTech}
                  fuels={fuels}
                  fuelOverrides={fuelOverrides}
                  onFuelChange={(item, fuel) =>
                    setFuelOverrides(prev => ({ ...prev, [item]: fuel }))
                  }
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
            <PowerCalculator />
          </Suspense>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
