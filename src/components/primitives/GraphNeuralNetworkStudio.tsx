import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Info,
  CheckCircle2,
  AlertTriangle,
  Move,
  Plus,
  Trash2,
  Share2,
  Cpu,
  Flame,
  Binary,
  Code2,
  TrendingDown,
} from "lucide-react";

// ============================================================================
// 1. MATHEMATICAL TYPES & DATA CONTRACTS
// ============================================================================

export type GNNStudioTab = "architecture" | "spectral" | "oversmoothing" | "weisfeiler_lehman";

export type MessagePassingArchitecture = "gcn" | "graphsage" | "gat" | "gin";

export type GraphSageAggregator = "mean" | "max" | "sum";

export type ActivationFunction = "relu" | "leaky_relu" | "elu" | "tanh" | "sigmoid" | "identity";

export type GNNPresetId =
  | "karate_club"
  | "cora_subgraph"
  | "wl_decagon_pentagons"
  | "tree_bottleneck"
  | "molecule_benzene_caffeine"
  | "custom_editable";

export interface GNNNode {
  readonly id: string;
  readonly label: string;
  x: number;
  y: number;
  readonly community?: number;
  readonly features: number[];
  readonly groundTruthClass?: number;
  readonly atomType?: string;
}

export interface GNNEdge {
  readonly source: string;
  readonly target: string;
  readonly weight?: number;
  readonly bondType?: "single" | "double" | "aromatic";
}

export interface GNNGraphPreset {
  readonly id: GNNPresetId;
  readonly name: string;
  readonly description: string;
  readonly nodes: readonly GNNNode[];
  readonly edges: readonly GNNEdge[];
  readonly isPair?: boolean;
  readonly secondaryGraph?: {
    readonly name: string;
    readonly nodes: readonly GNNNode[];
    readonly edges: readonly GNNEdge[];
  };
  readonly defaultTab?: GNNStudioTab;
}

export interface SpectralDecompositionResult {
  readonly eigenvalues: number[];
  readonly eigenvectors: number[][]; // Columns are eigenvectors: U = [u_0, u_1, ..., u_{N-1}]
  readonly sortedIndices: number[];
}

export interface WLRefinementStep {
  readonly step: number;
  readonly nodeColors: Record<string, string>;
  readonly colorHistograms: Record<string, number>;
  readonly numUniqueColors: number;
  readonly stabilized: boolean;
  readonly multisets: Record<string, string>;
}

export interface WLRefinementResult {
  readonly steps: WLRefinementStep[];
  readonly stabilizedStep: number;
  readonly finalColors: Record<string, string>;
  readonly finalHistogram: Record<string, number>;
}

export interface WLComparisonResult {
  readonly graph1Result: WLRefinementResult;
  readonly graph2Result: WLRefinementResult;
  readonly isDistinguishable: boolean;
  readonly distinctionStep: number | null;
  readonly verdictExplanation: string;
}

export interface TrajectoryPoint {
  readonly layer: number;
  readonly dirichletEnergy: number;
  readonly unnormalizedDirichletEnergy: number;
  readonly meanCosineDistance: number;
  readonly maxCosineSimilarity: number;
  readonly nodeEmbeddings: number[][];
}

export interface GraphNeuralNetworkStudioProps {
  readonly initialTab?: GNNStudioTab;
  readonly initialPreset?: GNNPresetId;
  readonly initialArchitecture?: MessagePassingArchitecture;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onTabChange?: (tab: GNNStudioTab) => void;
  readonly onPresetChange?: (preset: GNNPresetId) => void;
}

// ============================================================================
// 2. PURE MATHEMATICAL LINEAR ALGEBRA & GRAPH ROUTINES
// ============================================================================

export function zerosMatrix(rows: number, cols: number): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < rows; i++) {
    result.push(new Array(cols).fill(0));
  }
  return result;
}

export function identityMatrix(n: number): number[][] {
  const I = zerosMatrix(n, n);
  for (let i = 0; i < n; i++) {
    I[i][i] = 1.0;
  }
  return I;
}

export function cloneMatrix(M: number[][]): number[][] {
  return M.map((row) => [...row]);
}

export function matrixAdd(A: number[][], B: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  const result = zerosMatrix(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] + (B[i]?.[j] ?? 0);
    }
  }
  return result;
}

export function matrixSubtract(A: number[][], B: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  const result = zerosMatrix(rows, cols);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[i][j] = A[i][j] - (B[i]?.[j] ?? 0);
    }
  }
  return result;
}

export function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0]?.length || 0;
  const colsB = B[0]?.length || 0;
  const result = zerosMatrix(rowsA, colsB);

  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      const aVal = A[i][k];
      if (Math.abs(aVal) < 1e-15) continue;
      for (let j = 0; j < colsB; j++) {
        result[i][j] += aVal * B[k][j];
      }
    }
  }
  return result;
}

export function matrixVectorMultiply(A: number[][], x: number[]): number[] {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  const result = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * (x[j] ?? 0);
    }
    result[i] = sum;
  }
  return result;
}

export function matrixTranspose(A: number[][]): number[][] {
  const rows = A.length;
  const cols = A[0]?.length || 0;
  const result = zerosMatrix(cols, rows);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = A[i][j];
    }
  }
  return result;
}

export function dotProduct(u: number[], v: number[]): number {
  let sum = 0;
  const n = Math.min(u.length, v.length);
  for (let i = 0; i < n; i++) {
    sum += u[i] * v[i];
  }
  return sum;
}

export function vectorNorm(v: number[]): number {
  return Math.sqrt(dotProduct(v, v));
}

export function vectorNormalize(v: number[], eps = 1e-12): number[] {
  const norm = vectorNorm(v);
  if (norm < eps) {
    return new Array(v.length).fill(0);
  }
  return v.map((x) => x / norm);
}

export function vectorCosineSimilarity(u: number[], v: number[], eps = 1e-12): number {
  const normU = vectorNorm(u);
  const normV = vectorNorm(v);
  if (normU < eps || normV < eps) return 0;
  return dotProduct(u, v) / (normU * normV);
}

export function applyActivation(x: number, fn: ActivationFunction = "relu", alpha = 0.2): number {
  switch (fn) {
    case "relu":
      return Math.max(0, x);
    case "leaky_relu":
      return x >= 0 ? x : alpha * x;
    case "elu":
      return x >= 0 ? x : alpha * (Math.exp(x) - 1);
    case "tanh":
      return Math.tanh(x);
    case "sigmoid":
      return 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, x))));
    case "identity":
    default:
      return x;
  }
}

export function applyActivationMatrix(
  M: number[][],
  fn: ActivationFunction = "relu",
  alpha = 0.2,
): number[][] {
  return M.map((row) => row.map((val) => applyActivation(val, fn, alpha)));
}

// ============================================================================
// 3. GRAPH MATRICES (Adjacency, Degree, Laplacians)
// ============================================================================

export function computeAdjacencyMatrix(
  nodeCount: number,
  edges: readonly { source: string | number; target: string | number; weight?: number }[],
  nodeIndexMap?: Record<string, number>,
  isDirected = false,
): number[][] {
  const A = zerosMatrix(nodeCount, nodeCount);

  for (const edge of edges) {
    let u: number;
    let v: number;

    if (nodeIndexMap) {
      u = nodeIndexMap[String(edge.source)];
      v = nodeIndexMap[String(edge.target)];
    } else {
      u = Number(edge.source);
      v = Number(edge.target);
    }

    if (u >= 0 && u < nodeCount && v >= 0 && v < nodeCount) {
      const w = edge.weight ?? 1.0;
      A[u][v] = w;
      if (!isDirected && u !== v) {
        A[v][u] = w;
      }
    }
  }

  return A;
}

export function computeDegreeVector(A: number[][]): number[] {
  const n = A.length;
  const d = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += A[i][j];
    }
    d[i] = sum;
  }
  return d;
}

export function computeDegreeMatrix(A: number[][]): number[][] {
  const n = A.length;
  const D = zerosMatrix(n, n);
  const d = computeDegreeVector(A);
  for (let i = 0; i < n; i++) {
    D[i][i] = d[i];
  }
  return D;
}

/**
 * GCN Kipf & Welling Renormalization Trick:
 * A~ = A + I_N
 * D~_ii = sum_j A~_ij
 * A_hat = D~^(-1/2) A~ D~^(-1/2)
 */
export function computeNormalizedAdjacency(A: number[][], addSelfLoops = true): number[][] {
  const n = A.length;
  const Atilde = zerosMatrix(n, n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Atilde[i][j] = A[i][j] + (addSelfLoops && i === j ? 1.0 : 0.0);
    }
  }

  const dtilde = computeDegreeVector(Atilde);
  const dInvSqrt = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    dInvSqrt[i] = dtilde[i] > 1e-12 ? 1.0 / Math.sqrt(dtilde[i]) : 0.0;
  }

  const Ahat = zerosMatrix(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Ahat[i][j] = dInvSqrt[i] * Atilde[i][j] * dInvSqrt[j];
    }
  }

  return Ahat;
}

/**
 * Unnormalized Graph Laplacian: L = D - A
 */
export function computeLaplacian(A: number[][]): number[][] {
  const D = computeDegreeMatrix(A);
  return matrixSubtract(D, A);
}

/**
 * Symmetric Normalized Laplacian: L_sym = D^(-1/2) L D^(-1/2) = I - D^(-1/2) A D^(-1/2)
 */
export function computeNormalizedLaplacian(A: number[][]): number[][] {
  const n = A.length;
  const d = computeDegreeVector(A);
  const dInvSqrt = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    dInvSqrt[i] = d[i] > 1e-12 ? 1.0 / Math.sqrt(d[i]) : 0.0;
  }

  const Lsym = zerosMatrix(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        Lsym[i][j] = d[i] > 1e-12 ? 1.0 - dInvSqrt[i] * A[i][j] * dInvSqrt[j] : 0.0;
      } else {
        Lsym[i][j] = -dInvSqrt[i] * A[i][j] * dInvSqrt[j];
      }
    }
  }

  return Lsym;
}

/**
 * Random Walk Laplacian: L_rw = D^(-1) L = I - D^(-1) A
 */
export function computeRandomWalkLaplacian(A: number[][]): number[][] {
  const n = A.length;
  const d = computeDegreeVector(A);
  const Lrw = zerosMatrix(n, n);

  for (let i = 0; i < n; i++) {
    const dInv = d[i] > 1e-12 ? 1.0 / d[i] : 0.0;
    for (let j = 0; j < n; j++) {
      if (i === j) {
        Lrw[i][j] = d[i] > 1e-12 ? 1.0 - dInv * A[i][j] : 0.0;
      } else {
        Lrw[i][j] = -dInv * A[i][j];
      }
    }
  }

  return Lrw;
}

// ============================================================================
// 4. EXACT SYMMETRIC EIGENDECOMPOSITION (Jacobi Algorithm)
// ============================================================================

/**
 * Classical Jacobi Eigenvalue Algorithm for Real Symmetric Matrices.
 * Guarantees orthogonal eigenvectors U with U^T U = I and sorted eigenvalues lambda_0 <= ... <= lambda_{n-1}.
 */
