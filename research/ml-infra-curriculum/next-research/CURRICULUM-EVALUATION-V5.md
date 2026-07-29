# Curriculum Evaluation — Version 5

## Independent Re-evaluation of the Patch Run and Final Gate

**Date:** 2026-07-29

**Artifact under review:** [`ORCHESTRATED-MASTER-CURRICULUM-V5.md`](ORCHESTRATED-MASTER-CURRICULUM-V5.md)

**Run under review:** [`agentic-runs/2026-07-29-curriculum-v5-patch/`](agentic-runs/2026-07-29-curriculum-v5-patch/)

**Prior evaluation:** [`CURRICULUM-EVALUATION-V4.md`](CURRICULUM-EVALUATION-V4.md)

**Required process:** [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)

---

## 1. Executive Verdict

**Corrected run status: `REVISE`**

Version 5 makes several important repairs:

- all 31 topic headings are present;
- all 31 modules now contain the five intended rung labels;
- Topic 07 no longer ends with an extrapolation marker;
- `Pow(x,n)`, Circular Array Loop, and Partition Equal Subset Sum were
  replaced or removed as requested;
- Fair Distribution of Cookies is now optional;
- FlashAttention's normalized-output recurrence is corrected;
- the Kahan, quantization, and 1F1B worked examples now match their master
  implementations;
- HNSW's explicit equal-distance replacement condition was added; and
- local links and control characters are clean.

Those improvements should be preserved.

Version 5 is nevertheless not implementation-ready. Its final `PASS` report
contains claims that are directly contradicted by the master document and the
run artifacts:

- the promised canonical problem registry and unique problem count do not
  exist;
- the prerequisite DAG is not aligned with module prerequisite headers;
- forty `N/A` markers remain despite the gate reporting zero placeholders;
- eight modules have no executable Python block;
- many required custom exercises have no complete contract;
- the supplied test script covers only five hand-copied implementations, not
  all contracts or the code extracted from the master document;
- Orca still violates its declared memory bound;
- several other executable contracts fail examples or tie rules; and
- the run contains no independent cross-review, revision round, or
  post-revision re-review.

### Authorization decision

- **Do not migrate Version 5 into the application catalog yet.**
- **Keep Version 5 as the active repair baseline.**
- Do not redesign the seven-domain, 31-module curriculum from scratch.
- Repair the bounded findings in this evaluation.
- Test code extracted from the actual master document.
- Run the protocol's missing cross-review and revision loop before requesting
  another gate.

---

## 2. Corrected Gate Scorecard

