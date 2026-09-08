"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { OBJECT_REGISTRY } from "../objectRegistry";
import type { FieldTemplateId } from "../types/field";
import type { Scene, SceneItem, Session } from "../types/scene";

export type ToolId = "select" | keyof typeof OBJECT_REGISTRY;

function createEmptyScene(name: string, templateId: FieldTemplateId = "penalty-area"): Scene {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name,
    templateId,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createInitialSession(): Session {
  const scene = createEmptyScene("Szene 1");
  return {
    id: crypto.randomUUID(),
    scenes: [scene],
    activeSceneId: scene.id,
    updatedAt: Date.now(),
  };
}

interface SessionState {
  session: Session;
  activeTool: ToolId;
  selectedItemIds: string[];
  hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  setActiveTool: (tool: ToolId) => void;
  selectItem: (id: string | null) => void;
  toggleItemSelection: (id: string) => void;
  setSelection: (ids: string[]) => void;

  activeScene: () => Scene;
  addItem: (item: SceneItem) => void;
  updateItem: (id: string, patch: Partial<SceneItem>) => void;
  removeItem: (id: string) => void;
  removeSelectedItems: () => void;
  moveSelectedItemsBy: (dxMeters: number, dyMeters: number) => void;
  duplicateItem: (id: string) => void;
  bringItemToFront: (id: string) => void;
  sendItemToBack: (id: string) => void;

  clipboardItems: SceneItem[];
  clipboardPasteCount: number;
  copySelectedItems: () => void;
  pasteClipboard: () => void;

  setSceneTemplate: (templateId: FieldTemplateId, customDimensions?: { widthMeters: number; heightMeters: number }) => void;

  addScene: () => void;
  duplicateScene: (sceneId: string) => void;
  deleteScene: (sceneId: string) => void;
  setActiveScene: (sceneId: string) => void;
  renameScene: (sceneId: string, name: string) => void;
  reorderScenes: (fromIndex: number, toIndex: number) => void;
}

function touchScene(scene: Scene): Scene {
  return { ...scene, updatedAt: Date.now() };
}

const DUPLICATE_OFFSET_METERS = 0.4;

function offsetItem(item: SceneItem, dx: number, dy: number): SceneItem {
  switch (item.kind) {
    case "arrow":
      return { ...item, x: item.x + dx, y: item.y + dy, endX: item.endX + dx, endY: item.endY + dy };
    case "freehand":
      return { ...item, points: item.points.map((v, i) => v + (i % 2 === 0 ? dx : dy)) };
    default:
      return { ...item, x: item.x + dx, y: item.y + dy };
  }
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: createInitialSession(),
      activeTool: "select",
      selectedItemIds: [],
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setActiveTool: (tool) => set({ activeTool: tool, selectedItemIds: [] }),
      selectItem: (id) => set({ selectedItemIds: id ? [id] : [] }),
      toggleItemSelection: (id) =>
        set((state) => ({
          selectedItemIds: state.selectedItemIds.includes(id)
            ? state.selectedItemIds.filter((x) => x !== id)
            : [...state.selectedItemIds, id],
        })),
      setSelection: (ids) => set({ selectedItemIds: ids }),

      activeScene: () => {
        const { session } = get();
        const scene = session.scenes.find((s) => s.id === session.activeSceneId);
        return scene ?? session.scenes[0];
      },

      addItem: (item) =>
        set((state) => {
          const scenes = state.session.scenes.map((scene) =>
            scene.id === state.session.activeSceneId
              ? touchScene({ ...scene, items: [...scene.items, item] })
              : scene
          );
          return { session: { ...state.session, scenes, updatedAt: Date.now() } };
        }),

      updateItem: (id, patch) =>
        set((state) => {
          const scenes = state.session.scenes.map((scene) =>
            scene.id === state.session.activeSceneId
              ? touchScene({
                  ...scene,
                  items: scene.items.map((it) =>
                    it.id === id ? ({ ...it, ...patch } as SceneItem) : it
                  ),
                })
              : scene
          );
          return { session: { ...state.session, scenes, updatedAt: Date.now() } };
        }),

      removeItem: (id) =>
        set((state) => {
          const scenes = state.session.scenes.map((scene) =>
            scene.id === state.session.activeSceneId
              ? touchScene({ ...scene, items: scene.items.filter((it) => it.id !== id) })
              : scene
          );
          return {
            session: { ...state.session, scenes, updatedAt: Date.now() },
            selectedItemIds: state.selectedItemIds.filter((x) => x !== id),
          };
        }),

      removeSelectedItems: () =>
        set((state) => {
          const ids = new Set(state.selectedItemIds);
          if (ids.size === 0) return state;
          const scenes = state.session.scenes.map((scene) =>
            scene.id === state.session.activeSceneId
              ? touchScene({ ...scene, items: scene.items.filter((it) => !ids.has(it.id)) })
              : scene
          );
          return {
            session: { ...state.session, scenes, updatedAt: Date.now() },
            selectedItemIds: [],
          };
        }),

      moveSelectedItemsBy: (dxMeters, dyMeters) =>
        set((state) => {
          const ids = new Set(state.selectedItemIds);
          if (ids.size === 0) return state;
          const scenes = state.session.scenes.map((scene) =>
            scene.id === state.session.activeSceneId
              ? touchScene({
                  ...scene,
                  items: scene.items.map((it) => (ids.has(it.id) ? offsetItem(it, dxMeters, dyMeters) : it)),
                })
              : scene
          );
          return { session: { ...state.session, scenes, updatedAt: Date.now() } };
        }),

      duplicateItem: (id) =>
        set((state) => {
          let newId: string | null = null;
          const scenes = state.session.scenes.map((scene) => {
            if (scene.id !== state.session.activeSceneId) return scene;
            const index = scene.items.findIndex((it) => it.id === id);
            if (index === -1) return scene;
            const copy = offsetItem(
              { ...scene.items[index], id: crypto.randomUUID() },
              DUPLICATE_OFFSET_METERS,
              DUPLICATE_OFFSET_METERS
            );
            newId = copy.id;
            const items = [...scene.items];
            items.splice(index + 1, 0, copy);
            return touchScene({ ...scene, items });
          });
          return {
            session: { ...state.session, scenes, updatedAt: Date.now() },
            selectedItemIds: newId ? [newId] : state.selectedItemIds,
          };
        }),

      bringItemToFront: (id) =>
        set((state) => {
          const scenes = state.session.scenes.map((scene) => {
            if (scene.id !== state.session.activeSceneId) return scene;
            const item = scene.items.find((it) => it.id === id);
            if (!item) return scene;
            return touchScene({ ...scene, items: [...scene.items.filter((it) => it.id !== id), item] });
          });
          return { session: { ...state.session, scenes, updatedAt: Date.now() } };
        }),

      sendItemToBack: (id) =>
        set((state) => {
          const scenes = state.session.scenes.map((scene) => {
            if (scene.id !== state.session.activeSceneId) return scene;
            const item = scene.items.find((it) => it.id === id);
            if (!item) return scene;
            return touchScene({ ...scene, items: [item, ...scene.items.filter((it) => it.id !== id)] });
          });
          return { session: { ...state.session, scenes, updatedAt: Date.now() } };
        }),

      clipboardItems: [],
      clipboardPasteCount: 0,

      copySelectedItems: () => {
        const { selectedItemIds, session } = get();
        if (selectedItemIds.length === 0) return;
        const scene = session.scenes.find((s) => s.id === session.activeSceneId);
        if (!scene) return;
        const idSet = new Set(selectedItemIds);
        const items = scene.items.filter((it) => idSet.has(it.id));
        if (items.length === 0) return;
        set({ clipboardItems: items, clipboardPasteCount: 0 });
      },

      pasteClipboard: () =>
        set((state) => {
          if (state.clipboardItems.length === 0) return state;
          const nextCount = state.clipboardPasteCount + 1;
          const offset = DUPLICATE_OFFSET_METERS * nextCount;
          const newItems = state.clipboardItems.map((it) =>
            offsetItem({ ...it, id: crypto.randomUUID() }, offset, offset)
          );
          const scenes = state.session.scenes.map((scene) =>
            scene.id === state.session.activeSceneId
              ? touchScene({ ...scene, items: [...scene.items, ...newItems] })
              : scene
          );
          return {
            session: { ...state.session, scenes, updatedAt: Date.now() },
            selectedItemIds: newItems.map((it) => it.id),
            clipboardPasteCount: nextCount,
          };
        }),

      setSceneTemplate: (templateId, customDimensions) =>
        set((state) => {
          const scenes = state.session.scenes.map((scene) =>
            scene.id === state.session.activeSceneId
              ? touchScene({ ...scene, templateId, customDimensions, items: [] })
              : scene
          );
          return { session: { ...state.session, scenes, updatedAt: Date.now() }, selectedItemIds: [] };
        }),

      addScene: () =>
        set((state) => {
          const activeIndex = state.session.scenes.findIndex(
            (s) => s.id === state.session.activeSceneId
          );
          const template =
            state.session.scenes[activeIndex]?.templateId ?? "penalty-area";
          const newScene = createEmptyScene(
            `Szene ${state.session.scenes.length + 1}`,
            template
          );
          const scenes = [...state.session.scenes];
          scenes.splice(activeIndex + 1, 0, newScene);
          return {
            session: { ...state.session, scenes, activeSceneId: newScene.id, updatedAt: Date.now() },
            selectedItemIds: [],
          };
        }),

      duplicateScene: (sceneId) =>
        set((state) => {
          const index = state.session.scenes.findIndex((s) => s.id === sceneId);
          if (index === -1) return state;
          const original = state.session.scenes[index];
          const copy: Scene = {
            ...original,
            id: crypto.randomUUID(),
            name: `${original.name} (Kopie)`,
            items: original.items.map((it) => ({ ...it, id: crypto.randomUUID() })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const scenes = [...state.session.scenes];
          scenes.splice(index + 1, 0, copy);
          return {
            session: { ...state.session, scenes, activeSceneId: copy.id, updatedAt: Date.now() },
          };
        }),

      deleteScene: (sceneId) =>
        set((state) => {
          if (state.session.scenes.length <= 1) return state;
          const index = state.session.scenes.findIndex((s) => s.id === sceneId);
          const scenes = state.session.scenes.filter((s) => s.id !== sceneId);
          const wasActive = state.session.activeSceneId === sceneId;
          const nextActive = wasActive
            ? scenes[Math.max(0, index - 1)].id
            : state.session.activeSceneId;
          return {
            session: { ...state.session, scenes, activeSceneId: nextActive, updatedAt: Date.now() },
            selectedItemIds: [],
          };
        }),

      setActiveScene: (sceneId) =>
        set({ selectedItemIds: [], session: { ...get().session, activeSceneId: sceneId } }),

      renameScene: (sceneId, name) =>
        set((state) => ({
          session: {
            ...state.session,
            scenes: state.session.scenes.map((s) => (s.id === sceneId ? { ...s, name } : s)),
          },
        })),

      reorderScenes: (fromIndex, toIndex) =>
        set((state) => {
          const scenes = [...state.session.scenes];
          const [moved] = scenes.splice(fromIndex, 1);
          scenes.splice(toIndex, 0, moved);
          return { session: { ...state.session, scenes, updatedAt: Date.now() } };
        }),
    }),
    {
      name: "torwart-taktikboard-session-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      version: 1,
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
