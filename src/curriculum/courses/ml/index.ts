import type { CourseTopicJourney } from "../../courseTypes";
import { ml_matrix_memory_layout } from "./ml_matrix_memory_layout";
import { ml_tensor_strides_views } from "./ml_tensor_strides_views";
import { ml_vector_spaces_gram_schmidt } from "./ml_vector_spaces_gram_schmidt";
import { ml_matrix_svd_pca } from "./ml_matrix_svd_pca";
import { ml_gradients_jacobians_hessians } from "./ml_gradients_jacobians_hessians";
import { ml_autodiff_engines } from "./ml_autodiff_engines";
import { ml_gradient_descent_adamw } from "./ml_gradient_descent_adamw";
import { ml_loss_functions_info_theory } from "./ml_loss_functions_info_theory";
import { ml_distributions_covariance } from "./ml_distributions_covariance";
import { ml_mle_map_naive_bayes } from "./ml_mle_map_naive_bayes";
import { ml_hypothesis_testing_bootstrap } from "./ml_hypothesis_testing_bootstrap";
import { ml_sampling_top_p } from "./ml_sampling_top_p";
import { ml_linear_logistic_regression } from "./ml_linear_logistic_regression";
import { ml_decision_trees_cart } from "./ml_decision_trees_cart";
import { ml_ensemble_xgboost } from "./ml_ensemble_xgboost";
import { ml_clustering_kmeans_dbscan } from "./ml_clustering_kmeans_dbscan";
import { ml_svm_kernel_smo } from "./ml_svm_kernel_smo";
import { ml_collaborative_filtering_als } from "./ml_collaborative_filtering_als";
import { ml_mlp_backpropagation } from "./ml_mlp_backpropagation";
import { ml_activations_online_softmax } from "./ml_activations_online_softmax";
import { ml_normalization_rmsnorm } from "./ml_normalization_rmsnorm";
import { ml_convolutions_im2col_gemm } from "./ml_convolutions_im2col_gemm";
import { ml_recurrent_lstm_gru } from "./ml_recurrent_lstm_gru";
import { ml_trie_aho_corasick } from "./ml_trie_aho_corasick";
import { ml_subword_bpe_tiktoken } from "./ml_subword_bpe_tiktoken";
import { ml_kd_trees_top_k } from "./ml_kd_trees_top_k";
import { ml_ann_hnsw_ivfpq } from "./ml_ann_hnsw_ivfpq";
import { ml_attention_causal_sdpa } from "./ml_attention_causal_sdpa";
import { ml_rope_gqa_attention } from "./ml_rope_gqa_attention";
import { ml_flashattention_sram_tiling } from "./ml_flashattention_sram_tiling";
import { ml_continuous_batching_orca } from "./ml_continuous_batching_orca";
import { ml_pagedattention_cow_vllm } from "./ml_pagedattention_cow_vllm";
import { ml_speculative_decoding } from "./ml_speculative_decoding";
import { ml_floating_point_kahan } from "./ml_floating_point_kahan";
import { ml_affine_quantization_int8 } from "./ml_affine_quantization_int8";
import { ml_dense_gemm_tiling } from "./ml_dense_gemm_tiling";
import { ml_interconnect_alpha_beta } from "./ml_interconnect_alpha_beta";
import { ml_ring_allreduce_collective } from "./ml_ring_allreduce_collective";
import { ml_zero3_parameter_sharding } from "./ml_zero3_parameter_sharding";
import { ml_compiler_fusion_liveness } from "./ml_compiler_fusion_liveness";
import { ml_parallelism_3d_moe_1f1b } from "./ml_parallelism_3d_moe_1f1b";

export const ML_COURSE_JOURNEYS: readonly CourseTopicJourney[] = [
  ml_matrix_memory_layout,
  ml_tensor_strides_views,
  ml_vector_spaces_gram_schmidt,
  ml_matrix_svd_pca,
  ml_gradients_jacobians_hessians,
  ml_autodiff_engines,
  ml_gradient_descent_adamw,
  ml_loss_functions_info_theory,
  ml_distributions_covariance,
  ml_mle_map_naive_bayes,
  ml_hypothesis_testing_bootstrap,
  ml_sampling_top_p,
  ml_linear_logistic_regression,
  ml_decision_trees_cart,
  ml_ensemble_xgboost,
  ml_clustering_kmeans_dbscan,
  ml_svm_kernel_smo,
  ml_collaborative_filtering_als,
  ml_mlp_backpropagation,
  ml_activations_online_softmax,
  ml_normalization_rmsnorm,
  ml_convolutions_im2col_gemm,
  ml_recurrent_lstm_gru,
  ml_trie_aho_corasick,
  ml_subword_bpe_tiktoken,
  ml_kd_trees_top_k,
  ml_ann_hnsw_ivfpq,
  ml_attention_causal_sdpa,
  ml_rope_gqa_attention,
  ml_flashattention_sram_tiling,
  ml_continuous_batching_orca,
  ml_pagedattention_cow_vllm,
  ml_speculative_decoding,
  ml_floating_point_kahan,
  ml_affine_quantization_int8,
  ml_dense_gemm_tiling,
  ml_interconnect_alpha_beta,
  ml_ring_allreduce_collective,
  ml_zero3_parameter_sharding,
  ml_compiler_fusion_liveness,
  ml_parallelism_3d_moe_1f1b,
];

export const ML_COURSES_BY_ID: Record<string, CourseTopicJourney> = Object.fromEntries(
  ML_COURSE_JOURNEYS.flatMap((journey) => {
    const rawId = journey.id;
    const strippedId = rawId.replace(/^ml_/, "");
    return [
      [rawId, journey],
      [strippedId, journey],
    ];
  }),
);

export function getMlCourse(topicId: string): CourseTopicJourney | undefined {
  return ML_COURSES_BY_ID[topicId] || ML_COURSES_BY_ID[`ml_${topicId}`];
}
