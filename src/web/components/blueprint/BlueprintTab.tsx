import { useState, useMemo } from 'react';
import type { useBlueprintEditor } from '../../hooks/useBlueprintEditor.js';
import { useHotkeys } from '../../hooks/useHotkeys.js';
import type { Blueprint, BlueprintBook } from '../../../blueprint/index.js';
import { BlueprintImport } from './BlueprintImport.js';
import { BlueprintMetadata } from './BlueprintMetadata.js';
import { BlueprintMetadataEditor } from './BlueprintMetadataEditor.js';
import { BlueprintActions } from './BlueprintActions.js';
import { BlueprintStats } from './BlueprintStats.js';
import { BlueprintBookTree } from './BlueprintBookTree.js';
import { BlueprintBookActions } from './BlueprintBookActions.js';
import { BlueprintJsonViewer } from './BlueprintJsonViewer.js';
import { BlueprintJsonEditor } from './BlueprintJsonEditor.js';
import { BlueprintExport } from './BlueprintExport.js';
import { BlueprintPreview } from './preview/BlueprintPreview.js';
import { Button } from '../../ui/index.js';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import CodeIcon from 'lucide-react/dist/esm/icons/code';
import UndoIcon from 'lucide-react/dist/esm/icons/undo-2';
import RedoIcon from 'lucide-react/dist/esm/icons/redo-2';

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
    updateRootBook,
    reEncodedString,
    reEncodeError,
    formattedVersion,
    undo,
    redo,
    canUndo,
    canRedo,
    editorMode: _editorMode,
  } = props;

  const [editMode, setEditMode] = useState(false);
  const [jsonEditMode, setJsonEditMode] = useState(false);

  // Global keyboard shortcuts
  const hotkeys = useMemo(() => ({
    'ctrl+z': () => undo(),
    'ctrl+shift+z': () => redo(),
    'ctrl+y': () => redo(),
    'escape': () => _editorMode.resetMode(),
  }), [undo, redo, _editorMode.resetMode]);
  useHotkeys(hotkeys, !!decoded);

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
          {/* Sidebar: Book tree + actions (only for blueprint books) */}
          {isBook && book && (
            <div className="rounded-lg border border-border bg-card" style={{ minHeight: 200, maxHeight: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <BlueprintBookTree
                  book={book}
                  selectedPath={selectedPath}
                  onSelectPath={setSelectedPath}
                />
              </div>
              <BlueprintBookActions
                book={book}
                selectedPath={selectedPath}
                onUpdateBook={updateRootBook}
                onSelectPath={setSelectedPath}
              />
            </div>
          )}

          {/* Main content */}
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <BlueprintActions
                node={selectedNode}
                nodeType={selectedNodeType}
                onUpdate={updateSelectedNode}
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5"
                  onClick={undo}
                  disabled={!canUndo}
                  title="Undo (Ctrl+Z)"
                >
                  <UndoIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5"
                  onClick={redo}
                  disabled={!canRedo}
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <RedoIcon className="size-3.5" />
                </Button>
                <span className="w-px h-4 bg-border mx-0.5" />
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

            {isBlueprint && (
              <BlueprintPreview blueprint={selectedNode as Blueprint} />
            )}

            {jsonEditMode ? (
              <BlueprintJsonEditor
                data={selectedNode}
                nodeType={selectedNodeType}
                onApply={updateSelectedNode}
                onClose={() => setJsonEditMode(false)}
              />
            ) : (
              <div>
                <div className="flex items-center justify-end mb-1">
                  <Button variant="ghost" size="sm" onClick={() => setJsonEditMode(true)}>
                    <CodeIcon className="size-3.5 mr-1.5" />
                    Edit JSON
                  </Button>
                </div>
                <BlueprintJsonViewer
                  data={selectedNode}
                  maxInitialDepth={1}
                />
              </div>
            )}

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
