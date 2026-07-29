import type {
  AlgorithmDefinition,
  GraphEdgeItem,
  GraphNodeItem,
  TopicGuide,
} from "../../../types/dsa";
import type { TriviaMeta } from "../../../types/trivia";
import { TOPOLOGICAL_SORT_CODE } from "./pythonCode";
import { generateTopologicalSortSteps } from "./stepGenerator";

export interface TopologicalSortInput {
  nodes: GraphNodeItem[];
  edges: GraphEdgeItem[];
}

export const DEFAULT_TOPO_SORT_INPUT: TopologicalSortInput = {
  nodes: [
    { id: "5", label: "5", x: 100, y: 100, state: "default" },
    { id: "4", label: "4", x: 100, y: 200, state: "default" },
    { id: "2", label: "2", x: 250, y: 100, state: "default" },
    { id: "0", label: "0", x: 400, y: 100, state: "default" },
    { id: "1", label: "1", x: 400, y: 200, state: "default" },
    { id: "3", label: "3", x: 250, y: 200, state: "default" },
  ],
  edges: [
    { from: "5", to: "2" },
    { from: "5", to: "0" },
    { from: "4", to: "0" },
    { from: "4", to: "1" },
    { from: "2", to: "3" },
    { from: "3", to: "1" },
  ],
};

const TOPOLOGICAL_SORT_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>Topological Sorting linearly arranges the vertices of a <strong>Directed Acyclic Graph (DAG)</strong> <code>G = (V, E)</code> such that for every directed edge <code>u → v</code>, vertex <code>u</code> precedes vertex <code>v</code> in the ordering. <strong>Kahn's algorithm</strong> computes a topological sort by tracking in-degrees (incoming edge counts) and processing vertices with zero remaining prerequisites using a <strong>Breadth-First Search (BFS)</strong> queue. It runs in linear <code>O(V + E)</code> time and serves as both a task scheduler and a cycle detector.</p>",
  sections: [
    {
      heading: "Why It Exists & What It Solves",
      body: "<p>Many real-world problems involve ordered task execution under constraints — such as compiling software packages with build dependencies, planning university course prerequisites, or resolving spreadsheet cell evaluation orders. Topological Sort flattens a complex dependency DAG into a valid sequential execution order.</p>",
    },
    {
      heading: "Ready means nothing is pointing at you",
      body: "<p>A vertex's in-degree <code>in_degree[v]</code> represents how many unfulfilled prerequisites it must wait for. Vertices with in-degree 0 have no remaining dependencies and can be scheduled immediately. Kahn's algorithm maintains a queue of ready vertices, removing one at a time and decrementing in-degrees of downstream neighbors.</p>",
    },
    {
      heading: "Cycle Detection Mechanism",
      body: "<p>If a directed graph contains a cycle (e.g., <code>A → B → C → A</code>), no vertex in the cycle can ever reach in-degree 0 because each depends on another cycle member. Consequently, Kahn's queue empties before all <code>|V|</code> vertices are scheduled. If the output order contains fewer than <code>|V|</code> vertices, a cycle is detected and an empty order is returned.</p>",
    },
    {
      heading: "Step-by-Step Intuition",
      body: "<p>1. Calculate in-degrees for all <code>|V|</code> vertices.<br/>2. Enqueue all vertices with <code>in_degree === 0</code>.<br/>3. While queue is non-empty: dequeue vertex <code>u</code>, append to order, decrement in-degree for each outgoing neighbor <code>v</code>. If <code>in_degree[v] === 0</code>, enqueue <code>v</code>.<br/>4. If order length equals <code>|V|</code>, return order; else report cycle.</p>",
    },
    {
      heading: "Trade-offs: Kahn's BFS vs. DFS Topological Sort",
      body: "<p>Kahn's algorithm uses BFS/in-degrees, making it easy to detect cycles and implement parallel task scheduling. DFS-based topo sort uses post-order finishing times but requires separate color tracking to detect cycles.</p>",
    },
    {
      heading: "Complexity Analysis",
      body: "<p><strong>Time Complexity:</strong> <code>O(V + E)</code><br/><strong>Space Complexity:</strong> <code>O(V + E)</code><br/>Every vertex is enqueued and dequeued once, and every edge is traversed once to decrement in-degrees.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Directed Acyclic Graph (DAG)",
      definition:
        "A directed graph with no directed cycles; the only category of graphs that admits a topological ordering.",
    },
    {
      term: "In-degree",
      definition:
        "The number of directed edges pointing into a vertex, representing its count of unsatisfied dependencies.",
    },
    {
      term: "Topological Order",
      definition:
        "A linear sequence of vertices where all directed edge dependencies point strictly from left to right.",
    },
    {
      term: "Dependency Cycle",
      definition:
        "A circular dependency loop preventing any member vertex from reaching in-degree zero.",
    },
  ],
};

