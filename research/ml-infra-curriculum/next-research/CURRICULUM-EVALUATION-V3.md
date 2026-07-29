# Curriculum Evaluation — Version 3

## Independent Re-evaluation of the Normalized Curriculum and Its Agentic Run

**Date:** 2026-07-29

**Artifact under review:** [`ORCHESTRATED-MASTER-CURRICULUM-V3-NORMALIZED.md`](ORCHESTRATED-MASTER-CURRICULUM-V3-NORMALIZED.md)

**Run under review:** [`agentic-runs/2026-07-29-curriculum-v2-normalization/`](agentic-runs/2026-07-29-curriculum-v2-normalization/)

**Prior proposal:** [`ORCHESTRATED-MASTER-CURRICULUM-V2.md`](ORCHESTRATED-MASTER-CURRICULUM-V2.md)

**Prior evaluation:** [`CURRICULUM-EVALUATION-V2.md`](CURRICULUM-EVALUATION-V2.md)

**Required process:** [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)

---

## 1. Executive Verdict

**Corrected run status: `REVISE`**

The Version 3 run must not be accepted as `PASS`, and Version 3 must not replace
Version 2 as the curriculum source of truth.

Version 3 contains several useful pieces:

- a much better branched, seven-domain curriculum shape;
- the correct decision to split Topic 17 and Topic 29;
- several factual corrections carried forward from the Version 2 evaluation;
- eighteen useful candidate custom-problem ideas; and
- the beginning of a canonicalization model.

However, it does not deliver the normalized curriculum it claims to deliver.
It is primarily a concatenation of four incomplete first-round reports. It
removes most of Version 2's actual learning ladders, leaves most sources
unresolved, authors contracts for only part of the curriculum, and marks
unverified assertions as complete.

The central failure is not that the researcher chose a generally wrong
direction. The direction is mostly good. The failure is that the agentic run
declared completion before performing its own required cross-review,
revision, source-completion, contract-completion, and independent gate loops.

### Authorization decision

- **Do not implement Version 3 in the application catalog.**
- **Do not delete Version 2.** It still contains the fuller curriculum content.
- Preserve the useful Version 3 architecture and draft contracts as repair
  inputs.
- Run a bounded repair cycle using this evaluation, not another unconstrained
  curriculum brainstorm.

---

## 2. Corrected Gate Scorecard

| Gate | Version 3 result | Correct status |
| --- | --- | --- |
| DSA/applied-math scope purity | The artifact avoids deployment and administration work. | `PASS` |
| Seven-domain organization | Seven domains are visible and generally useful. | `PASS WITH REVISIONS` |
| Prerequisite DAG | A promising branched DAG exists, but several important or incorrect edges remain. | `REVISE` |
| Topic 17 and Topic 29 splits | Split names appear in the DAG, but the registry still has combined Topic 17 and Topic 29 sections. | `FAIL` |
| Complete 31-module curriculum | There are 29 source-registry headings and zero complete 31-module learning ladders. | `FAIL` |
| Technical corrections from Version 2 | Several corrections are present, but new technical and contract errors were introduced. | `REVISE` |
| Source provenance | Only 7 registry sections contain URLs; 22 explicitly say no URL was found. | `FAIL` |
| Named-mechanism primary sources | Contract references are labels, not literal links, and are absent for many mechanisms. | `FAIL` |
| Deduplicated canonical problem bank | Only five duplicate families are discussed; no full inventory or unique count exists. | `FAIL` |
| Complete executable contracts | Eighteen partial contracts exist, while thirteen modules have none and no contract satisfies the declared schema fully. | `FAIL` |
| Required versus optional path | Not supplied. | `FAIL` |
| Per-problem difficulty rationale | Not supplied. | `FAIL` |
| Agentic feedback-loop compliance | No recorded independent cross-review, revision round, targeted research round, or fresh gate evidence. | `FAIL` |
| Implementation readiness | The artifact cannot safely drive catalog migration. | `FAIL` |

The run's own [`final-gate-report.md`](agentic-runs/2026-07-29-curriculum-v2-normalization/final-gate-report.md)
therefore records an unsupported verdict.

---

## 3. Mechanical Audit

The following observations are directly reproducible from the files.

