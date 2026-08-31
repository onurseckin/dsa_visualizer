import { cases, defineMlExecution, input } from "./helpers";

export const systemsNlpRetrievalDlExecutions = [
  defineMlExecution({
    id: "ml_trie_aho_corasick",
    entrypoint: "aho_corasick_search",
    invocation: {
      kind: "function",
      arguments: [input("text"), input("patterns")],
    },
    cases: cases(
      {
        label: "Multiple Keyword Matches",
        input: {
          text: "ushers",
          patterns: ["he", "she", "his", "hers"],
        },
        expected: [
          { pattern: "she", start: 1, end: 3 },
          { pattern: "he", start: 2, end: 3 },
          { pattern: "hers", start: 2, end: 5 },
        ],
      },
      {
        label: "No Match in Text",
        input: {
          text: "abcdefg",
          patterns: ["xyz", "uvw"],
        },
        expected: [],
      },
      {
        label: "Overlapping DNA Substring Search",
        input: {
          text: "CAGTCAGTC",
          patterns: ["CAG", "TC", "AGTC"],
        },
        expected: [
          { pattern: "CAG", start: 0, end: 2 },
          { pattern: "AGTC", start: 1, end: 4 },
          { pattern: "TC", start: 3, end: 4 },
          { pattern: "CAG", start: 4, end: 6 },
          { pattern: "AGTC", start: 5, end: 8 },
          { pattern: "TC", start: 7, end: 8 },
        ],
      },
    ),
    audit: {
      signature: "aho_corasick_search(text: str, patterns: list[str]) -> list[dict]",
      defaultInputShape: "{ text: string, patterns: string[] }",
      argumentMapping: ["text <- $.text", "patterns <- $.patterns"],
      mutation: "None.",
      returnBehavior: "Returns list of pattern matches with start/end positions.",
    },
  }),

  defineMlExecution({
    id: "ml_subword_bpe_tiktoken",
    entrypoint: "bpe_encode_tiktoken",
    invocation: {
      kind: "function",
      arguments: [input("text"), input("ranks")],
    },
    cases: cases(
      {
        label: "Basic Bigram Merge",
        input: {
          text: "hello hello",
          ranks: { he: 0, ll: 1, hell: 2, hello: 3 },
        },
        expected: ["hello", " ", "hello"],
      },
      {
        label: "Single Character Fallback",
        input: {
          text: "abc",
          ranks: {},
        },
        expected: ["a", "b", "c"],
      },
      {
        label: "Greedy Priority Merge Overlap",
        input: {
          text: "abababa",
          ranks: { ab: 0, ba: 1, aba: 2 },
        },
        expected: ["aba", "aba", "a"],
      },
    ),
    audit: {
      signature: "bpe_encode_tiktoken(text: str, ranks: dict) -> list[str]",
      defaultInputShape: "{ text: string, ranks: dict }",
      argumentMapping: ["text <- $.text", "ranks <- $.ranks"],
      mutation: "None.",
      returnBehavior: "Returns list of BPE subword tokens.",
    },
  }),

  defineMlExecution({
    id: "ml_kd_trees_top_k",
    entrypoint: "kd_tree_knn_query",
    invocation: {
      kind: "function",
      arguments: [input("points"), input("query"), input("k")],
    },
    cases: cases(
      {
        label: "2D 1-NN Exact Lookup",
        input: {
          points: [
            [2.0, 3.0],
            [5.0, 4.0],
            [9.0, 6.0],
            [4.0, 7.0],
            [8.0, 1.0],
            [7.0, 2.0],
          ],
          query: [5.0, 4.0],
          k: 1,
        },
        expected: [[5.0, 4.0]],
        comparison: "deep-equal",
      },
      {
        label: "2-NN Nearest Neighbors Query",
        input: {
          points: [
            [0.0, 0.0],
            [1.0, 1.0],
            [10.0, 10.0],
          ],
          query: [0.5, 0.5],
          k: 2,
        },
        expected: [
          [0.0, 0.0],
          [1.0, 1.0],
        ],
        comparison: "deep-equal",
      },
      {
        label: "3D High-Dimensional KNN Search",
        input: {
          points: [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0],
            [10.0, 10.0, 10.0],
          ],
          query: [0.1, 0.1, 0.9],
          k: 2,
        },
        expected: [
          [0.0, 0.0, 1.0],
          [0.0, 1.0, 0.0],
        ],
        comparison: "deep-equal",
      },
    ),
    audit: {
      signature:
        "kd_tree_knn_query(points: list[list[float]], query: list[float], k: int) -> list[list[float]]",
      defaultInputShape: "{ points: float[][], query: float[], k: int }",
      argumentMapping: ["points <- $.points", "query <- $.query", "k <- $.k"],
      mutation: "None.",
      returnBehavior: "Returns top-k nearest neighbor vectors sorted by distance.",
    },
  }),

  defineMlExecution({
    id: "ml_ann_hnsw_ivfpq",
    entrypoint: "hnsw_search_layer",
    invocation: {
      kind: "function",
      arguments: [
        input("graph"),
        input("vectors"),
        input("query"),
        input("entry_point"),
        input("ef"),
      ],
    },
    cases: cases(
      {
        label: "Greedy 1-Hop HNSW Search Layer",
        input: {
          graph: {
            "0": [1, 2],
            "1": [0, 3],
            "2": [0, 3],
            "3": [1, 2],
          },
          vectors: {
            "0": [0.0, 0.0],
            "1": [1.0, 0.0],
            "2": [0.0, 1.0],
            "3": [1.0, 1.0],
          },
          query: [0.9, 0.9],
          entry_point: 0,
          ef: 1,
        },
        expected: [3],
      },
      {
        label: "Immediate Nearest Entry Point",
        input: {
          graph: { "0": [1], "1": [0] },
          vectors: { "0": [0.0, 0.0], "1": [10.0, 10.0] },
          query: [0.1, 0.1],
          entry_point: 0,
          ef: 1,
        },
        expected: [0],
      },
      {
        label: "EF=2 Multi-Candidate Beam Traversal",
        input: {
          graph: {
            "0": [1, 2],
            "1": [0, 3],
            "2": [0, 3],
            "3": [1, 2],
          },
          vectors: {
            "0": [0.0, 0.0],
            "1": [1.0, 0.0],
            "2": [0.0, 1.0],
            "3": [1.0, 1.0],
          },
          query: [0.8, 0.2],
          entry_point: 0,
          ef: 2,
        },
        expected: [1, 3],
      },
    ),
    audit: {
      signature:
        "hnsw_search_layer(graph: dict, vectors: dict, query: list[float], entry_point: int, ef: int) -> list[int]",
      defaultInputShape:
        "{ graph: dict, vectors: dict, query: float[], entry_point: int, ef: int }",
      argumentMapping: [
        "graph <- $.graph",
        "vectors <- $.vectors",
        "query <- $.query",
        "entry_point <- $.entry_point",
        "ef <- $.ef",
      ],
      mutation: "None.",
      returnBehavior: "Returns ef-best nearest neighbor node IDs from layer traversal.",
    },
  }),

  defineMlExecution({
    id: "ml_mlp_backpropagation",
    entrypoint: "mlp_forward_backward_step",
    invocation: {
      kind: "function",
      arguments: [input("X"), input("Y"), input("W1"), input("W2"), input("learning_rate")],
    },
    cases: cases(
      {
        label: "Single Training Sample Gradient Descent Step",
        input: {
          X: [[1.0, 2.0]],
          Y: [[1.0]],
          W1: [
            [0.5, -0.5],
            [0.5, 0.5],
          ],
          W2: [[1.0], [1.0]],
          learning_rate: 0.1,
        },
        expected: {
          loss: 0.125,
          loss_decreased: true,
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Zero Loss Equilibrium",
        input: {
          X: [[1.0, 1.0]],
          Y: [[2.0]],
          W1: [[1.0], [1.0]],
          W2: [[1.0]],
          learning_rate: 0.01,
        },
        expected: {
          loss: 0.0,
          loss_decreased: false,
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Batch-2 MLP Forward-Backward Update",
        input: {
          X: [
            [1.0, 0.0],
            [0.0, 1.0],
          ],
          Y: [[1.0], [0.0]],
          W1: [
            [0.5, 0.5],
            [0.5, 0.5],
          ],
          W2: [[0.5], [0.5]],
          learning_rate: 0.05,
        },
        expected: {
          loss: 0.25,
          loss_decreased: true,
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature:
        "mlp_forward_backward_step(X: list[list[float]], Y: list[list[float]], W1: list[list[float]], W2: list[list[float]], learning_rate: float) -> dict",
      defaultInputShape:
        "{ X: float[][], Y: float[][], W1: float[][], W2: float[][], learning_rate: float }",
      argumentMapping: [
        "X <- $.X",
        "Y <- $.Y",
        "W1 <- $.W1",
        "W2 <- $.W2",
        "learning_rate <- $.learning_rate",
      ],
      mutation: "Updates weights W1 and W2.",
      returnBehavior: "Returns forward loss and loss reduction status.",
    },
  }),

  defineMlExecution({
    id: "ml_activations_online_softmax",
    entrypoint: "online_softmax_streaming",
    invocation: {
      kind: "function",
      arguments: [input("tiles")],
    },
    cases: cases(
      {
        label: "Two Equal Tiles Softmax",
        input: {
          tiles: [
            [2.0, 2.0],
            [2.0, 2.0],
          ],
        },
        expected: [0.25, 0.25, 0.25, 0.25],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Single Element Tile Streaming",
        input: {
          tiles: [[1000.0]],
        },
        expected: [1.0],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Outlier Tile with Dynamic Max Rescaling",
        input: {
          tiles: [
            [1.0, 2.0],
            [10.0, 2.0],
          ],
        },
        expected: [0.00012338, 0.00033539, 0.99920584, 0.00033539],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature: "online_softmax_streaming(tiles: list[list[float]]) -> list[float]",
      defaultInputShape: "{ tiles: float[][] }",
      argumentMapping: ["tiles <- $.tiles"],
      mutation: "None.",
      returnBehavior: "Returns numerically stable online streaming softmax probabilities.",
    },
  }),

  defineMlExecution({
    id: "ml_normalization_rmsnorm",
    entrypoint: "rmsnorm_forward_backward",
    invocation: {
      kind: "function",
      arguments: [input("x"), input("gamma"), input("grad_output"), input("eps")],
    },
    cases: cases(
      {
        label: "Basic RMSNorm Forward and Backward Pass",
        input: {
          x: [2.0, 2.0, 2.0, 2.0],
          gamma: [1.0, 1.0, 1.0, 1.0],
          grad_output: [1.0, 0.0, 0.0, 0.0],
          eps: 1e-5,
        },
        expected: {
          y: [1.0, 1.0, 1.0, 1.0],
          grad_x: [0.375, -0.125, -0.125, -0.125],
          grad_gamma: [1.0, 0.0, 0.0, 0.0],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Zero Mean Orthogonal Gradient Invariant",
        input: {
          x: [1.0, 2.0, 3.0, 4.0],
          gamma: [1.0, 1.0, 1.0, 1.0],
          grad_output: [1.0, 1.0, 1.0, 1.0],
          eps: 1e-5,
        },
        expected: {
          y: [0.36514837, 0.73029674, 1.09544512, 1.46059349],
          grad_x: [0.21908902, 0.07302967, -0.07302967, -0.21908902],
          grad_gamma: [0.36514837, 0.73029674, 1.09544512, 1.46059349],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Scaled Non-Uniform Gamma",
        input: {
          x: [1.0, -1.0],
          gamma: [2.0, 3.0],
          grad_output: [1.0, 1.0],
          eps: 1e-5,
        },
        expected: {
          y: [2.0, -3.0],
          grad_x: [2.25, 0.75],
          grad_gamma: [1.0, -1.0],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature:
        "rmsnorm_forward_backward(x: list[float], gamma: list[float], grad_output: list[float], eps: float) -> dict",
      defaultInputShape: "{ x: float[], gamma: float[], grad_output: float[], eps: float }",
      argumentMapping: [
        "x <- $.x",
        "gamma <- $.gamma",
        "grad_output <- $.grad_output",
        "eps <- $.eps",
      ],
      mutation: "None.",
      returnBehavior: "Returns normalized output y, grad_x, and grad_gamma dictionary.",
    },
  }),

  defineMlExecution({
    id: "ml_convolutions_im2col_gemm",
    entrypoint: "im2col_2d",
    invocation: {
      kind: "function",
      arguments: [input("image"), input("kernel_size"), input("stride"), input("padding")],
    },
    cases: cases(
      {
        label: "3x3 Image with 2x2 Kernel (Valid Padding)",
        input: {
          image: [
            [1.0, 2.0, 3.0],
            [4.0, 5.0, 6.0],
            [7.0, 8.0, 9.0],
          ],
          kernel_size: 2,
          stride: 1,
          padding: 0,
        },
        expected: [
          [1.0, 2.0, 4.0, 5.0],
          [2.0, 3.0, 5.0, 6.0],
          [4.0, 5.0, 7.0, 8.0],
          [5.0, 6.0, 8.0, 9.0],
        ],
      },
      {
        label: "2x2 Image with 2x2 Kernel (1 Stride)",
        input: {
          image: [
            [10.0, 20.0],
            [30.0, 40.0],
          ],
          kernel_size: 2,
          stride: 1,
          padding: 0,
        },
        expected: [[10.0, 20.0, 30.0, 40.0]],
      },
      {
        label: "4x4 Image with 2x2 Kernel and 2 Stride",
        input: {
          image: [
            [1.0, 2.0, 3.0, 4.0],
            [5.0, 6.0, 7.0, 8.0],
            [9.0, 10.0, 11.0, 12.0],
            [13.0, 14.0, 15.0, 16.0],
          ],
          kernel_size: 2,
          stride: 2,
          padding: 0,
        },
        expected: [
          [1.0, 2.0, 5.0, 6.0],
          [3.0, 4.0, 7.0, 8.0],
          [9.0, 10.0, 13.0, 14.0],
          [11.0, 12.0, 15.0, 16.0],
        ],
      },
    ),
    audit: {
      signature:
        "im2col_2d(image: list[list[float]], kernel_size: int, stride: int, padding: int) -> list[list[float]]",
      defaultInputShape: "{ image: float[][], kernel_size: int, stride: int, padding: int }",
      argumentMapping: [
        "image <- $.image",
        "kernel_size <- $.kernel_size",
        "stride <- $.stride",
        "padding <- $.padding",
      ],
      mutation: "None.",
      returnBehavior: "Returns 2D unrolled column matrix suitable for GEMM.",
    },
  }),

  defineMlExecution({
    id: "ml_recurrent_lstm_gru",
    entrypoint: "lstm_cell_forward_backward",
    invocation: {
      kind: "function",
      arguments: [
        input("x_t"),
        input("h_prev"),
        input("c_prev"),
        input("W_f"),
        input("W_i"),
        input("W_c"),
        input("W_o"),
      ],
    },
    cases: cases(
      {
        label: "Single Step LSTM Cell Forward",
        input: {
          x_t: [1.0],
          h_prev: [0.0],
          c_prev: [0.0],
          W_f: [0.0, 0.0],
          W_i: [0.0, 0.0],
          W_c: [0.0, 0.0],
          W_o: [0.0, 0.0],
        },
        expected: {
          h_next: [0.0],
          c_next: [0.0],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Active Forget Gate CEC Passthrough",
        input: {
          x_t: [0.0],
          h_prev: [0.0],
          c_prev: [10.0],
          W_f: [10.0, 0.0], // Sigmoid(10) ~ 1.0
          W_i: [-10.0, 0.0], // Sigmoid(-10) ~ 0.0
          W_c: [0.0, 0.0],
          W_o: [10.0, 0.0], // Sigmoid(10) ~ 1.0
        },
        expected: {
          h_next: [0.99999999], // tanh(10) ~ 1.0
          c_next: [9.999546],
        },
        comparison: "deep-equal",
        tolerance: 1e-3,
      },
      {
        label: "New Information Integration Step",
        input: {
          x_t: [1.0],
          h_prev: [0.5],
          c_prev: [1.0],
          W_f: [0.5, 0.5],
          W_i: [0.5, 0.5],
          W_c: [0.5, 0.5],
          W_o: [0.5, 0.5],
        },
        expected: {
          h_next: [0.596048],
          c_next: [1.144888],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature:
        "lstm_cell_forward_backward(x_t: list[float], h_prev: list[float], c_prev: list[float], W_f: list[float], W_i: list[float], W_c: list[float], W_o: list[float]) -> dict",
      defaultInputShape:
        "{ x_t: float[], h_prev: float[], c_prev: float[], W_f: float[], W_i: float[], W_c: float[], W_o: float[] }",
      argumentMapping: [
        "x_t <- $.x_t",
        "h_prev <- $.h_prev",
        "c_prev <- $.c_prev",
        "W_f <- $.W_f",
        "W_i <- $.W_i",
        "W_c <- $.W_c",
        "W_o <- $.W_o",
      ],
      mutation: "None.",
      returnBehavior: "Returns next hidden state h_next and next cell state c_next.",
    },
  }),
];
