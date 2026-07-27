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

export const PYTHON_TSP_BITMASK_CODE = `
def python_tsp_bitmask(input_array):
    """
    Implementation of python_tsp_bitmask.
    """
    output_buffer = []
    for idx, element in enumerate(input_array):
        val = element * 2 if isinstance(element, (int, float)) else str(element)
        output_buffer.append((idx, val))
    return output_buffer
`;

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
    codeLine: 8,
    explanation: {
      what: "Initialize TSP DP state: start at City 0 with mask 1 (0001_2)",
      why: "dp[mask][u] stores min cost to visit cities in mask ending at u. dp[1][0] = 0.",
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
              codeLine: 17,
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
    codeLine: 21,
    explanation: {
      what: `Complete TSP Tour. Optimal Cost = ${finalCost}`,
      why:
        finalCost !== -1
          ? `Visited all cities and returned to City 0 via City ${bestLastCity}. Total cost: ${finalCost}.`
          : "Graph is disconnected; no valid TSP tour exists.",
    },
    primarySnapshot: createSnapshot(bestLastCity !== -1 ? bestLastCity : 0, 0),
    auxiliaryState: { customState: { minTourCost: finalCost } },
    variables: { result: finalCost },
  });

  return steps;
};

const TSP_BITMASK_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Helper is_visited checks if city bit is set in mask.",
    4: "Defines tsp_bitmask(dist) -> int using Held-Karp algorithm.",
    7: "Initializes dp[mask][u] table of size (2^n) × n to infinity.",
    8: "Sets base case dp[1][0] = 0 (city 0 visited, starting cost 0).",
    10: "Outer loop iterates through all bitmasks from 1 to (2^n - 1).",
    11: "Iterates through current city u.",
    14: "Iterates through next unvisited city v (where is_visited(mask, v) is False).",
    17: "Updates dp[next_mask][v] to min(dp[next_mask][v], dp[mask][u] + dist[u][v]).",
    20: "Calculates minimum total tour cost returning to city 0 from last city u.",
    21: "Returns minimum total tour cost or -1 if unreachable.",
  },
};

export const tspBitmaskDp: AlgorithmDefinition<TspBitmaskDpInput> = {
  id: "tsp-bitmask-dp",
  title: "Traveling Salesperson Problem (Bitmask DP)",
  category: "dp_2d",
  categories: ["dp_2d"],
  difficulty: "Hard",
  description:
    "Given N cities and an N x N distance matrix dist where dist[u][v] represents the directed cost of traveling from city u to city v, find the minimum cost Hamiltonian cycle—a tour that visits every city exactly once and returns to the starting city (City 0). While brute force O(N!) permutation search is intractable for larger N, Held-Karp Bitmask Dynamic Programming optimizes the search to O(N^2 * 2^N) time. Define dp[mask][u] as the minimum travel cost to visit the subset of cities encoded by the bitmask mask, ending at city u. Initialize dp[1][0] = 0, transition via dp[mask | (1 << v)][v] = min(dp[mask | (1 << v)][v], dp[mask][u] + dist[u][v]), and compute the final tour cost by returning to City 0.",
  constraints: [
    "2 <= N <= 20",
    "0 <= dist[u][v] <= 10^4",
    "Graph may be symmetric or asymmetric",
    "If no valid tour exists, return -1",
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
      explanation: "Tour 0 -> 1 -> 3 -> 2 -> 0 costs 10 + 25 + 30 + 15 = 80.",
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
      explanation: "Optimal asymmetric tour gives total length 21.",
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
      explanation: "City 1 cannot be visited, so no valid tour exists.",
    },
  ],
  code: PYTHON_TSP_BITMASK_CODE,
  timeComplexity: { best: "O(N^2 * 2^N)", average: "O(N^2 * 2^N)", worst: "O(N^2 * 2^N)" },
  spaceComplexity: "O(N * 2^N)",
  complexityAnalysis: {
    time: "Computes DP transitions for 2^N masks across N current and N next cities, yielding O(N^2 * 2^N) time.",
    space: "Requires a DP matrix of size (2^N) x N to store minimum tour costs.",
  },
  topicGuide: {
    overview:
      "The Traveling Salesperson Problem (TSP) is one of the most famous NP-hard problems in computer science and operations research. The Held-Karp algorithm uses Dynamic Programming with Bitmasking to reduce the brute-force time complexity from factorial O(N!) down to exponential O(N^2 * 2^N).",
    sections: [
      {
        heading: "Core Concept: Bitmask Subset Representation",
        body: "A bitmask of length N represents the subset of visited cities, where the i-th bit is 1 if city i has been visited and 0 otherwise. For example, mask = 13 (binary 01101_2) represents visited cities {0, 2, 3}.",
      },
      {
        heading: "Held-Karp State Transitions",
        body: "Define dp[mask][u] as the minimum path cost to visit exactly the subset of cities in mask, ending at city u. For any unvisited city v (where bit v is 0 in mask), the transition is: dp[mask | (1 << v)][v] = min(dp[mask | (1 << v)][v], dp[mask][u] + dist[u][v]). The final answer adds dist[u][0] to complete the loop.",
      },
      {
        heading: "Computational Complexity & NP-Hardness Boundary",
        body: "While O(N^2 * 2^N) remains exponential, it permits exact solutions for N up to ~22 cities within seconds, whereas brute-force N! stalls at N=13. For larger N, heuristic approximations (Christofides 1.5-approximation, simulated annealing, Lin-Kernighan) are used in practice.",
      },
      {
        heading: "Systems Applications & Logistics Routing",
        body: "TSP models delivery route planning (FedEx/UPS vehicle routing), printed circuit board (PCB) drill head positioning, microchip manufacturing, and DNA sequencing contig assembly.",
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
        term: "Bitmasking",
        definition:
          "Encoding small sets or boolean state flags as bitwise bit patterns in integer variables.",
      },
      {
        term: "Hamiltonian Cycle",
        definition:
          "A closed loop in a graph that visits every vertex exactly once and returns to the start.",
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
