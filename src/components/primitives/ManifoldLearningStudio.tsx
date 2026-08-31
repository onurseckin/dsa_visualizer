import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Activity,
  Compass,
  Layers,
  Sliders,
  Cpu,
  ChevronRight,
  ChevronDown,
  BookOpen,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type Point3D = [number, number, number];
export type Point2D = [number, number];

export type ManifoldDatasetId =
  | "swiss_roll"
  | "concentric_spheres"
  | "severed_sphere"
  | "twin_peaks"
  | "trefoil_knot"
  | "interlocking_rings";

export type ManifoldAlgorithmId = "pca" | "tsne" | "umap" | "isomap" | "mds";

export type ManifoldPresetId =
  | "swiss_roll_unroll"
  | "concentric_spheres_separation"
  | "severed_sphere_puncture"
  | "twin_peaks_clustering"
  | "trefoil_knot_untangling"
  | "interlocking_rings_topology";

export interface ManifoldDatasetMeta {
  readonly id: ManifoldDatasetId;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly intrinsicDimension: number;
  readonly ambientDimension: number;
  readonly topologicalChallenge: string;
}

export interface GeneratedDataset {
  readonly id: ManifoldDatasetId;
  readonly points: Point3D[];
  readonly colors: string[];
  readonly labels?: number[];
  readonly parameters: Record<string, number | string>;
}

export interface AlgorithmHyperparameters {
  readonly nPoints: number;
  readonly noise: number;
  readonly seed: number;
  readonly perplexity: number;
  readonly learningRate: number;
  readonly momentum: number;
  readonly earlyExaggeration: number;
  readonly earlyExaggerationIter: number;
  readonly umapNNeighbors: number;
  readonly umapMinDist: number;
  readonly umapSpread: number;
  readonly isomapKNeighbors: number;
  readonly metricK: number;
}

export interface ManifoldPreset {
  readonly id: ManifoldPresetId;
  readonly name: string;
  readonly description: string;
  readonly datasetId: ManifoldDatasetId;
  readonly algorithmId: ManifoldAlgorithmId;
  readonly params: Partial<AlgorithmHyperparameters>;
  readonly educationalInsight: string;
}

export interface ManifoldDiagnostics {
  readonly trustworthiness: number;
  readonly continuity: number;
  readonly neighborhoodPreservation: number;
  readonly stressOrLoss: number;
  readonly explainedVarianceRatio?: [number, number];
  readonly totalExplainedVariance?: number;
  readonly geodesicDisconnections?: number;
  readonly computationTimeMs: number;
  readonly metricK: number;
}

export interface AlgorithmState {
  readonly iteration: number;
  readonly maxIterations: number;
  readonly loss: number;
  readonly lossHistory: number[];
  readonly embedding: Point2D[];
  readonly velocities?: Point2D[];
  readonly isConverged: boolean;
  readonly diagnostics: ManifoldDiagnostics;
}

export interface PCAResult {
  readonly embedding: Point2D[];
  readonly eigenvalues: number[];
  readonly eigenvectors: Point3D[];
  readonly explainedVarianceRatio: [number, number];
  readonly totalExplainedVariance: number;
}

export interface MDSResult {
  readonly embedding: Point2D[];
  readonly eigenvalues: number[];
  readonly stress: number;
}

export interface IsomapResult {
  readonly embedding: Point2D[];
  readonly eigenvalues: number[];
  readonly geodesicDistances: number[][];
  readonly disconnectedCount: number;
  readonly stress: number;
}

export interface UMAPParams {
  readonly a: number;
  readonly b: number;
  readonly sigmas: number[];
  readonly rhos: number[];
  readonly fuzzyUnion: number[][];
}

export interface TSNEParams {
  readonly sigmas: number[];
  readonly symmetrizedP: number[][];
}

export interface ManifoldLearningStudioProps {
  readonly initialDataset?: ManifoldDatasetId;
  readonly initialAlgorithm?: ManifoldAlgorithmId;
  readonly initialPreset?: ManifoldPresetId;
  readonly initialSampleSize?: number;
  readonly initialNoise?: number;
  readonly initialPerplexity?: number;
  readonly initialLearningRate?: number;
  readonly initialUMAPNeighbors?: number;
  readonly initialIsomapNeighbors?: number;
  readonly initialMetricK?: number;
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onDatasetChange?: (datasetId: ManifoldDatasetId) => void;
  readonly onAlgorithmChange?: (algorithmId: ManifoldAlgorithmId) => void;
  readonly onStepChange?: (iteration: number, loss: number) => void;
  readonly onDiagnosticsUpdate?: (diagnostics: ManifoldDiagnostics) => void;
}

// ============================================================================
// 2. MATHEMATICAL & PSEUDORANDOM HELPER FUNCTIONS
// ============================================================================

/**
 * High-quality linear congruential deterministic PRNG generator.
 */
export function createDeterministicRng(seed = 123456789): () => number {
  let s = Math.floor(Math.abs(seed)) % 4294967296 || 123456789;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Standard Normal Box-Muller transformation.
 */
export function sampleNormal(rng: () => number, mean = 0, std = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * std;
}

/**
 * Compute Euclidean pairwise distance matrix for N points in arbitrary dimensions.
 */
export function computePairwiseDistances(X: number[][]): number[][] {
  const n = X.length;
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const dim = X[0]?.length || 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let sumSq = 0;
      for (let d = 0; d < dim; d++) {
        const diff = X[i][d] - X[j][d];
        sumSq += diff * diff;
      }
      const dVal = Math.sqrt(sumSq);
      dist[i][j] = dVal;
      dist[j][i] = dVal;
    }
  }
  return dist;
}

/**
 * Compute squared Euclidean pairwise distance matrix for N points.
 */
export function computePairwiseSquaredDistances(X: number[][]): number[][] {
  const n = X.length;
  const distSq: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const dim = X[0]?.length || 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let sumSq = 0;
      for (let d = 0; d < dim; d++) {
        const diff = X[i][d] - X[j][d];
        sumSq += diff * diff;
      }
      distSq[i][j] = sumSq;
      distSq[j][i] = sumSq;
    }
  }
  return distSq;
}

/**
 * Cyclic Jacobi eigenvalue algorithm for symmetric real matrices.
 * Returns sorted eigenvalues in descending order and orthonormal eigenvectors.
 */
export function computeSymmetricEigenvaluesAndVectors(
  A: number[][],
  maxSweeps = 50,
  tol = 1e-10,
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = A.length;
  if (n === 0) return { eigenvalues: [], eigenvectors: [] };

  const S: number[][] = A.map((row) => [...row]);
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  );

  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxOffDiag = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const absVal = Math.abs(S[i][j]);
        if (absVal > maxOffDiag) maxOffDiag = absVal;
      }
    }
    if (maxOffDiag < tol) break;

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const spq = S[p][q];
        if (Math.abs(spq) < 1e-15) continue;

        const spp = S[p][p];
        const sqq = S[q][q];
        const theta = (sqq - spp) / (2 * spq);
        let t: number;
        if (theta >= 0) {
          t = 1 / (theta + Math.sqrt(1 + theta * theta));
        } else {
          t = -1 / (-theta + Math.sqrt(1 + theta * theta));
        }
        const c = 1 / Math.sqrt(1 + t * t);
        const s = t * c;
        const tau = s / (1 + c);

        S[p][p] -= t * spq;
        S[q][q] += t * spq;
        S[p][q] = 0;
        S[q][p] = 0;

        for (let r = 0; r < n; r++) {
          if (r !== p && r !== q) {
            const spr = S[p][r];
            const sqr = S[q][r];
            S[p][r] = spr - s * (sqr + tau * spr);
            S[r][p] = S[p][r];
            S[q][r] = sqr + s * (spr - tau * sqr);
            S[r][q] = S[q][r];
          }
        }

        for (let r = 0; r < n; r++) {
          const vpr = V[r][p];
          const vqr = V[r][q];
          V[r][p] = vpr - s * (vqr + tau * vpr);
          V[r][q] = vqr + s * (vpr - tau * vqr);
        }
      }
    }
  }

  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => S[b][b] - S[a][a]);

  const eigenvalues = indices.map((i) => S[i][i]);
  const eigenvectors: number[][] = [];
  for (let k = 0; k < n; k++) {
    const colIdx = indices[k];
    const vec: number[] = [];
    for (let r = 0; r < n; r++) {
      vec.push(V[r][colIdx]);
    }
    let norm = Math.hypot(...vec);
    if (norm < 1e-12) norm = 1;
    eigenvectors.push(vec.map((x) => x / norm));
  }

  return { eigenvalues, eigenvectors };
}

// ============================================================================
// 3. BENCHMARK DATASET GENERATORS
// ============================================================================

/**
 * Color mapper generating smooth perceptual gradient from normalized t in [0, 1].
 */
export function getManifoldColor(t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const hue = 260 - clampedT * 260; // Blue/Violet (260) -> Cyan -> Green -> Yellow -> Red (0)
  return `hsl(${Math.round(hue)}, 88%, 60%)`;
}

/**
 * 1. Swiss Roll with continuous color gradient along unwrapped manifold parameter.
 */
export function generateSwissRoll(
  N: number,
  noise: number,
  rng: () => number = Math.random,
): { points: Point3D[]; colors: string[]; labels: number[] } {
  const points: Point3D[] = [];
  const colors: string[] = [];
  const labels: number[] = [];

  for (let i = 0; i < N; i++) {
    const u1 = rng();
    const t = 1.5 * Math.PI * (1 + 2 * u1); // t in [1.5*pi, 4.5*pi]
    const h = (rng() - 0.5) * 20; // Height in [-10, 10]
    const nx = sampleNormal(rng, 0, noise);
    const ny = sampleNormal(rng, 0, noise);
    const nz = sampleNormal(rng, 0, noise);

    const x = t * Math.cos(t) + nx;
    const y = h + ny;
    const z = t * Math.sin(t) + nz;

    points.push([x, y, z]);
    const normalizedT = (t - 1.5 * Math.PI) / (3.0 * Math.PI);
    colors.push(getManifoldColor(normalizedT));
    labels.push(Math.floor(normalizedT * 5));
  }
  return { points, colors, labels };
}

/**
 * 2. Concentric Spheres: Inner sphere (R=1.0) and Outer sphere (R=2.8).
 */
export function generateConcentricSpheres(
  N: number,
  noise: number,
  rng: () => number = Math.random,
): { points: Point3D[]; colors: string[]; labels: number[] } {
  const points: Point3D[] = [];
  const colors: string[] = [];
  const labels: number[] = [];

  const nInner = Math.floor(N / 2);
  const nOuter = N - nInner;

  // Inner sphere
  for (let i = 0; i < nInner; i++) {
    const u = rng() * 2 - 1;
    const theta = rng() * 2 * Math.PI;
    const phi = Math.asin(Math.max(-1, Math.min(1, u)));
    const r = 1.0 + sampleNormal(rng, 0, noise * 0.2);

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.cos(phi) * Math.sin(theta);
    const z = r * Math.sin(phi);

    points.push([x, y, z]);
    colors.push("hsl(190, 95%, 55%)"); // Cyan
    labels.push(0);
  }

  // Outer sphere
  for (let i = 0; i < nOuter; i++) {
    const u = rng() * 2 - 1;
    const theta = rng() * 2 * Math.PI;
    const phi = Math.asin(Math.max(-1, Math.min(1, u)));
    const r = 2.8 + sampleNormal(rng, 0, noise * 0.2);

    const x = r * Math.cos(phi) * Math.cos(theta);
    const y = r * Math.cos(phi) * Math.sin(theta);
    const z = r * Math.sin(phi);

    points.push([x, y, z]);
    colors.push("hsl(340, 95%, 60%)"); // Magenta / Crimson
    labels.push(1);
  }

  return { points, colors, labels };
}

