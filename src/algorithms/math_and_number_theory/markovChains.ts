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

  const n = Math.max(1, Math.min(6, input.numStates || 3));
  const rawSteps = Math.max(1, Math.min(30, input.steps || 18));

  // Sanitize initial distribution
  let currentDist: number[] = Array.from({ length: n }, (_, i) =>
    input.initialDistribution && input.initialDistribution[i] !== undefined
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
        input.transitionMatrix &&
        input.transitionMatrix[i] &&
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
      what: `Initializing Discrete-Time Markov Chain simulation with ${n} states for ${rawSteps} steps. Initial distribution: [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
      why: "A discrete-time Markov chain updates state probability distribution at each step based on the transition matrix P.",
    },
    primarySnapshot: createGraphSnapshot(currentDist),
    auxiliaryState: {
      hashMap: {
        Step: 0,
        Distribution: currentDist.map((v) => v.toFixed(3)).join(", "),
        "Matrix Size": `${n}x${n}`,
      },
    },
    variables: { steps: rawSteps, n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: `n = len(initial_dist) = ${n}.`,
      why: "Reads state space dimension n from the length of the initial probability vector.",
    },
    primarySnapshot: createGraphSnapshot(currentDist),
    auxiliaryState: {
      hashMap: { "State Space Size": n },
    },
    variables: { n, step: 0 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: `curr = list(initial_dist): [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
      why: "Copies initial probability distribution vector into working state vector curr.",
    },
    primarySnapshot: createGraphSnapshot(currentDist),
    auxiliaryState: {
      hashMap: { curr: currentDist.map((v) => v.toFixed(3)).join(", ") },
    },
    variables: { n, step: 0 },
  });

  for (let s = 1; s <= rawSteps; s++) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Step ${s}/${rawSteps}: Entering time step loop iteration for k = ${s}.`,
        why: "Advances discrete time step k to compute the updated state probability vector.",
      },
      primarySnapshot: createGraphSnapshot(currentDist),
      auxiliaryState: {
        hashMap: {
          "Current Step": s,
          Distribution: currentDist.map((v) => v.toFixed(3)).join(", "),
        },
      },
      variables: { step: s },
    });

    const nextDist = new Array<number>(n).fill(0.0);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `nxt = [0.0] * ${n}: Initialized next distribution vector with zeros.`,
        why: "Allocates a zero-filled vector nxt to accumulate incoming transition probabilities.",
      },
      primarySnapshot: createGraphSnapshot(currentDist),
      auxiliaryState: {
        hashMap: {
          "Current Step": s,
          nxt: nextDist.map((v) => v.toFixed(3)).join(", "),
        },
      },
      variables: { step: s },
    });

    if (s === 1) {
      for (let i = 0; i < n; i++) {
        steps.push({
          stepIndex: stepIndex++,
          codeLine: 6,
          explanation: {
            what: `for i in range(${n}): i = ${i} (State S${i}, prob = ${currentDist[i].toFixed(3)}).`,
            why: "Outer loop iterates through each source state i in state space.",
          },
          primarySnapshot: createGraphSnapshot(currentDist, i),
          auxiliaryState: {
            hashMap: {
              "Source State": `S${i}`,
              "Source Prob": currentDist[i].toFixed(3),
            },
          },
          variables: { step: s, i },
        });

        for (let j = 0; j < n; j++) {
          const contrib = currentDist[i] * matrix[i][j];
          nextDist[j] += contrib;

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 8,
            explanation: {
              what: `nxt[${j}] += curr[${i}] * P[${i}][${j}] = ${currentDist[i].toFixed(3)} * ${matrix[i][j].toFixed(2)} = ${contrib.toFixed(3)} (nxt[${j}] = ${nextDist[j].toFixed(3)}).`,
              why: `Adds transition probability mass from source state S${i} to destination state S${j}.`,
            },
            primarySnapshot: createGraphSnapshot(currentDist, i, j),
            auxiliaryState: {
              hashMap: {
                Source: `S${i}`,
                Dest: `S${j}`,
                "Transition P": matrix[i][j].toFixed(2),
                "Accumulated nxt": nextDist.map((v) => v.toFixed(3)).join(", "),
              },
            },
            variables: { step: s, i, j, contrib },
          });
        }
      }
    } else {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          nextDist[j] += currentDist[i] * matrix[i][j];
        }
      }

      const maxProbIdx = nextDist.indexOf(Math.max(...nextDist));
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Step ${s}/${rawSteps}: Computed next state distribution via matrix multiplication v_${s} = v_${s - 1} P.`,
          why: `State S${maxProbIdx} holds highest probability (${(nextDist[maxProbIdx] * 100).toFixed(1)}%).`,
        },
        primarySnapshot: createGraphSnapshot(nextDist, maxProbIdx),
        auxiliaryState: {
          hashMap: {
            "Current Step": s,
            Distribution: nextDist.map((v) => v.toFixed(3)).join(", "),
            "Most Likely State": `S${maxProbIdx}`,
          },
        },
        variables: { step: s, maxProbState: maxProbIdx },
      });
    }

    currentDist = nextDist;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: `curr = nxt: Updated current distribution vector to [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
        why: `Replaces current distribution vector curr with newly computed nxt vector for step ${s}.`,
      },
      primarySnapshot: createGraphSnapshot(currentDist),
      auxiliaryState: {
        hashMap: {
          "Current Step": s,
          "Updated Distribution": currentDist.map((v) => v.toFixed(3)).join(", "),
        },
      },
      variables: { step: s },
    });
  }

  const finalMaxIdx = currentDist.indexOf(Math.max(...currentDist));
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Markov Chain simulation completed after ${rawSteps} steps. Final distribution: [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
      why: "Stationary/steady-state distribution describes long-term proportion of time spent in each state.",
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
    "A Discrete-Time Markov Chain (DTMC) models a sequence of random events where the transition probability to the next state depends exclusively on the current state (the memoryless Markov Property $P(X_{n+1} \\mid X_n, \\dots, X_0) = P(X_{n+1} \\mid X_n)$). It forms the mathematical foundation of probabilistic modeling, Google PageRank, MCMC sampling, and reinforcement learning MDPs.",
  sections: [
    {
      heading: "Transition Matrices & State Vector Dynamics",
      body: "A finite Markov chain with $N$ states is parameterized by an $N \\times N$ right stochastic transition matrix $\\mathbf{P}$, where $\\mathbf{P}[i][j] = P(X_{n+1} = j \\mid X_n = i)$ and each row sums to $1$ ($\\sum_j \\mathbf{P}[i][j] = 1$). Given an initial probability vector $\\mathbf{v}_0 \\in \\mathbb{R}^N$, the state distribution vector after $k$ steps is computed via matrix multiplication:\n$$\\mathbf{v}_k^T = \\mathbf{v}_0^T \\mathbf{P}^k$$",
    },
    {
      heading: "Stationary Distributions & Steady-State Convergence",
      body: "For an irreducible (every state is reachable from any other state) and aperiodic (no cyclic state lockstep) Markov chain, repeated matrix multiplication converges to a unique stationary distribution vector $\\boldsymbol{\\pi}$ satisfying:\n$$\\boldsymbol{\\pi}^T \\mathbf{P} = \\boldsymbol{\\pi}^T \\quad \\text{and} \\quad \\sum_{i=1}^N \\pi_i = 1$$\nThis stationary distribution represents the long-term steady-state proportion of time spent in each state.",
    },
    {
      heading: "Systems & Machine Learning Applications",
      body: "Markov chains are extensively deployed across artificial intelligence and systems engineering:\n1. Google PageRank: Random surfer model over web graph adjacency matrices.\n2. MCMC: Markov Chain Monte Carlo sampling algorithms (Metropolis-Hastings, Gibbs Sampling) for Bayesian inference.\n3. Reinforcement Learning: Markov Decision Processes (MDPs).\n4. Queueing Theory & Traffic Modeling.",
    },
    {
      heading: "Implementation Nuances & Numerical Stability",
      body: "Simulating $k$ steps via vector-matrix multiplication takes $\\mathcal{O}(k N^2)$ time and $\\mathcal{O}(N)$ space. For large $k$, binary matrix exponentiation computes $\\mathbf{P}^k$ in $\\mathcal{O}(N^3 \\log k)$ time. In floating-point implementations, re-normalizing probability vectors at each step prevents numerical floating-point drift.",
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
      definition:
        "A square matrix $\\mathbf{P} \\in \\mathbb{R}_{\\ge 0}^{N \\times N}$ with non-negative real entries where each row sums to $1$.",
    },
    {
      term: "Stationary Distribution",
      definition:
        "A probability vector $\\boldsymbol{\\pi}$ that remains invariant under state transitions: $\\boldsymbol{\\pi}^T \\mathbf{P} = \\boldsymbol{\\pi}^T$.",
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
    "Given an $N$-state discrete-time Markov chain defined by an $N \\times N$ right stochastic transition matrix $\\mathbf{P}$ and an initial probability distribution vector $\\mathbf{v}_0$, simulate state probability transitions over $k$ time steps to compute state vector $\\mathbf{v}_k$:\n\n$$\\mathbf{v}_k^T = \\mathbf{v}_0^T \\mathbf{P}^k$$\n\n### State Vector Representation\nThe dynamic probability state is represented as an $N$-dimensional vector $\\mathbf{v}_k \\in \\mathbb{R}^N$ where component $v_{k, i}$ holds $P(X_k = S_i)$.\n\n### Input Parameters\n- `numStates` ($N \\in \\mathbb{Z}_{> 0}$): Number of states $N$ in the Markov chain.\n- `transitionMatrix` (`list[list[float]]`): $N \\times N$ right stochastic transition matrix $\\mathbf{P}$.\n- `initialDistribution` (`list[float]`): Initial probability distribution vector $\\mathbf{v}_0$.\n- `steps` ($k \\in \\mathbb{Z}_{> 0}$): Number of time steps $k$ to simulate.\n\n### Output\n- `list[float]`: State probability distribution vector $\\mathbf{v}_k$ after $k$ steps.\n\n### Edge Cases & Constraints\n- Absorbing States: Matrix rows with $1.0$ on diagonal remain trapped.\n- Stochastic Normalization: Row sums must equal $1.0$.",
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
    time: "Each of the $k$ steps multiplies an $N$-dimensional vector by an $N \\times N$ transition matrix in $\\mathcal{O}(N^2)$ time, giving $\\mathcal{O}(k N^2)$ total operations.",
    space:
      "Requires $\\mathcal{O}(N^2)$ memory to store the transition matrix and probability vectors.",
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
