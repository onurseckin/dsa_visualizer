import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_backtracking_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Register Caching, GC Allocation Elimination & DLX Torus Mechanics",
      content:
        "High-performance constraint solvers (SAT solvers, Sudoku engines, combinatorial optimization kernels) structure backtracking around CPU register mechanics:\n\n1. **GC Memory Wall in Backtracking:** Recursive search trees that allocate arrays per frame (`[...path, val]`) allocate millions of temporary objects per second on the heap. This causes CPU cache thrashing and forces V8/JVM garbage collectors into multi-second stop-the-world pauses. Mutating a single pre-allocated `Int32Array` or integer bitmask keeps all state in CPU L1 cache, boosting throughput by **$30\\times-50\\times$**.\n2. **Bitmask Register Allocation:** In Bitmask N-Queens, the entire board configuration fits into 3 32-bit registers (`cols`, `diag1`, `diag2`). Passing these as primitive integer arguments keeps them entirely within CPU general-purpose registers (`%edi`, `%esi`, `%edx`), executing branch evaluations in 1 cycle.\n3. **Dancing Links Memory Density:** Knuth's DLX represents sparse boolean matrices using static flat node arrays (`left`, `right`, `up`, `down`), eliminating pointer allocations during search and executing millions of reversible matrix splices per second.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, State Restoration Leaks & Duplicate Branching",
      content:
        "1. **Incomplete Backtracking Undo on Early Returns:** Returning early from a recursive branch (`if (found) return true;`) without un-setting modified board cells leaves corrupted state on the shared buffer, invalidating all subsequent sibling branches.\n2. **The Reference Sharing Trap in Result Lists:** Appending the mutable working path directly to the results list (`results.push(currentPath)`) pushes an object reference rather than a snapshot. When the algorithm finishes backtracking, all entries in `results` reference the final empty array. Always push a shallow copy: `results.push([...currentPath])`.\n3. **Duplicate Combinations in Multiset Branching:** When generating permutations or subsets from arrays containing duplicate numbers (e.g. `[1, 2, 2]`), failing to sort and skip duplicates (`if (i > start && nums[i] === nums[i-1]) continue;`) causes exponential duplicate subtree evaluations.\n4. **Sudoku 3x3 Box Bit Index Calculation Error:** Computing the subgrid index via `(row / 3) * 3 + (col / 3)` requires integer truncation (`Math.floor(row / 3) * 3 + Math.floor(col / 3)`); omitting floor operations causes fractional index lookups.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Constraint Satisfaction Heuristics: MRV & Forward Checking",
      content:
        "Advanced CSP engines apply formal variable and value ordering heuristics to minimize search tree depth:\n- **Minimum Remaining Values (MRV / Most Constrained Variable):** Choose the variable with the fewest legal remaining values (e.g. the Sudoku cell with the fewest candidate digits). This minimizes the branching factor at the top of the search tree, triggering rapid contradictions (**Fail-First Principle**).\n- **Forward Checking & Arc Consistency (AC-3):** When assigning value $v$ to variable $x$, prune incompatible values from the domains of all neighboring unassigned variables. If any neighbor's domain becomes empty, backtrack immediately before recursing.",
    },
    {
      type: "prose",
      title: "Backtracking Search Paradigm Selection Matrix",
      content: `
| Problem Paradigm | State Representation | Pruning Strategy | Memory Footprint | Key Optimization |
| :--- | :--- | :--- | :--- | :--- |
| **Subsets / Combinations** | Shared array index | Bounded loop start index | $O(N)$ stack | In-place path mutation |
| **Permutations (Multiset)** | Visited boolean array | Skip duplicate elements | $O(N)$ buffer | Sort input array + sibling skip |
| **N-Queens Solver** | 3 Bitmask Integers | Bitwise collision mask | $O(N)$ CPU registers | Lowest set bit \`x & (-x)\` |
| **Sudoku Solver** | 9-bit bitmask per row/col/box | MRV cell selection | $O(1)$ flat array | Bitmask constraint validation |
| **Exact Cover (DLX)** | 2D Quad-Linked Torus | Column cover/uncover | $O(\\text{ones})$ torus nodes | Knuth's Dancing Links Algorithm X |
| **Word Search II** | Prefix Trie + 2D Grid | In-place char mutation | $O(\\text{Trie} + L)$ | Trie pruning on leaf discovery |
      `,
    },
  ],
};
