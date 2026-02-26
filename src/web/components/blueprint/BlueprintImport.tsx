import { useCallback, useRef, useEffect } from 'react';
import type { DecodedResult, BlueprintType } from '../../hooks/useBlueprintEditor.js';
import { Button, Badge } from '../../ui/index.js';
import ClipboardPasteIcon from 'lucide-react/dist/esm/icons/clipboard-paste';
import XIcon from 'lucide-react/dist/esm/icons/x';

const TYPE_LABELS: Record<BlueprintType, string> = {
  blueprint: 'Blueprint',
  blueprint_book: 'Blueprint Book',
  upgrade_planner: 'Upgrade Planner',
  deconstruction_planner: 'Deconstruction Planner',
};

interface BlueprintImportProps {
  inputString: string;
  onInputChange: (value: string) => void;
  onDecode: (value?: string) => void;
  onClear: () => void;
  decoded: DecodedResult | null;
  decodeError: string | null;
  formattedVersion: string | null;
}

export function BlueprintImport({
  inputString,
  onInputChange,
  onDecode,
  onClear,
  decoded,
  decodeError,
  formattedVersion,
}: BlueprintImportProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cleanup debounce timer on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handlePaste = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onDecode(), 50);
  }, [onDecode]);

  const hasInput = inputString.trim().length > 0;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <textarea
            className="bg-input/30 border-input text-foreground placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm font-mono focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-y"
            rows={3}
            placeholder="Paste a Factorio blueprint string here..."
            value={inputString}
            onChange={e => onInputChange(e.target.value)}
            onPaste={handlePaste}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => onDecode()}
            disabled={!hasInput}
          >
            <ClipboardPasteIcon className="size-4 mr-1.5" />
            Decode
          </Button>
          {(hasInput || decoded) && (
            <Button variant="ghost" onClick={onClear}>
              <XIcon className="size-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {decodeError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {decodeError}
        </div>
      )}

      {decoded && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{TYPE_LABELS[decoded.type]}</Badge>
          {formattedVersion && (
            <span className="text-muted-foreground text-xs">Factorio {formattedVersion}</span>
          )}
        </div>
      )}
    </div>
  );
}
