import type { BlueprintType, BlueprintNode } from '../../hooks/useBlueprintEditor.js';
import type { Blueprint, BlueprintBook, UpgradePlanner, DeconstructionPlanner, Color } from '../../../blueprint/index.js';
import { formatVersion } from '../../../blueprint/index.js';
import { ItemIcon } from '../ItemIcon.js';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../ui/index.js';

const TYPE_LABELS: Record<BlueprintType, string> = {
  blueprint: 'Blueprint',
  blueprint_book: 'Blueprint Book',
  upgrade_planner: 'Upgrade Planner',
  deconstruction_planner: 'Deconstruction Planner',
};

interface BlueprintMetadataProps {
  node: BlueprintNode;
  nodeType: BlueprintType;
}

function ColorSwatch({ color }: { color: Color }) {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a ?? 1;
  return (
    <span
      className="inline-block rounded border border-border"
      style={{
        width: 16,
        height: 16,
        backgroundColor: `rgba(${r}, ${g}, ${b}, ${a})`,
        verticalAlign: 'middle',
      }}
    />
  );
}

function getLabel(node: BlueprintNode): string | undefined {
  return node.label;
}

function getDescription(node: BlueprintNode, nodeType: BlueprintType): string | undefined {
  if (nodeType === 'upgrade_planner' || nodeType === 'deconstruction_planner') {
    return (node as UpgradePlanner | DeconstructionPlanner).settings?.description;
  }
  return (node as Blueprint | BlueprintBook).description;
}

function getIcons(node: BlueprintNode, nodeType: BlueprintType) {
  if (nodeType === 'upgrade_planner' || nodeType === 'deconstruction_planner') {
    return (node as UpgradePlanner | DeconstructionPlanner).settings?.icons;
  }
  return (node as Blueprint | BlueprintBook).icons;
}

function computeBoundingBox(bp: Blueprint) {
  const entities = bp.entities;
  if (!entities || entities.length === 0) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const e of entities) {
    if (e.position.x < minX) minX = e.position.x;
    if (e.position.x > maxX) maxX = e.position.x;
    if (e.position.y < minY) minY = e.position.y;
    if (e.position.y > maxY) maxY = e.position.y;
  }
  return {
    width: Math.ceil(maxX - minX) + 1,
    height: Math.ceil(maxY - minY) + 1,
  };
}

function MetadataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </>
  );
}

export function BlueprintMetadata({ node, nodeType }: BlueprintMetadataProps) {
  const label = getLabel(node);
  const description = getDescription(node, nodeType);
  const icons = getIcons(node, nodeType);
  const version = 'version' in node ? node.version : undefined;

  const bp = nodeType === 'blueprint' ? (node as Blueprint) : null;
  const book = nodeType === 'blueprint_book' ? (node as BlueprintBook) : null;
  const upgrader = nodeType === 'upgrade_planner' ? (node as UpgradePlanner) : null;
  const decon = nodeType === 'deconstruction_planner' ? (node as DeconstructionPlanner) : null;

  const bounds = bp ? computeBoundingBox(bp) : null;
  const snapToGrid = bp?.['snap-to-grid'];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TYPE_LABELS[nodeType]}</Badge>
          {label ? (
            <CardTitle className="text-base">
              {node.label_color && <ColorSwatch color={node.label_color} />}{' '}
              {label}
            </CardTitle>
          ) : (
            <span className="text-muted-foreground italic text-sm">Untitled</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-baseline">
          {icons && icons.length > 0 && (
            <MetadataRow label="Icons">
              <div className="flex items-center gap-1">
                {icons.map(icon => (
                  <ItemIcon
                    key={icon.index}
                    name={icon.signal.name}
                    category={icon.signal.type === 'fluid' ? 'fluid' : 'item'}
                    size={24}
                  />
                ))}
              </div>
            </MetadataRow>
          )}

          {version !== undefined && (
            <MetadataRow label="Version">
              Factorio {formatVersion(version)}
            </MetadataRow>
          )}

          {description && (
            <MetadataRow label="Description">
              <p className="whitespace-pre-wrap text-muted-foreground">{description}</p>
            </MetadataRow>
          )}

          {bp && (
            <MetadataRow label="Entities">
              {bp.entities?.length ?? 0} entities, {bp.tiles?.length ?? 0} tiles
            </MetadataRow>
          )}

          {bounds && (
            <MetadataRow label="Dimensions">
              {bounds.width} x {bounds.height} tiles
            </MetadataRow>
          )}

          {snapToGrid && (
            <MetadataRow label="Snap to Grid">
              {snapToGrid.x} x {snapToGrid.y}
              {bp?.['absolute-snapping'] && ' (absolute)'}
            </MetadataRow>
          )}

          {bp?.wires && bp.wires.length > 0 && (
            <MetadataRow label="Wires">
              {bp.wires.length} connections
            </MetadataRow>
          )}

          {bp?.schedules && bp.schedules.length > 0 && (
            <MetadataRow label="Schedules">
              {bp.schedules.length} train schedule{bp.schedules.length > 1 ? 's' : ''}
            </MetadataRow>
          )}

          {bp?.parameters && bp.parameters.length > 0 && (
            <MetadataRow label="Parameters">
              {bp.parameters.length} parameter{bp.parameters.length > 1 ? 's' : ''}
            </MetadataRow>
          )}

          {book && (
            <MetadataRow label="Children">
              {book.blueprints?.length ?? 0} items (active: #{(book.active_index ?? 0) + 1})
            </MetadataRow>
          )}

          {upgrader?.settings?.mappers && upgrader.settings.mappers.length > 0 && (
            <MetadataRow label="Mappings">
              <div className="space-y-1">
                {upgrader.settings.mappers.map(m => (
                  <div key={m.index} className="flex items-center gap-1 text-xs">
                    {m.from ? <ItemIcon name={m.from.name} size={16} /> : <span className="text-muted-foreground">any</span>}
                    <span className="text-muted-foreground">&rarr;</span>
                    {m.to ? <ItemIcon name={m.to.name} size={16} /> : <span className="text-muted-foreground">any</span>}
                  </div>
                ))}
              </div>
            </MetadataRow>
          )}

          {decon?.settings?.entity_filters && decon.settings.entity_filters.length > 0 && (
            <MetadataRow label="Entity Filters">
              <div className="flex items-center gap-1 flex-wrap">
                {decon.settings.entity_filters.map(f => (
                  <ItemIcon key={f.index} name={f.name} size={20} />
                ))}
              </div>
            </MetadataRow>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
