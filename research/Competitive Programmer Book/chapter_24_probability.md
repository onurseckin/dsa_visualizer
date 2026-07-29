# Chapter 24: Probability — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 24: Probability  
> **Target Category**: `math_and_number_theory` ("Math & Number Theory")

---

## 1. Chapter Overview & Subtopics

Chapter 24 covers probability theory, expectation calculations, stochastic processes, and randomized algorithms in competitive programming across 5 main sections:

1. **24.1 Calculation**
   - Sample space $\Omega$, events, basic probability bounds $0 \le P(A) \le 1$
   - Complementary events $P(\bar{A}) = 1 - P(A)$
   - Conditional probability $P(A \mid B) = \frac{P(A \cap B)}{P(B)}$
   - Bayes' Theorem: $P(A \mid B) = \frac{P(B \mid A) P(A)}{P(B)}$

2. **24.2 Events**
   - Independent events $P(A \cap B) = P(A) P(B)$
   - Mutually exclusive events $P(A \cap B) = 0$
   - Inclusion-Exclusion for probability: $P(A \cup B) = P(A) + P(B) - P(A \cap B)$

3. **24.3 Random Variables & Expectation**
   - Discrete random variables $X$ and expected value $E[X] = \sum x P(X = x)$
   - **Linearity of Expectation**: $E[X + Y] = E[X] + E[Y]$ (holds even if $X$ and $Y$ are dependent)
   - Bernoulli Process: Expected number of trials until first success with probability $p$ is $1/p$
   - Coupon Collector's Problem: Expected trials to collect $n$ distinct coupons is $n \sum_{i=1}^n \frac{1}{i} \approx n \ln n$

4. **24.4 Markov Chains**
   - State transition matrix $P$ where $P[i][j]$ is transition probability from state $i$ to $j$
   - $k$-step transition probabilities $P^k$ via matrix multiplication
   - Stationary distribution $\pi P = \pi$ and absorption probabilities

5. **24.5 Randomized Algorithms**
   - Monte Carlo algorithms (always fast, high probability of correctness e.g. Miller-Rabin test)
   - Las Vegas algorithms (always correct, expected fast runtime e.g. QuickSelect, Randomized Treap)
   - Fisher-Yates Shuffle algorithm for uniform $1/N!$ random permutation generation

---

## 2. Currently Implemented in App

The app currently has **1 active algorithm** covering topics from Chapter 24:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `markov-chains` | **Markov Chains & Random Walks** | Section 24.4 — State transition matrix & random walk probabilities |

---

## 3. Missing Questions & Implementation Roadmap

The following probability and randomized algorithms are missing from the current registry and are prime candidates for implementation:

### 1. Probability Dynamic Programming & Expectation
- **Book Reference**: Section 24.3 ("Random variables", p. 228–230)
- **Concept**: DP state transitions for computing win probabilities or expected points in card/card-game setups.
- **Matching LeetCode Question**:
  - [LC 837: New 21 Game](https://leetcode.com/problems/new-21-game/)

### 2. Coin Toss Probability DP
- **Book Reference**: Section 24.1 & 24.2 ("Calculation & Events", p. 225–227)
- **Concept**: Computing exact probability of getting $K$ heads given an array of $N$ coin probabilities using 2D DP.
- **Matching LeetCode Question**:
  - [LC 1230: Toss Strange Coins](https://leetcode.com/problems/toss-strange-coins/)

### 3. Miller-Rabin Probabilistic Primality Test (Monte Carlo)
- **Book Reference**: Section 24.5 ("Randomized algorithms", p. 231–233)
- **Concept**: Monte Carlo randomized primality verification testing base witnesses $a^d \pmod n$ and $a^{2^r d} \pmod n$.
- **Matching LeetCode Question**:
  - [LC 866: Prime Palindrome](https://leetcode.com/problems/prime-palindrome/)

### 4. Fisher-Yates Uniform Random Shuffle (Las Vegas)
- **Book Reference**: Section 24.5 ("Randomized algorithms", p. 233)
- **Concept**: In-place $O(N)$ algorithm for generating uniform random permutations with equal probability $1/N!$.
- **Matching LeetCode Question**:
  - [LC 384: Shuffle an Array](https://leetcode.com/problems/shuffle-an-array/)
