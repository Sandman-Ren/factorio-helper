import { useState, useCallback } from 'react';
import type { DecodedResult } from '../../hooks/useBlueprintEditor.js';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../ui/index.js';
import CopyIcon from 'lucide-react/dist/esm/icons/copy';
import CheckIcon from 'lucide-react/dist/esm/icons/check';
import LinkIcon from 'lucide-react/dist/esm/icons/link';

interface BlueprintExportProps {
  reEncodedString: string | null;
  reEncodeError: string | null;
  decoded: DecodedResult | null;
}

export function BlueprintExport({ reEncodedString, reEncodeError, decoded }: BlueprintExportProps) {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!reEncodedString) return;
    try {
      await navigator.clipboard.writeText(reEncodedString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [reEncodedString]);

  const handleCopyLink = useCallback(async () => {
    if (!reEncodedString) return;
    try {
      const url = `${window.location.origin}${window.location.pathname}#blueprint=${encodeURIComponent(reEncodedString)}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard API unavailable
    }
  }, [reEncodedString]);

  if (!reEncodedString && !reEncodeError) return null;

  const originalLength = decoded?.originalString.length ?? 0;
  const reEncodedLength = reEncodedString?.length ?? 0;
  const sizeKB = reEncodedString ? (new Blob([reEncodedString]).size / 1024).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Export</CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={!reEncodedString}
              title="Copy shareable URL"
            >
              {linkCopied ? (
                <><CheckIcon className="size-3 mr-1" />Link Copied</>
              ) : (
                <><LinkIcon className="size-3 mr-1" />Copy Link</>
              )}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopy}
              disabled={!reEncodedString}
            >
              {copied ? (
                <><CheckIcon className="size-3 mr-1" />Copied</>
              ) : (
                <><CopyIcon className="size-3 mr-1" />Copy to Clipboard</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reEncodeError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive mb-2">
            {reEncodeError}
          </div>
        )}
        {reEncodedString && (
          <>
            <textarea
              className="bg-input/30 border-input text-foreground w-full rounded-md border px-3 py-2 text-xs font-mono focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-y"
              rows={3}
              readOnly
              value={reEncodedString}
              onFocus={e => e.target.select()}
              aria-label="Encoded blueprint string"
            />
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground tabular-nums">
              <span>{reEncodedLength.toLocaleString()} chars ({sizeKB} KB)</span>
              {originalLength > 0 && originalLength !== reEncodedLength && (
                <span>
                  Original: {originalLength.toLocaleString()} chars (compression may vary)
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
