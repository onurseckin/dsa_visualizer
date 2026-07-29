import type {
  AlgorithmStep,
  AuxiliaryState,
  DisplayValue,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
  BitItem,
  VectorItem,
} from "../../types/dsa";
import { deepFreezeCopy } from "./freeze";

interface StepFrame {
  readonly codeLine: number;
  readonly what: string;
  readonly why: string;
  readonly auxiliaryState?: AuxiliaryState;
  readonly variables?: Record<string, DisplayValue>;
}

export interface ArrayStepFrame extends StepFrame {
  readonly values: readonly (number | string)[];
  readonly activeIndices?: readonly number[];
  readonly completedIndices?: readonly number[];
}

export interface MatrixStepFrame extends StepFrame {
  readonly values: readonly (readonly (number | string)[])[];
  readonly activeCells?: readonly (readonly [number, number])[];
  readonly completedCells?: readonly (readonly [number, number])[];
  readonly rowHeaders?: readonly string[];
  readonly colHeaders?: readonly string[];
  readonly title?: string;
}

export interface GraphStepNode extends Omit<GraphNodeItem, "state"> {
  readonly state?: ElementState;
}

export type GraphStepEdge = GraphEdgeItem;

export interface GraphStepFrame extends StepFrame {
  readonly nodes: readonly GraphStepNode[];
  readonly edges: readonly GraphStepEdge[];
  readonly activeNodeIds?: readonly string[];
  readonly completedNodeIds?: readonly string[];
  readonly traversedEdgeIndexes?: readonly number[];
}

export interface VectorStepVector extends Omit<VectorItem, "state"> {
  readonly state?: ElementState;
}

export interface VectorStepFrame extends StepFrame {
  readonly vectors: readonly VectorStepVector[];
  readonly activeVectorIds?: readonly string[];
  readonly completedVectorIds?: readonly string[];
  readonly origin?: { readonly x: number; readonly y: number };
  readonly planeTitle?: string;
  readonly dimensions?: "2d" | "3d";
}

export interface QuantizationStepBit extends Omit<BitItem, "state"> {
  readonly state?: BitItem["state"];
}

export interface QuantizationStepFrame extends StepFrame {
  readonly originalValue?: number | string;
  readonly quantizedValue?: number | string;
  readonly scale?: number | string;
  readonly zeroPoint?: number | string;
  readonly bits: readonly QuantizationStepBit[];
  readonly activeBitIndices?: readonly number[];
  readonly quantizedBitIndices?: readonly number[];
  readonly title?: string;
}

function validateFrames(frames: readonly StepFrame[]): void {
  if (frames.length < 2) {
    throw new Error("A visualization requires at least two explanatory frames.");
  }
  if (
    frames.some(
      (frame) =>
        !Number.isInteger(frame.codeLine) ||
        frame.codeLine < 1 ||
        !frame.what.trim() ||
        !frame.why.trim(),
    )
  ) {
    throw new Error("Every visualization frame requires a code line and what/why explanations.");
  }
}

function stepBase(frame: StepFrame, stepIndex: number) {
  return {
    stepIndex,
    codeLine: frame.codeLine,
    explanation: {
      what: frame.what.trim(),
      why: frame.why.trim(),
    },
    auxiliaryState: frame.auxiliaryState ?? {},
    variables: frame.variables ?? {},
  };
}

function itemState(
  index: number,
  active: readonly number[] | undefined,
  completed: readonly number[] | undefined,
): ElementState {
  if (active?.includes(index)) return "active";
  if (completed?.includes(index)) return "sorted";
  return "default";
}

export function arraySteps(frames: readonly ArrayStepFrame[]): AlgorithmStep[] {
  validateFrames(frames);
  return deepFreezeCopy(
    frames.map((frame, stepIndex) => ({
      ...stepBase(frame, stepIndex),
      primarySnapshot: {
        kind: "array",
        elements: frame.values.map((value, index) => ({
          id: `item-${index}`,
          value,
          state: itemState(index, frame.activeIndices, frame.completedIndices),
        })),
      },
    })),
  );
}

