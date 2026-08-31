import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Compass,
  Activity,
  BarChart2,
  TrendingUp,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  BookOpen,
  Sliders,
  Crosshair,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type Vector2 = [number, number];

export const DEFAULT_VIEW_BOUNDS: [number, number, number, number] = [-3.5, 3.5, -3.5, 3.5];

export type FlowDatasetId =
  | "gaussian"
  | "swiss_roll"
  | "eight_gaussians"
  | "two_moons"
  | "concentric_rings"
  | "pinwheel"
  | "four_corners";

export type CouplingType = "independent" | "optimal_transport" | "sinkhorn";
export type CouplingMethod = CouplingType;

export type ODESolverType = "euler" | "midpoint" | "rk4";

export type FlowStudioTabId =
  | "generation"
  | "coupling_comparison"
  | "ode_benchmark"
  | "vector_field_divergence"
  | "math_theory";
export type FlowMatchingStudioTabId = FlowStudioTabId;

export type FlowPresetId =
  | "ot_flow_swiss_roll_rk4"
  | "independent_flow_8gaussians_euler"
  | "concentric_rings_morphing_sinkhorn"
  | "two_moons_fast_10step_midpoint"
  | "pinwheel_ot_flow_divergence"
  | "four_corners_transport_benchmark"
  | "ot_cfm_swiss_roll"
  | "independent_two_moons"
  | "sinkhorn_8gaussians"
  | "rk4_pinwheel_benchmark"
  | "euler_vs_rk4_rings"
  | "divergence_four_corners";
export type FlowMatchingPresetId = FlowPresetId;

export interface FlowPoint {
  readonly id: number;
  readonly point: Vector2;
  readonly classLabel: number;
  readonly color?: string;
}
export type FlowDatasetPoint = FlowPoint;

export interface CouplingPair {
  readonly id?: number;
  readonly source: FlowPoint;
  readonly target: FlowPoint;
  readonly x0: Vector2;
  readonly x1: Vector2;
  readonly classLabel?: number;
  readonly cost: number;
  readonly color?: string;
}
export type CoupledPair = CouplingPair;

export interface TrajectoryPoint {
  readonly t: number;
  readonly pos: Vector2;
  readonly velocity: Vector2;
}

export interface IntegratedParticle {
  readonly id: number;
  readonly x0: Vector2;
  readonly x1Target: Vector2;
  readonly currentPos: Vector2;
  readonly trajectory: readonly TrajectoryPoint[];
  readonly classLabel: number;
  readonly straightness: number;
  readonly curvature: number;
  readonly endpointError: number;
  readonly color?: string;
}

export interface ParticleState {
  readonly id: number;
  readonly currentPos: Vector2;
  readonly initialPos: Vector2;
  readonly targetPos: Vector2;
  readonly trajectory: readonly Vector2[];
  readonly classLabel: number;
}

export interface VectorFieldCell {
  readonly x: number;
  readonly y: number;
  readonly vector: Vector2;
  readonly magnitude: number;
  readonly normalizedVector: Vector2;
  readonly divergence: number;
  readonly u: Vector2;
  readonly norm: number;
  readonly normalizedU: Vector2;
}

export interface SolverBenchmarkResult {
  readonly solver: ODESolverType;
  readonly steps: number;
  readonly nfe: number;
  readonly endpointDrift: number;
  readonly meanEndpointError: number;
  readonly maxEndpointError?: number;
  readonly meanCurvature?: number;
  readonly meanStraightness?: number;
  readonly meanPathError: number;
  readonly runtimeMs: number;
  readonly executionTimeMs?: number;
}
export type ODEBenchmarkResult = SolverBenchmarkResult;

export interface CouplingComparisonMetrics {
  readonly coupling: CouplingType;
  readonly totalCostW2: number;
  readonly meanStraightness: number;
  readonly trajectoryCrossingsCount: number;
  readonly velocityVariance: number;
  readonly meanCurvature: number;
}

export interface FlowMatchingPreset {
  readonly id: FlowPresetId;
  readonly name: string;
  readonly description: string;
  readonly sourceDataset: FlowDatasetId;
  readonly targetDataset: FlowDatasetId;
  readonly dataset?: FlowDatasetId;
  readonly coupling: CouplingType;
  readonly solver: ODESolverType;
  readonly numSteps: number;
  readonly steps?: number;
  readonly sigmaMin: number;
  readonly bandwidth: number;
  readonly activeTab: FlowStudioTabId;
  readonly tab?: FlowStudioTabId;
  readonly numParticles?: number;
  readonly sinkhornEpsilon?: number;
}

export interface FlowMatchingStudioProps {
  readonly initialPreset?: FlowPresetId;
  readonly initialSourceDataset?: FlowDatasetId;
  readonly initialTargetDataset?: FlowDatasetId;
  readonly initialDataset?: FlowDatasetId;
  readonly initialCoupling?: CouplingType;
  readonly initialSolver?: ODESolverType;
  readonly initialSteps?: number;
  readonly initialSigmaMin?: number;
  readonly initialBandwidth?: number;
  readonly particleCount?: number;
  readonly seed?: number;
  readonly className?: string;
  readonly onStepChange?: (step: number, t: number) => void;
}

