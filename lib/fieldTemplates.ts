import type { FieldMarking, FieldTemplateConfig, FieldTemplateId } from "./types/field";

// Real-world dimensions per IFAB laws of the game, in meters.
const PENALTY_BOX_WIDTH = 40.32;
const PENALTY_BOX_DEPTH = 16.5;
const GOAL_BOX_WIDTH = 18.32;
const GOAL_BOX_DEPTH = 5.5;
const PENALTY_ARC_RADIUS = 9.15;
const PENALTY_SPOT_DISTANCE = 11;
const GOAL_WIDTH = 7.32;
const GOAL_DEPTH = 2;
const CENTER_CIRCLE_RADIUS = 9.15;

// Half-angle (degrees) of the "D" arc that sits outside the penalty box,
// derived from where the penalty-arc circle crosses the box line.
const ARC_HALF_ANGLE_DEG =
  (Math.acos((PENALTY_BOX_DEPTH - PENALTY_SPOT_DISTANCE) / PENALTY_ARC_RADIUS) * 180) / Math.PI;

function fullPitchMarkings(width: number, height: number): FieldMarking[] {
  const midX = width / 2;
  const midY = height / 2;
  return [
    { kind: "line", points: [midX, 0, midX, height] },
    { kind: "circle", cx: midX, cy: midY, radius: CENTER_CIRCLE_RADIUS },
    { kind: "spot", cx: midX, cy: midY },
    // Left side
    {
      kind: "rect",
      x: 0,
      y: midY - PENALTY_BOX_WIDTH / 2,
      width: PENALTY_BOX_DEPTH,
      height: PENALTY_BOX_WIDTH,
    },
    {
      kind: "rect",
      x: 0,
      y: midY - GOAL_BOX_WIDTH / 2,
      width: GOAL_BOX_DEPTH,
      height: GOAL_BOX_WIDTH,
    },
    { kind: "spot", cx: PENALTY_SPOT_DISTANCE, cy: midY },
    {
      kind: "arc",
      cx: PENALTY_SPOT_DISTANCE,
      cy: midY,
      radius: PENALTY_ARC_RADIUS,
      startAngleDeg: -ARC_HALF_ANGLE_DEG,
      endAngleDeg: ARC_HALF_ANGLE_DEG,
    },
    {
      kind: "rect",
      x: -GOAL_DEPTH,
      y: midY - GOAL_WIDTH / 2,
      width: GOAL_DEPTH,
      height: GOAL_WIDTH,
    },
    // Right side (mirrored)
    {
      kind: "rect",
      x: width - PENALTY_BOX_DEPTH,
      y: midY - PENALTY_BOX_WIDTH / 2,
      width: PENALTY_BOX_DEPTH,
      height: PENALTY_BOX_WIDTH,
    },
    {
      kind: "rect",
      x: width - GOAL_BOX_DEPTH,
      y: midY - GOAL_BOX_WIDTH / 2,
      width: GOAL_BOX_DEPTH,
      height: GOAL_BOX_WIDTH,
    },
    { kind: "spot", cx: width - PENALTY_SPOT_DISTANCE, cy: midY },
    {
      kind: "arc",
      cx: width - PENALTY_SPOT_DISTANCE,
      cy: midY,
      radius: PENALTY_ARC_RADIUS,
      startAngleDeg: 180 - ARC_HALF_ANGLE_DEG,
      endAngleDeg: 180 + ARC_HALF_ANGLE_DEG,
    },
    {
      kind: "rect",
      x: width,
      y: midY - GOAL_WIDTH / 2,
      width: GOAL_DEPTH,
      height: GOAL_WIDTH,
    },
  ];
}

function halfPitchMarkings(width: number): FieldMarking[] {
  const midX = width / 2;
  return [
    { kind: "line", points: [0, 0, width, 0] },
    {
      kind: "rect",
      x: midX - PENALTY_BOX_WIDTH / 2,
      y: 0,
      width: PENALTY_BOX_WIDTH,
      height: PENALTY_BOX_DEPTH,
    },
    {
      kind: "rect",
      x: midX - GOAL_BOX_WIDTH / 2,
      y: 0,
      width: GOAL_BOX_WIDTH,
      height: GOAL_BOX_DEPTH,
    },
    { kind: "spot", cx: midX, cy: PENALTY_SPOT_DISTANCE },
    {
      kind: "arc",
      cx: midX,
      cy: PENALTY_SPOT_DISTANCE,
      radius: PENALTY_ARC_RADIUS,
      startAngleDeg: 90 - ARC_HALF_ANGLE_DEG,
      endAngleDeg: 90 + ARC_HALF_ANGLE_DEG,
    },
    {
      kind: "rect",
      x: midX - GOAL_WIDTH / 2,
      y: -GOAL_DEPTH,
      width: GOAL_WIDTH,
      height: GOAL_DEPTH,
    },
    { kind: "circle", cx: midX, cy: PENALTY_BOX_DEPTH + 36, radius: CENTER_CIRCLE_RADIUS },
  ];
}