| Measure | Version 3 claim | Observed result |
| --- | --- | --- |
| Canonical topic modules | 31 | 29 topic registry headings |
| Split registry sections | Topics 17a, 17b, 29a, and 29b | Combined Topic 17 and Topic 29 headings remain |
| Complete topic ladders | 31 bounded modules | No complete per-module five-rung ladders |
| Registry sections with URLs | All 31 | 7 sections |
| Explicit source placeholders | None expected | 22 `No direct URLs found` entries |
| URL occurrences | Complete provenance | 40 occurrences, 37 unique URLs |
| Custom problem contracts | All custom exercises | 18 contracts |
| Modules with no contract | None expected | 13 of 31 modules |
| Worked examples per contract | At least 2 | One short example per contract |
| Canonical Python implementations | One per contract | 2 Python code blocks for 18 contracts |
| Literal URLs in the contract section | One primary source per contract | 0 |
| Unique canonical problem count | Required | Absent |
| Required/optional curriculum path | Required | Absent |
| Individual difficulty justification | Required | Absent |
| Revision-round artifacts | Required for blocking feedback | Absent |
| Final normalized draft in run folder | Required by protocol | Absent |

Version 2 contains approximately 15,187 words across 1,350 lines. Version 3
contains approximately 4,766 words across 609 lines. Shorter is not inherently
wrong, but here the reduction came from dropping the topic ladders and question
rationales that made the document a curriculum.

Version 3 also contains two broken same-folder links at its beginning. It links
to the evaluation and protocol through `../`, even though all three files are
in `next-research/`.

---

## 4. Agentic Run Audit

### 4.1 What the protocol required

The protocol requires a sequence resembling:

1. run contract;
2. question and risk map;
3. bounded specialist work;
4. normalized evidence ledger;
5. independent cross-review;
6. owner revision or targeted research;
7. independent re-review;
8. synthesis;
9. fresh adversarial gate; and
10. repetition until honest `PASS` or `BLOCKED`.

### 4.2 What the run actually recorded

The run folder contains:

- one contract;
- one task map;
- one evidence ledger;
- one disposition ledger;
- one decision log;
- four `round-01` specialist reports; and
- one final gate report.

It does not contain:

- reviewer reports for the reviewer roles named in the task map;
- owner responses to reviewer objections;
- `round-02`;
- targeted research packets;
- independent re-review results;
- adjudication records;
- a `final-draft.md`; or
- raw verification evidence from a fresh gatekeeper.

This is the exact “one fan-out, one synthesis” failure mode that the protocol
was created to prevent.

### 4.3 Evidence-ledger defects

The evidence ledger imports fourteen findings from the prior evaluation, but
it does not demonstrate that the new work was independently checked.

Specific defects:

- The protocol's required `Counterevidence` field is absent.
- Most evidence points back to Version 2 or its evaluation rather than the new
  primary research required to close the finding.
- All fourteen findings are accepted; no new contradiction, rejected finding,
  modified finding, or uncertainty is recorded.
- Finding F-12 says all 31 foundation rungs must receive literal URLs, while
  the specialist report explicitly leaves 22 topic headings without URLs.
- Finding F-14 says every custom exercise needs a complete contract, but only
  eighteen partial contracts were authored.

### 4.4 Disposition-ledger defects

Every item is marked `Ready for Synthesis`. That is not the same as independently
verified.

The disposition ledger:

- does not record reviewer findings;
- does not show what changed after review;
- does not link to test output or source verification;
- does not distinguish partial closure from full closure; and
- contradicts the actual files for F-12 and F-14.

### 4.5 Gatekeeper defects

The final gate report repeatedly uses statements such as “verified across all
31 topic modules” without showing the verification.

The gate is not credible because:

- 31 registry modules do not exist;
- the source registry visibly contains 22 source placeholders;
- the contract section visibly omits thirteen modules;
- no complete contract has two worked examples;
- no canonical count exists;
- no difficulty rationale exists;
- the task map gives the gatekeeper's work back to the orchestrator for review,
  but no independent review artifact is present; and
- the run contract's checkboxes remain unchecked.

The correct gatekeeper result is `REVISE`, not `PASS`.

### 4.6 Architecture-report mismatch

The round-one architecture specialist proposed a mostly linear graph:

`T01 → T02 → T03 → T04 → T05 → T06 ...`

The final Version 3 document instead contains a significantly different
branched graph. The branched graph is the better direction, but the final
architecture was not the one captured in the specialist report, and no
cross-review or decision record explains the change.