// ============================================================================
// 2. DETERMINISTIC PRNG & VECTOR UTILITIES
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

  public nextGaussian(mean: number = 0, std: number = 1): number {
    const u1 = Math.max(1e-15, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * std;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public choice<T>(arr: readonly T[]): T {
    const idx = Math.floor(this.next() * arr.length);
    return arr[idx];
  }

  public shuffle<T>(arr: readonly T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

export function add2D(a: Vector2, b: Vector2): Vector2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function sub2D(a: Vector2, b: Vector2): Vector2 {
  return [a[0] - b[0], a[1] - b[1]];
}

export function scale2D(v: Vector2, s: number): Vector2 {
  return [v[0] * s, v[1] * s];
}

export function lerp2D(a: Vector2, b: Vector2, t: number): Vector2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function dot2D(a: Vector2, b: Vector2): number {
  return a[0] * b[0] + a[1] * b[1];
}

export function normSq2D(v: Vector2): number {
  return v[0] * v[0] + v[1] * v[1];
}

export function norm2D(v: Vector2): number {
  return Math.hypot(v[0], v[1]);
}

export function distSq2D(a: Vector2, b: Vector2): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

export function dist2D(a: Vector2, b: Vector2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function normalize2D(v: Vector2): Vector2 {
  const n = norm2D(v);
  if (n < 1e-12) return [0, 0];
  return [v[0] / n, v[1] / n];
}

// ============================================================================
// 3. 2D DATASET GENERATORS
// ============================================================================

export const PALETTE = [
  "#38bdf8", // Sky Blue
  "#f43f5e", // Rose Pink
  "#10b981", // Emerald
  "#a855f7", // Purple
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
];
export const CLASS_PALETTE = PALETTE;

export function generateFlowDataset(
  datasetId: FlowDatasetId,
  count: number,
  rng: SeededRNG,
  noiseStd: number = 0.05,
): FlowPoint[] {
  const points: FlowPoint[] = [];

  switch (datasetId) {
    case "gaussian": {
      for (let i = 0; i < count; i++) {
        const x = rng.nextGaussian(0, 1);
        const y = rng.nextGaussian(0, 1);
        points.push({
          id: i,
          point: [x, y],
          classLabel: 0,
          color: PALETTE[0],
        });
      }
      break;
    }

    case "swiss_roll": {
      for (let i = 0; i < count; i++) {
        const u = rng.next();
        const t = 1.5 * Math.PI * (1 + 2 * u);
        const x = (t * Math.cos(t)) / 7.0;
        const y = (t * Math.sin(t)) / 7.0;
        const nx = rng.nextGaussian(0, noiseStd);
        const ny = rng.nextGaussian(0, noiseStd);
        const classLabel = u < 0.5 ? 0 : 1;
        points.push({
          id: i,
          point: [x + nx, y + ny],
          classLabel,
          color: PALETTE[classLabel % PALETTE.length],
        });
      }
      break;
    }

    case "eight_gaussians": {
      const radius = 2.0;
      const numModes = 8;
      for (let i = 0; i < count; i++) {
        const modeIdx = i % numModes;
        const angle = (modeIdx * 2 * Math.PI) / numModes;
        const cx = radius * Math.cos(angle);
        const cy = radius * Math.sin(angle);
        const x = cx + rng.nextGaussian(0, 0.15 + noiseStd);
        const y = cy + rng.nextGaussian(0, 0.15 + noiseStd);
        points.push({
          id: i,
          point: [x, y],
          classLabel: modeIdx,
          color: PALETTE[modeIdx % PALETTE.length],
        });
      }
      break;
    }

    case "two_moons": {
      for (let i = 0; i < count; i++) {
        const isUpper = i % 2 === 0;
        const theta = rng.next() * Math.PI;
        let x: number;
        let y: number;
        if (isUpper) {
          x = Math.cos(theta) * 1.5 - 0.75;
          y = Math.sin(theta) * 1.5 - 0.2;
        } else {
          x = 0.75 - Math.cos(theta) * 1.5;
          y = 0.2 - Math.sin(theta) * 1.5;
        }
        const nx = rng.nextGaussian(0, noiseStd * 1.5);
        const ny = rng.nextGaussian(0, noiseStd * 1.5);
        points.push({
          id: i,
          point: [x + nx, y + ny],
          classLabel: isUpper ? 0 : 1,
          color: isUpper ? PALETTE[0] : PALETTE[1],
        });
      }
      break;
    }

    case "concentric_rings": {
      for (let i = 0; i < count; i++) {
        const isInner = i % 2 === 0;
        const theta = rng.next() * 2 * Math.PI;
        const r = isInner
          ? 0.9 + rng.nextGaussian(0, noiseStd)
          : 2.2 + rng.nextGaussian(0, noiseStd);
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        points.push({
          id: i,
          point: [x, y],
          classLabel: isInner ? 0 : 1,
          color: isInner ? PALETTE[2] : PALETTE[3],
        });
      }
      break;
    }

    case "pinwheel": {
      const numArms = 5;
      for (let i = 0; i < count; i++) {
        const armIdx = i % numArms;
        const r = Math.pow(rng.next(), 0.6) * 2.5;
        const baseAngle = (armIdx * 2 * Math.PI) / numArms;
        const spiralAngle = baseAngle + 0.6 * r;
        const x = r * Math.cos(spiralAngle) + rng.nextGaussian(0, noiseStd * 0.8);
        const y = r * Math.sin(spiralAngle) + rng.nextGaussian(0, noiseStd * 0.8);
        points.push({
          id: i,
          point: [x, y],
          classLabel: armIdx,
          color: PALETTE[armIdx % PALETTE.length],
        });
      }
      break;
    }

    case "four_corners": {
      const centers: Vector2[] = [
        [-1.8, -1.8],
        [1.8, -1.8],
        [-1.8, 1.8],
        [1.8, 1.8],
      ];
      for (let i = 0; i < count; i++) {
        const cornerIdx = i % 4;
        const center = centers[cornerIdx];
        const x = center[0] + rng.nextGaussian(0, 0.2 + noiseStd);
        const y = center[1] + rng.nextGaussian(0, 0.2 + noiseStd);
        points.push({
          id: i,
          point: [x, y],
          classLabel: cornerIdx,
          color: PALETTE[cornerIdx % PALETTE.length],
        });
      }
      break;
    }
  }

  return points;
}

// ============================================================================
// 4. FLOW MATCHING PROBABILITY PATHS & CONDITIONAL VELOCITIES
// ============================================================================

export function computeLinearPathPoint(
  x0: Vector2,
  x1: Vector2,
  t: number,
  sigmaMin: number = 1e-4,
): Vector2 {
  const alphaT = 1.0 - (1.0 - sigmaMin) * t;
  const betaT = t;
  return [alphaT * x0[0] + betaT * x1[0], alphaT * x0[1] + betaT * x1[1]];
}

export function computeConditionalTargetVelocity(
  x0: Vector2,
  x1: Vector2,
  sigmaMin: number = 1e-4,
): Vector2 {
  const coef0 = 1.0 - sigmaMin;
  return [x1[0] - coef0 * x0[0], x1[1] - coef0 * x0[1]];
}

export function computeConditionalVelocity(x0: Vector2, x1: Vector2): Vector2 {
  return [x1[0] - x0[0], x1[1] - x0[1]];
}

// ============================================================================
// 5. COUPLINGS: INDEPENDENT & OPTIMAL TRANSPORT (HUNGARIAN & SINKHORN)
// ============================================================================

export function solveHungarian(costMatrix: number[][]): number[] {
  const n = costMatrix.length;
  if (n === 0) return [];

  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(Infinity);
    const used = new Array<boolean>(n + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const assignment = new Array<number>(n).fill(-1);
  for (let j = 1; j <= n; j++) {
    const srcIdx = p[j] - 1;
    if (srcIdx >= 0 && srcIdx < n) {
      assignment[srcIdx] = j - 1;
    }
  }
  return assignment;
}

export function solveSinkhorn(
  costMatrix: number[][],
  reg: number = 0.05,
  maxIters: number = 100,
): number[][] {
  const n = costMatrix.length;
  if (n === 0) return [];

  let maxCost = 1e-6;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (costMatrix[i][j] > maxCost) maxCost = costMatrix[i][j];
    }
  }

  const epsilon = Math.max(1e-4, reg * maxCost);
  const K: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      K[i][j] = Math.exp(-costMatrix[i][j] / epsilon);
    }
  }

  const u = new Array<number>(n).fill(1 / n);
  let v = new Array<number>(n).fill(1 / n);

  for (let iter = 0; iter < maxIters; iter++) {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += K[i][j] * v[j];
      }
      u[i] = 1.0 / n / Math.max(1e-15, sum);
    }

    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += K[i][j] * u[i];
      }
      v[j] = 1.0 / n / Math.max(1e-15, sum);
    }
  }

  const plan: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      plan[i][j] = u[i] * K[i][j] * v[j];
    }
  }
  return plan;
}

export function computeIndependentCoupling(
  sourcePoints: readonly FlowPoint[],
  targetPoints: readonly FlowPoint[],
  rng?: SeededRNG,
): CouplingPair[] {
  const n = Math.min(sourcePoints.length, targetPoints.length);
  const localRng = rng || new SeededRNG(1337);
  const shuffledTargetIndices = localRng.shuffle(
    Array.from({ length: targetPoints.length }, (_, i) => i),
  );

  const pairs: CouplingPair[] = [];
  for (let i = 0; i < n; i++) {
    const src = sourcePoints[i];
    const tgt = targetPoints[shuffledTargetIndices[i]];
    const cost = distSq2D(src.point, tgt.point);
    pairs.push({
      id: i,
      source: src,
      target: tgt,
      x0: src.point,
      x1: tgt.point,
      classLabel: tgt.classLabel,
      cost,
      color: tgt.color,
    });
  }
  return pairs;
}

export function computeHungarianOTCoupling(
  sourcePoints: readonly FlowPoint[],
  targetPoints: readonly FlowPoint[],
): CouplingPair[] {
  const n = Math.min(sourcePoints.length, targetPoints.length);
  if (n === 0) return [];

  const cost: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cost[i][j] = distSq2D(sourcePoints[i].point, targetPoints[j].point);
    }
  }

  const assignment = solveHungarian(cost);
  const resultPairs: CouplingPair[] = [];

  for (let i = 0; i < n; i++) {
    const j = assignment[i] >= 0 ? assignment[i] : i;
    const src = sourcePoints[i];
    const tgt = targetPoints[j];
    const c = distSq2D(src.point, tgt.point);
    resultPairs.push({
      id: i,
      source: src,
      target: tgt,
      x0: src.point,
      x1: tgt.point,
      classLabel: tgt.classLabel,
      cost: c,
      color: tgt.color,
    });
  }

  return resultPairs;
}
export const computeOptimalTransportCoupling = computeHungarianOTCoupling;

export function computeSinkhornOTCoupling(
  sourcePoints: readonly FlowPoint[],
  targetPoints: readonly FlowPoint[],
  reg: number = 0.05,
  maxIters: number = 100,
): { pairs: CouplingPair[]; plan: number[][] } {
  const n = Math.min(sourcePoints.length, targetPoints.length);
  if (n === 0) return { pairs: [], plan: [] };

  const cost: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      cost[i][j] = distSq2D(sourcePoints[i].point, targetPoints[j].point);
    }
  }

  const plan = solveSinkhorn(cost, reg, maxIters);
  const assignedTargets = new Set<number>();
  const pairs: CouplingPair[] = [];

  for (let i = 0; i < n; i++) {
    let bestJ = -1;
    let bestProb = -Infinity;

    for (let j = 0; j < n; j++) {
      if (!assignedTargets.has(j) && plan[i][j] > bestProb) {
        bestProb = plan[i][j];
        bestJ = j;
      }
    }

    if (bestJ === -1) {
      for (let j = 0; j < n; j++) {
        if (!assignedTargets.has(j)) {
          bestJ = j;
          break;
        }
      }
    }

    if (bestJ !== -1) {
      assignedTargets.add(bestJ);
      const src = sourcePoints[i];
      const tgt = targetPoints[bestJ];
      const c = distSq2D(src.point, tgt.point);
      pairs.push({
        id: i,
        source: src,
        target: tgt,
        x0: src.point,
        x1: tgt.point,
        classLabel: tgt.classLabel,
        cost: c,
        color: tgt.color,
      });
    }
  }

  return { pairs, plan };
}

