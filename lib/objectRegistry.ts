import { ARROW_COLORS, EQUIPMENT_COLORS, FREEHAND_COLOR, ROLE_COLORS, TEXT_COLOR } from "./colors";
import type {
  ArrowKind,
  EquipmentType,
  PlayerRole,
  SceneItem,
} from "./types/scene";

export type ResizeMode = "uniform" | "freeform" | "font-scale" | "endpoint-drag" | "none";

export interface ObjectRegistryEntry {
  id: string;
  paletteLabel: string;
  category: "player" | "equipment" | "annotation";
  color: string;
  defaultSizeMeters: { width: number; height: number };
  resize: ResizeMode;
  rotatable: boolean;
  create: (pos: { x: number; y: number }) => SceneItem;
}

function playerEntry(role: PlayerRole, id: string, label: string): ObjectRegistryEntry {
  const radiusMeters = 0.35;
  return {
    id,
    paletteLabel: label,
    category: "player",
    color: ROLE_COLORS[role],
    defaultSizeMeters: { width: radiusMeters * 2, height: radiusMeters * 2 },
    resize: "uniform",
    rotatable: false,
    create: (pos) => ({
      id: crypto.randomUUID(),
      kind: "player",
      role,
      radiusMeters,
      x: pos.x,
      y: pos.y,
      rotation: 0,
    }),
  };
}

function equipmentEntry(
  type: EquipmentType,
  label: string,
  size: { width: number; height: number },
  resize: ResizeMode,
  rotatable: boolean
): ObjectRegistryEntry {
  return {
    id: type,
    paletteLabel: label,
    category: "equipment",
    color: EQUIPMENT_COLORS[type],
    defaultSizeMeters: size,
    resize,
    rotatable,
    create: (pos) => ({
      id: crypto.randomUUID(),
      kind: "equipment",
      equipmentType: type,
      widthMeters: size.width,
      heightMeters: size.height,
      x: pos.x,
      y: pos.y,
      rotation: 0,
    }),
  };
}

function arrowEntry(arrowType: ArrowKind, label: string): ObjectRegistryEntry {
  return {
    id: `arrow-${arrowType}`,
    paletteLabel: label,
    category: "annotation",
    color: ARROW_COLORS[arrowType],
    defaultSizeMeters: { width: 3, height: 0 },
    resize: "endpoint-drag",
    rotatable: false,
    create: (pos) => ({
      id: crypto.randomUUID(),
      kind: "arrow",
      arrowType,
      x: pos.x,
      y: pos.y,
      endX: pos.x + 3,
      endY: pos.y,
      color: ARROW_COLORS[arrowType],
      strokeWidthPx: 3,
      rotation: 0,
    }),
  };
}

export const OBJECT_REGISTRY: Record<string, ObjectRegistryEntry> = {
  goalkeeper: playerEntry("goalkeeper", "goalkeeper", "Torhüter"),
  coach: playerEntry("coach", "coach", "Trainer"),
  outfield: playerEntry("outfield", "outfield", "Feldspieler"),

  ball: equipmentEntry("ball", "Ball", { width: 0.22, height: 0.22 }, "uniform", false),
  cone: equipmentEntry("cone", "Hütchen", { width: 0.3, height: 0.3 }, "uniform", false),
  "cone-flat": equipmentEntry(
    "cone-flat",
    "Kleines Hütchen",
    { width: 0.2, height: 0.2 },
    "uniform",
    false
  ),
  hurdle: equipmentEntry("hurdle", "Hürde", { width: 0.5, height: 0.3 }, "freeform", true),
  pole: equipmentEntry("pole", "Stange", { width: 0.06, height: 1.5 }, "freeform", true),
  "agility-ladder": equipmentEntry(
    "agility-ladder",
    "Koordinationsleiter",
    { width: 0.5, height: 4 },
    "freeform",
    true
  ),
  "mini-goal": equipmentEntry(
    "mini-goal",
    "Minitor",
    { width: 1.2, height: 0.8 },
    "freeform",
    true
  ),

  "text-label": {
    id: "text-label",
    paletteLabel: "Textlabel",
    category: "annotation",
    color: TEXT_COLOR,
    defaultSizeMeters: { width: 2, height: 0.6 },
    resize: "font-scale",
    rotatable: false,
    create: (pos) => ({
      id: crypto.randomUUID(),
      kind: "text",
      text: "Text",
      fontSizeMeters: 0.6,
      color: TEXT_COLOR,
      x: pos.x,
      y: pos.y,
      rotation: 0,
    }),
  },

  "arrow-run": arrowEntry("run", "Lauf-Pfeil"),
  "arrow-pass": arrowEntry("pass", "Pass-Pfeil"),
  "arrow-dribble": arrowEntry("dribble", "Dribbling-Pfeil"),

  "freehand-pencil": {
    id: "freehand-pencil",
    paletteLabel: "Freihand-Stift",
    category: "annotation",
    color: FREEHAND_COLOR,
    defaultSizeMeters: { width: 0, height: 0 },
    resize: "none",
    rotatable: false,
    create: (pos) => ({
      id: crypto.randomUUID(),
      kind: "freehand",
      points: [pos.x, pos.y],
      color: FREEHAND_COLOR,
      strokeWidthPx: 3,
      x: 0,
      y: 0,
      rotation: 0,
    }),
  },
};

export function getRegistryKeyForItem(item: SceneItem): string {
  switch (item.kind) {
    case "player":
      return item.role;
    case "equipment":
      return item.equipmentType;
    case "text":
      return "text-label";
    case "arrow":
      return `arrow-${item.arrowType}`;
    case "freehand":
      return "freehand-pencil";
  }
}

export const PALETTE_CATEGORIES: { id: ObjectRegistryEntry["category"]; label: string }[] = [
  { id: "player", label: "Personen" },
  { id: "equipment", label: "Ausrüstung" },
  { id: "annotation", label: "Zeichnen" },
];
