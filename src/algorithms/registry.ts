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
import { lstmConstantErrorCarousel } from "./ml_infra/lstmConstantErrorCarousel";
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
import { recurrentUnrollingBptt } from "./ml_infra/recurrentUnrollingBptt";
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

export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition> = {
  "prefix-sum": prefixSum as AlgorithmDefinition,
  "two-sum": twoSum as AlgorithmDefinition,
  "kadane-max-subarray": kadaneMaxSubarray as AlgorithmDefinition,
  "bubble-sort": bubbleSort as AlgorithmDefinition,
  "two-sum-sorted": twoSumSorted as AlgorithmDefinition,
  "two-pointers": twoPointers as AlgorithmDefinition,
  "quick-sort": quickSort as AlgorithmDefinition,
  "sliding-window-min": slidingWindowMin as AlgorithmDefinition,
  "valid-parentheses": validParentheses as AlgorithmDefinition,
  "nearest-smaller-element": nearestSmallerElement as AlgorithmDefinition,
  "binary-search-matrix": binarySearchMatrix as AlgorithmDefinition,
  "reverse-linked-list": reverseLinkedList as AlgorithmDefinition,
  "binary-tree-lca": binaryTreeLca as AlgorithmDefinition,
  "tree-diameter": treeDiameter as AlgorithmDefinition,
  "trie-prefix-tree": triePrefixTree as AlgorithmDefinition,
  "z-algorithm": zAlgorithm as AlgorithmDefinition,
  "kmp-string-match": kmpStringMatch as AlgorithmDefinition,
  "kth-largest-element": kthLargestElement as AlgorithmDefinition,
  "n-queens": nQueens as AlgorithmDefinition,
  "bfs-graph": bfsGraph as AlgorithmDefinition,
  "number-of-islands": numberOfIslands as AlgorithmDefinition,
  "dijkstra-shortest-path": dijkstraShortestPath as AlgorithmDefinition,
  "bellman-ford": bellmanFord as AlgorithmDefinition,
  "floyd-warshall": floydWarshall as AlgorithmDefinition,
  "kruskal-mst": kruskalMst as AlgorithmDefinition,
  "prim-mst": primMst as AlgorithmDefinition,
  "topological-sort": topologicalSort as AlgorithmDefinition,
  "kosaraju-scc": kosarajuScc as AlgorithmDefinition,
  "ford-fulkerson": fordFulkerson as AlgorithmDefinition,
  "minimum-path-cover": minimumPathCover as AlgorithmDefinition,
  "coin-change-dp": coinChangeDp as AlgorithmDefinition,
  "longest-increasing-subsequence": longestIncreasingSubsequence as AlgorithmDefinition,
  "knapsack-01": knapsack01 as AlgorithmDefinition,
  "edit-distance": editDistance as AlgorithmDefinition,
  "grid-paths-dp": gridPathsDp as AlgorithmDefinition,
  "counting-tilings": countingTilings as AlgorithmDefinition,
  "tsp-bitmask-dp": tspBitmaskDp as AlgorithmDefinition,
  "merge-intervals": mergeIntervals as AlgorithmDefinition,
  "huffman-coding": huffmanCoding as AlgorithmDefinition,
  "interval-scheduling": intervalScheduling as AlgorithmDefinition,
  "tasks-and-deadlines": tasksAndDeadlines as AlgorithmDefinition,
  "counting-bits": countingBits as AlgorithmDefinition,
  "sieve-primes": sievePrimes as AlgorithmDefinition,
  "euclid-gcd": euclidGcd as AlgorithmDefinition,
  "modular-exponentiation-inverse": modularExponentiationInverse as AlgorithmDefinition,
  "extended-euclidean-algorithm": extendedEuclideanAlgorithm as AlgorithmDefinition,
  "chinese-remainder-theorem": chineseRemainderTheorem as AlgorithmDefinition,
  "euler-totient-function": eulerTotientFunction as AlgorithmDefinition,
  "binomial-coefficients-pascal": binomialCoefficientsPascal as AlgorithmDefinition,
  "catalan-numbers": catalanNumbers as AlgorithmDefinition,
  "nim-game": nimGame as AlgorithmDefinition,
  "fenwick-tree": fenwickTree as AlgorithmDefinition,
  "segment-tree": segmentTree as AlgorithmDefinition,
  "segment-tree-lazy": segmentTreeLazy as AlgorithmDefinition,
  "sparse-table-rmq": sparseTableRmq as AlgorithmDefinition,
  "sqrt-decomposition": sqrtDecomposition as AlgorithmDefinition,
  "mo-algorithm": moAlgorithm as AlgorithmDefinition,
  "dynamic-segment-tree": dynamicSegmentTree as AlgorithmDefinition,
  "persistent-segment-tree": persistentSegmentTree as AlgorithmDefinition,
  "merge-sort": mergeSort as AlgorithmDefinition,
  "binary-search-1d": binarySearch1d as AlgorithmDefinition,
  "meet-in-the-middle": meetInTheMiddle as AlgorithmDefinition,
  "convex-hull": convexHull as AlgorithmDefinition,
  "polygon-area": polygonArea as AlgorithmDefinition,
  "inclusion-exclusion-principle": inclusionExclusionPrinciple as AlgorithmDefinition,
  "matrix-exponentiation": matrixExponentiation as AlgorithmDefinition,
  "markov-chains": markovChains as AlgorithmDefinition,
  "sprague-grundy-theorem": spragueGrundyTheorem as AlgorithmDefinition,
  "string-hashing": stringHashing as AlgorithmDefinition,
  "line-segment-intersection": lineSegmentIntersection as AlgorithmDefinition,
  "sweep-line-intersections": sweepLineIntersections as AlgorithmDefinition,
  "closest-pair-of-points": closestPairOfPoints as AlgorithmDefinition,
  "hierholzer-eulerian-path": hierholzerEulerianPath as AlgorithmDefinition,
  "de-bruijn-sequence": deBruijnSequence as AlgorithmDefinition,
  "two-sat-solver": twoSatSolver as AlgorithmDefinition,
  "successor-paths": successorPaths as AlgorithmDefinition,
  "dag-dp-longest-path": dagDpLongestPath as AlgorithmDefinition,
  "dfs-graph": dfsGraph as AlgorithmDefinition,
  "bipartite-graph-check": bipartiteGraphCheck as AlgorithmDefinition,
  "edmonds-karp-max-flow": edmondsKarpMaxFlow as AlgorithmDefinition,
  "euler-tour-technique": eulerTourTechnique as AlgorithmDefinition,
  "dsu-on-tree": dsuOnTree as AlgorithmDefinition,
  "binary-lifting-lca": binaryLiftingLca as AlgorithmDefinition,
  "disjoint-set-union": disjointSetUnion as AlgorithmDefinition,
  "generating-permutations": generatingPermutations as AlgorithmDefinition,
  "knights-tour-warnsdorff": knightsTourWarnsdorff as AlgorithmDefinition,
  "hamiltonian-path-dp": hamiltonianPathDp as AlgorithmDefinition,
  "generating-subsets": generatingSubsets as AlgorithmDefinition,
  // ML Infra Algorithms
  "tensor-stride-offset": tensorStrideOffset as AlgorithmDefinition,
  "tensor-contiguity-reshape": tensorContiguityReshape as AlgorithmDefinition,
  "sram-gemm-tiling": sramGemmTiling as AlgorithmDefinition,
  "roofline-intensity-classifier": rooflineIntensityClassifier as AlgorithmDefinition,
  "autograd-vjp-dag": autogradVjpDag as AlgorithmDefinition,
  "activation-checkpointing": activationCheckpointing as AlgorithmDefinition,
  "fused-softmax-lse": fusedSoftmaxLse as AlgorithmDefinition,
  "affine-quantization-sq8": affineQuantizationSq8 as AlgorithmDefinition,
  "smoothquant-scaling": smoothquantScaling as AlgorithmDefinition,
  "lsh-vector-hashing": lshVectorHashing as AlgorithmDefinition,
  "ivf-pq-adc-search": ivfPqAdcSearch as AlgorithmDefinition,
  "hnsw-vector-search": hnswVectorSearch as AlgorithmDefinition,
  "bpe-tokenizer": bpeTokenizer as AlgorithmDefinition,
  "viterbi-subword-segmenter": viterbiSubwordSegmenter as AlgorithmDefinition,
  "xgboost-gradient-split": xgboostGradientSplit as AlgorithmDefinition,
  "im2col-conv-tiling": im2colConvTiling as AlgorithmDefinition,
  "lstm-constant-error-carousel": lstmConstantErrorCarousel as AlgorithmDefinition,
  "scaled-dot-attention-mask": scaledDotAttentionMask as AlgorithmDefinition,
  "rope-rotary-position": ropeRotaryPosition as AlgorithmDefinition,
  "grouped-query-attention": groupedQueryAttention as AlgorithmDefinition,
  "flash-attention-tiling": flashAttentionTiling as AlgorithmDefinition,
  "triton-kernel-fusion": tritonKernelFusion as AlgorithmDefinition,
  "ring-allreduce-partition": ringAllreducePartition as AlgorithmDefinition,
  "megatron-tp-sp-split": megatronTpSpSplit as AlgorithmDefinition,
  "deepspeed-zero-sharding": deepspeedZeroSharding as AlgorithmDefinition,
  "paged-attention-block-table": pagedAttentionBlockTable as AlgorithmDefinition,
  "continuous-batching-scheduler": continuousBatchingScheduler as AlgorithmDefinition,
  "speculative-decoding-verifier": speculativeDecodingVerifier as AlgorithmDefinition,
  "2d-array-matrix-traversal": arrayMatrixTraversal as AlgorithmDefinition,
  "array-matrix-traversal": arrayMatrixTraversal as AlgorithmDefinition,
  "strided-index-arithmetic": stridedIndexArithmetic as AlgorithmDefinition,
  "matrix-multiplication-naive": matrixMultiplicationNaive as AlgorithmDefinition,
  "topological-sort-dag": topologicalSortDag as AlgorithmDefinition,
  "floating-point-overflow": floatingPointOverflow as AlgorithmDefinition,
  "distance-metrics-knn": distanceMetricsKnn as AlgorithmDefinition,
  "trie-prefix-tree-search": triePrefixTreeSearch as AlgorithmDefinition,
  "decision-tree-gini-split": decisionTreeGiniSplit as AlgorithmDefinition,
  "conv2d-sliding-window": conv2dSlidingWindow as AlgorithmDefinition,
  "recurrent-unrolling-bptt": recurrentUnrollingBptt as AlgorithmDefinition,

  // Extended 190 ML Infra Curriculum Entries
  "tensor-contiguity-verifier": tensorContiguityVerifier as AlgorithmDefinition,
  "strided-1d-dot-product": strided1dDotProduct as AlgorithmDefinition,
  "anti-diagonal-extraction": antiDiagonalExtraction as AlgorithmDefinition,
  "transpose-square-matrix": transposeSquareMatrix as AlgorithmDefinition,
  "flatten-2d-grid": flatten2dGrid as AlgorithmDefinition,
  "strided-max-pooling": stridedMaxPooling as AlgorithmDefinition,
  "as-strided-tensor-view-engine": asStridedTensorViewEngine as AlgorithmDefinition,
  "virtual-matrix-addition-zero-stride": virtualMatrixAdditionZeroStride as AlgorithmDefinition,
  "matrix-block-sum-flat": matrixBlockSumFlat as AlgorithmDefinition,
  "rotate-image-flat-buffer": rotateImageFlatBuffer as AlgorithmDefinition,
  "find-first-occurrence-1d": findFirstOccurrence1d as AlgorithmDefinition,
  "valid-neighbor-grid-bounds": validNeighborGridBounds as AlgorithmDefinition,
  "zero-copy-im2col-stride-unroller": zeroCopyIm2colStrideUnroller as AlgorithmDefinition,
  "aligned-simt-block-tiling": alignedSimtBlockTiling as AlgorithmDefinition,
  "flatten-strided-nd-view": flattenStridedNdView as AlgorithmDefinition,
  "conv1d-shared-memory-scratchpad": conv1dSharedMemoryScratchpad as AlgorithmDefinition,
  "diagonal-cache-thrashing": diagonalCacheThrashing as AlgorithmDefinition,
  "submatrix-sum-2d-query": submatrixSum2dQuery as AlgorithmDefinition,
  "vector-dot-product-mac": vectorDotProductMac as AlgorithmDefinition,
  "sparse-matmul-csr": sparseMatmulCsr as AlgorithmDefinition,
  "hardware-roofline-model-calculator": hardwareRooflineModelCalculator as AlgorithmDefinition,
  "dynamic-2d-block-prefix-sum": dynamic2dBlockPrefixSum as AlgorithmDefinition,
  "triton-tensor-core-mma-swizzle": tritonTensorCoreMmaSwizzle as AlgorithmDefinition,
  "transpose-matrix-square": transposeMatrixSquare as AlgorithmDefinition,
  "l1-block-tiled-matmul": l1BlockTiledMatmul as AlgorithmDefinition,
  "fused-ffn-gemm-online-softmax": fusedFfnGemmOnlineSoftmax as AlgorithmDefinition,
  "flatten-2d-array": flatten2dArray as AlgorithmDefinition,
  "cuda-triton-sram-tiled-gemm": cudaTritonSramTiledGemm as AlgorithmDefinition,
  "async-double-buffering-pipeline": asyncDoubleBufferingPipeline as AlgorithmDefinition,
  "reshape-matrix-566": reshapeMatrix566 as AlgorithmDefinition,
  "naive-3-loop-matmul": naive3LoopMatmul as AlgorithmDefinition,
  "matrix-vector-multiplication": matrixVectorMultiplication as AlgorithmDefinition,
  "eval-reverse-polish-notation": evalReversePolishNotation as AlgorithmDefinition,
  "detect-terminal-nodes": detectTerminalNodes as AlgorithmDefinition,
  "circular-dependency-detection": circularDependencyDetection as AlgorithmDefinition,
  "recipe-indegree-kahn-bfs": recipeIndegreeKahnBfs as AlgorithmDefinition,
  "parallel-course-critical-path": parallelCourseCriticalPath as AlgorithmDefinition,
  "micrograd-reverse-gradients": microgradReverseGradients as AlgorithmDefinition,
  "deep-copy-linked-list-random": deepCopyLinkedListRandom as AlgorithmDefinition,
  "optimal-subgraph-activation-checkpointing":
    optimalSubgraphActivationCheckpointing as AlgorithmDefinition,
  "ast-expression-eval-variables": astExpressionEvalVariables as AlgorithmDefinition,
  "prefix-to-postfix-conversion": prefixToPostfixConversion as AlgorithmDefinition,
  "compute-scalar-chain-rule": computeScalarChainRule as AlgorithmDefinition,
  "ast-constant-folding": astConstantFolding as AlgorithmDefinition,
  "tensor-vjp-engine-grad-of-grad": tensorVjpEngineGradOfGrad as AlgorithmDefinition,
  "async-pipelined-vjp-evaluation": asyncPipelinedVjpEvaluation as AlgorithmDefinition,
  "find-zero-indegree-nodes": findZeroIndegreeNodes as AlgorithmDefinition,
  "micrograd-forward-pass": microgradForwardPass as AlgorithmDefinition,
  "basic-symmetric-int8-scale": basicSymmetricInt8Scale as AlgorithmDefinition,
  "scalar-int8-quantization": scalarInt8Quantization as AlgorithmDefinition,
  "fake-quantized-w8a8-matmul": fakeQuantizedW8a8Matmul as AlgorithmDefinition,
  "asymmetric-affine-quantization": asymmetricAffineQuantization as AlgorithmDefinition,
  "stable-softmax-logsumexp": stableSoftmaxLogsumexp as AlgorithmDefinition,
  "per-channel-symmetric-quantizer": perChannelSymmetricQuantizer as AlgorithmDefinition,
  "fp8-e4m3-e5m2-bitpacker": fp8E4m3E5m2Bitpacker as AlgorithmDefinition,
  "two-element-max-subtraction-shift": twoElementMaxSubtractionShift as AlgorithmDefinition,
  "fp16-overflow-rescaling-engine": fp16OverflowRescalingEngine as AlgorithmDefinition,
  "min-max-range-clipping": minMaxRangeClipping as AlgorithmDefinition,
  "smoothquant-outlier-migration": smoothquantOutlierMigration as AlgorithmDefinition,
  "ieee754-bitwise-dissector": ieee754BitwiseDissector as AlgorithmDefinition,
  "zero-point-alignment-shift": zeroPointAlignmentShift as AlgorithmDefinition,
  "bitwise-sign-extraction": bitwiseSignExtraction as AlgorithmDefinition,
  "one-pass-online-softmax-sram-kernel": onePassOnlineSoftmaxSramKernel as AlgorithmDefinition,
  hnswMultiLayerProbabilisticGraph: hnswMultiLayerProbabilisticGraph as AlgorithmDefinition,
  linearScanKnnTopk: linearScanKnnTopk as AlgorithmDefinition,
  binarySearchBucketIndex: binarySearchBucketIndex as AlgorithmDefinition,
  kmeansCentroidClustering: kmeansCentroidClustering as AlgorithmDefinition,
  hnswHeuristicSpatialPruning: hnswHeuristicSpatialPruning as AlgorithmDefinition,
  ivfInvertedIndexPostingLists: ivfInvertedIndexPostingLists as AlgorithmDefinition,
  simdSwizzledAdcDistanceLookup: simdSwizzledAdcDistanceLookup as AlgorithmDefinition,
  gaussianL2LocalitySensitiveHash: gaussianL2LocalitySensitiveHash as AlgorithmDefinition,
  l2DistancePairwise: l2DistancePairwise as AlgorithmDefinition,
  lshMultiTableBucketGrouping: lshMultiTableBucketGrouping as AlgorithmDefinition,
  randomHyperplaneSignHash: randomHyperplaneSignHash as AlgorithmDefinition,
  hnswGreedyBeamSearchEngine: hnswGreedyBeamSearchEngine as AlgorithmDefinition,
  ivfPqAsymmetricDistanceComputation: ivfPqAsymmetricDistanceComputation as AlgorithmDefinition,
  subvectorDecompositionCodebook: subvectorDecompositionCodebook as AlgorithmDefinition,
  cosineSimilarityNormalized: cosineSimilarityNormalized as AlgorithmDefinition,
  singleSkipListLayerTraversal: singleSkipListLayerTraversal as AlgorithmDefinition,
  byteLevelBpeTiktokenTokenizer: byteLevelBpeTiktokenTokenizer as AlgorithmDefinition,
  characterFrequencyNgramCounter: characterFrequencyNgramCounter as AlgorithmDefinition,
  viterbiLatticeSubwordSegmenter: viterbiLatticeSubwordSegmenter as AlgorithmDefinition,
  iterativeBpeVocabularyTrainer: iterativeBpeVocabularyTrainer as AlgorithmDefinition,
  sentencepieceByteFallbackEncoder: sentencepieceByteFallbackEncoder as AlgorithmDefinition,
  unigramEmVocabularyPruner: unigramEmVocabularyPruner as AlgorithmDefinition,
  basicTrieInsertSearch: basicTrieInsertSearch as AlgorithmDefinition,
  adjacentPairFrequencyCounter: adjacentPairFrequencyCounter as AlgorithmDefinition,
  wordpiecePmiScoredTokenizer: wordpiecePmiScoredTokenizer as AlgorithmDefinition,
  unigramCandidateLossRanks: unigramCandidateLossRanks as AlgorithmDefinition,
  singlePassBpeMerger: singlePassBpeMerger as AlgorithmDefinition,
  trieLongestPrefixMatcher: trieLongestPrefixMatcher as AlgorithmDefinition,
  fastSubwordLatticeViterbiBeam: fastSubwordLatticeViterbiBeam as AlgorithmDefinition,
  parallelLockFreeBpeEncoder: parallelLockFreeBpeEncoder as AlgorithmDefinition,
  ahoCorasickMultiTokenMatcher: ahoCorasickMultiTokenMatcher as AlgorithmDefinition,
  utf8ByteSequenceValidator: utf8ByteSequenceValidator as AlgorithmDefinition,
  "variance-preservation-proof-sim": variancePreservationProofSim as AlgorithmDefinition,
  "single-head-attention-map": singleHeadAttentionMap as AlgorithmDefinition,
  "rope-2d-complex-plane-rotation": rope2dComplexPlaneRotation as AlgorithmDefinition,
  "grouped-query-attention-gqa-engine": groupedQueryAttentionGqaEngine as AlgorithmDefinition,
  "relative-position-inner-product-preservation":
    relativePositionInnerProductPreservation as AlgorithmDefinition,
  "flash-decoding-split-k-sequence-parallel":
    flashDecodingSplitKSequenceParallel as AlgorithmDefinition,
  "multi-head-attention-split-concat": multiHeadAttentionSplitConcat as AlgorithmDefinition,
  "causal-lower-triangular-mask": causalLowerTriangularMask as AlgorithmDefinition,
  "softmax-row-normalize": softmaxRowNormalize as AlgorithmDefinition,
  "sliding-window-prefix-attention-engine":
    slidingWindowPrefixAttentionEngine as AlgorithmDefinition,
  "vector-inner-product-scaling": vectorInnerProductScaling as AlgorithmDefinition,
  "rotary-embedding-attention-cuda-kernel":
    rotaryEmbeddingAttentionCudaKernel as AlgorithmDefinition,
  "multi-query-attention-broadcast": multiQueryAttentionBroadcast as AlgorithmDefinition,
  "kv-cache-step-append": kvCacheStepAppend as AlgorithmDefinition,
  "rope-frequency-scaling-yarn": ropeFrequencyScalingYarn as AlgorithmDefinition,
  "paged-kv-cache-block-mapping": pagedKvCacheBlockMapping as AlgorithmDefinition,
  "transposed-conv2d-deconv-index-mapper": transposedConv2dDeconvIndexMapper as AlgorithmDefinition,
  "conv1d-sliding-window-direct": conv1dSlidingWindowDirect as AlgorithmDefinition,
  "col2im-grad-accumulator": col2imGradAccumulator as AlgorithmDefinition,
  "multi-channel-conv2d-accumulation": multiChannelConv2dAccumulation as AlgorithmDefinition,
  "winograd-f23-transform-matrices": winogradF23TransformMatrices as AlgorithmDefinition,
  "winograd-minimal-filtering-execution": winogradMinimalFilteringExecution as AlgorithmDefinition,
  "conv2d-sliding-window-direct": conv2dSlidingWindowDirect as AlgorithmDefinition,
  "lowered-conv2d-gemm-execution-engine": loweredConv2dGemmExecutionEngine as AlgorithmDefinition,
  "conv2d-padding-stride-output-shape": conv2dPaddingStrideOutputShape as AlgorithmDefinition,
  "fused-depthwise-separable-conv2d-engine":
    fusedDepthwiseSeparableConv2dEngine as AlgorithmDefinition,
  "cudnn-implicit-gemm-on-the-fly-kernel": cudnnImplicitGemmOnTheFlyKernel as AlgorithmDefinition,
  "receptive-field-growth-calculator": receptiveFieldGrowthCalculator as AlgorithmDefinition,
  "conv2d-to-gemm-receptive-field-unroll": conv2dToGemmReceptiveFieldUnroll as AlgorithmDefinition,
  "as-strided-zero-copy-im2col-view": asStridedZeroCopyIm2colView as AlgorithmDefinition,
  "fft-frequency-domain-convolution-2d": fftFrequencyDomainConvolution2d as AlgorithmDefinition,
  "im2col-4d-to-2d-unroller": im2col4dTo2dUnroller as AlgorithmDefinition,
  "single-feature-threshold-split": singleFeatureThresholdSplit as AlgorithmDefinition,
  "gini-impurity-binary-split": giniImpurityBinarySplit as AlgorithmDefinition,
  "greedy-decision-tree-builder": greedyDecisionTreeBuilder as AlgorithmDefinition,
  "multi-tree-additive-ensemble-predictor":
    multiTreeAdditiveEnsemblePredictor as AlgorithmDefinition,
  "exact-greedy-split-search": exactGreedySplitSearch as AlgorithmDefinition,
  "missing-value-default-direction-splitter":
    missingValueDefaultDirectionSplitter as AlgorithmDefinition,
  "xgboost-histogram-split-search": xgboostHistogramSplitSearch as AlgorithmDefinition,
  "variance-reduction-split": varianceReductionSplit as AlgorithmDefinition,
  "tree-node-prediction-traverser": treeNodePredictionTraverser as AlgorithmDefinition,
  "weighted-quantile-sketch-histogram": weightedQuantileSketchHistogram as AlgorithmDefinition,
  "regularized-optimal-leaf-weight": regularizedOptimalLeafWeight as AlgorithmDefinition,
  "shannon-entropy-calculator": shannonEntropyCalculator as AlgorithmDefinition,
  "gpu-hist-quantized-histogram-kernel": gpuHistQuantizedHistogramKernel as AlgorithmDefinition,
  "xgboost-split-gain-score-calculator": xgboostSplitGainScoreCalculator as AlgorithmDefinition,
  "logloss-gradient-hessian-calculator": loglossGradientHessianCalculator as AlgorithmDefinition,
  "tile-index-grid-mapper": tileIndexGridMapper as AlgorithmDefinition,
  "online-max-logsumexp-tracker": onlineMaxLogsumexpTracker as AlgorithmDefinition,
  "autotune-config-grid-search-engine": autotuneConfigGridSearchEngine as AlgorithmDefinition,
  "triton-fused-add-softmax-dropout-kernel":
    tritonFusedAddSoftmaxDropoutKernel as AlgorithmDefinition,
  "flash-attention-2-sequence-parallel-forward":
    flashAttention2SequenceParallelForward as AlgorithmDefinition,
  "triton-program-id-1d-to-2d-map": tritonProgramId1dTo2dMap as AlgorithmDefinition,
  "triton-mlir-to-ptx-compiler-pipeline-simulator":
    tritonMlirToPtxCompilerPipelineSimulator as AlgorithmDefinition,
  "masked-memory-load-store-guard": maskedMemoryLoadStoreGuard as AlgorithmDefinition,
  "flash-attention-1-forward-tiling": flashAttention1ForwardTiling as AlgorithmDefinition,
  "triton-sram-swizzled-gemm-kernel": tritonSramSwizzledGemmKernel as AlgorithmDefinition,
  "flash-attention-3-tma-warp-specialized-kernel":
    flashAttention3TmaWarpSpecializedKernel as AlgorithmDefinition,
  "hbm-vs-sram-bandwidth-calculator": hbmVsSramBandwidthCalculator as AlgorithmDefinition,
  "triton-l2-cache-swizzled-gemm-scheduler":
    tritonL2CacheSwizzledGemmScheduler as AlgorithmDefinition,
  "warp-shuffle-butterfly-reduction": warpShuffleButterflyReduction as AlgorithmDefinition,
  "flash-attention-backward-recomputation-engine":
    flashAttentionBackwardRecomputationEngine as AlgorithmDefinition,
  "bank-conflict-swizzle-calculator": bankConflictSwizzleCalculator as AlgorithmDefinition,
  "column-parallel-linear-reshaper": columnParallelLinearReshaper as AlgorithmDefinition,
  "two-gpu-parameter-splitter": twoGpuParameterSplitter as AlgorithmDefinition,
  "full-ring-allreduce-collective-simulator":
    fullRingAllreduceCollectiveSimulator as AlgorithmDefinition,
  "one-f1b-pipeline-parallel-execution-scheduler":
    oneF1bPipelineParallelExecutionScheduler as AlgorithmDefinition,
  "zero1-optimizer-state-memory-estimator":
    zero1OptimizerStateMemoryEstimator as AlgorithmDefinition,
  "fp16-model-memory-footprint-calculator":
    fp16ModelMemoryFootprintCalculator as AlgorithmDefinition,
  "ring-scatter-reduce-array-accumulator": ringScatterReduceArrayAccumulator as AlgorithmDefinition,
  "zero2-gradient-partitioning-engine": zero2GradientPartitioningEngine as AlgorithmDefinition,
  "zero3-parameter-sharding-dynamic-allgather":
    zero3ParameterShardingDynamicAllgather as AlgorithmDefinition,
  "ring-allgather-vector-reconstructor": ringAllgatherVectorReconstructor as AlgorithmDefinition,
  "nccl-tree-vs-ring-allreduce-simulator": ncclTreeVsRingAllreduceSimulator as AlgorithmDefinition,
  "ring-allreduce-data-volume-estimator": ringAllreduceDataVolumeEstimator as AlgorithmDefinition,
  "ring-neighbor-rank-calculator": ringNeighborRankCalculator as AlgorithmDefinition,
  "row-parallel-linear-allreducer": rowParallelLinearAllreducer as AlgorithmDefinition,
  "cuda-ipc-shared-memory-pointer-mapper": cudaIpcSharedMemoryPointerMapper as AlgorithmDefinition,
  "nvlink-symmetric-memory-peer-to-peer-engine":
    nvlinkSymmetricMemoryPeerToPeerEngine as AlgorithmDefinition,
  "kv-cache-sequence-memory-estimator": kvCacheSequenceMemoryEstimator as AlgorithmDefinition,
  "draft-model-lookahead-token-sampler": draftModelLookaheadTokenSampler as AlgorithmDefinition,
  "iteration-level-continuous-batch-scheduler":
    iterationLevelContinuousBatchScheduler as AlgorithmDefinition,
  "rejection-sampling-acceptance-threshold":
    rejectionSamplingAcceptanceThreshold as AlgorithmDefinition,
  "full-speculative-decoding-serving-engine":
    fullSpeculativeDecodingServingEngine as AlgorithmDefinition,
  "hash-based-prefix-cache-trie-allocator":
    hashBasedPrefixCacheTrieAllocator as AlgorithmDefinition,
  "paged-attention-block-table-allocator": pagedAttentionBlockTableAllocator as AlgorithmDefinition,
  "sequence-length-padding-waste-calculator":
    sequenceLengthPaddingWasteCalculator as AlgorithmDefinition,
  "speculative-decoding-residual-distribution-recoverer":
    speculativeDecodingResidualDistributionRecoverer as AlgorithmDefinition,
  "logical-to-physical-block-address-translator":
    logicalToPhysicalBlockAddressTranslator as AlgorithmDefinition,
  "chunked-prefill-token-budget-scheduler":
    chunkedPrefillTokenBudgetScheduler as AlgorithmDefinition,
  "reference-counting-cow-beam-search-brancher":
    referenceCountingCowBeamSearchBrancher as AlgorithmDefinition,
  "pytorch-custom-cuda-op-wrapper-register":
    pytorchCustomCudaOpWrapperRegister as AlgorithmDefinition,
  "vllm-paged-attention-kernel-executor": vllmPagedAttentionKernelExecutor as AlgorithmDefinition,
  "flash-decoding-split-k-kv-cache-gather": flashDecodingSplitKKvCacheGather as AlgorithmDefinition,
  "target-model-parallel-verification-pass":
    targetModelParallelVerificationPass as AlgorithmDefinition,
};

export const getAlgorithm = (id: string): AlgorithmDefinition | undefined => {
  return ALGORITHM_REGISTRY[id];
};

export const getAllAlgorithms = (): AlgorithmDefinition[] => {
  return Array.from(new Set(Object.values(ALGORITHM_REGISTRY)));
};
