import type { TriviaMeta } from "./trivia";
import { isMlInfraTopic, type TopicId } from "../curriculum/topics";

export type { TopicId } from "../curriculum/topics";

export type VisualStateToken =
  | "default"
  | "compare"
  | "swap"
  | "sorted"
  | "active"
  | "pivot"
  | "visited"
  | "queued"
  | "in-stack"
  | "path";

export type ElementState =
  | VisualStateToken
  | "compared"
  | "decode"
  | "finished"
  | "found"
  | "highlighted"
  | "inactive"
  | "prefill"
  | "result"
  | "waiting";

export function elementStateToken(state: ElementState): VisualStateToken {
  switch (state) {
    case "compared":
      return "compare";
    case "decode":
    case "highlighted":
    case "prefill":
      return "active";
    case "finished":
    case "found":
    case "result":
      return "sorted";
    case "inactive":
    case "waiting":
      return "default";
    default:
      return state;
  }
}

export type DisplayValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly DisplayValue[]
  | { readonly [key: string]: DisplayValue };

export interface ArrayElement {
  id: string;
  value: number | string;
  label?: string;
  state: ElementState;
  pointers?: string[];
}

export interface GridCellNode {
  row: number;
  col: number;
  isStart?: boolean;
  isEnd?: boolean;
  isWall?: boolean;
  isVisited?: boolean;
  isPath?: boolean;
  state?: ElementState;
  distance?: number;
}

export interface GraphNodeItem {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  state: ElementState;
  val?: number;
  /* Identity grouping (SCC id, MST tree, island index, trie branch). Rendered
     with the categorical --viz-* palette; independent of `state`, which carries
     what the algorithm is doing right now. */
  group?: number;
}

export interface GraphEdgeItem {
  from: string;
  to: string;
  weight?: number;
  isTraversed?: boolean;
  isPath?: boolean;
  /* See GraphNodeItem.group — lets an edge inherit its component's color. */
  group?: number;
}

export interface TreeNodeItem {
  id: string;
  val: number;
  leftId?: string;
  rightId?: string;
  state: ElementState;
  x?: number;
  y?: number;
}

export interface AuxiliaryState {
  stack?: DisplayValue[];
  queue?: DisplayValue[];
  visited?: DisplayValue[];
  hashMap?: Record<string, DisplayValue>;
  distanceTable?: Record<string, number>;
  customState?: Record<string, DisplayValue>;
}

export interface StepExplanation {
  what: string;
  why: string;
}

export type PrimaryVisualKind =
  | "array"
  | "grid"
  | "graph"
  | "tree"
  | "vector"
  | "matrix"
  | "quantization";

export interface ArrayVisualSnapshot {
  kind: "array";
  elements: ArrayElement[];
}

export interface GridVisualSnapshot {
  kind: "grid";
  grid: GridCellNode[][];
}

