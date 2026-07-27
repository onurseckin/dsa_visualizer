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

export const PYTHON_TSP_BITMASK_CODE = `def is_visited(mask: int, city: int) -> bool:
    return (mask & (1 << city)) != 0

def tsp_bitmask(dist: list[list[int]]) -> int:
    n = len(dist)
    INF = float('inf')
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0

    for mask in range(1 << n):
        for u in range(n):
            if dp[mask][u] == INF:
                continue
            for v in range(n):
                if not is_visited(mask, v) and dist[u][v] != INF:
                    next_mask = mask | (1 << v)
                    dp[next_mask][v] = min(dp[next_mask][v], dp[mask][u] + dist[u][v])

    full_mask = (1 << n) - 1
    ans = min(dp[full_mask][u] + dist[u][0] for u in range(1, n) if dist[u][0] != INF)
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
  difficulty: "Hard",
  description:
    "Finds the minimum cost tour visiting every city exactly once and returning to the start using Held-Karp Bitmask Dynamic Programming.",
  constraints: ["2 <= n <= 6", "dist[u][v] >= 0"],
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
      "Held-Karp algorithm uses bitmask DP where bitmask represents set of visited cities and u is the current city.",
    sections: [
      {
        heading: "Bitmask State",
        body: "dp[mask][u] stores min cost to visit cities in mask ending at city u.",
      },
    ],
    keyTerms: [
      {
        term: "Bitmask State",
        definition: "Representation of visited city subset and current city endpoint.",
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
