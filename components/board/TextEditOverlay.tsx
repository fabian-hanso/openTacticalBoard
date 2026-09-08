"use client";

import type Konva from "konva";
import { useEffect, useRef, useState } from "react";

interface Props {
  stage: Konva.Stage | null;
  node: Konva.Node | null;
  initialValue: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

export function TextEditOverlay({ stage, node, initialValue, onCommit, onCancel }: Props) {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, []);

  if (!stage || !node) return null;

  const containerRect = stage.container().getBoundingClientRect();
  const absPos = node.getAbsolutePosition();
  const scale = stage.scaleX();
  const textNode = node as unknown as { fontSize?: () => number; fill?: () => string };
  const fontSize = (textNode.fontSize ? textNode.fontSize() : 16) * scale;

  const style: React.CSSProperties = {
    position: "fixed",
    top: containerRect.top + stage.y() + absPos.y * scale - fontSize * 0.15,
    left: containerRect.left + stage.x() + absPos.x * scale,
    fontSize,
    color: textNode.fill ? textNode.fill() : "#111827",
    background: "rgba(255,255,255,0.97)",
    border: "1px solid #94a3b8",
    borderRadius: 4,
    padding: "1px 6px",
    minWidth: 60,
    fontFamily: "inherit",
    fontWeight: 600,
    lineHeight: 1.2,
    zIndex: 50,
    resize: "none",
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      style={style}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value.trim() || "Text")}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onCommit(value.trim() || "Text");
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
      }}
      rows={1}
    />
  );
}