export interface GraphVisualSnapshot {
  kind: "graph";
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export interface TreeVisualSnapshot {
  kind: "tree";
  nodes: TreeNodeItem[];
  rootId?: string;
}

export interface VectorItem {
  id: string;
  label: string;
  x: number;
  y: number;
  z?: number;
  color?: string;
  state?: ElementState;
  subText?: string;
}

export interface VectorVisualSnapshot {
  kind: "vector";
  vectors: VectorItem[];
  origin?: { x: number; y: number };
  planeTitle?: string;
  dimensions?: "2d" | "3d";
}

export interface MatrixCellItem {
  row: number;
  col: number;
  value: string | number;
  label?: string;
  state?: ElementState;
  color?: string;
}

export interface MatrixVisualSnapshot {
  kind: "matrix";
  rows: number;
  cols: number;
  cells: MatrixCellItem[];
  rowHeaders?: string[];
  colHeaders?: string[];
  title?: string;
}

export interface BitItem {
  index: number;
  label?: string;
  value: string | number;
  state?: "default" | "active" | "sign" | "exponent" | "mantissa" | "quantized";
  bitGroup?: string;
}

export interface QuantizationVisualSnapshot {
  kind: "quantization";
  originalValue?: number | string;
  quantizedValue?: number | string;
  scale?: number | string;
  zeroPoint?: number | string;
  bits: BitItem[];
  title?: string;
}

export type PrimaryVisualSnapshot =
  | ArrayVisualSnapshot
  | GridVisualSnapshot
  | GraphVisualSnapshot
  | TreeVisualSnapshot
  | VectorVisualSnapshot
  | MatrixVisualSnapshot
  | QuantizationVisualSnapshot;

export interface AlgorithmStep {
  stepIndex: number;
  codeLine: number;
  explanation: StepExplanation;
  primarySnapshot: PrimaryVisualSnapshot;
  auxiliaryState: AuxiliaryState;
  variables: Record<string, DisplayValue>;
}

/* Each workspace panel is shown or hidden by its own navbar toggle — there is
   no mutually exclusive "view mode" anymore. */
export interface PanelVisibility {
  problem: boolean;
  solution: boolean;
  visualizer: boolean;
  code: boolean;
  tutorial: boolean;
  auxiliary: boolean;
  complexity?: boolean;
  examples?: boolean;
}

export type PanelKey = keyof PanelVisibility;
export type DifficultyLevel = "Easy" | "Medium" | "Hard";

export interface TimeComplexity {
  best: string;
  average: string;
  worst: string;
}

export interface ComplexityAnalysis {
  time: string;
  space: string;
}

export interface TopicGuideSection {
  heading: string;
  body: string;
}

export interface TopicGuideTerm {
  term: string;
  definition: string;
}

/* The educational reference for a problem's whole topic — not step narration.
   Rendered in the expanded problem details; see docs/planning/ui-overhaul/DESIGN.md. */
export interface TopicGuide {
  overview: string;
  sections: TopicGuideSection[];
  keyTerms?: TopicGuideTerm[];
}

export interface ProblemExample<TInput = unknown> {
  id?: string;
  kind?: "basic" | "complex" | "negative";
  title?: string;
  input: TInput | string;
  output?: string;
  explanation?: string;
  inputValue?: unknown;
  inputDisplay?: string;
  outputDisplay?: string;
}

export interface LeetCodeMeta {
  id: number;
  url: string;
}

export type SourceKind = "leetcode" | "book" | "standard" | "hackerrank" | "ml_infra" | "other";

export interface BaseSource {
  type?: SourceKind;
  kind?: SourceKind;
  label?: string;
  url?: string;
}

export interface LeetCodeSource extends BaseSource {
  type?: "leetcode";
  kind?: "leetcode";
  id?: number;
  leetcodeId?: number;
  url?: string;
  title?: string;
}

export interface BookSource extends BaseSource {
  type?: "book";
  kind?: "book";
  bookTitle?: string;
  chapter?: string | number;
  chapterTitle?: string;
  section?: string | number;
  shortTitle?: string;
  page?: number;
  url?: string;
}

export interface StandardSource extends BaseSource {
  type?: "standard";
  kind?: "standard";
  label?: string;
}

export interface MlInfraSource extends BaseSource {
  type?: "ml_infra";
  kind?: "ml_infra";
  label?: string;
}

export type ProblemSource = LeetCodeSource | BookSource | StandardSource | MlInfraSource;

export function getSourceKind(source: ProblemSource): SourceKind {
  return source.kind || source.type || "standard";
}

export function getAlgorithmSources(alg: {
  sources?: ProblemSource[];
  leetcode?: LeetCodeMeta | { id: number; url: string };
  topicIds: readonly TopicId[];
}): ProblemSource[] {
  let result: ProblemSource[] = [];
  if (alg.sources && alg.sources.length > 0) {
    result = [...alg.sources];
  } else if (alg.leetcode) {
    result = [
      {
        type: "leetcode",
        kind: "leetcode",
        id: alg.leetcode.id,
        leetcodeId: alg.leetcode.id,
        url: alg.leetcode.url,
      },
    ];
  } else {
    result = [{ type: "standard", kind: "standard", label: "Standard" }];
  }

  if (
    alg.topicIds.some(isMlInfraTopic) &&
    !result.some((source) => getSourceKind(source) === "ml_infra")
  ) {
    result.push({ type: "ml_infra", kind: "ml_infra", label: "ML Infra" });
  }
  return result;
}

export interface AlgorithmDefinition<TInput = unknown> {
  id: string;
  title: string;
  topicIds: readonly [TopicId, ...TopicId[]];
  difficulty?: DifficultyLevel;
  description: string;
  constraints?: string[];
  examples?: ProblemExample<TInput>[];
  code: string;
  timeComplexity: TimeComplexity;
  spaceComplexity: string;
  complexityAnalysis: ComplexityAnalysis;
  topicGuide: TopicGuide;
  /* Optional trivia sharpening (skip lines, decoys, hints). A solution with no
     metadata still drills correctly straight from `code` — see types/trivia.ts. */
  trivia?: TriviaMeta;
  leetcode?: LeetCodeMeta;
  sources?: ProblemSource[];
  generateSteps(input: TInput): AlgorithmStep[];
  defaultInput: TInput;
}

export type AppView = "ml-infra" | "tree" | "list" | "workspace" | "trivia";