/**
 * 3. Severed Sphere / Open Horseshoe Shell.
 */
export function generateSeveredSphere(
  N: number,
  noise: number,
  rng: () => number = Math.random,
): { points: Point3D[]; colors: string[]; labels: number[] } {
  const points: Point3D[] = [];
  const colors: string[] = [];
  const labels: number[] = [];

  for (let i = 0; i < N; i++) {
    const u = 0.2 * Math.PI + rng() * 0.65 * Math.PI; // Polar angle u in [0.2pi, 0.85pi]
    const v = rng() * 1.85 * Math.PI; // Azimuth angle v in [0, 1.85pi] (open shell slit)
    const r = 2.0 + sampleNormal(rng, 0, noise * 0.2);

    const x = r * Math.sin(u) * Math.cos(v);
    const y = r * Math.sin(u) * Math.sin(v);
    const z = r * Math.cos(u) + sampleNormal(rng, 0, noise * 0.2);

    points.push([x, y, z]);
    const normV = v / (1.85 * Math.PI);
    colors.push(getManifoldColor(normV));
    labels.push(Math.floor(normV * 4));
  }
  return { points, colors, labels };
}

/**
 * 4. Twin Peaks / Gaussian Clusters Surface.
 */
export function generateTwinPeaks(
  N: number,
  noise: number,
  rng: () => number = Math.random,
): { points: Point3D[]; colors: string[]; labels: number[] } {
  const points: Point3D[] = [];
  const colors: string[] = [];
  const labels: number[] = [];

  for (let i = 0; i < N; i++) {
    const x = (rng() - 0.5) * 6;
    const y = (rng() - 0.5) * 6;
    const peak1 = 3.0 * Math.exp(-((x - 1.5) ** 2 + (y - 1.5) ** 2) / 2.0);
    const peak2 = 2.5 * Math.exp(-((x + 1.5) ** 2 + (y + 1.5) ** 2) / 2.0);
    const z = peak1 - peak2 + sampleNormal(rng, 0, noise * 0.25);

    points.push([x, y, z]);
    const normZ = (z + 2.5) / 5.5;
    colors.push(getManifoldColor(normZ));
    labels.push(z > 0.5 ? 1 : z < -0.5 ? 2 : 0);
  }
  return { points, colors, labels };
}

/**
 * 5. Trefoil Knot / Torus Helix in 3D.
 */
export function generateTrefoilKnot(
  N: number,
  noise: number,
  rng: () => number = Math.random,
): { points: Point3D[]; colors: string[]; labels: number[] } {
  const points: Point3D[] = [];
  const colors: string[] = [];
  const labels: number[] = [];

  for (let i = 0; i < N; i++) {
    const t = rng() * 2 * Math.PI;
    // Core curve of Trefoil knot
    const cx = Math.sin(t) + 2 * Math.sin(2 * t);
    const cy = Math.cos(t) - 2 * Math.cos(2 * t);
    const cz = -Math.sin(3 * t);

    // Tangent approximation
    const dt = 1e-4;
    const tx = Math.sin(t + dt) + 2 * Math.sin(2 * (t + dt)) - cx;
    const ty = Math.cos(t + dt) - 2 * Math.cos(2 * (t + dt)) - cy;
    const tz = -Math.sin(3 * (t + dt)) - cz;
    let tNorm = Math.hypot(tx, ty, tz);
    if (tNorm < 1e-6) tNorm = 1;

    // Normal and binormal
    const nx = -ty / tNorm;
    const ny = tx / tNorm;
    const nz = 0;

    const bx = ty * nz - tz * ny;
    const by = tz * nx - tx * nz;
    const bz = tx * ny - ty * nx;
    let bNorm = Math.hypot(bx, by, bz);
    if (bNorm < 1e-6) bNorm = 1;

    const psi = rng() * 2 * Math.PI;
    const tubeRadius = 0.35 + sampleNormal(rng, 0, noise * 0.1);

    const px = cx + tubeRadius * (Math.cos(psi) * nx + Math.sin(psi) * (bx / bNorm));
    const py = cy + tubeRadius * (Math.cos(psi) * ny + Math.sin(psi) * (by / bNorm));
    const pz = cz + tubeRadius * (Math.cos(psi) * nz + Math.sin(psi) * (bz / bNorm));

    points.push([px, py, pz]);
    const normT = t / (2 * Math.PI);
    colors.push(getManifoldColor(normT));
    labels.push(Math.floor(normT * 6));
  }
  return { points, colors, labels };
}

/**
 * 6. Interlocking Rings (Hopf Link).
 */
export function generateInterlockingRings(
  N: number,
  noise: number,
  rng: () => number = Math.random,
): { points: Point3D[]; colors: string[]; labels: number[] } {
  const points: Point3D[] = [];
  const colors: string[] = [];
  const labels: number[] = [];

  const nRing1 = Math.floor(N / 2);
  const nRing2 = N - nRing1;

  // Ring 1 in XY plane centered at (-0.75, 0, 0)
  for (let i = 0; i < nRing1; i++) {
    const t = rng() * 2 * Math.PI;
    const psi = rng() * 2 * Math.PI;
    const R = 1.6;
    const r = 0.25 + sampleNormal(rng, 0, noise * 0.1);

    const x = -0.75 + (R + r * Math.cos(psi)) * Math.cos(t);
    const y = (R + r * Math.cos(psi)) * Math.sin(t);
    const z = r * Math.sin(psi);

    points.push([x, y, z]);
    colors.push(`hsl(${Math.round(200 + (t / (2 * Math.PI)) * 80)}, 90%, 60%)`);
    labels.push(0);
  }

  // Ring 2 in YZ plane centered at (0.75, 0, 0) threading through Ring 1
  for (let i = 0; i < nRing2; i++) {
    const t = rng() * 2 * Math.PI;
    const psi = rng() * 2 * Math.PI;
    const R = 1.6;
    const r = 0.25 + sampleNormal(rng, 0, noise * 0.1);

    const x = 0.75 + r * Math.sin(psi);
    const y = (R + r * Math.cos(psi)) * Math.cos(t);
    const z = (R + r * Math.cos(psi)) * Math.sin(t);

    points.push([x, y, z]);
    colors.push(`hsl(${Math.round(20 + (t / (2 * Math.PI)) * 60)}, 95%, 58%)`);
    labels.push(1);
  }

  return { points, colors, labels };
}

/**
 * Universal Dataset Dispatcher.
 */
export function generateManifoldDataset(
  id: ManifoldDatasetId,
  N = 200,
  noise = 0.05,
  seed = 42,
): GeneratedDataset {
  const rng = createDeterministicRng(seed);
  let res: { points: Point3D[]; colors: string[]; labels: number[] };

  switch (id) {
    case "swiss_roll":
      res = generateSwissRoll(N, noise, rng);
      break;
    case "concentric_spheres":
      res = generateConcentricSpheres(N, noise, rng);
      break;
    case "severed_sphere":
      res = generateSeveredSphere(N, noise, rng);
      break;
    case "twin_peaks":
      res = generateTwinPeaks(N, noise, rng);
      break;
    case "trefoil_knot":
      res = generateTrefoilKnot(N, noise, rng);
      break;
    case "interlocking_rings":
      res = generateInterlockingRings(N, noise, rng);
      break;
    default:
      res = generateSwissRoll(N, noise, rng);
  }

  return {
    id,
    points: res.points,
    colors: res.colors,
    labels: res.labels,
    parameters: { N, noise, seed },
  };
}

// ============================================================================
// 4. DIMENSIONALITY REDUCTION ALGORITHMS
// ============================================================================

/**
 * PCA: Linear projection via sample covariance matrix eigendecomposition.
 */
export function computePCA(X: Point3D[]): PCAResult {
  const n = X.length;
  if (n === 0) {
    return {
      embedding: [],
      eigenvalues: [0, 0, 0],
      eigenvectors: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      explainedVarianceRatio: [0, 0],
      totalExplainedVariance: 0,
    };
  }

  // 1. Mean vector
  const mean: Point3D = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    mean[0] += X[i][0];
    mean[1] += X[i][1];
    mean[2] += X[i][2];
  }
  mean[0] /= n;
  mean[1] /= n;
  mean[2] /= n;

  // 2. Centered data
  const Xc: Point3D[] = X.map((p) => [p[0] - mean[0], p[1] - mean[1], p[2] - mean[2]]);

  // 3. Covariance matrix (3x3)
  const cov: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const denom = Math.max(1, n - 1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 3; k++) {
        cov[j][k] += (Xc[i][j] * Xc[i][k]) / denom;
      }
    }
  }

  // 4. Eigendecomposition of 3x3 covariance matrix
  const { eigenvalues, eigenvectors } = computeSymmetricEigenvaluesAndVectors(cov);

  const ev1 = eigenvectors[0] as Point3D;
  const ev2 = eigenvectors[1] as Point3D;

  // 5. 2D linear projection
  const embedding: Point2D[] = Xc.map((p) => {
    const y1 = p[0] * ev1[0] + p[1] * ev1[1] + p[2] * ev1[2];
    const y2 = p[0] * ev2[0] + p[1] * ev2[1] + p[2] * ev2[2];
    return [y1, y2];
  });

  const totalVar = Math.max(1e-12, eigenvalues[0] + eigenvalues[1] + (eigenvalues[2] || 0));
  const r1 = Math.max(0, eigenvalues[0]) / totalVar;
  const r2 = Math.max(0, eigenvalues[1]) / totalVar;

  return {
    embedding,
    eigenvalues,
    eigenvectors: eigenvectors as Point3D[],
    explainedVarianceRatio: [r1, r2],
    totalExplainedVariance: r1 + r2,
  };
}

/**
 * t-SNE: Binary search for per-point precision $\beta_i = 1 / (2\sigma_i^2)$ matching target Perplexity.
 */
export function computeTSNEPerplexitySigma(
  distancesSq: number[][],
  targetPerplexity: number,
  tol = 1e-5,
  maxIter = 60,
): { sigmas: number[]; conditionalP: number[][] } {
  const n = distancesSq.length;
  const sigmas: number[] = new Array(n).fill(1.0);
  const conditionalP: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const targetEntropy = Math.log2(Math.max(1.01, Math.min(n - 1, targetPerplexity)));

  for (let i = 0; i < n; i++) {
    let betaMin = -Infinity;
    let betaMax = Infinity;
    let beta = 1.0;

    const pRow = new Array(n).fill(0);
    let entropy = 0;

    for (let iter = 0; iter < maxIter; iter++) {
      let sumP = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) {
          pRow[j] = 0;
        } else {
          const val = Math.exp(-beta * distancesSq[i][j]);
          pRow[j] = val;
          sumP += val;
        }
      }

      if (sumP < 1e-15) {
        sumP = 1e-15;
      }

      let sumD2P = 0;
      for (let j = 0; j < n; j++) {
        pRow[j] /= sumP;
        if (i !== j) {
          sumD2P += distancesSq[i][j] * pRow[j];
        }
      }

      // Shannon entropy in bits
      entropy = (beta * sumD2P) / Math.LN2 + Math.log2(sumP);
      const entropyDiff = entropy - targetEntropy;

      if (Math.abs(entropyDiff) < tol) {
        break;
      }

      if (entropyDiff > 0) {
        // Entropy too high -> beta should increase
        betaMin = beta;
        if (Number.isFinite(betaMax)) {
          beta = (beta + betaMax) / 2.0;
        } else {
          beta *= 2.0;
        }
      } else {
        // Entropy too low -> beta should decrease
        betaMax = beta;
        if (Number.isFinite(betaMin)) {
          beta = (beta + betaMin) / 2.0;
        } else {
          beta /= 2.0;
        }
      }
    }

    sigmas[i] = 1.0 / Math.sqrt(Math.max(1e-12, 2 * beta));
    conditionalP[i] = pRow;
  }

  return { sigmas, conditionalP };
}

