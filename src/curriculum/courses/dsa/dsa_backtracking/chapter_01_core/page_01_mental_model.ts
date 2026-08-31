import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_backtracking_c1_p1",
  pageNumber: 1,
  title: "State Space Trees, Pruning Invariants & Knuth's Dancing Links",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The Combinatorial Explosion & Constraint Space Pruning",
      content:
        "Constraint Satisfaction Problems (CSPs), combinatorial generation (Permutations, Subsets), and exact cover problems (Sudoku, N-Queens, Polyomino tiling) possess exponentially massive configuration spaces ($N!$ or $K^N$). Exhaustive brute force search is physically intractable for $N > 20$. **Backtracking** systematically traverses the implicit state space tree using Depth-First Search with **Early Pruning**: as soon as a partial configuration violates problem constraints, the entire subtree is pruned, and state is restored in-place via strict **Un-Choose Idempotence**.",
    },
    {
      type: "prose",
      title: "Taxonomy of Backtracking State Space Paradigms",
      content:
        "Backtracking architectures are classified by state representation and constraint propagation:\n\n1. **In-Place State Mutation & Reversible Restoration:**\n   - Rather than copying candidate arrays across recursive call frames ($O(N)$ memory copies per step), algorithms mutate a single global state buffer: `choose(x) -> recurse() -> unchoose(x)`.\n   - Invariant: When returning from a recursive branch, the system state must be bit-for-bit identical to the entry state.\n\n2. **Bitmask State Pruning (N-Queens in CPU Registers):**\n   - In the N-Queens problem on an $N \\times N$ chessboard, placing a queen at $(\\text{row}, \\text{col})$ threatens:\n     - Column $\\text{col}$ (`cols` bitmask).\n     - Main diagonal: $\\text{row} - \\text{col} = \\text{const}$ (shifted left `(diag1 | bit) << 1` on next row).\n     - Anti-diagonal: $\\text{row} + \\text{col} = \\text{const}$ (shifted right `(diag2 | bit) >> 1` on next row).\n   - Available positions on the current row evaluate via a single bitwise instruction: `available = ~(cols | diag1 | diag2) & mask`.\n   - Extracting candidates via lowest-set-bit `bit = available & (-available)` eliminates 100% of invalid branch iterations.\n\n3. **Exact Cover & Knuth's Algorithm X with Dancing Links (DLX):**\n   - **Exact Cover Problem:** Given a 0-1 matrix, find a subset of rows that contains exactly one `1` in each column (NP-complete, encompasses Sudoku, Pentominoes, Matrix Tiling).\n   - **Knuth's Dancing Links (Donald Knuth 2000):** Represents the sparse 0-1 matrix as a **Quad-Linked Circular 2D Torus** where every node has pointers `left`, `right`, `up`, `down`.\n   - **Covering a Column $c$:** Removes column $c$ and all rows containing a `1` in column $c$ via pointer updates: `node.left.right = node.right; node.right.left = node.left`.\n   - **Uncovering Column $c$ (Backtracking):** Restores pointers in exact reverse order: `node.left.right = node; node.right.left = node`.\n   - Executes $O(1)$ reversible matrix deletions without allocating or freeing memory.",
    },
    {
      type: "mental_model",
      title: "Bitmask N-Queens & Dancing Links Torus Mechanics",
      visualIntuition: `
=== BITMASK N-QUEENS FAST REGISTER PRUNING ===
Current Row r:
  cols:  0 1 0 0  (Col 1 is occupied)
  diag1: 1 0 0 0  (Diagonal from top-left is occupied)
  diag2: 0 0 0 1  (Anti-diagonal from top-right is occupied)

Occupied mask:  cols | diag1 | diag2 = 1 1 0 1
Available slots: ~(cols | diag1 | diag2) & 0b1111 = 0 0 1 0 (Only Col 2 is legal!)

Bit extraction: bit = available & (-available) -> 0b0010
Next row transition:
  cols'  = cols | bit
  diag1' = (diag1 | bit) << 1
  diag2' = (diag2 | bit) >> 1

=== KNUTH'S DANCING LINKS (COVER / UNCOVER IDEMPOTENCE) ===
Cover Column X:
  [A] <---> [X] <---> [B]       ====>      [A] <───────────────> [B]
             |                                    [X] (Removed)
             v                                     |
  For each row in X, unlink from horizontal neighbors.

Uncover Column X (Backtracking Undo):
  Restoring in reverse order:
    node.down.up = node;
    node.up.down = node;
  Pointer topology is restored with ZERO heap re-allocations!
      `,
      invariant:
        "Backtracking & Cover Invariants:\n1. Reversal Idempotence: For any mutable state $S$ and candidate action $a$, $\\text{unchoose}(a, \\text{choose}(a, S)) \\equiv S$.\n2. Quad-Linked Torus Cover Invariant: Covering column $c$ removes $c$ from the column list and removes all intersecting candidate rows without breaking the internal circular connectivity of isolated nodes.",
      stateTransitions:
        "Bitmask N-Queens: `while (avail > 0) { bit = avail & -avail; avail ^= bit; solve(row + 1, cols | bit, (d1 | bit) << 1, (d2 | bit) >> 1); }`\nDLX: Cover column with minimal 1s (MRV heuristic); choose row; cover intersecting columns; recurse; uncover in reverse.",
      naiveBottleneck:
        "Full array cloning in recursion frames causes severe GC latency. Testing constraints via 2D board scans takes $O(N)$ per candidate.",
      optimalInsight:
        "Bitwise operations evaluate queen collisions in 1 CPU cycle, while Knuth's Dancing Links achieves exact cover solutions with zero memory allocation.",
    },
  ],
};