function penaltyAreaMarkings(width: number): FieldMarking[] {
  const midX = width / 2;
  const goalLineY = 2;
  return [
    {
      kind: "rect",
      x: midX - PENALTY_BOX_WIDTH / 2,
      y: goalLineY,
      width: PENALTY_BOX_WIDTH,
      height: PENALTY_BOX_DEPTH,
    },
    {
      kind: "rect",
      x: midX - GOAL_BOX_WIDTH / 2,
      y: goalLineY,
      width: GOAL_BOX_WIDTH,
      height: GOAL_BOX_DEPTH,
    },
    { kind: "spot", cx: midX, cy: goalLineY + PENALTY_SPOT_DISTANCE },
    {
      kind: "arc",
      cx: midX,
      cy: goalLineY + PENALTY_SPOT_DISTANCE,
      radius: PENALTY_ARC_RADIUS,
      startAngleDeg: 90 - ARC_HALF_ANGLE_DEG,
      endAngleDeg: 90 + ARC_HALF_ANGLE_DEG,
    },
    {
      kind: "rect",
      x: midX - GOAL_WIDTH / 2,
      y: goalLineY - GOAL_DEPTH,
      width: GOAL_WIDTH,
      height: GOAL_DEPTH,
    },
    { kind: "line", points: [0, goalLineY, width, goalLineY] },
  ];
}

function goalAreaMarkings(width: number): FieldMarking[] {
  const midX = width / 2;
  const goalLineY = 2;
  return [
    {
      kind: "rect",
      x: midX - GOAL_BOX_WIDTH / 2,
      y: goalLineY,
      width: GOAL_BOX_WIDTH,
      height: GOAL_BOX_DEPTH,
    },
    {
      kind: "rect",
      x: midX - GOAL_WIDTH / 2,
      y: goalLineY - GOAL_DEPTH,
      width: GOAL_WIDTH,
      height: GOAL_DEPTH,
    },
    { kind: "line", points: [0, goalLineY, width, goalLineY] },
  ];
}

export const FIELD_TEMPLATES: FieldTemplateConfig[] = [
  {
    id: "full-pitch",
    label: "Ganzes Feld",
    description: "105 × 68 m",
    widthMeters: 105,
    heightMeters: 68,
    markings: fullPitchMarkings(105, 68),
    showMeterGrid: false,
  },
  {
    id: "half-pitch",
    label: "Halbfeld",
    description: "68 × 52.5 m",
    widthMeters: 68,
    heightMeters: 52.5,
    markings: halfPitchMarkings(68),
    showMeterGrid: false,
  },
  {
    id: "penalty-area",
    label: "16er",
    description: "Strafraum, ca. 46 × 21 m",
    widthMeters: 46,
    heightMeters: 21,
    markings: penaltyAreaMarkings(46),
    showMeterGrid: true,
    gridStepMeters: 5,
  },
  {
    id: "goal-area",
    label: "5er",
    description: "Torraum, ca. 24 × 11 m",
    widthMeters: 24,
    heightMeters: 11,
    markings: goalAreaMarkings(24),
    showMeterGrid: true,
    gridStepMeters: 2,
  },
  {
    id: "custom",
    label: "Individueller Bereich",
    description: "Frei wählbare Größe, z.B. 5 × 2 m",
    widthMeters: 5,
    heightMeters: 2,
    markings: [],
    showMeterGrid: true,
    gridStepMeters: 0.5,
    allowCustomDimensions: true,
  },
];

export function getFieldTemplate(id: FieldTemplateId): FieldTemplateConfig {
  const template = FIELD_TEMPLATES.find((t) => t.id === id);
  if (!template) {
    throw new Error(`Unknown field template: ${id}`);
  }
  return template;
}

export function computeGridStep(maxDimensionMeters: number): number {
  if (maxDimensionMeters <= 6) return 0.5;
  if (maxDimensionMeters <= 20) return 1;
  return 5;
}