/**
 * t-SNE: Symmetrize high-dimensional conditional probabilities $p_{ij} = (p_{j|i} + p_{i|j}) / (2N)$.
 */
export function computeTSNESymmetrizedP(conditionalP: number[][]): number[][] {
  const n = conditionalP.length;
  const P: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let totalSum = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const pVal = (conditionalP[i][j] + conditionalP[j][i]) / (2 * n);
      P[i][j] = pVal;
      P[j][i] = pVal;
      totalSum += 2 * pVal;
    }
  }

  // Normalize and apply minimum probability floor
  const minP = 1e-12 / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        P[i][j] = 0;
      } else {
        P[i][j] = Math.max(minP, P[i][j] / Math.max(1e-15, totalSum));
      }
    }
  }

  return P;
}

/**
 * t-SNE: Student-t low-dimensional distribution $q_{ij} = (1 + \|y_i - y_j\|^2)^{-1} / \sum (1 + \|y_k - y_l\|^2)^{-1}$.
 */
export function computeTSNEStudentTDist(Y: Point2D[]): {
  Q: number[][];
  sumQ: number;
  invDistSq: number[][];
} {
  const n = Y.length;
  const invDistSq: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const Q: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  let sumQ = 0;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = Y[i][0] - Y[j][0];
      const dy = Y[i][1] - Y[j][1];
      const dSq = dx * dx + dy * dy;
      const w = 1.0 / (1.0 + dSq);
      invDistSq[i][j] = w;
      invDistSq[j][i] = w;
      sumQ += 2.0 * w;
    }
  }

  const safeSumQ = Math.max(1e-15, sumQ);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        Q[i][j] = 0;
      } else {
        Q[i][j] = Math.max(1e-15, invDistSq[i][j] / safeSumQ);
      }
    }
  }

  return { Q, sumQ, invDistSq };
}

/**
 * t-SNE: Exact analytical KL gradient with early exaggeration factor $\alpha$.
 * $\nabla_{y_i} \mathcal{L} = 4 \sum_{j \neq i} (\alpha p_{ij} - q_{ij}) (y_i - y_j) w_{ij}$
 */
export function computeTSNEGradient(
  P: number[][],
  Q: number[][],
  invDistSq: number[][],
  Y: Point2D[],
  earlyExaggeration = 1.0,
): Point2D[] {
  const n = Y.length;
  const grad: Point2D[] = Array.from({ length: n }, () => [0, 0]);

  for (let i = 0; i < n; i++) {
    let gx = 0;
    let gy = 0;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const mult = 4.0 * (earlyExaggeration * P[i][j] - Q[i][j]) * invDistSq[i][j];
      gx += mult * (Y[i][0] - Y[j][0]);
      gy += mult * (Y[i][1] - Y[j][1]);
    }
    grad[i] = [gx, gy];
  }
  return grad;
}

/**
 * t-SNE: Exact Kullback-Leibler divergence loss $\mathcal{L}_{KL}(P || Q) = \sum p_{ij} \ln(p_{ij} / q_{ij})$.
 */
export function computeTSNEKLLoss(P: number[][], Q: number[][]): number {
  const n = P.length;
  let loss = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const p = Math.max(1e-15, P[i][j]);
      const q = Math.max(1e-15, Q[i][j]);
      loss += p * Math.log(p / q);
    }
  }
  return Math.max(0, loss);
}

/**
 * t-SNE: Single optimization step with momentum and embedding centering.
 */
export function stepTSNE(
  Y: Point2D[],
  velocities: Point2D[],
  P: number[][],
  lr: number,
  momentum: number,
  earlyExaggeration = 1.0,
): { nextY: Point2D[]; nextVelocities: Point2D[]; loss: number; gradNorm: number } {
  const n = Y.length;
  const { Q, invDistSq } = computeTSNEStudentTDist(Y);
  const grad = computeTSNEGradient(P, Q, invDistSq, Y, earlyExaggeration);
  const loss = computeTSNEKLLoss(P, Q);

  const nextY: Point2D[] = new Array(n);
  const nextVelocities: Point2D[] = new Array(n);

  let meanX = 0;
  let meanY = 0;
  let totalGradSq = 0;

  for (let i = 0; i < n; i++) {
    const vx = momentum * (velocities[i]?.[0] || 0) - lr * grad[i][0];
    const vy = momentum * (velocities[i]?.[1] || 0) - lr * grad[i][1];
    nextVelocities[i] = [vx, vy];

    const nx = Y[i][0] + vx;
    const ny = Y[i][1] + vy;
    nextY[i] = [nx, ny];

    meanX += nx;
    meanY += ny;
    totalGradSq += grad[i][0] * grad[i][0] + grad[i][1] * grad[i][1];
  }

  // Zero-mean centering of embedding
  meanX /= n;
  meanY /= n;
  for (let i = 0; i < n; i++) {
    nextY[i][0] -= meanX;
    nextY[i][1] -= meanY;
  }

  const gradNorm = Math.sqrt(totalGradSq / n);
  return { nextY, nextVelocities, loss, gradNorm };
}

/**
 * UMAP: Binary search for local metric scaling $\sigma_i$ satisfying $\sum \exp(-\max(0, d - \rho_i)/\sigma_i) = \log_2(k)$.
 */
export function computeUMAPLocalMetrics(
  distances: number[][],
  k: number,
  tol = 1e-5,
  maxIter = 60,
): { sigmas: number[]; rhos: number[]; conditionalP: number[][] } {
  const n = distances.length;
  const sigmas: number[] = new Array(n).fill(1.0);
  const rhos: number[] = new Array(n).fill(0.0);
  const conditionalP: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const target = Math.log2(Math.max(2, Math.min(n, k)));

  for (let i = 0; i < n; i++) {
    // 1. Local metric rho_i is distance to nearest non-identical neighbor
    let minD = Infinity;
    for (let j = 0; j < n; j++) {
      if (i !== j && distances[i][j] < minD && distances[i][j] > 1e-10) {
        minD = distances[i][j];
      }
    }
    if (!Number.isFinite(minD)) minD = 1e-4;
    rhos[i] = minD;

    // 2. Binary search for sigma_i
    let sigmaMin = 0.0;
    let sigmaMax = Infinity;
    let sigma = 1.0;

    for (let iter = 0; iter < maxIter; iter++) {
      let sumExp = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const dVal = distances[i][j] - rhos[i];
          sumExp += Math.exp(-Math.max(0, dVal) / sigma);
        }
      }

      const diff = sumExp - target;
      if (Math.abs(diff) < tol) {
        break;
      }

      if (diff > 0) {
        // sum is too large -> sigma should decrease
        sigmaMax = sigma;
        sigma = (sigmaMin + sigma) / 2.0;
      } else {
        // sum is too small -> sigma should increase
        sigmaMin = sigma;
        if (Number.isFinite(sigmaMax)) {
          sigma = (sigma + sigmaMax) / 2.0;
        } else {
          sigma *= 2.0;
        }
      }
    }

    sigmas[i] = Math.max(1e-4, sigma);

    for (let j = 0; j < n; j++) {
      if (i === j) {
        conditionalP[i][j] = 0;
      } else {
        const dVal = distances[i][j] - rhos[i];
        conditionalP[i][j] = Math.exp(-Math.max(0, dVal) / sigmas[i]);
      }
    }
  }

  return { sigmas, rhos, conditionalP };
}

/**
 * UMAP: Symmetrized fuzzy union $v_{ij} = p_{j|i} + p_{i|j} - p_{j|i} p_{i|j}$.
 */
export function computeUMAPFuzzyUnion(conditionalP: number[][]): number[][] {
  const n = conditionalP.length;
  const V: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const p1 = conditionalP[i][j];
      const p2 = conditionalP[j][i];
      const union = p1 + p2 - p1 * p2;
      V[i][j] = union;
      V[j][i] = union;
    }
  }
  return V;
}

/**
 * UMAP: Fit parameters $a, b$ for smooth low-dimensional curve $\Psi(d) = 1 / (1 + a d^{2b})$.
 */
export function findUMAPABParams(spread = 1.0, minDist = 0.1): { a: number; b: number } {
  // Analytical approximation for standard UMAP smooth embedding curve
  const clampedMinDist = Math.max(0.001, Math.min(1.0, minDist));
  const clampedSpread = Math.max(0.1, Math.min(3.0, spread));

  // Non-linear least squares fit approximation
  const b = 0.895061 / Math.pow(clampedMinDist / 0.1, 0.12);
  const a = (1.576943 * Math.pow(clampedSpread, 2.0)) / Math.pow(clampedMinDist / 0.1, 0.85);

  return {
    a: Math.max(0.1, Math.min(20.0, a)),
    b: Math.max(0.2, Math.min(3.0, b)),
  };
}

/**
 * UMAP: Cross-entropy loss and attractive / repulsive force gradients.
 */
export function computeUMAPGradient(
  V: number[][],
  Y: Point2D[],
  a: number,
  b: number,
): { grad: Point2D[]; loss: number } {
  const n = Y.length;
  const grad: Point2D[] = Array.from({ length: n }, () => [0, 0]);
  let loss = 0;

  for (let i = 0; i < n; i++) {
    let gx = 0;
    let gy = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = Y[i][0] - Y[j][0];
      const dy = Y[i][1] - Y[j][1];
      const dSq = dx * dx + dy * dy;
      const d = Math.sqrt(Math.max(1e-12, dSq));

      const v = V[i][j];
      const powTerm = Math.pow(d, 2 * b);
      const q = 1.0 / (1.0 + a * powTerm);

      // Cross entropy loss
      if (v > 1e-10) {
        loss += v * Math.log(Math.max(1e-12, v) / Math.max(1e-12, q));
      }
      if (1 - v > 1e-10) {
        loss += (1 - v) * Math.log(Math.max(1e-12, 1 - v) / Math.max(1e-12, 1 - q));
      }

      // Attractive force
      let gradFactor = 0;
      if (v > 1e-8) {
        const attr = (-2.0 * b * a * Math.pow(d, 2 * (b - 1))) / (1.0 + a * powTerm);
        gradFactor += v * attr;
      }

      // Repulsive force
      if (1 - v > 1e-8) {
        const rep = (2.0 * b) / ((0.001 + dSq) * (1.0 + a * powTerm));
        gradFactor += (1.0 - v) * rep;
      }

      gx += gradFactor * dx;
      gy += gradFactor * dy;
    }

    // Gradient clipping
    const gNorm = Math.hypot(gx, gy);
    if (gNorm > 4.0) {
      gx = (gx / gNorm) * 4.0;
      gy = (gy / gNorm) * 4.0;
    }

    grad[i] = [gx, gy];
  }

  return { grad, loss: loss / (n * n) };
}

