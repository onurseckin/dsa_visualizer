import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_game_theory_c1_p1",
  pageNumber: 1,
  title: "Combinatorial Games, Sprague-Grundy Theorem & Minimax Duality",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Combinatorial Game State Explosion & Discrete Duality",
      content:
        "Sequential, perfect-information, two-player zero-sum games—ranging from classical Nim and impartial subtraction games to chess and Go—generate state-space trees with branching factors $b \\in [10, 300]$ and depths $d \\ge 40$. The game-tree complexity reaches $b^d \\approx 10^{120}$ states (the Shannon number for chess), far exceeding all computational resources in the observable universe. Combinatorial game theory resolves this combinatorial explosion by formulating game states as positions in an impartial algebraic field (Nim-values / Grundy functions) and applying Alpha-Beta pruning to eliminate provably suboptimal branches.",
    },
    {
      type: "prose",
      title: "Taxonomy of Combinatorial Games & Decision Paradigms",
      content:
        "Game theory algorithms are classified by game symmetries, information structures, and evaluation models:\n\n1. **Impartial Games under Normal Play Convention (Sprague-Grundy Theorem):**\n   - **Impartial Game:** The allowable moves from any state $s$ depend only on $s$, not on whose turn it is (e.g., Nim, subtraction games, graph token moves).\n   - **Normal Play Convention:** The player making the last valid move wins (the player with no moves loses).\n   - **The Sprague-Grundy Theorem:** Every impartial game under normal play is mathematically isomorphic to a single pile of Nim with size equal to its **Grundy value** $G(s) = \\text{mex}(\\{G(s') \\mid s \\to s'\\})$. Independent composite games combine via bitwise XOR (Nim-sum): $G(s_1, \\dots, s_k) = \\bigoplus_{i=1}^k G(s_i)$.\n\n2. **Partisan Zero-Sum Games (Minimax & Alpha-Beta Pruning):**\n   - **Partisan Game:** Available moves differ between players (e.g. Chess, Checkers, Tic-Tac-Toe).\n   - **Minimax Theorem (von Neumann 1928):** In finite zero-sum two-player games with perfect information, there exists a unique game value $V^*$ achievable when both players play optimally.\n   - **Alpha-Beta Pruning:** Maintains a search window $[\\alpha, \\beta]$. If a child's evaluated score $v \\ge \\beta$ (at Max node) or $v \\le \\alpha$ (at Min node), remaining sibling branches are pruned without loss of optimality, reducing effective branching factor from $b$ to $\\sqrt{b}$.\n\n3. **Transposition Tables & Zobrist Hashing:**\n   - Games with directed cycle graphs or converging transposition paths (reaching the identical board state via different move orders) maintain a fixed-size direct-mapped hash table using 64-bit **Zobrist Keys** updated in $O(1)$ time via bitwise XOR.",
    },
    {
      type: "mental_model",
      title: "The MEX Principle & Alpha-Beta Cutoff Window Dynamics",
      visualIntuition: `
=== SPRAGUE-GRUNDY MEX (MINIMUM EXCLUDED NON-NEGATIVE INTEGER) ===
State S transitions to:
  S -> State A (G(A) = 0)
  S -> State B (G(B) = 1)
  S -> State C (G(C) = 3)

Reachable Grundy set = {0, 1, 3}
G(S) = mex({0, 1, 3}) = 2  (Smallest missing non-negative integer is 2!)

=== BOUTON'S NIM-SUM EQUILIBRIUM ===
Piles: [3, 4, 5]
  3 = 0 1 1_2
  4 = 1 0 0_2
  5 = 1 0 1_2
  ───────────
XOR = 0 1 0_2 = 2 != 0  ==> N-Position (First Player Wins!)

=== ALPHA-BETA PRUNING WINDOW [alpha, beta] ===
       Max Node (alpha = 5, beta = 8)
         /               \\
     (Child 1: val=6)    (Child 2: Min Node, alpha=6, beta=8)
      alpha -> 6           /                   \\
                       (Grandchild 1: val=4) (Grandchild 2: PRUNED!)
                        val <= alpha (4 <= 6) -> BETA CUTOFF!
      `,
      invariant:
        "Game Equilibrium & Cutoff Invariants:\n1. Bouton Invariant: A state is a $P$-position (Previous/Second player win) if and only if its Grundy value / Nim-sum equals 0 ($G(s) = 0$).\n2. Alpha-Beta Invariant: If the return value of a sub-branch violates the $[\\alpha, \\beta]$ window, the optimal path cannot pass through the remaining siblings.",
      stateTransitions:
        "Grundy Transition: $G(s) = \\text{mex}(\\{ G(s') \\mid s \\to s' \\})$.\nAlpha-Beta Max Node: $\\alpha \\leftarrow \\max(\\alpha, v)$; If $\\alpha \\ge \\beta$, break (Beta Cutoff).\nAlpha-Beta Min Node: $\\beta \\leftarrow \\min(\\beta, v)$; If $\\beta \\le \\alpha$, break (Alpha Cutoff).",
      naiveBottleneck:
        "Full minimax depth search traverses all $b^d$ leaves. For $b=30, d=10$, $30^{10} \\approx 5.9 \\times 10^{14}$ states, taking days of computation.",
      optimalInsight:
        "Sprague-Grundy reduces independent game branches to single-cycle bitwise XOR arithmetic ($O(1)$ evaluation), while Alpha-Beta pruning halves the effective search depth ($b^{d/2}$ leaves).",
    },
  ],
};