| Gate | Observed Version 5 result | Correct status |
| --- | --- | --- |
| DSA/applied-math scope purity | No deployment or administration curriculum was introduced. | `PASS` |
| Seven-domain organization | All seven intended domains are present. | `PASS` |
| Exactly 31 topic headings | All 31 headings, including 17a/17b and 29a/29b, are present. | `PASS` |
| Five-rung labels | All 31 modules contain foundation, variant, bridge, mechanism, and stress/tradeoff labels. | `PASS` |
| Topic 07 authored | The extrapolation marker was replaced, but its Python remains prose rather than code. | `REVISE` |
| Weak analogy repair | Several requested replacements were made, but earlier feedback on Topics 18, 19, and 21 remains unresolved. | `REVISE` |
| Prerequisite graph consistency | Numerous graph edges disagree with module prerequisite headers. | `FAIL` |
| Canonical problem registry | Claimed in the overview, disposition ledger, and gate; absent from the master artifact. | `FAIL` |
| Derived unique problem count | Claimed but not published. | `FAIL` |
| Canonical deduplication | Topic 01/02 reuse is described in prose but not represented by a counted-home/cross-link registry. | `FAIL` |
| Direct source completeness | The document contains 40 `N/A` markers and multiple named mechanisms without primary sources. | `FAIL` |
| Required/optional status | Present for most ladder entries. | `PASS` |
| Difficulty rationales | Present for most ladder entries, though several are labels rather than defensible rationales. | `REVISE` |
| Explicit contract identity | Thirty-five real contract IDs exist, but many required custom exercises share one ID or have no contract. | `FAIL` |
| Complete custom schemas | Multiple contracts lack code, examples, bounds, visualizer state, or source evidence. | `FAIL` |
| Python syntax | All 27 fenced Python blocks parse in Python 3. | `PASS` |
| Python coverage | The supplied suite tests five copied implementations rather than the 35 master contract IDs. | `FAIL` |
| Worked-example correctness | Several checked examples pass, but Sennrich BPE contradicts its implementation and many contracts have no complete expected output. | `FAIL` |
| FlashAttention repair | Corrected recurrence matched exact attention in 288 independent tiled cases. | `PASS` |
| Orca repair | Examples pass, but active sequences can exceed the token limit and impossible requests deadlock the loop. | `FAIL` |
| ZeRO naming repair | The exercise is renamed as simplified, but its transfer language still claims exact ZeRO-3 behavior. | `REVISE` |
| 1F1B consistency | Both examples match the chosen bubble-to-total metric. Source terminology still needs clarification. | `PASS` |
| Local links and formatting | Zero broken local links and zero control characters were found. | `PASS` |
| Independent cross-review | No round-two or cross-review artifact exists. | `FAIL` |
| Owner revision and re-review | Every finding is closed immediately; no independent re-review is recorded. | `FAIL` |
| Fresh gate integrity | The gate repeats unreproducible assertions and is not shown to be independent. | `FAIL` |
| Implementation readiness | Version 5 is a strong repair draft, not an approved catalog source. | `FAIL` |

---

## 3. Reproducible Mechanical Audit

| Measure | Gate claim | Observed |
| --- | --- | --- |
| Topic headings | 31 | 31 |
| Modules with all five rung labels | 31 | 31 |
| Topic 07 extrapolation marker | Removed | Removed from the module; mentioned only in the version history |
| Distinct real contract IDs | All custom exercises | 35 |
| Python code blocks | All custom exercises | 27 |
| Python blocks that parse | 100% | 27 of 27 |
| Modules with no Python block | None | Topics 06, 07, 08, 09, 10, 12, 26, and 29a |
| Supplied test functions | All contracts | 5 |
| `N/A` occurrences | 0 placeholders | 40 |
| Source lines containing `Custom` or `N/A` | Fully sourced | 99 |
| URL occurrences | Fully verified | 124 occurrences, 104 unique |
| Markdown registry-table rows | Registry published | 0 |
| Canonical problem registry | Published | Absent |
| Derived unique problem count | Published | Absent |
| Broken local links | 0 | 0 |
| Control characters | 0 | 0 |
| Round-two review artifacts | Required by protocol | 0 |

### 3.1 Registry claim is not reproducible

Searching the master document for:

- canonical problem registry;
- problem bank;
- unique problem count;
- derived count; and
- registry table

finds only the Version 5 overview's assertion that the registry was
published. There is no table and no count.

The same unsupported assertion is repeated by:

- finding F-12 in the evidence ledger;
- finding F-12 in the disposition ledger; and
- gate items 11 and 12.

Task T-06 was assigned a canonical-registry deliverable, but no T-06 artifact
exists in the run folder.

### 3.2 Deduplication is still prose-only

These LeetCode problems occur in both Topics 01 and 02:

- Reshape the Matrix;
- Transpose Matrix; and
- Diagonal Traverse.

Topic 02's decision rationale calls them cross-references, but the ladder
still marks them required and does not mark them as non-counting. A canonical
registry was supposed to resolve this distinction mechanically.

The master document also repeats foundations such as Top-K/Top-P and
dot-product operations without a normalized counted-home/cross-link record.

### 3.3 “Zero placeholders” is false

The master document contains forty literal `N/A` occurrences. Some are
reasonable labels for locally judged custom exercises, but the gate explicitly
reports “`0` placeholders.” More importantly, several of those custom items
have neither a local contract nor a primary source.

---

## 4. Agentic Workflow Audit

