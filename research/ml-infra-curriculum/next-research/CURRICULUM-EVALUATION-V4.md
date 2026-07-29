# Curriculum Evaluation — Version 4

## Independent Re-evaluation of the Repaired Curriculum and Agentic Gate

**Date:** 2026-07-29

**Artifact under review:** [`ORCHESTRATED-MASTER-CURRICULUM-V4.md`](ORCHESTRATED-MASTER-CURRICULUM-V4.md)

**Run under review:** [`agentic-runs/2026-07-29-curriculum-v4-repair/`](agentic-runs/2026-07-29-curriculum-v4-repair/)

**Prior evaluation:** [`CURRICULUM-EVALUATION-V3.md`](CURRICULUM-EVALUATION-V3.md)

**Required process:** [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)

---

## 1. Executive Verdict

**Corrected run status: `REVISE`**

Version 4 is a substantial improvement over Version 3. It restores all 31
topic headings, restores most learning ladders, removes LeetCode 1458 from
exact vector search, separates Topics 17a/17b and 29a/29b throughout the
curriculum, and includes much more executable Python.

It is nevertheless not implementation-ready, and its recorded `PASS` is not
supported by either the final document or its own audit artifacts.

The strongest evidence comes from the run itself:

- the evidence ledger records four blocking `FAIL` results;
- the disposition ledger leaves those items at `REVISE`;
- the source audit records a deduplication `FAIL`;
- the technical contract audit ends with `REVISE`; and
- the cross-review report explicitly says the draft is not ready for
  synthesis.

The final gate changes all of those findings to `PASS` without a recorded
owner-response round or an independent re-review of the repaired synthesis.
Several repairs were made between the audits and the final document, but the
final document still contains critical mathematical, executable, structural,
and provenance defects.

### Authorization decision

- **Do not migrate the application catalog from Version 4 yet.**
- **Keep Version 4 as the active repair baseline.** Do not restart from
  Version 2 or produce another broad curriculum rewrite.
- Preserve the 31-module structure and the strong repaired problem selections.
- Patch the blocking findings in this evaluation, run the Python examples, and
  conduct a new post-revision cross-review before requesting another gate.

---

## 2. Corrected Gate Scorecard

| Gate | Observed Version 4 result | Correct status |
| --- | --- | --- |
| DSA/applied-math scope purity | No deployment or administration curriculum was introduced. | `PASS` |
| Seven-domain organization | All seven intended domains are present. | `PASS` |
| Exactly 31 module headings | The file contains all required headings, including 17a/17b and 29a/29b. | `PASS` |
| Topic split decisions | Both split decisions are consistently reflected in topic headings. | `PASS` |
| LeetCode 1458 removal | Removed from Topic 14. | `PASS` |
| Full five-rung ladders | Topics 09, 11, 12, and 13 have only four active rungs. Topic 07 ends with an extrapolation placeholder. | `FAIL` |
| Final prerequisite DAG | The graph retains rejected Version 3 edges and conflicts with module-level prerequisites. | `FAIL` |
| Real online foundations | Several modules begin entirely with custom items or weak word-level analogies. | `REVISE` |
| Primary-source provenance | Several named mechanisms have no primary source, while three local research links are broken. | `FAIL` |
| Canonical deduplication | The run's source auditor found duplicate canonical homes, and no canonical registry exists. | `FAIL` |
| Derived unique problem count | Claimed by the gate, absent from the curriculum. | `FAIL` |
| Required/optional status | Mostly restored, but inconsistent formatting and incomplete modules remain. | `REVISE` |
| Per-problem difficulty rationale | Mostly restored, but some items contain only a label rather than a rationale. | `REVISE` |
| Complete custom contracts | Numerous custom exercises have no contract; most contracts do not satisfy the declared schema. | `FAIL` |
| Executable Python correctness | Several examples contradict their code, and FlashAttention, BPE, Orca, and ZeRO contain blocking defects. | `FAIL` |
| Cross-review execution | A genuine round-two cross-review exists. | `PASS` |
| Owner revision and independent re-review | Some synthesis changes are visible, but no owner-response or post-repair re-review artifact exists. | `FAIL` |
| Fresh gate integrity | The gate contradicts unresolved audit findings and makes unreproducible assertions. | `FAIL` |
| Implementation readiness | The artifact is a strong repair draft, not a catalog source of truth. | `FAIL` |

