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

export type GraphEdgeDecisionState = "default" | "candidate" | "selected" | "rejected";

export interface GraphEdgeItem {
  from: string;
  to: string;
  weight?: number;
  /** Explicit teaching state for edge-selection algorithms such as Kruskal's. */
  state?: GraphEdgeDecisionState;
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

export type TutorialPhase = "intro" | "walkthrough" | "scenario";

export type TutorialScenarioKind = "standard" | "boundary" | "adversarial";

export type TutorialStepMeta =
  | { phase: "intro"; scenario?: never }
  | { phase: "walkthrough"; scenario?: never }
  | { phase: "scenario"; scenario: TutorialScenarioKind };

export type PrimaryVisualKind =
  | "array"
  | "grid"
  | "graph"
  | "tree"
  | "vector"
  | "matrix"
  | "quantization"
  | "interval"
  | "heap"
  | "dsu"
  | "hashtable"
  | "statespace"
  | "composite"
  | "callstack"
  | "bitmask"
  | "attentionmap"
  | "trie";

/** Canonical bare identity for an authorable primitive snapshot. */
export interface VisualSnapshotIdentity {
  /** A short bare identifier such as `nums` or `network`; renderers own notation. */
  name?: string;
}

export interface ArrayVisualSnapshot extends VisualSnapshotIdentity {
  kind: "array";
  elements: ArrayElement[];
  mode?: "bar" | "box";
  /** Use a shallow, wide treatment when this persistent array shares a canvas with other state. */
  density?: "compact";
  /**
   * Short variable/entity assignment identifier ONLY (e.g. "nums =", "prefix =", "scanner =").
   * STRICTLY PROHIBITED: Long text sentences, step descriptions, or formulas.
   */
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface GridVisualSnapshot extends VisualSnapshotIdentity {
  kind: "grid";
  grid: GridCellNode[][];
}

export interface GraphVisualSnapshot extends VisualSnapshotIdentity {
  kind: "graph";
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
  directed?: boolean;
  /**
   * Opt into an irregular, weight-informed arrangement for a weighted graph.
   * Edge labels remain the source of truth for costs; geometry only improves
   * separation and must not be read as a literal cost scale.
   */
  layout?: "authored" | "weighted";
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface TreeVisualSnapshot extends VisualSnapshotIdentity {
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

export interface VectorVisualSnapshot extends VisualSnapshotIdentity {
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

export interface MatrixVisualSnapshot extends VisualSnapshotIdentity {
  kind: "matrix";
  rows: number;
  cols: number;
  cells: MatrixCellItem[];
  rowHeaders?: string[];
  colHeaders?: string[];
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface BitItem {
  index: number;
  label?: string;
  value: string | number;
  state?: "default" | "active" | "sign" | "exponent" | "mantissa" | "quantized";
  bitGroup?: string;
}

export interface QuantizationVisualSnapshot extends VisualSnapshotIdentity {
  kind: "quantization";
  originalValue?: number | string;
  quantizedValue?: number | string;
  scale?: number | string;
  zeroPoint?: number | string;
  bits: BitItem[];
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface IntervalItem {
  id: string;
  start: number;
  end: number;
  label?: string;
  state?: ElementState;
  group?: number;
  track?: number;
}

export interface SweepLineEventPoint {
  id?: string;
  position: number;
  label?: string;
  type?: "start" | "end" | "point";
  state?: ElementState;
}

export interface IntervalVisualSnapshot extends VisualSnapshotIdentity {
  kind: "interval";
  intervals: IntervalItem[];
  sweepLine?: { position: number; label?: string; state?: ElementState };
  eventPoints?: SweepLineEventPoint[];
  axis?: { min?: number; max?: number; label?: string };
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface HeapItem {
  id?: string;
  val: number | string;
  label?: string;
  state?: ElementState;
}

export interface HeapVisualSnapshot extends VisualSnapshotIdentity {
  kind: "heap";
  heap: (HeapItem | number | string)[];
  heapType?: "min" | "max";
  swapPair?: [number, number];
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface DsuNodeItem {
  id: string;
  parentId: string;
  rank?: number;
  size?: number;
  label?: string;
  state?: ElementState;
  group?: number;
}

export interface DsuVisualSnapshot extends VisualSnapshotIdentity {
  kind: "dsu";
  nodes: DsuNodeItem[];
  activeIds?: string[];
  /** Show the changing parent table when the full forest would be too cramped. */
  density?: "compact";
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface HashEntryItem {
  key: string | number;
  value: string | number;
  hash?: number;
  state?: ElementState;
  color?: string;
}

export interface HashBucketItem {
  index: number;
  label?: string;
  entries: HashEntryItem[];
  state?: ElementState;
}

export interface HashTableVisualSnapshot extends VisualSnapshotIdentity {
  kind: "hashtable";
  buckets: HashBucketItem[];
  hashFunction?: string;
  probingSequence?: number[];
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface StateSpaceNodeItem {
  id: string;
  label: string;
  state?: ElementState;
  depth?: number;
  score?: number | string;
  isGoal?: boolean;
  isPruned?: boolean;
  isCurrent?: boolean;
  group?: number;
  x?: number;
  y?: number;
}

export interface StateSpaceEdgeItem {
  from: string;
  to: string;
  label?: string;
  action?: string;
  cost?: number | string;
  state?: ElementState;
  isPath?: boolean;
}

export interface StateSpaceVisualSnapshot extends VisualSnapshotIdentity {
  kind: "statespace";
  nodes: StateSpaceNodeItem[];
  edges?: StateSpaceEdgeItem[];
  activeNodeId?: string;
  path?: string[];
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface CompositeCanvasItem {
  id: string;
  role: "primary" | "auxiliary" | "comparison";
  snapshot: NonCompositeVisualSnapshot;
  colSpan?: number;
  rowSpan?: number;
  widthRatio?: number;
  heightRatio?: number;
}

export interface CompositeCanvasSnapshot {
  kind: "composite";
  items: CompositeCanvasItem[];
  /**
   * `persistent` reserves a stable 12-column teaching grid: evolving primary
   * structures can remain visible while a shallow auxiliary strip spans below.
   */
  layout?: "flex" | "grid" | "horizontal" | "vertical" | "auto" | "persistent";
  columns?: number;
  rows?: number;
  heading?: string;
  gap?: number | string;
}

export interface CallStackFrameItem {
  id: string;
  name: string;
  args?: Record<string, DisplayValue>;
  returnValue?: DisplayValue;
  state?: ElementState;
  isCurrent?: boolean;
}

export interface CallStackVisualSnapshot extends VisualSnapshotIdentity {
  kind: "callstack";
  frames: CallStackFrameItem[];
  activeFrameIndex?: number;
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface BitmaskItem {
  index: number;
  value: 0 | 1 | string | number;
  label?: string;
  state?: ElementState;
  group?: string;
}

export interface BitmaskVisualSnapshot extends VisualSnapshotIdentity {
  kind: "bitmask";
  bits: BitmaskItem[];
  value?: number | string;
  label?: string;
  bitWidth?: number;
  operation?: {
    name: string;
    operand?: number | string;
    result?: number | string;
  };
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface AttentionMapVisualSnapshot extends VisualSnapshotIdentity {
  kind: "attentionmap";
  queryTokens: string[];
  keyTokens: string[];
  weights: number[][];
  activeQueryIndex?: number;
  activeKeyIndex?: number;
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export interface TrieNodeItem {
  id: string;
  char: string;
  isEndOfWord?: boolean;
  state?: ElementState;
  children?: string[];
  parentId?: string;
  x?: number;
  y?: number;
  frequency?: number;
}

export interface TrieEdgeItem {
  from: string;
  to: string;
  char?: string;
  state?: ElementState;
}

export interface TrieVisualSnapshot extends VisualSnapshotIdentity {
  kind: "trie";
  nodes: TrieNodeItem[];
  edges?: TrieEdgeItem[];
  rootId?: string;
  activePath?: string[];
  searchWord?: string;
  /** @deprecated Use `name` for primitive identity. */
  title?: string;
}

export type NonCompositeVisualSnapshot =
  | ArrayVisualSnapshot
  | GridVisualSnapshot
  | GraphVisualSnapshot
  | TreeVisualSnapshot
  | VectorVisualSnapshot
  | MatrixVisualSnapshot
  | QuantizationVisualSnapshot
  | IntervalVisualSnapshot
  | HeapVisualSnapshot
  | DsuVisualSnapshot
  | HashTableVisualSnapshot
  | StateSpaceVisualSnapshot
  | CallStackVisualSnapshot
  | BitmaskVisualSnapshot
  | AttentionMapVisualSnapshot
  | TrieVisualSnapshot;

export type PrimaryVisualSnapshot = NonCompositeVisualSnapshot | CompositeCanvasSnapshot;

export interface AlgorithmStep {
  stepIndex: number;
  codeLine?: number;
  explanation: StepExplanation;
  /** The canonical prose for new tutorial steps. */
  narrative?: string;
  /** Phase metadata for tutorials authored with the narrative-step contract. */
  tutorial?: TutorialStepMeta;
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
  scenario?: TutorialScenarioKind;
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

export interface CodeVariant {
  readonly id: string;
  readonly label: string;
  readonly code: string;
  readonly description?: string;
  readonly timeComplexity?: TimeComplexity;
  readonly spaceComplexity?: string;
  readonly complexityAnalysis?: ComplexityAnalysis;
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
  codeVariants?: readonly CodeVariant[];
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
