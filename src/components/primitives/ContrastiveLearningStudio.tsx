import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Activity,
  Compass,
  Layers,
  BarChart2,
  TrendingUp,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Zap,
  Shield,
  Shuffle,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type Vector3 = [number, number, number];
export type Vector2 = [number, number];

export type ContrastiveParadigmId = "simclr" | "wang_isola" | "byol" | "clip_siglip";

export type BenchmarkDatasetId =
  | "image_text_pairing"
  | "data_augmentation_views"
  | "clustered_hypersphere"
  | "hard_negatives_geometry"
  | "dimensional_collapse_sandbox";

export type StudioTabId =
  | "hypersphere"
  | "similarity_matrix"
  | "pareto"
  | "effective_rank"
  | "theory";

export type ContrastivePresetId =
  | "simclr_hard_negatives"
  | "wang_isola_pareto_balance"
  | "byol_collapse_prevention"
  | "siglip_vs_clip_cross_modal"
  | "temperature_tuning_manifold"
  | "dimensional_collapse_recovery";

export type ProjectionMode = "3d_sphere" | "2d_circle";

export type ModalityType = "image" | "text" | "view1" | "view2" | "default";

export interface EmbeddingPoint {
  readonly id: string;
  readonly label: string;
  vector: Vector3;
  readonly clusterId: number;
  readonly modality: ModalityType;
  readonly pairId?: string; // ID of positive pair partner
  readonly color: string;
}

export interface PositivePair {
  readonly id1: string;
  readonly id2: string;
  readonly label: string;
  readonly similarity: number;
}

export interface AlgorithmHyperparameters {
  readonly temperature: number; // tau in [0.01, 1.0]
  readonly learningRate: number; // eta in [0.001, 0.5]
  readonly batchSize: number; // N in [4, 24]
  readonly alignmentAlpha: number; // alpha in [1, 4]
  readonly uniformityT: number; // t in [1, 5]
  readonly uniformityWeight: number; // lambda_unif in [0.1, 5.0]
  readonly byolMomentum: number; // m in [0.8, 0.999]
  readonly siglipBias: number; // b in [-10.0, 2.0]
  readonly useSigLIP: boolean; // toggle SigLIP vs standard CLIP InfoNCE
  readonly momentumFactor: number; // SGD momentum in [0.0, 0.95]
  readonly seed: number;
}

export interface OptimizationMetrics {
  readonly step: number;
  readonly loss: number;
  readonly alignmentLoss: number;
  readonly uniformityLoss: number;
  readonly contrastMargin: number;
  readonly effectiveRank: number;
  readonly meanPosSim: number;
  readonly meanNegSim: number;
  readonly temperature: number;
}

export interface OptimizationHistoryPoint {
  readonly step: number;
  readonly loss: number;
  readonly align: number;
  readonly unif: number;
  readonly effRank: number;
  readonly margin: number;
}

export interface OptimizationState {
  step: number;
  points: EmbeddingPoint[];
  targetPoints?: EmbeddingPoint[]; // BYOL target network embeddings
  predictorMatrix?: number[][]; // 3x3 predictor head for BYOL
  velocities: number[][]; // Momentum velocities for SGD
  metrics: OptimizationMetrics;
  history: OptimizationHistoryPoint[];
  paretoTrajectory: { readonly align: number; readonly unif: number; readonly step: number }[];
}

export interface Camera3D {
  azimuth: number; // in degrees
  elevation: number; // in degrees
  zoom: number;
  autoRotate: boolean;
}

export interface SimilarityMatrixData {
  readonly labels: readonly string[];
  readonly modalities: readonly ModalityType[];
  readonly matrix: readonly (readonly number[])[];
  readonly probabilities: readonly (readonly number[])[];
  readonly isPositiveMask: readonly (readonly boolean[])[];
  readonly meanPosSim: number;
  readonly meanNegSim: number;
  readonly contrastMargin: number;
}

export interface EffectiveRankAnalysis {
  readonly singularValues: [number, number, number];
  readonly normalizedSpectrum: [number, number, number];
  readonly effectiveRank: number;
  readonly entropy: number;
  readonly anisotropyRatio: number;
  readonly collapseStatus: "collapsed" | "anisotropic" | "well_distributed" | "isotropic";
}

export interface ContrastivePreset {
  readonly id: ContrastivePresetId;
  readonly name: string;
  readonly description: string;
  readonly paradigmId: ContrastiveParadigmId;
  readonly datasetId: BenchmarkDatasetId;
  readonly params: Partial<AlgorithmHyperparameters>;
  readonly educationalInsight: string;
}

export interface ContrastiveParadigmInfo {
  readonly id: ContrastiveParadigmId;
  readonly name: string;
  readonly authors: string;
  readonly year: number;
  readonly title: string;
  readonly formula: string;
  readonly keyConcept: string;
  readonly primaryPros: readonly string[];
  readonly primaryCons: readonly string[];
}

export interface BenchmarkDatasetInfo {
  readonly id: BenchmarkDatasetId;
  readonly name: string;
  readonly description: string;
  readonly pointCount: number;
  readonly clusterCount: number;
  readonly challengeDescription: string;
}

export interface ContrastiveLearningStudioProps {
  readonly initialParadigm?: ContrastiveParadigmId;
  readonly initialDataset?: BenchmarkDatasetId;
  readonly initialPreset?: ContrastivePresetId;
  readonly initialTemperature?: number;
  readonly initialLearningRate?: number;
  readonly initialBatchSize?: number;
  readonly seed?: number;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onStepChange?: (step: number, loss: number) => void;
  readonly className?: string;
}

// ============================================================================
// 2. DETERMINISTIC PRNG & VECTOR MATHEMATICAL UTILITIES
// ============================================================================

export class SeededRNG {
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed >>> 0;
  }

  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public uniform(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  public gaussian(mean: number = 0, std: number = 1): number {
    let u1 = this.next();
    let u2 = this.next();
    while (u1 <= 1e-15) u1 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * std;
  }

  public sampleUnitSphere3D(): Vector3 {
    const u = this.uniform(-1, 1);
    const theta = this.uniform(0, 2 * Math.PI);
    const r = Math.sqrt(Math.max(0, 1 - u * u));
    return [r * Math.cos(theta), r * Math.sin(theta), u];
  }

  public sampleUnitCircle2D(): Vector2 {
    const theta = this.uniform(0, 2 * Math.PI);
    return [Math.cos(theta), Math.sin(theta)];
  }
}

export function dotProduct3D(u: readonly number[], v: readonly number[]): number {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

export function norm3D(u: readonly number[]): number {
  return Math.sqrt(Math.max(1e-15, u[0] * u[0] + u[1] * u[1] + u[2] * u[2]));
}

export function normalize3D(u: readonly number[]): Vector3 {
  const n = norm3D(u);
  return [u[0] / n, u[1] / n, u[2] / n];
}

export function euclideanDistance3D(u: readonly number[], v: readonly number[]): number {
  const dx = u[0] - v[0];
  const dy = u[1] - v[1];
  const dz = u[2] - v[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function cosineSimilarity(u: readonly number[], v: readonly number[]): number {
  const nu = norm3D(u);
  const nv = norm3D(v);
  return dotProduct3D(u, v) / (nu * nv);
}

export function projectOntoHypersphere(u: readonly number[]): Vector3 {
  return normalize3D(u);
}

export function tangentSpaceProject(grad: readonly number[], point: readonly number[]): Vector3 {
  const normalProj = dotProduct3D(grad, point);
  return [
    grad[0] - normalProj * point[0],
    grad[1] - normalProj * point[1],
    grad[2] - normalProj * point[2],
  ];
}

export function matrixVectorMultiply3x3(M: number[][], v: readonly number[]): Vector3 {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2],
  ];
}

export function createIdentityMatrix3x3(): number[][] {
  return [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
}

// 3x3 Symmetric Matrix Jacobi Eigenvalue Decomposition
export function compute3x3Eigenvalues(A: number[][]): [number, number, number] {
  const a = [
    [A[0][0], A[0][1], A[0][2]],
    [A[1][0], A[1][1], A[1][2]],
    [A[2][0], A[2][1], A[2][2]],
  ];
  const n = 3;
  const maxIter = 50;

  for (let iter = 0; iter < maxIter; iter++) {
    let maxOff = 0;
    let p = 0;
    let q = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const absVal = Math.abs(a[i][j]);
        if (absVal > maxOff) {
          maxOff = absVal;
          p = i;
          q = j;
        }
      }
    }

    if (maxOff < 1e-11) break;

    const app = a[p][p];
    const aqq = a[q][q];
    const apq = a[p][q];
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi);
    const s = Math.sin(phi);

    const newApp = c * c * app - 2 * s * c * apq + s * s * aqq;
    const newAqq = s * s * app + 2 * s * c * apq + c * c * aqq;
    a[p][p] = newApp;
    a[q][q] = newAqq;
    a[p][q] = 0;
    a[q][p] = 0;

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = a[i][p];
        const aiq = a[i][q];
        a[i][p] = c * aip - s * aiq;
        a[p][i] = a[i][p];
        a[i][q] = s * aip + c * aiq;
        a[q][i] = a[i][q];
      }
    }
  }

  const eig: [number, number, number] = [
    Math.max(0, a[0][0]),
    Math.max(0, a[1][1]),
    Math.max(0, a[2][2]),
  ];
  eig.sort((x, y) => y - x);
  return [eig[0], eig[1], eig[2]];
}

export function computeSingularValueSpectrum(
  points: readonly EmbeddingPoint[],
): EffectiveRankAnalysis {
  const M = points.length;
  if (M === 0) {
    return {
      singularValues: [0, 0, 0],
      normalizedSpectrum: [1 / 3, 1 / 3, 1 / 3],
      effectiveRank: 3.0,
      entropy: Math.log(3),
      anisotropyRatio: 1.0,
      collapseStatus: "isotropic",
    };
  }

  // Compute Covariance / Gram matrix C = (1/M) * Z^T * Z in R^{3 x 3}
  const C = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  for (const pt of points) {
    const v = pt.vector;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        C[r][c] += (v[r] * v[c]) / M;
      }
    }
  }

  const eig = compute3x3Eigenvalues(C);
  const s1 = Math.sqrt(Math.max(0, eig[0]));
  const s2 = Math.sqrt(Math.max(0, eig[1]));
  const s3 = Math.sqrt(Math.max(0, eig[2]));
  const sumS = s1 + s2 + s3;

  let p1 = 1 / 3;
  let p2 = 1 / 3;
  let p3 = 1 / 3;

  if (sumS > 1e-12) {
    p1 = s1 / sumS;
    p2 = s2 / sumS;
    p3 = s3 / sumS;
  }

  const eps = 1e-15;
  const entropy = -(
    p1 * Math.log(Math.max(eps, p1)) +
    p2 * Math.log(Math.max(eps, p2)) +
    p3 * Math.log(Math.max(eps, p3))
  );

  const effectiveRank = Math.min(3.0, Math.max(1.0, Math.exp(entropy)));
  const anisotropyRatio = s1 / Math.max(1e-6, s3);

  let collapseStatus: "collapsed" | "anisotropic" | "well_distributed" | "isotropic" = "isotropic";
  if (effectiveRank < 1.4) {
    collapseStatus = "collapsed";
  } else if (effectiveRank < 2.3) {
    collapseStatus = "anisotropic";
  } else if (effectiveRank < 2.85) {
    collapseStatus = "well_distributed";
  } else {
    collapseStatus = "isotropic";
  }

  return {
    singularValues: [s1, s2, s3],
    normalizedSpectrum: [p1, p2, p3],
    effectiveRank,
    entropy,
    anisotropyRatio,
    collapseStatus,
  };
}

