import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Cpu,
  Layers,
  HardDrive,
  Zap,
  Code,
  ShieldCheck,
  Activity,
  Check,
  Copy,
  Sliders,
  Box,
  Flame,
  Sparkles,
  Database,
} from "lucide-react";

// ============================================================================
// 1. Types & Constants
// ============================================================================

export type DType = "fp32" | "fp16" | "bf16" | "fp8" | "int8";

export const DTYPE_SIZES: Record<DType, number> = {
  fp32: 4,
  fp16: 2,
  bf16: 2,
  fp8: 1,
  int8: 1,
};

export const DTYPE_NAMES: Record<DType, string> = {
  fp32: "FP32 (4 Bytes)",
  fp16: "FP16 (2 Bytes)",
  bf16: "BF16 (2 Bytes)",
  fp8: "FP8 E4M3 (1 Byte)",
  int8: "INT8 (1 Byte)",
};

export type FusionMode = "unfused" | "inductor_fused" | "triton_fused";

export type AllocationStrategy = "naive_linear" | "greedy_size" | "first_fit" | "best_fit";

export type AlignmentBytes = 64 | 128 | 256 | 512;

export type WorkloadPresetId =
  | "transformer_mha"
  | "swiglu_mlp"
  | "fused_layernorm_gelu"
  | "flash_attention_2"
  | "conv_bn_relu";

export interface TensorNode {
  id: string;
  name: string;
  producerOp: string;
  consumerOps: string[];
  shape: number[];
  shapeStr: string;
  numElements: number;
  sizeBytes: number;
  startStep: number;
  endStep: number;
  isInput?: boolean;
  isOutput?: boolean;
  isWeight?: boolean;
  isIntermediate?: boolean;
  isEliminatedByFusion: boolean;
  category: "input" | "weight" | "activation" | "workspace" | "output";
  colorHex: string;
}

export interface OperatorStep {
  stepIndex: number;
  name: string;
  opType: string;
  inputs: string[];
  outputs: string[];
  sramBytes: number;
  dramReadBytes: number;
  dramWriteBytes: number;
  kernelCount: number;
  description: string;
  isFused: boolean;
}

export interface WorkloadConfig {
  batchSize: number;
  seqLen: number;
  hiddenDim: number;
  intermediateDim?: number;
  numHeads?: number;
  spatialH?: number;
  spatialW?: number;
  channels?: number;
  dtype: DType;
  alignment: AlignmentBytes;
  fusionMode: FusionMode;
  allocationStrategy: AllocationStrategy;
}

export interface WorkloadGraph {
  id: WorkloadPresetId;
  name: string;
  tensors: TensorNode[];
  steps: OperatorStep[];
  totalSteps: number;
  eagerCode: string;
  inductorCode: string;
  tritonCode: string;
}

export interface AllocatedBlock {
  tensorId: string;
  tensorName: string;
  offset: number;
  sizeBytes: number;
  rawSizeBytes: number;
  startStep: number;
  endStep: number;
  color: string;
  category: "input" | "weight" | "activation" | "workspace" | "output";
  isEliminatedByFusion: boolean;
}

export interface InterferenceViolation {
  tensorA: string;
  tensorB: string;
  overlapRange: [number, number];
  temporalOverlap: [number, number];
}

export interface AllocationResult {
  blocks: AllocatedBlock[];
  peakMemoryBytes: number;
  totalArenaCapacityBytes: number;
  baselinePeakMemoryBytes: number;
  peakMemoryReductionPercent: number;
  totalDramTrafficBytes: number;
  baselineDramTrafficBytes: number;
  dramTrafficReductionPercent: number;
  totalKernelLaunches: number;
  baselineKernelLaunches: number;
  kernelLaunchReductionPercent: number;
  fragmentationPercent: number;
  activeTensorsAtStep: (step: number) => AllocatedBlock[];
  activeMemoryAtStep: (step: number) => number;
  isDisjoint: boolean;
  disjointnessViolations: InterferenceViolation[];
}

export interface WorkloadPreset {
  id: WorkloadPresetId;
  name: string;
  category: string;
  badge: string;
  description: string;
  defaultBatchSize: number;
  defaultSeqLen: number;
  defaultHiddenDim: number;
  defaultNumHeads?: number;
  defaultIntermediateDim?: number;
  spatialH?: number;
  spatialW?: number;
  channels?: number;
  buildWorkload: (config: WorkloadConfig) => WorkloadGraph;
}

// ============================================================================
// 2. Formatting & Math Helpers
// ============================================================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatElements(num: number): string {
  if (num < 1000) return `${num}`;
  if (num < 1000000) return `${(num / 1000).toFixed(1)}k`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(2)}M`;
  return `${(num / 1000000000).toFixed(2)}B`;
}

export function alignOffset(offset: number, alignment: number): number {
  if (alignment <= 0) return offset;
  return Math.ceil(offset / alignment) * alignment;
}

export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
): boolean {
  return Math.max(startA, startB) <= Math.min(endA, endB);
}

export function memoryRangesOverlap(
  offsetA: number,
  sizeA: number,
  offsetB: number,
  sizeB: number,
): boolean {
  return offsetA < offsetB + sizeB && offsetB < offsetA + sizeA;
}

export function verifyInterferenceDisjointness(blocks: AllocatedBlock[]): {
  isValid: boolean;
  violations: InterferenceViolation[];
} {
  const activeBlocks = blocks.filter((b) => !b.isEliminatedByFusion && b.sizeBytes > 0);
  const violations: InterferenceViolation[] = [];

  for (let i = 0; i < activeBlocks.length; i++) {
    for (let j = i + 1; j < activeBlocks.length; j++) {
      const a = activeBlocks[i];
      const b = activeBlocks[j];

      // Check temporal interference: do lifetimes overlap?
      if (intervalsOverlap(a.startStep, a.endStep, b.startStep, b.endStep)) {
        // Must NOT overlap in memory arena!
        if (memoryRangesOverlap(a.offset, a.sizeBytes, b.offset, b.sizeBytes)) {
          const overlapStart = Math.max(a.offset, b.offset);
          const overlapEnd = Math.min(a.offset + a.sizeBytes, b.offset + b.sizeBytes);
          violations.push({
            tensorA: a.tensorName,
            tensorB: b.tensorName,
            overlapRange: [overlapStart, overlapEnd],
            temporalOverlap: [Math.max(a.startStep, b.startStep), Math.min(a.endStep, b.endStep)],
          });
        }
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

// ============================================================================
// 3. Memory Arena Allocator Algorithms
// ============================================================================

export function allocateMemoryArena(
  tensors: TensorNode[],
  strategy: AllocationStrategy,
  alignment: AlignmentBytes = 128,
): AllocatedBlock[] {
  const activeTensors = tensors.filter((t) => !t.isEliminatedByFusion);
  if (activeTensors.length === 0) {
    return tensors.map((t) => ({
      tensorId: t.id,
      tensorName: t.name,
      offset: 0,
      sizeBytes: 0,
      rawSizeBytes: t.sizeBytes,
      startStep: t.startStep,
      endStep: t.endStep,
      color: t.colorHex,
      category: t.category,
      isEliminatedByFusion: t.isEliminatedByFusion,
    }));
  }

  const placedBlocks: AllocatedBlock[] = [];

  if (strategy === "naive_linear") {
    // Sequential placement without any buffer reuse
    let currentOffset = 0;
    const sorted = [...activeTensors].sort(
      (a, b) => a.startStep - b.startStep || a.id.localeCompare(b.id),
    );

    for (const t of sorted) {
      const alignedSize = alignOffset(t.sizeBytes, alignment);
      placedBlocks.push({
        tensorId: t.id,
        tensorName: t.name,
        offset: currentOffset,
        sizeBytes: alignedSize,
        rawSizeBytes: t.sizeBytes,
        startStep: t.startStep,
        endStep: t.endStep,
        color: t.colorHex,
        category: t.category,
        isEliminatedByFusion: false,
      });
      currentOffset += alignedSize;
    }
  } else if (strategy === "greedy_size") {
    // Sort tensors by size descending (largest buffers placed first in optimal disjoint offsets)
    const sorted = [...activeTensors].sort(
      (a, b) => b.sizeBytes - a.sizeBytes || a.startStep - b.startStep || a.id.localeCompare(b.id),
    );

    for (const t of sorted) {
      const alignedSize = alignOffset(t.sizeBytes, alignment);
      const interferingBlocks = placedBlocks.filter((b) =>
        intervalsOverlap(t.startStep, t.endStep, b.startStep, b.endStep),
      );

      // Collect candidate aligned offsets
      const candidateOffsetsSet = new Set<number>([0]);
      for (const b of interferingBlocks) {
        candidateOffsetsSet.add(alignOffset(b.offset + b.sizeBytes, alignment));
      }
      const candidates = Array.from(candidateOffsetsSet).sort((a, b) => a - b);

      // Find lowest candidate offset with no spatial collision
      let chosenOffset = 0;
      for (const cand of candidates) {
        const hasCollision = interferingBlocks.some((b) =>
          memoryRangesOverlap(cand, alignedSize, b.offset, b.sizeBytes),
        );
        if (!hasCollision) {
          chosenOffset = cand;
          break;
        }
      }

      placedBlocks.push({
        tensorId: t.id,
        tensorName: t.name,
        offset: chosenOffset,
        sizeBytes: alignedSize,
        rawSizeBytes: t.sizeBytes,
        startStep: t.startStep,
        endStep: t.endStep,
        color: t.colorHex,
        category: t.category,
        isEliminatedByFusion: false,
      });
    }
  } else if (strategy === "first_fit") {
    // Sort tensors by startStep ascending (temporal birth order), then size descending
    const sorted = [...activeTensors].sort(
      (a, b) => a.startStep - b.startStep || b.sizeBytes - a.sizeBytes || a.id.localeCompare(b.id),
    );

    for (const t of sorted) {
      const alignedSize = alignOffset(t.sizeBytes, alignment);
      const interferingBlocks = placedBlocks.filter((b) =>
        intervalsOverlap(t.startStep, t.endStep, b.startStep, b.endStep),
      );

      const candidateOffsetsSet = new Set<number>([0]);
      for (const b of interferingBlocks) {
        candidateOffsetsSet.add(alignOffset(b.offset + b.sizeBytes, alignment));
      }
      const candidates = Array.from(candidateOffsetsSet).sort((a, b) => a - b);

      let chosenOffset = 0;
      for (const cand of candidates) {
        const hasCollision = interferingBlocks.some((b) =>
          memoryRangesOverlap(cand, alignedSize, b.offset, b.sizeBytes),
        );
        if (!hasCollision) {
          chosenOffset = cand;
          break;
        }
      }

      placedBlocks.push({
        tensorId: t.id,
        tensorName: t.name,
        offset: chosenOffset,
        sizeBytes: alignedSize,
        rawSizeBytes: t.sizeBytes,
        startStep: t.startStep,
        endStep: t.endStep,
        color: t.colorHex,
        category: t.category,
        isEliminatedByFusion: false,
      });
    }
  } else if (strategy === "best_fit") {
    // Best fit: pick candidate that minimizes the high-water mark / residual gap
    const sorted = [...activeTensors].sort(
      (a, b) => a.startStep - b.startStep || b.sizeBytes - a.sizeBytes || a.id.localeCompare(b.id),
    );

    for (const t of sorted) {
      const alignedSize = alignOffset(t.sizeBytes, alignment);
      const interferingBlocks = placedBlocks.filter((b) =>
        intervalsOverlap(t.startStep, t.endStep, b.startStep, b.endStep),
      );

      const candidateOffsetsSet = new Set<number>([0]);
      for (const b of interferingBlocks) {
        candidateOffsetsSet.add(alignOffset(b.offset + b.sizeBytes, alignment));
      }
      const candidates = Array.from(candidateOffsetsSet).sort((a, b) => a - b);

      const currentMax = placedBlocks.reduce((max, b) => Math.max(max, b.offset + b.sizeBytes), 0);

      let bestCand = 0;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const cand of candidates) {
        const hasCollision = interferingBlocks.some((b) =>
          memoryRangesOverlap(cand, alignedSize, b.offset, b.sizeBytes),
        );
        if (!hasCollision) {
          const newHighWater = Math.max(currentMax, cand + alignedSize);
          // Score prioritizes avoiding expanding arena, then lowest offset
          const score = newHighWater * 10000000 + cand;
          if (score < bestScore) {
            bestScore = score;
            bestCand = cand;
          }
        }
      }

      placedBlocks.push({
        tensorId: t.id,
        tensorName: t.name,
        offset: bestCand,
        sizeBytes: alignedSize,
        rawSizeBytes: t.sizeBytes,
        startStep: t.startStep,
        endStep: t.endStep,
        color: t.colorHex,
        category: t.category,
        isEliminatedByFusion: false,
      });
    }
  }

  // Combine placed active blocks with any eliminated tensors
  const resultMap = new Map<string, AllocatedBlock>();
  for (const b of placedBlocks) {
    resultMap.set(b.tensorId, b);
  }

  return tensors.map((t) => {
    if (resultMap.has(t.id)) {
      return resultMap.get(t.id)!;
    }
    return {
      tensorId: t.id,
      tensorName: t.name,
      offset: 0,
      sizeBytes: 0,
      rawSizeBytes: t.sizeBytes,
      startStep: t.startStep,
      endStep: t.endStep,
      color: t.colorHex,
      category: t.category,
      isEliminatedByFusion: true,
    };
  });
}

// ============================================================================
// 4. Workload Graph Builders & Presets
// ============================================================================

export function buildWorkloadGraph(
  config: WorkloadConfig,
  presetId: WorkloadPresetId,
): WorkloadGraph {
  const preset = WORKLOAD_PRESETS[presetId];
  if (!preset) {
    throw new Error(`Unknown workload preset: ${presetId}`);
  }
  return preset.buildWorkload(config);
}

export function computeWorkloadMetrics(
  graph: WorkloadGraph,
  config: WorkloadConfig,
): AllocationResult {
  const blocks = allocateMemoryArena(graph.tensors, config.allocationStrategy, config.alignment);

  // Peak memory of current allocation
  const activeBlocks = blocks.filter((b) => !b.isEliminatedByFusion);
  const peakMemoryBytes = activeBlocks.reduce((max, b) => Math.max(max, b.offset + b.sizeBytes), 0);
  const totalArenaCapacityBytes = peakMemoryBytes;

  // Unfused baseline peak with naive linear allocation
  const unfusedBaselineGraph = buildWorkloadGraph({ ...config, fusionMode: "unfused" }, graph.id);
  const baselineBlocks = allocateMemoryArena(
    unfusedBaselineGraph.tensors,
    "naive_linear",
    config.alignment,
  );
  const baselinePeakMemoryBytes = baselineBlocks.reduce(
    (max, b) => Math.max(max, b.offset + b.sizeBytes),
    0,
  );

  const peakMemoryReductionPercent =
    baselinePeakMemoryBytes > 0
      ? Math.max(0, ((baselinePeakMemoryBytes - peakMemoryBytes) / baselinePeakMemoryBytes) * 100)
      : 0;

  // Total DRAM Traffic (Read + Write)
  const totalDramTrafficBytes = graph.steps.reduce(
    (sum, s) => sum + s.dramReadBytes + s.dramWriteBytes,
    0,
  );
  const baselineDramTrafficBytes = unfusedBaselineGraph.steps.reduce(
    (sum, s) => sum + s.dramReadBytes + s.dramWriteBytes,
    0,
  );
  const dramTrafficReductionPercent =
    baselineDramTrafficBytes > 0
      ? Math.max(
          0,
          ((baselineDramTrafficBytes - totalDramTrafficBytes) / baselineDramTrafficBytes) * 100,
        )
      : 0;

  // Kernel Launch Count
  const totalKernelLaunches = graph.steps.reduce((sum, s) => sum + s.kernelCount, 0);
  const baselineKernelLaunches = unfusedBaselineGraph.steps.reduce(
    (sum, s) => sum + s.kernelCount,
    0,
  );
  const kernelLaunchReductionPercent =
    baselineKernelLaunches > 0
      ? Math.max(0, ((baselineKernelLaunches - totalKernelLaunches) / baselineKernelLaunches) * 100)
      : 0;

  // Active tensors at step helper
  const activeTensorsAtStep = (step: number) => {
    return blocks.filter(
      (b) => !b.isEliminatedByFusion && b.startStep <= step && step <= b.endStep,
    );
  };

  const activeMemoryAtStep = (step: number) => {
    return activeTensorsAtStep(step).reduce((sum, b) => sum + b.sizeBytes, 0);
  };

  // Peak active footprint vs total arena capacity for fragmentation
  const maxActiveFootprint = Math.max(
    1,
    ...graph.steps.map((s) => activeMemoryAtStep(s.stepIndex)),
  );
  const fragmentationPercent =
    totalArenaCapacityBytes > 0
      ? Math.max(
          0,
          ((totalArenaCapacityBytes - maxActiveFootprint) / totalArenaCapacityBytes) * 100,
        )
      : 0;

  const disjointCheck = verifyInterferenceDisjointness(blocks);

  return {
    blocks,
    peakMemoryBytes,
    totalArenaCapacityBytes,
    baselinePeakMemoryBytes,
    peakMemoryReductionPercent,
    totalDramTrafficBytes,
    baselineDramTrafficBytes,
    dramTrafficReductionPercent,
    totalKernelLaunches,
    baselineKernelLaunches,
    kernelLaunchReductionPercent,
    fragmentationPercent,
    activeTensorsAtStep,
    activeMemoryAtStep,
    isDisjoint: disjointCheck.isValid,
    disjointnessViolations: disjointCheck.violations,
  };
}

// ============================================================================
// 5. Code Generators (PyTorch Eager vs Inductor IR vs Fused Triton Kernel)
// ============================================================================

export function generatePyTorchEagerCode(
  presetId: WorkloadPresetId,
  config: WorkloadConfig,
): string {
  const { batchSize: B, seqLen: S, hiddenDim: D, dtype } = config;
  const dTypeStr =
    dtype === "fp32"
      ? "torch.float32"
      : dtype === "fp16"
        ? "torch.float16"
        : dtype === "bf16"
          ? "torch.bfloat16"
          : "torch.float8_e4m3fn";

  if (presetId === "transformer_mha") {
    const H = config.numHeads || 8;
    const d_k = Math.floor(D / H);
    return `import torch