---

## 3. Mechanical Audit

The following results are directly reproducible from Version 4.

| Measure | Claimed | Observed |
| --- | --- | --- |
| Topic headings | 31 | 31 |
| Modules with all five rung labels | 31 | 27 |
| Modules missing the stress/tradeoff rung | 0 | Topics 09, 11, 12, and 13 |
| Explicit contract headings | All custom exercises | 19 |
| Additional informal contract sections | Complete contracts | 5 |
| Total contract-like sections | Complete coverage | 24 |
| Python code blocks | One per custom contract | 21 |
| Explicit contract IDs | All contracts | 5, all in Topics 01–05 |
| Modules with no contract section | None where custom mechanisms exist | Topics 07, 08, 10, 18, 20, 21, 26, and 29a |
| Custom or `N/A` source markers | Fully sourced | 99 occurrences |
| URL occurrences | Fully audited | 115 occurrences, 102 unique |
| Canonical problem registry | Required | Absent |
| Derived unique problem count | Required | Absent |
| Broken local links | 0 | 3 |
| Corrupted control characters | 0 | 1 form-feed character in the 1F1B formula |

### 3.1 Broken local links

The Version 4 header repeats the Version 3 path mistake. These files are in
the same directory, but Version 4 links through `../`:

- `../CURRICULUM-EVALUATION-V2.md`
- `../CURRICULUM-EVALUATION-V3.md`
- `../AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`

### 3.2 Incomplete module marker

Topic 07 ends with:

> `8-12. Extrapolated (similar full specs as Topic 06)`

That is an instruction to generate missing content, not authored curriculum
content.

### 3.3 Unsupported gate claims

The gate says a unique problem count is “derived and documented.” There is no
such count or registry anywhere in Version 4.

The gate also says every custom ML exercise has a full schema and Python code.
Version 4 contains only five explicit IDs and twenty-one Python blocks while
describing far more custom exercises.

---

## 4. Agentic Process Audit

### 4.1 Genuine improvement over the Version 3 run

This run did not repeat Version 3's pure one-shot fan-out.

It contains:

- five bounded domain-specialist reports in `round-01`;
- three specialized round-two audits;
- a combined cross-review report;
- an evidence ledger;
- a disposition ledger; and
- a final synthesis and gate report.

That is meaningful process progress and should be preserved.

### 4.2 What the reviewers actually concluded

The round-two evidence does not support `PASS`.

#### Pedagogy audit

The pedagogy audit says every module has five rungs. That conclusion is
mechanically false: Topics 09, 11, 12, and 13 have no stress/tradeoff rung.
The normalized evidence ledger correctly notices this and records `FAIL`.

#### Source and deduplication audit

The source audit records:

- `Reshape the Matrix` in Topics 01 and 02;
- `Transpose Matrix` in Topics 01 and 02; and
- `Diagonal Traverse` in Topics 01 and 02.

It returns `FAIL` for deduplication. The final gate later marks deduplication
as `PASS` without a canonical registry or a disposition of those duplicates.

#### Technical contract audit

The technical audit returns `REVISE` because of incomplete schemas and
technical problems.

Some of its observations became stale after synthesis: Version 4 now includes
an online-softmax implementation, a byte-level BPE section, and the
total-schedule 1F1B formula. That demonstrates that synthesis performed some
repair work.

However, there is no post-synthesis technical re-review, and the new code
introduced or retained different errors documented in Section 8.

#### Combined cross-review

The combined report explicitly recommends:

> `REVISE. Send back to domain specialists for targeted repairs.`