/**
 * UMAP: Single optimization step.
 */
export function stepUMAP(
  Y: Point2D[],
  velocities: Point2D[],
  V: number[][],
  a: number,
  b: number,
  lr: number,
  momentum: number,
): { nextY: Point2D[]; nextVelocities: Point2D[]; loss: number } {
  const n = Y.length;
  const { grad, loss } = computeUMAPGradient(V, Y, a, b);

  const nextY: Point2D[] = new Array(n);
  const nextVelocities: Point2D[] = new Array(n);

  let meanX = 0;
  let meanY = 0;

  for (let i = 0; i < n; i++) {
    const vx = momentum * (velocities[i]?.[0] || 0) - lr * grad[i][0];
    const vy = momentum * (velocities[i]?.[1] || 0) - lr * grad[i][1];
    nextVelocities[i] = [vx, vy];

    const nx = Y[i][0] + vx;
    const ny = Y[i][1] + vy;
    nextY[i] = [nx, ny];

    meanX += nx;
    meanY += ny;
  }

  // Centering
  meanX /= n;
  meanY /= n;
  for (let i = 0; i < n; i++) {
    nextY[i][0] -= meanX;
    nextY[i][1] -= meanY;
  }

  return { nextY, nextVelocities, loss };
}

/**
 * Build undirected k-Nearest Neighbor graph from distance matrix.
 */
export function buildKNNGraph(
  distances: number[][],
  k: number,
): { adj: { node: number; weight: number }[][] } {
  const n = distances.length;
  const adj: { node: number; weight: number }[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    const neighbors: { node: number; dist: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        neighbors.push({ node: j, dist: distances[i][j] });
      }
    }
    neighbors.sort((a, b) => a.dist - b.dist);
    const kNeighbors = neighbors.slice(0, Math.max(1, Math.min(n - 1, k)));

    for (const nb of kNeighbors) {
      if (!adj[i].some((e) => e.node === nb.node)) {
        adj[i].push({ node: nb.node, weight: nb.dist });
      }
      if (!adj[nb.node].some((e) => e.node === i)) {
        adj[nb.node].push({ node: i, weight: nb.dist });
      }
    }
  }

  return { adj };
}

/**
 * All-pairs shortest path computation via Dijkstra on k-NN graph.
 */
export function computeAllPairsShortestPathsDijkstra(
  adj: { node: number; weight: number }[][],
  n: number,
): { geodesicDistances: number[][]; disconnectedCount: number } {
  const D: number[][] = Array.from({ length: n }, () => new Array(n).fill(Infinity));

  for (let src = 0; src < n; src++) {
    const dist = new Array(n).fill(Infinity);
    const visited = new Array(n).fill(false);
    dist[src] = 0;

    for (let iter = 0; iter < n; iter++) {
      let u = -1;
      let minD = Infinity;
      for (let i = 0; i < n; i++) {
        if (!visited[i] && dist[i] < minD) {
          minD = dist[i];
          u = i;
        }
      }

      if (u === -1 || minD === Infinity) break;
      visited[u] = true;

      for (const edge of adj[u]) {
        if (!visited[edge.node]) {
          const alt = dist[u] + edge.weight;
          if (alt < dist[edge.node]) {
            dist[edge.node] = alt;
          }
        }
      }
    }

    for (let j = 0; j < n; j++) {
      D[src][j] = dist[j];
    }
  }

  // Handle disconnected components
  let maxFinite = 0;
  let disconnectedCount = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Number.isFinite(D[i][j])) {
        if (D[i][j] > maxFinite) maxFinite = D[i][j];
      } else {
        disconnectedCount++;
      }
    }
  }

  if (maxFinite === 0) maxFinite = 1.0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!Number.isFinite(D[i][j])) {
        D[i][j] = maxFinite * 2.5;
      }
    }
  }

  return { geodesicDistances: D, disconnectedCount };
}

/**
 * Classical Multidimensional Scaling (MDS) on arbitrary distance matrix.
 * Gram matrix double-centering $B = -0.5 \cdot H S H$.
 */
export function classicalMDS(D: number[][], _targetDim = 2): MDSResult {
  const n = D.length;
  if (n === 0) return { embedding: [], eigenvalues: [], stress: 0 };

  // 1. Squared distances S_ij = D_ij^2
  const S: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const rowMeans = new Array(n).fill(0);
  let totalMean = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const sq = D[i][j] * D[i][j];
      S[i][j] = sq;
      rowMeans[i] += sq;
      totalMean += sq;
    }
    rowMeans[i] /= n;
  }
  totalMean /= n * n;

  // 2. Double-centering Gram matrix B
  const B: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      B[i][j] = -0.5 * (S[i][j] - rowMeans[i] - rowMeans[j] + totalMean);
    }
  }

  // 3. Eigendecomposition of B
  const { eigenvalues, eigenvectors } = computeSymmetricEigenvaluesAndVectors(B);

  // 4. Construct 2D embedding
  const lambda1 = Math.max(0, eigenvalues[0] || 0);
  const lambda2 = Math.max(0, eigenvalues[1] || 0);
  const scale1 = Math.sqrt(lambda1);
  const scale2 = Math.sqrt(lambda2);

  const ev1 = eigenvectors[0] || new Array(n).fill(0);
  const ev2 = eigenvectors[1] || new Array(n).fill(0);

  const embedding: Point2D[] = Array.from({ length: n }, (_, i) => [
    scale1 * ev1[i],
    scale2 * ev2[i],
  ]);

  // 5. Stress metric calculation
  let sumDiffSq = 0;
  let sumOrigSq = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = embedding[i][0] - embedding[j][0];
      const dy = embedding[i][1] - embedding[j][1];
      const embedDist = Math.hypot(dx, dy);
      const origDist = D[i][j];
      sumDiffSq += (origDist - embedDist) ** 2;
      sumOrigSq += origDist ** 2;
    }
  }

  const stress = Math.sqrt(sumDiffSq / Math.max(1e-12, sumOrigSq));
  return { embedding, eigenvalues, stress };
}

/**
 * Isomap: Dijkstra Geodesic Distances + Classical MDS.
 */
export function computeIsomap(X: Point3D[], kNeighbors = 12): IsomapResult {
  const n = X.length;
  const highDist = computePairwiseDistances(X);
  const { adj } = buildKNNGraph(highDist, kNeighbors);
  const { geodesicDistances, disconnectedCount } = computeAllPairsShortestPathsDijkstra(adj, n);
  const mdsRes = classicalMDS(geodesicDistances, 2);

  return {
    embedding: mdsRes.embedding,
    eigenvalues: mdsRes.eigenvalues,
    geodesicDistances,
    disconnectedCount,
    stress: mdsRes.stress,
  };
}

// ============================================================================
// 5. TELEMETRY & DIAGNOSTIC METRICS
// ============================================================================

/**
 * Trustworthiness Metric $T(k) \in [0, 1]$: Penalizes false neighbor intrusions in low-D space.
 * $T(k) = 1 - \frac{2}{N k (2N - 3k - 1)} \sum_{i=1}^N \sum_{j \in U_i^{(k)}} (r(i, j) - k)$
 */
export function computeTrustworthiness(
  highDist: number[][],
  lowDist: number[][],
  k: number,
): number {
  const n = highDist.length;
  if (n <= k + 1) return 1.0;

  const denom = n * k * (2 * n - 3 * k - 1);
  if (denom <= 0) return 1.0;

  let penaltySum = 0;

  for (let i = 0; i < n; i++) {
    // 1. High-D ranks: 1-indexed rank of each point from point i
    const highOrder: { idx: number; dist: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        highOrder.push({ idx: j, dist: highDist[i][j] });
      }
    }
    highOrder.sort((a, b) => a.dist - b.dist);

    const highRankMap = new Map<number, number>();
    const highKSet = new Set<number>();
    for (let rank = 0; rank < highOrder.length; rank++) {
      const idx = highOrder[rank].idx;
      highRankMap.set(idx, rank + 1); // 1-based rank
      if (rank < k) {
        highKSet.add(idx);
      }
    }

    // 2. Low-D k-nearest neighbors
    const lowOrder: { idx: number; dist: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        lowOrder.push({ idx: j, dist: lowDist[i][j] });
      }
    }
    lowOrder.sort((a, b) => a.dist - b.dist);

    for (let r = 0; r < k; r++) {
      const j = lowOrder[r].idx;
      if (!highKSet.has(j)) {
        const highRank = highRankMap.get(j) || n;
        penaltySum += highRank - k;
      }
    }
  }

  const T = 1.0 - (2.0 * penaltySum) / denom;
  return Math.max(0.0, Math.min(1.0, T));
}

/**
 * Continuity Metric $C(k) \in [0, 1]$: Penalizes missing neighbors that were close in high-D space.
 * $C(k) = 1 - \frac{2}{N k (2N - 3k - 1)} \sum_{i=1}^N \sum_{j \in V_i^{(k)}} (\hat{r}(i, j) - k)$
 */
export function computeContinuity(highDist: number[][], lowDist: number[][], k: number): number {
  const n = highDist.length;
  if (n <= k + 1) return 1.0;

  const denom = n * k * (2 * n - 3 * k - 1);
  if (denom <= 0) return 1.0;

  let penaltySum = 0;

  for (let i = 0; i < n; i++) {
    // 1. Low-D ranks
    const lowOrder: { idx: number; dist: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        lowOrder.push({ idx: j, dist: lowDist[i][j] });
      }
    }
    lowOrder.sort((a, b) => a.dist - b.dist);

    const lowRankMap = new Map<number, number>();
    const lowKSet = new Set<number>();
    for (let rank = 0; rank < lowOrder.length; rank++) {
      const idx = lowOrder[rank].idx;
      lowRankMap.set(idx, rank + 1);
      if (rank < k) {
        lowKSet.add(idx);
      }
    }

    // 2. High-D k-nearest neighbors
    const highOrder: { idx: number; dist: number }[] = [];
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        highOrder.push({ idx: j, dist: highDist[i][j] });
      }
    }
    highOrder.sort((a, b) => a.dist - b.dist);

    for (let r = 0; r < k; r++) {
      const j = highOrder[r].idx;
      if (!lowKSet.has(j)) {
        const lowRank = lowRankMap.get(j) || n;
        penaltySum += lowRank - k;
      }
    }
  }

  const C = 1.0 - (2.0 * penaltySum) / denom;
  return Math.max(0.0, Math.min(1.0, C));
}

/**
 * Neighborhood Preservation Ratio (NPR) @ k: Fraction of k-nearest neighbors shared in high-D and low-D.
 */
export function computeNeighborhoodPreservationRatio(
  highDist: number[][],
  lowDist: number[][],
  k: number,
): number {
  const n = highDist.length;
  if (n <= 1) return 1.0;
  const effectiveK = Math.max(1, Math.min(n - 1, k));

  let totalOverlap = 0;

  for (let i = 0; i < n; i++) {
    const highOrder: { idx: number; dist: number }[] = [];
    const lowOrder: { idx: number; dist: number }[] = [];

    for (let j = 0; j < n; j++) {
      if (i !== j) {
        highOrder.push({ idx: j, dist: highDist[i][j] });
        lowOrder.push({ idx: j, dist: lowDist[i][j] });
      }
    }

    highOrder.sort((a, b) => a.dist - b.dist);
    lowOrder.sort((a, b) => a.dist - b.dist);

    const highSet = new Set(highOrder.slice(0, effectiveK).map((x) => x.idx));
    let matchCount = 0;
    for (let r = 0; r < effectiveK; r++) {
      if (highSet.has(lowOrder[r].idx)) {
        matchCount++;
      }
    }
    totalOverlap += matchCount / effectiveK;
  }

  return Math.max(0.0, Math.min(1.0, totalOverlap / n));
}

