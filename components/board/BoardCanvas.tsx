"use client";

import type Konva from "konva";
import { Maximize2, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Rect, Stage, Transformer, Group as KonvaGroupReact } from "react-konva";
import { getFieldTemplate } from "@/lib/fieldTemplates";
import { FIELD_MARGIN_METERS, computeFitScale, screenToMeter } from "@/lib/geometry/ppm";
import { useContainerSize } from "@/lib/hooks/useContainerSize";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { OBJECT_REGISTRY, getRegistryKeyForItem } from "@/lib/objectRegistry";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type {
  ArrowItem,
  EquipmentItem,
  FreehandItem,
  PlayerItem,
  Scene,
  SceneItem,
  TextItem,
} from "@/lib/types/scene";
import { FieldBackground } from "./FieldBackground";
import { ItemContextMenu } from "./ItemContextMenu";
import { ArrowShape } from "./items/ArrowShape";
import { EquipmentShape } from "./items/EquipmentShape";
import { FreehandShape } from "./items/FreehandShape";
import { PlayerShape } from "./items/PlayerShape";
import { TextItemShape } from "./items/TextItemShape";
import { TextEditOverlay } from "./TextEditOverlay";

const FREEHAND_MIN_STEP_METERS = 0.05;
const MIN_DRAG_DISTANCE_METERS = 0.15;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_WHEEL_FACTOR = 1.08;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

interface DrawingState {
  type: "arrow";
  arrowType: "run" | "pass" | "dribble";
  start: { x: number; y: number };
  end: { x: number; y: number };
}

interface FreehandDrawingState {
  type: "freehand";
  points: number[];
}

interface MarqueeDrag {
  x0: number;
  y0: number;
  additive: boolean;
}

interface MarqueeRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface BoardCanvasHandle {
  stage: Konva.Stage | null;
}

// The reference point used both for group-drag rest positions (pixels) and
// for marquee hit-testing (meters) — kept consistent per item kind.
function itemAnchorMeters(item: SceneItem): { x: number; y: number } {
  if (item.kind === "arrow") return { x: (item.x + item.endX) / 2, y: (item.y + item.endY) / 2 };
  if (item.kind === "freehand") return { x: item.points[0] ?? 0, y: item.points[1] ?? 0 };
  return { x: item.x, y: item.y };
}

