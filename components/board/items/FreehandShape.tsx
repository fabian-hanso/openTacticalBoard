"use client";

import type Konva from "konva";
import { Group, Line } from "react-konva";
import type { FreehandItem } from "@/lib/types/scene";

interface Props {
  item: FreehandItem;
  ppm: number;
  isSelected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onTranslate: (deltaXMeters: number, deltaYMeters: number) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  shapeRef: (node: Konva.Node | null) => void;
}

export function FreehandShape({
  item,
  ppm,
  isSelected,
  draggable,
  onSelect,
  onTranslate,
  onContextMenu,
  shapeRef,
}: Props) {
  const pxPoints = item.points.map((v) => v * ppm);
  return (
    <Group
      ref={shapeRef as never}
      x={0}
      y={0}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onContextMenu={onContextMenu}
      onDragEnd={(e) => {
        const node = e.target as Konva.Group;
        onTranslate(node.x() / ppm, node.y() / ppm);
        node.position({ x: 0, y: 0 });
      }}
    >
      <Line
        points={pxPoints}
        stroke={item.color}
        strokeWidth={item.strokeWidthPx}
        lineCap="round"
        lineJoin="round"
        tension={0.3}
        hitStrokeWidth={16}
        shadowColor={isSelected ? "#ffffff" : undefined}
        shadowBlur={isSelected ? 5 : 0}
        shadowOpacity={isSelected ? 0.8 : 0}
      />
    </Group>
  );
}
