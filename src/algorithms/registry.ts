import type { AlgorithmDefinition } from "../types/dsa";
import { prefixSum } from "./arrays_and_hashing/prefixSum";
import { twoSum } from "./arrays_and_hashing/twoSum";
import { kadaneMaxSubarray } from "./arrays_and_hashing/kadaneMaxSubarray";
import { bubbleSort } from "./arrays_and_hashing/bubbleSort";
import { twoSumSorted } from "./two_pointers/twoSumSorted";
import { twoPointers } from "./two_pointers/twoPointers";
import { quickSort } from "./two_pointers/quickSort";
import { slidingWindowMin } from "./sliding_window/slidingWindowMin";
import { validParentheses } from "./stack_and_queue/validParentheses";
import { nearestSmallerElement } from "./stack_and_queue/nearestSmallerElement";
import { binarySearchMatrix } from "./binary_search/binarySearchMatrix";
import { reverseLinkedList } from "./linked_list/reverseLinkedList";
import { binaryTreeLca } from "./tree_fundamentals/binaryTreeLca";
import { treeDiameter } from "./tree_queries_and_diameter/treeDiameter";
import { triePrefixTree } from "./tries_and_strings/triePrefixTree";
import { zAlgorithm } from "./tries_and_strings/zAlgorithm";
import { kmpStringMatch } from "./tries_and_strings/kmpStringMatch";
import { kthLargestElement } from "./heap_and_priority_queue/kthLargestElement";
import { nQueens } from "./backtracking/nQueens";
import { bfsGraph } from "./graph_traversal/bfsGraph";
import { numberOfIslands } from "./graph_traversal/numberOfIslands";
import { dijkstraShortestPath } from "./graph_shortest_paths/dijkstraShortestPath";
import { bellmanFord } from "./graph_shortest_paths/bellmanFord";
import { floydWarshall } from "./graph_shortest_paths/floydWarshall";
import { kruskalMst } from "./graph_spanning_trees/kruskalMst";
import { primMst } from "./graph_spanning_trees/primMst";
import { topologicalSort } from "./graph_directed_and_scc/topologicalSort";
import { kosarajuScc } from "./graph_directed_and_scc/kosarajuScc";
import { fordFulkerson } from "./graph_flows_and_cuts/fordFulkerson";
import { minimumPathCover } from "./graph_flows_and_cuts/minimumPathCover";
import { coinChangeDp } from "./dp_1d/coinChangeDp";
import { longestIncreasingSubsequence } from "./dp_1d/longestIncreasingSubsequence";
import { knapsack01 } from "./dp_1d/knapsack01";
import { editDistance } from "./dp_2d/editDistance";
import { gridPathsDp } from "./dp_2d/gridPathsDp";
import { countingTilings } from "./dp_2d/countingTilings";
import { tspBitmaskDp } from "./dp_2d/tspBitmaskDp";
import { mergeIntervals } from "./intervals/mergeIntervals";
import { huffmanCoding } from "./greedy_algorithms/huffmanCoding";
import { intervalScheduling } from "./greedy_algorithms/intervalScheduling";
import { tasksAndDeadlines } from "./greedy_algorithms/tasksAndDeadlines";
import { countingBits } from "./bit_manipulation/countingBits";
import { sievePrimes } from "./math_and_number_theory/sievePrimes";
import { euclidGcd } from "./math_and_number_theory/euclidGcd";
import { modularExponentiationInverse } from "./math_and_number_theory/modularExponentiationInverse";
import { extendedEuclideanAlgorithm } from "./math_and_number_theory/extendedEuclideanAlgorithm";
import { chineseRemainderTheorem } from "./math_and_number_theory/chineseRemainderTheorem";
import { eulerTotientFunction } from "./math_and_number_theory/eulerTotientFunction";
import { binomialCoefficientsPascal } from "./math_and_number_theory/binomialCoefficientsPascal";
import { catalanNumbers } from "./math_and_number_theory/catalanNumbers";
import { nimGame } from "./game_theory/nimGame";
import { fenwickTree } from "./advanced_range_queries/fenwickTree";
import { segmentTree } from "./advanced_range_queries/segmentTree";
import { segmentTreeLazy } from "./advanced_range_queries/segmentTreeLazy";
import { sparseTableRmq } from "./advanced_range_queries/sparseTableRmq";
import { sqrtDecomposition } from "./advanced_range_queries/sqrtDecomposition";
import { moAlgorithm } from "./advanced_range_queries/moAlgorithm";
import { dynamicSegmentTree } from "./advanced_range_queries/dynamicSegmentTree";
import { persistentSegmentTree } from "./advanced_range_queries/persistentSegmentTree";
import { mergeSort } from "./two_pointers/mergeSort";
import { binarySearch1d } from "./binary_search/binarySearch1d";
import { meetInTheMiddle } from "./binary_search/meetInTheMiddle";
import { convexHull } from "./geometry_and_sweep_line/convexHull";
import { polygonArea } from "./geometry_and_sweep_line/polygonArea";
import { inclusionExclusionPrinciple } from "./math_and_number_theory/inclusionExclusionPrinciple";
import { matrixExponentiation } from "./math_and_number_theory/matrixExponentiation";
import { markovChains } from "./math_and_number_theory/markovChains";
import { spragueGrundyTheorem } from "./game_theory/spragueGrundyTheorem";
import { stringHashing } from "./tries_and_strings/stringHashing";
import { lineSegmentIntersection } from "./geometry_and_sweep_line/lineSegmentIntersection";
import { sweepLineIntersections } from "./geometry_and_sweep_line/sweepLineIntersections";
import { closestPairOfPoints } from "./geometry_and_sweep_line/closestPairOfPoints";
import { hierholzerEulerianPath } from "./graph_directed_and_scc/hierholzerEulerianPath";
import { deBruijnSequence } from "./graph_directed_and_scc/deBruijnSequence";
import { twoSatSolver } from "./graph_directed_and_scc/twoSatSolver";
import { successorPaths } from "./graph_directed_and_scc/successorPaths";
import { dagDpLongestPath } from "./graph_directed_and_scc/dagDpLongestPath";
import { dfsGraph } from "./graph_traversal/dfsGraph";
import { bipartiteGraphCheck } from "./graph_traversal/bipartiteGraphCheck";
import { edmondsKarpMaxFlow } from "./graph_flows_and_cuts/edmondsKarpMaxFlow";
import { eulerTourTechnique } from "./tree_queries_and_diameter/eulerTourTechnique";
import { dsuOnTree } from "./tree_queries_and_diameter/dsuOnTree";
import { binaryLiftingLca } from "./tree_queries_and_diameter/binaryLiftingLca";
import { disjointSetUnion } from "./graph_spanning_trees/disjointSetUnion";
import { generatingPermutations } from "./backtracking/generatingPermutations";
import { knightsTourWarnsdorff } from "./backtracking/knightsTourWarnsdorff";
import { hamiltonianPathDp } from "./backtracking/hamiltonianPathDp";
import { generatingSubsets } from "./backtracking/generatingSubsets";

