# ML Infrastructure Curriculum Audit and Redesign

Research date: 2026-07-28

Status: recommendation for review; no catalog or application code has been changed.

## Executive conclusion

The existing ML Infra tree is a strong collection of advanced ML-systems
algorithm visualizers, but it is not yet a complete path from experienced
software engineer to ML infrastructure engineer.

Its current center of gravity is tensor memory layout, GEMM, autograd,
quantization, accelerator kernels, distributed training, and LLM serving. Those
are valuable specialties. The path does not first establish the ML lifecycle:
problem framing, data and label quality, model evaluation, reproducible
training, experiment lineage, feature consistency, workflow testing, artifact
promotion, inference deployment, production monitoring, governance, cost, and
incident response.

The recommended clean-break target is:

- 15 required topics forming an end-to-end production ML lifecycle;
- 8 advanced elective topics preserving the strongest material in the current
  collection;
- 69 deliberately different assessed learning items: 45 required and 24
  elective, exactly 3 per topic;
- multiple assessment modes instead of treating every competency as a
  LeetCode-style coding problem; and
- a reduction from 232 ML-bound algorithm definitions to a curated curriculum
  that merges duplicates and archives simulations which overclaim fidelity to
  real frameworks or hardware.

The target is optimized for a senior full-stack/system-design engineer who
already understands software delivery, databases, networking, caching,
containers, and basic operations, but is new to machine learning. It teaches
the ML-specific deltas and then reconnects them to familiar systems concepts.

## Headline findings

1. **The graph starts too deep.** Tensor strides are the root. A learner can
   reach FlashAttention, Triton, ZeRO, and PagedAttention without learning how
   to define an ML target, split a dataset, evaluate a baseline, or detect
   leakage.
2. **The operational lifecycle is largely absent.** Production ML references
   consistently include data validation, metadata/lineage, orchestration,
   model registries, deployment, monitoring, and governance. These are not
   first-class nodes today.
3. **The graph contains implausible prerequisites.** Autograd gates
   tokenization, quantization gates tree ensembles and vector search,
   convolution gates graph compilation, and hardware kernels gate all
   distributed systems and LLM serving.
4. **The problem bank is much larger than the concept surface.** There are 232
   unique ML-bound definitions and 306 ML-topic memberships. Exact and
   near-duplicate baselines, fragmented implementation details, and generic DSA
   exercises inflate topic counts.
5. **Difficulty labels are title-driven in several places.** Some short toy
   simulations carry `Hard` labels because their titles mention advanced
   systems. Difficulty should instead measure prerequisite depth, representation
   load, causal horizon, and decision ambiguity.
6. **Provenance is not auditable.** Every ML-bound definition has one source
   entry, but none of the 232 source entries has a URL. Most labels are generic
   level names rather than traceable primary sources.
7. **The app already has useful foundations.** Topic identity is canonical,
   problem cards and counts are derived from the registry, the tree is
   data-driven, and workspace visualizations plus trivia provide a strong base.
   The principal problem is curriculum design and content fidelity, not the
   registry architecture.

## Recommended destination

```text
problem framing
    + data contracts/splits
    + numerical foundations
                ↓
baseline models and evaluation
                ↓
training + reproducibility + feature/data pipelines
                ↓
workflow testing/orchestration + training platform + model registry
                ↓
inference deployment and reliability
                ↓
production evaluation, incidents, governance, privacy, and cost
                ↓
end-to-end ML platform capstone
```

Advanced branches cover accelerator performance, distributed training,
compilers and quantization, transformer internals, LLM serving, vector
retrieval, tree ensembles, and vision/sequence internals. No elective is a
prerequisite for the production capstone.

## Documents

- [Current state and gap analysis](current-state.md) measures what is in the
  repository today.
- [Target curriculum and exact item bank](target-curriculum.md) defines the
  proposed 23-node DAG and all 69 learning items.
- [Current problem-bank dispositions](problem-disposition.md) explains what to
  retain, merge, rework, move, or retire.
- [Per-definition disposition ledger](current-problem-ledger.csv) assigns one
  decision and target item to every current ML-bound definition.
- [Assessment and trivia design](assessment-design.md) turns learning-science
  evidence into concrete product rules.
- [Evidence and sources](sources.md) records the external frameworks and
  primary references used.
- [Migration roadmap](migration-roadmap.md) describes a staged, testable
  implementation sequence.

## Decision requested before implementation

Ratify or revise these four choices before changing topic IDs or enrolling new
definitions:

1. the 15-topic required spine;
2. the 8 electives;
3. the 69-item cap and the rule of 3 complementary items per topic; and
4. whether retired deep exercises remain available in a non-curricular archive
   or are removed entirely.

The recommendation intentionally does not preserve old topic IDs through
aliases. The repository's catalog contract calls ID changes breaking content
changes, so implementation should perform an explicit clean break once the
target is approved.