export function computeEigenvaluesAndVectors(
  M: number[][],
  maxIter = 150,
  eps = 1e-12,
): SpectralDecompositionResult {
  const n = M.length;
  if (n === 0) {
    return { eigenvalues: [], eigenvectors: [], sortedIndices: [] };
  }

  const A = cloneMatrix(M);
  const V = identityMatrix(n);

  for (let iter = 0; iter < maxIter; iter++) {
    // Find largest off-diagonal element
    let maxVal = 0;
    let p = 0;
    let q = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const absVal = Math.abs(A[i][j]);
        if (absVal > maxVal) {
          maxVal = absVal;
          p = i;
          q = j;
        }
      }
    }

    if (maxVal < eps) {
      break;
    }

    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];

    const theta = (aqq - app) / (2.0 * apq);
    const t =
      theta >= 0
        ? 1.0 / (theta + Math.sqrt(1.0 + theta * theta))
        : -1.0 / (-theta + Math.sqrt(1.0 + theta * theta));
    const c = 1.0 / Math.sqrt(1.0 + t * t);
    const s = t * c;
    const tau = s / (1.0 + c);

    // Update diagonal
    A[p][p] = app - t * apq;
    A[q][q] = aqq + t * apq;
    A[p][q] = 0;
    A[q][p] = 0;

    // Update other entries in rows/cols p and q
    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = A[i][p];
        const aiq = A[i][q];
        A[i][p] = aip - s * (aiq + tau * aip);
        A[p][i] = A[i][p];
        A[i][q] = aiq + s * (aip - tau * aiq);
        A[q][i] = A[i][q];
      }
    }

    // Accumulate eigenvectors in V
    for (let i = 0; i < n; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = vip - s * (viq + tau * vip);
      V[i][q] = viq + s * (vip - tau * viq);
    }
  }

  // Extract eigenvalues and sort ascending
  const rawEigenvalues = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    // Clean numerical float artifacts close to zero
    const val = A[i][i];
    rawEigenvalues[i] = Math.abs(val) < 1e-12 ? 0.0 : val;
  }

  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => rawEigenvalues[a] - rawEigenvalues[b]);

  const sortedEigenvalues = indices.map((idx) => rawEigenvalues[idx]);
  const sortedEigenvectors = zerosMatrix(n, n);

  for (let col = 0; col < n; col++) {
    const origCol = indices[col];
    for (let row = 0; row < n; row++) {
      sortedEigenvectors[row][col] = V[row][origCol];
    }
  }

  return {
    eigenvalues: sortedEigenvalues,
    eigenvectors: sortedEigenvectors,
    sortedIndices: indices,
  };
}

// ============================================================================
// 5. GRAPH FOURIER TRANSFORM & CHEBYSHEV SPECTRAL FILTERING
// ============================================================================

/**
 * Direct Graph Fourier Transform: x_hat = U^T * x
 */
export function computeGraphFourierTransform(x: number[], U: number[][]): number[] {
  const n = x.length;
  const xHat = new Array(n).fill(0);
  for (let k = 0; k < n; k++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += U[i][k] * x[i];
    }
    xHat[k] = sum;
  }
  return xHat;
}

/**
 * Inverse Graph Fourier Transform: x = U * x_hat
 */
export function computeInverseGraphFourierTransform(xHat: number[], U: number[][]): number[] {
  const n = xHat.length;
  const x = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += U[i][k] * xHat[k];
    }
    x[i] = sum;
  }
  return x;
}

/**
 * Chebyshev Polynomial Spectral Convolution:
 * L_tilde = (2 / lambda_max) * L - I
 * T_0(x) = x
 * T_1(x) = L_tilde * x
 * T_k(x) = 2 * L_tilde * T_{k-1}(x) - T_{k-2}(x)
 * y = sum_{k=0}^{K-1} theta_k * T_k(x)
 */
export function computeChebyshevFilter(
  x: number[],
  L: number[][],
  lambdaMax: number,
  theta: number[],
): { filtered: number[]; chebyshevTerms: number[][] } {
  const n = x.length;
  const K = theta.length;
  if (K === 0 || n === 0) {
    return { filtered: [...x], chebyshevTerms: [[...x]] };
  }

  const effectiveLambdaMax = Math.max(lambdaMax, 1e-4);
  const I = identityMatrix(n);
  const scaledL = zerosMatrix(n, n);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      scaledL[i][j] = (2.0 / effectiveLambdaMax) * L[i][j] - I[i][j];
    }
  }

  const T: number[][] = [];
  // T_0 = x
  T.push([...x]);

  if (K > 1) {
    // T_1 = scaledL * x
    T.push(matrixVectorMultiply(scaledL, x));
  }

  for (let k = 2; k < K; k++) {
    const L_Tk_minus_1 = matrixVectorMultiply(scaledL, T[k - 1]);
    const Tk = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      Tk[i] = 2.0 * L_Tk_minus_1[i] - T[k - 2][i];
    }
    T.push(Tk);
  }

  const filtered = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let k = 0; k < K; k++) {
      sum += theta[k] * T[k][i];
    }
    filtered[i] = sum;
  }

  return { filtered, chebyshevTerms: T };
}

// ============================================================================
// 6. MESSAGE PASSING ARCHITECTURES (GCN, GraphSAGE, GAT, GIN)
// ============================================================================

/**
 * 1. GCN (Kipf & Welling 2017)
 * H^(l+1) = sigma( D~^(-1/2) A~ D~^(-1/2) H^(l) W^(l) )
 */
export function computeGCNLayer(
  H: number[][],
  A: number[][],
  W: number[][],
  activation: ActivationFunction = "relu",
  addSelfLoops = true,
): number[][] {
  const Ahat = computeNormalizedAdjacency(A, addSelfLoops);
  const AH = matrixMultiply(Ahat, H);
  const Z = matrixMultiply(AH, W);
  return applyActivationMatrix(Z, activation);
}

/**
 * 2. GraphSAGE (Hamilton et al. 2017)
 * h_N(v) = AGGREGATE({h_u, u in N(v)})
 * h_v^(l+1) = sigma( W_self * h_v + W_neigh * h_N(v) ) [with optional L2 normalization]
 */
export function computeGraphSAGELayer(
  H: number[][],
  A: number[][],
  WSelf: number[][],
  WNeigh: number[][],
  aggregator: GraphSageAggregator = "mean",
  normalizeL2 = true,
  activation: ActivationFunction = "relu",
): number[][] {
  const numNodes = H.length;
  const inDim = H[0]?.length || 0;
  const outDim = WSelf[0]?.length || 0;
  const HNext = zerosMatrix(numNodes, outDim);

  for (let i = 0; i < numNodes; i++) {
    // Find neighbors of node i
    const neighbors: number[] = [];
    for (let j = 0; j < numNodes; j++) {
      if (A[i][j] > 0 && i !== j) {
        neighbors.push(j);
      }
    }

    const hNeigh = new Array(inDim).fill(0);
    if (neighbors.length > 0) {
      if (aggregator === "mean") {
        for (const nb of neighbors) {
          for (let f = 0; f < inDim; f++) {
            hNeigh[f] += H[nb][f];
          }
        }
        for (let f = 0; f < inDim; f++) {
          hNeigh[f] /= neighbors.length;
        }
      } else if (aggregator === "sum") {
        for (const nb of neighbors) {
          for (let f = 0; f < inDim; f++) {
            hNeigh[f] += H[nb][f];
          }
        }
      } else if (aggregator === "max") {
        for (let f = 0; f < inDim; f++) {
          let maxVal = -Infinity;
          for (const nb of neighbors) {
            maxVal = Math.max(maxVal, H[nb][f]);
          }
          hNeigh[f] = Number.isFinite(maxVal) ? maxVal : 0;
        }
      }
    }

    // Combine self and neighborhood
    const selfContrib = matrixVectorMultiply(matrixTranspose(WSelf), H[i]);
    const neighContrib = matrixVectorMultiply(matrixTranspose(WNeigh), hNeigh);

    const zi = new Array(outDim).fill(0);
    for (let f = 0; f < outDim; f++) {
      zi[f] = applyActivation(selfContrib[f] + neighContrib[f], activation);
    }

    if (normalizeL2) {
      HNext[i] = vectorNormalize(zi);
    } else {
      HNext[i] = zi;
    }
  }

  return HNext;
}

/**
 * 3. GAT (Veličković et al. 2018)
 * e_ij = LeakyReLU( a_src^T (W h_i) + a_dst^T (W h_j) )
 * alpha_ij = softmax_j( e_ij )
 * h_i' = sigma( sum_{j in N(i) union {i}} alpha_ij W h_j )
 */
export function computeGATLayer(
  H: number[][],
  A: number[][],
  WHeads: number[][][], // [headIdx][inDim][outDimPerHead]
  aSrcHeads: number[][], // [headIdx][outDimPerHead]
  aDstHeads: number[][], // [headIdx][outDimPerHead]
  numHeads = 2,
  leakyAlpha = 0.2,
  activation: ActivationFunction = "elu",
  concatHeads = true,
): { HOut: number[][]; attentionWeights: number[][][] } {
  const numNodes = H.length;
  const headOutputs: number[][][] = []; // [headIdx][nodeIdx][dim]
  const allAttentionWeights: number[][][] = []; // [headIdx][nodeI][nodeJ]

  for (let h = 0; h < numHeads; h++) {
    const W = WHeads[h] || identityMatrix(H[0]?.length || 1);
    const aSrc = aSrcHeads[h] || new Array(W[0].length).fill(1.0);
    const aDst = aDstHeads[h] || new Array(W[0].length).fill(1.0);
    const outDimHead = W[0].length;

    // Linear projection Wh
    const Wh = matrixMultiply(H, W);

    // Compute attention logits e_ij
    const attnMatrix = zerosMatrix(numNodes, numNodes);
    for (let i = 0; i < numNodes; i++) {
      const srcTerm = dotProduct(aSrc, Wh[i]);
      const activeNeighbors: number[] = [];

      for (let j = 0; j < numNodes; j++) {
        if (A[i][j] > 0 || i === j) {
          activeNeighbors.push(j);
        }
      }

      // Compute unnormalized logits
      const logits: { j: number; e: number }[] = [];
      let maxLogit = -Infinity;

      for (const j of activeNeighbors) {
        const dstTerm = dotProduct(aDst, Wh[j]);
        const e = applyActivation(srcTerm + dstTerm, "leaky_relu", leakyAlpha);
        logits.push({ j, e });
        if (e > maxLogit) maxLogit = e;
      }

      // Softmax
      let expSum = 0;
      for (const item of logits) {
        expSum += Math.exp(item.e - maxLogit);
      }

      for (const item of logits) {
        const alpha = Math.exp(item.e - maxLogit) / (expSum + 1e-12);
        attnMatrix[i][item.j] = alpha;
      }
    }

    allAttentionWeights.push(attnMatrix);

    // Aggregate features using attention weights
    const hHeadOut = zerosMatrix(numNodes, outDimHead);
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        const alpha = attnMatrix[i][j];
        if (alpha > 0) {
          for (let f = 0; f < outDimHead; f++) {
            hHeadOut[i][f] += alpha * Wh[j][f];
          }
        }
      }
    }

    headOutputs.push(hHeadOut);
  }

  let HOut: number[][];
  if (concatHeads) {
    const totalOutDim = numHeads * (headOutputs[0]?.[0]?.length || 0);
    HOut = zerosMatrix(numNodes, totalOutDim);
    for (let i = 0; i < numNodes; i++) {
      let colOffset = 0;
      for (let h = 0; h < numHeads; h++) {
        const headDim = headOutputs[h][i].length;
        for (let f = 0; f < headDim; f++) {
          HOut[i][colOffset + f] = applyActivation(headOutputs[h][i][f], activation);
        }
        colOffset += headDim;
      }
    }
  } else {
    // Average across heads
    const headDim = headOutputs[0]?.[0]?.length || 0;
    HOut = zerosMatrix(numNodes, headDim);
    for (let i = 0; i < numNodes; i++) {
      for (let f = 0; f < headDim; f++) {
        let sum = 0;
        for (let h = 0; h < numHeads; h++) {
          sum += headOutputs[h][i][f];
        }
        HOut[i][f] = applyActivation(sum / numHeads, activation);
      }
    }
  }

  return { HOut, attentionWeights: allAttentionWeights };
}

/**
 * 4. GIN (Xu et al. 2019 - 1-WL Expressive Power)
 * h_v^(k) = MLP( (1 + eps) * h_v^(k-1) + sum_{u in N(v)} h_u^(k-1) )
 */
