"use client";

import type Konva from "konva";
import { useEffect, useState } from "react";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { BoardCanvas } from "./BoardCanvas";
import { Palette } from "./Palette";
import { SceneStrip } from "./SceneStrip";
import { TemplateDialog } from "./TemplateDialog";
import { Toolbar } from "./Toolbar";

export default function BoardShell() {
  const hasHydrated = useSessionStore((s) => s.hasHydrated);
  const scene = useSessionStore((s) => s.activeScene());
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [stage, setStage] = useState<Konva.Stage | null>(null);

  useEffect(() => {
    useSessionStore.persist.rehydrate();
  }, []);

  if (!hasHydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-chrome-bg text-sm text-chrome-muted">
        Lade Taktikboard…
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-chrome-bg">
      <Toolbar onOpenTemplateDialog={() => setTemplateDialogOpen(true)} stage={stage} />
      <div className="flex min-h-0 flex-1">
        <Palette />
        <main className="min-w-0 flex-1">
          <BoardCanvas key={scene.id} scene={scene} stageContainerRef={setStage} />
        </main>
      </div>
      <SceneStrip />
      <TemplateDialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} />
    </div>
  );
}