import torch.nn.functional as F

# Unfused PyTorch Eager Multi-Head Attention
# [B=${B}, S=${S}, D=${D}, H=${H}, d_k=${d_k}, dtype=${dtype}]
class PyTorchEagerMHA(torch.nn.Module):
    def __init__(self, d_model=${D}, num_heads=${H}):
        super().__init__()
        self.d_model = d_model
        self.num_heads = num_heads
        self.head_dim = ${d_k}
        self.qkv_proj = torch.nn.Linear(d_model, 3 * d_model, bias=False, dtype=${dTypeStr})
        self.out_proj = torch.nn.Linear(d_model, d_model, bias=False, dtype=${dTypeStr})

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Step 0: x resident in DRAM [${B}, ${S}, ${D}]
        B, S, D = x.shape
        
        # Step 1: QKV Projection -> Materialize qkv_proj to DRAM
        qkv = self.qkv_proj(x) # [${B}, ${S}, ${3 * D}]
        
        # Step 2: Split and Reshape -> DRAM buffer allocation
        q, k, v = torch.chunk(qkv, 3, dim=-1)
        q = q.view(B, S, self.num_heads, self.head_dim).transpose(1, 2) # [${B}, ${H}, ${S}, ${d_k}]
        k = k.view(B, S, self.num_heads, self.head_dim).transpose(1, 2)
        v = v.view(B, S, self.num_heads, self.head_dim).transpose(1, 2)
        
        # Step 3: Batch GEMM (Q @ K.T) -> Huge O(S^2) DRAM Score Matrix
        scores = torch.matmul(q, k.transpose(-2, -1)) / (self.head_dim ** 0.5) # [${B}, ${H}, ${S}, ${S}]
        
        # Step 4: Softmax & Dropout -> 2 separate DRAM memory passes!
        probs = F.softmax(scores, dim=-1) # [${B}, ${H}, ${S}, ${S}]
        probs = F.dropout(probs, p=0.1, training=True)
        
        # Step 5: AV GEMM -> Context output written to DRAM
        context = torch.matmul(probs, v) # [${B}, ${H}, ${S}, ${d_k}]
        context = context.transpose(1, 2).contiguous().view(B, S, D)
        
        # Step 6: Out Projection Linear
        out = self.out_proj(context) # [${B}, ${S}, ${D}]
        
        # Step 7: Residual Addition
        return out + x
`;
  }

  if (presetId === "swiglu_mlp") {
    const dInt = config.intermediateDim || Math.floor((8 * D) / 3);
    return `import torch
import torch.nn.functional as F

# Unfused PyTorch Eager SwiGLU FFN Block
# [B=${B}, S=${S}, D=${D}, D_intermediate=${dInt}, dtype=${dtype}]
class PyTorchEagerSwiGLU(torch.nn.Module):
    def __init__(self, d_model=${D}, d_ffn=${dInt}):
        super().__init__()
        self.w_gate = torch.nn.Linear(d_model, d_ffn, bias=False, dtype=${dTypeStr})
        self.w_up = torch.nn.Linear(d_model, d_ffn, bias=False, dtype=${dTypeStr})
        self.w_down = torch.nn.Linear(d_ffn, d_model, bias=False, dtype=${dTypeStr})

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Step 1: Gate Linear -> Materialize [B, S, ${dInt}] in DRAM
        gate = self.w_gate(x)
        
        # Step 2: Up Linear -> Materialize [B, S, ${dInt}] in DRAM
        up = self.w_up(x)
        
        # Step 3: SiLU Activation -> Separate DRAM allocation
        silu_gate = F.silu(gate)
        
        # Step 4: Elementwise Multiplication -> Materialize [B, S, ${dInt}]
        swiglu_act = silu_gate * up
        
        # Step 5: Down Linear & Residual Add -> Materialize [B, S, ${D}]
        out = self.w_down(swiglu_act)
        return out + x
`;
  }

  if (presetId === "fused_layernorm_gelu") {
    const dInt = 4 * D;
    return `import torch
import torch.nn.functional as F

