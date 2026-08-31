import { cases, defineMlExecution, input } from "./helpers";

export const foundationsOptimizationStatsExecutions = [
  defineMlExecution({
    id: "ml_gradient_descent_adamw",
    entrypoint: "adamw_step",
    invocation: {
      kind: "function",
      arguments: [
        input("param"),
        input("grad"),
        input("m"),
        input("v"),
        input("step"),
        input("lr"),
        input("beta1"),
        input("beta2"),
        input("eps"),
        input("weight_decay"),
      ],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "First Step AdamW Calibration",
          input: {
            param: [1.0, -1.0],
            grad: [0.1, -0.2],
            m: [0.0, 0.0],
            v: [0.0, 0.0],
            step: 1,
            lr: 0.001,
            beta1: 0.9,
            beta2: 0.999,
            eps: 1e-8,
            weight_decay: 0.01,
          },
          expected: {
            param_updated: [0.98999, -0.98999],
            step_count: 1,
          },
        },
        {
          label: "Zero Gradient Decay Only",
          input: {
            param: [2.0, 4.0],
            grad: [0.0, 0.0],
            m: [0.0, 0.0],
            v: [0.0, 0.0],
            step: 1,
            lr: 0.1,
            beta1: 0.9,
            beta2: 0.999,
            eps: 1e-8,
            weight_decay: 0.1,
          },
          expected: {
            param_updated: [1.98, 3.96],
            step_count: 1,
          },
        },
        {
          label: "Step 100 Converged Bias Correction",
          input: {
            param: [0.5, 0.5],
            grad: [0.01, 0.01],
            m: [0.01, 0.01],
            v: [0.0001, 0.0001],
            step: 100,
            lr: 0.01,
            beta1: 0.9,
            beta2: 0.999,
            eps: 1e-8,
            weight_decay: 0.0,
          },
          expected: {
            param_updated: [0.49, 0.49],
            step_count: 100,
          },
        },
      ),
    ],
    audit: {
      signature:
        "adamw_step(param: list[float], grad: list[float], m: list[float], v: list[float], step: int, lr: float, beta1: float, beta2: float, eps: float, weight_decay: float) -> dict",
      defaultInputShape:
        "{ param: number[]; grad: number[]; m: number[]; v: number[]; step: number; lr: number; beta1: number; beta2: number; eps: number; weight_decay: number }",
      argumentMapping: [
        "param <- $.param",
        "grad <- $.grad",
        "m <- $.m",
        "v <- $.v",
        "step <- $.step",
        "lr <- $.lr",
        "beta1 <- $.beta1",
        "beta2 <- $.beta2",
        "eps <- $.eps",
        "weight_decay <- $.weight_decay",
      ],
      mutation: "Decoupled weight decay applied directly before gradient moment step.",
      returnBehavior: "Returns updated parameter and state vectors.",
    },
  }),

  defineMlExecution({
    id: "ml_loss_functions_info_theory",
    entrypoint: "fused_cross_entropy",
    invocation: {
      kind: "function",
      arguments: [input("logits"), input("targets")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Numerically Stable Extreme Logits",
          input: {
            logits: [
              [1000.0, 1001.0, 1002.0],
              [-500.0, -500.0, -500.0],
            ],
            targets: [2, 0],
          },
          expected: {
            finite_loss: true,
            loss_approx: 0.753,
          },
        },
        {
          label: "Single Sample Perfect Prediction",
          input: {
            logits: [[100.0, 0.0, 0.0]],
            targets: [0],
          },
          expected: {
            finite_loss: true,
            loss_approx: 0.0,
          },
        },
        {
          label: "High Vocabulary Batch",
          input: {
            logits: [
              [1.0, 2.0, 3.0, 4.0, 5.0],
              [5.0, 4.0, 3.0, 2.0, 1.0],
            ],
            targets: [4, 0],
          },
          expected: {
            finite_loss: true,
            loss_approx: 0.452,
          },
        },
      ),
    ],
    audit: {
      signature: "fused_cross_entropy(logits: list[list[float]], targets: list[int]) -> dict",
      defaultInputShape: "{ logits: number[][]; targets: number[] }",
      argumentMapping: ["logits <- $.logits", "targets <- $.targets"],
      mutation: "Computes Log-Sum-Exp online without allocating N x V softmax matrix.",
      returnBehavior: "Returns scalar mean cross-entropy loss and finite numerical flag.",
    },
  }),

  defineMlExecution({
    id: "ml_distributions_covariance",
    entrypoint: "mahalanobis_distance",
    invocation: {
      kind: "function",
      arguments: [input("x"), input("y"), input("cov_matrix")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Identity Covariance Matrix (Euclidean Distance)",
          input: {
            x: [0.0, 0.0],
            y: [3.0, 4.0],
            cov_matrix: [
              [1.0, 0.0],
              [0.0, 1.0],
            ],
          },
          expected: 5.0,
          comparison: "deep-equal",
          tolerance: 1e-4,
        },
        {
          label: "Anisotropic Diagonal Scaling",
          input: {
            x: [1.0, 2.0],
            y: [1.0, 2.0],
            cov_matrix: [
              [4.0, 0.0],
              [0.0, 9.0],
            ],
          },
          expected: 0.0,
          comparison: "deep-equal",
          tolerance: 1e-4,
        },
        {
          label: "Correlated 2D Ellipsoid",
          input: {
            x: [1.0, 1.0],
            y: [2.0, 3.0],
            cov_matrix: [
              [2.0, 1.0],
              [1.0, 2.0],
            ],
          },
          expected: 1.5275,
          comparison: "deep-equal",
          tolerance: 1e-3,
        },
      ),
    ],
    audit: {
      signature:
        "mahalanobis_distance(x: list[float], y: list[float], cov_matrix: list[list[float]]) -> float",
      defaultInputShape: "{ x: number[]; y: number[]; cov_matrix: number[][] }",
      argumentMapping: ["x <- $.x", "y <- $.y", "cov_matrix <- $.cov_matrix"],
      mutation: "Uses Cholesky solve L y = (x - mu) to avoid matrix inversion.",
      returnBehavior: "Returns statistical Mahalanobis distance scalar.",
    },
  }),

  defineMlExecution({
    id: "ml_mle_map_naive_bayes",
    entrypoint: "multinomial_naive_bayes_predict",
    invocation: {
      kind: "function",
      arguments: [input("doc_counts"), input("log_priors"), input("log_likelihoods")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Binary Sentiment Classification",
          input: {
            doc_counts: [2, 0, 1],
            log_priors: [-Math.LN2, -Math.LN2],
            log_likelihoods: [
              [-1.0, -2.0, -1.5],
              [-2.5, -0.5, -3.0],
            ],
          },
          expected: 0,
        },
        {
          label: "Zero Word Frequency Laplace Invariance",
          input: {
            doc_counts: [0, 0, 0],
            log_priors: [-0.223, -1.609],
            log_likelihoods: [
              [-1.0, -1.0, -1.0],
              [-2.0, -2.0, -2.0],
            ],
          },
          expected: 0,
        },
        {
          label: "Multi-Class Topic Assignment",
          input: {
            doc_counts: [5, 2, 0, 4],
            log_priors: [-1.098, -1.098, -1.098],
            log_likelihoods: [
              [-0.5, -1.2, -3.0, -0.8],
              [-2.0, -0.1, -1.0, -2.5],
              [-1.5, -2.0, -0.5, -1.0],
            ],
          },
          expected: 0,
        },
      ),
    ],
    audit: {
      signature:
        "multinomial_naive_bayes_predict(doc_counts: list[int], log_priors: list[float], log_likelihoods: list[list[float]]) -> int",
      defaultInputShape:
        "{ doc_counts: number[]; log_priors: number[]; log_likelihoods: number[][] }",
      argumentMapping: [
        "doc_counts <- $.doc_counts",
        "log_priors <- $.log_priors",
        "log_likelihoods <- $.log_likelihoods",
      ],
      mutation: "Log-space additive accumulation to prevent probability underflow.",
      returnBehavior: "Returns argmax predicted class integer.",
    },
  }),

  defineMlExecution({
    id: "ml_hypothesis_testing_bootstrap",
    entrypoint: "bootstrap_percentile_ci",
    invocation: {
      kind: "function",
      arguments: [input("data"), input("confidence_level"), input("num_resamples"), input("seed")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Symmetric Normal Sample CI",
          input: {
            data: [10.2, 9.8, 10.5, 10.1, 9.9, 10.3, 10.0, 9.7, 10.4, 10.1],
            confidence_level: 0.95,
            num_resamples: 1000,
            seed: 42,
          },
          expected: {
            valid_interval: true,
            mean_in_interval: true,
          },
        },
        {
          label: "Constant Array Zero Variance",
          input: {
            data: [5.0, 5.0, 5.0, 5.0, 5.0],
            confidence_level: 0.95,
            num_resamples: 100,
            seed: 42,
          },
          expected: {
            valid_interval: true,
            mean_in_interval: true,
          },
        },
        {
          label: "Heavy-Tailed Skewed Latency Dataset",
          input: {
            data: [12.0, 15.0, 14.0, 13.0, 16.0, 120.0, 14.0, 15.0, 13.0, 18.0],
            confidence_level: 0.9,
            num_resamples: 2000,
            seed: 42,
          },
          expected: {
            valid_interval: true,
            mean_in_interval: true,
          },
        },
      ),
    ],
    audit: {
      signature:
        "bootstrap_percentile_ci(data: list[float], confidence_level: float, num_resamples: int = 1000, seed: int = 42) -> dict",
      defaultInputShape:
        "{ data: number[]; confidence_level: number; num_resamples: number; seed: number }",
      argumentMapping: [
        "data <- $.data",
        "confidence_level <- $.confidence_level",
        "num_resamples <- $.num_resamples",
        "seed <- $.seed",
      ],
      mutation: "Non-parametric empirical resample with replacement.",
      returnBehavior: "Returns lower and upper percentile confidence bounds.",
    },
  }),

  defineMlExecution({
    id: "ml_sampling_top_p",
    entrypoint: "top_p_nucleus_sample",
    invocation: {
      kind: "function",
      arguments: [input("logits"), input("top_p"), input("temperature"), input("seed")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Greedy Temperature 0.0 Top-P",
          input: {
            logits: [1.0, 2.0, 10.0, 3.0],
            top_p: 0.9,
            temperature: 0.01,
            seed: 42,
          },
          expected: 2,
        },
        {
          label: "Top-P = 1.0 Full Distribution Support",
          input: {
            logits: [5.0, 0.0, 0.0],
            top_p: 1.0,
            temperature: 1.0,
            seed: 42,
          },
          expected: 0,
        },
        {
          label: "Balanced Two-Choice Distribution",
          input: {
            logits: [10.0, 10.0, -10.0, -10.0],
            top_p: 0.8,
            temperature: 1.0,
            seed: 42,
          },
          expected: 0,
        },
      ),
    ],
    audit: {
      signature:
        "top_p_nucleus_sample(logits: list[float], top_p: float, temperature: float = 1.0, seed: int = 42) -> int",
      defaultInputShape: "{ logits: number[]; top_p: number; temperature: number; seed: number }",
      argumentMapping: [
        "logits <- $.logits",
        "top_p <- $.top_p",
        "temperature <- $.temperature",
        "seed <- $.seed",
      ],
      mutation: "Filters out low-probability tail tokens whose cumulative mass exceeds top_p.",
      returnBehavior: "Returns sampled token index.",
    },
  }),
];
