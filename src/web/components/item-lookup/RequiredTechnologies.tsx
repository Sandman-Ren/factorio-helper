import type { Technology } from '../../../data/schema.js';
import { ItemIcon } from '../ItemIcon.js';
import { Button } from '../../ui/index.js';
import ExternalLinkIcon from 'lucide-react/dist/esm/icons/external-link';

interface Props {
  technologies: Technology[];
  onViewTech: (techName: string) => void;
}

export function RequiredTechnologies({ technologies, onViewTech }: Props) {
  if (technologies.length === 0) {
    return (
      <Section title="Required Technologies">
        <p className="text-sm text-muted-foreground">Available from the start (no research needed).</p>
      </Section>
    );
  }

  return (
    <Section title="Required Technologies">
      <div className="flex flex-col gap-2">
        {technologies.map(tech => (
          <div
            key={tech.name}
            className="flex items-center gap-3 rounded-md border border-border bg-card/50 px-3 py-2"
          >
            <ItemIcon name={tech.name} size={32} category="technology" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{tech.name.replace(/-/g, ' ')}</div>
              {tech.unit && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  {tech.unit.ingredients.map(ing => (
                    <span key={ing.name} className="flex items-center gap-0.5">
                      <ItemIcon name={ing.name} size={16} />
                      <span className="text-xs text-muted-foreground">{ing.amount}</span>
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    x{tech.unit.count ?? tech.unit.count_formula}
                  </span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs gap-1"
              onClick={() => onViewTech(tech.name)}
            >
              <ExternalLinkIcon className="size-3" />
              Tech Tree
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}
