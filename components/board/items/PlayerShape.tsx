"use client";

import { Circle, Group, Text } from "react-konva";
import { ROLE_COLORS } from "@/lib/colors";
import type { PlayerItem } from "@/lib/types/scene";
import { ItemShapeProps, roleLabel } from "./itemProps";

export function PlayerShape({
  item,
  ppm,
  isSelected,
  draggable,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onContextMenu,
  shapeRef,
}: ItemShapeProps<PlayerItem>) {
  const radiusPx = item.radiusMeters * ppm;
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
      <Circle
        radius={radiusPx}
        fill={ROLE_COLORS[item.role]}
        stroke={isSelected ? "#ffffff" : "rgba(15,23,42,0.6)"}
        strokeWidth={isSelected ? 3 : 1.5}
      />
      <Text
        text={roleLabel(item.role)}
        fontSize={Math.max(9, radiusPx * 0.7)}
        fontStyle="bold"
        fill="#111827"
        width={radiusPx * 2}
        align="center"
        offsetX={radiusPx}
        offsetY={Math.max(9, radiusPx * 0.7) / 2}
        listening={false}
      />
    </Group>
  );
}
