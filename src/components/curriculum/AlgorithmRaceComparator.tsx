import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
  Flame,
  Gauge,
  Info,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  StepForward,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {
  type BenchmarkDataPoint,
  detectCacheInflectionPoints,
  fitAsymptoticComplexity,
} from "../../curriculum";

export type ScalePoint = 100 | 500 | 1000 | 5000 | 10000 | 50000;
export const SCALE_POINTS: readonly ScalePoint[] = [100, 500, 1000, 5000, 10000, 50000];

export type MatchupId =
  | "dinic_vs_edmonds_karp"
  | "flashattention_vs_standard_attention"
  | "fenwick_vs_segment_tree"
  | "quicksort_vs_mergesort"
  | "pagedattention_vs_contiguous_kv";

export interface CompetitorColorTheme {
  readonly primary: string;
  readonly bg: string;
  readonly border: string;
  readonly text: string;
  readonly bar: string;
  readonly badge: string;
}

export interface CompetitorTelemetry {
  readonly latencyMs: number;
  readonly opsPerSec: number;
  readonly memoryAllocatedBytes: number;
  readonly workingSetBytes: number;
  readonly l1Misses: number;
  readonly l2Misses: number;
  readonly l1MissRatePct: number;
  readonly l2MissRatePct: number;
}

export interface AlgorithmCompetitor {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly category: "DSA" | "ML";
  readonly complexity: string;
  readonly spaceComplexity: string;
  readonly description: string;
  readonly memoryModel: string;
  readonly hardwareBehavior: string;
  readonly colors: CompetitorColorTheme;
  readonly getStepDescription: (progressRatio: number, n: number) => string;
  readonly computeTelemetry: (n: number) => CompetitorTelemetry;
}

export interface RaceMatchupPreset {
  readonly id: MatchupId;
  readonly title: string;
  readonly subtitle: string;
  readonly category: "DSA" | "ML";
  readonly domain: string;
  readonly theoreticalInsight: string;
  readonly competitorA: AlgorithmCompetitor;
  readonly competitorB: AlgorithmCompetitor;
}

export interface RaceSimulationState {
  readonly status: "idle" | "running" | "paused" | "finished";
  readonly progressA: number; // 0 to 100
  readonly progressB: number; // 0 to 100
  readonly stepCount: number;
  readonly finishedA: boolean;
  readonly finishedB: boolean;
  readonly winnerId: string | null;
}

export interface WinnerPodiumResult {
  readonly winnerId: string;
  readonly winnerName: string;
  readonly loserId: string;
  readonly loserName: string;
  readonly speedupFactor: number;
  readonly latencyDeltaMs: number;
  readonly memoryDeltaBytes: number;
  readonly cacheMissDelta: number;
  readonly isTie: boolean;
}

