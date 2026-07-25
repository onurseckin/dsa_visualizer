export type ElementState =
  | 'default'
  | 'compare'
  | 'swap'
  | 'sorted'
  | 'active'
  | 'pivot'
  | 'visited'
  | 'queued'
  | 'in-stack'
  | 'path';

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
  label: string;
  x?: number;
  y?: number;
  state: ElementState;
  val?: number;
}

export interface GraphEdgeItem {
  from: string;
  to: string;
  weight?: number;
  isTraversed?: boolean;
  isPath?: boolean;
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

export type PrimaryVisualKind = 'array' | 'grid' | 'graph' | 'tree';

export interface ArrayVisualSnapshot {
  kind: 'array';
  elements: ArrayElement[];
}

export interface GridVisualSnapshot {
  kind: 'grid';
  grid: GridCellNode[][];
}

export interface GraphVisualSnapshot {
  kind: 'graph';
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export interface TreeVisualSnapshot {
  kind: 'tree';
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

export type ViewMode = 'split' | 'visual' | 'code';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type CategoryType =
  | 'arrays_and_hashing'
  | 'two_pointers'
  | 'stack'
  | 'binary_search'
  | 'sliding_window'
  | 'linked_list'
  | 'trees'
  | 'tries'
  | 'heap'
  | 'backtracking'
  | 'graphs'
  | 'dp_1d'
  | 'intervals'
  | 'greedy'
  | 'advanced_graphs'
  | 'math_and_geometry'
  | 'dp_2d'
  | 'bit_manipulation'
  | 'advanced_range_and_cp'
  | 'sorting'
  | 'leetcode'
  | 'fundamentals'
  | 'data-structures'
  | 'dynamic-programming'
  | 'graph'
  | 'tree'
  | 'advanced'
  | 'math-games';

export interface TimeComplexity {
  best: string;
  average: string;
  worst: string;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface AlgorithmDefinition<TInput = unknown> {
  id: string;
  title: string;
  category: CategoryType;
  difficulty?: DifficultyLevel;
  description: string;
  constraints?: string[];
  examples?: ProblemExample[];
  code: string;
  timeComplexity: TimeComplexity;
  spaceComplexity: string;
  generateSteps: (input: TInput) => AlgorithmStep[];
  defaultInput: TInput;
}
