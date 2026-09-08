"use client";

import type Konva from "konva";
import { Download } from "lucide-react";
import { exportStageAsPng } from "@/lib/export/exportPng";
import { useSessionStore } from "@/lib/store/useSessionStore";

export function ExportButton({ stage, sceneName }: { stage: Konva.Stage | null; sceneName: string }) {
  const selectItem = useSessionStore((s) => s.selectItem);

  function handleExport() {
    if (!stage) return;
    selectItem(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const safeName = sceneName.replace(/[^a-z0-9äöüß_-]+/gi, "_") || "szene";
        exportStageAsPng(stage, `${safeName}.png`);
      });
    });
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1.5 rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      <Download size={16} /> Export PNG
    </button>
  );
}