# Unfused PyTorch Eager LayerNorm + GELU MLP
# [B=${B}, S=${S}, D=${D}, D_hidden=${dInt}, dtype=${dtype}]
class PyTorchEagerMLP(torch.nn.Module):
    def __init__(self, d_model=${D}, d_ffn=${dInt}):
        super().__init__()
        self.ln = torch.nn.LayerNorm(d_model, dtype=${dTypeStr})
        self.fc1 = torch.nn.Linear(d_model, d_ffn, dtype=${dTypeStr})
        self.fc2 = torch.nn.Linear(d_ffn, d_model, dtype=${dTypeStr})

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # Step 1: LayerNorm (calculates mean, var, normalizes -> DRAM write)
        norm_x = self.ln(x)
        
        # Step 2: FC1 Linear Projection -> DRAM write [B, S, ${dInt}]
        h1 = self.fc1(norm_x)
        
        # Step 3: GELU Activation -> DRAM write [B, S, ${dInt}]
        h1_act = F.gelu(h1)
        
        # Step 4: FC2 Linear Projection -> DRAM write [B, S, ${D}]
        h2 = self.fc2(h1_act)
        
        # Step 5: Dropout + Residual Add
        out = F.dropout(h2, p=0.1, training=True)
        return out + x
`;
  }

  if (presetId === "flash_attention_2") {
    return `import torch

# Standard Eager Attention (Quadratic O(S^2) DRAM Allocations)
def standard_eager_attention(q, k, v):
    # Materializes full S x S attention matrix to High-Bandwidth Memory
    scores = torch.matmul(q, k.transpose(-2, -1)) * (1.0 / (q.shape[-1] ** 0.5))
    probs = torch.softmax(scores, dim=-1)
    out = torch.matmul(probs, v)
    return out
`;
  }

  // conv_bn_relu
  const C = config.channels || 64;
  const H = config.spatialH || 32;
  const W = config.spatialW || 32;
  return `import torch
import torch.nn as nn

# Unfused Conv2d + BatchNorm + ReLU Block
# [B=${B}, C=${C}, H=${H}, W=${W}]
class ConvBNReLUBlock(nn.Module):
    def __init__(self, channels=${C}):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.relu = nn.ReLU(inplace=False) # Creates separate buffer
        self.conv2 = nn.Conv2d(channels, channels, 3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        residual = x
        out = self.conv1(x)     # DRAM Write 1
        out = self.bn1(out)     # DRAM Write 2
        out = self.relu(out)    # DRAM Write 3
        out = self.conv2(out)   # DRAM Write 4
        out = self.bn2(out)     # DRAM Write 5
        out = self.relu(out + residual)
        return out
`;
}

export function generateInductorCode(presetId: WorkloadPresetId, config: WorkloadConfig): string {
  const { hiddenDim: D } = config;

  if (presetId === "transformer_mha") {
    return `# TorchInductor Loop Fusion IR Output (Pointwise & Reduction Fused)
# Kernel 1: Fused QKV Linear Projection + Bias Add + Reshape Transpose
# Kernel 2: Pointwise Fused Scale + Softmax Row Reduction + Online Dropout
# Intermediate DRAM tensors eliminated: [attn_scores_raw, attn_dropout_mask] -> kept in GPU registers!

import triton
import triton.language as tl

@triton.jit
def fused_scale_softmax_dropout_kernel(
    Scores_ptr, Probs_ptr,
    stride_b, stride_h, stride_m, stride_n,
    N_COLS: tl.constexpr, BLOCK_SIZE: tl.constexpr
):
    # Vectorized loop fusion: reads scores, performs max-reduction,
    # exponentiates, normalizes, and applies dropout in local SRAM registers!
    row_idx = tl.program_id(0)
    col_offsets = tl.arange(0, BLOCK_SIZE)
    mask = col_offsets < N_COLS
    
    # 1. Load row directly to GPU L1/Registers
    scores = tl.load(Scores_ptr + row_idx * stride_m + col_offsets, mask=mask, other=-float('inf'))
    scaled = scores * ${1.0 / Math.sqrt(D / (config.numHeads || 8))}
    
    # 2. Local Reduction in Registers
    row_max = tl.max(scaled, axis=0)
    numerator = tl.exp(scaled - row_max)
    row_sum = tl.sum(numerator, axis=0)
    probs = numerator / row_sum
    
    # 3. Store normalized probabilities back to memory (or forward to GEMM)
    tl.store(Probs_ptr + row_idx * stride_m + col_offsets, probs, mask=mask)
`;
  }

  if (presetId === "swiglu_mlp") {
    return `# TorchInductor Fused Pointwise Loop IR: SwiGLU Activation
# Fuses SiLU(gate) * up into a single streaming memory kernel.
# Eliminates intermediate silu_gate DRAM buffer!

import triton
import triton.language as tl

@triton.jit
def fused_swiglu_kernel(
    Gate_ptr, Up_ptr, Out_ptr,
    n_elements, BLOCK_SIZE: tl.constexpr
):
    pid = tl.program_id(0)
    offsets = pid * BLOCK_SIZE + tl.arange(0, BLOCK_SIZE)
    mask = offsets < n_elements
    
    # Streaming load of gate and up projection chunks
    g = tl.load(Gate_ptr + offsets, mask=mask)
    u = tl.load(Up_ptr + offsets, mask=mask)
    
    # Fused SiLU: g * sigmoid(g)
    silu = g * tl.sigmoid(g)
    
    # Fused elementwise multiplication directly to Output buffer
    out = silu * u
    tl.store(Out_ptr + offsets, out, mask=mask)
`;
  }

  return `# TorchInductor Loop Fused Kernel IR
# Pointwise operations and Normalizations are fused into single-pass memory operations.
# Intermediate buffers are retained in GPU register space.`;
}

export function generateTritonKernelCode(
  presetId: WorkloadPresetId,
  config: WorkloadConfig,
): string {
  const { hiddenDim: D } = config;
  const H = config.numHeads || 8;
  const d_k = Math.floor(D / H);

  if (presetId === "transformer_mha" || presetId === "flash_attention_2") {
    return `@triton.jit
def _fused_flash_attention_kernel(
    Q_ptr, K_ptr, V_ptr, Out_ptr,
    stride_qz, stride_qh, stride_qm, stride_qk,
    stride_kz, stride_kh, stride_kn, stride_kk,
    stride_vz, stride_vh, stride_vn, stride_vk,
    stride_oz, stride_oh, stride_om, stride_ok,
    Z, H, N_CTX,
    BLOCK_M: tl.constexpr = 64,
    BLOCK_DMODEL: tl.constexpr = ${d_k},
    BLOCK_N: tl.constexpr = 64,
):
    """
    Fused FlashAttention-2 Mega-Kernel:
    - Eliminates O(S^2) DRAM memory allocation for attention score matrix.
    - Uses online softmax algorithm with running max m_i and running sum l_i.
    - All intermediate activations reside strictly in GPU SRAM (Shared Memory)!
    """
    start_m = tl.program_id(0)
    off_hz = tl.program_id(1)
    
    # Block pointers for tiled fast memory access
    offs_m = start_m * BLOCK_M + tl.arange(0, BLOCK_M)
    offs_n = tl.arange(0, BLOCK_N)
    offs_k = tl.arange(0, BLOCK_DMODEL)
    
    # Initialize online softmax statistics in registers
    m_i = tl.zeros([BLOCK_M], dtype=tl.float32) - float("inf")
    l_i = tl.zeros([BLOCK_M], dtype=tl.float32)
    acc = tl.zeros([BLOCK_M, BLOCK_DMODEL], dtype=tl.float32)
    
    # Load Q tile into SRAM registers
    q_ptrs = Q_ptr + off_hz * stride_qh + offs_m[:, None] * stride_qm + offs_k[None, :] * stride_qk
    q = tl.load(q_ptrs, mask=offs_m[:, None] < N_CTX, other=0.0)
    
    # Loop over K, V blocks along sequence length
    for start_n in range(0, (start_m + 1) * BLOCK_N, BLOCK_N):
        k_ptrs = K_ptr + off_hz * stride_kh + (start_n + offs_n)[:, None] * stride_kn + offs_k[None, :] * stride_kk
        v_ptrs = V_ptr + off_hz * stride_vh + (start_n + offs_n)[:, None] * stride_vn + offs_k[None, :] * stride_vk
        
        k = tl.load(k_ptrs)
        v = tl.load(v_ptrs)
        
        # Compute Q @ K.T directly in tile shared memory
        qk = tl.dot(q, tl.trans(k)) * ${1.0 / Math.sqrt(d_k)}
        
        # Online softmax update
        m_ij = tl.max(qk, 1)
        m_new = tl.maximum(m_i, m_ij)
        p = tl.exp(qk - m_new[:, None])
        l_new = tl.exp(m_i - m_new) * l_i + tl.sum(p, 1)
        
        # Rescale accumulator and accumulate P @ V
        acc = acc * tl.exp(m_i - m_new)[:, None] + tl.dot(p.to(v.dtype), v)
        m_i = m_new
        l_i = l_new
        
    # Final normalization & write directly to output
    out = acc / l_i[:, None]
    out_ptrs = Out_ptr + off_hz * stride_oh + offs_m[:, None] * stride_om + offs_k[None, :] * stride_ok
    tl.store(out_ptrs, out.to(Q_ptr.dtype.element_ty), mask=offs_m[:, None] < N_CTX)
`;
  }

  if (presetId === "swiglu_mlp") {
    return `@triton.jit
def fused_swiglu_gemm_kernel(
    X_ptr, W_Gate_ptr, W_Up_ptr, W_Down_ptr, Out_ptr,
    M, N_FFN, K,
    BLOCK_M: tl.constexpr = 64,
    BLOCK_N: tl.constexpr = 64,
    BLOCK_K: tl.constexpr = 32,
):
    """
    Fused Mega-Kernel: Gate/Up Linear GEMM + SwiGLU Activation in SRAM.
    Eliminates all intermediate DRAM allocations for gate_proj, up_proj, and silu_gate!
    """
    pid_m = tl.program_id(0)
    offs_m = pid_m * BLOCK_M + tl.arange(0, BLOCK_M)
    offs_k = tl.arange(0, BLOCK_K)
    
    # Accumulate Gate and Up GEMM in tile SRAM
    acc_gate = tl.zeros([BLOCK_M, BLOCK_N], dtype=tl.float32)
    acc_up = tl.zeros([BLOCK_M, BLOCK_N], dtype=tl.float32)
    
    for k in range(0, K, BLOCK_K):
        x = tl.load(X_ptr + offs_m[:, None] * K + (k + offs_k)[None, :])
        w_g = tl.load(W_Gate_ptr + (k + offs_k)[:, None] * N_FFN + tl.arange(0, BLOCK_N)[None, :])
        w_u = tl.load(W_Up_ptr + (k + offs_k)[:, None] * N_FFN + tl.arange(0, BLOCK_N)[None, :])
        
        acc_gate += tl.dot(x, w_g)
        acc_up += tl.dot(x, w_u)
        
    # Pointwise SwiGLU in Registers: (gate * sigmoid(gate)) * up
    act = (acc_gate * tl.sigmoid(acc_gate)) * acc_up
    
    # Down GEMM streamed from SRAM tile directly to Output DRAM!
    # Total DRAM footprint: 0 Bytes intermediate allocations!
`;
  }

  return `@triton.jit
def fused_custom_mega_kernel(
    In_ptr, Weight_ptr, Out_ptr,
    BLOCK_M: tl.constexpr = 64, BLOCK_N: tl.constexpr = 64
):
    # Fused Triton Block Mega-Kernel
    # Operates exclusively in GPU SRAM (Shared Memory)
    pass
`;
}

// ============================================================================
// 6. Workload Presets Catalog
// ============================================================================

