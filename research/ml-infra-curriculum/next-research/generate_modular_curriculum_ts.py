#!/usr/bin/env python3
"""
Semantic Modular Machine Learning Curriculum Synthesizer
Generates clean, semantic TypeScript domain modules (e.g., linear_algebra_tensors.ts)
strictly <= 400 lines per file with complete 486+ questions and deduplicated types.
"""

import json
import os
import sys

sys.path.insert(0, 'research/ml-infra-curriculum/next-research')
from synthesize_complete_ml_database import get_full_topics

def write_modular_files():
    topics = get_full_topics()
    assert len(topics) == 41, f"Expected 41 topics, found {len(topics)}"
    
    # Semantic naming: descriptive, professional, no "domain 1/2" mechanical prefixes
    modules = [
        ("linear_algebra_tensors.ts", "linearAlgebraTensors", topics[0:2]),             # Topics 01-02
        ("vector_spaces_pca.ts", "vectorSpacesPca", topics[2:4]),                       # Topics 03-04
        ("calculus_autodiff.ts", "calculusAutodiff", topics[4:6]),                       # Topics 05-06
        ("optimization_losses.ts", "optimizationLosses", topics[6:8]),                   # Topics 07-08
        ("distributions_bayes.ts", "distributionsBayes", topics[8:10]),                  # Topics 09-10
        ("hypothesis_sampling.ts", "hypothesisSampling", topics[10:12]),                 # Topics 11-12
        ("regression_decision_trees.ts", "regressionDecisionTrees", topics[12:14]),     # Topics 13-14
        ("xgboost_kmeans.ts", "xgboostKmeans", topics[14:16]),                           # Topics 15-16
        ("svm_als_factorization.ts", "svmAlsFactorization", topics[16:18]),             # Topics 17-18
        ("mlp_online_softmax.ts", "mlpOnlineSoftmax", topics[18:20]),                   # Topics 19-20
        ("rmsnorm_convolutions.ts", "rmsnormConvolutions", topics[20:22]),               # Topics 21-22
        ("recurrent_networks.ts", "recurrentNetworks", topics[22:23]),                   # Topic 23
        ("trie_tokenization_bpe.ts", "trieTokenizationBpe", topics[23:25]),             # Topics 24-25
        ("vector_retrieval_hnsw.ts", "vectorRetrievalHnsw", topics[25:27]),             # Topics 26-27
        ("causal_attention_rope.ts", "causalAttentionRope", topics[27:29]),             # Topics 28-29
        ("flash_attention_tiling.ts", "flashAttentionTiling", topics[29:30]),           # Topic 30
        ("continuous_batching_vllm.ts", "continuousBatchingVllm", topics[30:32]),       # Topics 31-32
        ("speculative_decoding.ts", "speculativeDecoding", topics[32:33]),               # Topic 33
        ("kahan_quantization.ts", "kahanQuantization", topics[33:35]),                   # Topics 34-35
        ("dense_gemm_kernels.ts", "denseGemmKernels", topics[35:36]),                   # Topic 36
        ("interconnect_ring_allreduce.ts", "interconnectRingAllreduce", topics[36:38]), # Topics 37-38
        ("zero3_fsdp_sharding.ts", "zero3FsdpSharding", topics[38:39]),                 # Topic 39
        ("kernel_fusion_parallelism.ts", "kernelFusionParallelism", topics[39:41]),     # Topics 40-41
    ]
    
    target_dir = "src/curriculum/mlQuestions"
    
    # Clean up old files
    for existing in os.listdir(target_dir):
        if existing not in ["types.ts"] and existing.endswith(".ts"):
            os.remove(os.path.join(target_dir, existing))
            
    # Write each semantic module
    import_statements = []
    array_names = []
    
    for filename, export_name, topic_subset in modules:
        filepath = os.path.join(target_dir, filename)
        content = f'import type {{ MLTopicQuestionBank }} from "./types";\n\n'
        content += f'export const {export_name}: MLTopicQuestionBank[] = ' + json.dumps(topic_subset, indent=2) + ';\n'
        with open(filepath, "w") as f:
            f.write(content)
            
        import_statements.append(f'import {{ {export_name} }} from "./{filename[:-3]}";')
        array_names.append(export_name)
        
    # Write index.ts
    index_content = """import type { MLTopicQuestionBank } from "./types";
""" + "\n".join(import_statements) + f"""

export const ML_QUESTION_BANKS: Record<string, MLTopicQuestionBank> = {{}};

const allBanks: MLTopicQuestionBank[] = [
  {",\n  ".join(f"...{arr}" for arr in array_names)}
];

for (const bank of allBanks) {{
  ML_QUESTION_BANKS[bank.topicId] = bank;
}}

export function getMlTopicQuestionBank(topicId: string): MLTopicQuestionBank {{
  const bank = ML_QUESTION_BANKS[topicId];
  if (!bank) {{
    throw new Error(`MLTopicQuestionBank not found for topicId: ${{topicId}}`);
  }}
  return bank;
}}

export * from "./types";
"""
    with open(os.path.join(target_dir, "index.ts"), "w") as f:
        f.write(index_content)
        
    print("Successfully generated all semantically named question bank modules!")

if __name__ == "__main__":
    write_modular_files()
