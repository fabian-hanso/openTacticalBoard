import type Konva from "konva";

export function exportStageAsPng(stage: Konva.Stage, filename: string) {
  // Export always captures the full scene at its default fit, regardless of
  // whatever zoom/pan the coach currently has on screen.
  const previousScale = { x: stage.scaleX(), y: stage.scaleY() };
  const previousPosition = { x: stage.x(), y: stage.y() };
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  stage.batchDraw();

  const canvas = stage.toCanvas({ pixelRatio: 3 });

  stage.scale(previousScale);
  stage.position(previousPosition);
  stage.batchDraw();

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}
