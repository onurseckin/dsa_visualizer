import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_dense_gemm_tiling_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Optimal Tile Sizing & Arithmetic Intensity",
  sections: [
    {
      type: "math_proof",
      title: "Optimal Square Tile Sizing Maximizing Arithmetic Intensity",
      theorem:
        "Let fast SRAM memory have capacity $M_{\\text{SRAM}}$ (in words). To compute $N \\times N$ GEMM with block sizes $B_M, B_N, B_K$ subject to $B_M B_K + B_K B_N \\le M_{\\text{SRAM}}$, arithmetic intensity is maximized and HBM memory traffic is minimized when $B_M = B_N = \\sqrt{\\frac{M_{\\text{SRAM}}}{2 \\alpha}}$ (square tiles).",
      proof:
        "1. Formulation of HBM Memory Traffic:\\nThe total number of elements read from global HBM is:\\n$$Q(B_M, B_N) = N^2 K \\left( \\frac{1}{B_N} + \\frac{1}{B_M} \\right)$$\\n\\n2. Fast Memory Capacity Constraint:\\nAt each reduction step, SRAM stores a tile of $A$ ($B_M B_K$ elements) and a tile of $B$ ($B_K B_N$ elements). Assuming fixed reduction slice $B_K$:\\n$$B_K (B_M + B_N) \\le M_{\\text{SRAM}} \\implies B_M + B_N \\le \\frac{M_{\\text{SRAM}}}{B_K} = C$$\\n\\n3. Optimization Problem:\\nMinimize $f(B_M, B_N) = \\frac{1}{B_M} + \\frac{1}{B_N}$ subject to $B_M + B_N = C$ and $B_M, B_N > 0$.\\nSubstituting $B_N = C - B_M$:\\n$$g(B_M) = \\frac{1}{B_M} + \\frac{1}{C - B_M}$$\\n\\n4. First and Second Derivative Tests:\\n$$\\frac{dg}{dB_M} = -\\frac{1}{B_M^2} + \\frac{1}{(C - B_M)^2} = 0 \\implies B_M^2 = (C - B_M)^2 \\implies B_M = C - B_M = B_N = \\frac{C}{2}$$\\n$$\\frac{d^2 g}{dB_M^2} = \\frac{2}{B_M^3} + \\frac{2}{(C - B_M)^3} > 0 \\quad (\\text{strictly convex global minimum})$$\\n\\n5. Conclusion:\\nSquare tiles $B_M = B_N$ minimize HBM traffic and maximize arithmetic intensity $I = \\frac{2 B_M B_N B_K}{(B_M + B_N) B_K \\times \\text{bytes}} = \\frac{B_M}{\\text{bytes}}$.",
    },
    {
      type: "math_proof",
      title: "Register Pressure and Occupancy Ceiling Theorem",
      theorem:
        "On an NVIDIA Streaming Multiprocessor (SM) with $R_{\\max} = 65{,}536$ 32-bit registers and maximum warp capacity $W_{\\max} = 64$ warps (2048 threads), an increase in thread register allocation $r_{\\text{thread}} = T_M \\cdot T_N$ beyond 32 registers induces a discontinuous piecewise collapse in thread block occupancy.",
      proof:
        "1. Active Thread Count per SM:\\nLet $B$ active thread blocks run on an SM, each with $T$ threads. The total register allocation is $R_{\\text{used}} = B \\cdot T \\cdot r_{\\text{thread}} \\le R_{\\max}$.\\n\\n2. Maximum Occupancy Formula:\\n$$\\text{Occupancy} = \\frac{\\min\\left(2048, B \\cdot T, \\left\\lfloor \\frac{65536}{T \\cdot r_{\\text{thread}}} \\right\\rfloor \\cdot T\\right)}{2048}$$\\n\\n3. Threshold Discontinuity:\\n- For $r_{\\text{thread}} = 32$: $\\lfloor 65536 / 32 \\rfloor = 2048$ threads ($100\\%$ theoretical occupancy).\\n- For $r_{\\text{thread}} = 64$: $\\lfloor 65536 / 64 \\rfloor = 1024$ threads ($50\\%$ theoretical occupancy).\\n- For $r_{\\text{thread}} = 128$: $\\lfloor 65536 / 128 \\rfloor = 512$ threads ($25\\%$ theoretical occupancy).\\n\\nKernel engineers must choose $T_M = 8, T_N = 8$ (64 registers for accumulator + 16 for operands = 80 registers) carefully to balance ILP (Instruction-Level Parallelism) with Warp Occupancy.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
