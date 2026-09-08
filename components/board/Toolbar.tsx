"use client";

import type Konva from "konva";
import { Menu, Trash2 } from "lucide-react";
import { getFieldTemplate } from "@/lib/fieldTemplates";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { ExportButton } from "./ExportButton";

export function Toolbar({
  onOpenTemplateDialog,
  onOpenPalette,
  stage,
}: {
  onOpenTemplateDialog: () => void;
  onOpenPalette: () => void;
  stage: Konva.Stage | null;
}) {
  const scene = useSessionStore((s) => s.activeScene());
  const selectedItemIds = useSessionStore((s) => s.selectedItemIds);
  const removeSelectedItems = useSessionStore((s) => s.removeSelectedItems);
  const template = getFieldTemplate(scene.templateId);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-chrome-border bg-chrome-panel px-2 sm:gap-3 sm:px-4">
      <button
        onClick={onOpenPalette}
        className="rounded-md p-2 text-chrome-text transition-colors hover:bg-chrome-hover md:hidden"
        title="Werkzeuge"
      >
        <Menu size={18} />
      </button>
      <span className="hidden truncate text-sm font-semibold text-chrome-text sm:inline">
        Torwarttrainer Taktikboard
      </span>
      <div className="hidden h-6 w-px bg-chrome-border sm:block" />
      <button
        onClick={onOpenTemplateDialog}
        className="shrink-0 rounded-md bg-chrome-bg px-2.5 py-1.5 text-sm text-chrome-text transition-colors hover:bg-chrome-hover sm:px-3"
      >
        <span className="hidden sm:inline">Feld: </span>
        {template.label}
      </button>
      <div className="flex-1" />
      <button
        disabled={selectedItemIds.length === 0}
        onClick={removeSelectedItems}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-chrome-text transition-colors enabled:hover:bg-chrome-hover enabled:hover:text-red-400 disabled:opacity-40 sm:px-3"
      >
        <Trash2 size={16} />
        <span className="hidden sm:inline">Löschen</span>
        {selectedItemIds.length > 1 && <span>({selectedItemIds.length})</span>}
      </button>
      <ExportButton stage={stage} sceneName={scene.name} />
    </header>
  );
}