import { tensorStrideOffset } from "./ml_infra/tensorStrideOffset";
import { tensorContiguityReshape } from "./ml_infra/tensorContiguityReshape";
import { sramGemmTiling } from "./ml_infra/sramGemmTiling";
import { rooflineIntensityClassifier } from "./ml_infra/rooflineIntensityClassifier";
import { autogradVjpDag } from "./ml_infra/autogradVjpDag";
import { activationCheckpointing } from "./ml_infra/activationCheckpointing";
import { fusedSoftmaxLse } from "./ml_infra/fusedSoftmaxLse";
import { affineQuantizationSq8 } from "./ml_infra/affineQuantizationSq8";
import { smoothquantScaling } from "./ml_infra/smoothquantScaling";
import { lshVectorHashing } from "./ml_infra/lshVectorHashing";
import { ivfPqAdcSearch } from "./ml_infra/ivfPqAdcSearch";
import { hnswVectorSearch } from "./ml_infra/hnswVectorSearch";
import { bpeTokenizer } from "./ml_infra/bpeTokenizer";
import { viterbiSubwordSegmenter } from "./ml_infra/viterbiSubwordSegmenter";
import { xgboostGradientSplit } from "./ml_infra/xgboostGradientSplit";
import { im2colConvTiling } from "./ml_infra/im2colConvTiling";
import { lstmConstantErrorCarousel } from "./ml_recurrent_gates/lstmConstantErrorCarousel";
import { scaledDotAttentionMask } from "./ml_infra/scaledDotAttentionMask";
import { ropeRotaryPosition } from "./ml_infra/ropeRotaryPosition";
import { groupedQueryAttention } from "./ml_infra/groupedQueryAttention";
import { flashAttentionTiling } from "./ml_infra/flashAttentionTiling";
import { tritonKernelFusion } from "./ml_infra/tritonKernelFusion";
import { ringAllreducePartition } from "./ml_infra/ringAllreducePartition";
import { megatronTpSpSplit } from "./ml_infra/megatronTpSpSplit";
import { deepspeedZeroSharding } from "./ml_infra/deepspeedZeroSharding";
import { pagedAttentionBlockTable } from "./ml_infra/pagedAttentionBlockTable";
import { continuousBatchingScheduler } from "./ml_infra/continuousBatchingScheduler";
import { speculativeDecodingVerifier } from "./ml_infra/speculativeDecodingVerifier";
import { arrayMatrixTraversal } from "./ml_infra/arrayMatrixTraversal";
import { stridedIndexArithmetic } from "./ml_infra/stridedIndexArithmetic";
import { matrixMultiplicationNaive } from "./ml_infra/matrixMultiplicationNaive";
import { topologicalSortDag } from "./ml_infra/topologicalSortDag";
import { floatingPointOverflow } from "./ml_infra/floatingPointOverflow";
import { distanceMetricsKnn } from "./ml_infra/distanceMetricsKnn";
import { triePrefixTreeSearch } from "./ml_infra/triePrefixTreeSearch";
import { decisionTreeGiniSplit } from "./ml_infra/decisionTreeGiniSplit";
import { conv2dSlidingWindow } from "./ml_infra/conv2dSlidingWindow";
import { recurrentUnrollingBptt } from "./ml_recurrent_gates/recurrentUnrollingBptt";
import { onnxOperatorFusion } from "./ml_graph_compilers/onnxOperatorFusion";
import { tensorrtEngineOptimizer } from "./ml_graph_compilers/tensorrtEngineOptimizer";
import { tvmRelayGraphLowering } from "./ml_graph_compilers/tvmRelayGraphLowering";
import { xlaHloGraphOptimizer } from "./ml_graph_compilers/xlaHloGraphOptimizer";
// Extended 190 ML Infra Curriculum Imports
import { tensorContiguityVerifier } from "./ml_tensor_algebra/tensorContiguityVerifier";
import { strided1dDotProduct } from "./ml_tensor_algebra/strided1dDotProduct";
import { antiDiagonalExtraction } from "./ml_tensor_algebra/antiDiagonalExtraction";
import { transposeSquareMatrix } from "./ml_tensor_algebra/transposeSquareMatrix";
import { flatten2dGrid } from "./ml_tensor_algebra/flatten2dGrid";
import { stridedMaxPooling } from "./ml_tensor_algebra/stridedMaxPooling";
import { asStridedTensorViewEngine } from "./ml_tensor_algebra/asStridedTensorViewEngine";
import { virtualMatrixAdditionZeroStride } from "./ml_tensor_algebra/virtualMatrixAdditionZeroStride";
import { matrixBlockSumFlat } from "./ml_tensor_algebra/matrixBlockSumFlat";
import { rotateImageFlatBuffer } from "./ml_tensor_algebra/rotateImageFlatBuffer";
import { findFirstOccurrence1d } from "./ml_tensor_algebra/findFirstOccurrence1d";
import { validNeighborGridBounds } from "./ml_tensor_algebra/validNeighborGridBounds";
import { zeroCopyIm2colStrideUnroller } from "./ml_tensor_algebra/zeroCopyIm2colStrideUnroller";
import { alignedSimtBlockTiling } from "./ml_tensor_algebra/alignedSimtBlockTiling";
import { flattenStridedNdView } from "./ml_tensor_algebra/flattenStridedNdView";
import { conv1dSharedMemoryScratchpad } from "./ml_gemm_roofline/conv1dSharedMemoryScratchpad";
import { diagonalCacheThrashing } from "./ml_gemm_roofline/diagonalCacheThrashing";
import { submatrixSum2dQuery } from "./ml_gemm_roofline/submatrixSum2dQuery";
import { vectorDotProductMac } from "./ml_gemm_roofline/vectorDotProductMac";
import { sparseMatmulCsr } from "./ml_gemm_roofline/sparseMatmulCsr";
import { hardwareRooflineModelCalculator } from "./ml_gemm_roofline/hardwareRooflineModelCalculator";
import { dynamic2dBlockPrefixSum } from "./ml_gemm_roofline/dynamic2dBlockPrefixSum";
import { tritonTensorCoreMmaSwizzle } from "./ml_gemm_roofline/tritonTensorCoreMmaSwizzle";
import { transposeMatrixSquare } from "./ml_gemm_roofline/transposeMatrixSquare";
import { l1BlockTiledMatmul } from "./ml_gemm_roofline/l1BlockTiledMatmul";
import { fusedFfnGemmOnlineSoftmax } from "./ml_gemm_roofline/fusedFfnGemmOnlineSoftmax";
import { flatten2dArray } from "./ml_gemm_roofline/flatten2dArray";
import { cudaTritonSramTiledGemm } from "./ml_gemm_roofline/cudaTritonSramTiledGemm";
import { asyncDoubleBufferingPipeline } from "./ml_gemm_roofline/asyncDoubleBufferingPipeline";
import { reshapeMatrix566 } from "./ml_gemm_roofline/reshapeMatrix566";
import { naive3LoopMatmul } from "./ml_gemm_roofline/naive3LoopMatmul";
import { matrixVectorMultiplication } from "./ml_gemm_roofline/matrixVectorMultiplication";
import { evalReversePolishNotation } from "./ml_autograd_dags/evalReversePolishNotation";
import { detectTerminalNodes } from "./ml_autograd_dags/detectTerminalNodes";
import { circularDependencyDetection } from "./ml_autograd_dags/circularDependencyDetection";
import { recipeIndegreeKahnBfs } from "./ml_autograd_dags/recipeIndegreeKahnBfs";
import { parallelCourseCriticalPath } from "./ml_autograd_dags/parallelCourseCriticalPath";
import { microgradReverseGradients } from "./ml_autograd_dags/microgradReverseGradients";
import { deepCopyLinkedListRandom } from "./ml_autograd_dags/deepCopyLinkedListRandom";
import { optimalSubgraphActivationCheckpointing } from "./ml_autograd_dags/optimalSubgraphActivationCheckpointing";
import { astExpressionEvalVariables } from "./ml_autograd_dags/astExpressionEvalVariables";
import { prefixToPostfixConversion } from "./ml_autograd_dags/prefixToPostfixConversion";
import { computeScalarChainRule } from "./ml_autograd_dags/computeScalarChainRule";
import { astConstantFolding } from "./ml_autograd_dags/astConstantFolding";
import { tensorVjpEngineGradOfGrad } from "./ml_autograd_dags/tensorVjpEngineGradOfGrad";
import { asyncPipelinedVjpEvaluation } from "./ml_autograd_dags/asyncPipelinedVjpEvaluation";
import { findZeroIndegreeNodes } from "./ml_autograd_dags/findZeroIndegreeNodes";
import { microgradForwardPass } from "./ml_autograd_dags/microgradForwardPass";
import { basicSymmetricInt8Scale } from "./ml_precision_quantization/basicSymmetricInt8Scale";
import { scalarInt8Quantization } from "./ml_precision_quantization/scalarInt8Quantization";
import { fakeQuantizedW8a8Matmul } from "./ml_precision_quantization/fakeQuantizedW8a8Matmul";
import { asymmetricAffineQuantization } from "./ml_precision_quantization/asymmetricAffineQuantization";
import { stableSoftmaxLogsumexp } from "./ml_precision_quantization/stableSoftmaxLogsumexp";
import { perChannelSymmetricQuantizer } from "./ml_precision_quantization/perChannelSymmetricQuantizer";
import { fp8E4m3E5m2Bitpacker } from "./ml_precision_quantization/fp8E4m3E5m2Bitpacker";
import { twoElementMaxSubtractionShift } from "./ml_precision_quantization/twoElementMaxSubtractionShift";
import { fp16OverflowRescalingEngine } from "./ml_precision_quantization/fp16OverflowRescalingEngine";
import { minMaxRangeClipping } from "./ml_precision_quantization/minMaxRangeClipping";
import { smoothquantOutlierMigration } from "./ml_precision_quantization/smoothquantOutlierMigration";
import { ieee754BitwiseDissector } from "./ml_precision_quantization/ieee754BitwiseDissector";
import { zeroPointAlignmentShift } from "./ml_precision_quantization/zeroPointAlignmentShift";
import { bitwiseSignExtraction } from "./ml_precision_quantization/bitwiseSignExtraction";
import { onePassOnlineSoftmaxSramKernel } from "./ml_precision_quantization/onePassOnlineSoftmaxSramKernel";
import { hnswMultiLayerProbabilisticGraph } from "./ml_vector_search/hnswMultiLayerProbabilisticGraph";
import { linearScanKnnTopk } from "./ml_vector_search/linearScanKnnTopk";
import { binarySearchBucketIndex } from "./ml_vector_search/binarySearchBucketIndex";
import { kmeansCentroidClustering } from "./ml_vector_search/kmeansCentroidClustering";
import { hnswHeuristicSpatialPruning } from "./ml_vector_search/hnswHeuristicSpatialPruning";
import { ivfInvertedIndexPostingLists } from "./ml_vector_search/ivfInvertedIndexPostingLists";
import { simdSwizzledAdcDistanceLookup } from "./ml_vector_search/simdSwizzledAdcDistanceLookup";
import { gaussianL2LocalitySensitiveHash } from "./ml_vector_search/gaussianL2LocalitySensitiveHash";
import { l2DistancePairwise } from "./ml_vector_search/l2DistancePairwise";
import { lshMultiTableBucketGrouping } from "./ml_vector_search/lshMultiTableBucketGrouping";
import { randomHyperplaneSignHash } from "./ml_vector_search/randomHyperplaneSignHash";
import { hnswGreedyBeamSearchEngine } from "./ml_vector_search/hnswGreedyBeamSearchEngine";
import { ivfPqAsymmetricDistanceComputation } from "./ml_vector_search/ivfPqAsymmetricDistanceComputation";
import { subvectorDecompositionCodebook } from "./ml_vector_search/subvectorDecompositionCodebook";
import { cosineSimilarityNormalized } from "./ml_vector_search/cosineSimilarityNormalized";
import { singleSkipListLayerTraversal } from "./ml_vector_search/singleSkipListLayerTraversal";
import { byteLevelBpeTiktokenTokenizer } from "./ml_tokenization/byteLevelBpeTiktokenTokenizer";
import { characterFrequencyNgramCounter } from "./ml_tokenization/characterFrequencyNgramCounter";
import { viterbiLatticeSubwordSegmenter } from "./ml_tokenization/viterbiLatticeSubwordSegmenter";
import { iterativeBpeVocabularyTrainer } from "./ml_tokenization/iterativeBpeVocabularyTrainer";
import { sentencepieceByteFallbackEncoder } from "./ml_tokenization/sentencepieceByteFallbackEncoder";
import { unigramEmVocabularyPruner } from "./ml_tokenization/unigramEmVocabularyPruner";
import { basicTrieInsertSearch } from "./ml_tokenization/basicTrieInsertSearch";
import { adjacentPairFrequencyCounter } from "./ml_tokenization/adjacentPairFrequencyCounter";
import { wordpiecePmiScoredTokenizer } from "./ml_tokenization/wordpiecePmiScoredTokenizer";
import { unigramCandidateLossRanks } from "./ml_tokenization/unigramCandidateLossRanks";
import { singlePassBpeMerger } from "./ml_tokenization/singlePassBpeMerger";
import { trieLongestPrefixMatcher } from "./ml_tokenization/trieLongestPrefixMatcher";
import { fastSubwordLatticeViterbiBeam } from "./ml_tokenization/fastSubwordLatticeViterbiBeam";
import { parallelLockFreeBpeEncoder } from "./ml_tokenization/parallelLockFreeBpeEncoder";
import { ahoCorasickMultiTokenMatcher } from "./ml_tokenization/ahoCorasickMultiTokenMatcher";
import { utf8ByteSequenceValidator } from "./ml_tokenization/utf8ByteSequenceValidator";
import { variancePreservationProofSim } from "./ml_attention_geometry/variancePreservationProofSim";
import { singleHeadAttentionMap } from "./ml_attention_geometry/singleHeadAttentionMap";
import { rope2dComplexPlaneRotation } from "./ml_attention_geometry/rope2dComplexPlaneRotation";
import { groupedQueryAttentionGqaEngine } from "./ml_attention_geometry/groupedQueryAttentionGqaEngine";
import { relativePositionInnerProductPreservation } from "./ml_attention_geometry/relativePositionInnerProductPreservation";
import { flashDecodingSplitKSequenceParallel } from "./ml_attention_geometry/flashDecodingSplitKSequenceParallel";
import { multiHeadAttentionSplitConcat } from "./ml_attention_geometry/multiHeadAttentionSplitConcat";
import { causalLowerTriangularMask } from "./ml_attention_geometry/causalLowerTriangularMask";
import { softmaxRowNormalize } from "./ml_attention_geometry/softmaxRowNormalize";
import { slidingWindowPrefixAttentionEngine } from "./ml_attention_geometry/slidingWindowPrefixAttentionEngine";
import { vectorInnerProductScaling } from "./ml_attention_geometry/vectorInnerProductScaling";
import { rotaryEmbeddingAttentionCudaKernel } from "./ml_attention_geometry/rotaryEmbeddingAttentionCudaKernel";
import { multiQueryAttentionBroadcast } from "./ml_attention_geometry/multiQueryAttentionBroadcast";
import { kvCacheStepAppend } from "./ml_attention_geometry/kvCacheStepAppend";
import { ropeFrequencyScalingYarn } from "./ml_attention_geometry/ropeFrequencyScalingYarn";
import { pagedKvCacheBlockMapping } from "./ml_attention_geometry/pagedKvCacheBlockMapping";
import { transposedConv2dDeconvIndexMapper } from "./ml_convolutions/transposedConv2dDeconvIndexMapper";
import { conv1dSlidingWindowDirect } from "./ml_convolutions/conv1dSlidingWindowDirect";
import { col2imGradAccumulator } from "./ml_convolutions/col2imGradAccumulator";
import { multiChannelConv2dAccumulation } from "./ml_convolutions/multiChannelConv2dAccumulation";
import { winogradF23TransformMatrices } from "./ml_convolutions/winogradF23TransformMatrices";
import { winogradMinimalFilteringExecution } from "./ml_convolutions/winogradMinimalFilteringExecution";
import { conv2dSlidingWindowDirect } from "./ml_convolutions/conv2dSlidingWindowDirect";
import { loweredConv2dGemmExecutionEngine } from "./ml_convolutions/loweredConv2dGemmExecutionEngine";
import { conv2dPaddingStrideOutputShape } from "./ml_convolutions/conv2dPaddingStrideOutputShape";
import { fusedDepthwiseSeparableConv2dEngine } from "./ml_convolutions/fusedDepthwiseSeparableConv2dEngine";
import { cudnnImplicitGemmOnTheFlyKernel } from "./ml_convolutions/cudnnImplicitGemmOnTheFlyKernel";
import { receptiveFieldGrowthCalculator } from "./ml_convolutions/receptiveFieldGrowthCalculator";
import { conv2dToGemmReceptiveFieldUnroll } from "./ml_convolutions/conv2dToGemmReceptiveFieldUnroll";
import { asStridedZeroCopyIm2colView } from "./ml_convolutions/asStridedZeroCopyIm2colView";
import { fftFrequencyDomainConvolution2d } from "./ml_convolutions/fftFrequencyDomainConvolution2d";
import { im2col4dTo2dUnroller } from "./ml_convolutions/im2col4dTo2dUnroller";
import { singleFeatureThresholdSplit } from "./ml_tree_ensembles/singleFeatureThresholdSplit";
import { giniImpurityBinarySplit } from "./ml_tree_ensembles/giniImpurityBinarySplit";
import { greedyDecisionTreeBuilder } from "./ml_tree_ensembles/greedyDecisionTreeBuilder";
import { multiTreeAdditiveEnsemblePredictor } from "./ml_tree_ensembles/multiTreeAdditiveEnsemblePredictor";
import { exactGreedySplitSearch } from "./ml_tree_ensembles/exactGreedySplitSearch";
import { missingValueDefaultDirectionSplitter } from "./ml_tree_ensembles/missingValueDefaultDirectionSplitter";
import { xgboostHistogramSplitSearch } from "./ml_tree_ensembles/xgboostHistogramSplitSearch";
import { varianceReductionSplit } from "./ml_tree_ensembles/varianceReductionSplit";
import { treeNodePredictionTraverser } from "./ml_tree_ensembles/treeNodePredictionTraverser";
import { weightedQuantileSketchHistogram } from "./ml_tree_ensembles/weightedQuantileSketchHistogram";
import { regularizedOptimalLeafWeight } from "./ml_tree_ensembles/regularizedOptimalLeafWeight";
import { shannonEntropyCalculator } from "./ml_tree_ensembles/shannonEntropyCalculator";
import { gpuHistQuantizedHistogramKernel } from "./ml_tree_ensembles/gpuHistQuantizedHistogramKernel";
import { xgboostSplitGainScoreCalculator } from "./ml_tree_ensembles/xgboostSplitGainScoreCalculator";
import { loglossGradientHessianCalculator } from "./ml_tree_ensembles/loglossGradientHessianCalculator";
import { tileIndexGridMapper } from "./ml_hardware_kernels/tileIndexGridMapper";
import { onlineMaxLogsumexpTracker } from "./ml_hardware_kernels/onlineMaxLogsumexpTracker";
import { autotuneConfigGridSearchEngine } from "./ml_hardware_kernels/autotuneConfigGridSearchEngine";
import { tritonFusedAddSoftmaxDropoutKernel } from "./ml_hardware_kernels/tritonFusedAddSoftmaxDropoutKernel";
import { flashAttention2SequenceParallelForward } from "./ml_hardware_kernels/flashAttention2SequenceParallelForward";
import { tritonProgramId1dTo2dMap } from "./ml_hardware_kernels/tritonProgramId1dTo2dMap";
import { tritonMlirToPtxCompilerPipelineSimulator } from "./ml_hardware_kernels/tritonMlirToPtxCompilerPipelineSimulator";
import { maskedMemoryLoadStoreGuard } from "./ml_hardware_kernels/maskedMemoryLoadStoreGuard";
import { flashAttention1ForwardTiling } from "./ml_hardware_kernels/flashAttention1ForwardTiling";
import { tritonSramSwizzledGemmKernel } from "./ml_hardware_kernels/tritonSramSwizzledGemmKernel";
import { flashAttention3TmaWarpSpecializedKernel } from "./ml_hardware_kernels/flashAttention3TmaWarpSpecializedKernel";
import { hbmVsSramBandwidthCalculator } from "./ml_hardware_kernels/hbmVsSramBandwidthCalculator";
import { tritonL2CacheSwizzledGemmScheduler } from "./ml_hardware_kernels/tritonL2CacheSwizzledGemmScheduler";
import { warpShuffleButterflyReduction } from "./ml_hardware_kernels/warpShuffleButterflyReduction";
import { flashAttentionBackwardRecomputationEngine } from "./ml_hardware_kernels/flashAttentionBackwardRecomputationEngine";
import { bankConflictSwizzleCalculator } from "./ml_hardware_kernels/bankConflictSwizzleCalculator";
import { columnParallelLinearReshaper } from "./ml_distributed_systems/columnParallelLinearReshaper";
import { twoGpuParameterSplitter } from "./ml_distributed_systems/twoGpuParameterSplitter";
import { fullRingAllreduceCollectiveSimulator } from "./ml_distributed_systems/fullRingAllreduceCollectiveSimulator";
import { oneF1bPipelineParallelExecutionScheduler } from "./ml_distributed_systems/oneF1bPipelineParallelExecutionScheduler";
import { zero1OptimizerStateMemoryEstimator } from "./ml_distributed_systems/zero1OptimizerStateMemoryEstimator";
import { fp16ModelMemoryFootprintCalculator } from "./ml_distributed_systems/fp16ModelMemoryFootprintCalculator";
import { ringScatterReduceArrayAccumulator } from "./ml_distributed_systems/ringScatterReduceArrayAccumulator";
import { zero2GradientPartitioningEngine } from "./ml_distributed_systems/zero2GradientPartitioningEngine";
import { zero3ParameterShardingDynamicAllgather } from "./ml_distributed_systems/zero3ParameterShardingDynamicAllgather";
import { ringAllgatherVectorReconstructor } from "./ml_distributed_systems/ringAllgatherVectorReconstructor";
import { ncclTreeVsRingAllreduceSimulator } from "./ml_distributed_systems/ncclTreeVsRingAllreduceSimulator";
import { ringAllreduceDataVolumeEstimator } from "./ml_distributed_systems/ringAllreduceDataVolumeEstimator";
import { ringNeighborRankCalculator } from "./ml_distributed_systems/ringNeighborRankCalculator";
import { rowParallelLinearAllreducer } from "./ml_distributed_systems/rowParallelLinearAllreducer";
import { cudaIpcSharedMemoryPointerMapper } from "./ml_distributed_systems/cudaIpcSharedMemoryPointerMapper";
import { nvlinkSymmetricMemoryPeerToPeerEngine } from "./ml_distributed_systems/nvlinkSymmetricMemoryPeerToPeerEngine";
import { kvCacheSequenceMemoryEstimator } from "./ml_llm_serving/kvCacheSequenceMemoryEstimator";
import { draftModelLookaheadTokenSampler } from "./ml_llm_serving/draftModelLookaheadTokenSampler";
import { iterationLevelContinuousBatchScheduler } from "./ml_llm_serving/iterationLevelContinuousBatchScheduler";
import { rejectionSamplingAcceptanceThreshold } from "./ml_llm_serving/rejectionSamplingAcceptanceThreshold";
import { fullSpeculativeDecodingServingEngine } from "./ml_llm_serving/fullSpeculativeDecodingServingEngine";
import { hashBasedPrefixCacheTrieAllocator } from "./ml_llm_serving/hashBasedPrefixCacheTrieAllocator";
import { pagedAttentionBlockTableAllocator } from "./ml_llm_serving/pagedAttentionBlockTableAllocator";
import { sequenceLengthPaddingWasteCalculator } from "./ml_llm_serving/sequenceLengthPaddingWasteCalculator";
import { speculativeDecodingResidualDistributionRecoverer } from "./ml_llm_serving/speculativeDecodingResidualDistributionRecoverer";
import { logicalToPhysicalBlockAddressTranslator } from "./ml_llm_serving/logicalToPhysicalBlockAddressTranslator";
import { chunkedPrefillTokenBudgetScheduler } from "./ml_llm_serving/chunkedPrefillTokenBudgetScheduler";
import { referenceCountingCowBeamSearchBrancher } from "./ml_llm_serving/referenceCountingCowBeamSearchBrancher";
import { pytorchCustomCudaOpWrapperRegister } from "./ml_llm_serving/pytorchCustomCudaOpWrapperRegister";
import { vllmPagedAttentionKernelExecutor } from "./ml_llm_serving/vllmPagedAttentionKernelExecutor";
import { flashDecodingSplitKKvCacheGather } from "./ml_llm_serving/flashDecodingSplitKKvCacheGather";
import { targetModelParallelVerificationPass } from "./ml_llm_serving/targetModelParallelVerificationPass";