The run folder contains no subsequent specialist response files, targeted
research packets, revised disposition ledger, or independent round-three
audit.

### 4.3 Disposition failure

The final disposition ledger still says:

- five-rung ladders: `REVISE`;
- literal URLs: `REVISE`;
- problem contracts: `REVISE`; and
- technical fixes: `REVISE`.

A synthesis document is not itself a closed disposition. Each finding needs:

1. an owner response;
2. a precise diff or replacement;
3. new evidence or executable tests; and
4. independent re-review.

Those records are absent.

### 4.4 Final-gate failure

The gate report contains eighteen checklist rows despite repeatedly referring
to seventeen defects. More importantly, it asserts:

- every module has five rungs;
- all sources are present;
- deduplication is complete;
- a unique count is documented;
- every contract is schema-compliant;
- Orca is corrected; and
- all protocol artifacts exist.

Each assertion is contradicted by either Version 4 or the run's own audit
files.

The correct run state is `REVISE`.

---

## 5. What Version 4 Genuinely Improved

The next repair must preserve these results.

### 5.1 Complete topic registry

All 31 intended topic headings now exist:

`01–16, 17a, 17b, 18–28, 29a, 29b`

This closes the largest structural regression in Version 3.

### 5.2 Better curriculum depth

Version 4 restores most of the learning outcomes, prerequisites, five-rung
progressions, required/optional decisions, and difficulty explanations that
Version 3 had removed.

### 5.3 Strong question repairs

Keep these decisions:

- LeetCode 1458 removed from exact vector search;
- LeetCode 2502 retained for allocator fundamentals;
- Course Schedule and Course Schedule II for execution DAGs;
- parsing and expression-tree problems for operator IR;
- Kth Largest, K Closest Points, and Sparse Vector Dot Product for exact
  retrieval;
- trie problems for vocabulary lookup;
- heap and event-simulation problems for serving schedulers;
- weighted and bottleneck path problems for interconnect modeling; and
- interval, meeting-room, and duplicate-subtree problems for compiler
  planning.

### 5.4 Correct or nearly correct mechanism implementations

The following implementations are useful repair baselines:

- AdamW's core update order;
- HNSW's candidate/result/visited structure;
- PagedAttention's narrow logical-to-physical block lookup;
- ring reduce-scatter plus all-gather trace; and
- online-softmax running maximum and normalizer mathematics.

They still need schema or edge-case repair, but their core direction is useful.

---

## 6. Prerequisite DAG Review

Version 4 retained the Version 3 DAG almost unchanged, even though the Version
3 evaluation required edge corrections.

### 6.1 Missing or incorrect graph edges

| Current graph issue | Required repair |
| --- | --- |
| Topic 03 is reached directly from Topic 01 | Match the module text by adding `T02 → T03`, or explain why strides/views are not required. |
| Topic 05 depends only on Topic 04 | Add `T03 → T05` for quantized GEMM, or separate scalar quantization from matrix-kernel quantization. |
| Topic 12 depends only on Topic 04 | Add `T10 → T12` and `T11 → T12`. |
| Topic 21 depends on Topics 03 and 04 | Remove or justify the matrix-multiplication dependency; add Topic 10 for impurity and loss mathematics. |
| Topic 27 is disconnected from Topic 26 | Add `T26 → T27`. |
| Topic 29a lacks layout prerequisites | Add Topic 02 and retain DAG/IR/liveness prerequisites. |
| Topic 16 says Topic 26 is a prerequisite | Either add the edge or remove that module-level prerequisite. |
| Topic 24 module prerequisites differ from the DAG | Normalize its prerequisites around queueing, attention/KV state, and iteration-level execution. |
| Topic 25 module prerequisites differ from the DAG | Normalize Topic 02, Topic 22/23, and Topic 24 dependencies. |
| Topic 29b module requires Topic 29a, but the DAG does not | Add or remove the edge with a rationale. |

### 6.2 Internal metadata contradictions

Examples:

- Topic 03 lists Topic 02 as a prerequisite, but the DAG omits that edge.
- Topic 13 says Topic 27 is an outgoing dependency, while the DAG connects it
  to Topic 28.
- Topic 23 says Topic 25 is downstream, while the DAG connects Topic 22
  directly to Topic 25.
- Topic 29b's module-level prerequisite list is much smaller than its DAG
  predecessor set.

The final graph and the module metadata must be generated from one normalized
edge registry.

---

## 7. Problem Selection and Pedagogy Review

### 7.1 Strong foundations to keep

The online foundations are strongest in:

- Topics 01–02 for matrix indexing;
- Topic 05 for integer representation and overflow;
- Topics 06–08 for graph scheduling and expression IR;
- Topic 12 for prefix sums and weighted sampling;
- Topic 14 for exact top-k retrieval;
- Topic 18 for tries;
- Topic 24 for heaps and discrete-event scheduling;
- Topic 25 for allocation;
- Topic 26 for weighted paths; and
- Topic 29a for lifetimes, interval coloring, and subtree hashing.

### 7.2 Topics still missing a genuine online foundation

The user's requirement was not merely to attach a documentation URL. It was to
teach transferable DSA/math operations through real practice before the ML
endpoint.

These modules still rely entirely or substantially on custom foundations:

- Topic 03: dot product, matrix-vector multiplication, and dense GEMM;
- Topic 04: floating-point and stable reductions;
- Topic 09: calculus and VJPs;
- Topic 10: probability and losses;
- Topic 13: running averages and optimizer state;
- Topic 17a: IVF, PQ, and ADC;
- Topic 22: attention prerequisites; and
- Topic 23: tiled online attention.

Custom mathematics is sometimes unavoidable. When no honest online-judge
problem exists, explicitly record a justified exception and provide a complete
local judge contract. Do not count Wikipedia or product documentation as an
online practice problem.

### 7.3 Weak or misleading foundations

#### Topic 11 — `Pow(x, n)`

Exponentiation by squaring does not teach:

- overflow-safe exponentials;
- max subtraction;
- LogSumExp;
- reduction normalization; or
- online softmax.

It is a word-level connection through exponentiation, not a useful prerequisite.
Use Topic 04 numerical reductions and Topic 10 probability normalization as
canonical prerequisites, followed by a direct stable-LogSumExp exercise.

#### Topic 16 — `Design Skiplist`

The probabilistic hierarchy is a useful analogy, but the curriculum says its
level assignment is “identical” and calls HNSW a multidimensional skiplist.
That is too strong. Keep the exercise optional and describe the transfer
narrowly: probabilistic sparse upper levels and coarse-to-fine navigation.

#### Topic 18 — Aho–Corasick

Aho–Corasick is a valuable string algorithm, but it is not the named ML
tokenization endpoint. Longest-match vocabulary traversal should be the named
mechanism; Aho–Corasick can be an optional stress or comparison exercise.

#### Topic 19 — Adjacent duplicate removal

Removing equal adjacent symbols with a stack is only a loose introduction to
local rewriting. It does not teach frequency-ranked pair selection. Keep it
optional and make pair counting plus deterministic merge selection the
required focused exercise.

#### Topic 21 — Binary-tree reconstruction

Building a tree from traversals teaches tree structure, but not learning a
decision tree. The important transferable operations are sorting feature
values, prefix class/gradient statistics, impurity or gain calculation, and
recursive partitioning. Tree reconstruction should be optional.

#### Topic 27 — Circular Array Loop

This problem focuses on signed jumps and cycle validity, not circular-buffer
state. Replace it with:

