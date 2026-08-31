import { cases, defineMlExecution, input } from "./helpers";

export const foundationsClassicalMlExecutions = [
  defineMlExecution({
    id: "ml_linear_logistic_regression",
    entrypoint: "lasso_coordinate_descent",
    invocation: {
      kind: "function",
      arguments: [input("X"), input("y"), input("lambda_reg"), input("max_iter"), input("tol")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Sparse Recovery (Exact Zero Weights)",
          input: {
            X: [
              [1.0, 0.0, 5.0],
              [2.0, 0.0, -2.0],
              [3.0, 0.0, 1.0],
              [4.0, 0.0, 0.5],
            ],
            y: [2.0, 4.0, 6.0, 8.0],
            lambda_reg: 0.1,
            max_iter: 100,
            tol: 1e-4,
          },
          expected: {
            zero_features_count: 2,
            loss_decreased: true,
          },
        },
        {
          label: "High Regularization Zero Vector Collapse",
          input: {
            X: [
              [1.0, 2.0],
              [3.0, 4.0],
            ],
            y: [1.0, 2.0],
            lambda_reg: 100.0,
            max_iter: 50,
            tol: 1e-4,
          },
          expected: {
            zero_features_count: 2,
            loss_decreased: true,
          },
        },
        {
          label: "Uncorrelated Multivariable Regression",
          input: {
            X: [
              [1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0],
            ],
            y: [3.0, 2.0, 5.0],
            lambda_reg: 0.01,
            max_iter: 200,
            tol: 1e-5,
          },
          expected: {
            zero_features_count: 0,
            loss_decreased: true,
          },
        },
      ),
    ],
    audit: {
      signature:
        "lasso_coordinate_descent(X: list[list[float]], y: list[float], lambda_reg: float, max_iter: int = 100, tol: float = 1e-4) -> dict",
      defaultInputShape:
        "{ X: number[][]; y: number[]; lambda_reg: number; max_iter: number; tol: number }",
      argumentMapping: [
        "X <- $.X",
        "y <- $.y",
        "lambda_reg <- $.lambda_reg",
        "max_iter <- $.max_iter",
        "tol <- $.tol",
      ],
      mutation: "Iteratively updates weights with soft-thresholding operator S(z, lambda).",
      returnBehavior: "Returns dictionary with sparsity count and convergence status.",
    },
  }),

  defineMlExecution({
    id: "ml_decision_trees_cart",
    entrypoint: "cart_best_split_finder",
    invocation: {
      kind: "function",
      arguments: [input("X"), input("y")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Clean Separable 1D Threshold",
          input: {
            X: [[1.0], [2.0], [3.0], [8.0], [9.0], [10.0]],
            y: [0, 0, 0, 1, 1, 1],
          },
          expected: {
            best_feature: 0,
            best_threshold: 5.5,
            gini_gain_positive: true,
          },
        },
        {
          label: "Pure Node (Zero Gini Impurity)",
          input: {
            X: [
              [1.0, 2.0],
              [3.0, 4.0],
            ],
            y: [1, 1],
          },
          expected: {
            best_feature: -1,
            best_threshold: 0.0,
            gini_gain_positive: false,
          },
        },
        {
          label: "2D Feature Boundary XOR Setup",
          input: {
            X: [
              [0.0, 0.0],
              [0.0, 1.0],
              [1.0, 0.0],
              [1.0, 1.0],
            ],
            y: [0, 1, 1, 0],
          },
          expected: {
            best_feature: 0,
            best_threshold: 0.5,
            gini_gain_positive: true,
          },
        },
      ),
    ],
    audit: {
      signature: "cart_best_split_finder(X: list[list[float]], y: list[int]) -> dict",
      defaultInputShape: "{ X: number[][]; y: number[] }",
      argumentMapping: ["X <- $.X", "y <- $.y"],
      mutation: "Evaluates Gini impurity reduction across all features and sorted thresholds.",
      returnBehavior: "Returns best feature index, split threshold, and Gini gain status.",
    },
  }),

  defineMlExecution({
    id: "ml_ensemble_xgboost",
    entrypoint: "xgboost_leaf_gain_split",
    invocation: {
      kind: "function",
      arguments: [
        input("G_L"),
        input("H_L"),
        input("G_R"),
        input("H_R"),
        input("lambda_reg"),
        input("gamma"),
      ],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "High Gain Valid Split",
          input: {
            G_L: -10.0,
            H_L: 5.0,
            G_R: 10.0,
            H_R: 5.0,
            lambda_reg: 1.0,
            gamma: 0.5,
          },
          expected: {
            gain_positive: true,
            optimal_w_L: 1.6667,
            optimal_w_R: -1.6667,
          },
        },
        {
          label: "Negative Gain (Pruning Triggered by Gamma)",
          input: {
            G_L: 0.1,
            H_L: 1.0,
            G_R: 0.1,
            H_R: 1.0,
            lambda_reg: 1.0,
            gamma: 10.0,
          },
          expected: {
            gain_positive: false,
            optimal_w_L: -0.05,
            optimal_w_R: -0.05,
          },
        },
        {
          label: "Hessian Regularization Dominated Split",
          input: {
            G_L: -5.0,
            H_L: 0.01,
            G_R: 5.0,
            H_R: 0.01,
            lambda_reg: 10.0,
            gamma: 0.0,
          },
          expected: {
            gain_positive: true,
            optimal_w_L: 0.4995,
            optimal_w_R: -0.4995,
          },
        },
      ),
    ],
    audit: {
      signature:
        "xgboost_leaf_gain_split(G_L: float, H_L: float, G_R: float, H_R: float, lambda_reg: float, gamma: float) -> dict",
      defaultInputShape:
        "{ G_L: number; H_L: number; G_R: number; H_R: number; lambda_reg: number; gamma: number }",
      argumentMapping: [
        "G_L <- $.G_L",
        "H_L <- $.H_L",
        "G_R <- $.G_R",
        "H_R <- $.H_R",
        "lambda_reg <- $.lambda_reg",
        "gamma <- $.gamma",
      ],
      mutation:
        "Computes 2nd-order Taylor split gain and optimal leaf weights w* = -G / (H + lambda).",
      returnBehavior: "Returns split gain positivity and leaf weight values.",
    },
  }),

  defineMlExecution({
    id: "ml_clustering_kmeans_dbscan",
    entrypoint: "kmeans_plus_plus_init",
    invocation: {
      kind: "function",
      arguments: [input("X"), input("k"), input("seed")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "3 Separated Clusters in 2D",
          input: {
            X: [
              [0.0, 0.0],
              [0.1, 0.2],
              [10.0, 10.0],
              [10.2, 9.8],
              [-10.0, 10.0],
              [-9.9, 10.1],
            ],
            k: 3,
            seed: 42,
          },
          expected: {
            centroids_count: 3,
            distinct_centroids: true,
          },
        },
        {
          label: "Single Cluster (k = 1)",
          input: {
            X: [
              [1.0, 1.0],
              [2.0, 2.0],
              [3.0, 3.0],
            ],
            k: 1,
            seed: 42,
          },
          expected: {
            centroids_count: 1,
            distinct_centroids: true,
          },
        },
        {
          label: "Dense High-Dimensional Point Cloud",
          input: {
            X: [
              [1.0, 0.0, 0.0, 0.0],
              [0.0, 1.0, 0.0, 0.0],
              [0.0, 0.0, 1.0, 0.0],
              [0.0, 0.0, 0.0, 1.0],
            ],
            k: 4,
            seed: 42,
          },
          expected: {
            centroids_count: 4,
            distinct_centroids: true,
          },
        },
      ),
    ],
    audit: {
      signature: "kmeans_plus_plus_init(X: list[list[float]], k: int, seed: int = 42) -> dict",
      defaultInputShape: "{ X: number[][]; k: number; seed: number }",
      argumentMapping: ["X <- $.X", "k <- $.k", "seed <- $.seed"],
      mutation: "Samples subsequent centroids proportional to squared distance D(x)^2.",
      returnBehavior: "Returns selected centroid coordinates and uniqueness flag.",
    },
  }),

  defineMlExecution({
    id: "ml_svm_kernel_smo",
    entrypoint: "platt_smo_step",
    invocation: {
      kind: "function",
      arguments: [
        input("alpha1"),
        input("alpha2"),
        input("y1"),
        input("y2"),
        input("E1"),
        input("E2"),
        input("eta"),
        input("C"),
      ],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Standard Unconstrained Dual Step",
          input: {
            alpha1: 0.5,
            alpha2: 0.5,
            y1: 1,
            y2: -1,
            E1: 0.8,
            E2: -0.8,
            eta: 2.0,
            C: 1.0,
          },
          expected: {
            alpha2_updated: 1.0,
            kkt_step_valid: true,
          },
        },
        {
          label: "Boundary Box Clipping at Upper Bound C",
          input: {
            alpha1: 0.9,
            alpha2: 0.9,
            y1: 1,
            y2: 1,
            E1: 5.0,
            E2: -5.0,
            eta: 1.0,
            C: 1.0,
          },
          expected: {
            alpha2_updated: 1.0,
            kkt_step_valid: true,
          },
        },
        {
          label: "Zero Update Error Gap Equal",
          input: {
            alpha1: 0.2,
            alpha2: 0.2,
            y1: 1,
            y2: -1,
            E1: 0.5,
            E2: 0.5,
            eta: 2.0,
            C: 1.0,
          },
          expected: {
            alpha2_updated: 0.2,
            kkt_step_valid: true,
          },
        },
      ),
    ],
    audit: {
      signature:
        "platt_smo_step(alpha1: float, alpha2: float, y1: int, y2: int, E1: float, E2: float, eta: float, C: float) -> dict",
      defaultInputShape:
        "{ alpha1: number; alpha2: number; y1: number; y2: number; E1: number; E2: number; eta: number; C: number }",
      argumentMapping: [
        "alpha1 <- $.alpha1",
        "alpha2 <- $.alpha2",
        "y1 <- $.y1",
        "y2 <- $.y2",
        "E1 <- $.E1",
        "E2 <- $.E2",
        "eta <- $.eta",
        "C <- $.C",
      ],
      mutation: "Analytically optimizes dual coordinate pair (i, j) on segment [L, H].",
      returnBehavior: "Returns clipped alpha2 and feasibility validity status.",
    },
  }),

  defineMlExecution({
    id: "ml_collaborative_filtering_als",
    entrypoint: "implicit_als_user_update",
    invocation: {
      kind: "function",
      arguments: [input("user_ratings"), input("Y"), input("lambda_reg"), input("alpha_conf")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Single User Interaction Ridge Solve",
          input: {
            user_ratings: [1.0, 0.0, 2.0],
            Y: [
              [1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0],
            ],
            lambda_reg: 0.1,
            alpha_conf: 40.0,
          },
          expected: {
            user_vector_dim: 2,
            loss_finite: true,
          },
        },
        {
          label: "Cold-Start User Zero Ratings",
          input: {
            user_ratings: [0.0, 0.0, 0.0],
            Y: [
              [1.0, 0.0],
              [0.0, 1.0],
              [0.5, 0.5],
            ],
            lambda_reg: 0.5,
            alpha_conf: 40.0,
          },
          expected: {
            user_vector_dim: 2,
            loss_finite: true,
          },
        },
        {
          label: "High Rank Dense Interactions",
          input: {
            user_ratings: [5.0, 3.0, 0.0, 1.0],
            Y: [
              [1.0, 0.5, 0.0],
              [0.0, 1.0, 0.5],
              [0.5, 0.0, 1.0],
              [1.0, 1.0, 1.0],
            ],
            lambda_reg: 0.05,
            alpha_conf: 20.0,
          },
          expected: {
            user_vector_dim: 3,
            loss_finite: true,
          },
        },
      ),
    ],
    audit: {
      signature:
        "implicit_als_user_update(user_ratings: list[float], Y: list[list[float]], lambda_reg: float, alpha_conf: float = 40.0) -> dict",
      defaultInputShape:
        "{ user_ratings: number[]; Y: number[][]; lambda_reg: number; alpha_conf: number }",
      argumentMapping: [
        "user_ratings <- $.user_ratings",
        "Y <- $.Y",
        "lambda_reg <- $.lambda_reg",
        "alpha_conf <- $.alpha_conf",
      ],
      mutation:
        "Solves (Y^T C^u Y + lambda I) x_u = Y^T C^u p_u using Cholesky LL^T factorization.",
      returnBehavior: "Returns optimized latent user vector and numerical stability status.",
    },
  }),
];
