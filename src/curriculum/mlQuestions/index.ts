import type { MLTopicQuestionBank } from "./types";
import { linearAlgebraTensors } from "./linear_algebra_tensors";
import { vectorSpacesPca } from "./vector_spaces_pca";
import { calculusAutodiff } from "./calculus_autodiff";
import { optimizationLosses } from "./optimization_losses";
import { distributionsBayes } from "./distributions_bayes";
import { hypothesisSampling } from "./hypothesis_sampling";
import { regressionDecisionTrees } from "./regression_decision_trees";
import { xgboostKmeans } from "./xgboost_kmeans";
import { svmAlsFactorization } from "./svm_als_factorization";
import { mlpOnlineSoftmax } from "./mlp_online_softmax";
import { rmsnormConvolutions } from "./rmsnorm_convolutions";
import { recurrentNetworks } from "./recurrent_networks";
import { trieTokenizationBpe } from "./trie_tokenization_bpe";
import { vectorRetrievalHnsw } from "./vector_retrieval_hnsw";
import { causalAttentionRope } from "./causal_attention_rope";
import { flashAttentionTiling } from "./flash_attention_tiling";
import { continuousBatchingVllm } from "./continuous_batching_vllm";
import { speculativeDecoding } from "./speculative_decoding";
import { kahanQuantization } from "./kahan_quantization";
import { denseGemmKernels } from "./dense_gemm_kernels";
import { interconnectRingAllreduce } from "./interconnect_ring_allreduce";
import { zero3FsdpSharding } from "./zero3_fsdp_sharding";
import { kernelFusionParallelism } from "./kernel_fusion_parallelism";

export const ML_QUESTION_BANKS: Record<string, MLTopicQuestionBank> = {};

const allBanks: MLTopicQuestionBank[] = [
  ...linearAlgebraTensors,
  ...vectorSpacesPca,
  ...calculusAutodiff,
  ...optimizationLosses,
  ...distributionsBayes,
  ...hypothesisSampling,
  ...regressionDecisionTrees,
  ...xgboostKmeans,
  ...svmAlsFactorization,
  ...mlpOnlineSoftmax,
  ...rmsnormConvolutions,
  ...recurrentNetworks,
  ...trieTokenizationBpe,
  ...vectorRetrievalHnsw,
  ...causalAttentionRope,
  ...flashAttentionTiling,
  ...continuousBatchingVllm,
  ...speculativeDecoding,
  ...kahanQuantization,
  ...denseGemmKernels,
  ...interconnectRingAllreduce,
  ...zero3FsdpSharding,
  ...kernelFusionParallelism,
];

for (const bank of allBanks) {
  ML_QUESTION_BANKS[bank.topicId] = bank;
}

export function getMlTopicQuestionBank(topicId: string): MLTopicQuestionBank {
  const bank = ML_QUESTION_BANKS[topicId];
  if (!bank) {
    throw new Error(`MLTopicQuestionBank not found for topicId: ${topicId}`);
  }
  return bank;
}

export * from "./types";
