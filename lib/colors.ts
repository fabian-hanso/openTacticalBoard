// Saturated colors reserved for movable items — kept out of the gray UI chrome
// (see app/globals.css) so objects always pop against the field.
export const ROLE_COLORS = {
  goalkeeper: "#eab308", // amber — matches real goalkeeper jersey convention
  coach: "#3b82f6", // blue
  outfield: "#ef4444", // red
} as const;

export const EQUIPMENT_COLORS = {
  ball: "#f8fafc",
  cone: "#f97316",
  "cone-flat": "#fb923c",
  hurdle: "#ea580c",
  pole: "#facc15",
  "agility-ladder": "#f59e0b",
  "mini-goal": "#c2410c",
} as const;

export const ARROW_COLORS = {
  run: "#475569",
  pass: "#2563eb",
  dribble: "#9333ea",
} as const;

export const TEXT_COLOR = "#1f2937";
export const FREEHAND_COLOR = "#0f766e";

export const FIELD_GRASS = "#48584f";
export const FIELD_LINES = "rgba(241, 245, 249, 0.75)";
export const FIELD_GRID = "rgba(241, 245, 249, 0.18)";