- [LeetCode 622 — Design Circular Queue](https://leetcode.com/problems/design-circular-queue/), or
- [LeetCode 641 — Design Circular Deque](https://leetcode.com/problems/design-circular-deque/).

Those problems teach the exact head/tail and modular-index state required by a
ring trace.

#### Topic 28 — Partition Equal Subset Sum

Subset-sum dynamic programming does not teach contiguous balanced sharding.
Replace it with [LeetCode 725 — Split Linked List in Parts](https://leetcode.com/problems/split-linked-list-in-parts/),
which directly teaches contiguous ordered partitions whose sizes differ by at
most one.

#### Topic 29b — Fair Distribution of Cookies

Exact exponential backtracking is not how pipeline stages or MoE routers
normally assign work. Keep it optional as an optimization comparison, or
cross-link the queue/load-balancing foundations from Topic 24 and make the
capacity-constrained MoE router the required direct exercise.

### 7.4 Duplicate active assignments

The document declares Topic 01 canonical for reshape, transpose, and diagonal
traversal, but Topic 02 enrolls them again as required or optional ladder
items. A textual note is not sufficient to prevent duplicate counting.

Other unnormalized reuse includes:

- Top-K/Top-P in Topic 22 despite canonical coverage in Topic 12;
- dot-product foundations repeated rather than cross-linked to Topics 03 or
  14; and
- tiling/online-softmax foundations repeated rather than canonically
  cross-linked.

The canonical problem registry must distinguish:

- counted canonical enrollment; and
- non-counting prerequisite cross-link.

---

## 8. Executable Contract and Python Audit

### 8.1 Coverage failure

At least eight modules contain custom mechanisms but no contract section:

`07, 08, 10, 18, 20, 21, 26, 29a`

Other modules contain one contract while listing several distinct custom
exercises. For example:

- Topic 17a lists K-means assignment, IVF posting lists, PQ encoding, ADC, and
  residual PQ but contracts only ADC.
- Topic 17b contracts signature generation but not the named hash-table
  retrieval mechanism.
- Topic 25 contracts lookup but not block-walk gather or copy-on-write.

The requirement should not force every explanatory item into a separate
problem. It must, however, give every required custom problem exactly one
judgeable contract in the canonical registry.

### 8.2 Blocking technical defects

| Topic | Defect | Required repair |
| --- | --- | --- |
| 03 | The prompt requires a block-computation trace, but the output schema and Python return only `C`. | Return `(C, trace)` or remove the trace requirement. |
| 04 | The Kahan example says the result is `1.0`, while its explanation says the compensated result is greater than `1.0`; the provided Python returns `1.0000000000000002`. | Replace with a verified example and expected trace. |
| 04 | `inf` followed by a finite value makes the compensation `NaN`, so the claimed `inf` propagation is not implemented. | Define and implement NaN/Inf policy or exclude non-finite input. |
| 04 | The ladder again labels “Unit Roundoff (Machine Epsilon),” conflating quantities Version 3 had separated. | Restore the explicit distinction. |
| 05 | For `[-1, 0, 1]`, Python's stated rounding gives zero point `128`, not the documented `127`. | Fix the rounding convention, code, and example together. |
| 06 | Python is explicitly “omitted for brevity”; the second example has no numeric result. | Complete the contract and add a visualizer state. |
| 07 | The module ends in an extrapolation placeholder. | Author the missing contract/source/visualizer fields. |
| 09 | `Node` and its operations remain undefined, Python is omitted, and the stress rung is absent. | Supply a serializable graph or complete library API. |
| 11 | The online-softmax math is broadly correct, but repeatedly rescales all prior output blocks and has no empty-block policy. | State its complexity and either return merge state, use two passes, or define the stored-output teaching variant precisely. |
| 12 | Top-P has no Python, test strategy, visualizer, source, or stress rung. | Complete and execute the contract. |
| 13 | AdamW's core order matches PyTorch, but the contract lacks an ID, primary literal field, visualizer, stress rung, and fully worked expected outputs. | Preserve the code and complete the schema. |
| 14 | Complexity is written as `O(N·D log K)` rather than `O(ND + N log K)`, and `K <= N` is not enforced. | Correct the bound and validate all shapes and zero-vector policy. |
| 15 | Expected `O(log N)` KNN is presented too generally; performance is distribution-, dimension-, and query-dependent. | Parameterize the claim and define deterministic median/tie behavior. |
| 16 | Equal-distance candidates do not replace a larger-ID result, despite the stated smaller-ID tie rule; output uses undefined `K`. | Implement equality tie handling and return up to `efSearch` results explicitly. |
| 17a | ADC is described as `O(1)` even though each encoded vector needs `M` lookup-and-add operations. | State `O(M)` per vector and add a primary PQ/ADC source. |
| 17b | The contract covers projection bits, not the named multi-table retrieval mechanism. | Add hash-table build/query and candidate-union contract coverage. |
| 19 | Sennrich BPE uses `re` without importing it, omits the actual `K`-merge loop, and its vocabulary example is inconsistent with `word.split()`. | Provide one executable end-to-end training function and verified examples. |
| 19 | Byte BPE promises integer token IDs but returns byte strings; it has only one partial example and no tests or visualizer. | Define a vocabulary/ID mapping and complete the contract. |
| 22 | The topic promises masking and KV geometry, but the contract covers only one single-head newest-token query. | Add mask policy, multi-head/GQA/MQA shapes, cache accounting, and invalid-shape tests. |
| 23 | The FlashAttention recurrence is mathematically wrong. | Use the correct normalized-output recurrence and test multiple K/V tiles against exact attention. |
| 24 | The Orca admission rule can exceed its token budget immediately. | Fix admission state, prefill/decode semantics, and selective batching. |
| 25 | The lookup code is a correct narrow bridge, not complete PagedAttention. | Keep its narrow name and contract block gather/allocation/CoW separately. |
| 27 | The ring trace works for tested small `P`, but calling it the “definitive NCCL algorithm” is false because NCCL selects among multiple algorithms. | Keep it as a ring implementation and make algorithm choice a parameterized comparison. |
| 28 | The implementation globally flattens all parameters, whereas DeepSpeed's ZeRO-3 reconstruction accounts for partition size and padding at parameter boundaries. | Rename as a simplified contiguous sharder or implement the selected DeepSpeed layout exactly. |
| 29b | Example 2 says the returned fraction is `7/4 = 1.75`, while the function returns `7/11 ≈ 0.63636`. | Choose overhead-to-ideal or bubble-to-total and make names, formula, code, and examples consistent. |

### 8.3 FlashAttention counterexample

The current update computes:

```text
O_new = (exp(m_old - m_new) * O_old + P_block @ V_block) / l_new
```

When `O_old` is already normalized, the prior contribution must also contain
`l_old`, and the current contribution must be rescaled from the block maximum:

```text
O_new =
  (
    exp(m_old - m_new) * l_old * O_old
    + exp(m_block - m_new) * (P_block @ V_block)
  ) / l_new
```

A four-row, two-tile numerical comparison produced different outputs from
exact attention, so this is a blocking judge error.

Primary source:
[Dao et al., FlashAttention](https://arxiv.org/abs/2205.14135)

### 8.4 Orca counterexample

With:

```text
requests = [(0, 1, 3), (0, 2, 3)]
max_batch_size = 2
max_total_tokens = 3
```

the code admits both requests because it predicts three tokens. It initializes
both requests at one token and then increments both during the same iteration,
producing four active tokens and violating the limit of three.

The current model also has no prompt/prefill length or selective-operation
state, despite Orca's defining combination of iteration-level scheduling and
selective batching.

Primary source:
[Yu et al., Orca](https://www.usenix.org/conference/osdi22/presentation/yu)

### 8.5 ZeRO-3 mismatch

DeepSpeed's reconstruction code computes a partitioned size and padding for
each unpartitioned parameter and advances offsets using that partitioned size.
Version 4 instead pads one globally flattened vector.

Source:
[DeepSpeed ZeRO-3 reconstruction implementation](https://deepspeed.readthedocs.io/en/stable/_modules/deepspeed/utils/zero_to_fp32.html)

The Version 4 exercise is still useful if renamed **Simplified Contiguous
Parameter Sharding**. It must not claim exact DeepSpeed behavior without
matching the selected DeepSpeed layout and configuration assumptions.

### 8.6 1F1B metric mismatch

The code's second example actually returns:

```text
(6.0, 10.5, 0.6363636363636364)
```

not `(6.0, 10.5, 1.75)`.

NVIDIA's explanation uses `(p-1)/m` for bubble time relative to ideal
processing time. `(p-1)/(m+p-1)` is bubble time relative to ideal plus bubble
time under the stated homogeneous assumptions. Both are meaningful, but they
must have different names and matching examples.

Source:
[NVIDIA Megatron pipeline scheduling explanation](https://developer.nvidia.com/blog/scaling-language-model-training-to-a-trillion-parameters-using-megatron/)

### 8.7 NCCL overclaim

The ring exercise is useful and its small integer trace passed checks for
`P = 2, 3, 4`. It should remain.

However, current NCCL supports Ring, Tree, CollNet variants, NVLS variants, and
other algorithms, with defaults selected according to topology and
architecture. Ring is not the universal definitive endpoint.

Source:
[NCCL algorithm configuration documentation](https://docs.nvidia.com/deeplearning/nccl/archives/nccl_2287/user-guide/docs/env.html)

---

## 9. Source and Canonical Registry Requirements

### 9.1 Primary sources still missing

At minimum, add direct primary or official sources for:

- HNSW search and neighbor selection;
- IVF, PQ, and ADC;
- cosine/random-hyperplane LSH;
- Im2Col/Col2Im behavior;
- XGBoost exact greedy gain;
- communication cost-model assumptions;
- graph compiler memory planning and fusion;
- MoE routing; and
- each named tokenization variant.

Documentation may explain a mechanism. It does not become an online judge
problem merely because it has a URL.

### 9.2 Canonical problem registry

Create one machine-readable table with:

| Field | Requirement |
| --- | --- |
| Canonical ID | Stable kebab-case local identity |
| Exact title | Verified external or custom title |
| Problem type | Online judge, custom judge, paper-backed mechanism, or reference-only |
| Direct URL | Required for external sources |
| Canonical module | Exactly one counted home |
| Cross-links | Any non-counting prerequisite reuse |
| Rung | Foundation, variant, bridge, mechanism, or stress |
| Required/optional | Explicit learner path |
| Difficulty | Individual rating and rationale |
| Transfer operation | The exact algorithmic operation reused |
| Contract ID | Required for custom judged problems |
| Runtime | Standard Python, NumPy, or server/PyTorch |
| Source status | Verified, missing, or disputed |

Derive the final problem count from these rows. Do not state a target count in
advance.

---

## 10. Required Version 4 Repair Loop

Do not create an unrelated Version 5 curriculum. Patch Version 4 in bounded
waves.

### Wave 1 — Normalize structure

- create the single 31-module registry;
- create the prerequisite-edge registry;
- generate the DAG and module prerequisite lists from it;
- add the four missing stress rungs;
- replace Topic 07's extrapolation marker; and
- normalize required/optional and difficulty fields.

### Wave 2 — Normalize the problem bank

- create the canonical problem registry;
- resolve duplicate counted homes;
- replace the weak foundations in Section 7;
- distinguish online problems from documentation and custom contracts;
- supply missing primary sources; and
- derive the unique required, optional, external, and custom counts.

### Wave 3 — Repair executable contracts

Assign specialist packets for:

1. tensor layout, GEMM, numerics, and quantization;
2. autograd, loss, softmax, sampling, and optimizers;
3. exact retrieval, spatial trees, HNSW, IVF/PQ/ADC, and LSH;
4. tokenization, convolution, trees, attention, and FlashAttention; and
5. scheduling, paged KV memory, collectives, ZeRO, pipeline scheduling, MoE,
   and compiler planning.

Every required custom problem must receive:

- ID;
- primary source;
- prompt;
- exact serializable schemas;
- bounds;
- tolerance and tie behavior;
- at least two complete examples;
- executable Python;
- public and hidden test strategy;
- visualizer state; and
- declared runtime dependencies.

### Wave 4 — Execute the contracts

Mechanically:

- extract every Python block;
- parse it using the intended Python runtime;
- run every documented example;
- run focused edge cases;
- compare numerical mechanisms to trusted references;
- verify stated complexity and output shapes; and
- store results in a test ledger.

At minimum, include regression tests for the counterexamples in Section 8.

### Wave 5 — Owner response and re-review

For every prior `FAIL` or `REVISE`:

1. record the owner's response;
2. link to the exact repaired module or contract;
3. attach source or execution evidence;
4. send the repair to an independent reviewer; and
5. update the disposition only after re-review.

The current round-two reports cannot be reused as approval of content that was
changed after they ran.

### Wave 6 — Fresh gate

The gatekeeper must reproduce:

- 31 module count;
- five rungs per module;
- edge-registry/DAG consistency;
- zero broken links or control characters;
- canonical deduplication;
- derived problem counts;
- source completeness;
- contract schema completeness;
- Python parse/example/test results; and
- closure of every disposition item.

Any failed mandatory check returns `REVISE`.

---

## 11. Acceptance Criteria for the Next Gate

- [ ] Exactly 31 complete module records exist.
- [ ] All 31 modules have five explicit rungs.
- [ ] Topic 07 contains authored content instead of extrapolation.
- [ ] The final DAG and module prerequisites come from one edge registry.
- [ ] The DAG corrections in Section 6 are resolved.
- [ ] Every counted problem has one canonical home.
- [ ] Cross-links are explicitly non-counting.
- [ ] A derived unique problem count is published.
- [ ] Real online foundations or justified custom exceptions exist for every
      module.
- [ ] Weak analogies in Section 7 are removed, narrowed, or made optional.
- [ ] Every named mechanism has a primary or official source.
- [ ] Every required custom exercise has one complete contract.
- [ ] Every reference implementation parses in its declared runtime.
- [ ] Every worked example passes its own implementation.
- [ ] FlashAttention matches exact attention across multiple tiles.
- [ ] Orca never exceeds the declared memory budget.
- [ ] ZeRO is either accurately modeled or honestly renamed as simplified.
- [ ] The two 1F1B metrics and examples are internally consistent.
- [ ] No broken local links remain.
- [ ] No control characters remain.
- [ ] Every round-two finding has an owner response and independent re-review.
- [ ] The fresh gate report includes reproducible commands and results.

---

## 12. Next-Model Handoff

The active repair packet should contain only:

1. [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)
2. [`ORCHESTRATED-MASTER-CURRICULUM-V4.md`](ORCHESTRATED-MASTER-CURRICULUM-V4.md)
3. [`CURRICULUM-EVALUATION-V4.md`](CURRICULUM-EVALUATION-V4.md)

Version 2, Version 3, and their evaluations remain historical evidence for
disputes, but they are not required in the initial small-model context.

Use this instruction:

> Patch Version 4 through the protocol's owner-response, executable-test, and
> independent re-review loops. Preserve its 31-module seven-domain structure.
> Do not redesign the curriculum from scratch and do not modify the application
> catalog. Resolve every Version 4 evaluation finding with a canonical
> registry, exact source or test evidence, and a closed disposition. Request a
> fresh gate only after all Python examples and mechanical checks pass.

---

## 13. Final Assessment

Version 4 is the first draft in this sequence that resembles the intended full
curriculum again. Its architecture and much of its problem progression are
worth keeping.

Its remaining problem is no longer lack of effort or breadth. It is premature
verification: incomplete reviewer findings were converted to `PASS`, and
unexecuted Python was treated as correct.

The next cycle should be a narrower engineering-quality repair:

- normalize the registries;
- fix the identified problem choices;
- complete and execute the contracts;
- re-review the actual repaired artifact; and
- then gate it honestly.
