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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TooltipProvider,
} from './ui/index.js';

const TechTree = lazy(() =>
  import('./components/tech-tree/TechTree.js').then(m => ({ default: m.TechTree })),
);

export function App() {
  const [activeTab, setActiveTab] = useState('calculator');

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

  const smeltingMachines = graph.categoryToMachines.get('smelting') ?? [];

  return (
    <TooltipProvider>
      <Tabs value={activeTab} onValueChange={setActiveTab} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{ marginBottom: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Factorio Helper</h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: 0 }}>
              Production calculator &amp; tech tree for Factorio 2.0
            </p>
          </div>
          <TabsList variant="line">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="tech-tree">Tech Tree</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calculator" style={{ overflow: 'auto', flex: 1 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
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
            </div>

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
            <TechTree onCalculateRecipe={handleCalculateRecipe} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