export function computeGINLayer(
  H: number[][],
  A: number[][],
  mlpWeights: {
    W1: number[][];
    b1: number[];
    W2: number[][];
    b2: number[];
  },
  eps = 0.0,
  activation: ActivationFunction = "relu",
): number[][] {
  const numNodes = H.length;
  const inDim = H[0]?.length || 0;
  const hiddenDim = mlpWeights.W1[0]?.length || inDim;
  const outDim = mlpWeights.W2[0]?.length || hiddenDim;
  const HNext = zerosMatrix(numNodes, outDim);

  for (let i = 0; i < numNodes; i++) {
    // Aggregation: (1 + eps) * h_i + sum_{j in N(i)} h_j
    const aggregated = new Array(inDim).fill(0);
    for (let f = 0; f < inDim; f++) {
      aggregated[f] = (1.0 + eps) * H[i][f];
    }

    for (let j = 0; j < numNodes; j++) {
      if (A[i][j] > 0 && i !== j) {
        for (let f = 0; f < inDim; f++) {
          aggregated[f] += H[j][f];
        }
      }
    }

    // Layer 1 of MLP: z1 = sigma( agg * W1 + b1 )
    const z1 = new Array(hiddenDim).fill(0);
    for (let h = 0; h < hiddenDim; h++) {
      let sum = mlpWeights.b1[h] ?? 0;
      for (let f = 0; f < inDim; f++) {
        sum += aggregated[f] * mlpWeights.W1[f][h];
      }
      z1[h] = applyActivation(sum, activation);
    }

    // Layer 2 of MLP: z2 = z1 * W2 + b2
    for (let o = 0; o < outDim; o++) {
      let sum = mlpWeights.b2[o] ?? 0;
      for (let h = 0; h < hiddenDim; h++) {
        sum += z1[h] * mlpWeights.W2[h][o];
      }
      HNext[i][o] = applyActivation(sum, activation);
    }
  }

  return HNext;
}

// ============================================================================
// 7. DIRICHLET ENERGY & OVERSMOOTHING METRICS
// ============================================================================

/**
 * Normalized Dirichlet Energy:
 * E_norm(H) = (1 / 2N) * Tr( H^T L_sym H ) = (1 / 2N) sum_f h_{:,f}^T L_sym h_{:,f}
 */
export function computeDirichletEnergy(H: number[][], Lsym: number[][]): number {
  const n = H.length;
  if (n === 0) return 0;
  const fDim = H[0]?.length || 0;
  let totalEnergy = 0;

  for (let f = 0; f < fDim; f++) {
    const col = H.map((row) => row[f]);
    const Lcol = matrixVectorMultiply(Lsym, col);
    totalEnergy += dotProduct(col, Lcol);
  }

  return totalEnergy / (2.0 * n);
}

/**
 * Unnormalized Dirichlet Energy:
 * E_unnorm(H) = (1 / 4N) sum_{i,j} A_ij || h_i - h_j ||_2^2
 */
export function computeUnnormalizedDirichletEnergy(H: number[][], A: number[][]): number {
  const n = H.length;
  if (n === 0) return 0;
  const fDim = H[0]?.length || 0;
  let totalDiff = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const aij = A[i][j];
      if (aij > 0) {
        let distSq = 0;
        for (let f = 0; f < fDim; f++) {
          const diff = H[i][f] - H[j][f];
          distSq += diff * diff;
        }
        totalDiff += aij * distSq;
      }
    }
  }

  return totalDiff / (4.0 * n);
}

/**
 * Node Representation Pairwise Cosine Similarity Matrix S:
 * S_ij = (h_i . h_j) / ( ||h_i|| * ||h_j|| + eps )
 */
export function computeCosineSimilarityMatrix(H: number[][]): number[][] {
  const n = H.length;
  const S = zerosMatrix(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      S[i][j] = vectorCosineSimilarity(H[i], H[j]);
    }
  }
  return S;
}

export function computeAveragePairwiseCosineDistance(H: number[][]): number {
  const n = H.length;
  if (n <= 1) return 0;
  let sumDist = 0;
  let count = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = vectorCosineSimilarity(H[i], H[j]);
      sumDist += 1.0 - sim;
      count++;
    }
  }

  return count > 0 ? sumDist / count : 0;
}

/**
 * Layer-by-layer Simulation Trajectory to analyze Oversmoothing.
 */
export function simulateLayerTrajectories(
  initialH: number[][],
  A: number[][],
  numLayers = 10,
  architecture: MessagePassingArchitecture = "gcn",
  withResiduals = false,
  withPairNorm = false,
  weightScale = 1.0,
): TrajectoryPoint[] {
  const n = initialH.length;
  const fDim = initialH[0]?.length || 4;
  const Lsym = computeNormalizedLaplacian(A);

  const points: TrajectoryPoint[] = [];

  // Deterministic orthonormal weight matrix
  const baseW = identityMatrix(fDim).map((row) => row.map((v) => v * weightScale));

  let currentH = cloneMatrix(initialH);

  // Initial layer 0
  const initialDE = computeDirichletEnergy(currentH, Lsym);
  const initialUnnormDE = computeUnnormalizedDirichletEnergy(currentH, A);
  const initialCosDist = computeAveragePairwiseCosineDistance(currentH);

  points.push({
    layer: 0,
    dirichletEnergy: initialDE,
    unnormalizedDirichletEnergy: initialUnnormDE,
    meanCosineDistance: initialCosDist,
    maxCosineSimilarity: 1.0,
    nodeEmbeddings: cloneMatrix(currentH),
  });

  for (let l = 1; l <= numLayers; l++) {
    let nextH: number[][];

    if (architecture === "gcn") {
      nextH = computeGCNLayer(currentH, A, baseW, "relu", true);
    } else if (architecture === "graphsage") {
      const WS = baseW.map((r) => r.map((x) => x * 0.5));
      const WN = baseW.map((r) => r.map((x) => x * 0.5));
      nextH = computeGraphSAGELayer(currentH, A, WS, WN, "mean", false, "relu");
    } else if (architecture === "gat") {
      const headW = [baseW, baseW];
      const aSrc = [new Array(fDim).fill(0.5), new Array(fDim).fill(0.5)];
      const aDst = [new Array(fDim).fill(0.5), new Array(fDim).fill(0.5)];
      const gatRes = computeGATLayer(currentH, A, headW, aSrc, aDst, 2, 0.2, "relu", false);
      nextH = gatRes.HOut;
    } else {
      // GIN
      const mlp = {
        W1: baseW,
        b1: new Array(fDim).fill(0.01),
        W2: baseW,
        b2: new Array(fDim).fill(0.0),
      };
      nextH = computeGINLayer(currentH, A, mlp, 0.0, "relu");
    }

    // Residual Connection: H^(l+1) = sigma(...) + H^(l)
    if (withResiduals) {
      nextH = matrixAdd(nextH, currentH);
    }

    // PairNorm: center and scale embeddings
    if (withPairNorm && n > 0) {
      const mean = new Array(fDim).fill(0);
      for (let i = 0; i < n; i++) {
        for (let f = 0; f < fDim; f++) {
          mean[f] += nextH[i][f];
        }
      }
      for (let f = 0; f < fDim; f++) mean[f] /= n;

      let varSum = 0;
      for (let i = 0; i < n; i++) {
        for (let f = 0; f < fDim; f++) {
          nextH[i][f] -= mean[f];
          varSum += nextH[i][f] * nextH[i][f];
        }
      }
      const scale = Math.sqrt(n / (varSum + 1e-8));
      for (let i = 0; i < n; i++) {
        for (let f = 0; f < fDim; f++) {
          nextH[i][f] *= scale;
        }
      }
    }

    currentH = nextH;

    const de = computeDirichletEnergy(currentH, Lsym);
    const unnormDE = computeUnnormalizedDirichletEnergy(currentH, A);
    const cosDist = computeAveragePairwiseCosineDistance(currentH);

    // Compute max off-diagonal similarity
    let maxSim = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const sim = vectorCosineSimilarity(currentH[i], currentH[j]);
        if (sim > maxSim) maxSim = sim;
      }
    }

    points.push({
      layer: l,
      dirichletEnergy: de,
      unnormalizedDirichletEnergy: unnormDE,
      meanCosineDistance: cosDist,
      maxCosineSimilarity: maxSim,
      nodeEmbeddings: cloneMatrix(currentH),
    });
  }

  return points;
}

// ============================================================================
// 8. 1-WL (WEISFEILER-LEHMAN) COLOR REFINEMENT ENGINE
// ============================================================================

export function run1WLColorRefinement(
  nodes: readonly string[],
  edges: readonly [string, string][],
  initialColors?: Record<string, string>,
  maxIterations = 6,
  sharedColorMap?: Map<string, string>,
): WLRefinementResult {
  const steps: WLRefinementStep[] = [];
  const colorMap = sharedColorMap ?? new Map<string, string>();

  // Adjacency map
  const adj: Record<string, string[]> = {};
  for (const node of nodes) {
    adj[node] = [];
  }
  for (const [u, v] of edges) {
    if (adj[u] && !adj[u].includes(v)) adj[u].push(v);
    if (adj[v] && !adj[v].includes(u)) adj[v].push(u);
  }

  // Sort neighbors for deterministic multiset strings
  for (const node of nodes) {
    adj[node].sort();
  }

  // Step 0: Initial colors (from labels, degrees, or default)
  let currentColors: Record<string, string> = {};
  const currentMultisets: Record<string, string> = {};

  for (const node of nodes) {
    const rawColor = initialColors?.[node] ?? `deg_${adj[node].length}`;
    if (!colorMap.has(rawColor)) {
      colorMap.set(rawColor, `C${colorMap.size}`);
    }
    currentColors[node] = colorMap.get(rawColor)!;
    currentMultisets[node] = `[${rawColor}]`;
  }

  // Record initial step
  const initialHist: Record<string, number> = {};
  for (const node of nodes) {
    const c = currentColors[node];
    initialHist[c] = (initialHist[c] || 0) + 1;
  }

  steps.push({
    step: 0,
    nodeColors: { ...currentColors },
    colorHistograms: { ...initialHist },
    numUniqueColors: Object.keys(initialHist).length,
    stabilized: false,
    multisets: { ...currentMultisets },
  });

  let stabilizedStep = maxIterations;

  // Iterate color refinement
  for (let iter = 1; iter <= maxIterations; iter++) {
    const nextColors: Record<string, string> = {};
    const nextMultisets: Record<string, string> = {};

    for (const node of nodes) {
      const selfColor = currentColors[node];
      const neighborColors = adj[node].map((nb) => currentColors[nb]);
      neighborColors.sort();

      const multisetKey = `${selfColor}:[${neighborColors.join(",")}]`;
      nextMultisets[node] = multisetKey;

      if (!colorMap.has(multisetKey)) {
        colorMap.set(multisetKey, `C${colorMap.size}`);
      }
      nextColors[node] = colorMap.get(multisetKey)!;
    }

    // Build histogram
    const nextHist: Record<string, number> = {};
    for (const node of nodes) {
      const c = nextColors[node];
      nextHist[c] = (nextHist[c] || 0) + 1;
    }

    // Check if partition is stabilized
    const isStabilized = checkPartitionEquivalence(currentColors, nextColors, nodes);

    steps.push({
      step: iter,
      nodeColors: { ...nextColors },
      colorHistograms: { ...nextHist },
      numUniqueColors: Object.keys(nextHist).length,
      stabilized: isStabilized,
      multisets: { ...nextMultisets },
    });

    currentColors = nextColors;

    if (isStabilized && stabilizedStep === maxIterations) {
      stabilizedStep = iter;
    }
  }

  const finalStep = steps[steps.length - 1];

  return {
    steps,
    stabilizedStep,
    finalColors: finalStep.nodeColors,
    finalHistogram: finalStep.colorHistograms,
  };
}