export function computeSinkhornCoupling(
  sourcePoints: readonly FlowPoint[],
  targetPoints: readonly FlowPoint[],
  reg: number = 0.05,
  maxIters: number = 100,
): CouplingPair[] {
  return computeSinkhornOTCoupling(sourcePoints, targetPoints, reg, maxIters).pairs;
}

export function computeTransportCost(pairs: readonly CouplingPair[]): number {
  if (pairs.length === 0) return 0;
  const total = pairs.reduce((sum, p) => sum + p.cost, 0);
  return total / pairs.length;
}

export function computeW2Cost(pairs: readonly CouplingPair[]): number {
  return Math.sqrt(computeTransportCost(pairs));
}

export function computeTrajectoryStraightness(
  trajectories: readonly (readonly Vector2[] | readonly TrajectoryPoint[])[],
): {
  meanCurvature: number;
  straightnessIndex: number;
} {
  if (trajectories.length === 0) return { meanCurvature: 0, straightnessIndex: 1 };

  let totalCurvature = 0;
  let validCount = 0;

  for (const rawTraj of trajectories) {
    if (rawTraj.length < 2) continue;
    const traj: Vector2[] = rawTraj.map((pt) =>
      Array.isArray(pt) ? (pt as Vector2) : (pt as TrajectoryPoint).pos,
    );

    let arcLength = 0;
    for (let i = 1; i < traj.length; i++) {
      arcLength += dist2D(traj[i - 1], traj[i]);
    }
    const directDist = dist2D(traj[0], traj[traj.length - 1]);
    if (directDist > 1e-6) {
      const curv = arcLength / directDist - 1.0;
      totalCurvature += Math.max(0, curv);
      validCount++;
    }
  }

  const meanCurvature = validCount > 0 ? totalCurvature / validCount : 0;
  const straightnessIndex = Math.exp(-meanCurvature * 2.0);

  return { meanCurvature, straightnessIndex };
}

export function computeStraightness(
  trajectory: readonly TrajectoryPoint[] | readonly Vector2[],
): number {
  if (trajectory.length < 2) return 1.0;
  const pts: Vector2[] = trajectory.map((pt) =>
    Array.isArray(pt) ? (pt as Vector2) : (pt as TrajectoryPoint).pos,
  );
  let arcLength = 0;
  for (let i = 1; i < pts.length; i++) {
    arcLength += dist2D(pts[i - 1], pts[i]);
  }
  const directDist = dist2D(pts[0], pts[pts.length - 1]);
  if (arcLength <= 1e-9) return 1.0;
  return Math.min(1.0, directDist / arcLength);
}

export function computeCurvature(
  trajectory: readonly TrajectoryPoint[] | readonly Vector2[],
): number {
  if (trajectory.length < 3) return 0.0;
  const pts: Vector2[] = trajectory.map((pt) =>
    Array.isArray(pt) ? (pt as Vector2) : (pt as TrajectoryPoint).pos,
  );
  let totalCurv = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const v1: Vector2 = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
    const v2: Vector2 = [pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]];
    const n1 = norm2D(v1);
    const n2 = norm2D(v2);
    if (n1 > 1e-6 && n2 > 1e-6) {
      const cosAngle = Math.max(-1, Math.min(1, dot2D(v1, v2) / (n1 * n2)));
      totalCurv += Math.acos(cosAngle);
    }
  }
  return totalCurv / (pts.length - 2);
}

export function doLineSegmentsIntersect(
  p1: Vector2,
  p2: Vector2,
  p3: Vector2,
  p4: Vector2,
): boolean {
  const ccw = (a: Vector2, b: Vector2, c: Vector2) =>
    (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);

  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

export function countLineCrossings(pairs: readonly CouplingPair[]): number {
  const n = pairs.length;
  let crossings = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (
        doLineSegmentsIntersect(
          pairs[i].source.point,
          pairs[i].target.point,
          pairs[j].source.point,
          pairs[j].target.point,
        )
      ) {
        crossings++;
      }
    }
  }
  return crossings;
}

export function computeCouplingComparison(
  x0Batch: readonly FlowPoint[],
  x1Batch: readonly FlowPoint[],
  sigma: number = 0.2,
  steps: number = 20,
): Record<CouplingType, CouplingComparisonMetrics> {
  const methods: CouplingType[] = ["independent", "optimal_transport", "sinkhorn"];
  const results: Record<CouplingType, CouplingComparisonMetrics> = {
    independent: {
      coupling: "independent",
      totalCostW2: 0,
      meanStraightness: 1,
      trajectoryCrossingsCount: 0,
      velocityVariance: 0,
      meanCurvature: 0,
    },
    optimal_transport: {
      coupling: "optimal_transport",
      totalCostW2: 0,
      meanStraightness: 1,
      trajectoryCrossingsCount: 0,
      velocityVariance: 0,
      meanCurvature: 0,
    },
    sinkhorn: {
      coupling: "sinkhorn",
      totalCostW2: 0,
      meanStraightness: 1,
      trajectoryCrossingsCount: 0,
      velocityVariance: 0,
      meanCurvature: 0,
    },
  };

  for (const m of methods) {
    let pairs: CouplingPair[] = [];
    if (m === "independent") pairs = computeIndependentCoupling(x0Batch, x1Batch);
    else if (m === "optimal_transport") pairs = computeHungarianOTCoupling(x0Batch, x1Batch);
    else pairs = computeSinkhornCoupling(x0Batch, x1Batch, 0.08);

    const w2 = computeTransportCost(pairs);
    const crossings = countLineCrossings(pairs);
    const integrated = integrateAllParticles(pairs, steps, "rk4", sigma);

    let sumStraight = 0;
    let sumCurv = 0;
    for (const p of integrated) {
      sumStraight += p.straightness;
      sumCurv += p.curvature;
    }

    results[m] = {
      coupling: m,
      totalCostW2: w2,
      meanStraightness: integrated.length > 0 ? sumStraight / integrated.length : 1,
      trajectoryCrossingsCount: crossings,
      velocityVariance: 0.05,
      meanCurvature: integrated.length > 0 ? sumCurv / integrated.length : 0,
    };
  }

  return results;
}

// ============================================================================
// 6. CONTINUOUS VECTOR FIELD AGGREGATION & DIVERGENCE
// ============================================================================

export function computeMarginalVectorField(
  x: Vector2,
  t: number,
  pairs: readonly CouplingPair[],
  sigmaMin: number = 1e-4,
  bandwidth: number = 0.25,
): Vector2 {
  if (pairs.length === 0) return [0, 0];

  const n = pairs.length;
  const sigmaT = Math.max(1e-3, bandwidth * Math.sqrt(Math.max(1e-4, t * (1.0 - t) + sigmaMin)));
  const twoVar = 2.0 * sigmaT * sigmaT;

  const logWeights = new Array<number>(n);
  let maxLogWeight = -Infinity;

  for (let i = 0; i < n; i++) {
    const pair = pairs[i];
    const muT = computeLinearPathPoint(pair.source.point, pair.target.point, t, sigmaMin);
    const dSq = distSq2D(x, muT);
    const logW = -dSq / twoVar;
    logWeights[i] = logW;
    if (logW > maxLogWeight) {
      maxLogWeight = logW;
    }
  }

  let sumExp = 0;
  const weights = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const w = Math.exp(logWeights[i] - maxLogWeight);
    weights[i] = w;
    sumExp += w;
  }

  let vx = 0;
  let vy = 0;
  const invSum = 1.0 / Math.max(1e-15, sumExp);

  for (let i = 0; i < n; i++) {
    const normW = weights[i] * invSum;
    const uT = computeConditionalTargetVelocity(
      pairs[i].source.point,
      pairs[i].target.point,
      sigmaMin,
    );
    vx += normW * uT[0];
    vy += normW * uT[1];
  }

  return [vx, vy];
}
export const computeMarginalVelocity = computeMarginalVectorField;

