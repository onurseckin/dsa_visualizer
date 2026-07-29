import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  PrimaryVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

export interface TaskItem {
  id: string;
  duration: number;
  deadline: number;
}

export interface TasksAndDeadlinesInput {
  tasks: TaskItem[];
}

export const PYTHON_TASKS_AND_DEADLINES_CODE = `def tasks_and_deadlines(tasks: list[tuple[int, int]]) -> int:
    tasks.sort(key=lambda x: x[0])
    current_time = 0
    total_reward = 0

    for duration, deadline in tasks:
        current_time += duration
        total_reward += (deadline - current_time)

    return total_reward`;

export const DEFAULT_TASKS_AND_DEADLINES_INPUT: TasksAndDeadlinesInput = {
  tasks: [
    { id: "T1", duration: 4, deadline: 2 },
    { id: "T2", duration: 3, deadline: 5 },
    { id: "T3", duration: 2, deadline: 7 },
    { id: "T4", duration: 4, deadline: 5 },
    { id: "T5", duration: 1, deadline: 3 },
    { id: "T6", duration: 5, deadline: 10 },
    { id: "T7", duration: 2, deadline: 4 },
  ],
};

const createIntroSnapshots = (): Array<{
  narrative: string;
  primarySnapshot: PrimaryVisualSnapshot;
}> => [
  {
    narrative:
      "Tasks and Deadlines schedules N tasks on a single processor. Task i requires processing duration d_i and has deadline D_i.",
    primarySnapshot: {
      kind: "array",
      name: "tasks",
      mode: "box",
      elements: [
        { id: "t1", value: 4, label: "T1 (d:4, D:2)", state: "default" },
        { id: "t2", value: 2, label: "T2 (d:2, D:7)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Completing task i at time X_i earns reward (D_i - X_i). The goal is to maximize total cumulative reward sum(D_i - X_i).",
    primarySnapshot: {
      kind: "array",
      name: "tasks",
      mode: "box",
      elements: [
        { id: "t1", value: 4, label: "Reward = D1 - X1", state: "compare" },
        { id: "t2", value: 2, label: "Reward = D2 - X2", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Mathematical expansion: total reward equals sum(D_i) - sum(X_i). Since sum(D_i) is fixed, maximizing reward equals minimizing sum(X_i).",
    primarySnapshot: {
      kind: "array",
      name: "formula_reduction",
      mode: "box",
      elements: [
        { id: "f1", value: 0, label: "sum(D_i) is constant", state: "sorted" },
        { id: "f2", value: 0, label: "Minimize sum(X_i)", state: "active" },
      ],
    },
  },
  {
    narrative:
      "Counter-intuitive insight: deadline values D_i do NOT affect optimal task order at all!",
    primarySnapshot: {
      kind: "array",
      name: "insight",
      mode: "box",
      elements: [{ id: "i1", value: 1, label: "Ignore D_i for ordering", state: "active" }],
    },
  },
  {
    narrative:
      "Processing task k with duration d_k delays every single subsequent task in the queue by exactly d_k.",
    primarySnapshot: {
      kind: "array",
      name: "delay_propagation",
      mode: "box",
      elements: [
        {
          id: "d1",
          value: 4,
          label: "Task 1 (d=4)",
          state: "active",
          pointers: ["causes delay +4"],
        },
        { id: "d2", value: 2, label: "Task 2 (delayed by 4)", state: "compare" },
        { id: "d3", value: 3, label: "Task 3 (delayed by 4)", state: "compare" },
      ],
    },
  },
  {
    narrative:
      "Total completion time sum(X_i) expands to sum (N - k + 1) * d_k, giving earlier slots higher multiplier weights.",
    primarySnapshot: {
      kind: "array",
      name: "multiplier_weights",
      mode: "box",
      elements: [
        { id: "m1", value: 3, label: "Slot 1 (weight 3x)", state: "active" },
        { id: "m2", value: 2, label: "Slot 2 (weight 2x)", state: "default" },
        { id: "m3", value: 1, label: "Slot 3 (weight 1x)", state: "default" },
      ],
    },
  },
  {
    narrative:
      "Greedy choice rule: Shortest Processing Time (SPT) — execute tasks in strictly ascending order of duration d_i.",
    primarySnapshot: {
      kind: "array",
      name: "spt_ordering",
      mode: "box",
      elements: [
        { id: "s1", value: 1, label: "d=1", state: "sorted" },
        { id: "s2", value: 2, label: "d=2", state: "sorted" },
        { id: "s3", value: 4, label: "d=4", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "Exchange argument: swapping any two out-of-order tasks d_A > d_B strictly increases total completion time, lowering total reward.",
    primarySnapshot: {
      kind: "array",
      name: "exchange_proof",
      mode: "box",
      elements: [
        { id: "e1", value: 2, label: "d=2 (smaller first)", state: "sorted" },
        { id: "e2", value: 4, label: "d=4 (larger second)", state: "sorted" },
      ],
    },
  },
  {
    narrative:
      "The algorithm sorts N tasks in O(N log N) time and computes cumulative reward in a single O(N) pass using O(N) space.",
    primarySnapshot: {
      kind: "array",
      name: "complexity_summary",
      mode: "box",
      elements: [
        { id: "c1", value: 1, label: "Time: O(N log N)", state: "sorted" },
        { id: "c2", value: 2, label: "Space: O(N)", state: "sorted" },
      ],
    },
  },
];

export const generateTasksAndDeadlinesSteps = (input: TasksAndDeadlinesInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const addStep = (
    narrative: string,
    primarySnapshot: PrimaryVisualSnapshot,
    phase: "intro" | "walkthrough" = "walkthrough",
  ) => {
    steps.push(createTutorialStep({ stepIndex: stepIndex++, phase, narrative, primarySnapshot }));
  };

  const rawTasks =
    Array.isArray(input?.tasks) && input.tasks.length > 0
      ? [...input.tasks]
      : [...DEFAULT_TASKS_AND_DEADLINES_INPUT.tasks];

  const isDefaultInput =
    !input ||
    (Array.isArray(input.tasks) &&
      input.tasks.length === DEFAULT_TASKS_AND_DEADLINES_INPUT.tasks.length &&
      input.tasks[0].id === DEFAULT_TASKS_AND_DEADLINES_INPUT.tasks[0].id);

  if (isDefaultInput) {
    for (const intro of createIntroSnapshots()) {
      addStep(intro.narrative, intro.primarySnapshot, "intro");
    }
  }

  const sortedTasks = [...rawTasks].sort(
    (a, b) => a.duration - b.duration || a.deadline - b.deadline,
  );

  const makeSnapshot = (
    currentIdx: number | null,
    processedSet: Set<number>,
    currentTime: number,
    _totalReward: number,
  ): PrimaryVisualSnapshot => ({
    kind: "array",
    name: "sorted_tasks",
    mode: "box",
    elements: sortedTasks.map((t, idx) => {
      let state: ElementState = "default";
      let pointers: string[] = [`d:${t.duration}`, `D:${t.deadline}`];

      if (processedSet.has(idx)) {
        state = "sorted";
      } else if (idx === currentIdx) {
        state = "active";
        pointers.push(`t=${currentTime}`);
      }

      return {
        id: `task-${t.id}`,
        value: t.duration,
        label: t.id,
        state,
        pointers,
      };
    }),
  });

  addStep(
    `We start with ${sortedTasks.length} task(s) sorted in ascending Shortest Processing Time order: ${sortedTasks.map((t) => `${t.id}(d:${t.duration},D:${t.deadline})`).join(", ")}.`,
    makeSnapshot(null, new Set(), 0, 0),
  );

  let currentTime = 0;
  let totalReward = 0;
  const processedSet = new Set<number>();

  for (let i = 0; i < sortedTasks.length; i++) {
    const task = sortedTasks[i];

    addStep(
      `Inspect task ${task.id} with duration d = ${task.duration} and deadline D = ${task.deadline}. Current clock t = ${currentTime}, total reward = ${totalReward}.`,
      makeSnapshot(i, processedSet, currentTime, totalReward),
    );

    currentTime += task.duration;
    const taskReward = task.deadline - currentTime;
    totalReward += taskReward;
    processedSet.add(i);

    addStep(
      `Execute task ${task.id}: clock advances by +${task.duration} to t = ${currentTime}. Reward contributed = deadline (${task.deadline}) - completion (${currentTime}) = ${taskReward}. Updated total reward = ${totalReward}.`,
      makeSnapshot(i, processedSet, currentTime, totalReward),
    );
  }

  addStep(
    `All ${sortedTasks.length} tasks scheduled! Maximum total cumulative reward score = ${totalReward}.`,
    makeSnapshot(null, processedSet, currentTime, totalReward),
  );

  return steps;
};

export const TASKS_AND_DEADLINES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines `tasks_and_deadlines(tasks)` function signature accepting task tuples `(duration, deadline)`.",
    2: "Sorts tasks in-place by duration ascending (`key=lambda x: x[0]`) in O(N log N) time.",
    3: "Initializes timeline clock `current_time = 0` before task execution starts.",
    4: "Initializes accumulator `total_reward = 0` to tally overall reward score.",
    5: "Blank line separator before task processing loop.",
    6: "Loops over each `(duration, deadline)` tuple in sorted Shortest Processing Time order.",
    7: "Advances timeline clock `current_time += duration` by adding task execution duration.",
    8: "Calculates task reward `deadline - current_time` and accumulates it into `total_reward`.",
    9: "Blank line separator after loop completion.",
    10: "Returns final `total_reward` score representing maximum achievable reward.",
  },
};

export const tasksAndDeadlines: AlgorithmDefinition<TasksAndDeadlinesInput> = {
  id: "tasks-and-deadlines",
  title: "Tasks and Deadlines",
  topicIds: ["heap_and_priority_queue", "greedy_algorithms"],
  difficulty: "Medium",
  description:
    "<p>Given <code>n</code> tasks with durations <code>d_i</code> and deadlines <code>D_i</code>, find an execution order on a single processor that maximizes total reward <span>&sum; (D_i - X_i)</span>.</p>" +
    "<h3>Input Parameters</h3>" +
    "<ul>" +
    "  <li><code>tasks</code>: An array of task objects <code>{ id: string, duration: number, deadline: number }</code> where <code>1 &le; N &le; 10<sup>5</sup></code>.</li>" +
    "</ul>" +
    "<h3>Output Format</h3>" +
    "<p>Returns an integer representing the maximum total cumulative reward score.</p>",
  constraints: ["1 <= tasks.length <= 10^5", "1 <= duration, deadline <= 10^9"],
  examples: [
    {
      kind: "basic",
      scenario: "standard",
      title: "Standard 7-Task Execution",
      inputDisplay: "tasks = [(4,2), (3,5), (2,7), (4,5), (1,3), (5,10), (2,4)]",
      outputDisplay: "Max Total Reward: -15",
      input: DEFAULT_TASKS_AND_DEADLINES_INPUT,
      output: "-15",
      explanation:
        "Sorting tasks by duration ascending and executing them sequentially achieves the optimal total reward score.",
    },
    {
      kind: "complex",
      scenario: "adversarial",
      title: "Varying Deadlines and Durations",
      inputDisplay: "tasks = [(5,10), (1,2), (2,4)]",
      outputDisplay: "Max Total Reward: 5",
      input: {
        tasks: [
          { id: "A", duration: 5, deadline: 10 },
          { id: "B", duration: 1, deadline: 2 },
          { id: "C", duration: 2, deadline: 4 },
        ],
      },
      output: "5",
      explanation:
        "Order by duration: (1,2) at t=1 (score 1), (2,4) at t=3 (score 1), (5,10) at t=8 (score 2). Total = 4.",
    },
    {
      kind: "negative",
      scenario: "boundary",
      title: "Single Impossible Task",
      inputDisplay: "tasks = [(10,1)]",
      outputDisplay: "Max Total Reward: -9",
      input: {
        tasks: [{ id: "X", duration: 10, deadline: 1 }],
      },
      output: "-9",
      explanation: "Single task completes at t=10, giving deadline reward 1 - 10 = -9.",
    },
  ],
  code: PYTHON_TASKS_AND_DEADLINES_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting N tasks by duration takes O(N log N) time. Computing cumulative completion times takes a single O(N) pass.",
    space: "O(N) space for storing task structures and auxiliary step snapshots.",
  },
  topicGuide: {
    overview:
      "<p>Tasks and Deadlines schedules <code>n</code> tasks with durations <code>d_i</code> and deadlines <code>D_i</code> on a single processor to maximize total reward <span>&sum; (D_i - X_i)</span>, where <code>X_i</code> is completion time. Counter-intuitively, sorting tasks purely by duration in ascending order (Shortest Processing Time / SPT) yields the maximum total reward regardless of individual deadline values.</p>",
    sections: [
      {
        heading: "Mathematical Equivalence & Algebraic Reduction",
        body: "<p>Total reward equals <code>&sum; (D_i - X_i) = &sum; D_i - &sum; X_i</code>. Because the sum of deadlines <code>&sum; D_i</code> is a fixed constant for a given task set, maximizing total reward is mathematically identical to minimizing total completion time <code>&sum; X_i</code>.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Shortest Processing Time (SPT)",
        definition: "Greedy ordering by task duration ascending to minimize total completion time.",
      },
    ],
  },
  trivia: TASKS_AND_DEADLINES_TRIVIA,
  sources: [
    {
      kind: "book",
      label: "Competitive Programmer's Handbook, Ch 6",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 6,
      section: "6.2 Tasks and deadlines",
    },
  ],
  defaultInput: DEFAULT_TASKS_AND_DEADLINES_INPUT,
  generateSteps: generateTasksAndDeadlinesSteps,
};

export default tasksAndDeadlines;
