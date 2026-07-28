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
    { id: "T5", duration: 1, deadline: 3 },
    { id: "T6", duration: 5, deadline: 10 },
    { id: "T7", duration: 2, deadline: 4 },
  ],
};

export const generateTasksAndDeadlinesSteps = (input: TasksAndDeadlinesInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawTasks = [...(input?.tasks ?? DEFAULT_TASKS_AND_DEADLINES_INPUT.tasks)];

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

  // Line 1: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Function entry: tasks_and_deadlines with ${rawTasks.length} tasks.`,
      why: "Our objective is to maximize total reward sum(deadline - completion_time).",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(rawTasks, null, new Set()),
    },
    auxiliaryState: {
      customState: {
        taskCount: rawTasks.length,
        status: "Unsorted tasks input",
      },
    },
    variables: {
      taskCount: rawTasks.length,
      currentTime: 0,
      totalReward: 0,
    },
  });

  // Line 2: Sort tasks by duration
  const sortedTasks = [...rawTasks].sort((a, b) => a.duration - b.duration || a.deadline - b.deadline);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Executing `tasks.sort(key=lambda x: x[0])` by duration in ascending order.",
      why: "Shortest Processing Time (SPT) rule: scheduling shorter tasks earlier reduces delay for all subsequent tasks.",
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

  // Line 3: Initialize current_time = 0
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initialized `current_time = 0`.",
      why: "The clock starts at t = 0 before processing the first task.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedTasks, null, new Set()),
    },
    auxiliaryState: {
      customState: { currentTime: 0, totalReward: 0 },
    },
    variables: { currentTime: 0, totalReward: 0 },
  });

  // Line 4: Initialize total_reward = 0
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialized `total_reward = 0`.",
      why: "Total reward accumulator is ready to tally individual task scores.",
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedTasks, null, new Set()),
    },
    auxiliaryState: {
      customState: { currentTime: 0, totalReward: 0 },
    },
    variables: { currentTime: 0, totalReward: 0 },
  });

  let currentTime = 0;
  let totalReward = 0;
  const processedIndices = new Set<number>();

  for (let i = 0; i < sortedTasks.length; i++) {
    const task = sortedTasks[i];

    // Line 6: Fetch next task
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Loop step ${i + 1}/${sortedTasks.length}: inspect task ${task.id} (duration ${task.duration}, deadline ${task.deadline}).`,
        why: "Fetch the next task in Shortest Processing Time order.",
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          activeTask: `${task.id} (dur: ${task.duration}, dl: ${task.deadline})`,
          currentTime,
          totalReward,
        },
      },
      variables: {
        i,
        taskDuration: task.duration,
        taskDeadline: task.deadline,
        currentTime,
        totalReward,
      },
    });

    const prevTime = currentTime;

    // Line 7: Compute new completion time
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Calculate completion time: t = ${prevTime} + ${task.duration} = ${prevTime + task.duration}.`,
        why: `Executing ${task.id} requires ${task.duration} units of processor time.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          activeTask: task.id,
          prevTime,
          nextTime: prevTime + task.duration,
        },
      },
      variables: {
        prevTime,
        taskDuration: task.duration,
        nextTime: prevTime + task.duration,
      },
    });

    currentTime += task.duration;

    // Line 7: Update current_time state
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Update \`current_time\` to ${currentTime}.`,
        why: `Task ${task.id} officially finishes at timestamp t = ${currentTime}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          activeTask: task.id,
          completionTime: currentTime,
        },
      },
      variables: {
        currentTime,
      },
    });

    const taskReward = task.deadline - currentTime;

    // Line 8: Calculate task reward margin
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Calculate reward contribution: deadline (${task.deadline}) - completion (${currentTime}) = ${taskReward}.`,
        why: taskReward >= 0
          ? `Task finished ${taskReward} time units before its deadline.`
          : `Task finished ${Math.abs(taskReward)} time units past its deadline, incurring a penalty.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          taskReward,
          taskDeadline: task.deadline,
          completionTime: currentTime,
        },
      },
      variables: {
        taskReward,
        taskDeadline: task.deadline,
        currentTime,
      },
    });

    totalReward += taskReward;
    processedIndices.add(i);

    // Line 8: Update total_reward
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Accumulate reward: total_reward is now ${totalReward}.`,
        why: `Added task ${task.id}'s score (${taskReward}) to running total.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          runningTotalReward: totalReward,
        },
      },
      variables: {
        totalReward,
      },
    });
  }

  // Line 9: Post-loop complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: "Completed processing all tasks in the schedule.",
      why: "Every task has been assigned a completion time and its reward calculated.",
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

  // Line 10: Return total_reward
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Return total_reward = ${totalReward}.`,
      why: `The Shortest Processing Time greedy schedule achieved the maximum total reward score of ${totalReward}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: createArrayElements(sortedTasks, null, processedIndices),
    },
    auxiliaryState: {
      visited: sortedTasks.map((t) => t.id),
      customState: {
        totalReward,
      },
    },
    variables: {
      totalReward,
    },
  });

  return steps;
};

export const TASKS_AND_DEADLINES_TOPIC_GUIDE: TopicGuide = {
  overview:
    "Tasks and Deadlines schedules $n$ tasks with durations $d_i$ and deadlines $D_i$ on a single processor to maximize total reward $\\sum_{i=1}^n (D_i - X_i)$, where $X_i$ is completion time. Counter-intuitively, sorting tasks purely by duration in ascending order (Shortest Processing Time / SPT) yields the maximum total reward regardless of individual deadline values.",
  sections: [
    {
      heading: "Mathematical Equivalence & Algebraic Reduction",
      body: "Total reward equals $\\sum_{i=1}^n (D_i - X_i) = \\sum_{i=1}^n D_i - \\sum_{i=1}^n X_i$. Because the sum of deadlines $\\sum D_i$ is a fixed constant for a given task set, maximizing total reward is mathematically identical to minimizing total completion time $\\sum X_i$. Processing shorter tasks first minimizes the total waiting time accumulated across all tasks. Thus, deadline values do not affect the optimal execution sequence.",
    },
    {
      heading: "Why Deadlines Do Not Change Task Order",
      body: "Processing a task with duration $d_i$ delays every subsequent task in the queue by exactly $d_i$. The $k$-th task in sequence contributes $d_1 + d_2 + \\dots + d_k$ to completion time sum. Expanding the sum yields $\\sum_{i=1}^n X_i = \\sum_{i=1}^n (n - i + 1) d_i$. Minimizing this weighted sum requires placing smaller $d_i$ values with larger multiplier coefficients $(n - i + 1)$ at the front of the schedule.",
    },
    {
      heading: "Exchange Argument Proof of Optimality",
      body: "Suppose an optimal schedule contains two adjacent tasks $A$ and $B$ where duration $d_A > d_B$. Swapping their order changes completion times only for $A$ and $B$, reducing total completion time $\\sum X_i$ by $d_A - d_B > 0$. Because swapping strictly increases total reward, no optimal schedule can contain an out-of-order pair. Therefore, the schedule sorted by duration ascending is provably optimal.",
    },
    {
      heading: "Systems Applications & CPU Dispatching",
      body: "Operating system schedulers employ Shortest Job First (SJF) and Shortest Remaining Time First (SRTF) policies to minimize average process turnaround time. Database query engines and packet processing queues apply SPT ordering to reduce queueing latency and memory pressure. Recognizing when deadline values are decoupled from ordering simplifies complex scheduling problems into fast $O(N \\log N)$ greedy solutions.",
    },
  ],
  keyTerms: [
    {
      term: "Shortest Processing Time (SPT)",
      definition: "Greedy ordering by task duration ascending to minimize total completion time.",
    },
    {
      term: "Completion Time ($X_i$)",
      definition: "The exact timestamp when task $i$ completes after all prior tasks in sequence.",
    },
    {
      term: "Reward Function",
      definition: "The cumulative metric $\\sum_{i=1}^n (D_i - X_i)$ measuring deadline buffer margins.",
    },
    {
      term: "Exchange Argument",
      definition: "Proof technique showing adjacent inversion of un-ordered items strictly improves objective value.",
    },
  ],
};

export const TASKS_AND_DEADLINES_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Defines `tasks_and_deadlines(tasks)` function signature accepting task tuples `(duration, deadline)`.",
    2: "Sorts tasks in-place by duration ascending (`key=lambda x: x[0]`) in $O(N \\log N)$ time.",
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
  category: "heap_and_priority_queue",
  categories: ["heap_and_priority_queue", "greedy_algorithms"],
  difficulty: "Medium",
  description:
    "Given $n$ tasks with durations $d_i$ and deadlines $D_i$, find an execution order on a single processor that maximizes total reward $\\sum_{i=1}^n (D_i - X_i)$.\n\n" +
    "### Problem Overview\n" +
    "Each task $i$ completes at time $X_i$ and earns reward $D_i - X_i$. Greedily executing tasks in ascending order of duration (Shortest Processing Time) minimizes total completion time $\\sum X_i$ and maximizes total reward.\n\n" +
    "### Key Insights & Math\n" +
    "- **Algebraic Identity**: $\\sum (D_i - X_i) = \\sum D_i - \\sum X_i$. Since $\\sum D_i$ is constant, maximizing reward equals minimizing $\\sum X_i$.\n" +
    "- **Weighted Sum**: $\\sum X_i = \\sum_{i=1}^n (n - i + 1) d_i$. Assigning smaller $d_i$ to larger weights $(n - i + 1)$ minimizes the sum.\n\n" +
    "### Complexity\n" +
    "- **Time**: $O(N \\log N)$ to sort tasks by duration.\n" +
    "- **Space**: $O(N)$ for task structure storage.",
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