export function matrixSteps(frames: readonly MatrixStepFrame[]): AlgorithmStep[] {
  validateFrames(frames);
  return deepFreezeCopy(
    frames.map((frame, stepIndex) => {
      const cols = frame.values[0]?.length ?? 0;
      if (
        frame.values.length === 0 ||
        cols === 0 ||
        frame.values.some((row) => row.length !== cols)
      ) {
        throw new Error("Matrix visualization frames require a nonempty rectangular matrix.");
      }
      const active = new Set(frame.activeCells?.map(([row, col]) => `${row}:${col}`));
      const completed = new Set(frame.completedCells?.map(([row, col]) => `${row}:${col}`));

      return {
        ...stepBase(frame, stepIndex),
        primarySnapshot: {
          kind: "matrix",
          rows: frame.values.length,
          cols,
          cells: frame.values.flatMap((row, rowIndex) =>
            row.map((value, colIndex) => {
              const key = `${rowIndex}:${colIndex}`;
              return {
                row: rowIndex,
                col: colIndex,
                value,
                state: active.has(key) ? "active" : completed.has(key) ? "sorted" : "default",
              };
            }),
          ),
          ...(frame.rowHeaders ? { rowHeaders: [...frame.rowHeaders] } : {}),
          ...(frame.colHeaders ? { colHeaders: [...frame.colHeaders] } : {}),
          ...(frame.title ? { title: frame.title } : {}),
        },
      };
    }),
  );
}

export function graphSteps(frames: readonly GraphStepFrame[]): AlgorithmStep[] {
  validateFrames(frames);
  return deepFreezeCopy(
    frames.map((frame, stepIndex) => ({
      ...stepBase(frame, stepIndex),
      primarySnapshot: {
        kind: "graph",
        nodes: frame.nodes.map((node) => ({
          ...node,
          state: frame.activeNodeIds?.includes(node.id)
            ? "active"
            : frame.completedNodeIds?.includes(node.id)
              ? "sorted"
              : (node.state ?? "default"),
        })),
        edges: frame.edges.map((edge, edgeIndex) => ({
          ...edge,
          isTraversed: frame.traversedEdgeIndexes?.includes(edgeIndex) ?? edge.isTraversed,
        })),
      },
    })),
  );
}

export function vectorSteps(frames: readonly VectorStepFrame[]): AlgorithmStep[] {
  validateFrames(frames);
  return deepFreezeCopy(
    frames.map((frame, stepIndex) => {
      if (frame.vectors.length === 0) {
        throw new Error("Vector visualization frames require at least one vector.");
      }
      return {
        ...stepBase(frame, stepIndex),
        primarySnapshot: {
          kind: "vector",
          vectors: frame.vectors.map((vector) => ({
            ...vector,
            state: frame.activeVectorIds?.includes(vector.id)
              ? "active"
              : frame.completedVectorIds?.includes(vector.id)
                ? "sorted"
                : vector.state,
          })),
          ...(frame.origin ? { origin: frame.origin } : {}),
          ...(frame.planeTitle ? { planeTitle: frame.planeTitle } : {}),
          ...(frame.dimensions ? { dimensions: frame.dimensions } : {}),
        },
      };
    }),
  );
}

export function quantizationSteps(frames: readonly QuantizationStepFrame[]): AlgorithmStep[] {
  validateFrames(frames);
  return deepFreezeCopy(
    frames.map((frame, stepIndex) => {
      if (frame.bits.length === 0) {
        throw new Error("Quantization visualization frames require at least one bit.");
      }
      return {
        ...stepBase(frame, stepIndex),
        primarySnapshot: {
          kind: "quantization",
          ...(frame.originalValue !== undefined ? { originalValue: frame.originalValue } : {}),
          ...(frame.quantizedValue !== undefined ? { quantizedValue: frame.quantizedValue } : {}),
          ...(frame.scale !== undefined ? { scale: frame.scale } : {}),
          ...(frame.zeroPoint !== undefined ? { zeroPoint: frame.zeroPoint } : {}),
          bits: frame.bits.map((bit) => ({
            ...bit,
            state: frame.activeBitIndices?.includes(bit.index)
              ? "active"
              : frame.quantizedBitIndices?.includes(bit.index)
                ? "quantized"
                : bit.state,
          })),
          ...(frame.title ? { title: frame.title } : {}),
        },
      };
    }),
  );
}