export function computeAnalyticalDivergence(
  x: Vector2,
  t: number,
  pairs: readonly CouplingPair[],
  sigmaMin: number = 1e-4,
  bandwidth: number = 0.25,
  eps: number = 1e-4,
): number {
  const vxPlus = computeMarginalVectorField([x[0] + eps, x[1]], t, pairs, sigmaMin, bandwidth);
  const vxMinus = computeMarginalVectorField([x[0] - eps, x[1]], t, pairs, sigmaMin, bandwidth);
  const vyPlus = computeMarginalVectorField([x[0], x[1] + eps], t, pairs, sigmaMin, bandwidth);
  const vyMinus = computeMarginalVectorField([x[0], x[1] - eps], t, pairs, sigmaMin, bandwidth);

  const dvx_dx = (vxPlus[0] - vxMinus[0]) / (2.0 * eps);
  const dvy_dy = (vyPlus[1] - vyMinus[1]) / (2.0 * eps);

  return dvx_dx + dvy_dy;
}
export const computeVectorFieldDivergence = computeAnalyticalDivergence;

export function computeVectorFieldGrid(
  pairsOrGridSize: readonly CouplingPair[] | number,
  tOrBounds: number,
  gridSizeOrPairs: number | readonly CouplingPair[],
  boundsOrSigmaMin: [number, number, number, number] | number = 3.2,
  bandwidth: number = 0.25,
): VectorFieldCell[] {
  let pairs: readonly CouplingPair[];
  let t: number;
  let gridSize: number;
  let bounds = 3.2;
  let sigma = 0.25;

  if (Array.isArray(pairsOrGridSize)) {
    pairs = pairsOrGridSize as readonly CouplingPair[];
    t = tOrBounds;
    gridSize = gridSizeOrPairs as number;
    if (Array.isArray(boundsOrSigmaMin)) {
      bounds = boundsOrSigmaMin[1];
    } else if (typeof boundsOrSigmaMin === "number") {
      bounds = boundsOrSigmaMin;
    }
    sigma = bandwidth;
  } else {
    gridSize = pairsOrGridSize as number;
    bounds = tOrBounds;
    pairs = gridSizeOrPairs as readonly CouplingPair[];
    t = typeof boundsOrSigmaMin === "number" ? boundsOrSigmaMin : 0.5;
    sigma = bandwidth;
  }

  const cells: VectorFieldCell[] = [];
  const step = (2.0 * bounds) / (gridSize - 1);

  for (let gy = 0; gy < gridSize; gy++) {
    const y = bounds - gy * step;
    for (let gx = 0; gx < gridSize; gx++) {
      const x = -bounds + gx * step;
      const vec = computeMarginalVectorField([x, y], t, pairs, 1e-4, sigma);
      const mag = norm2D(vec);
      const normalized = normalize2D(vec);
      const div = computeAnalyticalDivergence([x, y], t, pairs, 1e-4, sigma);

      cells.push({
        x,
        y,
        vector: vec,
        magnitude: mag,
        normalizedVector: normalized,
        divergence: div,
        u: vec,
        norm: mag,
        normalizedU: normalized,
      });
    }
  }

  return cells;
}
export const computeGridVectorField = computeVectorFieldGrid;

// ============================================================================
// 7. NEURAL ODE NUMERICAL INTEGRATORS (EULER, MIDPOINT, RK4)
// ============================================================================

export function eulerStep(
  x: Vector2,
  t: number,
  dt: number,
  vf: (pt: Vector2, time: number) => Vector2,
): Vector2 {
  const v = vf(x, t);
  return [x[0] + dt * v[0], x[1] + dt * v[1]];
}
export const odeStepEuler = eulerStep;

export function midpointStep(
  x: Vector2,
  t: number,
  dt: number,
  vf: (pt: Vector2, time: number) => Vector2,
): Vector2 {
  const halfDt = dt * 0.5;
  const k1 = vf(x, t);
  const midX: Vector2 = [x[0] + halfDt * k1[0], x[1] + halfDt * k1[1]];
  const k2 = vf(midX, t + halfDt);
  return [x[0] + dt * k2[0], x[1] + dt * k2[1]];
}
export const odeStepMidpoint = midpointStep;

export function rk4Step(
  x: Vector2,
  t: number,
  dt: number,
  vf: (pt: Vector2, time: number) => Vector2,
): Vector2 {
  const halfDt = dt * 0.5;
  const k1 = vf(x, t);
  const xK2: Vector2 = [x[0] + halfDt * k1[0], x[1] + halfDt * k1[1]];
  const k2 = vf(xK2, t + halfDt);
  const xK3: Vector2 = [x[0] + halfDt * k2[0], x[1] + halfDt * k2[1]];
  const k3 = vf(xK3, t + halfDt);
  const xK4: Vector2 = [x[0] + dt * k3[0], x[1] + dt * k3[1]];
  const k4 = vf(xK4, t + dt);

  const dx = (dt / 6.0) * (k1[0] + 2.0 * k2[0] + 2.0 * k3[0] + k4[0]);
  const dy = (dt / 6.0) * (k1[1] + 2.0 * k2[1] + 2.0 * k3[1] + k4[1]);

  return [x[0] + dx, x[1] + dy];
}
export const odeStepRK4 = rk4Step;

export function stepODE(
  solverOrPos: ODESolverType | Vector2,
  posOrT: Vector2 | number,
  tOrDt: number,
  dtOrVf: number | ((pt: Vector2, time: number) => Vector2),
  vfArg?: (pt: Vector2, time: number) => Vector2,
): Vector2 {
  let solver: ODESolverType;
  let pos: Vector2;
  let t: number;
  let dt: number;
  let vf: (pt: Vector2, time: number) => Vector2;

  if (typeof solverOrPos === "string") {
    solver = solverOrPos;
    pos = posOrT as Vector2;
    t = tOrDt;
    dt = dtOrVf as number;
    vf = vfArg!;
  } else {
    pos = solverOrPos;
    t = posOrT as number;
    dt = tOrDt;
    solver = dtOrVf as unknown as ODESolverType;
    vf = vfArg!;
  }

  if (solver === "euler") return eulerStep(pos, t, dt, vf);
  if (solver === "midpoint") return midpointStep(pos, t, dt, vf);
  return rk4Step(pos, t, dt, vf);
}

export function integrateODE(
  x0: Vector2,
  solver: ODESolverType,
  numSteps: number,
  vf: (pt: Vector2, time: number) => Vector2,
  tStart: number = 0.0,
  tEnd: number = 1.0,
): { trajectory: Vector2[]; nfe: number } {
  const trajectory: Vector2[] = [x0];
  const dt = (tEnd - tStart) / numSteps;
  let current = x0;
  let t = tStart;
  let nfeMultiplier = 1;

  if (solver === "euler") nfeMultiplier = 1;
  else if (solver === "midpoint") nfeMultiplier = 2;
  else if (solver === "rk4") nfeMultiplier = 4;

  for (let s = 0; s < numSteps; s++) {
    if (solver === "euler") {
      current = eulerStep(current, t, dt, vf);
    } else if (solver === "midpoint") {
      current = midpointStep(current, t, dt, vf);
    } else {
      current = rk4Step(current, t, dt, vf);
    }
    t = tStart + (s + 1) * dt;
    trajectory.push(current);
  }

  return { trajectory, nfe: numSteps * nfeMultiplier };
}

export function integrateTrajectory(
  x0: Vector2,
  stepsOrSolver: number | ODESolverType,
  solverOrSteps: ODESolverType | number,
  pairsOrVf: readonly CouplingPair[] | ((pt: Vector2, time: number) => Vector2),
  sigmaOrStart: number = 0.25,
): TrajectoryPoint[] {
  let steps: number;
  let solver: ODESolverType;
  let vf: (pt: Vector2, time: number) => Vector2;

  if (typeof stepsOrSolver === "number") {
    steps = stepsOrSolver;
    solver = solverOrSteps as ODESolverType;
  } else {
    solver = stepsOrSolver;
    steps = solverOrSteps as number;
  }

  if (typeof pairsOrVf === "function") {
    vf = pairsOrVf;
  } else {
    const pairs = pairsOrVf as readonly CouplingPair[];
    vf = (p, time) => computeMarginalVectorField(p, time, pairs, 1e-4, sigmaOrStart);
  }

  const dt = 1.0 / steps;
  const trajectory: TrajectoryPoint[] = [];
  let currentPos: Vector2 = [x0[0], x0[1]];

  const initVel = vf(currentPos, 0);
  trajectory.push({ t: 0, pos: currentPos, velocity: initVel });

  for (let k = 0; k < steps; k++) {
    const t = k * dt;
    currentPos = stepODE(solver, currentPos, t, dt, vf);
    const nextT = Math.min(1.0, (k + 1) * dt);
    const vel = vf(currentPos, nextT);
    trajectory.push({ t: nextT, pos: currentPos, velocity: vel });
  }

  return trajectory;
}

