"use client";

import type Konva from "konva";
import { Arrow, Circle, Group, Line } from "react-konva";
import { buildZigzagPoints } from "@/lib/geometry/zigzagPath";
import type { ArrowItem } from "@/lib/types/scene";

interface Props {
  item: ArrowItem;
  ppm: number;
  isSelected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onTranslate: (deltaXMeters: number, deltaYMeters: number) => void;
  onEndpointMove: (end: "start" | "end", xMeters: number, yMeters: number) => void;
  onContextMenu?: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  shapeRef: (node: Konva.Node | null) => void;
}

export function ArrowShape({
  item,
  ppm,
  isSelected,
  draggable,
  onSelect,
  onTranslate,
  onEndpointMove,
  onContextMenu,
  shapeRef,
}: Props) {
  const x1 = item.x * ppm;
  const y1 = item.y * ppm;
  const x2 = item.endX * ppm;
  const y2 = item.endY * ppm;

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
      <Line points={[x1, y1, x2, y2]} stroke="transparent" strokeWidth={16} />
      {item.arrowType === "dribble" ? (
        <>
          <Line
            points={buildZigzagPoints(x1, y1, x2, y2)}
            stroke={item.color}
            strokeWidth={item.strokeWidthPx}
            lineJoin="round"
          />
          <Arrow
            points={[x2 - (x2 - x1) * 0.08, y2 - (y2 - y1) * 0.08, x2, y2]}
            stroke={item.color}
            fill={item.color}
            strokeWidth={item.strokeWidthPx}
            pointerLength={10}
            pointerWidth={9}
          />
        </>
      ) : (
        <Arrow
          points={[x1, y1, x2, y2]}
          stroke={item.color}
          fill={item.color}
          strokeWidth={item.strokeWidthPx}
          dash={item.arrowType === "pass" ? [10, 6] : undefined}
          pointerLength={10}
          pointerWidth={9}
        />
      )}
      {isSelected && (
        <>
          <Circle
            x={x1}
            y={y1}
            radius={7}
            fill="#ffffff"
            stroke={item.color}
            strokeWidth={2}
            draggable
            onDragMove={(e) => onEndpointMove("start", e.target.x() / ppm, e.target.y() / ppm)}
          />
          <Circle
            x={x2}
            y={y2}
            radius={7}
            fill="#ffffff"
            stroke={item.color}
            strokeWidth={2}
            draggable
            onDragMove={(e) => onEndpointMove("end", e.target.x() / ppm, e.target.y() / ppm)}
          />
        </>
      )}
    </Group>
  );
}
