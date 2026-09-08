"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FIELD_TEMPLATES } from "@/lib/fieldTemplates";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { FieldTemplateId } from "@/lib/types/field";

export function TemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const scene = useSessionStore((s) => s.activeScene());
  const setSceneTemplate = useSessionStore((s) => s.setSceneTemplate);
  const [customW, setCustomW] = useState(scene.customDimensions?.widthMeters ?? 5);
  const [customH, setCustomH] = useState(scene.customDimensions?.heightMeters ?? 2);

  if (!open) return null;

  function choose(id: FieldTemplateId) {
    if (id === "custom") {
      setSceneTemplate(id, { widthMeters: customW, heightMeters: customH });
    } else {
      setSceneTemplate(id);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-chrome-border bg-chrome-panel p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-chrome-text">Feldvorlage wählen</h2>
          <button onClick={onClose} className="text-chrome-muted hover:text-chrome-text">
            <X size={18} />
          </button>
        </div>
        <p className="mb-3 text-xs text-chrome-muted">Ein Wechsel der Vorlage leert die aktuelle Szene.</p>
        <div className="flex flex-col gap-2">
          {FIELD_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => choose(tpl.id)}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                scene.templateId === tpl.id
                  ? "border-chrome-accent bg-chrome-hover"
                  : "border-chrome-border hover:bg-chrome-hover"
              }`}
            >
              <span className="font-medium text-chrome-text">{tpl.label}</span>
              <span className="text-xs text-chrome-muted">{tpl.description}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-end gap-2 border-t border-chrome-border pt-3">
          <label className="flex flex-col text-xs text-chrome-muted">
            Breite (m)
            <input
              type="number"
              min={1}
              max={30}
              step={0.5}
              value={customW}
              onChange={(e) => setCustomW(Number(e.target.value))}
              className="mt-1 w-20 rounded border border-chrome-border bg-chrome-bg px-2 py-1 text-chrome-text"
            />
          </label>
          <label className="flex flex-col text-xs text-chrome-muted">
            Höhe (m)
            <input
              type="number"
              min={1}
              max={30}
              step={0.5}
              value={customH}
              onChange={(e) => setCustomH(Number(e.target.value))}
              className="mt-1 w-20 rounded border border-chrome-border bg-chrome-bg px-2 py-1 text-chrome-text"
            />
          </label>
          <button
            onClick={() => choose("custom")}
            className="ml-auto rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-white"
          >
            Individuell anwenden
          </button>
        </div>
      </div>
    </div>
  );
}
