import { useState } from 'react';
import type { useBlueprintEditor } from '../../hooks/useBlueprintEditor.js';
import type { Blueprint, BlueprintBook } from '../../../blueprint/index.js';
import { BlueprintImport } from './BlueprintImport.js';
import { BlueprintMetadata } from './BlueprintMetadata.js';
import { BlueprintMetadataEditor } from './BlueprintMetadataEditor.js';
import { BlueprintActions } from './BlueprintActions.js';
import { BlueprintStats } from './BlueprintStats.js';
import { BlueprintBookTree } from './BlueprintBookTree.js';
import { BlueprintJsonViewer } from './BlueprintJsonViewer.js';
import { BlueprintExport } from './BlueprintExport.js';
import { Button } from '../../ui/index.js';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';

type BlueprintEditorState = ReturnType<typeof useBlueprintEditor>;

export function BlueprintTab(props: BlueprintEditorState) {
  const {
    inputString,
    setInputString,
    decoded,
    decodeError,
    handleDecode,
    handleClear,
    selectedPath,
    setSelectedPath,
    selectedNode,
    selectedNodeType,
    updateSelectedNode,
    reEncodedString,
    reEncodeError,
    formattedVersion,
  } = props;

  const [editMode, setEditMode] = useState(false);

  const isBook = decoded?.type === 'blueprint_book';
  const book = isBook && decoded ? (decoded.raw as { blueprint_book: BlueprintBook }).blueprint_book : null;
  const isBlueprint = selectedNodeType === 'blueprint';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <BlueprintImport
        inputString={inputString}
        onInputChange={setInputString}
        onDecode={handleDecode}
        onClear={handleClear}
        decoded={decoded}
        decodeError={decodeError}
        formattedVersion={formattedVersion}
      />

      {decoded && selectedNode && selectedNodeType && (
        <div
          className="mt-4"
          style={isBook ? {
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: 16,
            alignItems: 'start',
          } : undefined}
        >
          {/* Sidebar: Book tree (only for blueprint books) */}
          {isBook && book && (
            <div className="rounded-lg border border-border bg-card" style={{ minHeight: 200, maxHeight: 'calc(100vh - 250px)', overflow: 'hidden' }}>
              <BlueprintBookTree
                book={book}
                selectedPath={selectedPath}
                onSelectPath={setSelectedPath}
              />
            </div>
          )}

          {/* Main content */}
          <div className="space-y-4">
            {/* View/Edit toggle */}
            <div className="flex items-center justify-between">
              <BlueprintActions
                node={selectedNode}
                nodeType={selectedNodeType}
                onUpdate={updateSelectedNode}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <><EyeIcon className="size-3.5 mr-1.5" />View</>
                ) : (
                  <><PencilIcon className="size-3.5 mr-1.5" />Edit</>
                )}
              </Button>
            </div>

            {editMode ? (
              <BlueprintMetadataEditor
                node={selectedNode}
                nodeType={selectedNodeType}
                onUpdate={updateSelectedNode}
              />
            ) : (
              <BlueprintMetadata node={selectedNode} nodeType={selectedNodeType} />
            )}

            {isBlueprint && (
              <BlueprintStats blueprint={selectedNode as Blueprint} />
            )}

            <BlueprintJsonViewer
              data={selectedNode}
              maxInitialDepth={1}
            />

            <BlueprintExport
              reEncodedString={reEncodedString}
              reEncodeError={reEncodeError}
              decoded={decoded}
            />
          </div>
        </div>
      )}
    </div>
  );
}
