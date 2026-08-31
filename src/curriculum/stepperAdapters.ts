import type { CodeProgressionSection, MentalModelSection } from "./courseTypes";
import { DSA_COURSES_BY_ID } from "./courses/dsa";
import { ML_COURSES_BY_ID } from "./courses/ml";

function getCourseJourney(topicId: string) {
  return (
    DSA_COURSES_BY_ID[topicId] ||
    DSA_COURSES_BY_ID[`dsa_${topicId}`] ||
    ML_COURSES_BY_ID[topicId] ||
    ML_COURSES_BY_ID[`ml_${topicId}`]
  );
}

/**
 * Visual memory representation of a single cache line or memory cell.
 */
export interface MemoryCellTrace {
  readonly address: string;
  readonly label: string;
  readonly value: string | number;
  readonly isCacheHit?: boolean;
  readonly isDirty?: boolean;
}

/**
 * A discrete execution step in the interactive algorithm visualizer.
 */
export interface CourseVisualStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly description: string;
  readonly codeLine: number;
  readonly codeSnippet: string;
  readonly variables: Record<string, string | number | boolean | readonly unknown[]>;
  readonly memoryTrace?: readonly MemoryCellTrace[];
  readonly activeInvariant?: string;
  readonly stageLabel?: string;
}

/**
 * Adapter interface for producing interactive visual steps for a course topic.
 */
export interface CourseStepperAdapter {
  readonly topicId: string;
  readonly courseTitle: string;
  readonly defaultStagesCount: number;
  generateSteps(stageIndex?: number, input?: unknown): readonly CourseVisualStep[];
}

/**
 * Specialized visual step generator for FlashAttention SRAM Tiling.
 */
function generateFlashAttentionSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Block Initialization & SRAM Allocation",
      description:
        "Allocating fast on-chip SRAM buffers for Query block Q_i (size B_r x d) and Key/Value block K_j, V_j (size B_c x d).",
      codeLine: 4,
      codeSnippet:
        "m_i = np.full((B_r,), -np.inf); l_i = np.zeros((B_r,)); O_i = np.zeros((B_r, d))",
      variables: { B_r: 64, B_c: 64, d: 128, m_i: "-inf", l_i: 0.0 },
      memoryTrace: [
        { address: "SRAM_0x00", label: "Q_i Tile", value: "64x128 FP16", isCacheHit: true },
        { address: "SRAM_0x40", label: "m_prev", value: "-inf", isCacheHit: true },
        { address: "SRAM_0x44", label: "l_prev", value: "0.0", isCacheHit: true },
      ],
      activeInvariant: "Softmax Running Invariant: l_i = sum(exp(S - m_i))",
      stageLabel: "Stage 3: Hardware-Fused SRAM Block Tiling",
    },
    {
      stepNumber: 2,
      title: "Load Key Tile K_j from HBM to SRAM",
      description:
        "Streaming block K_j from High-Bandwidth Memory (HBM) into fast on-chip shared memory.",
      codeLine: 8,
      codeSnippet: "S_ij = (Q_i @ K_j.T) * (1.0 / np.sqrt(d))",
      variables: { tile_j: 0, sram_bytes_loaded: 16384, max_logit: 14.82 },
      memoryTrace: [
        { address: "HBM_0x1000", label: "K_0 DRAM", value: "Read 16KB", isCacheHit: false },
        { address: "SRAM_0x80", label: "K_0 Local", value: "Cached", isCacheHit: true },
      ],
      activeInvariant: "Arithmetic Intensity: O(N) memory I/O vs O(N^2) compute",
      stageLabel: "Stage 3: Hardware-Fused SRAM Block Tiling",
    },
    {
      stepNumber: 3,
      title: "Online Softmax Rescaling & Numerator Update",
      description:
        "Executing Milakov-Gimelshein online softmax update: m_new = max(m_old, rowmax(S_ij)), rescaling accumulator O_i by exp(m_old - m_new).",
      codeLine: 12,
      codeSnippet:
        "m_new = np.maximum(m_i, np.max(S_ij, axis=-1)); P_ij = np.exp(S_ij - m_new[:, None])",
      variables: { m_old: "-inf", m_new: 14.82, alpha: 1.0 },
      memoryTrace: [
        { address: "SRAM_0x40", label: "m_i", value: "14.82", isDirty: true, isCacheHit: true },
        { address: "SRAM_0x44", label: "l_i", value: "48.2", isDirty: true, isCacheHit: true },
      ],
      activeInvariant:
        "Exact Mathematical Equivalence: Softmax(QK^T)V computed in single DRAM pass",
      stageLabel: "Stage 3: Hardware-Fused SRAM Block Tiling",
    },
    {
      stepNumber: 4,
      title: "Output Accumulation in Registers",
      description:
        "Multiplying local probability P_ij by Value block V_j in SRAM and accumulating into output register tile O_i.",
      codeLine: 16,
      codeSnippet: "O_i = np.diag(np.exp(m_i - m_new)) @ O_i + P_ij @ V_j; m_i = m_new",
      variables: { tile_j: 0, output_accumulated: true, d_out: 128 },
      memoryTrace: [
        { address: "REG_0x00", label: "O_i Register", value: "Accumulated", isCacheHit: true },
      ],
      activeInvariant: "Zero DRAM Materialization of N x N Attention Matrix",
      stageLabel: "Stage 3: Hardware-Fused SRAM Block Tiling",
    },
  ];
}

/**
 * Specialized visual step generator for Matrix Memory Layout.
 */
function generateMatrixMemoryLayoutSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Physical Linear Address Mapping",
      description:
        "Allocating 2D contiguous buffer in Row-Major order: Index(r, c) = r * stride_row + c * stride_col.",
      codeLine: 3,
      codeSnippet: "stride_row = cols; stride_col = 1",
      variables: { rows: 4, cols: 4, stride_row: 4, stride_col: 1, element_size: 4 },
      memoryTrace: [
        { address: "0x00", label: "A[0,0]", value: 1.0, isCacheHit: true },
        { address: "0x04", label: "A[0,1]", value: 2.0, isCacheHit: true },
        { address: "0x08", label: "A[0,2]", value: 3.0, isCacheHit: true },
        { address: "0x0C", label: "A[0,3]", value: 4.0, isCacheHit: true },
      ],
      activeInvariant: "Contiguous row traversal matches 64-byte L1 cache line prefetching",
      stageLabel: "Stage 2: Cache-Aware Row-Major Traversal",
    },
    {
      stepNumber: 2,
      title: "Row-Major Access: Sequential Cache Line Burst",
      description:
        "Iterating along columns: A[0, 0] through A[0, 3] are fetched in a single 64-byte L1 data cache transaction (Cache Hit Rate ~ 93.75%).",
      codeLine: 7,
      codeSnippet: "for j in range(cols): sum += matrix[0, j]",
      variables: { row: 0, col: 1, cache_misses: 0, hits: 3 },
      memoryTrace: [{ address: "0x04", label: "L1_Line_0", value: "A[0,1] HIT", isCacheHit: true }],
      activeInvariant: "Spatial Locality: Adjacent indices reside on same physical cache line",
      stageLabel: "Stage 2: Cache-Aware Row-Major Traversal",
    },
    {
      stepNumber: 3,
      title: "Column-Major Transpose Stride: Cache Line Thrashing",
      description:
        "Iterating column-wise across large stride triggers a compulsory cache miss on every access, causing memory bus saturation.",
      codeLine: 12,
      codeSnippet: "for i in range(rows): sum += matrix[i, 0] # Stride = 4096 elements",
      variables: { col: 0, row: 1, cache_misses: 4, hits: 0, bandwidth_waste: "93.75%" },
      memoryTrace: [{ address: "0x4000", label: "A[1,0]", value: "L1 MISS", isCacheHit: false }],
      activeInvariant: "Strided non-contiguous memory access degrades throughput by up to 20x",
      stageLabel: "Stage 3: Tiled Block GEMM Transposition",
    },
  ];
}

/**
 * Specialized visual step generator for Binary Search.
 */
function generateBinarySearchSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Search Interval Initialization",
      description: "Initializing search boundaries [low, high] enclosing sorted array of size N.",
      codeLine: 2,
      codeSnippet: "low, high = 0, len(nums) - 1",
      variables: { low: 0, high: 7, mid: 3, target: 42, array: [10, 20, 35, 42, 55, 68, 80, 99] },
      memoryTrace: [
        { address: "REG_LOW", label: "low", value: 0, isCacheHit: true },
        { address: "REG_HIGH", label: "high", value: 7, isCacheHit: true },
      ],
      activeInvariant: "Search Invariant: target in nums[low..high] if target is present",
      stageLabel: "Stage 1: Standard Binary Search",
    },
    {
      stepNumber: 2,
      title: "Midpoint Calculation & Branch Evaluation",
      description:
        "Computing overflow-safe midpoint mid = low + (high - low) // 2 and evaluating condition.",
      codeLine: 4,
      codeSnippet: "mid = low + (high - low) // 2; if nums[mid] == target: return mid",
      variables: { low: 0, high: 7, mid: 3, nums_mid: 42, target: 42 },
      memoryTrace: [
        { address: "REG_MID", label: "mid", value: 3, isCacheHit: true },
        { address: "ARRAY_0x0C", label: "nums[3]", value: 42, isCacheHit: true },
      ],
      activeInvariant: "Logarithmic Search Space Halving: |high - low + 1| halved each iteration",
      stageLabel: "Stage 1: Standard Binary Search",
    },
    {
      stepNumber: 3,
      title: "Target Located at Exact Index",
      description: "Exact match found at index 3 in O(log N) iterations with O(1) auxiliary space.",
      codeLine: 6,
      codeSnippet: "return mid",
      variables: { result_index: 3, iterations: 1 },
      memoryTrace: [{ address: "REG_RET", label: "return", value: 3, isCacheHit: true }],
      activeInvariant: "Optimal Comparison Lower Bound: ceil(log2(N + 1)) queries",
      stageLabel: "Stage 1: Standard Binary Search",
    },
  ];
}

/**
 * Specialized visual step generator for Dinic's Algorithm (Network Flows & Cuts).
 */
function generateDinicFlowsSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "BFS Level Graph Construction (Shortest Path DAG)",
      description:
        "Running BFS from source S=0 to assign each reachable node its exact hop distance (level). Edges with residual capacity c_f(u, v) > 0 and level[v] == level[u] + 1 form the admissible level DAG.",
      codeLine: 6,
      codeSnippet:
        "level.fill(-1); level[s] = 0; queue = [s]\nwhile queue: u = queue.shift(); for v in adj[u]: if cap[u][v] > 0 and level[v] < 0: level[v] = level[u] + 1",
      variables: { source: 0, sink: 5, levels: [0, 1, 1, 2, 2, 3], reachable: true },
      memoryTrace: [
        { address: "L1_0x00", label: "level[0] (S)", value: 0, isCacheHit: true },
        { address: "L1_0x04", label: "level[1]", value: 1, isCacheHit: true },
        { address: "L1_0x08", label: "level[2]", value: 1, isCacheHit: true },
        { address: "L1_0x0C", label: "level[3]", value: 2, isCacheHit: true },
        { address: "L1_0x10", label: "level[4]", value: 2, isCacheHit: true },
        { address: "L1_0x14", label: "level[5] (T)", value: 3, isCacheHit: true },
      ],
      activeInvariant:
        "Admissible Level DAG: Flow pushes strictly down levels: level[v] = level[u] + 1",
      stageLabel: "Stage 2: Dinic Algorithm with Level Graph & Blocking Flows",
    },
    {
      stepNumber: 2,
      title: "DFS Blocking Flow Augmentation (Dead-End Elimination)",
      description:
        "Pushing flow along augmenting path S -> 1 -> 3 -> T in the level DAG. The work pointer ptr[u] prevents retraversing saturated or dead-end edges.",
      codeLine: 18,
      codeSnippet:
        "pushed = dfs(v, min(pushed, cap[u][v]))\nif pushed > 0: cap[u][v] -= pushed; cap[v][u] += pushed; return pushed",
      variables: { path: "0 -> 1 -> 3 -> 5", bottleneck_capacity: 4, total_flow: 4 },
      memoryTrace: [
        { address: "REG_PTR0", label: "ptr[0]", value: 0, isCacheHit: true },
        {
          address: "EDGE_0x01",
          label: "cap[0][1]",
          value: "6 -> 2",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "EDGE_0x13",
          label: "cap[1][3]",
          value: "4 -> 0 (Saturated)",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "EDGE_0x35",
          label: "cap[3][5]",
          value: "5 -> 1",
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "Blocking Flow Invariant: Every augmentation saturates at least one critical edge",
      stageLabel: "Stage 2: Dinic Algorithm with Level Graph & Blocking Flows",
    },
    {
      stepNumber: 3,
      title: "Residual Capacity & Back-Edge Reflection",
      description:
        "Residual graph updates: forward edge cap[1][3] is saturated (0 capacity), while reverse back-edge cap[3][1] receives +4 residual capacity, enabling flow redirection.",
      codeLine: 24,
      codeSnippet: "cap[u][v] -= pushed; cap[v][u] += pushed",
      variables: { forward_edge_1_3: 0, back_edge_3_1: 4, flow_pushed: 4 },
      memoryTrace: [
        { address: "EDGE_0x13", label: "cap[1][3]", value: 0, isDirty: true, isCacheHit: true },
        {
          address: "EDGE_0x31",
          label: "cap[3][1] (Back)",
          value: 4,
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant: "Skew Symmetry Invariant: c_f(u, v) + c_f(v, u) = c(u, v) + c(v, u)",
      stageLabel: "Stage 2: Dinic Algorithm with Level Graph & Blocking Flows",
    },
    {
      stepNumber: 4,
      title: "Max-Flow Convergence & Min-Cut S-T Partition Extraction",
      description:
        "BFS fails to reach sink T (level[T] = -1). Max-Flow = 14. BFS reachability from S identifies Min-Cut partition: S_cut = {0, 1}, T_cut = {2, 3, 4, 5} with cut capacity exactly 14.",
      codeLine: 32,
      codeSnippet: "if level[t] == -1: return extract_min_cut(s, level)",
      variables: { max_flow: 14, min_cut_capacity: 14, s_cut: [0, 1], t_cut: [2, 3, 4, 5] },
      memoryTrace: [
        { address: "REG_MAXFLOW", label: "Total Max-Flow", value: 14, isCacheHit: true },
        { address: "REG_MINCUT", label: "Min-Cut Capacity", value: 14, isCacheHit: true },
      ],
      activeInvariant: "Max-Flow Min-Cut Theorem (Ford-Fulkerson 1956): max |f| = min c(S, T)",
      stageLabel: "Stage 2: Dinic Algorithm with Level Graph & Blocking Flows",
    },
  ];
}

/**
 * Specialized visual step generator for Advanced Range Queries (Fenwick, SegTree, Lazy).
 */
function generateAdvancedRangeQueriesSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Fenwick Tree LSB Dyadic Jump Point Update",
      description:
        "Point update at index i = 3 (0b0011) with value +5. Fenwick LSB dyadic jumps: i += i & (-i). Updates index 3 (3 + 1 = 4 / 0b0100) and index 4 (4 + 4 = 8 / 0b1000).",
      codeLine: 4,
      codeSnippet: "while idx <= n: tree[idx] += delta; idx += idx & (-idx)",
      variables: { update_index: 3, delta: 5, path_indices: [3, 4, 8] },
      memoryTrace: [
        { address: "TREE_0x03", label: "tree[3]", value: "+5", isDirty: true, isCacheHit: true },
        { address: "TREE_0x04", label: "tree[4]", value: "+5", isDirty: true, isCacheHit: true },
        { address: "TREE_0x08", label: "tree[8]", value: "+5", isDirty: true, isCacheHit: true },
      ],
      activeInvariant: "Fenwick Coverage Invariant: Node i stores sum over range (i - (i & -i), i]",
      stageLabel: "Stage 2: Fenwick Tree (Binary Indexed Tree)",
    },
    {
      stepNumber: 2,
      title: "Segment Tree Canonical Interval Bisection",
      description:
        "Query range [1, 6] on segment tree of size N = 8. Root interval [0, 7] bisects into [1, 3] on left child [0, 3] and [4, 6] on right child [4, 7].",
      codeLine: 12,
      codeSnippet:
        "mid = (l + r) >> 1\nreturn query(2*u, l, mid, ql, qr) + query(2*u+1, mid+1, r, ql, qr)",
      variables: { query_l: 1, query_r: 6, left_segment: "[1, 3]", right_segment: "[4, 6]" },
      memoryTrace: [
        { address: "NODE_0x01", label: "Root [0..7]", value: "Bisect", isCacheHit: true },
        { address: "NODE_0x02", label: "Left [0..3]", value: "Match [1..3]", isCacheHit: true },
        { address: "NODE_0x03", label: "Right [4..7]", value: "Match [4..6]", isCacheHit: true },
      ],
      activeInvariant:
        "Canonical Interval Decomposition: Any [L, R] decomposes into <= 2*ceil(log2 N) nodes",
      stageLabel: "Stage 3: Segment Tree with Lazy Propagation",
    },
    {
      stepNumber: 3,
      title: "Lazy Tag Deferred Push-Down Propagation",
      description:
        "Applying range addition update [2, 5] += 10. Node [2, 3] fully covered: stores lazy += 10, value += 10 * 2 = 20 without visiting children. Deferred push-down executed on demand.",
      codeLine: 20,
      codeSnippet:
        "if ql <= l and r <= qr: lazy[u] += val; tree[u] += val * (r - l + 1); return\npush_down(u, l, r)",
      variables: { lazy_val: 10, node_range: "[2, 3]", length: 2, tree_delta: 20 },
      memoryTrace: [
        { address: "LAZY_0x02", label: "lazy[2]", value: 10, isDirty: true, isCacheHit: true },
        { address: "TREE_0x02", label: "tree[2]", value: 45, isDirty: true, isCacheHit: true },
      ],
      activeInvariant:
        "Lazy Invariant: tree[u] is always accurate for queries; children updated lazily",
      stageLabel: "Stage 3: Segment Tree with Lazy Propagation",
    },
  ];
}

