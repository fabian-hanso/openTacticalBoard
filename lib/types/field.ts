export type FieldTemplateId =
  | "full-pitch"
  | "half-pitch"
  | "penalty-area"
  | "goal-area"
  | "custom";

export type FieldMarking =
  | { kind: "line"; points: [number, number, number, number] }
  | { kind: "rect"; x: number; y: number; width: number; height: number }
  | { kind: "circle"; cx: number; cy: number; radius: number }
  | { kind: "spot"; cx: number; cy: number }
  | {
      kind: "arc";
      cx: number;
      cy: number;
      radius: number;
      startAngleDeg: number;
      endAngleDeg: number;
    };

export interface FieldTemplateConfig {
  id: FieldTemplateId;
  label: string;
  description: string;
  widthMeters: number;
  heightMeters: number;
  markings: FieldMarking[];
  showMeterGrid: boolean;
  gridStepMeters?: number;
  allowCustomDimensions?: boolean;
}