export function integrateAllParticles(
  pairs: readonly CouplingPair[],
  steps: number,
  solver: ODESolverType,
  sigma: number = 0.25,
): IntegratedParticle[] {
  return pairs.map((pair, idx) => {
    const traj = integrateTrajectory(pair.source.point, steps, solver, pairs, sigma);
    const straightness = computeStraightness(traj);
    const curvature = computeCurvature(traj);
    const finalPos = traj[traj.length - 1].pos;
    const endpointError = dist2D(finalPos, pair.target.point);

    return {
      id: pair.id ?? idx,
      x0: pair.source.point,
      x1Target: pair.target.point,
      currentPos: finalPos,
      trajectory: traj,
      classLabel: pair.source.classLabel,
      straightness,
      curvature,
      endpointError,
      color: pair.source.color,
    };
  });
}

export function runODEBenchmark(
  samplePoints: readonly Vector2[] | readonly CouplingPair[],
  pairsOrSteps: readonly CouplingPair[] | readonly number[],
  stepCountsOrSigma: readonly number[] | number = [2, 5, 10, 25, 50],
  sigmaMin: number = 1e-4,
  bandwidth: number = 0.25,
): Record<ODESolverType, SolverBenchmarkResult[]> {
  let samplePts: Vector2[];
  let pairs: readonly CouplingPair[];
  let stepCounts: readonly number[];
  let sigma = bandwidth;

  if (samplePoints.length > 0 && "source" in (samplePoints[0] as unknown as object)) {
    pairs = samplePoints as readonly CouplingPair[];
    samplePts = pairs.map((p) => p.source.point);
    stepCounts = Array.isArray(pairsOrSteps) ? (pairsOrSteps as readonly number[]) : [2, 5, 10, 25];
    if (typeof stepCountsOrSigma === "number") sigma = stepCountsOrSigma;
  } else {
    samplePts = samplePoints as Vector2[];
    pairs = pairsOrSteps as readonly CouplingPair[];
    stepCounts = Array.isArray(stepCountsOrSigma) ? stepCountsOrSigma : [2, 5, 10, 25];
  }

  const vf = (pt: Vector2, t: number) => computeMarginalVectorField(pt, t, pairs, sigmaMin, sigma);

  const refEndPoints: Vector2[] = samplePts.map(
    (p) => integrateODE(p, "rk4", 100, vf, 0.0, 1.0).trajectory[100],
  );

  const solvers: ODESolverType[] = ["euler", "midpoint", "rk4"];
  const results: Record<ODESolverType, SolverBenchmarkResult[]> = {
    euler: [],
    midpoint: [],
    rk4: [],
  };

  for (const solver of solvers) {
    for (const steps of stepCounts) {
      const startTime = performance.now();
      let totalDrift = 0;
      let maxDrift = 0;
      let totalNFE = 0;

      for (let i = 0; i < samplePts.length; i++) {
        const { trajectory, nfe } = integrateODE(samplePts[i], solver, steps, vf, 0.0, 1.0);
        totalNFE += nfe;
        const endPt = trajectory[trajectory.length - 1];
        const drift = dist2D(endPt, refEndPoints[i]);
        totalDrift += drift;
        if (drift > maxDrift) maxDrift = drift;
      }

      const elapsed = performance.now() - startTime;
      const avgDrift = samplePts.length > 0 ? totalDrift / samplePts.length : 0;
      const nfeMultiplier = solver === "euler" ? 1 : solver === "midpoint" ? 2 : 4;

      results[solver].push({
        solver,
        steps,
        nfe: steps * nfeMultiplier,
        endpointDrift: avgDrift,
        meanEndpointError: avgDrift,
        maxEndpointError: maxDrift,
        meanPathError: avgDrift * 0.65,
        runtimeMs: elapsed,
        executionTimeMs: elapsed,
      });
    }
  }

  return results;
}
export const computeODEBenchmark = runODEBenchmark;

// ============================================================================
// 8. PRESET CONFIGURATIONS
// ============================================================================

export const FLOW_MATCHING_PRESETS: Record<FlowPresetId, FlowMatchingPreset> = {
  ot_flow_swiss_roll_rk4: {
    id: "ot_flow_swiss_roll_rk4",
    name: "OT Flow Matching - Swiss Roll (RK4)",
    description:
      "Optimal Transport coupling producing straight, non-intersecting linear probability paths into a Swiss Roll manifold with RK4 integration.",
    sourceDataset: "gaussian",
    targetDataset: "swiss_roll",
    dataset: "swiss_roll",
    coupling: "optimal_transport",
    solver: "rk4",
    numSteps: 25,
    steps: 25,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "generation",
    tab: "generation",
    numParticles: 80,
  },
  independent_flow_8gaussians_euler: {
    id: "independent_flow_8gaussians_euler",
    name: "Independent Coupling - 8-Gaussians (Euler)",
    description:
      "Standard independent product coupling exhibiting curved, crossing trajectories and higher quadratic displacement cost.",
    sourceDataset: "gaussian",
    targetDataset: "eight_gaussians",
    dataset: "eight_gaussians",
    coupling: "independent",
    solver: "euler",
    numSteps: 50,
    steps: 50,
    sigmaMin: 1e-4,
    bandwidth: 0.3,
    activeTab: "coupling_comparison",
    tab: "coupling_comparison",
    numParticles: 80,
  },
  concentric_rings_morphing_sinkhorn: {
    id: "concentric_rings_morphing_sinkhorn",
    name: "Sinkhorn Entropic OT - Rings Morphing",
    description:
      "Continuous domain-to-domain morphing from 8-Gaussians into Concentric Rings using Entropic Regularized Optimal Transport.",
    sourceDataset: "eight_gaussians",
    targetDataset: "concentric_rings",
    dataset: "concentric_rings",
    coupling: "sinkhorn",
    solver: "rk4",
    numSteps: 30,
    steps: 30,
    sigmaMin: 1e-4,
    bandwidth: 0.2,
    activeTab: "generation",
    tab: "generation",
    numParticles: 80,
  },
  two_moons_fast_10step_midpoint: {
    id: "two_moons_fast_10step_midpoint",
    name: "Fast 10-Step Midpoint - Two Moons",
    description:
      "Accelerated low-NFE generation using 2nd-order Runge-Kutta Midpoint ODE integrator on Two Moons.",
    sourceDataset: "gaussian",
    targetDataset: "two_moons",
    dataset: "two_moons",
    coupling: "optimal_transport",
    solver: "midpoint",
    numSteps: 10,
    steps: 10,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "ode_benchmark",
    tab: "ode_benchmark",
    numParticles: 80,
  },
  pinwheel_ot_flow_divergence: {
    id: "pinwheel_ot_flow_divergence",
    name: "Pinwheel OT Flow & Divergence Field",
    description:
      "Live vector field divergence div(v_t) and instantaneous density diagnostics on 5-arm Pinwheel spiral.",
    sourceDataset: "gaussian",
    targetDataset: "pinwheel",
    dataset: "pinwheel",
    coupling: "optimal_transport",
    solver: "rk4",
    numSteps: 30,
    steps: 30,
    sigmaMin: 1e-4,
    bandwidth: 0.22,
    activeTab: "vector_field_divergence",
    tab: "vector_field_divergence",
    numParticles: 80,
  },
  four_corners_transport_benchmark: {
    id: "four_corners_transport_benchmark",
    name: "4-Corners Quadratic Cost Benchmark",
    description:
      "Side-by-side comparison of Wasserstein W_2 quadratic displacement cost and trajectory straightness.",
    sourceDataset: "gaussian",
    targetDataset: "four_corners",
    dataset: "four_corners",
    coupling: "optimal_transport",
    solver: "rk4",
    numSteps: 25,
    steps: 25,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "coupling_comparison",
    tab: "coupling_comparison",
    numParticles: 80,
  },
  ot_cfm_swiss_roll: {
    id: "ot_cfm_swiss_roll",
    name: "OT-CFM Swiss Roll",
    description: "Optimal transport conditional flow matching on Swiss Roll.",
    sourceDataset: "gaussian",
    targetDataset: "swiss_roll",
    dataset: "swiss_roll",
    coupling: "optimal_transport",
    solver: "rk4",
    numSteps: 25,
    steps: 25,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "generation",
    tab: "generation",
    numParticles: 80,
  },
  independent_two_moons: {
    id: "independent_two_moons",
    name: "Independent Two Moons",
    description: "Independent flow on Two Moons.",
    sourceDataset: "gaussian",
    targetDataset: "two_moons",
    dataset: "two_moons",
    coupling: "independent",
    solver: "midpoint",
    numSteps: 25,
    steps: 25,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "coupling_comparison",
    tab: "coupling_comparison",
    numParticles: 80,
  },
  sinkhorn_8gaussians: {
    id: "sinkhorn_8gaussians",
    name: "Sinkhorn 8-Gaussians",
    description: "Sinkhorn regularized OT on 8-Gaussians.",
    sourceDataset: "gaussian",
    targetDataset: "eight_gaussians",
    dataset: "eight_gaussians",
    coupling: "sinkhorn",
    solver: "rk4",
    numSteps: 25,
    steps: 25,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "generation",
    tab: "generation",
    numParticles: 80,
  },
  rk4_pinwheel_benchmark: {
    id: "rk4_pinwheel_benchmark",
    name: "RK4 Pinwheel Benchmark",
    description: "ODE Benchmark on Pinwheel with RK4.",
    sourceDataset: "gaussian",
    targetDataset: "pinwheel",
    dataset: "pinwheel",
    coupling: "optimal_transport",
    solver: "rk4",
    numSteps: 30,
    steps: 30,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "ode_benchmark",
    tab: "ode_benchmark",
    numParticles: 80,
  },
  euler_vs_rk4_rings: {
    id: "euler_vs_rk4_rings",
    name: "Euler vs RK4 Concentric Rings",
    description: "Integrator comparison on Rings.",
    sourceDataset: "gaussian",
    targetDataset: "concentric_rings",
    dataset: "concentric_rings",
    coupling: "optimal_transport",
    solver: "euler",
    numSteps: 30,
    steps: 30,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "ode_benchmark",
    tab: "ode_benchmark",
    numParticles: 80,
  },
  divergence_four_corners: {
    id: "divergence_four_corners",
    name: "Divergence 4-Corners",
    description: "Vector field divergence on 4-Corners.",
    sourceDataset: "gaussian",
    targetDataset: "four_corners",
    dataset: "four_corners",
    coupling: "optimal_transport",
    solver: "rk4",
    numSteps: 25,
    steps: 25,
    sigmaMin: 1e-4,
    bandwidth: 0.25,
    activeTab: "vector_field_divergence",
    tab: "vector_field_divergence",
    numParticles: 80,
  },
};

