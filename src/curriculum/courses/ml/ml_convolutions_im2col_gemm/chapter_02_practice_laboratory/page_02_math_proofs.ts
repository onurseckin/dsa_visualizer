import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_convolutions_im2col_gemm_c2_p2",
  pageNumber: 2,
  title: "Mathematical Proofs: Im2Col GEMM Equivalence & Winograd Minimal Multiplications",
  sections: [
    {
      type: "math_proof",
      title: "Im2Col Matrix Multiplication Equivalence Theorem",
      theorem:
        "For any 4D input tensor $X \\in \\mathbb{R}^{B \\times C_{\\text{in}} \\times H \\times W}$ and 4D filter weight $W \\in \\mathbb{R}^{C_{\\text{out}} \\times C_{\\text{in}} \\times K_H \\times K_W}$, the spatial discrete convolution $Y(b, c_{\\text{out}}, h, w) = \\sum_{c=0}^{C_{\\text{in}}-1} \\sum_{i=0}^{K_H-1} \\sum_{j=0}^{K_W-1} X(b, c, h \\cdot s + i, w \\cdot s + j) W(c_{\\text{out}}, c, i, j)$ is mathematically isomorphic to the 2D matrix multiplication $Y_{\\text{col}} = W_{\\text{flat}} \\times X_{\\text{col}}$.",
      proof:
        "1. Flattening Filter Weights:\\nDefine bijection $\\phi_{\\text{filter}}: \\{0, \\dots, C_{\\text{in}}-1\\} \\times \\{0, \\dots, K_H-1\\} \\times \\{0, \\dots, K_W-1\\} \\to \\{0, \\dots, K_{\\text{total}}-1\\}$ where $K_{\\text{total}} = C_{\\text{in}} K_H K_W$:\\n$$\\phi_{\\text{filter}}(c, i, j) = c (K_H K_W) + i (K_W) + j$$\\nThe flattened weight matrix $W_{\\text{flat}} \\in \\mathbb{R}^{C_{\\text{out}} \\times K_{\\text{total}}}$ has entries $W_{\\text{flat}}[c_{\\text{out}}, \\phi_{\\text{filter}}(c, i, j)] = W(c_{\\text{out}}, c, i, j)$.\\n\\n2. Unrolling Input Patches (Im2Col):\\nDefine bijection $\\phi_{\\text{spatial}}: \\{0, \\dots, B-1\\} \\times \\{0, \\dots, H_{\\text{out}}-1\\} \\times \\{0, \\dots, W_{\\text{out}}-1\\} \\to \\{0, \\dots, M_{\\text{spatial}}-1\\}$ where $M_{\\text{spatial}} = B H_{\\text{out}} W_{\\text{out}}$:\\n$$\\phi_{\\text{spatial}}(b, h, w) = b (H_{\\text{out}} W_{\\text{out}}) + h (W_{\\text{out}}) + w$$\\nThe unfolded column matrix $X_{\\text{col}} \\in \\mathbb{R}^{K_{\\text{total}} \\times M_{\\text{spatial}}}$ has entries $X_{\\text{col}}[\\phi_{\\text{filter}}(c, i, j), \\phi_{\\text{spatial}}(b, h, w)] = X(b, c, h \\cdot s + i, w \\cdot s + j)$.\\n\\n3. Matrix Product Evaluation:\\nBy the standard definition of matrix multiplication:\\n$$(W_{\\text{flat}} X_{\\text{col}})[c_{\\text{out}}, \\phi_{\\text{spatial}}(b, h, w)] = \\sum_{k=0}^{K_{\\text{total}}-1} W_{\\text{flat}}[c_{\\text{out}}, k] X_{\\text{col}}[k, \\phi_{\\text{spatial}}(b, h, w)]$$\\nSubstituting back the coordinates $(c, i, j)$:\\n$$= \\sum_{c=0}^{C_{\\text{in}}-1} \\sum_{i=0}^{K_H-1} \\sum_{j=0}^{K_W-1} W(c_{\\text{out}}, c, i, j) X(b, c, h \\cdot s + i, w \\cdot s + j) = Y(b, c_{\\text{out}}, h, w)$$\\nThis establishes that spatial convolution and 2D matrix multiplication are mathematically identical.",
    },
    {
      type: "math_proof",
      title: "Winograd Minimal Multiplications Bound (Cook-Toom Complexity)",
      theorem:
        "The minimum number of scalar multiplications required to compute a linear convolution of an $m$-point sequence with an $r$-point filter is $m + r - 1$.",
      proof:
        "1. Polynomial Ring Isomorphism:\\nLinear convolution of signal $d$ ($m+r-1$ points) with filter $g$ ($r$ points) is equivalent to multiplying polynomials $y(x) = d(x) g(x) \\bmod m(x)$ where $\\text{deg}(m(x)) = m + r - 1$.\\n\\n2. Chinese Remainder Theorem (CRT) for Polynomials:\\nLet $m(x) = \\prod_{i=1}^{m+r-1} (x - s_i)$ be partitioned into $m+r-1$ mutually coprime degree-1 linear factors.\\nBy the CRT, the polynomial ring $\\mathbb{R}[x] / \\langle m(x) \\rangle$ is isomorphic to the direct product of field components:\\n$$\\mathbb{R}[x] / \\langle m(x) \\rangle \\cong \\bigoplus_{i=1}^{m+r-1} \\mathbb{R}[x] / \\langle x - s_i \\rangle$$\\n\\n3. Multiplication in Quotient Rings:\\nIn each component $\\mathbb{R}[x] / \\langle x - s_i \\rangle$, multiplying $d(s_i) \\times g(s_i)$ is a scalar multiplication of real numbers, requiring exactly 1 multiplication.\\nSumming across all $m+r-1$ roots requires exactly $m+r-1$ multiplications.\\n\\n4. Conclusion:\\nFor 2D Winograd $F(m \\times m, r \\times r)$, outer product evaluation requires $(m + r - 1)^2$ multiplications. For $m=2, r=3$: $(2 + 3 - 1)^2 = 4^2 = 16$ multiplications, strictly matching the theoretical Cook-Toom lower bound.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