export interface AlgorithmRaceComparatorProps {
  readonly initialMatchupId?: MatchupId;
  readonly initialScaleN?: ScalePoint;
  readonly className?: string;
  readonly onRaceComplete?: (podium: WinnerPodiumResult) => void;
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Matchup Preset Catalog
// ---------------------------------------------------------------------------

export const RACE_MATCHUP_PRESETS: readonly RaceMatchupPreset[] = [
  {
    id: "dinic_vs_edmonds_karp",
    title: "Dinic's Algorithm vs Edmonds-Karp",
    subtitle: "Layered BFS/DFS Blocking Flows vs Shortest Augmenting Path in Max Flow Networks",
    category: "DSA",
    domain: "Network Flow & Graph Theory",
    theoreticalInsight:
      "Dinic constructs a layered level graph via BFS and saturates multiple augmenting paths simultaneously via DFS blocking flows in O(V E) per phase across at most O(V) phases, achieving O(V² E). In contrast, Edmonds-Karp runs a full BFS for every single augmenting path, degrading to O(V E²).",
    competitorA: {
      id: "dinic",
      name: "Dinic's Algorithm",
      shortName: "Dinic O(V² E)",
      category: "DSA",
      complexity: "O(V² E)",
      spaceComplexity: "O(V + E)",
      description: "Layered level graph BFS with DFS blocking flow saturation",
      memoryModel: "Sequential level graph & pointer arrays (compact cache lines)",
      hardwareBehavior:
        "High L1/L2 cache hit rate due to contiguous level graph scans; minimal graph pointer hopping per phase.",
      colors: {
        primary: "cyan",
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
        text: "text-cyan-400",
        bar: "bg-gradient-to-r from-cyan-600 to-cyan-400",
        badge: "bg-cyan-950/60 text-cyan-300 border-cyan-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `BFS constructing layered level graph across |V|=${n} vertices...`;
        if (progressRatio < 0.5)
          return `DFS saturating blocking flows along admissible level graph edges...`;
        if (progressRatio < 0.75)
          return `Pushing residual flow capacities and updating dead-end node markers...`;
        if (progressRatio < 0.99)
          return `Advancing to phase ${Math.min(Math.floor(progressRatio * 10), 8)}: next BFS level DAG...`;
        return `Max flow saturated! Min-cut graph partition verified.`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.04, 0.00015 * Math.pow(n, 1.58));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(n * 24);
        const l1Misses = Math.round(n * 1.2);
        const l2Misses = Math.round(n * 0.25);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 1.8,
          l2MissRatePct: 0.5,
        };
      },
    },
    competitorB: {
      id: "edmonds_karp",
      name: "Edmonds-Karp Algorithm",
      shortName: "Edmonds-Karp O(V E²)",
      category: "DSA",
      complexity: "O(V E²)",
      spaceComplexity: "O(V + E)",
      description: "Shortest augmenting path search via repeated BFS traversals",
      memoryModel: "Full queue allocations and parent pointer backtracking per path",
      hardwareBehavior:
        "High cache miss rate caused by repeated whole-graph BFS sweeps for each single augmenting unit of flow.",
      colors: {
        primary: "rose",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        bar: "bg-gradient-to-r from-rose-600 to-rose-400",
        badge: "bg-rose-950/60 text-rose-300 border-rose-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.3)
          return `Running global BFS traversal from source across |V|=${n} to find single path...`;
        if (progressRatio < 0.65)
          return `Augmenting residual bottleneck capacity along backtracking parent chain...`;
        if (progressRatio < 0.99)
          return `Re-initiating full graph BFS sweep for next augmenting path...`;
        return `No augmenting path found. Max flow terminated.`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.08, 0.00008 * Math.pow(n, 2.38));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(n * 36);
        const l1Misses = Math.round(n * 8.5);
        const l2Misses = Math.round(n * 2.8);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 12.4,
          l2MissRatePct: 4.2,
        };
      },
    },
  },
  {
    id: "flashattention_vs_standard_attention",
    title: "FlashAttention vs Standard Attention",
    subtitle: "IO-Aware SRAM Tiling with Online Softmax vs Naive HBM Matrix Materialization",
    category: "ML",
    domain: "Transformer Architectures & GPU Kernels",
    theoreticalInsight:
      "Standard Attention materializes full N×N intermediate attention matrices in High-Bandwidth Memory (HBM), suffering memory bandwidth bottlenecks. FlashAttention splits Q, K, V into fast on-chip SRAM tiles (e.g., 128KB) and uses online softmax scaling to compute exact attention with O(N) memory IO.",
    competitorA: {
      id: "flashattention",
      name: "FlashAttention (IO-Aware SRAM Tiling)",
      shortName: "FlashAttention O(N² / M_SRAM)",
      category: "ML",
      complexity: "O(N²)",
      spaceComplexity: "O(N)",
      description: "Exact attention via fused GPU kernel with online softmax normalization",
      memoryModel: "Fast on-chip SRAM tile buffers (128 KB) + linear KV streams",
      hardwareBehavior:
        "Memory-bandwidth bound eliminated; achieves >90% GPU tensor core compute roofline utilization.",
      colors: {
        primary: "emerald",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        bar: "bg-gradient-to-r from-emerald-600 to-emerald-400",
        badge: "bg-emerald-950/60 text-emerald-300 border-emerald-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Loading Q, K blocks into on-chip 128KB SRAM tiles for sequence N=${n}...`;
        if (progressRatio < 0.5)
          return `Computing online softmax with running max m(x) and normalization sum l(x)...`;
        if (progressRatio < 0.75)
          return `Multiplying with V tile & rescaling intermediate accumulator in SRAM registers...`;
        if (progressRatio < 0.99)
          return `Writing fused block outputs to HBM without intermediate N×N allocation...`;
        return `Exact FlashAttention complete with minimal HBM read/write traffic!`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.02, 0.00000075 * Math.pow(n, 1.95));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(n * 64 * 4 + 131072); // 256N + 128KB SRAM buffer
        const l1Misses = Math.round(n * 0.8);
        const l2Misses = Math.round(n * 0.15);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 1.2,
          l2MissRatePct: 0.3,
        };
      },
    },
    competitorB: {
      id: "standard_attention",
      name: "Standard Attention (HBM Materialized)",
      shortName: "Standard Attention O(N² HBM)",
      category: "ML",
      complexity: "O(N²)",
      spaceComplexity: "O(N²)",
      description: "Naive matrix multiplication with full N×N intermediate memory buffers",
      memoryModel: "Materialized N×N float32 scores in high-bandwidth memory",
      hardwareBehavior:
        "High memory bus congestion and DRAM cache evictions due to reading and writing quadratic matrices.",
      colors: {
        primary: "amber",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        text: "text-amber-400",
        bar: "bg-gradient-to-r from-amber-600 to-amber-400",
        badge: "bg-amber-950/60 text-amber-300 border-amber-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Allocating ${((Math.pow(n, 2) * 4) / (1024 * 1024)).toFixed(1)} MB intermediate N×N tensor in HBM...`;
        if (progressRatio < 0.5)
          return `Writing unnormalized QK^T matrix to global device memory...`;
        if (progressRatio < 0.75)
          return `Reading full N×N matrix from HBM for row-wise softmax exponentiation...`;
        if (progressRatio < 0.99)
          return `Writing normalized P matrix back to HBM, then reading for V matrix product...`;
        return `Standard attention complete with quadratic memory allocation overhead.`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.08, 0.0000028 * Math.pow(n, 2.05));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(Math.pow(n, 2) * 4); // N^2 * 4 bytes
        const l1Misses = Math.round(n * 15.2);
        const l2Misses = Math.round(n * 5.6);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 22.5,
          l2MissRatePct: 8.7,
        };
      },
    },
  },
  {
    id: "fenwick_vs_segment_tree",
    title: "Fenwick Tree (BIT) vs Segment Tree",
    subtitle: "Compact 1D Array LSB Indexing vs Dynamic Binary Segment Tree",
    category: "DSA",
    domain: "Range Queries & Point Updates",
    theoreticalInsight:
      "Both structures achieve O(log N) point updates and range prefix queries. However, Fenwick Tree uses a single flat array of size N with branchless bitwise index jumps (i += i & -i), yielding ~3-4x lower constant factors and minimal L1/L2 cache misses compared to Segment Tree's 4N heap-like pointer structure.",
    competitorA: {
      id: "fenwick_tree",
      name: "Fenwick Tree (Binary Indexed Tree)",
      shortName: "Fenwick O(log N)",
      category: "DSA",
      complexity: "O(log N)",
      spaceComplexity: "O(N)",
      description: "Flat 1D array indexed by least significant bit (LSB) offsets",
      memoryModel: "Contiguous flat array of exact size N (1x space)",
      hardwareBehavior:
        "High spatial locality; easily fits entirely into L1/L2 CPU caches with zero branch mispredictions.",
      colors: {
        primary: "purple",
        bg: "bg-purple-500/10",
        border: "border-purple-500/30",
        text: "text-purple-400",
        bar: "bg-gradient-to-r from-purple-600 to-purple-400",
        badge: "bg-purple-950/60 text-purple-300 border-purple-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Initializing contiguous 1D array of size N=${n} (working set ${((n * 4) / 1024).toFixed(1)} KB)...`;
        if (progressRatio < 0.5)
          return `Executing point updates via branchless bitwise jumps (i += i & -i)...`;
        if (progressRatio < 0.75)
          return `Evaluating prefix sums with bitwise parent traversal (i -= i & -i)...`;
        if (progressRatio < 0.99)
          return `Resolving interval queries [L, R] = query(R) - query(L-1)...`;
        return `All range queries processed with L1 cache hit rate > 98%!`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.01, 0.000032 * n * Math.log2(Math.max(2, n)));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(n * 4);
        const l1Misses = Math.round(n * 0.45);
        const l2Misses = Math.round(n * 0.08);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 1.5,
          l2MissRatePct: 0.4,
        };
      },
    },
    competitorB: {
      id: "segment_tree",
      name: "Segment Tree",
      shortName: "Segment Tree O(log N)",
      category: "DSA",
      complexity: "O(log N)",
      spaceComplexity: "O(4N)",
      description: "Full binary tree storing aggregated range intervals",
      memoryModel: "4N heap-structured array buffer with child indices 2i and 2i+1",
      hardwareBehavior:
        "4x larger memory footprint triggers earlier L1/L2 cache evictions; child jumps reduce hardware prefetcher efficiency.",
      colors: {
        primary: "indigo",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/30",
        text: "text-indigo-400",
        bar: "bg-gradient-to-r from-indigo-600 to-indigo-400",
        badge: "bg-indigo-950/60 text-indigo-300 border-indigo-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Allocating 4N array buffer ${((4 * n * 4) / 1024).toFixed(1)} KB for binary segment tree...`;
        if (progressRatio < 0.5)
          return `Recursively building tree nodes and aggregating child segment values...`;
        if (progressRatio < 0.75)
          return `Traversing left (2i) and right (2i+1) child intervals during point updates...`;
        if (progressRatio < 0.99)
          return `Splitting overlapping range query queries across tree levels...`;
        return `Segment tree operations complete with higher cache line footprint.`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.035, 0.000115 * n * Math.log2(Math.max(2, n)));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(4 * n * 4); // 4N * 4 bytes
        const l1Misses = Math.round(n * 2.8);
        const l2Misses = Math.round(n * 0.75);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 8.6,
          l2MissRatePct: 2.9,
        };
      },
    },
  },
  {
    id: "quicksort_vs_mergesort",
    title: "QuickSort vs MergeSort",
    subtitle: "In-Place Cache-Friendly Partitioning vs Out-of-Place Auxiliary Merging",
    category: "DSA",
    domain: "Divide-and-Conquer Sorting",
    theoreticalInsight:
      "Both algorithms have O(N log N) scaling. However, in-place QuickSort accesses elements sequentially through L1 cache lines with minimal O(log N) stack frames, whereas MergeSort requires allocating and writing to an auxiliary O(N) buffer during each merge pass, generating higher cache thrashing and memory traffic.",
    competitorA: {
      id: "quicksort",
      name: "QuickSort (In-Place 3-Way Partitioning)",
      shortName: "QuickSort O(N log N)",
      category: "DSA",
      complexity: "O(N log N)",
      spaceComplexity: "O(log N)",
      description: "In-place partitioning with median-of-three pivot selection",
      memoryModel: "In-place array swaps + minimal O(log N) recursive call stack",
      hardwareBehavior:
        "High cache locality from linear scanning; no auxiliary heap buffer allocations.",
      colors: {
        primary: "teal",
        bg: "bg-teal-500/10",
        border: "border-teal-500/30",
        text: "text-teal-400",
        bar: "bg-gradient-to-r from-teal-600 to-teal-400",
        badge: "bg-teal-950/60 text-teal-300 border-teal-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Selecting median-of-three pivot and partitioning sub-arrays for N=${n}...`;
        if (progressRatio < 0.5)
          return `Swapping elements sequentially in-place within L1 cache lines...`;
        if (progressRatio < 0.75)
          return `Recursively partitioning left & right partitions with O(log N) stack...`;
        if (progressRatio < 0.99)
          return `Handling base cases with fast cache-friendly small insertions...`;
        return `Array sorted in-place with zero auxiliary buffer allocation!`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.015, 0.000038 * n * Math.log2(Math.max(2, n)));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(n * 4); // In-place array
        const l1Misses = Math.round(n * 0.6);
        const l2Misses = Math.round(n * 0.12);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: 256, // Stack frames only
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 2.1,
          l2MissRatePct: 0.6,
        };
      },
    },
    competitorB: {
      id: "mergesort",
      name: "MergeSort (Out-of-Place Buffer)",
      shortName: "MergeSort O(N log N)",
      category: "DSA",
      complexity: "O(N log N)",
      spaceComplexity: "O(N)",
      description: "Stable divide-and-conquer sorting with auxiliary merge buffer",
      memoryModel: "Out-of-place secondary scratch array buffer of size N",
      hardwareBehavior:
        "Auxiliary buffer doubles memory working set, evicting cache lines during buffer-to-array copies.",
      colors: {
        primary: "orange",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        text: "text-orange-400",
        bar: "bg-gradient-to-r from-orange-600 to-orange-400",
        badge: "bg-orange-950/60 text-orange-300 border-orange-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Allocating ${((n * 4) / 1024).toFixed(1)} KB auxiliary temporary scratch buffer...`;
        if (progressRatio < 0.5) return `Dividing array into left and right halves recursively...`;
        if (progressRatio < 0.75)
          return `Merging sorted halves into auxiliary buffer with comparison checks...`;
        if (progressRatio < 0.99)
          return `Copying merged elements back to primary array across cache lines...`;
        return `MergeSort complete. Out-of-place buffer released.`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.038, 0.000092 * n * Math.log2(Math.max(2, n)));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(2 * n * 4); // Primary + Auxiliary buffer
        const l1Misses = Math.round(n * 2.4);
        const l2Misses = Math.round(n * 0.65);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: Math.round(n * 4),
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 7.8,
          l2MissRatePct: 2.4,
        };
      },
    },
  },
  {
    id: "pagedattention_vs_contiguous_kv",
    title: "PagedAttention (vLLM) vs Contiguous KV-Cache",
    subtitle: "Virtual Memory Paged Block Tables vs Contiguous Fixed Memory Allocation",
    category: "ML",
    domain: "LLM Serving & Memory Management",
    theoreticalInsight:
      "Contiguous KV-caching preallocates maximum sequence length buffers per request, resulting in 60-80% memory waste from internal and external fragmentation. PagedAttention organizes KV caches into virtual blocks (e.g., 16 tokens), achieving <4% memory waste and zero-copy prompt sharing.",
    competitorA: {
      id: "pagedattention",
      name: "PagedAttention (vLLM Block Tables)",
      shortName: "PagedAttention (Virtual Paging)",
      category: "ML",
      complexity: "O(1) block alloc",
      spaceComplexity: "O(N_actual)",
      description: "Virtual memory paging for non-contiguous key-value cache management",
      memoryModel: "16-token non-contiguous block tables; <4% memory fragmentation",
      hardwareBehavior:
        "High GPU VRAM capacity utilization; eliminates memory reallocation and dynamic tensor movement.",
      colors: {
        primary: "sky",
        bg: "bg-sky-500/10",
        border: "border-sky-500/30",
        text: "text-sky-400",
        bar: "bg-gradient-to-r from-sky-600 to-sky-400",
        badge: "bg-sky-950/60 text-sky-300 border-sky-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Allocating dynamic 16-token virtual page blocks for N=${n} tokens...`;
        if (progressRatio < 0.5)
          return `Mapping logical KV slots to physical GPU block tables with O(1) indexing...`;
        if (progressRatio < 0.75)
          return `Serving multi-sequence concurrent batches with <4% memory fragmentation...`;
        if (progressRatio < 0.99)
          return `Executing non-contiguous block gather attention without tensor reallocation...`;
        return `Batch served with maximum memory efficiency and high concurrency!`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.01, 0.000024 * n);
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(n * 128 * 1.04); // Actual tokens + 4% fragmentation
        const l1Misses = Math.round(n * 0.55);
        const l2Misses = Math.round(n * 0.1);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 1.9,
          l2MissRatePct: 0.5,
        };
      },
    },
    competitorB: {
      id: "contiguous_kv",
      name: "Contiguous KV-Cache (Preallocated)",
      shortName: "Contiguous KV (Static Buffer)",
      category: "ML",
      complexity: "O(N) reallocation",
      spaceComplexity: "O(N_max)",
      description: "Static preallocation of maximum sequence length contiguous tensors",
      memoryModel: "Reserved contiguous tensor buffers with 60-80% wasted headroom",
      hardwareBehavior:
        "High memory fragmentation causes early Out-Of-Memory (OOM) and dynamic reallocations.",
      colors: {
        primary: "rose",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        text: "text-rose-400",
        bar: "bg-gradient-to-r from-rose-600 to-rose-400",
        badge: "bg-rose-950/60 text-rose-300 border-rose-700/50",
      },
      getStepDescription: (progressRatio: number, n: number) => {
        if (progressRatio < 0.25)
          return `Preallocating ${((n * 128 * 3.2) / 1024).toFixed(1)} KB contiguous memory block with padding...`;
        if (progressRatio < 0.5)
          return `Managing 68% wasted memory headroom reserved for max sequence limits...`;
        if (progressRatio < 0.75)
          return `Reallocating and copying tensors when sequence length expands...`;
        if (progressRatio < 0.99)
          return `Suffering memory fragmentation and GC memory compaction pauses...`;
        return `Contiguous batch execution complete with high memory waste penalty.`;
      },
      computeTelemetry: (n: number): CompetitorTelemetry => {
        const latencyMs = Math.max(0.04, 0.000085 * Math.pow(n, 1.18));
        const opsPerSec = Math.max(1, Math.round(1000 / latencyMs));
        const workingSetBytes = Math.round(n * 128 * 3.2); // ~3.2x buffer size with padding
        const l1Misses = Math.round(n * 3.6);
        const l2Misses = Math.round(n * 1.1);
        return {
          latencyMs,
          opsPerSec,
          memoryAllocatedBytes: workingSetBytes,
          workingSetBytes,
          l1Misses,
          l2Misses,
          l1MissRatePct: 11.2,
          l2MissRatePct: 3.8,
        };
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Retrieves a matchup preset by its unique ID.
 */
export function getRaceMatchupPreset(id: string): RaceMatchupPreset {
  const match = RACE_MATCHUP_PRESETS.find((p) => p.id === id);
  return match ?? RACE_MATCHUP_PRESETS[0];
}

/**
 * Computes telemetry for both competitors in a given matchup at a specific scale point N.
 */
export function computeRaceTelemetry(
  preset: RaceMatchupPreset,
  n: number,
): {
  readonly competitorA: CompetitorTelemetry;
  readonly competitorB: CompetitorTelemetry;
} {
  return {
    competitorA: preset.competitorA.computeTelemetry(n),
    competitorB: preset.competitorB.computeTelemetry(n),
  };
}

/**
 * Generates synthetic benchmark data points across all scale points for curve fitting.
 */
export function generateCompetitorDataPoints(
  competitor: AlgorithmCompetitor,
  scalePoints: readonly number[] = SCALE_POINTS,
): BenchmarkDataPoint[] {
  return scalePoints.map((n) => {
    const tel = competitor.computeTelemetry(n);
    return {
      n,
      samplesCount: 10,
      medianTimeMs: tel.latencyMs,
      meanTimeMs: tel.latencyMs * 1.02,
      stdDevMs: tel.latencyMs * 0.03,
      minTimeMs: tel.latencyMs * 0.96,
      maxTimeMs: tel.latencyMs * 1.08,
      opsPerSec: tel.opsPerSec,
      workingSetBytes: tel.workingSetBytes,
    };
  });
}

/**
 * Calculates winner podium metrics and speedup factor.
 */
export function calculateWinnerPodium(
  preset: RaceMatchupPreset,
  telemetryA: CompetitorTelemetry,
  telemetryB: CompetitorTelemetry,
): WinnerPodiumResult {
  const isWinnerA = telemetryA.latencyMs <= telemetryB.latencyMs;
  const isTie = Math.abs(telemetryA.latencyMs - telemetryB.latencyMs) < 1e-6;

  const winner = isWinnerA ? preset.competitorA : preset.competitorB;
  const loser = isWinnerA ? preset.competitorB : preset.competitorA;
  const winnerTel = isWinnerA ? telemetryA : telemetryB;
  const loserTel = isWinnerA ? telemetryB : telemetryA;

  const speedupFactor =
    winnerTel.latencyMs > 0
      ? Math.round((loserTel.latencyMs / winnerTel.latencyMs) * 100) / 100
      : 1.0;

  const latencyDeltaMs = Math.max(0, loserTel.latencyMs - winnerTel.latencyMs);
  const memoryDeltaBytes = Math.max(
    0,
    loserTel.memoryAllocatedBytes - winnerTel.memoryAllocatedBytes,
  );
  const cacheMissDelta = Math.max(
    0,
    loserTel.l1Misses + loserTel.l2Misses - (winnerTel.l1Misses + winnerTel.l2Misses),
  );

  return {
    winnerId: winner.id,
    winnerName: winner.name,
    loserId: loser.id,
    loserName: loser.name,
    speedupFactor,
    latencyDeltaMs: Math.round(latencyDeltaMs * 1000) / 1000,
    memoryDeltaBytes,
    cacheMissDelta,
    isTie,
  };
}

/**
 * Pure simulation function advancing the race by one tick.
 */
export function simulateRaceStep(
  state: RaceSimulationState,
  telemetryA: CompetitorTelemetry,
  telemetryB: CompetitorTelemetry,
  preset: RaceMatchupPreset,
  speedMultiplier: number = 1.0,
): RaceSimulationState {
  if (state.status !== "running" && state.status !== "paused") {
    return state;
  }

  const baseRate = 2.5 * speedMultiplier;
  const isAFaster = telemetryA.latencyMs <= telemetryB.latencyMs;
  const speedRatio =
    Math.min(telemetryA.latencyMs, telemetryB.latencyMs) /
    Math.max(1e-9, Math.max(telemetryA.latencyMs, telemetryB.latencyMs));

  const stepA = isAFaster ? baseRate : baseRate * speedRatio;
  const stepB = isAFaster ? baseRate * speedRatio : baseRate;

  const nextProgressA = Math.min(100, state.progressA + stepA);
  const nextProgressB = Math.min(100, state.progressB + stepB);

  const finishedA = nextProgressA >= 100;
  const finishedB = nextProgressB >= 100;

  let winnerId = state.winnerId;
  if (!winnerId) {
    if (finishedA && !finishedB) {
      winnerId = preset.competitorA.id;
    } else if (finishedB && !finishedA) {
      winnerId = preset.competitorB.id;
    } else if (finishedA && finishedB) {
      winnerId = isAFaster ? preset.competitorA.id : preset.competitorB.id;
    }
  }

  const isComplete = finishedA && finishedB;

  return {
    status: isComplete ? "finished" : state.status,
    progressA: nextProgressA,
    progressB: nextProgressB,
    stepCount: state.stepCount + 1,
    finishedA,
    finishedB,
    winnerId,
  };
}

/**
 * Formats byte values into human-readable strings (B, KB, MB, GB).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Formats latency time into human-readable units (ns, µs, ms, s).
 */
export function formatLatency(ms: number): string {
  if (ms < 0.001) return `${(ms * 1000000).toFixed(0)} ns`;
  if (ms < 1) return `${(ms * 1000).toFixed(1)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Formats operations per second (ops/s, K ops/s, M ops/s).
 */
export function formatOpsPerSec(ops: number): string {
  if (ops < 1000) return `${ops} ops/s`;
  if (ops < 1000000) return `${(ops / 1000).toFixed(1)}K ops/s`;
  return `${(ops / 1000000).toFixed(2)}M ops/s`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const AlgorithmRaceComparator: React.FC<AlgorithmRaceComparatorProps> = ({
  initialMatchupId = "dinic_vs_edmonds_karp",
  initialScaleN = 1000,
  className = "",
  onRaceComplete,
  isOpen,
  onClose,
}) => {
  if (isOpen === false) return null;

  const [selectedMatchupId, setSelectedMatchupId] = useState<MatchupId>(initialMatchupId);
  const [scaleN, setScaleN] = useState<ScalePoint>(initialScaleN);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [showCurveFitDetails, setShowCurveFitDetails] = useState<boolean>(true);

  const [raceState, setRaceState] = useState<RaceSimulationState>({
    status: "idle",
    progressA: 0,
    progressB: 0,
    stepCount: 0,
    finishedA: false,
    finishedB: false,
    winnerId: null,
  });

  const activePreset: RaceMatchupPreset = useMemo(
    () => getRaceMatchupPreset(selectedMatchupId),
    [selectedMatchupId],
  );

  const currentTelemetry = useMemo(
    () => computeRaceTelemetry(activePreset, scaleN),
    [activePreset, scaleN],
  );

  const podiumResult = useMemo(
    () =>
      calculateWinnerPodium(
        activePreset,
        currentTelemetry.competitorA,
        currentTelemetry.competitorB,
      ),
    [activePreset, currentTelemetry],
  );

  // Scalability benchmark data points and curve fits
  const dataPointsA = useMemo(
    () => generateCompetitorDataPoints(activePreset.competitorA),
    [activePreset.competitorA],
  );
  const dataPointsB = useMemo(
    () => generateCompetitorDataPoints(activePreset.competitorB),
    [activePreset.competitorB],
  );

  const curveFitA = useMemo(() => fitAsymptoticComplexity(dataPointsA), [dataPointsA]);
  const curveFitB = useMemo(() => fitAsymptoticComplexity(dataPointsB), [dataPointsB]);

  const cacheInflectionsA = useMemo(() => detectCacheInflectionPoints(dataPointsA), [dataPointsA]);
  const cacheInflectionsB = useMemo(() => detectCacheInflectionPoints(dataPointsB), [dataPointsB]);

  // Handle matchup or scale change
  const handleResetRace = useCallback(() => {
    setRaceState({
      status: "idle",
      progressA: 0,
      progressB: 0,
      stepCount: 0,
      finishedA: false,
      finishedB: false,
      winnerId: null,
    });
  }, []);

  const handleMatchupChange = useCallback(
    (id: MatchupId) => {
      setSelectedMatchupId(id);
      handleResetRace();
    },
    [handleResetRace],
  );

  const handleScaleChange = useCallback(
    (n: ScalePoint) => {
      setScaleN(n);
      handleResetRace();
    },
    [handleResetRace],
  );

  const handleStartRace = useCallback(() => {
    if (raceState.status === "finished") {
      setRaceState({
        status: "running",
        progressA: 0,
        progressB: 0,
        stepCount: 0,
        finishedA: false,
        finishedB: false,
        winnerId: null,
      });
    } else {
      setRaceState((prev) => ({ ...prev, status: "running" }));
    }
  }, [raceState.status]);

  const handlePauseRace = useCallback(() => {
    setRaceState((prev) => ({ ...prev, status: "paused" }));
  }, []);

  const handleStepRace = useCallback(() => {
    setRaceState((prev) => {
      const next = simulateRaceStep(
        { ...prev, status: "running" },
        currentTelemetry.competitorA,
        currentTelemetry.competitorB,
        activePreset,
        speedMultiplier,
      );
      return { ...next, status: next.status === "finished" ? "finished" : "paused" };
    });
  }, [currentTelemetry, activePreset, speedMultiplier]);

  // Race animation timer loop
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (raceState.status === "running") {
      timerRef.current = setInterval(() => {
        setRaceState((prev) => {
          if (prev.status !== "running") return prev;
          const next = simulateRaceStep(
            prev,
            currentTelemetry.competitorA,
            currentTelemetry.competitorB,
            activePreset,
            speedMultiplier,
          );
          if (next.status === "finished" && onRaceComplete) {
            onRaceComplete(podiumResult);
          }
          return next;
        });
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    raceState.status,
    currentTelemetry,
    activePreset,
    speedMultiplier,
    onRaceComplete,
    podiumResult,
  ]);

  const compA = activePreset.competitorA;
  const compB = activePreset.competitorB;
  const telA = currentTelemetry.competitorA;
  const telB = currentTelemetry.competitorB;

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden ${className}`}
      data-testid="algorithm-race-comparator"
    >
      {/* ------------------------------------------------------------------- */}
      {/* Header Bar */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-50">
                Algorithm Race Comparator
              </h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                🏎️ Benchmark Workbench
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  activePreset.category === "DSA"
                    ? "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                    : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                }`}
              >
                {activePreset.category} • {activePreset.domain}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Head-to-head empirical execution race, hardware telemetry profiling, and asymptotic
              curve regression
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Comparator"
            aria-label="Close Comparator"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Matchup Selector Tabs */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-4 bg-slate-900/60 border-b border-slate-800/80">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>Select Matchup Preset</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {RACE_MATCHUP_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedMatchupId;
            return (
              <button
                key={preset.id}
                onClick={() => handleMatchupChange(preset.id)}
                className={`p-3 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-md shadow-cyan-950/30"
                    : "bg-slate-900/80 border-slate-800/80 text-slate-400 hover:bg-slate-850 hover:text-slate-200 hover:border-slate-700"
                }`}
                data-testid={`matchup-button-${preset.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      preset.category === "DSA"
                        ? "bg-purple-900/60 text-purple-300"
                        : "bg-emerald-900/60 text-emerald-300"
                    }`}
                  >
                    {preset.category}
                  </span>
                  {isSelected && <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div className="text-xs font-semibold leading-tight line-clamp-1 text-slate-200">
                  {preset.competitorA.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  vs {preset.competitorB.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Race Control Toolbar & Scale Point Selector */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-4 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        {/* Scale Points Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-slate-300" /> Scale N:
          </span>
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
            {SCALE_POINTS.map((nVal) => (
              <button
                key={nVal}
                onClick={() => handleScaleChange(nVal)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                  scaleN === nVal
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
                data-testid={`scale-button-${nVal}`}
              >
                {nVal >= 1000 ? `${nVal / 1000}K` : nVal}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Speed:</span>
          <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
            {[0.5, 1.0, 2.0, 5.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer ${
                  speedMultiplier === spd
                    ? "bg-slate-700 text-cyan-300 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {raceState.status === "running" ? (
            <button
              onClick={handlePauseRace}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
              data-testid="race-pause-button"
            >
              <Pause className="w-4 h-4 fill-current" /> Pause
            </button>
          ) : (
            <button
              onClick={handleStartRace}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
              data-testid="race-start-button"
            >
              <Play className="w-4 h-4 fill-current" />
              {raceState.status === "paused"
                ? "Resume Race ▶️"
                : raceState.status === "finished"
                  ? "Race Again 🏎️"
                  : "Start Race 🏎️"}
            </button>
          )}

          <button
            onClick={handleStepRace}
            disabled={raceState.status === "finished"}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="Advance Single Step"
            data-testid="race-step-button"
          >
            <StepForward className="w-4 h-4" /> Step
          </button>

          <button
            onClick={handleResetRace}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl border border-slate-700/80 transition-all cursor-pointer"
            title="Reset Race"
            data-testid="race-reset-button"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Racing Lanes & Live Execution Visualizer */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-6 space-y-4 bg-slate-950/80">
        {/* Lane A: Competitor A */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            raceState.winnerId === compA.id && raceState.status === "finished"
              ? "bg-cyan-950/20 border-cyan-500/60 shadow-lg shadow-cyan-950/30"
              : "bg-slate-900/60 border-slate-800/80"
          }`}
          data-testid="lane-competitor-a"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-500/20" />
              <span className="font-bold text-sm text-cyan-300">{compA.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono">
                {compA.complexity}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Aux: {compA.spaceComplexity}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {raceState.progressA.toFixed(1)}%
              </span>
              {raceState.finishedA && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-cyan-500 text-slate-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Finished ({formatLatency(telA.latencyMs)})
                </span>
              )}
            </div>
          </div>

          {/* Track Bar */}
          <div className="relative h-6 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-0.5 flex items-center">
            {/* Striped finish pattern on right end */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-800/60 flex items-center justify-center border-l border-slate-700 z-0">
              <span className="text-xs">🏁</span>
            </div>

            {/* Filled Progress Bar */}
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-400 rounded transition-all duration-75 relative z-10"
              style={{ width: `${Math.max(2, raceState.progressA)}%` }}
            >
              {/* Vehicle Icon on Progress Head */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center w-5 h-5 bg-cyan-300 rounded-full shadow-md text-[11px]">
                🏎️
              </div>
            </div>
          </div>

          {/* Live Step Message */}
          <div className="mt-2 text-xs text-slate-400 font-mono flex items-center gap-1.5 truncate">
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-slate-300">
              {compA.getStepDescription(raceState.progressA / 100, scaleN)}
            </span>
          </div>
        </div>

        {/* Lane B: Competitor B */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            raceState.winnerId === compB.id && raceState.status === "finished"
              ? "bg-rose-950/20 border-rose-500/60 shadow-lg shadow-rose-950/30"
              : "bg-slate-900/60 border-slate-800/80"
          }`}
          data-testid="lane-competitor-b"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400 ring-4 ring-rose-500/20" />
              <span className="font-bold text-sm text-rose-300">{compB.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-400 font-mono">
                {compB.complexity}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Aux: {compB.spaceComplexity}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-rose-300 font-bold">
                {raceState.progressB.toFixed(1)}%
              </span>
              {raceState.finishedB && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-slate-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Finished ({formatLatency(telB.latencyMs)})
                </span>
              )}
            </div>
          </div>

          {/* Track Bar */}
          <div className="relative h-6 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 p-0.5 flex items-center">
            {/* Striped finish pattern on right end */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-800/60 flex items-center justify-center border-l border-slate-700 z-0">
              <span className="text-xs">🏁</span>
            </div>

            {/* Filled Progress Bar */}
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 rounded transition-all duration-75 relative z-10"
              style={{ width: `${Math.max(2, raceState.progressB)}%` }}
            >
              {/* Vehicle Icon on Progress Head */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex items-center justify-center w-5 h-5 bg-rose-300 rounded-full shadow-md text-[11px]">
                {telB.latencyMs > telA.latencyMs ? "🐢" : "🏎️"}
              </div>
            </div>
          </div>

          {/* Live Step Message */}
          <div className="mt-2 text-xs text-slate-400 font-mono flex items-center gap-1.5 truncate">
            <ChevronRight className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-slate-300">
              {compB.getStepDescription(raceState.progressB / 100, scaleN)}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Winner Podium & Asymptotic Speedup Banner */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={`p-5 mx-6 mb-4 rounded-xl border transition-all ${
          raceState.status === "finished"
            ? "bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-500/50 shadow-xl"
            : "bg-slate-900/40 border-slate-800/60"
        }`}
        data-testid="winner-podium"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {raceState.status === "finished"
                    ? "Winner Crowned"
                    : "Theoretical & Real-Time Projection"}
                </span>
                <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-amber-400 text-slate-950">
                  ⚡ {podiumResult.speedupFactor.toFixed(2)}x Speedup
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">
                {podiumResult.winnerName} takes 1st place!
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[10px]">TIME SAVED</div>
              <div className="font-bold text-emerald-400">
                - {formatLatency(podiumResult.latencyDeltaMs)}
              </div>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[10px]">MEMORY SAVED</div>
              <div className="font-bold text-cyan-400">
                - {formatBytes(podiumResult.memoryDeltaBytes)}
              </div>
            </div>
            <div className="bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800">
              <div className="text-slate-400 text-[10px]">CACHE MISSES REDUCED</div>
              <div className="font-bold text-purple-400">
                - {podiumResult.cacheMissDelta.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Telemetry Grid */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-6 bg-slate-900/30 border-t border-slate-800/80">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Live Hardware & Execution Telemetry (N = {scaleN.toLocaleString()})</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Latency Meter */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Latency
                </span>
                <span className="font-mono text-[11px]">Lower is better</span>
              </div>
              <div className="space-y-2 mt-2">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cyan-400">{compA.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {formatLatency(telA.latencyMs)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(10, (telA.latencyMs / Math.max(telA.latencyMs, telB.latencyMs)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-rose-400">{compB.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {formatLatency(telB.latencyMs)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(10, (telB.latencyMs / Math.max(telA.latencyMs, telB.latencyMs)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Throughput Meter */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> Throughput
                </span>
                <span className="font-mono text-[11px]">Higher is better</span>
              </div>
              <div className="space-y-2 mt-2">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cyan-400">{compA.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {formatOpsPerSec(telA.opsPerSec)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(10, (telA.opsPerSec / Math.max(telA.opsPerSec, telB.opsPerSec)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-rose-400">{compB.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {formatOpsPerSec(telB.opsPerSec)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(10, (telB.opsPerSec / Math.max(telA.opsPerSec, telB.opsPerSec)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Memory Allocation Footprint */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-sky-400" /> Memory Working Set
                </span>
                <span className="font-mono text-[11px]">Lower is better</span>
              </div>
              <div className="space-y-2 mt-2">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cyan-400">{compA.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {formatBytes(telA.workingSetBytes)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(8, (telA.workingSetBytes / Math.max(telA.workingSetBytes, telB.workingSetBytes)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-rose-400">{compB.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {formatBytes(telB.workingSetBytes)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(8, (telB.workingSetBytes / Math.max(telA.workingSetBytes, telB.workingSetBytes)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* L1 / L2 Cache Misses */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> L1/L2 Cache Misses
                </span>
                <span className="font-mono text-[11px]">Miss Rate %</span>
              </div>
              <div className="space-y-2 mt-2">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-cyan-400">{compA.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {telA.l1MissRatePct}%{" "}
                      <span className="text-[10px] text-slate-500">({telA.l1Misses} L1)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded"
                      style={{ width: `${Math.min(100, telA.l1MissRatePct * 3)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-rose-400">{compB.shortName}</span>
                    <span className="text-slate-200 font-bold">
                      {telB.l1MissRatePct}%{" "}
                      <span className="text-[10px] text-slate-500">({telB.l1Misses} L1)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-rose-400 rounded"
                      style={{ width: `${Math.min(100, telB.l1MissRatePct * 3)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Asymptotic Curve Fitting & Hardware Insights Panel */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-6 bg-slate-900/50 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-slate-200">
              Asymptotic Log-Log Curve Regression & Hardware Bounds
            </h4>
          </div>
          <button
            onClick={() => setShowCurveFitDetails((prev) => !prev)}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer"
          >
            {showCurveFitDetails ? "Collapse Details" : "Expand Details"}
          </button>
        </div>

        {showCurveFitDetails && (
          <div className="space-y-4">
            {/* Dual Curve Fit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Competitor A Curve Fit */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">{compA.name}</span>
                  <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Fitted: {curveFitA.complexityClass}
                  </span>
                </div>
                <div className="text-xs font-mono space-y-1 text-slate-300">
                  <div>
                    <span className="text-slate-500">Model:</span> {curveFitA.modelEquations.fitted}
                  </div>
                  <div>
                    <span className="text-slate-500">Log-Log Slope (α):</span>{" "}
                    <span className="font-bold text-cyan-400">
                      {curveFitA.logLogSlope.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Goodness-of-Fit (R²):</span>{" "}
                    <span className="font-bold text-emerald-400">
                      {curveFitA.rSquared.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-300">Hardware Profile:</span>{" "}
                  {compA.hardwareBehavior}
                </div>
              </div>

              {/* Competitor B Curve Fit */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-300">{compB.name}</span>
                  <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Fitted: {curveFitB.complexityClass}
                  </span>
                </div>
                <div className="text-xs font-mono space-y-1 text-slate-300">
                  <div>
                    <span className="text-slate-500">Model:</span> {curveFitB.modelEquations.fitted}
                  </div>
                  <div>
                    <span className="text-slate-500">Log-Log Slope (α):</span>{" "}
                    <span className="font-bold text-rose-400">
                      {curveFitB.logLogSlope.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Goodness-of-Fit (R²):</span>{" "}
                    <span className="font-bold text-emerald-400">
                      {curveFitB.rSquared.toFixed(4)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="font-semibold text-slate-300">Hardware Profile:</span>{" "}
                  {compB.hardwareBehavior}
                </div>
              </div>
            </div>

            {/* Cache Inflection Alerts if any */}
            {(cacheInflectionsA.length > 0 || cacheInflectionsB.length > 0) && (
              <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300 mb-0.5">
                    Hardware Cache Inflection Boundary Detected:
                  </div>
                  <div className="space-y-1 text-amber-200/90 font-mono text-[11px]">
                    {cacheInflectionsA.map((c, i) => (
                      <div key={`inf-a-${i}`}>
                        • {compA.shortName}: Crossed {c.boundaryType} cache threshold at N=
                        {c.crossedAtN} ({formatBytes(c.workingSetBytes)})
                      </div>
                    ))}
                    {cacheInflectionsB.map((c, i) => (
                      <div key={`inf-b-${i}`}>
                        • {compB.shortName}: Crossed {c.boundaryType} cache threshold at N=
                        {c.crossedAtN} ({formatBytes(c.workingSetBytes)})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Theoretical Insight Commentary */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Theoretical vs Empirical Architectural Insight
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activePreset.theoreticalInsight}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