export function BoardCanvas({ scene, stageContainerRef }: { scene: Scene; stageContainerRef: (stage: Konva.Stage | null) => void }) {
  useKeyboardShortcuts();

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>();
  const activeTool = useSessionStore((s) => s.activeTool);
  const setActiveTool = useSessionStore((s) => s.setActiveTool);
  const selectedItemIds = useSessionStore((s) => s.selectedItemIds);
  const selectItem = useSessionStore((s) => s.selectItem);
  const toggleItemSelection = useSessionStore((s) => s.toggleItemSelection);
  const setSelection = useSessionStore((s) => s.setSelection);
  const addItem = useSessionStore((s) => s.addItem);
  const updateItem = useSessionStore((s) => s.updateItem);
  const moveSelectedItemsBy = useSessionStore((s) => s.moveSelectedItemsBy);
  const removeItem = useSessionStore((s) => s.removeItem);
  const duplicateItem = useSessionStore((s) => s.duplicateItem);
  const bringItemToFront = useSessionStore((s) => s.bringItemToFront);
  const sendItemToBack = useSessionStore((s) => s.sendItemToBack);

  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const nodeMap = useRef(new Map<string, Konva.Node>());
  const drawingRef = useRef<DrawingState | FreehandDrawingState | null>(null);
  const marqueeDragRef = useRef<MarqueeDrag | null>(null);
  const panDragRef = useRef<{ startPointerPx: { x: number; y: number }; startView: { x: number; y: number } } | null>(
    null
  );
  const pinchRef = useRef<{ lastDist: number } | null>(null);
  const groupDragRef = useRef<{ leaderId: string; leaderRestPx: { x: number; y: number }; memberIds: string[] } | null>(
    null
  );
  const [drawingPreview, setDrawingPreview] = useState<DrawingState | FreehandDrawingState | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextNode, setEditingTextNode] = useState<Konva.Node | null>(null);
  const [stageNode, setStageNode] = useState<Konva.Stage | null>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);
  const [isSpacePanning, setIsSpacePanning] = useState(false);

  useEffect(() => {
    function isTyping(target: EventTarget | null) {
      return target instanceof HTMLElement && (target.tagName === "TEXTAREA" || target.tagName === "INPUT");
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Space" && !isTyping(e.target)) {
        e.preventDefault();
        setIsSpacePanning(true);
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") setIsSpacePanning(false);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const template = getFieldTemplate(scene.templateId);
  const widthMeters = scene.customDimensions?.widthMeters ?? template.widthMeters;
  const heightMeters = scene.customDimensions?.heightMeters ?? template.heightMeters;

  const ppm = useMemo(
    () =>
      computeFitScale(
        size.width,
        size.height,
        widthMeters + FIELD_MARGIN_METERS * 2,
        heightMeters + FIELD_MARGIN_METERS * 2
      ),
    [size.width, size.height, widthMeters, heightMeters]
  );
  // Center the padded field box in the container — a fixed margin-only offset
  // would hug the top-left corner whenever the field's aspect ratio doesn't
  // match the canvas's (e.g. a wide field in a tall mobile-portrait canvas).
  const paddedWidthPx = (widthMeters + FIELD_MARGIN_METERS * 2) * ppm;
  const paddedHeightPx = (heightMeters + FIELD_MARGIN_METERS * 2) * ppm;
  const offsetX = (size.width - paddedWidthPx) / 2;
  const offsetY = (size.height - paddedHeightPx) / 2;

  const selectedItem =
    selectedItemIds.length === 1 ? scene.items.find((it) => it.id === selectedItemIds[0]) : undefined;

  const transformerConfig = useMemo(() => {
    if (!selectedItem) return null;
    const entry = OBJECT_REGISTRY[getRegistryKeyForItem(selectedItem)];
    if (!entry) return null;
    if (entry.resize === "uniform") {
      return {
        keepRatio: true,
        enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
        rotateEnabled: entry.rotatable,
      };
    }
    if (entry.resize === "freeform") {
      return {
        keepRatio: false,
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
          "middle-left",
          "middle-right",
          "top-center",
          "bottom-center",
        ],
        rotateEnabled: entry.rotatable,
      };
    }
    if (entry.resize === "font-scale") {
      return { keepRatio: true, enabledAnchors: ["bottom-right"], rotateEnabled: false };
    }
    return null;
  }, [selectedItem]);

  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    if (selectedItemIds.length !== 1 || !transformerConfig) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = nodeMap.current.get(selectedItemIds[0]);
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedItemIds, transformerConfig, scene.items]);

  function registerNode(id: string) {
    return (node: Konva.Node | null) => {
      if (node) nodeMap.current.set(id, node);
      else nodeMap.current.delete(id);
    };
  }

  function getPointerMeters(): { x: number; y: number } | null {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    // getPointerPosition() is raw container-relative pixels — it does NOT
    // account for the stage's own zoom/pan transform, so undo that first.
    const stageLocalX = (pos.x - view.x) / view.scale;
    const stageLocalY = (pos.y - view.y) / view.scale;
    return screenToMeter(stageLocalX, stageLocalY, ppm, offsetX, offsetY);
  }

  function zoomAtPoint(newScaleRaw: number, pointer: { x: number; y: number }) {
    const oldScale = view.scale;
    const newScale = clamp(newScaleRaw, MIN_ZOOM, MAX_ZOOM);
    const mousePointTo = {
      x: (pointer.x - view.x) / oldScale,
      y: (pointer.y - view.y) / oldScale,
    };
    if (newScale <= MIN_ZOOM) {
      setView({ scale: MIN_ZOOM, x: 0, y: 0 });
      return;
    }
    setView({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }

  function handleWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    if (e.evt.ctrlKey) {
      // Pinch-zoom gesture (trackpad) or explicit ctrl+wheel.
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0 ? view.scale * ZOOM_WHEEL_FACTOR : view.scale / ZOOM_WHEEL_FACTOR;
      zoomAtPoint(newScale, pointer);
    } else {
      // Plain scroll / two-finger swipe pans the view.
      setView((v) => ({ ...v, x: v.x - e.evt.deltaX, y: v.y - e.evt.deltaY }));
    }
  }

  function touchDistance(touches: TouchList) {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  }

  function touchCenterPx(touches: TouchList, box: DOMRect) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2 - box.left,
      y: (touches[0].clientY + touches[1].clientY) / 2 - box.top,
    };
  }

  function handleTouchMove(e: Konva.KonvaEventObject<TouchEvent>) {
    if (e.evt.touches.length !== 2) return;
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    // A pinch overrides any single-finger pan that may have just started.
    panDragRef.current = null;
    const box = stage.container().getBoundingClientRect();
    const dist = touchDistance(e.evt.touches);
    const center = touchCenterPx(e.evt.touches, box);
    if (!pinchRef.current) {
      pinchRef.current = { lastDist: dist };
      return;
    }
    const scaleFactor = dist / pinchRef.current.lastDist;
    zoomAtPoint(view.scale * scaleFactor, center);
    pinchRef.current = { lastDist: dist };
  }

  function handleTouchEnd(e: Konva.KonvaEventObject<TouchEvent>) {
    if (e.evt.touches.length < 2) pinchRef.current = null;
  }

  function zoomButton(factor: number) {
    const stage = stageRef.current;
    const center = stage ? { x: stage.width() / 2, y: stage.height() / 2 } : { x: 0, y: 0 };
    zoomAtPoint(view.scale * factor, center);
  }

  function resetView() {
    setView({ scale: MIN_ZOOM, x: 0, y: 0 });
  }

  function zoomToFill() {
    const stage = stageRef.current;
    if (!stage || widthMeters <= 0 || heightMeters <= 0) return;
    const containerW = stage.width();
    const containerH = stage.height();
    // Fit the field itself (no margin reserved for overflowing goals) so it
    // fills as much of the visible canvas as possible.
    const fillPpm = computeFitScale(containerW, containerH, widthMeters, heightMeters, 12);
    const targetScale = clamp(fillPpm / ppm, MIN_ZOOM, MAX_ZOOM);
    zoomAtPoint(targetScale, { x: containerW / 2, y: containerH / 2 });
  }

  function handleItemContextMenu(itemId: string, e: Konva.KonvaEventObject<PointerEvent>) {
    e.evt.preventDefault();
    setActiveTool("select");
    selectItem(itemId);
    setContextMenu({ itemId, x: e.evt.clientX, y: e.evt.clientY });
  }

  function handleItemSelect(itemId: string, e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) {
    if (e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey) {
      toggleItemSelection(itemId);
    } else {
      selectItem(itemId);
    }
  }

  function itemRestPx(item: SceneItem): { x: number; y: number } {
    if (item.kind === "arrow" || item.kind === "freehand") return { x: 0, y: 0 };
    return { x: item.x * ppm, y: item.y * ppm };
  }

  function handleItemDragStart(item: SceneItem) {
    if (selectedItemIds.length > 1 && selectedItemIds.includes(item.id)) {
      groupDragRef.current = {
        leaderId: item.id,
        leaderRestPx: itemRestPx(item),
        memberIds: selectedItemIds.filter((id) => id !== item.id),
      };
    } else {
      groupDragRef.current = null;
    }
  }

  function handleItemDragMove(item: SceneItem, e: Konva.KonvaEventObject<DragEvent>) {
    const gd = groupDragRef.current;
    if (!gd || gd.leaderId !== item.id) return;
    const node = e.target;
    const dxPx = node.x() - gd.leaderRestPx.x;
    const dyPx = node.y() - gd.leaderRestPx.y;
    for (const id of gd.memberIds) {
      const memberNode = nodeMap.current.get(id);
      const memberItem = scene.items.find((it) => it.id === id);
      if (!memberNode || !memberItem) continue;
      const rest = itemRestPx(memberItem);
      memberNode.position({ x: rest.x + dxPx, y: rest.y + dyPx });
    }
    stageRef.current?.batchDraw();
  }

  function commitItemDrag(item: SceneItem, xMeters: number, yMeters: number) {
    const gd = groupDragRef.current;
    if (gd && gd.leaderId === item.id) {
      groupDragRef.current = null;
      moveSelectedItemsBy(xMeters - item.x, yMeters - item.y);
    } else {
      updateItem(item.id, { x: xMeters, y: yMeters });
    }
  }

  function commitItemTranslate(item: ArrowItem | FreehandItem, dxMeters: number, dyMeters: number) {
    const gd = groupDragRef.current;
    if (gd && gd.leaderId === item.id) {
      groupDragRef.current = null;
      moveSelectedItemsBy(dxMeters, dyMeters);
      return;
    }
    if (item.kind === "arrow") {
      updateItem(item.id, {
        x: item.x + dxMeters,
        y: item.y + dyMeters,
        endX: item.endX + dxMeters,
        endY: item.endY + dyMeters,
      } as Partial<ArrowItem>);
    } else {
      updateItem(item.id, {
        points: item.points.map((v, i) => v + (i % 2 === 0 ? dxMeters : dyMeters)),
      } as Partial<FreehandItem>);
    }
  }

  function handleTransformEnd(item: PlayerItem | EquipmentItem | TextItem, e: Konva.KonvaEventObject<Event>) {
    const node = e.target as Konva.Node;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    node.scaleX(1);
    node.scaleY(1);
    if (item.kind === "player") {
      updateItem(item.id, { radiusMeters: Math.max(0.1, item.radiusMeters * scaleX), rotation } as Partial<PlayerItem>);
    } else if (item.kind === "equipment") {
      updateItem(item.id, {
        widthMeters: Math.max(0.05, item.widthMeters * scaleX),
        heightMeters: Math.max(0.05, item.heightMeters * scaleY),
        rotation,
      } as Partial<EquipmentItem>);
    } else if (item.kind === "text") {
      updateItem(item.id, { fontSizeMeters: Math.max(0.1, item.fontSizeMeters * scaleX) } as Partial<TextItem>);
    }
  }

  function handlePointerDown(e: Konva.KonvaEventObject<PointerEvent>) {
    if (e.evt.button !== undefined && e.evt.button !== 0) return;
    const stage = stageRef.current;
    const isTouch = e.evt.pointerType === "touch";
    const isBackground = e.target === stage;

    // Panning: held Space + mouse-drag on desktop, or a single-finger drag
    // on touch (touch has no modifier key, so plain drag-on-background pans
    // instead of marquee-selecting there).
    if (activeTool === "select" && isBackground && (isSpacePanning || isTouch)) {
      const pointerPx = stage?.getPointerPosition();
      if (!pointerPx) return;
      panDragRef.current = { startPointerPx: pointerPx, startView: { x: view.x, y: view.y } };
      return;
    }

    if (activeTool === "select") {
      if (isBackground) {
        const pos = getPointerMeters();
        if (!pos) return;
        const additive = e.evt.shiftKey;
        if (!additive) selectItem(null);
        marqueeDragRef.current = { x0: pos.x, y0: pos.y, additive };
        setMarqueeRect({ x0: pos.x, y0: pos.y, x1: pos.x, y1: pos.y });
      }
      return;
    }
    const pos = getPointerMeters();
    if (!pos) return;
    const entry = OBJECT_REGISTRY[activeTool];
    if (!entry) return;

    if (entry.id.startsWith("arrow-")) {
      const arrowType = entry.id.replace("arrow-", "") as "run" | "pass" | "dribble";
      const state: DrawingState = { type: "arrow", arrowType, start: pos, end: pos };
      drawingRef.current = state;
      setDrawingPreview(state);
      return;
    }
    if (entry.id === "freehand-pencil") {
      const state: FreehandDrawingState = { type: "freehand", points: [pos.x, pos.y] };
      drawingRef.current = state;
      setDrawingPreview(state);
      return;
    }

    const item = entry.create(pos);
    addItem(item);
    setActiveTool("select");
    selectItem(item.id);
    if (item.kind === "text") {
      setEditingTextNode(null);
      setEditingTextId(item.id);
    }
  }

  function handlePointerMove() {
    if (panDragRef.current) {
      const pointerPx = stageRef.current?.getPointerPosition();
      if (pointerPx) {
        const dx = pointerPx.x - panDragRef.current.startPointerPx.x;
        const dy = pointerPx.y - panDragRef.current.startPointerPx.y;
        const start = panDragRef.current.startView;
        setView((v) => ({ ...v, x: start.x + dx, y: start.y + dy }));
      }
      return;
    }
    if (marqueeDragRef.current) {
      const pos = getPointerMeters();
      if (pos) {
        setMarqueeRect({ x0: marqueeDragRef.current.x0, y0: marqueeDragRef.current.y0, x1: pos.x, y1: pos.y });
      }
      return;
    }

    const drawing = drawingRef.current;
    if (!drawing) return;
    const pos = getPointerMeters();
    if (!pos) return;

    if (drawing.type === "arrow") {
      const next: DrawingState = { ...drawing, end: pos };
      drawingRef.current = next;
      setDrawingPreview(next);
    } else if (drawing.type === "freehand") {
      const points = drawing.points;
      const lastX = points[points.length - 2];
      const lastY = points[points.length - 1];
      if (Math.hypot(pos.x - lastX, pos.y - lastY) >= FREEHAND_MIN_STEP_METERS) {
        const next: FreehandDrawingState = { type: "freehand", points: [...points, pos.x, pos.y] };
        drawingRef.current = next;
        setDrawingPreview(next);
      }
    }
  }

  function handlePointerUp() {
    if (panDragRef.current) {
      panDragRef.current = null;
      return;
    }
    if (marqueeDragRef.current) {
      const { additive } = marqueeDragRef.current;
      const rect = marqueeRect;
      marqueeDragRef.current = null;
      setMarqueeRect(null);
      if (!rect) return;
      const dragDist = Math.hypot(rect.x1 - rect.x0, rect.y1 - rect.y0);
      if (dragDist < MIN_DRAG_DISTANCE_METERS) return;
      const minX = Math.min(rect.x0, rect.x1);
      const maxX = Math.max(rect.x0, rect.x1);
      const minY = Math.min(rect.y0, rect.y1);
      const maxY = Math.max(rect.y0, rect.y1);
      const hits = scene.items
        .filter((it) => {
          const p = itemAnchorMeters(it);
          return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
        })
        .map((it) => it.id);
      setSelection(additive ? Array.from(new Set([...selectedItemIds, ...hits])) : hits);
      return;
    }

    const drawing = drawingRef.current;
    if (!drawing) return;
    drawingRef.current = null;
    setDrawingPreview(null);

    if (drawing.type === "arrow") {
      const entry = OBJECT_REGISTRY[`arrow-${drawing.arrowType}`];
      const dist = Math.hypot(drawing.end.x - drawing.start.x, drawing.end.y - drawing.start.y);
      const item = entry.create(drawing.start) as ArrowItem;
      if (dist >= MIN_DRAG_DISTANCE_METERS) {
        item.endX = drawing.end.x;
        item.endY = drawing.end.y;
      }
      addItem(item);
      setActiveTool("select");
      selectItem(item.id);
    } else if (drawing.type === "freehand") {
      setActiveTool("select");
      if (drawing.points.length >= 4) {
        const entry = OBJECT_REGISTRY["freehand-pencil"];
        const item = entry.create({ x: 0, y: 0 }) as FreehandItem;
        item.points = drawing.points;
        addItem(item);
        selectItem(item.id);
      }
    }
  }

  const editingTextItem = scene.items.find(
    (it) => it.id === editingTextId && it.kind === "text"
  ) as TextItem | undefined;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${
        isSpacePanning ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      <Stage
        ref={(s) => {
          stageRef.current = s;
          stageContainerRef(s);
          setStageNode(s);
        }}
        width={size.width || 1}
        height={size.height || 1}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.x}
        y={view.y}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <Layer x={offsetX} y={offsetY}>
          <FieldBackground template={template} widthMeters={widthMeters} heightMeters={heightMeters} ppm={ppm} />

          {scene.items.map((item) => {
            const isSelected = selectedItemIds.includes(item.id);
            const draggable = activeTool === "select";
            switch (item.kind) {
              case "player":
                return (
                  <PlayerShape
                    key={item.id}
                    item={item}
                    ppm={ppm}
                    isSelected={isSelected}
                    draggable={draggable}
                    onSelect={(e) => handleItemSelect(item.id, e)}
                    onDragStart={() => handleItemDragStart(item)}
                    onDragMove={(e) => handleItemDragMove(item, e)}
                    onDragEnd={(x, y) => commitItemDrag(item, x, y)}
                    onTransformEnd={(e) => handleTransformEnd(item, e)}
                    onContextMenu={(e) => handleItemContextMenu(item.id, e)}
                    shapeRef={registerNode(item.id)}
                  />
                );
              case "equipment":
                return (
                  <EquipmentShape
                    key={item.id}
                    item={item}
                    ppm={ppm}
                    isSelected={isSelected}
                    draggable={draggable}
                    onSelect={(e) => handleItemSelect(item.id, e)}
                    onDragStart={() => handleItemDragStart(item)}
                    onDragMove={(e) => handleItemDragMove(item, e)}
                    onDragEnd={(x, y) => commitItemDrag(item, x, y)}
                    onTransformEnd={(e) => handleTransformEnd(item, e)}
                    onContextMenu={(e) => handleItemContextMenu(item.id, e)}
                    shapeRef={registerNode(item.id)}
                  />
                );
              case "text":
                return (
                  <TextItemShape
                    key={item.id}
                    item={item}
                    ppm={ppm}
                    isSelected={isSelected}
                    draggable={draggable}
                    onSelect={(e) => handleItemSelect(item.id, e)}
                    onDragStart={() => handleItemDragStart(item)}
                    onDragMove={(e) => handleItemDragMove(item, e)}
                    onDragEnd={(x, y) => commitItemDrag(item, x, y)}
                    onTransformEnd={(e) => handleTransformEnd(item, e)}
                    onEditRequest={() => {
                      setEditingTextNode(null);
                      setEditingTextId(item.id);
                    }}
                    onContextMenu={(e) => handleItemContextMenu(item.id, e)}
                    shapeRef={(node) => {
                      registerNode(item.id)(node);
                      if (node && editingTextId === item.id) setEditingTextNode(node);
                    }}
                  />
                );
              case "arrow":
                return (
                  <ArrowShape
                    key={item.id}
                    item={item}
                    ppm={ppm}
                    isSelected={isSelected}
                    draggable={draggable}
                    onSelect={(e) => handleItemSelect(item.id, e)}
                    onDragStart={() => handleItemDragStart(item)}
                    onDragMove={(e) => handleItemDragMove(item, e)}
                    onTranslate={(dx, dy) => commitItemTranslate(item, dx, dy)}
                    onEndpointMove={(end, x, y) =>
                      updateItem(item.id, end === "start" ? { x, y } : { endX: x, endY: y })
                    }
                    onContextMenu={(e) => handleItemContextMenu(item.id, e)}
                    shapeRef={registerNode(item.id)}
                  />
                );
              case "freehand":
                return (
                  <FreehandShape
                    key={item.id}
                    item={item}
                    ppm={ppm}
                    isSelected={isSelected}
                    draggable={draggable}
                    onSelect={(e) => handleItemSelect(item.id, e)}
                    onDragStart={() => handleItemDragStart(item)}
                    onDragMove={(e) => handleItemDragMove(item, e)}
                    onTranslate={(dx, dy) => commitItemTranslate(item, dx, dy)}
                    onContextMenu={(e) => handleItemContextMenu(item.id, e)}
                    shapeRef={registerNode(item.id)}
                  />
                );
              default:
                return null;
            }
          })}

          {drawingPreview && drawingPreview.type === "arrow" && (
            <KonvaGroupReact listening={false} opacity={0.7}>
              <ArrowShape
                item={{
                  id: "preview",
                  kind: "arrow",
                  arrowType: drawingPreview.arrowType,
                  x: drawingPreview.start.x,
                  y: drawingPreview.start.y,
                  endX: drawingPreview.end.x,
                  endY: drawingPreview.end.y,
                  color: OBJECT_REGISTRY[`arrow-${drawingPreview.arrowType}`].color,
                  strokeWidthPx: 3,
                  rotation: 0,
                }}
                ppm={ppm}
                isSelected={false}
                draggable={false}
                onSelect={() => {}}
                onTranslate={() => {}}
                onEndpointMove={() => {}}
                shapeRef={() => {}}
              />
            </KonvaGroupReact>
          )}
          {drawingPreview && drawingPreview.type === "freehand" && (
            <KonvaGroupReact listening={false} opacity={0.7}>
              <FreehandShape
                item={{
                  id: "preview",
                  kind: "freehand",
                  points: drawingPreview.points,
                  color: OBJECT_REGISTRY["freehand-pencil"].color,
                  strokeWidthPx: 3,
                  x: 0,
                  y: 0,
                  rotation: 0,
                }}
                ppm={ppm}
                isSelected={false}
                draggable={false}
                onSelect={() => {}}
                onTranslate={() => {}}
                shapeRef={() => {}}
              />
            </KonvaGroupReact>
          )}

          {marqueeRect && (
            <Rect
              x={Math.min(marqueeRect.x0, marqueeRect.x1) * ppm}
              y={Math.min(marqueeRect.y0, marqueeRect.y1) * ppm}
              width={Math.abs(marqueeRect.x1 - marqueeRect.x0) * ppm}
              height={Math.abs(marqueeRect.y1 - marqueeRect.y0) * ppm}
              fill="rgba(255,255,255,0.12)"
              stroke="#ffffff"
              strokeWidth={1}
              dash={[4, 3]}
              listening={false}
            />
          )}

          <Transformer
            ref={trRef}
            keepRatio={transformerConfig?.keepRatio ?? true}
            enabledAnchors={transformerConfig?.enabledAnchors ?? []}
            rotateEnabled={transformerConfig?.rotateEnabled ?? false}
            borderStroke="#ffffff"
            anchorStroke="#ffffff"
            anchorFill="#1f2937"
            flipEnabled={false}
          />
        </Layer>
      </Stage>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-chrome-border bg-chrome-panel/95 px-2 py-1 text-[11px] text-chrome-muted shadow-md">
        Verschieben: Leertaste + Ziehen, oder scrollen · Zoom: Strg/Cmd + Scrollen
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-chrome-border bg-chrome-panel/95 p-1 shadow-md">
        <button
          onClick={zoomToFill}
          className="rounded p-1.5 text-chrome-text transition-colors hover:bg-chrome-hover"
          title="Ausfüllen"
        >
          <Maximize2 size={16} />
        </button>
        <div className="mx-0.5 h-4 w-px bg-chrome-border" />
        <button
          onClick={() => zoomButton(1 / 1.4)}
          disabled={view.scale <= MIN_ZOOM}
          className="rounded p-1.5 text-chrome-text transition-colors hover:bg-chrome-hover disabled:opacity-30"
          title="Verkleinern"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={resetView}
          className="min-w-14 rounded px-1.5 py-1 text-center text-xs font-medium text-chrome-text transition-colors hover:bg-chrome-hover"
          title="Ansicht zurücksetzen"
        >
          {Math.round(view.scale * 100)}%
        </button>
        <button
          onClick={() => zoomButton(1.4)}
          disabled={view.scale >= MAX_ZOOM}
          className="rounded p-1.5 text-chrome-text transition-colors hover:bg-chrome-hover disabled:opacity-30"
          title="Vergrößern"
        >
          <Plus size={16} />
        </button>
      </div>

      {editingTextItem && (
        <TextEditOverlay
          stage={stageNode}
          node={editingTextNode}
          initialValue={editingTextItem.text}
          onCommit={(text) => {
            updateItem(editingTextItem.id, { text });
            setEditingTextId(null);
          }}
          onCancel={() => setEditingTextId(null)}
        />
      )}

      {contextMenu && (
        <ItemContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onDuplicate={() => duplicateItem(contextMenu.itemId)}
          onBringToFront={() => bringItemToFront(contextMenu.itemId)}
          onSendToBack={() => sendItemToBack(contextMenu.itemId)}
          onDelete={() => removeItem(contextMenu.itemId)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
