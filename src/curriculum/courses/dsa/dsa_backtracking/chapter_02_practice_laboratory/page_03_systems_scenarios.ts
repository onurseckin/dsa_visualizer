import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_backtracking_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_backtracking",
      title: "Backtracking Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "N-Queens II",
          problemId: "n-queens-ii",
          difficulty: "Hard",
          description:
            "The n-queens puzzle is the problem of placing $n$ queens on an $n \\times n$ chessboard such that no two queens attack each other. Return the total number of distinct solutions in $O(N!)$ time using bitmask registers.",
          rationale:
            "Tests 1-cycle bitwise branch evaluation and diagonal invariant shift mechanics.",
        },
        {
          title: "Sudoku Solver",
          problemId: "sudoku-solver-bitmask",
          difficulty: "Hard",
          description:
            "Write a program to solve a Sudoku puzzle by filling the empty cells. Solve using Bitmask Constraint Propagation and Minimum Remaining Values (MRV) cell selection in $O(9^{81})$ worst-case, typically $< 1$ ms.",
          rationale:
            "Evaluates multi-constraint bitmask validation across rows, columns, and 3x3 subgrids.",
        },
        {
          title: "Word Search II",
          problemId: "word-search-ii-trie",
          difficulty: "Hard",
          description:
            "Given an $m \\times n$ board of characters and a list of strings words, return all words on the board using a Prefix Trie combined with in-place grid backtracking.",
          rationale: "Tests prefix state pruning on state-space search trees.",
        },
        {
          title: "Permutations II (Duplicates)",
          problemId: "permutations-ii-multiset",
          difficulty: "Medium",
          description:
            "Given a collection of numbers, nums, that might contain duplicates, return all possible unique permutations in any order by sorting and skipping identical sibling branches.",
          rationale: "Tests multiset permutation duplicate branch pruning invariants.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Exact Cover Representation Equivalence of Sudoku",
          statement:
            "Prove that standard $9 \\times 9$ Sudoku is isomorphic to an Exact Cover Problem of dimension $729 \\times 324$, and that every valid Sudoku solution corresponds to a set of 81 rows with exactly one 1 in each column.",
          proofOutline:
            "Sudoku has 4 sets of 81 constraints: (1) Cell constraint (each of 81 cells contains 1 digit), (2) Row constraint (each of 9 rows contains digits 1-9 = 81), (3) Column constraint (81), (4) Box constraint (81), totaling $4 \\times 81 = 324$ constraint columns. A candidate placement $(r, c, v)$ has $9 \\times 9 \\times 9 = 729$ possibilities (rows). Each placement satisfies exactly 4 constraint columns. An exact cover of all 324 columns requires choosing $324 / 4 = 81$ candidate rows, mapping bijectively to a valid solved board.",
          engineeringContext:
            "Forms the basis for Knuth's Dancing Links (DLX) ultra-fast Sudoku solvers.",
        },
        {
          title: "Arc Consistency AC-3 Monotonic Domain Contraction Theorem",
          statement:
            "Prove that Mackworth's AC-3 algorithm on a Constraint Satisfaction Problem terminates and preserves all valid solutions while monotonically contracting variable domains.",
          proofOutline:
            "Let $D(x)$ be the domain of variable $x$. In each revision step for constraint $(x_i, x_j)$, values $v \\in D(x_i)$ lacking support in $D(x_j)$ are pruned. Because values are only removed and never added, $D_{t+1}(x_i) \\subseteq D_t(x_i)$ monotonically. Since all domains are finite (size $\\le d$), at most $O(E \\cdot d)$ revisions occur. Furthermore, no value that is part of a globally valid assignment is ever removed, preserving all true solutions.",
          engineeringContext:
            "Core constraint solver algorithm used in industrial planning, SAT engines, and scheduling compilers.",
        },
        {
          title: "Fail-First Principle in Backtracking Search Trees",
          statement:
            "Prove that selecting the variable with Minimum Remaining Values (MRV) minimizes the size of the search tree when exploring insoluble or heavily constrained subproblems.",
          proofOutline:
            "Let the search tree branching factor at depth $i$ be $b_i$. If branching factors are $b_1, b_2, \\dots, b_k$, the number of leaves explored is $\\prod b_i$. If a subproblem contains no solution, an empty branch is reached as soon as any variable has 0 valid assignments. By placing the smallest branching factors $b_i$ earliest, the search tree triggers domain wipeout at shallower depths, pruning exponential subtrees.",
          engineeringContext:
            "Heuristic foundation for modern CDCL (Conflict-Driven Clause Learning) SAT solvers.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Garbage Collection Elimination in Recursive Backtracking",
          prompt:
            "Why does mutating a shared buffer in-place (`path.push(); solve(); path.pop()`) run $30\\times$ faster than functional cloning (`solve([...path, val])`) in V8?",
          engineeringContext:
            "Functional cloning allocates $O(N)$ heap objects on every recursive call frame, generating millions of short-lived objects per second and triggering frequent V8 garbage collection scavenges. In-place mutation keeps the working buffer in CPU L1 cache with 0 heap allocations.",
        },
        {
          title: "Bitmask Register Allocation in CPU Execution Units",
          prompt:
            "How does passing bitmask integers as primitive parameters allow the compiler to evaluate N-Queens entirely inside hardware registers?",
          engineeringContext:
            "Bitmasks fit into 32-bit integer registers (`EDI`, `ESI`, `EDX`). Function calls pass registers directly under the System V ABI without touching the memory bus, allowing single-cycle bitwise ALU instruction execution.",
        },
        {
          title: "In-Place Grid Character Mutation vs Visited Matrix Memory Traffic",
          prompt:
            "In Word Search on a 2D grid, why is marking `board[r][c] = '#'` and restoring it upon return superior to maintaining a separate boolean `visited[M][N]` array?",
          engineeringContext:
            "A separate visited matrix doubles memory cache footprint and requires auxiliary memory lookups. In-place character modification modifies the cache line already loaded for character comparison, incurring 0 additional cache misses.",
        },
      ],
      partD_stressTests: [
        {
          title: "Reference Sharing Trap in Accumulator Lists",
          scenario:
            "Pushing mutable working array `results.push(path)` instead of a clone `results.push([...path])` in subset generation.",
          failureMode:
            "All elements in `results` reference the exact same underlying JavaScript array, resulting in a list filled with empty arrays upon backtracking completion.",
        },
        {
          title: "Incomplete State Restoration on Early Returns",
          scenario:
            "Exiting a backtracking function with `if (found) return true;` without restoring modified board state.",
          failureMode:
            "Leaves mutated values on the shared board buffer, corrupting all future search queries with invalid state.",
        },
        {
          title: "Duplicate Combinations Explosion in Unsorted Arrays",
          scenario:
            "Generating permutations on array `[2, 1, 2]` without sorting and skipping duplicate adjacent elements.",
          failureMode:
            "Generates duplicate identical permutations (e.g. `[1, 2, 2]` multiple times), blowing up result set size exponentially.",
        },
      ],
    },
  ],
};
