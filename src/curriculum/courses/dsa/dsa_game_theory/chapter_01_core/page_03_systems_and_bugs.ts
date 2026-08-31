import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_game_theory_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Zobrist Transposition Cache Alignment & Move-Ordering Branch Predictability",
      content:
        "Modern high-performance game engines (Stockfish, Leela Chess) depend on memory hierarchy and instruction pipelining efficiency:\n\n1. **64-Bit Zobrist Hash Locality:** Board state hashing using standard cryptographic hash functions (SHA-256) is unviable ($>100$ cycles per position). Zobrist hashing pre-generates a table of pseudorandom 64-bit integers for each `(piece, square)` combination. A move updates the hash in 1 CPU cycle via bitwise XOR (`hashKey ^= zobrist[sq][piece]`).\n2. **Transposition Table (TT) Direct-Mapped Caching:** A flat array of $2^{24}$ TT entries ($16$ bytes per entry = $256$ MB) maps hashes via bitwise mask `hashKey & ((1 << 24) - 1)`. Storing exact value, depth, and upper/lower bounds prunes $>70\\%$ of tree expansions.\n3. **Move Ordering as Hardware Branch Prediction:** Alpha-Beta performance is governed by move ordering. By sorting moves using the **Principal Variation (PV) move**, **Killer Move Heuristic**, and **History Counters**, the optimal move is evaluated first $>85\\%$ of the time. This triggers an immediate $\\beta$-cutoff on child index 0, allowing the CPU branch predictor to predict loop termination with near $100\\%$ accuracy.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Cyclic Draw Loops & Misère Inversions",
      content:
        "1. **Infinite Recursion on Cyclic Game Graphs:** Games permitting cyclic moves (e.g. pieces returning to previous squares) cause infinite call-stack recursion. Game engines must maintain a path visited bitmask / 3-fold repetition detector to assign draw evaluations ($0.0$) to cycle states.\n2. **The Misère Play Inversion Trap:** In Misère games (where the player making the last move *loses*), the Sprague-Grundy XOR theorem is mathematically invalid in general. However, for Misère Nim, normal Nim strategy applies until all remaining piles have size $\\le 1$, at which point the optimal player leaves an *odd* number of size-1 piles instead of an even number.\n3. **The Horizon Effect Blunder:** If search depth is strictly capped at depth $D$, a piece sacrifice that is about to be recaptured at depth $D+1$ is falsely evaluated as a winning capture. Production game engines *must* apply **Quiescence Search** at leaf nodes, continuing tactical captures until the position is calm.\n4. **Transposition Table Replacement Collision:** If a shallow search overwrites a deep search entry in the TT due to index aliasing, search accuracy degrades. Always use replacement schemes that prioritize deeper search depths.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Advanced Combinatorial Frontiers: Surreal Numbers & Monte Carlo Tree Search",
      content:
        "Advanced game theory extends beyond classical minimax trees:\n- **Conway's Surreal Numbers (Game Values as Numbers):** John Conway formalized combinatorial games as surreal numbers $\\{ L \\mid R \\}$. Games can represent positive numbers, infinitesimals ($\\uparrow, \\downarrow$), or fuzzy confused values ($* = \\{0 \\mid 0\\}$ where $* + * = 0$).\n- **Monte Carlo Tree Search (MCTS) & UCT:** When branching factors are massive ($b > 200$) and static evaluation functions are inaccurate, MCTS applies the Upper Confidence Bound for Trees (UCT):\n  $$\\text{UCT}(v) = \\frac{Q(v)}{N(v)} + c \\sqrt{\\frac{\\ln N(\\text{parent})}{N(v)}}$$\n  Balancing exploitation of winning lines with exploration of unvisited branches, forming the algorithmic core of AlphaGo and AlphaZero.",
    },
    {
      type: "prose",
      title: "Game Theoretic Algorithm Selection Matrix",
      content: `
| Algorithm / Technique | Game Type | Search Complexity | Space Complexity | Practical Domain |
| :--- | :--- | :--- | :--- | :--- |
| **Bouton Nim-Sum** | Impartial Normal Nim | $\\Theta(K)$ | $\\Theta(1)$ | Multi-pile token/stone subtraction |
| **Sprague-Grundy (MEX)** | Impartial DAG games | $O(V + E)$ | $O(V)$ | Independent composite combinatorial games |
| **Minimax** | Partisan Zero-Sum | $\\Theta(b^d)$ | $\\Theta(d)$ | Small game trees (Tic-Tac-Toe, Connect-4) |
| **Alpha-Beta Pruning** | Partisan Zero-Sum | $O(b^{d/2})$ optimal | $\\Theta(d)$ | Classical board game AI (Chess, Checkers) |
| **Principal Variation Search** | Partisan Zero-Sum | $O(b^{d/2})$ with zero-window | $O(d + \\text{TT})$ | High-performance competitive chess engines |
| **Monte Carlo Tree Search** | Partisan / Imperfect | Asymptotically optimal | $O(\\text{Tree Nodes})$ | Go, Poker, large-scale reinforcement learning |
      `,
    },
  ],
};