This matters because the supposedly reviewed evidence does not actually cover
the final artifact.

---

## 5. What Version 3 Improved and Should Preserve

The repair run should not throw everything away.

### 5.1 Preserve the seven-domain organization

The following domain partition is coherent:

1. tensor representation and numerical kernels;
2. computation graphs, autograd, and training mathematics;
3. retrieval and vector indexing;
4. tokenization and spatial operators;
5. model algorithm internals;
6. inference scheduling and memory; and
7. distributed execution and compiler planning.

This is easier to learn from than a single linear chain.

### 5.2 Preserve the split decisions

The following four modules should remain separate:

- **17a — Inverted File Index, Product Quantization, and ADC**
- **17b — Locality-Sensitive Hashing**
- **29a — Graph Compiler Transforms, Fusion, and Memory Planning**
- **29b — Tensor, Pipeline, and Expert Parallel Algorithms**

The problem is not the decision. The problem is that the decision was applied
only to the DAG, not to the full curriculum registry and ladders.

### 5.3 Preserve the corrected factual direction

Keep the following corrections, while integrating them into complete modules:

- LeetCode 2502 for the allocator foundation;
- KV-cache accounting with `num_kv_heads`;
- the distinction between machine epsilon and unit roundoff;
- PyTorch gradient accumulation semantics;
- dilation in the convolution output formula;
- `col2im` as scatter-add;
- the latency-plus-transfer interconnect model; and
- parameterized, assumption-bound performance claims.

### 5.4 Preserve the candidate contract ideas

All eighteen contract topics are potentially useful. Several need major
redesign or narrower names, but most should remain in the candidate bank.

---

## 6. Curriculum Architecture Review

### 6.1 Good changes

The final Version 3 DAG correctly avoids forcing unrelated branches through a
single path. Retrieval, tokenization, model internals, serving memory, and
distributed execution can branch after their genuine prerequisites.

### 6.2 Required edge corrections

The next architecture specialist should explicitly adjudicate these edges:

| Current issue | Required correction or decision |
| --- | --- |
| Topic 05 quantization depends only on Topic 04 | Add Topic 03 as a prerequisite for quantized matrix kernels, or split scalar quantization from quantized GEMM. |
| Topic 12 sampling depends only on Topic 04 | Add Topic 10 probability and Topic 11 stable logits/softmax as prerequisites. |
| Topic 21 decision trees/XGBoost depends on matrix multiplication | Remove or justify `T03 → T21`; add Topic 10 for impurity/loss mathematics and ensure sorting/tree foundations exist inside the module. |
| Topic 27 ring collectives is disconnected from Topic 26 networking | Add `T26 → T27`. |
| Topic 29a compiler planning lacks layout prerequisites | Add Topic 02, and possibly Topic 03, to graph/liveness/IR prerequisites. |
| Topic 29b combines three parallelism families | Keep them in one advanced module only if its internal ladder separates tensor, pipeline, and expert-parallel mechanisms and supplies shared prerequisites. Otherwise split again. |

The resulting DAG must be reviewed as the exact graph that appears in the
final curriculum, not as a different earlier draft.

### 6.3 Required module schema

Each of the 31 modules needs the same explicit structure:

1. bounded topic title and learning outcome;
2. prerequisites and outgoing dependencies;
3. real DSA/math foundations;
4. focused variants;
5. direct ML bridge;
6. named ML-infrastructure mechanism;
7. stress/tradeoff endpoint;
8. required versus optional problems;
9. per-problem difficulty and rationale;
10. canonical source mappings;
11. complete custom problem contracts; and
12. visualizer suitability.

Version 3 currently provides none of these as a complete 31-module registry.

---

## 7. Question and Source Selection Review

### 7.1 Version 3 is not a complete question-list revision

Version 3 does not provide a new full question bank. It copies a small subset
of Version 2's online links, omits the remaining ladders, and then adds partial
contracts.

Therefore it is not possible to conclude from Version 3 that:

- all questions were re-evaluated;
- unnecessary questions were removed;
- adequate foundations exist for every topic;
- the final problem count is known; or
- the required path is balanced from easy to hard.

The next run must restore the full problem registry before making any of those
claims.

### 7.2 Source-provenance failure

Only Topics 01, 02, 06, 07, 14, 15, and 18 contain URLs in the source registry.
The remaining headings contain placeholders.

Additional problems:

