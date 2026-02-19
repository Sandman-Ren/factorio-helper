import { useCalculator } from './hooks/useCalculator.js';
import { ItemSelector } from './components/ItemSelector.js';
import { RateInput } from './components/RateInput.js';
import { ProductionChain } from './components/ProductionChain.js';
import { Summary } from './components/Summary.js';

export function App() {
  const {
    graph,
    targetItem,
    setTargetItem,
    amount,
    setAmount,
    timeUnit,
    setTimeUnit,
    plan,
  } = useCalculator();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 4 }}>Factorio Production Calculator</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 24 }}>
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
      </div>

      {plan && (
        <>
          <Summary plan={plan} timeUnit={timeUnit} />
          <ProductionChain node={plan.root} timeUnit={timeUnit} />
        </>
      )}
    </div>
  );
}