/**
 * Specialized visual step generator for Tree Fundamentals (AVL Rotations).
 */
function generateTreeFundamentalsSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "BST Insertion & AVL Balance Factor Violation",
      description:
        "Inserting key 25 into subtree rooted at 30 (left: 20, left-right: 25). Balance factor at node 30 becomes h_left - h_right = 2 - 0 = +2 (Left-Heavy Violation). Left child 20 has BF = -1 -> Left-Right (LR) Case.",
      codeLine: 4,
      codeSnippet:
        "balance = get_height(node.left) - get_height(node.right)\nif balance > 1 and key > node.left.val: return rotate_left_right(node)",
      variables: { root: 30, inserted: 25, bf_root: 2, bf_left_child: -1, case: "Left-Right (LR)" },
      memoryTrace: [
        {
          address: "NODE_0x30",
          label: "Node 30",
          value: "BF = +2 (VIOLATION)",
          isDirty: true,
          isCacheHit: true,
        },
        { address: "NODE_0x20", label: "Node 20", value: "BF = -1", isCacheHit: true },
        { address: "NODE_0x25", label: "Node 25", value: "BF = 0", isCacheHit: true },
      ],
      activeInvariant:
        "AVL Height Invariant: Balance Factor BF(v) in {-1, 0, +1} (Violation detected: BF=+2)",
      stageLabel: "Stage 2: Self-Balancing AVL Tree",
    },
    {
      stepNumber: 2,
      title: "LR Double Rotation Phase 1 (Left Rotate Child 20)",
      description:
        "Executing left rotation on child node 20. Node 25 becomes the left child of 30, and node 20 becomes the left child of 25. Transforms LR case into pure LL case.",
      codeLine: 12,
      codeSnippet: "node.left = rotate_left(node.left)",
      variables: { intermediate_root: 30, intermediate_left: 25, intermediate_left_left: 20 },
      memoryTrace: [
        {
          address: "PTR_0x30_L",
          label: "30.left",
          value: "PTR(25)",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "PTR_0x25_L",
          label: "25.left",
          value: "PTR(20)",
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant: "BST In-Order Preserved: 20 < 25 < 30 invariant holds throughout rotation",
      stageLabel: "Stage 2: Self-Balancing AVL Tree",
    },
    {
      stepNumber: 3,
      title: "LR Double Rotation Phase 2 (Right Rotate Root 30) & Recalibration",
      description:
        "Executing right rotation on root 30. Node 25 becomes the new balanced subtree root (left child: 20, right child: 30). Balance factors recalibrated to 0.",
      codeLine: 16,
      codeSnippet: "new_root = rotate_right(node); update_height(node); update_height(new_root)",
      variables: { new_root: 25, left_child: 20, right_child: 30, bf_new_root: 0, height: 2 },
      memoryTrace: [
        { address: "NODE_0x25", label: "New Root 25", value: "BF = 0", isCacheHit: true },
        { address: "NODE_0x20", label: "Left 20", value: "BF = 0", isCacheHit: true },
        { address: "NODE_0x30", label: "Right 30", value: "BF = 0", isCacheHit: true },
      ],
      activeInvariant: "Fibonacci Minimal-Node Bound: AVL Height H <= 1.4404 * log2(N + 2) - 0.328",
      stageLabel: "Stage 2: Self-Balancing AVL Tree",
    },
  ];
}

/**
 * Specialized visual step generator for Geometry & Sweep Line (Andrew's Monotone Chain).
 */
function generateGeometrySweepLineSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Coordinate Sorting & Lower Hull Stack Init",
      description:
        "Sorting 2D point cloud lexicographically by x-coordinate (tie-breaking by y). P1(0, 0), P2(1, 2), P3(2, 1), P4(3, 3). Initializing lower hull stack with P1 and P2.",
      codeLine: 3,
      codeSnippet:
        "points.sort((a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y)\nhull = [points[0], points[1]]",
      variables: {
        points_sorted: ["(0,0)", "(1,2)", "(2,1)", "(3,3)"],
        stack: ["P1(0,0)", "P2(1,2)"],
      },
      memoryTrace: [
        { address: "STACK_0x00", label: "hull[0]", value: "P1(0,0)", isCacheHit: true },
        { address: "STACK_0x01", label: "hull[1]", value: "P2(1,2)", isCacheHit: true },
      ],
      activeInvariant: "Lexicographical Monotonicity: x_1 <= x_2 <= ... <= x_N",
      stageLabel: "Stage 2: Andrew's Monotone Chain Convex Hull",
    },
    {
      stepNumber: 2,
      title: "2D Cross Product CCW Turn Violation & Point Stack Popping",
      description:
        "Testing candidate point P3(2, 1) against top of stack (P1 -> P2). Cross product (x2-x1)(y3-y1) - (y2-y1)(x3-x1) = (1)(1) - (2)(2) = -3 <= 0 (Clockwise Turn Violation!). Pop P2(1, 2) from stack.",
      codeLine: 8,
      codeSnippet:
        "while len(hull) >= 2 and cross(hull[-2], hull[-1], p) <= 0: hull.pop()\nhull.push(p)",
      variables: {
        cross_product: -3,
        turn: "Clockwise (Invalid)",
        popped: "P2(1,2)",
        pushed: "P3(2,1)",
      },
      memoryTrace: [
        { address: "REG_CROSS", label: "Cross Product", value: -3, isCacheHit: true },
        {
          address: "STACK_0x01",
          label: "hull[1]",
          value: "P3(2,1) (Replaced)",
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "Counter-Clockwise (CCW) Invariant: All consecutive triples satisfy Cross(A, B, C) > 0",
      stageLabel: "Stage 2: Andrew's Monotone Chain Convex Hull",
    },
    {
      stepNumber: 3,
      title: "Upper Hull Sweep & Convex Polygon Closure",
      description:
        "Reverse sweep from right to left (P4 -> P1) constructs upper hull. Lower and upper chains merge to produce complete convex hull polygon in O(N log N) time.",
      codeLine: 16,
      codeSnippet: "return hull_lower[:-1] + hull_upper[:-1]",
      variables: { total_hull_vertices: 3, hull_points: ["(0,0)", "(2,1)", "(3,3)"] },
      memoryTrace: [
        { address: "POLY_0x00", label: "Vertex 0", value: "(0,0)", isCacheHit: true },
        { address: "POLY_0x01", label: "Vertex 1", value: "(2,1)", isCacheHit: true },
        { address: "POLY_0x02", label: "Vertex 2", value: "(3,3)", isCacheHit: true },
      ],
      activeInvariant: "Convex Hull Optimality: Minimal convex polygon enclosing all N points",
      stageLabel: "Stage 2: Andrew's Monotone Chain Convex Hull",
    },
  ];
}

