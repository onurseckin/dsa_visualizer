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
      what: `Initialize Held-Karp Bitmask DP for ${n} cities.`,
      why: "Computing the optimal closed Hamiltonian cycle visiting every city once before returning to City 0.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { n } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `Read city count n = ${n} from distance matrix.`,
      why: "The total number of cities defines both the bitmask size and the state space dimensions.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { n } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Set infinity sentinel for unreachable state distances.",
      why: "Initializes uncalculated state costs so dynamic programming relaxation can cleanly select minimum path values.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { INF: "inf" } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Compute total city subset bitmasks: 2^${n} = ${numMasks}.`,
      why: "An n-bit integer binary mask efficiently encodes all 2^n possible subsets of visited cities.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { numMasks } },
    variables: { numMasks },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Allocate 2D state matrix dp[2^${n}][${n}] initialized to infinity.`,
      why: "dp[mask][u] tracks the minimum path distance to visit city subset mask and terminate at city u.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { rows: numMasks, cols: n } },
    variables: { numMasks, n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Set base case: start at City 0 with mask 1 (0001₂).",
      why: "dp[1][0] = 0 represents starting the tour at City 0 with zero path cost accumulated.",
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
        what: `Evaluate city subset bitmask = ${mask} (${mask.toString(2)}₂).`,
        why: "Sweeping subproblem sizes systematically ensures all smaller sub-tours are solved before larger subsets.",
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
          what: `Test endpoint City ${u} for visited subset ${mask.toString(2)}₂.`,
          why: "Determines whether a valid sub-tour ending at city u exists for the current city subset.",
        },
        primarySnapshot: createSnapshot(u),
        auxiliaryState: { customState: { u, mask: mask.toString(2) } },
        variables: { u, mask },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 10,
        explanation: {
          what: `Check state accessibility for dp[${mask.toString(2)}₂][${u}].`,
          why:
            dp[mask][u] === INF
              ? "State is unreachable from City 0; skipping transitions from this endpoint."
              : `State is reachable with cost ${dp[mask][u]}; exploring potential extensions to unvisited cities.`,
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
            what: `Bypass unreachable state dp[${mask.toString(2)}₂][${u}].`,
            why: "No valid path visits this specific city subset ending at city u, so no sub-tour extension can proceed.",
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
          what: `Attempt sub-tour extensions from City ${u}.`,
          why: "With a valid sub-tour in hand, evaluate moving to each remaining unvisited city.",
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
            what: `Inspect edge transition City ${u} -> City ${v}.`,
            why:
              unvisited && edgeExists
                ? `City ${v} is unvisited in subset ${mask.toString(2)}₂ and edge (${u}, ${v}) has weight ${dist[u][v]}.`
                : `Transition to City ${v} is invalid (already visited or no direct edge exists).`,
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
              what: `Form new subset bitmask ${nextMask.toString(2)}₂ by including City ${v}.`,
              why: "Bitwise OR sets the bit for city v, generating the bitmask for the expanded city subset.",
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
                what: `Relax path cost dp[${nextMask.toString(2)}₂][${v}] = ${candidate}.`,
                why: `A shorter sub-tour reaching City ${v} through City ${u} was found, reducing path cost from ${dp[nextMask][v] === candidate ? "previous cost" : "inf"} to ${candidate}.`,
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
      what: `Construct full-coverage bitmask ${fullMask.toString(2)}₂ representing all ${n} cities.`,
      why: "Full bitmask represents complete coverage where every city has been visited exactly once.",
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
      what: "Initialize tour cost accumulator ans = ∞.",
      why: "Preparing to find the minimum closed tour cost across all possible ending cities.",
    },
    primarySnapshot: createSnapshot(0),
    auxiliaryState: { customState: { ans: "INF", fullMask: fullMask.toString(2) } },
    variables: { ans: "INF", fullMask },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: "Evaluate closing return edges to City 0 from every candidate ending city u.",
      why: "Completes the Hamiltonian cycle by adding edge cost dist[u][0] to full-coverage path cost dp[full_mask][u].",
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
        what: `Verify return edge validity from City ${u} to City 0.`,
        why:
          dist[u][0] !== INF && dp[fullMask][u] !== INF
            ? `Reachable full tour ending at City ${u} (cost ${dp[fullMask][u]}) with return edge cost ${dist[u][0]}.`
            : `Cannot close tour via City ${u} (either path to city ${u} or return edge is non-existent).`,
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
          what: `Calculate candidate tour cost ending at City ${u}: ${dp[fullMask][u]} + ${dist[u][0]} = ${totalCost}.`,
          why: `Compares candidate Hamiltonian cycle cost ${totalCost} against best recorded tour cost ${ans === INF ? "∞" : ans}.`,
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
      what: `Final optimal TSP tour cost = ${finalCost}.`,
      why:
        finalCost !== -1
          ? `Successfully identified shortest closed Hamiltonian cycle returning to City 0 via City ${bestLastCity} with total cost ${finalCost}.`
          : "Graph is disconnected; no valid closed Hamiltonian tour visiting all cities exists.",
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
  description: `<p>The <strong>Traveling Salesperson Problem (TSP)</strong> (LeetCode #943 / Held-Karp Algorithm) asks for the minimum cost closed tour that visits every city <span>v &isin; {0, 1, &hellip;, N-1}</span> exactly once and returns to the starting city (City 0).</p><h3>Held-Karp Dynamic Programming &amp; Bitmask State</h3><p>Brute-force permutation checking requires <span>O(N!)</span> time. The Held-Karp algorithm uses bitmask dynamic programming to solve TSP in <span>O(N&sup2; &middot; 2ᴺ)</span> time.</p><p>Let <code>dp[mask][u]</code> represent the minimum cost to visit the subset of cities encoded by the bitmask <code>mask</code>, ending at city <code>u</code>.</p><h3>Base Case</h3><p><code>dp[1][0] = 0</code> (bitmask <code>1</code> representing <code>0001₂</code> means only City 0 is visited, starting at cost 0).</p><h3>State Transitions</h3><p>For any active state (<code>dp[mask][u] &ne; &infin;</code>) and unvisited neighbor city <code>v</code> (<code>v &notin; mask</code>, <code>dist[u][v] &ne; &infin;</code>):</p><p><code>next_mask = mask | (1 &lt;&lt; v)</code><br /><code>dp[next_mask][v] = min(dp[next_mask][v], dp[mask][u] + dist[u][v])</code></p><h3>Closing the Tour</h3><p>After filling all states up to <code>full_mask = 2ᴺ - 1</code>, add the return edge <code>dist[u][0]</code> to complete the cycle back to City 0:</p><p><code>Ans = min_{1 &le; u &lt; N} (dp[full_mask][u] + dist[u][0])</code></p><h3>Key Interview Insights</h3><ul><li><strong>Factorial to Exponential:</strong> Reduces runtime from <span>O(N!)</span> to <span>O(N&sup2; &middot; 2ᴺ)</span> and space to <span>O(N &middot; 2ᴺ)</span>.</li><li><strong>Subset Overlap:</strong> States are defined by <code>(mask, last_city)</code> rather than exact visiting order.</li></ul>`,
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
      chapter: "Ch 10",
      label: "Competitive Programmer's Handbook, Ch 10",
    },
  ],
  defaultInput: DEFAULT_TSP_BITMASK_INPUT,
  generateSteps: generateTspBitmaskDpSteps,
};
