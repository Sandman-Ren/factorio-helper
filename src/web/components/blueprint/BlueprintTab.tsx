import { useState, useMemo, useCallback } from 'react';
import type { useBlueprintEditor } from '../../hooks/useBlueprintEditor.js';
import { useHotkeys } from '../../hooks/useHotkeys.js';
import { useEntitySelection } from '../../hooks/useEntitySelection.js';
import type { Blueprint, BlueprintBook, Entity } from '../../../blueprint/index.js';
import { addEntity, removeEntities, rotateEntities } from '../../../blueprint/index.js';
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
import { EntityPropertyPanel } from './EntityPropertyPanel.js';
import { EntityPalette } from './EntityPalette.js';
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
  const selection = useEntitySelection();

  const isBook = decoded?.type === 'blueprint_book';
  const book = isBook && decoded ? (decoded.raw as { blueprint_book: BlueprintBook }).blueprint_book : null;
  const isBlueprint = selectedNodeType === 'blueprint';
  const bp = isBlueprint ? (selectedNode as Blueprint) : null;

  // Find the single selected entity (for property panel)
  const selectedEntity = useMemo(() => {
    if (!bp?.entities || selection.selected.size !== 1) return null;
    const num = [...selection.selected][0]!;
    return bp.entities.find(e => e.entity_number === num) ?? null;
  }, [bp, selection.selected]);

  const handleEntitySelect = useCallback((entity: Entity, ctrlKey: boolean) => {
    if (ctrlKey) {
      selection.toggleOne(entity.entity_number);
    } else {
      selection.selectOne(entity.entity_number);
    }
  }, [selection.toggleOne, selection.selectOne]);

  // Blueprint-level update wrapper for property panel
  const handleBlueprintUpdate = useCallback((updater: (bp: Blueprint) => Blueprint) => {
    updateSelectedNode((node, type) => {
      if (type !== 'blueprint') return node;
      return updater(node as Blueprint);
    });
  }, [updateSelectedNode]);

  // Entity palette: select entity to enter place mode
  const handlePaletteSelect = useCallback((name: string) => {
    if (_editorMode.mode.type === 'place' && _editorMode.mode.entityName === name) {
      _editorMode.resetMode(); // toggle off
    } else {
      _editorMode.startPlacing(name);
    }
  }, [_editorMode]);

  // Place entity on canvas click
  const handlePlaceEntity = useCallback((name: string, x: number, y: number, direction: number) => {
    handleBlueprintUpdate(b => addEntity(b, { name, position: { x, y }, direction }));
  }, [handleBlueprintUpdate]);

  // Keyboard shortcuts
  const hotkeys = useMemo(() => ({
    'ctrl+z': () => undo(),
    'ctrl+shift+z': () => redo(),
    'ctrl+y': () => redo(),
    'escape': () => {
      if (selection.selected.size > 0) selection.clearSelection();
      else _editorMode.resetMode();
    },
    'delete': () => {
      if (selection.selected.size > 0 && bp) {
        handleBlueprintUpdate(b => removeEntities(b, selection.selected));
        selection.clearSelection();
      }
    },
    'r': () => {
      if (_editorMode.mode.type === 'place') {
        _editorMode.rotatePlacementDirection(true);
      } else if (selection.selected.size > 0 && bp) {
        handleBlueprintUpdate(b => rotateEntities(b, selection.selected, true));
      }
    },
    'shift+r': () => {
      if (_editorMode.mode.type === 'place') {
        _editorMode.rotatePlacementDirection(false);
      } else if (selection.selected.size > 0 && bp) {
        handleBlueprintUpdate(b => rotateEntities(b, selection.selected, false));
      }
    },
    'ctrl+a': () => {
      if (bp?.entities) {
        selection.selectAll(bp.entities.map(e => e.entity_number));
      }
    },
  }), [undo, redo, _editorMode.resetMode, selection, bp, handleBlueprintUpdate]);
  useHotkeys(hotkeys, !!decoded);

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
              <div style={{ display: 'grid', gridTemplateColumns: _editorMode.mode.type === 'place' ? '180px 1fr' : '1fr', gap: 8 }}>
                {_editorMode.mode.type === 'place' && (
                  <EntityPalette
                    activeEntity={_editorMode.mode.entityName}
                    onSelectEntity={handlePaletteSelect}
                  />
                )}
                <BlueprintPreview
                  blueprint={selectedNode as Blueprint}
                  selectedEntityNumbers={selection.selected}
                  onEntitySelect={handleEntitySelect}
                  onClearSelection={selection.clearSelection}
                  editorMode={_editorMode.mode}
                  onPlaceEntity={handlePlaceEntity}
                />
              </div>
            )}

            {/* Entity palette toggle (when not in place mode) */}
            {isBlueprint && _editorMode.mode.type !== 'place' && (
              <EntityPalette
                activeEntity={null}
                onSelectEntity={handlePaletteSelect}
              />
            )}

            {/* Entity property panel */}
            {selectedEntity && (
              <EntityPropertyPanel
                entity={selectedEntity}
                onUpdate={handleBlueprintUpdate}
              />
            )}

            {/* Selection summary for multi-select */}
            {selection.selected.size > 1 && (
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-sm text-muted-foreground">
                  {selection.selected.size} entities selected
                  <span className="text-xs ml-2">(Delete to remove, R to rotate, Escape to deselect)</span>
                </div>
              </div>
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
