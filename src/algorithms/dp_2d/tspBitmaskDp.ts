import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TspBitmaskDpInput {
  n: number;
  dist: number[][];
}

export const DEFAULT_TSP_BITMASK_INPUT: TspBitmaskDpInput = {
  n: 4,
  dist: [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0],
  ],
};

export const PYTHON_TSP_BITMASK_CODE = `def tsp_bitmask(dist: list[list[int]]) -> int:
    n = len(dist)
    INF = float('inf')
    num_masks = 1 << n
    dp = [[INF] * n for _ in range(num_masks)]
    dp[1][0] = 0

    for mask in range(1, num_masks):
        for u in range(n):
            if dp[mask][u] == INF:
                continue
            for v in range(n):
                if not (mask & (1 << v)) and dist[u][v] != INF:
                    next_mask = mask | (1 << v)
                    dp[next_mask][v] = min(dp[next_mask][v], dp[mask][u] + dist[u][v])

    full_mask = (1 << n) - 1
    ans = INF
    for u in range(1, n):
        if dist[u][0] != INF and dp[full_mask][u] != INF:
            ans = min(ans, dp[full_mask][u] + dist[u][0])

    return ans if ans != INF else -1`;

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "The Traveling Salesperson Problem (TSP) seeks the minimum-weight closed tour that starts at City 0, visits every city exactly once, and returns to City 0.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "c0", label: "City 0", x: 100, y: 100, state: "active" },
        { id: "c1", label: "City 1", x: 250, y: 100, state: "default" },
        { id: "c2", label: "City 2", x: 250, y: 250, state: "default" },
        { id: "c3", label: "City 3", x: 100, y: 250, state: "default" },
      ],
      edges: [
        { from: "c0", to: "c1", weight: 10, isPath: true },
        { from: "c1", to: "c2", weight: 35, isPath: true },
        { from: "c2", to: "c3", weight: 30, isPath: true },
        { from: "c3", to: "c0", weight: 20, isPath: true },
      ],
    },
  },
  {
    narrative:
      "Checking all (N-1)! permutations in brute-force order takes factorial O(N!) time, which quickly becomes intractable even for modest city counts (N > 12).",
    primarySnapshot: {
      kind: "array",
      name: "complexity_contrast",
      mode: "box",
      elements: [
        { id: "b1", value: "Brute-Force Search: O(N!)", state: "compare" },
        { id: "b2", value: "Held-Karp Bitmask DP: O(N^2 * 2^N)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Held-Karp DP recognizes that the minimum cost to complete a tour depends only on the set of visited cities and the current endpoint, independent of exact traversal history.",
    primarySnapshot: {
      kind: "array",
      name: "state_tuple",
      mode: "box",
      elements: [
        { id: "st1", value: "Visited Subset (Bitmask)", state: "active" },
        { id: "st2", value: "Current Endpoint (u)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "An N-bit integer mask encodes the visited city subset, where bit i = 1 if City i has been visited and 0 if unvisited.",
    primarySnapshot: {
      kind: "bitmask",
      name: "subset_bitmask",
      value: 13,
      bitWidth: 4,
      label: "Visited Cities Subset (1101₂ = {0, 2, 3})",
      bits: [
        { index: 0, value: 1, label: "City 0", state: "active" },
        { index: 1, value: 0, label: "City 1", state: "default" },
        { index: 2, value: 1, label: "City 2", state: "active" },
        { index: 3, value: 1, label: "City 3", state: "active" },
      ],
    },
  },
  {
    narrative:
      "We define dp[mask][u] as the minimum path distance to visit the subset of cities in mask and terminate at City u.",
    primarySnapshot: {
      kind: "matrix",
      name: "dp",
      rows: 4,
      cols: 4,
      rowHeaders: ["0001₂", "0011₂", "0101₂", "1111₂"],
      colHeaders: ["u=0", "u=1", "u=2", "u=3"],
      cells: [
        { row: 0, col: 0, value: 0, state: "sorted" },
        { row: 0, col: 1, value: "∞", state: "default" },
        { row: 0, col: 2, value: "∞", state: "default" },
        { row: 0, col: 3, value: "∞", state: "default" },
        { row: 1, col: 0, value: "∞", state: "default" },
        { row: 1, col: 1, value: 10, state: "active" },
        { row: 1, col: 2, value: "∞", state: "default" },
        { row: 1, col: 3, value: "∞", state: "default" },
        { row: 2, col: 0, value: "∞", state: "default" },
        { row: 2, col: 1, value: "∞", state: "default" },
        { row: 2, col: 2, value: 15, state: "active" },
        { row: 2, col: 3, value: "∞", state: "default" },
        { row: 3, col: 0, value: "∞", state: "default" },
        { row: 3, col: 1, value: 85, state: "compare" },
        { row: 3, col: 2, value: 80, state: "sorted" },
        { row: 3, col: 3, value: 90, state: "compare" },
      ],
    },
  },
  {
    narrative:
      "The base case sets dp[1][0] = 0 (bitmask 0001₂), representing the start of the tour at City 0 with 0 accumulated distance.",
    primarySnapshot: {
      kind: "bitmask",
      name: "base_case",
      value: 1,
      bitWidth: 4,
      label: "Base Case: dp[1][0] = 0",
      bits: [
        { index: 0, value: 1, label: "City 0 (Start)", state: "sorted" },
        { index: 1, value: 0, label: "City 1", state: "default" },
        { index: 2, value: 0, label: "City 2", state: "default" },
        { index: 3, value: 0, label: "City 3", state: "default" },
      ],
    },
  },
  {
    narrative:
      "For an active state dp[mask][u] and unvisited city v, we transition to next_mask = mask | (1 << v), updating dp[next_mask][v] = min(dp[next_mask][v], dp[mask][u] + dist[u][v]).",
    primarySnapshot: {
      kind: "array",
      name: "recurrence",
      mode: "box",
      elements: [
        { id: "r1", value: "Current State: dp[mask][u]", state: "compare" },
        { id: "r2", value: "+ Edge dist[u][v]", state: "compare" },
        { id: "r3", value: "-> dp[mask | (1<<v)][v]", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "After expanding all subproblems up to full_mask = (1 << N) - 1, we close the Hamiltonian cycle by adding return edge dist[u][0] back to City 0.",
    primarySnapshot: {
      kind: "graph",
      directed: true,
      nodes: [
        { id: "c0", label: "City 0", x: 100, y: 100, state: "active" },
        { id: "c1", label: "City 1", x: 250, y: 100, state: "visited" },
        { id: "c2", label: "City 2", x: 250, y: 250, state: "visited" },
        { id: "c3", label: "City 3", x: 100, y: 250, state: "pivot" },
      ],
      edges: [
        { from: "c0", to: "c1", weight: 10, isTraversed: true },
        { from: "c1", to: "c2", weight: 35, isTraversed: true },
        { from: "c2", to: "c3", weight: 30, isTraversed: true },
        { from: "c3", to: "c0", weight: 20, isPath: true, isTraversed: true },
      ],
    },
  },
  {
    narrative:
      "Held-Karp reduces TSP complexity to O(N^2 * 2^N) time and O(N * 2^N) space, finding the exact optimal tour for up to N = 20 cities.",
    primarySnapshot: {
      kind: "array",
      name: "summary",
      mode: "box",
      elements: [
        { id: "s1", value: "Exact TSP Time: O(N^2 * 2^N)", state: "sorted" },
        { id: "s2", value: "Auxiliary Space: O(N * 2^N)", state: "default" },
      ],
    },
  },
];

export const generateTspBitmaskDpSteps = (input: TspBitmaskDpInput): AlgorithmStep[] => {
  const n = Math.min(6, Math.max(2, input?.n ?? DEFAULT_TSP_BITMASK_INPUT.n));
  const rawDist = input?.dist ?? DEFAULT_TSP_BITMASK_INPUT.dist;
  const dist: number[][] = Array.from({ length: n }, (_, u) =>
    Array.from({ length: n }, (_, v) => {
      const val = rawDist?.[u]?.[v];
      return typeof val === "number" ? val : u === v ? 0 : Infinity;
    }),
  );

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const INF = Infinity;
  const numMasks = 1 << n;
  const dp: number[][] = Array.from({ length: numMasks }, () => new Array<number>(n).fill(INF));
  dp[1][0] = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const isDefaultTutorialInput =
    !input ||
    (input.n === DEFAULT_TSP_BITMASK_INPUT.n &&
      Array.isArray(input.dist) &&
      input.dist.every((row, u) =>
        row.every((val, v) => val === DEFAULT_TSP_BITMASK_INPUT.dist[u][v]),
      ));

  if (isDefaultTutorialInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const nodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return {
      id: `city-${i}`,
      label: `City ${i}`,
      x: Math.round(150 + 100 * Math.cos(angle)),
      y: Math.round(150 + 100 * Math.sin(angle)),
      state: i === 0 ? "active" : "default",
    };
  });

  const makeGraphSnapshot = (activeU?: number, activeV?: number): GraphVisualSnapshot => {
    const edgesList: GraphEdgeItem[] = [];
    for (let u = 0; u < n; u++) {
      for (let v = 0; v < n; v++) {
        if (u !== v && dist[u][v] !== INF) {
          const isActive = u === activeU && v === activeV;
          edgesList.push({
            from: `city-${u}`,
            to: `city-${v}`,
            weight: dist[u][v],
            isPath: isActive,
            isTraversed: isActive,
          });
        }
      }
    }
    return {
      kind: "graph",
      directed: true,
      nodes: nodes.map((node, i) => ({
        ...node,
        state: i === activeV ? "active" : i === activeU ? "pivot" : "default",
      })),
      edges: edgesList,
    };
  };

  addStep(
    `Initializing Held-Karp Bitmask DP for ${n} cities. Setting base case dp[1][0] = 0 (City 0 visited).`,
    makeGraphSnapshot(0),
  );

  for (let mask = 1; mask < numMasks; mask++) {
    for (let u = 0; u < n; u++) {
      if (dp[mask][u] === INF) continue;

      for (let v = 0; v < n; v++) {
        if (!(mask & (1 << v)) && dist[u][v] !== INF) {
          const nextMask = mask | (1 << v);
          const candidate = dp[mask][u] + dist[u][v];

          if (candidate < dp[nextMask][v]) {
            dp[nextMask][v] = candidate;
            addStep(
              `Sub-tour transition from City ${u} to City ${v} (weight ${dist[u][v]}): expanding visited subset ${mask.toString(2)}₂ -> ${nextMask.toString(2)}₂ with updated path cost dp[${nextMask.toString(2)}₂][${v}] = ${candidate}.`,
              makeGraphSnapshot(u, v),
            );
          }
        }
      }
    }
  }

  const fullMask = (1 << n) - 1;
  let ans = INF;
  let bestLastCity = -1;

  for (let u = 1; u < n; u++) {
    if (dist[u][0] !== INF && dp[fullMask][u] !== INF) {
      const totalCost = dp[fullMask][u] + dist[u][0];
      if (totalCost < ans) {
        ans = totalCost;
        bestLastCity = u;
      }
    }
  }

  const finalAns = ans === INF ? -1 : ans;
  addStep(
    finalAns !== -1
      ? `Completed TSP Bitmask DP: optimal closed tour cost = ${finalAns} (closing return edge from City ${bestLastCity} back to City 0).`
      : `Completed TSP Bitmask DP: graph is disconnected, returning -1.`,
    makeGraphSnapshot(bestLastCity !== -1 ? bestLastCity : 0, 0),
  );

  return steps;
};

const TSP_BITMASK_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines tsp_bitmask(dist) -> int: computes minimum Hamiltonian tour cost using Held-Karp algorithm.",
    2: "Determines city count n from distance matrix dimensions.",
    3: "Defines infinity sentinel value for unreachable graph paths.",
    4: "Calculates total subset mask states num_masks = 2^n.",
    5: "Allocates 2D DP table dp of size (2^n) x n initialized to infinity.",
    6: "Sets base case dp[1][0] = 0 (starting at City 0 with mask 1).",
    7: "Blank line separating initialization from DP subproblem loops.",
    8: "Outer loop sweeps visited subset bitmask from 1 to 2^n - 1.",
    9: "Middle loop iterates through current ending city u.",
    10: "Skips unreachable state configurations where dp[mask][u] is Infinity.",
    11: "Continues loop if current bitmask state is unreachable.",
    12: "Inner loop iterates through next candidate city v.",
    13: "Checks if city v is unvisited in mask and edge (u, v) exists.",
    14: "Computes new bitmask next_mask by setting bit v.",
    15: "Relaxes dp[next_mask][v] = min(dp[next_mask][v], dp[mask][u] + dist[u][v]).",
    16: "Blank line separating forward transitions from return tour calculation.",
    17: "Calculates bitmask representing all cities visited: full_mask = (1 << n) - 1.",
    18: "Initializes best tour cost answer accumulator to Infinity.",
    19: "Sweeps last visited city u to add return edge cost dist[u][0] back to start City 0.",
    20: "Checks if return edge to City 0 and full_mask state are reachable.",
    21: "Updates minimum closed tour cost ans = min(ans, dp[full_mask][u] + dist[u][0]).",
    22: "Blank line separating return tour calculation from final result return.",
    23: "Returns minimum total tour cost or -1 if no valid Hamiltonian tour exists.",
  },
};

export const tspBitmaskDp: AlgorithmDefinition<TspBitmaskDpInput> = {
  id: "tsp-bitmask-dp",
  title: "Traveling Salesperson Problem (Bitmask DP)",
  topicIds: ["dp_2d"],
  difficulty: "Hard",
  description:
    "<p>Given <code>N</code> cities and an <code>N &times; N</code> distance matrix <code>dist</code> where <code>dist[u][v]</code> is the travel cost between city <code>u</code> and city <code>v</code>, find the minimum total cost of a closed tour that starts at city 0, visits every city exactly once, and returns to city 0. If no valid tour exists, return <code>-1</code>.</p><p><strong>Input:</strong> An integer <code>n</code> and a 2D integer array <code>dist</code>.</p><p><strong>Output:</strong> The minimum path cost of a complete closed Hamiltonian tour, or <code>-1</code> if no valid tour exists.</p>",
  constraints: [
    "2 <= N <= 20",
    "0 <= dist[u][v] <= 10^4",
    "Graph may be symmetric or asymmetric",
    "If no valid Hamiltonian tour exists, return -1",
  ],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      inputDisplay: "n = 4, 4x4 dist matrix",
      outputDisplay: "80",
      title: "Standard Case",
      input: {
        n: 4,
        dist: [
          [0, 10, 15, 20],
          [10, 0, 35, 25],
          [15, 35, 0, 30],
          [20, 25, 30, 0],
        ],
      },
      output: "80",
      explanation: "Optimal tour 0 -> 1 -> 3 -> 2 -> 0 costs 10 + 25 + 30 + 15 = 80.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      inputDisplay: "n = 4, asymmetric dist matrix",
      outputDisplay: "21",
      title: "Adversarial Asymmetric Distances",
      input: {
        n: 4,
        dist: [
          [0, 2, 9, 10],
          [1, 0, 6, 4],
          [15, 7, 0, 8],
          [6, 3, 12, 0],
        ],
      },
      output: "21",
      explanation: "Optimal asymmetric tour length is 21.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      inputDisplay: "n = 3, disconnected graph",
      outputDisplay: "-1",
      title: "Disconnected Graph Boundary",
      input: {
        n: 3,
        dist: [
          [0, Infinity, 5],
          [Infinity, 0, Infinity],
          [5, Infinity, 0],
        ],
      },
      output: "-1",
      explanation:
        "City 1 is unreachable from City 0, so no valid Hamiltonian tour exists, returning -1.",
    },
  ],
  code: PYTHON_TSP_BITMASK_CODE,
  timeComplexity: { best: "O(N^2 * 2^N)", average: "O(N^2 * 2^N)", worst: "O(N^2 * 2^N)" },
  spaceComplexity: "O(N * 2^N)",
  complexityAnalysis: {
    time: "Fills a DP table of size (2^N) × N. For each state, we iterate over N candidate next cities, taking O(N^2 * 2^N) total time.",
    space:
      "Requires a 2D matrix of size (2^N) × N to store minimum tour costs for each bitmask and ending city.",
  },
  topicGuide: {
    overview:
      "<p>The Traveling Salesperson Problem (TSP) is the quintessential NP-hard optimization problem in graph theory and operations research. Given <code>N</code> cities and an <code>N &times; N</code> distance matrix <code>dist</code>, we find a minimum-weight Hamiltonian cycle. Held-Karp Bitmask DP reduces runtime from <span>O(N!)</span> down to <span>O(N&sup2; &middot; 2ᴺ)</span> time and <span>O(N &middot; 2ᴺ)</span> space.</p>",
    sections: [
      {
        heading: "1. Subset Bitmask Representation",
        body: "<p>An <code>N</code>-bit integer <code>mask</code> represents the set of visited cities (bit <code>i</code> is <code>1</code> if city <code>i</code> has been visited). A 2D array <code>dp[mask][u]</code> records the minimum distance to visit all cities in <code>mask</code>, ending at city <code>u</code>.</p>",
      },
      {
        heading: "2. Held-Karp Recurrence & Transitions",
        body: "<p><strong>Base Case:</strong> <code>dp[1][0] = 0</code> (starting at City 0).</p><p><strong>Forward Edge Relaxation:</strong> <code>dp[mask | (1 &lt;&lt; v)][v] = min(dp[mask | (1 &lt;&lt; v)][v], dp[mask][u] + dist[u][v])</code></p><p><strong>Closing the Tour:</strong> <code>Cost = min_{u &ne; 0} (dp[2ᴺ - 1][u] + dist[u][0])</code></p>",
      },
      {
        heading: "3. Systems & Industrial Applications",
        body: "<p>TSP models real-world logistics and manufacturing routing:</p><ul><li><strong>Delivery Fleet Vehicle Routing:</strong> Optimizing package delivery paths for UPS/FedEx fleets.</li><li><strong>PCB Lithography &amp; Drill Trajectory:</strong> Minimizing robotic drill head movements across circuit boards.</li><li><strong>Microchip Laser Inspection:</strong> Positioning inspection optics over wafer targets.</li></ul>",
      },
      {
        heading: "4. Scalability Limits & Heuristics",
        body: "<p>Held-Karp solves TSP exactly for <code>N &le; 22</code> within seconds. For larger <code>N &gt; 50</code>, heuristic algorithms (e.g. Christofides 1.5-approximation, 2-opt local search, simulated annealing) are required.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Held-Karp Algorithm",
        definition:
          "A bitmask dynamic programming algorithm that solves exact TSP in O(N² · 2ᴺ) time.",
      },
      {
        term: "Hamiltonian Cycle",
        definition:
          "A closed loop in a graph that visits every vertex exactly once before returning to the start.",
      },
      {
        term: "NP-Hard",
        definition:
          "A class of computational problems for which no polynomial-time exact algorithm is known to exist.",
      },
    ],
  },
  trivia: TSP_BITMASK_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 10,
      label: "Competitive Programmer's Handbook, Ch 10",
    },
  ],
  defaultInput: DEFAULT_TSP_BITMASK_INPUT,
  generateSteps: generateTspBitmaskDpSteps,
};
