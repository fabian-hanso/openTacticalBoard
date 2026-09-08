"use client";

import { Circle, Line, Shape } from "react-konva";
import { FIELD_LINES } from "@/lib/colors";
import type { FieldMarking } from "@/lib/types/field";

interface Props {
  markings: FieldMarking[];
  ppm: number;
}

const STROKE_WIDTH = 2;

export function FieldMarkingsRenderer({ markings, ppm }: Props) {
  return (
    <>
      {markings.map((marking, index) => {
        switch (marking.kind) {
          case "line":
            return (
              <Line
                key={index}
                points={marking.points.map((v) => v * ppm)}
                stroke={FIELD_LINES}
                strokeWidth={STROKE_WIDTH}
                listening={false}
              />
            );
          case "rect":
            return (
              <Shape
                key={index}
                x={marking.x * ppm}
                y={marking.y * ppm}
                width={marking.width * ppm}
                height={marking.height * ppm}
                stroke={FIELD_LINES}
                strokeWidth={STROKE_WIDTH}
                listening={false}
                sceneFunc={(ctx, shape) => {
                  ctx.beginPath();
                  ctx.rect(0, 0, shape.width(), shape.height());
                  ctx.strokeShape(shape);
                }}
              />
            );
          case "circle":
            return (
              <Circle
                key={index}
                x={marking.cx * ppm}
                y={marking.cy * ppm}
                radius={marking.radius * ppm}
                stroke={FIELD_LINES}
                strokeWidth={STROKE_WIDTH}
                listening={false}
              />
            );
          case "spot":
            return (
              <Circle
                key={index}
                x={marking.cx * ppm}
                y={marking.cy * ppm}
                radius={Math.max(2, 0.1 * ppm)}
                fill={FIELD_LINES}
                listening={false}
              />
            );
          case "arc":
            return (
              <Shape
                key={index}
                listening={false}
                sceneFunc={(ctx, shape) => {
                  ctx.beginPath();
                  ctx.arc(
                    marking.cx * ppm,
                    marking.cy * ppm,
                    marking.radius * ppm,
                    (marking.startAngleDeg * Math.PI) / 180,
                    (marking.endAngleDeg * Math.PI) / 180
                  );
                  ctx.strokeShape(shape);
                }}
                stroke={FIELD_LINES}
                strokeWidth={STROKE_WIDTH}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