// ============================================================================
// 3. CONTRASTIVE LOSS FUNCTIONS & GRADIENTS
// ============================================================================

export function sigmoid(z: number): number {
  if (z >= 40) return 1.0;
  if (z <= -40) return 0.0;
  return 1.0 / (1.0 + Math.exp(-z));
}

// SimCLR InfoNCE Loss and Analytical Gradients
export function computeSimCLRInfoNCELoss(
  points: readonly EmbeddingPoint[],
  temperature: number = 0.1,
): {
  loss: number;
  gradients: Vector3[];
  similarities: number[][];
  probabilities: number[][];
} {
  const N = points.length;
  const tau = Math.max(0.01, temperature);
  const gradients: Vector3[] = Array.from({ length: N }, () => [0, 0, 0]);
  const similarities: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  const probabilities: number[][] = Array.from({ length: N }, () => Array(N).fill(0));

  if (N <= 1) {
    return { loss: 0, gradients, similarities, probabilities };
  }

  // Precompute pairwise cosine similarities
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      similarities[i][j] = dotProduct3D(points[i].vector, points[j].vector);
    }
  }

  // Map each point to positive index
  const idToIndex = new Map<string, number>();
  points.forEach((p, idx) => idToIndex.set(p.id, idx));

  let totalLoss = 0;
  let validPairsCount = 0;

  for (let i = 0; i < N; i++) {
    const anchor = points[i];
    const posId = anchor.pairId;
    if (!posId || !idToIndex.has(posId)) continue;
    const posIdx = idToIndex.get(posId)!;
    if (posIdx === i) continue;

    // Softmax over all k != i
    let maxSim = -Infinity;
    for (let k = 0; k < N; k++) {
      if (k === i) continue;
      const sim = similarities[i][k] / tau;
      if (sim > maxSim) maxSim = sim;
    }

    let sumExp = 0;
    for (let k = 0; k < N; k++) {
      if (k === i) continue;
      const expVal = Math.exp(similarities[i][k] / tau - maxSim);
      probabilities[i][k] = expVal;
      sumExp += expVal;
    }

    // Normalize probabilities
    for (let k = 0; k < N; k++) {
      if (k === i) continue;
      probabilities[i][k] /= Math.max(1e-15, sumExp);
    }

    const posProb = Math.max(1e-15, probabilities[i][posIdx]);
    const pairLoss = -Math.log(posProb);
    totalLoss += pairLoss;
    validPairsCount++;

    // Gradient with respect to anchor point i
    // nabla_{z_i} L_i = -1/tau * [ (1 - p_{i,pos}) * z_{pos} - sum_{k != i,pos} p_{ik} * z_k ]
    const pPos = probabilities[i][posIdx];
    const posVec = points[posIdx].vector;

    let gradX = -(1 - pPos) * posVec[0];
    let gradY = -(1 - pPos) * posVec[1];
    let gradZ = -(1 - pPos) * posVec[2];

    for (let k = 0; k < N; k++) {
      if (k === i || k === posIdx) continue;
      const pNeg = probabilities[i][k];
      const negVec = points[k].vector;
      gradX += pNeg * negVec[0];
      gradY += pNeg * negVec[1];
      gradZ += pNeg * negVec[2];
    }

    gradients[i][0] += gradX / tau;
    gradients[i][1] += gradY / tau;
    gradients[i][2] += gradZ / tau;
  }

  const avgLoss = validPairsCount > 0 ? totalLoss / validPairsCount : 0;
  if (validPairsCount > 0) {
    for (let i = 0; i < N; i++) {
      gradients[i][0] /= validPairsCount;
      gradients[i][1] /= validPairsCount;
      gradients[i][2] /= validPairsCount;
    }
  }

  return { loss: avgLoss, gradients, similarities, probabilities };
}

// Wang & Isola Alignment & Uniformity Loss
export function computeWangIsolaAlignment(
  points: readonly EmbeddingPoint[],
  alpha: number = 2.0,
): { loss: number; gradients: Vector3[] } {
  const N = points.length;
  const gradients: Vector3[] = Array.from({ length: N }, () => [0, 0, 0]);
  const idToIndex = new Map<string, number>();
  points.forEach((p, idx) => idToIndex.set(p.id, idx));

  let totalAlignLoss = 0;
  let pairCount = 0;

  for (let i = 0; i < N; i++) {
    const posId = points[i].pairId;
    if (!posId || !idToIndex.has(posId)) continue;
    const j = idToIndex.get(posId)!;
    if (j <= i) continue; // Count each undirected pair once

    const u = points[i].vector;
    const v = points[j].vector;
    const dist = euclideanDistance3D(u, v);
    const lossVal = Math.pow(Math.max(1e-12, dist), alpha);
    totalAlignLoss += lossVal;
    pairCount++;

    // Gradient: d/du ||u - v||^alpha = alpha * ||u - v||^(alpha - 2) * (u - v)
    const factor = alpha * Math.pow(Math.max(1e-12, dist), alpha - 2);
    const gradX = factor * (u[0] - v[0]);
    const gradY = factor * (u[1] - v[1]);
    const gradZ = factor * (u[2] - v[2]);

    gradients[i][0] += gradX;
    gradients[i][1] += gradY;
    gradients[i][2] += gradZ;

    gradients[j][0] -= gradX;
    gradients[j][1] -= gradY;
    gradients[j][2] -= gradZ;
  }

  const avgLoss = pairCount > 0 ? totalAlignLoss / pairCount : 0;
  if (pairCount > 0) {
    for (let i = 0; i < N; i++) {
      gradients[i][0] /= pairCount;
      gradients[i][1] /= pairCount;
      gradients[i][2] /= pairCount;
    }
  }

  return { loss: avgLoss, gradients };
}

export function computeWangIsolaUniformity(
  points: readonly EmbeddingPoint[],
  t: number = 2.0,
): { loss: number; gradients: Vector3[] } {
  const N = points.length;
  const gradients: Vector3[] = Array.from({ length: N }, () => [0, 0, 0]);

  if (N <= 1) {
    return { loss: 0, gradients };
  }

  const expMatrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  let totalExp = 0;

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const u = points[i].vector;
      const v = points[j].vector;
      const distSq = (u[0] - v[0]) ** 2 + (u[1] - v[1]) ** 2 + (u[2] - v[2]) ** 2;
      const val = Math.exp(-t * distSq);
      expMatrix[i][j] = val;
      totalExp += val;
    }
  }

  const avgExp = totalExp / (N * (N - 1));
  const unifLoss = Math.log(Math.max(1e-15, avgExp));

  // Gradient: nabla_{z_i} log E[e^{-t ||z_i - z_j||^2}] = (1 / totalExp) * sum_{j != i} -2t e^{-t ||z_i - z_j||^2} * 2(z_i - z_j)
  for (let i = 0; i < N; i++) {
    let gradX = 0;
    let gradY = 0;
    let gradZ = 0;

    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const weight = expMatrix[i][j];
      const u = points[i].vector;
      const v = points[j].vector;
      const factor = -2.0 * t * weight;
      gradX += factor * (u[0] - v[0]);
      gradY += factor * (u[1] - v[1]);
      gradZ += factor * (u[2] - v[2]);
    }

    gradients[i][0] = gradX / Math.max(1e-15, totalExp);
    gradients[i][1] = gradY / Math.max(1e-15, totalExp);
    gradients[i][2] = gradZ / Math.max(1e-15, totalExp);
  }

  return { loss: unifLoss, gradients };
}

// BYOL Online-Target Cosine Loss & Predictor Update
export function computeBYOLLoss(
  onlinePoints: readonly EmbeddingPoint[],
  targetPoints: readonly EmbeddingPoint[],
  predictorMatrix: number[][],
): {
  loss: number;
  onlineGradients: Vector3[];
  predictorGradients: number[][];
} {
  const N = onlinePoints.length;
  const onlineGradients: Vector3[] = Array.from({ length: N }, () => [0, 0, 0]);
  const predictorGradients: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  const targetIdToIndex = new Map<string, number>();
  targetPoints.forEach((p, idx) => targetIdToIndex.set(p.id, idx));

  let totalLoss = 0;
  let pairCount = 0;

  for (let i = 0; i < N; i++) {
    const posId = onlinePoints[i].pairId;
    if (!posId || !targetIdToIndex.has(posId)) continue;
    const targetIdx = targetIdToIndex.get(posId)!;

    const zOnline = onlinePoints[i].vector;
    const zTarget = targetPoints[targetIdx].vector;

    // Apply predictor head q(zOnline) = W_pred * zOnline
    const qUnnorm = matrixVectorMultiply3x3(predictorMatrix, zOnline);
    const qNorm = normalize3D(qUnnorm);

    // Cosine similarity
    const cosSim = dotProduct3D(qNorm, zTarget);
    // Loss L_byol = 2 - 2 * <q_norm, z_target>
    const pairLoss = 2.0 - 2.0 * cosSim;
    totalLoss += pairLoss;
    pairCount++;

    // Gradient w.r.t qNorm: dL/dqNorm = -2 * zTarget
    // Gradient w.r.t zOnline:
    const dLdq = [-2 * zTarget[0], -2 * zTarget[1], -2 * zTarget[2]];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        onlineGradients[i][c] += predictorMatrix[r][c] * dLdq[r];
        predictorGradients[r][c] += dLdq[r] * zOnline[c];
      }
    }
  }

  const avgLoss = pairCount > 0 ? totalLoss / pairCount : 0;
  if (pairCount > 0) {
    for (let i = 0; i < N; i++) {
      onlineGradients[i][0] /= pairCount;
      onlineGradients[i][1] /= pairCount;
      onlineGradients[i][2] /= pairCount;
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        predictorGradients[r][c] /= pairCount;
      }
    }
  }

  return { loss: avgLoss, onlineGradients, predictorGradients };
}

