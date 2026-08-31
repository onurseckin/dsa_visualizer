import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_two_pointers_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: Container With Most Water Optimal Elimination Invariant",
      theorem:
        "Let $H = (h_0, h_1, \\dots, h_{n-1})$ be an array of non-negative heights. Let the area between indices $i < j$ be $\\text{Area}(i, j) = \\min(h_i, h_j) \\cdot (j - i)$. The two-pointer algorithm starting with $L = 0$ and $R = n-1$ that advances the pointer with the smaller height strictly preserves the optimal container $(i^*, j^*)$ and finds $\\max_{i < j} \\text{Area}(i, j)$ in at most $n - 1$ steps.",
      proof: `
**Proof via Candidate Space Reduction & Induction:**
1. Let $S_t = \\{ (i, j) \\mid L_t \\le i < j \\le R_t \\}$ be the set of candidate pairs remaining at step $t$.
2. At step $t=0$, $L_0 = 0$ and $R_0 = n-1$, so $S_0$ contains all $\\binom{n}{2}$ pairs. The optimal pair $(i^*, j^*) \\in S_0$.
3. **Inductive Hypothesis:** Assume $(i^*, j^*) \\in S_t$ at step $t$.
4. At step $t$, the algorithm evaluates current pair $(L_t, R_t)$ with area $\\text{Area}(L_t, R_t) = \\min(h_{L_t}, h_{R_t}) \\cdot (R_t - L_t)$.
5. **Case 1 ($h_{L_t} \\le h_{R_t}$):**
   - The algorithm advances $L_{t+1} = L_t + 1$ and sets $R_{t+1} = R_t$.
   - The pairs eliminated from $S_t$ to form $S_{t+1}$ are $E = \\{ (L_t, k) \\mid L_t < k < R_t \\}$.
   - For every eliminated pair $(L_t, k) \\in E$:
     $$\\text{Area}(L_t, k) = \\min(h_{L_t}, h_k) \\cdot (k - L_t) \\le h_{L_t} \\cdot (k - L_t)$$
   - Since $k < R_t$, $(k - L_t) < (R_t - L_t)$.
   - Furthermore, because $h_{L_t} \\le h_{R_t}$, $\\min(h_{L_t}, h_{R_t}) = h_{L_t}$.
   - Thus:
     $$\\text{Area}(L_t, k) \\le h_{L_t} \\cdot (k - L_t) < h_{L_t} \\cdot (R_t - L_t) = \\text{Area}(L_t, R_t)$$
   - Since every eliminated pair has area strictly less than the evaluated pair $(L_t, R_t)$, no pair in $E$ can be the global maximum $(i^*, j^*)$ (unless $(L_t, R_t)$ is already maximal, in which case $(i^*, j^*) = (L_t, R_t)$ was already recorded).
   - Therefore, $(i^*, j^*) \\in S_{t+1} \\cup \\{ (L_t, R_t) \\}$.
6. **Case 2 ($h_{R_t} < h_{L_t}$):**
   - By symmetric reasoning, eliminating pairs $\\{ (k, R_t) \\mid L_t < k < R_t \\}$ discards no strictly larger container.
7. Since $R_t - L_t$ decreases by 1 in each step, the algorithm terminates after exactly $n - 1$ steps, having visited $(i^*, j^*)$ with $100\\%$ certainty. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Floyd's Cycle Detection Algebraic Convergence Theorem",
      theorem:
        "Let a directed sequence be defined by $x_{i+1} = f(x_i)$ with a tail of length $\\mu \\ge 0$ leading to a cycle of length $\\lambda \\ge 1$. If a slow pointer moves at speed 1 ($s_i = x_i$) and a fast pointer moves at speed 2 ($f_i = x_{2i}$), they will meet at step $k = \\mu + (\\lambda - (\\mu \\pmod \\lambda)) \\le \\mu + \\lambda$. Furthermore, resetting one pointer to $x_0$ and stepping both at speed 1 causes them to collide at the exact cycle entry node $x_\\mu$ after $\\mu$ steps.",
      proof: `
**Proof via Modular Arithmetic:**
1. Let $x_0, x_1, \\dots, x_{\\mu-1}$ be the acyclic tail, and $x_\\mu, \\dots, x_{\\mu+\\lambda-1}$ be the cycle nodes, where $x_{\\mu + j} = x_{\\mu + (j \\pmod \\lambda)}$.
2. At step $i \\ge \\mu$, both pointers are inside the cycle:
   - Slow pointer location: $s_i = x_{\\mu + ((i - \\mu) \\pmod \\lambda)}$.
   - Fast pointer location: $f_i = x_{\\mu + ((2i - \\mu) \\pmod \\lambda)}$.
3. Pointers collide when their positions within the cycle coincide:
   $$(2i - \\mu) \\equiv (i - \\mu) \\pmod \\lambda \\iff i \\equiv 0 \\pmod \\lambda$$
4. The first integer $i \\ge \\mu$ such that $i$ is a multiple of $\\lambda$ ($i = m \\lambda$) is:
   $$k = \\mu + (\\lambda - (\\mu \\pmod \\lambda))$$
   (or $k = \\mu$ if $\\mu \\equiv 0 \\pmod \\lambda$). Since $\\lambda - (\\mu \\pmod \\lambda) \\le \\lambda$, $k \\le \\mu + \\lambda$.
