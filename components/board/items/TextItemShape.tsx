"use client";

import { Text } from "react-konva";
import type { TextItem } from "@/lib/types/scene";
import { ItemShapeProps } from "./itemProps";

interface Props extends ItemShapeProps<TextItem> {
  onEditRequest: () => void;
}

export function TextItemShape({
  item,
  ppm,
  isSelected,
  draggable,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onEditRequest,
  onTransformEnd,
  onContextMenu,
  shapeRef,
}: Props) {
  return (
    <Text
      ref={shapeRef as never}
      x={item.x * ppm}
      y={item.y * ppm}
      rotation={item.rotation}
      text={item.text}
      fontSize={item.fontSizeMeters * ppm}
      fontStyle="600"
      fill={item.color}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onEditRequest}
      onDblTap={onEditRequest}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => onDragEnd(e.target.x() / ppm, e.target.y() / ppm)}
      onTransformEnd={onTransformEnd}
      onContextMenu={onContextMenu}
      shadowColor={isSelected ? "#ffffff" : undefined}
      shadowBlur={isSelected ? 6 : 0}
      shadowOpacity={isSelected ? 0.9 : 0}
    />
  );
}