- Topic 18 uses generic labels such as `Link` instead of exact titles and IDs.
- Split Topics 17a/17b and 29a/29b do not receive separate source sections.
- None of the eighteen contract `Primary Reference` fields contains a literal
  URL.
- The registry is titled “All 31 Topics” while containing 29 headings.
- The source report says it will synthesize sources later, but the gate treats
  that future work as completed.

### 7.3 Incorrectly retained problem

**Remove LeetCode 1458 — Max Dot Product of Two Subsequences from Topic 14.**

It is sequence dynamic programming. Its use of the words “dot product” does
not teach exact vector search, fixed-dimensional similarity calculation,
top-k retrieval, sparse dot products, or heap-based nearest-neighbor
selection.

The Version 2 evaluation already identified this mismatch, but Version 3
retained it.

### 7.4 Canonicalization is incomplete

The deduplication section discusses only:

- reshape/transpose;
- Kahan/Welford;
- k-closest points;
- compiler common-subexpression/liveness concepts; and
- sparse matrix multiplication.

That is not a complete canonical problem inventory. It also contains unresolved
language: “Topic 29 (and 29a if applicable).”

The final registry must contain one row per unique problem:

| Required field | Meaning |
| --- | --- |
| Canonical problem ID | Stable local identity |
| Exact title | Verified platform or authored title |
| Source type | Online judge, primary paper, official documentation, or custom |
| Direct URL | Literal canonical URL when external |
| Canonical module | Exactly one counted home |
| Cross-linked modules | Non-counting reuse |
| Rung | Foundation, variant, bridge, mechanism, or stress |
| Required/optional | Learner path decision |
| Difficulty | Individually justified |
| Transfer rationale | Exact operation that transfers to the ML endpoint |
| Contract status | Complete, partial, or not applicable |

The unique problem count must be derived from this registry, not selected as a
quota in advance.

---

## 8. Executable Problem Contract Audit

### 8.1 Coverage

Contracts exist for Topics:

`02, 03, 04, 05, 09, 11, 12, 13, 16, 19, 20, 22, 23, 24, 25, 27, 28, 29b`

No contract exists for:

`01, 06, 07, 08, 10, 14, 15, 17a, 17b, 18, 21, 26, 29a`

The latter set contains thirteen modules. Some modules may rely entirely on
online judge problems, but Version 3 does not say that, and several of these
modules plainly require a custom named-mechanism endpoint.

### 8.2 Schema compliance

The document's own schema requires:

- exact input and output types;
- constraints and bounds;
- numerical tolerance and tie rules;
- at least two fully worked examples;
- a canonical Python implementation;
- a test strategy; and
- a visualizer state.

Observed:

- each contract has only one short example;
- most examples omit full input and output;
- only two contracts include Python code;
- most “reference implementations” are one-sentence algorithm hints;
- no actual contract primary reference is a link;
- types such as `Node`, `Request`, `Q_blocks`, and `O_blocks` are undefined;
- many inputs have no size, validity, dtype, or shape bounds; and
- several test oracles are ambiguous.

The contracts are useful design notes, not executable judge specifications.

### 8.3 Contract-by-contract disposition

