import React from "react";
import {
  CompositeCanvasSnapshot,
  PrimaryVisualSnapshot,
  AuxiliaryState,
  DisplayValue,
} from "../../types/dsa";
import { ArrayVisualizer } from "./ArrayVisualizer";
import { GridVisualizer } from "./GridVisualizer";
import { GraphVisualizer } from "./GraphVisualizer";
import { TreeVisualizer } from "./TreeVisualizer";
import { VectorVisualizer } from "./VectorVisualizer";
import { MatrixVisualizer } from "./MatrixVisualizer";
import { QuantizationVisualizer } from "./QuantizationVisualizer";
import { IntervalVisualizer } from "./IntervalVisualizer";
import { HeapVisualizer } from "./HeapVisualizer";
import { DsuVisualizer } from "./DsuVisualizer";
import { HashTableVisualizer } from "./HashTableVisualizer";
import { StateSpaceVisualizer } from "./StateSpaceVisualizer";
import { CallStackVisualizer } from "./CallStackVisualizer";
import { BitmaskVisualizer } from "./BitmaskVisualizer";
import { AttentionMapVisualizer } from "./AttentionMapVisualizer";
import { TrieVisualizer } from "./TrieVisualizer";
import { resolvePrimitiveLabel } from "./primitiveLabels";