// SigLIP Pairwise Sigmoid Loss (Zhai et al. 2023)
export function computeSigLIPLoss(
  points: readonly EmbeddingPoint[],
  temperature: number = 0.1,
  bias: number = -5.0,
): {
  loss: number;
  gradients: Vector3[];
  biasGradient: number;
  similarities: number[][];
  probabilities: number[][];
} {
  const N = points.length;
  const tScale = 1.0 / Math.max(0.01, temperature);
  const gradients: Vector3[] = Array.from({ length: N }, () => [0, 0, 0]);
  const similarities: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  const probabilities: number[][] = Array.from({ length: N }, () => Array(N).fill(0));

  if (N <= 1) {
    return { loss: 0, gradients, biasGradient: 0, similarities, probabilities };
  }

  const idToIndex = new Map<string, number>();
  points.forEach((p, idx) => idToIndex.set(p.id, idx));

  let totalLoss = 0;
  let totalBiasGrad = 0;
  let validAnchorCount = 0;

  for (let i = 0; i < N; i++) {
    const anchor = points[i];
    const posId = anchor.pairId;
    if (!posId || !idToIndex.has(posId)) continue;
    const posIdx = idToIndex.get(posId)!;

    validAnchorCount++;

    for (let j = 0; j < N; j++) {
      if (j === i) continue;
      const dot = dotProduct3D(points[i].vector, points[j].vector);
      similarities[i][j] = dot;

      const isPositive = j === posIdx;
      const logit = tScale * dot + bias;
      const sigVal = sigmoid(logit);
      probabilities[i][j] = sigVal;

      if (isPositive) {
        // Positive loss: -log(sigmoid(logit)) = log(1 + exp(-logit))
        const pLoss = -Math.log(Math.max(1e-15, sigVal));
        totalLoss += pLoss;

        // Gradient w.r.t logit: -(1 - sigVal) = -(sigmoid(-logit))
        const dLdz = -(1.0 - sigVal);
        totalBiasGrad += dLdz;

        // dL/dx_i = dLdz * tScale * y_j
        const yj = points[j].vector;
        gradients[i][0] += dLdz * tScale * yj[0];
        gradients[i][1] += dLdz * tScale * yj[1];
        gradients[i][2] += dLdz * tScale * yj[2];
      } else {
        // Negative loss: -log(sigmoid(-logit)) = log(1 + exp(logit))
        const nLoss = -Math.log(Math.max(1e-15, 1.0 - sigVal));
        totalLoss += nLoss;

        // Gradient w.r.t logit: sigVal
        const dLdz = sigVal;
        totalBiasGrad += dLdz;

        const yj = points[j].vector;
        gradients[i][0] += dLdz * tScale * yj[0];
        gradients[i][1] += dLdz * tScale * yj[1];
        gradients[i][2] += dLdz * tScale * yj[2];
      }
    }
  }

  const denom = Math.max(1, validAnchorCount);
  const avgLoss = totalLoss / denom;
  const avgBiasGrad = totalBiasGrad / denom;

  for (let i = 0; i < N; i++) {
    gradients[i][0] /= denom;
    gradients[i][1] /= denom;
    gradients[i][2] /= denom;
  }

  return {
    loss: avgLoss,
    gradients,
    biasGradient: avgBiasGrad,
    similarities,
    probabilities,
  };
}

// Compute Similarity Matrix & Contrast Margin
export function computeSimilarityMatrixData(
  points: readonly EmbeddingPoint[],
  temperature: number = 0.1,
): SimilarityMatrixData {
  const N = points.length;
  const labels = points.map((p) => p.label);
  const modalities = points.map((p) => p.modality);
  const matrix: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  const probabilities: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  const isPositiveMask: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

  const idToIndex = new Map<string, number>();
  points.forEach((p, idx) => idToIndex.set(p.id, idx));

  let posSum = 0;
  let posCount = 0;
  let negSum = 0;
  let negCount = 0;

  for (let i = 0; i < N; i++) {
    const posId = points[i].pairId;
    const posIdx = posId && idToIndex.has(posId) ? idToIndex.get(posId)! : -1;

    let maxSim = -Infinity;
    for (let j = 0; j < N; j++) {
      const sim = dotProduct3D(points[i].vector, points[j].vector);
      matrix[i][j] = sim;
      if (sim / temperature > maxSim && i !== j) maxSim = sim / temperature;

      if (posIdx >= 0 && j === posIdx) {
        isPositiveMask[i][j] = true;
        posSum += sim;
        posCount++;
      } else if (i !== j) {
        negSum += sim;
        negCount++;
      }
    }

    let sumExp = 0;
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const expVal = Math.exp(matrix[i][j] / temperature - maxSim);
      probabilities[i][j] = expVal;
      sumExp += expVal;
    }
    for (let j = 0; j < N; j++) {
      if (i === j) {
        probabilities[i][j] = 0;
      } else {
        probabilities[i][j] /= Math.max(1e-12, sumExp);
      }
    }
  }

  const meanPosSim = posCount > 0 ? posSum / posCount : 0;
  const meanNegSim = negCount > 0 ? negSum / negCount : 0;
  const contrastMargin = meanPosSim - meanNegSim;

  return {
    labels,
    modalities,
    matrix,
    probabilities,
    isPositiveMask,
    meanPosSim,
    meanNegSim,
    contrastMargin,
  };
}

// ============================================================================
// 4. BENCHMARK DATASET GENERATORS (5 DATASETS)
// ============================================================================

export const PALETTE_COLORS = [
  "#38bdf8", // Sky Blue
  "#34d399", // Emerald
  "#fbbf24", // Amber
  "#f472b6", // Pink
  "#a78bfa", // Purple
  "#fb923c", // Orange
  "#2dd4bf", // Teal
  "#f87171", // Rose
  "#c084fc", // Violet
  "#818cf8", // Indigo
  "#4ade80", // Light Green
  "#facc15", // Yellow
];

export const CROSS_MODAL_CONCEPTS = [
  { name: "Cat", cluster: 0, color: "#38bdf8" },
  { name: "Dog", cluster: 0, color: "#38bdf8" },
  { name: "Sports Car", cluster: 1, color: "#34d399" },
  { name: "Jet Airplane", cluster: 1, color: "#34d399" },
  { name: "Coral Reef", cluster: 2, color: "#fbbf24" },
  { name: "Pine Forest", cluster: 2, color: "#fbbf24" },
  { name: "Alpine Mountain", cluster: 2, color: "#fbbf24" },
  { name: "Golden Sunset", cluster: 3, color: "#f472b6" },
  { name: "Space Rocket", cluster: 3, color: "#f472b6" },
  { name: "Humanoid Robot", cluster: 4, color: "#a78bfa" },
  { name: "Acoustic Guitar", cluster: 4, color: "#a78bfa" },
  { name: "Espresso Cup", cluster: 5, color: "#fb923c" },
];

export function generateImageTextDataset(rng: SeededRNG, count: number = 12): EmbeddingPoint[] {
  const actualCount = Math.min(count, CROSS_MODAL_CONCEPTS.length);
  const points: EmbeddingPoint[] = [];

  for (let i = 0; i < actualCount; i++) {
    const concept = CROSS_MODAL_CONCEPTS[i];
    // Base semantic direction on unit sphere
    const baseVec = rng.sampleUnitSphere3D();

    // Image embedding: base + small perturbation
    const imgPerturb: Vector3 = [
      baseVec[0] + rng.gaussian(0, 0.15),
      baseVec[1] + rng.gaussian(0, 0.15),
      baseVec[2] + rng.gaussian(0, 0.15),
    ];
    const imgVec = normalize3D(imgPerturb);

    // Text embedding: base + modality offset + small perturbation
    const txtPerturb: Vector3 = [
      baseVec[0] + rng.gaussian(0, 0.15),
      baseVec[1] + rng.gaussian(0, 0.15),
      baseVec[2] + rng.gaussian(0, 0.15),
    ];
    const txtVec = normalize3D(txtPerturb);

    const imgId = `img_${i}`;
    const txtId = `txt_${i}`;

    points.push({
      id: imgId,
      label: `${concept.name} (Img)`,
      vector: imgVec,
      clusterId: concept.cluster,
      modality: "image",
      pairId: txtId,
      color: concept.color,
    });

    points.push({
      id: txtId,
      label: `${concept.name} (Txt)`,
      vector: txtVec,
      clusterId: concept.cluster,
      modality: "text",
      pairId: imgId,
      color: concept.color,
    });
  }

  return points;
}

export function generateAugmentationDataset(rng: SeededRNG, count: number = 10): EmbeddingPoint[] {
  const points: EmbeddingPoint[] = [];

  for (let i = 0; i < count; i++) {
    const baseVec = rng.sampleUnitSphere3D();
    const color = PALETTE_COLORS[i % PALETTE_COLORS.length];

    // View 1: small rotation jitter
    const v1Vec = normalize3D([
      baseVec[0] + rng.gaussian(0, 0.2),
      baseVec[1] + rng.gaussian(0, 0.2),
      baseVec[2] + rng.gaussian(0, 0.2),
    ]);

    // View 2: alternative perturbation
    const v2Vec = normalize3D([
      baseVec[0] + rng.gaussian(0, 0.2),
      baseVec[1] + rng.gaussian(0, 0.2),
      baseVec[2] + rng.gaussian(0, 0.2),
    ]);

    const id1 = `view1_${i}`;
    const id2 = `view2_${i}`;

    points.push({
      id: id1,
      label: `Sample ${i + 1} (v1)`,
      vector: v1Vec,
      clusterId: i,
      modality: "view1",
      pairId: id2,
      color,
    });

    points.push({
      id: id2,
      label: `Sample ${i + 1} (v2)`,
      vector: v2Vec,
      clusterId: i,
      modality: "view2",
      pairId: id1,
      color,
    });
  }

  return points;
}

export function generateClusteredHypersphereDataset(
  rng: SeededRNG,
  clusterCount: number = 5,
  pointsPerCluster: number = 4,
): EmbeddingPoint[] {
  const points: EmbeddingPoint[] = [];
  const clusterCenters: Vector3[] = [];

  for (let c = 0; c < clusterCount; c++) {
    clusterCenters.push(rng.sampleUnitSphere3D());
  }

  let globalId = 0;
  for (let c = 0; c < clusterCount; c++) {
    const center = clusterCenters[c];
    const color = PALETTE_COLORS[c % PALETTE_COLORS.length];

    for (let p = 0; p < pointsPerCluster; p += 2) {
      // Create a positive pair within the cluster
      const baseSub = [
        center[0] + rng.gaussian(0, 0.25),
        center[1] + rng.gaussian(0, 0.25),
        center[2] + rng.gaussian(0, 0.25),
      ];

      const v1 = normalize3D([
        baseSub[0] + rng.gaussian(0, 0.1),
        baseSub[1] + rng.gaussian(0, 0.1),
        baseSub[2] + rng.gaussian(0, 0.1),
      ]);

      const v2 = normalize3D([
        baseSub[0] + rng.gaussian(0, 0.1),
        baseSub[1] + rng.gaussian(0, 0.1),
        baseSub[2] + rng.gaussian(0, 0.1),
      ]);

      const id1 = `clust_${c}_${p}`;
      const id2 = `clust_${c}_${p + 1}`;

      points.push({
        id: id1,
        label: `C${c + 1} #${p + 1}a`,
        vector: v1,
        clusterId: c,
        modality: "view1",
        pairId: id2,
        color,
      });

      points.push({
        id: id2,
        label: `C${c + 1} #${p + 1}b`,
        vector: v2,
        clusterId: c,
        modality: "view2",
        pairId: id1,
        color,
      });

      globalId += 2;
    }
  }

  return points;
}

