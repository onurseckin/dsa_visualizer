# Chapter 21 LeetCode Alignment Implementation Plan

> **For agentic workers:** Execute this plan inline, task by task. The repository prohibits adding unit, component, integration, and end-to-end tests for this work; use the listed catalog, visualizer, typecheck, format, lint, and build commands instead.

**Goal:** Make every retained Chapter 21 LeetCode association submission-compatible with its reference code and remove every unsupported association without changing the book algorithms or titles.

**Architecture:** `AlgorithmDefinition` files remain the source of the learner-facing title, description, examples, reference code, and source metadata. `src/playground/specs-data/dsa/math_and_number_theory.ts` remains the source of executable signature and cases. The two layers must describe the same contract for a linked problem.

**Tech Stack:** TypeScript 7, React 19 learning catalog, Bun, Oxlint, Oxfmt.

---

## File map

- Modify: `src/algorithms/math_and_number_theory/{euclidGcd,trialDivisionPrimality,divisorFunctions,goldbachConjecture,zeckendorfTheorem,lagrangeFourSquare,pythagoreanTriples}.ts` — keep the seven verified LeetCode associations and make learner-facing contracts agree with their existing submission code.
- Modify: `src/algorithms/math_and_number_theory/{chineseRemainderTheorem,eulerTotientFunction,extendedEuclideanAlgorithm,modularExponentiationInverse,wilsonTheorem}.ts` — remove only unsupported LeetCode metadata, preserving the book algorithm and local runnable contract.
- Modify: `src/algorithms/math_and_number_theory/sievePrimes/definition.ts` — normalize the displayed input name to the `countPrimes(n)` reference signature while retaining #204.
- Modify: `src/playground/specs-data/dsa/math_and_number_theory.ts` — make each retained definition's authored default input, cases, signature audit, and invocation agree with the definition and LeetCode contract.

### Task 1: Remove unsupported associations

**Files:**
- Modify: `src/algorithms/math_and_number_theory/chineseRemainderTheorem.ts:382-405`
- Modify: `src/algorithms/math_and_number_theory/eulerTotientFunction.ts:330-353`
- Modify: `src/algorithms/math_and_number_theory/extendedEuclideanAlgorithm.ts:343-366`
- Modify: `src/algorithms/math_and_number_theory/modularExponentiationInverse.ts:419-442`
- Modify: `src/algorithms/math_and_number_theory/wilsonTheorem.ts:419-442`

- [ ] Remove the `kind: "leetcode"` entry from each `sources` array, retaining its book source entry.
- [ ] Remove the matching top-level `leetcode` object from each definition.
- [ ] Do not change IDs, titles, Python reference functions, default input objects, examples, or visualizer step generation for these five book-native algorithms.
- [ ] Run `bun run typecheck` and resolve only errors caused by the removed metadata.

### Task 2: Correct the perfect-number correspondence

**Files:**
- Modify: `src/algorithms/math_and_number_theory/divisorFunctions.ts:15-29,360-396,412-435`
- Modify: `src/playground/specs-data/dsa/math_and_number_theory.ts:289-309`

- [ ] Preserve the title “Divisor Functions & Perfect Numbers” and the existing `Solution.checkPerfectNumber(num)` algorithm.
- [ ] Replace the current #1390 metadata with LeetCode #507, URL `https://leetcode.com/problems/perfect-number/`, label `LeetCode #507`, and title `Perfect Number` in both the source entry and top-level `leetcode` value.
- [ ] Update the definition's description and examples to ask whether `num` is perfect and return a boolean, matching the Python class method and the executable cases.
- [ ] Ensure the three example outputs are boolean-shaped values that agree with their explanation and the execution fixtures.

### Task 3: Align the existing exact or faithful LeetCode pairs

**Files:**
- Modify: `src/algorithms/math_and_number_theory/sievePrimes/definition.ts:40-77`
- Modify: `src/algorithms/math_and_number_theory/euclidGcd.ts:15-25,305-343`
- Modify: `src/algorithms/math_and_number_theory/trialDivisionPrimality.ts:9-25,411-432`
- Modify: `src/algorithms/math_and_number_theory/goldbachConjecture.ts:415-436`
- Modify: `src/algorithms/math_and_number_theory/zeckendorfTheorem.ts:380-401`
- Modify: `src/algorithms/math_and_number_theory/lagrangeFourSquare.ts:429-449`
- Modify: `src/algorithms/math_and_number_theory/pythagoreanTriples.ts:427-449`
- Modify: `src/playground/specs-data/dsa/math_and_number_theory.ts:5-52,267-286,311-402`

- [ ] Leave every verified LeetCode ID and URL unchanged: #204, #1979, #2521, #2761, #1414, #279, and #1925.
- [ ] Make each problem description, constraints, input labels, output labels, and examples use the actual callable contract: `countPrimes(n)`, `findGCD(nums)`, `distinctPrimeFactors(nums)`, `findPrimePairs(n)`, `findMinFibonacciNumbers(k)`, `numSquares(n)`, and `countTriples(n)`.
- [ ] Preserve the book-oriented titles and the reference algorithms; where an external problem is an application of the taught algorithm, describe that application rather than replacing the algorithm.
- [ ] Update `defaultInput` shapes and each affected `generateSteps` input normalization only when necessary to keep a visualizer tutorial's displayed input synchronized with the new learner-facing examples.
- [ ] Keep each Python reference as a direct LeetCode-pasteable `Solution` class and method with no imports or runner-only wrapper.
- [ ] Align the matching execution spec's invocation, cases, audit signature, argument mapping, default input shape, and return behavior with the updated definition.

### Task 4: Inspect every Chapter 21 record as one contract

**Files:**
- Inspect: all files in `src/algorithms/math_and_number_theory/` named in the file map
- Inspect: `src/playground/specs-data/dsa/math_and_number_theory.ts`

- [ ] For each retained source, compare the top-level `leetcode` ID, source URL, Python `Solution` method, displayed description, examples, execution invocation, and expected cases; correct any remaining mismatch in the canonical definition or execution spec.
- [ ] For each removed source, confirm no `leetcode:` field, `leetcodeId`, `kind: "leetcode"`, or LeetCode URL remains in that definition.
- [ ] Confirm all thirteen records retain their current IDs, titles, book source information, topic membership, and authored tutorials.

### Task 5: Verify catalog health

**Files:**
- Inspect: modified Chapter 21 definitions and execution-spec data

- [ ] Run `bun run format:check` and apply Oxfmt only to the modified TypeScript files if it reports formatting changes.
- [ ] Run `bun run typecheck`.
- [ ] Run `bun run lint`.
- [ ] Run `bun run audit:catalog`.
- [ ] Run `bun run audit:visualizers`.
- [ ] Run `bun run build`.
- [ ] Review `git diff --check` and `git diff --stat` before handoff; report any pre-existing unrelated changes without modifying them.
