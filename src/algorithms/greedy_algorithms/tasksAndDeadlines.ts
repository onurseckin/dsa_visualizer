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

  const rawTasks = Array.isArray(input?.tasks)
    ? [...input.tasks]
    : [...DEFAULT_TASKS_AND_DEADLINES_INPUT.tasks];

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
        label: task.id,
        state,
        pointers: [`d:${task.duration}`, `D:${task.deadline}`],
      };
    });
  };

  // Line 1: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize tasks scheduling with ${rawTasks.length} task(s).`,
      why: "Objective: maximize cumulative reward ∑ (deadline - completion_time).",
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
  const sortedTasks = [...rawTasks].sort(
    (a, b) => a.duration - b.duration || a.deadline - b.deadline,
  );

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Sort tasks by duration in ascending order (Shortest Processing Time).",
      why: "Executing shorter tasks first minimizes cumulative delay across all remaining tasks in the queue.",
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
      what: "Initialize execution clock t = 0.",
      why: "The processor clock begins at t = 0 before executing the first task.",
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
      what: "Initialize total reward accumulator = 0.",
      why: "Preparing accumulator to tally deadline buffer rewards for each task.",
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
        what: `Inspect task ${task.id} (duration ${task.duration}, deadline ${task.deadline}).`,
        why: "Processing next task in Shortest Processing Time order.",
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

    currentTime += task.duration;

    // Line 7: Update current_time state
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Advance execution clock by +${task.duration} to t = ${currentTime}.`,
        why: `Task ${task.id} requires ${task.duration} units of processor time and completes at t = ${currentTime}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          activeTask: task.id,
          taskDuration: task.duration,
          completionTime: currentTime,
          totalReward,
        },
      },
      variables: {
        taskDuration: task.duration,
        currentTime,
        totalReward,
      },
    });

    const taskReward = task.deadline - currentTime;
    totalReward += taskReward;
    processedIndices.add(i);

    // Line 8: Update total_reward
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Accumulate task reward: deadline ${task.deadline} - completion ${currentTime} = ${taskReward}.`,
        why:
          taskReward >= 0
            ? `Task ${task.id} completed ${taskReward} unit(s) before deadline, adding +${taskReward} to total reward (${totalReward}).`
            : `Task ${task.id} completed ${Math.abs(taskReward)} unit(s) past deadline, penalizing total reward by ${taskReward} (${totalReward}).`,
      },
      primarySnapshot: {
        kind: "array",
        elements: createArrayElements(sortedTasks, i, processedIndices),
      },
      auxiliaryState: {
        visited: Array.from(processedIndices).map((idx) => sortedTasks[idx].id),
        customState: {
          activeTask: task.id,
          taskReward,
          taskDeadline: task.deadline,
          completionTime: currentTime,
          totalReward,
        },
      },
      variables: {
        taskReward,
        taskDeadline: task.deadline,
        currentTime,
        totalReward,
      },
    });
  }

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
      definition:
        "The cumulative metric $\\sum_{i=1}^n (D_i - X_i)$ measuring deadline buffer margins.",
    },
    {
      term: "Exchange Argument",
      definition:
        "Proof technique showing adjacent inversion of un-ordered items strictly improves objective value.",
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
  topicIds: ["heap_and_priority_queue", "greedy_algorithms"],
  difficulty: "Medium",
  description:
    "<p>Given <code>n</code> tasks with durations <code>d_i</code> and deadlines <code>D_i</code>, find an execution order on a single processor that maximizes total reward <span>&sum; (D_i - X_i)</span>.</p>" +
    "<h3>Problem Overview</h3>" +
    "<p>Each task <code>i</code> completes at time <code>X_i</code> and earns reward <code>D_i - X_i</code>. Greedily executing tasks in ascending order of duration (Shortest Processing Time) minimizes total completion time <span>&sum; X_i</span> and maximizes total reward.</p>" +
    "<h3>Key Insights &amp; Math</h3>" +
    "<ul><li><strong>Algebraic Identity:</strong> <code>&sum; (D_i - X_i) = &sum; D_i - &sum; X_i</code>. Since <code>&sum; D_i</code> is constant, maximizing reward equals minimizing <code>&sum; X_i</code>.</li>" +
    "<li><strong>Weighted Sum:</strong> <code>&sum; X_i = &sum; (n - i + 1) d_i</code>. Assigning smaller <code>d_i</code> to larger weights <code>(n - i + 1)</code> minimizes the sum.</li></ul>" +
    "<h3>Complexity</h3>" +
    "<ul><li><strong>Time:</strong> <span>O(N log N)</span> to sort tasks by duration.</li>" +
    "<li><strong>Space:</strong> <span>O(N)</span> for task structure storage.</li></ul>",
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
  topicGuide: {
    overview:
      "<p>Tasks and Deadlines schedules <code>n</code> tasks with durations <code>d_i</code> and deadlines <code>D_i</code> on a single processor to maximize total reward <span>&sum; (D_i - X_i)</span>, where <code>X_i</code> is completion time. Counter-intuitively, sorting tasks purely by duration in ascending order (Shortest Processing Time / SPT) yields the maximum total reward regardless of individual deadline values.</p>",
    sections: [
      {
        heading: "Mathematical Equivalence & Algebraic Reduction",
        body: "<p>Total reward equals <code>&sum; (D_i - X_i) = &sum; D_i - &sum; X_i</code>. Because the sum of deadlines <code>&sum; D_i</code> is a fixed constant for a given task set, maximizing total reward is mathematically identical to minimizing total completion time <code>&sum; X_i</code>. Processing shorter tasks first minimizes the total waiting time accumulated across all tasks. Thus, deadline values do not affect the optimal execution sequence.</p>",
      },
      {
        heading: "Why Deadlines Do Not Change Task Order",
        body: "<p>Processing a task with duration <code>d_i</code> delays every subsequent task in the queue by exactly <code>d_i</code>. The <code>k</code>-th task in sequence contributes <code>d_1 + d_2 + &hellip; + d_k</code> to completion time sum. Expanding the sum yields <code>&sum; X_i = &sum; (n - i + 1) d_i</code>. Minimizing this weighted sum requires placing smaller <code>d_i</code> values with larger multiplier coefficients <code>(n - i + 1)</code> at the front of the schedule.</p>",
      },
      {
        heading: "Exchange Argument Proof of Optimality",
        body: "<p>Suppose an optimal schedule contains two adjacent tasks <code>A</code> and <code>B</code> where duration <code>d_A &gt; d_B</code>. Swapping their order changes completion times only for <code>A</code> and <code>B</code>, reducing total completion time <code>&sum; X_i</code> by <code>d_A - d_B &gt; 0</code>. Because swapping strictly increases total reward, no optimal schedule can contain an out-of-order pair. Therefore, the schedule sorted by duration ascending is provably optimal.</p>",
      },
      {
        heading: "Systems Applications & CPU Dispatching",
        body: "<p>Operating system schedulers employ Shortest Job First (SJF) and Shortest Remaining Time First (SRTF) policies to minimize average process turnaround time. Database query engines and packet processing queues apply SPT ordering to reduce queueing latency and memory pressure. Recognizing when deadline values are decoupled from ordering simplifies complex scheduling problems into fast <span>O(N log N)</span> greedy solutions.</p>",
      },
    ],
    keyTerms: [
      {
        term: "Shortest Processing Time (SPT)",
        definition: "Greedy ordering by task duration ascending to minimize total completion time.",
      },
      {
        term: "Completion Time (X_i)",
        definition: "The exact timestamp when task i completes after all prior tasks in sequence.",
      },
      {
        term: "Reward Function",
        definition: "The cumulative metric ∑ (D_i - X_i) measuring deadline buffer margins.",
      },
      {
        term: "Exchange Argument",
        definition:
          "Proof technique showing adjacent inversion of un-ordered items strictly improves objective value.",
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
