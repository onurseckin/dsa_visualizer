import React, { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCanvasBox, boxViewBox, viewBoxAttr } from "../primitives/vizGeometry";

export interface MLInfraNode {
  id: string;
  level: number;
  type: "level" | "algorithm";
  title: string;
  categoryFolder: string;
  categoryLabel: string;
  algorithmId: string;
  description: string;
  prerequisites: string[];
  keyEquations: string[];
  concepts: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  x: number;
  y: number;
}

export const ML_INFRA_NODES: MLInfraNode[] = [
  {
    id: "level-1",
    level: 1,
    type: "level",
    title: "Level 1: Memory Layout & Indexing",
    categoryFolder: "ml_infra",
    categoryLabel: "Memory & Layout",
    algorithmId: "tensor-stride-offset",
    description: "Multi-dimensional tensor strides, row-major NCHW/NHWC memory offsets, and indexing arithmetic.",
    prerequisites: [],
    keyEquations: ["Offset = \\sum_{d=0}^{D-1} i_d \\cdot s_d", "s_d = \\prod_{k=d+1}^{D-1} \\text{shape}[k]"],
    concepts: ["Row-Major Strides", "Memory Contiguity", "Tensor Views & Slicing"],
    difficulty: "Easy",
    x: 240,
    y: 100,
  },
  {
    id: "tensor-stride-offset",
    level: 1,
    type: "algorithm",
    title: "Tensor Stride & Offset Layout",
    categoryFolder: "ml_infra",
    categoryLabel: "Memory & Layout",
    algorithmId: "tensor-stride-offset",
    description: "Flat 1D linear memory buffer offset calculation for 4D tensors.",
    prerequisites: ["level-1"],
    keyEquations: ["Offset = i_N s_0 + i_C s_1 + i_H s_2 + i_W s_3"],
    concepts: ["NCHW Stride Vector", "Out-of-Bounds Check", "Zero-Copy Transposition"],
    difficulty: "Easy",
    x: 240,
    y: 210,
  },
  {
    id: "level-2",
    level: 2,
    type: "level",
    title: "Level 2: Automatic Differentiation",
    categoryFolder: "ml_infra",
    categoryLabel: "Autograd & DAGs",
    algorithmId: "autograd-vjp-dag",
    description: "Reverse-mode automatic differentiation via Vector-Jacobian Product (VJP) computation DAGs.",
    prerequisites: ["level-1"],
    keyEquations: ["v_x = J_f^T \\cdot v_y", "v_i = \\sum_{j \\in \\text{children}} \\frac{\\partial f_j}{\\partial x_i} v_j"],
    concepts: ["Reverse-Mode AD", "Vector-Jacobian Product", "Topological Sort Execution"],
    difficulty: "Medium",
    x: 700,
    y: 100,
  },
  {
    id: "autograd-vjp-dag",
    level: 2,
    type: "algorithm",
    title: "Autograd VJP DAG",
    categoryFolder: "ml_infra",
    categoryLabel: "Autograd & DAGs",
    algorithmId: "autograd-vjp-dag",
    description: "Backpropagation on computational graphs accumulating gradients.",
    prerequisites: ["level-2"],
    keyEquations: ["\\frac{\\partial L}{\\partial x} = \\frac{\\partial L}{\\partial y} \\cdot \\frac{\\partial y}{\\partial x}"],
    concepts: ["Node Backward Closures", "Grad Accumulation", "In-Degree Topological Sort"],
    difficulty: "Medium",
    x: 700,
    y: 210,
  },
  {
    id: "level-3",
    level: 3,
    type: "level",
    title: "Level 3: Memory-Efficient Kernels",
    categoryFolder: "ml_infra",
    categoryLabel: "Kernels & Fusion",
    algorithmId: "fused-softmax-lse",
    description: "Numerical stability and kernel fusion for Softmax and Log-Sum-Exp (LSE) without HBM passes.",
    prerequisites: ["level-2"],
    keyEquations: ["m_{new} = \\max(m_{old}, x_i)", "LSE = m + \\ln \\sum_i e^{x_i - m}"],
    concepts: ["Online Softmax", "LSE Trick", "SRAM Kernel Fusion"],
    difficulty: "Medium",
    x: 1160,
    y: 100,
  },
  {
    id: "fused-softmax-lse",
    level: 3,
    type: "algorithm",
    title: "Fused Softmax & LSE",
    categoryFolder: "ml_infra",
    categoryLabel: "Kernels & Fusion",
    algorithmId: "fused-softmax-lse",
    description: "Single-pass online softmax and LSE computation.",
    prerequisites: ["level-3"],
    keyEquations: ["Softmax(x)_i = \\frac{e^{x_i - m}}{\\sum e^{x_j - m}}"],
    concepts: ["Numerical Overflow Avoidance", "Single-Pass Normalization", "SRAM Cache Reuse"],
    difficulty: "Medium",
    x: 1160,
    y: 210,
  },
  {
    id: "level-4",
    level: 4,
    type: "level",
    title: "Level 4: Vector Search & Indexing",
    categoryFolder: "ml_infra",
    categoryLabel: "Vector Search",
    algorithmId: "hnsw-vector-search",
    description: "Hierarchical Navigable Small World graphs for fast approximate nearest neighbor (ANN) vector search.",
    prerequisites: ["level-3"],
    keyEquations: ["d(q, v) = \\sqrt{\\sum (q_i - v_i)^2}", "P(l) = \\lfloor -\\ln(\\text{unif}) \\cdot m_L \\rfloor"],
    concepts: ["Hierarchical Skip-Graphs", "Greedy Routing", "Beam Search Entry Points"],
    difficulty: "Hard",
    x: 1160,
    y: 370,
  },
  {
    id: "hnsw-vector-search",
    level: 4,
    type: "algorithm",
    title: "HNSW Vector Search",
    categoryFolder: "ml_infra",
    categoryLabel: "Vector Search",
    algorithmId: "hnsw-vector-search",
    description: "Multi-layer graph traversal for nearest neighbor vector queries.",
    prerequisites: ["level-4"],
    keyEquations: ["v_{next} = \\arg\\min_{u \\in N(v)} d(q, u)"],
    concepts: ["Layer Probability Scaling", "Small World Connectivity", "Vector Distance Metrics"],
    difficulty: "Hard",
    x: 1160,
    y: 480,
  },
  {
    id: "level-5",
    level: 5,
    type: "level",
    title: "Level 5: Tokenization & Encoding",
    categoryFolder: "ml_infra",
    categoryLabel: "Tokenization",
    algorithmId: "bpe-tokenizer",
    description: "Byte-Pair Encoding (BPE) subword tokenization, vocabulary building, and greedy pair merging.",
    prerequisites: ["level-4"],
    keyEquations: ["(p^*, q^*) = \\arg\\max_{(p,q)} \\text{freq}(p, q)"],
    concepts: ["Subword Vocabularies", "Iterative Merging", "Rank-Based Encoding"],
    difficulty: "Easy",
    x: 700,
    y: 370,
  },
  {
    id: "bpe-tokenizer",
    level: 5,
    type: "algorithm",
    title: "BPE Tokenizer",
    categoryFolder: "ml_infra",
    categoryLabel: "Tokenization",
    algorithmId: "bpe-tokenizer",
    description: "Greedy subword tokenization and pair compression.",
    prerequisites: ["level-5"],
    keyEquations: ["w_{merged} = \\text{replace}(w, (p^*, q^*), p^*q^*)"],
    concepts: ["Pair Frequency Table", "Vocabulary Compression", "Token ID Mapping"],
    difficulty: "Easy",
    x: 700,
    y: 480,
  },
  {
    id: "level-6",
    level: 6,
    type: "level",
    title: "Level 6: Conv Tiling & Im2col",
    categoryFolder: "ml_infra",
    categoryLabel: "Convolutions & Tiling",
    algorithmId: "im2col-conv-tiling",
    description: "Lowering convolutions to matrix multiplication via im2col unrolling and cache-aware tiling.",
    prerequisites: ["level-5"],
    keyEquations: ["Y_{out} = W_{mat} \\cdot X_{im2col}", "X_{im2col} \\in \\mathbb{R}^{(C \\cdot K_h \\cdot K_w) \\times (H_{out} \\cdot W_{out})}"],
    concepts: ["Im2col Unrolling", "GEMM Conv Lowering", "L1/L2 Cache Tiling"],
    difficulty: "Medium",
    x: 240,
    y: 370,
  },
  {
    id: "im2col-conv-tiling",
    level: 6,
    type: "algorithm",
    title: "Im2col Conv Tiling",
    categoryFolder: "ml_infra",
    categoryLabel: "Convolutions & Tiling",
    algorithmId: "im2col-conv-tiling",
    description: "Image-to-column layout transformation and GEMM tiling.",
    prerequisites: ["level-6"],
    keyEquations: ["h_{out} = \\lfloor \\frac{h + 2p - k}{s} \\rfloor + 1"],
    concepts: ["Memory Footprint Overhead", "Kernel Receptive Field", "Tiled Matrix Multiply"],
    difficulty: "Medium",
    x: 240,
    y: 480,
  },
  {
    id: "level-7",
    level: 7,
    type: "level",
    title: "Level 7: FlashAttention Tiling",
    categoryFolder: "ml_infra",
    categoryLabel: "Attention & Kernels",
    algorithmId: "flash-attention-tiling",
    description: "IO-aware exact attention tiling with SRAM block loading and online softmax rescaling.",
    prerequisites: ["level-6"],
    keyEquations: ["S_{ij} = Q_i K_j^T / \\sqrt{d}", "O_i^{(j)} = \\frac{l_i^{(j-1)} O_i^{(j-1)} + e^{S_{ij} - m_i^{(j)}} V_j}{l_i^{(j)}}"],
    concepts: ["IO-Aware SRAM Tiling", "Online Softmax Rescaling", "Zero HBM Intermediate Write"],
    difficulty: "Hard",
    x: 240,
    y: 640,
  },
  {
    id: "flash-attention-tiling",
    level: 7,
    type: "algorithm",
    title: "FlashAttention Tiling",
    categoryFolder: "ml_infra",
    categoryLabel: "Attention & Kernels",
    algorithmId: "flash-attention-tiling",
    description: "Block-wise matrix multiplication and attention accumulation.",
    prerequisites: ["level-7"],
    keyEquations: ["m_i^{(j)} = \\max(m_i^{(j-1)}, \\max(S_{ij}))"],
    concepts: ["Block Size Q_block/K_block", "Forward Pass SRAM Accumulator", "Backward Recomputation"],
    difficulty: "Hard",
    x: 240,
    y: 750,
  },
  {
    id: "level-8",
    level: 8,
    type: "level",
    title: "Level 8: Quantization & Outliers",
    categoryFolder: "ml_infra",
    categoryLabel: "Quantization",
    algorithmId: "smoothquant-scaling",
    description: "INT8 W8A8 quantization with SmoothQuant outlier migration from activations to weights.",
    prerequisites: ["level-7"],
    keyEquations: ["Y = (X \\cdot \\text{diag}(s)^{-1}) \\cdot (\\text{diag}(s) \\cdot W)", "s_j = \\frac{\\max_i |X_{ij}|^0.5}{\\max_k |W_{jk}|^{0.5}}"],
    concepts: ["W8A8 Quantization", "Activation Outlier Migration", "Per-Channel Smoothing Scale"],
    difficulty: "Hard",
    x: 700,
    y: 640,
  },
  {
    id: "smoothquant-scaling",
    level: 8,
    type: "algorithm",
    title: "SmoothQuant Scaling",
    categoryFolder: "ml_infra",
    categoryLabel: "Quantization",
    algorithmId: "smoothquant-scaling",
    description: "Migration of activation channel outliers to weight channels.",
    prerequisites: ["level-8"],
    keyEquations: ["q(X) = \\text{clamp}\\left(\\text{round}\\left(\\frac{X}{S}\\right), -128, 127\\right)"],
    concepts: ["Outlier Migration Alpha", "Channel-Wise Quantization Scale", "Int8 Tensor Core GEMM"],
    difficulty: "Hard",
    x: 700,
    y: 750,
  },
  {
    id: "level-9",
    level: 9,
    type: "level",
    title: "Level 9: Distributed Communication",
    categoryFolder: "ml_infra",
    categoryLabel: "Distributed Systems",
    algorithmId: "ring-allreduce-partition",
    description: "Ring-AllReduce bandwidth-optimal distributed gradient synchronization across cluster GPUs.",
    prerequisites: ["level-8"],
    keyEquations: ["Transfer = 2 \\cdot \\frac{N-1}{N} \\cdot V", "T_{\\text{comm}} = 2(N-1) \\left(\\alpha + \\frac{V/N}{\\beta}\\right)"],
    concepts: ["Scatter-Reduce Phase", "All-Gather Phase", "Ring Topology Communication"],
    difficulty: "Hard",
    x: 1160,
    y: 640,
  },
  {
    id: "ring-allreduce-partition",
    level: 9,
    type: "algorithm",
    title: "Ring-AllReduce",
    categoryFolder: "ml_infra",
    categoryLabel: "Distributed Systems",
    algorithmId: "ring-allreduce-partition",
    description: "Partitioned ring buffer reduce & gather communication.",
    prerequisites: ["level-9"],
    keyEquations: ["chunk_i^{(step+1)} = chunk_i^{(step)} + recvd\\_chunk"],
    concepts: ["Peer-to-Peer Ring Step", "Gradient Chunk Partitioning", "Cluster Interconnect Utilization"],
    difficulty: "Hard",
    x: 1160,
    y: 750,
  },
  {
    id: "level-10",
    level: 10,
    type: "level",
    title: "Level 10: LLM Serving & Scheduling",
    categoryFolder: "ml_infra",
    categoryLabel: "Serving & Scheduling",
    algorithmId: "continuous-batching-scheduler",
    description: "Continuous (iteration-level) batching, PagedAttention KV memory allocation, and preemptive request scheduling.",
    prerequisites: ["level-9"],
    keyEquations: ["Throughput = \\frac{\\sum N_{\\text{tokens}}}{\\sum T_{\\text{step}}}", "Block\\_Count = \\lceil \\frac{\\text{seq\\_len}}{\\text{block\\_size}} \\rceil"],
    concepts: ["Iteration-Level Batching", "PagedAttention Block Table", "Prefill vs Decode Execution"],
    difficulty: "Hard",
    x: 700,
    y: 910,
  },
  {
    id: "continuous-batching-scheduler",
    level: 10,
    type: "algorithm",
    title: "Continuous Batching",
    categoryFolder: "ml_infra",
    categoryLabel: "Serving & Scheduling",
    algorithmId: "continuous-batching-scheduler",
    description: "Dynamic request insertion and memory-aware scheduling.",
    prerequisites: ["level-10"],
    keyEquations: ["Free\\_Blocks_{t+1} = Free\\_Blocks_t - \\Delta Active"],
    concepts: ["Iteration Step Loop", "KV Cache Memory Management", "Request Arrival Queue"],
    difficulty: "Hard",
    x: 700,
    y: 1020,
  },
];

