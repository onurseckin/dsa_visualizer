# Chapter 22: Combinatorics — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 22: Combinatorics  
> **Target Category**: `math_and_number_theory` ("Math & Number Theory")

---

## 1. Chapter Overview & Subtopics

Chapter 22 covers fundamental techniques in combinatorial counting and group symmetry, divided into 5 main sections:

1. **22.1 Binomial Coefficients**
   - Formula: $\binom{n}{k} = \frac{n!}{k!(n-k)!}$
   - Pascal's Identity: $\binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k}$
   - Sum Identities: $\sum_{k=0}^n \binom{n}{k} = 2^n$, Hockey-stick identity
   - Lucas' Theorem: Computing $\binom{n}{k} \pmod p$ via prime base-$p$ digit representations
   - Multinomial Coefficients: $\binom{n}{k_1, k_2, \dots, k_m} = \frac{n!}{k_1! k_2! \dots k_m!}$

2. **22.2 Catalan Numbers**
   - Recurrence & Closed-form: $C_n = \frac{1}{n+1} \binom{2n}{n} = \sum_{i=0}^{n-1} C_i C_{n-1-i}$
   - Combinatorial Applications:
     - Count of valid balanced parenthesis strings with $n$ pairs
     - Count of unlabeled binary trees with $n$ nodes
     - Dyck paths (grid paths from $(0,0)$ to $(n,n)$ staying on or above the diagonal)
     - Non-crossing partition of $n$ points on a circle & Polygon triangulations ($C_{n-2}$)

3. **22.3 Inclusion-Exclusion Principle**
   - Sets Union Formula: $|A_1 \cup A_2 \cup \dots \cup A_n| = \sum |A_i| - \sum |A_i \cap A_j| + \dots$
   - Derangements ($!n$): Count of permutations with no fixed points ($!n = (n-1)(!(n-1) + !(n-2))$)
   - Counting integers in range coprime to a given set of primes

4. **22.4 Burnside's Lemma**
   - Counting equivalence classes (orbits) under symmetry groups $G$: $\text{Orbits} = \frac{1}{|G|} \sum_{g \in G} |X^g|$
   - Necklet & Bracelet colorings (rotational and reflectional symmetries)
   - Grid coloring under 90°/180°/270° rotations

5. **22.5 Cayley's Formula**
   - Number of labeled trees on $n$ vertices is $n^{n-2}$
   - Prüfer Sequence: Bijective $O(n \log n)$ encoding/decoding between a labeled tree and a sequence of $n-2$ integers

---

## 2. Currently Implemented in App

The app currently has **3 active algorithms** under `math_and_number_theory` covering topics from Chapter 22:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `binomial-coefficients-pascal` | **Pascal / Binomial Coefficients** | Section 22.1 — Pascal's triangle DP $\binom{n}{k}$ construction |
| `catalan-numbers` | **Catalan Numbers** | Section 22.2 — Catalan number sequence generation via recurrence |
| `inclusion-exclusion-principle` | **Inclusion-Exclusion Subset Matrix** | Section 22.3 — Subset parity sum for set unions |

---

## 3. Missing Questions & Implementation Roadmap

The following combinatorial topics are missing from the current registry and are prime candidates for implementation:

### 1. Derangements (!n) — Inclusion-Exclusion & DP
- **Book Reference**: Section 22.3 ("Inclusion-exclusion", p. 212–213)
- **Concept**: Counting permutations of size $n$ where no element remains in its original index ($!n = n! \sum_{k=0}^n \frac{(-1)^k}{k!}$).
- **Matching LeetCode Question**:
  - [LC 634: Find the Derangement of An Array](https://leetcode.com/problems/find-the-derangement-of-an-array/)

### 2. Burnside's Lemma (Symmetry Orbit Counting)
- **Book Reference**: Section 22.4 ("Burnside's lemma", p. 214–215)
- **Concept**: Counting unique colorings or configurations invariant under rotational and reflectional symmetry groups.
- **Matching LeetCode Question**:
  - [LC 1088: Confusing Number II](https://leetcode.com/problems/confusing-number-ii/)

### 3. Prüfer Sequence & Cayley's Formula ($n^{n-2}$)
- **Book Reference**: Section 22.5 ("Cayley's formula", p. 215–216)
- **Concept**: Converting a labeled tree of $n$ nodes into its unique $(n-2)$-length Prüfer code and reconstructing the tree.
- **Matching LeetCode Question**:
  - [LC 2076: Process Restricted Friend Requests](https://leetcode.com/problems/process-restricted-friend-requests/)

### 4. Stirling Numbers of the Second Kind
- **Book Reference**: Section 22.1 ("Binomial coefficients", p. 208)
- **Concept**: Partitioning $n$ labeled items into $k$ non-empty unlabeled subsets ($S(n,k) = k S(n-1,k) + S(n-1,k-1)$).
- **Matching LeetCode Question**:
  - [LC 1866: Number of Ways to Rearrange Sticks With K Sticks Visible](https://leetcode.com/problems/number-of-ways-to-rearrange-sticks-with-k-sticks-visible/)