export function generateHardNegativesDataset(
  rng: SeededRNG,
  clusterCount: number = 4,
  pairsPerCluster: number = 2,
): EmbeddingPoint[] {
  const points: EmbeddingPoint[] = [];
  // Two closely positioned cluster pairs (e.g. angle ~ 25 degrees)
  const baseAxis1: Vector3 = [1, 0, 0];
  const closeAxis2: Vector3 = normalize3D([1, 0.35, 0.1]);
  const baseAxis3: Vector3 = [0, 0, 1];
  const closeAxis4: Vector3 = normalize3D([0.3, 0, 1]);

  const centers = [baseAxis1, closeAxis2, baseAxis3, closeAxis4];

  for (let c = 0; c < Math.min(clusterCount, centers.length); c++) {
    const center = centers[c];
    const color = PALETTE_COLORS[c % PALETTE_COLORS.length];

    for (let p = 0; p < pairsPerCluster; p++) {
      const v1 = normalize3D([
        center[0] + rng.gaussian(0, 0.12),
        center[1] + rng.gaussian(0, 0.12),
        center[2] + rng.gaussian(0, 0.12),
      ]);
      const v2 = normalize3D([
        center[0] + rng.gaussian(0, 0.12),
        center[1] + rng.gaussian(0, 0.12),
        center[2] + rng.gaussian(0, 0.12),
      ]);

      const id1 = `hard_${c}_${p * 2}`;
      const id2 = `hard_${c}_${p * 2 + 1}`;

      points.push({
        id: id1,
        label: `Hard C${c + 1} (v1)`,
        vector: v1,
        clusterId: c,
        modality: "view1",
        pairId: id2,
        color,
      });

      points.push({
        id: id2,
        label: `Hard C${c + 1} (v2)`,
        vector: v2,
        clusterId: c,
        modality: "view2",
        pairId: id1,
        color,
      });
    }
  }

  return points;
}

export function generateDimensionalCollapseDataset(
  rng: SeededRNG,
  count: number = 8,
): EmbeddingPoint[] {
  const points: EmbeddingPoint[] = [];

  // All points collapsed strictly near a single 1D ray [1, 0, 0]
  for (let i = 0; i < count; i++) {
    const t = rng.uniform(-0.01, 0.01);
    const color = PALETTE_COLORS[i % PALETTE_COLORS.length];

    const v1 = normalize3D([1.0, t + rng.gaussian(0, 0.003), rng.gaussian(0, 0.003)]);
    const v2 = normalize3D([1.0, t + rng.gaussian(0, 0.003), rng.gaussian(0, 0.003)]);

    const id1 = `collapse_${i}_a`;
    const id2 = `collapse_${i}_b`;

    points.push({
      id: id1,
      label: `Collapsed #${i + 1}a`,
      vector: v1,
      clusterId: i,
      modality: "view1",
      pairId: id2,
      color,
    });

    points.push({
      id: id2,
      label: `Collapsed #${i + 1}b`,
      vector: v2,
      clusterId: i,
      modality: "view2",
      pairId: id1,
      color,
    });
  }

  return points;
}

export function generateBenchmarkDataset(
  datasetId: BenchmarkDatasetId,
  count: number = 10,
  rng: SeededRNG,
): EmbeddingPoint[] {
  switch (datasetId) {
    case "image_text_pairing":
      return generateImageTextDataset(rng, count);
    case "data_augmentation_views":
      return generateAugmentationDataset(rng, count);
    case "clustered_hypersphere":
      return generateClusteredHypersphereDataset(rng, 5, 4);
    case "hard_negatives_geometry":
      return generateHardNegativesDataset(rng, 4);
    case "dimensional_collapse_sandbox":
      return generateDimensionalCollapseDataset(rng, count);
    default:
      return generateAugmentationDataset(rng, count);
  }
}

// ============================================================================
// 5. PARADIGMS METADATA & PRESET DEFINITIONS
// ============================================================================

export const CONTRASTIVE_PARADIGM_INFOS: Record<ContrastiveParadigmId, ContrastiveParadigmInfo> = {
  simclr: {
    id: "simclr",
    name: "SimCLR (InfoNCE / NT-Xent)",
    authors: "Chen, Kornblith, Norouzi, Hinton",
    year: 2020,
    title: "A Simple Framework for Contrastive Learning of Visual Representations",
    formula:
      "\\mathcal{L}_{i,j} = -\\log \\frac{\\exp(\\text{sim}(z_i, z_j) / \\tau)}{\\sum_{k \\ne i} \\exp(\\text{sim}(z_i, z_k) / \\tau)}",
    keyConcept:
      "Normalizes embeddings onto unit hypersphere S^{d-1} and uses temperature-scaled cross entropy to attract positive views while repelling all 2N-2 negative views.",
    primaryPros: [
      "Hard negative hardness-awareness controlled directly by temperature tau",
      "Mathematically grounded in mutual information maximization",
      "Scales cleanly with large batch sizes",
    ],
    primaryCons: [
      "Requires large negative batch sizes to prevent collapse",
      "False negative repulsion can push semantically identical instances apart",
    ],
  },
  wang_isola: {
    id: "wang_isola",
    name: "Wang & Isola Alignment & Uniformity",
    authors: "Wang & Isola",
    year: 2020,
    title: "Understanding Contrastive Representation Learning through Alignment and Uniformity",
    formula:
      "\\mathcal{L} = \\mathbb{E}_{(x, x')}[\\|f(x)-f(x')\\|_2^\\alpha] + \\lambda \\log \\mathbb{E}_{x,y}[e^{-t \\|f(x)-f(y)\\|_2^2}]",
    keyConcept:
      "Decomposes contrastive representation quality into two asymptotic properties on S^{d-1}: Alignment (invariance to views) and Uniformity (maximal entropy representation preserving maximal information).",
    primaryPros: [
      "Direct optimization of Pareto frontier between alignment and uniformity",
      "Asymptotically proven to converge to optimal hyperspherical distributions",
      "Eliminates partition function softmax overhead",
    ],
    primaryCons: [
      "Requires hyperparameter tuning for weight lambda_unif",
      "Uniformity RBF kernel sum scales as O(N^2) pairwise",
    ],
  },
  byol: {
    id: "byol",
    name: "BYOL (Bootstrap Your Own Latent)",
    authors: "Grill, Strub, Altché, Tallec et al.",
    year: 2020,
    title: "Bootstrap Your Own Latent: A New Approach to Self-Supervised Learning",
    formula:
      "\\mathcal{L}_{\\text{BYOL}} = 2 - 2 \\frac{\\langle q_\\theta(z_\\theta), z'_\\xi \\rangle}{\\|q_\\theta\\|_2 \\|z'_\\xi\\|_2}, \\quad \\xi \\leftarrow m \\xi + (1-m) \\theta",
    keyConcept:
      "Prevents representation collapse without negative pairs by training an online predictor to match target representations updated via Exponential Moving Average (EMA).",
    primaryPros: [
      "Zero negative pairs required - immune to batch size bottlenecks",
      "Eliminates false negative repulsion degradation",
      "Predictor asymmetry acts as implicit regularizer",
    ],
    primaryCons: [
      "Requires target network EMA parameter tracking",
      "Sensitive to momentum hyperparameter m in [0.99, 0.999]",
    ],
  },
  clip_siglip: {
    id: "clip_siglip",
    name: "CLIP & SigLIP (Cross-Modal Representation)",
    authors: "Radford et al. / Zhai, Mustafa, Kolesnikov, Beyer",
    year: 2023,
    title: "Sigmoid Loss for Language-Image Pre-training (SigLIP)",
    formula:
      "\\mathcal{L}_{\\text{SigLIP}} = -\\frac{1}{N} \\sum_{i=1}^N \\left( \\log \\sigma(t x_i^T y_i + b) + \\sum_{j \\ne i} \\log \\sigma(-t x_i^T y_j - b) \\right)",
    keyConcept:
      "Replaces standard cross-entropy softmax with decoupled pairwise binary sigmoid classifications with learnable temperature t and bias b, achieving linear distributed memory scalability.",
    primaryPros: [
      "Decoupled pairwise loss with no global softmax denominator",
      "Enables training at massive batch sizes (up to 1M+) with linear communication",
      "Exceptional cross-modal zero-shot retrieval performance",
    ],
    primaryCons: [
      "Requires calibration of learnable bias b",
      "Sigmoid slope requires sharp temperature scaling",
    ],
  },
};

export const BENCHMARK_DATASET_INFOS: Record<BenchmarkDatasetId, BenchmarkDatasetInfo> = {
  image_text_pairing: {
    id: "image_text_pairing",
    name: "Image-Text Cross-Modal Pairing",
    description: "12 semantic concepts with image and text modality representations.",
    pointCount: 24,
    clusterCount: 6,
    challengeDescription:
      "Align multi-modal representations while preserving concept boundaries across modalities.",
  },
  data_augmentation_views: {
    id: "data_augmentation_views",
    name: "Data Augmentation Views",
    description:
      "Multi-view stochastic augmentations generated via rotational jitter on the sphere.",
    pointCount: 20,
    clusterCount: 10,
    challengeDescription:
      "Learn view-invariant representations without collapsing distinct instances together.",
  },
  clustered_hypersphere: {
    id: "clustered_hypersphere",
    name: "Clustered Hypersphere Manifold",
    description: "5 semantic clusters distributed around the 3D unit hypersphere S^2.",
    pointCount: 20,
    clusterCount: 5,
    challengeDescription: "Test intra-cluster compactness and inter-cluster angular margin.",
  },
  hard_negatives_geometry: {
    id: "hard_negatives_geometry",
    name: "Hard Negatives Geometry",
    description: "Closely situated clusters with overlapping angular boundaries.",
    pointCount: 16,
    clusterCount: 4,
    challengeDescription:
      "Evaluate temperature sensitivity tau on repelling hard negatives without shattering representations.",
  },
  dimensional_collapse_sandbox: {
    id: "dimensional_collapse_sandbox",
    name: "Dimensional Collapse Sandbox",
    description: "Embeddings initially collapsed onto a narrow 1D filament.",
    pointCount: 16,
    clusterCount: 8,
    challengeDescription:
      "Observe representation restoration from EffRank ~ 1.0 to isotropic 3.0 via contrastive repulsion.",
  },
};

