import type { FieldTemplateId } from "./field";

export type PlayerRole = "goalkeeper" | "coach" | "outfield";

export type EquipmentType =
  | "ball"
  | "cone"
  | "cone-flat"
  | "hurdle"
  | "pole"
  | "agility-ladder"
  | "mini-goal";

export type ArrowKind = "run" | "pass" | "dribble";

interface BaseItem {
  id: string;
  x: number;
  y: number;
  rotation: number;
}

export interface PlayerItem extends BaseItem {
  kind: "player";
  role: PlayerRole;
  radiusMeters: number;
  label?: string;
}

export interface EquipmentItem extends BaseItem {
  kind: "equipment";
  equipmentType: EquipmentType;
  widthMeters: number;
  heightMeters: number;
  color?: string;
}

export interface TextItem extends BaseItem {
  kind: "text";
  text: string;
  fontSizeMeters: number;
  color: string;
}

export interface ArrowItem extends BaseItem {
  kind: "arrow";
  arrowType: ArrowKind;
  endX: number;
  endY: number;
  color: string;
  strokeWidthPx: number;
}

export interface FreehandItem extends BaseItem {
  kind: "freehand";
  points: number[];
  color: string;
  strokeWidthPx: number;
}

export type SceneItem =
  | PlayerItem
  | EquipmentItem
  | TextItem
  | ArrowItem
  | FreehandItem;

export interface Scene {
  id: string;
  name: string;
  templateId: FieldTemplateId;
  customDimensions?: { widthMeters: number; heightMeters: number };
  items: SceneItem[];
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  scenes: Scene[];
  activeSceneId: string;
  updatedAt: number;
}