function checkPartitionEquivalence(
  prev: Record<string, string>,
  next: Record<string, string>,
  nodes: readonly string[],
): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const u = nodes[i];
      const v = nodes[j];
      const samePrev = prev[u] === prev[v];
      const sameNext = next[u] === next[v];
      if (samePrev !== sameNext) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 1-WL Graph Isomorphism Comparison.
 * Compares two graphs using a shared color refinement dictionary.
 */
export function compare1WLGraphPair(
  graph1: { nodes: readonly string[]; edges: readonly [string, string][] },
  graph2: { nodes: readonly string[]; edges: readonly [string, string][] },
  maxIterations = 6,
): WLComparisonResult {
  const sharedColorMap = new Map<string, string>();

  const g1Res = run1WLColorRefinement(
    graph1.nodes,
    graph1.edges,
    undefined,
    maxIterations,
    sharedColorMap,
  );
  const g2Res = run1WLColorRefinement(
    graph2.nodes,
    graph2.edges,
    undefined,
    maxIterations,
    sharedColorMap,
  );

  let isDistinguishable = false;
  let distinctionStep: number | null = null;
  let verdictExplanation = "";

  const minSteps = Math.min(g1Res.steps.length, g2Res.steps.length);
  for (let s = 0; s < minSteps; s++) {
    const hist1 = g1Res.steps[s].colorHistograms;
    const hist2 = g2Res.steps[s].colorHistograms;

    // Compare color histograms
    const keys1 = Object.keys(hist1);
    const keys2 = Object.keys(hist2);
    const allKeys = Array.from(new Set([...keys1, ...keys2]));

    let match = true;
    for (const k of allKeys) {
      if ((hist1[k] || 0) !== (hist2[k] || 0)) {
        match = false;
        break;
      }
    }

    if (!match) {
      isDistinguishable = true;
      distinctionStep = s;
      verdictExplanation = `Graphs are provably NON-ISOMORPHIC. 1-WL distinguished them at iteration ${s} via distinct color histogram certificates.`;
      break;
    }
  }

  if (!isDistinguishable) {
    verdictExplanation = `1-WL LIMIT: Both graphs produce IDENTICAL color histograms at all ${minSteps} iterations. Standard MPNNs & 1-WL cannot distinguish them.`;
  }

  return {
    graph1Result: g1Res,
    graph2Result: g2Res,
    isDistinguishable,
    distinctionStep,
    verdictExplanation,
  };
}

// ============================================================================
// 9. 6 GRAPH PRESETS (Karate Club, Cora, 1-WL Pair, Tree, Molecule, Custom)
// ============================================================================

