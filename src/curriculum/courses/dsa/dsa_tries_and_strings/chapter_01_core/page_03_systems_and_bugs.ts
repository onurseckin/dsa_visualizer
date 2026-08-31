import type { CoursePage } from "../../../../courseTypes";

export const page3: CoursePage = {
  id: "dsa_tries_and_strings_c1_p3",
  pageNumber: 3,
  title: "Microarchitecture Realities & Production Traps",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Memory Hierarchy, Double-Array Tries & Double Hashing Security",
      content:
        "High-throughput text search in web crawlers, compilers, and network security appliances faces severe memory bandwidth constraints:\n\n1. **Pointer Dereference Bloat in Classical Tries:** A standard Trie node (`struct Node { Node* child[26]; bool isWord; }`) consumes $26 \\times 8 + 8 = 216$ bytes on 64-bit systems. For a vocabulary of $10^6$ nodes, this requires $216$ MB of RAM, with $>92\\%$ of pointers being empty `null` values that induce TLB thrashing. Compact **Double-Array Tries (DAT)** store transitions inside two flat integer arrays (`base` and `check`), reducing memory to 8 bytes per state and packing 8 states per 64-byte L1 cache line.\n2. **Birthday Attack Collisions in Rolling Hashes:** Single polynomial hashing modulo $M = 10^9 + 7$ has collision probability $>50\\%$ after hashing $\\sqrt{M} \\approx 31,622$ distinct substrings due to the Birthday Paradox. In production plagiarism detection or deduplication, **Double Hashing** with co-prime moduli ($M_1 = 10^9 + 7, M_2 = 10^9 + 9$) expands the hash space to $M_1 \\times M_2 \\approx 10^{18}$, reducing collision risk to zero in practice.\n3. **Branch Elimination in Direct DFA Streaming:** By compiling Aho-Corasick failure links into direct state transition tables (`next[u][c]`), text scanning executes with zero conditional branches (`if-else`), allowing CPU pipelined execution units to process one character per clock cycle.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps, Output Set Propagation & UTF-8 Encoding",
      content:
        "1. **Aho-Corasick Output Match Omission:** If pattern 'art' is embedded inside pattern 'smart', visiting the node for 'smart' will fail to detect 'art' unless match counts are recursively aggregated along failure links during BFS compilation (`outCount[u] += outCount[fail[u]]`).\n2. **KMP Fallback Indexing Off-by-One:** When encountering a mismatch at pattern position $j$, resetting to `j = pi[j]` instead of `j = pi[j - 1]` causes infinite loops or skipped pattern prefixes.\n3. **UTF-8 Multi-Byte Surrogate Split:** JavaScript and Java strings use UTF-16 code units. Hashing or indexing strings containing 4-byte characters (e.g. mathematical symbols, emojis) splits them into high/low surrogates, corrupting trie character code maps (`charCode - 97`). Production string parsers must decode raw UTF-8 byte streams or iterate by full Unicode code points.\n4. **Suffix Automaton Clone State Link Leak:** In Suffix Automaton construction, when splitting state $q$ into a cloned state $clone$ with $\\text{len}(clone) = \\text{len}(p) + 1$, all parent transitions along $p$'s suffix link chain pointing to $q$ must be redirected to $clone$. Leaving dangling pointers corrupts the suffix link tree.",
    },
    {
      type: "callout",
      variant: "theoretical",
      title: "Full-Text Indexing: Suffix Automata (SAM) vs FM-Index / BWT",
      content:
        "Modern genomic sequence search and search engine indices utilize compact full-text indices:\n- **Suffix Automaton (SAM) Equivalence Classes:** Substrings are grouped by their exact right-end occurrences ($endpos$). SAM answers substring existence queries in $O(|P|)$ time and counts distinct substrings in $O(N)$ time by summing $\\sum_{u \\in \\text{SAM}} (\\text{len}(u) - \\text{len}(\\text{link}(u)))$.\n- **Burrows-Wheeler Transform (BWT) & FM-Index:** Reversibly permutes text characters by sorting all cyclic shifts. Combined with Wavelet Trees or checkpointed rank arrays, the FM-index answers pattern count queries in strictly $O(|P|)$ time while compressing text to its entropy limit (e.g. human genome of 3 billion base pairs compressed to $< 1$ GB).",
    },
    {
      type: "prose",
      title: "String Algorithm Selection Matrix",
      content: `
| Algorithm | Preprocessing Time | Search Time | Pattern Type | Memory Complexity | Application Domain |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Naive Search** | $O(1)$ | $O(N \\cdot M)$ | Single pattern | $O(1)$ | Tiny strings ($N, M < 50$) |
| **KMP** | $O(M)$ | $O(N)$ | Single pattern | $O(M)$ | Stream search, single keyword filter |
| **Z-Algorithm** | $O(M)$ | $O(N)$ | Single pattern | $O(M)$ | Prefix matching, period detection |
| **Rabin-Karp** | $O(M)$ | $O(N)$ avg, $O(NM)$ worst | Multiple / Single | $O(1)$ | Plagiarism, 2D matrix matching |
| **Aho-Corasick** | $O(\\sum |P_i| \\cdot \\Sigma)$ | $O(N + \\text{matches})$ | Multi-pattern dictionary | $O(\\sum |P_i| \\cdot \\Sigma)$ | Antivirus signatures, URL routing |
| **Suffix Automaton** | $O(N \\cdot \\Sigma)$ | $O(M \\cdot \\Sigma)$ | Dynamic text substrings | $O(N \\cdot \\Sigma)$ | Distinct substring counting, bioinformatics |
| **Suffix Array + LCP** | $O(N \\log N)$ or $O(N)$ | $O(M + \\log N)$ | Static full text | $O(N)$ | Genomic search, search engine inverted index |
      `,
    },
  ],
};
