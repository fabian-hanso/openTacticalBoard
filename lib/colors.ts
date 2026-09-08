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
  "mini-goal": "#e2e8f0", // light "post white" — also fixes poor contrast on grass (was 1.46)
} as const;

// Chosen against FIELD_GRASS below: WCAG contrast ratio ≥ 4.0 each (the old
// slate/blue/purple set was ~1.0-1.5 — nearly invisible on the grass green).
export const ARROW_COLORS = {
  run: "#22d3ee", // cyan
  pass: "#c4b5fd", // violet
  dribble: "#bef264", // lime
} as const;

export const TEXT_COLOR = "#1f2937";
export const FREEHAND_COLOR = "#f0abfc"; // fuchsia — old teal was ~1.4 contrast on grass

export const FIELD_GRASS = "#48584f";
export const FIELD_LINES = "rgba(241, 245, 249, 0.75)";
export const FIELD_GRID = "rgba(241, 245, 249, 0.18)";