| Contract | Verdict | Required repair |
| --- | --- | --- |
| Storage Offset and Stride Math | `REPAIR` | Add an official view/stride URL, second worked example, zero-dimensional behavior, storage bounds, and negative-stride policy. |
| SRAM Tiled GEMM | `MAJOR REPAIR` | Supply code, exact shape validation, tile bounds, deterministic accumulation order, and tolerance-based comparison rather than undefined “exact floating-point” equality. |
| Kahan Compensated Summation | `REPAIR` | Fix the runtime/precision assumptions, either exclude or define NaN/Inf behavior, and add examples that expose compensation. |
| Scale and Zero-Point Quantization | `MAJOR REPAIR` | Define calibration convention, clamp the zero point and outputs, specify rounding precisely, validate `qmin < qmax`, and define empty and constant inputs. |
| Minimal Autograd Backward | `MAJOR REPAIR` | Define a serializable graph schema and operations instead of an undefined in-memory `Node`, or make this a library-API exercise rather than a judge problem. |
| Online Softmax Update | `INVALID AS WRITTEN` | It cannot return finalized earlier softmax blocks while neither storing nor replaying them. Return online state, retain a rescalable output accumulator, or explicitly permit a second pass. |
| Top-P Sampling | `REPAIR` | Define valid `p`, validation of the probability vector, the exact `>= p` cutoff, zero-mass behavior, and whether `p=0` is a deliberate local extension. |
| AdamW Step | `MAJOR REPAIR` | Fix the exact update order, add executable code and scalar/vector cases, and match a named PyTorch configuration. |
| HNSW efSearch | `MAJOR REPAIR` | Implement the original search-layer algorithm with visited set, candidate queue `C`, bounded result set `W`, stop condition, and deterministic distance ties. |
| BPE Merge-Rank Encoder | `MAJOR REPAIR` | Choose one variant: Sennrich word/subword BPE, byte-level BPE, or another rank-based tokenizer. Define word-boundary and byte/Unicode behavior. |
| Im2Col Flattening | `REPAIR` | Define exact layout, shape formula, malformed/ragged inputs, complete example output, and executable Python. |
| SDPA and KV Cache Append | `MAJOR REPAIR` | Define tensor shapes, head layout, causal masking, dtype/tolerance, GQA/MQA scope, and cache-length validation. |
| FlashAttention Tile Loop | `MAJOR REPAIR` | Specify all shapes and recurrences, edge tiles, mask behavior, and online output rescaling. Its endpoint must test IO-aware tiled exact attention, not merely name it. |
| Orca Scheduler | `INVALID AS NAMED` | Filling free batch slots with FCFS is a generic queue exercise. Add per-iteration execution, completion, selective batching, and token/memory constraints, or rename it as a basic batching prerequisite. |
| PagedAttention Lookup | `KEEP AS NARROW BRIDGE` | Rename it as logical-to-physical KV block lookup, define sequence length and invalid indices, then add allocation/copy-on-write or block-walk exercises before calling the endpoint PagedAttention. |
| Ring AllReduce Trace | `MAJOR REPAIR` | Define node/chunk nesting and direction precisely. Separate a single reduce-scatter step from a complete reduce-scatter plus all-gather trace. Add worked states after every step. |
| ZeRO-3 Partition Accountant | `CRITICAL REPAIR` | Correct the example, define flattening, rank partitions, inclusive/exclusive offsets, padding, alignment, persistence exceptions, and whether this models DeepSpeed exactly or a simplified sharder. |
| 1F1B Bubble Accountant | `CRITICAL REPAIR` | Define whether output is bubble duration, overhead ratio, actual utilization, or total idle-stage slots. Include `t_f`/`t_b` or a unit-time assumption and provide a full schedule example. |

---

## 9. Primary-Source Technical Findings

These checks do not attempt to replace the missing full source audit. They
demonstrate that the current contracts cannot pass a primary-source gate.

### 9.1 Online softmax

The original online-normalizer algorithm computes the running maximum and
normalizer in one pass, then performs another pass to emit final softmax
values. Earlier outputs depend on the final maximum and denominator.

Source:
[Milakov and Gimelshein, Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867)

Therefore the current combination of:

- returning every normalized block;
- processing blocks once; and
- not storing all blocks

is internally inconsistent unless the problem returns only state, keeps a
rescalable output accumulator, or permits replay.

### 9.2 AdamW

PyTorch's published algorithm applies decoupled weight decay to the existing
parameter and then performs the adaptive update using defined moment and
bias-correction steps.

