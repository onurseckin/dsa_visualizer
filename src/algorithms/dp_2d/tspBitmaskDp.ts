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
    codeLine: 1,
    explanation: {
      what: `Start TSP Bitmask algorithm for N=${n} cities`,
      why: "Computing minimum cost closed Hamiltonian cycle visiting all cities.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { n } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Extract city count n = len(dist) = ${n}`,
      why: "Grid dimensions and bitmask width are determined by number of cities.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { n } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `Define INF = float('inf') as sentinel for unreachable states`,
      why: 'Using infinity as the DP table\'s initial value cleanly represents "not yet computed" and lets us take min() without special-casing.',
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { INF: "inf" } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Calculate number of bitmask subsets num_masks = 2^${n} = ${numMasks}`,
      why: "An n-bit integer mask captures all subsets of visited cities.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { numMasks } },
    variables: { numMasks },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Allocate 2D DP matrix of size ${numMasks} x ${n} initialized to infinity`,
      why: "dp[mask][u] stores min travel cost to visit subset of cities in mask ending at u.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { rows: numMasks, cols: n } },
    variables: { numMasks, n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize TSP base state: start at City 0 with mask 1 (0001_2)",
      why: "dp[1][0] = 0 because visiting only City 0 at start costs 0.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { startCity: 0, mask: 1 } },
    variables: { n, "dp[1][0]": 0 },
  });

  for (let mask = 1; mask < numMasks; mask++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Outer loop for subset bitmask = ${mask} (${mask.toString(2)})`,
        why: `Evaluating all subset combinations of visited cities.`,
      },
      primarySnapshot: createSnapshot(0),
      auxiliaryState: { customState: { mask: mask.toString(2) } },
      variables: { mask },
    });

    for (let u = 0; u < n; u++) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Middle loop testing ending city u = ${u} for mask ${mask.toString(2)}`,
          why: `Checking if state dp[${mask.toString(2)}][${u}] is reachable.`,
        },
        primarySnapshot: createSnapshot(u),
        auxiliaryState: { customState: { u, mask: mask.toString(2) } },
        variables: { u, mask },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Check condition if dp[${mask.toString(2)}][${u}] == INF`,
          why:
            dp[mask][u] === INF
              ? `State unreachable (cost is infinity). Skipping.`
              : `State is reachable with cost ${dp[mask][u]}. Exploring unvisited target cities.`,
        },
        primarySnapshot: createSnapshot(u),
        auxiliaryState: { customState: { u, cost: dp[mask][u] } },
        variables: { u, mask, reachable: dp[mask][u] !== INF },
      });

      if (dp[mask][u] === INF) {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 11,
          explanation: {
            what: `Skip: dp[${mask.toString(2)}][${u}] is unreachable`,
            why: `No path visits subset ${mask.toString(2)} and ends at city ${u}, so there's nothing to extend from. We continue to the next state.`,
          },
          primarySnapshot: createSnapshot(u),
          auxiliaryState: { customState: { u, mask: mask.toString(2), unreachable: true } },
          variables: { u, mask, reachable: false },
        });
        continue;
      }

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 12,
        explanation: {
          what: `Inner loop: try extending to each city v from city ${u}`,
          why: `City ${u} is reachable in subset ${mask.toString(2)}. We now try every unvisited city as the next destination.`,
        },
        primarySnapshot: createSnapshot(u),
        auxiliaryState: { customState: { u, mask: mask.toString(2), reachable: true } },
        variables: { u, mask, n },
      });

      for (let v = 0; v < n; v++) {
        const unvisited = !(mask & (1 << v));
        const edgeExists = dist[u][v] !== INF;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 13,
          explanation: {
            what: `Inspect transition from City ${u} to City ${v}: unvisited=${unvisited}, edgeExists=${edgeExists}`,
            why:
              unvisited && edgeExists
                ? `City ${v} is unvisited in mask ${mask.toString(2)} and edge (${u}, ${v}) costs ${dist[u][v]}.`
                : `Cannot move to City ${v} (already visited or no direct edge).`,
          },
          primarySnapshot: createSnapshot(u, v),
          auxiliaryState: { customState: { u, v, unvisited, edgeExists } },
          variables: { u, v, unvisited, edgeExists },
        });

        if (unvisited && edgeExists) {
          const nextMask = mask | (1 << v);
          const candidate = dp[mask][u] + dist[u][v];

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 14,
            explanation: {
              what: `Compute next_mask = ${mask.toString(2)} | (1 << ${v}) = ${nextMask.toString(2)}`,
              why: `Adding City ${v} to visited subset yields new mask ${nextMask.toString(2)}.`,
            },
            primarySnapshot: createSnapshot(u, v),
            auxiliaryState: { customState: { nextMask: nextMask.toString(2) } },
            variables: { nextMask },
          });

          if (candidate < dp[nextMask][v]) {
            dp[nextMask][v] = candidate;

            steps.push({
              stepIndex: stepIndex++,
              codeLine: 15,
              explanation: {
                what: `Relax edge City ${u} -> City ${v} (weight ${dist[u][v]}): update dp[${nextMask.toString(2)}][${v}] = ${candidate}`,
                why: `New shorter route found! Updated dp[${nextMask.toString(2)}][${v}] = ${dp[nextMask][v]}.`,
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
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Compute full_mask = (1 << ${n}) - 1 = ${fullMask.toString(2)}`,
      why: "All cities visited bitmask state.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { fullMask: fullMask.toString(2) } },
    variables: { fullMask },
  });

  let ans = INF;
  let bestLastCity = -1;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: "Initialize ans = INF to track minimum complete tour cost",
      why: "We search for the best Hamiltonian cycle cost among all last-city choices. Starting at infinity ensures the first valid candidate wins.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { ans: "INF", fullMask: fullMask.toString(2) } },
    variables: { ans: "INF", fullMask },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: "Sweep last visited cities u to calculate complete return tour back to City 0",
      why: "Adding return edge dist[u][0] to complete the Hamiltonian cycle.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { fullMask: fullMask.toString(2) } },
    variables: { fullMask },
  });

  for (let u = 1; u < n; u++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Check return edge from city ${u} to city 0`,
        why:
          dist[u][0] !== INF && dp[fullMask][u] !== INF
            ? `Both the return edge (dist[${u}][0] = ${dist[u][0]}) and the path dp[full][${u}] = ${dp[fullMask][u]} are finite — this is a valid complete tour.`
            : `Either the return edge or the path to city ${u} is infinite — skip this ending city.`,
      },
      primarySnapshot: createSnapshot(u, 0),
      auxiliaryState: { customState: { u, returnEdge: dist[u][0], pathCost: dp[fullMask][u] } },
      variables: { u, validReturn: dist[u][0] !== INF && dp[fullMask][u] !== INF },
    });

    if (dist[u][0] !== INF && dp[fullMask][u] !== INF) {
      const totalCost = dp[fullMask][u] + dist[u][0];
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 21,
        explanation: {
          what: `Evaluate return tour via last City ${u}: dp[full][${u}] (${dp[fullMask][u]}) + dist[${u}][0] (${dist[u][0]}) = ${totalCost}`,
          why: `Comparing candidate closed tour cost ${totalCost} against current best ${ans === INF ? "∞" : ans}.`,
        },
        primarySnapshot: createSnapshot(u, 0),
        auxiliaryState: { customState: { u, totalCost } },
        variables: { u, totalCost },
      });

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
  description: `The **Traveling Salesperson Problem (TSP)** (LeetCode #943 / Held-Karp Algorithm) asks for the minimum cost closed tour that visits every city $v \\in \\{0, 1, \\dots, N-1\\}$ exactly once and returns to the starting city (City 0).

### Held-Karp Dynamic Programming & Bitmask State
Brute-force permutation checking requires $\\mathcal{O}(N!)$ time. The Held-Karp algorithm uses bitmask dynamic programming to solve TSP in $\\mathcal{O}(N^2 \\cdot 2^N)$ time.

Let $dp[\\text{mask}][u]$ represent the minimum cost to visit the subset of cities encoded by the bitmask $\\text{mask}$, ending at city $u$.

#### Base Case
$$dp[1][0] = 0 \\quad (\\text{mask } 1 = 0001_2 \\text{ means only City 0 is visited, starting at cost } 0)$$

#### State Transitions
For any active state $(dp[\\text{mask}][u] \\ne \\infty)$ and unvisited neighbor city $v$ ($v \\notin \\text{mask}$, $dist[u][v] \\ne \\infty$):
$$\\text{next\\_mask} = \\text{mask} \\mid (1 \\ll v)$$
$$dp[\\text{next\\_mask}][v] = \\min \\Big( dp[\\text{next\\_mask}][v], \\, dp[\\text{mask}][u] + dist[u][v] \\Big)$$

#### Closing the Tour
After filling all states up to $\\text{full\\_mask} = 2^N - 1$, add the return edge $dist[u][0]$ to complete the cycle back to City 0:
$$\\text{Ans} = \\min_{1 \\le u < N} \\Big( dp[\\text{full\\_mask}][u] + dist[u][0] \\Big)$$

### Key Interview Insights
1. **Factorial to Exponential**: Reduces runtime from $\\mathcal{O}(N!)$ to $\\mathcal{O}(N^2 \\cdot 2^N)$ and space to $\\mathcal{O}(N \\cdot 2^N)$.
2. **Subset Overlap**: States are defined by $(mask, last\\_city)$ rather than exact visiting order.`,
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
      "The Traveling Salesperson Problem (TSP) is the quintessential NP-hard optimization problem in graph theory and operations research. Given $N$ cities and an $N \\times N$ distance matrix $dist$, we find a minimum-weight Hamiltonian cycle. Held-Karp Bitmask DP reduces runtime from $\\mathcal{O}(N!)$ down to $\\mathcal{O}(N^2 \\cdot 2^N)$ time and $\\mathcal{O}(N \\cdot 2^N)$ space.",
    sections: [
      {
        heading: "1. Subset Bitmask Representation",
        body: "An $N$-bit integer $mask$ represents the set of visited cities (bit $i$ is $1$ if city $i$ has been visited). A 2D array $dp[mask][u]$ records the minimum distance to visit all cities in $mask$, ending at city $u$.",
      },
      {
        heading: "2. Held-Karp Recurrence & Transitions",
        body: "- **Base Case**: $dp[1][0] = 0$ (starting at City 0).\n- **Forward Edge Relaxation**:\n  $$dp[mask \\mid (1 \\ll v)][v] = \\min \\Big( dp[mask \\mid (1 \\ll v)][v], \\, dp[mask][u] + dist[u][v] \\Big)$$\n- **Closing the Tour**:\n  $$\\text{Cost} = \\min_{u \\ne 0} \\Big( dp[2^N - 1][u] + dist[u][0] \\Big)$$",
      },
      {
        heading: "3. Systems & Industrial Applications",
        body: "TSP models real-world logistics and manufacturing routing:\n- **Delivery Fleet Vehicle Routing**: Optimizing package delivery paths for UPS/FedEx fleets.\n- **PCB Lithography & Drill Trajectory**: Minimizing robotic drill head movements across circuit boards.\n- **Microchip Laser Inspection**: Positioning inspection optics over wafer targets.",
      },
      {
        heading: "4. Scalability Limits & Heuristics",
        body: "Held-Karp solves TSP exactly for $N \\le 22$ within seconds. For larger $N > 50$, heuristic algorithms (e.g. Christofides 1.5-approximation, 2-opt local search, simulated annealing) are required.",
      },
    ],
    keyTerms: [
      {
        term: "Held-Karp Algorithm",
        definition:
          "A bitmask dynamic programming algorithm that solves exact TSP in $\\mathcal{O}(N^2 \\cdot 2^N)$ time.",
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
      chapter: "Ch 10",
      label: "Competitive Programmer's Handbook, Ch 10",
    },
  ],
  defaultInput: DEFAULT_TSP_BITMASK_INPUT,
  generateSteps: generateTspBitmaskDpSteps,
};
