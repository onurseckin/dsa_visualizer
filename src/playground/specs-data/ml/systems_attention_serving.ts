import { cases, defineMlExecution, input } from "./helpers";

export const systemsAttentionServingExecutions = [
  defineMlExecution({
    id: "ml_attention_causal_sdpa",
    entrypoint: "causal_sdpa_attention",
    invocation: {
      kind: "function",
      arguments: [input("Q"), input("K"), input("V"), input("scale")],
    },
    cases: cases(
      {
        label: "Basic 2x2 Causal Attention",
        input: {
          Q: [
            [1.0, 0.0],
            [0.0, 1.0],
          ],
          K: [
            [1.0, 0.0],
            [0.0, 1.0],
          ],
          V: [
            [2.0, 3.0],
            [4.0, 5.0],
          ],
          scale: 1.0,
        },
        expected: [
          [2.0, 3.0],
          [3.46211715726001, 4.46211715726001],
        ],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Single Token (T=1) Identity Projection",
        input: {
          Q: [[1.0, 2.0]],
          K: [[1.0, 2.0]],
          V: [[10.0, 20.0]],
          scale: Math.SQRT1_2,
        },
        expected: [[10.0, 20.0]],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Multi-Token Causal Mask Lower-Triangular Falloff",
        input: {
          Q: [
            [1.0, 1.0],
            [2.0, 2.0],
            [3.0, 3.0],
          ],
          K: [
            [1.0, 1.0],
            [2.0, 2.0],
            [3.0, 3.0],
          ],
          V: [
            [1.0, 0.0],
            [0.0, 1.0],
            [1.0, 1.0],
          ],
          scale: 0.5,
        },
        expected: [
          [1.0, 0.0],
          [0.11920292, 0.88079708],
          [0.88876805, 0.98807971],
        ],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature:
        "causal_sdpa_attention(Q: list[list[float]], K: list[list[float]], V: list[list[float]], scale: float) -> list[list[float]]",
      defaultInputShape: "{ Q: float[][], K: float[][], V: float[][], scale: float }",
      argumentMapping: ["Q <- $.Q", "K <- $.K", "V <- $.V", "scale <- $.scale"],
      mutation: "Does not mutate input tensors.",
      returnBehavior: "Returns causal scaled dot-product attention output tensor.",
    },
  }),

  defineMlExecution({
    id: "ml_rope_gqa_attention",
    entrypoint: "apply_rotary_emb_gqa",
    invocation: {
      kind: "function",
      arguments: [input("x"), input("positions"), input("theta_base")],
    },
    cases: cases(
      {
        label: "Position 0 Identity Rotation",
        input: {
          x: [[1.0, 2.0]],
          positions: [0],
          theta_base: 10000.0,
        },
        expected: [[1.0, 2.0]],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Position 1 Orthogonal Rotation",
        input: {
          x: [[1.0, 0.0]],
          positions: [1],
          theta_base: 10000.0,
        },
        expected: [[0.5403023, 0.84147098]],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Multi-Head GQA Stride Rotation",
        input: {
          x: [
            [1.0, 0.0, 0.0, 1.0],
            [0.0, 1.0, 1.0, 0.0],
          ],
          positions: [0, 2],
          theta_base: 10000.0,
        },
        expected: [
          [1.0, 0.0, 0.0, 1.0],
          [-0.90929743, -0.41614684, -0.41614684, 0.90929743],
        ],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature:
        "apply_rotary_emb_gqa(x: list[list[float]], positions: list[int], theta_base: float) -> list[list[float]]",
      defaultInputShape: "{ x: float[][], positions: int[], theta_base: float }",
      argumentMapping: ["x <- $.x", "positions <- $.positions", "theta_base <- $.theta_base"],
      mutation: "Does not mutate input embeddings.",
      returnBehavior: "Returns RoPE rotated embedding tensor.",
    },
  }),

  defineMlExecution({
    id: "ml_flashattention_sram_tiling",
    entrypoint: "flash_attention_2_forward",
    invocation: {
      kind: "function",
      arguments: [input("Q"), input("K"), input("V"), input("block_size")],
    },
    cases: cases(
      {
        label: "Single Tile FlashAttention",
        input: {
          Q: [[1.0, 0.0]],
          K: [[1.0, 0.0]],
          V: [[5.0, 10.0]],
          block_size: 16,
        },
        expected: [[5.0, 10.0]],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "Two-Block Tiled Streaming Online Softmax",
        input: {
          Q: [
            [1.0, 1.0],
            [1.0, 1.0],
          ],
          K: [
            [1.0, 1.0],
            [2.0, 2.0],
          ],
          V: [
            [1.0, 2.0],
            [3.0, 4.0],
          ],
          block_size: 1,
        },
        expected: [
          [2.76159416, 3.76159416],
          [2.76159416, 3.76159416],
        ],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
      {
        label: "4x4 Matrix Block-Tiled Reduction",
        input: {
          Q: [
            [1.0, 0.0],
            [0.0, 1.0],
            [1.0, 1.0],
            [2.0, 0.0],
          ],
          K: [
            [1.0, 0.0],
            [0.0, 1.0],
            [1.0, 1.0],
            [0.0, 2.0],
          ],
          V: [
            [1.0, 0.0],
            [0.0, 1.0],
            [1.0, 1.0],
            [2.0, 2.0],
          ],
          block_size: 2,
        },
        expected: [
          [0.8524458, 0.4496245],
          [0.4496245, 0.8524458],
          [0.9168925, 0.9168925],
          [1.2789122, 0.4682498],
        ],
        comparison: "deep-equal",
        tolerance: 1e-4,
      },
    ),
    audit: {
      signature:
        "flash_attention_2_forward(Q: list[list[float]], K: list[list[float]], V: list[list[float]], block_size: int) -> list[list[float]]",
      defaultInputShape: "{ Q: float[][], K: float[][], V: float[][], block_size: int }",
      argumentMapping: ["Q <- $.Q", "K <- $.K", "V <- $.V", "block_size <- $.block_size"],
      mutation: "Does not mutate Q, K, V.",
      returnBehavior: "Returns online softmax tiled attention output.",
    },
  }),

  defineMlExecution({
    id: "ml_continuous_batching_orca",
    entrypoint: "orca_schedule_step",
    invocation: {
      kind: "function",
      arguments: [input("running_requests"), input("waiting_requests"), input("max_batch_tokens")],
    },
    cases: cases(
      {
        label: "Empty Waiting Queue - Step Running",
        input: {
          running_requests: [{ id: "req_1", prompt_len: 4, generated_len: 2, max_len: 10 }],
          waiting_requests: [],
          max_batch_tokens: 32,
        },
        expected: {
          scheduled_ids: ["req_1"],
          preempted_ids: [],
          newly_admitted_ids: [],
          total_batch_tokens: 1,
        },
      },
      {
        label: "Admit Waiting Request Within Token Budget",
        input: {
          running_requests: [{ id: "req_1", prompt_len: 4, generated_len: 2, max_len: 10 }],
          waiting_requests: [{ id: "req_2", prompt_len: 8, generated_len: 0, max_len: 16 }],
          max_batch_tokens: 16,
        },
        expected: {
          scheduled_ids: ["req_1", "req_2"],
          preempted_ids: [],
          newly_admitted_ids: ["req_2"],
          total_batch_tokens: 9, // 1 decode token + 8 prefill tokens
        },
      },
      {
        label: "Token Budget Exhaustion - Queueing Waiting Request",
        input: {
          running_requests: [{ id: "req_1", prompt_len: 4, generated_len: 2, max_len: 10 }],
          waiting_requests: [{ id: "req_2", prompt_len: 32, generated_len: 0, max_len: 64 }],
          max_batch_tokens: 16,
        },
        expected: {
          scheduled_ids: ["req_1"],
          preempted_ids: [],
          newly_admitted_ids: [],
          total_batch_tokens: 1,
        },
      },
    ),
    audit: {
      signature:
        "orca_schedule_step(running_requests: list[dict], waiting_requests: list[dict], max_batch_tokens: int) -> dict",
      defaultInputShape:
        "{ running_requests: dict[], waiting_requests: dict[], max_batch_tokens: int }",
      argumentMapping: [
        "running_requests <- $.running_requests",
        "waiting_requests <- $.waiting_requests",
        "max_batch_tokens <- $.max_batch_tokens",
      ],
      mutation: "Does not mutate input request lists.",
      returnBehavior: "Returns iteration-level scheduling decision dictionary.",
    },
  }),

  defineMlExecution({
    id: "ml_pagedattention_cow_vllm",
    entrypoint: "paged_attention_lookup",
    invocation: {
      kind: "function",
      arguments: [
        input("block_table"),
        input("physical_blocks"),
        input("logical_token_idx"),
        input("block_size"),
      ],
    },
    cases: cases(
      {
        label: "Block 0 Initial Token Lookup",
        input: {
          block_table: [4, 7, 2],
          physical_blocks: {
            "4": [
              [1.0, 2.0],
              [3.0, 4.0],
            ],
            "7": [
              [5.0, 6.0],
              [7.0, 8.0],
            ],
          },
          logical_token_idx: 1,
          block_size: 2,
        },
        expected: [3.0, 4.0],
      },
      {
        label: "Cross-Block Logical Index Translation",
        input: {
          block_table: [4, 7, 2],
          physical_blocks: {
            "4": [
              [1.0, 2.0],
              [3.0, 4.0],
            ],
            "7": [
              [5.0, 6.0],
              [7.0, 8.0],
            ],
          },
          logical_token_idx: 2,
          block_size: 2,
        },
        expected: [5.0, 6.0],
      },
      {
        label: "Large Block Table Stride Lookup",
        input: {
          block_table: [10, 20, 30, 40],
          physical_blocks: {
            "10": [[0.1], [0.2], [0.3], [0.4]],
            "20": [[0.5], [0.6], [0.7], [0.8]],
            "30": [[0.9], [1.0], [1.1], [1.2]],
          },
          logical_token_idx: 9,
          block_size: 4,
        },
        expected: [1.0],
      },
    ),
    audit: {
      signature:
        "paged_attention_lookup(block_table: list[int], physical_blocks: dict, logical_token_idx: int, block_size: int) -> list[float]",
      defaultInputShape:
        "{ block_table: int[], physical_blocks: dict, logical_token_idx: int, block_size: int }",
      argumentMapping: [
        "block_table <- $.block_table",
        "physical_blocks <- $.physical_blocks",
        "logical_token_idx <- $.logical_token_idx",
        "block_size <- $.block_size",
      ],
      mutation: "Does not mutate block tables.",
      returnBehavior: "Returns retrieved physical KV cache vector.",
    },
  }),

  defineMlExecution({
    id: "ml_speculative_decoding",
    entrypoint: "speculative_sample_verify",
    invocation: {
      kind: "function",
      arguments: [input("draft_tokens"), input("draft_probs"), input("target_probs")],
    },
    cases: cases(
      {
        label: "All Draft Tokens Accepted",
        input: {
          draft_tokens: [10, 20],
          draft_probs: [0.8, 0.7],
          target_probs: [0.9, 0.85],
        },
        expected: {
          accepted_tokens: [10, 20],
          num_accepted: 2,
          rejection_index: -1,
        },
      },
      {
        label: "First Token Rejected Immediately",
        input: {
          draft_tokens: [10, 20],
          draft_probs: [0.9, 0.8],
          target_probs: [0.0, 0.8],
        },
        expected: {
          accepted_tokens: [],
          num_accepted: 0,
          rejection_index: 0,
        },
      },
      {
        label: "Partial Acceptance with Middle Rejection",
        input: {
          draft_tokens: [101, 102, 103],
          draft_probs: [0.5, 0.9, 0.4],
          target_probs: [0.8, 0.0, 0.9],
        },
        expected: {
          accepted_tokens: [101],
          num_accepted: 1,
          rejection_index: 1,
        },
      },
    ),
    audit: {
      signature:
        "speculative_sample_verify(draft_tokens: list[int], draft_probs: list[float], target_probs: list[float]) -> dict",
      defaultInputShape: "{ draft_tokens: int[], draft_probs: float[], target_probs: float[] }",
      argumentMapping: [
        "draft_tokens <- $.draft_tokens",
        "draft_probs <- $.draft_probs",
        "target_probs <- $.target_probs",
      ],
      mutation: "Does not mutate token arrays.",
      returnBehavior: "Returns speculative verification output dictionary.",
    },
  }),
];
