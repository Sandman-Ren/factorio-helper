import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../ui/index.js';
import CopyIcon from 'lucide-react/dist/esm/icons/copy';
import CheckIcon from 'lucide-react/dist/esm/icons/check';
import ChevronRightIcon from 'lucide-react/dist/esm/icons/chevron-right';

interface BlueprintJsonViewerProps {
  data: unknown;
  maxInitialDepth?: number;
}

function JsonValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (typeof value === 'string') return <span style={{ color: 'var(--color-json-string, #87d88b)' }}>"{value}"</span>;
  if (typeof value === 'number') return <span className="tabular-nums" style={{ color: 'var(--color-json-number, #80cef0)' }}>{value}</span>;
  if (typeof value === 'boolean') return <span className="text-primary">{String(value)}</span>;
  return <span className="text-muted-foreground">{String(value)}</span>;
}

const ARRAY_TRUNCATE = 100;

interface JsonNodeProps {
  keyName?: string;
  value: unknown;
  depth: number;
  maxDepth: number;
  isLast: boolean;
}

function JsonNode({ keyName, value, depth, maxDepth, isLast }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(depth < maxDepth);
  const [showAll, setShowAll] = useState(false);
  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);

  if (!isObject) {
    return (
      <div className="flex" style={{ paddingLeft: depth * 16 }}>
        {keyName !== undefined && (
          <span className="text-primary">"{keyName}"<span className="text-muted-foreground">: </span></span>
        )}
        <JsonValue value={value} />
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    );
  }

  const entries = isArray ? value : Object.entries(value as Record<string, unknown>);
  const count = entries.length;
  const bracket = isArray ? ['[', ']'] : ['{', '}'];
  const summary = isArray ? `[${count} items]` : `{${count} keys}`;

  if (count === 0) {
    return (
      <div className="flex" style={{ paddingLeft: depth * 16 }}>
        {keyName !== undefined && (
          <span className="text-primary">"{keyName}"<span className="text-muted-foreground">: </span></span>
        )}
        <span className="text-muted-foreground">{bracket[0]}{bracket[1]}</span>
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    );
  }

  const visibleEntries = isArray
    ? (showAll ? value : value.slice(0, ARRAY_TRUNCATE))
    : Object.entries(value as Record<string, unknown>);
  const hasMore = isArray && !showAll && value.length > ARRAY_TRUNCATE;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className="flex items-center cursor-pointer hover:bg-accent/30 rounded focus-visible:ring-2 focus-visible:ring-ring/50 outline-none"
        style={{ paddingLeft: depth * 16 }}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
      >
        <ChevronRightIcon
          className={`size-3 mr-1 flex-shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        {keyName !== undefined && (
          <span className="text-primary">"{keyName}"<span className="text-muted-foreground">: </span></span>
        )}
        {expanded ? (
          <span className="text-muted-foreground">{bracket[0]}</span>
        ) : (
          <>
            <span className="text-muted-foreground">{summary}</span>
            {!isLast && <span className="text-muted-foreground">,</span>}
          </>
        )}
      </div>
      {expanded && (
        <>
          {isArray
            ? (visibleEntries as unknown[]).map((item, i) => (
                <JsonNode
                  key={i}
                  value={item}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  isLast={i === (visibleEntries as unknown[]).length - 1 && !hasMore}
                />
              ))
            : (visibleEntries as [string, unknown][]).map(([k, v], i) => (
                <JsonNode
                  key={k}
                  keyName={k}
                  value={v}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  isLast={i === (visibleEntries as [string, unknown][]).length - 1}
                />
              ))
          }
          {hasMore && (
            <div style={{ paddingLeft: (depth + 1) * 16 }}>
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => { e.stopPropagation(); setShowAll(true); }}
              >
                {(value as unknown[]).length - ARRAY_TRUNCATE} more items…
              </button>
            </div>
          )}
          <div className="flex" style={{ paddingLeft: depth * 16 }}>
            <span className="text-muted-foreground">{bracket[1]}</span>
            {!isLast && <span className="text-muted-foreground">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

export function BlueprintJsonViewer({ data, maxInitialDepth = 2 }: BlueprintJsonViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select-all is available in the JSON display
    }
  }, [data]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">JSON</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <><CheckIcon className="size-3 mr-1" />Copied</>
            ) : (
              <><CopyIcon className="size-3 mr-1" />Copy JSON</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-xs leading-5 max-h-[400px] overflow-auto">
          <JsonNode value={data} depth={0} maxDepth={maxInitialDepth} isLast />
        </div>
      </CardContent>
    </Card>
  );
}
