import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphEdgeItem,
  GraphNodeItem,
  GraphVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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

export const generateTspBitmaskDpSteps = (input: TspBitmaskDpInput): AlgorithmStep[] => {
  const n = Math.min(6, Math.max(2, input?.n ?? DEFAULT_TSP_BITMASK_INPUT.n));
  const dist = input?.dist ?? DEFAULT_TSP_BITMASK_INPUT.dist;
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const INF = Infinity;
  const numMasks = 1 << n;
  const dp: number[][] = Array.from({ length: numMasks }, () => new Array<number>(n).fill(INF));
  dp[1][0] = 0;

  const nodes: GraphNodeItem[] = Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return {
      id: `city-${i}`,
      label: `City ${i}`,
      x: Math.round(150 + 100 * Math.cos(angle)),
      y: Math.round(150 + 100 * Math.sin(angle)),
      state: i === 0 ? "active" : "default",
      val: i,
    };
  });

  const getEdges = (activeU?: number, activeV?: number): GraphEdgeItem[] => {
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
    return edgesList;
  };

  const createSnapshot = (activeU?: number, activeV?: number): GraphVisualSnapshot => {
    return {
      kind: "graph",
      nodes: nodes.map((node, i) => ({
        ...node,
        state: i === activeV ? "active" : i === activeU ? "pivot" : "default",
      })),
      edges: getEdges(activeU, activeV),
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize TSP DP state: start at City 0 with mask 1 (0001_2)",
      why: "dp[mask][u] stores min cost to visit subset of cities in mask ending at u. dp[1][0] = 0.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { startCity: 0, mask: 1 } },
    variables: { n, "dp[1][0]": 0 },
  });

  for (let mask = 1; mask < numMasks; mask++) {
    for (let u = 0; u < n; u++) {
      if (dp[mask][u] === INF) continue;

      for (let v = 0; v < n; v++) {
        if (!(mask & (1 << v)) && dist[u][v] !== INF) {
          const nextMask = mask | (1 << v);
          const candidate = dp[mask][u] + dist[u][v];
          if (candidate < dp[nextMask][v]) {
            dp[nextMask][v] = candidate;

            steps.push({
              stepIndex: stepIndex++,
              codeLine: 15,
              explanation: {
                what: `Relax edge City ${u} -> City ${v} (weight ${dist[u][v]})`,
                why: `Mask ${mask.toString(2)} -> ${nextMask.toString(2)}. dp[${nextMask.toString(2)}][${v}] updated to ${dp[nextMask][v]}.`,
              },
              primarySnapshot: createSnapshot(u, v),
              auxiliaryState: {
                customState: {
                  currMask: mask.toString(2),
                  nextMask: nextMask.toString(2),
                  u,
                  v,
                  cost: dp[nextMask][v],
                },
              },
              variables: {
                mask,
                u,
                v,
                "dist[u][v]": dist[u][v],
                "dp[next_mask][v]": dp[nextMask][v],
              },
            });
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

  const finalCost = ans === INF ? -1 : ans;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Final result: Complete TSP Tour cost = ${finalCost}`,
      why:
        finalCost !== -1
          ? `Visited all cities and returned to City 0 via City ${bestLastCity}. Minimum total tour cost: ${finalCost}.`
          : "Graph is disconnected; no valid TSP Hamiltonian cycle exists.",
    },
    primarySnapshot: createSnapshot(bestLastCity !== -1 ? bestLastCity : 0, 0),
    auxiliaryState: { customState: { minTourCost: finalCost } },
    variables: { result: finalCost },
  });

  return steps;
};

const TSP_BITMASK_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines tsp_bitmask(dist) -> int: computes minimum Hamiltonian tour cost using Held-Karp algorithm.",
    2: "Determines city count n from distance matrix dimensions.",
    4: "Calculates total subset mask states num_masks = 2^n.",
    5: "Allocates 2D DP table dp of size (2^n) x n initialized to infinity.",
    6: "Sets base case dp[1][0] = 0 (starting at City 0 with mask 1).",
    8: "Outer loop sweeps visited subset bitmask from 1 to 2^n - 1.",
    9: "Middle loop iterates through current ending city u.",
    12: "Inner loop iterates through next unvisited city v.",
    15: "Relaxes dp[next_mask][v] = min(dp[next_mask][v], dp[mask][u] + dist[u][v]).",
    19: "Sweeps last visited city u to add return edge cost dist[u][0] back to start City 0.",
    23: "Returns minimum total tour cost or -1 if no valid Hamiltonian tour exists.",
  },
};

export const tspBitmaskDp: AlgorithmDefinition<TspBitmaskDpInput> = {
  id: "tsp-bitmask-dp",
  title: "Traveling Salesperson Problem (Bitmask DP)",
  category: "dp_2d",
  categories: ["dp_2d"],
  difficulty: "Hard",
  description:
    "Given N cities and an N x N distance matrix dist where dist[u][v] represents the directed cost of traveling from city u to city v, find the minimum cost Hamiltonian cycle—a tour that visits every city exactly once and returns to the starting city (City 0). While brute force O(N!) permutation search is intractable for larger N, Held-Karp Bitmask Dynamic Programming optimizes the search to O(N^2 * 2^N) time. Define dp[mask][u] as the minimum travel cost to visit the subset of cities encoded by the bitmask mask, ending at city u. Initialize dp[1][0] = 0, transition via dp[mask | (1 << v)][v] = min(dp[mask | (1 << v)][v], dp[mask][u] + dist[u][v]), and compute final tour cost by adding dist[u][0].",
  constraints: [
    "2 <= N <= 20",
    "0 <= dist[u][v] <= 10^4",
    "Graph may be symmetric or asymmetric",
    "If no valid Hamiltonian tour exists, return -1",
  ],
  examples: [
    {
      kind: "basic",
      inputDisplay: "n = 4, 4x4 dist matrix",
      outputDisplay: "80",
      title: "4 Cities Tour",
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
      inputDisplay: "n = 4, asymmetric dist matrix",
      outputDisplay: "21",
      title: "Asymmetric Distances",
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
      inputDisplay: "n = 3, disconnected graph",
      outputDisplay: "-1",
      title: "Disconnected Graph",
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
      "The Traveling Salesperson Problem (TSP) is one of the most famous NP-hard optimization problems in computer science and operations research. Given N cities and travel costs between them, the goal is to find the shortest closed tour visiting every city exactly once before returning to the start. The Held-Karp algorithm uses Dynamic Programming with Bitmasking to reduce time complexity from factorial O(N!) down to exponential O(N^2 * 2^N).",
    sections: [
      {
        heading: "Core Concept: Subset Encoding & Held-Karp Recurrence",
        body: "An N-bit integer mask represents the subset of visited cities (the i-th bit is 1 if city i has been visited). Define dp[mask][u] as the minimum travel cost to visit exactly the subset of cities in mask, ending at city u. For any unvisited city v (where bit v is 0 in mask), the state transition is dp[mask | (1 << v)][v] = min(dp[mask | (1 << v)][v], dp[mask][u] + dist[u][v]).",
      },
      {
        heading: "Systems Applications: Vehicle Routing & Circuit Manufacturing",
        body: "TSP models critical logistics and manufacturing workloads: logistics fleet vehicle routing (UPS/FedEx package delivery sequence optimization), printed circuit board (PCB) drill head trajectory optimization, microchip lithography laser positioning, and DNA sequencing contig assembly.",
      },
      {
        heading: "Computational Complexity & NP-Hardness Boundary",
        body: "While O(N^2 * 2^N) remains exponential, Held-Karp enables exact optimal solutions for N up to ~22 cities within seconds, whereas brute-force N! stalls around N=13. For larger N (N > 50), polynomial-time heuristic approximations (e.g., Christofides 1.5-approximation, simulated annealing, Lin-Kernighan heuristics) are used in practice.",
      },
      {
        heading: "Edge Case Analysis & Graph Symmetry",
        body: "Edge cases include disconnected graphs (where unreachable states stay infinity, returning -1), single city loops, and asymmetric distance matrices (where dist[u][v] != dist[v][u]). The Held-Karp recurrence handles asymmetric distances naturally without modification.",
      },
    ],
    keyTerms: [
      {
        term: "Traveling Salesperson Problem (TSP)",
        definition:
          "An NP-hard optimization problem seeking the shortest closed tour visiting N cities exactly once.",
      },
      {
        term: "Held-Karp Algorithm",
        definition:
          "A dynamic programming algorithm using bitmasking to solve TSP in O(N^2 * 2^N) time.",
      },
      {
        term: "Bitmask State",
        definition:
          "Encoding small sets or boolean state flags as bit patterns within integer variables.",
      },
      {
        term: "Hamiltonian Cycle",
        definition:
          "A closed path in a graph visiting every vertex exactly once and returning to the origin.",
      },
    ],
  },
  trivia: TSP_BITMASK_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 10",
      label: "Competitive Programmer's Handbook, Ch 10",
    },
  ],
  defaultInput: DEFAULT_TSP_BITMASK_INPUT,
  generateSteps: generateTspBitmaskDpSteps,
};
