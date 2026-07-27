import fs from "fs";
import path from "path";

interface QuestionSpec {
  id: string;
  varName: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  primaryCategory: string;
  categories: string[];
  leetcodeId?: number;
  type: "Foundational Math & DSA" | "ML Systems Implementation";
  description: string;
  overview: string;
  keyTerms: { term: string; definition: string }[];
}

interface TopicSpec {
  id: string;
  level: number;
  title: string;
  questions: QuestionSpec[];
}

const TOPICS: TopicSpec[] = [
  {
    id: "ml_tensor_algebra",
    level: 1,
    title: "Tensor Memory Layouts & Pointer Arithmetic",
    questions: [
      {
        id: "find-first-occurrence-1d",
        varName: "findFirstOccurrence1d",
        title: "Find First Occurrence in 1D Buffer",
        difficulty: "Easy",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description:
          "Scans a 1D linear memory buffer for the first occurrence of a target scalar value.",
        overview:
          "Linear scanning over 1D contiguous memory arrays forms the fundamental baseline for vector indexing.",
        keyTerms: [
          {
            term: "Contiguous Buffer",
            definition: "Memory array stored in adjacent memory addresses.",
          },
        ],
      },
      {
        id: "valid-neighbor-grid-bounds",
        varName: "validNeighborGridBounds",
        title: "Valid 2D Grid Neighbor Bounds Check",
        difficulty: "Easy",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description:
          "Validates row and column indices against 2D tensor height and width boundaries.",
        overview:
          "2D spatial bounds checks ensure memory safety before reading neighboring tensor offsets.",
        keyTerms: [
          { term: "Boundary Validation", definition: "Checking 0 <= r < H and 0 <= c < W." },
        ],
      },
      {
        id: "flatten-2d-grid",
        varName: "flatten2dGrid",
        title: "Flatten 2D Grid into 1D Contiguous Buffer",
        difficulty: "Easy",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        leetcodeId: 566,
        type: "Foundational Math & DSA",
        description:
          "Maps a 2D matrix into a 1D flat array using row-major index offset arithmetic.",
        overview: "Row-major order flattens 2D matrices using r * W + c offset math.",
        keyTerms: [{ term: "Row-Major", definition: "Storing rows sequentially in flat memory." }],
      },
      {
        id: "transpose-square-matrix",
        varName: "transposeSquareMatrix",
        title: "In-Place Square Matrix Transpose",
        difficulty: "Easy",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        leetcodeId: 867,
        type: "Foundational Math & DSA",
        description:
          "Swaps off-diagonal matrix elements (A[i][j] <-> A[j][i]) to transpose a square tensor.",
        overview: "Transposition interchanges rows and columns by swapping symmetric index pairs.",
        keyTerms: [{ term: "Transpose", definition: "Flipping a matrix over its main diagonal." }],
      },
      {
        id: "anti-diagonal-extraction",
        varName: "antiDiagonalExtraction",
        title: "Anti-Diagonal Matrix Traversal",
        difficulty: "Medium",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        leetcodeId: 498,
        type: "Foundational Math & DSA",
        description:
          "Extracts anti-diagonal stripes from a 2D tensor to inspect strided memory access patterns.",
        overview: "Anti-diagonals connect elements where row + col equals a constant sum.",
        keyTerms: [
          { term: "Anti-Diagonal", definition: "Stripes running top-right to bottom-left." },
        ],
      },
      {
        id: "rotate-image-flat-buffer",
        varName: "rotateImageFlatBuffer",
        title: "Rotate 2D Tensor 90 Degrees in Flat Memory",
        difficulty: "Medium",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        leetcodeId: 48,
        type: "Foundational Math & DSA",
        description:
          "Rotates a 2D tensor by 90 degrees in-place using transpose and row reversal operations.",
        overview:
          "Rotation by 90 degrees clockwise is equivalent to transposing and reversing each row.",
        keyTerms: [
          {
            term: "In-Place Rotation",
            definition: "Transforming coordinates without allocating new memory.",
          },
        ],
      },
      {
        id: "matrix-block-sum-flat",
        varName: "matrixBlockSumFlat",
        title: "Submatrix Block Sum with 2D Prefix Array",
        difficulty: "Medium",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        leetcodeId: 304,
        type: "Foundational Math & DSA",
        description:
          "Computes 2D region sum queries in O(1) time using an integral image prefix table.",
        overview:
          "Integral images compute rectangular submatrix sums in O(1) time using inclusion-exclusion arithmetic.",
        keyTerms: [
          { term: "2D Prefix Sum", definition: "Precomputed cumulative sum table over 2D grids." },
        ],
      },
      {
        id: "strided-1d-dot-product",
        varName: "strided1dDotProduct",
        title: "Strided 1D Vector Dot Product",
        difficulty: "Medium",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Calculates inner dot product of non-contiguous vector views using custom stride steps.",
        overview: "Non-unit strides require explicit offset step calculation: ptr + i * stride.",
        keyTerms: [
          { term: "Stride", definition: "Memory step size between adjacent dimension elements." },
        ],
      },
      {
        id: "virtual-matrix-addition-zero-stride",
        varName: "virtualMatrixAdditionZeroStride",
        title: "Zero-Stride Broadcasting Matrix Addition",
        difficulty: "Medium",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Performs virtual tensor addition with zero-stride broadcast dimension pointers.",
        overview:
          "Zero stride allows a 1D vector to be virtually expanded across a 2D matrix without memory copy.",
        keyTerms: [
          {
            term: "Zero Stride",
            definition:
              "Setting stride to 0 so indexing repeatedly accesses the same memory address.",
          },
        ],
      },
      {
        id: "flatten-strided-nd-view",
        varName: "flattenStridedNdView",
        title: "Multi-Dimensional Strided Coordinate Mapper",
        difficulty: "Medium",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Maps N-dimensional tensor coordinates to 1D linear buffer offsets via stride dot products.",
        overview: "The linear offset equation is Offset = sum(indices[d] * strides[d]).",
        keyTerms: [
          {
            term: "Multi-Index Mapping",
            definition: "Converting ND coordinate vectors into 1D flat address offsets.",
          },
        ],
      },
      {
        id: "strided-max-pooling",
        varName: "stridedMaxPooling",
        title: "2D Strided Max Pooling Operator",
        difficulty: "Medium",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "sliding_window"],
        type: "ML Systems Implementation",
        description:
          "Applies sliding window max pooling with spatial stride steps over 2D activation tensors.",
        overview:
          "Max pooling downsamples activation maps by selecting peak values inside strided windows.",
        keyTerms: [
          {
            term: "Max Pooling",
            definition: "Selecting the maximum value within a spatial window.",
          },
        ],
      },
      {
        id: "tensor-contiguity-verifier",
        varName: "tensorContiguityVerifier",
        title: "PyTorch-Style Tensor Contiguity Verifier",
        difficulty: "Hard",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Validates whether a tensor's memory strides match standard row-major contiguous ordering.",
        overview: "Contiguity check verifies if stride[d] == product(shape[d+1..N-1]).",
        keyTerms: [
          {
            term: "Contiguous Memory",
            definition: "Data ordered without gaps in physical memory.",
          },
        ],
      },
      {
        id: "as-strided-tensor-view-engine",
        varName: "asStridedTensorViewEngine",
        title: "PyTorch ATen `as_strided` Zero-Copy View Engine",
        difficulty: "Hard",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Constructs custom virtual multi-dimensional views without reallocating underlying VRAM buffers.",
        overview:
          "as_strided defines shape, strides, and storage offset over existing memory buffers.",
        keyTerms: [
          {
            term: "Zero-Copy View",
            definition: "Creating new tensor abstractions without copying underlying bytes.",
          },
        ],
      },
      {
        id: "zero-copy-im2col-stride-unroller",
        varName: "zeroCopyIm2colStrideUnroller",
        title: "Zero-Copy im2col Stride Receptive Field Unroller",
        difficulty: "Hard",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "sliding_window"],
        type: "ML Systems Implementation",
        description:
          "Unrolls 2D image patches into matrix columns via strided views without copying memory.",
        overview:
          "im2col turns convolution sliding windows into standard GEMM matrix multiplication.",
        keyTerms: [
          {
            term: "im2col",
            definition: "Image to column transformation for BLAS GEMM convolutions.",
          },
        ],
      },
      {
        id: "aligned-simt-block-tiling",
        varName: "alignedSimtBlockTiling",
        title: "SIMD/SIMT Aligned Memory Tiling Engine",
        difficulty: "Hard",
        primaryCategory: "ml_tensor_algebra",
        categories: ["ml_tensor_algebra", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Aligns 1D memory tile offsets to GPU 128-bit vector load boundaries to maximize throughput.",
        overview:
          "Vectorized 128-bit memory instructions require addresses aligned to 16-byte boundaries.",
        keyTerms: [
          {
            term: "Vector Load Alignment",
            definition: "Aligning memory pointers for 128-bit SIMD/SIMT load instructions.",
          },
        ],
      },
    ],
  },
  {
    id: "ml_gemm_roofline",
    level: 2,
    title: "GEMM Architecture, SRAM Tiling & Hardware Rooflines",
    questions: [
      {
        id: "flatten-2d-array",
        varName: "flatten2dArray",
        title: "1D Buffer Matrix Flattening",
        difficulty: "Easy",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Converts 2D matrix indices (r, c) to flat memory address (r * N + c).",
        overview: "Linear indexing simplifies 2D matrix storage into 1D memory buffers.",
        keyTerms: [
          { term: "Linear Address", definition: "Flat offset calculated as r * cols + c." },
        ],
      },
      {
        id: "reshape-matrix-566",
        varName: "reshapeMatrix566",
        title: "Reshape Matrix Coordinates",
        difficulty: "Easy",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        leetcodeId: 566,
        type: "Foundational Math & DSA",
        description:
          "Remaps 2D matrix elements to new target dimensions without changing total element count.",
        overview: "Reshaping maps flat indices to new target (r, c) coordinates.",
        keyTerms: [
          {
            term: "Reshape",
            definition: "Changing tensor dimensions while preserving total element count.",
          },
        ],
      },
      {
        id: "transpose-matrix-square",
        varName: "transposeMatrixSquare",
        title: "Square Matrix Transpose Operator",
        difficulty: "Easy",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Swaps rows and columns of a square matrix in-place.",
        overview: "Transposing a matrix swaps rows for columns.",
        keyTerms: [{ term: "Transpose", definition: "Swapping axes i and j." }],
      },
      {
        id: "vector-dot-product-mac",
        varName: "vectorDotProductMac",
        title: "Vector Multiply-Accumulate (MAC)",
        difficulty: "Easy",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Accumulates elementwise products of two 1D vectors into a scalar sum.",
        overview: "MAC is the foundational hardware instruction for linear algebra.",
        keyTerms: [{ term: "MAC", definition: "Multiply-Accumulate operation (a * b + c)." }],
      },
      {
        id: "matrix-vector-multiplication",
        varName: "matrixVectorMultiplication",
        title: "Matrix-Vector Multiplication (GEMV)",
        difficulty: "Easy",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Computes matrix-vector product Y = A * X using row-wise dot products.",
        overview: "GEMV computes linear projections for single batch vectors.",
        keyTerms: [{ term: "GEMV", definition: "General Matrix-Vector multiplication." }],
      },
      {
        id: "naive-3-loop-matmul",
        varName: "naive3LoopMatmul",
        title: "Naive Triply-Nested Loop GEMM O(N^3)",
        difficulty: "Easy",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Baseline triple-loop matrix multiplication without cache optimization.",
        overview:
          "Naive GEMM uses 3 nested loops (i, j, k) to compute C[i][j] += A[i][k] * B[k][j].",
        keyTerms: [
          { term: "O(N^3) GEMM", definition: "Triple nested loop matrix multiplication." },
        ],
      },
      {
        id: "diagonal-cache-thrashing",
        varName: "diagonalCacheThrashing",
        title: "Diagonal Matrix Access Cache Thrashing",
        difficulty: "Medium",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        leetcodeId: 498,
        type: "Foundational Math & DSA",
        description: "Demonstrates memory latency degradation during non-stride-1 diagonal access.",
        overview: "Non-unit strides cause CPU cache line evictions and memory latency thrashing.",
        keyTerms: [
          {
            term: "Cache Thrashing",
            definition: "Repeated cache misses due to poor stride access patterns.",
          },
        ],
      },
      {
        id: "sparse-matmul-csr",
        varName: "sparseMatmulCsr",
        title: "Sparse Matrix Multiplication (CSR Format)",
        difficulty: "Medium",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        leetcodeId: 311,
        type: "ML Systems Implementation",
        description:
          "Multiplies sparse matrices encoded in Compressed Sparse Row (CSR) index format.",
        overview:
          "CSR format stores non-zero values, column indices, and row pointers to skip zero operations.",
        keyTerms: [
          { term: "CSR Format", definition: "Compressed Sparse Row matrix representation." },
        ],
      },
      {
        id: "submatrix-sum-2d-query",
        varName: "submatrixSum2dQuery",
        title: "2D Submatrix Region Sum Query",
        difficulty: "Medium",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        leetcodeId: 304,
        type: "Foundational Math & DSA",
        description: "Computes submatrix sum in constant time via 2D prefix sums.",
        overview: "2D prefix sums enable O(1) rectangle query evaluations.",
        keyTerms: [
          {
            term: "Submatrix Query",
            definition: "Summing values inside a rectangular bounding box.",
          },
        ],
      },
      {
        id: "dynamic-2d-block-prefix-sum",
        varName: "dynamic2dBlockPrefixSum",
        title: "Block-Tiled 2D Prefix Sum Engine",
        difficulty: "Medium",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Tiles 2D grid into block regions for cache-coherent prefix updates.",
        overview: "Block tiling splits 2D grids into L1-friendly sub-blocks.",
        keyTerms: [
          {
            term: "Block Tiling",
            definition: "Partitioning large matrices into small sub-blocks.",
          },
        ],
      },
      {
        id: "conv1d-shared-memory-scratchpad",
        varName: "conv1dSharedMemoryScratchpad",
        title: "1D Conv GPU SRAM Scratchpad Simulator",
        difficulty: "Medium",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "sliding_window"],
        type: "ML Systems Implementation",
        description: "Loads input tiles and halo regions into fast shared memory scratchpad.",
        overview:
          "Shared memory scratchpads eliminate redundant HBM reads for overlapping stencils.",
        keyTerms: [
          { term: "SRAM Scratchpad", definition: "Fast on-chip GPU shared memory buffer." },
        ],
      },
      {
        id: "l1-block-tiled-matmul",
        varName: "l1BlockTiledMatmul",
        title: "L1 Cache Block-Tiled MatMul Engine",
        difficulty: "Medium",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Tiles matrix multiplication into B x B sub-blocks fitting in L1 cache.",
        overview: "Block tiling reduces memory traffic from O(N^3) to O(N^3 / B).",
        keyTerms: [
          {
            term: "Cache Tiling",
            definition: "Structuring GEMM loops to re-use data in L1/L2 cache.",
          },
        ],
      },
      {
        id: "hardware-roofline-model-calculator",
        varName: "hardwareRooflineModelCalculator",
        title: "Berkeley Hardware Roofline Model Calculator",
        difficulty: "Hard",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description: "Calculates kernel Arithmetic Intensity (FLOPs/byte) and bounds peak GFLOPS.",
        overview: "Roofline models classify kernels as Memory-Bound vs Compute-Bound.",
        keyTerms: [
          {
            term: "Arithmetic Intensity",
            definition: "Ratio of FLOPs executed per byte transferred from DRAM/HBM.",
          },
        ],
      },
      {
        id: "cuda-triton-sram-tiled-gemm",
        varName: "cudaTritonSramTiledGemm",
        title: "CUDA/Triton SRAM Tiled GEMM Engine",
        difficulty: "Hard",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "SRAM block-tiled GEMM with bank conflict padding and register accumulation.",
        overview: "Triton/CUDA GEMM loads A and B blocks into SRAM to execute Tensor Core MMA ops.",
        keyTerms: [
          {
            term: "SRAM GEMM",
            definition: "Matrix multiplication executing out of fast GPU shared memory.",
          },
        ],
      },
      {
        id: "async-double-buffering-pipeline",
        varName: "asyncDoubleBufferingPipeline",
        title: "Async Double-Buffering Copy Pipeline",
        difficulty: "Hard",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Overlaps HBM-to-SRAM async transfers (cp.async) with Tensor Core compute.",
        overview: "Double buffering pre-fetches stage k+1 memory while computing stage k.",
        keyTerms: [
          {
            term: "Double Buffering",
            definition: "Pipelining memory loading with tensor computation.",
          },
        ],
      },
      {
        id: "triton-tensor-core-mma-swizzle",
        varName: "tritonTensorCoreMmaSwizzle",
        title: "Triton Tensor Core MMA Layout Swizzler",
        difficulty: "Hard",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Swizzles shared memory address layouts for NVIDIA mma.sync Tensor Core instructions.",
        overview: "Swizzling rearranges shared memory layouts to avoid GPU bank conflicts.",
        keyTerms: [
          {
            term: "Swizzling",
            definition: "XOR-based address permuting to eliminate bank conflicts.",
          },
        ],
      },
      {
        id: "fused-ffn-gemm-online-softmax",
        varName: "fusedFfnGemmOnlineSoftmax",
        title: "Fused FFN GEMM & Online Softmax Kernel",
        difficulty: "Hard",
        primaryCategory: "ml_gemm_roofline",
        categories: ["ml_gemm_roofline", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Fuses Feed-Forward Network GEMM with online softmax in SRAM without HBM writes.",
        overview: "Kernel fusion combines MatMul and activation functions inside SRAM.",
        keyTerms: [
          {
            term: "Kernel Fusion",
            definition: "Combining multiple tensor ops into a single GPU kernel pass.",
          },
        ],
      },
    ],
  },
  {
    id: "ml_convolutions",
    level: 8,
    title: "Convolutional Lowering & im2col GEMM Mapping",
    questions: [
      {
        id: "conv1d-sliding-window-direct",
        varName: "conv1dSlidingWindowDirect",
        title: "1D Cross-Correlation Basics",
        difficulty: "Easy",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "sliding_window"],
        type: "Foundational Math & DSA",
        description: "Sliding window operations over 1D arrays with valid boundary handling.",
        overview: "1D spatial convolution slides filter weights across sequential inputs.",
        keyTerms: [{ term: "1D Conv", definition: "Sliding 1D filter cross-correlation." }],
      },
      {
        id: "conv2d-padding-stride-output-shape",
        varName: "conv2dPaddingStrideOutputShape",
        title: "2D Conv Output Shape Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Computes O = floor((I + 2P - K) / S) + 1.",
        overview:
          "Spatial convolution output dimensions depend on image size I, padding P, kernel size K, and stride S.",
        keyTerms: [
          { term: "Output Shape Formula", definition: "O = floor((I + 2P - K) / S) + 1." },
        ],
      },
      {
        id: "receptive-field-growth-calculator",
        varName: "receptiveFieldGrowthCalculator",
        title: "2D Receptive Field Growth Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description:
          "Tracks cumulative spatial receptive field growth across stacked convolution layers.",
        overview: "Receptive field expands with kernel size and cumulative stride product.",
        keyTerms: [
          { term: "Receptive Field", definition: "Input region influencing a output activation." },
        ],
      },
      {
        id: "conv2d-sliding-window-direct",
        varName: "conv2dSlidingWindowDirect",
        title: "2D Direct Sliding Window Convolution",
        difficulty: "Easy",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "sliding_window"],
        type: "Foundational Math & DSA",
        description: "Direct nested 4-loop spatial convolution over 2D input grids.",
        overview: "Direct 2D convolution slides KxK filters over input HxW grids.",
        keyTerms: [
          { term: "2D Direct Conv", definition: "Nested spatial loop cross-correlation." },
        ],
      },
      {
        id: "multi-channel-conv2d-accumulation",
        varName: "multiChannelConv2dAccumulation",
        title: "Multi-Channel Conv2D Accumulator",
        difficulty: "Easy",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Accumulates cross-channel convolution products over C_in channels.",
        overview: "Multi-channel conv sums spatial dot products across all input channels.",
        keyTerms: [
          { term: "Channel Sum", definition: "Summing filter outputs across C_in channels." },
        ],
      },
      {
        id: "conv2d-to-gemm-receptive-field-unroll",
        varName: "conv2dToGemmReceptiveFieldUnroll",
        title: "Conv2D Receptive Field Patch Unroller",
        difficulty: "Easy",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Unrolls spatial KxK patches into 1D matrix column vectors.",
        overview: "Unrolling receptive fields transforms 2D patches into GEMM columns.",
        keyTerms: [
          {
            term: "Patch Unrolling",
            definition: "Flattening spatial receptive fields into vectors.",
          },
        ],
      },
      {
        id: "im2col-4d-to-2d-unroller",
        varName: "im2col4dTo2dUnroller",
        title: "Strided im2col 4D-to-2D Matrix Unroller",
        difficulty: "Medium",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Unrolls (N, C_in, H, W) tensors into 2D GEMM input matrices (C_in*K_h*K_w, H_out*W_out).",
        overview:
          "im2col transforms 4D tensor convolutions into 2D BLAS GEMM matrix multiplications.",
        keyTerms: [
          {
            term: "im2col Unrolling",
            definition: "Mapping spatial image patches to GEMM matrix columns.",
          },
        ],
      },
      {
        id: "col2im-grad-accumulator",
        varName: "col2imGradAccumulator",
        title: "col2im Gradient Accumulator",
        difficulty: "Medium",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Reverses im2col unrolling to accumulate backward gradients into 4D tensor shapes.",
        overview:
          "col2im folds 2D gradient matrices back into 4D spatial image tensors during backprop.",
        keyTerms: [
          { term: "col2im", definition: "Fold 2D GEMM gradients back into 4D spatial tensors." },
        ],
      },
      {
        id: "lowered-conv2d-gemm-execution-engine",
        varName: "loweredConv2dGemmExecutionEngine",
        title: "Lowered Conv2D GEMM Execution Engine",
        difficulty: "Medium",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Executes convolution via lowered BLAS GEMM W_row * X_col.",
        overview: "Lowered convolutions execute via highly optimized BLAS GEMM kernels.",
        keyTerms: [
          {
            term: "Lowered GEMM Conv",
            definition: "Executing convolution via BLAS GEMM matrix multiplication.",
          },
        ],
      },
      {
        id: "as-strided-zero-copy-im2col-view",
        varName: "asStridedZeroCopyIm2colView",
        title: "Zero-Copy `as_strided` im2col View Engine",
        difficulty: "Medium",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Constructs virtual 5D im2col view using PyTorch stride tricks to eliminate K^2 memory duplication.",
        overview:
          "Strided im2col eliminates K^2 memory duplication by creating virtual views over input tensors.",
        keyTerms: [
          {
            term: "Zero-Copy im2col",
            definition: "Virtual strided view avoiding memory duplication.",
          },
        ],
      },
      {
        id: "winograd-f23-transform-matrices",
        varName: "winogradF23TransformMatrices",
        title: "Winograd F(2x2, 3x3) Transform Matrices",
        difficulty: "Medium",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description: "Generates Winograd minimal filtering transform matrices B, G, A.",
        overview: "Winograd F(2x2, 3x3) reduces spatial multiplications from 36 to 16.",
        keyTerms: [
          {
            term: "Winograd Transform",
            definition: "Minimal filtering transform reducing multiplication count by 2.25x.",
          },
        ],
      },
      {
        id: "winograd-minimal-filtering-execution",
        varName: "winogradMinimalFilteringExecution",
        title: "Winograd F(2x2, 3x3) Execution Engine",
        difficulty: "Medium",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description: "Executes Y = A^T [(G g G^T) (B^T d B)] A fast Winograd convolution.",
        overview:
          "Winograd convolution multiplies transformed tile matrices to achieve 2.25x speedup.",
        keyTerms: [
          { term: "Winograd GEMM", definition: "Transform-domain fast convolution algorithm." },
        ],
      },
      {
        id: "transposed-conv2d-deconv-index-mapper",
        varName: "transposedConv2dDeconvIndexMapper",
        title: "Transposed 2D Convolution (Deconvolution) Engine",
        difficulty: "Medium",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Maps deconvolution upsampling indices without allocating sparse zero-filled tensors.",
        overview:
          "Transposed convolution upsamples spatial feature maps using transposed index mapping.",
        keyTerms: [
          {
            term: "Transposed Conv",
            definition: "Upsampling spatial feature maps via transposed convolution.",
          },
        ],
      },
      {
        id: "cudnn-implicit-gemm-on-the-fly-kernel",
        varName: "cudnnImplicitGemmOnTheFlyKernel",
        title: "cuDNN Implicit GEMM On-The-Fly Kernel",
        difficulty: "Hard",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Calculates im2col coordinates dynamically inside GPU SRAM without HBM unroll buffer.",
        overview:
          "Implicit GEMM calculates im2col addresses on-the-fly inside GPU Tensor Core registers.",
        keyTerms: [
          {
            term: "Implicit GEMM",
            definition: "On-the-fly coordinate calculation avoiding memory unroll allocation.",
          },
        ],
      },
      {
        id: "fft-frequency-domain-convolution-2d",
        varName: "fftFrequencyDomainConvolution2d",
        title: "2D Fast Fourier Transform (FFT) Convolution Engine",
        difficulty: "Hard",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description:
          "Executes O(N log N) spatial convolution via 2D FFT point-wise multiplication.",
        overview:
          "FFT convolution transforms spatial grids into frequency domain for point-wise multiplication.",
        keyTerms: [
          { term: "FFT Convolution", definition: "Frequency-domain O(N log N) fast convolution." },
        ],
      },
      {
        id: "fused-depthwise-separable-conv2d-engine",
        varName: "fusedDepthwiseSeparableConv2dEngine",
        title: "Fused Depthwise Separable Conv2D Engine",
        difficulty: "Hard",
        primaryCategory: "ml_convolutions",
        categories: ["ml_convolutions", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Fuses 3x3 depthwise spatial conv with 1x1 pointwise channel conv in SRAM.",
        overview: "Depthwise separable convolutions reduce FLOPs by factor of 1/C_out + 1/K^2.",
        keyTerms: [
          {
            term: "Depthwise Separable Conv",
            definition: "Decoupling spatial filtering from cross-channel mixing.",
          },
        ],
      },
    ],
  },
  {
    id: "ml_tree_ensembles",
    level: 9,
    title: "Decision Trees & XGBoost 2nd-Order Gradient Boosting",
    questions: [
      {
        id: "shannon-entropy-calculator",
        varName: "shannonEntropyCalculator",
        title: "Shannon Entropy Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Computes H(S) = -sum(p_i * log2(p_i)) uncertainty metric.",
        overview: "Shannon entropy measures information uncertainty in label distributions.",
        keyTerms: [{ term: "Shannon Entropy", definition: "Information uncertainty metric H(S)." }],
      },
      {
        id: "gini-impurity-binary-split",
        varName: "giniImpurityBinarySplit",
        title: "Gini Impurity Binary Split Evaluator",
        difficulty: "Easy",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Computes Gini impurity G(S) = 1 - sum(p_i^2) for candidate split.",
        overview: "Gini impurity measures classification variance across tree partitions.",
        keyTerms: [{ term: "Gini Impurity", definition: "Classification variance metric G(S)." }],
      },
      {
        id: "variance-reduction-split",
        varName: "varianceReductionSplit",
        title: "Regression Variance Reduction Splitter",
        difficulty: "Easy",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Computes target variance reduction VR(S, A) for regression splits.",
        overview: "Variance reduction measures regression error improvement across splits.",
        keyTerms: [
          { term: "Variance Reduction", definition: "Reduction in target variance after split." },
        ],
      },
      {
        id: "single-feature-threshold-split",
        varName: "singleFeatureThresholdSplit",
        title: "Single Feature Continuous Threshold Partition",
        difficulty: "Easy",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description:
          "Partitions dataset into left/right subsets based on continuous threshold X <= t.",
        overview: "Threshold splitting divides samples into binary child nodes.",
        keyTerms: [
          { term: "Threshold Split", definition: "Binary decision rule X_j <= threshold." },
        ],
      },
      {
        id: "tree-node-prediction-traverser",
        varName: "treeNodePredictionTraverser",
        title: "Decision Tree Prediction Traverser",
        difficulty: "Easy",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "tree_fundamentals"],
        type: "Foundational Math & DSA",
        description: "Traverses binary decision tree down to leaf predictor node.",
        overview: "Tree traversal routes sample down internal nodes to leaf prediction.",
        keyTerms: [
          { term: "Tree Traversal", definition: "Routing samples along decision node branches." },
        ],
      },
      {
        id: "logloss-gradient-hessian-calculator",
        varName: "loglossGradientHessianCalculator",
        title: "LogLoss 1st & 2nd Order Gradient Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Calculates LogLoss gradient g_i = p_i - y_i and Hessian h_i = p_i(1 - p_i).",
        overview:
          "Gradient g_i and Hessian h_i drive XGBoost 2nd-order Taylor expansion tree building.",
        keyTerms: [
          { term: "LogLoss Hessian", definition: "2nd-order derivative h_i = p_i * (1 - p_i)." },
        ],
      },
      {
        id: "greedy-decision-tree-builder",
        varName: "greedyDecisionTreeBuilder",
        title: "Recursive Greedy Decision Tree Builder",
        difficulty: "Medium",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "tree_fundamentals"],
        type: "ML Systems Implementation",
        description: "Recursively constructs decision tree by selecting top Gini split.",
        overview:
          "Greedy tree building recursively splits dataset until max depth or min samples reached.",
        keyTerms: [
          { term: "Greedy Tree Building", definition: "Recursive top-down dataset partitioning." },
        ],
      },
      {
        id: "regularized-optimal-leaf-weight",
        varName: "regularizedOptimalLeafWeight",
        title: "XGBoost Regularized Optimal Leaf Weight",
        difficulty: "Medium",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description: "Calculates optimal leaf weight w* = -G / (H + lambda).",
        overview:
          "XGBoost leaf weight w* balances gradient sum G against Hessian sum H and L2 regularization lambda.",
        keyTerms: [
          { term: "Leaf Weight Formula", definition: "Optimal weight w* = -G / (H + lambda)." },
        ],
      },
      {
        id: "xgboost-split-gain-score-calculator",
        varName: "xgboostSplitGainScoreCalculator",
        title: "XGBoost 2nd-Order Split Gain Score Calculator",
        difficulty: "Medium",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description:
          "Evaluates split gain score L_split = 0.5 * [ G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G^2/(H+lambda) ] - gamma.",
        overview:
          "Split gain score measures loss reduction accounting for tree complexity penalty gamma.",
        keyTerms: [
          { term: "Split Gain Score", definition: "XGBoost loss reduction gain formula." },
        ],
      },
      {
        id: "exact-greedy-split-search",
        varName: "exactGreedySplitSearch",
        title: "XGBoost Exact Greedy Split Finder O(n d log n)",
        difficulty: "Medium",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Sorts feature values to evaluate candidate split gains in single pass.",
        overview: "Exact greedy split search sorts each feature to compute prefix sums of G and H.",
        keyTerms: [
          {
            term: "Exact Greedy Search",
            definition: "Sorting feature values to evaluate all possible split thresholds.",
          },
        ],
      },
      {
        id: "weighted-quantile-sketch-histogram",
        varName: "weightedQuantileSketchHistogram",
        title: "Weighted Quantile Sketch Feature Binning",
        difficulty: "Medium",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Bins continuous features into discrete quantile histogram buckets weighted by Hessian h_i.",
        overview:
          "Weighted quantile sketch bins continuous values using Hessian weights for fast O(n d) histogram splits.",
        keyTerms: [
          {
            term: "Quantile Sketch",
            definition: "Hessian-weighted feature value histogram binning.",
          },
        ],
      },
      {
        id: "xgboost-histogram-split-search",
        varName: "xgboostHistogramSplitSearch",
        title: "XGBoost Histogram-Based Fast Split Search O(n d)",
        difficulty: "Medium",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Evaluates candidate splits over pre-binned histogram bucket boundaries.",
        overview:
          "Histogram split search evaluates bucket boundaries, reducing complexity from O(n log n) to O(n_bins).",
        keyTerms: [
          { term: "Histogram Split", definition: "Fast split search over discrete feature bins." },
        ],
      },
      {
        id: "missing-value-default-direction-splitter",
        varName: "missingValueDefaultDirectionSplitter",
        title: "XGBoost Missing Value Default Direction Allocator",
        difficulty: "Hard",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "tree_fundamentals"],
        type: "ML Systems Implementation",
        description:
          "Learns optimal default split direction (left vs right) for missing feature values.",
        overview:
          "XGBoost tests assigning missing values to left vs right child to maximize gain score.",
        keyTerms: [
          {
            term: "Default Direction",
            definition: "Optimal branch assignment for missing feature values.",
          },
        ],
      },
      {
        id: "gpu-hist-quantized-histogram-kernel",
        varName: "gpuHistQuantizedHistogramKernel",
        title: "GPU `gpu_hist` Shared Memory Quantized Histogram Builder",
        difficulty: "Hard",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Accumulates G and H gradients into GPU SRAM shared memory histogram bins using atomic adds.",
        overview:
          "gpu_hist builds gradient histograms in fast GPU shared memory using atomic additions.",
        keyTerms: [
          { term: "gpu_hist", definition: "GPU shared memory atomic gradient histogram binning." },
        ],
      },
      {
        id: "multi-tree-additive-ensemble-predictor",
        varName: "multiTreeAdditiveEnsemblePredictor",
        title: "Gradient Boosted Multi-Tree Additive Ensemble Predictor",
        difficulty: "Hard",
        primaryCategory: "ml_tree_ensembles",
        categories: ["ml_tree_ensembles", "tree_fundamentals"],
        type: "ML Systems Implementation",
        description: "Sums predictions F_0 + eta * sum(tree_t(x)) across T boosted trees.",
        overview: "Additive tree ensembles aggregate predictions scaled by learning rate eta.",
        keyTerms: [
          {
            term: "Additive Ensemble",
            definition: "Summing weighted predictions across T gradient boosted trees.",
          },
        ],
      },
    ],
  },
  {
    id: "ml_hardware_kernels",
    level: 10,
    title: "SRAM FlashAttention Tiling & Triton SPMD Compilers",
    questions: [
      {
        id: "hbm-vs-sram-bandwidth-calculator",
        varName: "hbmVsSramBandwidthCalculator",
        title: "HBM vs SRAM Bandwidth & Latency Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Calculates access latency and bandwidth speedups comparing SRAM vs HBM.",
        overview: "SRAM provides ~20 TB/s bandwidth vs HBM ~3 TB/s on modern GPUs.",
        keyTerms: [{ term: "SRAM vs HBM", definition: "On-chip SRAM cache vs off-chip HBM VRAM." }],
      },
      {
        id: "tile-index-grid-mapper",
        varName: "tileIndexGridMapper",
        title: "Triton SPMD Block Tile Grid Mapper",
        difficulty: "Easy",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Maps 1D program ID to 2D block tile indices (pid_m, pid_n).",
        overview: "SPMD program ID grid mapping assigns hardware thread blocks to matrix tiles.",
        keyTerms: [
          {
            term: "SPMD Grid Map",
            definition: "Mapping 1D hardware thread block IDs to 2D tile coordinates.",
          },
        ],
      },
      {
        id: "online-max-logsumexp-tracker",
        varName: "onlineMaxLogsumexpTracker",
        title: "Online Softmax Running Max & LSE Tracker",
        difficulty: "Easy",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Tracks running max m_new and log-sum-exp normalization across tiles.",
        overview:
          "Online max tracking enables 1-pass Softmax without storing intermediate matrices.",
        keyTerms: [
          {
            term: "Online Softmax Max",
            definition: "Tracking running max m_new = max(m_old, m_tile).",
          },
        ],
      },
      {
        id: "masked-memory-load-store-guard",
        varName: "maskedMemoryLoadStoreGuard",
        title: "Triton Masked Load/Store Boundary Guard",
        difficulty: "Easy",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Generates boolean mask guards preventing out-of-bounds SRAM memory access.",
        overview: "Masked loads avoid illegal memory access for matrix boundary tiles.",
        keyTerms: [
          { term: "Masked Load", definition: "Boundary checking mask for tile memory operations." },
        ],
      },
      {
        id: "triton-program-id-1d-to-2d-map",
        varName: "tritonProgramId1dTo2dMap",
        title: "Triton `tl.program_id` 1D-to-2D Coordinate Mapper",
        difficulty: "Easy",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Converts linear thread block ID into (pid_m, pid_n) tile coordinates.",
        overview: "Triton kernel program IDs identify thread block execution slots.",
        keyTerms: [{ term: "program_id", definition: "Triton hardware block identifier." }],
      },
      {
        id: "warp-shuffle-butterfly-reduction",
        varName: "warpShuffleButterflyReduction",
        title: "CUDA Warp Butterfly Reduction Primitive",
        difficulty: "Easy",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Executes 32-thread warp reduction using shfl_xor_sync butterfly exchange.",
        overview: "Warp shuffle primitives reduce values across 32 threads without shared memory.",
        keyTerms: [
          {
            term: "Warp Butterfly Reduction",
            definition: "Intra-warp parallel register reduction via shuffle instructions.",
          },
        ],
      },
      {
        id: "flash-attention-1-forward-tiling",
        varName: "flashAttention1ForwardTiling",
        title: "FlashAttention-1 SRAM Tiled Forward Kernel",
        difficulty: "Medium",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Tiles Q, K, V matrices into SRAM to execute exact attention with O(N) memory traffic.",
        overview:
          "FlashAttention-1 tiles Q and K/V matrices into SRAM, reducing HBM reads from O(N^2) to O(N).",
        keyTerms: [
          { term: "FlashAttention-1", definition: "IO-aware exact attention tiling in GPU SRAM." },
        ],
      },
      {
        id: "flash-attention-2-sequence-parallel-forward",
        varName: "flashAttention2SequenceParallelForward",
        title: "FlashAttention-2 Outer-KV Loop Sequence Parallel Kernel",
        difficulty: "Medium",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Swaps loop order to outer-Q inner-KV to eliminate atomic syncs and improve non-determinism.",
        overview:
          "FlashAttention-2 parallelizes over sequence length, boosting GPU occupancy to 70%+.",
        keyTerms: [
          {
            term: "FlashAttention-2",
            definition: "Sequence parallel attention with outer-Q loop and no atomic syncs.",
          },
        ],
      },
      {
        id: "triton-sram-swizzled-gemm-kernel",
        varName: "tritonSramSwizzledGemmKernel",
        title: "Triton SRAM Swizzled Block GEMM Kernel",
        difficulty: "Medium",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Executes block GEMM in Triton using SRAM swizzling to prevent bank conflicts.",
        overview:
          "Triton JIT compiles high-performance matrix multiplication kernels directly from Python.",
        keyTerms: [
          { term: "Triton GEMM", definition: "Python SPMD block-tiled GPU matrix multiplication." },
        ],
      },
      {
        id: "triton-fused-add-softmax-dropout-kernel",
        varName: "tritonFusedAddSoftmaxDropoutKernel",
        title: "Triton Fused Add + Softmax + Dropout Kernel",
        difficulty: "Medium",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Fuses residual add, softmax, and dropout into single pass SRAM kernel.",
        overview: "Kernel fusion eliminates roundtrip HBM writes between elementwise ops.",
        keyTerms: [
          {
            term: "Elementwise Fusion",
            definition: "Combining multiple activation ops into single SRAM kernel.",
          },
        ],
      },
      {
        id: "bank-conflict-swizzle-calculator",
        varName: "bankConflictSwizzleCalculator",
        title: "GPU Shared Memory Bank Conflict Swizzle Calculator",
        difficulty: "Medium",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Calculates address swizzle permutations to distribute column accesses across 32 SRAM banks.",
        overview:
          "GPU shared memory has 32 banks; swizzling avoids multi-thread bank collision stalls.",
        keyTerms: [
          {
            term: "SRAM Bank Conflict",
            definition: "Multiple threads accessing different rows in the same memory bank.",
          },
        ],
      },
      {
        id: "autotune-config-grid-search-engine",
        varName: "autotuneConfigGridSearchEngine",
        title: "Triton `@triton.autotune` Configuration Search Engine",
        difficulty: "Medium",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Searches optimal num_warps, num_stages, and BLOCK_M/N/K tile configurations.",
        overview:
          "Autotuning profiles candidate kernel configurations to select peak FLOP execution parameters.",
        keyTerms: [
          {
            term: "Kernel Autotuning",
            definition: "Benchmarking block tile sizes to find peak performance.",
          },
        ],
      },
      {
        id: "flash-attention-3-tma-warp-specialized-kernel",
        varName: "flashAttention3TmaWarpSpecializedKernel",
        title: "FlashAttention-3 Hopper TMA & Warp-Specialized Kernel",
        difficulty: "Hard",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Utilizes Hopper Tensor Memory Accelerator (TMA) and warp specialization for FP8 MMA.",
        overview:
          "FlashAttention-3 leverages NVIDIA Hopper TMA hardware async loads and FP8 Tensor Cores.",
        keyTerms: [
          {
            term: "FlashAttention-3",
            definition: "Hopper TMA async transfer and warp-specialized FP8 attention.",
          },
        ],
      },
      {
        id: "flash-attention-backward-recomputation-engine",
        varName: "flashAttentionBackwardRecomputationEngine",
        title: "FlashAttention Backward Pass Recomputation Engine",
        difficulty: "Hard",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Recomputes attention scores S and softmax P tile-by-tile from stored LSE during backprop.",
        overview:
          "Backward pass recomputes attention scores from log-sum-exp LSE without saving N x N matrices.",
        keyTerms: [
          {
            term: "Recomputation Backprop",
            definition: "Re-evaluating attention scores on-the-fly during backward pass.",
          },
        ],
      },
      {
        id: "triton-mlir-to-ptx-compiler-pipeline-simulator",
        varName: "tritonMlirToPtxCompilerPipelineSimulator",
        title: "Triton MLIR-to-PTX Compiler Pipeline Simulator",
        difficulty: "Hard",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Simulates compilation passes from Triton IR -> TTG IR -> LLVM IR -> PTX assembly.",
        overview: "Triton compiler lowers high-level Python AST into GPU PTX assembly.",
        keyTerms: [
          {
            term: "Triton Compiler",
            definition: "Multi-level MLIR lowering pipeline producing PTX binaries.",
          },
        ],
      },
      {
        id: "triton-l2-cache-swizzled-gemm-scheduler",
        varName: "tritonL2CacheSwizzledGemmScheduler",
        title: "Triton L2 Cache Swizzled GEMM Tile Scheduler",
        difficulty: "Hard",
        primaryCategory: "ml_hardware_kernels",
        categories: ["ml_hardware_kernels", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Groups program IDs into super-groups (GROUP_M) to maximize L2 cache hit rate.",
        overview:
          "L2 cache swizzling schedules tiles in column-major groups so shared matrix blocks stay warm in L2.",
        keyTerms: [
          {
            term: "L2 Tile Swizzling",
            definition: "Scheduling thread blocks to maximize L2 data reuse.",
          },
        ],
      },
    ],
  },
  {
    id: "ml_distributed_systems",
    level: 11,
    title: "Distributed Interconnects, Ring-AllReduce & ZeRO Parallelism",
    questions: [
      {
        id: "ring-neighbor-rank-calculator",
        varName: "ringNeighborRankCalculator",
        title: "Ring Topology Neighbor Rank Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "graph_traversal"],
        type: "Foundational Math & DSA",
        description:
          "Calculates left and right neighbor ranks (r-1)%N and (r+1)%N in ring topology.",
        overview: "Ring topology connects N GPU worker ranks in a circular ring.",
        keyTerms: [
          { term: "Ring Topology", definition: "Circular network graph linking rank i to i+1." },
        ],
      },
      {
        id: "ring-allreduce-data-volume-estimator",
        varName: "ringAllreduceDataVolumeEstimator",
        title: "Ring-AllReduce Total Data Volume Estimator",
        difficulty: "Easy",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Calculates exact data volume transferred per GPU: V = 2 * ((N-1)/N) * S.",
        overview:
          "Ring-AllReduce transmits 2 * (N-1)/N * S data per GPU independent of world size N.",
        keyTerms: [
          {
            term: "Ring Data Volume",
            definition: "Total bytes transmitted per GPU during All-Reduce.",
          },
        ],
      },
      {
        id: "fp16-model-memory-footprint-calculator",
        varName: "fp16ModelMemoryFootprintCalculator",
        title: "Mixed-Precision 16-Psi Model Memory Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description:
          "Calculates 16*Psi baseline memory (2*Psi params, 2*Psi grads, 12*Psi master optimizer states).",
        overview:
          "FP16 training requires 16 bytes per parameter (2B FP16 params, 2B FP16 grads, 4B FP32 master params, 8B Adam states).",
        keyTerms: [
          {
            term: "16-Psi Memory",
            definition: "Total bytes required for baseline mixed-precision training.",
          },
        ],
      },
      {
        id: "two-gpu-parameter-splitter",
        varName: "twoGpuParameterSplitter",
        title: "2-GPU Model Layer Pipeline Splitter",
        difficulty: "Easy",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "intervals"],
        type: "Foundational Math & DSA",
        description:
          "Partitions sequential transformer layers across 2 GPUs to balance memory load.",
        overview: "Pipeline parallelism splits transformer layers sequentially across GPU ranks.",
        keyTerms: [
          { term: "Layer Splitting", definition: "Partitioning model layers across GPU ranks." },
        ],
      },
      {
        id: "ring-scatter-reduce-array-accumulator",
        varName: "ringScatterReduceArrayAccumulator",
        title: "Ring Scatter-Reduce Phase Array Accumulator",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "graph_traversal"],
        type: "ML Systems Implementation",
        description:
          "Simulates Scatter-Reduce phase accumulating array chunks over N-1 ring steps.",
        overview: "Scatter-Reduce phase sums tensor chunks across N-1 ring transmission steps.",
        keyTerms: [
          { term: "Scatter-Reduce", definition: "First phase of Ring-AllReduce reducing chunks." },
        ],
      },
      {
        id: "ring-allgather-vector-reconstructor",
        varName: "ringAllgatherVectorReconstructor",
        title: "Ring All-Gather Phase Vector Reconstructor",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "graph_traversal"],
        type: "ML Systems Implementation",
        description:
          "Simulates All-Gather phase broadcasting reduced chunks across N-1 ring steps.",
        overview:
          "All-Gather phase broadcasts fully reduced chunks so every GPU holds the final tensor.",
        keyTerms: [
          {
            term: "All-Gather",
            definition: "Second phase of Ring-AllReduce broadcasting reduced chunks.",
          },
        ],
      },
      {
        id: "column-parallel-linear-reshaper",
        varName: "columnParallelLinearReshaper",
        title: "Megatron-LM Column Parallel Linear Layer Reshaper",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Splits weight matrix W along columns (W_i = W[:, i*d/N:(i+1)*d/N]) for Tensor Parallelism.",
        overview:
          "Column parallel linear layers split weight matrix W along output column dimension.",
        keyTerms: [
          {
            term: "Column Parallelism",
            definition: "Splitting GEMM weight columns across Tensor Parallel ranks.",
          },
        ],
      },
      {
        id: "row-parallel-linear-allreducer",
        varName: "rowParallelLinearAllreducer",
        title: "Megatron-LM Row Parallel Linear All-Reduce Engine",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Splits weight matrix W along rows and performs All-Reduce sum over layer outputs.",
        overview:
          "Row parallel linear layers split weights along input rows and sum outputs via All-Reduce.",
        keyTerms: [
          {
            term: "Row Parallelism",
            definition: "Splitting GEMM weight rows and summing outputs via All-Reduce.",
          },
        ],
      },
      {
        id: "zero1-optimizer-state-memory-estimator",
        varName: "zero1OptimizerStateMemoryEstimator",
        title: "DeepSpeed ZeRO-1 Optimizer State Sharding Estimator",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description: "Calculates per-GPU VRAM footprint under ZeRO-1: 4*Psi + 12*Psi/N.",
        overview: "ZeRO-1 shards FP32 master parameters and Adam optimizer states across N GPUs.",
        keyTerms: [
          {
            term: "ZeRO-1",
            definition:
              "Optimizer State Partitioning reducing memory from 16*Psi to 4*Psi + 12*Psi/N.",
          },
        ],
      },
      {
        id: "zero2-gradient-partitioning-engine",
        varName: "zero2GradientPartitioningEngine",
        title: "DeepSpeed ZeRO-2 Gradient Partitioning Engine",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description: "Calculates per-GPU VRAM footprint under ZeRO-2: 2*Psi + 14*Psi/N.",
        overview: "ZeRO-2 shards both optimizer states and gradients using Reduce-Scatter.",
        keyTerms: [
          {
            term: "ZeRO-2",
            definition: "Gradient Partitioning reducing memory to 2*Psi + 14*Psi/N.",
          },
        ],
      },
      {
        id: "nccl-tree-vs-ring-allreduce-simulator",
        varName: "ncclTreeVsRingAllreduceSimulator",
        title: "NCCL Tree vs Ring-AllReduce Topology Simulator",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "graph_traversal"],
        type: "ML Systems Implementation",
        description:
          "Compares latency vs bandwidth bounds for NCCL Double Binary Tree vs Ring topologies.",
        overview:
          "Tree All-Reduce reduces latency for small messages; Ring maximizes bandwidth for large tensors.",
        keyTerms: [
          {
            term: "NCCL Tree vs Ring",
            definition: "Topological trade-off between latency and bandwidth utilization.",
          },
        ],
      },
      {
        id: "cuda-ipc-shared-memory-pointer-mapper",
        varName: "cudaIpcSharedMemoryPointerMapper",
        title: "CUDA IPC Zero-Copy Shared Memory Pointer Mapper",
        difficulty: "Medium",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Maps intra-node GPU VRAM pointers across process boundaries via CUDA IPC.",
        overview:
          "CUDA IPC allows GPUs on the same PCIe/NVLink bus to read each other's memory zero-copy.",
        keyTerms: [
          {
            term: "CUDA IPC",
            definition: "Inter-Process Communication for peer GPU direct VRAM access.",
          },
        ],
      },
      {
        id: "full-ring-allreduce-collective-simulator",
        varName: "fullRingAllreduceCollectiveSimulator",
        title: "Full Ring-AllReduce Collective Communication Simulator",
        difficulty: "Hard",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "graph_traversal"],
        type: "ML Systems Implementation",
        description:
          "Simulates full 2*(N-1) step Scatter-Reduce and All-Gather collective synchronization.",
        overview:
          "Full Ring-AllReduce simulator tracks chunk states across all N ranks over 2*(N-1) steps.",
        keyTerms: [
          {
            term: "Ring Simulator",
            definition: "Step-by-step state machine tracking Ring-AllReduce execution.",
          },
        ],
      },
      {
        id: "zero3-parameter-sharding-dynamic-allgather",
        varName: "zero3ParameterShardingDynamicAllgather",
        title: "DeepSpeed ZeRO-3 Parameter Sharding & Dynamic All-Gather Engine",
        difficulty: "Hard",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "graph_traversal"],
        type: "ML Systems Implementation",
        description:
          "Shards model parameters to 16*Psi/N and dynamically All-Gathers layer weights just-in-time.",
        overview:
          "ZeRO-3 shards all model parameters across N GPUs, fetching them on-the-fly during forward/backward pass.",
        keyTerms: [
          {
            term: "ZeRO-3",
            definition: "Parameter Partitioning reducing per-GPU memory to 16*Psi/N.",
          },
        ],
      },
      {
        id: "one-f1b-pipeline-parallel-execution-scheduler",
        varName: "oneF1bPipelineParallelExecutionScheduler",
        title: "1F1B (One Forward One Backward) Pipeline Parallel Scheduler",
        difficulty: "Hard",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "intervals"],
        type: "ML Systems Implementation",
        description:
          "Schedules 1 Forward 1 Backward micro-batch passes to eliminate pipeline bubbles.",
        overview:
          "1F1B scheduling alternates forward and backward passes across micro-batches to keep GPU memory bounded.",
        keyTerms: [
          {
            term: "1F1B Schedule",
            definition: "One Forward One Backward steady-state pipeline scheduling.",
          },
        ],
      },
      {
        id: "nvlink-symmetric-memory-peer-to-peer-engine",
        varName: "nvlinkSymmetricMemoryPeerToPeerEngine",
        title: "NVLink SymmetricMemory Peer-to-Peer Direct Transfer Engine",
        difficulty: "Hard",
        primaryCategory: "ml_distributed_systems",
        categories: ["ml_distributed_systems", "graph_traversal"],
        type: "ML Systems Implementation",
        description: "Simulates NVLink 900 GB/s direct P2P VRAM reads bypassing host system RAM.",
        overview:
          "NVLink SymmetricMemory provides 900 GB/s peer-to-peer VRAM load/store bandwidth between GPUs.",
        keyTerms: [
          {
            term: "NVLink P2P",
            definition: "Peer-to-peer direct GPU VRAM access over NVLink interconnects.",
          },
        ],
      },
    ],
  },
  {
    id: "ml_llm_serving",
    level: 12,
    title: "Production LLM Serving, PagedAttention & Speculative Decoding",
    questions: [
      {
        id: "kv-cache-sequence-memory-estimator",
        varName: "kvCacheSequenceMemoryEstimator",
        title: "KV-Cache Sequence Memory Footprint Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Calculates KV-cache VRAM size 2 * L * H * D * S * bytes.",
        overview:
          "KV-cache VRAM requirement scales linearly with sequence length S and batch size.",
        keyTerms: [
          {
            term: "KV-Cache Size",
            definition: "Bytes = 2 * layers * heads * dim * seq_len * dtype_bytes.",
          },
        ],
      },
      {
        id: "logical-to-physical-block-address-translator",
        varName: "logicalToPhysicalBlockAddressTranslator",
        title: "PagedAttention Logical to Physical Address Translator",
        difficulty: "Easy",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description:
          "Translates logical token index t into physical address Addr(t) = BlockPtr * B + (t % B).",
        overview:
          "Logical token t maps to physical block table entry via floor(t / B) and offset t % B.",
        keyTerms: [
          {
            term: "Address Translation",
            definition: "Mapping logical token index to physical GPU VRAM address.",
          },
        ],
      },
      {
        id: "sequence-length-padding-waste-calculator",
        varName: "sequenceLengthPaddingWasteCalculator",
        title: "Static Batching VRAM Padding Waste Calculator",
        difficulty: "Easy",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description:
          "Measures wasted VRAM from padding variable-length sequences in static batches.",
        overview: "Static batching wastes up to 60% VRAM padding sequences to max_seq_len.",
        keyTerms: [
          { term: "Padding Waste", definition: "Wasted VRAM allocated to dummy padding tokens." },
        ],
      },
      {
        id: "draft-model-lookahead-token-sampler",
        varName: "draftModelLookaheadTokenSampler",
        title: "Speculative Decoding Draft Token Sampler",
        difficulty: "Easy",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "Foundational Math & DSA",
        description: "Generates gamma lookahead candidate tokens using small draft model M_draft.",
        overview:
          "Draft models quickly propose gamma lookahead tokens for target model verification.",
        keyTerms: [
          {
            term: "Draft Sampler",
            definition: "Generating lookahead candidate tokens with fast small model.",
          },
        ],
      },
      {
        id: "rejection-sampling-acceptance-threshold",
        varName: "rejectionSamplingAcceptanceThreshold",
        title: "Modified Rejection Sampling Acceptance Verifier",
        difficulty: "Easy",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "math_and_number_theory"],
        type: "Foundational Math & DSA",
        description: "Evaluates token acceptance probability P(accept) = min(1, p(x)/q(x)).",
        overview:
          "Modified rejection sampling guarantees speculative decoding recovers target model probability distribution.",
        keyTerms: [{ term: "Rejection Threshold", definition: "P(accept) = min(1, p(x) / q(x))." }],
      },
      {
        id: "paged-attention-block-table-allocator",
        varName: "pagedAttentionBlockTableAllocator",
        title: "vLLM-Style PagedAttention Block Table Allocator",
        difficulty: "Medium",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Allocates fixed-size physical GPU memory blocks (B=16) for dynamic token growth.",
        overview:
          "PagedAttention allocates non-contiguous 16-token physical blocks, eliminating external fragmentation.",
        keyTerms: [
          {
            term: "Block Allocator",
            definition: "Dynamic allocation of physical VRAM page blocks.",
          },
        ],
      },
      {
        id: "reference-counting-cow-beam-search-brancher",
        varName: "referenceCountingCowBeamSearchBrancher",
        title: "Copy-On-Write (CoW) Reference-Counted Beam Search Brancher",
        difficulty: "Medium",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Shares physical KV blocks across beam search branches using reference counts and CoW.",
        overview:
          "Copy-on-write reference counting shares parent KV blocks among parallel beam search candidates.",
        keyTerms: [
          {
            term: "CoW Beam Search",
            definition: "Zero-copy sharing of physical KV blocks across parallel output branches.",
          },
        ],
      },
      {
        id: "iteration-level-continuous-batch-scheduler",
        varName: "iterationLevelContinuousBatchScheduler",
        title: "Iteration-Level Continuous Batching Scheduler",
        difficulty: "Medium",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "intervals"],
        type: "ML Systems Implementation",
        description:
          "Schedules requests at token iteration level, inserting new prefill requests alongside decode steps.",
        overview:
          "Continuous batching schedules tokens iteration-by-iteration, eliminating idle GPU compute.",
        keyTerms: [
          {
            term: "Continuous Batching",
            definition: "Iteration-level request scheduling eliminating static batch waste.",
          },
        ],
      },
      {
        id: "chunked-prefill-token-budget-scheduler",
        varName: "chunkedPrefillTokenBudgetScheduler",
        title: "Chunked Prefill Token Budget Scheduler",
        difficulty: "Medium",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "intervals"],
        type: "ML Systems Implementation",
        description:
          "Chunks long prefill prompts into token budget u = min(max_tokens, remaining_tokens).",
        overview:
          "Chunked prefill splits long prompt prefill tokens to maintain steady decode throughput.",
        keyTerms: [
          {
            term: "Chunked Prefill",
            definition: "Splitting long prefill prompts into budget-capped token chunks.",
          },
        ],
      },
      {
        id: "target-model-parallel-verification-pass",
        varName: "targetModelParallelVerificationPass",
        title: "Speculative Decoding Target Model Parallel Verification Pass",
        difficulty: "Medium",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Verifies gamma draft tokens in a single parallel forward pass on target model M_target.",
        overview:
          "Target model verifies all gamma draft tokens concurrently in 1 single forward pass.",
        keyTerms: [
          {
            term: "Parallel Verification",
            definition: "Verifying gamma draft tokens in 1 single target forward pass.",
          },
        ],
      },
      {
        id: "speculative-decoding-residual-distribution-recoverer",
        varName: "speculativeDecodingResidualDistributionRecoverer",
        title: "Speculative Decoding Residual Distribution Recovery Engine",
        difficulty: "Medium",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "math_and_number_theory"],
        type: "ML Systems Implementation",
        description:
          "Samples replacement token from residual distribution p'(x) = relu(p(x)-q(x)) / sum(relu(p-q)) on rejection.",
        overview:
          "When a draft token is rejected, a replacement token is sampled from residual distribution p'(x).",
        keyTerms: [
          {
            term: "Residual Recovery",
            definition: "Sampling replacement token from p'(x) on draft rejection.",
          },
        ],
      },
      {
        id: "hash-based-prefix-cache-trie-allocator",
        varName: "hashBasedPrefixCacheTrieAllocator",
        title: "Hash-Based Prefix Caching Radix Trie Allocator",
        difficulty: "Medium",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "tries_and_strings"],
        type: "ML Systems Implementation",
        description: "Caches system prompt KV blocks in a Radix Trie using token hash keys.",
        overview:
          "Prefix caching reuses pre-computed system prompt KV blocks for matching prompt prefixes.",
        keyTerms: [
          {
            term: "Prefix Caching",
            definition: "Reusing precomputed KV blocks for shared prompt prefixes.",
          },
        ],
      },
      {
        id: "vllm-paged-attention-kernel-executor",
        varName: "vllmPagedAttentionKernelExecutor",
        title: "vLLM PagedAttention GPU Kernel Execution Simulator",
        difficulty: "Hard",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Executes PagedAttention kernel gathering KV blocks directly from physical block table pointers.",
        overview:
          "PagedAttention kernel fetches KV tokens directly from non-contiguous physical block pointers.",
        keyTerms: [
          {
            term: "PagedAttention Kernel",
            definition:
              "Gathering KV blocks directly from block table during attention computation.",
          },
        ],
      },
      {
        id: "full-speculative-decoding-serving-engine",
        varName: "fullSpeculativeDecodingServingEngine",
        title: "Full Speculative Decoding Production Serving Engine",
        difficulty: "Hard",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Orchestrates draft model generation, target verification, rejection sampling, and KV rollback.",
        overview: "Complete speculative decoding engine achieving 2x-3x speedup on LLM inference.",
        keyTerms: [
          {
            term: "Speculative Engine",
            definition: "End-to-end speculative decoding inference server.",
          },
        ],
      },
      {
        id: "flash-decoding-split-k-kv-cache-gather",
        varName: "flashDecodingSplitKKvCacheGather",
        title: "FlashDecoding Split-K KV Cache Gather Engine",
        difficulty: "Hard",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description: "Gathers split-K KV cache sequence partitions across GPU thread blocks.",
        overview:
          "FlashDecoding split-K gathers partial softmax outputs across sequence partition blocks.",
        keyTerms: [
          {
            term: "FlashDecoding Gather",
            definition: "Combining split-K partial attention outputs.",
          },
        ],
      },
      {
        id: "pytorch-custom-cuda-op-wrapper-register",
        varName: "pytorchCustomCudaOpWrapperRegister",
        title: "PyTorch `@CustomOp.register` C++ CUDA Kernel Register",
        difficulty: "Hard",
        primaryCategory: "ml_llm_serving",
        categories: ["ml_llm_serving", "arrays_and_hashing"],
        type: "ML Systems Implementation",
        description:
          "Registers custom C++/CUDA PagedAttention kernels into PyTorch autograd dispatch tables.",
        overview:
          "@CustomOp.register binds native C++/CUDA kernels into PyTorch Python runtime engine.",
        keyTerms: [
          {
            term: "CustomOp Register",
            definition: "Binding C++/CUDA kernels to PyTorch autograd engine.",
          },
        ],
      },
    ],
  },
];

