"use client";

import { Group, Line, Rect, Text } from "react-konva";
import { FIELD_GRASS, FIELD_GRID, FIELD_LINES } from "@/lib/colors";
import { computeGridStep } from "@/lib/fieldTemplates";
import type { FieldTemplateConfig } from "@/lib/types/field";
import { FieldMarkingsRenderer } from "./FieldMarkingsRenderer";

interface Props {
  template: FieldTemplateConfig;
  widthMeters: number;
  heightMeters: number;
  ppm: number;
}

export function FieldBackground({ template, widthMeters, heightMeters, ppm }: Props) {
  const gridStep = template.gridStepMeters ?? computeGridStep(Math.max(widthMeters, heightMeters));
  const gridLines: number[][] = [];
  if (template.showMeterGrid) {
    for (let x = 0; x <= widthMeters + 0.001; x += gridStep) {
      gridLines.push([x * ppm, 0, x * ppm, heightMeters * ppm]);
    }
    for (let y = 0; y <= heightMeters + 0.001; y += gridStep) {
      gridLines.push([0, y * ppm, widthMeters * ppm, y * ppm]);
    }
  }

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={widthMeters * ppm}
        height={heightMeters * ppm}
        fill={FIELD_GRASS}
        listening={false}
      />
      {gridLines.map((points, i) => (
        <Line key={i} points={points} stroke={FIELD_GRID} strokeWidth={1} listening={false} />
      ))}
      <FieldMarkingsRenderer markings={template.markings} ppm={ppm} />
      <Rect
        x={0}
        y={0}
        width={widthMeters * ppm}
        height={heightMeters * ppm}
        stroke={FIELD_LINES}
        strokeWidth={2}
        listening={false}
      />
      {template.showMeterGrid && (
        <Group x={8} y={heightMeters * ppm - 22}>
          <Line points={[0, 0, ppm, 0]} stroke={FIELD_LINES} strokeWidth={2} listening={false} />
          <Text text="1 m" fontSize={12} fill={FIELD_LINES} y={-16} listening={false} />
        </Group>
      )}
    </>
  );
}