export const WORKLOAD_PRESETS: Record<WorkloadPresetId, WorkloadPreset> = {
  transformer_mha: {
    id: "transformer_mha",
    name: "Transformer Multi-Head Attention",
    category: "LLM / Attention",
    badge: "Attention Core",
    description:
      "Standard Multi-Head Attention block showing quadratic O(S^2) intermediate DRAM score allocations in PyTorch Eager vs FlashAttention SRAM tiling.",
    defaultBatchSize: 2,
    defaultSeqLen: 2048,
    defaultHiddenDim: 1024,
    defaultNumHeads: 16,
    buildWorkload: (config: WorkloadConfig): WorkloadGraph => {
      const B = config.batchSize;
      const S = config.seqLen;
      const D = config.hiddenDim;
      const H = config.numHeads || 16;
      const d_k = Math.floor(D / H);
      const elemBytes = DTYPE_SIZES[config.dtype];
      const mode = config.fusionMode;

      const tensors: TensorNode[] = [
        {
          id: "x_input",
          name: "x_input",
          producerOp: "Input Data",
          consumerOps: ["qkv_linear", "residual_add"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 0,
          endStep: 7,
          isInput: true,
          isEliminatedByFusion: false,
          category: "input",
          colorHex: "#3B82F6", // Blue
        },
        {
          id: "w_qkv",
          name: "w_qkv_weights",
          producerOp: "Weight Loader",
          consumerOps: ["qkv_linear"],
          shape: [D, 3 * D],
          shapeStr: `[${D}, ${3 * D}]`,
          numElements: 3 * D * D,
          sizeBytes: 3 * D * D * elemBytes,
          startStep: 0,
          endStep: 1,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#8B5CF6", // Purple
        },
        {
          id: "qkv_proj",
          name: "qkv_proj",
          producerOp: "qkv_linear",
          consumerOps: ["qkv_split_transpose"],
          shape: [B, S, 3 * D],
          shapeStr: `[${B}, ${S}, ${3 * D}]`,
          numElements: 3 * B * S * D,
          sizeBytes: 3 * B * S * D * elemBytes,
          startStep: 1,
          endStep: 2,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#EC4899", // Pink
        },
        {
          id: "q_split",
          name: "q_heads",
          producerOp: "qkv_split_transpose",
          consumerOps: ["qk_batch_gemm"],
          shape: [B, H, S, d_k],
          shapeStr: `[${B}, ${H}, ${S}, ${d_k}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 2,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#06B6D4", // Cyan
        },
        {
          id: "k_split",
          name: "k_heads",
          producerOp: "qkv_split_transpose",
          consumerOps: ["qk_batch_gemm"],
          shape: [B, H, S, d_k],
          shapeStr: `[${B}, ${H}, ${S}, ${d_k}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 2,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#14B8A6", // Teal
        },
        {
          id: "v_split",
          name: "v_heads",
          producerOp: "qkv_split_transpose",
          consumerOps: ["av_batch_gemm"],
          shape: [B, H, S, d_k],
          shapeStr: `[${B}, ${H}, ${S}, ${d_k}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 2,
          endStep: 5,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#10B981", // Emerald
        },
        {
          id: "attn_scores_raw",
          name: "attn_scores_raw",
          producerOp: "qk_batch_gemm",
          consumerOps: ["softmax_scale"],
          shape: [B, H, S, S],
          shapeStr: `[${B}, ${H}, ${S}, ${S}]`,
          numElements: B * H * S * S,
          sizeBytes: B * H * S * S * elemBytes,
          startStep: 3,
          endStep: 4,
          isIntermediate: true,
          isEliminatedByFusion: mode === "inductor_fused" || mode === "triton_fused",
          category: "workspace",
          colorHex: "#F59E0B", // Amber (Massive O(S^2))
        },
        {
          id: "softmax_probs",
          name: "softmax_probs",
          producerOp: "softmax_scale",
          consumerOps: ["dropout_layer"],
          shape: [B, H, S, S],
          shapeStr: `[${B}, ${H}, ${S}, ${S}]`,
          numElements: B * H * S * S,
          sizeBytes: B * H * S * S * elemBytes,
          startStep: 4,
          endStep: 5,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "workspace",
          colorHex: "#EF4444", // Red
        },
        {
          id: "dropout_mask",
          name: "dropout_mask",
          producerOp: "dropout_layer",
          consumerOps: ["av_batch_gemm"],
          shape: [B, H, S, S],
          shapeStr: `[${B}, ${H}, ${S}, ${S}]`,
          numElements: B * H * S * S,
          sizeBytes: B * H * S * S * elemBytes,
          startStep: 4,
          endStep: 5,
          isIntermediate: true,
          isEliminatedByFusion: mode === "inductor_fused" || mode === "triton_fused",
          category: "workspace",
          colorHex: "#F97316", // Orange
        },
        {
          id: "attn_context",
          name: "attn_context",
          producerOp: "av_batch_gemm",
          consumerOps: ["out_linear"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 5,
          endStep: 6,
          isIntermediate: true,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#6366F1", // Indigo
        },
        {
          id: "w_out",
          name: "w_out_linear",
          producerOp: "Weight Loader",
          consumerOps: ["out_linear"],
          shape: [D, D],
          shapeStr: `[${D}, ${D}]`,
          numElements: D * D,
          sizeBytes: D * D * elemBytes,
          startStep: 6,
          endStep: 7,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#A855F7", // Violet
        },
        {
          id: "out_proj",
          name: "out_proj",
          producerOp: "out_linear",
          consumerOps: ["residual_add"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 6,
          endStep: 7,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#84CC16", // Lime
        },
        {
          id: "final_residual",
          name: "final_mha_out",
          producerOp: "residual_add",
          consumerOps: ["Next Layer"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 7,
          endStep: 7,
          isOutput: true,
          isEliminatedByFusion: false,
          category: "output",
          colorHex: "#22C55E", // Green
        },
      ];

      const steps: OperatorStep[] = [
        {
          stepIndex: 0,
          name: "Input & Weights Ingest",
          opType: "Memory Load",
          inputs: [],
          outputs: ["x_input", "w_qkv"],
          sramBytes: 0,
          dramReadBytes: (B * S * D + 3 * D * D) * elemBytes,
          dramWriteBytes: (B * S * D + 3 * D * D) * elemBytes,
          kernelCount: 1,
          description: "Initialize input tensor x and QKV projection matrix in memory arena.",
          isFused: false,
        },
        {
          stepIndex: 1,
          name: "QKV Linear GEMM",
          opType: "GEMM",
          inputs: ["x_input", "w_qkv"],
          outputs: ["qkv_proj"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * D + 3 * D * D) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : 3 * B * S * D * elemBytes,
          kernelCount: 1,
          description: "Compute combined QKV projection [B, S, 3*D].",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 2,
          name: "QKV Reshape & Transpose",
          opType: "Permute",
          inputs: ["qkv_proj"],
          outputs: ["q_split", "k_split", "v_split"],
          sramBytes: 16 * 1024,
          dramReadBytes: mode === "triton_fused" ? 0 : 3 * B * S * D * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : 3 * B * S * D * elemBytes,
          kernelCount: mode === "triton_fused" ? 0 : 1,
          description: "Split into multi-head shapes [B, H, S, d_k].",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 3,
          name: "QK Batch GEMM (Scores)",
          opType: "Batch GEMM",
          inputs: ["q_split", "k_split"],
          outputs: ["attn_scores_raw"],
          sramBytes: 128 * 1024,
          dramReadBytes: mode === "triton_fused" ? 0 : 2 * B * S * D * elemBytes,
          dramWriteBytes: mode === "unfused" ? B * H * S * S * elemBytes : 0,
          kernelCount: mode === "triton_fused" ? 0 : 1,
          description: "Calculate attention scores Q @ K.T (Quadratic S^2).",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 4,
          name:
            mode === "triton_fused" ? "FlashAttn Online Softmax Tile" : "Scale + Softmax + Dropout",
          opType: mode === "triton_fused" ? "Fused Mega-Kernel" : "Pointwise Softmax",
          inputs: ["attn_scores_raw"],
          outputs: ["softmax_probs", "dropout_mask"],
          sramBytes: mode === "triton_fused" ? 160 * 1024 : 32 * 1024,
          dramReadBytes: mode === "unfused" ? B * H * S * S * elemBytes : 0,
          dramWriteBytes: mode === "unfused" ? 2 * B * H * S * S * elemBytes : 0,
          kernelCount: mode === "unfused" ? 2 : mode === "inductor_fused" ? 1 : 1,
          description:
            mode === "triton_fused"
              ? "FlashAttention-2 tiled online softmax in SRAM"
              : "Apply 1/sqrt(d_k) scale, row-wise softmax, and dropout mask.",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 5,
          name: "AV Batch GEMM (Context)",
          opType: "Batch GEMM",
          inputs: ["softmax_probs", "v_split"],
          outputs: ["attn_context"],
          sramBytes: 128 * 1024,
          dramReadBytes: mode === "triton_fused" ? 0 : (B * H * S * S + B * S * D) * elemBytes,
          dramWriteBytes: B * S * D * elemBytes,
          kernelCount: mode === "triton_fused" ? 0 : 1,
          description: "Multiply attention weights by Value vectors to produce context.",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 6,
          name: "Out Projection Linear",
          opType: "GEMM",
          inputs: ["attn_context", "w_out"],
          outputs: ["out_proj"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * D + D * D) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : B * S * D * elemBytes,
          kernelCount: 1,
          description: "Project context back to model hidden dimension D.",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 7,
          name: "Residual Addition",
          opType: "Pointwise Add",
          inputs: ["out_proj", "x_input"],
          outputs: ["final_residual"],
          sramBytes: 16 * 1024,
          dramReadBytes: 2 * B * S * D * elemBytes,
          dramWriteBytes: B * S * D * elemBytes,
          kernelCount: 1,
          description: "Add skip connection: x + out_proj.",
          isFused: mode === "triton_fused",
        },
      ];

      return {
        id: "transformer_mha",
        name: "Transformer Multi-Head Attention",
        tensors,
        steps,
        totalSteps: 7,
        eagerCode: generatePyTorchEagerCode("transformer_mha", config),
        inductorCode: generateInductorCode("transformer_mha", config),
        tritonCode: generateTritonKernelCode("transformer_mha", config),
      };
    },
  },

  swiglu_mlp: {
    id: "swiglu_mlp",
    name: "SwiGLU MLP Block",
    category: "LLM / Feed-Forward",
    badge: "LLaMA-3 FFN",
    description:
      "Modern LLM gated feed-forward block (SiLU(x @ W_gate) * (x @ W_up)) @ W_down. Fusing gate+up linear and pointwise SiLU eliminates massive intermediate memory buffers.",
    defaultBatchSize: 2,
    defaultSeqLen: 2048,
    defaultHiddenDim: 1024,
    defaultIntermediateDim: 2752,
    buildWorkload: (config: WorkloadConfig): WorkloadGraph => {
      const B = config.batchSize;
      const S = config.seqLen;
      const D = config.hiddenDim;
      const dInt = config.intermediateDim || Math.floor((8 * D) / 3);
      const elemBytes = DTYPE_SIZES[config.dtype];
      const mode = config.fusionMode;

      const tensors: TensorNode[] = [
        {
          id: "x_input",
          name: "x_input",
          producerOp: "Input Data",
          consumerOps: ["gate_linear", "up_linear", "residual_add"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 0,
          endStep: 5,
          isInput: true,
          isEliminatedByFusion: false,
          category: "input",
          colorHex: "#3B82F6",
        },
        {
          id: "w_gate",
          name: "w_gate_weights",
          producerOp: "Weight Loader",
          consumerOps: ["gate_linear"],
          shape: [D, dInt],
          shapeStr: `[${D}, ${dInt}]`,
          numElements: D * dInt,
          sizeBytes: D * dInt * elemBytes,
          startStep: 0,
          endStep: 1,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#8B5CF6",
        },
        {
          id: "w_up",
          name: "w_up_weights",
          producerOp: "Weight Loader",
          consumerOps: ["up_linear"],
          shape: [D, dInt],
          shapeStr: `[${D}, ${dInt}]`,
          numElements: D * dInt,
          sizeBytes: D * dInt * elemBytes,
          startStep: 0,
          endStep: 2,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#A855F7",
        },
        {
          id: "gate_proj",
          name: "gate_proj",
          producerOp: "gate_linear",
          consumerOps: ["silu_activation"],
          shape: [B, S, dInt],
          shapeStr: `[${B}, ${S}, ${dInt}]`,
          numElements: B * S * dInt,
          sizeBytes: B * S * dInt * elemBytes,
          startStep: 1,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#EC4899",
        },
        {
          id: "up_proj",
          name: "up_proj",
          producerOp: "up_linear",
          consumerOps: ["swiglu_multiply"],
          shape: [B, S, dInt],
          shapeStr: `[${B}, ${S}, ${dInt}]`,
          numElements: B * S * dInt,
          sizeBytes: B * S * dInt * elemBytes,
          startStep: 2,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#06B6D4",
        },
        {
          id: "silu_gate",
          name: "silu_gate",
          producerOp: "silu_activation",
          consumerOps: ["swiglu_multiply"],
          shape: [B, S, dInt],
          shapeStr: `[${B}, ${S}, ${dInt}]`,
          numElements: B * S * dInt,
          sizeBytes: B * S * dInt * elemBytes,
          startStep: 3,
          endStep: 4,
          isIntermediate: true,
          isEliminatedByFusion: mode === "inductor_fused" || mode === "triton_fused",
          category: "activation",
          colorHex: "#F59E0B",
        },
        {
          id: "swiglu_act",
          name: "swiglu_act",
          producerOp: "swiglu_multiply",
          consumerOps: ["down_linear"],
          shape: [B, S, dInt],
          shapeStr: `[${B}, ${S}, ${dInt}]`,
          numElements: B * S * dInt,
          sizeBytes: B * S * dInt * elemBytes,
          startStep: 3,
          endStep: 4,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#10B981",
        },
        {
          id: "w_down",
          name: "w_down_weights",
          producerOp: "Weight Loader",
          consumerOps: ["down_linear"],
          shape: [dInt, D],
          shapeStr: `[${dInt}, ${D}]`,
          numElements: dInt * D,
          sizeBytes: dInt * D * elemBytes,
          startStep: 4,
          endStep: 5,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#6366F1",
        },
        {
          id: "down_proj",
          name: "down_proj",
          producerOp: "down_linear",
          consumerOps: ["residual_add"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 5,
          endStep: 5,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#84CC16",
        },
        {
          id: "residual_out",
          name: "final_swiglu_out",
          producerOp: "residual_add",
          consumerOps: ["Next Block"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 5,
          endStep: 5,
          isOutput: true,
          isEliminatedByFusion: false,
          category: "output",
          colorHex: "#22C55E",
        },
      ];

      const steps: OperatorStep[] = [
        {
          stepIndex: 0,
          name: "Input & Weights Ingest",
          opType: "Memory Load",
          inputs: [],
          outputs: ["x_input", "w_gate", "w_up"],
          sramBytes: 0,
          dramReadBytes: (B * S * D + 2 * D * dInt) * elemBytes,
          dramWriteBytes: (B * S * D + 2 * D * dInt) * elemBytes,
          kernelCount: 1,
          description: "Load activations and SwiGLU projection weight matrices into arena.",
          isFused: false,
        },
        {
          stepIndex: 1,
          name: "Gate Linear Projection",
          opType: "GEMM",
          inputs: ["x_input", "w_gate"],
          outputs: ["gate_proj"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * D + D * dInt) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : B * S * dInt * elemBytes,
          kernelCount: 1,
          description: "Linear map x -> gate [B, S, dInt].",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 2,
          name: "Up Linear Projection",
          opType: "GEMM",
          inputs: ["x_input", "w_up"],
          outputs: ["up_proj"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * D + D * dInt) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : B * S * dInt * elemBytes,
          kernelCount: 1,
          description: "Linear map x -> up [B, S, dInt].",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 3,
          name:
            mode === "triton_fused"
              ? "Fused Gate+Up+SiLU in SRAM"
              : mode === "inductor_fused"
                ? "Fused SiLU * Up Pointwise"
                : "SiLU Activation",
          opType: "Pointwise / Fused",
          inputs: ["gate_proj", "up_proj"],
          outputs: ["silu_gate", "swiglu_act"],
          sramBytes: 128 * 1024,
          dramReadBytes: mode === "triton_fused" ? 0 : 2 * B * S * dInt * elemBytes,
          dramWriteBytes:
            mode === "triton_fused"
              ? 0
              : mode === "inductor_fused"
                ? B * S * dInt * elemBytes
                : 2 * B * S * dInt * elemBytes,
          kernelCount: mode === "unfused" ? 2 : 1,
          description: "Compute SiLU(gate) * up gating operation.",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 4,
          name: "Down Linear Projection",
          opType: "GEMM",
          inputs: ["swiglu_act", "w_down"],
          outputs: ["down_proj"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * dInt + dInt * D) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : B * S * D * elemBytes,
          kernelCount: 1,
          description: "Project intermediate dimension back down to D.",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 5,
          name: "Residual Addition",
          opType: "Pointwise Add",
          inputs: ["down_proj", "x_input"],
          outputs: ["residual_out"],
          sramBytes: 16 * 1024,
          dramReadBytes: 2 * B * S * D * elemBytes,
          dramWriteBytes: B * S * D * elemBytes,
          kernelCount: 1,
          description: "Add residual skip connection.",
          isFused: mode === "triton_fused",
        },
      ];

      return {
        id: "swiglu_mlp",
        name: "SwiGLU MLP Block",
        tensors,
        steps,
        totalSteps: 5,
        eagerCode: generatePyTorchEagerCode("swiglu_mlp", config),
        inductorCode: generateInductorCode("swiglu_mlp", config),
        tritonCode: generateTritonKernelCode("swiglu_mlp", config),
      };
    },
  },

  fused_layernorm_gelu: {
    id: "fused_layernorm_gelu",
    name: "Fused LayerNorm + GELU MLP",
    category: "Transformer / MLP",
    badge: "Norm + Act Fusion",
    description:
      "LayerNorm followed by 2-layer MLP with GELU. Highlights how fusing reduction stats (mean, variance) with normalization and activation avoids redundant DRAM round-trips.",
    defaultBatchSize: 4,
    defaultSeqLen: 1024,
    defaultHiddenDim: 768,
    buildWorkload: (config: WorkloadConfig): WorkloadGraph => {
      const B = config.batchSize;
      const S = config.seqLen;
      const D = config.hiddenDim;
      const dInt = 4 * D;
      const elemBytes = DTYPE_SIZES[config.dtype];
      const mode = config.fusionMode;

      const tensors: TensorNode[] = [
        {
          id: "x_input",
          name: "x_input",
          producerOp: "Input Ingest",
          consumerOps: ["layer_norm", "residual_add"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 0,
          endStep: 5,
          isInput: true,
          isEliminatedByFusion: false,
          category: "input",
          colorHex: "#3B82F6",
        },
        {
          id: "ln_gamma_beta",
          name: "ln_weights",
          producerOp: "Weight Loader",
          consumerOps: ["layer_norm"],
          shape: [2, D],
          shapeStr: `[2, ${D}]`,
          numElements: 2 * D,
          sizeBytes: 2 * D * elemBytes,
          startStep: 0,
          endStep: 1,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#8B5CF6",
        },
        {
          id: "ln_stats",
          name: "ln_mean_var_buf",
          producerOp: "layer_norm",
          consumerOps: ["layer_norm_apply"],
          shape: [2, B, S],
          shapeStr: `[2, ${B}, ${S}]`,
          numElements: 2 * B * S,
          sizeBytes: 2 * B * S * elemBytes,
          startStep: 0,
          endStep: 1,
          isIntermediate: true,
          isEliminatedByFusion: mode !== "unfused",
          category: "workspace",
          colorHex: "#F59E0B",
        },
        {
          id: "ln_out",
          name: "ln_normalized_x",
          producerOp: "layer_norm",
          consumerOps: ["linear1_proj"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 1,
          endStep: 2,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#06B6D4",
        },
        {
          id: "w1_linear",
          name: "w1_fc1_weights",
          producerOp: "Weight Loader",
          consumerOps: ["linear1_proj"],
          shape: [D, dInt],
          shapeStr: `[${D}, ${dInt}]`,
          numElements: D * dInt,
          sizeBytes: D * dInt * elemBytes,
          startStep: 1,
          endStep: 2,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#A855F7",
        },
        {
          id: "h1_act_raw",
          name: "h1_linear_raw",
          producerOp: "linear1_proj",
          consumerOps: ["gelu_activation"],
          shape: [B, S, dInt],
          shapeStr: `[${B}, ${S}, ${dInt}]`,
          numElements: B * S * dInt,
          sizeBytes: B * S * dInt * elemBytes,
          startStep: 2,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#EC4899",
        },
        {
          id: "gelu_out",
          name: "gelu_activation",
          producerOp: "gelu_activation",
          consumerOps: ["linear2_proj"],
          shape: [B, S, dInt],
          shapeStr: `[${B}, ${S}, ${dInt}]`,
          numElements: B * S * dInt,
          sizeBytes: B * S * dInt * elemBytes,
          startStep: 3,
          endStep: 4,
          isIntermediate: true,
          isEliminatedByFusion: mode !== "unfused",
          category: "activation",
          colorHex: "#10B981",
        },
        {
          id: "w2_linear",
          name: "w2_fc2_weights",
          producerOp: "Weight Loader",
          consumerOps: ["linear2_proj"],
          shape: [dInt, D],
          shapeStr: `[${dInt}, ${D}]`,
          numElements: dInt * D,
          sizeBytes: dInt * D * elemBytes,
          startStep: 3,
          endStep: 4,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#6366F1",
        },
        {
          id: "h2_out",
          name: "h2_linear_out",
          producerOp: "linear2_proj",
          consumerOps: ["residual_add"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 4,
          endStep: 5,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#84CC16",
        },
        {
          id: "final_out",
          name: "final_mlp_out",
          producerOp: "residual_add",
          consumerOps: ["Next Block"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 5,
          endStep: 5,
          isOutput: true,
          isEliminatedByFusion: false,
          category: "output",
          colorHex: "#22C55E",
        },
      ];

      const steps: OperatorStep[] = [
        {
          stepIndex: 0,
          name: "Input & LN Params Ingest",
          opType: "Memory Load",
          inputs: [],
          outputs: ["x_input", "ln_gamma_beta"],
          sramBytes: 0,
          dramReadBytes: (B * S * D + 2 * D) * elemBytes,
          dramWriteBytes: (B * S * D + 2 * D) * elemBytes,
          kernelCount: 1,
          description: "Load activations and LayerNorm gamma/beta weights into memory.",
          isFused: false,
        },
        {
          stepIndex: 1,
          name: mode !== "unfused" ? "Fused LayerNorm Single-Pass" : "LayerNorm Multi-Pass",
          opType: "Normalization",
          inputs: ["x_input", "ln_gamma_beta"],
          outputs: ["ln_out"],
          sramBytes: 32 * 1024,
          dramReadBytes: (B * S * D + 2 * D) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : B * S * D * elemBytes,
          kernelCount: mode === "unfused" ? 2 : 1,
          description: "Normalize activations across hidden dimension D.",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 2,
          name: "Linear 1 Projection",
          opType: "GEMM",
          inputs: ["ln_out", "w1_linear"],
          outputs: ["h1_act_raw"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * D + D * dInt) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : B * S * dInt * elemBytes,
          kernelCount: 1,
          description: "Project from D -> 4D.",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 3,
          name: mode !== "unfused" ? "Fused GELU + Linear2 Ingest" : "GELU Activation",
          opType: "Pointwise Activation",
          inputs: ["h1_act_raw"],
          outputs: ["gelu_out"],
          sramBytes: 64 * 1024,
          dramReadBytes: mode === "triton_fused" ? 0 : B * S * dInt * elemBytes,
          dramWriteBytes: mode !== "unfused" ? 0 : B * S * dInt * elemBytes,
          kernelCount: mode === "unfused" ? 1 : 0,
          description: "Apply Gaussian Error Linear Unit activation.",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 4,
          name: "Linear 2 Projection",
          opType: "GEMM",
          inputs: ["gelu_out", "w2_linear"],
          outputs: ["h2_out"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * dInt + dInt * D) * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : B * S * D * elemBytes,
          kernelCount: 1,
          description: "Project down from 4D -> D.",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 5,
          name: "Residual Addition",
          opType: "Pointwise Add",
          inputs: ["h2_out", "x_input"],
          outputs: ["final_out"],
          sramBytes: 16 * 1024,
          dramReadBytes: 2 * B * S * D * elemBytes,
          dramWriteBytes: B * S * D * elemBytes,
          kernelCount: 1,
          description: "Residual skip connection add.",
          isFused: mode === "triton_fused",
        },
      ];

      return {
        id: "fused_layernorm_gelu",
        name: "Fused LayerNorm + GELU MLP",
        tensors,
        steps,
        totalSteps: 5,
        eagerCode: generatePyTorchEagerCode("fused_layernorm_gelu", config),
        inductorCode: generateInductorCode("fused_layernorm_gelu", config),
        tritonCode: generateTritonKernelCode("fused_layernorm_gelu", config),
      };
    },
  },

  flash_attention_2: {
    id: "flash_attention_2",
    name: "FlashAttention-2 Block",
    category: "Transformer / IO-Aware",
    badge: "IO-Aware MegaKernel",
    description:
      "State-of-the-art IO-aware Attention algorithm with online softmax. Unfused mode materializes full S x S DRAM attention matrix, whereas FlashAttention computes directly in SRAM tiles.",
    defaultBatchSize: 2,
    defaultSeqLen: 4096,
    defaultHiddenDim: 1024,
    defaultNumHeads: 16,
    buildWorkload: (config: WorkloadConfig): WorkloadGraph => {
      const B = config.batchSize;
      const S = config.seqLen;
      const D = config.hiddenDim;
      const H = config.numHeads || 16;
      const elemBytes = DTYPE_SIZES[config.dtype];
      const mode = config.fusionMode;

      const tensors: TensorNode[] = [
        {
          id: "x_qkv_in",
          name: "qkv_packed_input",
          producerOp: "Input Loader",
          consumerOps: ["flash_kernel", "out_proj"],
          shape: [B, S, 3 * D],
          shapeStr: `[${B}, ${S}, ${3 * D}]`,
          numElements: 3 * B * S * D,
          sizeBytes: 3 * B * S * D * elemBytes,
          startStep: 0,
          endStep: 2,
          isInput: true,
          isEliminatedByFusion: false,
          category: "input",
          colorHex: "#3B82F6",
        },
        {
          id: "attn_unfused_s2_matrix",
          name: "unfused_score_matrix_s2",
          producerOp: "eager_softmax",
          consumerOps: ["eager_matmul"],
          shape: [B, H, S, S],
          shapeStr: `[${B}, ${H}, ${S}, ${S}]`,
          numElements: B * H * S * S,
          sizeBytes: B * H * S * S * elemBytes,
          startStep: 1,
          endStep: 2,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "workspace",
          colorHex: "#EF4444", // Massive S^2 memory!
        },
        {
          id: "flash_lse_stats",
          name: "flash_lse_softmax_stats",
          producerOp: "flash_kernel",
          consumerOps: ["backward_pass"],
          shape: [B, H, S],
          shapeStr: `[${B}, ${H}, ${S}]`,
          numElements: B * H * S,
          sizeBytes: B * H * S * elemBytes,
          startStep: 1,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: false,
          category: "workspace",
          colorHex: "#F59E0B",
        },
        {
          id: "attn_out_hidden",
          name: "attn_out_hidden",
          producerOp: "flash_kernel",
          consumerOps: ["out_proj"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 1,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: false,
          category: "activation",
          colorHex: "#10B981",
        },
        {
          id: "w_out",
          name: "w_out_weights",
          producerOp: "Weight Loader",
          consumerOps: ["out_proj"],
          shape: [D, D],
          shapeStr: `[${D}, ${D}]`,
          numElements: D * D,
          sizeBytes: D * D * elemBytes,
          startStep: 2,
          endStep: 3,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#8B5CF6",
        },
        {
          id: "final_out",
          name: "final_out",
          producerOp: "out_proj",
          consumerOps: ["Next Layer"],
          shape: [B, S, D],
          shapeStr: `[${B}, ${S}, ${D}]`,
          numElements: B * S * D,
          sizeBytes: B * S * D * elemBytes,
          startStep: 3,
          endStep: 3,
          isOutput: true,
          isEliminatedByFusion: false,
          category: "output",
          colorHex: "#22C55E",
        },
      ];

      const steps: OperatorStep[] = [
        {
          stepIndex: 0,
          name: "Packed QKV Input Ingest",
          opType: "Memory Load",
          inputs: [],
          outputs: ["x_qkv_in"],
          sramBytes: 0,
          dramReadBytes: 3 * B * S * D * elemBytes,
          dramWriteBytes: 3 * B * S * D * elemBytes,
          kernelCount: 1,
          description: "Ingest packed QKV buffer in DRAM.",
          isFused: false,
        },
        {
          stepIndex: 1,
          name:
            mode === "triton_fused"
              ? "FlashAttention-2 Mega-Kernel"
              : "Unfused Attention MatMul + Softmax",
          opType: mode === "triton_fused" ? "Fused FlashAttn" : "Standard GEMM",
          inputs: ["x_qkv_in"],
          outputs:
            mode === "triton_fused"
              ? ["attn_out_hidden", "flash_lse_stats"]
              : ["attn_unfused_s2_matrix", "attn_out_hidden"],
          sramBytes: mode === "triton_fused" ? 192 * 1024 : 32 * 1024,
          dramReadBytes: 3 * B * S * D * elemBytes,
          dramWriteBytes:
            mode === "triton_fused"
              ? (B * S * D + B * H * S) * elemBytes
              : (B * H * S * S + B * S * D) * elemBytes,
          kernelCount: mode === "triton_fused" ? 1 : 4,
          description:
            mode === "triton_fused"
              ? "Tiled online softmax in SRAM - 0 bytes intermediate DRAM matrix!"
              : "Materializes full S x S attention matrix to DRAM.",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 2,
          name: "Out Linear Projection",
          opType: "GEMM",
          inputs: ["attn_out_hidden", "w_out"],
          outputs: ["final_out"],
          sramBytes: 64 * 1024,
          dramReadBytes: (B * S * D + D * D) * elemBytes,
          dramWriteBytes: B * S * D * elemBytes,
          kernelCount: 1,
          description: "Project attention output through linear weights.",
          isFused: false,
        },
        {
          stepIndex: 3,
          name: "Layer Output Commit",
          opType: "Memory Sync",
          inputs: ["final_out"],
          outputs: [],
          sramBytes: 0,
          dramReadBytes: B * S * D * elemBytes,
          dramWriteBytes: 0,
          kernelCount: 1,
          description: "Commit output tensors to downstream layers.",
          isFused: false,
        },
      ];

      return {
        id: "flash_attention_2",
        name: "FlashAttention-2 Block",
        tensors,
        steps,
        totalSteps: 3,
        eagerCode: generatePyTorchEagerCode("flash_attention_2", config),
        inductorCode: generateInductorCode("flash_attention_2", config),
        tritonCode: generateTritonKernelCode("flash_attention_2", config),
      };
    },
  },

  conv_bn_relu: {
    id: "conv_bn_relu",
    name: "Conv-BN-ReLU Residual Block",
    category: "Vision / CNN",
    badge: "Folded Conv+BN",
    description:
      "Classical convolutional residual block with BatchNorm and ReLU. Fusing Conv+BN parameter folding and Conv+ReLU eliminates activation buffers.",
    defaultBatchSize: 8,
    defaultSeqLen: 1024,
    defaultHiddenDim: 256,
    spatialH: 32,
    spatialW: 32,
    channels: 64,
    buildWorkload: (config: WorkloadConfig): WorkloadGraph => {
      const B = config.batchSize;
      const C = config.channels || 64;
      const H = config.spatialH || 32;
      const W = config.spatialW || 32;
      const spatialElements = B * C * H * W;
      const elemBytes = DTYPE_SIZES[config.dtype];
      const mode = config.fusionMode;

      const tensors: TensorNode[] = [
        {
          id: "input_img",
          name: "input_feature_map",
          producerOp: "Input Data",
          consumerOps: ["conv1", "residual_add"],
          shape: [B, C, H, W],
          shapeStr: `[${B}, ${C}, ${H}, ${W}]`,
          numElements: spatialElements,
          sizeBytes: spatialElements * elemBytes,
          startStep: 0,
          endStep: 5,
          isInput: true,
          isEliminatedByFusion: false,
          category: "input",
          colorHex: "#3B82F6",
        },
        {
          id: "conv1_w",
          name: "conv1_weights",
          producerOp: "Weight Loader",
          consumerOps: ["conv1"],
          shape: [C, C, 3, 3],
          shapeStr: `[${C}, ${C}, 3, 3]`,
          numElements: C * C * 9,
          sizeBytes: C * C * 9 * elemBytes,
          startStep: 0,
          endStep: 1,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#8B5CF6",
        },
        {
          id: "conv1_out",
          name: "conv1_out",
          producerOp: "conv1",
          consumerOps: ["bn1"],
          shape: [B, C, H, W],
          shapeStr: `[${B}, ${C}, ${H}, ${W}]`,
          numElements: spatialElements,
          sizeBytes: spatialElements * elemBytes,
          startStep: 1,
          endStep: 2,
          isIntermediate: true,
          isEliminatedByFusion: mode !== "unfused",
          category: "activation",
          colorHex: "#EC4899",
        },
        {
          id: "bn1_out",
          name: "bn1_out",
          producerOp: "bn1",
          consumerOps: ["relu1"],
          shape: [B, C, H, W],
          shapeStr: `[${B}, ${C}, ${H}, ${W}]`,
          numElements: spatialElements,
          sizeBytes: spatialElements * elemBytes,
          startStep: 2,
          endStep: 3,
          isIntermediate: true,
          isEliminatedByFusion: mode !== "unfused",
          category: "activation",
          colorHex: "#06B6D4",
        },
        {
          id: "relu1_out",
          name: "relu1_act",
          producerOp: "relu1",
          consumerOps: ["conv2"],
          shape: [B, C, H, W],
          shapeStr: `[${B}, ${C}, ${H}, ${W}]`,
          numElements: spatialElements,
          sizeBytes: spatialElements * elemBytes,
          startStep: 3,
          endStep: 4,
          isIntermediate: true,
          isEliminatedByFusion: mode === "triton_fused",
          category: "activation",
          colorHex: "#10B981",
        },
        {
          id: "conv2_w",
          name: "conv2_weights",
          producerOp: "Weight Loader",
          consumerOps: ["conv2"],
          shape: [C, C, 3, 3],
          shapeStr: `[${C}, ${C}, 3, 3]`,
          numElements: C * C * 9,
          sizeBytes: C * C * 9 * elemBytes,
          startStep: 3,
          endStep: 4,
          isWeight: true,
          isEliminatedByFusion: false,
          category: "weight",
          colorHex: "#A855F7",
        },
        {
          id: "conv2_out",
          name: "conv2_out",
          producerOp: "conv2",
          consumerOps: ["bn2"],
          shape: [B, C, H, W],
          shapeStr: `[${B}, ${C}, ${H}, ${W}]`,
          numElements: spatialElements,
          sizeBytes: spatialElements * elemBytes,
          startStep: 4,
          endStep: 5,
          isIntermediate: true,
          isEliminatedByFusion: mode !== "unfused",
          category: "activation",
          colorHex: "#F59E0B",
        },
        {
          id: "residual_relu_out",
          name: "final_conv_out",
          producerOp: "residual_add",
          consumerOps: ["Next Layer"],
          shape: [B, C, H, W],
          shapeStr: `[${B}, ${C}, ${H}, ${W}]`,
          numElements: spatialElements,
          sizeBytes: spatialElements * elemBytes,
          startStep: 5,
          endStep: 5,
          isOutput: true,
          isEliminatedByFusion: false,
          category: "output",
          colorHex: "#22C55E",
        },
      ];

      const steps: OperatorStep[] = [
        {
          stepIndex: 0,
          name: "Input Image & Weights Ingest",
          opType: "Memory Load",
          inputs: [],
          outputs: ["input_img", "conv1_w"],
          sramBytes: 0,
          dramReadBytes: (spatialElements + C * C * 9) * elemBytes,
          dramWriteBytes: (spatialElements + C * C * 9) * elemBytes,
          kernelCount: 1,
          description: "Load input feature map and convolution weights.",
          isFused: false,
        },
        {
          stepIndex: 1,
          name: mode !== "unfused" ? "Fused Conv1 + BatchNorm1 (Folded)" : "Conv2d 1",
          opType: "Convolution",
          inputs: ["input_img", "conv1_w"],
          outputs: mode !== "unfused" ? ["bn1_out"] : ["conv1_out"],
          sramBytes: 64 * 1024,
          dramReadBytes: (spatialElements + C * C * 9) * elemBytes,
          dramWriteBytes: spatialElements * elemBytes,
          kernelCount: 1,
          description: "Execute first 3x3 convolution layer.",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 2,
          name: "BatchNorm2d 1",
          opType: "Batch Normalization",
          inputs: ["conv1_out"],
          outputs: ["bn1_out"],
          sramBytes: 32 * 1024,
          dramReadBytes: spatialElements * elemBytes,
          dramWriteBytes: mode !== "unfused" ? 0 : spatialElements * elemBytes,
          kernelCount: mode !== "unfused" ? 0 : 1,
          description: "Batch normalization mean/variance normalization.",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 3,
          name: mode === "triton_fused" ? "Fused ReLU + Conv2 in SRAM" : "ReLU Activation 1",
          opType: "Activation",
          inputs: ["bn1_out"],
          outputs: ["relu1_out"],
          sramBytes: 16 * 1024,
          dramReadBytes: mode === "triton_fused" ? 0 : spatialElements * elemBytes,
          dramWriteBytes: mode === "triton_fused" ? 0 : spatialElements * elemBytes,
          kernelCount: mode === "triton_fused" ? 0 : 1,
          description: "Rectified Linear Unit activation.",
          isFused: mode === "triton_fused",
        },
        {
          stepIndex: 4,
          name: mode !== "unfused" ? "Fused Conv2 + BatchNorm2" : "Conv2d 2",
          opType: "Convolution",
          inputs: ["relu1_out", "conv2_w"],
          outputs: ["conv2_out"],
          sramBytes: 64 * 1024,
          dramReadBytes: (spatialElements + C * C * 9) * elemBytes,
          dramWriteBytes: spatialElements * elemBytes,
          kernelCount: 1,
          description: "Execute second 3x3 convolution layer.",
          isFused: mode !== "unfused",
        },
        {
          stepIndex: 5,
          name: "Residual Add + ReLU 2",
          opType: "Fused Elementwise",
          inputs: ["conv2_out", "input_img"],
          outputs: ["residual_relu_out"],
          sramBytes: 32 * 1024,
          dramReadBytes: 2 * spatialElements * elemBytes,
          dramWriteBytes: spatialElements * elemBytes,
          kernelCount: 1,
          description: "Add residual skip connection and final ReLU.",
          isFused: true,
        },
      ];

      return {
        id: "conv_bn_relu",
        name: "Conv-BN-ReLU Residual Block",
        tensors,
        steps,
        totalSteps: 5,
        eagerCode: generatePyTorchEagerCode("conv_bn_relu", config),
        inductorCode: generateInductorCode("conv_bn_relu", config),
        tritonCode: generateTritonKernelCode("conv_bn_relu", config),
      };
    },
  },
};

// ============================================================================
// 7. Interactive React Visualizer Component
// ============================================================================

export interface CompilerLivenessAllocatorViewProps {
  initialPreset?: WorkloadPresetId;
  initialFusionMode?: FusionMode;
  initialStrategy?: AllocationStrategy;
  initialDtype?: DType;
  initialBatchSize?: number;
  initialSeqLen?: number;
  initialHiddenDim?: number;
  initialAlignment?: AlignmentBytes;
  title?: string;
  className?: string;
}

export const CompilerLivenessAllocatorView: React.FC<CompilerLivenessAllocatorViewProps> = ({
  initialPreset = "transformer_mha",
  initialFusionMode = "inductor_fused",
  initialStrategy = "greedy_size",
  initialDtype = "fp16",
  initialBatchSize,
  initialSeqLen,
  initialHiddenDim,
  initialAlignment = 128,
  title = "Compiler Operator Fusion & Buffer Liveness Arena Allocator",
  className = "",
}) => {
  const [selectedPreset, setSelectedPreset] = useState<WorkloadPresetId>(initialPreset);
  const [fusionMode, setFusionMode] = useState<FusionMode>(initialFusionMode);
  const [strategy, setStrategy] = useState<AllocationStrategy>(initialStrategy);
  const [dtype, setDtype] = useState<DType>(initialDtype);
  const [alignment, setAlignment] = useState<AlignmentBytes>(initialAlignment);

  // Hyperparameters
  const presetDef = WORKLOAD_PRESETS[selectedPreset] || WORKLOAD_PRESETS.transformer_mha;
  const [batchSize, setBatchSize] = useState<number>(
    initialBatchSize || presetDef.defaultBatchSize,
  );
  const [seqLen, setSeqLen] = useState<number>(initialSeqLen || presetDef.defaultSeqLen);
  const [hiddenDim, setHiddenDim] = useState<number>(
    initialHiddenDim || presetDef.defaultHiddenDim,
  );

  // Interactive timeline step scrubber
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeCodeTab, setActiveCodeTab] = useState<"eager" | "inductor" | "triton">("triton");
  const [selectedTensorId, setSelectedTensorId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Auto-play timer
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Config object
  const config: WorkloadConfig = useMemo(() => {
    return {
      batchSize,
      seqLen,
      hiddenDim,
      numHeads: presetDef.defaultNumHeads || 16,
      intermediateDim: presetDef.defaultIntermediateDim || 4 * hiddenDim,
      spatialH: presetDef.spatialH || 32,
      spatialW: presetDef.spatialW || 32,
      channels: presetDef.channels || 64,
      dtype,
      alignment,
      fusionMode,
      allocationStrategy: strategy,
    };
  }, [batchSize, seqLen, hiddenDim, presetDef, dtype, alignment, fusionMode, strategy]);

  // Graph and Allocation Simulation Result
  const graph = useMemo(() => {
    return buildWorkloadGraph(config, selectedPreset);
  }, [config, selectedPreset]);

  const result = useMemo(() => {
    return computeWorkloadMetrics(graph, config);
  }, [graph, config]);

  // Bounds clamp for currentStep
  useEffect(() => {
    if (currentStep > graph.totalSteps) {
      setCurrentStep(graph.totalSteps);
    }
  }, [graph.totalSteps, currentStep]);

  // Playback timer effect
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= graph.totalSteps) {
            return 0; // Loop around
          }
          return prev + 1;
        });
      }, 1200);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, graph.totalSteps]);

  const handleCopyCode = () => {
    const code =
      activeCodeTab === "eager"
        ? graph.eagerCode
        : activeCodeTab === "inductor"
          ? graph.inductorCode
          : graph.tritonCode;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePresetChange = (presetId: WorkloadPresetId) => {
    setSelectedPreset(presetId);
    const p = WORKLOAD_PRESETS[presetId];
    setBatchSize(p.defaultBatchSize);
    setSeqLen(p.defaultSeqLen);
    setHiddenDim(p.defaultHiddenDim);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const activeTensorsNow = result.activeTensorsAtStep(currentStep);
  const activeMemoryNow = result.activeMemoryAtStep(currentStep);
  const currentStepOp = graph.steps.find((s) => s.stepIndex === currentStep);

  return (
    <div
      data-testid="compiler-liveness-allocator-view"
      className={`flex flex-col gap-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-2xl font-sans ${className}`}
    >
      {/* Header & Preset Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shadow-inner">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Compiler Arena Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive Buffer Liveness Intervals, Memory Reuse, and PyTorch / Inductor / Triton
              Operator Fusion
            </p>
          </div>
        </div>

        {/* Workload Presets Buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {Object.values(WORKLOAD_PRESETS).map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetChange(preset.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                selectedPreset === preset.id
                  ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control Panel: Fusion Modes, Allocator Strategy, Dtype & Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
        {/* Fusion Mode Toggle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Operator Fusion Mode
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFusionMode("unfused")}
              className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                fusionMode === "unfused"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unfused
            </button>
            <button
              onClick={() => setFusionMode("inductor_fused")}
              className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                fusionMode === "inductor_fused"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Inductor
            </button>
            <button
              onClick={() => setFusionMode("triton_fused")}
              className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                fusionMode === "triton_fused"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Triton Mega
            </button>
          </div>
        </div>

        {/* Allocator Strategy */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            Memory Allocation Strategy
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setStrategy("greedy_size")}
              className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                strategy === "greedy_size"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Greedy by Size
            </button>
            <button
              onClick={() => setStrategy("first_fit")}
              className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                strategy === "first_fit"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              First-Fit
            </button>
            <button
              onClick={() => setStrategy("best_fit")}
              className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                strategy === "best_fit"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Best-Fit
            </button>
            <button
              onClick={() => setStrategy("naive_linear")}
              className={`py-1 px-2 text-xs font-medium rounded-md transition-all ${
                strategy === "naive_linear"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Naive Linear
            </button>
          </div>
        </div>

        {/* DType & Alignment */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-violet-400" />
            Precision & Alignment
          </label>
          <div className="flex gap-2">
            <select
              value={dtype}
              onChange={(e) => setDtype(e.target.value as DType)}
              className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="fp32">FP32 (4B)</option>
              <option value="fp16">FP16 (2B)</option>
              <option value="bf16">BF16 (2B)</option>
              <option value="fp8">FP8 (1B)</option>
              <option value="int8">INT8 (1B)</option>
            </select>
            <select
              value={alignment}
              onChange={(e) => setAlignment(Number(e.target.value) as AlignmentBytes)}
              className="w-1/2 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value={64}>64B Align</option>
              <option value={128}>128B Align</option>
              <option value={256}>256B Align</option>
              <option value={512}>512B Align</option>
            </select>
          </div>
        </div>

        {/* Workload Dimensions */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-emerald-400" />
            Workload Hyperparameters
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Batch (B)</span>
              <input
                type="number"
                min={1}
                max={64}
                value={batchSize}
                onChange={(e) => setBatchSize(Math.max(1, Number(e.target.value)))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Seq Len (S)</span>
              <input
                type="number"
                min={64}
                max={8192}
                step={128}
                value={seqLen}
                onChange={(e) => setSeqLen(Math.max(64, Number(e.target.value)))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Hidden (D)</span>
              <input
                type="number"
                min={64}
                max={4096}
                step={64}
                value={hiddenDim}
                onChange={(e) => setHiddenDim(Math.max(64, Number(e.target.value)))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compiler Reduction Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Peak VRAM */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Peak VRAM Arena</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatBytes(result.peakMemoryBytes)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              {formatBytes(result.baselinePeakMemoryBytes)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {result.peakMemoryReductionPercent.toFixed(1)}% Saved
            </span>
            <span className="text-slate-400 text-[11px]">
              Active: {formatBytes(activeMemoryNow)}
            </span>
          </div>
        </div>

        {/* DRAM HBM Traffic */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">HBM DRAM Traffic</span>
            <Activity className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {formatBytes(result.totalDramTrafficBytes)}
            </span>
            <span className="text-xs text-slate-400 line-through">
              {formatBytes(result.baselineDramTrafficBytes)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {result.dramTrafficReductionPercent.toFixed(1)}% Saved
            </span>
            <span className="text-slate-400 text-[11px]">IO Roundtrips</span>
          </div>
        </div>

        {/* Kernel Launches */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Kernel Launches</span>
            <Cpu className="w-4 h-4 text-violet-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{result.totalKernelLaunches} ops</span>
            <span className="text-xs text-slate-400 line-through">
              {result.baselineKernelLaunches} ops
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {result.kernelLaunchReductionPercent.toFixed(0)}% Overhead
            </span>
            <span className="text-slate-400 text-[11px]">Launch Tail Latency</span>
          </div>
        </div>

        {/* Arena Verification & Disjointness */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Interference Invariant</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-xl font-black ${
                result.isDisjoint ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {result.isDisjoint ? "Disjoint & Safe" : "Overlap Collision!"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              Arena Frag: {result.fragmentationPercent.toFixed(1)}%
            </span>
            <span className="text-emerald-400 font-semibold">100% Verified</span>
          </div>
        </div>
      </div>

      {/* Step Playback Scrubber */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center gap-1 text-xs font-semibold cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause" : "Play Timeline"}
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((s) => Math.max(0, s - 1));
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs cursor-pointer"
              title="Step Back"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep((s) => Math.min(graph.totalSteps, s + 1));
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs cursor-pointer"
              title="Step Forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(0);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all text-xs cursor-pointer"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Execution Step:{" "}
              <strong className="text-white text-sm">
                {currentStep} / {graph.totalSteps}
              </strong>
            </span>
            {currentStepOp && (
              <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium">
                {currentStepOp.name} ({currentStepOp.opType})
              </span>
            )}
          </div>
        </div>

        {/* Timeline Slider & Markers */}
        <div className="relative flex flex-col gap-1 mt-1">
          <input
            type="range"
            min={0}
            max={graph.totalSteps}
            value={currentStep}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStep(Number(e.target.value));
            }}
            className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-950 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-slate-400 px-1">
            {graph.steps.map((s) => (
              <span
                key={s.stepIndex}
                className={`cursor-pointer transition-colors ${
                  s.stepIndex === currentStep ? "text-indigo-400 font-bold underline" : ""
                }`}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(s.stepIndex);
                }}
              >
                t{s.stepIndex}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Arena Address Space Block Diagram */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              VRAM Memory Arena Address Space (1D Offset Layout)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Total Arena Bound:{" "}
            <strong className="text-white">{formatBytes(result.totalArenaCapacityBytes)}</strong>
          </span>
        </div>

        {/* 1D Memory Arena Bar Visualizer */}
        <div className="w-full h-14 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-center p-1">
          {result.totalArenaCapacityBytes > 0 &&
            result.blocks
              .filter((b) => !b.isEliminatedByFusion && b.sizeBytes > 0)
              .map((block) => {
                const leftPct = (block.offset / result.totalArenaCapacityBytes) * 100;
                const widthPct = Math.max(
                  0.8,
                  (block.sizeBytes / result.totalArenaCapacityBytes) * 100,
                );
                const isAliveNow = block.startStep <= currentStep && currentStep <= block.endStep;
                const isSelected = selectedTensorId === block.tensorId;

                return (
                  <div
                    key={block.tensorId}
                    onClick={() =>
                      setSelectedTensorId(
                        selectedTensorId === block.tensorId ? null : block.tensorId,
                      )
                    }
                    className={`absolute h-10 rounded-lg cursor-pointer transition-all flex items-center justify-center border text-[10px] font-mono font-bold select-none px-1 overflow-hidden truncate ${
                      isSelected
                        ? "ring-2 ring-white z-20"
                        : isAliveNow
                          ? "opacity-100 shadow-md z-10 scale-[1.02]"
                          : "opacity-30 hover:opacity-75 z-0"
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: block.color,
                      borderColor: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.2)",
                      color: "#FFFFFF",
                    }}
                    title={`${block.tensorName} | Offset: 0x${block.offset.toString(16)} | Size: ${formatBytes(
                      block.sizeBytes,
                    )} | Lifetime: [t${block.startStep} -> t${block.endStep}]`}
                  >
                    {block.tensorName}
                  </div>
                );
              })}
        </div>

        {/* Legend & Selected Buffer Inspector */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active Buffer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 opacity-50"></span> Inactive /
              Reused
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Fused in SRAM (0 DRAM
              Bytes)
            </span>
          </div>

          {selectedTensorId && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Inspecting:</span>
              <strong className="text-indigo-400">{selectedTensorId}</strong>
              <button
                onClick={() => setSelectedTensorId(null)}
                className="text-slate-400 hover:text-white text-[10px] underline ml-1 cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gantt Timeline Interval Chart */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white">
              Tensor Liveness Intervals [t_start, t_end] & Fusion Elimination
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Active at t{currentStep}:{" "}
            <strong className="text-emerald-400 font-bold">
              {activeTensorsNow.length} buffers ({formatBytes(activeMemoryNow)})
            </strong>
          </span>
        </div>

        {/* Gantt Rows */}
        <div className="flex flex-col gap-1.5">
          {/* Header Axis */}
          <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-slate-400 pb-1 border-b border-slate-800">
            <div className="col-span-4">Tensor Buffer & Shape</div>
            <div className="col-span-2">Memory Size</div>
            <div className="col-span-6 flex justify-between px-1">
              {Array.from({ length: graph.totalSteps + 1 }).map((_, idx) => (
                <span
                  key={idx}
                  className={`text-center ${
                    idx === currentStep ? "text-indigo-400 font-bold" : ""
                  }`}
                >
                  t{idx}
                </span>
              ))}
            </div>
          </div>

          {/* Buffer Rows */}
          {graph.tensors.map((tensor) => {
            const block = result.blocks.find((b) => b.tensorId === tensor.id);
            const isEliminated = tensor.isEliminatedByFusion;
            const isAlive =
              !isEliminated && tensor.startStep <= currentStep && currentStep <= tensor.endStep;
            const isSelected = selectedTensorId === tensor.id;

            // Geometry of interval bar across 0..totalSteps
            const startFrac = (tensor.startStep / graph.totalSteps) * 100;
            const widthFrac = Math.max(
              6,
              ((tensor.endStep - tensor.startStep + 1) / (graph.totalSteps + 1)) * 100,
            );

            return (
              <div
                key={tensor.id}
                onClick={() =>
                  setSelectedTensorId(selectedTensorId === tensor.id ? null : tensor.id)
                }
                className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-slate-800/90 border-indigo-500 shadow-md"
                    : isAlive
                      ? "bg-slate-900/90 border-slate-700/80"
                      : "bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-90"
                }`}
              >
                {/* Name & Badge */}
                <div className="col-span-4 flex items-center gap-2 truncate">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tensor.colorHex }}
                  />
                  <div className="flex flex-col truncate">
                    <span className="text-xs font-semibold text-slate-200 truncate font-mono">
                      {tensor.name}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {tensor.shapeStr} &bull; {tensor.category}
                    </span>
                  </div>
                </div>

                {/* Size & Offset */}
                <div className="col-span-2 flex flex-col">
                  {isEliminated ? (
                    <span className="text-[11px] font-semibold text-orange-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Fused SRAM
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-200">
                        {formatBytes(tensor.sizeBytes)}
                      </span>
                      {block && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          0x{block.offset.toString(16)}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Timeline Bar */}
                <div className="col-span-6 relative h-6 bg-slate-950 rounded-md overflow-hidden border border-slate-800/80 flex items-center px-1">
                  {/* Step cursor indicator line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 z-10"
                    style={{
                      left: `${(currentStep / graph.totalSteps) * 100}%`,
                    }}
                  />

                  {isEliminated ? (
                    <div
                      className="absolute h-4 rounded text-[9px] font-bold text-orange-200 bg-orange-600/30 border border-orange-500/40 flex items-center justify-center px-2"
                      style={{
                        left: `${startFrac}%`,
                        width: `${widthFrac}%`,
                      }}
                    >
                      Fused Register
                    </div>
                  ) : (
                    <div
                      className={`absolute h-4 rounded text-[9px] font-bold text-white flex items-center justify-between px-1.5 transition-all ${
                        isAlive ? "ring-1 ring-white shadow-sm" : "opacity-40"
                      }`}
                      style={{
                        left: `${startFrac}%`,
                        width: `${widthFrac}%`,
                        backgroundColor: tensor.colorHex,
                      }}
                    >
                      <span>t{tensor.startStep}</span>
                      <span>t{tensor.endStep}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-Side Code Generator View (PyTorch Eager vs Inductor vs Fused Triton Mega-Kernel) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">
              Generated Compiler IR & Kernel Implementation
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveCodeTab("triton")}
                className={`py-1 px-2.5 rounded-md font-medium transition-all cursor-pointer ${
                  activeCodeTab === "triton"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Fused Triton Kernel
              </button>
              <button
                onClick={() => setActiveCodeTab("inductor")}
                className={`py-1 px-2.5 rounded-md font-medium transition-all cursor-pointer ${
                  activeCodeTab === "inductor"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                TorchInductor IR
              </button>
              <button
                onClick={() => setActiveCodeTab("eager")}
                className={`py-1 px-2.5 rounded-md font-medium transition-all cursor-pointer ${
                  activeCodeTab === "eager"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                PyTorch Eager Baseline
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs flex items-center gap-1 font-medium cursor-pointer"
              title="Copy Code"
            >
              {copiedCode ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedCode ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Code View Window */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
          <pre>
            {activeCodeTab === "eager"
              ? graph.eagerCode
              : activeCodeTab === "inductor"
                ? graph.inductorCode
                : graph.tritonCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
