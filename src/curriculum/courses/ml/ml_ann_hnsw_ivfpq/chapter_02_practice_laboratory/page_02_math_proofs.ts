import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "ml_ann_hnsw_ivfpq_c2_p2",
  pageNumber: 3,
  title: "Mathematical Proofs: Small-World Graph Routing & Vector Quantization",
  sections: [
    {
      type: "math_proof",
      title: "Kleinberg Small-World Greedy Routing Bound",
      theorem:
        "On a $d$-dimensional grid graph with long-range edges added with probability proportional to $1 / r^\\alpha$, decentralized greedy routing achieves polylogarithmic search time $O(\\log^2 N)$ if and only if clustering exponent $\\alpha = d$ (the spatial dimension of the embedding).",
      proof:
        "1. Harmonic Normalization Constant:\\nLet the probability of a directed long-range edge from $u$ to $v$ be $P(u \\to v) = \\frac{1}{Z} \\frac{1}{\\text{dist}(u, v)^\\alpha}$ where $Z = \\sum_{w \\ne u} \\frac{1}{\\text{dist}(u, w)^\\alpha}$.\\nWhen $\\alpha = d$, the number of nodes at distance between $2^j$ and $2^{j+1}$ is proportional to $(2^j)^d = 2^{jd}$.\\nThe probability mass in each logarithmic distance scale ring $[2^j, 2^{j+1}]$ is uniform:\\n$$\\sum_{w : 2^j \\le \\text{dist}(u, w) < 2^{j+1}} P(u \\to v) \\approx \\frac{1}{Z} \\cdot 2^{jd} \\cdot \\frac{1}{(2^j)^d} = \\frac{1}{Z} = \\frac{1}{\\log N}$$\\n\\n2. Halving Distance Probability:\\nIn each routing step, the probability that a long-range link lands in the half-distance ball $B(t, \\text{dist}(u, t)/2)$ surrounding destination $t$ is at least $\\frac{1}{Z} = \\frac{1}{\\log N}$.\\n\\n3. Expected Steps to Halve Distance:\\nThe expected number of greedy steps before discovering an edge that halves the distance to the target is bounded by $\\log N$.\\n\\n4. Total Traversal Time:\\nSince distance can be halved at most $\\log N$ times before reaching destination $t$, total expected search hops is:\\n$$T = O(\\log N \\times \\log N) = O(\\log^2 N)$$\\nHNSW enforces this scale-free navigable connectivity across its hierarchical layers, proving logarithmic graph navigation.",
    },
    {
      type: "math_proof",
      title: "Product Quantization Asymptotic Codebook Variance",
      theorem:
        "Let $X \\in \\mathbb{R}^D$ have isotropic covariance $\\Sigma = \\sigma^2 I_D$. Dividing $X$ into $M$ orthogonal sub-vectors of dimension $d = D/M$ and quantizing each sub-vector with $K=256$ centroids via $K$-means achieves a total reconstruction MSE scaling as $\\text{MSE} = M \\cdot C(d) \\cdot \\sigma^2 \\cdot K^{-2/d}$ where $C(d)$ is Zador's optimal quantization constant.",
      proof:
        "1. High-Rate Vector Quantization (Zador's Theorem):\\nFor a $d$-dimensional random vector with continuous density $p(x)$, the optimal mean squared error under $K$-means quantization with $K$ centroids satisfies:\\n$$\\text{MSE}_m = C(d) \\cdot K^{-2/d} \\left( \\int p(x)^{d/(d+2)} dx \\right)^{(d+2)/d}$$\\n\\n2. Summation over $M$ Sub-Quantizers:\\nBecause coordinates are decomposed into $M$ disjoint orthogonal sub-spaces, total reconstruction error is the sum of sub-quantizer MSEs:\\n$$\\text{MSE}_{\\text{total}} = \\sum_{m=1}^M \\text{MSE}_m = M \\cdot C(d) \\cdot \\sigma^2 \\cdot K^{-2/d}$$\\n\\n3. Trade-off Analysis:\\nFor fixed total code size $B = M \\log_2 K$ bits per vector, choosing $M = D/16$ ($d = 16$, $K = 256$) strikes the optimal empirical Pareto frontier between ADC lookup table cache size ($256 \\times M \\times 4$ bytes in L1 cache) and distance distortion.",
    },
  ],
};

export const page = page2;
export const page_02_math_proofs = page2;
