import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_tries_and_strings_c1_p1",
  pageNumber: 1,
  title: "String Topologies, Automata Theory & Suffix Factorization",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "The String Indexing Crisis & Deterministic Automata",
      content:
        "Text search is the backbone of search engines, compilers, DNA genome sequence alignment, and network packet intrusion detection (DPI). Searching for a set of patterns $\\mathcal{P} = \\{P_1, \\dots, P_k\\}$ of total length $M$ across a text $T$ of length $N$ using naive substring comparisons requires catastrophic $\\Theta(N \\cdot M)$ execution time. Advanced string algorithms model strings as transition graphs over Deterministic Finite Automata (DFA), Suffix Trees, and Suffix Automata, linearizing search and factor matching to $O(N + M)$ optimal time.",
    },
    {
      type: "prose",
      title: "Taxonomy of Advanced String & Prefix Data Structures",
      content:
        "String processing algorithms operate across distinct algebraic and automata-theoretic representations:\n\n1. **Prefix Topologies & Multi-Pattern Automata (Tries & Aho-Corasick):**\n   - **Radix Trie (Prefix Tree):** Maps a dictionary of words into a rooted tree sharing common prefixes. Lookups take $O(L)$ time for word of length $L$, independent of dictionary size $K$.\n   - **Aho-Corasick Automaton:** Constructs a Trie augmented with **Failure Links** and **Dictionary Output Links** via BFS. Simultaneously searches for all $K$ patterns across text $T$ in strictly $O(|T| + \\sum |P_i| + \\text{matches})$ linear time.\n\n2. **Linear-Time Single-Pattern Matching (KMP & Z-Algorithm):**\n   - **Knuth-Morris-Pratt (KMP):** Precomputes the **Prefix Function** $\\pi[i] = \\max \\{ k < i \\mid S[0 \\dots k-1] = S[i-k+1 \\dots i] \\}$ (the length of the longest proper prefix of $S[0 \\dots i]$ that is also a suffix). Enables linear-time matching without backtracking.\n   - **Z-Algorithm:** Precomputes $Z[i] = \\max \\{ k \\mid S[i \\dots i+k-1] = S[0 \\dots k-1] \\}$ (longest common prefix between $S$ and suffix starting at $i$) in $O(N)$ time.\n\n3. **Suffix Factorization & Full-Text Indexing (Suffix Automaton & Suffix Array):**\n   - **Suffix Automaton (SAM):** The minimal Deterministic Finite Automaton recognizing all suffixes of string $S$. Uses right-end position equivalence classes ($endpos$). Compactly represents all $O(N^2)$ substrings in strictly $\\le 2N - 1$ states and $\\le 3N - 4$ transitions.\n   - **Suffix Array (SA + LCP):** Lexicographically sorted array of all suffixes. Combined with Kasai's Longest Common Prefix (LCP) algorithm, answers substring search in $O(M + \\log N)$ and pattern counting in $O(M)$ via FM-index / Burrows-Wheeler Transform (BWT).",
    },
    {
      type: "mental_model",
      title: "Aho-Corasick Failure DAG & KMP Prefix Function State Machine",
      visualIntuition: `
=== KMP PREFIX FUNCTION pi[i] ON STRING "ababcaba" ===
Index:   0   1   2   3   4   5   6   7
Char:    a   b   a   b   c   a   b   a
pi[i]:   0   0   1   2   0   1   2   3

pi[7] = 3: Substring "ababcaba" has matching proper prefix & suffix "aba" (len 3).

=== AHO-CORASICK AUTOMATON (Dictionary: {"he", "she", "his", "hers"}) ===
               (root)
             /   |   \\
          'h'   's'   'r'
          /       |
        (h)      (s)
       /   \\      |
     'e'   'i'   'h'
     /       \\    |
  *(he)*    (hi) (sh)
   |          |    |
  'r'        's'  'e'
   |          |    |
 (her)     *(his)**(she)*
   |
  's'
   |
*(hers)*

Failure Links (Dashed):
  (she) ──fail──> (he) ──fail──> (e) ──fail──> (root)
  (his) ──fail──> (s)
      `,
      invariant:
        "Failure Link Invariant: For any node $u$ in the Trie representing prefix string $w$, the failure link points to node $v = \\text{fail}(u)$ representing the longest proper suffix of $w$ that exists as a valid node in the Trie.",
      stateTransitions:
        "KMP State Jump: While $j > 0$ and $P[i] \\neq P[j]$, $j \\leftarrow \\pi[j-1]$. If $P[i] == P[j]$, $j \\leftarrow j + 1$.\nAho-Corasick Step: Next state $\\delta(u, c) = \\text{child}(u, c)$ if exists; else $\\delta(\\text{fail}(u), c)$.",
      naiveBottleneck:
        "Testing pattern $P$ of length $M$ at each of the $N$ text positions causes redundant character re-comparisons, degrading to $\\Theta(N \\cdot M)$ on repetitive texts (e.g. searching $a^m$ inside $a^n$).",
      optimalInsight:
        "By caching the longest matching prefix-suffix overlap in a deterministic state transition graph, the text scanner never rewinds its pointer, achieving linear $O(N)$ throughput.",
    },
  ],
};
