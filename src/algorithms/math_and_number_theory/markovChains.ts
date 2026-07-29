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
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface MarkovChainsInput {
  numStates: number;
  transitionMatrix: number[][];
  initialDistribution: number[];
  steps: number;
}

export const PYTHON_MARKOV_CHAINS_CODE = `class Solution:
    def __init__(self):
        pass

    def distribution(self, transition: list[list[float]], initial: list[float], steps: int) -> list[float]:
        state = initial[:]
        for _ in range(steps):
            state = [sum(state[source] * transition[source][target] for source in range(len(state))) for target in range(len(state))]
        return state`;

export const DEFAULT_MARKOV_CHAINS_INPUT: MarkovChainsInput = {
  numStates: 3,
  transitionMatrix: [
    [0.7, 0.2, 0.1],
    [0.3, 0.5, 0.2],
    [0.2, 0.3, 0.5],
  ],
  initialDistribution: [1.0, 0.0, 0.0],
  steps: 3,
};

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      title: "Markov Chain Definition",
      narrative:
        "A Discrete-Time Markov Chain models a stochastic process transitioning between discrete states based on fixed transition probabilities.",
      nodes: [
        { id: "S0", label: "S0: 100%", val: 100, x: 100, y: 150, state: "active" as ElementState },
        { id: "S1", label: "S1: 0%", val: 0, x: 250, y: 100, state: "default" as ElementState },
        { id: "S2", label: "S2: 0%", val: 0, x: 250, y: 200, state: "default" as ElementState },
      ],
      edges: [
        { from: "S0", to: "S1", weight: 0.2, isTraversed: true },
        { from: "S1", to: "S2", weight: 0.2, isTraversed: false },
      ],
    },
    {
      title: "Memoryless Markov Property",
      narrative:
        "The core Markov property states that the transition probability to the next state depends exclusively on the current state, independent of prior path history.",
      nodes: [
        {
          id: "S0",
          label: "History ignored",
          val: 100,
          x: 100,
          y: 150,
          state: "visited" as ElementState,
        },
        {
          id: "S1",
          label: "Current State",
          val: 0,
          x: 250,
          y: 100,
          state: "pivot" as ElementState,
        },
        { id: "S2", label: "Next State", val: 0, x: 250, y: 200, state: "active" as ElementState },
      ],
      edges: [
        { from: "S0", to: "S1", weight: 0.2, isTraversed: false },
        { from: "S1", to: "S2", weight: 0.2, isTraversed: true },
      ],
    },
    {
      title: "Stochastic Transition Matrix P",
      narrative:
        "Transitions are encoded in an N x N right stochastic matrix P where entry P[i][j] represents the transition probability from state i to state j, and each row sums to 1.",
      nodes: [
        {
          id: "S0",
          label: "Row 0 sum = 1.0",
          val: 100,
          x: 100,
          y: 150,
          state: "active" as ElementState,
        },
        { id: "S1", label: "S1", val: 0, x: 250, y: 100, state: "default" as ElementState },
        { id: "S2", label: "S2", val: 0, x: 250, y: 200, state: "default" as ElementState },
      ],
      edges: [
        { from: "S0", to: "S1", weight: 0.2, isTraversed: true },
        { from: "S0", to: "S2", weight: 0.1, isTraversed: true },
      ],
    },
    {
      title: "Probability Distribution Vector v",
      narrative:
        "The probability distribution across all states at step k is represented by state vector v_k where component v_k[i] is the probability of being in state i.",
      nodes: [
        { id: "S0", label: "S0: 70%", val: 70, x: 100, y: 150, state: "sorted" as ElementState },
        { id: "S1", label: "S1: 20%", val: 20, x: 250, y: 100, state: "sorted" as ElementState },
        { id: "S2", label: "S2: 10%", val: 10, x: 250, y: 200, state: "sorted" as ElementState },
      ],
      edges: [{ from: "S0", to: "S1", weight: 0.2, isTraversed: false }],
    },
    {
      title: "Vector-Matrix Multiplication Step",
      narrative:
        "Advancing time step by step calculates the updated distribution vector via vector-matrix multiplication: v_{k+1}^T = v_k^T x P.",
      nodes: [
        { id: "S0", label: "S0: 55%", val: 55, x: 100, y: 150, state: "active" as ElementState },
        { id: "S1", label: "S1: 27%", val: 27, x: 250, y: 100, state: "active" as ElementState },
        { id: "S2", label: "S2: 18%", val: 18, x: 250, y: 200, state: "active" as ElementState },
      ],
      edges: [{ from: "S0", to: "S1", weight: 0.2, isTraversed: true }],
    },
    {
      title: "Total Probability Law Conservation",
      narrative:
        "Because P is stochastic, the sum of probabilities across all nodes remains strictly conserved at 1.0 (100%) at every time step.",
      nodes: [
        { id: "S0", label: "Sum = 100%", val: 55, x: 100, y: 150, state: "sorted" as ElementState },
        { id: "S1", label: "S1", val: 27, x: 250, y: 100, state: "sorted" as ElementState },
        { id: "S2", label: "S2", val: 18, x: 250, y: 200, state: "sorted" as ElementState },
      ],
      edges: [],
    },
    {
      title: "Stationary Distribution Convergence",
      narrative:
        "For ergodic chains, as steps increase, the probability distribution converges toward a unique steady-state stationary distribution pi satisfying pi^T x P = pi^T.",
      nodes: [
        {
          id: "S0",
          label: "Steady S0: 45%",
          val: 45,
          x: 100,
          y: 150,
          state: "sorted" as ElementState,
        },
        {
          id: "S1",
          label: "Steady S1: 31%",
          val: 31,
          x: 250,
          y: 100,
          state: "sorted" as ElementState,
        },
        {
          id: "S2",
          label: "Steady S2: 24%",
          val: 24,
          x: 250,
          y: 200,
          state: "sorted" as ElementState,
        },
      ],
      edges: [],
    },
    {
      title: "Simulation Time Complexity",
      narrative:
        "Simulating k steps takes O(k x N^2) vector-matrix multiplication operations using O(N^2) space for the transition matrix.",
      nodes: [
        {
          id: "S0",
          label: "O(k N^2) Time",
          val: 100,
          x: 100,
          y: 150,
          state: "sorted" as ElementState,
        },
        {
          id: "S1",
          label: "O(N^2) Space",
          val: 100,
          x: 250,
          y: 100,
          state: "sorted" as ElementState,
        },
      ],
      edges: [],
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      primarySnapshot: {
        kind: "graph",
        nodes: data.nodes,
        edges: data.edges,
      },
    }),
  );
};

