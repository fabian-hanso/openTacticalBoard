"use client";

import { useEffect } from "react";
import { useSessionStore } from "../store/useSessionStore";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const removeSelectedItems = useSessionStore((s) => s.removeSelectedItems);
  const selectItem = useSessionStore((s) => s.selectItem);
  const setActiveTool = useSessionStore((s) => s.setActiveTool);
  const copySelectedItems = useSessionStore((s) => s.copySelectedItems);
  const pasteClipboard = useSessionStore((s) => s.pasteClipboard);
  const setSelection = useSessionStore((s) => s.setSelection);
  const activeScene = useSessionStore((s) => s.activeScene);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelectedItems();
      } else if (e.key === "Escape") {
        selectItem(null);
        setActiveTool("select");
      } else if (cmdOrCtrl && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelectedItems();
      } else if (cmdOrCtrl && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteClipboard();
      } else if (cmdOrCtrl && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelection(activeScene().items.map((it) => it.id));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [removeSelectedItems, selectItem, setActiveTool, copySelectedItems, pasteClipboard, setSelection, activeScene]);
}
