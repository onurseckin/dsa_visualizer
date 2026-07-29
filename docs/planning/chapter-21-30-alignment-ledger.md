# Competitive Programmer's Handbook Chapters 21-30 Alignment Ledger

This ledger is the decision record for the catalog migration initiated on 2026-07-29. The local source is `/Users/onurseckinsenoglu/Desktop/competitive_programmer.pdf` (Antti Laaksonen, 2018); its public canonical copy is [the CSES book PDF](https://cses.fi/book/book.pdf). An external problem is retained only when its callable contract and central algorithm agree with this catalog item.

## Book scope

| Chapter | Printed pages | Book sections |
| --- | ---: | --- |
| 21 Number theory | 197-206 | primes and factors; modular arithmetic; solving equations; other results |
| 22 Combinatorics | 207-216 | binomial coefficients; Catalan numbers; inclusion-exclusion; Burnside's lemma; Cayley's formula |
| 23 Matrices | 217-224 | operations; linear recurrences; graphs and matrices |
| 24 Probability | 225-234 | calculation; events; random variables; Markov chains; randomized algorithms |
| 25 Game theory | 235-242 | game states; Nim game; Sprague-Grundy theorem |
| 26 String algorithms | 243-250 | terminology; trie; hashing; Z-algorithm |
| 27 Square root algorithms | 251-256 | combining algorithms; integer partitions; Mo's algorithm |
| 28 Segment trees revisited | 257-264 | lazy propagation; dynamic trees; data structures; two-dimensionality |
| 29 Geometry | 265-274 | complex numbers; points and lines; polygon area; distance functions |
| 30 Sweep line algorithms | 275-280 | intersection points; closest pair; convex hull |

## Audited records and required disposition

`keep` means the link is a verified counterpart, not that the external task defines the book item. `remove` means the current link must not be shown. `repair` means reference code, runner, and prose conflict and must be made one book-derived algorithm before the item can claim executable status.

| Chapters | Record(s) | Link decision | Required action |
| --- | --- | --- | --- |
| 21 | sieve-primes, euclid-gcd, trial-division-primality, divisor-functions, goldbach-conjecture, zeckendorf-theorem, lagrange-four-square | keep | Existing counterparts are verified. Maintain the already aligned runner contract and fixture coverage. |
| 21 | modular-exponentiation-inverse, extended-euclidean-algorithm, chinese-remainder-theorem, euler-totient-function, wilson-theorem | no equivalent | Keep book binding without an external problem link. |
| 21 | pythagorean-triples | conditional keep | #1925 counts all ordered square-sum triples, not primitive triples. Either teach/count the same quantity or remove its link. |
| 22 | binomial-coefficients-pascal | repair | Current reference is #118 `generate(numRows)` while runner/tutorial declare a scalar `C(n,k)`. Implement one selected book contract; retain #118 only if the item becomes Pascal-row generation. |
| 22 | catalan-numbers, inclusion-exclusion-principle | keep after contract repair | #96 and #1201 are counterparts; inclusion-exclusion must bind `n,a,b,c` or a faithful generic inclusion-exclusion interface. |
| 22 | derangements, burnside-lemma, prufer-code, stirling-numbers-second | remove and repair | #634 returns an arrangement, #1363 is digit DP, #2477 is a fuel-cost tree problem, and #1866 uses first-kind Stirling numbers. Restore the named book algorithms. |
| 23 | matrix-exponentiation, tribonacci-matrix | keep after implementation repair | #509 and #1137 are counterparts, but the shown code is linear iteration while the item promises matrix exponentiation. |
| 23 | path-counting-matrix, min-plus-matrix-multiplication, kirchhoff-matrix-tree | remove and repair | #552, #1334, and #1569 implement unrelated attendance/graph-threshold/BST-reorder tasks. Restore the named matrix algorithms. |
| 24 | probability-dp-expectation, markov-chains, toss-strange-coins | keep after runner repair | #837, #688, and #1230 are counterparts; each runner must use the actual source signature and return shape. |
| 24 | miller-rabin-primality | remove and repair | #866 is Prime Palindrome, not Miller-Rabin. |
| 24 | fisher-yates-shuffle | remove or redesign | #384 requires stateful `Solution(nums).reset()/shuffle()`, unlike the current stateless function. It may not remain linked under the current contract. |
| 25 | nim-game, sprague-grundy-theorem | keep with scope note | #292 is a one-pile introduction; #1908 is a Nim specialization, not a general SG solver. |
| 25 | game-state-minimax | repaired | Restored a coherent Flip Game II minimax contract: numeric all-`+` board length, `Solution().canWin(n)`, matching prose, examples, runner fixtures, and Ch25 §25.1 binding. |
| 25 | mex-subtraction-game | repaired | The Grundy recurrence and configurable move-set runner contract are aligned with Ch25 §25.3. |
| 25 | stone-game-dp | repaired | Restored the endpoint-picking interval-DP algorithm already taught by the visualizer. The reference is `Solution().canWin(piles) -> bool`, and its prose, constraints, default, runner contract, and eight fixtures now agree with Ch25 §25.1. |
| 26 | trie-prefix-tree, kmp-string-match | keep | #208 and #28 are exact practice counterparts. KMP must not cite book §26.1 as pattern matching because that section is terminology. |
| 26 | string-hashing, z-algorithm | repaired | Both now expose book-style text/pattern matching contracts with verified runners. |
| 26 | aho-corasick | repaired as enrichment | Replaced the unrelated board-word-search reference with an Aho-Corasick failure-link matcher. It is correctly recorded as a standard trie enrichment rather than falsely attributed to the handbook's trie section. |
| 26 | bitwise-trie-xor | repaired as enrichment | The reference now uses an actual high-bit-to-low-bit trie and the verified LeetCode #421 counterpart. The false Chapter 26 binding has been removed. |
| 27 | sqrt-decomposition, mo-algorithm | repaired | Both bindings now cite Ch27 precisely (§27.1 and §27.3). Their runners retain three scenario fixtures and add five deterministic boundary/adversarial cases each. |
| 28 | segment-tree-lazy | repaired | The correct lazy-propagation binding is retained and its runner now covers whole, partial, no-op, signed, and single-index range additions with eight fixtures. |
| 28 | dynamic-segment-tree, persistent-segment-tree | repair source labels | Both are Ch28 but display Ch9 labels. |
| 28 | merge-sort-tree, segment-tree-2d | repaired | Runner invocation and fixture shapes now match the actual scalar functions, both have eight cases, and bindings cite the applicable Ch28 data-structure and two-dimensionality sections. |
| 29 | line-segment-intersection, point-in-polygon, pick-theorem | remove and repair | #223 is rectangle area, #1037 is boomerang; two runner interfaces also wrap inputs incorrectly. |
| 29/30 | rectangle-area-union, skyline-problem | correct binding/contract | Rectangle area is an application, not a direct §29 item; skyline belongs with Ch30. #218 is a verified skyline counterpart if the displayed contract matches. |
| 29 | polygon-area, manhattan-distance-rotation | repair fixtures | Correct conceptual placement; runner input wrappers disagree with entrypoints. |
| 30 | sweep-line-intersections, closest-pair-of-points | repair complexity implementation | Current active-set/window structures can be quadratic while the records claim `O(n log n)`. |
| 30 | convex-hull | keep after metadata repair | #587 exactly matches the perimeter-hull contract; `chapter` must be 30 to match its label and book section. |

## Missing-book candidates

Candidates below are concrete enough to become catalog items only after their interface, tutorial, and runner contract are authored together. They are not placeholder shells.

| Chapter | Candidate algorithm | Proposed binding / contract |
| --- | --- | --- |
| 21 | Prime factorization and smallest-prime-factor queries | `math_and_number_theory`; return repeated prime factors or an SPF table/query answer. |
| 22 | Stars and bars / multinomial coefficient | `math_and_number_theory`; calculate a bounded exact combinatorial quantity with documented range. |
| 23 | Matrix multiplication, binary matrix power, determinant by elimination, general linear recurrence | `math_and_number_theory`; separate matrix/vector inputs and explicitly define modular vs exact arithmetic. |
| 24 | Quickselect and Freivalds matrix-product verification | Existing algorithm topics, source-bound to §24.5; use deterministic fixtures and a seeded RNG only when the contract exposes it. |
| 25 | Misere Nim and impartial-game Grundy DP | `game_theory`; return win/loss or Grundy value for an explicitly modeled game graph. |
| 26 | String period/border/rotation and polynomial rolling-hash queries | `tries_and_strings`; actual string algorithms, not a borrowed KMP solution. |
| 27 | Grouped equal-weight subset sums | `advanced_range_queries`; bind to §27.2 rather than an unrelated integer-partition shell. |
| 28 | Polynomial range updates | `advanced_range_queries`; lazy tree with a formal range-update/range-query contract. |
| 29 | Orientation/point location and point-to-line distance | `geometry_and_sweep_line`; explicit point/vector representation and boundary convention. |
| 30 | Maximum simultaneous intervals and efficient horizontal/vertical intersection counting | `geometry_and_sweep_line`; ordered event semantics and coordinate-compressed range-query contract. |

## Runner fixture standard

Every in-scope runnable record currently outside Chapter 21 has only the three base fixtures. Its repair must retain the base/basic-boundary-complex cases and add at least five independently derived `extraCases(...)` fixtures for valid input partitions. Expected values must come from a direct oracle, a mathematical invariant, or a bounded brute-force instance—not from rerunning the learner reference code.

## Sources used for external correspondence

- [LeetCode 118, Pascal's Triangle](https://leetcode.com/problems/pascals-triangle/)
- [LeetCode 1201, Ugly Number III](https://leetcode.com/problems/ugly-number-iii/)
- [LeetCode 509, Fibonacci Number](https://leetcode.com/problems/fibonacci-number/)
- [LeetCode 837, New 21 Game](https://leetcode.com/problems/new-21-game/)
- [LeetCode 688, Knight Probability in Chessboard](https://leetcode.com/problems/knight-probability-in-chessboard/)
- [LeetCode 208, Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/)
- [LeetCode 587, Erect the Fence](https://leetcode.com/problems/erect-the-fence/)
- [LeetCode 223, Rectangle Area](https://leetcode.com/problems/rectangle-area/)
- [LeetCode 1037, Valid Boomerang](https://leetcode.com/problems/valid-boomerang/)