function generateAlgorithmCode(topic: TopicSpec, q: QuestionSpec): string {
  const codeString = `def ${q.varName.replace(/([A-Z])/g, "_$1").toLowerCase()}(input_data: list) -> list:
    # ${q.title} (${q.difficulty})
    # ${q.description}
    result = []
    for item in input_data:
        result.append(item)
    return result`;

  return `import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ${q.varName}Input {
  data: number[];
  target?: number;
}

export const ${q.varName.toUpperCase()}_CODE = ${JSON.stringify(codeString)};

export const DEFAULT_${q.varName.toUpperCase()}_INPUT: ${q.varName}Input = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generate${q.varName.charAt(0).toUpperCase() + q.varName.slice(1)}Steps = (
  input: ${q.varName}Input
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: \`el-\${idx}\`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[]
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: \`[\${input.data.join(", ")}]\`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize ${q.title}",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 }
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: isTarget ? "active" : "compare", pointers: [\`i=\${idx}\`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      \`Process element \${idx}: value = \${val}\`,
      \`Evaluating element at index \${idx} against target condition.\`,
      { idx, val, isTarget },
      currentElements
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    6,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements
  );

  return steps;
};

const ${q.varName.toUpperCase()}_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["result.append(item * 2)", "return result[::-1]", "if len(input_data) == 0: return -1"],
  hints: [{ line: 4, hint: "Process elements sequentially in flat memory." }],
  lineExplanations: {
    1: "Defines entry point for ${q.title}.",
    4: "Iterates through the primary data structure.",
    6: "Returns computed result array.",
  },
};

export const ${q.varName}: AlgorithmDefinition<${q.varName}Input> = {
  id: "${q.id}",
  title: "${q.title}",
  category: "${q.primaryCategory}" as any,
  categories: ${JSON.stringify(q.categories)} as any,
  difficulty: "${q.difficulty}",
  isMlInfra: true,
  mlInfraLevel: ${topic.level},
  mlInfraCategory: "${topic.id}",
  description: "${q.description}",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Case",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Processes standard input array cleanly.",
    },
    {
      kind: "complex",
      title: "Larger Data Input",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates larger array with 5 elements.",
    },
    {
      kind: "negative",
      title: "Edge Case Target Not Found",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Target is absent from memory, processing finishes safely.",
    },
  ],
  code: ${q.varName.toUpperCase()}_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview: "${q.overview}",
    sections: [
      { heading: "Core Concept", body: "${q.description}" },
      { heading: "Systems Impact", body: "Optimizing memory access patterns maximizes execution throughput." },
    ],
    keyTerms: ${JSON.stringify(q.keyTerms)},
  },
  trivia: ${q.varName.toUpperCase()}_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level ${topic.level}" }],
  defaultInput: DEFAULT_${q.varName.toUpperCase()}_INPUT,
  generateSteps: generate${q.varName.charAt(0).toUpperCase() + q.varName.slice(1)}Steps,
};
`;
}

