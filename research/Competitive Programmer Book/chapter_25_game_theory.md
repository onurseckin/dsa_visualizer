# Chapter 25: Game Theory — Missing Questions & Topic Gap Analysis

> **Source**: *Competitive Programmer's Handbook* (Antti Laaksonen), Chapter 25: Game Theory  
> **Target Category**: `game_theory` ("Game Theory")

---

## 1. Chapter Overview & Subtopics

Chapter 25 explores combinatorial game theory, impartial games under normal play, and state analysis, divided into 3 main sections:

1. **25.1 Game States**
   - Impartial games with perfect information and no chance elements
   - Normal play convention (the player who cannot make a move loses)
   - **P-positions** (Previous player wins = current player loses) vs **N-positions** (Next player wins = current player wins)
   - Game graph represented as a DAG; state evaluation via minimax / recursive DP

2. **25.2 Nim Game**
   - Game rules: $k$ heaps of stones; a move consists of taking any number of stones from a single heap
   - **Bouton's Theorem**: A Nim state $(x_1, x_2, \dots, x_k)$ is a P-position if and only if $x_1 \oplus x_2 \oplus \dots \oplus x_k = 0$; otherwise it is an N-position
   - Strategy for constructing a winning move when $XOR \ne 0$

3. **25.3 Sprague–Grundy Theorem**
   - **Minimum Excluded Value ($\text{mex}$)**: The smallest non-negative integer not present in a set
   - **Grundy Value (Nim-value)**: $g(u) = \text{mex}(\{g(v) \mid u \to v\})$ where $v$ are valid next states from $u$
   - **Sprague–Grundy Theorem**: Any impartial game is equivalent to a Nim pile of size $g(u)$. For composite independent games, total Grundy value is $g(G) = g(G_1) \oplus g(G_2) \oplus \dots \oplus g(G_k)$

---

## 2. Currently Implemented in App

The app currently has **2 active algorithms** under `game_theory` covering topics from Chapter 25:

| ID | Title | Description / Chapter Section |
| :--- | :--- | :--- |
| `nim-game` | **Nim Game Sprague-Grundy** | Section 25.2 — Nim game XOR sum evaluation |
| `sprague-grundy-theorem` | **Sprague-Grundy Theorem & Grundy Values** | Section 25.3 — Mex calculation and subgame XOR composition |

---

## 3. Missing Questions & Implementation Roadmap

The following game theory topics and variants are missing from the current registry and are prime candidates for implementation:

### 1. Game State Evaluation via Minimax DP (P/N-Positions)
- **Book Reference**: Section 25.1 ("Game states", p. 235–237)
- **Concept**: State graph search where a state is winning (N-position) if any move leads to a losing state (P-position), and losing if all moves lead to winning states.
- **Matching LeetCode Question**:
  - [LC 294: Flip Game II](https://leetcode.com/problems/flip-game-ii/)

### 2. Multi-pile Sequential Minimax DP (Stone Games)
- **Book Reference**: Section 25.1 ("Game states", p. 236–237)
- **Concept**: DP for 2-player zero-sum games where players choose items from array boundaries to maximize score difference.
- **Matching LeetCode Questions**:
  - [LC 877: Stone Game](https://leetcode.com/problems/stone-game/)
  - [LC 1406: Stone Game III](https://leetcode.com/problems/stone-game-iii/)

### 3. Subtraction Game Mex Grundy Calculation
- **Book Reference**: Section 25.3 ("Sprague–Grundy theorem", p. 238–241)
- **Concept**: Calculating Grundy values for games where players can only subtract elements from a restricted set of allowed moves.
- **Matching LeetCode Question**:
  - [LC 2029: Stone Game IX](https://leetcode.com/problems/stone-game-ix/)
