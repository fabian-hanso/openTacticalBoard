// Renders a dribble arrow as a zigzag line between two points. The zigzag is
// purely a rendering detail derived from start/end — only the endpoints are stored.
export function buildZigzagPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments = 8,
  amplitude = 6
): number[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length; // unit normal
  const ny = dx / length;

  const points: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;
    const isEdge = i === 0 || i === segments;
    const offset = isEdge ? 0 : amplitude * (i % 2 === 0 ? 1 : -1);
    points.push(baseX + nx * offset, baseY + ny * offset);
  }
  return points;
}