export const GNN_PRESETS: Record<GNNPresetId, GNNGraphPreset> = {
  karate_club: {
    id: "karate_club",
    name: "Zachary's Karate Club (34 Nodes)",
    description:
      "Classic social network benchmark with 34 members and 78 friendship edges, splitting into two factions around Mr. Hi (Node 0) and the Officer (Node 33).",
    defaultTab: "architecture",
    nodes: [
      {
        id: "0",
        label: "0 (Hi)",
        x: 200,
        y: 150,
        community: 0,
        features: [1, 0, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "1",
        label: "1",
        x: 180,
        y: 220,
        community: 0,
        features: [0.9, 0.1, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "2",
        label: "2",
        x: 240,
        y: 180,
        community: 0,
        features: [0.8, 0.2, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "3",
        label: "3",
        x: 140,
        y: 160,
        community: 0,
        features: [0.85, 0.15, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "4",
        label: "4",
        x: 130,
        y: 100,
        community: 0,
        features: [0.95, 0.05, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "5",
        label: "5",
        x: 110,
        y: 230,
        community: 0,
        features: [0.7, 0.3, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "6",
        label: "6",
        x: 100,
        y: 180,
        community: 0,
        features: [0.75, 0.25, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "7",
        label: "7",
        x: 170,
        y: 120,
        community: 0,
        features: [0.8, 0.2, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "8",
        label: "8",
        x: 260,
        y: 240,
        community: 0,
        features: [0.6, 0.4, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "9",
        label: "9",
        x: 300,
        y: 140,
        community: 1,
        features: [0.4, 0.6, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "10",
        label: "10",
        x: 120,
        y: 280,
        community: 0,
        features: [0.7, 0.3, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "11",
        label: "11",
        x: 160,
        y: 70,
        community: 0,
        features: [0.9, 0.1, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "12",
        label: "12",
        x: 210,
        y: 90,
        community: 0,
        features: [0.85, 0.15, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "13",
        label: "13",
        x: 220,
        y: 270,
        community: 0,
        features: [0.75, 0.25, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "14",
        label: "14",
        x: 440,
        y: 280,
        community: 1,
        features: [0.1, 0.9, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "15",
        label: "15",
        x: 460,
        y: 220,
        community: 1,
        features: [0.05, 0.95, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "16",
        label: "16",
        x: 150,
        y: 310,
        community: 0,
        features: [0.65, 0.35, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "17",
        label: "17",
        x: 190,
        y: 50,
        community: 0,
        features: [0.9, 0.1, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "18",
        label: "18",
        x: 480,
        y: 260,
        community: 1,
        features: [0.1, 0.9, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "19",
        label: "19",
        x: 280,
        y: 200,
        community: 0,
        features: [0.55, 0.45, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "20",
        label: "20",
        x: 490,
        y: 200,
        community: 1,
        features: [0.05, 0.95, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "21",
        label: "21",
        x: 230,
        y: 60,
        community: 0,
        features: [0.8, 0.2, 0, 0],
        groundTruthClass: 0,
      },
      {
        id: "22",
        label: "22",
        x: 500,
        y: 240,
        community: 1,
        features: [0.1, 0.9, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "23",
        label: "23",
        x: 410,
        y: 310,
        community: 1,
        features: [0.2, 0.8, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "24",
        label: "24",
        x: 360,
        y: 260,
        community: 1,
        features: [0.3, 0.7, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "25",
        label: "25",
        x: 380,
        y: 230,
        community: 1,
        features: [0.25, 0.75, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "26",
        label: "26",
        x: 520,
        y: 220,
        community: 1,
        features: [0.05, 0.95, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "27",
        label: "27",
        x: 370,
        y: 170,
        community: 1,
        features: [0.35, 0.65, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "28",
        label: "28",
        x: 350,
        y: 130,
        community: 1,
        features: [0.4, 0.6, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "29",
        label: "29",
        x: 430,
        y: 260,
        community: 1,
        features: [0.15, 0.85, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "30",
        label: "30",
        x: 400,
        y: 190,
        community: 1,
        features: [0.2, 0.8, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "31",
        label: "31",
        x: 340,
        y: 220,
        community: 1,
        features: [0.3, 0.7, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "32",
        label: "32",
        x: 420,
        y: 150,
        community: 1,
        features: [0.15, 0.85, 0, 0],
        groundTruthClass: 1,
      },
      {
        id: "33",
        label: "33 (Off)",
        x: 450,
        y: 180,
        community: 1,
        features: [0, 1, 0, 0],
        groundTruthClass: 1,
      },
    ],
    edges: [
      { source: "0", target: "1" },
      { source: "0", target: "2" },
      { source: "0", target: "3" },
      { source: "0", target: "4" },
      { source: "0", target: "5" },
      { source: "0", target: "6" },
      { source: "0", target: "7" },
      { source: "0", target: "8" },
      { source: "0", target: "10" },
      { source: "0", target: "11" },
      { source: "0", target: "12" },
      { source: "0", target: "13" },
      { source: "0", target: "17" },
      { source: "0", target: "19" },
      { source: "0", target: "21" },
      { source: "0", target: "31" },
      { source: "1", target: "2" },
      { source: "1", target: "3" },
      { source: "1", target: "7" },
      { source: "1", target: "13" },
      { source: "1", target: "17" },
      { source: "1", target: "19" },
      { source: "1", target: "21" },
      { source: "1", target: "30" },
      { source: "2", target: "3" },
      { source: "2", target: "7" },
      { source: "2", target: "8" },
      { source: "2", target: "9" },
      { source: "2", target: "13" },
      { source: "2", target: "27" },
      { source: "2", target: "28" },
      { source: "2", target: "32" },
      { source: "3", target: "7" },
      { source: "3", target: "12" },
      { source: "3", target: "13" },
      { source: "4", target: "6" },
      { source: "4", target: "10" },
      { source: "5", target: "6" },
      { source: "5", target: "10" },
      { source: "5", target: "16" },
      { source: "6", target: "16" },
      { source: "8", target: "30" },
      { source: "8", target: "32" },
      { source: "8", target: "33" },
      { source: "9", target: "33" },
      { source: "13", target: "33" },
      { source: "14", target: "32" },
      { source: "14", target: "33" },
      { source: "15", target: "32" },
      { source: "15", target: "33" },
      { source: "18", target: "32" },
      { source: "18", target: "33" },
      { source: "19", target: "33" },
      { source: "20", target: "32" },
      { source: "20", target: "33" },
      { source: "22", target: "32" },
      { source: "22", target: "33" },
      { source: "23", target: "25" },
      { source: "23", target: "27" },
      { source: "23", target: "29" },
      { source: "23", target: "32" },
      { source: "23", target: "33" },
      { source: "24", target: "25" },
      { source: "24", target: "27" },
      { source: "24", target: "31" },
      { source: "25", target: "31" },
      { source: "26", target: "29" },
      { source: "26", target: "33" },
      { source: "27", target: "33" },
      { source: "28", target: "31" },
      { source: "28", target: "33" },
      { source: "29", target: "32" },
      { source: "29", target: "33" },
      { source: "30", target: "32" },
      { source: "30", target: "33" },
      { source: "31", target: "32" },
      { source: "31", target: "33" },
      { source: "32", target: "33" },
    ],
  },

  cora_subgraph: {
    id: "cora_subgraph",
    name: "Cora Citation Network (16 Nodes)",
    description:
      "Academic paper citation subgraph across 4 machine learning topics: Neural Networks (NN), Rule Learning (RL), Reinforcement Learning (RF), Probabilistic Methods (PM).",
    defaultTab: "architecture",
    nodes: [
      {
        id: "c0",
        label: "Paper 0 (NN)",
        x: 180,
        y: 120,
        community: 0,
        features: [0.8, 0.1, 0.05, 0.05],
        groundTruthClass: 0,
      },
      {
        id: "c1",
        label: "Paper 1 (NN)",
        x: 240,
        y: 90,
        community: 0,
        features: [0.75, 0.15, 0.05, 0.05],
        groundTruthClass: 0,
      },
      {
        id: "c2",
        label: "Paper 2 (NN)",
        x: 260,
        y: 160,
        community: 0,
        features: [0.85, 0.05, 0.05, 0.05],
        groundTruthClass: 0,
      },
      {
        id: "c3",
        label: "Paper 3 (NN)",
        x: 200,
        y: 190,
        community: 0,
        features: [0.7, 0.2, 0.05, 0.05],
        groundTruthClass: 0,
      },
      {
        id: "c4",
        label: "Paper 4 (RL)",
        x: 400,
        y: 100,
        community: 1,
        features: [0.1, 0.8, 0.05, 0.05],
        groundTruthClass: 1,
      },
      {
        id: "c5",
        label: "Paper 5 (RL)",
        x: 460,
        y: 120,
        community: 1,
        features: [0.05, 0.85, 0.05, 0.05],
        groundTruthClass: 1,
      },
      {
        id: "c6",
        label: "Paper 6 (RL)",
        x: 420,
        y: 170,
        community: 1,
        features: [0.15, 0.75, 0.05, 0.05],
        groundTruthClass: 1,
      },
      {
        id: "c7",
        label: "Paper 7 (RL)",
        x: 480,
        y: 180,
        community: 1,
        features: [0.05, 0.8, 0.1, 0.05],
        groundTruthClass: 1,
      },
      {
        id: "c8",
        label: "Paper 8 (RF)",
        x: 180,
        y: 280,
        community: 2,
        features: [0.1, 0.05, 0.8, 0.05],
        groundTruthClass: 2,
      },
      {
        id: "c9",
        label: "Paper 9 (RF)",
        x: 250,
        y: 290,
        community: 2,
        features: [0.05, 0.1, 0.75, 0.1],
        groundTruthClass: 2,
      },
      {
        id: "c10",
        label: "Paper 10 (RF)",
        x: 220,
        y: 350,
        community: 2,
        features: [0.05, 0.05, 0.85, 0.05],
        groundTruthClass: 2,
      },
      {
        id: "c11",
        label: "Paper 11 (RF)",
        x: 150,
        y: 340,
        community: 2,
        features: [0.1, 0.05, 0.8, 0.05],
        groundTruthClass: 2,
      },
      {
        id: "c12",
        label: "Paper 12 (PM)",
        x: 400,
        y: 280,
        community: 3,
        features: [0.05, 0.05, 0.1, 0.8],
        groundTruthClass: 3,
      },
      {
        id: "c13",
        label: "Paper 13 (PM)",
        x: 470,
        y: 270,
        community: 3,
        features: [0.05, 0.1, 0.05, 0.8],
        groundTruthClass: 3,
      },
      {
        id: "c14",
        label: "Paper 14 (PM)",
        x: 440,
        y: 340,
        community: 3,
        features: [0.05, 0.05, 0.05, 0.85],
        groundTruthClass: 3,
      },
      {
        id: "c15",
        label: "Paper 15 (PM)",
        x: 500,
        y: 330,
        community: 3,
        features: [0.1, 0.05, 0.05, 0.8],
        groundTruthClass: 3,
      },
    ],
    edges: [
      { source: "c0", target: "c1" },
      { source: "c0", target: "c2" },
      { source: "c1", target: "c3" },
      { source: "c2", target: "c3" },
      { source: "c1", target: "c4" }, // Inter-topic bridge
      { source: "c4", target: "c5" },
      { source: "c4", target: "c6" },
      { source: "c5", target: "c7" },
      { source: "c6", target: "c7" },
      { source: "c3", target: "c8" }, // Inter-topic bridge
      { source: "c8", target: "c9" },
      { source: "c8", target: "c11" },
      { source: "c9", target: "c10" },
      { source: "c10", target: "c11" },
      { source: "c6", target: "c12" }, // Inter-topic bridge
      { source: "c9", target: "c12" }, // Inter-topic bridge
      { source: "c12", target: "c13" },
      { source: "c12", target: "c14" },
      { source: "c13", target: "c15" },
      { source: "c14", target: "c15" },
      { source: "c2", target: "c9" },
      { source: "c7", target: "c13" },
    ],
  },

  wl_decagon_pentagons: {
    id: "wl_decagon_pentagons",
    name: "1-WL Counterexample: Decagon C10 vs 2x C5",
    description:
      "Famous non-isomorphic graph pair that 1-WL (and standard MPNNs) cannot distinguish: A single 10-cycle vs two disjoint 5-cycles. Both are 2-regular with 10 nodes.",
    defaultTab: "weisfeiler_lehman",
    isPair: true,
    nodes: Array.from({ length: 10 }, (_, i) => {
      const angle = (2 * Math.PI * i) / 10 - Math.PI / 2;
      return {
        id: `d${i}`,
        label: `A${i}`,
        x: 300 + 130 * Math.cos(angle),
        y: 200 + 130 * Math.sin(angle),
        features: [1, 0, 0, 0],
      };
    }),
    edges: Array.from({ length: 10 }, (_, i) => ({
      source: `d${i}`,
      target: `d${(i + 1) % 10}`,
    })),
    secondaryGraph: {
      name: "Graph B: Disjoint Two Pentagons (2 x C5)",
      nodes: [
        // Pentagon 1
        ...Array.from({ length: 5 }, (_, i) => {
          const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
          return {
            id: `p1_${i}`,
            label: `B1_${i}`,
            x: 200 + 75 * Math.cos(angle),
            y: 200 + 75 * Math.sin(angle),
            features: [1, 0, 0, 0],
          };
        }),
        // Pentagon 2
        ...Array.from({ length: 5 }, (_, i) => {
          const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
          return {
            id: `p2_${i}`,
            label: `B2_${i}`,
            x: 400 + 75 * Math.cos(angle),
            y: 200 + 75 * Math.sin(angle),
            features: [1, 0, 0, 0],
          };
        }),
      ],
      edges: [
        // Pentagon 1 edges
        { source: "p1_0", target: "p1_1" },
        { source: "p1_1", target: "p1_2" },
        { source: "p1_2", target: "p1_3" },
        { source: "p1_3", target: "p1_4" },
        { source: "p1_4", target: "p1_0" },
        // Pentagon 2 edges
        { source: "p2_0", target: "p2_1" },
        { source: "p2_1", target: "p2_2" },
        { source: "p2_2", target: "p2_3" },
        { source: "p2_3", target: "p2_4" },
        { source: "p2_4", target: "p2_0" },
      ],
    },
  },

  tree_bottleneck: {
    id: "tree_bottleneck",
    name: "Tree / Bottleneck Hierarchy (Oversquashing)",
    description:
      "Complete binary tree of depth 3 (15 nodes) showing exponential receptive field growth and information bottleneck / oversquashing at the root.",
    defaultTab: "oversmoothing",
    nodes: [
      // Depth 0
      { id: "t0", label: "Root (0)", x: 320, y: 70, features: [1, 0, 0, 0] },
      // Depth 1
      { id: "t1", label: "L1", x: 200, y: 150, features: [0.5, 0.5, 0, 0] },
      { id: "t2", label: "R1", x: 440, y: 150, features: [0.5, 0, 0.5, 0] },
      // Depth 2
      { id: "t3", label: "L2_0", x: 140, y: 230, features: [0.25, 0.75, 0, 0] },
      { id: "t4", label: "L2_1", x: 260, y: 230, features: [0.25, 0.5, 0.25, 0] },
      { id: "t5", label: "R2_0", x: 380, y: 230, features: [0.25, 0, 0.75, 0] },
      { id: "t6", label: "R2_1", x: 500, y: 230, features: [0.25, 0, 0.25, 0.5] },
      // Depth 3 (Leaves)
      { id: "t7", label: "Leaf 0", x: 110, y: 310, features: [0, 1, 0, 0] },
      { id: "t8", label: "Leaf 1", x: 170, y: 310, features: [0, 0.8, 0.2, 0] },
      { id: "t9", label: "Leaf 2", x: 230, y: 310, features: [0, 0.5, 0.5, 0] },
      { id: "t10", label: "Leaf 3", x: 290, y: 310, features: [0, 0.2, 0.8, 0] },
      { id: "t11", label: "Leaf 4", x: 350, y: 310, features: [0, 0, 1, 0] },
      { id: "t12", label: "Leaf 5", x: 410, y: 310, features: [0, 0, 0.8, 0.2] },
      { id: "t13", label: "Leaf 6", x: 470, y: 310, features: [0, 0, 0.5, 0.5] },
      { id: "t14", label: "Leaf 7", x: 530, y: 310, features: [0, 0, 0, 1] },
    ],
    edges: [
      { source: "t0", target: "t1" },
      { source: "t0", target: "t2" },
      { source: "t1", target: "t3" },
      { source: "t1", target: "t4" },
      { source: "t2", target: "t5" },
      { source: "t2", target: "t6" },
      { source: "t3", target: "t7" },
      { source: "t3", target: "t8" },
      { source: "t4", target: "t9" },
      { source: "t4", target: "t10" },
      { source: "t5", target: "t11" },
      { source: "t5", target: "t12" },
      { source: "t6", target: "t13" },
      { source: "t6", target: "t14" },
    ],
  },

  molecule_benzene_caffeine: {
    id: "molecule_benzene_caffeine",
    name: "Organic Molecule: Caffeine Ring Core",
    description:
      "Purine-dione molecular skeleton of Caffeine (C8H10N4O2) showing fused 6-membered and 5-membered rings with atom features (Carbon, Nitrogen, Oxygen).",
    defaultTab: "spectral",
    nodes: [
      { id: "m0", label: "N1", x: 220, y: 160, atomType: "N", features: [0, 1, 0, 0] },
      { id: "m1", label: "C2(=O)", x: 270, y: 120, atomType: "C", features: [1, 0, 0, 0] },
      { id: "m2", label: "O(=C2)", x: 270, y: 60, atomType: "O", features: [0, 0, 1, 0] },
      { id: "m3", label: "N3", x: 320, y: 160, atomType: "N", features: [0, 1, 0, 0] },
      { id: "m4", label: "C4", x: 320, y: 220, atomType: "C", features: [1, 0, 0, 0] },
      { id: "m5", label: "C5", x: 270, y: 260, atomType: "C", features: [1, 0, 0, 0] },
      { id: "m6", label: "C6(=O)", x: 220, y: 220, atomType: "C", features: [1, 0, 0, 0] },
      { id: "m7", label: "O(=C6)", x: 160, y: 240, atomType: "O", features: [0, 0, 1, 0] },
      // Fused Imidazole 5-ring
      { id: "m8", label: "N7", x: 380, y: 200, atomType: "N", features: [0, 1, 0, 0] },
      { id: "m9", label: "C8", x: 410, y: 250, atomType: "C", features: [1, 0, 0, 0] },
      { id: "m10", label: "N9", x: 370, y: 280, atomType: "N", features: [0, 1, 0, 0] },
    ],
    edges: [
      { source: "m0", target: "m1", bondType: "single" },
      { source: "m1", target: "m2", bondType: "double" },
      { source: "m1", target: "m3", bondType: "single" },
      { source: "m3", target: "m4", bondType: "single" },
      { source: "m4", target: "m5", bondType: "double" },
      { source: "m5", target: "m6", bondType: "single" },
      { source: "m6", target: "m7", bondType: "double" },
      { source: "m6", target: "m0", bondType: "single" },
      // Imidazole ring connections
      { source: "m4", target: "m8", bondType: "single" },
      { source: "m8", target: "m9", bondType: "single" },
      { source: "m9", target: "m10", bondType: "double" },
      { source: "m10", target: "m5", bondType: "single" },
    ],
  },

  custom_editable: {
    id: "custom_editable",
    name: "Custom Editable Graph Canvas",
    description:
      "Interactive workbench to add/remove nodes, draw custom edges, drag vertices, and inspect live message passing and spectral Laplacians in real time.",
    defaultTab: "architecture",
    nodes: [
      { id: "u0", label: "Node A", x: 200, y: 140, features: [1, 0, 0, 0] },
      { id: "u1", label: "Node B", x: 320, y: 100, features: [0, 1, 0, 0] },
      { id: "u2", label: "Node C", x: 440, y: 140, features: [0, 0, 1, 0] },
      { id: "u3", label: "Node D", x: 440, y: 260, features: [0, 0, 0, 1] },
      { id: "u4", label: "Node E", x: 320, y: 300, features: [0.5, 0.5, 0, 0] },
      { id: "u5", label: "Node F", x: 200, y: 260, features: [0, 0.5, 0.5, 0] },
    ],
    edges: [
      { source: "u0", target: "u1" },
      { source: "u1", target: "u2" },
      { source: "u2", target: "u3" },
      { source: "u3", target: "u4" },
      { source: "u4", target: "u5" },
      { source: "u5", target: "u0" },
      { source: "u1", target: "u4" }, // Diagonal bridge
    ],
  },
};

// ============================================================================
// 10. COLOR PALETTES & HELPER UTILITIES
// ============================================================================

const WL_PALETTE = [
  "#38bdf8", // Sky 400
  "#a855f7", // Purple 500
  "#34d399", // Emerald 400
  "#f59e0b", // Amber 500
  "#f43f5e", // Rose 500
  "#6366f1", // Indigo 500
  "#14b8a6", // Teal 500
  "#ec4899", // Pink 500
  "#84cc16", // Lime 500
  "#06b6d4", // Cyan 500
  "#eab308", // Yellow 500
  "#8b5cf6", // Violet 500
];

export function getWLColorHex(colorId: string): string {
  const num = parseInt(colorId.replace(/\D/g, ""), 10);
  if (Number.isFinite(num)) {
    return WL_PALETTE[num % WL_PALETTE.length];
  }
  let hash = 0;
  for (let i = 0; i < colorId.length; i++) {
    hash = (hash * 31 + colorId.charCodeAt(i)) | 0;
  }
  return WL_PALETTE[Math.abs(hash) % WL_PALETTE.length];
}

export function getHarmonicColor(val: number, min = -0.6, max = 0.6): string {
  const norm = Math.max(0, Math.min(1, (val - min) / (max - min || 1)));
  if (norm < 0.5) {
    const t = norm / 0.5;
    const r = Math.round(56 + t * (148 - 56));
    const g = Math.round(189 + t * (163 - 189));
    const b = Math.round(248 + t * (184 - 248));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (norm - 0.5) / 0.5;
    const r = Math.round(148 + t * (244 - 148));
    const g = Math.round(163 + t * (63 - 163));
    const b = Math.round(184 + t * (94 - 184));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// ============================================================================
// 11. MAIN GRAPH NEURAL NETWORK STUDIO COMPONENT
// ============================================================================

export const GraphNeuralNetworkStudio: React.FC<GraphNeuralNetworkStudioProps> = ({
  initialTab = "architecture",
  initialPreset = "karate_club",
  initialArchitecture = "gcn",
  width = "100%",
  height = "auto",
  standalone = true,
  title = "Graph Neural Networks & Message Passing Studio",
  onTabChange,
  onPresetChange,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<GNNStudioTab>(initialTab);
  const [selectedPresetId, setSelectedPresetId] = useState<GNNPresetId>(initialPreset);
  const [architecture, setArchitecture] = useState<MessagePassingArchitecture>(initialArchitecture);

  // Architecture controls
  const [currentLayer, setCurrentLayer] = useState<number>(1);
  const [maxLayers] = useState<number>(4);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs] = useState<number>(1200);

  // Hyperparameters
  const [activationFn, setActivationFn] = useState<ActivationFunction>("relu");
  const [graphsageAggregator, setGraphsageAggregator] = useState<GraphSageAggregator>("mean");
  const [sageNormalizeL2, setSageNormalizeL2] = useState<boolean>(true);
  const [gatHeads, setGatHeads] = useState<number>(2);
  const [gatConcat, setGatConcat] = useState<boolean>(false);
  const [ginEps, setGinEps] = useState<number>(0.0);

  // Spectral controls
  const [selectedHarmonic, setSelectedHarmonic] = useState<number>(1); // Fiedler vector default (idx 1)
  const [chebyshevThetas, setChebyshevThetas] = useState<number[]>([1.0, 0.5, -0.3]);

  // Oversmoothing controls
  const [oversmoothResiduals, setOversmoothResiduals] = useState<boolean>(false);
  const [oversmoothPairNorm, setOversmoothPairNorm] = useState<boolean>(false);
  const [oversmoothWeightScale] = useState<number>(1.0);

  // 1-WL controls
  const [wlStep, setWlStep] = useState<number>(0);
  const [wlMaxSteps] = useState<number>(5);

  // Editable Graph state
  const [customNodes, setCustomNodes] = useState<GNNNode[]>(
    GNN_PRESETS[selectedPresetId]?.nodes ? [...GNN_PRESETS[selectedPresetId].nodes] : [],
  );
  const [customEdges, setCustomEdges] = useState<GNNEdge[]>(
    GNN_PRESETS[selectedPresetId]?.edges ? [...GNN_PRESETS[selectedPresetId].edges] : [],
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [edgeSourceCandidate, setEdgeSourceCandidate] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Preset switch handler
  const handlePresetSelect = useCallback(
    (presetId: GNNPresetId) => {
      setSelectedPresetId(presetId);
      const p = GNN_PRESETS[presetId];
      if (p) {
        setCustomNodes([...p.nodes]);
        setCustomEdges([...p.edges]);
        if (p.defaultTab) {
          setActiveTab(p.defaultTab);
          onTabChange?.(p.defaultTab);
        }
      }
      setSelectedNodeId(null);
      setCurrentLayer(1);
      setWlStep(0);
      onPresetChange?.(presetId);
    },
    [onPresetChange, onTabChange],
  );

  const handleTabSelect = useCallback(
    (tab: GNNStudioTab) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange],
  );

  // Graph Matrices Memo
  const nodeIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    customNodes.forEach((node, idx) => {
      map[node.id] = idx;
    });
    return map;
  }, [customNodes]);

  const numNodes = customNodes.length;

  const adjMatrix = useMemo(() => {
    return computeAdjacencyMatrix(numNodes, customEdges, nodeIndexMap, false);
  }, [numNodes, customEdges, nodeIndexMap]);

  const normLaplacianMatrix = useMemo(() => computeNormalizedLaplacian(adjMatrix), [adjMatrix]);

  // Spectral Eigendecomposition
  const spectralResult = useMemo(() => {
    return computeEigenvaluesAndVectors(normLaplacianMatrix);
  }, [normLaplacianMatrix]);

  // Initial Feature Matrix H0
  const initialFeatureMatrix = useMemo(() => {
    return customNodes.map((node) =>
      node.features && node.features.length === 4 ? [...node.features] : [1.0, 0.0, 0.0, 0.0],
    );
  }, [customNodes]);

  // Forward Message Passing Propagation across layers
  const layerHistory = useMemo(() => {
    if (numNodes === 0) return [];
    const fDim = initialFeatureMatrix[0]?.length || 4;
    const history: { layer: number; H: number[][]; attention?: number[][][] }[] = [];

    let currentH = cloneMatrix(initialFeatureMatrix);
    history.push({ layer: 0, H: currentH });

    // Deterministic weights for visualization
    const W = identityMatrix(fDim).map((row) => row.map((v) => v * 1.0));

    for (let l = 1; l <= maxLayers; l++) {
      let nextH: number[][];
      let attn: number[][][] | undefined = undefined;

      if (architecture === "gcn") {
        nextH = computeGCNLayer(currentH, adjMatrix, W, activationFn, true);
      } else if (architecture === "graphsage") {
        const WS = W.map((r) => r.map((x) => x * 0.6));
        const WN = W.map((r) => r.map((x) => x * 0.4));
        nextH = computeGraphSAGELayer(
          currentH,
          adjMatrix,
          WS,
          WN,
          graphsageAggregator,
          sageNormalizeL2,
          activationFn,
        );
      } else if (architecture === "gat") {
        const headW = Array.from({ length: gatHeads }, () => W);
        const aSrc = Array.from({ length: gatHeads }, () => new Array(fDim).fill(0.5));
        const aDst = Array.from({ length: gatHeads }, () => new Array(fDim).fill(0.5));
        const res = computeGATLayer(
          currentH,
          adjMatrix,
          headW,
          aSrc,
          aDst,
          gatHeads,
          0.2,
          activationFn,
          gatConcat,
        );
        nextH = res.HOut;
        attn = res.attentionWeights;
      } else {
        // GIN
        const mlp = {
          W1: W,
          b1: new Array(fDim).fill(0.0),
          W2: W,
          b2: new Array(fDim).fill(0.0),
        };
        nextH = computeGINLayer(currentH, adjMatrix, mlp, ginEps, activationFn);
      }

      history.push({ layer: l, H: nextH, attention: attn });
      currentH = nextH;
    }

    return history;
  }, [
    numNodes,
    initialFeatureMatrix,
    maxLayers,
    architecture,
    adjMatrix,
    activationFn,
    graphsageAggregator,
    sageNormalizeL2,
    gatHeads,
    gatConcat,
    ginEps,
  ]);

  // Active layer representation
  const activeLayerData = useMemo(() => {
    const boundedLayer = Math.min(currentLayer, layerHistory.length - 1);
    return layerHistory[boundedLayer] || { layer: 0, H: initialFeatureMatrix };
  }, [currentLayer, layerHistory, initialFeatureMatrix]);

  // Oversmoothing Simulation Trajectory
  const oversmoothTrajectories = useMemo(() => {
    return simulateLayerTrajectories(
      initialFeatureMatrix,
      adjMatrix,
      10,
      architecture,
      oversmoothResiduals,
      oversmoothPairNorm,
      oversmoothWeightScale,
    );
  }, [
    initialFeatureMatrix,
    adjMatrix,
    architecture,
    oversmoothResiduals,
    oversmoothPairNorm,
    oversmoothWeightScale,
  ]);

  // 1-WL Color Refinement for Main and Secondary Graph (if pair)
  const isWLPair = Boolean(
    GNN_PRESETS[selectedPresetId]?.isPair && GNN_PRESETS[selectedPresetId]?.secondaryGraph,
  );
  const secondaryGraphData = GNN_PRESETS[selectedPresetId]?.secondaryGraph;

  const wlComparison = useMemo(() => {
    const g1Nodes = customNodes.map((n) => n.id);
    const g1Edges = customEdges.map(
      (e) => [String(e.source), String(e.target)] as [string, string],
    );

    if (isWLPair && secondaryGraphData) {
      const g2Nodes = secondaryGraphData.nodes.map((n) => n.id);
      const g2Edges = secondaryGraphData.edges.map(
        (e) => [String(e.source), String(e.target)] as [string, string],
      );
      return compare1WLGraphPair(
        { nodes: g1Nodes, edges: g1Edges },
        { nodes: g2Nodes, edges: g2Edges },
        wlMaxSteps,
      );
    } else {
      const g1Res = run1WLColorRefinement(g1Nodes, g1Edges, undefined, wlMaxSteps);
      return {
        graph1Result: g1Res,
        graph2Result: g1Res,
        isDistinguishable: false,
        distinctionStep: null,
        verdictExplanation: "Single Graph 1-WL Color Refinement partition.",
      };
    }
  }, [customNodes, customEdges, isWLPair, secondaryGraphData, wlMaxSteps]);

  const activeWLStepData = useMemo(() => {
    const s = Math.min(wlStep, wlComparison.graph1Result.steps.length - 1);
    return {
      step: s,
      g1Step: wlComparison.graph1Result.steps[s],
      g2Step: wlComparison.graph2Result.steps[s],
    };
  }, [wlStep, wlComparison]);

  // Playback timer for Message Passing & 1-WL
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      if (activeTab === "architecture") {
        setCurrentLayer((prev) => (prev >= maxLayers ? 0 : prev + 1));
      } else if (activeTab === "weisfeiler_lehman") {
        setWlStep((prev) => (prev >= wlMaxSteps ? 0 : prev + 1));
      }
    }, playbackSpeedMs);

    return () => clearInterval(timer);
  }, [isPlaying, activeTab, maxLayers, wlMaxSteps, playbackSpeedMs]);

  // Dragging & Editing canvas nodes
  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggedNodeId || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const newX = Math.max(30, Math.min(610, e.clientX - rect.left));
      const newY = Math.max(30, Math.min(370, e.clientY - rect.top));

      setCustomNodes((prev) =>
        prev.map((n) => (n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n)),
      );
    },
    [draggedNodeId],
  );

  const handleSvgMouseUp = useCallback(() => {
    setDraggedNodeId(null);
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (
        selectedPresetId === "custom_editable" &&
        edgeSourceCandidate &&
        edgeSourceCandidate !== nodeId
      ) {
        // Toggle edge
        const existingIdx = customEdges.findIndex(
          (edge) =>
            (edge.source === edgeSourceCandidate && edge.target === nodeId) ||
            (edge.source === nodeId && edge.target === edgeSourceCandidate),
        );

        if (existingIdx >= 0) {
          setCustomEdges((prev) => prev.filter((_, idx) => idx !== existingIdx));
        } else {
          setCustomEdges((prev) => [...prev, { source: edgeSourceCandidate, target: nodeId }]);
        }
        setEdgeSourceCandidate(null);
        setSelectedNodeId(nodeId);
      } else {
        setSelectedNodeId(nodeId);
        if (selectedPresetId === "custom_editable") {
          setEdgeSourceCandidate(nodeId);
        }
      }
    },
    [selectedPresetId, edgeSourceCandidate, customEdges],
  );

  const handleAddCustomNode = useCallback(() => {
    const newId = `u${customNodes.length}`;
    const newX = 100 + ((customNodes.length * 50) % 400);
    const newY = 100 + ((customNodes.length * 40) % 200);
    const newNode: GNNNode = {
      id: newId,
      label: `Node ${newId}`,
      x: newX,
      y: newY,
      features: [0.5, 0.5, 0.0, 0.0],
    };
    setCustomNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
  }, [customNodes]);

  const handleDeleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setCustomNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setCustomEdges((prev) =>
      prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
    );
    setSelectedNodeId(null);
    setEdgeSourceCandidate(null);
  }, [selectedNodeId]);

  // Selected Node Details
  const selectedNodeIndex = selectedNodeId ? nodeIndexMap[selectedNodeId] : -1;
  const selectedNodeObject = selectedNodeIndex >= 0 ? customNodes[selectedNodeIndex] : null;
  const selectedNodeEmbedding =
    selectedNodeIndex >= 0 ? activeLayerData.H[selectedNodeIndex] : null;

  return (
    <div
      className={`w-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "p-4 md:p-6" : "p-2"
      }`}
      style={{ width, height: height === "auto" ? undefined : height }}
    >
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-5 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Interactive Spectral Graph Theory, Message Passing Architectures, Oversmoothing & 1-WL
            Expressive Limits
          </p>
        </div>

        {/* PRESET SELECTOR */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Graph Preset:
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value as GNNPresetId)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs md:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
          >
            {Object.values(GNN_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap items-center gap-2 mt-4 border-b border-slate-800/80 pb-3">
        {[
          { id: "architecture", label: "Message Passing (GCN/SAGE/GAT/GIN)", icon: Cpu },
          { id: "spectral", label: "Spectral Graph Theory & Fourier", icon: Activity },
          { id: "oversmoothing", label: "Oversmoothing & Dirichlet Decay", icon: TrendingDown },
          { id: "weisfeiler_lehman", label: "1-WL Color Refinement & Expressivity", icon: Binary },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id as GNNStudioTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT COLUMN: INTERACTIVE GRAPH CANVAS */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-inner overflow-hidden">
            {/* Canvas Header Controls */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  {isWLPair && activeTab === "weisfeiler_lehman"
                    ? "Graph A (Decagon C10)"
                    : GNN_PRESETS[selectedPresetId].name}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {customNodes.length} Nodes &bull; {customEdges.length} Edges
                </span>
              </div>

              {selectedPresetId === "custom_editable" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddCustomNode}
                    className="flex items-center gap-1 px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 text-xs rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Node
                  </button>
                  {selectedNodeId && (
                    <button
                      onClick={handleDeleteSelectedNode}
                      className="flex items-center gap-1 px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 text-xs rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative w-full h-[380px] bg-slate-950/90 rounded-lg border border-slate-800/80 overflow-hidden select-none">
              <svg
                ref={svgRef}
                viewBox="0 0 640 400"
                className="w-full h-full cursor-crosshair"
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onClick={() => setSelectedNodeId(null)}
              >
                {/* Background Grid Lines */}
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="rgba(51, 65, 85, 0.25)"
                      strokeWidth="0.8"
                    />
                  </pattern>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect width="640" height="400" fill="url(#grid)" />

                {/* Edges */}
                {customEdges.map((edge, idx) => {
                  const uIdx = nodeIndexMap[String(edge.source)];
                  const vIdx = nodeIndexMap[String(edge.target)];
                  const u = customNodes[uIdx];
                  const v = customNodes[vIdx];
                  if (!u || !v) return null;

                  // Compute edge attention or weight if GAT active
                  let strokeWidth = 1.6;
                  let strokeColor = "rgba(100, 116, 139, 0.5)"; // slate-500

                  if (
                    activeTab === "architecture" &&
                    architecture === "gat" &&
                    activeLayerData.attention &&
                    activeLayerData.attention[0]
                  ) {
                    const alpha = activeLayerData.attention[0][uIdx]?.[vIdx] || 0.1;
                    strokeWidth = 1.0 + alpha * 6.0;
                    strokeColor = `rgba(168, 85, 247, ${Math.max(0.2, alpha * 1.5)})`; // Purple
                  }

                  const isSelectedEdge =
                    selectedNodeId &&
                    (String(edge.source) === selectedNodeId ||
                      String(edge.target) === selectedNodeId);

                  if (isSelectedEdge) {
                    strokeColor = "rgba(56, 189, 248, 0.9)"; // Cyan
                    strokeWidth = Math.max(strokeWidth, 2.5);
                  }

                  return (
                    <g key={`edge-${edge.source}-${edge.target}-${idx}`}>
                      <line
                        x1={u.x}
                        y1={u.y}
                        x2={v.x}
                        y2={v.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                      {/* Pulse particle moving across edge during play */}
                      {isPlaying && (
                        <circle r="3" fill="#38bdf8" filter="url(#glow)">
                          <animate
                            attributeName="cx"
                            values={`${u.x};${v.x}`}
                            dur={`${playbackSpeedMs}ms`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="cy"
                            values={`${u.y};${v.y}`}
                            dur={`${playbackSpeedMs}ms`}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {customNodes.map((node, idx) => {
                  const isSelected = selectedNodeId === node.id;
                  const isEdgeCandidate = edgeSourceCandidate === node.id;

                  // Determine node color based on active tab
                  let nodeColor = "#38bdf8"; // default cyan

                  if (activeTab === "architecture") {
                    const emb = activeLayerData.H[idx] || [0, 0, 0, 0];
                    // Map first 3 dimensions to RGB
                    const r = Math.min(255, Math.max(40, Math.round(emb[0] * 220 + 30)));
                    const g = Math.min(255, Math.max(40, Math.round((emb[1] || 0) * 220 + 40)));
                    const b = Math.min(255, Math.max(60, Math.round((emb[2] || 0) * 220 + 70)));
                    nodeColor = `rgb(${r}, ${g}, ${b})`;
                  } else if (activeTab === "spectral") {
                    const eigVec = spectralResult.eigenvectors;
                    const harmonicVal = eigVec[idx]?.[selectedHarmonic] || 0;
                    nodeColor = getHarmonicColor(harmonicVal);
                  } else if (activeTab === "weisfeiler_lehman") {
                    const colorId = activeWLStepData.g1Step?.nodeColors[node.id] || "C0";
                    nodeColor = getWLColorHex(colorId);
                  } else if (activeTab === "oversmoothing") {
                    // Cosine similarity relative to node 0
                    const refNodeEmb = activeLayerData.H[0] || [1, 0, 0, 0];
                    const thisEmb = activeLayerData.H[idx] || [1, 0, 0, 0];
                    const sim = vectorCosineSimilarity(refNodeEmb, thisEmb);
                    const heat = Math.max(0, Math.min(1, (sim + 1) / 2));
                    nodeColor = `rgb(${Math.round(heat * 240 + 15)}, ${Math.round((1 - heat) * 180 + 30)}, 230)`;
                  }

                  const radius = isSelected ? 16 : 13;

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer transition-transform duration-150"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggedNodeId(node.id);
                        handleNodeClick(node.id, e);
                      }}
                    >
                      {/* Halo ring if selected or candidate */}
                      {(isSelected || isEdgeCandidate) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 6}
                          fill="none"
                          stroke={isEdgeCandidate ? "#f59e0b" : "#38bdf8"}
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          className="animate-spin"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={nodeColor}
                        stroke="#0f172a"
                        strokeWidth="2.5"
                        filter="url(#glow)"
                        className="transition-all duration-300"
                      />

                      {/* Node Label Text */}
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fontSize={radius > 14 ? "10" : "9"}
                        fontWeight="bold"
                        fill="#0f172a"
                        pointerEvents="none"
                      >
                        {node.atomType || node.label.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Canvas Overlay Badge */}
              <div className="absolute bottom-2 left-2 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 backdrop-blur-md">
                {activeTab === "architecture" && (
                  <span>
                    Layer <strong className="text-cyan-400">{activeLayerData.layer}</strong> of{" "}
                    {maxLayers} &bull; {architecture.toUpperCase()}
                  </span>
                )}
                {activeTab === "spectral" && (
                  <span>
                    Harmonic Mode <strong className="text-purple-400">u_{selectedHarmonic}</strong>{" "}
                    &bull; &lambda; ={" "}
                    {(spectralResult.eigenvalues[selectedHarmonic] || 0).toFixed(4)}
                  </span>
                )}
                {activeTab === "weisfeiler_lehman" && (
                  <span>
                    1-WL Step <strong className="text-emerald-400">{activeWLStepData.step}</strong>{" "}
                    &bull; {activeWLStepData.g1Step?.numUniqueColors || 0} Color Classes
                  </span>
                )}
                {activeTab === "oversmoothing" && (
                  <span>
                    Layer {currentLayer} &bull; Dirichlet Energy:{" "}
                    <strong className="text-amber-400">
                      {(oversmoothTrajectories[currentLayer]?.dirichletEnergy || 0).toFixed(5)}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {/* Playback & Step Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (activeTab === "architecture") setCurrentLayer(0);
                    else if (activeTab === "weisfeiler_lehman") setWlStep(0);
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  title="Reset to Step 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (activeTab === "architecture") setCurrentLayer((p) => Math.max(0, p - 1));
                    else if (activeTab === "weisfeiler_lehman")
                      setWlStep((p) => Math.max(0, p - 1));
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  title="Step Backward"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isPlaying
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? "Pause" : "Play Animation"}
                </button>
                <button
                  onClick={() => {
                    if (activeTab === "architecture")
                      setCurrentLayer((p) => Math.min(maxLayers, p + 1));
                    else if (activeTab === "weisfeiler_lehman")
                      setWlStep((p) => Math.min(wlMaxSteps, p + 1));
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  title="Step Forward"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Slider */}
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeTab === "architecture" ? `L${currentLayer}` : `S${wlStep}`}
                </span>
                <input
                  type="range"
                  min="0"
                  max={activeTab === "architecture" ? maxLayers : wlMaxSteps}
                  value={activeTab === "architecture" ? currentLayer : wlStep}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (activeTab === "architecture") setCurrentLayer(val);
                    else setWlStep(val);
                  }}
                  className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECONDARY GRAPH CANVAS (FOR 1-WL PAIRS LIKE DECAGON VS 2x PENTAGONS) */}
          {isWLPair && activeTab === "weisfeiler_lehman" && secondaryGraphData && (
            <div className="relative bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-purple-400" />
                  Graph B: Disjoint 2 x Pentagons (2 x C5)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {secondaryGraphData.nodes.length} Nodes &bull; {secondaryGraphData.edges.length}{" "}
                  Edges
                </span>
              </div>

              <div className="w-full h-[220px] bg-slate-950/90 rounded-lg border border-slate-800/80 overflow-hidden">
                <svg viewBox="0 0 640 380" className="w-full h-full">
                  {secondaryGraphData.edges.map((edge, idx) => {
                    const u = secondaryGraphData.nodes.find((n) => n.id === edge.source);
                    const v = secondaryGraphData.nodes.find((n) => n.id === edge.target);
                    if (!u || !v) return null;
                    return (
                      <line
                        key={`edge-b-${idx}`}
                        x1={u.x + 50}
                        y1={u.y - 40}
                        x2={v.x + 50}
                        y2={v.y - 40}
                        stroke="rgba(100, 116, 139, 0.6)"
                        strokeWidth="1.8"
                      />
                    );
                  })}
                  {secondaryGraphData.nodes.map((node) => {
                    const colorId = activeWLStepData.g2Step?.nodeColors[node.id] || "C0";
                    const nodeColor = getWLColorHex(colorId);
                    return (
                      <g key={node.id}>
                        <circle
                          cx={node.x + 50}
                          cy={node.y - 40}
                          r="13"
                          fill={nodeColor}
                          stroke="#0f172a"
                          strokeWidth="2.5"
                          filter="url(#glow)"
                        />
                        <text
                          x={node.x + 50}
                          y={node.y - 36}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#0f172a"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TAB-SPECIFIC CONTROLS & DASHBOARDS */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* TAB 1: ARCHITECTURE STUDIO (GCN, GraphSAGE, GAT, GIN) */}
          {activeTab === "architecture" && (
            <div className="flex flex-col gap-4">
              {/* Architecture Selector */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Message Passing Framework
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "gcn", label: "GCN", desc: "Spectral Normalized" },
                    { id: "graphsage", label: "GraphSAGE", desc: "Sample & Agg" },
                    { id: "gat", label: "GAT", desc: "Multi-Head Attention" },
                    { id: "gin", label: "GIN", desc: "1-WL Max Expressive" },
                  ].map((arch) => (
                    <button
                      key={arch.id}
                      onClick={() => setArchitecture(arch.id as MessagePassingArchitecture)}
                      className={`p-2.5 rounded-lg text-left transition-all border ${
                        architecture === arch.id
                          ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-300"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-bold text-xs">{arch.label}</div>
                      <div className="text-[10px] text-slate-400">{arch.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Hyperparameters Config */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Activation Function &sigma;:</span>
                    <select
                      value={activationFn}
                      onChange={(e) => setActivationFn(e.target.value as ActivationFunction)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                    >
                      <option value="relu">ReLU</option>
                      <option value="leaky_relu">LeakyReLU (0.2)</option>
                      <option value="elu">ELU</option>
                      <option value="tanh">Tanh</option>
                      <option value="identity">Identity (Linear)</option>
                    </select>
                  </div>

                  {architecture === "graphsage" && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Neighborhood Aggregator:</span>
                        <select
                          value={graphsageAggregator}
                          onChange={(e) =>
                            setGraphsageAggregator(e.target.value as GraphSageAggregator)
                          }
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1"
                        >
                          <option value="mean">Mean Aggregator</option>
                          <option value="sum">Sum Aggregator</option>
                          <option value="max">Max-Pooling</option>
                        </select>
                      </div>
                      <label className="flex items-center justify-between text-xs text-slate-400 cursor-pointer">
                        <span>L2 Normalization:</span>
                        <input
                          type="checkbox"
                          checked={sageNormalizeL2}
                          onChange={(e) => setSageNormalizeL2(e.target.checked)}
                          className="accent-cyan-400"
                        />
                      </label>
                    </>
                  )}

                  {architecture === "gat" && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Attention Heads:</span>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 4].map((h) => (
                            <button
                              key={h}
                              onClick={() => setGatHeads(h)}
                              className={`px-2 py-0.5 rounded text-xs ${
                                gatHeads === h
                                  ? "bg-cyan-500 text-slate-950 font-bold"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="flex items-center justify-between text-xs text-slate-400 cursor-pointer">
                        <span>Concat Heads (vs Average):</span>
                        <input
                          type="checkbox"
                          checked={gatConcat}
                          onChange={(e) => setGatConcat(e.target.checked)}
                          className="accent-cyan-400"
                        />
                      </label>
                    </>
                  )}

                  {architecture === "gin" && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Learnable &epsilon;: {ginEps.toFixed(2)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={ginEps}
                        onChange={(e) => setGinEps(parseFloat(e.target.value))}
                        className="w-24 accent-cyan-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mathematical Formula Card */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  Layer Propagation Equation
                </h3>
                <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-xs text-indigo-300 border border-slate-800/80 overflow-x-auto">
                  {architecture === "gcn" && (
                    <span>
                      H^(l+1) = &sigma;( D&#771;^(-1/2) A&#771; D&#771;^(-1/2) H^(l) W^(l) )
                    </span>
                  )}
                  {architecture === "graphsage" && (
                    <span>
                      h_v^(l+1) = &sigma;( W_self h_v^(l) + W_neigh AGG({"{h_u : u &isin; N(v)}"}) )
                    </span>
                  )}
                  {architecture === "gat" && (
                    <span>
                      &alpha;_ij = Softmax_j( LeakyReLU( a^T [Wh_i || Wh_j] ) )
                      <br />
                      h_i^(l+1) = &sigma;( &sum;_j &alpha;_ij W h_j )
                    </span>
                  )}
                  {architecture === "gin" && (
                    <span>
                      h_v^(l+1) = MLP( (1 + &epsilon;) h_v^(l) + &sum;_{"{u &isin; N(v)}"} h_u^(l) )
                    </span>
                  )}
                </div>
              </div>

              {/* Node Inspector */}
              {selectedNodeObject && selectedNodeEmbedding && (
                <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-cyan-400" />
                    Node Embedding Inspector &bull; {selectedNodeObject.label}
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedNodeEmbedding.map((val, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-2 rounded border border-slate-800 text-center"
                      >
                        <div className="text-[10px] text-slate-500 uppercase">Dim {idx}</div>
                        <div className="text-xs font-mono font-bold text-cyan-300">
                          {val.toFixed(4)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SPECTRAL GRAPH THEORY & FOURIER */}
          {activeTab === "spectral" && (
            <div className="flex flex-col gap-4">
              {/* Harmonic Mode Selector */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Laplacian Spectrum & Eigenvectors
                  </h3>
                  <span className="text-[11px] text-purple-300 font-mono">
                    Mode u_{selectedHarmonic}: &lambda; ={" "}
                    {(spectralResult.eigenvalues[selectedHarmonic] || 0).toFixed(4)}
                  </span>
                </div>

                {/* Eigenvalue Spectrum Bar Plot */}
                <div className="h-28 flex items-end gap-1.5 bg-slate-950 p-2.5 rounded-lg border border-slate-800 overflow-x-auto">
                  {spectralResult.eigenvalues.map((lambda, idx) => {
                    const isSelected = selectedHarmonic === idx;
                    const maxEig =
                      spectralResult.eigenvalues[spectralResult.eigenvalues.length - 1] || 2.0;
                    const heightPercent = Math.max(8, (lambda / (maxEig || 1)) * 100);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedHarmonic(idx)}
                        className={`flex-1 min-w-[14px] flex flex-col items-center justify-end group transition-all`}
                        title={`Mode ${idx}: lambda = ${lambda.toFixed(4)}`}
                      >
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t transition-all ${
                            isSelected
                              ? "bg-purple-400 shadow-lg shadow-purple-500/50"
                              : "bg-slate-700 group-hover:bg-purple-600/60"
                          }`}
                        />
                        <span
                          className={`text-[9px] mt-1 font-mono ${
                            isSelected ? "text-purple-300 font-bold" : "text-slate-500"
                          }`}
                        >
                          {idx}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {selectedHarmonic === 1
                    ? "Mode u_1 (Fiedler Vector): Partitions the graph into clusters based on algebraic connectivity."
                    : `Mode u_${selectedHarmonic}: Graph harmonic oscillation frequency corresponding to lambda = ${(
                        spectralResult.eigenvalues[selectedHarmonic] || 0
                      ).toFixed(4)}.`}
                </p>
              </div>

              {/* Chebyshev Polynomial Filter */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Chebyshev Polynomial Spectral Filter (Order K={chebyshevThetas.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {chebyshevThetas.map((theta, k) => (
                    <div key={k} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono">
                        &theta;_{k}: {theta.toFixed(2)}
                      </span>
                      <input
                        type="range"
                        min="-2"
                        max="2"
                        step="0.1"
                        value={theta}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setChebyshevThetas((prev) => {
                            const copy = [...prev];
                            copy[k] = val;
                            return copy;
                          });
                        }}
                        className="w-32 accent-purple-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OVERSMOOTHING & DIRICHLET ENERGY */}
          {activeTab === "oversmoothing" && (
            <div className="flex flex-col gap-4">
              {/* Dirichlet Energy Plot */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-amber-400" />
                    Dirichlet Energy Decay Trajectory
                  </h3>
                  <span className="text-[11px] text-amber-300 font-mono">
                    E(H) = {(oversmoothTrajectories[currentLayer]?.dirichletEnergy || 0).toFixed(6)}
                  </span>
                </div>

                {/* Mini Energy Line Chart */}
                <div className="h-32 bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-end gap-2 relative">
                  {oversmoothTrajectories.map((pt, idx) => {
                    const maxE = oversmoothTrajectories[0]?.dirichletEnergy || 1.0;
                    const hPercent = Math.max(5, (pt.dirichletEnergy / (maxE || 1)) * 100);
                    const isCur = currentLayer === idx;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                        onClick={() => setCurrentLayer(idx)}
                      >
                        <div
                          style={{ height: `${hPercent}%` }}
                          className={`w-full rounded-t transition-all ${
                            isCur ? "bg-amber-400" : "bg-slate-700 group-hover:bg-amber-500/50"
                          }`}
                        />
                        <span
                          className={`text-[9px] mt-1 ${isCur ? "text-amber-300 font-bold" : "text-slate-500"}`}
                        >
                          L{idx}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Oversmoothing Mitigation Controls */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                  <label className="flex items-center justify-between text-xs text-slate-400 cursor-pointer">
                    <span>Residual Skip Connections (+ Id):</span>
                    <input
                      type="checkbox"
                      checked={oversmoothResiduals}
                      onChange={(e) => setOversmoothResiduals(e.target.checked)}
                      className="accent-amber-400"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-slate-400 cursor-pointer">
                    <span>PairNorm (Embedding Rescaling):</span>
                    <input
                      type="checkbox"
                      checked={oversmoothPairNorm}
                      onChange={(e) => setOversmoothPairNorm(e.target.checked)}
                      className="accent-amber-400"
                    />
                  </label>
                </div>
              </div>

              {/* Cosine Similarity Matrix Heatmap */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Pairwise Cosine Similarity Matrix S (Layer {currentLayer})
                </h3>
                <div className="flex flex-col gap-0.5 bg-slate-950 p-2 rounded-lg border border-slate-800 max-h-48 overflow-auto">
                  {computeCosineSimilarityMatrix(activeLayerData.H).map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-0.5">
                      {row.map((val, cIdx) => {
                        const intensity = Math.max(0, Math.min(1, (val + 1) / 2));
                        return (
                          <div
                            key={cIdx}
                            style={{
                              backgroundColor: `rgba(244, 63, 94, ${intensity})`,
                            }}
                            className="w-4 h-4 rounded-[2px] transition-colors"
                            title={`S(${rIdx}, ${cIdx}) = ${val.toFixed(3)}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  As depth increases without residuals, pairwise similarities approach 1.0
                  (exponential collapse to 1D subspace).
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: WEISFEILER-LEHMAN COLOR REFINEMENT */}
          {activeTab === "weisfeiler_lehman" && (
            <div className="flex flex-col gap-4">
              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  wlComparison.isDistinguishable
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                {wlComparison.isDistinguishable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-xs">
                    {wlComparison.isDistinguishable
                      ? "1-WL Distinguishable (Non-Isomorphic)"
                      : "1-WL Indistinguishable Limit"}
                  </div>
                  <p className="text-[11px] opacity-90 mt-1">{wlComparison.verdictExplanation}</p>
                </div>
              </div>

              {/* Color Histogram Classes */}
              <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Binary className="w-4 h-4 text-cyan-400" />
                  Step {activeWLStepData.step} Color Equivalence Classes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeWLStepData.g1Step?.colorHistograms || {}).map(
                    ([colorId, count]) => (
                      <div
                        key={colorId}
                        className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getWLColorHex(colorId) }}
                        />
                        <span className="font-mono text-slate-300">{colorId}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {count} {count === 1 ? "node" : "nodes"}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
