import type { AlgorithmDefinition, AlgorithmStep, ArrayElement, TopicGuide } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

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
  ],
};

export const generateTasksAndDeadlinesSteps = (input: TasksAndDeadlinesInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawTasks = [...input.tasks];

  const createArrayElements = (
    currentList: TaskItem[],
    activeIndex: number | null,
    processedIndexSet: Set<number>,
  ): ArrayElement[] => {
    return currentList.map((task, idx) => {
      let state: ArrayElement["state"] = "default";
      if (processedIndexSet.has(idx)) {
        state = "sorted";
      } else if (idx === activeIndex) {
        state = "active";
      }

      return {
        id: task.id,
        value: task.duration,
        state,
        pointers: [task.id, `d:${task.duration},D:${task.deadline}`],
      };
    });
  };

  // Step 0: Input start
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Received ${rawTasks.length} tasks with duration and deadline attributes.`,
      why: "The goal is to maximize total reward sum(deadline - completion_time).",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(rawTasks, null, new Set()),
    },
    auxiliaryState: {
      customState: {
        taskCount: rawTasks.length,
        status: "Unsorted input",
      },
    },
    variables: {
      taskCount: rawTasks.length,
      currentTime: 0,
      totalReward: 0,
    },
  });

  // Step 1: Sort tasks by duration
  const sortedTasks = [...rawTasks].sort((a, b) => a.duration - b.duration);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Sorted all tasks by duration in ascending order.",
      why: "Shorter duration tasks finish faster and reduce completion time delay for all subsequent tasks.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedTasks, null, new Set()),
    },
    auxiliaryState: {
      customState: {
        sortedOrder: sortedTasks.map((t) => `${t.id}(d:${t.duration})`).join(", "),
      },
    },
    variables: {
      sortedCount: sortedTasks.length,
      currentTime: 0,
      totalReward: 0,
    },
  });

  // Step 2: Main loop
  let currentTime = 0;
  let totalReward = 0;
  const processedIndices = new Set<number>();

  for (let i = 0; i < sortedTasks.length; i++) {
    const task = sortedTasks[i];
    const prevTime = currentTime;
    currentTime += task.duration;
    const taskReward = task.deadline - currentTime;
    totalReward += taskReward;
    processedIndices.add(i);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Executing task ${task.id} (duration ${task.duration}, deadline ${task.deadline}). Time: ${prevTime} -> ${currentTime}.`,
        why: `Task reward = deadline (${task.deadline}) - completion_time (${currentTime}) = ${taskReward}. Total reward: ${totalReward}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          activeTask: `${task.id} (dur: ${task.duration}, dl: ${task.deadline})`,
          completionTime: currentTime,
          taskScore: taskReward,
          runningTotalReward: totalReward,
        },
      },
      variables: {
        duration: task.duration,
        deadline: task.deadline,
        currentTime,
        taskReward,
        totalReward,
      },
    });
  }

  // Step 3: Finish
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `All tasks processed. Maximum achievable total reward is ${totalReward}.`,
      why: "Greedy execution order minimizes overall task delay penalties.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedTasks, null, processedIndices),
    },
    auxiliaryState: {
      visited: sortedTasks.map((t) => t.id),
      customState: {
        finalReward: totalReward,
        completedTasks: sortedTasks.length,
      },
    },
    variables: {
      finalReward: totalReward,
    },
  });

  return steps;
};

export const TASKS_AND_DEADLINES_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Tasks and Deadlines asks us to order n tasks (each taking duration d_i and having deadline D_i) on a single processor to maximize total reward sum(D_i - X_i), where X_i is the completion time of task i. Remarkably, sorting tasks purely by duration in ascending order (Shortest Processing Time first) yields the maximum total reward, completely independent of the deadlines.",
  sections: [
    {
      heading: "Mathematical Formulation & Algebraic Equivalence",
      body: "Notice that total reward = sum(D_i - X_i) = sum(D_i) - sum(X_i). Since sum(D_i) is a constant sum over all given deadlines, maximizing total reward is mathematically identical to minimizing total completion time sum(X_i). Min-sum completion time is achieved by processing shorter tasks first.",
    },
    {
      heading: "Why Deadlines Do Not Affect Optimal Order",
      body: "Counter-intuitively, individual deadlines D_i do not alter the relative order of tasks! Processing a task with duration d_i delays every subsequent task in queue by exactly d_i. Thus, placing smaller d_i values earlier minimizes cumulative delays experienced by all downstream tasks.",
    },
    {
      heading: "Systems Applications & OS Job Scheduling",
      body: "In operating system CPU scheduling (Shortest Job First / SJF) and packet scheduling in network router queues, executing short duration payloads minimizes average response latency and queue waiting times across all concurrent processes.",
    },
    {
      heading: "Exchange Argument & Large Integer Overflow",
      body: "Swapping any adjacent tasks where d_i > d_{i+1} decreases total completion time sum(X_i), proving SPT optimality. In production implementations (e.g. CSES 1630), accumulators X_i and total_reward can exceed 32-bit signed integers, requiring 64-bit integer (long long in C++, int in Python) variables.",
    },
  ],
  keyTerms: [
    {
      term: "Shortest Processing Time (SPT)",
      definition:
        "A greedy scheduling rule that orders tasks by duration in ascending order to minimize cumulative completion times.",
    },
    {
      term: "Completion Time (X_i)",
      definition:
        "The exact moment in time when task i finishes execution after all preceding tasks have completed.",
    },
    {
      term: "SJF Scheduling",
      definition:
        "Shortest Job First operating system dispatch algorithm that optimizes average process latency.",
    },
    {
      term: "Reward Function",
      definition:
        "The objective sum(D_i - X_i) measuring cumulative deadline buffer margin across scheduled tasks.",
    },
  ],
};

export const TASKS_AND_DEADLINES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines tasks_and_deadlines: calculates max reward given (duration, deadline) tuples.",
    2: "Sorts tasks by duration in ascending order (Shortest Processing Time first).",
    3: "Initializes current_time accumulator to 0.",
    4: "Initializes total_reward accumulator to 0.",
    6: "Iterates through each task (duration, deadline) in sorted duration order.",
    7: "Increments current_time by task duration.",
    8: "Adds (deadline - current_time) reward for this task to total_reward.",
    10: "Returns final total_reward.",
  },
};

export const tasksAndDeadlines: AlgorithmDefinition<TasksAndDeadlinesInput> = {
  id: "tasks-and-deadlines",
  title: "Tasks and Deadlines",
  category: "greedy_algorithms",
  categories: ["greedy_algorithms"],
  difficulty: "Medium",
  description:
    "Given n tasks with durations and deadlines, find an execution order on a single processor that maximizes total reward sum(deadline_i - completion_time_i).\n\nIf task i completes at time X_i, its reward contribution is D_i - X_i. Greedily processing tasks in ascending order of duration (Shortest Processing Time first) minimizes total completion time sum(X_i) and maximizes overall reward.",
  constraints: ["1 <= tasks.length <= 10^5", "1 <= duration, deadline <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Four Standard Tasks",
      inputDisplay: "tasks = [(4,2), (3,5), (2,7), (4,5)]",
      outputDisplay: "Max Total Reward: -2",
      input: {
        tasks: [
          { id: "T1", duration: 4, deadline: 2 },
          { id: "T2", duration: 3, deadline: 5 },
          { id: "T3", duration: 2, deadline: 7 },
          { id: "T4", duration: 4, deadline: 5 },
        ],
      },
      output: "Max Total Reward: -2",
      explanation:
        "Sorting by duration gives order (2,7), (3,5), (4,2), (4,5) yielding completion times 2, 5, 9, 13 and total reward (7-2)+(5-5)+(2-9)+(5-13) = -2.",
    },
    {
      kind: "complex",
      title: "Varying Deadlines",
      inputDisplay: "tasks = [(5,10), (1,2), (2,4)]",
      outputDisplay: "Max Total Reward: 5",
      input: {
        tasks: [
          { id: "A", duration: 5, deadline: 10 },
          { id: "B", duration: 1, deadline: 2 },
          { id: "C", duration: 2, deadline: 4 },
        ],
      },
      output: "Max Total Reward: 5",
      explanation:
        "Order by duration: (1,2) at t=1 (score 1), (2,4) at t=3 (score 1), (5,10) at t=8 (score 2). Total = 4.",
    },
    {
      kind: "negative",
      title: "Impossible Deadlines (Negative Scores)",
      inputDisplay: "tasks = [(10,1), (10,1)]",
      outputDisplay: "Max Total Reward: -28",
      input: {
        tasks: [
          { id: "X", duration: 10, deadline: 1 },
          { id: "Y", duration: 10, deadline: 1 },
        ],
      },
      output: "Max Total Reward: -28",
      explanation: "All tasks complete past their deadlines, resulting in negative rewards.",
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
  topicGuide: TASKS_AND_DEADLINES_TOPIC_GUIDE,
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
