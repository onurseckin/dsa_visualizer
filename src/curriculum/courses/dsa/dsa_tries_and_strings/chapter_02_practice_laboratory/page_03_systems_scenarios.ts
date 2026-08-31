import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_tries_and_strings_c2_p3",
  pageNumber: 3,
  title: "4-Part Socratic Diagnostic & Practice Suite",
  sections: [
    {
      type: "question_bank_suite",
      topicId: "dsa_tries_and_strings",
      title: "Tries and Strings Diagnostic Suite",
      partA_dsaCoding: [
        {
          title: "Stream of Characters Matching",
          problemId: "stream-of-characters-matching",
          difficulty: "Hard",
          description:
            "Design an algorithm that accepts a stream of characters one by one, returning true if any suffix of the characters received matches any word in a dictionary of $K$ words. Implement using Aho-Corasick DFA state transitions in $O(1)$ time per streamed query character.",
          rationale:
            "Tests online automata transition preservation and constant-time per-character query execution.",
        },
        {
          title: "Count Distinct Substrings in Linear Time",
          problemId: "count-distinct-substrings-sam",
          difficulty: "Hard",
          description:
            "Given a string $S$ of length $N$, compute the total number of distinct non-empty substrings in strictly $O(N)$ time and $O(N)$ memory using a Suffix Automaton (SAM).",
          rationale:
            "Evaluates state size properties where total substrings equals $\\sum_{u \\in \\text{SAM}} (\\text{len}(u) - \\text{len}(\\text{link}(u)))$.",
        },
        {
          title: "Shortest Palindrome via KMP Prefix Table",
          problemId: "shortest-palindrome-kmp",
          difficulty: "Hard",
          description:
            "Find the shortest palindrome by adding characters in front of a string $S$. Solve in $O(N)$ time by computing the KMP prefix function on $S + \\# + \\text{reverse}(S)$.",
          rationale:
            "Demonstrates string concatenation transformation to find the longest palindromic prefix.",
        },
        {
          title: "Longest Duplicate Substring via Double Rolling Hash",
          problemId: "longest-duplicate-substring",
          difficulty: "Hard",
          description:
            "Given a string $S$, find the longest substring that occurs at least twice. Solve in $O(N \\log N)$ time using binary search on length combined with Double Rolling Hashing ($M_1 = 10^9+7, M_2 = 10^9+9$).",
          rationale:
            "Tests collision-free rolling hash window sliding with logarithmic boundary bisection.",
        },
      ],
      partB_mathProofs: [
        {
          title: "Fine and Wilf Periodicity Lemma",
          statement:
            "Prove the Periodicity Lemma: If a string $S$ has periods of length $p$ and $q$ and $|S| \\ge p + q - \\gcd(p, q)$, then $S$ also has a period of length $\\gcd(p, q)$.",
          proofOutline:
            "Consider the graph of character equality constraints on indices modulo $p$ and $q$. The condition $|S| \\ge p + q - \\gcd(p, q)$ ensures that the equality relation connects every index in $\\mathbb{Z}_p \\times \\mathbb{Z}_q$ into connected components of size $\\gcd(p, q)$, proving the claim.",
          engineeringContext:
            "Critical for proving tight bounds on string matching algorithms and square-free string factorizations.",
        },
        {
          title: "Manacher's Algorithm Linear Time Palindrome Invariant",
          statement:
            "Prove that Manacher's Algorithm computes the palindrome radius array $R[i]$ for all centers in string $S$ of length $N$ in at most $2N$ character comparisons.",
          proofOutline:
            "Maintain the current rightmost palindrome boundary $[C - R[C], C + R[C]]$. For center $i > C$, mirror $i' = 2C - i$. If $R[i'] < R[C] - (i - C)$, symmetry guarantees $R[i] = R[i']$ in 0 comparisons. Otherwise, comparisons begin strictly beyond $C + R[C]$, advancing the right boundary monotonically to at most $2N$.",
          engineeringContext:
            "Used in bioinformatic DNA inverted repeat detection and RNA secondary structure stem-loop matching.",
        },
        {
          title: "Suffix Automaton Equivalence Class Laminar Tree Invariant",
          statement:
            "Prove that for any two substrings $u$ and $v$ with right end-position sets $endpos(u)$ and $endpos(v)$, either $endpos(u) \\cap endpos(v) = \\emptyset$, or $endpos(u) \\subseteq endpos(v)$ (which holds if and only if $v$ is a suffix of $u$).",
          proofOutline:
            "Assume without loss of generality that $|u| \\ge |v|$ and their intersection contains position $r \\in endpos(u) \\cap endpos(v)$. Since both $u$ and $v$ end at index $r$, $v$ must be a suffix of $u$. Therefore, wherever $u$ appears in $S$, $v$ must also appear at that exact same right endpoint, proving $endpos(u) \\subseteq endpos(v)$.",
          engineeringContext:
            "Guarantees that the suffix link tree is a valid mathematical forest with at most $2N-1$ nodes.",
        },
      ],
      partC_systemsQuestions: [
        {
          title: "Double-Array Trie (DAT) `base` and `check` Cache Locality",
          prompt:
            "How does a Double-Array Trie compress multi-gigabyte dictionary node pointers into two integer arrays (`base[s] + c = t` and `check[t] = s`), eliminating $90\\%$ of pointer memory and enabling direct L1 cache line prefetching?",
          engineeringContext:
            "Standard pointer tries waste memory on null pointers. DAT packs transitions into dense overlapping arrays where state validation is checked in 1 cycle (`check[base[s] + c] == s`).",
        },
        {
          title: "SIMD Vectorized Rolling Hash Calculation on AVX2",
          prompt:
            "Explain how AVX2 256-bit SIMD registers compute polynomial rolling hashes for 32 consecutive 8-character substrings in parallel using modular multiplication intrinsics.",
          engineeringContext:
            "Vectorizing sliding hash windows across 8 parallel lanes accelerates text deduplication in high-throughput database ingestion pipelines by $8\\times$.",
        },
        {
          title: "Multi-Core Parallel Text Search via Chunked Overlap Partitions",
          prompt:
            "When searching a 100 GB text file for thousands of Aho-Corasick signatures across 64 CPU cores, why must each chunk overlap by $\\max |P_i| - 1$ bytes to prevent boundary signature misses?",
          engineeringContext:
            "Splitting files across thread boundaries can truncate patterns crossing split offsets. Overlapping chunks by $\\max |P| - 1$ ensures zero boundary loss without expensive cross-thread synchronization.",
        },
      ],
      partD_stressTests: [
        {
          title: "Adversarial Birthday Collision on Single Modulo $10^9+7$",
          scenario:
            "Hashing $10^5$ distinct random strings using a polynomial rolling hash with a single modulus $P = 10^9 + 7$.",
          failureMode:
            "By the Birthday Paradox, collision probability exceeds $99.3\\%$, generating false positive matches and corrupted index tables.",
        },
        {
          title: "Deep Aho-Corasick Failure Link Traversal Degradation",
          scenario:
            "A dictionary with patterns $a, aa, aaa, \\dots, a^k$ is queried with text $a^N$ without compiling failure links into direct DFA state transitions.",
          failureMode:
            "The query engine traverses $O(k)$ failure links at each character, degrading text scanning from $O(N)$ to $O(N \\cdot k)$ (TLE).",
        },
        {
          title: "UTF-16 Surrogate Pair Code Point Boundary Tearing",
          scenario:
            "Indexing text containing 4-byte Unicode characters (emojis, CJK extension runes) using `string.charCodeAt()`.",
          failureMode:
            "Surrogate halves are treated as separate invalid ASCII characters, causing trie out-of-bounds indexing and corrupted pattern matching.",
        },
      ],
    },
  ],
};
