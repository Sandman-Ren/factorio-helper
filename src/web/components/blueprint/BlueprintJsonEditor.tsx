import { useState, useEffect, useCallback } from 'react';
import type { BlueprintType, BlueprintNode } from '../../hooks/useBlueprintEditor.js';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../ui/index.js';
import CheckIcon from 'lucide-react/dist/esm/icons/check';
import RotateCcwIcon from 'lucide-react/dist/esm/icons/rotate-ccw';

interface BlueprintJsonEditorProps {
  data: unknown;
  nodeType: BlueprintType;
  onApply: (updater: (node: BlueprintNode, type: BlueprintType) => BlueprintNode) => void;
  onClose: () => void;
}

export function BlueprintJsonEditor({ data, nodeType: _, onApply, onClose }: BlueprintJsonEditorProps) {
  const formatted = JSON.stringify(data, null, 2);
  const [editText, setEditText] = useState(formatted);
  const [parseError, setParseError] = useState<string | null>(null);
  const isDirty = editText !== formatted;

  // Sync when external data changes
  useEffect(() => {
    setEditText(formatted);
    setParseError(null);
  }, [formatted]);

  const validate = useCallback((text: string): { valid: boolean; error: string | null; parsed?: unknown } => {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { valid: false, error: 'Root value must be an object' };
      }
      return { valid: true, error: null, parsed };
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
    }
  }, []);

  const handleChange = useCallback((value: string) => {
    setEditText(value);
    const result = validate(value);
    setParseError(result.error);
  }, [validate]);

  const handleApply = useCallback(() => {
    const result = validate(editText);
    if (!result.valid || !result.parsed) return;
    onApply(() => result.parsed as BlueprintNode);
  }, [editText, validate, onApply]);

  const handleReset = useCallback(() => {
    setEditText(formatted);
    setParseError(null);
  }, [formatted]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">JSON Editor</CardTitle>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={!isDirty}>
              <RotateCcwIcon className="size-3.5 mr-1.5" />
              Reset
            </Button>
            <Button variant="default" size="sm" onClick={handleApply} disabled={!isDirty || !!parseError}>
              <CheckIcon className="size-3.5 mr-1.5" />
              Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <textarea
          className="bg-input/30 border-input text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 font-mono text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-y"
          style={{ minHeight: 300 }}
          value={editText}
          onChange={e => handleChange(e.target.value)}
          spellCheck={false}
          aria-label="Blueprint JSON editor"
          name="blueprint-json"
        />
        {parseError && (
          <p className="text-destructive text-xs mt-1.5">{parseError}</p>
        )}
        {!parseError && isDirty && (
          <p className="text-xs mt-1.5" style={{ color: 'var(--primary)' }}>Valid JSON — click Apply to save changes</p>
        )}
      </CardContent>
    </Card>
  );
}
