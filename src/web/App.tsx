import { lazy, Suspense } from 'react';
import { findIntegerMultiplier } from '../calculator/index.js';
import { useCalculator } from './hooks/useCalculator.js';
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
} from './ui/index.js';

const TechTree = lazy(() =>
  import('./components/tech-tree/TechTree.js').then(m => ({ default: m.TechTree })),
);

export function App() {
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

  const smeltingMachines = graph.categoryToMachines.get('smelting') ?? [];

  return (
    <Tabs defaultValue="calculator" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
        <TabsList variant="line">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="tech-tree">Tech Tree</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="calculator" style={{ overflow: 'auto', flex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
          <h1 style={{ marginBottom: 4 }}>Factorio Production Calculator</h1>
          <p style={{ color: 'var(--muted-foreground)', marginTop: 0, marginBottom: 24 }}>
            Calculate full production chains for Factorio 2.0 base game
          </p>

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
          <TechTree />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
