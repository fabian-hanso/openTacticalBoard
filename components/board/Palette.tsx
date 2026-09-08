"use client";

import {
  ArrowRight,
  Circle,
  Disc,
  Frame,
  Hand,
  MousePointer2,
  MoveRight,
  Pencil,
  Rows3,
  Slash,
  Triangle,
  Type,
  User,
  UserCog,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { OBJECT_REGISTRY, PALETTE_CATEGORIES } from "@/lib/objectRegistry";
import { useSessionStore, type ToolId } from "@/lib/store/useSessionStore";

const ICONS: Record<string, LucideIcon> = {
  goalkeeper: Hand,
  coach: UserCog,
  outfield: User,
  ball: Circle,
  cone: Triangle,
  "cone-flat": Disc,
  hurdle: Frame,
  pole: Slash,
  "agility-ladder": Rows3,
  "mini-goal": Frame,
  "text-label": Type,
  "arrow-run": ArrowRight,
  "arrow-pass": MoveRight,
  "arrow-dribble": Waves,
  "freehand-pencil": Pencil,
};

export function Palette() {
  const activeTool = useSessionStore((s) => s.activeTool);
  const setActiveTool = useSessionStore((s) => s.setActiveTool);

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col gap-4 overflow-y-auto border-r border-chrome-border bg-chrome-panel p-3">
      <button
        onClick={() => setActiveTool("select")}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          activeTool === "select"
            ? "bg-chrome-accent text-white"
            : "text-chrome-text hover:bg-chrome-hover"
        }`}
      >
        <MousePointer2 size={16} />
        Auswählen
      </button>

      {PALETTE_CATEGORIES.map((category) => (
        <div key={category.id} className="flex flex-col gap-1">
          <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-chrome-muted">
            {category.label}
          </h3>
          <div className="flex flex-col gap-1">
            {Object.entries(OBJECT_REGISTRY)
              .filter(([, entry]) => entry.category === category.id)
              .map(([id, entry]) => {
                const Icon = ICONS[id] ?? Circle;
                const isActive = activeTool === (id as ToolId);
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTool(id as ToolId)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-chrome-accent text-white"
                        : "text-chrome-text hover:bg-chrome-hover"
                    }`}
                  >
                    <Icon size={16} color={isActive ? "#ffffff" : entry.color} strokeWidth={2.25} />
                    {entry.paletteLabel}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </aside>
  );
}