/**
 * Compute all diagnostic metrics for an embedding.
 */
export function computeManifoldDiagnostics(
  highDist: number[][],
  embedding: Point2D[],
  k: number,
  stressOrLoss = 0,
  extra: Partial<ManifoldDiagnostics> = {},
): ManifoldDiagnostics {
  const lowDist = computePairwiseDistances(embedding);
  const trustworthiness = computeTrustworthiness(highDist, lowDist, k);
  const continuity = computeContinuity(highDist, lowDist, k);
  const neighborhoodPreservation = computeNeighborhoodPreservationRatio(highDist, lowDist, k);

  return {
    trustworthiness,
    continuity,
    neighborhoodPreservation,
    stressOrLoss,
    metricK: k,
    computationTimeMs: extra.computationTimeMs || 0,
    explainedVarianceRatio: extra.explainedVarianceRatio,
    totalExplainedVariance: extra.totalExplainedVariance,
    geodesicDisconnections: extra.geodesicDisconnections,
  };
}

// ============================================================================
// 6. METADATA & PRESETS CONFIGURATIONS
// ============================================================================

export const MANIFOLD_DATASETS: Record<ManifoldDatasetId, ManifoldDatasetMeta> = {
  swiss_roll: {
    id: "swiss_roll",
    name: "Swiss Roll 3D",
    description: "2D planar manifold rolled into a 3D Archimedean spiral with height dimension.",
    category: "Spiral Manifold",
    intrinsicDimension: 2,
    ambientDimension: 3,
    topologicalChallenge:
      "Linear PCA collapses overlapping spiral sheets; geodesic methods unroll smoothly.",
  },
  concentric_spheres: {
    id: "concentric_spheres",
    name: "Concentric Spheres",
    description: "Two nested 2D spherical shells with different radii in 3D Euclidean space.",
    category: "Nested Topological Shells",
    intrinsicDimension: 2,
    ambientDimension: 3,
    topologicalChallenge:
      "Requires non-linear cluster separation without collapsing the inner hollow shell.",
  },
  severed_sphere: {
    id: "severed_sphere",
    name: "Severed Sphere (Horseshoe)",
    description: "Hemispherical shell with polar puncture and longitudinal slit.",
    category: "Punctured Curved Surface",
    intrinsicDimension: 2,
    ambientDimension: 3,
    topologicalChallenge: "Tests preservation of non-convex boundaries and boundary curvature.",
  },
  twin_peaks: {
    id: "twin_peaks",
    name: "Twin Peaks Surface",
    description: "Smooth 2D landscape with positive and negative Gaussian extrema.",
    category: "Continuous Landscape",
    intrinsicDimension: 2,
    ambientDimension: 3,
    topologicalChallenge:
      "Linear subspace models preserve the continuous topological coordinate grid.",
  },
  trefoil_knot: {
    id: "trefoil_knot",
    name: "Trefoil Knot Loop",
    description: "Non-trivial 1D topological closed loop knotted in 3D space.",
    category: "Knotted 1D Loop",
    intrinsicDimension: 1,
    ambientDimension: 3,
    topologicalChallenge: "Untangling non-planar knot self-intersections in 2D projection.",
  },
  interlocking_rings: {
    id: "interlocking_rings",
    name: "Interlocking Rings (Hopf Link)",
    description: "Two mutually linked orthogonal circular tori.",
    category: "Topological Linkage",
    intrinsicDimension: 1,
    ambientDimension: 3,
    topologicalChallenge:
      "Non-separable in 3D without tearing; maps to separate disjoint rings in 2D.",
  },
};

export const DEFAULT_HYPERPARAMS: AlgorithmHyperparameters = {
  nPoints: 200,
  noise: 0.05,
  seed: 42,
  perplexity: 25,
  learningRate: 150,
  momentum: 0.8,
  earlyExaggeration: 4.0,
  earlyExaggerationIter: 50,
  umapNNeighbors: 15,
  umapMinDist: 0.1,
  umapSpread: 1.0,
  isomapKNeighbors: 12,
  metricK: 10,
};

export const MANIFOLD_PRESETS: Record<ManifoldPresetId, ManifoldPreset> = {
  swiss_roll_unroll: {
    id: "swiss_roll_unroll",
    name: "Swiss Roll Unrolling",
    description:
      "Isomap shortest-path geodesics unrolling 3D spiral into a continuous 2D rectangle.",
    datasetId: "swiss_roll",
    algorithmId: "isomap",
    params: { nPoints: 220, isomapKNeighbors: 12, noise: 0.04 },
    educationalInsight:
      "Isomap computes shortest paths along the k-NN graph, measuring intrinsic geodesic manifold distance rather than shortcut Euclidean space.",
  },
  concentric_spheres_separation: {
    id: "concentric_spheres_separation",
    name: "Concentric Shells Clustering",
    description: "t-SNE heavy-tailed Student-t repulsion separating nested concentric spheres.",
    datasetId: "concentric_spheres",
    algorithmId: "tsne",
    params: { nPoints: 220, perplexity: 30, learningRate: 180, momentum: 0.82 },
    educationalInsight:
      "t-SNE converts high-D Euclidean distances to Gaussian conditional probabilities and utilizes Student-t low-D kernels to mitigate the crowding problem.",
  },
  severed_sphere_puncture: {
    id: "severed_sphere_puncture",
    name: "Punctured Sphere Fuzzy Simplex",
    description: "UMAP local metric scaling and fuzzy simplicial sets on open curved manifold.",
    datasetId: "severed_sphere",
    algorithmId: "umap",
    params: { nPoints: 240, umapNNeighbors: 15, umapMinDist: 0.12, learningRate: 1.0 },
    educationalInsight:
      "UMAP assumes the data lies on a Riemannian manifold with locally constant metric scaling, preserving both local and global topology.",
  },
  twin_peaks_clustering: {
    id: "twin_peaks_clustering",
    name: "Twin Peaks Planar Projection",
    description: "PCA linear projection capturing principal orthogonal axes of variance.",
    datasetId: "twin_peaks",
    algorithmId: "pca",
    params: { nPoints: 240, noise: 0.05 },
    educationalInsight:
      "PCA identifies the 2 orthogonal eigenvectors with maximal eigenvalues from the 3x3 sample covariance matrix.",
  },
  trefoil_knot_untangling: {
    id: "trefoil_knot_untangling",
    name: "Trefoil Knot Loop Untangling",
    description: "t-SNE resolving non-trivial 1D topological knot into a planar ring.",
    datasetId: "trefoil_knot",
    algorithmId: "tsne",
    params: { nPoints: 240, perplexity: 20, learningRate: 200, momentum: 0.85 },
    educationalInsight:
      "Non-linear stochastic gradient descent expands overlapping loops into a continuous 2D topological circle.",
  },
  interlocking_rings_topology: {
    id: "interlocking_rings_topology",
    name: "Hopf Link Topological Separation",
    description: "UMAP separating two mutually linked 3D tori into independent 2D loops.",
    datasetId: "interlocking_rings",
    algorithmId: "umap",
    params: { nPoints: 250, umapNNeighbors: 12, umapMinDist: 0.2, learningRate: 1.2 },
    educationalInsight:
      "The Hopf Link cannot be separated in 3D without cutting, but fuzzy simplicial set cross-entropy discovers the two disjoint 1D ring components.",
  },
};

export const ALGORITHM_META: Record<
  ManifoldAlgorithmId,
  { name: string; type: string; complexity: string; objective: string }
> = {
  pca: {
    name: "Principal Component Analysis (PCA)",
    type: "Linear Global",
    complexity: "O(N D + D^3)",
    objective: "Maximize variance of linear orthogonal projections: max v^T C v",
  },
  tsne: {
    name: "t-Distributed Stochastic Neighbor Embedding (t-SNE)",
    type: "Non-Linear Local",
    complexity: "O(N^2) per step",
    objective: "Minimize KL divergence: D_KL(P || Q) = sum p_ij ln(p_ij / q_ij)",
  },
  umap: {
    name: "Uniform Manifold Approximation & Projection (UMAP)",
    type: "Non-Linear Local & Global",
    complexity: "O(N log N) / O(N^2)",
    objective: "Minimize fuzzy set cross-entropy: sum [v ln(v/q) + (1-v) ln((1-v)/(1-q))]",
  },
  isomap: {
    name: "Isometric Feature Mapping (Isomap)",
    type: "Non-Linear Global Geodesic",
    complexity: "O(N^2 log N + N^3)",
    objective: "Preserve geodesic shortest path distances: min ||H D_G^2 H - Y Y^T||_F",
  },
  mds: {
    name: "Classical Multidimensional Scaling (MDS)",
    type: "Linear / Non-Linear Distance Preserving",
    complexity: "O(N^3)",
    objective: "Preserve pairwise Euclidean distances: B = -0.5 H D^2 H",
  },
};

// ============================================================================
// 7. 3D & 2D PROJECTION & RENDERING UTILITIES
// ============================================================================

export interface Camera3D {
  azimuth: number; // in degrees
  elevation: number; // in degrees
  zoom: number;
}

/**
 * 3D Orthographic / Perspective projection to 2D SVG canvas.
 */
export function project3DTo2D(
  point: Point3D,
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

  // Rotation around Y (azimuth)
  const x1 = point[0] * cosAz + point[2] * sinAz;
  const y1 = point[1];
  const z1 = -point[0] * sinAz + point[2] * cosAz;

  // Rotation around X (elevation)
  const x2 = x1;
  const y2 = y1 * cosEl - z1 * sinEl;
  const z2 = y1 * sinEl + z1 * cosEl;

  const scale = (Math.min(width, height) / 18) * camera.zoom;
  const screenX = width / 2 + x2 * scale;
  const screenY = height / 2 - y2 * scale;

  return { x: screenX, y: screenY, zDepth: z2 };
}

// ============================================================================
// 8. MAIN REACT COMPONENT: ManifoldLearningStudio
// ============================================================================

