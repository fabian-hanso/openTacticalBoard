"use client";

import { useEffect } from "react";
import { useSessionStore } from "../store/useSessionStore";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable;
}

export function useKeyboardShortcuts() {
  const removeSelectedItem = useSessionStore((s) => s.removeSelectedItem);
  const selectItem = useSessionStore((s) => s.selectItem);
  const setActiveTool = useSessionStore((s) => s.setActiveTool);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeSelectedItem();
      } else if (e.key === "Escape") {
        selectItem(null);
        setActiveTool("select");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [removeSelectedItem, selectItem, setActiveTool]);
}
