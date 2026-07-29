import type {
  AlgorithmDefinition,
  AlgorithmStep,
  GraphNodeItem,
  GraphEdgeItem,
  GraphVisualSnapshot,
  ElementState,
  TopicGuide,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MarkovChainsInput {
  numStates: number;
  transitionMatrix: number[][];
  initialDistribution: number[];
  steps: number;
}

export const PYTHON_MARKOV_CHAINS_CODE = `def markov_chain(transition_matrix: list[list[float]], initial_dist: list[float], steps: int) -> list[float]:
    n = len(initial_dist)
    curr = list(initial_dist)
    for _ in range(steps):
        nxt = [0.0] * n
        for i in range(n):
            for j in range(n):
                nxt[j] += curr[i] * transition_matrix[i][j]
        curr = nxt
    return curr`;

export const DEFAULT_MARKOV_CHAINS_INPUT: MarkovChainsInput = {
  numStates: 3,
  transitionMatrix: [
    [0.7, 0.2, 0.1],
    [0.3, 0.5, 0.2],
    [0.2, 0.3, 0.5],
  ],
  initialDistribution: [1.0, 0.0, 0.0],
  steps: 18,
};

export const generateMarkovChainsSteps = (input: MarkovChainsInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = Math.max(
    1,
    Math.min(
      6,
      input && typeof input.numStates === "number"
        ? input.numStates
        : DEFAULT_MARKOV_CHAINS_INPUT.numStates,
    ),
  );
  const rawSteps = Math.max(
    1,
    Math.min(
      30,
      input && typeof input.steps === "number" ? input.steps : DEFAULT_MARKOV_CHAINS_INPUT.steps,
    ),
  );

  // Sanitize initial distribution
  let currentDist: number[] = Array.from({ length: n }, (_, i) =>
    input && Array.isArray(input.initialDistribution) && input.initialDistribution[i] !== undefined
      ? Math.max(0, input.initialDistribution[i])
      : i === 0
        ? 1
        : 0,
  );
  const sumInitial = currentDist.reduce((a, b) => a + b, 0);
  if (sumInitial > 0) {
    currentDist = currentDist.map((val) => val / sumInitial);
  } else {
    currentDist[0] = 1.0;
  }

  // Sanitize transition matrix
  const matrix: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      const cell =
        input &&
        Array.isArray(input.transitionMatrix) &&
        Array.isArray(input.transitionMatrix[i]) &&
        input.transitionMatrix[i][j] !== undefined
          ? Math.max(0, input.transitionMatrix[i][j])
          : i === j
            ? 0.6
            : 0.4 / (n - 1);
      row.push(cell);
      rowSum += cell;
    }
    const normalizedRow =
      rowSum > 0 ? row.map((v) => v / rowSum) : row.map((_, idx) => (idx === i ? 1.0 : 0.0));
    matrix.push(normalizedRow);
  }

  const createGraphSnapshot = (
    dist: number[],
    activeSourceIdx?: number,
    activeDestIdx?: number,
  ): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = dist.map((prob, idx) => {
      const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
      const x = Math.round(200 + 140 * Math.cos(angle));
      const y = Math.round(200 + 140 * Math.sin(angle));
      const isMax = idx === dist.indexOf(Math.max(...dist));
      let state: ElementState = "default";
      if (activeSourceIdx === idx || activeDestIdx === idx) {
        state = "active";
      } else if (isMax) {
        state = "visited";
      }
      return {
        id: `S${idx}`,
        label: `S${idx}: ${(prob * 100).toFixed(1)}%`,
        val: Math.round(prob * 100),
        x,
        y,
        state,
      };
    });

    const edges: GraphEdgeItem[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const p = matrix[i][j];
        if (p > 0) {
          const isTraversed =
            (activeSourceIdx === i && activeDestIdx === j) ||
            (activeSourceIdx === i && activeDestIdx === undefined);
          edges.push({
            from: `S${i}`,
            to: `S${j}`,
            weight: Number(p.toFixed(2)),
            isTraversed,
          });
        }
      }
    }

    return {
      kind: "graph",
      nodes,
      edges,
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize Discrete-Time Markov Chain with ${n} states for ${rawSteps} time steps. Initial distribution: [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
      why: "A discrete-time Markov chain models random transitions between states, where each step multiplies the current state probability vector by the stochastic transition matrix.",
    },
    primarySnapshot: createGraphSnapshot(currentDist),
    auxiliaryState: {
      hashMap: {
        Step: 0,
        Distribution: currentDist.map((v) => v.toFixed(3)).join(", "),
        "Matrix Size": `${n}x${n}`,
      },
    },
    variables: { step: 0 },
  });

  for (let step = 1; step <= rawSteps; step++) {
    const nextDist = new Array(n).fill(0.0);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Begin simulation step ${step} of ${rawSteps}.`,
        why: "Transitioning the state probability distribution from time step t to t+1.",
      },
      primarySnapshot: createGraphSnapshot(currentDist),
      auxiliaryState: {
        hashMap: {
          "Current Step": step,
          "Current Distribution": currentDist.map((v) => v.toFixed(3)).join(", "),
        },
      },
      variables: { step },
    });

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const flow = currentDist[i] * matrix[i][j];
        nextDist[j] += flow;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 8,
          explanation: {
            what: `Compute transition probability flow from S${i} to S${j}: ${currentDist[i].toFixed(3)} × ${matrix[i][j].toFixed(2)} = ${flow.toFixed(3)}.`,
            why: "State transition probabilities accumulate from all incoming source states according to total probability law.",
          },
          primarySnapshot: createGraphSnapshot(currentDist, i, j),
          auxiliaryState: {
            hashMap: {
              Step: step,
              Transition: `S${i} -> S${j}`,
              "Source Prob": currentDist[i].toFixed(3),
              "Transition Prob": matrix[i][j].toFixed(2),
              Flow: flow.toFixed(3),
            },
          },
          variables: { step, i, j, flow: Number(flow.toFixed(3)) },
        });
      }
    }

    currentDist = nextDist;
    const maxIdx = currentDist.indexOf(Math.max(...currentDist));

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `Complete step ${step} distribution update: [${currentDist.map((v) => v.toFixed(3)).join(", ")}]. Highest probability state: S${maxIdx}.`,
        why: "Vector-matrix multiplication updates the probability distribution vector across all states.",
      },
      primarySnapshot: createGraphSnapshot(currentDist, maxIdx),
      auxiliaryState: {
        hashMap: {
          Step: step,
          "Updated Distribution": currentDist.map((v) => v.toFixed(3)).join(", "),
          "Max State": `S${maxIdx}`,
        },
      },
      variables: { step },
    });
  }

  const finalMaxIdx = currentDist.indexOf(Math.max(...currentDist));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Markov Chain simulation completed after ${rawSteps} steps. Final distribution: [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
      why: "As steps increase, ergodic Markov chains converge toward a stationary steady-state probability distribution.",
    },
    primarySnapshot: createGraphSnapshot(currentDist, finalMaxIdx),
    auxiliaryState: {
      hashMap: {
        "Final Distribution": currentDist.map((v) => v.toFixed(3)).join(", "),
        "Dominant State": `S${finalMaxIdx}`,
      },
    },
    variables: { step: rawSteps },
  });

  return steps;
};

export const MARKOV_CHAINS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A <strong>Discrete-Time Markov Chain (DTMC)</strong> models a sequence of random events where the transition probability to the next state depends exclusively on the current state (the memoryless Markov Property <code>P(X_{n+1} | X_n, ..., X_0) = P(X_{n+1} | X_n)</code>). It forms the mathematical foundation of probabilistic modeling, Google PageRank, MCMC sampling, and reinforcement learning MDPs.</p>",
  sections: [
    {
      heading: "Transition Matrices & State Vector Dynamics",
      body: "<p>A finite Markov chain with <code>N</code> states is parameterized by an <code>N × N</code> right stochastic transition matrix P, where <code>P[i][j] = P(X_{n+1} = j | X_n = i)</code> and each row sums to 1. Given an initial probability vector v₀, the state distribution vector after k steps is computed via matrix multiplication: <code>v_k^T = v_0^T P^k</code>.</p>",
    },
    {
      heading: "Stationary Distributions & Steady-State Convergence",
      body: "<p>For an irreducible (every state is reachable from any other state) and aperiodic (no cyclic state lockstep) Markov chain, repeated matrix multiplication converges to a unique stationary distribution vector π satisfying <code>π^T P = π^T</code> and <code>∑ π_i = 1</code>. This stationary distribution represents the long-term steady-state proportion of time spent in each state.</p>",
    },
    {
      heading: "Systems & Machine Learning Applications",
      body: "<p>Markov chains are extensively deployed across artificial intelligence and systems engineering including Google PageRank (random surfer model over web graph adjacency matrices), MCMC sampling algorithms (Metropolis-Hastings, Gibbs Sampling) for Bayesian inference, Reinforcement Learning (Markov Decision Processes), and queueing traffic modeling.</p>",
    },
    {
      heading: "Implementation Nuances & Numerical Stability",
      body: "<p>Simulating k steps via vector-matrix multiplication takes <code>O(k N²)</code> time and <code>O(N)</code> space. For large k, binary matrix exponentiation computes P^k in <code>O(N³ log k)</code> time. In floating-point implementations, re-normalizing probability vectors at each step prevents numerical floating-point drift.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Markov Property",
      definition:
        "The memoryless property stating that future state distributions depend solely on the current state, independent of past history.",
    },
    {
      term: "Stochastic Matrix",
      definition: "A square matrix with non-negative real entries where each row sums to 1.",
    },
    {
      term: "Stationary Distribution",
      definition:
        "A probability vector π that remains invariant under state transitions: π^T P = π^T.",
    },
  ],
};

export const MARKOV_CHAINS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines markov_chain function signature taking transition matrix, initial distribution vector, and steps count.",
    2: "Stores state space dimension n from length of initial distribution vector.",
    3: "Initializes current distribution vector curr from input distribution.",
    4: "Iterates over k simulation time steps.",
    5: "Initializes next distribution vector nxt with zeros.",
    6: "Outer loop iterates through source state index i.",
    7: "Inner loop iterates through destination state index j.",
    8: "Computes matrix-vector transition probability contribution from state i to state j.",
    9: "Updates current state distribution vector curr to nxt vector.",
    10: "Returns final state probability distribution vector v_k.",
  },
};

export const markovChains: AlgorithmDefinition<MarkovChainsInput> = {
  id: "markov-chains",
  title: "Markov Chains & Random Walks",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Given an <code>N</code>-state discrete-time Markov chain defined by an <code>N × N</code> right stochastic transition matrix <strong>P</strong> and an initial probability distribution vector <strong>v₀</strong>, simulate state probability transitions over <code>k</code> time steps to compute state vector <strong>v_k</strong>:</p><p><code>v_k^T = v_0^T P^k</code></p><h3>State Vector Representation</h3><p>The dynamic probability state is represented as an <code>N</code>-dimensional vector <strong>v_k</strong> where component <code>v_{k, i}</code> holds <code>P(X_k = S_i)</code>.</p><h3>Input Parameters</h3><ul><li><code>numStates</code> (<code>int</code>): Number of states N in the Markov chain.</li><li><code>transitionMatrix</code> (<code>float[][]</code>): N × N right stochastic transition matrix P.</li><li><code>initialDistribution</code> (<code>float[]</code>): Initial probability distribution vector v₀.</li><li><code>steps</code> (<code>int</code>): Number of time steps k to simulate.</li></ul><h3>Output</h3><ul><li><code>float[]</code>: State probability distribution vector v_k after k steps.</li></ul><h3>Edge Cases &amp; Constraints</h3><ul><li><strong>Absorbing States:</strong> Matrix rows with 1.0 on diagonal remain trapped.</li><li><strong>Stochastic Normalization:</strong> Row sums must equal 1.0.</li></ul>",
  constraints: ["1 <= numStates <= 10", "1 <= steps <= 100", "0.0 <= matrix[i][j] <= 1.0"],
  examples: [
    {
      kind: "basic",
      title: "3-State Weather Model",
      input: {
        numStates: 3,
        transitionMatrix: [
          [0.7, 0.2, 0.1],
          [0.3, 0.5, 0.2],
          [0.2, 0.3, 0.5],
        ],
        initialDistribution: [1.0, 0.0, 0.0],
        steps: 5,
      },
      output: "[0.443, 0.315, 0.242]",
      explanation: "After 5 steps, probability of Sunny (S0) is 44.3%.",
    },
    {
      kind: "complex",
      title: "4-State Random Walk",
      input: {
        numStates: 4,
        transitionMatrix: [
          [0.5, 0.5, 0.0, 0.0],
          [0.2, 0.5, 0.3, 0.0],
          [0.0, 0.3, 0.5, 0.2],
          [0.0, 0.0, 0.4, 0.6],
        ],
        initialDistribution: [0.25, 0.25, 0.25, 0.25],
        steps: 8,
      },
      output: "[0.165, 0.332, 0.332, 0.171]",
      explanation: "Random walk converges towards central state concentration.",
    },
    {
      kind: "negative",
      title: "Absorbing 2-State Chain",
      input: {
        numStates: 2,
        transitionMatrix: [
          [1.0, 0.0],
          [0.0, 1.0],
        ],
        initialDistribution: [0.5, 0.5],
        steps: 2,
      },
      output: "[0.5, 0.5]",
      explanation: "Identity transition matrix leaves state distribution unchanged.",
    },
  ],
  code: PYTHON_MARKOV_CHAINS_CODE,
  timeComplexity: {
    best: "O(k * N^2)",
    average: "O(k * N^2)",
    worst: "O(k * N^2)",
  },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Each of the k steps multiplies an N-dimensional vector by an N × N transition matrix in O(N²) time, giving O(k N²) total operations.",
    space: "Requires O(N²) memory to store the transition matrix and probability vectors.",
  },
  topicGuide: MARKOV_CHAINS_TOPIC_GUIDE,
  trivia: MARKOV_CHAINS_TRIVIA,
  sources: [
    {
      type: "book",
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: "Ch 24",
      label: "Competitive Programmer's Handbook, Ch 24",
    },
  ],
  defaultInput: DEFAULT_MARKOV_CHAINS_INPUT,
  generateSteps: generateMarkovChainsSteps,
};
