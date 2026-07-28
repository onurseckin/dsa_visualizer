# Assessment, Workspace, and Trivia Design

## Principle

The product should test the knowledge that controls engineering decisions, not
the learner's ability to reproduce an arbitrary reference script character for
character.

Code recall is useful when a short expression embodies an invariant: a stable
softmax correction, a causal mask, an optimizer-state update, a point-in-time
join predicate, or a batching admission condition. It is weak evidence for
system topology, metric selection, rollout strategy, leakage detection,
incident response, or governance.

The recommended assessment loop is:

```text
worked example
  → predict the next state
  → faded example
  → completion or Parsons ordering
  → calculation/debugging
  → changed-constraint scenario
  → delayed retrieval
```

This combines worked-example fading with retrieval practice and then tests
transfer rather than stopping at code recognition.

## Match the medium to the competency

| Knowledge or decision | Primary interaction |
| --- | --- |
| Fact, term, invariant, or formula | Short-answer trivia with explanation |
| State evolution over time | Visual prediction or simulator |
| Control flow or event ordering | Trace first, then Parsons/completion |
| Quantitative relationship | Calculator with estimation before exact result |
| Defect or violated invariant | Debugging from realistic evidence |
| Approach or topology selection | Changed-constraint scenario/design memo |
| Cross-topic production competence | Capstone plus incident exercise |

Examples:

- Tensor offsets, all-reduce steps, DAG scheduling, continuous batching, and KV
  paging are strong visual traces.
- Queueing/SLO sizing, roofline bounds, KV memory, quantization error, and
  sharded-state memory are strong calculators.
- Leakage, train-serving skew, stale artifacts, rollout regressions, and drift
  alarms are strong debugging tasks.
- Batch versus online inference, model promotion, parallelism strategy, and
  build-versus-buy are scenario decisions.

## Code-occlusion rules

Use code occlusion only when all of these are true:

1. the hidden span is short;
2. it encodes a decision-bearing invariant;
3. equivalent correct code can be accepted;
4. the surrounding context is canonical and not vendor boilerplate; and
5. the learner must also explain or predict the consequence.

Good prompts:

- Fill the stable-softmax normalization term, then predict the failure for a
  large logit if it is removed.
- Complete the point-in-time join predicate, then identify which record would
  leak future information.
- Complete the gradient-accumulation condition, then predict the optimizer-step
  count.
- Complete the batch admission guard, then explain its latency/fairness
  tradeoff.

Poor prompts:

- reproduce YAML;
- memorize an SDK call signature;
- fill many syntactically equivalent lines;
- recall vendor-specific registration boilerplate without executing it;
- reconstruct code whose main educational value is already visible in a trace.

### Trivia improvements

- Hide semantic units, not random lines.
- Accept equivalent Python expressions where feasible.
- Add a required "why?" or "what changes?" prediction after exact recall.
- Generate variants by changing shape, dtype, topology, arrival pattern,
  threshold, or failure—not only variable names.
- Record learner confidence before feedback.
- Use error categories such as invariant, state ordering, units, boundary case,
  and API syntax.
- Requeue misconceptions by concept, not merely by algorithm ID.

## Difficulty rubric

Score each item from 0 to 3 in four dimensions:

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Prerequisite depth (P) | Direct recall | One concept | Several connected concepts | Cross-topic synthesis |
| Representations/operations (R) | One form/step | Short sequence | Multiple representations | Translation across code, math, data, and system |
| Causal/state horizon (H) | Immediate result | A few local steps | Delayed or interacting effects | Long lifecycle/failure propagation |
| Decision ambiguity (T) | One correct response | Bounded alternatives | Tradeoff under constraints | Defensible design with incomplete evidence |

Total score bands:

| Score | Label | Expected task |
| ---: | --- | --- |
| 0–2 | Introductory | Recall, identify, or execute a direct operation |
| 3–4 | Developing | Trace or complete a short mechanism |
| 5–7 | Proficient | Debug, calculate, or connect multiple concepts |
| 8–10 | Advanced | Choose under material tradeoffs or long state |
| 11–12 | Systems Design | Synthesize across lifecycle concerns with ambiguity |

This rubric avoids declaring a ten-line simulation Hard solely because it is
named after FlashAttention, Triton, NCCL, or XLA.

### Example scores

