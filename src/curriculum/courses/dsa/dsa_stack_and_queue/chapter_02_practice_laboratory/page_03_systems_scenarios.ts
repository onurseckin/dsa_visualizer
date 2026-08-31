import type { CoursePage } from "../../../../courseTypes";

export const page_03_systems_scenarios: CoursePage = {
  id: "dsa_stack_and_queue_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_stack_and_queue",
      title: "Stack & Queue Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Largest Rectangle in Histogram",
          problemId: "largest-rectangle-in-histogram",
          difficulty: "Hard",
          description:
            "Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram in strictly $O(N)$ time and $O(N)$ auxiliary space using a Monotonic Stack.",
          rationale:
            "Evaluates masterclass implementation of monotonic boundary extent resolution.",
        },
        {
          title: "Daily Temperatures (Next Warmer Day)",
          problemId: "daily-temperatures-monotonic",
          difficulty: "Medium",
          description:
            "Given an array of integers temperatures, return an array answer such that answer[i] is the number of days you have to wait after the $i$-th day to get a warmer temperature. Solve in $O(N)$ time using a monotonic decreasing stack.",
          rationale: "Tests nearest-extrema resolution upon monotonic stack invariant violations.",
        },
        {
          title: "Evaluate Reverse Polish Notation",
          problemId: "evaluate-reverse-polish-notation",
          difficulty: "Medium",
          description:
            "Evaluate the value of an arithmetic expression in Reverse Polish Notation (RPN) containing $+$, $-$, $*$, $/$ operators and integers in $O(N)$ time and $O(N)$ space using an evaluation operand stack.",
          rationale: "Tests postfix arithmetic evaluation and integer truncation towards zero.",
        },
        {
          title: "Design Circular Queue",
          problemId: "design-circular-queue-ring",
          difficulty: "Medium",
          description:
            "Design your implementation of the circular queue supporting `enQueue`, `deQueue`, `Front`, `Rear`, `isEmpty`, and `isFull` using a fixed-size flat array in strictly $O(1)$ time per operation.",
          rationale:
            "Tests power-of-two bitwise ring-buffer index management and empty/full state differentiation.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Dijkstra's Shunting-Yard Infix-to-Postfix Invariant",
          statement:
            "Prove that Dijkstra's Shunting-Yard algorithm correctly translates any valid parenthesized infix expression containing binary operators with defined precedence into an equivalent postfix (RPN) expression in strictly $O(N)$ operations.",
          proofOutline:
            "The operator stack maintains the invariant that operators on the stack have strictly increasing precedence from bottom to top. Encountering an operator with lower or equal precedence immediately pops higher-precedence operators to output, ensuring that sub-expressions are evaluated in strict order of algebraic precedence. Parentheses act as isolated precedence barriers. Because each token is pushed and popped at most once, total runtime is $\\Theta(N)$.",
          engineeringContext:
            "Forms the core parsing pipeline for database SQL expression compilers and math formula interpreters.",
        },
        {
          title: "Catalan Number Stack-Sortable Permutations",
          statement:
            "Prove that the number of permutations of $(1, 2, \\dots, n)$ that can be produced using a single LIFO stack (Knuth's stack-sortable permutations) is given by the $n$-th Catalan number $C_n = \\frac{1}{n+1} \\binom{2n}{n}$.",
          proofOutline:
            "Any valid stack sorting sequence consists of $n$ push operations and $n$ pop operations such that at every prefix, the number of pushes is greater than or equal to the number of pops. This is isomorphic to Dyck paths of length $2n$ from $(0, 0)$ to $(2n, 0)$ that never drop below the $x$-axis. By André's Reflection Principle, the number of such paths is precisely $\\binom{2n}{n} - \\binom{2n}{n-1} = \\frac{1}{n+1} \\binom{2n}{n}$.",
          engineeringContext:
            "Foundational in formal language theory and binary tree topology enumerations.",
        },
        {
          title: "MinStack Difference Encoding Invariant",
          statement:
            "Prove that storing difference values $\\delta = x - \\text{min}$ in a single integer stack allows $O(1)$ push, pop, and getMin without storing duplicate minimum values.",
          proofOutline:
            "When pushing $x$: if $x < \\text{min}$, push $\\delta = x - \\text{min} < 0$ and update $\\text{min} \\leftarrow x$. When popping: if top $\\delta < 0$, the recorded minimum is $\\text{min}$, and the previous minimum is recovered via $\\text{min}_{\\text{prev}} = \\text{min} - \\delta$. If $\\delta \\ge 0$, the element is $x = \\text{min} + \\delta$ and $\\text{min}$ is unchanged.",
          engineeringContext:
            "Halves memory usage in embedded devices with severe RAM constraints.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Contiguous L1 Cache Line Packing vs Node-Based Heap Stacks",
          prompt:
            "Why does an array-backed stack execute over $1000\\%$ faster than a linked-list stack (`struct Node { int val; Node* next; }`) in high-frequency push/pop benchmark loops?",
          engineeringContext:
            "Linked lists allocate scattered heap nodes, incurring pointer indirection, cache thrashing, and memory allocator locks. Array stacks reside contiguously in L1 cache lines, updating pointers in CPU registers (`top++`).",
        },
        {
          title: "Explicit `Int32Array` Heap Stack vs OS Hardware Call-Stack Limits",
          prompt:
            "How does rewriting a deep recursive tree traversal (depth $10^5$) into an iterative loop with an explicit `Int32Array` stack prevent catastrophic process termination?",
          engineeringContext:
            "OS threads allocate fixed call-stack memory (1-8 MB), exhausting memory after $10^4$ nested frames. Explicit array stacks allocate memory from the multi-gigabyte virtual heap, supporting millions of frames.",
        },
        {
          title: "Power-of-Two Bitwise Masking in Ring Buffers vs Modulo Division",
          prompt:
            "Analyze why restricting circular queue capacities to powers of two ($2^k$) doubles FIFO throughput in kernel socket buffers.",
          engineeringContext:
            "`(tail + 1) % capacity` triggers the x86 `idiv` instruction (20-40 cycle latency). `(tail + 1) & mask` compiles to a 1-cycle `and` instruction with 0 pipeline bubbles.",
        },
      ],
      partD_stressTests: [
        {
          title: "Histogram Sentinel Omission Memory Leak",
          scenario:
            "Running Largest Rectangle in Histogram on a strictly increasing array ($1, 2, 3, \\dots, 10^5$) without appending a zero sentinel.",
          failureMode:
            "No element is ever popped during the loop, leaving all $10^5$ bars un-evaluated and returning an area of 0.",
        },
        {
          title: "Circular Queue Full/Empty Pointer Collision Ambiguity",
          scenario:
            "A circular queue checks `head === tail` to indicate empty without maintaining a separate size counter or empty slot.",
          failureMode:
            "When the queue becomes completely full, `head === tail` evaluates to true, falsely reporting a full queue as completely empty and corrupting incoming packets.",
        },
        {
          title: "Fatal Call Stack Exhaustion on Deep Graph DFS",
          scenario:
            "Executing recursive DFS on a linear chain graph of $10^5$ nodes in a default Node.js / V8 environment.",
          failureMode:
            "V8 exceeds its 10,000-frame recursion stack limit, throwing an uncatchable `RangeError: Maximum call stack size exceeded` crash.",
        },
      ],
    },
  ],
};

export const page3 = page_03_systems_scenarios;
