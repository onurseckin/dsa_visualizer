# Evidence and Sources

Accessed 2026-07-28 unless a publication date is given.

## How the evidence was used

There is no single vendor-neutral standard for an "ML infrastructure engineer."
This redesign triangulates:

1. current role/competency blueprints for breadth and exit outcomes;
2. established university and practitioner curricula for prerequisite order;
3. MLOps lifecycle and maturity guidance for production responsibilities;
4. official framework/runtime documentation for authentic exercises;
5. original systems papers for advanced claims; and
6. learning-science research for assessment design.

Cloud-provider sources are used to identify durable lifecycle responsibilities,
not to make the curriculum vendor-specific.

## Target-item source map

This map gives every stable target item ID a primary starting source. A single
range such as `R1.1–R1.3` applies to all three listed IDs. Implementation should
attach the most specific URL to each final definition and add a primary source
for every formula, branded behavior, or performance claim introduced while
authoring.

| Target item IDs | Primary starting sources |
| --- | --- |
| R1.1–R1.3 | [MLCC prerequisites](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework); [PyTorch reproducibility](https://docs.pytorch.org/docs/stable/notes/randomness); [Tensor views](https://docs.pytorch.org/docs/stable/tensor_view.html) |
| R2.1–R2.3 | [ML problem framing](https://developers.google.com/machine-learning/problem-framing/problem-framing); [classification metrics](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) |
| R3.1–R3.3 | [Dataset partitions](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets); [TFDV](https://www.tensorflow.org/tfx/guide/tfdv); [ML Metadata](https://www.tensorflow.org/tfx/guide/mlmd) |
| R4.1–R4.3 | [PyTorch Tensor views](https://docs.pytorch.org/docs/stable/tensor_view.html); [MLCC prerequisites](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework); [CUDA best practices](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html) |
| R5.1–R5.3 | [ML Crash Course](https://developers.google.com/machine-learning/crash-course); [Rules of ML](https://developers.google.com/machine-learning/guides/rules-of-ml/); [classification metrics](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) |
| R6.1–R6.3 | [PyTorch autograd mechanics](https://docs.pytorch.org/docs/main/notes/autograd.html); [PyTorch performance tuning](https://docs.pytorch.org/tutorials/recipes/recipes/tuning_guide.html) |
| R7.1–R7.3 | [MLflow Tracking](https://mlflow.org/docs/latest/ml/tracking/); [ML Metadata](https://www.tensorflow.org/tfx/guide/mlmd) |
| R8.1–R8.3 | [Feast architecture](https://docs.feast.dev/getting-started/architecture/overview); [production data transformations](https://developers.google.com/machine-learning/crash-course/production-ml-systems/transforming-data) |
| R9.1–R9.3 | [Kubeflow Pipelines](https://www.kubeflow.org/docs/components/pipelines/concepts/pipeline/); [ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) |
| R10.1–R10.3 | [Kubernetes GPU scheduling](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/); [Kubeflow Trainer](https://www.kubeflow.org/docs/components/trainer/overview/) |
| R11.1–R11.3 | [MLflow registry workflow](https://mlflow.org/docs/latest/ml/model-registry/workflow/); [Google MLOps architecture](https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning) |
| R12.1–R12.3 | [Static versus dynamic inference](https://developers.google.com/machine-learning/crash-course/production-ml-systems/static-vs-dynamic-inference); [Ray Serve architecture](https://docs.ray.io/en/latest/serve/architecture.html); [KServe control plane](https://kserve.github.io/website/docs/concepts/architecture/control-plane) |
| R13.1–R13.3 | [Production ML monitoring](https://developers.google.com/machine-learning/crash-course/production-ml-systems/monitoring); [Rules of ML](https://developers.google.com/machine-learning/guides/rules-of-ml/); [NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) |
| R14.1–R14.3 | [NIST AI RMF](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10); [AWS ML Lens](https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/) |
| R15.1–R15.3 | [Google PMLE guide](https://cloud.google.com/learn/certification/guides/machine-learning-engineer); [Stanford CS329S syllabus](https://stanford-cs329s.github.io/syllabus.html); [Microsoft MLOps v2](https://learn.microsoft.com/en-gb/azure/architecture/ai-ml/guide/machine-learning-operations-v2) |
| E1.1–E1.3 | [NVIDIA GEMM performance](https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html); [CUDA best practices](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html); [Triton tutorials](https://triton-lang.org/main/getting-started/tutorials/) |
| E2.1–E2.3 | [PyTorch distributed](https://docs.pytorch.org/docs/stable/distributed); [NCCL collectives](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html); [ZeRO](https://doi.org/10.1109/SC41405.2020.00024); [Megatron-LM](https://arxiv.org/abs/2104.04473) |
| E3.1–E3.3 | [PyTorch quantization](https://docs.pytorch.org/docs/stable/quantization.html); [OpenXLA architecture](https://openxla.org/xla/architecture); [PyTorch compile](https://docs.pytorch.org/tutorials/intermediate/torch_compile_tutorial.html) |
| E4.1–E4.3 | [Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909); [Attention Is All You Need](https://arxiv.org/abs/1706.03762); [Grouped-Query Attention](https://arxiv.org/abs/2305.13245); [vLLM/PagedAttention](https://doi.org/10.1145/3600006.3613165) |
| E5.1–E5.3 | [vLLM/PagedAttention](https://doi.org/10.1145/3600006.3613165); [Triton Inference Server schedulers](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/scheduler.html); [Speculative Decoding](https://arxiv.org/abs/2211.17192); [SGLang/RadixAttention](https://arxiv.org/abs/2312.07104) |
| E6.1–E6.3 | [HNSW](https://arxiv.org/abs/1603.09320); [Faiss documentation](https://faiss.ai/) |
| E7.1–E7.3 | [XGBoost](https://doi.org/10.1145/2939672.2939785); [Rules of ML](https://developers.google.com/machine-learning/guides/rules-of-ml/) |
| E8.1–E8.3 | [PyTorch Conv2d](https://docs.pytorch.org/docs/stable/generated/torch.nn.Conv2d.html); [Long Short-Term Memory](https://doi.org/10.1162/neco.1997.9.8.1735) |

## Role, sequence, and lifecycle

| Source | Evidence used |
| --- | --- |
| [Google Professional Machine Learning Engineer exam guide](https://cloud.google.com/learn/certification/guides/machine-learning-engineer) | Broad role benchmark: frame/build/evaluate/productionize/optimize systems; data, serving, pipelines, MLOps, monitoring, infrastructure, security, and governance. |
| [Microsoft MLOps v2 architecture](https://learn.microsoft.com/en-gb/azure/architecture/ai-ml/guide/machine-learning-operations-v2) | Separates data, model development, deployment, operations, and shared infrastructure roles; includes promotion, staging, monitoring, and human approvals. |
| [Microsoft MLOps maturity model](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/mlops-maturity-model) | Distinguishes ordinary DevOps from reproducible, traceable, automated ML training/deployment/operations. |
| [Stanford CS329S](https://stanford-cs329s.github.io/index.html) and [syllabus](https://stanford-cs329s.github.io/syllabus.html) | Defines ML systems design as joint software, infrastructure, algorithm, and data design. Its prerequisites show systems experience does not replace ML literacy. |
| [Full Stack Deep Learning 2022](https://fullstackdeeplearning.com/course/2022/) | Sequences framework pre-labs, development infrastructure, testing, data management, deployment, continual learning, monitoring, teams, ethics, and an end-to-end project. |
| [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course) and [prerequisites](https://developers.google.com/machine-learning/crash-course/prereqs-and-prework) | Supports the numerical/Python bridge and ordered foundation: regression/classification, data, generalization, neural networks, embeddings, and production ML. |
| [Google Production ML Systems](https://developers.google.com/machine-learning/crash-course/production-ml-systems) | Requires foundational ML first and emphasizes the surrounding data, verification, feature, resource, serving, and monitoring system; model code is only one component. |
| [Google MLOps continuous delivery and automation pipelines](https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning) | Establishes CI, CD, continuous training, validation, metadata, triggers, orchestration, registry, and monitoring as lifecycle capabilities. |
| [AWS Machine Learning Lens](https://docs.aws.amazon.com/wellarchitected/latest/machine-learning-lens/) | Frames ML as a lifecycle from business goal and data through development, deployment, monitoring, and continuous improvement under operational excellence, security, reliability, performance, cost, and sustainability. |
| [NIST AI Risk Management Framework 1.0](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10) and [AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | Supports integrating Govern, Map, Measure, and Manage concerns across the lifecycle rather than adding ethics after deployment. |

## Core ML, data, and production readiness

| Source | Evidence used |
| --- | --- |
| [Google ML problem framing](https://developers.google.com/machine-learning/problem-framing/problem-framing) and [framing an ML problem](https://developers.google.com/machine-learning/problem-framing/ml-framing) | Decide whether ML is appropriate; define output, objective, action, and success before infrastructure. |
| [Dataset partitions](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets) | Train/validation/test separation and generalization. |
| [Classification metrics](https://developers.google.com/machine-learning/crash-course/classification/accuracy-precision-recall) | Accuracy is not sufficient; metric choice depends on class/error costs. |
| [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml/) | Metrics, simple baselines, trustworthy infrastructure, independent tests, freshness, skew, and feedback-loop cautions. |
| [Hidden Technical Debt in Machine Learning Systems](https://research.google/pubs/hidden-technical-debt-in-machine-learning-systems/) | ML-specific coupling, entanglement, data dependencies, feedback loops, undeclared consumers, and configuration debt. |
| [The ML Test Score](https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/) | Production readiness requires tests and monitoring across data, features, models, and infrastructure. |
| [Data Cascades in High-Stakes AI](https://research.google/pubs/everyone-wants-to-do-the-model-work-not-the-data-work-data-cascades-in-high-stakes-ai/) | Neglected data work creates compounding downstream failures. |
| [Model Cards for Model Reporting](https://research.google/pubs/model-cards-for-model-reporting/) | Intended use, evaluation conditions, subgroup performance, limitations, and documentation. |
| [TensorFlow Data Validation](https://www.tensorflow.org/tfx/guide/tfdv) | Authentic schema, anomalies, skew, and drift examples. |
| [TFX guide](https://www.tensorflow.org/tfx/guide) and [ML Metadata](https://www.tensorflow.org/tfx/guide/mlmd) | Typed pipeline components, artifacts/executions, caching, and lineage. |
| [Feast architecture](https://docs.feast.dev/getting-started/architecture/overview) and [components](https://docs.feast.dev/getting-started/components/overview) | Offline historical retrieval, point-in-time correctness, online latest-feature access, registry, and materialization. |
| [MLflow Tracking](https://mlflow.org/docs/latest/ml/tracking/) and [Model Registry workflows](https://mlflow.org/docs/latest/ml/model-registry/workflow/) | Run evidence, artifacts, lineage, immutable model versions, aliases, and promotion workflows. |
| [Kubeflow Pipelines concepts](https://www.kubeflow.org/docs/components/pipelines/concepts/pipeline/) | Component DAGs, artifacts, caching, retries, and metadata for workflow exercises. |
| [Made With ML MLOps course](https://madewithml.com/courses/mlops/) and [testing module](https://madewithml.com/courses/mlops/testing/) | Practitioner-oriented examples of end-to-end MLOps and test layers. Used as supplemental teaching material, not a normative role standard. |

## Inference, monitoring, and operations

| Source | Evidence used |
| --- | --- |
| [Static versus dynamic inference](https://developers.google.com/machine-learning/crash-course/production-ml-systems/static-vs-dynamic-inference) | Tradeoffs among offline and online prediction modes. |
| [Production ML monitoring](https://developers.google.com/machine-learning/crash-course/production-ml-systems/monitoring) | Schema, feature checks, leakage, model age, numerical stability, throughput/latency, live quality, and skew. |
| [Transforming data](https://developers.google.com/machine-learning/crash-course/production-ml-systems/transforming-data) | Consistency of transformations between training and serving. |
| [Kubernetes Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | Authentic autoscaling control-loop behavior; ML items should add model load/cold start and quality constraints. |
| [KServe architecture](https://kserve.github.io/website/docs/concepts/architecture/control-plane) and [InferenceGraph](https://kserve.github.io/website/docs/concepts/resources/inferencegraph) | Reconciliation, autoscaling, routing, canary/A/B, sequences, ensembles, and traffic splits. |
| [NVIDIA Triton Inference Server schedulers](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/user_guide/scheduler.html) | Dynamic/sequence batching and scheduler tradeoffs. Do not confuse this server with the Triton kernel language. |
| [Ray Serve architecture](https://docs.ray.io/en/latest/serve/architecture.html) | Routing, replicas, fault tolerance, autoscaling, queues, and batching. |
| [OpenTelemetry signals](https://opentelemetry.io/docs/concepts/signals/) and [Prometheus instrumentation practices](https://prometheus.io/docs/practices/instrumentation/) | Logs, metrics, traces, event boundaries, and instrumentation hygiene; ML monitoring adds data/model/business signals. |

## Numerical, accelerator, compiler, and distributed foundations

| Source | Evidence used |
| --- | --- |
| [PyTorch Tensor views](https://docs.pytorch.org/docs/stable/tensor_view.html) and [`Tensor.view`](https://docs.pytorch.org/docs/stable/generated/torch.Tensor.view.html) | Corrects overbroad claims about contiguity and teaches operation-specific layout compatibility. |
| [PyTorch autograd mechanics](https://docs.pytorch.org/docs/main/notes/autograd.html) | Computation DAG and reverse-mode differentiation. |
| [PyTorch reproducibility](https://docs.pytorch.org/docs/stable/notes/randomness) | Seeds, nondeterministic operations, platform/release limits, and performance tradeoffs. |
| [PyTorch profiler](https://docs.pytorch.org/tutorials/beginner/profiler.html) | Supports the profile-before-optimization gate. |
| [NVIDIA GEMM performance](https://docs.nvidia.com/deeplearning/performance/dl-performance-matrix-multiplication/index.html) and [CUDA C++ Best Practices](https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html) | Arithmetic intensity, memory hierarchy, transfers, coalescing, tiling, and evidence-led optimization. |
| [Triton tutorials](https://triton-lang.org/main/getting-started/tutorials/), [fused softmax](https://triton-lang.org/main/getting-started/tutorials/02-fused-softmax.html), and [matrix multiplication](https://triton-lang.org/main/getting-started/tutorials/03-matrix-multiplication.html) | Baseline for any item claiming to teach a real Triton kernel: actual execution, correctness comparison, and benchmarking. |
| [PyTorch distributed overview](https://docs.pytorch.org/tutorials/beginner/dist_overview.html) and [distributed package](https://docs.pytorch.org/docs/stable/distributed) | Collectives and stable conceptual distinctions among data/model parallel approaches. |
| [NCCL collectives](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/collectives.html) | Authoritative collective semantics; avoid a universal fixed algorithm-switch threshold. |
| [ZeRO](https://doi.org/10.1109/SC41405.2020.00024) | Optimizer/gradient/parameter sharding and memory efficiency. |
| [Megatron-LM parallelism](https://arxiv.org/abs/2104.04473) | Data, tensor, and pipeline parallelism at scale. |
| [OpenXLA architecture](https://openxla.org/xla/architecture) and [PyTorch compile tutorial](https://docs.pytorch.org/tutorials/intermediate/torch_compile_tutorial.html) | Vendor-neutral compiler concepts plus an authentic graph-capture/compile example. |

## Transformer and LLM systems

| Source | Evidence used |
| --- | --- |
| [Attention Is All You Need](https://arxiv.org/abs/1706.03762) | Transformer/attention foundation. |
| [FlashAttention](https://arxiv.org/abs/2205.14135) | IO-aware exact attention and scoped memory/performance reasoning. |
| [vLLM / PagedAttention](https://doi.org/10.1145/3600006.3613165) | Paged KV-cache management and serving throughput; claims must retain workload/system assumptions. |

## Systems performance papers for deep electives

These are reference sources, not required core reading:

- [Parameter Server](https://www.usenix.org/conference/osdi14/technical-sessions/presentation/li_mu)
  (OSDI 2014);
- [GPipe](https://proceedings.neurips.cc/paper_files/paper/2019/hash/093f65e080a295f8076b1c5722a46aa2-Abstract.html)
  (NeurIPS 2019);
- [MLPerf Training](https://proceedings.mlsys.org/paper_files/paper/2020/hash/411e39b117e885341f25efb8912945f7-Abstract.html)
  (MLSys 2020);
- [Clockwork](https://www.usenix.org/conference/osdi20/presentation/gujarati)
  (OSDI 2020);
- [Pollux](https://www.usenix.org/conference/osdi21/presentation/qiao)
  (OSDI 2021); and
- [Alpa](https://www.usenix.org/conference/osdi22/presentation/zheng-lianmin)
  (OSDI 2022).

These support lessons on time-to-quality, predictable tail latency, goodput,
parallel-plan choice, and why utilization alone is not the system objective.

## Interview and open curriculum references

These are useful for scenario coverage and terminology, but should not override
primary documentation or papers:

- Chip Huyen's open
  [Machine Learning Systems Design](https://github.com/chiphuyen/machine-learning-systems-design)
  booklet;
- Chip Huyen's open
  [Machine Learning Interviews Book](https://huyenchip.com/ml-interviews-book/);
- [Machine Learning System Design: research versus production](https://huyenchip.com/machine-learning-systems-design/research-vs-production.html);
- [Made With ML](https://madewithml.com/courses/mlops/); and
- the CS329S and Full Stack Deep Learning project prompts linked above.

Use these to derive changed-constraint design cases. Do not copy closed
interview-bank questions or solutions. Every authored problem should have an
original prompt and cite the underlying public technical facts.

## Learning science

| Source | Design implication |
| --- | --- |
| [Roediger & Karpicke 2006](https://doi.org/10.1111/j.1467-9280.2006.01693.x) | Retrieval can improve delayed retention more than repeated study. |
| [Karpicke & Blunt 2011](https://doi.org/10.1126/science.1199327) | Retrieval practice can support meaningful learning, not only rote recall. |
| [Sweller & Cooper 1985](https://doi.org/10.1207/s1532690xci0201_3) | Worked examples reduce unproductive search for novices. |
| [Sweller 1988](https://doi.org/10.1016/0364-0213(88)90023-7) | Manage cognitive load while schemas are forming. |
| [Atkinson et al. 2000](https://doi.org/10.3102/00346543070002181) | Review of worked-example effects and design. |
| [Renkl 2002](https://doi.org/10.1080/00220970209599510) | Fading moves learners from examples toward independent problem solving. |
| [Atkinson, Renkl & Merrill 2003](https://doi.org/10.1037/0022-0663.95.4.774) | Fading combined with self-explanation improves learning. |
| [Lister et al. 2004](https://doi.org/10.1145/1044550.1041673) | Program tracing and reading are foundational programming capabilities. |
| [Ericson et al. 2017](https://doi.org/10.1145/3141880.3141895) | Parsons problems can provide useful completion/reordering practice. |
| [Adaptive Parsons problems 2022](https://doi.org/10.1145/3501385.3543977) | Scaffolding can adapt to learner performance. |
| [Bloom 1968 mastery learning](https://eric.ed.gov/?id=ED053419) | Require corrective work and reassessment rather than advancing on a weak average. |
| [Cepeda et al. 2006](https://doi.org/10.1037/0033-2909.132.3.354) | Spacing improves long-term retention. |
| [Rohrer & Taylor 2007](https://doi.org/10.1007/s11251-007-9015-8) | Interleaving supports discrimination among problem types. |
| [Koriat 1997](https://doi.org/10.1037/0096-3445.126.4.349) | Confidence judgments can reveal calibration and illusion-of-knowing problems. |

The application to senior engineers learning ML systems is a curriculum
synthesis. Product telemetry and learner studies should validate the exact
spacing, mastery thresholds, and interaction formats.
