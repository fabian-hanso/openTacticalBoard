"use client";

import { useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useSessionStore } from "@/lib/store/useSessionStore";

export function SceneStrip() {
  const scenes = useSessionStore((s) => s.session.scenes);
  const activeSceneId = useSessionStore((s) => s.session.activeSceneId);
  const setActiveScene = useSessionStore((s) => s.setActiveScene);
  const addScene = useSessionStore((s) => s.addScene);
  const duplicateScene = useSessionStore((s) => s.duplicateScene);
  const deleteScene = useSessionStore((s) => s.deleteScene);
  const renameScene = useSessionStore((s) => s.renameScene);
  const reorderScenes = useSessionStore((s) => s.reorderScenes);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  return (
    <footer className="flex h-24 shrink-0 items-center gap-2 overflow-x-auto border-t border-chrome-border bg-chrome-panel px-3 py-2">
      {scenes.map((scene, index) => (
        <div
          key={scene.id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && dragIndex !== index) reorderScenes(dragIndex, index);
            setDragIndex(null);
          }}
          onClick={() => setActiveScene(scene.id)}
          className={`group relative flex h-full w-32 shrink-0 cursor-pointer flex-col justify-between rounded-md border px-2 py-1.5 text-left transition-colors ${
            scene.id === activeSceneId
              ? "border-chrome-accent bg-chrome-hover"
              : "border-chrome-border bg-chrome-bg hover:bg-chrome-hover"
          }`}
        >
          <input
            value={scene.name}
            onChange={(e) => renameScene(scene.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full truncate bg-transparent text-xs font-medium text-chrome-text outline-none"
          />
          <span className="text-[10px] text-chrome-muted">{scene.items.length} Objekte</span>
          <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateScene(scene.id);
              }}
              className="rounded bg-chrome-panel/90 p-1 text-chrome-text hover:text-white"
              title="Duplizieren"
            >
              <Copy size={12} />
            </button>
            {scenes.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteScene(scene.id);
                }}
                className="rounded bg-chrome-panel/90 p-1 text-chrome-text hover:text-red-400"
                title="Löschen"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        onClick={addScene}
        className="flex h-full w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-chrome-border text-chrome-muted transition-colors hover:border-chrome-accent hover:text-chrome-accent"
      >
        <Plus size={18} />
        <span className="text-[10px]">Neu</span>
      </button>
    </footer>
  );
}