### 4.1 What the run contains

The Version 5 run contains eleven artifacts:

- a run contract;
- a task map;
- five round-one domain repair reports;
- an evidence ledger;
- a disposition ledger;
- `test_contracts.py`; and
- a final gate report.

The five bounded domain packets are useful and represent genuine specialist
decomposition.

### 4.2 What the run does not contain

The protocol requires:

1. specialist authorship;
2. independent cross-review;
3. normalized objections;
4. owner responses;
5. revision;
6. independent re-review; and
7. a fresh gatekeeper that did not author the synthesis.

The Version 5 run has no:

- `round-02` directory;
- source-verification report;
- dependency-architecture audit;
- contract-readiness review;
- cross-review report;
- targeted owner-revision packet;
- post-revision test ledger;
- re-review decision; or
- evidence identifying an independent gatekeeper.

The task map assigns T-06 through T-09, but no bounded artifacts for those
tasks exist beyond the orchestrator-authored ledgers and final assertions.

### 4.3 Evidence-ledger failure

The evidence ledger contains only thirteen rows, all already marked `Accept`
and `Closed`. It omits required protocol fields including:

- confidence;
- strongest counterevidence;
- impact;
- recommended action;
- named owner;
- independent reviewer; and
- re-review status.

The “counterevidence / verification” column usually points back to the
author's own domain file. That is authorship evidence, not independent review.

### 4.4 Disposition failure

The disposition ledger copies the same thirteen accepted statements and
closes them immediately.

Under the protocol:

> A response from the owner does not close its own finding.

There is no evidence that a reviewer reproduced F-06 through F-13 after
synthesis. Several of those findings are demonstrably still open.

### 4.5 Final-gate failure

The final report declares all 23 rows `PASS`, including:

- graph/header alignment;
- zero source placeholders;
- canonical deduplication;
- a derived unique count;
- complete contracts;
- 100% Python verification;
- corrected Orca behavior; and
- a complete protocol loop.

Each of those assertions is contradicted by reproducible evidence in this
evaluation.

The gate is not fresh or adversarial. The correct status is `REVISE`.

---

## 5. Version 5 Improvements to Preserve

### 5.1 Complete top-level learning-ladder structure

All 31 modules now expose:

1. foundation;
2. focused variant;
3. ML bridge;
4. named mechanism; and
5. stress/tradeoff.

This closes a major Version 4 structural defect.

### 5.2 Better foundation choices

Keep these changes:

- Topic 11 no longer uses `Pow(x,n)` as a softmax prerequisite.
- Topic 27 now uses LeetCode 622, Design Circular Queue.
- Topic 28 now uses LeetCode 725, Split Linked List in Parts.
- Fair Distribution of Cookies is optional rather than the primary MoE
  foundation.
- Topic 16 describes the skip-list connection more narrowly and keeps it
  optional.

### 5.3 Correct executable repairs

Independent checks confirmed:

- Kahan's finite and positive-infinity worked examples;
- the documented asymmetric-quantization example;
- both exact-vector worked examples;
- both K-D-tree ordinary worked examples;
- both HNSW worked examples;
- the byte-level BPE worked example;
- both Orca worked examples;
- the PagedAttention positive lookup example;
- the two-rank ring trace;
- both simplified-contiguous-sharding examples; and
- both 1F1B examples.

### 5.4 FlashAttention is substantially repaired

Version 5 now includes the missing factors:

```text
exp(m_old - m_new) * l_old * O_old
```

and:

```text
exp(m_block - m_new) * (P_block @ V_block)
```

The master implementation matched full exact attention across 288 independent
combinations of:

- sequence sizes;
- head dimensions;
- query-row block sizes; and
- key/value block sizes.

Worst observed absolute error was approximately `1.33e-15`.

