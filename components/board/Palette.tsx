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

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.7;
}

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

export function Palette({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const activeTool = useSessionStore((s) => s.activeTool);
  const setActiveTool = useSessionStore((s) => s.setActiveTool);

  function choose(tool: ToolId) {
    setActiveTool(tool);
    onCloseMobile();
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onCloseMobile} />}
      <aside
        className={`${
          mobileOpen ? "flex" : "hidden"
        } fixed inset-y-0 left-0 z-50 w-64 shrink-0 flex-col gap-4 overflow-y-auto border-r border-chrome-border bg-chrome-panel p-3 md:static md:z-auto md:flex md:w-56`}
      >
        <button
          onClick={() => choose("select")}
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
                  const needsChip = !isActive && isLightColor(entry.color);
                  return (
                    <button
                      key={id}
                      onClick={() => choose(id as ToolId)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-chrome-accent text-white"
                          : "text-chrome-text hover:bg-chrome-hover"
                      }`}
                    >
                      {needsChip ? (
                        <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded bg-slate-800">
                          <Icon size={14} color={entry.color} strokeWidth={2.25} />
                        </span>
                      ) : (
                        <Icon size={16} color={isActive ? "#ffffff" : entry.color} strokeWidth={2.25} />
                      )}
                      {entry.paletteLabel}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </aside>
    </>
  );
}
