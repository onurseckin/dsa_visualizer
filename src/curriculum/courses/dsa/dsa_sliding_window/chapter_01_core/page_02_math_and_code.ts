import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_sliding_window_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Monotonic Deque Linear Time Bound via Potential Method",
      theorem:
        "The Monotonic Deque algorithm for sliding window maximum/minimum over an array of size $N$ with window size $K$ executes in strictly at most $2N$ element push/pop operations, running in $\\Theta(N)$ total time.",
      proof: `
**Proof via Potential Method:**
1. Let $D_i$ denote the state of the double-ended queue after processing element $A[i]$ ($0 \\le i < N$).
2. Define the potential function $\\Phi_i = |D_i|$ (the number of elements currently stored in the deque).
3. We observe that $0 \\le \\Phi_i \\le K$ for all $i$, and $\\Phi_{-1} = 0$ (initially empty deque).
4. When processing index $i$:
   - **Step 1 (Expire old front):** If the front element index is older than $i - K + 1$, pop it from the front ($p_{\\text{front}} \\in \\{0, 1\\}$).
   - **Step 2 (Prune back):** While the deque is non-empty and $A[\\text{back}] \\le A[i]$, pop from the back ($p_{\\text{back}} \\ge 0$ times).
   - **Step 3 (Push new):** Push index $i$ onto the back (1 operation).
5. The actual cost of step $i$ is $c_i = 1 + p_{\\text{front}} + p_{\\text{back}}$.
6. The change in potential is:
   $$\\Delta \\Phi = \\Phi_i - \\Phi_{i-1} = 1 - p_{\\text{front}} - p_{\\text{back}}$$
7. The amortized cost $\\hat{c}_i$ is:
   $$\\hat{c}_i = c_i + \\Delta \\Phi = (1 + p_{\\text{front}} + p_{\\text{back}}) + (1 - p_{\\text{front}} - p_{\\text{back}}) = 2$$
8. The amortized cost of processing each element is strictly $2 = O(1)$.
9. Summing across all $N$ elements:
   $$\\sum_{i=0}^{N-1} c_i = \\sum_{i=0}^{N-1} \\hat{c}_i - \\Phi_{N-1} + \\Phi_{-1} = 2N - |D_{N-1}| \\le 2N$$
Thus, total queue operations cannot exceed $2N$, guaranteeing strictly linear $O(N)$ execution time. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Subarray Counting Decomposition Identity",
      theorem:
        "Let $f: \\mathcal{S} \\to \\mathbb{N}_0$ be a monotonic property on contiguous subarrays (i.e. if $S_1 \\subseteq S_2$, then $f(S_1) \\le f(S_2)$). The number of contiguous subarrays having property value exactly equal to $K$ satisfies:\n$$\\text{Count}(f(S) = K) = \\text{Count}(f(S) \\le K) - \\text{Count}(f(S) \\le K - 1)$$\nFurthermore, for any monotonic predicate $f(A[L \\dots R]) \\le K$, if $L$ is the minimal valid left boundary for right endpoint $R$, the number of valid subarrays ending at $R$ is exactly $(R - L + 1)$.",
      proof: `
**Proof via Set Partitioning & Indicator Decomposition:**
1. Let $\\Omega$ be the set of all $\\binom{N+1}{2}$ contiguous subarrays of array $A$.
2. For any non-negative integer $K$, define the subset $A_K = \\{ S \\in \\Omega \\mid f(S) \\le K \\}$.
3. Because $f(S)$ takes discrete non-negative integer values, $A_{K-1} \\subseteq A_K$.
4. The set of subarrays with property exactly equal to $K$ is the set difference:
   $$\\{ S \\in \\Omega \\mid f(S) = K \\} = A_K \\setminus A_{K-1}$$
5. Since $A_{K-1} \\subseteq A_K$, by the additive property of finite cardinality:
   $$|A_K \\setminus A_{K-1}| = |A_K| - |A_{K-1}|$$
6. **Counting Subarrays Ending at $R$:**
   - Fix right endpoint $R$. By monotonicity of $f$, if $f(A[L \\dots R]) \\le K$, then for any start index $j$ where $L \\le j \\le R$, the subarray $A[j \\dots R] \\subseteq A[L \\dots R]$, which implies $f(A[j \\dots R]) \\le f(A[L \\dots R]) \\le K$.
   - Conversely, for any start index $j < L$, by minimality of $L$, $f(A[j \\dots R]) > K$.
   - Therefore, the valid start indices for subarrays ending at $R$ are precisely $\\{ L, L+1, \\dots, R \\}$.
   - The cardinality of this contiguous integer range is $(R - L + 1)$.
