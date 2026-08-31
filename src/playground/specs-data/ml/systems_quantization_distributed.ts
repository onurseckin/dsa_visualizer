import { cases, defineMlExecution, input } from "./helpers";

export const systemsQuantizationDistributedExecutions = [
  defineMlExecution({
    id: "ml_floating_point_kahan",
    entrypoint: "kahan_compensated_sum",
    invocation: {
      kind: "function",
      arguments: [input("numbers")],
    },
    cases: cases(
      {
        label: "Basic Positive Summation",
        input: { numbers: [1.0, 2.0, 3.0, 4.0, 5.0] },
        expected: 15.0,
        comparison: "deep-equal",
        tolerance: 1e-6,
      },
      {
        label: "Compensated Catastrophic Cancellation Array",
        input: { numbers: [1e8, Math.PI, -1e8, Math.E] },
        expected: Math.PI + Math.E,
        comparison: "deep-equal",
        tolerance: 1e-6,
      },
      {
        label: "Small Increments Accumulator Array",
        input: { numbers: [10000.0, 1e-10, 1e-10, 1e-10, 1e-10, -10000.0] },
        expected: 4e-10,
        comparison: "deep-equal",
        tolerance: 1e-12,
      },
    ),
    audit: {
      signature: "kahan_compensated_sum(numbers: list[float]) -> float",
      defaultInputShape: "{ numbers: float[] }",
      argumentMapping: ["numbers <- $.numbers"],
      mutation: "Does not mutate numbers.",
      returnBehavior: "Returns 2Sum Kahan compensated floating-point sum.",
    },
  }),

  defineMlExecution({
    id: "ml_affine_quantization_int8",
    entrypoint: "int8_affine_quantize",
    invocation: {
      kind: "function",
      arguments: [input("x"), input("qmin"), input("qmax")],
    },
    cases: cases(
      {
        label: "Symmetric Positive-Negative Range",
        input: {
          x: [-10.0, 0.0, 10.0],
          qmin: -128,
          qmax: 127,
        },
        expected: {
          scale: 0.0784313725490196,
          zero_point: 0,
          q: [-128, 0, 127],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "All Zero Flat Vector",
        input: {
          x: [0.0, 0.0, 0.0],
          qmin: -128,
          qmax: 127,
        },
        expected: {
          scale: 1.0,
          zero_point: 0,
          q: [0, 0, 0],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Asymmetric Activation Distribution",
        input: {
          x: [0.0, 5.0, 10.0, 20.0],
          qmin: 0,
          qmax: 255,
        },
        expected: {
          scale: 0.0784313725490196,
          zero_point: 0,
          q: [0, 64, 128, 255],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature: "int8_affine_quantize(x: list[float], qmin: int, qmax: int) -> dict",
      defaultInputShape: "{ x: float[], qmin: int, qmax: int }",
      argumentMapping: ["x <- $.x", "qmin <- $.qmin", "qmax <- $.qmax"],
      mutation: "Does not mutate input array.",
      returnBehavior: "Returns scale, zero_point, and quantized int8 vector dictionary.",
    },
  }),

  defineMlExecution({
    id: "ml_dense_gemm_tiling",
    entrypoint: "tiled_block_gemm",
    invocation: {
      kind: "function",
      arguments: [input("A"), input("B"), input("block_size")],
    },
    cases: cases(
      {
        label: "2x2 Matrix Multiplication (Block Size 1)",
        input: {
          A: [
            [1.0, 2.0],
            [3.0, 4.0],
          ],
          B: [
            [5.0, 6.0],
            [7.0, 8.0],
          ],
          block_size: 1,
        },
        expected: [
          [19.0, 22.0],
          [43.0, 50.0],
        ],
        comparison: "deep-equal",
        tolerance: 1e-5,
      },
      {
        label: "Identity Multiplication (Block Size 2)",
        input: {
          A: [
            [1.0, 0.0],
            [0.0, 1.0],
          ],
          B: [
            [9.0, 8.0],
            [7.0, 6.0],
          ],
          block_size: 2,
        },
        expected: [
          [9.0, 8.0],
          [7.0, 6.0],
        ],
        comparison: "deep-equal",
        tolerance: 1e-5,
      },
      {
        label: "4x4 Matrix Tiled Product (Block Size 2)",
        input: {
          A: [
            [1.0, 0.0, 1.0, 0.0],
            [0.0, 1.0, 0.0, 1.0],
            [1.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 1.0],
          ],
          B: [
            [2.0, 1.0, 0.0, 1.0],
            [1.0, 2.0, 1.0, 0.0],
            [0.0, 1.0, 2.0, 1.0],
            [1.0, 0.0, 1.0, 2.0],
          ],
          block_size: 2,
        },
        expected: [
          [2.0, 2.0, 2.0, 2.0],
          [2.0, 2.0, 2.0, 2.0],
          [3.0, 3.0, 1.0, 1.0],
          [1.0, 1.0, 3.0, 3.0],
        ],
        comparison: "deep-equal",
        tolerance: 1e-5,
      },
    ),
    audit: {
      signature:
        "tiled_block_gemm(A: list[list[float]], B: list[list[float]], block_size: int) -> list[list[float]]",
      defaultInputShape: "{ A: float[][], B: float[][], block_size: int }",
      argumentMapping: ["A <- $.A", "B <- $.B", "block_size <- $.block_size"],
      mutation: "Does not mutate matrices A or B.",
      returnBehavior: "Returns tiled matrix product C = A @ B.",
    },
  }),

  defineMlExecution({
    id: "ml_interconnect_alpha_beta",
    entrypoint: "hockney_alpha_beta_cost",
    invocation: {
      kind: "function",
      arguments: [
        input("message_bytes"),
        input("alpha_latency_sec"),
        input("beta_bw_bytes_per_sec"),
      ],
    },
    cases: cases(
      {
        label: "Zero-Byte Latency Benchmark",
        input: {
          message_bytes: 0,
          alpha_latency_sec: 1e-6,
          beta_bw_bytes_per_sec: 1e11,
        },
        expected: 1e-6,
        comparison: "deep-equal",
        tolerance: 1e-9,
      },
      {
        label: "1 MB Payload Transmission",
        input: {
          message_bytes: 1048576,
          alpha_latency_sec: 2e-6,
          beta_bw_bytes_per_sec: 1e9,
        },
        expected: 0.001050576,
        comparison: "deep-equal",
        tolerance: 1e-8,
      },
      {
        label: "1 GB High-Bandwidth NVLink Payload",
        input: {
          message_bytes: 1073741824,
          alpha_latency_sec: 1e-6,
          beta_bw_bytes_per_sec: 9e11,
        },
        expected: 0.00119404647,
        comparison: "deep-equal",
        tolerance: 1e-7,
      },
    ),
    audit: {
      signature:
        "hockney_alpha_beta_cost(message_bytes: int, alpha_latency_sec: float, beta_bw_bytes_per_sec: float) -> float",
      defaultInputShape:
        "{ message_bytes: int, alpha_latency_sec: float, beta_bw_bytes_per_sec: float }",
      argumentMapping: [
        "message_bytes <- $.message_bytes",
        "alpha_latency_sec <- $.alpha_latency_sec",
        "beta_bw_bytes_per_sec <- $.beta_bw_bytes_per_sec",
      ],
      mutation: "None.",
      returnBehavior: "Returns Hockney model communication cost in seconds: alpha + bytes / beta.",
    },
  }),

  defineMlExecution({
    id: "ml_ring_allreduce_collective",
    entrypoint: "ring_allreduce_simulate",
    invocation: {
      kind: "function",
      arguments: [input("rank_vectors")],
    },
    cases: cases(
      {
        label: "4 Ranks Vector Elementwise Sum",
        input: {
          rank_vectors: [
            [1.0, 2.0, 3.0, 4.0],
            [10.0, 20.0, 30.0, 40.0],
            [100.0, 200.0, 300.0, 400.0],
            [1000.0, 2000.0, 3000.0, 4000.0],
          ],
        },
        expected: [
          [1111.0, 2222.0, 3333.0, 4444.0],
          [1111.0, 2222.0, 3333.0, 4444.0],
          [1111.0, 2222.0, 3333.0, 4444.0],
          [1111.0, 2222.0, 3333.0, 4444.0],
        ],
        comparison: "deep-equal",
        tolerance: 1e-5,
      },
      {
        label: "2 Ranks Minimal Ring Collective",
        input: {
          rank_vectors: [
            [5.0, -2.0],
            [-5.0, 2.0],
          ],
        },
        expected: [
          [0.0, 0.0],
          [0.0, 0.0],
        ],
        comparison: "deep-equal",
        tolerance: 1e-5,
      },
      {
        label: "3 Ranks 6-Element Partitioned Chunks",
        input: {
          rank_vectors: [
            [1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
            [2.0, 2.0, 2.0, 2.0, 2.0, 2.0],
            [3.0, 3.0, 3.0, 3.0, 3.0, 3.0],
          ],
        },
        expected: [
          [6.0, 6.0, 6.0, 6.0, 6.0, 6.0],
          [6.0, 6.0, 6.0, 6.0, 6.0, 6.0],
          [6.0, 6.0, 6.0, 6.0, 6.0, 6.0],
        ],
        comparison: "deep-equal",
        tolerance: 1e-5,
      },
    ),
    audit: {
      signature: "ring_allreduce_simulate(rank_vectors: list[list[float]]) -> list[list[float]]",
      defaultInputShape: "{ rank_vectors: float[][] }",
      argumentMapping: ["rank_vectors <- $.rank_vectors"],
      mutation: "Does not mutate rank vectors in-place.",
      returnBehavior: "Returns simulated Ring-AllReduce synchronized tensors across all ranks.",
    },
  }),

  defineMlExecution({
    id: "ml_zero3_parameter_sharding",
    entrypoint: "zero3_sharded_forward",
    invocation: {
      kind: "function",
      arguments: [
        input("sharded_weights"),
        input("input_activations"),
        input("world_size"),
        input("rank"),
      ],
    },
    cases: cases(
      {
        label: "World Size 2 Sharded Linear Forward",
        input: {
          sharded_weights: [[1.0, 2.0]], // Rank 0 has row 0
          input_activations: [1.0, 1.0],
          world_size: 2,
          rank: 0,
        },
        expected: {
          gathered_weight_shape: [2, 2],
          output_shard: [3.0],
        },
      },
      {
        label: "World Size 4 Single-Row Partition",
        input: {
          sharded_weights: [[2.0, 0.0, 0.0, 1.0]],
          input_activations: [1.0, 2.0, 3.0, 4.0],
          world_size: 4,
          rank: 0,
        },
        expected: {
          gathered_weight_shape: [4, 4],
          output_shard: [6.0],
        },
      },
      {
        label: "Non-Zero Rank Execution",
        input: {
          sharded_weights: [[0.0, 1.0]],
          input_activations: [5.0, 10.0],
          world_size: 2,
          rank: 1,
        },
        expected: {
          gathered_weight_shape: [2, 2],
          output_shard: [10.0],
        },
      },
    ),
    audit: {
      signature:
        "zero3_sharded_forward(sharded_weights: list[list[float]], input_activations: list[float], world_size: int, rank: int) -> dict",
      defaultInputShape:
        "{ sharded_weights: float[][], input_activations: float[], world_size: int, rank: int }",
      argumentMapping: [
        "sharded_weights <- $.sharded_weights",
        "input_activations <- $.input_activations",
        "world_size <- $.world_size",
        "rank <- $.rank",
      ],
      mutation: "Reconstructs full parameter matrix temporarily in forward pass.",
      returnBehavior: "Returns forward shard result and gathered weight shape.",
    },
  }),

  defineMlExecution({
    id: "ml_compiler_fusion_liveness",
    entrypoint: "liveness_interval_allocator",
    invocation: {
      kind: "function",
      arguments: [input("intervals")],
    },
    cases: cases(
      {
        label: "Non-Overlapping Intervals (1 Register Required)",
        input: {
          intervals: [
            { var: "t0", start: 0, end: 2 },
            { var: "t1", start: 3, end: 5 },
          ],
        },
        expected: {
          num_registers: 1,
          allocation: { t0: 0, t1: 0 },
        },
      },
      {
        label: "Overlapping Intervals (2 Registers Required)",
        input: {
          intervals: [
            { var: "t0", start: 0, end: 4 },
            { var: "t1", start: 2, end: 6 },
          ],
        },
        expected: {
          num_registers: 2,
          allocation: { t0: 0, t1: 1 },
        },
      },
      {
        label: "Three Concurrent Live Ranges (3 Registers)",
        input: {
          intervals: [
            { var: "a", start: 0, end: 10 },
            { var: "b", start: 1, end: 5 },
            { var: "c", start: 2, end: 8 },
            { var: "d", start: 6, end: 9 },
          ],
        },
        expected: {
          num_registers: 3,
          allocation: { a: 0, b: 1, c: 2, d: 1 },
        },
      },
    ),
    audit: {
      signature: "liveness_interval_allocator(intervals: list[dict]) -> dict",
      defaultInputShape: "{ intervals: dict[] }",
      argumentMapping: ["intervals <- $.intervals"],
      mutation: "Does not mutate intervals.",
      returnBehavior:
        "Returns minimum register count and allocation dictionary via Poletto linear scan.",
    },
  }),

  defineMlExecution({
    id: "ml_parallelism_3d_moe_1f1b",
    entrypoint: "moe_top2_routing",
    invocation: {
      kind: "function",
      arguments: [input("gate_logits"), input("num_experts")],
    },
    cases: cases(
      {
        label: "Deterministic Top-2 Routing",
        input: {
          gate_logits: [
            [10.0, 5.0, 1.0, 0.0],
            [0.0, 2.0, 8.0, 4.0],
          ],
          num_experts: 4,
        },
        expected: {
          selected_experts: [
            [0, 1],
            [2, 3],
          ],
          routing_weights: [
            [0.99330715, 0.00669285],
            [0.98201379, 0.01798621],
          ],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Tied Expert Logits",
        input: {
          gate_logits: [[5.0, 5.0, 0.0]],
          num_experts: 3,
        },
        expected: {
          selected_experts: [[0, 1]],
          routing_weights: [[0.5, 0.5]],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Multiple Tokens Dispersed Routing",
        input: {
          gate_logits: [
            [1.0, 4.0, 2.0, 0.0],
            [3.0, 1.0, 0.0, 5.0],
          ],
          num_experts: 4,
        },
        expected: {
          selected_experts: [
            [1, 2],
            [3, 0],
          ],
          routing_weights: [
            [0.88079708, 0.11920292],
            [0.88079708, 0.11920292],
          ],
        },
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature: "moe_top2_routing(gate_logits: list[list[float]], num_experts: int) -> dict",
      defaultInputShape: "{ gate_logits: float[][], num_experts: int }",
      argumentMapping: ["gate_logits <- $.gate_logits", "num_experts <- $.num_experts"],
      mutation: "None.",
      returnBehavior:
        "Returns selected top-2 expert indices and normalized softmax routing weights.",
    },
  }),
];
