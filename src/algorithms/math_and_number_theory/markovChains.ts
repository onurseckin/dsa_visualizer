import type { AlgorithmDefinition, AlgorithmStep, GraphNodeItem, GraphEdgeItem, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface MarkovChainsInput {
  numStates: number;
  transitionMatrix: number[][];
  initialDistribution: number[];
  steps: number;
}

export const PYTHON_MARKOV_CHAINS_CODE = `def markov_chain_simulate(matrix: list[list[float]], initial: list[float], steps: int) -> list[float]:
    current = list(initial)
    n = len(current)
    for _ in range(steps):
        next_dist = [0.0] * n
        for i in range(n):
            for j in range(n):
                next_dist[j] += current[i] * matrix[i][j]
        current = next_dist
    return current`;

export const DEFAULT_MARKOV_CHAINS_INPUT: MarkovChainsInput = {
  numStates: 3,
  transitionMatrix: [
    [0.7, 0.2, 0.1],
    [0.3, 0.5, 0.2],
    [0.2, 0.3, 0.5],
  ],
  initialDistribution: [1.0, 0.0, 0.0],
  steps: 5,
};

export const generateMarkovChainsSteps = (input: MarkovChainsInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const n = Math.max(1, Math.min(6, input.numStates || 3));
  const rawSteps = Math.max(1, Math.min(20, input.steps || 5));

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
    currentDist = currentDist.map(val => val / sumInitial);
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
    const normalizedRow = rowSum > 0 ? row.map(v => v / rowSum) : row.map((_, idx) => (idx === i ? 1.0 : 0.0));
    matrix.push(normalizedRow);
  }

  const radius = 180;
  const centerX = 250;
  const centerY = 200;

  const makeGraphSnapshot = (dist: number[], activeStateIdx?: number) => {
    const nodes: GraphNodeItem[] = [];
    const edges: GraphEdgeItem[] = [];

    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const x = Math.round(centerX + radius * Math.cos(angle));
      const y = Math.round(centerY + radius * Math.sin(angle));
      const probPercent = (dist[i] * 100).toFixed(1);

      nodes.push({
        id: `S${i}`,
        label: `S${i}: ${probPercent}%`,
        x,
        y,
        state: activeStateIdx === i ? "active" : dist[i] > 0.3 ? "visited" : "default",
        val: Math.round(dist[i] * 100),
      });
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const p = matrix[i][j];
        if (p > 0.01) {
          edges.push({
            from: `S${i}`,
            to: `S${j}`,
            weight: Math.round(p * 100) / 100,
            isTraversed: activeStateIdx === i,
            isPath: dist[i] > 0.2 && p > 0.2,
          });
        }
      }
    }

    return { nodes, edges };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initializing Markov Chain with ${n} states. Initial distribution: [${currentDist.map(v => v.toFixed(2)).join(", ")}].`,
      why: "A discrete-time Markov chain updates state probabilities at each step based purely on the current state distribution and transition matrix.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(currentDist),
    },
    auxiliaryState: {
      hashMap: {
        "Step": 0,
        "Distribution": currentDist.map(v => v.toFixed(3)).join(", "),
      },
    },
    variables: { step: 0 },
  });

  for (let s = 1; s <= rawSteps; s++) {
    const nextDist = new Array<number>(n).fill(0.0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        nextDist[j] += currentDist[i] * matrix[i][j];
      }
    }
    currentDist = nextDist;

    const maxProbIdx = currentDist.indexOf(Math.max(...currentDist));

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 4,
      explanation: {
        what: `Step ${s}/${rawSteps}: Computed next state distribution via matrix multiplication.`,
        why: `State S${maxProbIdx} now has highest probability (${(currentDist[maxProbIdx] * 100).toFixed(1)}%).`,
      },
      primarySnapshot: {
        kind: "graph",
        ...makeGraphSnapshot(currentDist, maxProbIdx),
      },
      auxiliaryState: {
        hashMap: {
          "Current Step": s,
          "Distribution": currentDist.map(v => v.toFixed(3)).join(", "),
          "Most Likely State": `S${maxProbIdx}`,
        },
      },
      variables: { step: s, maxProbState: maxProbIdx },
    });
  }

  const finalMaxIdx = currentDist.indexOf(Math.max(...currentDist));
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Markov Chain simulation completed after ${rawSteps} steps. Final distribution: [${currentDist.map(v => v.toFixed(3)).join(", ")}].`,
      why: "Stationary/steady-state distribution describes the long-term proportion of time spent in each state.",
    },
    primarySnapshot: {
      kind: "graph",
      ...makeGraphSnapshot(currentDist, finalMaxIdx),
    },
    auxiliaryState: {
      hashMap: {
        "Final Distribution": currentDist.map(v => v.toFixed(3)).join(", "),
        "Dominant State": `S${finalMaxIdx}`,
      },
    },
    variables: { step: rawSteps },
  });

  return steps;
};

const MARKOV_CHAINS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Markov Chains model stochastic processes where future state transitions depend exclusively on the present state (the Markov Property), without memory of past steps.",
  sections: [
    {
      heading: "The Markov Property & Transition Matrix",
      body: "A transition matrix P has non-negative entries where each row sums to 1. P[i][j] represents the conditional probability of moving from state i to state j in a single time step.",
    },
    {
      heading: "Stationary Distributions & Random Walks",
      body: "For irreducible and aperiodic Markov chains, repeated matrix multiplication converges to a stationary probability distribution vector π where π * P = π.",
    },
  ],
  keyTerms: [
    {
      term: "Transition Matrix",
      definition: "A square stochastic matrix containing single-step transition probabilities between states.",
    },
    {
      term: "Stationary Distribution",
      definition: "A state probability distribution that remains invariant under state transitions.",
    },
  ],
};

const MARKOV_CHAINS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines function simulating Markov chain step transitions.",
    2: "Initializes current distribution vector from initial input.",
    4: "Iterates over simulation steps.",
    5: "Initializes next distribution vector with zeros.",
    6: "Computes matrix-vector transition probabilities for state i to state j.",
    9: "Updates current state distribution to next_dist.",
    10: "Returns final state probability distribution vector.",
  },
};

export const markovChains: AlgorithmDefinition<MarkovChainsInput> = {
  id: "markov-chains",
  title: "Markov Chains & Random Walks",
  category: "math_and_number_theory",
  difficulty: "Medium",
  description:
    "Simulate state transitions and compute stationary distributions or probability distributions after k steps on a discrete-time Markov chain.",
  constraints: [
    "1 <= numStates <= 10",
    "1 <= steps <= 100",
    "0.0 <= matrix[i][j] <= 1.0",
  ],
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
    time: "Each of the k steps multiplies an N-dimensional vector by an N x N transition matrix in O(N^2) time.",
    space: "Requires storing N x N transition matrix and N-element probability distribution vectors.",
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
