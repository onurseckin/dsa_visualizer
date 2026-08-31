import type { CoursePage } from "../../../../courseTypes";

export const page_02_math_proofs: CoursePage = {
  id: "ml_matrix_memory_layout_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs & Analytical Bounds",
  subtitle: "I/O Complexity, Tiling Bounds, and DRAM Transfer Reduction",
  estimatedMinutes: 30,
  sections: [
    {
      type: "math_proof",
      title: "Hong-Kung Theorem: I/O Complexity of Matrix Multiplication",
      theorem:
        "Any algorithm computing the standard matrix product $C = A \\times B$ for $N \\times N$ matrices on a hardware architecture with fast local memory (SRAM/Cache) of size $M$ words and slow memory (DRAM) requires at least $\\Omega\\left(\\frac{N^3}{\\sqrt{M}}\\right)$ I/O transfers between fast and slow memory.",
      proof:
        "1. Let the computation be represented as a 3D grid of $N^3$ elementary multiply-accumulate operations $(i, j, k)$ where $C_{ij} \\leftarrow C_{ij} + A_{ik} B_{kj}$.\n2. Divide the computation into time intervals $T_1, T_2, \\dots, T_P$ such that during each interval, at most $M$ words of data are loaded from slow memory into fast memory.\n3. In any interval, at most $2M$ words are accessible in fast memory ($M$ words originally in memory plus $M$ words loaded).\n4. Let $S_A, S_B, S_C$ be the subsets of elements of $A, B, C$ accessed during this interval, where $|S_A| \\le 2M$, $|S_B| \\le 2M$, and $|S_C| \\le 2M$.\n5. By the Loomis-Whitney inequality for projections of 3D integer sets onto coordinate planes:\n   $$\\text{Operations in interval} \\le \\sqrt{|S_A| \\cdot |S_B| \\cdot |S_C|} \\le \\sqrt{(2M) \\cdot (2M) \\cdot (2M)} = \\sqrt{8 M^3} = 2\\sqrt{2} M^{3/2}$$\n6. To perform all $N^3$ operations, the number of required intervals $P$ satisfies:\n   $$P \\ge \\frac{N^3}{2\\sqrt{2} M^{3/2}}$$\n7. Since each interval transfers at least $M$ words, the total volume of memory I/O transfers $Q$ is bounded by:\n   $$Q \\ge P \\cdot M \\ge \\frac{N^3 \\cdot M}{2\\sqrt{2} M^{3/2}} = \\Omega\\left(\\frac{N^3}{\\sqrt{M}}\\right)$$\n8. The cache-blocked (tiled) GEMM algorithm with tile dimension $B = \\Theta(\\sqrt{M})$ achieves this lower bound asymptotically, proving its theoretical I/O optimality.",
    },
    {
      type: "math_proof",
      title: "Optimal Square Tile Sizing for L1 Cache Partitioning",
      theorem:
        "Under a three-operand GEMM loop kernel $C_{\\text{tile}} = A_{\\text{tile}} \\times B_{\\text{tile}} + C_{\\text{tile}}$ operating on square blocks of size $B \\times B$ with element byte size $E$, the maximum tile size $B^*$ that prevents capacity and conflict evictions in an $L_1$ cache of capacity $M_{\\text{bytes}}$ is given by $B^* = \\left\\lfloor \\sqrt{\\frac{M_{\\text{bytes}}}{3 E}} \\right\\rfloor$.",
      proof:
        "1. At any instant during the inner tile multiplication, three sub-matrices must simultaneously reside in the $L_1$ cache: $A_{\\text{tile}} \\in \\mathbb{R}^{B \\times B}$, $B_{\\text{tile}} \\in \\mathbb{R}^{B \\times B}$, and $C_{\\text{tile}} \\in \\mathbb{R}^{B \\times B}$.\n2. The total footprint in bytes is $F(B) = B^2 E + B^2 E + B^2 E = 3 B^2 E$.\n3. To guarantee zero capacity misses during the execution of all $B^3$ multiply-adds inside the tile, we require $F(B) \\le M_{\\text{bytes}}$.\n4. Solving for $B$: $3 B^2 E \\le M_{\\text{bytes}} \\implies B \\le \\sqrt{\\frac{M_{\\text{bytes}}}{3 E}}$.\n5. For a standard 32 KB $L_1$ cache ($32768$ bytes) with FP32 arithmetic ($E = 4$ bytes):\n   $$B^* = \\left\\lfloor \\sqrt{\\frac{32768}{3 \\times 4}} \\right\\rfloor = \\lfloor \\sqrt{2730.67} \\rfloor = 52$$\n6. Choosing $B = 32$ or $B = 48$ ensures safety margin against cache associativity collisions while maximizing arithmetic intensity $I = \\frac{2 B^3}{3 B^2 E} = \\frac{2 B}{3 E}$ FLOPs/byte.",
    },
  ],
};