export const CONTRASTIVE_STUDIO_PRESETS: Record<ContrastivePresetId, ContrastivePreset> = {
  simclr_hard_negatives: {
    id: "simclr_hard_negatives",
    name: "SimCLR: Hard Negatives & Sharp Temperature",
    description: "InfoNCE with low temperature tau = 0.05 on tightly packed clusters.",
    paradigmId: "simclr",
    datasetId: "hard_negatives_geometry",
    params: {
      temperature: 0.05,
      learningRate: 0.08,
      batchSize: 16,
      momentumFactor: 0.9,
    },
    educationalInsight:
      "Low temperature tau = 0.05 sharpens softmax weights on nearest hard negatives, exerting strong repulsive forces that disentangle ambiguous cluster boundaries.",
  },
  wang_isola_pareto_balance: {
    id: "wang_isola_pareto_balance",
    name: "Wang & Isola: Alignment vs Uniformity Trade-off",
    description: "Direct optimization of alignment loss + uniformity RBF repulsive potential.",
    paradigmId: "wang_isola",
    datasetId: "clustered_hypersphere",
    params: {
      alignmentAlpha: 2.0,
      uniformityT: 2.0,
      uniformityWeight: 1.2,
      learningRate: 0.06,
    },
    educationalInsight:
      "Tracking the Pareto trajectory shows how representations balance positive view attraction with spherical entropy maximization to prevent dimensional collapse.",
  },
  byol_collapse_prevention: {
    id: "byol_collapse_prevention",
    name: "BYOL: Negative-Free Bootstrap Representation",
    description: "Online predictor head + target network EMA with momentum m = 0.99.",
    paradigmId: "byol",
    datasetId: "data_augmentation_views",
    params: {
      byolMomentum: 0.99,
      learningRate: 0.05,
      batchSize: 12,
    },
    educationalInsight:
      "Even without negative pairs, the asymmetry between online predictor and target EMA prevents representations from collapsing into a single trivial constant vector.",
  },
  siglip_vs_clip_cross_modal: {
    id: "siglip_vs_clip_cross_modal",
    name: "SigLIP: Decoupled Pairwise Sigmoid Pre-training",
    description:
      "Cross-modal image-text alignment with pairwise sigmoid loss and learnable bias b.",
    paradigmId: "clip_siglip",
    datasetId: "image_text_pairing",
    params: {
      temperature: 0.1,
      siglipBias: -4.5,
      useSigLIP: true,
      learningRate: 0.06,
    },
    educationalInsight:
      "SigLIP replaces global softmax normalization with independent binary sigmoid classifications, achieving linear distributed memory complexity while preserving high zero-shot retrieval accuracy.",
  },
  temperature_tuning_manifold: {
    id: "temperature_tuning_manifold",
    name: "SimCLR: Temperature Hardness Scaling",
    description: "InfoNCE with moderate temperature tau = 0.2 on clustered manifold.",
    paradigmId: "simclr",
    datasetId: "clustered_hypersphere",
    params: {
      temperature: 0.2,
      learningRate: 0.05,
      batchSize: 20,
    },
    educationalInsight:
      "Moderate temperature tau = 0.2 provides smooth gradient flow across all negative samples, preventing noisy gradient spikes while ensuring steady representation spreading.",
  },
  dimensional_collapse_recovery: {
    id: "dimensional_collapse_recovery",
    name: "Representation Recovery from Complete Collapse",
    description: "Initial 1D anisotropic filament restored to full 3D isotropic hypersphere.",
    paradigmId: "simclr",
    datasetId: "dimensional_collapse_sandbox",
    params: {
      temperature: 0.08,
      learningRate: 0.1,
      batchSize: 16,
    },
    educationalInsight:
      "Starting with an anisotropic Effective Rank ~ 1.05, contrastive repulsion expands embeddings across all orthogonal basis vectors until Effective Rank approaches 3.0.",
  },
};

// ============================================================================
// 6. SINGLE-STEP CONTRASTIVE OPTIMIZATION ENGINE
// ============================================================================

export function stepContrastiveOptimization(
  state: OptimizationState,
  paradigm: ContrastiveParadigmId,
  params: AlgorithmHyperparameters,
): OptimizationState {
  const currentStep = state.step + 1;
  const points = state.points.map((p) => ({
    ...p,
    vector: [...p.vector] as Vector3,
  }));
  const N = points.length;

  let loss = 0;
  let alignLoss = 0;
  let unifLoss = 0;
  let gradients: Vector3[] = Array.from({ length: N }, () => [0, 0, 0]);

  // Compute Alignment & Uniformity metrics for diagnostic logging
  const alignMetrics = computeWangIsolaAlignment(points, params.alignmentAlpha);
  const unifMetrics = computeWangIsolaUniformity(points, params.uniformityT);
  alignLoss = alignMetrics.loss;
  unifLoss = unifMetrics.loss;

  let newPredictorMatrix = state.predictorMatrix
    ? state.predictorMatrix.map((r) => [...r])
    : createIdentityMatrix3x3();
  let newTargetPoints = state.targetPoints
    ? state.targetPoints.map((p) => ({ ...p, vector: [...p.vector] as Vector3 }))
    : undefined;

  switch (paradigm) {
    case "simclr": {
      const simclrResult = computeSimCLRInfoNCELoss(points, params.temperature);
      loss = simclrResult.loss;
      gradients = simclrResult.gradients;
      break;
    }
    case "wang_isola": {
      const alignRes = computeWangIsolaAlignment(points, params.alignmentAlpha);
      const unifRes = computeWangIsolaUniformity(points, params.uniformityT);
      loss = alignRes.loss + params.uniformityWeight * unifRes.loss;
      for (let i = 0; i < N; i++) {
        gradients[i] = [
          alignRes.gradients[i][0] + params.uniformityWeight * unifRes.gradients[i][0],
          alignRes.gradients[i][1] + params.uniformityWeight * unifRes.gradients[i][1],
          alignRes.gradients[i][2] + params.uniformityWeight * unifRes.gradients[i][2],
        ];
      }
      break;
    }
    case "byol": {
      if (!newTargetPoints) {
        newTargetPoints = points.map((p) => ({ ...p, vector: [...p.vector] as Vector3 }));
      }
      const byolRes = computeBYOLLoss(points, newTargetPoints, newPredictorMatrix);
      loss = byolRes.loss;
      gradients = byolRes.onlineGradients;

      // Update predictor matrix weights
      const lr = params.learningRate;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          newPredictorMatrix[r][c] -= lr * byolRes.predictorGradients[r][c];
        }
      }

      // Update Target network via EMA: xi <- m * xi + (1 - m) * theta
      const m = params.byolMomentum;
      for (let i = 0; i < N; i++) {
        const targetV = newTargetPoints[i].vector;
        const onlineV = points[i].vector;
        const updatedTarget: Vector3 = [
          m * targetV[0] + (1 - m) * onlineV[0],
          m * targetV[1] + (1 - m) * onlineV[1],
          m * targetV[2] + (1 - m) * onlineV[2],
        ];
        newTargetPoints[i].vector = normalize3D(updatedTarget);
      }
      break;
    }
    case "clip_siglip": {
      if (params.useSigLIP) {
        const siglipRes = computeSigLIPLoss(points, params.temperature, params.siglipBias);
        loss = siglipRes.loss;
        gradients = siglipRes.gradients;
      } else {
        const clipRes = computeSimCLRInfoNCELoss(points, params.temperature);
        loss = clipRes.loss;
        gradients = clipRes.gradients;
      }
      break;
    }
  }

  // Apply Momentum SGD with Hyperspherical Tangent Space Projection
  const newVelocities: number[][] = [];
  const eta = params.learningRate;
  const mu = params.momentumFactor;

  for (let i = 0; i < N; i++) {
    const p = points[i].vector;
    const grad = gradients[i];

    // Project gradient onto tangent space of S^2
    const tanGrad = tangentSpaceProject(grad, p);

    // Update velocity with momentum
    const oldVel = state.velocities[i] || [0, 0, 0];
    const vx = mu * oldVel[0] - eta * tanGrad[0];
    const vy = mu * oldVel[1] - eta * tanGrad[1];
    const vz = mu * oldVel[2] - eta * tanGrad[2];
    newVelocities.push([vx, vy, vz]);

    // Update position and renormalize to S^2
    const updatedPos: Vector3 = [p[0] + vx, p[1] + vy, p[2] + vz];
    points[i].vector = normalize3D(updatedPos);
  }

  // Compute Rank & Similarity Metrics
  const rankAnalysis = computeSingularValueSpectrum(points);
  const simData = computeSimilarityMatrixData(points, params.temperature);

  const metrics: OptimizationMetrics = {
    step: currentStep,
    loss,
    alignmentLoss: alignLoss,
    uniformityLoss: unifLoss,
    contrastMargin: simData.contrastMargin,
    effectiveRank: rankAnalysis.effectiveRank,
    meanPosSim: simData.meanPosSim,
    meanNegSim: simData.meanNegSim,
    temperature: params.temperature,
  };

  const newHistoryPoint: OptimizationHistoryPoint = {
    step: currentStep,
    loss,
    align: alignLoss,
    unif: unifLoss,
    effRank: rankAnalysis.effectiveRank,
    margin: simData.contrastMargin,
  };

  const newHistory = [...state.history.slice(-199), newHistoryPoint];
  const newParetoTrajectory = [
    ...state.paretoTrajectory.slice(-99),
    { align: alignLoss, unif: unifLoss, step: currentStep },
  ];

  return {
    step: currentStep,
    points,
    targetPoints: newTargetPoints,
    predictorMatrix: newPredictorMatrix,
    velocities: newVelocities,
    metrics,
    history: newHistory,
    paretoTrajectory: newParetoTrajectory,
  };
}

// ============================================================================
// 7. 3D HYPERSPHERE PROJECTION & RENDERING
// ============================================================================

export function project3DToHypersphereView(
  point: Vector3,
  camera: Camera3D,
  width: number,
  height: number,
): { x: number; y: number; zDepth: number } {
  const radAz = (camera.azimuth * Math.PI) / 180;
  const radEl = (camera.elevation * Math.PI) / 180;

  const cosAz = Math.cos(radAz);
  const sinAz = Math.sin(radAz);
  const cosEl = Math.cos(radEl);
  const sinEl = Math.sin(radEl);

  // Rotation around Y (Azimuth)
  const x1 = point[0] * cosAz + point[2] * sinAz;
  const y1 = point[1];
  const z1 = -point[0] * sinAz + point[2] * cosAz;

  // Rotation around X (Elevation)
  const x2 = x1;
  const y2 = y1 * cosEl - z1 * sinEl;
  const z2 = y1 * sinEl + z1 * cosEl;

  const radius = Math.min(width, height) * 0.38 * camera.zoom;
  const screenX = width / 2 + x2 * radius;
  const screenY = height / 2 - y2 * radius;

  return { x: screenX, y: screenY, zDepth: z2 };
}

