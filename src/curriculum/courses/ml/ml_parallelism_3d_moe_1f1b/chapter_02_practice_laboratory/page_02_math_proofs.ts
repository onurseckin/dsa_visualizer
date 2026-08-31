import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_parallelism_3d_moe_1f1b_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Megatron Parallel Equivalence & MoE Load Loss",
  sections: [
    {
      type: "math_proof",
      title: "Megatron Column-Row Tensor Parallel Equivalence Theorem",
      theorem:
        "Let an MLP layer be defined as $Y = \\text{GeLU}(X W_1) W_2$ with $W_1 \\in \\mathbb{R}^{d \\times 4d}$ and $W_2 \\in \\mathbb{R}^{4d \\times d}$. Partitioning $W_1$ into $K$ column blocks $W_1 = [W_{1,1} \\mid \\dots \\mid W_{1,K}]$ and $W_2$ into $K$ row blocks $W_2 = [W_{2,1} / \\dots / W_{2,K}]$ across $K$ GPUs yields $\\sum_{k=1}^K \\text{GeLU}(X W_{1,k}) W_{2,k} = Y$ identically, requiring only 1 All-Reduce operation.",
      proof:
        "1. Column Parallel Linear First Layer:\\nSince $W_1 = [W_{1,1}, W_{1,2}, \\dots, W_{1,K}]$, matrix multiplication distributes across columns:\\n$$X W_1 = X [W_{1,1}, \\dots, W_{1,K}] = [X W_{1,1}, \\dots, X W_{1,K}]$$\\n\\n2. Elementwise Non-Linearity Invariance:\\nBecause GeLU is an elementwise activation $\\text{GeLU}([A, B]) = [\\text{GeLU}(A), \\text{GeLU}(B)]$, each GPU $k$ evaluates $H_k = \\text{GeLU}(X W_{1,k})$ independently with zero cross-GPU communication.\\n\\n3. Row Parallel Linear Second Layer:\\nThe full intermediate tensor is $H = [H_1, H_2, \\dots, H_K]$. Multiplying by row-partitioned weight $W_2$:\\n$$Y = H W_2 = [H_1, H_2, \\dots, H_K] \\begin{pmatrix} W_{2,1} \\\\ W_{2,2} \\\\ \\vdots \\\\ W_{2,K} \\end{pmatrix} = \\sum_{k=1}^K H_k W_{2,k} = \\sum_{k=1}^K \\text{GeLU}(X W_{1,k}) W_{2,k}$$\\n\\n4. All-Reduce Aggregation:\\nEach GPU computes local partial product $Y_k = H_k W_{2,k}$. A single All-Reduce SUM across the $K$ GPUs evaluates $Y = \\sum_{k=1}^K Y_k$, rigorously matching the serial MLP output with zero mathematical approximation.",
    },
    {
      type: "math_proof",
      title: "MoE Auxiliary Load Balancing Loss Gradient Proof",
      theorem:
        "To prevent router representation collapse (where all tokens route to a single dominant expert), minimizing the auxiliary loss $\\mathcal{L}_{\\text{balance}} = \\alpha \\cdot E \\sum_{i=1}^E f_i P_i$ forces expert routing probabilities $P_i = \\frac{1}{N} \\sum_{x} p_i(x)$ and actual expert dispatch fractions $f_i = \\frac{1}{N} \\sum_x \\mathbf{1}_{\\{x \\text{ routes to } i\\}}$ toward a uniform distribution $\\frac{1}{E}$.",
      proof:
        "1. Cauchy-Schwarz Inequality on Load Vectors:\\nLet $f = (f_1, \\dots, f_E)^T$ and $P = (P_1, \\dots, P_E)^T$, where $\\sum_{i=1}^E f_i = 1$ and $\\sum_{i=1}^E P_i = 1$. The auxiliary loss is proportional to the dot product $\\langle f, P \\rangle$.\\nBy Cauchy-Schwarz:\\n$$\\sum_{i=1}^E f_i P_i \\ge \\frac{1}{E} \\left( \\sum_{i=1}^E f_i \\right) \\left( \\sum_{i=1}^E P_i \\right) = \\frac{1}{E}$$\\n\\n2. Minimum Condition:\\nEquality holds if and only if $f_i = P_i = \\frac{1}{E}$ for all $i \\in \\{1, \\dots, E\\}$.\\n\\n3. Gradient Flow:\\nBecause $f_i$ is non-differentiable (discrete argmax), gradients backpropagate strictly through $P_i(x)$: $\\frac{\\partial \\mathcal{L}}{\\partial \\text{logits}} = \\alpha E f_i \\nabla_{\\text{logits}} P_i$. Overloaded experts (high $f_i$) receive large positive loss penalties, depressing their routing probabilities for future tokens and restoring balanced expert utilization.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
