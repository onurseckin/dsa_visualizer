import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_game_theory_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_game_theory",
      title: "Combinatorial Game Theory Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Cat and Mouse (Game on Graph with Cycles & Draws)",
          problemId: "cat-and-mouse-game-graph",
          difficulty: "Hard",
          description:
            "Given a graph where Mouse starts at node 1, Cat starts at node 2, and Hole is at node 0. Determine whether Mouse wins (1), Cat wins (2), or the game is a Draw (0) under optimal play using backward topological BFS from terminal states in $O(V \\cdot E)$ time.",
          rationale:
            "Tests game solving on directed cyclic graphs with 3-valued logic (Win/Loss/Draw) eliminating recursion loops.",
        },
        {
          title: "Stone Game VII (Minimax Range DP)",
          problemId: "stone-game-vii-interval-dp",
          difficulty: "Medium",
          description:
            "Two players take turns removing stones from either end of a row of stones, scoring the sum of remaining stones. Compute the maximum score difference Alice can achieve over Bob using 2D interval game DP in $O(N^2)$ time.",
          rationale:
            "Evaluates zero-sum score difference optimization over contiguous interval states.",
        },
        {
          title: "Multi-Pile Nim with Winning Move Reconstruction",
          problemId: "nim-game-winning-move",
          difficulty: "Medium",
          description:
            "Given $K$ piles of stones, determine if the first player can force a win. If yes, output the index of the pile to modify and the exact new stone count in $O(K)$ time using Bouton's Nim-sum theorem.",
          rationale: "Tests algebraic bitwise XOR invariants and exact winning move calculation.",
        },
        {
          title: "Alpha-Beta Engine with Transposition Tables & Quiescence Search",
          problemId: "alpha-beta-transposition-engine",
          difficulty: "Hard",
          description:
            "Implement a high-performance Negamax game engine with 64-bit Zobrist hashing, dynamic move ordering (PV-move), and Quiescence search to solve Connect-4 / Tic-Tac-Toe state spaces without exploring redundant transpositions.",
          rationale: "Demonstrates masterclass implementation of game tree search optimization.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Conway's Colon Principle for Tree-Shaped Impartial Games",
          statement:
            "Prove Conway's Colon Principle: When an arbitrary impartial game $H$ is attached to a vertex $v$ of a tree $T$ via an edge $e$, the game value is equivalent to replacing $H$ with a single branch of length $G(H) + 1$ attached to $v$.",
          proofOutline:
            "Induction on game depth. Pruning moves within $H$ allows transitioning to any smaller Grundy value $0 \\dots G(H)-1$. Attaching via edge $e$ adds 1 to the nim-value under the MEX operation. Because the subgame $H$ interacts with the rest of $T$ solely through the bridge edge $e$, its strategic value is completely captured by its Grundy nim-value.",
          engineeringContext:
            "Used to solve complex tree-network graph token games in linear time without full state enumeration.",
        },
        {
          title: "Misère Nim Endgame Strategy Inversion Theorem",
          statement:
            "Prove that in Misère Nim (last player to move loses), normal play Nim strategy is identical to Misère strategy if and only if there exists at least one pile of size $x_i \\ge 2$.",
          proofOutline:
            "As long as there is at least one pile $\\ge 2$, every move leading to a state with all piles $\\le 1$ can be controlled by the player facing an $N$-position. That player can choose to leave an odd number of size-1 piles (forcing the second player to face an even number of size-1 piles, resulting in a loss for the second player). Thus, the winning strategy diverges only on the final transition into the all-size-1 endgame.",
          engineeringContext:
            "Guarantees that standard Sprague-Grundy solvers can solve Misère games with a 2-line endgame branch.",
        },
        {
          title: "von Neumann Minimax Theorem via Linear Programming Duality",
          statement:
            "Prove that for any zero-sum matrix game with payoff matrix $A \\in \\mathbb{R}^{m \\times n}$, $\\max_{x \\in \\Delta_m} \\min_{y \\in \\Delta_n} x^T A y = \\min_{y \\in \\Delta_n} \\max_{x \\in \\Delta_m} x^T A y = V^*$.",
          proofOutline:
            "Formulate the maximizing player's problem as a linear program $\\max V$ subject to $\\sum_i x_i A_{ij} \\ge V$ and $\\sum x_i = 1, x_i \\ge 0$. The dual linear program is $\\min U$ subject to $\\sum_j A_{ij} y_j \\le U$ and $\\sum y_j = 1, y_j \\ge 0$. By Strong Duality of Linear Programming, the primal optimum $V^*$ equals the dual optimum $U^*$, establishing the existence of a unique minimax equilibrium.",
          engineeringContext:
            "Foundational for mixed-strategy Nash equilibria in financial markets, security game auctions, and reinforcement learning.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "64-Bit Zobrist Hash Collisions & Type-1 vs Type-2 Errors",
          prompt:
            "In tournament chess engines, why do 64-bit Zobrist keys have collision probability $\\approx 10^{-6}$ across $10^9$ searched nodes, and how do separate verification keys prevent Type-1 (illegal move execution) and Type-2 (false cutoff) errors?",
          engineeringContext:
            "By the Birthday Paradox, $10^9$ positions hashed with 64-bit keys produce $\\approx (10^9)^2 / (2 \\times 2^{64}) \\approx 0.027$ collisions. Storing a 32-bit verify hash alongside the 64-bit key eliminates illegal moves.",
        },
        {
          title: "Quiescence Search & Eliminating the Tactical Horizon Effect",
          prompt:
            "How does extending the search tree at leaf nodes to only examine capture and check moves prevent catastrophic evaluation blunders caused by fixed-depth search cutoffs?",
          engineeringContext:
            "Static evaluation at depth $D$ on an unstable capturing sequence misjudges piece trades. Quiescence search continues captures until the stand-pat score stabilizes, ensuring tactical fidelity.",
        },
        {
          title: "Lock-Free Shared Transposition Tables in Multi-Threaded Search (Lazy SMP)",
          prompt:
            "Analyze how modern multi-threaded chess engines (Stockfish Lazy SMP) share a single global transposition table across 128 cores without locks using atomic 128-bit XOR key validation.",
          engineeringContext:
            "Mutex locks on shared hash tables cause severe thread serialization. Atomic 128-bit reads and writes allow parallel workers to overwrite entries asynchronously without data corruption.",
        },
      ],
      partD_stressTests: [
        {
          title: "Infinite Call-Stack Recursion on Cyclic Game Graph",
          scenario:
            "A minimax engine evaluates a board state with circular piece repositioning without maintaining a path repetition history.",
          failureMode:
            "The search engine enters an infinite cycle of identical positions, triggering fatal call-stack exhaustion.",
        },
        {
          title: "Misère Play Convention Inversion Failure",
          scenario:
            "A developer applies standard Nim-sum XOR logic to a Misère game endgame where pile sizes are $[1, 1, 1]$.",
          failureMode:
            "Standard Nim predicts $1 \\oplus 1 \\oplus 1 = 1 \\neq 0$ (first player wins). In Misère play, taking 1 stone leaves $[1, 1]$, allowing the second player to take 1 and force the first player to take the last stone and lose.",
        },
        {
          title: "Transposition Table Depth Aliasing Blunder",
          scenario:
            "A shallow search at depth 1 overwrites a deep search entry at depth 12 due to a direct-mapped table collision without depth checks.",
          failureMode:
            "Subsequent deep searches accept the shallow evaluation as authoritative, causing the engine to blunder pieces.",
        },
      ],
    },
  ],
};
