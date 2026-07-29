# Chapter 26: String Algorithms — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 26: String Algorithms  
> **Target Category**: `tries_and_strings` ("Tries & Strings")

---

## 1. Chapter Overview & Subtopics

Chapter 26 covers string pattern matching, prefix structures, hashing, and linear string algorithms across 4 main sections:

1. **26.1 String Terminology**
   - Alphabet $\Sigma$, Substrings, Prefixes, Suffixes
   - **Border of a string**: A substring that is both a proper prefix and a proper suffix
   - Period of a string and string repetition rules

2. **26.2 Trie Structure**
   - Tree structure storing strings where edges represent characters
   - Insertion, Search, Prefix Count in $O(k)$ time where $k$ is string length
   - Bitwise Trie for numbers (storing 32-bit integers bit by bit)

3. **26.3 String Hashing**
   - Polynomial Rolling Hash: $h(s) = (\sum_{i=0}^{n-1} s[i] p^i) \bmod m$
   - Precomputing prefix hashes and power values for $O(1)$ arbitrary substring hash lookup
   - Collision reduction via Double Hashing with two different prime moduli

4. **26.4 Z-algorithm**
   - **$Z$-array**: $Z[i]$ stores the length of the longest common prefix between $s$ and suffix $s[i \dots n-1]$
   - Linear $O(n)$ construction using sliding match box $[l, r]$
   - Pattern matching by constructing concatenated string $p + \# + t$

---

## 2. Currently Implemented in App

The app currently has **4 active algorithms** under `tries_and_strings` covering topics from Chapter 26:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `trie-prefix-tree` | **Trie (Prefix Tree)** | Section 26.2 — Basic prefix tree insertion and search |
| `string-hashing` | **Polynomial Rolling String Hashing** | Section 26.3 — $O(1)$ substring hash matching |
| `z-algorithm` | **Z-Algorithm String Matching** | Section 26.4 — $Z$-array construction and pattern search |
| `kmp-string-match` | **KMP String Matching** | Related — Prefix function $\pi[i]$ and Knuth-Morris-Pratt matcher |

---

## 3. Missing Questions & Implementation Roadmap

The following advanced string algorithms are missing from the current registry and are prime candidates for implementation:

### 1. Bitwise Trie for Maximum XOR Pair
- **Book Reference**: Section 26.2 ("Trie structure", p. 244–245)
- **Concept**: Inserting binary bit representations into a Trie and querying opposite bit paths to maximize bitwise XOR.
- **Matching LeetCode Question**:
  - [LC 421: Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/)

### 2. Aho-Corasick Automaton (Multi-Pattern String Search)
- **Book Reference**: Section 26.2 ("Trie structure", p. 245)
- **Concept**: Constructing BFS failure links over a Trie to match multiple pattern strings simultaneously in text stream in $O(|T| + \sum |P_i|)$.
- **Matching LeetCode Question**:
  - [LC 1032: Stream of Characters](https://leetcode.com/problems/stream-of-characters/)

### 3. Manacher's Algorithm (Longest Palindromic Substring)
- **Book Reference**: Section 26.1 & 26.4 ("String terminology & Z-algorithm", p. 243, 247)
- **Concept**: Linear $O(N)$ algorithm for finding all palindrome radii and the longest palindromic substring.
- **Matching LeetCode Question**:
  - [LC 5: Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring/)

### 4. Suffix Array & LCP Array (Kasai's Algorithm)
- **Book Reference**: Section 26.1 ("String terminology", p. 243)
- **Concept**: Sorting all suffixes of a string in $O(N \log N)$ and computing adjacent LCP values in $O(N)$ for string analysis.
- **Matching LeetCode Question**:
  - [LC 1044: Longest Duplicate Substring](https://leetcode.com/problems/longest-duplicate-substring/)
