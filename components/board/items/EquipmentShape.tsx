"use client";

import { Circle, Ellipse, Group, Line, Rect, RegularPolygon } from "react-konva";
import { EQUIPMENT_COLORS } from "@/lib/colors";
import type { EquipmentItem } from "@/lib/types/scene";
import { ItemShapeProps } from "./itemProps";

function EquipmentGlyph({ item, w, h }: { item: EquipmentItem; w: number; h: number }) {
  const color = item.color ?? EQUIPMENT_COLORS[item.equipmentType];

  switch (item.equipmentType) {
    case "ball":
      return (
        <>
          <Circle radius={w / 2} fill={color} stroke="#1f2937" strokeWidth={1.5} />
          <Line points={[-w / 4, -h / 6, w / 4, -h / 6]} stroke="#1f2937" strokeWidth={1} />
          <Line points={[-w / 4, h / 6, w / 4, h / 6]} stroke="#1f2937" strokeWidth={1} />
        </>
      );
    case "cone":
      return <RegularPolygon sides={3} radius={w / 2} fill={color} stroke="#7c2d12" strokeWidth={1} />;
    case "cone-flat":
      return <Ellipse radiusX={w / 2} radiusY={h / 2.6} fill={color} stroke="#7c2d12" strokeWidth={1} />;
    case "hurdle":
      return (
        <>
          <Rect x={-w / 2} y={-h / 2} width={h / 5} height={h} fill={color} cornerRadius={2} />
          <Rect x={w / 2 - h / 5} y={-h / 2} width={h / 5} height={h} fill={color} cornerRadius={2} />
          <Rect x={-w / 2} y={-h / 6} width={w} height={h / 5} fill={color} cornerRadius={2} />
        </>
      );
    case "pole":
      return <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} cornerRadius={w / 2} />;
    case "agility-ladder": {
      const rungCount = Math.max(4, Math.round(h / (w * 0.9)));
      const rungs = [];
      for (let i = 0; i <= rungCount; i++) {
        const ry = -h / 2 + (h * i) / rungCount;
        rungs.push(
          <Line key={i} points={[-w / 2, ry, w / 2, ry]} stroke={color} strokeWidth={2} />
        );
      }
      return (
        <>
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} stroke={color} strokeWidth={2} />
          {rungs}
        </>
      );
    }
    case "mini-goal": {
      const postWidth = Math.max(2, w * 0.07);
      const meshCols = 4;
      const meshRows = 3;
      const mesh = [];
      for (let i = 1; i < meshCols; i++) {
        const nx = -w / 2 + (w * i) / meshCols;
        mesh.push(
          <Line key={`v${i}`} points={[nx, -h / 2, nx, h / 2]} stroke={color} strokeWidth={0.75} opacity={0.45} />
        );
      }
      for (let j = 1; j < meshRows; j++) {
        const ny = -h / 2 + (h * j) / meshRows;
        mesh.push(
          <Line key={`h${j}`} points={[-w / 2, ny, w / 2, ny]} stroke={color} strokeWidth={0.75} opacity={0.45} />
        );
      }
      return (
        <>
          {mesh}
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} stroke={color} strokeWidth={1} opacity={0.6} />
          <Line points={[-w / 2, -h / 2, w / 2, -h / 2]} stroke={color} strokeWidth={postWidth} lineCap="round" />
          <Line points={[-w / 2, -h / 2, -w / 2, h / 2]} stroke={color} strokeWidth={postWidth} lineCap="round" />
          <Line points={[w / 2, -h / 2, w / 2, h / 2]} stroke={color} strokeWidth={postWidth} lineCap="round" />
        </>
      );
    }
    default:
      return <Rect x={-w / 2} y={-h / 2} width={w} height={h} fill={color} />;
  }
}

export function EquipmentShape({
  item,
  ppm,
  isSelected,
  draggable,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onContextMenu,
  shapeRef,
}: ItemShapeProps<EquipmentItem>) {
  const w = item.widthMeters * ppm;
  const h = item.heightMeters * ppm;
  return (
    <Group
      ref={shapeRef as never}
      x={item.x * ppm}
      y={item.y * ppm}
      rotation={item.rotation}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onDragEnd(e.target.x() / ppm, e.target.y() / ppm)}
      onTransformEnd={onTransformEnd}
      onContextMenu={onContextMenu}
    >
      <EquipmentGlyph item={item} w={w} h={h} />
      {isSelected && (
        <Rect
          x={-w / 2 - 4}
          y={-h / 2 - 4}
          width={w + 8}
          height={h + 8}
          stroke="#ffffff"
          strokeWidth={1.5}
          dash={[4, 3]}
          listening={false}
        />
      )}
    </Group>
  );
}
