"use client";

import type Konva from "konva";
import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Layer, Stage, Transformer, Group as KonvaGroupReact } from "react-konva";
import { getFieldTemplate } from "@/lib/fieldTemplates";
import { FIELD_MARGIN_METERS, computeFitScale, screenToMeter } from "@/lib/geometry/ppm";
import { useContainerSize } from "@/lib/hooks/useContainerSize";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { OBJECT_REGISTRY, getRegistryKeyForItem } from "@/lib/objectRegistry";
import { useSessionStore } from "@/lib/store/useSessionStore";
import type { ArrowItem, EquipmentItem, FreehandItem, PlayerItem, Scene, TextItem } from "@/lib/types/scene";
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

export interface BoardCanvasHandle {
  stage: Konva.Stage | null;
}

export function BoardCanvas({ scene, stageContainerRef }: { scene: Scene; stageContainerRef: (stage: Konva.Stage | null) => void }) {
  useKeyboardShortcuts();

  const { ref: containerRef, size } = useContainerSize<HTMLDivElement>();
  const activeTool = useSessionStore((s) => s.activeTool);
  const setActiveTool = useSessionStore((s) => s.setActiveTool);
  const selectedItemId = useSessionStore((s) => s.selectedItemId);
  const selectItem = useSessionStore((s) => s.selectItem);
  const addItem = useSessionStore((s) => s.addItem);
  const updateItem = useSessionStore((s) => s.updateItem);
  const removeItem = useSessionStore((s) => s.removeItem);
  const duplicateItem = useSessionStore((s) => s.duplicateItem);
  const bringItemToFront = useSessionStore((s) => s.bringItemToFront);
  const sendItemToBack = useSessionStore((s) => s.sendItemToBack);

  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const nodeMap = useRef(new Map<string, Konva.Node>());
  const drawingRef = useRef<DrawingState | FreehandDrawingState | null>(null);
  const [drawingPreview, setDrawingPreview] = useState<DrawingState | FreehandDrawingState | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextNode, setEditingTextNode] = useState<Konva.Node | null>(null);
  const [stageNode, setStageNode] = useState<Konva.Stage | null>(null);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);

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
  const offsetPx = FIELD_MARGIN_METERS * ppm;

  const selectedItem = scene.items.find((it) => it.id === selectedItemId);

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
    if (!selectedItemId || !transformerConfig) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = nodeMap.current.get(selectedItemId);
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedItemId, transformerConfig, scene.items]);

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
    return screenToMeter(pos.x, pos.y, ppm, offsetPx);
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
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? view.scale * ZOOM_WHEEL_FACTOR : view.scale / ZOOM_WHEEL_FACTOR;
    zoomAtPoint(newScale, pointer);
  }

  function zoomButton(factor: number) {
    const stage = stageRef.current;
    const center = stage ? { x: stage.width() / 2, y: stage.height() / 2 } : { x: 0, y: 0 };
    zoomAtPoint(view.scale * factor, center);
  }

  function resetView() {
    setView({ scale: MIN_ZOOM, x: 0, y: 0 });
  }

  function handleItemContextMenu(itemId: string, e: Konva.KonvaEventObject<PointerEvent>) {
    e.evt.preventDefault();
    setActiveTool("select");
    selectItem(itemId);
    setContextMenu({ itemId, x: e.evt.clientX, y: e.evt.clientY });
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
    if (activeTool === "select") {
      if (e.target === stageRef.current) {
        selectItem(null);
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
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
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
        draggable={activeTool === "select"}
        onDragMove={(e) => {
          if (e.target !== stageRef.current) return;
          setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
        }}
        onDragEnd={(e) => {
          if (e.target !== stageRef.current) return;
          setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
        }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <Layer x={offsetPx} y={offsetPx}>
          <FieldBackground template={template} widthMeters={widthMeters} heightMeters={heightMeters} ppm={ppm} />

          {scene.items.map((item) => {
            const isSelected = item.id === selectedItemId;
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
                    onSelect={() => selectItem(item.id)}
                    onDragEnd={(x, y) => updateItem(item.id, { x, y })}
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
                    onSelect={() => selectItem(item.id)}
                    onDragEnd={(x, y) => updateItem(item.id, { x, y })}
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
                    onSelect={() => selectItem(item.id)}
                    onDragEnd={(x, y) => updateItem(item.id, { x, y })}
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
                    onSelect={() => selectItem(item.id)}
                    onTranslate={(dx, dy) =>
                      updateItem(item.id, {
                        x: item.x + dx,
                        y: item.y + dy,
                        endX: item.endX + dx,
                        endY: item.endY + dy,
                      })
                    }
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
                    onSelect={() => selectItem(item.id)}
                    onTranslate={(dx, dy) =>
                      updateItem(item.id, {
                        points: item.points.map((v, i) => v + (i % 2 === 0 ? dx : dy)),
                      })
                    }
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

      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md border border-chrome-border bg-chrome-panel/95 p-1 shadow-md">
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