/**
 * Specialized visual step generator for Sliding Window (Monotonic Deque).
 */
function generateSlidingWindowSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Monotonic Decreasing Deque Tail Eviction",
      description:
        "Processing array [1, 3, -1, -3, 5, 3, 6, 7] with window K = 3. Incoming element A[1] = 3. Since A[1] >= A[deque.tail] (3 >= 1), element 1 will never be the maximum in any future window. Evict index 0 from tail.",
      codeLine: 5,
      codeSnippet: "while deque and nums[i] >= nums[deque[-1]]: deque.pop()\ndeque.append(i)",
      variables: { i: 1, incoming: 3, evicted_tail: 0, deque: [1] },
      memoryTrace: [
        { address: "DEQUE_TAIL", label: "deque.pop()", value: "Index 0 Evicted", isCacheHit: true },
        {
          address: "DEQUE_0x00",
          label: "deque[0]",
          value: "Index 1 (Val=3)",
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "Monotonic Invariant: Values in deque strictly decrease: nums[D[0]] > nums[D[1]] > ...",
      stageLabel: "Stage 3: Monotonic Deque Sliding Window Maximum",
    },
    {
      stepNumber: 2,
      title: "Window Slide & Stale Head Invalidation",
      description:
        "Window slides to index i = 4 (A[4] = 5). Window boundary is [2, 4]. Check deque head D[0]: if D[0] < i - K + 1 = 4 - 3 + 1 = 2, evict stale index from head.",
      codeLine: 10,
      codeSnippet: "if deque[0] < i - k + 1: deque.popleft()",
      variables: { i: 4, window_left: 2, window_right: 4, stale_head: "Evicted if < 2" },
      memoryTrace: [
        { address: "DEQUE_HEAD", label: "deque[0]", value: "Index 4 (Val=5)", isCacheHit: true },
      ],
      activeInvariant: "Active Window Invariant: Deque head D[0] always lies within [i - K + 1, i]",
      stageLabel: "Stage 3: Monotonic Deque Sliding Window Maximum",
    },
    {
      stepNumber: 3,
      title: "Window Maximum Extraction in O(1) Amortized Time",
      description:
        "Output maximum for current window [2, 4] is directly available at deque head: nums[deque[0]] = 5. Total runtime is strictly O(N) since each index is pushed and popped at most once.",
      codeLine: 14,
      codeSnippet: "if i >= k - 1: results.append(nums[deque[0]])",
      variables: { current_max: 5, total_elements_processed: 5, amortized_cost_per_elem: "O(1)" },
      memoryTrace: [
        { address: "OUT_0x02", label: "results[2]", value: 5, isDirty: true, isCacheHit: true },
      ],
      activeInvariant:
        "Amortized Potential Invariant: Total deque pushes + pops <= 2N => O(N) total",
      stageLabel: "Stage 3: Monotonic Deque Sliding Window Maximum",
    },
  ];
}

/**
 * Specialized visual step generator for Ring-AllReduce Collective (ML Distributed).
 */
function generateRingAllReduceSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Buffer Partitioning & Ring Topology Initialization",
      description:
        "Partitioning gradient tensor T of size N = 4MB across P = 4 GPUs into equal chunks C0, C1, C2, C3 (1MB each). Logical ring connected over NVLink: GPU 0 -> 1 -> 2 -> 3 -> 0.",
      codeLine: 4,
      codeSnippet:
        "chunks = partition(tensor, num_gpus=4); next_rank = (rank + 1) % 4; prev_rank = (rank - 1 + 4) % 4",
      variables: { P: 4, tensor_size_mb: 4, chunk_size_mb: 1, topology: "0 -> 1 -> 2 -> 3 -> 0" },
      memoryTrace: [
        { address: "GPU0_MEM", label: "GPU 0 Chunks", value: "[C0, C1, C2, C3]", isCacheHit: true },
        { address: "GPU1_MEM", label: "GPU 1 Chunks", value: "[C0, C1, C2, C3]", isCacheHit: true },
        { address: "GPU2_MEM", label: "GPU 2 Chunks", value: "[C0, C1, C2, C3]", isCacheHit: true },
        { address: "GPU3_MEM", label: "GPU 3 Chunks", value: "[C0, C1, C2, C3]", isCacheHit: true },
      ],
      activeInvariant:
        "Ring Nearest-Neighbor Invariant: GPU p communicates exclusively with GPU (p+1)%P",
      stageLabel: "Stage 3: Baidu 2-Phase Ring-AllReduce Collective",
    },
    {
      stepNumber: 2,
      title: "Scatter-Reduce Phase (P - 1 Ring Shifts)",
      description:
        "Executing P - 1 = 3 communication steps. In each step, GPU p sends chunk (p - step) % P to successor and accumulates incoming chunk into local buffer. At end, GPU p holds the complete global sum of chunk p.",
      codeLine: 12,
      codeSnippet:
        "for step in range(P - 1):\n  send(chunk[(rank - step) % P], next_rank)\n  recv_and_add(chunk[(rank - step - 1) % P], prev_rank)",
      variables: { phase: "Scatter-Reduce", steps_completed: 3, transferred_mb: "3MB per GPU" },
      memoryTrace: [
        {
          address: "GPU0_C0",
          label: "GPU 0 Chunk 0",
          value: "SUM(C0_all)",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "GPU1_C1",
          label: "GPU 1 Chunk 1",
          value: "SUM(C1_all)",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "GPU2_C2",
          label: "GPU 2 Chunk 2",
          value: "SUM(C2_all)",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "GPU3_C3",
          label: "GPU 3 Chunk 3",
          value: "SUM(C3_all)",
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "Scatter-Reduce Invariant: GPU p accumulates full reduction of chunk p after P-1 steps",
      stageLabel: "Stage 3: Baidu 2-Phase Ring-AllReduce Collective",
    },
    {
      stepNumber: 3,
      title: "All-Gather Phase (P - 1 Ring Shifts) & Global Synchronization",
      description:
        "Executing P - 1 = 3 all-gather steps. GPU p transmits its fully reduced chunk p around the ring to overwrite stale chunks on other GPUs. Output tensor is fully replicated across all P GPUs.",
      codeLine: 20,
      codeSnippet:
        "for step in range(P - 1):\n  send(chunk[(rank - step + 1) % P], next_rank)\n  recv_and_overwrite(chunk[(rank - step) % P], prev_rank)",
      variables: { total_network_transfer: "2 * (P - 1)/P * N = 6MB", bandwidth_optimal: true },
      memoryTrace: [
        {
          address: "GPU0_ALL",
          label: "GPU 0 Tensor",
          value: "Fully Synchronized",
          isCacheHit: true,
        },
        {
          address: "GPU1_ALL",
          label: "GPU 1 Tensor",
          value: "Fully Synchronized",
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "Bandwidth Optimality: Network volume 2*(P-1)/P * N is independent of cluster size P",
      stageLabel: "Stage 3: Baidu 2-Phase Ring-AllReduce Collective",
    },
  ];
}

/**
 * Specialized visual step generator for PagedAttention & CoW (vLLM Engine).
 */
function generatePagedAttentionSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Logical Token Slot to Physical Block Allocation",
      description:
        "Sequence S1 generates tokens 0..15. Block size B = 16. Block Table maps Logical Block 0 -> Physical Block 7 in GPU HBM KV cache pool, eliminating 60-80% memory fragmentation.",
      codeLine: 4,
      codeSnippet: "block_table[seq_id].append(allocator.allocate_physical_block())",
      variables: {
        seq_id: "S1",
        logical_block: 0,
        physical_block: 7,
        ref_count: 1,
        block_size: 16,
      },
      memoryTrace: [
        { address: "BLKTBL_S1_0", label: "S1 Logical 0", value: "Phys 7", isCacheHit: true },
        {
          address: "HBM_BLK_07",
          label: "Phys Block 7",
          value: "16 KV Pairs (Ref=1)",
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "Zero Internal Fragmentation: Memory allocated in non-contiguous 16-token physical pages",
      stageLabel: "Stage 2: PagedAttention Block Table Mapping",
    },
    {
      stepNumber: 2,
      title: "Parallel Sampling Fork & Copy-on-Write (CoW) Sharing",
      description:
        "Parallel beam search forks sequence S1 into child S2. Block Table for S2 points to Physical Block 7 with ref_count[7] = 2. Zero physical memory copy during forking.",
      codeLine: 10,
      codeSnippet:
        "block_table[child_seq] = list(block_table[parent_seq])\nfor blk in block_table[child_seq]: ref_count[blk] += 1",
      variables: {
        parent_seq: "S1",
        child_seq: "S2",
        shared_block: 7,
        ref_count_blk7: 2,
        memory_copied_mb: 0,
      },
      memoryTrace: [
        { address: "BLKTBL_S2_0", label: "S2 Logical 0", value: "Phys 7", isCacheHit: true },
        {
          address: "REFCNT_0x07",
          label: "Ref Count [7]",
          value: 2,
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "Prompt Sharing Invariant: Shared prefix consumes O(1) additional GPU memory",
      stageLabel: "Stage 3: Copy-on-Write (CoW) Beam Search & KV Forking",
    },
    {
      stepNumber: 3,
      title: "Token Generation & Physical Block Copy-on-Write Mutation",
      description:
        "Child beam S2 generates token 16, mutating the shared block. Because ref_count[7] > 1, allocator allocates fresh Physical Block 12, copies 16 tokens from Block 7, decrements ref_count[7] = 1, and sets ref_count[12] = 1.",
      codeLine: 18,
      codeSnippet:
        "if ref_count[old_blk] > 1:\n  new_blk = allocator.allocate()\n  copy_block(old_blk, new_blk)\n  ref_count[old_blk] -= 1; block_table[seq][slot] = new_blk",
      variables: { seq_id: "S2", old_block: 7, new_block: 12, ref_count_old: 1, ref_count_new: 1 },
      memoryTrace: [
        {
          address: "BLKTBL_S2_0",
          label: "S2 Logical 0",
          value: "Phys 12 (Forked)",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "HBM_BLK_12",
          label: "Phys Block 12",
          value: "Mutated KV",
          isDirty: true,
          isCacheHit: true,
        },
        {
          address: "REFCNT_0x07",
          label: "Ref Count [7]",
          value: 1,
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant:
        "CoW Isolation Invariant: Unmodified blocks shared indefinitely; mutations strictly isolated",
      stageLabel: "Stage 3: Copy-on-Write (CoW) Beam Search & KV Forking",
    },
  ];
}

/**
 * Specialized visual step generator for HNSW & IVF-PQ (ANN Vector Search).
 */
function generateHNSWSteps(): readonly CourseVisualStep[] {
  return [
    {
      stepNumber: 1,
      title: "Multi-Layer HNSW Skip Graph Greedy Entrypoint Routing",
      description:
        "Query vector q in R^768 enters at top layer L = 3 entrypoint v_top. Greedily traverses long-range Delaunay skip edges to locate local nearest neighbor in O(1) hops per layer.",
      codeLine: 4,
      codeSnippet:
        "curr_node = entry_point\nfor layer in range(max_layer, 0, -1):\n  curr_node = greedy_search_layer(q, curr_node, layer)",
      variables: {
        query_dim: 768,
        entry_layer: 3,
        hops_layer_3: 2,
        hops_layer_2: 3,
        hops_layer_1: 4,
      },
      memoryTrace: [
        { address: "HNSW_L3", label: "Layer 3 Entry", value: "Node 412", isCacheHit: true },
        { address: "HNSW_L2", label: "Layer 2 Entry", value: "Node 88", isCacheHit: true },
        { address: "HNSW_L1", label: "Layer 1 Entry", value: "Node 19", isCacheHit: true },
      ],
      activeInvariant:
        "Logarithmic Zoom-in Routing: Higher layers have exponentially sparser connectivity",
      stageLabel: "Stage 2: Hierarchical Navigable Small World (HNSW)",
    },
    {
      stepNumber: 2,
      title: "Layer 0 Beam Search & Priority Queue Expansion",
      description:
        "Entering base layer L = 0 containing all N points. Maintaining candidate priority queue W of size efSearch = 64. Nearest neighbor exploration terminates when furthest element in W is closer than all unexplored neighbors.",
      codeLine: 12,
      codeSnippet:
        "candidates = PriorityQueue(efSearch=64)\nexpand_neighbors(curr_node, candidates)",
      variables: { layer: 0, efSearch: 64, candidates_evaluated: 64, closest_dist: 0.142 },
      memoryTrace: [
        { address: "PQ_0x00", label: "Top-1 Candidate", value: "Dist = 0.142", isCacheHit: true },
        { address: "PQ_0x3F", label: "Top-64 Candidate", value: "Dist = 0.489", isCacheHit: true },
      ],
      activeInvariant:
        "Small-World Navigability: Clustering coefficient high, average path length O(log N)",
      stageLabel: "Stage 2: Hierarchical Navigable Small World (HNSW)",
    },
    {
      stepNumber: 3,
      title: "IVF-PQ Asymmetric Distance Computation (ADC) Lookup",
      description:
        "Product Quantization: 768-dim vector sliced into M = 96 sub-vectors of 8 dimensions. Asymmetric Distance Computation (ADC) evaluates distance via 96 table lookups in precomputed distance table in < 1 microsecond.",
      codeLine: 20,
      codeSnippet: "dist = sum(lut[m][code[m]] for m in range(M=96))",
      variables: {
        M_subvectors: 96,
        subvec_dim: 8,
        centroids_per_subvec: 256,
        simd_latency_us: 0.8,
      },
      memoryTrace: [
        { address: "LUT_0x00", label: "ADC LUT Subvec 0", value: "Precomputed", isCacheHit: true },
        { address: "SIMD_ACC", label: "AVX-512 Acc", value: "Dist = 0.142", isCacheHit: true },
      ],
      activeInvariant:
        "ADC Invariant: d(q, x) approximated via sum of precomputed sub-centroid distances",
      stageLabel: "Stage 3: Inverted File Product Quantization (IVF-PQ)",
    },
  ];
}

/**
 * Synthesizes visual execution steps dynamically from course metadata and sections.
 */
function synthesizeCourseSteps(
  topicId: string,
  stageIndex: number = 0,
): readonly CourseVisualStep[] {
  const journey = getCourseJourney(topicId);
  if (!journey) return [];

  // 1. Search for CodeProgressionSection
  let codeSection: CodeProgressionSection | undefined;
  let mentalSection: MentalModelSection | undefined;

  for (const chapter of journey.chapters || []) {
    for (const section of chapter.sections || []) {
      if (section.type === "code_progression" && !codeSection) {
        codeSection = section as CodeProgressionSection;
      }
      if (section.type === "mental_model" && !mentalSection) {
        mentalSection = section as MentalModelSection;
      }
    }
    for (const page of chapter.pages || []) {
      for (const section of page.sections || []) {
        if (section.type === "code_progression" && !codeSection) {
          codeSection = section as CodeProgressionSection;
        }
        if (section.type === "mental_model" && !mentalSection) {
          mentalSection = section as MentalModelSection;
        }
      }
    }
  }

  const steps: CourseVisualStep[] = [];
  const activeInvariant =
    mentalSection?.invariant || `Preserve structural invariant for ${journey.title}`;

  if (codeSection && codeSection.stages && codeSection.stages.length > 0) {
    const stageIdx = Math.max(0, Math.min(stageIndex, codeSection.stages.length - 1));
    const stage = codeSection.stages[stageIdx];
    const lines = stage.code.split("\n").filter((l) => l.trim().length > 0);

    // Step 1: Entry & Initialization
    steps.push({
      stepNumber: 1,
      title: `Phase 1: ${stage.label} — Initialization`,
      description:
        stage.explanation || `Initializing ${journey.title} state and validating inputs.`,
      codeLine: 1,
      codeSnippet: lines.slice(0, Math.min(3, lines.length)).join("\n"),
      variables: {
        status: "initialized",
        stage: stageIdx + 1,
        totalStages: codeSection.stages.length,
      },
      memoryTrace: [
        { address: "L1_0x00", label: "State Reg", value: "Initialized", isCacheHit: true },
      ],
      activeInvariant,
      stageLabel: stage.label,
    });

    // Step 2: Algorithmic Core Loop
    const midLine = Math.floor(lines.length / 2);
    steps.push({
      stepNumber: 2,
      title: `Phase 2: ${stage.label} — Core Execution`,
      description:
        mentalSection?.stateTransitions ||
        `Executing core algorithmic transformations for ${journey.title}.`,
      codeLine: Math.max(2, midLine),
      codeSnippet: lines
        .slice(Math.max(0, midLine - 1), Math.min(lines.length, midLine + 3))
        .join("\n"),
      variables: {
        status: "processing",
        optimalInsight: mentalSection?.optimalInsight ? "applied" : "standard",
      },
      memoryTrace: [
        {
          address: "L1_0x04",
          label: "Transition Reg",
          value: "Active",
          isDirty: true,
          isCacheHit: true,
        },
      ],
      activeInvariant,
      stageLabel: stage.label,
    });

    // Step 3: Termination & Convergence
    steps.push({
      stepNumber: 3,
      title: `Phase 3: ${stage.label} — Termination & Verification`,
      description:
        mentalSection?.optimalInsight ||
        `Convergence reached with verified invariants and output guarantees.`,
      codeLine: Math.max(1, lines.length),
      codeSnippet: lines.slice(Math.max(0, lines.length - 3)).join("\n"),
      variables: { status: "completed", verified: true },
      memoryTrace: [
        { address: "L1_0x08", label: "Output Cell", value: "Verified", isCacheHit: true },
      ],
      activeInvariant,
      stageLabel: stage.label,
    });
  } else {
    // Generic high-level fallback steps
    steps.push({
      stepNumber: 1,
      title: "State Initialization",
      description: `Setup computational buffers and boundary invariants for ${journey.title}.`,
      codeLine: 1,
      codeSnippet: `# ${journey.title} Initialization\nstate = initialize()`,
      variables: { initialized: true, topic: journey.id },
      memoryTrace: [{ address: "REG_0x00", label: "Init", value: "Ready", isCacheHit: true }],
      activeInvariant,
      stageLabel: "Foundations Baseline",
    });
    steps.push({
      stepNumber: 2,
      title: "State Transition & Invariant Maintenance",
      description:
        mentalSection?.stateTransitions ||
        `Iteratively updating state while maintaining core invariants.`,
      codeLine: 5,
      codeSnippet: `state = update_state(state, input_data)`,
      variables: { active: true },
      memoryTrace: [
        { address: "REG_0x04", label: "Mut", value: "Step", isDirty: true, isCacheHit: true },
      ],
      activeInvariant,
      stageLabel: "Algorithmic Progression",
    });
    steps.push({
      stepNumber: 3,
      title: "Convergence & Output Materialization",
      description: `Final state evaluated with zero invariant violations.`,
      codeLine: 10,
      codeSnippet: `return finalize_output(state)`,
      variables: { completed: true },
      memoryTrace: [{ address: "REG_0x08", label: "Ret", value: "Done", isCacheHit: true }],
      activeInvariant,
      stageLabel: "Optimized Output",
    });
  }

  return steps;
}

/**
 * Retrieves or builds the interactive course visualizer stepper adapter for a given course topic.
 */
export function getCourseStepperAdapter(topicId: string): CourseStepperAdapter {
  const journey = getCourseJourney(topicId);
  const courseTitle = journey ? journey.title : topicId;

  return {
    topicId,
    courseTitle,
    defaultStagesCount: 3,
    generateSteps: (stageIndex: number = 0, _input?: unknown): readonly CourseVisualStep[] => {
      // Specialized adapters for signature courses
      if (topicId === "ml_flashattention_sram_tiling" || topicId === "flashattention_sram_tiling") {
        return generateFlashAttentionSteps();
      }
      if (topicId === "ml_matrix_memory_layout" || topicId === "matrix_memory_layout") {
        return generateMatrixMemoryLayoutSteps();
      }
      if (topicId === "dsa_binary_search" || topicId === "binary_search") {
        return generateBinarySearchSteps();
      }
      if (topicId === "dsa_graph_flows_and_cuts" || topicId === "graph_flows_and_cuts") {
        return generateDinicFlowsSteps();
      }
      if (topicId === "dsa_advanced_range_queries" || topicId === "advanced_range_queries") {
        return generateAdvancedRangeQueriesSteps();
      }
      if (topicId === "dsa_tree_fundamentals" || topicId === "tree_fundamentals") {
        return generateTreeFundamentalsSteps();
      }
      if (topicId === "dsa_geometry_and_sweep_line" || topicId === "geometry_and_sweep_line") {
        return generateGeometrySweepLineSteps();
      }
      if (topicId === "dsa_sliding_window" || topicId === "sliding_window") {
        return generateSlidingWindowSteps();
      }
      if (topicId === "ml_ring_allreduce_collective" || topicId === "ring_allreduce_collective") {
        return generateRingAllReduceSteps();
      }
      if (topicId === "ml_pagedattention_cow_vllm" || topicId === "pagedattention_cow_vllm") {
        return generatePagedAttentionSteps();
      }
      if (topicId === "ml_ann_hnsw_ivfpq" || topicId === "ann_hnsw_ivfpq") {
        return generateHNSWSteps();
      }

      // Dynamic Synthesis for all other courses
      return synthesizeCourseSteps(topicId, stageIndex);
    },
  };
}

/**
 * Convenience function to directly generate visual steps for any topic.
 */
export function generateCourseSteps(
  topicId: string,
  stageIndex: number = 0,
  input?: unknown,
): readonly CourseVisualStep[] {
  const adapter = getCourseStepperAdapter(topicId);
  return adapter.generateSteps(stageIndex, input);
}
