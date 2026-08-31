import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_tries_and_strings_c1_p2",
  pageNumber: 2,
  title: "Formal Proofs & 3-Stage Implementation Progression",
  sections: [
    {
      type: "math_proof",
      title: "Theorem 1: KMP Prefix Function Amortized Linear Bound via Potential Method",
      theorem:
        "The Knuth-Morris-Pratt prefix function computation $\\pi[0 \\dots N-1]$ for a string $S$ of length $N$ executes in at most $2N$ character comparisons, strictly running in $\\Theta(N)$ worst-case time.",
      proof: `
**Proof via Potential Method:**
1. Define the potential function $\\Phi_i = j_i = \\pi[i]$ after processing index $i$, where $0 \\le \\Phi_i \\le i + 1$.
2. Note that $\\Phi_0 = \\pi[0] = 0$. Since $\\pi[i] \\ge 0$, the potential is always non-negative: $\\Phi_i \\ge 0$ for all $i$.
3. When processing index $i$ to compute $\\pi[i]$, we initialize candidate length $j = \\pi[i-1] = \\Phi_{i-1}$.
4. The while loop condition 'while (j > 0 && S[i] !== S[j]) j = pi[j-1]' executes $k_i \\ge 0$ iterations.
5. In each iteration of the while loop, $j$ strictly decreases: $\\pi[j-1] \\le j - 1$, so $j$ drops by at least 1.
6. Thus, after the while loop, the value of $j$ has decreased by at least $k_i$.
7. Next, if $S[i] == S[j]$, $j$ increases by 1 ($j \\leftarrow j + 1$). If $S[i] \\neq S[j]$ (and $j=0$), $j$ remains 0.
8. The final value $\\Phi_i = \\pi[i] \\le \\Phi_{i-1} - k_i + 1$.
9. Rearranging terms for the number of while loop comparisons $k_i$:
   $$k_i \\le \\Phi_{i-1} - \\Phi_i + 1$$
10. The total number of character comparisons across all $N$ steps is:
    $$\\text{Total Comparisons} \\le \\sum_{i=1}^{N-1} (k_i + 1) \\le \\sum_{i=1}^{N-1} (\\Phi_{i-1} - \\Phi_i + 2)$$
11. The potential terms telescope:
    $$\\sum_{i=1}^{N-1} (\\Phi_{i-1} - \\Phi_i) = \\Phi_0 - \\Phi_{N-1} = 0 - \\pi[N-1] \\le 0$$
12. Therefore:
    $$\\text{Total Comparisons} \\le 2(N - 1) - \\pi[N-1] \\le 2N$$
Thus, computing the KMP prefix table is guaranteed to take $O(N)$ operations with an exact comparison bound of $\\le 2N$. $\\blacksquare$
      `,
    },
    {
      type: "math_proof",
      title: "Theorem 2: Suffix Automaton Linear State and Transition Bounds",
      theorem:
        "For any string $S$ of length $N \\ge 2$, the minimal Suffix Automaton (SAM) recognizes all $O(N^2)$ substrings of $S$ using at most $2N - 1$ states (vertices) and at most $3N - 4$ transitions (directed edges).",
      proof: `
**Proof of Linear State Bound ($|V| \\le 2N - 1$):**
1. Each state in a Suffix Automaton corresponds to an equivalence class of substrings having identical sets of end-positions:
   $$endpos(u) = \\{ r \\mid S[r - |w| + 1 \\dots r] = w \\}$$
2. For any two states $u$ and $v$, their end-position sets $endpos(u)$ and $endpos(v)$ are either disjoint ($endpos(u) \\cap endpos(v) = \\emptyset$) or one is a strict subset of the other ($endpos(u) \\subset endpos(v)$).
3. Therefore, the family of all $endpos$ equivalence classes forms a laminar tree hierarchy (the Suffix Link Tree / Link DAG).
4. The leaf nodes of this tree correspond to non-empty distinct end-positions corresponding to prefixes of $S$. There are at most $N$ such prefix end-positions.
5. In any rooted tree where every internal node has at least two children, a tree with $\\le N$ leaves has at most $N - 1$ internal nodes.
6. The root state (representing the empty string with $endpos = \\{0, 1, \\dots, N\\}$) adds 1 state.
7. Summing leaves and internal nodes:
   $$|States| \\le N + (N - 1) = 2N - 1$$

**Proof of Linear Transition Bound ($|E| \\le 3N - 4$):**
1. Select a spanning tree of the DAG of transitions rooted at the initial state. The spanning tree contains $|V| - 1 \\le 2N - 2$ tree edges.
2. Every non-tree transition $(u, v)$ with label $c$ can be uniquely associated with a suffix of $S$ by following tree edges from root to $u$, taking non-tree edge $(u, v)$, and following the lexicographically smallest path to an accepting state.
3. Because $S$ has exactly $N$ non-empty suffixes, the number of non-tree transitions is at most $N - 1$ (for $N \\ge 3$, tightened to $N - 2$).
4. Total transitions $|E| = |E_{\\text{tree}}| + |E_{\\text{non-tree}}| \\le (2N - 2) + (N - 2) = 3N - 4$. $\\blacksquare$
      `,
    },
    {
      type: "code_progression",
      title: "3-Stage Code Progression",
      language: "typescript",
      stages: [
        {
          label: "Stage 1: Naive Nested Substring Search Baseline",
          code: `export function substringSearchNaive(text: string, pattern: string): number[] {
  const n = text.length;
  const m = pattern.length;
  const matches: number[] = [];

  for (let i = 0; i <= n - m; i++) {
    let match = true;
    for (let j = 0; j < m; j++) {
      if (text[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) matches.push(i);
  }
  return matches;
}`,
          explanation:
            "Exhaustive brute force re-checks characters from scratch on every mismatch. On adversarial strings (e.g. searching $a^m b$ inside $a^n$), runtime explodes to $\\Theta(N \\cdot M)$, causing catastrophic slowdown.",
          timeComplexity: "O(N * M)",
          spaceComplexity: "O(1)",
        },
        {
          label: "Stage 2: Knuth-Morris-Pratt (KMP) Linear String Matcher",
          code: `export class KMPMatcher {
  private pattern: string;
  private pi: Int32Array;

  constructor(pattern: string) {
    this.pattern = pattern;
    this.pi = this.computePrefixFunction(pattern);
  }

  // Precompute pi[i] in O(M) time
  private computePrefixFunction(p: string): Int32Array {
    const m = p.length;
    const pi = new Int32Array(m);
    let j = 0;

    for (let i = 1; i < m; i++) {
      while (j > 0 && p[i] !== p[j]) {
        j = pi[j - 1]; // Fallback to longest proper prefix-suffix
      }
      if (p[i] === p[j]) j++;
      pi[i] = j;
    }
    return pi;
  }

  // Search text in O(N) time with zero character backtracking
  public search(text: string): number[] {
    const matches: number[] = [];
    const n = text.length;
    const m = this.pattern.length;
    if (m === 0) return matches;

    let j = 0;
    for (let i = 0; i < n; i++) {
      while (j > 0 && text[i] !== this.pattern[j]) {
        j = this.pi[j - 1];
      }
      if (text[i] === this.pattern[j]) j++;

      if (j === m) {
        matches.push(i - m + 1);
        j = this.pi[j - 1]; // Reset to find overlapping occurrences
      }
    }
    return matches;
  }
}`,
          explanation:
            "KMP utilizes the precomputed prefix function $\\pi$ to shift the pattern forward across the text. The text pointer $i$ never rewinds, guaranteeing strict $O(N + M)$ execution time.",
          timeComplexity: "O(N + M)",
          spaceComplexity: "O(M) prefix table",
        },
        {
          label: "Stage 3: High-Performance Flat-Array Aho-Corasick Automaton",
          code: `export class FastAhoCorasick {
  private maxNodes: number;
  private alphabetSize: number;
  private next: Int32Array; // Flattened 2D transition table: next[node * alphabetSize + charCode]
  private fail: Int32Array;
  private outCount: Int32Array; // Number of dictionary pattern matches ending at node
  private outPatternIdx: Int32Array; // Pattern ID ending at node (-1 if none)
  private nodeCount: number;

  constructor(maxTotalChars: number = 200000, alphabetSize: number = 26) {
    this.maxNodes = maxTotalChars + 5;
    this.alphabetSize = alphabetSize;
    this.next = new Int32Array(this.maxNodes * alphabetSize).fill(-1);
    this.fail = new Int32Array(this.maxNodes);
    this.outCount = new Int32Array(this.maxNodes);
    this.outPatternIdx = new Int32Array(this.maxNodes).fill(-1);
    this.nodeCount = 1; // Root is node 0
  }

  // Insert pattern into Trie
  public insert(pattern: string, patternId: number): void {
    let u = 0;
    for (let i = 0; i < pattern.length; i++) {
      const c = pattern.charCodeAt(i) - 97; // 'a' -> 0
      const cell = u * this.alphabetSize + c;
      if (this.next[cell] === -1) {
        this.next[cell] = this.nodeCount++;
      }
      u = this.next[cell];
    }
    this.outCount[u]++;
    this.outPatternIdx[u] = patternId;
  }

  // Build Failure links and convert Trie into DFA transition graph via BFS
  public buildAutomaton(): void {
    const queue = new Int32Array(this.nodeCount);
    let qHead = 0;
    let qTail = 0;

    // Base level transitions from root (node 0)
    for (let c = 0; c < this.alphabetSize; c++) {
      const cell = 0 * this.alphabetSize + c;
      const v = this.next[cell];
      if (v !== -1) {
        this.fail[v] = 0;
        queue[qTail++] = v;
      } else {
        this.next[cell] = 0; // Point back to root
      }
    }

    // BFS Queue processing
    while (qHead < qTail) {
      const u = queue[qHead++];
      const uFail = this.fail[u];

      // Accumulate output counts from suffix failure links
      this.outCount[u] += this.outCount[uFail];

      for (let c = 0; c < this.alphabetSize; c++) {
        const uCell = u * this.alphabetSize + c;
        const v = this.next[uCell];
        const failTarget = this.next[uFail * this.alphabetSize + c];

        if (v !== -1) {
          this.fail[v] = failTarget;
          queue[qTail++] = v;
        } else {
          // Direct DFA state compression: eliminate runtime fail link traversal
          this.next[uCell] = failTarget;
        }
      }
    }
  }

  // Match all dictionary patterns across text in O(|T|) time
  public matchText(text: string): { position: number; count: number }[] {
    const results: { position: number; count: number }[] = [];
    let u = 0;

    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i) - 97;
      if (c >= 0 && c < this.alphabetSize) {
        u = this.next[u * this.alphabetSize + c];
      } else {
        u = 0; // Reset to root on out-of-alphabet character
      }

      if (this.outCount[u] > 0) {
        results.push({ position: i, count: this.outCount[u] });
      }
    }
    return results;
  }
}`,
          explanation:
            "Stage 3 pre-flattens the Aho-Corasick automaton into a complete Deterministic Finite Automaton (DFA) transition matrix. During text scanning, character transitions evaluate in 1 direct array lookup (`next[u * 26 + c]`) without while loops or failure link traversal, maximizing instruction pipelining.",
          timeComplexity: "Build: O(sum |P_i| * alphabetSize), Scan: O(|T|)",
          spaceComplexity: "Flat typed arrays, zero heap allocation during text search",
        },
      ],
      stepByStep: [
        "Construct Trie of all target dictionary patterns in $O(\\sum |P_i|)$.",
        "Run BFS to compute Failure Links $\\text{fail}(u)$ and merge output match sets.",
        "Flatten failure transitions into direct DFA state jumps: $\\text{next}[u][c] \\leftarrow \\text{next}[\\text{fail}(u)][c]$.",
        "Stream text $T$ through the DFA in strictly $O(|T|)$ clock cycles.",
      ],
    },
  ],
};