export interface CompositeVisualizerProps {
  snapshot: CompositeCanvasSnapshot;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export interface RenderPrimitiveSnapshotProps {
  snapshot: PrimaryVisualSnapshot;
  auxiliaryState?: AuxiliaryState;
  variables?: Record<string, DisplayValue>;
}

export const PRIMITIVE_SNAPSHOT_KINDS = [
  "array",
  "grid",
  "graph",
  "tree",
  "vector",
  "matrix",
  "quantization",
  "interval",
  "heap",
  "dsu",
  "hashtable",
  "statespace",
  "composite",
  "callstack",
  "bitmask",
  "attentionmap",
  "trie",
] as const;

const isSnapshotRecord = (snapshot: unknown): snapshot is Record<string, unknown> =>
  typeof snapshot === "object" && snapshot !== null;

const isRecordArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every(isSnapshotRecord);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const hasOptionalRecordArray = (snapshot: Record<string, unknown>, field: string): boolean =>
  snapshot[field] === undefined || isRecordArray(snapshot[field]);

const isRectangularRecordGrid = (value: unknown): boolean => {
  if (!Array.isArray(value) || !value.every(isRecordArray)) return false;
  const width = value[0]?.length ?? 0;
  return value.every((row) => row.length === width);
};

const isRectangularNumberGrid = (value: unknown): value is number[][] => {
  if (!Array.isArray(value) || !value.every(Array.isArray)) return false;
  const width = value[0]?.length ?? 0;
  return value.every(
    (row) => row.length === width && row.every((entry) => typeof entry === "number"),
  );
};

const hasSafeIdentity = (snapshot: Record<string, unknown>): boolean =>
  (snapshot.name === undefined || typeof snapshot.name === "string") &&
  (snapshot.title === undefined || typeof snapshot.title === "string");

const isSafeNonCompositeSnapshot = (snapshot: Record<string, unknown>): boolean => {
  if (!hasSafeIdentity(snapshot)) return false;

  switch (snapshot.kind) {
    case "array":
      return isRecordArray(snapshot.elements);
    case "grid":
      return isRectangularRecordGrid(snapshot.grid);
    case "graph":
      return isRecordArray(snapshot.nodes) && isRecordArray(snapshot.edges);
    case "tree":
    case "dsu":
      return isRecordArray(snapshot.nodes);
    case "vector":
      return (
        isRecordArray(snapshot.vectors) &&
        (snapshot.planeTitle === undefined || typeof snapshot.planeTitle === "string")
      );
    case "matrix":
      return (
        typeof snapshot.rows === "number" &&
        typeof snapshot.cols === "number" &&
        isRecordArray(snapshot.cells) &&
        (snapshot.rowHeaders === undefined || isStringArray(snapshot.rowHeaders)) &&
        (snapshot.colHeaders === undefined || isStringArray(snapshot.colHeaders))
      );
    case "quantization":
    case "bitmask":
      return isRecordArray(snapshot.bits);
    case "interval":
      return isRecordArray(snapshot.intervals) && hasOptionalRecordArray(snapshot, "eventPoints");
    case "heap":
      return (
        Array.isArray(snapshot.heap) &&
        snapshot.heap.every(
          (entry) =>
            typeof entry === "string" || typeof entry === "number" || isSnapshotRecord(entry),
        )
      );
    case "hashtable":
      return (
        isRecordArray(snapshot.buckets) &&
        snapshot.buckets.every((bucket) => isRecordArray(bucket.entries))
      );
    case "statespace":
      return (
        isRecordArray(snapshot.nodes) &&
        hasOptionalRecordArray(snapshot, "edges") &&
        (snapshot.path === undefined || isStringArray(snapshot.path))
      );
    case "callstack":
      return isRecordArray(snapshot.frames);
    case "attentionmap": {
      const { queryTokens, keyTokens, weights } = snapshot;
      return (
        isStringArray(queryTokens) &&
        isStringArray(keyTokens) &&
        isRectangularNumberGrid(weights) &&
        weights.length === queryTokens.length &&
        weights.every((row) => row.length === keyTokens.length)
      );
    }
    case "trie":
      return (
        isRecordArray(snapshot.nodes) &&
        hasOptionalRecordArray(snapshot, "edges") &&
        (snapshot.activePath === undefined || isStringArray(snapshot.activePath))
      );
    default:
      return false;
  }
};

const isSafeCompositeItem = (item: Record<string, unknown>): boolean =>
  typeof item.id === "string" &&
  (item.role === "primary" || item.role === "auxiliary" || item.role === "comparison") &&
  isSnapshotRecord(item.snapshot) &&
  item.snapshot.kind !== "composite" &&
  isSafeNonCompositeSnapshot(item.snapshot);

export const isRenderablePrimitiveSnapshot = (snapshot: unknown): boolean => {
  if (!isSnapshotRecord(snapshot) || !hasSafeIdentity(snapshot)) return false;

  switch (snapshot.kind) {
    case "composite":
      return (
        Array.isArray(snapshot.items) &&
        snapshot.items.every((item) => isSnapshotRecord(item) && isSafeCompositeItem(item))
      );
    default:
      return isSafeNonCompositeSnapshot(snapshot);
  }
};

export const RenderPrimitiveSnapshot: React.FC<RenderPrimitiveSnapshotProps> = ({
  snapshot,
  auxiliaryState,
  variables,
}) => {
  switch (snapshot.kind) {
    case "array":
      return (
        <ArrayVisualizer
          elements={snapshot.elements}
          mode={snapshot.mode}
          name={snapshot.name}
          title={snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "grid":
      return (
        <GridVisualizer
          grid={snapshot.grid}
          title={resolvePrimitiveLabel("grid", snapshot.name)}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "graph":
      return (
        <GraphVisualizer
          nodes={snapshot.nodes}
          edges={snapshot.edges}
          isDirected={snapshot.directed}
          name={snapshot.name}
          title={snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "tree":
      return (
        <TreeVisualizer
          nodes={snapshot.nodes}
          rootId={snapshot.rootId}
          title={resolvePrimitiveLabel("tree", snapshot.name)}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "vector":
      return (
        <VectorVisualizer
          vectors={snapshot.vectors}
          origin={snapshot.origin}
          planeTitle={resolvePrimitiveLabel("vector", snapshot.name) ?? snapshot.planeTitle}
          dimensions={snapshot.dimensions}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "matrix":
      return (
        <MatrixVisualizer
          rows={snapshot.rows}
          cols={snapshot.cols}
          cells={snapshot.cells}
          rowHeaders={snapshot.rowHeaders}
          colHeaders={snapshot.colHeaders}
          title={resolvePrimitiveLabel("matrix", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "quantization":
      return (
        <QuantizationVisualizer
          originalValue={snapshot.originalValue}
          quantizedValue={snapshot.quantizedValue}
          scale={snapshot.scale}
          zeroPoint={snapshot.zeroPoint}
          bits={snapshot.bits}
          title={resolvePrimitiveLabel("quantization", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "interval":
      return (
        <IntervalVisualizer
          intervals={snapshot.intervals}
          sweepLine={snapshot.sweepLine}
          eventPoints={snapshot.eventPoints}
          axis={snapshot.axis}
          title={resolvePrimitiveLabel("interval", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "heap":
      return (
        <HeapVisualizer
          heap={snapshot.heap}
          heapType={snapshot.heapType}
          swapPair={snapshot.swapPair}
          title={resolvePrimitiveLabel("heap", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "dsu":
      return (
        <DsuVisualizer
          nodes={snapshot.nodes}
          activeIds={snapshot.activeIds}
          title={resolvePrimitiveLabel("dsu", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "hashtable":
      return (
        <HashTableVisualizer
          buckets={snapshot.buckets}
          hashFunction={snapshot.hashFunction}
          probingSequence={snapshot.probingSequence}
          title={resolvePrimitiveLabel("hashtable", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "statespace":
      return (
        <StateSpaceVisualizer
          nodes={snapshot.nodes}
          edges={snapshot.edges}
          activeNodeId={snapshot.activeNodeId}
          path={snapshot.path}
          title={resolvePrimitiveLabel("statespace", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "callstack":
      return (
        <CallStackVisualizer
          frames={snapshot.frames}
          activeFrameIndex={snapshot.activeFrameIndex}
          title={resolvePrimitiveLabel("callstack", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "bitmask":
      return (
        <BitmaskVisualizer
          bits={snapshot.bits}
          value={snapshot.value}
          label={snapshot.label}
          bitWidth={snapshot.bitWidth}
          operation={snapshot.operation}
          title={resolvePrimitiveLabel("bitmask", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "attentionmap":
      return (
        <AttentionMapVisualizer
          queryTokens={snapshot.queryTokens}
          keyTokens={snapshot.keyTokens}
          weights={snapshot.weights}
          activeQueryIndex={snapshot.activeQueryIndex}
          activeKeyIndex={snapshot.activeKeyIndex}
          title={resolvePrimitiveLabel("attentionmap", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "trie":
      return (
        <TrieVisualizer
          nodes={snapshot.nodes}
          edges={snapshot.edges}
          rootId={snapshot.rootId}
          activePath={snapshot.activePath}
          searchWord={snapshot.searchWord}
          title={resolvePrimitiveLabel("trie", snapshot.name) ?? snapshot.title}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    case "composite":
      return (
        <CompositeVisualizer
          snapshot={snapshot}
          auxiliaryState={auxiliaryState}
          variables={variables}
        />
      );
    default:
      return null;
  }
};

export const CompositeVisualizer: React.FC<CompositeVisualizerProps> = ({
  snapshot,
  auxiliaryState,
  variables,
}) => {
  const items = snapshot.items || [];
  const count = items.length;

  if (count === 0) return null;

  const overlayIndex = Math.max(
    0,
    items.findIndex((item) => item.role === "primary"),
  );
  const layout = snapshot.layout || "auto";
  const gap = snapshot.gap ?? "8px";

  const isFlexHorizontal = layout === "horizontal";
  const isFlexVertical = layout === "vertical";
  const isFlex = isFlexHorizontal || isFlexVertical || layout === "flex";

  const cols =
    snapshot.columns ||
    (count <= 1 ? 1 : count === 2 ? 2 : count <= 4 ? 2 : Math.ceil(Math.sqrt(count)));
  const rows = snapshot.rows || Math.ceil(count / cols);

  const isGrid =
    !isFlexHorizontal && !isFlexVertical && (layout === "grid" || layout === "auto" || !isFlex);

  return (
    <div
      data-testid="composite-visualizer"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 auto",
        alignSelf: "stretch",
        width: "100%",
        height: "100%",
        minWidth: 0,
        minHeight: 0,
        padding: "8px",
        boxSizing: "border-box",
      }}
    >
      {snapshot.heading && (
        <div
          style={{
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            color: "var(--text-muted)",
            marginBottom: "var(--space-1)",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {snapshot.heading}
        </div>
      )}

      <div
        style={{
          flex: "1 1 0%",
          width: "100%",
          height: "100%",
          minWidth: 0,
          minHeight: 0,
          display: isGrid ? "grid" : "flex",
          flexDirection: isFlexHorizontal ? "row" : isFlexVertical ? "column" : undefined,
          gridTemplateColumns: isGrid ? `repeat(${cols}, minmax(0, 1fr))` : undefined,
          gridTemplateRows: isGrid ? `repeat(${rows}, minmax(0, 1fr))` : undefined,
          gap: typeof gap === "number" ? `${gap}px` : gap,
        }}
      >
        {items.map((item, index) => {
          const itemKey = item.id || `composite-sub-item-${index}`;
          const widthRatio = item.widthRatio;
          const heightRatio = item.heightRatio;

          let flexStyle: string | undefined = undefined;
          if (isFlexHorizontal) {
            flexStyle = widthRatio ? `${widthRatio} ${widthRatio} 0%` : "1 1 0%";
          } else if (isFlexVertical) {
            flexStyle = heightRatio ? `${heightRatio} ${heightRatio} 0%` : "1 1 0%";
          } else if (isFlex) {
            flexStyle = "1 1 0%";
          }

          return (
            <div
              key={itemKey}
              data-testid={`composite-sub-region-${index}`}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                minWidth: 0,
                minHeight: 0,
                gridColumn: isGrid && item.colSpan ? `span ${item.colSpan}` : undefined,
                gridRow: isGrid && item.rowSpan ? `span ${item.rowSpan}` : undefined,
                flex: flexStyle,
              }}
            >
              <div
                style={{
                  flex: "1 1 0%",
                  width: "100%",
                  height: "100%",
                  minWidth: 0,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <RenderPrimitiveSnapshot
                  snapshot={item.snapshot}
                  auxiliaryState={index === overlayIndex ? auxiliaryState : undefined}
                  variables={index === overlayIndex ? variables : undefined}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompositeVisualizer;
