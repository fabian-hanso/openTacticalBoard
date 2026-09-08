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
      className="flex shrink-0 items-center gap-1.5 rounded-md bg-chrome-accent px-2.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:px-3"
      title="Export PNG"
    >
      <Download size={16} />
      <span className="hidden sm:inline">Export PNG</span>
    </button>
  );
}
