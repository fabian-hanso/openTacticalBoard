// Pixels-per-meter is always uniform across both axes so field proportions
// stay correct regardless of screen size or crop (5x2m vs 105x68m).
export function computeFitScale(
  containerWidth: number,
  containerHeight: number,
  widthMeters: number,
  heightMeters: number,
  paddingPx = 24
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 1;
  const usableWidth = Math.max(containerWidth - paddingPx * 2, 1);
  const usableHeight = Math.max(containerHeight - paddingPx * 2, 1);
  return Math.min(usableWidth / widthMeters, usableHeight / heightMeters);
}

// Extra meters of margin around every template so markings that extend past
// the nominal field box (e.g. goals sitting outside the pitch outline) stay visible.
export const FIELD_MARGIN_METERS = 3;

export function meterToScreen(xMeters: number, yMeters: number, ppm: number, offsetPx: number) {
  return { x: offsetPx + xMeters * ppm, y: offsetPx + yMeters * ppm };
}

export function screenToMeter(xPx: number, yPx: number, ppm: number, offsetPx: number) {
  return { x: (xPx - offsetPx) / ppm, y: (yPx - offsetPx) / ppm };
}
