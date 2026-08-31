import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_dp_2d_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Knuth's Optimization on Quadrangle Inequality",
      theorem:
        "Consider the dynamic programming recurrence $DP[i][j] = \\min_{i \\le k < j} \\{ DP[i][k] + DP[k+1][j] \\} + w(i, j)$ for $1 \\le i < j \\le N$. If the cost function $w(i, j)$ satisfies the Quadrangle Inequality ($w(a, c) + w(b, d) \\le w(a, d) + w(b, c)$ for all $a \\le b \\le c \\le d$) and is monotonic ($w(b, c) \\le w(a, d)$), then the optimal split points $opt[i][j] = \\arg\\min_k (\\dots)$ satisfy $opt[i][j-1] \\le opt[i][j] \\le opt[i+1][j]$, reducing total computation time from $O(N^3)$ to $O(N^2)$.",
      proof: `
**Proof of Optimal Split Monotonicity:**
1. Under the Quadrangle Inequality (QI) and monotonicity on $w(i, j)$, it is established by induction on interval length that $DP[i][j]$ also satisfies the Quadrangle Inequality:
   $$DP[a, c] + DP[b, d] \\le DP[a, d] + DP[b, c] \\quad \\forall a \\le b \\le c \\le d$$
2. Let $k_1 = opt[i][j-1]$ and $k_2 = opt[i][j]$. Suppose for contradiction that $k_1 > k_2$.
3. By sub-optimality of $k_1$ for interval $[i, j]$ and $k_2$ for interval $[i, j-1]$, combining the DP values and applying the QI condition produces a strict inequality where $k_1$ would be strictly better than $opt[i][j-1]$ for interval $[i, j-1]$, a direct contradiction.
4. Hence, $opt[i][j-1] \\le opt[i][j]$. By symmetric argument on shifting the left boundary, $opt[i][j] \\le opt[i+1][j]$.

**Proof of $O(N^2)$ Complexity via Telescoping Sum:**
1. For a fixed interval length $L = j - i + 1$, the inner loop for split point $k$ runs from $opt[i][j-1]$ to $opt[i+1][j]$.
2. The number of iterations for a fixed $(i, j)$ pair is $(opt[i+1][j] - opt[i][j-1] + 1)$.
3. Summing across all starting positions $i$ for a fixed length $L$:
   $$\\sum_{i=1}^{N-L+1} (opt[i+1][i+L-1] - opt[i][i+L-2] + 1)$$
4. This sum telescopes:
   $$(opt[N-L+2][N] - opt[1][L-1]) + (N - L + 1) \\le N + N = 2N$$
5. Summing over all $N$ possible lengths $L \\in [2, N]$:
   $$\\text{Total Operations} \\le \\sum_{L=2}^N 2N = 2N^2 = O(N^2)$$
Thus, Knuth's Optimization reduces interval DP from $O(N^3)$ to $O(N^2)$ without any asymptotic space overhead. $\\blacksquare$
      `,
    },
    {
      type: "prose",
      title: "Trace: Bitmask TSP State Lattice Transitions",
      content: `
### Concrete Trace: Traveling Salesperson Problem on 4 Vertices ($N=4$)

**Distance Matrix:**
- $D[0][1]=10, D[0][2]=15, D[0][3]=20$
- $D[1][2]=35, D[1][3]=25, D[2][3]=30$ (Symmetric)

**Start at Vertex 0. Initial state:** $DP[1][0] = 0$ (mask $0001_2$, at vertex 0), all others $\\infty$.

1. **Hamming Weight 2 (Masks with 2 bits set):**
   - Mask $0011_2$ (visit {0, 1}, end at 1): $DP[3][1] = DP[1][0] + D[0][1] = 0 + 10 = 10$.
   - Mask $0101_2$ (visit {0, 2}, end at 2): $DP[5][2] = DP[1][0] + D[0][2] = 0 + 15 = 15$.
   - Mask $1001_2$ (visit {0, 3}, end at 3): $DP[9][3] = DP[1][0] + D[0][3] = 0 + 20 = 20$.

2. **Hamming Weight 3 (Masks with 3 bits set):**
   - Mask $0111_2$ ({0, 1, 2}):
     - End at 2: $\\min(DP[3][1] + D[1][2]) = 10 + 35 = 45$.
     - End at 1: $\\min(DP[5][2] + D[2][1]) = 15 + 35 = 50$.
   - Mask $1011_2$ ({0, 1, 3}):
     - End at 3: $\\min(DP[3][1] + D[1][3]) = 10 + 25 = 35$.
     - End at 1: $\\min(DP[9][3] + D[3][1]) = 20 + 25 = 45$.
   - Mask $1101_2$ ({0, 2, 3}):
     - End at 3: $\\min(DP[5][2] + D[2][3]) = 15 + 30 = 45$.
     - End at 2: $\\min(DP[9][3] + D[3][2]) = 20 + 30 = 50$.

3. **Hamming Weight 4 (Mask $1111_2 = 15$, all visited):**
   - End at 1: $\\min(DP[13][2] + D[2][1], DP[13][3] + D[3][1]) = \\min(50 + 35, 45 + 25) = 70$.
   - End at 2: $\\min(DP[11][1] + D[1][2], DP[11][3] + D[3][2]) = \\min(45 + 35, 35 + 30) = 65$.
   - End at 3: $\\min(DP[7][1] + D[1][3], DP[7][2] + D[2][3]) = \\min(50 + 25, 45 + 30) = 75$.

4. **Return to Origin (Vertex 0):**
   - From 1: $70 + D[1][0] = 70 + 10 = 80$.
   - From 2: $65 + D[2][0] = 65 + 15 = 80$.
   - From 3: $75 + D[3][0] = 75 + 20 = 95$.
   - Optimal Hamiltonian Tour Cost $= \\min(80, 80, 95) = 80$.
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Recursive Permutation Search Baseline",
          code: `export function tspNaive(dist: number[][]): number {
  const n = dist.length;
  let minCost = Infinity;

  function permute(curr: number, visited: boolean[], count: number, currentCost: number): void {
    if (count === n) {
      minCost = Math.min(minCost, currentCost + dist[curr][0]);
      return;
    }
    for (let next = 0; next < n; next++) {
      if (!visited[next]) {
        visited[next] = true;
        permute(next, visited, count + 1, currentCost + dist[curr][next]);
        visited[next] = false;
      }
    }
  }

  const visited = new Array(n).fill(false);
  visited[0] = true;
  permute(0, visited, 1, 0);
  return minCost;
}`,
          explanation:
            "Explores all $(N-1)!$ possible tour permutations via backtracking. For $N = 20$, $(20-1)! \\approx 1.21 \\times 10^{17}$ iterations, requiring thousands of years of compute.",
          timeComplexity: "O(N!)",
          spaceComplexity: "O(N) recursion stack",
        },
        {
          label: "Stage 2: Standard Tabulated Bitmask Dynamic Programming",
          code: `export function tspBitmaskTabulated(dist: number[][]): number {
  const n = dist.length;
  const numStates = 1 << n;
  // dp[mask][u]: min cost to visit set 'mask' ending at vertex 'u'
  const dp: number[][] = Array.from({ length: numStates }, () => new Array(n).fill(Infinity));

  dp[1][0] = 0; // Base case: visited only node 0, at node 0

  for (let mask = 1; mask < numStates; mask++) {
    for (let u = 0; u < n; u++) {
      if ((mask & (1 << u)) === 0 || dp[mask][u] === Infinity) continue;

      for (let v = 0; v < n; v++) {
        if ((mask & (1 << v)) === 0) {
          const nextMask = mask | (1 << v);
          const newCost = dp[mask][u] + dist[u][v];
          if (newCost < dp[nextMask][v]) {
            dp[nextMask][v] = newCost;
          }
        }
      }
    }
  }

  let minTour = Infinity;
  const fullMask = numStates - 1;
  for (let u = 1; u < n; u++) {
    minTour = Math.min(minTour, dp[fullMask][u] + dist[u][0]);
  }
  return minTour;
}`,
          explanation:
            "Standard Held-Karp dynamic programming algorithm. Orders transitions by bitmask integer values, guaranteeing topological correctness since `nextMask > mask`. Reduces runtime from $O(N!)$ to $O(N^2 2^N)$.",
          timeComplexity: "O(N^2 * 2^N)",
          spaceComplexity: "O(N * 2^N) 2D array",
        },
        {
          label: "Stage 3: Low-Level Row-Major Flat Array & Knuth-Optimized Interval Engine",
          code: `export class LowLevelDPEngine {
  // Ultra-fast flat-buffer Bitmask TSP with row-major cache indexing
  public static tspFlatMemory(dist: Float64Array, n: number): number {
    const numStates = 1 << n;
    // Flattened 1D array: dp[mask * n + u]
    const dp = new Float64Array(numStates * n).fill(Infinity);
    dp[0 * n + 0] = 0; // mask 1 has index (1 * n + 0), here bitmask index 1 is base

    dp[1 * n + 0] = 0;

    for (let mask = 1; mask < numStates; mask++) {
      const maskOffset = mask * n;
      for (let u = 0; u < n; u++) {
        const currCost = dp[maskOffset + u];
        if (currCost === Infinity) continue;

        const distOffset = u * n;
        for (let v = 0; v < n; v++) {
          if ((mask & (1 << v)) === 0) {
            const nextMask = mask | (1 << v);
            const targetIdx = nextMask * n + v;
            const candidate = currCost + dist[distOffset + v];
            if (candidate < dp[targetIdx]) {
              dp[targetIdx] = candidate;
            }
          }
        }
      }
    }

    let minTour = Infinity;
    const fullMaskOffset = (numStates - 1) * n;
    for (let u = 1; u < n; u++) {
      const cost = dp[fullMaskOffset + u] + dist[u * n + 0];
      if (cost < minTour) minTour = cost;
    }
    return minTour;
  }

  // Knuth's Optimized Interval DP: Reduces O(N^3) to O(N^2) for optimal tree/polygon partitioning
  public static knuthIntervalDP(weights: Float64Array, n: number): number {
    const dp = new Float64Array(n * n);
    const opt = new Int32Array(n * n);

    // Base case: length 1 intervals (cost 0, opt is i)
    for (let i = 0; i < n; i++) {
      opt[i * n + i] = i;
    }

    // Solve by increasing length L
    for (let len = 2; len <= n; len++) {
      for (let i = 0; i <= n - len; i++) {
        const j = i + len - 1;
        const cellIdx = i * n + j;
        dp[cellIdx] = Infinity;

        // Knuth's bounded search window: opt[i][j-1] to opt[i+1][j]
        const optLeft = opt[i * n + (j - 1)];
        const optRight = j > i + 1 ? opt[(i + 1) * n + j] : optLeft;
        const searchLimit = Math.min(j - 1, optRight);

        for (let k = optLeft; k <= searchLimit; k++) {
          const cost =
            dp[i * n + k] +
            dp[(k + 1) * n + j] +
            (weights[j] - (i > 0 ? weights[i - 1] : 0));

          if (cost < dp[cellIdx]) {
            dp[cellIdx] = cost;
            opt[cellIdx] = k;
          }
        }
      }
    }
    return dp[0 * n + (n - 1)];
  }
}`,
          explanation:
            "Stage 3 utilizes contiguous Float64Array flat buffers with row-major address calculation (`mask * n + u`), eliminating Javascript pointer dereferencing. Implements Knuth's Optimization bounding the split search loop to strictly $[opt[i][j-1], opt[i+1][j]]$, executing in guaranteed $O(N^2)$ time.",
          timeComplexity: "Flat TSP: O(N^2 * 2^N), Knuth Interval DP: O(N^2)",
          spaceComplexity: "Zero-GC TypedArrays, O(N * 2^N) and O(N^2)",
        },
      ],
      stepByStep: [
        "Map multi-dimensional state tuple to contiguous 1D array index: $\\text{index}(i, j) = i \\times \\text{stride} + j$.",
        "Verify topological ordering: for Bitmask DP, iterate $mask = 1 \\dots 2^N-1$; for Interval DP, iterate $len = 2 \\dots N$.",
        "Apply Quadrangle Inequality bounds $opt[i][j-1] \\le k \\le opt[i+1][j]$ to eliminate redundant inner loops.",
      ],
    },
  ],
};
