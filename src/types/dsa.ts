import type { TriviaMeta } from "./trivia";

export type ElementState =
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

export interface ArrayElement {
  id: string;
  value: number;
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
  stack?: Array<string | number>;
  queue?: Array<string | number>;
  visited?: Array<string | number>;
  hashMap?: Record<string, string | number>;
  distanceTable?: Record<string, number>;
  customState?: Record<string, string | number>;
}

export interface StepExplanation {
  what: string;
  why: string;
}

export type PrimaryVisualKind = "array" | "grid" | "graph" | "tree";

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

export type PrimaryVisualSnapshot =
  | ArrayVisualSnapshot
  | GridVisualSnapshot
  | GraphVisualSnapshot
  | TreeVisualSnapshot;

export interface AlgorithmStep {
  stepIndex: number;
  codeLine: number;
  explanation: StepExplanation;
  primarySnapshot: PrimaryVisualSnapshot;
  auxiliaryState: AuxiliaryState;
  variables: Record<string, string | number | boolean>;
}

/* Retained for compatibility with older persisted settings; the workspace now
   models panel visibility as independent toggles (see PanelVisibility). */
export type ViewMode = "split" | "visual" | "code";

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

export type CategoryType =
  | "arrays_and_hashing"
  | "two_pointers"
  | "sliding_window"
  | "stack_and_queue"
  | "binary_search"
  | "linked_list"
  | "tree_fundamentals"
  | "tree_queries_and_diameter"
  | "tries_and_strings"
  | "heap_and_priority_queue"
  | "backtracking"
  | "graph_traversal"
  | "graph_shortest_paths"
  | "graph_spanning_trees"
  | "graph_directed_and_scc"
  | "graph_flows_and_cuts"
  | "dp_1d"
  | "dp_2d"
  | "intervals"
  | "greedy_algorithms"
  | "bit_manipulation"
  | "math_and_number_theory"
  | "game_theory"
  | "advanced_range_queries"
  | "geometry_and_sweep_line"
  // Compatibility aliases
  | "stack"
  | "trees"
  | "tries"
  | "heap"
  | "graphs"
  | "greedy"
  | "advanced_graphs"
  | "math_and_geometry"
  | "advanced_range_and_cp"
  | "sorting"
  | "leetcode"
  | "fundamentals"
  | "data-structures"
  | "dynamic-programming"
  | "graph"
  | "tree"
  | "advanced"
  | "math-games";

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

export type SourceKind = "leetcode" | "book" | "standard" | "hackerrank" | "other";

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

export type ProblemSource = LeetCodeSource | BookSource | StandardSource;

export function getSourceKind(source: ProblemSource): SourceKind {
  return source.kind || source.type || "standard";
}

export function getAlgorithmSources(alg: {
  sources?: ProblemSource[];
  leetcode?: LeetCodeMeta | { id: number; url: string };
}): ProblemSource[] {
  if (alg.sources && alg.sources.length > 0) {
    return alg.sources;
  }
  if (alg.leetcode) {
    return [{ type: "leetcode", kind: "leetcode", id: alg.leetcode.id, leetcodeId: alg.leetcode.id, url: alg.leetcode.url }];
  }
  return [{ type: "standard", kind: "standard", label: "Standard" }];
}

export interface AlgorithmDefinition<TInput = unknown> {
  id: string;
  title: string;
  category: CategoryType;
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
  generateSteps: (input: TInput) => AlgorithmStep[];
  defaultInput: TInput;
}

export type AppView = "tree" | "list" | "workspace" | "trivia";