// ============================================================================
// 8. MAIN REACT COMPONENT: ContrastiveLearningStudio
// ============================================================================

export const ContrastiveLearningStudio: React.FC<ContrastiveLearningStudioProps> = ({
  initialParadigm = "simclr",
  initialDataset = "image_text_pairing",
  initialPreset = "simclr_hard_negatives",
  initialTemperature = 0.1,
  initialLearningRate = 0.05,
  initialBatchSize = 12,
  seed = 42,
  width = "100%",
  height = "auto",
  standalone: _standalone = true,
  title = "Contrastive Learning & Representation Alignment Studio",
  onStepChange,
  className = "",
}) => {
  // State: High-level selection
  const [paradigm, setParadigm] = useState<ContrastiveParadigmId>(initialParadigm);
  const [datasetId, setDatasetId] = useState<BenchmarkDatasetId>(initialDataset);
  const [activeTab, setActiveTab] = useState<StudioTabId>("hypersphere");
  const [selectedPreset, setSelectedPreset] = useState<ContrastivePresetId>(initialPreset);
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>("3d_sphere");
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Hyperparameters
  const [temperature, setTemperature] = useState<number>(initialTemperature);
  const [learningRate, setLearningRate] = useState<number>(initialLearningRate);
  const [batchSize, setBatchSize] = useState<number>(initialBatchSize);
  const [alignmentAlpha, setAlignmentAlpha] = useState<number>(2.0);
  const [uniformityT, setUniformityT] = useState<number>(2.0);
  const [uniformityWeight, setUniformityWeight] = useState<number>(1.0);
  const [byolMomentum, setByolMomentum] = useState<number>(0.99);
  const [siglipBias, setSiglipBias] = useState<number>(-5.0);
  const [useSigLIP, setUseSigLIP] = useState<boolean>(true);
  const [momentumFactor, setMomentumFactor] = useState<number>(0.9);

  // Animation & Runner State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // steps per tick
  const [camera, setCamera] = useState<Camera3D>({
    azimuth: 35,
    elevation: 20,
    zoom: 1.0,
    autoRotate: true,
  });

  // RNG and Initial Dataset initialization
  const rngRef = useRef<SeededRNG>(new SeededRNG(seed));

  const initializeState = useCallback(
    (dsId: BenchmarkDatasetId, bSize: number, s: number = seed): OptimizationState => {
      const rng = new SeededRNG(s);
      rngRef.current = rng;
      const initialPoints = generateBenchmarkDataset(dsId, bSize, rng);
      const rankAnalysis = computeSingularValueSpectrum(initialPoints);
      const simData = computeSimilarityMatrixData(initialPoints, temperature);
      const alignMetrics = computeWangIsolaAlignment(initialPoints, alignmentAlpha);
      const unifMetrics = computeWangIsolaUniformity(initialPoints, uniformityT);

      const targetPoints = initialPoints.map((p) => ({
        ...p,
        vector: [...p.vector] as Vector3,
      }));

      const initialMetrics: OptimizationMetrics = {
        step: 0,
        loss: 0,
        alignmentLoss: alignMetrics.loss,
        uniformityLoss: unifMetrics.loss,
        contrastMargin: simData.contrastMargin,
        effectiveRank: rankAnalysis.effectiveRank,
        meanPosSim: simData.meanPosSim,
        meanNegSim: simData.meanNegSim,
        temperature,
      };

      return {
        step: 0,
        points: initialPoints,
        targetPoints,
        predictorMatrix: createIdentityMatrix3x3(),
        velocities: initialPoints.map(() => [0, 0, 0]),
        metrics: initialMetrics,
        history: [
          {
            step: 0,
            loss: 0,
            align: alignMetrics.loss,
            unif: unifMetrics.loss,
            effRank: rankAnalysis.effectiveRank,
            margin: simData.contrastMargin,
          },
        ],
        paretoTrajectory: [{ align: alignMetrics.loss, unif: unifMetrics.loss, step: 0 }],
      };
    },
    [seed, temperature, alignmentAlpha, uniformityT],
  );

  const [optState, setOptState] = useState<OptimizationState>(() =>
    initializeState(datasetId, batchSize, seed),
  );

  // Hyperparameters bundle
  const currentParams: AlgorithmHyperparameters = useMemo(
    () => ({
      temperature,
      learningRate,
      batchSize,
      alignmentAlpha,
      uniformityT,
      uniformityWeight,
      byolMomentum,
      siglipBias,
      useSigLIP,
      momentumFactor,
      seed,
    }),
    [
      temperature,
      learningRate,
      batchSize,
      alignmentAlpha,
      uniformityT,
      uniformityWeight,
      byolMomentum,
      siglipBias,
      useSigLIP,
      momentumFactor,
      seed,
    ],
  );

  // Step function
  const handleSingleStep = useCallback(() => {
    setOptState((prev) => {
      const nextState = stepContrastiveOptimization(prev, paradigm, currentParams);
      if (onStepChange) {
        onStepChange(nextState.step, nextState.metrics.loss);
      }
      return nextState;
    });
  }, [paradigm, currentParams, onStepChange]);

  // Reset function
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setOptState(initializeState(datasetId, batchSize, seed));
    setSelectedPointId(null);
  }, [datasetId, batchSize, seed, initializeState]);

  // Apply Preset
  const handleApplyPreset = useCallback(
    (presetId: ContrastivePresetId) => {
      const preset = CONTRASTIVE_STUDIO_PRESETS[presetId];
      if (!preset) return;

      setSelectedPreset(presetId);
      setParadigm(preset.paradigmId);
      setDatasetId(preset.datasetId);

      if (preset.params.temperature !== undefined) setTemperature(preset.params.temperature);
      if (preset.params.learningRate !== undefined) setLearningRate(preset.params.learningRate);
      if (preset.params.batchSize !== undefined) setBatchSize(preset.params.batchSize);
      if (preset.params.alignmentAlpha !== undefined)
        setAlignmentAlpha(preset.params.alignmentAlpha);
      if (preset.params.uniformityT !== undefined) setUniformityT(preset.params.uniformityT);
      if (preset.params.uniformityWeight !== undefined)
        setUniformityWeight(preset.params.uniformityWeight);
      if (preset.params.byolMomentum !== undefined) setByolMomentum(preset.params.byolMomentum);
      if (preset.params.siglipBias !== undefined) setSiglipBias(preset.params.siglipBias);
      if (preset.params.useSigLIP !== undefined) setUseSigLIP(preset.params.useSigLIP);
      if (preset.params.momentumFactor !== undefined)
        setMomentumFactor(preset.params.momentumFactor);

      setIsPlaying(false);
      setOptState(initializeState(preset.datasetId, preset.params.batchSize || batchSize, seed));
    },
    [batchSize, seed, initializeState],
  );

  // Perturb representations to test recovery
  const handlePerturb = useCallback(() => {
    const rng = new SeededRNG(Date.now());
    setOptState((prev) => {
      const perturbed = prev.points.map((p) => {
        const v = p.vector;
        const noisy = normalize3D([
          v[0] + rng.gaussian(0, 0.4),
          v[1] + rng.gaussian(0, 0.4),
          v[2] + rng.gaussian(0, 0.4),
        ]);
        return { ...p, vector: noisy };
      });
      return {
        ...prev,
        points: perturbed,
        velocities: perturbed.map(() => [0, 0, 0]),
      };
    });
  }, []);

  // Animation Loop for Play/Pause and Camera Auto-Rotate
  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = (_time: number) => {
      // Auto-rotate camera slowly
      if (camera.autoRotate) {
        setCamera((cam) => ({
          ...cam,
          azimuth: (cam.azimuth + 0.25) % 360,
        }));
      }

      // Simulation steps
      if (isPlaying) {
        for (let s = 0; s < playbackSpeed; s++) {
          setOptState((prev) => {
            const next = stepContrastiveOptimization(prev, paradigm, currentParams);
            if (onStepChange) onStepChange(next.step, next.metrics.loss);
            return next;
          });
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed, camera.autoRotate, paradigm, currentParams, onStepChange]);

  // Derived analyses
  const similarityData = useMemo(
    () => computeSimilarityMatrixData(optState.points, temperature),
    [optState.points, temperature],
  );

  const rankAnalysis = useMemo(
    () => computeSingularValueSpectrum(optState.points),
    [optState.points],
  );

  // Canvas Ref & Mouse Interaction
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setCamera((cam) => ({
      ...cam,
      azimuth: (cam.azimuth + dx * 0.5) % 360,
      elevation: Math.max(-85, Math.min(85, cam.elevation + dy * 0.5)),
      autoRotate: false,
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.92 : 1.08;
    setCamera((cam) => ({
      ...cam,
      zoom: Math.max(0.5, Math.min(2.5, cam.zoom * zoomDelta)),
    }));
  };

  // Canvas Drawing for Hypersphere
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const sphereRadius = Math.min(width, height) * 0.38 * camera.zoom;
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw Spherical Ambient Glow & Background Wireframe
    const bgGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      sphereRadius * 0.1,
      centerX,
      centerY,
      sphereRadius * 1.05,
    );
    bgGradient.addColorStop(0, "rgba(30, 41, 59, 0.45)");
    bgGradient.addColorStop(0.8, "rgba(15, 23, 42, 0.7)");
    bgGradient.addColorStop(1, "rgba(15, 23, 42, 0.95)");

    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Sphere Equator & Latitude/Longitude Grid Lines
    ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
    ctx.lineWidth = 1;

    // Latitudes: phi in [-pi/3, -pi/6, 0, pi/6, pi/3]
    const latitudes = [-Math.PI / 3, -Math.PI / 6, 0, Math.PI / 6, Math.PI / 3];
    latitudes.forEach((lat) => {
      ctx.beginPath();
      const zVal = Math.sin(lat);
      const rVal = Math.cos(lat);
      const steps = 48;
      for (let s = 0; s <= steps; s++) {
        const theta = (s / steps) * 2 * Math.PI;
        const pt3D: Vector3 = [rVal * Math.cos(theta), rVal * Math.sin(theta), zVal];
        const proj = project3DToHypersphereView(pt3D, camera, width, height);
        if (s === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();
    });

    // Longitudes: theta in [0, pi/4, pi/2, 3pi/4, pi, 5pi/4, 3pi/2, 7pi/4]
    const longitudes = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
    longitudes.forEach((lon) => {
      ctx.beginPath();
      const steps = 48;
      for (let s = 0; s <= steps; s++) {
        const phi = (s / steps) * 2 * Math.PI;
        const pt3D: Vector3 = [
          Math.cos(lon) * Math.cos(phi),
          Math.sin(lon) * Math.cos(phi),
          Math.sin(phi),
        ];
        const proj = project3DToHypersphereView(pt3D, camera, width, height);
        if (s === 0) ctx.moveTo(proj.x, proj.y);
        else ctx.lineTo(proj.x, proj.y);
      }
      ctx.stroke();
    });

    // Outer Rim Rimlight
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, sphereRadius, 0, 2 * Math.PI);
    ctx.stroke();

    // Map point positions and sort by depth for correct 3D rendering
    const mappedPoints = optState.points.map((p) => {
      if (projectionMode === "2d_circle") {
        const theta = Math.atan2(p.vector[1], p.vector[0]);
        const screenX = centerX + Math.cos(theta) * sphereRadius;
        const screenY = centerY - Math.sin(theta) * sphereRadius;
        return { point: p, proj: { x: screenX, y: screenY, zDepth: 0 } };
      }
      const proj = project3DToHypersphereView(p.vector, camera, width, height);
      return { point: p, proj };
    });

    // Draw Positive Pair Attraction Springs
    const idToMapped = new Map<string, (typeof mappedPoints)[0]>();
    mappedPoints.forEach((mp) => idToMapped.set(mp.point.id, mp));

    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i < mappedPoints.length; i++) {
      const mp1 = mappedPoints[i];
      const posId = mp1.point.pairId;
      if (!posId || !idToMapped.has(posId)) continue;
      const mp2 = idToMapped.get(posId)!;
      if (mp1.point.id < mp2.point.id) {
        // Compute cosine similarity between pair
        const cosSim = dotProduct3D(mp1.point.vector, mp2.point.vector);
        // Alpha based on alignment
        const alpha = Math.max(0.3, Math.min(0.9, (cosSim + 1) / 2));
        ctx.strokeStyle = `rgba(52, 211, 153, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(mp1.proj.x, mp1.proj.y);
        ctx.lineTo(mp2.proj.x, mp2.proj.y);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Sort by depth (zDepth ascending: draw distant points first)
    mappedPoints.sort((a, b) => a.proj.zDepth - b.proj.zDepth);

    // Draw Representation Embeddings
    mappedPoints.forEach(({ point, proj }) => {
      const isSelected = selectedPointId === point.id;
      const zNorm = (proj.zDepth + 1) / 2; // [0, 1]
      const alpha = 0.35 + 0.65 * Math.max(0, Math.min(1, zNorm));
      const radius = isSelected ? 9 : 6 + 3 * zNorm;

      // Glow halo
      ctx.fillStyle = isSelected ? "rgba(245, 158, 11, 0.4)" : `rgba(56, 189, 248, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, radius + 4, 0, 2 * Math.PI);
      ctx.fill();

      // Core Node
      ctx.fillStyle = point.color;
      ctx.beginPath();

      if (point.modality === "text") {
        // Square marker for Text modality
        const half = radius;
        ctx.rect(proj.x - half, proj.y - half, half * 2, half * 2);
      } else if (point.modality === "view2") {
        // Diamond marker for View 2
        ctx.moveTo(proj.x, proj.y - radius);
        ctx.lineTo(proj.x + radius, proj.y);
        ctx.lineTo(proj.x, proj.y + radius);
        ctx.lineTo(proj.x - radius, proj.y);
        ctx.closePath();
      } else {
        // Circle marker for Image / View 1 / default
        ctx.arc(proj.x, proj.y, radius, 0, 2 * Math.PI);
      }
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#ffffff" : "rgba(15, 23, 42, 0.8)";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      if (isSelected || zNorm > 0.4) {
        ctx.font = isSelected ? "bold 11px sans-serif" : "10px sans-serif";
        ctx.fillStyle = isSelected ? "#fef08a" : `rgba(226, 232, 240, ${alpha})`;
        ctx.textAlign = "center";
        ctx.fillText(point.label, proj.x, proj.y - radius - 4);
      }
    });
  }, [optState.points, camera, selectedPointId, projectionMode]);

  return (
    <div
      className={`contrastive-learning-studio w-full rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl p-4 md:p-6 flex flex-col gap-5 select-none ${className}`}
      style={{ maxWidth: width, minHeight: height }}
    >
      {/* 1. STUDIO HEADER & PRESET PICKER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white shadow-lg shadow-cyan-950">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  v2.4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Self-Supervised Contrastive Dynamics, Wang & Isola Hyperspherical Alignment, BYOL
                EMA & SigLIP Decoupling
              </p>
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <Layers className="w-4 h-4 text-cyan-400 ml-2" />
          <span className="text-xs font-medium text-slate-400">Preset:</span>
          <select
            aria-label="Preset Selector"
            className="bg-slate-950 text-xs font-semibold text-cyan-300 rounded-lg px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
            value={selectedPreset}
            onChange={(e) => handleApplyPreset(e.target.value as ContrastivePresetId)}
          >
            {Object.values(CONTRASTIVE_STUDIO_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. PARADIGM & DATASET SELECTOR TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paradigm Tabs */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Contrastive Learning Paradigm
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            {(
              [
                ["simclr", "SimCLR"],
                ["wang_isola", "Wang & Isola"],
                ["byol", "BYOL"],
                ["clip_siglip", "CLIP / SigLIP"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setParadigm(id)}
                className={`text-xs font-semibold py-2 px-2 rounded-lg transition-all text-center truncate ${
                  paradigm === id
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Tabs */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            Benchmark Manifold & Distribution
          </label>
          <select
            aria-label="Benchmark Dataset Selector"
            className="w-full bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            value={datasetId}
            onChange={(e) => {
              const newDs = e.target.value as BenchmarkDatasetId;
              setDatasetId(newDs);
              setIsPlaying(false);
              setOptState(initializeState(newDs, batchSize, seed));
            }}
          >
            {Object.values(BENCHMARK_DATASET_INFOS).map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name} ({ds.pointCount} points)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. DIAGNOSTIC HUD BANNER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Step</span>
          <span className="text-lg font-bold text-white font-mono">{optState.step}</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Objective Loss</span>
          <span className="text-lg font-bold text-amber-400 font-mono">
            {optState.metrics.loss.toFixed(4)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Alignment (L_align)</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {optState.metrics.alignmentLoss.toFixed(4)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Uniformity (L_unif)</span>
          <span className="text-lg font-bold text-cyan-400 font-mono">
            {optState.metrics.uniformityLoss.toFixed(4)}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Effective Rank</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-lg font-bold font-mono ${
                rankAnalysis.collapseStatus === "collapsed"
                  ? "text-red-400"
                  : rankAnalysis.collapseStatus === "anisotropic"
                    ? "text-amber-400"
                    : "text-emerald-400"
              }`}
            >
              {rankAnalysis.effectiveRank.toFixed(2)} / 3.0
            </span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col">
          <span className="text-[11px] font-medium text-slate-400">Contrast Margin Δ</span>
          <span className="text-lg font-bold text-pink-400 font-mono">
            {(optState.metrics.contrastMargin * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 4. MAIN VISUALIZATION STUDIO TABS & CANVAS */}
      <div className="flex flex-col gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        {/* Studio Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {(
              [
                ["hypersphere", "Hypersphere Geometry", Compass],
                ["similarity_matrix", "Similarity Heatmap", Activity],
                ["pareto", "Pareto Alignment vs Uniformity", TrendingUp],
                ["effective_rank", "Singular Values & Effective Rank", BarChart2],
                ["theory", "Theory & Mathematical Proofs", HelpCircle],
              ] as const
            ).map(([tabId, tabName, TabIcon]) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tabId
                    ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tabName}
              </button>
            ))}
          </div>

          {/* Interactive Canvas Controls */}
          {activeTab === "hypersphere" && (
            <div className="flex items-center gap-2">
              {/* 3D vs 2D Toggle */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setProjectionMode("3d_sphere")}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    projectionMode === "3d_sphere"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  3D S²
                </button>
                <button
                  onClick={() => setProjectionMode("2d_circle")}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    projectionMode === "2d_circle"
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  2D S¹
                </button>
              </div>

              {projectionMode === "3d_sphere" && (
                <button
                  onClick={() => setCamera((cam) => ({ ...cam, autoRotate: !cam.autoRotate }))}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-all ${
                    camera.autoRotate
                      ? "bg-cyan-950/80 text-cyan-300 border-cyan-800"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${camera.autoRotate ? "animate-spin" : ""}`} />
                  Auto-Rotate
                </button>
              )}

              <button
                onClick={() =>
                  setCamera({ azimuth: 35, elevation: 20, zoom: 1.0, autoRotate: true })
                }
                className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800 rounded-lg hover:text-slate-200"
              >
                Reset View
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: 3D Hypersphere Canvas */}
        {activeTab === "hypersphere" && (
          <div className="relative w-full h-[420px] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
            <canvas
              ref={canvasRef}
              width={760}
              height={420}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className="cursor-grab active:cursor-grabbing w-full h-full"
            />

            {/* Hypersphere Legend Overlay */}
            <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5 pointer-events-none text-[11px]">
              <span className="font-bold text-slate-300">Representation Space S²</span>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-slate-400">Anchor View 1 (Circle)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-400" />
                <span className="text-slate-400">View 2 / Text Modality (Square)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 border-t border-dashed border-emerald-400" />
                <span className="text-slate-400">Positive Pair Alignment Attraction</span>
              </div>
            </div>

            {/* Collapse Warning Badge */}
            {rankAnalysis.collapseStatus === "collapsed" && (
              <div className="absolute top-3 right-3 bg-red-950/90 backdrop-blur-md border border-red-800 text-red-300 rounded-xl px-3 py-2 flex items-center gap-2 animate-bounce">
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold">
                  Dimensional Collapse Detected (EffRank &lt; 1.4)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cosine Similarity Heatmap Matrix */}
        {activeTab === "similarity_matrix" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-4">
                <span>
                  Mean Pos Sim:{" "}
                  <strong className="text-emerald-400">
                    {similarityData.meanPosSim.toFixed(3)}
                  </strong>
                </span>
                <span>
                  Mean Neg Sim:{" "}
                  <strong className="text-slate-400">{similarityData.meanNegSim.toFixed(3)}</strong>
                </span>
                <span>
                  Contrast Margin Δ:{" "}
                  <strong className="text-cyan-400">
                    {(similarityData.contrastMargin * 100).toFixed(1)}%
                  </strong>
                </span>
              </div>
              <span className="text-slate-500">Gold borders = Positive Pairs</span>
            </div>

            <div className="overflow-x-auto bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div
                className="grid gap-1 min-w-[500px]"
                style={{
                  gridTemplateColumns: `repeat(${similarityData.labels.length}, minmax(0, 1fr))`,
                }}
              >
                {similarityData.matrix.map((row, rIdx) =>
                  row.map((simVal, cIdx) => {
                    const isPos = similarityData.isPositiveMask[rIdx][cIdx];
                    const isDiag = rIdx === cIdx;

                    // Color from deep navy (-1) to slate (0) to gold (+1)
                    let bgColor = "rgba(30, 41, 59, 0.4)";
                    if (simVal > 0) {
                      const alpha = Math.min(1, simVal);
                      bgColor = `rgba(16, 185, 129, ${alpha * 0.85})`;
                    } else {
                      const alpha = Math.min(1, Math.abs(simVal));
                      bgColor = `rgba(59, 130, 246, ${alpha * 0.7})`;
                    }

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        title={`${similarityData.labels[rIdx]} ↔ ${
                          similarityData.labels[cIdx]
                        }\nCosine Sim: ${simVal.toFixed(3)}\nSoftmax Prob: ${(
                          similarityData.probabilities[rIdx][cIdx] * 100
                        ).toFixed(1)}%`}
                        className={`aspect-square rounded flex items-center justify-center text-[9px] font-mono transition-transform hover:scale-110 cursor-pointer ${
                          isPos
                            ? "border-2 border-amber-400 font-bold text-amber-200"
                            : isDiag
                              ? "border border-slate-700 text-slate-500"
                              : "text-white/80"
                        }`}
                        style={{ backgroundColor: bgColor }}
                      >
                        {simVal.toFixed(2)}
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Pareto Alignment vs Uniformity Trade-off */}
        {activeTab === "pareto" && (
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300">
                Pareto Objective: Minimize Alignment{" "}
                <strong className="text-emerald-400">L_align</strong> (view invariance) & Uniformity{" "}
                <strong className="text-cyan-400">L_unif</strong> (maximal spherical entropy).
              </span>
              <span className="text-slate-500">Lower left is optimal</span>
            </div>

            <div className="h-[360px] bg-slate-950 rounded-xl border border-slate-800 p-4 relative flex flex-col justify-between">
              {/* Pareto SVG Plot */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 300">
                {/* Axes */}
                <line x1="40" y1="260" x2="480" y2="260" stroke="#334155" strokeWidth="1.5" />
                <line x1="40" y1="20" x2="40" y2="260" stroke="#334155" strokeWidth="1.5" />

                {/* Grid */}
                <line x1="40" y1="140" x2="480" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="260" y1="20" x2="260" y2="260" stroke="#1e293b" strokeDasharray="3 3" />

                <text x="260" y="290" fill="#94a3b8" fontSize="11" textAnchor="middle">
                  Alignment Loss L_align (lower is better →)
                </text>
                <text
                  x="15"
                  y="140"
                  fill="#94a3b8"
                  fontSize="11"
                  textAnchor="middle"
                  transform="rotate(-90 15 140)"
                >
                  Uniformity Loss L_unif (lower is better ↓)
                </text>

                {/* Theoretical Pareto Boundary Curve */}
                <path
                  d="M 50 240 Q 120 180 300 100 T 460 50"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />

                {/* Trajectory Polyline */}
                {optState.paretoTrajectory.length > 1 && (
                  <polyline
                    points={optState.paretoTrajectory
                      .map((p) => {
                        const x = 40 + Math.min(420, (p.align / 2.0) * 420);
                        const y = 260 - Math.min(230, Math.max(0, (-p.unif / 3.0) * 230));
                        return `${x},${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                  />
                )}

                {/* Current Point Marker */}
                {optState.paretoTrajectory.length > 0 &&
                  (() => {
                    const lastP = optState.paretoTrajectory[optState.paretoTrajectory.length - 1];
                    const x = 40 + Math.min(420, (lastP.align / 2.0) * 420);
                    const y = 260 - Math.min(230, Math.max(0, (-lastP.unif / 3.0) * 230));
                    return (
                      <g>
                        <circle cx={x} cy={y} r="8" fill="rgba(52, 211, 153, 0.3)" />
                        <circle cx={x} cy={y} r="4" fill="#34d399" />
                        <text x={x + 10} y={y - 6} fill="#ffffff" fontSize="10" fontWeight="bold">
                          ({lastP.align.toFixed(2)}, {lastP.unif.toFixed(2)})
                        </text>
                      </g>
                    );
                  })()}
              </svg>
            </div>
          </div>
        )}

        {/* Tab 4: Singular Value Spectrum & Effective Rank Analysis */}
        {activeTab === "effective_rank" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Singular Value Bar Chart */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-300">
                Representation Singular Value Spectrum (s₁, s₂, s₃)
              </span>

              <div className="flex items-end justify-around h-48 border-b border-slate-800 pb-2 px-6">
                {rankAnalysis.singularValues.map((sVal, idx) => {
                  const maxS = Math.max(...rankAnalysis.singularValues, 0.001);
                  const heightPercent = (sVal / maxS) * 100;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-16">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {sVal.toFixed(3)}
                      </span>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-300"
                        style={{ height: `${Math.max(4, heightPercent)}%` }}
                      />
                      <span className="text-xs font-semibold text-slate-400">s_{idx + 1}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Anisotropy Index s₁/s₃:</span>
                <strong className="text-amber-400 font-mono">
                  {rankAnalysis.anisotropyRatio.toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Effective Rank Gauge & History */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300">
                  Effective Rank: exp(H(p)) ∈ [1.0, 3.0]
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Quantifies representation dimensionality. EffRank = 3.0 indicates uniform
                  isotropic representation across all 3 dimensions. EffRank &lt; 1.4 indicates
                  dimensional collapse.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-400">Current Rank:</span>
                  <span
                    className={`text-2xl font-black font-mono ${
                      rankAnalysis.collapseStatus === "collapsed"
                        ? "text-red-400"
                        : rankAnalysis.collapseStatus === "anisotropic"
                          ? "text-amber-400"
                          : "text-emerald-400"
                    }`}
                  >
                    {rankAnalysis.effectiveRank.toFixed(3)}
                  </span>
                </div>

                {/* Progress Gauge */}
                <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      rankAnalysis.collapseStatus === "collapsed"
                        ? "bg-red-500"
                        : rankAnalysis.collapseStatus === "anisotropic"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${((rankAnalysis.effectiveRank - 1.0) / 2.0) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1.0 (Collapse)</span>
                  <span>2.0 (Anisotropic)</span>
                  <span>3.0 (Isotropic)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                <span>Status:</span>
                <span
                  className={`font-bold uppercase tracking-wider ${
                    rankAnalysis.collapseStatus === "collapsed"
                      ? "text-red-400"
                      : rankAnalysis.collapseStatus === "anisotropic"
                        ? "text-amber-400"
                        : "text-emerald-400"
                  }`}
                >
                  {rankAnalysis.collapseStatus}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Theory & Mathematical Proofs */}
        {activeTab === "theory" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
            {Object.values(CONTRASTIVE_PARADIGM_INFOS).map((info) => (
              <div
                key={info.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-sm">{info.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{info.year}</span>
                </div>
                <span className="text-[11px] text-slate-400 italic">
                  {info.authors} — {info.title}
                </span>

                <div className="p-2 rounded-lg bg-slate-900 font-mono text-[11px] text-amber-300 overflow-x-auto border border-slate-800">
                  {info.formula}
                </div>

                <p className="text-slate-300 leading-relaxed">{info.keyConcept}</p>

                <div className="flex flex-col gap-1 text-[11px]">
                  <span className="font-semibold text-emerald-400">Key Strengths:</span>
                  <ul className="list-disc pl-4 text-slate-400 space-y-0.5">
                    {info.primaryPros.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. INTERACTIVE CONTROLS HUD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
        {/* Playback Buttons & Speed */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all ${
                isPlaying
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              {isPlaying ? "Pause Training" : "Run Optimization"}
            </button>

            <button
              onClick={handleSingleStep}
              disabled={isPlaying}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Step
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={handlePerturb}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
              title="Add random spherical perturbation to test representation recovery"
            >
              <Shuffle className="w-3.5 h-3.5 text-pink-400" />
              Perturb
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Speed:</span>
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded font-mono font-bold ${
                  playbackSpeed === spd
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Hyperparameter Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800 text-xs">
          {/* Temperature Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label htmlFor="param-temperature" className="text-slate-400 font-medium">
                Temperature (τ):
              </label>
              <span className="font-mono text-cyan-300 font-bold">{temperature.toFixed(2)}</span>
            </div>
            <input
              id="param-temperature"
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Learning Rate Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label htmlFor="param-learning-rate" className="text-slate-400 font-medium">
                Learning Rate (η):
              </label>
              <span className="font-mono text-emerald-300 font-bold">
                {learningRate.toFixed(3)}
              </span>
            </div>
            <input
              id="param-learning-rate"
              type="range"
              min="0.005"
              max="0.3"
              step="0.005"
              value={learningRate}
              onChange={(e) => setLearningRate(parseFloat(e.target.value))}
              className="accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Batch Size Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label htmlFor="param-batch-size" className="text-slate-400 font-medium">
                Sample Pairs (N):
              </label>
              <span className="font-mono text-amber-300 font-bold">{batchSize}</span>
            </div>
            <input
              id="param-batch-size"
              type="range"
              min="4"
              max="20"
              step="2"
              value={batchSize}
              onChange={(e) => {
                const newB = parseInt(e.target.value, 10);
                setBatchSize(newB);
                setIsPlaying(false);
                setOptState(initializeState(datasetId, newB, seed));
              }}
              className="accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Paradigm Specific Parameter */}
          {paradigm === "wang_isola" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label htmlFor="param-uniformity-weight" className="text-slate-400 font-medium">
                  Uniformity Wt (λ):
                </label>
                <span className="font-mono text-pink-300 font-bold">
                  {uniformityWeight.toFixed(1)}
                </span>
              </div>
              <input
                id="param-uniformity-weight"
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={uniformityWeight}
                onChange={(e) => setUniformityWeight(parseFloat(e.target.value))}
                className="accent-pink-400 cursor-pointer"
              />
            </div>
          )}

          {paradigm === "byol" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label htmlFor="param-byol-momentum" className="text-slate-400 font-medium">
                  EMA Momentum (m):
                </label>
                <span className="font-mono text-purple-300 font-bold">
                  {byolMomentum.toFixed(3)}
                </span>
              </div>
              <input
                id="param-byol-momentum"
                type="range"
                min="0.9"
                max="0.999"
                step="0.001"
                value={byolMomentum}
                onChange={(e) => setByolMomentum(parseFloat(e.target.value))}
                className="accent-purple-400 cursor-pointer"
              />
            </div>
          )}

          {paradigm === "clip_siglip" && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <label htmlFor="param-siglip-bias" className="text-slate-400 font-medium">
                  SigLIP Bias (b):
                </label>
                <span className="font-mono text-cyan-300 font-bold">{siglipBias.toFixed(1)}</span>
              </div>
              <input
                id="param-siglip-bias"
                type="range"
                min="-8.0"
                max="-1.0"
                step="0.2"
                value={siglipBias}
                onChange={(e) => setSiglipBias(parseFloat(e.target.value))}
                className="accent-cyan-400 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