export const ALGORITHMS = [
  prefixSum,
  twoSum,
  kadaneMaxSubarray,
  bubbleSort,
  twoSumSorted,
  twoPointers,
  quickSort,
  slidingWindowMin,
  validParentheses,
  nearestSmallerElement,
  binarySearchMatrix,
  reverseLinkedList,
  binaryTreeLca,
  treeDiameter,
  triePrefixTree,
  zAlgorithm,
  kmpStringMatch,
  kthLargestElement,
  nQueens,
  bfsGraph,
  numberOfIslands,
  dijkstraShortestPath,
  bellmanFord,
  floydWarshall,
  kruskalMst,
  primMst,
  topologicalSort,
  kosarajuScc,
  fordFulkerson,
  minimumPathCover,
  coinChangeDp,
  longestIncreasingSubsequence,
  knapsack01,
  editDistance,
  gridPathsDp,
  countingTilings,
  tspBitmaskDp,
  mergeIntervals,
  huffmanCoding,
  intervalScheduling,
  tasksAndDeadlines,
  countingBits,
  sievePrimes,
  euclidGcd,
  modularExponentiationInverse,
  extendedEuclideanAlgorithm,
  chineseRemainderTheorem,
  eulerTotientFunction,
  binomialCoefficientsPascal,
  catalanNumbers,
  nimGame,
  fenwickTree,
  segmentTree,
  segmentTreeLazy,
  sparseTableRmq,
  sqrtDecomposition,
  moAlgorithm,
  dynamicSegmentTree,
  persistentSegmentTree,
  mergeSort,
  binarySearch1d,
  meetInTheMiddle,
  convexHull,
  polygonArea,
  inclusionExclusionPrinciple,
  matrixExponentiation,
  markovChains,
  spragueGrundyTheorem,
  stringHashing,
  lineSegmentIntersection,
  sweepLineIntersections,
  closestPairOfPoints,
  hierholzerEulerianPath,
  deBruijnSequence,
  twoSatSolver,
  successorPaths,
  dagDpLongestPath,
  dfsGraph,
  bipartiteGraphCheck,
  edmondsKarpMaxFlow,
  eulerTourTechnique,
  dsuOnTree,
  binaryLiftingLca,
  disjointSetUnion,
  generatingPermutations,
  knightsTourWarnsdorff,
  hamiltonianPathDp,
  generatingSubsets,
  tensorStrideOffset,
  tensorContiguityReshape,
  sramGemmTiling,
  rooflineIntensityClassifier,
  autogradVjpDag,
  activationCheckpointing,
  fusedSoftmaxLse,
  affineQuantizationSq8,
  smoothquantScaling,
  lshVectorHashing,
  ivfPqAdcSearch,
  hnswVectorSearch,
  bpeTokenizer,
  viterbiSubwordSegmenter,
  xgboostGradientSplit,
  im2colConvTiling,
  lstmConstantErrorCarousel,
  scaledDotAttentionMask,
  ropeRotaryPosition,
  groupedQueryAttention,
  flashAttentionTiling,
  tritonKernelFusion,
  ringAllreducePartition,
  megatronTpSpSplit,
  deepspeedZeroSharding,
  pagedAttentionBlockTable,
  continuousBatchingScheduler,
  speculativeDecodingVerifier,
  arrayMatrixTraversal,
  stridedIndexArithmetic,
  matrixMultiplicationNaive,
  topologicalSortDag,
  floatingPointOverflow,
  distanceMetricsKnn,
  triePrefixTreeSearch,
  decisionTreeGiniSplit,
  conv2dSlidingWindow,
  recurrentUnrollingBptt,
  onnxOperatorFusion,
  tensorrtEngineOptimizer,
  tvmRelayGraphLowering,
  xlaHloGraphOptimizer,
  tensorContiguityVerifier,
  strided1dDotProduct,
  antiDiagonalExtraction,
  transposeSquareMatrix,
  flatten2dGrid,
  stridedMaxPooling,
  asStridedTensorViewEngine,
  virtualMatrixAdditionZeroStride,
  matrixBlockSumFlat,
  rotateImageFlatBuffer,
  findFirstOccurrence1d,
  validNeighborGridBounds,
  zeroCopyIm2colStrideUnroller,
  alignedSimtBlockTiling,
  flattenStridedNdView,
  conv1dSharedMemoryScratchpad,
  diagonalCacheThrashing,
  submatrixSum2dQuery,
  vectorDotProductMac,
  sparseMatmulCsr,
  hardwareRooflineModelCalculator,
  dynamic2dBlockPrefixSum,
  tritonTensorCoreMmaSwizzle,
  transposeMatrixSquare,
  l1BlockTiledMatmul,
  fusedFfnGemmOnlineSoftmax,
  flatten2dArray,
  cudaTritonSramTiledGemm,
  asyncDoubleBufferingPipeline,
  reshapeMatrix566,
  naive3LoopMatmul,
  matrixVectorMultiplication,
  evalReversePolishNotation,
  detectTerminalNodes,
  circularDependencyDetection,
  recipeIndegreeKahnBfs,
  parallelCourseCriticalPath,
  microgradReverseGradients,
  deepCopyLinkedListRandom,
  optimalSubgraphActivationCheckpointing,
  astExpressionEvalVariables,
  prefixToPostfixConversion,
  computeScalarChainRule,
  astConstantFolding,
  tensorVjpEngineGradOfGrad,
  asyncPipelinedVjpEvaluation,
  findZeroIndegreeNodes,
  microgradForwardPass,
  basicSymmetricInt8Scale,
  scalarInt8Quantization,
  fakeQuantizedW8a8Matmul,
  asymmetricAffineQuantization,
  stableSoftmaxLogsumexp,
  perChannelSymmetricQuantizer,
  fp8E4m3E5m2Bitpacker,
  twoElementMaxSubtractionShift,
  fp16OverflowRescalingEngine,
  minMaxRangeClipping,
  smoothquantOutlierMigration,
  ieee754BitwiseDissector,
  zeroPointAlignmentShift,
  bitwiseSignExtraction,
  onePassOnlineSoftmaxSramKernel,
  hnswMultiLayerProbabilisticGraph,
  linearScanKnnTopk,
  binarySearchBucketIndex,
  kmeansCentroidClustering,
  hnswHeuristicSpatialPruning,
  ivfInvertedIndexPostingLists,
  simdSwizzledAdcDistanceLookup,
  gaussianL2LocalitySensitiveHash,
  l2DistancePairwise,
  lshMultiTableBucketGrouping,
  randomHyperplaneSignHash,
  hnswGreedyBeamSearchEngine,
  ivfPqAsymmetricDistanceComputation,
  subvectorDecompositionCodebook,
  cosineSimilarityNormalized,
  singleSkipListLayerTraversal,
  byteLevelBpeTiktokenTokenizer,
  characterFrequencyNgramCounter,
  viterbiLatticeSubwordSegmenter,
  iterativeBpeVocabularyTrainer,
  sentencepieceByteFallbackEncoder,
  unigramEmVocabularyPruner,
  basicTrieInsertSearch,
  adjacentPairFrequencyCounter,
  wordpiecePmiScoredTokenizer,
  unigramCandidateLossRanks,
  singlePassBpeMerger,
  trieLongestPrefixMatcher,
  fastSubwordLatticeViterbiBeam,
  parallelLockFreeBpeEncoder,
  ahoCorasickMultiTokenMatcher,
  utf8ByteSequenceValidator,
  variancePreservationProofSim,
  singleHeadAttentionMap,
  rope2dComplexPlaneRotation,
  groupedQueryAttentionGqaEngine,
  relativePositionInnerProductPreservation,
  flashDecodingSplitKSequenceParallel,
  multiHeadAttentionSplitConcat,
  causalLowerTriangularMask,
  softmaxRowNormalize,
  slidingWindowPrefixAttentionEngine,
  vectorInnerProductScaling,
  rotaryEmbeddingAttentionCudaKernel,
  multiQueryAttentionBroadcast,
  kvCacheStepAppend,
  ropeFrequencyScalingYarn,
  pagedKvCacheBlockMapping,
  transposedConv2dDeconvIndexMapper,
  conv1dSlidingWindowDirect,
  col2imGradAccumulator,
  multiChannelConv2dAccumulation,
  winogradF23TransformMatrices,
  winogradMinimalFilteringExecution,
  conv2dSlidingWindowDirect,
  loweredConv2dGemmExecutionEngine,
  conv2dPaddingStrideOutputShape,
  fusedDepthwiseSeparableConv2dEngine,
  cudnnImplicitGemmOnTheFlyKernel,
  receptiveFieldGrowthCalculator,
  conv2dToGemmReceptiveFieldUnroll,
  asStridedZeroCopyIm2colView,
  fftFrequencyDomainConvolution2d,
  im2col4dTo2dUnroller,
  singleFeatureThresholdSplit,
  giniImpurityBinarySplit,
  greedyDecisionTreeBuilder,
  multiTreeAdditiveEnsemblePredictor,
  exactGreedySplitSearch,
  missingValueDefaultDirectionSplitter,
  xgboostHistogramSplitSearch,
  varianceReductionSplit,
  treeNodePredictionTraverser,
  weightedQuantileSketchHistogram,
  regularizedOptimalLeafWeight,
  shannonEntropyCalculator,
  gpuHistQuantizedHistogramKernel,
  xgboostSplitGainScoreCalculator,
  loglossGradientHessianCalculator,
  tileIndexGridMapper,
  onlineMaxLogsumexpTracker,
  autotuneConfigGridSearchEngine,
  tritonFusedAddSoftmaxDropoutKernel,
  flashAttention2SequenceParallelForward,
  tritonProgramId1dTo2dMap,
  tritonMlirToPtxCompilerPipelineSimulator,
  maskedMemoryLoadStoreGuard,
  flashAttention1ForwardTiling,
  tritonSramSwizzledGemmKernel,
  flashAttention3TmaWarpSpecializedKernel,
  hbmVsSramBandwidthCalculator,
  tritonL2CacheSwizzledGemmScheduler,
  warpShuffleButterflyReduction,
  flashAttentionBackwardRecomputationEngine,
  bankConflictSwizzleCalculator,
  columnParallelLinearReshaper,
  twoGpuParameterSplitter,
  fullRingAllreduceCollectiveSimulator,
  oneF1bPipelineParallelExecutionScheduler,
  zero1OptimizerStateMemoryEstimator,
  fp16ModelMemoryFootprintCalculator,
  ringScatterReduceArrayAccumulator,
  zero2GradientPartitioningEngine,
  zero3ParameterShardingDynamicAllgather,
  ringAllgatherVectorReconstructor,
  ncclTreeVsRingAllreduceSimulator,
  ringAllreduceDataVolumeEstimator,
  ringNeighborRankCalculator,
  rowParallelLinearAllreducer,
  cudaIpcSharedMemoryPointerMapper,
  nvlinkSymmetricMemoryPeerToPeerEngine,
  kvCacheSequenceMemoryEstimator,
  draftModelLookaheadTokenSampler,
  iterationLevelContinuousBatchScheduler,
  rejectionSamplingAcceptanceThreshold,
  fullSpeculativeDecodingServingEngine,
  hashBasedPrefixCacheTrieAllocator,
  pagedAttentionBlockTableAllocator,
  sequenceLengthPaddingWasteCalculator,
  speculativeDecodingResidualDistributionRecoverer,
  logicalToPhysicalBlockAddressTranslator,
  chunkedPrefillTokenBudgetScheduler,
  referenceCountingCowBeamSearchBrancher,
  pytorchCustomCudaOpWrapperRegister,
  vllmPagedAttentionKernelExecutor,
  flashDecodingSplitKKvCacheGather,
  targetModelParallelVerificationPass,
] as const satisfies readonly AlgorithmDefinition[];

const buildAlgorithmRegistry = (
  algorithms: readonly AlgorithmDefinition[],
): Readonly<Record<string, AlgorithmDefinition>> => {
  const registry: Record<string, AlgorithmDefinition> = {};

  for (const algorithm of algorithms) {
    if (Object.hasOwn(registry, algorithm.id)) {
      throw new Error(`Duplicate canonical algorithm id: ${algorithm.id}`);
    }
    registry[algorithm.id] = algorithm;
  }

  return Object.freeze(registry);
};

export const ALGORITHM_REGISTRY = buildAlgorithmRegistry(ALGORITHMS);

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return [...ALGORITHMS];
};