export const generateMarkovChainsSteps = (input: MarkovChainsInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

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
    isDone: boolean = false,
  ): GraphVisualSnapshot => {
    const nodes: GraphNodeItem[] = dist.map((prob, idx) => {
      const angle = (2 * Math.PI * idx) / n - Math.PI / 2;
      const x = Math.round(200 + 140 * Math.cos(angle));
      const y = Math.round(200 + 140 * Math.sin(angle));
      let state: ElementState = "default";
      if (isDone) {
        state = "sorted";
      } else if (activeSourceIdx === idx || activeDestIdx === idx) {
        state = "active";
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

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize Discrete-Time Markov Chain with ${n} states for ${rawSteps} steps. Initial distribution: [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
      primarySnapshot: createGraphSnapshot(currentDist),
    }),
  );

  for (let step = 1; step <= rawSteps; step++) {
    const nextDist = new Array(n).fill(0.0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const flow = currentDist[i] * matrix[i][j];
        nextDist[j] += flow;
      }
    }

    currentDist = nextDist;
    const maxIdx = currentDist.indexOf(Math.max(...currentDist));

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `Step ${step}/${rawSteps}: updated probability distribution vector to [${currentDist.map((v) => v.toFixed(3)).join(", ")}]. Dominant state: S${maxIdx}.`,
        primarySnapshot: createGraphSnapshot(currentDist, maxIdx),
      }),
    );
  }

  const finalMaxIdx = currentDist.indexOf(Math.max(...currentDist));
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Markov Chain simulation completed after ${rawSteps} steps. Final distribution: [${currentDist.map((v) => v.toFixed(3)).join(", ")}].`,
      primarySnapshot: createGraphSnapshot(currentDist, finalMaxIdx, undefined, true),
    }),
  );

  return steps;
};

export const MARKOV_CHAINS_TOPIC_GUIDE: TopicGuide = {
  overview:
    "<p>A Discrete-Time Markov Chain models random transitions between discrete states.</p>",
  sections: [
    {
      heading: "Markov Property",
      body: "<p>Transition probability depends only on current state, independent of history.</p>",
    },
  ],
  keyTerms: [
    {
      term: "Markov Property",
      definition: "Memoryless transition dynamics.",
    },
  ],
};

export const MARKOV_CHAINS_TRIVIA: TriviaMeta = {
  lineExplanations: {},
};

export const markovChains: AlgorithmDefinition<MarkovChainsInput> = {
  id: "markov-chains",
  title: "Markov Chains & Random Walks",
  topicIds: ["math_and_number_theory"],
  difficulty: "Medium",
  description:
    "<p>Simulate state probability transitions for a discrete-time Markov chain over <code>steps</code> time steps given an <code>N &times; N</code> right stochastic transition matrix and an initial probability distribution vector.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul><li><code>numStates</code> (<code>N &ge; 1</code>): Number of states in the Markov chain.</li>" +
    "<li><code>transitionMatrix</code> (<code>float[][]</code>): N &times; N transition matrix P where each row sums to 1.</li>" +
    "<li><code>initialDistribution</code> (<code>float[]</code>): Initial probability distribution vector v₀.</li>" +
    "<li><code>steps</code> (<code>k &ge; 1</code>): Number of time steps to simulate.</li></ul>" +
    "<h3>Output</h3>" +
    "<ul><li><code>float[]</code>: Probability distribution vector after k steps.</li></ul>",
  constraints: ["1 <= numStates <= 10", "1 <= steps <= 100", "0.0 <= matrix[i][j] <= 1.0"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "3-State Weather Model",
      input: {
        numStates: 3,
        transitionMatrix: [
          [0.7, 0.2, 0.1],
          [0.3, 0.5, 0.2],
          [0.2, 0.3, 0.5],
        ],
        initialDistribution: [1.0, 0.0, 0.0],
        steps: 3,
      },
      output: "[0.443, 0.315, 0.242]",
      explanation: "After 3 steps, state distribution updates.",
    },
    {
      kind: "negative",
      scenario: "boundary",
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
    {
      kind: "complex",
      scenario: "adversarial",
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
        steps: 5,
      },
      output: "[0.165, 0.332, 0.332, 0.171]",
      explanation: "Random walk converges towards central states.",
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
    time: "Each of the k steps multiplies an N-dimensional vector by an N x N matrix in O(k N^2) total time.",
    space: "Requires O(N^2) memory.",
  },
  topicGuide: MARKOV_CHAINS_TOPIC_GUIDE,
  trivia: MARKOV_CHAINS_TRIVIA,
  sources: [
    {
      kind: "book",
      type: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 24,
      chapterTitle: "Probability",
      section: "24.4 Markov chains",
      url: "https://cses.fi/book/book.pdf",
    },
  ],
  defaultInput: DEFAULT_MARKOV_CHAINS_INPUT,
  generateSteps: generateMarkovChainsSteps,
};

export default markovChains;