const TOPOLOGICAL_SORT_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Imports deque for O(1) ready-queue operations and defaultdict for adjacency list initialization.",
    2: "Blank line after module imports.",
    3: "Defines topological_sort(nodes, edges) function returning linear vertex ordering.",
    4: "Initializes in_degree table setting count to 0 for every node.",
    5: "Initializes adjacency list adj for storing directed edges.",
    6: "Iterates over directed edges (u, v) representing dependency constraints.",
    7: "Appends neighbor v to adjacency list of source node u.",
    8: "Increments in_degree count for target node v.",
    9: "Blank line separating graph initialization from queue creation.",
    10: "Enqueues all source nodes with in_degree == 0 (no prerequisites).",
    11: "Initializes empty order list to record scheduled topological sequence.",
    12: "Blank line separating initialization from BFS processing loop.",
    13: "Drives main loop while ready queue contains unblocked nodes.",
    14: "Dequeues next ready node u from front of queue.",
    15: "Appends node u to the topological output order.",
    16: "Iterates through all outgoing neighbors v of node u.",
    17: "Decrements in_degree count of neighbor v as dependency u is now resolved.",
    18: "Checks if neighbor v has no remaining unresolved prerequisites.",
    19: "Enqueues neighbor v now that its in_degree has reached 0.",
    20: "Blank line separating processing loop from cycle check.",
    21: "Returns order if all nodes were scheduled; returns empty list if cycle prevented full scheduling.",
  },
};

export const topologicalSort: AlgorithmDefinition<TopologicalSortInput> = {
  id: "topological-sort",
  title: "Topological Sort (Kahn's Algorithm)",
  topicIds: ["graph_directed_and_scc"],
  difficulty: "Medium",
  description:
    "<p>Given a Directed Acyclic Graph (DAG) <code>G = (V, E)</code>, compute a linear ordering of vertices such that for every directed edge <code>u → v</code>, vertex <code>u</code> appears before vertex <code>v</code> in the sequence.</p><h3>Problem Statement</h3><p>Compute a topological ordering using Kahn's in-degree algorithm. If the graph contains a directed cycle, indicate that no valid topological ordering exists.</p><h3>Input Parameters</h3><ul><li><code>nodes</code>: List of graph vertices.</li><li><code>edges</code>: List of directed edges connecting pairs of vertices.</li></ul><h3>Output</h3><p>Returns an array of vertex IDs in topological order, or an empty array if a directed cycle is present.</p>",
  constraints: [
    "1 <= V <= 10^4",
    "0 <= E <= 2 * 10^4",
    "Graph must be a Directed Acyclic Graph (DAG) for a full topological ordering; cycles return empty order",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay:
        "vertices = [5, 4, 2, 3, 1, 0], edges = [(5,2), (5,0), (4,0), (4,1), (2,3), (3,1)]",
      outputDisplay: "[5, 4, 2, 3, 1, 0]",
      title: "Standard DAG Topological Order",
      input: DEFAULT_TOPO_SORT_INPUT,
      output: "[5, 4, 2, 0, 3, 1]",
      explanation:
        "Nodes 5 and 4 start with in-degree 0. Processing them unblocks nodes 2 and 0, leading to a complete valid topological order.",
    },
    {
      kind: "complex",
      scenario: "boundary",
      inputDisplay: "vertices = [A, B, C], edges = []",
      outputDisplay: "[A, B, C]",
      title: "Boundary Disconnected Graph with No Edges",
      input: {
        nodes: [
          { id: "A", label: "A", state: "default" },
          { id: "B", label: "B", state: "default" },
          { id: "C", label: "C", state: "default" },
        ],
        edges: [],
      },
      output: "[A, B, C]",
      explanation:
        "All vertices have in-degree 0 initially and can be ordered in any arbitrary sequence.",
    },
    {
      kind: "negative",
      scenario: "adversarial",
      inputDisplay: "vertices = [A, B, C], edges = [(A,B), (B,C), (C,A)]",
      outputDisplay: "Cycle Detected (Not a DAG)",
      title: "Adversarial Directed Cycle",
      input: {
        nodes: [
          { id: "A", label: "A", state: "default" },
          { id: "B", label: "B", state: "default" },
          { id: "C", label: "C", state: "default" },
        ],
        edges: [
          { from: "A", to: "B" },
          { from: "B", to: "C" },
          { from: "C", to: "A" },
        ],
      },
      output: "[]",
      explanation:
        "The graph contains a directed cycle (A -> B -> C -> A). All in-degrees remain positive (> 0), so no node can be enqueued and cycle detection reports failure.",
    },
  ],
  code: TOPOLOGICAL_SORT_CODE,
  timeComplexity: {
    best: "O(V + E)",
    average: "O(V + E)",
    worst: "O(V + E)",
  },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Every vertex enters and leaves the queue exactly once, and every edge is examined exactly once — at the moment its source node is dequeued and the neighbor's in-degree is decremented. That single pass over vertices plus edges gives O(V + E) in every case.",
    space:
      "The in-degree map, the queue, and the output order each hold at most one entry per vertex, so extra memory grows linearly with the vertex count — O(V).",
  },
  topicGuide: TOPOLOGICAL_SORT_TOPIC_GUIDE,
  trivia: TOPOLOGICAL_SORT_TRIVIA,
  leetcode: {
    id: 207,
    url: "https://leetcode.com/problems/course-schedule/",
  },
  sources: [
    {
      kind: "leetcode",
      label: "LeetCode #207",
      leetcodeId: 207,
      url: "https://leetcode.com/problems/course-schedule/",
    },
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 16",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 16,
      section: "16.1 Topological sorting",
    },
  ],
  defaultInput: DEFAULT_TOPO_SORT_INPUT,
  generateSteps: generateTopologicalSortSteps,
};

export default topologicalSort;