| Item | P | R | H | T | Total/label |
| --- | ---: | ---: | ---: | ---: | --- |
| Compute a contiguous tensor offset | 0 | 1 | 0 | 0 | 1 · Introductory |
| Trace reverse-mode autodiff | 1 | 2 | 2 | 0 | 5 · Proficient |
| Diagnose a point-in-time join leak | 2 | 2 | 2 | 1 | 7 · Proficient |
| Size an online service to a p99 SLO | 2 | 2 | 2 | 2 | 8 · Advanced |
| Design rollback under delayed labels | 3 | 3 | 3 | 3 | 12 · Systems Design |

## Topic learning sequence

Each topic's three assessed items should sit inside a larger but repeatable
sequence:

1. **Activation:** a short pretest or scenario surfaces the learner's existing
   software-systems analogy.
2. **Worked example:** annotated state and rationale are visible.
3. **Prediction:** pause before an important transition.
4. **Fading:** remove decisions progressively while leaving scaffolding.
5. **Independent item 1:** mechanism/trace.
6. **Independent item 2:** failure/tradeoff.
7. **Independent item 3:** applied changed-constraint decision.
8. **Reflection:** learner states the invariant, failure signal, and decision
   boundary.
9. **Delayed retrieval:** revisit the concept after approximately 1 day, 7
   days, and 21–28 days.

The three curriculum items are assessed milestones. Worked examples and short
retrieval prompts do not need to become separate registry problems.

## Mastery policy

A topic is mastered when the learner:

- reaches at least 80–85% on two different item types;
- succeeds on a changed-context variant, not the memorized default input;
- explains the governing invariant or tradeoff;
- completes delayed retrieval after the initial session; and
- repairs any misconception with an isomorphic retest.

The 80–85% threshold and the proposed 1-day, 7-day, and 21–28-day schedule are
initial product policies, not values established specifically for this
audience. Calibrate them using delayed-transfer data, item discrimination, and
false-mastery/abandonment rates.

Do not average away a critical failure. For example, high arithmetic accuracy
should not compensate for allowing target leakage or approving an unsafe
rollout.

Capstones should use analytic rubrics, not exact-output tests alone. Rubric
dimensions should include requirements, data/evaluation validity,
reproducibility, reliability, observability, security/governance, cost, and
quality of tradeoff reasoning.

## Transfer from the learner's existing expertise

Use explicit analogies, then show where they break:

| Familiar systems idea | ML-specific extension |
| --- | --- |
| API schema compatibility | Data distribution, feature semantics, label definition, and time validity |
| Build artifact | Model + preprocessing + signature + environment + lineage + evaluation |
| CI/CD | CI/CD plus continuous training, data/model validation, and policy gates |
| Cache consistency | Offline/online feature consistency and point-in-time historical correctness |
| Service SLO | Service SLO plus model quality, slice quality, and delayed business outcome |
| Canary deployment | Model/data compatibility, shadow evaluation, delayed labels, rollback/fallback |
| Observability | Infrastructure + data + prediction + model + business signals |
| Incident rollback | The bad state may be data/feature/label feedback, not only the binary |

This prevents unnecessary repetition of generic DevOps while challenging false
equivalence between ordinary services and learning systems.

## Evidence base

The design draws on:

- retrieval practice and delayed retention: Roediger and Karpicke (2006);
- retrieval versus concept mapping: Karpicke and Blunt (2011);
- worked examples and cognitive load: Sweller and Cooper (1985), Sweller
  (1988), and Atkinson, Derry, Renkl, and Wortham (2000);
- fading and self-explanation: Renkl (2002) and Atkinson, Renkl, and Merrill
  (2003);
- tracing, completion, and Parsons problems in programming education: Lister et
  al. (2004), Ericson et al. (2017), and adaptive Parsons work (2022);
- mastery learning: Bloom (1968);
- spacing and interleaving: Cepeda et al. (2006) and Rohrer and Taylor (2007);
  and
- confidence calibration: Koriat (1997).

The direct experimental evidence is strongest for memory, mathematics, and
introductory programming. Applying it to a senior software engineer learning ML
systems is a reasoned transfer, not a claim that every interaction has been
validated for this exact audience. The curriculum should instrument completion,
hint use, delayed recall, transfer performance, and item discrimination, then
revise based on learner data.

Full links are in [sources.md](sources.md).