export const ManifoldLearningStudio: React.FC<ManifoldLearningStudioProps> = ({
  initialDataset = "swiss_roll",
  initialAlgorithm = "isomap",
  initialPreset = "swiss_roll_unroll",
  initialSampleSize = 200,
  initialNoise = 0.05,
  initialPerplexity = 25,
  initialLearningRate = 150,
  initialUMAPNeighbors = 15,
  initialIsomapNeighbors = 12,
  initialMetricK = 10,
  width: _containerWidth = 980,
  height = 680,
  standalone = true,
  title = "Manifold Learning & Non-Linear Dimensionality Reduction Studio",
  onDatasetChange,
  onAlgorithmChange,
  onStepChange,
  onDiagnosticsUpdate,
}) => {
  // State: Configuration & Hyperparameters
  const [activeDatasetId, setActiveDatasetId] = useState<ManifoldDatasetId>(initialDataset);
  const [activeAlgorithmId, setActiveAlgorithmId] = useState<ManifoldAlgorithmId>(initialAlgorithm);
  const [activePresetId, setActivePresetId] = useState<ManifoldPresetId>(initialPreset);

  const [hyperparams, setHyperparams] = useState<AlgorithmHyperparameters>({
    ...DEFAULT_HYPERPARAMS,
    nPoints: initialSampleSize,
    noise: initialNoise,
    perplexity: initialPerplexity,
    learningRate: initialLearningRate,
    umapNNeighbors: initialUMAPNeighbors,
    isomapKNeighbors: initialIsomapNeighbors,
    metricK: initialMetricK,
  });

  // State: Generated 3D Dataset
  const [dataset, setDataset] = useState<GeneratedDataset>(() =>
    generateManifoldDataset(initialDataset, initialSampleSize, initialNoise, 42),
  );

  // State: 3D Camera & Interaction
  const [camera, setCamera] = useState<Camera3D>({
    azimuth: 45,
    elevation: 25,
    zoom: 1.0,
  });
  const [isDragging3D, setIsDragging3D] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showKNNGraph3D, setShowKNNGraph3D] = useState(true);
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // State: Iterative Execution & Animation Loop
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const maxIterations = 500;
  const stepSpeed = 2; // Steps per frame
  const [earlyExaggerationActive, setEarlyExaggerationActive] = useState(true);

  // State: High-D Cached Matrices & Embedding
  const [embedding, setEmbedding] = useState<Point2D[]>([]);
  const [velocities, setVelocities] = useState<Point2D[]>([]);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [currentLoss, setCurrentLoss] = useState(0);

  // Precomputed algorithm parameters
  const [tsneParams, setTsneParams] = useState<TSNEParams | null>(null);
  const [umapParams, setUmapParams] = useState<UMAPParams | null>(null);
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null);

  // Diagnostics State
  const [diagnostics, setDiagnostics] = useState<ManifoldDiagnostics>({
    trustworthiness: 1.0,
    continuity: 1.0,
    neighborhoodPreservation: 1.0,
    stressOrLoss: 0,
    metricK: initialMetricK,
    computationTimeMs: 0,
  });

  // UI Accordions & Tabs
  const [activeInfoTab, setActiveInfoTab] = useState<
    "math" | "metrics" | "topology" | "comparison"
  >("math");
  const [expandedSection, setExpandedSection] = useState<"params" | "diagnostics" | "theory">(
    "params",
  );

  const animationFrameRef = useRef<number | null>(null);

  // High-D Distances Matrix Cache
  const highDistances = useMemo(() => {
    return computePairwiseDistances(dataset.points);
  }, [dataset]);

  const highDistancesSq = useMemo(() => {
    return computePairwiseSquaredDistances(dataset.points);
  }, [dataset]);

  // High-D k-NN Graph for Visualization
  const knnGraph = useMemo(() => {
    const k =
      activeAlgorithmId === "isomap"
        ? hyperparams.isomapKNeighbors
        : activeAlgorithmId === "umap"
          ? hyperparams.umapNNeighbors
          : 8;
    return buildKNNGraph(highDistances, k);
  }, [highDistances, activeAlgorithmId, hyperparams.isomapKNeighbors, hyperparams.umapNNeighbors]);

  // ==========================================================================
  // INITIALIZATION & ALGORITHM PRECOMPUTATION
  // ==========================================================================

  const initializeEmbedding = useCallback(
    (algoId: ManifoldAlgorithmId, data: GeneratedDataset, params: AlgorithmHyperparameters) => {
      const startTime = performance.now();
      const n = data.points.length;
      const rng = createDeterministicRng(params.seed + 101);

      // Random small Gaussian initialization for iterative methods
      const randomY: Point2D[] = Array.from({ length: n }, () => [
        sampleNormal(rng, 0, 0.0001),
        sampleNormal(rng, 0, 0.0001),
      ]);
      const initialVel: Point2D[] = Array.from({ length: n }, () => [0, 0]);

      if (algoId === "pca") {
        const pca = computePCA(data.points);
        setPcaResult(pca);
        setEmbedding(pca.embedding);
        setVelocities([]);
        setIteration(1);
        setCurrentLoss(0);
        setLossHistory([0]);
        const elapsed = performance.now() - startTime;
        const diag = computeManifoldDiagnostics(highDistances, pca.embedding, params.metricK, 0, {
          explainedVarianceRatio: pca.explainedVarianceRatio,
          totalExplainedVariance: pca.totalExplainedVariance,
          computationTimeMs: elapsed,
        });
        setDiagnostics(diag);
        onDiagnosticsUpdate?.(diag);
      } else if (algoId === "isomap") {
        const iso = computeIsomap(data.points, params.isomapKNeighbors);
        setEmbedding(iso.embedding);
        setVelocities([]);
        setIteration(1);
        setCurrentLoss(iso.stress);
        setLossHistory([iso.stress]);
        const elapsed = performance.now() - startTime;
        const diag = computeManifoldDiagnostics(
          highDistances,
          iso.embedding,
          params.metricK,
          iso.stress,
          {
            geodesicDisconnections: iso.disconnectedCount,
            computationTimeMs: elapsed,
          },
        );
        setDiagnostics(diag);
        onDiagnosticsUpdate?.(diag);
      } else if (algoId === "mds") {
        const mds = classicalMDS(highDistances, 2);
        setEmbedding(mds.embedding);
        setVelocities([]);
        setIteration(1);
        setCurrentLoss(mds.stress);
        setLossHistory([mds.stress]);
        const elapsed = performance.now() - startTime;
        const diag = computeManifoldDiagnostics(
          highDistances,
          mds.embedding,
          params.metricK,
          mds.stress,
          {
            computationTimeMs: elapsed,
          },
        );
        setDiagnostics(diag);
        onDiagnosticsUpdate?.(diag);
      } else if (algoId === "tsne") {
        const { sigmas, conditionalP } = computeTSNEPerplexitySigma(
          highDistancesSq,
          params.perplexity,
        );
        const symmetrizedP = computeTSNESymmetrizedP(conditionalP);
        setTsneParams({ sigmas, symmetrizedP });
        setEmbedding(randomY);
        setVelocities(initialVel);
        setIteration(0);
        setEarlyExaggerationActive(true);
        const initialLoss = computeTSNEKLLoss(symmetrizedP, computeTSNEStudentTDist(randomY).Q);
        setCurrentLoss(initialLoss);
        setLossHistory([initialLoss]);
        const elapsed = performance.now() - startTime;
        const diag = computeManifoldDiagnostics(
          highDistances,
          randomY,
          params.metricK,
          initialLoss,
          {
            computationTimeMs: elapsed,
          },
        );
        setDiagnostics(diag);
        onDiagnosticsUpdate?.(diag);
      } else if (algoId === "umap") {
        const { sigmas, rhos, conditionalP } = computeUMAPLocalMetrics(
          highDistances,
          params.umapNNeighbors,
        );
        const fuzzyUnion = computeUMAPFuzzyUnion(conditionalP);
        const { a, b } = findUMAPABParams(params.umapSpread, params.umapMinDist);
        setUmapParams({ a, b, sigmas, rhos, fuzzyUnion });
        setEmbedding(randomY);
        setVelocities(initialVel);
        setIteration(0);
        const initialLoss = computeUMAPGradient(fuzzyUnion, randomY, a, b).loss;
        setCurrentLoss(initialLoss);
        setLossHistory([initialLoss]);
        const elapsed = performance.now() - startTime;
        const diag = computeManifoldDiagnostics(
          highDistances,
          randomY,
          params.metricK,
          initialLoss,
          {
            computationTimeMs: elapsed,
          },
        );
        setDiagnostics(diag);
        onDiagnosticsUpdate?.(diag);
      }
    },
    [highDistances, highDistancesSq, onDiagnosticsUpdate],
  );

  // Trigger regeneration on dataset / algorithm change
  useEffect(() => {
    const newDataset = generateManifoldDataset(
      activeDatasetId,
      hyperparams.nPoints,
      hyperparams.noise,
      hyperparams.seed,
    );
    setDataset(newDataset);
  }, [activeDatasetId, hyperparams.nPoints, hyperparams.noise, hyperparams.seed]);

  useEffect(() => {
    initializeEmbedding(activeAlgorithmId, dataset, hyperparams);
  }, [activeAlgorithmId, dataset, hyperparams, initializeEmbedding]);

  // ==========================================================================
  // SINGLE STEP OPTIMIZATION FUNCTION
  // ==========================================================================

  const performStep = useCallback(() => {
    if (
      activeAlgorithmId === "pca" ||
      activeAlgorithmId === "isomap" ||
      activeAlgorithmId === "mds"
    ) {
      setIsRunning(false);
      return;
    }

    if (activeAlgorithmId === "tsne" && tsneParams) {
      const isExaggerated = iteration < hyperparams.earlyExaggerationIter;
      setEarlyExaggerationActive(isExaggerated);
      const exaggFactor = isExaggerated ? hyperparams.earlyExaggeration : 1.0;

      const { nextY, nextVelocities, loss } = stepTSNE(
        embedding,
        velocities,
        tsneParams.symmetrizedP,
        hyperparams.learningRate,
        hyperparams.momentum,
        exaggFactor,
      );

      setEmbedding(nextY);
      setVelocities(nextVelocities);
      setCurrentLoss(loss);
      setLossHistory((prev) => [...prev.slice(-120), loss]);
      setIteration((prev) => prev + 1);

      if (iteration % 5 === 0) {
        const diag = computeManifoldDiagnostics(highDistances, nextY, hyperparams.metricK, loss);
        setDiagnostics(diag);
        onDiagnosticsUpdate?.(diag);
      }
      onStepChange?.(iteration + 1, loss);
    } else if (activeAlgorithmId === "umap" && umapParams) {
      const { nextY, nextVelocities, loss } = stepUMAP(
        embedding,
        velocities,
        umapParams.fuzzyUnion,
        umapParams.a,
        umapParams.b,
        hyperparams.learningRate * 0.01,
        hyperparams.momentum,
      );

      setEmbedding(nextY);
      setVelocities(nextVelocities);
      setCurrentLoss(loss);
      setLossHistory((prev) => [...prev.slice(-120), loss]);
      setIteration((prev) => prev + 1);

      if (iteration % 5 === 0) {
        const diag = computeManifoldDiagnostics(highDistances, nextY, hyperparams.metricK, loss);
        setDiagnostics(diag);
        onDiagnosticsUpdate?.(diag);
      }
      onStepChange?.(iteration + 1, loss);
    }
  }, [
    activeAlgorithmId,
    tsneParams,
    umapParams,
    iteration,
    hyperparams,
    embedding,
    velocities,
    highDistances,
    onStepChange,
    onDiagnosticsUpdate,
  ]);

  // Animation Loop
  useEffect(() => {
    if (!isRunning) return;

    const loop = () => {
      for (let s = 0; s < stepSpeed; s++) {
        performStep();
      }
      if (iteration < maxIterations) {
        animationFrameRef.current = requestAnimationFrame(loop);
      } else {
        setIsRunning(false);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, iteration, maxIterations, stepSpeed, performStep]);

  // Preset Selection Handler
  const handlePresetSelect = (presetId: ManifoldPresetId) => {
    const preset = MANIFOLD_PRESETS[presetId];
    if (!preset) return;
    setActivePresetId(presetId);
    setActiveDatasetId(preset.datasetId);
    setActiveAlgorithmId(preset.algorithmId);
    setHyperparams((prev) => ({
      ...prev,
      ...preset.params,
    }));
    onDatasetChange?.(preset.datasetId);
    onAlgorithmChange?.(preset.algorithmId);
  };

  // Reset Handler
  const handleReset = () => {
    setIsRunning(false);
    initializeEmbedding(activeAlgorithmId, dataset, hyperparams);
  };

  // Mouse Dragging on 3D Canvas
  const handleMouseDown3D = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging3D(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove3D = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging3D) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setCamera((prev) => ({
      ...prev,
      azimuth: (prev.azimuth + dx * 0.5) % 360,
      elevation: Math.max(-85, Math.min(85, prev.elevation - dy * 0.5)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp3D = () => {
    setIsDragging3D(false);
  };

  // 3D Canvas Render Dimensions
  const view3DWidth = 440;
  const view3DHeight = 360;

  // Project 3D points
  const projected3D = useMemo(() => {
    return dataset.points.map((p, idx) => {
      const proj = project3DTo2D(p, camera, view3DWidth, view3DHeight);
      return {
        ...proj,
        color: dataset.colors[idx] || "#38bdf8",
        idx,
        orig: p,
      };
    });
  }, [dataset, camera]);

  // Sort projected 3D points for painter's depth algorithm
  const sortedProjected3D = useMemo(() => {
    return [...projected3D].sort((a, b) => a.zDepth - b.zDepth);
  }, [projected3D]);

  // 2D Embedding Canvas Bounds & Auto-Fit
  const view2DWidth = 440;
  const view2DHeight = 360;

  const embeddingBounds = useMemo(() => {
    if (embedding.length === 0) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of embedding) {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }

    const spanX = Math.max(1e-4, maxX - minX);
    const spanY = Math.max(1e-4, maxY - minY);
    const padX = spanX * 0.12;
    const padY = spanY * 0.12;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [embedding]);

  const map2DToScreen = useCallback(
    (p: Point2D): { x: number; y: number } => {
      const { minX, maxX, minY, maxY } = embeddingBounds;
      const nx = (p[0] - minX) / (maxX - minX);
      const ny = (p[1] - minY) / (maxY - minY);
      return {
        x: 20 + nx * (view2DWidth - 40),
        y: view2DHeight - 20 - ny * (view2DHeight - 40),
      };
    },
    [embeddingBounds],
  );

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden ${
        standalone ? "p-6 w-full max-w-7xl mx-auto" : "p-3"
      }`}
      style={{ minHeight: height }}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-cyan-400">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Non-Linear Dynamics
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              High-dimensional topology unrolling, geodesic metric preservation & fuzzy simplicial
              embedding
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Preset:</span>
          <select
            value={activePresetId}
            onChange={(e) => handlePresetSelect(e.target.value as ManifoldPresetId)}
            aria-label="Preset Scenario"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {Object.values(MANIFOLD_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.algorithmId.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP CONTROLS & SELECTION BAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 py-4 border-b border-slate-800 text-xs">
        {/* Dataset Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            3D Manifold Dataset
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.values(MANIFOLD_DATASETS).map((ds) => (
              <button
                key={ds.id}
                onClick={() => {
                  setActiveDatasetId(ds.id);
                  onDatasetChange?.(ds.id);
                }}
                className={`px-2 py-1.5 rounded-md font-medium text-center truncate transition-colors ${
                  activeDatasetId === ds.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
                title={ds.description}
              >
                {ds.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Reduction Algorithm
          </label>
          <div className="grid grid-cols-5 gap-1">
            {(["pca", "tsne", "umap", "isomap", "mds"] as ManifoldAlgorithmId[]).map((algo) => (
              <button
                key={algo}
                onClick={() => {
                  setActiveAlgorithmId(algo);
                  onAlgorithmChange?.(algo);
                }}
                className={`px-1.5 py-1.5 rounded-md font-semibold text-center uppercase tracking-wider text-[11px] transition-colors ${
                  activeAlgorithmId === algo
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border border-cyan-400"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {algo}
              </button>
            ))}
          </div>
        </div>

        {/* Execution & Step Controls */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Optimization Engine
            </span>
            <span className="text-slate-500 font-mono">
              Step {iteration} / {maxIterations}
            </span>
          </label>
          <div className="flex items-center gap-2">
            {activeAlgorithmId === "tsne" || activeAlgorithmId === "umap" ? (
              <>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all shadow-md ${
                    isRunning
                      ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                  }`}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isRunning ? "Pause" : "Play"}
                </button>
                <button
                  onClick={performStep}
                  disabled={isRunning}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700"
                  title="Step 1 Iteration"
                >
                  Step
                </button>
              </>
            ) : (
              <div className="flex-1 text-center py-1.5 px-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-400">
                Exact Eigendecomposition (Instant)
              </div>
            )}
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
              title="Reset & Re-initialize"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DUAL VIEWPORT: 3D SOURCE SPACE & 2D EMBEDDING CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4">
        {/* 3D Source Space Canvas */}
        <div className="flex flex-col bg-slate-900/70 rounded-xl border border-slate-800 overflow-hidden relative">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              3D High-Dimensional Manifold (Ambient Space)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKNNGraph3D(!showKNNGraph3D)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                  showKNNGraph3D
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                k-NN Edges
              </button>
              <button
                onClick={() => setCamera({ azimuth: 45, elevation: 25, zoom: 1.0 })}
                className="text-[11px] text-slate-400 hover:text-slate-200"
                title="Reset Camera"
              >
                Reset View
              </button>
            </div>
          </div>

          {/* SVG 3D Canvas */}
          <div className="relative w-full h-[360px] bg-gradient-to-b from-slate-950 to-slate-900/90 select-none flex items-center justify-center">
            <svg
              viewBox={`0 0 ${view3DWidth} ${view3DHeight}`}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown3D}
              onMouseMove={handleMouseMove3D}
              onMouseUp={handleMouseUp3D}
              onMouseLeave={handleMouseUp3D}
            >
              {/* Background Coordinate Grid / Horizon */}
              <circle
                cx={view3DWidth / 2}
                cy={view3DHeight / 2}
                r={140 * camera.zoom}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* 3D k-NN Graph Edges */}
              {showKNNGraph3D &&
                knnGraph.adj.map((edges, srcIdx) => {
                  const p1 = projected3D[srcIdx];
                  if (!p1) return null;
                  return edges.map((edge) => {
                    const p2 = projected3D[edge.node];
                    if (!p2 || srcIdx > edge.node) return null;
                    const isEdgeHovered =
                      hoveredPointIdx === srcIdx || hoveredPointIdx === edge.node;
                    return (
                      <line
                        key={`edge-${srcIdx}-${edge.node}`}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={isEdgeHovered ? "#38bdf8" : "#334155"}
                        strokeWidth={isEdgeHovered ? 1.5 : 0.6}
                        strokeOpacity={isEdgeHovered ? 0.9 : 0.35}
                      />
                    );
                  });
                })}

              {/* 3D Points sorted by z-depth */}
              {sortedProjected3D.map((p) => {
                const isHovered = hoveredPointIdx === p.idx;
                const pointRadius = isHovered ? 6 : Math.max(2.5, 3.5 + p.zDepth * 0.15);
                return (
                  <g key={`p3d-${p.idx}`}>
                    {isHovered && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={pointRadius + 4}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={pointRadius}
                      fill={p.color}
                      stroke={isHovered ? "#ffffff" : "#0f172a"}
                      strokeWidth={isHovered ? 2 : 0.8}
                      className="cursor-pointer transition-all hover:scale-125"
                      onMouseEnter={() => setHoveredPointIdx(p.idx)}
                      onMouseLeave={() => setHoveredPointIdx(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* 3D Overlay Help / Coordinates Tooltip */}
            {hoveredPointIdx !== null && dataset.points[hoveredPointIdx] && (
              <div className="absolute top-2 left-2 px-2.5 py-1.5 rounded bg-slate-950/90 border border-slate-700 text-[11px] font-mono shadow-lg pointer-events-none">
                <span className="text-cyan-400 font-bold">Point #{hoveredPointIdx}</span>
                <div className="text-slate-300">
                  x: {dataset.points[hoveredPointIdx][0].toFixed(2)}, y:{" "}
                  {dataset.points[hoveredPointIdx][1].toFixed(2)}, z:{" "}
                  {dataset.points[hoveredPointIdx][2].toFixed(2)}
                </div>
              </div>
            )}

            <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 pointer-events-none">
              Drag to rotate camera (Az: {Math.round(camera.azimuth)}°, El:{" "}
              {Math.round(camera.elevation)}°)
            </div>
          </div>
        </div>

        {/* 2D Embedding Canvas */}
        <div className="flex flex-col bg-slate-900/70 rounded-xl border border-slate-800 overflow-hidden relative">
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              2D Low-Dimensional Embedding
            </span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              {earlyExaggerationActive && activeAlgorithmId === "tsne" && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Early Exaggeration ({hyperparams.earlyExaggeration}x)
                </span>
              )}
              <span className="text-slate-400">
                {activeAlgorithmId === "pca"
                  ? `Explained Var: ${((pcaResult?.totalExplainedVariance || 0) * 100).toFixed(1)}%`
                  : `Loss: ${currentLoss.toFixed(4)}`}
              </span>
            </div>
          </div>

          {/* SVG 2D Canvas */}
          <div className="relative w-full h-[360px] bg-gradient-to-b from-slate-950 to-slate-900/90 select-none flex items-center justify-center">
            <svg viewBox={`0 0 ${view2DWidth} ${view2DHeight}`} className="w-full h-full">
              {/* Axes and Origin Cross */}
              <line
                x1={20}
                y1={view2DHeight / 2}
                x2={view2DWidth - 20}
                y2={view2DHeight / 2}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={view2DWidth / 2}
                y1={20}
                x2={view2DWidth / 2}
                y2={view2DHeight - 20}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Connecting Edges for Hovered Point */}
              {hoveredPointIdx !== null &&
                knnGraph.adj[hoveredPointIdx]?.map((edge) => {
                  const p1 = embedding[hoveredPointIdx];
                  const p2 = embedding[edge.node];
                  if (!p1 || !p2) return null;
                  const scr1 = map2DToScreen(p1);
                  const scr2 = map2DToScreen(p2);
                  return (
                    <line
                      key={`2d-edge-${hoveredPointIdx}-${edge.node}`}
                      x1={scr1.x}
                      y1={scr1.y}
                      x2={scr2.x}
                      y2={scr2.y}
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeOpacity="0.8"
                    />
                  );
                })}

              {/* 2D Embedding Points */}
              {embedding.map((p, idx) => {
                const scr = map2DToScreen(p);
                const isHovered = hoveredPointIdx === idx;
                const pointColor = dataset.colors[idx] || "#38bdf8";

                return (
                  <g key={`p2d-${idx}`}>
                    {isHovered && (
                      <circle
                        cx={scr.x}
                        cy={scr.y}
                        r={8}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={scr.x}
                      cy={scr.y}
                      r={isHovered ? 5.5 : 3.5}
                      fill={pointColor}
                      stroke={isHovered ? "#ffffff" : "#0f172a"}
                      strokeWidth={isHovered ? 2 : 0.8}
                      className="cursor-pointer transition-all hover:scale-125"
                      onMouseEnter={() => setHoveredPointIdx(idx)}
                      onMouseLeave={() => setHoveredPointIdx(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* 2D Hover Tooltip */}
            {hoveredPointIdx !== null && embedding[hoveredPointIdx] && (
              <div className="absolute top-2 left-2 px-2.5 py-1.5 rounded bg-slate-950/90 border border-slate-700 text-[11px] font-mono shadow-lg pointer-events-none">
                <span className="text-cyan-400 font-bold">2D Embedding #{hoveredPointIdx}</span>
                <div className="text-slate-300">
                  y₁: {embedding[hoveredPointIdx][0].toFixed(3)}, y₂:{" "}
                  {embedding[hoveredPointIdx][1].toFixed(3)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIAGNOSTICS & TELEMETRY HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-slate-800 text-xs">
        {/* 1. Trustworthiness T(k) */}
        <div className="flex flex-col p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Trustworthiness T({diagnostics.metricK})</span>
            <span className="text-indigo-400 font-bold font-mono">
              {(diagnostics.trustworthiness * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, diagnostics.trustworthiness * 100))}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            Penalizes false positive neighbor intrusions
          </span>
        </div>

        {/* 2. Continuity C(k) */}
        <div className="flex flex-col p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Continuity C({diagnostics.metricK})</span>
            <span className="text-emerald-400 font-bold font-mono">
              {(diagnostics.continuity * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, diagnostics.continuity * 100))}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            Penalizes missing neighbors in low-D space
          </span>
        </div>

        {/* 3. Neighborhood Preservation Ratio */}
        <div className="flex flex-col p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>NPR @ {diagnostics.metricK}</span>
            <span className="text-amber-400 font-bold font-mono">
              {(diagnostics.neighborhoodPreservation * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, diagnostics.neighborhoodPreservation * 100))}%`,
              }}
            />
          </div>
          <span className="text-[10px] text-slate-500">Jaccard neighborhood overlap ratio</span>
        </div>

        {/* 4. Loss & Loss History Curve */}
        <div className="flex flex-col p-3 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span>Objective Loss</span>
            <span className="text-cyan-400 font-bold font-mono">{currentLoss.toFixed(4)}</span>
          </div>
          {/* Mini SVG Loss Sparkline */}
          <div className="w-full h-8 my-1 flex items-center">
            {lossHistory.length > 1 ? (
              <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                {(() => {
                  const maxL = Math.max(...lossHistory, 1e-4);
                  const minL = Math.min(...lossHistory);
                  const span = Math.max(1e-4, maxL - minL);
                  const pointsStr = lossHistory
                    .map((val, idx) => {
                      const x = (idx / (lossHistory.length - 1)) * 100;
                      const y = 22 - ((val - minL) / span) * 20;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ");
                  return (
                    <polyline
                      points={pointsStr}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  );
                })()}
              </svg>
            ) : (
              <span className="text-[10px] text-slate-600 italic">No optimization history yet</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">
            {activeAlgorithmId === "tsne"
              ? "KL Divergence"
              : activeAlgorithmId === "umap"
                ? "Fuzzy Cross-Entropy"
                : activeAlgorithmId === "isomap"
                  ? "Geodesic Strain / Stress"
                  : "Spectral Loss"}
          </span>
        </div>
      </div>

      {/* PARAMETER CONTROLS ACCORDION */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
          <button
            onClick={() => setExpandedSection(expandedSection === "params" ? "theory" : "params")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            Hyperparameter Fine-Tuning
            {expandedSection === "params" ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Points N: {hyperparams.nPoints}</span>
            <span>Noise: {hyperparams.noise.toFixed(2)}</span>
          </div>
        </div>

        {expandedSection === "params" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
            {/* Shared Parameters */}
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-slate-300">Dataset & Geometry</span>
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Sample Size N</span>
                  <span className="font-mono">{hyperparams.nPoints}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="350"
                  step="10"
                  value={hyperparams.nPoints}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, nPoints: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Gaussian Noise sigma</span>
                  <span className="font-mono">{hyperparams.noise.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.4"
                  step="0.01"
                  value={hyperparams.noise}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, noise: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Algorithm Specific: t-SNE */}
            {activeAlgorithmId === "tsne" && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-cyan-300">t-SNE Parameters</span>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Perplexity</span>
                    <span className="font-mono">{hyperparams.perplexity}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={hyperparams.perplexity}
                    onChange={(e) =>
                      setHyperparams({ ...hyperparams, perplexity: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Learning Rate eta</span>
                    <span className="font-mono">{hyperparams.learningRate}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={hyperparams.learningRate}
                    onChange={(e) =>
                      setHyperparams({ ...hyperparams, learningRate: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>
              </div>
            )}

            {/* Algorithm Specific: UMAP */}
            {activeAlgorithmId === "umap" && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-emerald-300">UMAP Parameters</span>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>n_neighbors</span>
                    <span className="font-mono">{hyperparams.umapNNeighbors}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="50"
                    step="1"
                    value={hyperparams.umapNNeighbors}
                    onChange={(e) =>
                      setHyperparams({
                        ...hyperparams,
                        umapNNeighbors: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>min_dist</span>
                    <span className="font-mono">{hyperparams.umapMinDist.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.8"
                    step="0.02"
                    value={hyperparams.umapMinDist}
                    onChange={(e) =>
                      setHyperparams({ ...hyperparams, umapMinDist: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Algorithm Specific: Isomap */}
            {activeAlgorithmId === "isomap" && (
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-amber-300">Isomap Parameters</span>
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>k_neighbors</span>
                    <span className="font-mono">{hyperparams.isomapKNeighbors}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="30"
                    step="1"
                    value={hyperparams.isomapKNeighbors}
                    onChange={(e) =>
                      setHyperparams({
                        ...hyperparams,
                        isomapKNeighbors: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Diagnostics Metric k */}
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-purple-300">Diagnostic Metrics</span>
              <div>
                <div className="flex justify-between text-slate-400">
                  <span>Metric Evaluation k</span>
                  <span className="font-mono">{hyperparams.metricK}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="25"
                  step="1"
                  value={hyperparams.metricK}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, metricK: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* EDUCATIONAL & MATHEMATICAL INSIGHTS ACCORDION */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
          <button
            onClick={() => setExpandedSection(expandedSection === "theory" ? "params" : "theory")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Mathematical Theory & Topological Analysis
            {expandedSection === "theory" ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="flex items-center gap-1.5 text-xs">
            {(["math", "metrics", "topology", "comparison"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setExpandedSection("theory");
                  setActiveInfoTab(tab);
                }}
                className={`px-2.5 py-1 rounded font-medium capitalize transition-colors ${
                  activeInfoTab === tab && expandedSection === "theory"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {expandedSection === "theory" && (
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {activeInfoTab === "math" && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  {ALGORITHM_META[activeAlgorithmId].name} Mathematical Formulation
                </div>
                <div className="p-3 rounded bg-slate-950 font-mono text-[11px] text-cyan-300 border border-slate-800">
                  {ALGORITHM_META[activeAlgorithmId].objective}
                </div>
                {activeAlgorithmId === "tsne" && (
                  <p>
                    t-SNE defines high-dimensional Gaussian affinities matching perplexity via
                    binary search for sigma. Joint probability p_ij = (p_j|i + p_i|j) / (2N). In
                    low-dimensional space, the Student-t distribution with 1 d.o.f. (q_ij ~ (1 +
                    ||y_i - y_j||^2)^(-1)) prevents the crowding problem by creating heavier tails
                    that push dissimilar clusters apart.
                  </p>
                )}
                {activeAlgorithmId === "umap" && (
                  <p>
                    UMAP constructs a fuzzy simplicial set by finding local geodesic distance rho_i
                    and scaling sigma_i satisfying sum exp(-max(0, d - rho_i)/sigma_i) = log2(k).
                    The symmetrized fuzzy union v_ij = p_j|i + p_i|j - p_j|i * p_i|j is embedded
                    into 2D by minimizing cross-entropy with low-D curve Psi(d) = 1 / (1 + a *
                    d^(2b)).
                  </p>
                )}
                {activeAlgorithmId === "isomap" && (
                  <p>
                    Isomap constructs a k-NN adjacency graph and calculates all-pairs geodesic
                    shortest paths D_G via Dijkstra. Classical MDS is then performed by double
                    centering the squared geodesic matrix: B = -0.5 * H D_G^2 H, followed by
                    eigendecomposition B = V Lambda V^T.
                  </p>
                )}
                {activeAlgorithmId === "pca" && (
                  <p>
                    PCA computes the 3x3 sample covariance matrix C = (1 / (N - 1)) * X_c^T X_c and
                    extracts its top 2 orthonormal eigenvectors v1, v2 corresponding to the largest
                    eigenvalues lambda1 &gt;= lambda2 &gt;= lambda3 &gt;= 0.
                  </p>
                )}
              </div>
            )}

            {activeInfoTab === "metrics" && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Dimensionality Reduction Quality Metrics
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="font-bold text-indigo-400">Trustworthiness T(k)</span>
                    <p className="mt-1 text-slate-400">
                      Measures if points that are close in low-D space were also close in high-D
                      space. It penalizes untrue neighbors introduced by projection folding: T(k) =
                      1 - (2 / (N k (2N - 3k - 1))) * sum (r(i, j) - k)
                    </p>
                  </div>
                  <div className="p-3 rounded bg-slate-950 border border-slate-800">
                    <span className="font-bold text-emerald-400">Continuity C(k)</span>
                    <p className="mt-1 text-slate-400">
                      Measures if points that were close in high-D space remain close in low-D
                      space. It penalizes severed neighbors torn apart by the embedding: C(k) = 1 -
                      (2 / (N k (2N - 3k - 1))) * sum (r_hat(i, j) - k)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeInfoTab === "topology" && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Dataset Topology: {MANIFOLD_DATASETS[activeDatasetId].name}
                </div>
                <p>{MANIFOLD_DATASETS[activeDatasetId].description}</p>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-amber-300">
                  <strong>Challenge: </strong>
                  {MANIFOLD_DATASETS[activeDatasetId].topologicalChallenge}
                </div>
              </div>
            )}

            {activeInfoTab === "comparison" && (
              <div className="flex flex-col gap-3">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Comparative Algorithm Trade-offs
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-1.5 px-2">Algorithm</th>
                        <th className="py-1.5 px-2">Type</th>
                        <th className="py-1.5 px-2">Complexity</th>
                        <th className="py-1.5 px-2">Preserved Structure</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-1.5 px-2 font-bold text-cyan-400">PCA</td>
                        <td className="py-1.5 px-2">Linear</td>
                        <td className="py-1.5 px-2 font-mono">O(N D + D^3)</td>
                        <td className="py-1.5 px-2">Maximal Global Variance</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-bold text-indigo-400">t-SNE</td>
                        <td className="py-1.5 px-2">Non-Linear</td>
                        <td className="py-1.5 px-2 font-mono">O(N^2) / step</td>
                        <td className="py-1.5 px-2">Local Probabilistic Neighborhoods</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-bold text-emerald-400">UMAP</td>
                        <td className="py-1.5 px-2">Non-Linear</td>
                        <td className="py-1.5 px-2 font-mono">O(N log N)</td>
                        <td className="py-1.5 px-2">Local & Global Fuzzy Simplicial Topology</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-2 font-bold text-amber-400">Isomap</td>
                        <td className="py-1.5 px-2">Non-Linear</td>
                        <td className="py-1.5 px-2 font-mono">O(N^2 log N + N^3)</td>
                        <td className="py-1.5 px-2">Geodesic Manifold Shortest Paths</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManifoldLearningStudio;
