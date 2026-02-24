import type { Technology } from '../../../data/schema.js';
import { ItemIcon } from '../ItemIcon.js';
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../../ui/index.js';
import CalculatorIcon from 'lucide-react/dist/esm/icons/calculator';
import LocateIcon from 'lucide-react/dist/esm/icons/locate';
import { formatName } from './format.js';

interface Props {
  technology: Technology | null;
  open: boolean;
  onClose: () => void;
  onCalculateRecipe?: (recipeName: string) => void;
  onZoomToTech?: (techName: string) => void;
  onSelectTech?: (techName: string) => void;
}

export function TechDetailPanel({ technology, open, onClose, onCalculateRecipe, onZoomToTech, onSelectTech }: Props) {
  if (!technology) return null;

  const label = formatName(technology.name);
  const recipeEffects = technology.effects.filter(e => e.type === 'unlock-recipe');
  const otherEffects = technology.effects.filter(e => e.type !== 'unlock-recipe');

  return (
    <Sheet open={open} modal={false} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent
        side="right"
        showOverlay={false}
        onInteractOutside={e => e.preventDefault()}
        className="overflow-y-auto w-[340px] sm:max-w-[340px]"
      >
        <SheetHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ItemIcon name={technology.name} size={32} />
            <SheetTitle>{label}</SheetTitle>
          </div>
          <SheetDescription>
            {technology.max_level === 'infinite'
              ? 'Infinite research'
              : `Technology: ${label}`}
          </SheetDescription>
          {onZoomToTech && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onZoomToTech(technology.name)}
            >
              <LocateIcon />
              Focus in tree
            </Button>
          )}
        </SheetHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px 16px' }}>
          {/* Research cost */}
          {technology.unit && (
            <Section title="Research Cost">
              {technology.unit.count != null && (
                <Row label="Packs" value={String(technology.unit.count)} />
              )}
              {technology.unit.count_formula && (
                <Row label="Formula" value={technology.unit.count_formula} />
              )}
              <Row label="Time per unit" value={`${technology.unit.time}s`} />
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
                  Ingredients
                </div>
                {technology.unit.ingredients.map(ing => (
                  <div key={ing.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <ItemIcon name={ing.name} size={16} />
                    <span style={{ fontSize: 13 }}>
                      {ing.amount}x {formatName(ing.name)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total science packs */}
              {technology.unit.count != null && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>
                    Total packs needed
                  </div>
                  {technology.unit.ingredients.map(ing => (
                    <div key={ing.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <ItemIcon name={ing.name} size={16} />
                      <span style={{ fontSize: 13 }}>
                        {technology.unit!.count! * ing.amount}x {formatName(ing.name)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Research trigger */}
          {technology.research_trigger && (
            <Section title="Research Trigger">
              <Row label="Type" value={formatName(technology.research_trigger.type)} />
              {technology.research_trigger.item && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <ItemIcon name={technology.research_trigger.item} size={16} />
                  <span style={{ fontSize: 13 }}>
                    {technology.research_trigger.count ?? ''}x {formatName(technology.research_trigger.item)}
                  </span>
                </div>
              )}
            </Section>
          )}

          {/* Prerequisites */}
          {technology.prerequisites.length > 0 && (
            <Section title="Prerequisites">
              {technology.prerequisites.map(p => (
                <div
                  key={p}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTech?.(p)}
                  onKeyDown={e => { if (e.key === 'Enter') onSelectTech?.(p); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 2,
                    cursor: onSelectTech ? 'pointer' : 'default',
                    borderRadius: 'var(--radius)',
                    padding: '2px 4px',
                    margin: '0 -4px 2px',
                  }}
                  className="hover:bg-accent/50"
                >
                  <ItemIcon name={p} size={16} />
                  <span style={{ fontSize: 13 }}>{formatName(p)}</span>
                </div>
              ))}
            </Section>
          )}

          {/* Unlocks */}
          {recipeEffects.length > 0 && (
            <Section title="Unlocks">
              {recipeEffects.map(e => (
                <div key={e.recipe} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <ItemIcon name={e.recipe!} size={16} />
                  <span style={{ fontSize: 13 }}>{formatName(e.recipe!)}</span>
                  {onCalculateRecipe && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="ml-auto"
                      onClick={() => onCalculateRecipe(e.recipe!)}
                    >
                      <CalculatorIcon />
                      Calc
                    </Button>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Other effects */}
          {otherEffects.length > 0 && (
            <Section title="Modifiers">
              {otherEffects.map((e, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 2 }}>
                  <span style={{ color: 'var(--muted-foreground)' }}>{formatName(e.type)}</span>
                  {e.modifier != null && (
                    <span style={{ color: 'var(--factorio-green)', marginLeft: 6 }}>
                      +{Math.round(e.modifier * 100)}%
                    </span>
                  )}
                  {e.quality && (
                    <span style={{ marginLeft: 6 }}>{formatName(e.quality as string)}</span>
                  )}
                </div>
              ))}
            </Section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--primary)',
        marginBottom: 6,
      }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