5. **Phase 2 Cycle Entry Extraction:**
   - At collision step $k$, $k$ is an exact multiple of $\\lambda$: $k = m \\lambda$.
   - Place pointer $P_1$ at the head $x_0$, and keep pointer $P_2$ at the collision node $x_k = x_{m \\lambda}$.
   - Advance both pointers $P_1$ and $P_2$ one step at a time ($P_1 \\leftarrow f(P_1), P_2 \\leftarrow f(P_2)$).
   - After exactly $\\mu$ steps:
     - $P_1$ reaches $x_\\mu$ (the start of the cycle).
     - $P_2$ reaches $x_{k + \\mu} = x_{m \\lambda + \\mu} = x_\\mu$ (since $m\\lambda$ wraps around the cycle).
   - Thus, $P_1$ and $P_2$ meet at the exact cycle start node $x_\\mu$ in $\\mu$ steps.
6. Total time is $O(\\mu + \\lambda) = O(N)$ using strictly $O(1)$ auxiliary memory. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive O(N^2) Container Search Baseline",
          code: `export function maxAreaNaive(heights: number[]): number {
  const n = heights.length;
  let maxVolume = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const h = Math.min(heights[i], heights[j]);
      const w = j - i;
      const area = h * w;
      if (area > maxVolume) maxVolume = area;
    }
  }
  return maxVolume;
}`,
          explanation:
            "Exhaustive pairwise checking evaluates all $\\binom{N}{2}$ containers. Runtime is strictly $\\Theta(N^2)$, causing severe performance degradation for arrays of size $N > 10^4$.",
          timeComplexity: "O(N^2)",
          spaceComplexity: "O(1)",
        },
        {
          label: "Stage 2: Optimal Two-Pointer Container & 3-Sum Scanner",
          code: `export function maxAreaTwoPointer(heights: number[]): number {
  let left = 0;
  let right = heights.length - 1;
  let maxVolume = 0;

  while (left < right) {
    const hL = heights[left];
    const hR = heights[right];
    const area = (hL < hR ? hL : hR) * (right - left);
    if (area > maxVolume) maxVolume = area;

    // Advance pointer at shorter wall
    if (hL <= hR) {
      left++;
    } else {
      right--;
    }
  }
  return maxVolume;
}

export function threeSum(nums: number[]): number[][] {
  const result: number[][] = [];
  const n = nums.length;
  // Sort in O(N log N)
  nums.sort((a, b) => a - b);

  for (let i = 0; i < n - 2; i++) {
    // Deduplicate outer pivot
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    if (nums[i] > 0) break; // Optimization: sum cannot be 0

    let left = i + 1;
    let right = n - 1;
    const target = -nums[i];

    while (left < right) {
      const sum = nums[left] + nums[right];
      if (sum === target) {
        result.push([nums[i], nums[left], nums[right]]);
        // Deduplicate inner pointers
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < target) {
        left++;
      } else {
        right--;
      }
    }
  }
  return result;
}`,
          explanation:
            "Stage 2 uses opposing inward-converging pointers. For Container With Most Water, runtime drops to $O(N)$. For 3-Sum, sorting followed by an $O(N)$ two-pointer inner scan solves the problem in $O(N^2)$ without hash table memory overhead.",
          timeComplexity: "Container: O(N), 3-Sum: O(N^2)",
          spaceComplexity: "O(1) auxiliary",
        },
        {
          label: "Stage 3: High-Performance Branchless Dutch National Flag & Trapping Rain Water",
          code: `export class TwoPointerSystemsEngine {
  // Dutch National Flag 3-Way Partition in strictly 1 pass and O(1) space
  public static sortColors(nums: Int32Array): void {
    let low = 0;
    let mid = 0;
    let high = nums.length - 1;

    while (mid <= high) {
      const val = nums[mid];
      if (val === 0) {
        // Swap nums[low] and nums[mid]
        const tmp = nums[low];
        nums[low] = nums[mid];
        nums[mid] = tmp;
        low++;
        mid++;
      } else if (val === 1) {
        mid++;
      } else {
        // Swap nums[mid] and nums[high]
        const tmp = nums[high];
        nums[high] = nums[mid];
        nums[mid] = tmp;
        high--; // Note: do not advance mid here; examine swapped element!
      }
    }
  }

  // Trapping Rain Water: O(N) time and strictly O(1) memory via 2-pointer prefix/suffix tracking
  public static trapRainWater(height: Int32Array): number {
    const n = height.length;
    if (n <= 2) return 0;

    let left = 0;
    let right = n - 1;
    let leftMax = 0;
    let rightMax = 0;
    let totalWater = 0;

    while (left < right) {
      if (height[left] <= height[right]) {
        if (height[left] >= leftMax) {
          leftMax = height[left];
        } else {
          totalWater += leftMax - height[left];
        }
        left++;
      } else {
        if (height[right] >= rightMax) {
          rightMax = height[right];
        } else {
          totalWater += rightMax - height[right];
        }
        right--;
      }
    }
    return totalWater;
  }
}`,
          explanation:
            "Stage 3 demonstrates in-place memory modifications on flat `Int32Array` buffers. Trapping Rain Water dynamically compares boundary maxima to calculate water column heights on the fly, eliminating auxiliary arrays.",
          timeComplexity: "O(N) strictly linear single pass",
          spaceComplexity: "O(1) strictly zero allocations",
        },
      ],
      stepByStep: [
        "Sort input array when searching for target sum pairs to establish monotonic search gradients.",
        "Establish boundary pointers ($L=0, R=N-1$) or multi-region partitioning indices (`low, mid, high`).",
        "At each iteration, evaluate the boundary predicate and advance the pointer that is mathematically proven to prune candidate space.",
      ],
    },
  ],
};
