import type {
  Blueprint,
  BlueprintBook,
  BlueprintBookChild,
  DeconstructionPlanner,
  Entity,
  Icon,
  Position,
  SignalID,
  Tile,
  UpgradePlanner,
  WireConnection,
  WireConnectorId,
} from "./types";
import { encodeVersion } from "./version";

/** Fields the builder auto-assigns (entity_number) or provides defaults for. */
type EntityInput = Omit<Entity, "entity_number"> & {
  entity_number?: number;
};

export class BlueprintBuilder {
  private label?: string;
  private labelColor?: Blueprint["label_color"];
  private description?: string;
  private icons: Icon[] = [];
  private version: number = encodeVersion(2, 0, 28);
  private nextEntityNumber = 1;
  private entities: Entity[] = [];
  private tiles: Tile[] = [];
  private wires: WireConnection[] = [];
  private snapToGrid?: Position;
  private absoluteSnapping?: boolean;
  private positionRelativeToGrid?: Position;

  setLabel(label: string): this {
    this.label = label;
    return this;
  }

  setLabelColor(color: Blueprint["label_color"]): this {
    this.labelColor = color;
    return this;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setVersion(major: number, minor: number, patch: number, build?: number): this {
    this.version = encodeVersion(major, minor, patch, build);
    return this;
  }

  setIcons(icons: Icon[]): this {
    this.icons = icons;
    return this;
  }

  addIcon(index: number, signal: SignalID): this {
    this.icons.push({ index, signal });
    return this;
  }

  /**
   * Add an entity. `entity_number` is auto-assigned (1-based, sequential)
   * unless explicitly provided.
   *
   * Returns the assigned entity_number for use in wire connections.
   */
  addEntity(input: EntityInput): number {
    const entityNumber = input.entity_number ?? this.nextEntityNumber;
    this.nextEntityNumber = Math.max(this.nextEntityNumber, entityNumber + 1);
    const entity: Entity = { ...input, entity_number: entityNumber };
    this.entities.push(entity);
    return entityNumber;
  }

  addTile(name: string, position: Position): this {
    this.tiles.push({ name, position });
    return this;
  }

  addWire(
    entity1: number,
    connector1: WireConnectorId,
    entity2: number,
    connector2: WireConnectorId,
  ): this {
    this.wires.push([entity1, connector1, entity2, connector2]);
    return this;
  }

  setSnapToGrid(x: number, y: number): this {
    this.snapToGrid = { x, y };
    return this;
  }

  setAbsoluteSnapping(absolute: boolean): this {
    this.absoluteSnapping = absolute;
    return this;
  }

  setPositionRelativeToGrid(x: number, y: number): this {
    this.positionRelativeToGrid = { x, y };
    return this;
  }

  build(): Blueprint {
    const bp: Blueprint = {
      item: "blueprint",
      version: this.version,
    };

    if (this.label !== undefined) bp.label = this.label;
    if (this.labelColor !== undefined) bp.label_color = this.labelColor;
    if (this.description !== undefined) bp.description = this.description;
    if (this.icons.length > 0) bp.icons = [...this.icons];
    if (this.entities.length > 0) bp.entities = [...this.entities];
    if (this.tiles.length > 0) bp.tiles = [...this.tiles];
    if (this.wires.length > 0) bp.wires = [...this.wires];
    if (this.snapToGrid) bp["snap-to-grid"] = { ...this.snapToGrid };
    if (this.absoluteSnapping !== undefined) bp["absolute-snapping"] = this.absoluteSnapping;
    if (this.positionRelativeToGrid) {
      bp["position-relative-to-grid"] = { ...this.positionRelativeToGrid };
    }

    return bp;
  }
}

export class BlueprintBookBuilder {
  private label?: string;
  private labelColor?: BlueprintBook["label_color"];
  private description?: string;
  private icons: Icon[] = [];
  private version: number = encodeVersion(2, 0, 28);
  private children: BlueprintBookChild[] = [];
  private activeIndex = 0;

  setLabel(label: string): this {
    this.label = label;
    return this;
  }

  setLabelColor(color: BlueprintBook["label_color"]): this {
    this.labelColor = color;
    return this;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setVersion(major: number, minor: number, patch: number, build?: number): this {
    this.version = encodeVersion(major, minor, patch, build);
    return this;
  }

  setIcons(icons: Icon[]): this {
    this.icons = icons;
    return this;
  }

  addIcon(index: number, signal: SignalID): this {
    this.icons.push({ index, signal });
    return this;
  }

  setActiveIndex(index: number): this {
    this.activeIndex = index;
    return this;
  }

  addBlueprint(blueprint: Blueprint, index?: number): this {
    this.children.push({
      index: index ?? this.children.length,
      blueprint,
    });
    return this;
  }

  addBook(book: BlueprintBook, index?: number): this {
    this.children.push({
      index: index ?? this.children.length,
      blueprint_book: book,
    });
    return this;
  }

  addUpgradePlanner(planner: UpgradePlanner, index?: number): this {
    this.children.push({
      index: index ?? this.children.length,
      upgrade_planner: planner,
    });
    return this;
  }

  addDeconstructionPlanner(planner: DeconstructionPlanner, index?: number): this {
    this.children.push({
      index: index ?? this.children.length,
      deconstruction_planner: planner,
    });
    return this;
  }

  build(): BlueprintBook {
    const book: BlueprintBook = {
      item: "blueprint-book",
      version: this.version,
      active_index: this.activeIndex,
      blueprints: [...this.children],
    };

    if (this.label !== undefined) book.label = this.label;
    if (this.labelColor !== undefined) book.label_color = this.labelColor;
    if (this.description !== undefined) book.description = this.description;
    if (this.icons.length > 0) book.icons = [...this.icons];

    return book;
  }
}