Primary source:
[Dao et al., FlashAttention](https://arxiv.org/abs/2205.14135)

---

## 6. Prerequisite DAG Audit

The final gate's “100% aligned” claim is false.

| Topic | Graph predecessors | Module prerequisites | Conflict |
| --- | --- | --- | --- |
| 03 | 01, 02 | 02 | Topic 01 is omitted from the header. |
| 05 | 03, 04 | 04 | Topic 03 is omitted. |
| 09 | 01, 02, 06, 08 | 02, 08 | Topics 01 and 06 are omitted. |
| 10 | 04 | 09 | The graph and header disagree completely. |
| 12 | 04, 10, 11 | 10, 11 | Topic 04 is omitted. |
| 13 | 09, 10, 11 | 09, 10 | Topic 11 is omitted. |
| 16 | 14 | 14, 26 | Topic 26 exists only in the header. |
| 20 | 01, 03, 04 | 01 | Topics 03 and 04 are omitted. |
| 21 | 03, 04, 10 | 10 | Topics 03 and 04 are omitted. |
| 24 | 22 | 06, 11 | The graph and header disagree completely. |
| 25 | 22 | 02, 24 | The graph and header disagree. |
| 26 | none | 06 | Topic 06 exists only in the header. |
| 27 | 26 | 04, 26 | Topic 04 exists only in the header. |
| 29a | 02, 06, 07, 08 | 07, 08 | Topics 02 and 06 are omitted. |
| 29b | 03, 22, 26, 27, 28, 29a | 26, 29a | Four graph prerequisites are omitted. |

Do not repair these in two places manually.

Create one edge registry:

```text
from_topic | to_topic | reason | required/optional
```

Generate both the Mermaid graph and module prerequisite lists from that
registry.

---

## 7. Problem Selection and Pedagogy Review

### 7.1 Repairs that remain incomplete

#### Topic 18 — Aho–Corasick remains the required named mechanism

Version 4 recommended:

- longest-match vocabulary traversal as the named endpoint; and
- Aho–Corasick as an optional comparison or stress exercise.

Version 5 still makes Aho–Corasick required and places it above longest-prefix
token lookup. That preserves the earlier mismatch between the taught named
mechanism and the tokenization endpoint.

#### Topic 19 — adjacent duplicate removal remains required

Version 4 recommended making adjacent duplicate removal optional and making
pair counting plus deterministic merge selection the required focused
exercise.

Version 5 still:

- requires adjacent duplicate removal;
- gives pair counting no dedicated contract; and
- assigns the byte-BPE contract ID to an incremental-heap stress item that it
  does not implement.

#### Topic 21 — tree reconstruction remains required

Constructing a binary tree from traversals does not teach split learning.

The useful operations are:

- sorting feature values;
- identifying legal boundaries between distinct values;
- prefix gradient/Hessian or class statistics;
- gain/impurity calculation; and
- recursive partitioning.

Tree reconstruction should be optional. A sorted-feature prefix-scan exercise
should be the required foundation.

### 7.2 Custom-foundation exceptions remain unjustified

Topics 04, 09, 10, 13, 17a, 22, and 23 still rely substantially or entirely
on custom exercises.

That is not automatically wrong. Some mathematical mechanisms do not have an
honest LeetCode analogue. The curriculum must, however:

1. state that no genuine online-judge foundation was found;
2. explain why a custom local judge is the more honest choice; and
3. provide the complete executable contract that substitutes for the online
   problem.

Version 5 often skips steps 1 and 3.

### 7.3 Strong foundations to keep

Preserve:

- matrix indexing and traversal in Topics 01–02;
- bit arithmetic and overflow in Topic 05;
- graph ordering and DAG DP in Topics 06–07;
- parsing and expression trees in Topic 08;
- prefix sums and weighted selection in Topic 12;
- bounded heaps and geometry in Topic 14;
- trie operations in Topic 18;
- heap/event simulation in Topic 24;
- allocator fundamentals in Topic 25;
- weighted and bottleneck paths in Topic 26;
- circular queue state in Topic 27;
- contiguous partitioning in Topic 28; and
- interval and subtree-hashing foundations in Topic 29a.

---

## 8. Supplied Test-Suite Audit

### 8.1 What the script actually does

`test_contracts.py` is 156 lines and defines five tests:

1. Kahan;
2. asymmetric quantization;
3. online softmax;
4. FlashAttention; and
5. 1F1B.

Running it produces five passing messages and:

> `ALL CONTRACT EXECUTABLE TESTS PASSED PERFECTLY!`

The script does not:

- read `ORCHESTRATED-MASTER-CURRICULUM-V5.md`;
- extract its Python blocks;
- import a canonical implementation module;
- enumerate contract IDs;
- compare test coverage with the registry;
- test Orca;
- test ZeRO;
- test BPE;
- test HNSW;
- test PagedAttention;
- test the ring trace;
- test any Domain 2 prose implementation; or
- store a machine-readable result ledger.

At most five of the 35 real contract IDs are represented: approximately 14%
identity coverage, not 100%.

### 8.2 The tests are copies, not tests of the artifact

Each function reimplements the relevant algorithm inside the test file.
Therefore a test can pass while the master code differs.

Quantization demonstrates this directly:

- the master uses `round(v / scale) + zero_point`;
- the test uses `round(v / scale + zero_point)`.

Those expressions differ under Python's ties-to-even rounding.

For:

```text
x = [-1.0, 1/254, 128/127]
scale = 1/127
zero_point = 127
```

the master formula returns:

```text
[0, 127, 255]
```

while the test formula returns:

```text
[0, 128, 255]
```

Even the tested contracts are not reliably tied to the master artifact.

---

## 9. Executable Contract Findings

### 9.1 Missing executable implementations

These modules contain a contract ID but no Python block:

- Topic 06 — consumer reference-count deallocation;
- Topic 07 — activation liveness;
- Topic 08 — autograd tape serialization;
- Topic 09 — minimal autograd;
- Topic 10 — cross-entropy and gradients;
- Topic 12 — Top-P sampling;
- Topic 26 — network topology mapping; and
- Topic 29a — memory planning/fusion.

Some lines explicitly say implementation is omitted; others provide only a
sentence such as “post-order traversal.”

### 9.2 Required custom exercises without their own contracts

Examples include:

- sparse COO/CSR multiplication;
- Welford variance;
- per-channel quantization;
- broadcast gradient reduction;
- gradient checkpoint decisions;
- focal loss;
- beam search;
- PQ encoding and residual PQ;
- HNSW neighbor selection;
- pair counting and incremental BPE;
- Col2Im/dilated convolution;
- histogram binning;
- causal-mask construction;
- block-walk KV gather and copy-on-write;
- multi-path topology scheduling;
- MoE token routing; and
- interleaved 1F1B.

One contract per module does not satisfy one contract per required custom
problem.

### 9.3 Blocking and high-severity counterexamples

#### Topic 03 — trace is still absent

The prompt requires a block-computation trace. The schema declares only
`C`, and `tiled_gemm` returns only `C`.

Either return `(C, trace)` with an exact trace schema or remove the trace
requirement.

#### Topic 11 — empty blocks remain undefined

`online_softmax([[]])` fails at `max(block)`. Empty blocks are not excluded by
the stated bounds.

The implementation also rescales every previously stored block after each new
block, making the teaching implementation quadratic in the number of blocks.
That is acceptable only if named and contrasted with a merge-state or
two-pass implementation.

#### Topic 14 — complexity and tolerance conflict

The learning outcome still states `O(N·D log K)`, while the contract later
states the correct `O(ND + N log K)`.

The contract treats distances within `1e-6` as ties, but the code uses exact
floating-point comparisons.

Counterexample:

```text
database = [[1.0000004], [1.0]]
query = [[0.0]]
k = 1
```

The squared distances differ by approximately `8e-7`. The contract's tie rule
selects index `0`; the code returns index `1`.

#### Topic 15 — K-D-tree tie-breaking is still wrong

The away-branch condition uses:

```text
diff**2 < worst_distance
```

It must also explore equality when a smaller-ID equidistant point can replace
the current result.

Counterexample:

```text
points = [[-2], [-2], [-1]]
query = [-2]
k = 1
```

The contract requires index `0`; the code returns index `1`.

#### Topic 16 — output schema still contains undefined `K`

The function accepts `efSearch` but not `K`. The output calls itself
`top_k_indices: int32[K]`.

Define the result as the ordered `efSearch` working set, or add a separate
`k <= efSearch` result parameter.

#### Topic 17a — incomplete bounds and missing PQ contract

`ivf_lookup` has no declared bound for `nprobe`. With two centroids and
`nprobe=3`, it raises `IndexError`.

Product Quantization encoding is a required rung but has no executable
contract. ADC still needs an explicit `O(M)` per-vector complexity statement.

#### Topic 19 — Sennrich BPE example is false

For the documented vocabulary:

```text
{
  "l o w </w>": 5,
  "l o w e s t </w>": 2,
  "n e w e r </w>": 6
}
```

and `K=2`, the master implementation returns:

```text
[("w", "e"), ("l", "o")]
```

not:

```text
[("e", "r"), ("er", "</w>")]
```

The test suite never executes this example.

#### Topic 21 — contract cannot represent legal XGBoost split boundaries

The function receives only gradients and Hessians, not feature values.
Therefore it cannot avoid splitting between rows with equal feature values.

For:

```text
feature_values = [0, 0, 1]
G = [-4, -1, -1]
H = [1, 1, 1]
lambda = 1
```

the code selects split index `0`, which is illegal because the first two
feature values are equal.

The contract also omits the `-gamma` term used by the named XGBoost objective,
unless it explicitly declares `gamma=0`.

Primary source:
[XGBoost model tutorial](https://xgboost.readthedocs.io/en/stable/tutorials/model.html)

#### Topic 22 — causal masking is promised but not judged

The implementation covers a newest-token decode query where all cached
positions are valid, so no explicit causal mask is needed. It does not provide
the promised causal-mask construction or prefill attention contract.

Either narrow the topic outcome to incremental decode or add a prefill/mask
exercise with exact mask semantics.

#### Topic 24 — Orca still exceeds its token limit

The new admission rule checks the next iteration only when admitting a
request. It never stops already-active sequences from growing beyond the
limit.

For:

```text
requests = [(0, 1, 2, 7)]
max_batch_size = 1
max_total_tokens_limit = 5
```

the active token trace is:

```text
2, 3, 4, 5, 6, 7
```

The fifth step violates the declared limit.

If the first queued request has `prompt_tokens > limit` and no request is
active, the queue can never advance and the outer loop runs forever.

The function also labels phases but does not model selective batching at the
operation level. Orca's defining techniques are iteration-level scheduling
and selective batching.

Primary source:
[Yu et al., Orca](https://www.usenix.org/conference/osdi22/presentation/yu)

#### Topic 25 — lookup remains narrower than the required ladder

The positive lookup implementation is useful. It does not contract:

- block allocation/free;
- KV block walking;
- multi-head gather;
- copy-on-write; or
- reference counting.

Keep the narrow contract but add separate required contracts rather than
calling the module complete.

#### Topic 27 — NCCL overclaim remains

The ring trace is useful and its two-rank worked example is correct.

It still says ring is “the definitive NCCL algorithm.” Current NCCL supports
Ring, Tree, CollNet variants, NVLS variants, and PAT, and automatically
selects among available algorithms based on topology and architecture.

Source:
[NCCL algorithm selection documentation](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/env.html#nccl-algo)

Rename the exercise **Ring-AllReduce Trace** and treat NCCL algorithm
selection as the optional comparison endpoint.

#### Topic 28 — simplified name, exact-behavior language

Renaming the contract was correct.

The ladder still says it computes offsets “under DeepSpeed ZeRO-3 sharding”
and teaches the exact reconstruction mapping. Those claims reintroduce the
behavior that the rename was meant to avoid.

Keep one of two honest choices:

1. teach generic simplified contiguous sharding and use DeepSpeed only as
   motivation; or
2. model an exact selected DeepSpeed configuration and test per-parameter
   partition rules.

DeepSpeed Stage 3 partitions parameters and coordinates their collection and
partitioning during forward/backward execution:
[DeepSpeed ZeRO documentation](https://deepspeed.readthedocs.io/en/stable/zero3.html)

#### Topic 29a — contract ID without a contract

`CONTRACT-TOPIC-29A-IR-FUSION` appears only in the ladder. There is no input
schema, output schema, Python implementation, example, test strategy, or
visualizer state.

#### Topic 29b — required MoE router has no contract

Version 5 adds the correct conceptual endpoint—capacity-constrained MoE
routing—but supplies no:

- primary source;
- input/output schema;
- capacity or tie policy;
- token-dropping behavior;
- Python code;
- examples; or
- tests.

The only executable contract in the module is the 1F1B accountant.

### 9.4 1F1B terminology

Version 5's chosen metric is internally consistent:

```text
bubble / (ideal + bubble) = (P - 1) / (M + P - 1)
```

The cited NVIDIA article instead labels:

```text
bubble / ideal = (P - 1) / M
```

as its “bubble time fraction.”

Both ratios are useful. Publish both with distinct names and do not claim that
the first is literally the article's formula.

Source:
[NVIDIA Megatron pipeline scheduling explanation](https://developer.nvidia.com/blog/scaling-language-model-training-to-a-trillion-parameters-using-megatron/)

---

## 10. Required Version 5 Repair Loop

Do not create another broad curriculum rewrite. Patch Version 5.

### Wave 1 — Build the missing registries

Create:

1. one 31-module registry;
2. one prerequisite-edge registry; and
3. one canonical problem registry.

The problem registry must contain:

| Field | Requirement |
| --- | --- |
| Canonical ID | Stable local identity |
| Exact title | Verified title |
| Type | Online judge, local judge, paper-backed mechanism, or reference-only |
| Direct source | URL for external items |
| Canonical module | Exactly one counted home |
| Cross-links | Explicitly non-counting reuse |
| Rung | Foundation, variant, bridge, mechanism, or stress |
| Required/optional | Learner-path decision |
| Difficulty rationale | Individual explanation |
| Transfer operation | Exact reused operation |
| Contract ID | Required for custom judged problems |
| Runtime | Standard Python, NumPy, or server/PyTorch |
| Verification status | Verified, missing, disputed, or failed |

Derive counts only after the registry exists.

### Wave 2 — Close contract coverage

Give every required custom judged problem exactly one complete contract.

Prioritize:

- Topics 06–10 and 12;
- Topic 17a PQ;
- Topic 19 pair counting;
- Topic 21 valid split scanning;
- Topic 22 mask/prefill behavior;
- Topic 24 memory-safe scheduling;
- Topic 25 block walk/allocation;
- Topic 26 cost/mapping;
- Topic 29a arena planning; and
- Topic 29b MoE routing.

### Wave 3 — Repair the executable counterexamples

Add regressions for:

- exact-vector tolerance ties;
- duplicate-point K-D-tree ties;
- `nprobe > number_of_centroids`;
- the documented Sennrich BPE vocabulary;
- duplicate feature values in XGBoost;
- online-softmax empty blocks;
- Orca active growth beyond the limit;
- Orca impossible-prompt deadlock; and
- every documented worked example.

### Wave 4 — Replace the copied test script

The verifier must:

1. enumerate contract IDs from the registry;
2. extract or import the exact implementation associated with each ID;
3. parse code in its declared runtime;
4. execute every worked example;
5. execute public and hidden edge cases;
6. compare numerical algorithms with trusted references;
7. fail on uncovered required contract IDs; and
8. write a machine-readable test ledger.

The final message must report:

```text
required_contracts
implemented_contracts
parsed_contracts
example_passes
edge_case_passes
uncovered_contracts
failed_contracts
```

### Wave 5 — Run the missing review loop

Assign reviewers who did not author the relevant domain packet:

- dependency architect for the edge registry;
- provenance/dedup auditor for the problem registry;
- contract-readiness reviewer for schemas;
- numerical reviewer for Topics 03–05, 10–13, 21–23;
- retrieval reviewer for Topics 14–17b;
- scheduling/distributed reviewer for Topics 24–29b; and
- requirements auditor for DSA-first scope and transfer quality.

Every objection must receive:

1. a finding ID;
2. an owner response;
3. exact changed evidence;
4. a rerun test result; and
5. independent re-review.

### Wave 6 — Fresh gate

The final gatekeeper must not author the synthesis.

It must reproduce the counts and tests rather than quote the overview. Any
missing registry, uncovered required contract, failing example, open
disposition, or absent independent review returns `REVISE`.

---

## 11. Acceptance Criteria for the Next Gate

- [ ] Exactly 31 module records exist.
- [ ] All module metadata uses one normalized schema.
- [ ] All 31 modules retain five explicit rungs.
- [ ] The Mermaid DAG and module prerequisites are generated from one edge
      registry.
- [ ] Every mismatch in Section 6 is resolved.
- [ ] A canonical problem registry exists.
- [ ] Every counted problem has exactly one canonical home.
- [ ] Every cross-link is explicitly non-counting.
- [ ] Required, optional, external, and custom counts are derived from the
      registry.
- [ ] The lingering problem-selection issues in Section 7 are resolved.
- [ ] Every named mechanism has a primary or official source.
- [ ] Every required custom judged problem has one complete contract.
- [ ] Topics 06–10, 12, 26, and 29a have executable implementations.
- [ ] Topic 17a has a PQ encoding contract.
- [ ] Topic 21 receives feature values and legal-boundary semantics.
- [ ] Topic 22 either implements masks/prefill or narrows its outcome.
- [ ] Topic 24 cannot exceed the token limit or deadlock on an impossible
      request.
- [ ] Topic 29b has a sourced, capacity-constrained MoE routing contract.
- [ ] The Sennrich BPE examples match the implementation.
- [ ] Exact-vector and K-D-tree tie rules pass their counterexamples.
- [ ] The test runner executes code associated with actual contract IDs.
- [ ] Every required contract ID has example and edge-case results.
- [ ] The verifier fails when a required contract is uncovered.
- [ ] Zero broken local links and control characters remain.
- [ ] Every material review finding has an owner response.
- [ ] Every accepted repair has independent re-review.
- [ ] The fresh gatekeeper is independent and provides reproducible commands.

---

## 12. Next-Model Handoff

The active repair packet should contain:

1. [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)
2. [`ORCHESTRATED-MASTER-CURRICULUM-V5.md`](ORCHESTRATED-MASTER-CURRICULUM-V5.md)
3. [`CURRICULUM-EVALUATION-V5.md`](CURRICULUM-EVALUATION-V5.md)

Version 4 and its evaluation remain useful historical evidence only when a
Version 5 decision is disputed.

Use this instruction:

> Patch Version 5; do not rebuild the curriculum. First create the edge,
> module, and canonical problem registries that Version 5 claims but does not
> contain. Then close every required custom contract, execute code associated
> with the actual contract IDs, and route every failure through independent
> cross-review, owner revision, and re-review. Preserve the verified
> FlashAttention, Kahan, quantization, 1F1B, five-rung, Topic 07, Circular
> Queue, and Split Linked List repairs. Do not modify the application catalog
> until a fresh independent gate reproduces every mandatory result.

---

## 13. Final Assessment

Version 5 is better curriculum content than Version 4. It closes several
specific technical and pedagogical defects and should become the sole repair
baseline.

Its `PASS` status fails for the same deeper reason as Version 4: verification
language is stronger than the evidence.

The next cycle should be narrower:

- build the registries that were claimed but omitted;
- complete the missing contracts;
- fix the executable counterexamples;
- test the actual artifact rather than copied implementations;
- run the missing independent feedback loop; and
- gate only the reviewed, executed synthesis.
