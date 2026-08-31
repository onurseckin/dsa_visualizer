import { cases, defineMlExecution, extraCases, input } from "./helpers";

export const foundationsLinearAlgebraExecutions = [
  defineMlExecution({
    id: "ml_matrix_memory_layout",
    entrypoint: "flat_index_offset",
    invocation: {
      kind: "function",
      arguments: [input("shape"), input("strides"), input("indices"), input("offset")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Standard 2D Row-Major Offset",
          input: { shape: [4, 4], strides: [4, 1], indices: [2, 3], offset: 0 },
          expected: 11,
        },
        {
          label: "0-Index Boundary Offset",
          input: { shape: [3, 5], strides: [5, 1], indices: [0, 0], offset: 16 },
          expected: 16,
        },
        {
          label: "3D Strided View Coordinate",
          input: { shape: [2, 3, 4], strides: [12, 4, 1], indices: [1, 2, 3], offset: 8 },
          expected: 31,
        },
      ),
      ...extraCases({
        label: "Column-Major Transposed Stride",
        input: { shape: [4, 4], strides: [1, 4], indices: [2, 3], offset: 0 },
        expected: 14,
      }),
    ],
    audit: {
      signature:
        "flat_index_offset(shape: list[int], strides: list[int], indices: list[int], offset: int = 0) -> int",
      defaultInputShape:
        "{ shape: number[]; strides: number[]; indices: number[]; offset: number }",
      argumentMapping: [
        "shape <- $.shape",
        "strides <- $.strides",
        "indices <- $.indices",
        "offset <- $.offset",
      ],
      mutation: "Does not mutate inputs.",
      returnBehavior: "Returns linear memory buffer offset as an integer.",
    },
  }),

  defineMlExecution({
    id: "ml_tensor_strides_views",
    entrypoint: "as_strided_2d_window",
    invocation: {
      kind: "function",
      arguments: [input("array"), input("window_shape"), input("step")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "1D Array to 2D Sliding Windows",
          input: { array: [1, 2, 3, 4, 5], window_shape: [3, 3], step: 1 },
          expected: [
            [1, 2, 3],
            [2, 3, 4],
            [3, 4, 5],
          ],
        },
        {
          label: "Exact Size Single Window",
          input: { array: [10, 20, 30], window_shape: [1, 3], step: 1 },
          expected: [[10, 20, 30]],
        },
        {
          label: "Strided Step-2 Windows",
          input: { array: [1, 2, 3, 4, 5, 6, 7], window_shape: [3, 3], step: 2 },
          expected: [
            [1, 2, 3],
            [3, 4, 5],
            [5, 6, 7],
          ],
        },
      ),
    ],
    audit: {
      signature:
        "as_strided_2d_window(array: list[float], window_shape: list[int], step: int) -> list[list[float]]",
      defaultInputShape: "{ array: number[]; window_shape: number[]; step: number }",
      argumentMapping: ["array <- $.array", "window_shape <- $.window_shape", "step <- $.step"],
      mutation: "Zero-copy strided view without buffer replication.",
      returnBehavior: "Returns 2D list of sliding window views.",
    },
  }),

  defineMlExecution({
    id: "ml_vector_spaces_gram_schmidt",
    entrypoint: "modified_gram_schmidt_qr",
    invocation: {
      kind: "function",
      arguments: [input("matrix")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "2x2 Orthogonal Matrix",
          input: {
            matrix: [
              [1.0, 1.0],
              [1.0, -1.0],
            ],
          },
          expected: {
            is_orthogonal: true,
            reconstruction_error_le_1e5: true,
          },
        },
        {
          label: "3x3 Linearly Independent Basis",
          input: {
            matrix: [
              [12.0, -51.0, 4.0],
              [6.0, 167.0, -68.0],
              [-4.0, 24.0, -41.0],
            ],
          },
          expected: {
            is_orthogonal: true,
            reconstruction_error_le_1e5: true,
          },
        },
        {
          label: "Ill-Conditioned Collinear Vectors",
          input: {
            matrix: [
              [1.0, 1.0 + 1e-4],
              [1.0, 1.0],
            ],
          },
          expected: {
            is_orthogonal: true,
            reconstruction_error_le_1e5: true,
          },
        },
      ),
    ],
    audit: {
      signature: "modified_gram_schmidt_qr(matrix: list[list[float]]) -> dict[str, bool]",
      defaultInputShape: "{ matrix: number[][] }",
      argumentMapping: ["matrix <- $.matrix"],
      mutation: "Does not mutate input matrix.",
      returnBehavior: "Returns orthogonality and reconstruction verification status.",
    },
  }),

  defineMlExecution({
    id: "ml_matrix_svd_pca",
    entrypoint: "pca_fit_transform",
    invocation: {
      kind: "function",
      arguments: [input("X"), input("n_components")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "2D to 1D Principal Projection",
          input: {
            X: [
              [2.5, 2.4],
              [0.5, 0.7],
              [2.2, 2.9],
              [1.9, 2.2],
              [3.1, 3.0],
              [2.3, 2.7],
              [2.0, 1.6],
              [1.0, 1.1],
              [1.5, 1.6],
              [1.1, 0.9],
            ],
            n_components: 1,
          },
          expected: {
            output_shape: [10, 1],
            variance_explained_ge_90_pct: true,
          },
        },
        {
          label: "Identical Redundant Dimensions",
          input: {
            X: [
              [1.0, 2.0, 2.0],
              [2.0, 4.0, 4.0],
              [3.0, 6.0, 6.0],
            ],
            n_components: 1,
          },
          expected: {
            output_shape: [3, 1],
            variance_explained_ge_90_pct: true,
          },
        },
        {
          label: "High-Dimensional Synthetic Dataset",
          input: {
            X: [
              [1.0, 0.0, 2.0, -1.0],
              [0.0, 1.0, -1.0, 2.0],
              [2.0, 2.0, 1.0, 1.0],
              [-1.0, -1.0, 0.0, 0.0],
            ],
            n_components: 2,
          },
          expected: {
            output_shape: [4, 2],
            variance_explained_ge_90_pct: true,
          },
        },
      ),
    ],
    audit: {
      signature: "pca_fit_transform(X: list[list[float]], n_components: int) -> dict",
      defaultInputShape: "{ X: number[][]; n_components: number }",
      argumentMapping: ["X <- $.X", "n_components <- $.n_components"],
      mutation: "Centers features before SVD.",
      returnBehavior: "Returns projected coordinates and explained variance ratio status.",
    },
  }),

  defineMlExecution({
    id: "ml_gradients_jacobians_hessians",
    entrypoint: "hvp_double_backward",
    invocation: {
      kind: "function",
      arguments: [input("w"), input("v"), input("lambda_reg")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Quadratic Loss Hessian-Vector Product",
          input: { w: [1.0, 2.0], v: [1.0, 0.0], lambda_reg: 0.1 },
          expected: [2.2, 0.0],
          comparison: "deep-equal",
          tolerance: 1e-4,
        },
        {
          label: "Zero Vector Perturbation",
          input: { w: [3.0, -4.0], v: [0.0, 0.0], lambda_reg: 0.5 },
          expected: [0.0, 0.0],
          comparison: "deep-equal",
          tolerance: 1e-4,
        },
        {
          label: "High-Dimensional Regularized Vector",
          input: { w: [1.0, 1.0, 1.0], v: [0.5, 0.5, 0.5], lambda_reg: 1.0 },
          expected: [1.5, 1.5, 1.5],
          comparison: "deep-equal",
          tolerance: 1e-4,
        },
      ),
    ],
    audit: {
      signature:
        "hvp_double_backward(w: list[float], v: list[float], lambda_reg: float) -> list[float]",
      defaultInputShape: "{ w: number[]; v: number[]; lambda_reg: number }",
      argumentMapping: ["w <- $.w", "v <- $.v", "lambda_reg <- $.lambda_reg"],
      mutation: "Computes exact analytical O(D) HVP without materializing D x D Hessian matrix.",
      returnBehavior: "Returns resulting directional curvature vector.",
    },
  }),

  defineMlExecution({
    id: "ml_autodiff_engines",
    entrypoint: "reverse_autograd_toposort",
    invocation: {
      kind: "function",
      arguments: [input("nodes"), input("edges")],
    },
    packages: ["numpy"],
    cases: [
      ...cases(
        {
          label: "Simple MLP Linear Chain",
          input: {
            nodes: ["x", "w", "matmul", "b", "add", "relu", "loss"],
            edges: [
              ["x", "matmul"],
              ["w", "matmul"],
              ["matmul", "add"],
              ["b", "add"],
              ["add", "relu"],
              ["relu", "loss"],
            ],
          },
          expected: ["loss", "relu", "add", "b", "matmul", "w", "x"],
        },
        {
          label: "Single Node Root Loss",
          input: {
            nodes: ["loss"],
            edges: [],
          },
          expected: ["loss"],
        },
        {
          label: "Residual Connection Diamond Graph",
          input: {
            nodes: ["x", "f", "add", "loss"],
            edges: [
              ["x", "f"],
              ["x", "add"],
              ["f", "add"],
              ["add", "loss"],
            ],
          },
          expected: ["loss", "add", "f", "x"],
        },
      ),
    ],
    audit: {
      signature: "reverse_autograd_toposort(nodes: list[str], edges: list[list[str]]) -> list[str]",
      defaultInputShape: "{ nodes: string[]; edges: string[][] }",
      argumentMapping: ["nodes <- $.nodes", "edges <- $.edges"],
      mutation: "Topological reverse sort for backward differentiation order.",
      returnBehavior: "Returns reverse topological node sequence starting from loss.",
    },
  }),
];