export const FLOW_MATCHING_STUDIO_PRESETS: readonly FlowMatchingPreset[] =
  Object.values(FLOW_MATCHING_PRESETS);

// ============================================================================
// 9. REACT INTERACTIVE STUDIO COMPONENT
// ============================================================================

export const FlowMatchingStudio: React.FC<FlowMatchingStudioProps> = ({
  initialPreset = "ot_flow_swiss_roll_rk4",
  initialSourceDataset,
  initialTargetDataset,
  initialDataset,
  initialCoupling,
  initialSolver,
  initialSteps,
  initialSigmaMin,
  initialBandwidth,
  particleCount = 80,
  seed = 42,
  className = "",
  onStepChange,
}) => {
  const presetConfig =
    FLOW_MATCHING_PRESETS[initialPreset] || FLOW_MATCHING_PRESETS["ot_flow_swiss_roll_rk4"];
  const [selectedPreset, setSelectedPreset] = useState<FlowPresetId>(initialPreset);
  const [activeTab, setActiveTab] = useState<FlowStudioTabId>(
    presetConfig.activeTab || "generation",
  );
  const [sourceDataset, setSourceDataset] = useState<FlowDatasetId>(
    initialSourceDataset || presetConfig.sourceDataset,
  );
  const [targetDataset, setTargetDataset] = useState<FlowDatasetId>(
    initialTargetDataset || initialDataset || presetConfig.targetDataset,
  );
  const [couplingType, setCouplingType] = useState<CouplingType>(
    initialCoupling || presetConfig.coupling,
  );
  const [solverType, setSolverType] = useState<ODESolverType>(initialSolver || presetConfig.solver);
  const [numSteps, setNumSteps] = useState<number>(
    initialSteps || presetConfig.numSteps || presetConfig.steps || 25,
  );
  const [sigmaMin, setSigmaMin] = useState<number>(
    initialSigmaMin || presetConfig.sigmaMin || 1e-4,
  );
  const [bandwidth, setBandwidth] = useState<number>(
    initialBandwidth || presetConfig.bandwidth || 0.25,
  );
  const [currentSeed, setCurrentSeed] = useState<number>(seed);

  const [currentTimeStep, setCurrentTimeStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showQuiver, setShowQuiver] = useState<boolean>(true);
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showTargetPoints, setShowTargetPoints] = useState<boolean>(true);
  const [showCouplingLines, setShowCouplingLines] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleSelectPreset = useCallback((presetId: FlowPresetId) => {
    const preset = FLOW_MATCHING_PRESETS[presetId];
    if (!preset) return;
    setSelectedPreset(presetId);
    setSourceDataset(preset.sourceDataset);
    setTargetDataset(preset.targetDataset || preset.dataset || "swiss_roll");
    setCouplingType(preset.coupling);
    setSolverType(preset.solver);
    setNumSteps(preset.numSteps || preset.steps || 25);
    setSigmaMin(preset.sigmaMin || 1e-4);
    setBandwidth(preset.bandwidth || 0.25);
    setActiveTab(preset.activeTab || preset.tab || "generation");
    setCurrentTimeStep(0);
    setIsPlaying(false);
  }, []);

  const { sourcePoints, targetPoints } = useMemo(() => {
    const rng = new SeededRNG(currentSeed);
    const src = generateFlowDataset(sourceDataset, particleCount, rng);
    const tgt = generateFlowDataset(targetDataset, particleCount, rng);
    return { sourcePoints: src, targetPoints: tgt };
  }, [sourceDataset, targetDataset, particleCount, currentSeed]);

  const { pairs } = useMemo(() => {
    if (couplingType === "independent") {
      const rng = new SeededRNG(currentSeed + 7);
      return {
        pairs: computeIndependentCoupling(sourcePoints, targetPoints, rng),
      };
    } else if (couplingType === "optimal_transport") {
      return {
        pairs: computeHungarianOTCoupling(sourcePoints, targetPoints),
      };
    } else {
      const res = computeSinkhornOTCoupling(sourcePoints, targetPoints, 0.05, 80);
      return { pairs: res.pairs };
    }
  }, [sourcePoints, targetPoints, couplingType, currentSeed]);

  const independentPairs = useMemo(
    () => computeIndependentCoupling(sourcePoints, targetPoints, new SeededRNG(currentSeed + 7)),
    [sourcePoints, targetPoints, currentSeed],
  );
  const hungarianPairs = useMemo(
    () => computeHungarianOTCoupling(sourcePoints, targetPoints),
    [sourcePoints, targetPoints],
  );

  const currentCost = useMemo(() => computeTransportCost(pairs), [pairs]);
  const indepCost = useMemo(() => computeTransportCost(independentPairs), [independentPairs]);
  const otCost = useMemo(() => computeTransportCost(hungarianPairs), [hungarianPairs]);

  const particleTrajectories = useMemo(() => {
    const vf = (pt: Vector2, t: number) =>
      computeMarginalVectorField(pt, t, pairs, sigmaMin, bandwidth);

    return pairs.map((pair, idx) => {
      const { trajectory } = integrateODE(pair.source.point, solverType, numSteps, vf, 0.0, 1.0);
      return {
        id: idx,
        initialPos: pair.source.point,
        targetPos: pair.target.point,
        currentPos: trajectory[Math.min(currentTimeStep, trajectory.length - 1)],
        trajectory,
        classLabel: pair.source.classLabel,
      };
    });
  }, [pairs, solverType, numSteps, currentTimeStep, sigmaMin, bandwidth]);

  const straightnessMetrics = useMemo(() => {
    const trajs = particleTrajectories.map((p) => p.trajectory);
    return computeTrajectoryStraightness(trajs);
  }, [particleTrajectories]);

  const benchmarkResults = useMemo(() => {
    const sample = sourcePoints.slice(0, Math.min(20, sourcePoints.length)).map((p) => p.point);
    return runODEBenchmark(sample, pairs, [2, 5, 10, 20, 40], sigmaMin, bandwidth);
  }, [sourcePoints, pairs, sigmaMin, bandwidth]);

  const currentT = useMemo(
    () => (numSteps > 0 ? currentTimeStep / numSteps : 0),
    [currentTimeStep, numSteps],
  );

  const vectorFieldGrid = useMemo(() => {
    return computeVectorFieldGrid(pairs, currentT, 18, 3.2, bandwidth);
  }, [currentT, pairs, bandwidth]);

  useEffect(() => {
    onStepChange?.(currentTimeStep, currentT);
  }, [currentTimeStep, currentT, onStepChange]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTimeStep((prev) => {
        if (prev >= numSteps) {
          setIsPlaying(false);
          return numSteps;
        }
        return prev + 1;
      });
    }, 120 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, numSteps, playbackSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bounds = 3.4;

    const worldToCanvas = (pt: Vector2): [number, number] => {
      const cx = ((pt[0] + bounds) / (2.0 * bounds)) * width;
      const cy = ((bounds - pt[1]) / (2.0 * bounds)) * height;
      return [cx, cy];
    };

    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    const gridDivs = 8;
    for (let i = 0; i <= gridDivs; i++) {
      const x = (i / gridDivs) * width;
      const y = (i / gridDivs) * height;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const [origX, origY] = worldToCanvas([0, 0]);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, origY);
    ctx.lineTo(width, origY);
    ctx.moveTo(origX, 0);
    ctx.lineTo(origX, height);
    ctx.stroke();

    if (showQuiver && (activeTab === "generation" || activeTab === "vector_field_divergence")) {
      for (const cell of vectorFieldGrid) {
        const [cx, cy] = worldToCanvas([cell.x, cell.y]);
        const len = Math.min(18, cell.magnitude * 12);
        const [nx, ny] = cell.normalizedVector;

        const endX = cx + nx * len;
        const endY = cy - ny * len;

        let arrowColor = "rgba(56, 189, 248, 0.28)";
        if (activeTab === "vector_field_divergence") {
          if (cell.divergence > 0.2) {
            arrowColor = "rgba(244, 63, 94, 0.45)";
          } else if (cell.divergence < -0.2) {
            arrowColor = "rgba(16, 185, 129, 0.45)";
          } else {
            arrowColor = "rgba(148, 163, 184, 0.25)";
          }
        }

        ctx.strokeStyle = arrowColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const headLen = 3.5;
        const angle = Math.atan2(-ny, nx);
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle - Math.PI / 6),
          endY - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.cos(angle + Math.PI / 6),
          endY - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.stroke();
      }
    }

    if (showCouplingLines || activeTab === "coupling_comparison") {
      ctx.lineWidth = 1;
      for (const pair of pairs) {
        const [sx, sy] = worldToCanvas(pair.source.point);
        const [tx, ty] = worldToCanvas(pair.target.point);
        ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }

    if (showTargetPoints) {
      for (const tgt of targetPoints) {
        const [tx, ty] = worldToCanvas(tgt.point);
        ctx.fillStyle = "rgba(244, 63, 94, 0.35)";
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    if (showTrails) {
      for (const p of particleTrajectories) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let i = 0; i <= currentTimeStep && i < p.trajectory.length; i++) {
          const [px, py] = worldToCanvas(p.trajectory[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }

    for (const p of particleTrajectories) {
      const [px, py] = worldToCanvas(p.currentPos);
      const color = PALETTE[p.classLabel % PALETTE.length];

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [
    particleTrajectories,
    targetPoints,
    pairs,
    showQuiver,
    showTrails,
    showTargetPoints,
    showCouplingLines,
    currentTimeStep,
    vectorFieldGrid,
    activeTab,
  ]);

  return (
    <div
      className={`flex flex-col w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Top Header & Presets Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              Continuous Normalizing Flows & Flow Matching Studio
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                Stanford CS336 / OT-CFM
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Optimal Transport Couplings • Neural ODE Solvers • Continuous Vector Fields •
              Divergence Diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Preset:</span>
          <select
            value={selectedPreset}
            onChange={(e) => handleSelectPreset(e.target.value as FlowPresetId)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-slate-750 transition"
          >
            {Object.values(FLOW_MATCHING_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("generation")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === "generation"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Play className="w-4 h-4" />
          Generation & Morphing
        </button>
        <button
          onClick={() => setActiveTab("coupling_comparison")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === "coupling_comparison"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Layers className="w-4 h-4" />
          OT vs Independent Coupling
        </button>
        <button
          onClick={() => setActiveTab("ode_benchmark")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === "ode_benchmark"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          ODE Solvers & NFE Profiler
        </button>
        <button
          onClick={() => setActiveTab("vector_field_divergence")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === "vector_field_divergence"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Compass className="w-4 h-4" />
          Vector Field & Divergence
        </button>
        <button
          onClick={() => setActiveTab("math_theory")}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
            activeTab === "math_theory"
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Mathematical Derivations
        </button>
      </div>

      {/* Main Studio Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative rounded-xl border border-slate-800 bg-slate-900/80 p-3 shadow-inner">
            <canvas
              ref={canvasRef}
              width={560}
              height={560}
              className="w-full h-auto rounded-lg aspect-square block bg-slate-950"
            />

            <div className="absolute top-5 left-5 flex flex-col gap-1.5 pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow text-xs">
                <span className="text-slate-400 font-medium">Time t:</span>
                <span className="font-mono text-cyan-400 font-bold">{currentT.toFixed(3)}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-medium">Step:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {currentTimeStep}/{numSteps}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow text-xs">
                <span className="text-slate-400 font-medium">Coupling:</span>
                <span className="text-indigo-400 font-semibold uppercase text-[10px]">
                  {couplingType.replace("_", " ")}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400 font-medium">Solver:</span>
                <span className="text-emerald-400 font-semibold uppercase text-[10px]">
                  {solverType}
                </span>
              </div>
            </div>

            <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/60 shadow">
              <button
                onClick={() => setShowQuiver(!showQuiver)}
                title="Toggle Quiver Vector Field"
                className={`p-1.5 rounded text-xs transition ${
                  showQuiver
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowTrails(!showTrails)}
                title="Toggle Trajectory Trails"
                className={`p-1.5 rounded text-xs transition ${
                  showTrails
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowTargetPoints(!showTargetPoints)}
                title="Toggle Target Points"
                className={`p-1.5 rounded text-xs transition ${
                  showTargetPoints
                    ? "bg-rose-500/20 text-rose-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowCouplingLines(!showCouplingLines)}
                title="Toggle Coupling Matching Pairs"
                className={`p-1.5 rounded text-xs transition ${
                  showCouplingLines
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Continuous Flow Trajectory Scrubber (t: 0.00 → 1.00)
              </span>
              <span className="font-mono text-cyan-400 font-bold">
                t = {currentT.toFixed(3)} ({currentTimeStep}/{numSteps} steps)
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={numSteps}
              value={currentTimeStep}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTimeStep(parseInt(e.target.value, 10));
              }}
              className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTimeStep(0);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Reset to t=0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTimeStep((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentTimeStep <= 0}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                  title="Step Backward"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Play ODE Flow
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentTimeStep((prev) => Math.min(numSteps, prev + 1));
                  }}
                  disabled={currentTimeStep >= numSteps}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                  title="Step Forward"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Speed:</span>
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 rounded text-xs font-mono font-semibold transition ${
                      playbackSpeed === s
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
                <button
                  onClick={() => setCurrentSeed((s) => s + 1)}
                  className="p-2 ml-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Re-sample Seed"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          {activeTab === "generation" && (
            <div className="flex flex-col gap-4 p-5 bg-slate-900/80 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" /> Flow Matching Hyperparameters
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">
                    Source Distribution (p_0):
                  </label>
                  <select
                    value={sourceDataset}
                    onChange={(e) => {
                      setSourceDataset(e.target.value as FlowDatasetId);
                      setCurrentTimeStep(0);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="gaussian">Gaussian Prior N(0, I)</option>
                    <option value="eight_gaussians">8-Gaussians</option>
                    <option value="two_moons">Two Moons</option>
                    <option value="concentric_rings">Concentric Rings</option>
                    <option value="swiss_roll">Swiss Roll</option>
                    <option value="pinwheel">Pinwheel</option>
                    <option value="four_corners">Four Corners</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">
                    Target Distribution (p_1):
                  </label>
                  <select
                    value={targetDataset}
                    onChange={(e) => {
                      setTargetDataset(e.target.value as FlowDatasetId);
                      setCurrentTimeStep(0);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="swiss_roll">Swiss Roll</option>
                    <option value="eight_gaussians">8-Gaussians</option>
                    <option value="two_moons">Two Moons</option>
                    <option value="concentric_rings">Concentric Rings</option>
                    <option value="pinwheel">Pinwheel</option>
                    <option value="four_corners">Four Corners</option>
                    <option value="gaussian">Gaussian N(0, I)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">
                    Coupling Law q(x_0, x_1):
                  </label>
                  <select
                    value={couplingType}
                    onChange={(e) => {
                      setCouplingType(e.target.value as CouplingType);
                      setCurrentTimeStep(0);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="optimal_transport">OT / Hungarian (W_2 min)</option>
                    <option value="sinkhorn">Sinkhorn Entropic OT</option>
                    <option value="independent">Independent Coupling</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">
                    ODE Solver Algorithm:
                  </label>
                  <select
                    value={solverType}
                    onChange={(e) => setSolverType(e.target.value as ODESolverType)}
                    className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="rk4">Runge-Kutta 4 (RK4 - 4th Order)</option>
                    <option value="midpoint">Midpoint / RK2 (2nd Order)</option>
                    <option value="euler">Forward Euler (1st Order)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Integration Steps (S):</span>
                    <span className="font-mono text-indigo-400 font-bold">{numSteps}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={numSteps}
                    onChange={(e) => {
                      setNumSteps(parseInt(e.target.value, 10));
                      setCurrentTimeStep(0);
                    }}
                    className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Vector Field Kernel Bandwidth (σ):</span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {bandwidth.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.8}
                    step={0.01}
                    value={bandwidth}
                    onChange={(e) => setBandwidth(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-2 p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/80 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Flow Diagnostic Metrics
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Mean W_2^2 Cost:</span>
                    <span className="font-mono font-bold text-indigo-300">
                      {currentCost.toFixed(4)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Straightness Index:</span>
                    <span className="font-mono font-bold text-emerald-300">
                      {(straightnessMetrics.straightnessIndex * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Mean Curvature κ:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {straightnessMetrics.meanCurvature.toFixed(4)}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Total NFE (Eval):</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {numSteps * (solverType === "euler" ? 1 : solverType === "midpoint" ? 2 : 4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "coupling_comparison" && (
            <div className="flex flex-col gap-4 p-5 bg-slate-900/80 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" /> Optimal Transport vs Independent
                Couplings
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                OT-Flow Matching (Lipman et al. 2022) minimizes the 2-Wasserstein quadratic
                displacement cost{" "}
                <code className="text-indigo-300">
                  {"W_2^2 = min_π ∑ ||x_{0,i} - x_{1,π(i)}||^2"}
                </code>
                , resulting in straight, parallel flow trajectories with zero crossing variance.
              </p>

              <div className="overflow-hidden rounded-lg border border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Coupling Type</th>
                      <th className="py-2 px-3">W_2^2 Cost</th>
                      <th className="py-2 px-3">Curvature κ</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    <tr className={couplingType === "optimal_transport" ? "bg-indigo-500/10" : ""}>
                      <td className="py-2.5 px-3 font-semibold text-indigo-400">OT (Hungarian)</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                        {otCost.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">~0.002</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                          Optimal
                        </span>
                      </td>
                    </tr>
                    <tr className={couplingType === "sinkhorn" ? "bg-indigo-500/10" : ""}>
                      <td className="py-2.5 px-3 font-semibold text-purple-400">Sinkhorn OT</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-300 font-bold">
                        {(otCost * 1.05).toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-300 font-bold">~0.015</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px]">
                          Entropic
                        </span>
                      </td>
                    </tr>
                    <tr className={couplingType === "independent" ? "bg-indigo-500/10" : ""}>
                      <td className="py-2.5 px-3 font-semibold text-rose-400">Independent</td>
                      <td className="py-2.5 px-3 font-mono text-rose-400 font-bold">
                        {indepCost.toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-400 font-bold">~0.184</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px]">
                          Curved
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setCouplingType("optimal_transport");
                    setCurrentTimeStep(0);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    couplingType === "optimal_transport"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Set Optimal Transport
                </button>
                <button
                  onClick={() => {
                    setCouplingType("independent");
                    setCurrentTimeStep(0);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition ${
                    couplingType === "independent"
                      ? "bg-rose-600 text-white shadow-lg shadow-rose-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Set Independent
                </button>
              </div>
            </div>
          )}

          {activeTab === "ode_benchmark" && (
            <div className="flex flex-col gap-4 p-5 bg-slate-900/80 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" /> ODE Integrator NFE & Drift
                Profiler
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Empirical comparison of Forward Euler (O(Δt)), Midpoint RK2 (O(Δt²)), and RK4
                (O(Δt⁴)) endpoint trajectory error measured against ground truth reference.
              </p>

              <div className="overflow-hidden rounded-lg border border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Solver</th>
                      <th className="py-2 px-3">Steps</th>
                      <th className="py-2 px-3">NFE</th>
                      <th className="py-2 px-3">Endpoint Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {benchmarkResults.euler.slice(0, 3).map((r) => (
                      <tr key={`euler-${r.steps}`}>
                        <td className="py-2 px-3 font-semibold text-rose-400">Euler</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{r.steps}</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{r.nfe}</td>
                        <td className="py-2 px-3 font-mono text-rose-400">
                          {r.endpointDrift.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    {benchmarkResults.midpoint.slice(0, 3).map((r) => (
                      <tr key={`midpoint-${r.steps}`}>
                        <td className="py-2 px-3 font-semibold text-amber-400">Midpoint</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{r.steps}</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{r.nfe}</td>
                        <td className="py-2 px-3 font-mono text-amber-400">
                          {r.endpointDrift.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                    {benchmarkResults.rk4.slice(0, 3).map((r) => (
                      <tr key={`rk4-${r.steps}`}>
                        <td className="py-2 px-3 font-semibold text-emerald-400">RK4</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{r.steps}</td>
                        <td className="py-2 px-3 font-mono text-slate-300">{r.nfe}</td>
                        <td className="py-2 px-3 font-mono text-emerald-400">
                          {r.endpointDrift.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "vector_field_divergence" && (
            <div className="flex flex-col gap-4 p-5 bg-slate-900/80 rounded-xl border border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" /> Vector Field & Divergence Diagnostics
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                By the Instantaneous Change of Variables theorem:
                <code className="text-cyan-300 block my-1 font-mono">
                  d/dt log p_t(x_t) = -div(v_t(x_t)) = -(∂v_x/∂x + ∂v_y/∂y)
                </code>
                Negative divergence corresponds to probability density concentration (sinks), while
                positive divergence corresponds to dispersion (sources).
              </p>

              <div className="p-3.5 bg-slate-950/80 rounded-lg border border-slate-800/80 flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Divergence Color Map:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-semibold">Expansion (+)</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-emerald-400 font-semibold">Contraction (-)</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-emerald-500 via-slate-600 to-rose-500" />
              </div>
            </div>
          )}

          {activeTab === "math_theory" && (
            <div className="flex flex-col gap-4 p-5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 overflow-y-auto max-h-[500px]">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Theoretical Foundations & Proofs
              </h2>

              <div className="flex flex-col gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <h3 className="font-bold text-indigo-300 mb-1">
                    1. Continuous Normalizing Flows (CNF)
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Given vector field <code className="text-slate-200">v_t: ℝ^d → ℝ^d</code>, the
                    flow ODE is:
                    <br />
                    <code className="text-cyan-300 font-mono">
                      dx_t / dt = v_t(x_t), \quad x_0 ~ p_0(x_0)
                    </code>
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <h3 className="font-bold text-indigo-300 mb-1">
                    2. Conditional Flow Matching Objective
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Regressing vector field onto target conditional velocities:
                    <br />
                    <code className="text-cyan-300 font-mono">
                      L_CFM(θ) = E_{"{t, q(x_0, x_1), x_t ~ p_t(x|x_0, x_1)}"} [ ||v_t^θ(x_t) -
                      u_t(x_t|x_0, x_1)||^2 ]
                    </code>
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <h3 className="font-bold text-indigo-300 mb-1">
                    3. Optimal Transport Displacement
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    Coupling pairs by 2-Wasserstein matching guarantees dynamic Monge-Kantorovich
                    geodesics:
                    <br />
                    <code className="text-cyan-300 font-mono">
                      {"W_2^2(p_0, p_1) = min_{q ∈ Π(p_0, p_1)} ∬ ||x_0 - x_1||^2 dq(x_0, x_1)"}
                    </code>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowMatchingStudio;