7. Summing over all right endpoints $R \\in [0, N-1]$ computes $|A_K| = \\sum_{R=0}^{N-1} (R - L_R + 1)$ in strictly $O(N)$ time. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive O(N * K) Sliding Window Maximum Baseline",
          code: `export function maxSlidingWindowNaive(nums: number[], k: number): number[] {
  const n = nums.length;
  if (n === 0 || k === 0) return [];
  const result: number[] = [];

  for (let i = 0; i <= n - k; i++) {
    let windowMax = nums[i];
    for (let j = 1; j < k; j++) {
      if (nums[i + j] > windowMax) {
        windowMax = nums[i + j];
      }
    }
    result.push(windowMax);
  }
  return result;
}`,
          explanation:
            "Scans all $K$ elements from scratch for each of the $N-K+1$ windows. When $K \\approx N/2$, runtime degrades to $\\Theta(N^2)$, causing severe throughput collapse.",
          timeComplexity: "O(N * K)",
          spaceComplexity: "O(1) auxiliary",
        },
        {
          label: "Stage 2: Optimal Variable-Size Sliding Window (Minimum Window Substring)",
          code: `export function minWindow(s: string, t: string): string {
  if (s.length === 0 || t.length === 0) return "";

  const targetCounts = new Int32Array(128);
  for (let i = 0; i < t.length; i++) {
    targetCounts[t.charCodeAt(i)]++;
  }

  let required = 0;
  for (let i = 0; i < 128; i++) {
    if (targetCounts[i] > 0) required++;
  }

  const windowCounts = new Int32Array(128);
  let formed = 0;
  let left = 0;
  let minLen = Infinity;
  let minLeft = 0;

  for (let right = 0; right < s.length; right++) {
    const cRight = s.charCodeAt(right);
    windowCounts[cRight]++;

    if (targetCounts[cRight] > 0 && windowCounts[cRight] === targetCounts[cRight]) {
      formed++;
    }

    // Contract left while window is valid
    while (left <= right && formed === required) {
      const windowLen = right - left + 1;
      if (windowLen < minLen) {
        minLen = windowLen;
        minLeft = left;
      }

      const cLeft = s.charCodeAt(left);
      windowCounts[cLeft]--;
      if (targetCounts[cLeft] > 0 && windowCounts[cLeft] < targetCounts[cLeft]) {
        formed--;
      }
      left++;
    }
  }

  return minLen === Infinity ? "" : s.substring(minLeft, minLeft + minLen);
}`,
          explanation:
            "Tracks character frequencies via a flat 128-byte array. Right pointer expands to fulfill target constraints, and Left pointer contracts to find the minimal valid window. Both pointers move forward monotonically, taking $O(N + M)$ time.",
          timeComplexity: "O(|S| + |T|)",
          spaceComplexity: "O(1) flat 128-byte ASCII table",
        },
        {
          label: "Stage 3: High-Performance Flat Ring-Buffer Monotonic Deque Engine",
          code: `export class FastMonotonicDeque {
  private buffer: Int32Array; // Circular ring buffer storing array indices
  private head: number;
  private tail: number;
  private capacity: number;
  private mask: number;

  constructor(maxWindowSize: number) {
    let cap = 1;
    while (cap <= maxWindowSize + 2) cap <<= 1;
    this.capacity = cap;
    this.mask = cap - 1;
    this.buffer = new Int32Array(cap);
    this.head = 0;
    this.tail = 0;
  }

  // Sliding Window Maximum using Flat TypedArray Ring-Buffer with zero GC
  public static computeWindowMax(nums: Int32Array, k: number): Int32Array {
    const n = nums.length;
    if (n === 0 || k === 0) return new Int32Array(0);

    const result = new Int32Array(n - k + 1);
    let resIdx = 0;

    // Allocate flat deque index buffer
    const deque = new Int32Array(n);
    let head = 0;
    let tail = 0; // [head, tail)

    for (let i = 0; i < n; i++) {
      const val = nums[i];

      // 1. Remove indices that fall outside current window [i - k + 1, i]
      if (head < tail && deque[head] < i - k + 1) {
        head++;
      }

      // 2. Maintain decreasing monotonicity: pop elements <= current val from back
      while (head < tail && nums[deque[tail - 1]] <= val) {
        tail--;
      }

      // 3. Push current index
      deque[tail++] = i;

      // 4. Record front as maximum when window span reaches k
      if (i >= k - 1) {
        result[resIdx++] = nums[deque[head]];
      }
    }

    return result;
  }
}`,
          explanation:
            "Stage 3 demonstrates a flat `Int32Array` Monotonic Deque. Eliminating object wrappers and linked nodes ensures zero garbage collection pauses and optimal L1 data cache streaming.",
          timeComplexity: "O(N) strictly linear time (at most 2N queue operations)",
          spaceComplexity: "O(N) contiguous pre-allocated buffer",
        },
      ],
      stepByStep: [
        "Initialize sliding window state (frequency array or flat monotonic deque).",
        "Expand right pointer $R$, incorporating $A[R]$ into the window state in $O(1)$ time.",
        "Contract left pointer $L$ until the window satisfies the required invariant, recording the optimal window or adding $(R - L + 1)$ to the result count.",
      ],
    },
  ],
};