Source:
[PyTorch AdamW documentation](https://docs.pytorch.org/docs/main/generated/torch.optim.AdamW.html)

The Version 3 phrase “standard Adam equations ... plus weight decay” is not
precise enough for a judge oracle or a 100-step PyTorch comparison.

### 9.3 HNSW

The original HNSW `SEARCH-LAYER` algorithm maintains:

- visited elements;
- a nearest-first candidate queue;
- a dynamic result set of up to `ef` elements;
- a furthest-result stop condition; and
- insertion/removal rules for the result set.

Source:
[Malkov and Yashunin, HNSW paper](https://users.cs.utah.edu/~pandey/courses/cs6530/fall24/papers/vectordb/HNSW.pdf)

“Maintaining a candidate queue of size efSearch” is an oversimplification and
should not define the contract.

### 9.4 BPE

The cited Sennrich work applies BPE-derived segmentation to subword units for
open-vocabulary translation. That is not automatically identical to every
modern byte-level, rank-based tokenizer.

Source:
[Sennrich, Haddow, and Birch, Neural Machine Translation of Rare Words with Subword Units](https://aclanthology.org/P16-1162/)

The contract must name and fully specify its chosen variant.

### 9.5 FlashAttention

FlashAttention is an exact, IO-aware attention algorithm whose core learning
goal is tiling that reduces HBM/SRAM traffic while correctly maintaining
online normalization.

Source:
[Dao et al., FlashAttention](https://arxiv.org/abs/2205.14135)

A contract with undefined block types and a prose-only implementation cannot
test the named mechanism.

### 9.6 Orca

Orca's defining ideas are iteration-level scheduling and selective batching.

Source:
[Yu et al., Orca, OSDI 2022](https://www.usenix.org/conference/osdi22/presentation/yu)

Moving enough FCFS requests to fill a fixed batch teaches a prerequisite queue
operation, not the Orca endpoint.

### 9.7 PagedAttention

PagedAttention addresses dynamic KV-cache memory through block-based paging and
the attention algorithm that consumes those non-contiguous blocks.

Source:
[Kwon et al., Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180)

The O(1) block-table lookup is a good foundational bridge. It must not be
presented as sufficient coverage of the whole named mechanism.

### 9.8 ZeRO-3

ZeRO stage 3 partitions optimizer state, gradients, and parameters. DeepSpeed's
actual reconstruction logic explicitly handles partition sizes and padding.

Sources:

- [DeepSpeed ZeRO documentation](https://deepspeed.readthedocs.io/en/stable/zero3.html)
- [DeepSpeed ZeRO-3 reconstruction implementation](https://deepspeed.readthedocs.io/en/stable/_modules/deepspeed/utils/zero_to_fp32.html)

The Version 3 example is also arithmetically wrong. Two parameters of five
elements each flatten to ten elements. With two equal contiguous rank
partitions, rank 0 receives the first five elements—exactly the first
parameter—not “parameter 0 and half of parameter 1.”

### 9.9 Non-interleaved 1F1B

NVIDIA's Megatron explanation defines a warm-up, 1F1B steady state, and
cool-down. Under its stated assumptions:

- bubble duration is `(p - 1) * (t_f + t_b)`; and
- the bubble-to-ideal-processing ratio is `(p - 1) / m`.

Source:
[NVIDIA, Scaling Language Model Training to a Trillion Parameters Using Megatron](https://developer.nvidia.com/blog/scaling-language-model-training-to-a-trillion-parameters-using-megatron/)

That is not the same as an undefined integer count of “bubble slots.”

---

## 10. Required Repair Run

The next small-model run should repair Version 3 in controlled waves.

### Wave 0 — Correct the state

Before research begins:

- record the current gate as `REVISE`;
- state that no catalog implementation is authorized;
- treat Version 2 as the fuller content baseline;
- treat Version 3 as an architecture and draft-contract patch set; and
- use this evaluation as the active defect ledger.

### Wave 1 — Restore the complete curriculum

Create exactly 31 module records:

`01–16, 17a, 17b, 18–28, 29a, 29b`

For every record, restore and normalize:

- learning outcome;
- prerequisites;
- five-rung ladder;
- complete problem selections;
- required/optional status;
- difficulty rationale;
- transfer rationale; and
- source references.

Do not merely append Version 2 beneath Version 3. Normalize each module into
one schema.

### Wave 2 — Build the canonical inventories

Produce:

1. a 31-row module registry;
2. a one-row-per-problem canonical registry;
3. a claim-to-source registry for named mechanisms;
4. a duplicate/cross-link ledger;
5. a derived unique problem count; and
6. a missing-contract inventory.

Every external foundation must have an exact title, platform ID when one
exists, direct URL, canonical home, learning purpose, and required/optional
status.

### Wave 3 — Repair contracts in bounded specialist packets

Use specialist groups:

- tensor layout, GEMM, quantization, and numerics;
- autograd, probability, softmax, optimizers, and sampling;
- retrieval, HNSW, IVF/PQ/ADC, and LSH;
- tokenization and spatial operators;
- attention, FlashAttention, scheduling, and paged KV memory; and
- collectives, ZeRO, pipeline scheduling, expert routing, and compiler
  planning.

Each specialist must return executable schemas and Python reference
implementations, not prose summaries.

### Wave 4 — Mandatory cross-review and revision

For every specialist packet:

1. an independent reviewer receives the raw module and neutral rubric;
2. the reviewer records technical, pedagogical, source, and judgeability
   findings;
3. findings return to the original owner;
4. the owner revises or disputes each finding with evidence;
5. unresolved questions go to narrowly scoped research agents; and
6. a different reviewer re-checks the revised result.

No item may move directly from initial authoring to `Ready for Synthesis`.

### Wave 5 — Synthesis and mechanical verification

Before the gatekeeper runs, verify:

- exactly 31 module records;
- no combined Topic 17 or Topic 29 registry headings;
- zero source placeholders;
- no broken local links;
- no duplicate canonical problem IDs;
- every cross-link points to one canonical problem;
- a derived unique count exists;
- every module has a complete path;
- every custom exercise has a contract;
- every contract has at least two worked examples;
- every contract has executable Python and deterministic tests;
- every named mechanism has a primary source; and
- every difficulty is individually justified.

The verification report must show commands, counts, and failures—not only
claims that checks were performed.

### Wave 6 — Fresh gate

The final gatekeeper must:

- be independent from synthesis;
- receive the final artifacts and a neutral rubric;
- not receive a desired answer of `PASS`;
- sample technical contracts against primary sources;
- reproduce the mechanical counts; and
- return `PASS`, `REVISE`, or `BLOCKED` with evidence.

If any mandatory gate fails, return to the owner and reviewer loop.

---

## 11. Exact Completion Criteria for Version 4

A future Version 4 may be accepted only when all of the following are true:

- [ ] The final document contains 31 complete module records.
- [ ] Topics 17a, 17b, 29a, and 29b exist everywhere, not only in the DAG.
- [ ] The final DAG has been independently reviewed in its final form.
- [ ] Every module progresses from transferable foundations to direct ML
      mechanisms.
- [ ] No false word-level analogy is used as transfer evidence.
- [ ] Every online problem has an exact identity and direct URL.
- [ ] Every named mechanism has a primary paper or official source.
- [ ] LeetCode 1458 is removed from exact vector search.
- [ ] Every unique problem has one canonical counted home.
- [ ] Required and optional problems are explicit.
- [ ] Difficulty and inclusion are justified individually.
- [ ] The unique problem count is derived, not quota-driven.
- [ ] Every custom exercise is fully judgeable.
- [ ] Every contract has deterministic Python, tests, two examples, and
      visualizer state.
- [ ] The critical contract errors in Section 8 are closed.
- [ ] Cross-review, revision, re-review, and adjudication artifacts exist.
- [ ] A fresh gatekeeper reproduces the checks and returns `PASS`.

---

## 12. Handoff Guidance

Give the next research model these five authoritative inputs, in order:

1. [`AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md`](AGENTIC-RESEARCH-EVALUATION-PROTOCOL.md)
2. [`ORCHESTRATED-MASTER-CURRICULUM-V2.md`](ORCHESTRATED-MASTER-CURRICULUM-V2.md)
3. [`CURRICULUM-EVALUATION-V2.md`](CURRICULUM-EVALUATION-V2.md)
4. [`ORCHESTRATED-MASTER-CURRICULUM-V3-NORMALIZED.md`](ORCHESTRATED-MASTER-CURRICULUM-V3-NORMALIZED.md)
5. [`CURRICULUM-EVALUATION-V3.md`](CURRICULUM-EVALUATION-V3.md)

Use Version 2 to recover the learning ladders and question context, and its
evaluation to retain the original corrections and rationale. Use Version 3 for
the improved domain architecture, split decisions, and draft contracts. Use
this evaluation as the latest defect and acceptance ledger.

The next instruction should be:

> Repair the Version 3 curriculum through the protocol's cross-review and
> revision loops. Do not start application implementation. Do not replace the
> curriculum with a summary. Preserve the useful seven-domain architecture,
> restore all 31 complete learning modules from the Version 2 content baseline,
> close every Version 3 evaluation finding with evidence, and request a fresh
> gate only after the mechanical and technical completion checks pass.

---

## 13. Final Assessment

Version 3 is a useful intermediate repair artifact, not a normalized master
curriculum.

Its best contribution is the branched domain architecture. Its most serious
failure is the unsupported `PASS`, because that verdict would authorize
implementation of incomplete and sometimes incorrect content.

The correct next step is a focused Version 3 repair cycle that restores the
curriculum, completes the evidence and contract inventories, performs the
missing feedback loops, and produces a genuinely independently verified
Version 4.
