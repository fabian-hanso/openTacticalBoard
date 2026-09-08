import type Konva from "konva";

export interface ItemShapeProps<T> {
  item: T;
  ppm: number;
  isSelected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onDragEnd: (xMeters: number, yMeters: number) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  shapeRef: (node: Konva.Node | null) => void;
}

const ROLE_LABEL: Record<string, string> = {
  goalkeeper: "TW",
  coach: "TR",
  outfield: "S",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? "";
}
