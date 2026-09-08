"use client";

import { Copy, SendToBack, BringToFront, Trash2 } from "lucide-react";

interface Props {
  x: number;
  y: number;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const MENU_WIDTH = 190;

export function ItemContextMenu({ x, y, onDuplicate, onBringToFront, onSendToBack, onDelete, onClose }: Props) {
  const left = typeof window !== "undefined" ? Math.min(x, window.innerWidth - MENU_WIDTH - 8) : x;
  const top = typeof window !== "undefined" ? Math.min(y, window.innerHeight - 180) : y;

  function run(action: () => void) {
    action();
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        className="fixed z-50 flex w-48 flex-col overflow-hidden rounded-md border border-chrome-border bg-chrome-panel py-1 shadow-xl"
        style={{ left, top }}
      >
        <button
          onClick={() => run(onDuplicate)}
          className="flex items-center gap-2 px-3 py-2 text-left text-sm text-chrome-text hover:bg-chrome-hover"
        >
          <Copy size={15} /> Duplizieren
        </button>
        <button
          onClick={() => run(onBringToFront)}
          className="flex items-center gap-2 px-3 py-2 text-left text-sm text-chrome-text hover:bg-chrome-hover"
        >
          <BringToFront size={15} /> In den Vordergrund
        </button>
        <button
          onClick={() => run(onSendToBack)}
          className="flex items-center gap-2 px-3 py-2 text-left text-sm text-chrome-text hover:bg-chrome-hover"
        >
          <SendToBack size={15} /> In den Hintergrund
        </button>
        <div className="my-1 h-px bg-chrome-border" />
        <button
          onClick={() => run(onDelete)}
          className="flex items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-chrome-hover"
        >
          <Trash2 size={15} /> Löschen
        </button>
      </div>
    </>
  );
}
