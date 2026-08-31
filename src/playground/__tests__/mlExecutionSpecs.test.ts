import { describe, expect, it } from "bun:test";
import { getPythonExecutionSpec, getPythonStarterCode } from "../executionSpecs";
import { ML_EXECUTION_ENTRIES, ML_EXECUTION_SPECS } from "../specs-data/ml";

describe("ML Python Playground Execution Specs Tests", () => {
  describe("1. Registry & Spec Completeness", () => {
    it("should register all ML execution specs without duplicate IDs", () => {
      const ids = ML_EXECUTION_ENTRIES.map((entry) => entry.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
      expect(ids.length).toBeGreaterThanOrEqual(20);
    });

    it("should export ML_EXECUTION_SPECS record populated with all entries", () => {
      for (const entry of ML_EXECUTION_ENTRIES) {
        expect(ML_EXECUTION_SPECS[entry.id]).toBeDefined();
        expect(ML_EXECUTION_SPECS[entry.id].entrypoint).toBe(entry.spec.entrypoint);
      }
    });

    it("should allow retrieval via global getPythonExecutionSpec and getPythonStarterCode", () => {
      const sampleIds = [
        "ml_attention_causal_sdpa",
        "ml_rope_gqa_attention",
        "ml_flashattention_sram_tiling",
        "ml_continuous_batching_orca",
        "ml_pagedattention_cow_vllm",
        "ml_speculative_decoding",
        "ml_floating_point_kahan",
        "ml_affine_quantization_int8",
        "ml_dense_gemm_tiling",
        "ml_interconnect_alpha_beta",
        "ml_ring_allreduce_collective",
        "ml_zero3_parameter_sharding",
        "ml_compiler_fusion_liveness",
        "ml_parallelism_3d_moe_1f1b",
        "ml_trie_aho_corasick",
        "ml_subword_bpe_tiktoken",
        "ml_kd_trees_top_k",
        "ml_ann_hnsw_ivfpq",
        "ml_mlp_backpropagation",
        "ml_activations_online_softmax",
        "ml_normalization_rmsnorm",
        "ml_convolutions_im2col_gemm",
        "ml_recurrent_lstm_gru",
      ];

      for (const id of sampleIds) {
        const spec = getPythonExecutionSpec(id);
        expect(spec).toBeDefined();
        expect(spec!.entrypoint.length).toBeGreaterThan(0);
        expect(spec!.cases.length).toBeGreaterThanOrEqual(3);

        const starterCode = getPythonStarterCode(id);
        expect(starterCode).toBeDefined();
        expect(starterCode!.length).toBeGreaterThan(0);
      }
    });
  });

  describe("2. Test Case Fixture & Contract Integrity", () => {
    it("every ML spec must define canonical basic, boundary, and complex test cases", () => {
      for (const entry of ML_EXECUTION_ENTRIES) {
        const caseIds = entry.spec.cases.map((c) => c.id);
        expect(caseIds).toContain("basic");
        expect(caseIds).toContain("boundary");
        expect(caseIds).toContain("complex");

        for (const testCase of entry.spec.cases) {
          expect(testCase.label.length).toBeGreaterThan(0);
          expect(testCase.input).toBeDefined();
          expect(testCase.expected).toBeDefined();
        }
      }
    });

    it("every ML entry must include valid audit metadata", () => {
      for (const entry of ML_EXECUTION_ENTRIES) {
        expect(entry.audit.signature.length).toBeGreaterThan(0);
        expect(entry.audit.defaultInputShape.length).toBeGreaterThan(0);
        expect(entry.audit.argumentMapping.length).toBeGreaterThan(0);
        expect(entry.audit.returnBehavior.length).toBeGreaterThan(0);
        expect(entry.audit.symbol).toBe(entry.spec.entrypoint);
      }
    });
  });
});