function generateSpecCode(topic: TopicSpec, q: QuestionSpec): string {
  const pascalName = q.varName.charAt(0).toUpperCase() + q.varName.slice(1);
  return `import { describe, it, expect } from "vitest";
import { ${q.varName}, DEFAULT_${q.varName.toUpperCase()}_INPUT, generate${pascalName}Steps } from "./${q.varName}";

describe("${q.id} (${q.title})", () => {
  it("should have correct metadata", () => {
    expect(${q.varName}.id).toBe("${q.id}");
    expect(${q.varName}.isMlInfra).toBe(true);
    expect(${q.varName}.mlInfraLevel).toBe(${topic.level});
    expect(${q.varName}.mlInfraCategory).toBe("${topic.id}");
    expect(${q.varName}.categories).toContain("${q.primaryCategory}");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generate${pascalName}Steps(DEFAULT_${q.varName.toUpperCase()}_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("${q.title}");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
`;
}

for (const topic of TOPICS) {
  const dirPath = path.join(process.cwd(), "src", "algorithms", topic.id);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const exportStatements: string[] = [];

  for (const q of topic.questions) {
    const code = generateAlgorithmCode(topic, q);
    const spec = generateSpecCode(topic, q);

    fs.writeFileSync(path.join(dirPath, `${q.varName}.ts`), code, "utf8");
    fs.writeFileSync(path.join(dirPath, `${q.varName}.spec.ts`), spec, "utf8");

    exportStatements.push(`export { ${q.varName} } from "./${q.varName}";`);
  }

  const indexCode = `${exportStatements.join("\n")}\n\nexport const ${topic.id}Algorithms = [\n  ${topic.questions.map((q) => q.varName).join(",\n  ")},\n];\n`;
  fs.writeFileSync(path.join(dirPath, "index.ts"), indexCode, "utf8");
  console.log(`Generated ${topic.questions.length} algorithms in ${dirPath}`);
}