export interface MLInfraKnowledgeGraphProps {
  onSelectCategoryFolder?: (folder: string) => void;
  onNavigateToAlgorithm?: (algorithmId: string) => void;
}

export const MLInfraKnowledgeGraph: React.FC<MLInfraKnowledgeGraphProps> = ({
  onSelectCategoryFolder,
  onNavigateToAlgorithm,
}) => {
  let navigate: ((opts: { to: string; params?: Record<string, string> }) => void) | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const [selectedLevel, setSelectedLevel] = useState<number>(0); // 0 = all
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>("level-1");

  const { ref, box } = useCanvasBox({ width: 1400, height: 1150 });
  const viewBox = boxViewBox(box);
  const viewBoxString = viewBoxAttr(viewBox);

  const nodeMap = useMemo(() => {
    const map = new Map<string, MLInfraNode>();
    ML_INFRA_NODES.forEach((n) => map.set(n.id, n));
    return map;
  }, []);

  const activeHoverOrSelectedId = hoveredNodeId || activeNodeId;
  const currentInspectNode = activeHoverOrSelectedId ? nodeMap.get(activeHoverOrSelectedId) : null;

  const handleNodeClick = (node: MLInfraNode) => {
    setActiveNodeId(node.id);
    if (onNavigateToAlgorithm && node.algorithmId) {
      onNavigateToAlgorithm(node.algorithmId);
    } else if (navigate && node.algorithmId) {
      navigate({ to: "/workspace/$algorithmId", params: { algorithmId: node.algorithmId } });
    } else if (onSelectCategoryFolder && node.categoryFolder) {
      onSelectCategoryFolder(node.categoryFolder);
    } else if (typeof window !== "undefined" && node.algorithmId) {
      window.location.href = `/workspace/${node.algorithmId}`;
    }
  };

  const getDifficultyColor = (diff: "Easy" | "Medium" | "Hard") => {
    switch (diff) {
      case "Easy":
        return {
          bg: "bg-[var(--bg-inset)]",
          border: "border-emerald-500/40",
          text: "text-emerald-400",
          stroke: "#10b981",
        };
      case "Medium":
        return {
          bg: "bg-[var(--bg-inset)]",
          border: "border-amber-500/40",
          text: "text-amber-400",
          stroke: "#f59e0b",
        };
      case "Hard":
        return {
          bg: "bg-[var(--bg-inset)]",
          border: "border-rose-500/40",
          text: "text-rose-400",
          stroke: "#f43f5e",
        };
    }
  };

  const levelCategories = [
    "All Levels",
    "L1: Memory & Layout",
    "L2: Autograd VJP",
    "L3: Fused Kernels",
    "L4: Vector Search",
    "L5: Tokenization",
    "L6: Conv Tiling",
    "L7: FlashAttention",
    "L8: Quantization",
    "L9: Distributed",
    "L10: LLM Scheduling",
  ];

  return (
    <div
      role="region"
      aria-label="Interactive Machine Learning Infrastructure Roadmap"
      className="w-full flex flex-col items-center justify-center mx-auto gap-6 relative"
    >
      {/* Header & Filter Bar */}
      <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-default)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-[var(--accent)] animate-pulse" />
              Machine Learning Infrastructure Systems Roadmap
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-3xl">
              10-level hierarchical prerequisite tree spanning GPU memory indexing, autograd DAGs, fused kernels, vector indexing, attention tiling, quantization, ring-allreduce, and LLM continuous batching.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">
              Filter Level:
            </span>
          </div>
        </div>

        {/* Level Filter Buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {levelCategories.map((label, idx) => {
            const isSelected = selectedLevel === idx;
            return (
              <button
                key={label}
                type="button"
                role="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedLevel(idx)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? "bg-[var(--accent)] text-black border-[var(--accent)] font-bold shadow-md"
                    : "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Node Hover/Focus Info Card */}
      {currentInspectNode && (
        <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-accent)] rounded-2xl p-5 shadow-2xl relative text-left flex flex-col md:flex-row gap-6 transition-all duration-300">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--accent)]">
                Level {currentInspectNode.level}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-inset)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                {currentInspectNode.categoryLabel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  getDifficultyColor(currentInspectNode.difficulty).border
                } ${getDifficultyColor(currentInspectNode.difficulty).text}`}
              >
                {currentInspectNode.difficulty}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mt-1">
              {currentInspectNode.title}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {currentInspectNode.description}
            </p>
            {currentInspectNode.prerequisites.length > 0 && (
              <div className="text-xs text-[var(--text-muted)] mt-1">
                <span className="font-semibold text-[var(--text-secondary)]">Prerequisites: </span>
                {currentInspectNode.prerequisites
                  .map((pId) => nodeMap.get(pId)?.title || pId)
                  .join(" → ")}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-between gap-3 bg-[var(--bg-inset)] p-4 rounded-xl border border-[var(--border-default)]">
            <div>
              <div className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Core Concepts & Key Equations
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {currentInspectNode.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  >
                    {concept}
                  </span>
                ))}
              </div>
              <div className="space-y-1">
                {currentInspectNode.keyEquations.map((eq, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-mono bg-[var(--bg-surface)] text-[var(--accent)] px-3 py-1.5 rounded border border-[var(--border-default)] overflow-x-auto"
                  >
                    {eq}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleNodeClick(currentInspectNode)}
              className="w-full mt-2 py-2 px-4 rounded-xl text-xs font-bold bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--accent)] hover:bg-[var(--accent)] hover:text-black transition-all duration-200 cursor-pointer text-center"
            >
              Visualize {currentInspectNode.algorithmId} in Workspace →
            </button>
          </div>
        </div>
      )}

      {/* SVG Hierarchical Tree Canvas following Canvas Law */}
      <div
        ref={ref}
        className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-4 shadow-2xl relative overflow-hidden mx-auto"
        style={{ minHeight: "750px" }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={viewBoxString}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto max-w-full mx-auto block relative z-0"
        >
          <defs>
            <marker
              id="ml-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border-accent)" />
            </marker>
            <marker
              id="ml-arrow-dim"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border-default)" />
            </marker>
          </defs>

          {/* Render Connections */}
          {ML_INFRA_NODES.map((node) => {
            return node.prerequisites.map((pId) => {
              const parent = nodeMap.get(pId);
              if (!parent) return null;

              const isDimmed =
                selectedLevel > 0 &&
                node.level !== selectedLevel &&
                parent.level !== selectedLevel;

              const isParentChild = parent.level === node.level;

              let d = "";
              if (isParentChild) {
                // Vertical parent level to child algorithm connection
                d = `M ${parent.x} ${parent.y + 27} L ${node.x} ${node.y - 24}`;
              } else if (parent.y === node.y) {
                // Horizontal connection on same tier
                const startX = parent.x < node.x ? parent.x + 115 : parent.x - 115;
                const endX = parent.x < node.x ? node.x - 115 : node.x + 115;
                d = `M ${startX} ${parent.y} L ${endX} ${node.y}`;
              } else {
                // Multi-tier connection (curved path)
                const startY = parent.y + (isParentChild ? 27 : 27);
                const endY = node.y - 27;
                const midY = (startY + endY) / 2;
                d = `M ${parent.x} ${startY} C ${parent.x} ${midY}, ${node.x} ${midY}, ${node.x} ${endY}`;
              }

              return (
                <path
                  key={`${pId}->${node.id}`}
                  d={d}
                  fill="none"
                  stroke={isDimmed ? "var(--border-default)" : "var(--border-accent)"}
                  strokeWidth={isDimmed ? 1.5 : 2.5}
                  strokeDasharray={isParentChild ? "4,4" : undefined}
                  markerEnd={isDimmed ? "url(#ml-arrow-dim)" : "url(#ml-arrow)"}
                  className="transition-all duration-300"
                  opacity={isDimmed ? 0.3 : 0.85}
                />
              );
            });
          })}

          {/* Render Nodes */}
          {ML_INFRA_NODES.map((node) => {
            const isHovered = hoveredNodeId === node.id;
            const isActive = activeNodeId === node.id;
            const isSelectedLevel = selectedLevel === 0 || node.level === selectedLevel;
            const diffColor = getDifficultyColor(node.difficulty);

            const width = node.type === "level" ? 230 : 210;
            const height = node.type === "level" ? 54 : 48;
            const halfW = width / 2;
            const halfH = height / 2;

            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={`${node.title}. Level ${node.level}. ${node.categoryLabel}. Difficulty ${node.difficulty}. Click to view details or navigate.`}
                transform={`translate(${node.x - halfW}, ${node.y - halfH})`}
                onClick={() => handleNodeClick(node)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleNodeClick(node);
                  }
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onFocus={() => {
                  setHoveredNodeId(node.id);
                  setActiveNodeId(node.id);
                }}
                onBlur={() => setHoveredNodeId(null)}
                style={{
                  cursor: "pointer",
                  outline: "none",
                  opacity: isSelectedLevel ? 1 : 0.3,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <rect
                  width={width}
                  height={height}
                  rx={node.type === "level" ? 14 : 10}
                  fill={
                    node.type === "level"
                      ? isHovered || isActive
                        ? "var(--bg-surface)"
                        : "var(--bg-inset)"
                      : isHovered || isActive
                        ? "var(--bg-inset)"
                        : "var(--bg-surface)"
                  }
                  stroke={
                    isHovered || isActive
                      ? "var(--border-accent)"
                      : node.type === "level"
                        ? "var(--accent)"
                        : "var(--border-default)"
                  }
                  strokeWidth={isHovered || isActive ? 2.5 : node.type === "level" ? 2 : 1.5}
                  style={{
                    filter:
                      isHovered || isActive
                        ? "drop-shadow(0 8px 16px rgba(59, 130, 246, 0.3))"
                        : "drop-shadow(0 2px 6px rgba(0,0,0,0.4))",
                  }}
                />

                {node.type === "level" ? (
                  <>
                    <text
                      x={halfW}
                      y={22}
                      textAnchor="middle"
                      fill={isHovered || isActive ? "var(--accent)" : "var(--text-primary)"}
                      className="font-bold text-[13px]"
                    >
                      {node.title}
                    </text>
                    <text
                      x={halfW}
                      y={40}
                      textAnchor="middle"
                      fill="var(--text-muted)"
                      className="font-mono text-[11px]"
                    >
                      {node.categoryLabel}
                    </text>
                  </>
                ) : (
                  <>
                    <text
                      x={halfW}
                      y={20}
                      textAnchor="middle"
                      fill={isHovered || isActive ? "var(--text-primary)" : "var(--text-secondary)"}
                      className="font-semibold text-[12px]"
                    >
                      ⚡ {node.title}
                    </text>
                    <text
                      x={halfW}
                      y={36}
                      textAnchor="middle"
                      fill={diffColor.stroke}
                      className="font-mono text-[10px] font-bold"
                    >
                      {node.algorithmId} • {node.difficulty}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default MLInfraKnowledgeGraph;
