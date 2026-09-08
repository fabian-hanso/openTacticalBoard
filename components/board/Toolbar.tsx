"use client";

import type Konva from "konva";
import { Trash2 } from "lucide-react";
import { getFieldTemplate } from "@/lib/fieldTemplates";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { ExportButton } from "./ExportButton";

export function Toolbar({
  onOpenTemplateDialog,
  stage,
}: {
  onOpenTemplateDialog: () => void;
  stage: Konva.Stage | null;
}) {
  const scene = useSessionStore((s) => s.activeScene());
  const selectedItemId = useSessionStore((s) => s.selectedItemId);
  const removeSelectedItem = useSessionStore((s) => s.removeSelectedItem);
  const template = getFieldTemplate(scene.templateId);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-chrome-border bg-chrome-panel px-4">
      <span className="text-sm font-semibold text-chrome-text">Torwarttrainer Taktikboard</span>
      <div className="h-6 w-px bg-chrome-border" />
      <button
        onClick={onOpenTemplateDialog}
        className="rounded-md bg-chrome-bg px-3 py-1.5 text-sm text-chrome-text transition-colors hover:bg-chrome-hover"
      >
        Feld: {template.label}
      </button>
      <div className="flex-1" />
      <button
        disabled={!selectedItemId}
        onClick={removeSelectedItem}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-chrome-text transition-colors enabled:hover:bg-chrome-hover enabled:hover:text-red-400 disabled:opacity-40"
      >
        <Trash2 size={16} /> Löschen
      </button>
      <ExportButton stage={stage} sceneName={scene.name} />
    </header>
  );
}
