# Task 11 Required ML Foundations Design Addendum

## Decision

Author the frozen R1–R6 bank as 18 standalone `LearningItem` definitions, one exact-ID
file per item, backed by a small required-foundations authoring kit and one explicit
manifest. Do not wrap or alias legacy algorithms.

`LearningItemBase` gains required `objective` and `completionEvidence` fields. The
legacy adapter derives both so the transitional 320-item collection remains valid.
The registry exposes the legacy and required-foundations collections separately and
combines them additively to 338 items until Task 16 removes the transition.

## Assessment and execution boundary

Every required-foundations item has:

- one of the six existing assessment modes;
- precise P/R/H/T difficulty dimensions;
- an official or primary source URL;
- canonical Python, a semantic starter, and at least three typed execution cases;
- at least three visualization steps derived from the governing invariant.

Scenario rubrics remain qualitative. Their executable playground is a separate,
deterministic artifact validator or calculator and is not represented as an exact
grade for the written scenario response.

Browser items use Python standard library or declared NumPy. No item claims PyTorch
execution unless it uses the server runtime and declares `torch`.

## Content split

| Roadmap | Trace/calculator/debugging | Scenario |
| --- | --- | --- |
| R1 | reproducible-python-environment; tensor-dtype-device-boundary | determinism-triage |
| R2 | metric-threshold-guardrails; leakage-proxy-debugging | ml-target-feedback-loop |
| R3 | dataset-contract-validator; time-group-split-builder | dataset-lineage-graph |
| R4 | tensor-layout-explorer; stable-softmax-repair | precision-policy |
| R5 | evaluation-calibration-slices; generalization-failure-diagnosis | baseline-model-selection |
| R6 | reverse-mode-autodiff; training-loop-state; activation-checkpoint-tradeoff | — |

`tensor-dtype-device-boundary` and `tensor-layout-explorer` are the two declared
NumPy browser items. The other 16 playgrounds use the standard library.

## Verification contract

Aggregate contracts enforce exact IDs, three items per roadmap node, mode diversity,
source URLs, non-placeholder identity/code, execution validation and at least three
distinct cases, parseable/executable canonical Python, semantic starters, and
meaningful changing array/matrix/graph/quantization snapshots. Each item also has a
focused spec beside the aggregate contract.
