import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Database,
  Cpu,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkles,
  Crosshair,
  Grid,
  Zap,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type DistanceMetric = "l2" | "cosine" | "dot" | "manhattan";

export type RetrievalAlgorithm = "flat" | "kd_tree" | "ivf" | "pq" | "hnsw";

export type DatasetDistribution =
  | "gaussian_clusters"
  | "uniform"
  | "concentric_rings"
  | "swiss_roll"
  | "adversarial_hubness";

export interface VectorPoint {
  readonly id: string;
  readonly vector: readonly number[];
  readonly label?: string;
  readonly clusterId?: number;
  readonly subQuantCodes?: readonly number[];
  readonly color?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface DatasetConfig {
  readonly distribution: DatasetDistribution;
  readonly numPoints: number;
  readonly dimensions: number;
  readonly numClusters?: number;
  readonly noise?: number;
  readonly range?: number;
  readonly seed?: number;
}

export type SearchTraceAction =
  | "init"
  | "compute_distance"
  | "visit_node"
  | "prune_branch"
  | "probe_cluster"
  | "layer_hop"
  | "layer_switch"
  | "adc_table_lookup"
  | "candidate_update"
  | "finalize";

export interface SearchTraceStep {
  readonly stepIndex: number;
  readonly action: SearchTraceAction;
  readonly pointId?: string;
  readonly clusterId?: number;
  readonly layer?: number;
  readonly distance?: number;
  readonly bestDistances?: readonly { id: string; dist: number }[];
  readonly visitedCount: number;
  readonly distCompsCount: number;
  readonly description: string;
  readonly activeCoords?: readonly number[];
  readonly boundingArea?: { minX: number; maxX: number; minY: number; maxY: number };
  readonly highlightEdge?: readonly [string, string];
}

export interface NeighborCandidate {
  readonly point: VectorPoint;
  readonly distance: number;
  readonly rank: number;
}

export interface SearchResult {
  readonly neighbors: readonly NeighborCandidate[];
  readonly distanceComputations: number;
  readonly visitedNodesCount: number;
  readonly traceSteps: readonly SearchTraceStep[];
  readonly latencyMs?: number;
  readonly recall?: number;
}

// K-D Tree Structure
export interface BoundingBox2D {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface KDNode {
  readonly point: VectorPoint;
  readonly splitAxis: number;
  readonly splitValue: number;
  readonly left: KDNode | null;
  readonly right: KDNode | null;
  readonly bbox: BoundingBox2D;
  readonly depth: number;
}

// IVF Structure
export interface IVFClusterCentroid {
  readonly id: number;
  readonly vector: readonly number[];
  readonly color: string;
}

export interface IVFIndex {
  readonly centroids: readonly IVFClusterCentroid[];
  readonly invertedLists: ReadonlyMap<number, readonly VectorPoint[]>;
  readonly nlist: number;
  readonly metric: DistanceMetric;
  readonly points: readonly VectorPoint[];
}

// Product Quantization Structure
export interface PQIndex {
  readonly codebooks: readonly (readonly (readonly number[])[])[]; // [M][Ks][d_sub]
  readonly points: readonly VectorPoint[];
  readonly M: number;
  readonly Ks: number;
  readonly subDim: number;
  readonly metric: DistanceMetric;
}

// HNSW Structure
export interface HNSWNode {
  readonly point: VectorPoint;
  readonly layer: number;
  readonly neighbors: ReadonlyMap<number, readonly string[]>; // layer -> list of target point ids
}

export interface HNSWIndex {
  readonly nodes: ReadonlyMap<string, HNSWNode>;
  readonly entryPointId: string | null;
  readonly maxLayer: number;
  readonly M: number;
  readonly efConstruction: number;
  readonly mL: number;
  readonly metric: DistanceMetric;
  readonly points: readonly VectorPoint[];
}

export interface BenchmarkPoint {
  readonly paramValue: number;
  readonly recall: number;
  readonly distanceComputations: number;
  readonly latencyEstimateMs: number;
}

export type PresetId =
  | "semantic_text"
  | "image_ivf_pq"
  | "spatial_gis"
  | "flat_golden"
  | "adversarial_hubness";

export interface VectorDBPreset {
  readonly id: PresetId;
  readonly name: string;
  readonly description: string;
  readonly algorithm: RetrievalAlgorithm;
  readonly metric: DistanceMetric;
  readonly distribution: DatasetDistribution;
  readonly numPoints: number;
  readonly k: number;
  readonly query: readonly number[];
  readonly nlist?: number;
  readonly nprobe?: number;
  readonly hnswM?: number;
  readonly efSearch?: number;
  readonly pqM?: number;
  readonly pqKs?: number;
  readonly theoryNotes: string;
}

export interface VectorDBRetrievalWorkbenchProps {
  readonly initialAlgorithm?: RetrievalAlgorithm;
  readonly initialMetric?: DistanceMetric;
  readonly initialK?: number;
  readonly initialPreset?: PresetId;
  readonly className?: string;
  readonly title?: string;
  readonly standalone?: boolean;
  readonly onQueryChange?: (query: readonly number[]) => void;
  readonly onAlgorithmChange?: (algo: RetrievalAlgorithm) => void;
}

// ============================================================================
// 2. MATHEMATICAL & DISTANCE FUNCTIONS
// ============================================================================

export function euclideanDistance(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function cosineDistance(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA < 1e-12 || normB < 1e-12) return 1.0;
  const cosSim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  const clamped = Math.min(1.0, Math.max(-1.0, cosSim));
  return 1.0 - clamped;
}

export function dotProductSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

export function manhattanDistance(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum;
}

export function computeDistance(
  a: readonly number[],
  b: readonly number[],
  metric: DistanceMetric,
): number {
  switch (metric) {
    case "l2":
      return euclideanDistance(a, b);
    case "cosine":
      return cosineDistance(a, b);
    case "dot":
      // For ranking where smaller is closer, use negative dot product
      return -dotProductSimilarity(a, b);
    case "manhattan":
      return manhattanDistance(a, b);
    default:
      return euclideanDistance(a, b);
  }
}

// Pseudo-Random Number Generator (Mulberry32)
function createRNG(seed = 42) {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleGaussian(rng: () => number, mean = 0, stdev = 1): number {
  const u1 = Math.max(1e-15, rng());
  const u2 = rng();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * stdev;
}

const CLUSTER_COLORS = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ec4899", // pink
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#14b8a6", // teal
];

// ============================================================================
// 3. DATASET GENERATORS
// ============================================================================

export function generateVectorDataset(config: DatasetConfig): VectorPoint[] {
  const rng = createRNG(config.seed ?? 12345);
  const points: VectorPoint[] = [];
  const count = Math.max(4, config.numPoints);
  const range = config.range ?? 4.0;
  const noise = config.noise ?? 0.2;

  switch (config.distribution) {
    case "gaussian_clusters": {
      const numClusters = config.numClusters ?? 4;
      const centers: [number, number][] = [];
      for (let c = 0; c < numClusters; c++) {
        const angle = (2 * Math.PI * c) / numClusters;
        const radius = range * 0.65;
        centers.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }

      for (let i = 0; i < count; i++) {
        const clusterId = i % numClusters;
        const center = centers[clusterId];
        const x = center[0] + sampleGaussian(rng, 0, noise * 1.5);
        const y = center[1] + sampleGaussian(rng, 0, noise * 1.5);
        points.push({
          id: `p_${i}`,
          vector: [round4(x), round4(y)],
          clusterId,
          label: `Cluster ${clusterId + 1}`,
          color: CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length],
        });
      }
      break;
    }

    case "uniform": {
      for (let i = 0; i < count; i++) {
        const x = (rng() * 2 - 1) * range;
        const y = (rng() * 2 - 1) * range;
        points.push({
          id: `p_${i}`,
          vector: [round4(x), round4(y)],
          label: `Item ${i}`,
          color: "#64748b",
        });
      }
      break;
    }

    case "concentric_rings": {
      const rings = 3;
      for (let i = 0; i < count; i++) {
        const ringIdx = i % rings;
        const baseRadius = (range * (ringIdx + 1)) / (rings + 0.5);
        const angle = rng() * 2 * Math.PI;
        const r = baseRadius + sampleGaussian(rng, 0, noise * 0.8);
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        points.push({
          id: `p_${i}`,
          vector: [round4(x), round4(y)],
          clusterId: ringIdx,
          label: `Ring ${ringIdx + 1}`,
          color: CLUSTER_COLORS[ringIdx % CLUSTER_COLORS.length],
        });
      }
      break;
    }

    case "swiss_roll": {
      for (let i = 0; i < count; i++) {
        const t = 1.5 * Math.PI * (1 + 2 * (i / count));
        const x = (t * Math.cos(t)) / 2.5 + sampleGaussian(rng, 0, noise * 0.5);
        const y = (t * Math.sin(t)) / 2.5 + sampleGaussian(rng, 0, noise * 0.5);
        const clusterId = Math.floor((t / (4.5 * Math.PI)) * 4);
        points.push({
          id: `p_${i}`,
          vector: [round4(x), round4(y)],
          clusterId,
          label: `Spiral ${i}`,
          color: CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length],
        });
      }
      break;
    }

    case "adversarial_hubness": {
      // Hub points clustered densely at center, outlier filament points around perimeter
      const hubRatio = 0.4;
      const numHubs = Math.floor(count * hubRatio);
      for (let i = 0; i < count; i++) {
        if (i < numHubs) {
          // dense hub
          const x = sampleGaussian(rng, 0, 0.3);
          const y = sampleGaussian(rng, 0, 0.3);
          points.push({
            id: `p_${i}`,
            vector: [round4(x), round4(y)],
            clusterId: 0,
            label: "Hub Core",
            color: "#f43f5e",
          });
        } else {
          // outer filament
          const angle = rng() * 2 * Math.PI;
          const r = range * 0.85 + sampleGaussian(rng, 0, noise * 1.2);
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          points.push({
            id: `p_${i}`,
            vector: [round4(x), round4(y)],
            clusterId: 1,
            label: "Perimeter",
            color: "#06b6d4",
          });
        }
      }
      break;
    }
  }

  return points;
}

function round4(val: number): number {
  return Math.round(val * 10000) / 10000;
}

// ============================================================================
// 4. RETRIEVAL ALGORITHMS & STEP TRACERS
// ============================================================================

// 4.1 Flat Scan (Brute Force Exact Search)
export function flatScanSearch(
  query: readonly number[],
  dataset: readonly VectorPoint[],
  k: number,
  metric: DistanceMetric,
): SearchResult {
  const traces: SearchTraceStep[] = [];
  let distComps = 0;

  traces.push({
    stepIndex: 0,
    action: "init",
    visitedCount: 0,
    distCompsCount: 0,
    description: `Initiated Flat Scan baseline for top-${k} retrieval across ${dataset.length} vectors.`,
    activeCoords: query,
  });

  const candidates: { point: VectorPoint; distance: number }[] = [];

  for (let i = 0; i < dataset.length; i++) {
    const pt = dataset[i];
    const dist = computeDistance(query, pt.vector, metric);
    distComps++;
    candidates.push({ point: pt, distance: dist });

    // Record sample trace steps
    if (
      i < 15 ||
      i === dataset.length - 1 ||
      i % Math.max(1, Math.floor(dataset.length / 10)) === 0
    ) {
      traces.push({
        stepIndex: traces.length,
        action: "compute_distance",
        pointId: pt.id,
        distance: round4(dist),
        visitedCount: i + 1,
        distCompsCount: distComps,
        description: `Evaluated ${pt.id} [${pt.vector.join(", ")}]: distance = ${round4(dist)}`,
        activeCoords: pt.vector,
      });
    }
  }

  // Sort ascending by distance
  candidates.sort((a, b) => a.distance - b.distance);
  const topK = candidates.slice(0, k).map((item, idx) => ({
    point: item.point,
    distance: item.distance,
    rank: idx + 1,
  }));

  traces.push({
    stepIndex: traces.length,
    action: "finalize",
    visitedCount: dataset.length,
    distCompsCount: distComps,
    bestDistances: topK.map((c) => ({ id: c.point.id, dist: round4(c.distance) })),
    description: `Completed Flat Scan: retrieved exact top-${topK.length} nearest neighbors.`,
  });

  return {
    neighbors: topK,
    distanceComputations: distComps,
    visitedNodesCount: dataset.length,
    traceSteps: traces,
    latencyMs: round4(distComps * 0.0015),
    recall: 1.0,
  };
}

// 4.2 K-D Tree (Spatial Partitioning Tree)
export function buildKDTree(
  points: readonly VectorPoint[],
  depth = 0,
  bbox: BoundingBox2D = { minX: -6, maxX: 6, minY: -6, maxY: 6 },
): KDNode | null {
  if (points.length === 0) return null;

  const axis = depth % 2; // 0 for x, 1 for y
  const sorted = [...points].sort((a, b) => a.vector[axis] - b.vector[axis]);
  const medianIdx = Math.floor(sorted.length / 2);
  const medianPt = sorted[medianIdx];
  const splitVal = medianPt.vector[axis];

  let leftBbox: BoundingBox2D;
  let rightBbox: BoundingBox2D;

  if (axis === 0) {
    leftBbox = { ...bbox, maxX: splitVal };
    rightBbox = { ...bbox, minX: splitVal };
  } else {
    leftBbox = { ...bbox, maxY: splitVal };
    rightBbox = { ...bbox, minY: splitVal };
  }

  const leftPoints = sorted.slice(0, medianIdx);
  const rightPoints = sorted.slice(medianIdx + 1);

  return {
    point: medianPt,
    splitAxis: axis,
    splitValue: splitVal,
    depth,
    bbox,
    left: buildKDTree(leftPoints, depth + 1, leftBbox),
    right: buildKDTree(rightPoints, depth + 1, rightBbox),
  };
}

export function kdTreeSearch(
  root: KDNode | null,
  query: readonly number[],
  k: number,
  metric: DistanceMetric,
): SearchResult {
  const traces: SearchTraceStep[] = [];
  let distComps = 0;
  let visited = 0;
  const bestList: { point: VectorPoint; distance: number }[] = [];

  traces.push({
    stepIndex: 0,
    action: "init",
    visitedCount: 0,
    distCompsCount: 0,
    description: `Initiated K-D Tree spatial branch-and-bound search for top-${k}.`,
    activeCoords: query,
  });

  function insertCandidate(pt: VectorPoint, dist: number) {
    bestList.push({ point: pt, distance: dist });
    bestList.sort((a, b) => a.distance - b.distance);
    if (bestList.length > k) {
      bestList.pop();
    }
  }

  function searchNode(node: KDNode | null) {
    if (!node) return;
    visited++;

    const dist = computeDistance(query, node.point.vector, metric);
    distComps++;
    insertCandidate(node.point, dist);

    traces.push({
      stepIndex: traces.length,
      action: "visit_node",
      pointId: node.point.id,
      distance: round4(dist),
      visitedCount: visited,
      distCompsCount: distComps,
      activeCoords: node.point.vector,
      boundingArea: node.bbox,
      description: `Visited KD node ${node.point.id} (depth ${node.depth}, split axis ${node.splitAxis === 0 ? "X" : "Y"}=${round4(node.splitValue)}). Dist = ${round4(dist)}`,
    });

    const axis = node.splitAxis;
    const qVal = query[axis] ?? 0;
    const diff = qVal - node.splitValue;
    const nearChild = diff <= 0 ? node.left : node.right;
    const farChild = diff <= 0 ? node.right : node.left;

    // Search near branch first
    if (nearChild) {
      searchNode(nearChild);
    }

    // Prune far branch if hyperplane distance exceeds current worst in bestList
    const worstDist = bestList.length >= k ? bestList[bestList.length - 1].distance : Infinity;
    const planeDist = Math.abs(diff);

    // Plane distance pruning is mathematically valid for L2 and Manhattan
    const canPrune =
      bestList.length >= k && (metric === "l2" || metric === "manhattan") && planeDist >= worstDist;

    if (canPrune) {
      traces.push({
        stepIndex: traces.length,
        action: "prune_branch",
        pointId: node.point.id,
        visitedCount: visited,
        distCompsCount: distComps,
        boundingArea: farChild?.bbox ?? node.bbox,
        description: `Pruned opposite KD subtree! Hyperplane distance |${round4(qVal)} - ${round4(node.splitValue)}| = ${round4(planeDist)} >= worst candidate ${round4(worstDist)}.`,
      });
    } else if (farChild) {
      searchNode(farChild);
    }
  }

  searchNode(root);

  const topK: NeighborCandidate[] = bestList.map((item, idx) => ({
    point: item.point,
    distance: item.distance,
    rank: idx + 1,
  }));

  traces.push({
    stepIndex: traces.length,
    action: "finalize",
    visitedCount: visited,
    distCompsCount: distComps,
    bestDistances: topK.map((c) => ({ id: c.point.id, dist: round4(c.distance) })),
    description: `K-D Tree search complete: inspected ${visited} nodes, computed ${distComps} distances.`,
  });

  return {
    neighbors: topK,
    distanceComputations: distComps,
    visitedNodesCount: visited,
    traceSteps: traces,
    latencyMs: round4(distComps * 0.0012),
  };
}

// 4.3 Inverted File Index (IVF with Voronoi Cells)
export function buildIVFIndex(
  points: readonly VectorPoint[],
  nlist: number,
  metric: DistanceMetric = "l2",
  maxIter = 15,
): IVFIndex {
  const actualNlist = Math.max(1, Math.min(nlist, points.length));
  const rng = createRNG(777);

  // Initialize centroids with k-means++ seeding
  const centroids: IVFClusterCentroid[] = [];
  const firstIdx = Math.floor(rng() * points.length);
  centroids.push({
    id: 0,
    vector: [...points[firstIdx].vector],
    color: CLUSTER_COLORS[0 % CLUSTER_COLORS.length],
  });

  for (let c = 1; c < actualNlist; c++) {
    const distSq: number[] = [];
    let sumDistSq = 0;
    for (const pt of points) {
      let minDist = Infinity;
      for (const cent of centroids) {
        const d = computeDistance(pt.vector, cent.vector, metric);
        if (d < minDist) minDist = d;
      }
      const d2 = minDist * minDist;
      distSq.push(d2);
      sumDistSq += d2;
    }

    let rVal = rng() * (sumDistSq || 1);
    let selectedIdx = 0;
    for (let i = 0; i < points.length; i++) {
      rVal -= distSq[i];
      if (rVal <= 0) {
        selectedIdx = i;
        break;
      }
    }

    centroids.push({
      id: c,
      vector: [...points[selectedIdx].vector],
      color: CLUSTER_COLORS[c % CLUSTER_COLORS.length],
    });
  }

  // Run K-Means iterations
  let currentCentroidVectors = centroids.map((c) => [...c.vector]);

  for (let iter = 0; iter < maxIter; iter++) {
    const clusterPoints: number[][][] = Array.from({ length: actualNlist }, () => []);

    for (const pt of points) {
      let bestC = 0;
      let bestDist = Infinity;
      for (let c = 0; c < actualNlist; c++) {
        const d = computeDistance(pt.vector, currentCentroidVectors[c], metric);
        if (d < bestDist) {
          bestDist = d;
          bestC = c;
        }
      }
      clusterPoints[bestC].push([...pt.vector]);
    }

    let shifted = false;
    for (let c = 0; c < actualNlist; c++) {
      const assigned = clusterPoints[c];
      if (assigned.length > 0) {
        const dim = assigned[0].length;
        const newVec: number[] = new Array(dim).fill(0);
        for (const pVec of assigned) {
          for (let d = 0; d < dim; d++) {
            newVec[d] += pVec[d];
          }
        }
        for (let d = 0; d < dim; d++) {
          newVec[d] = round4(newVec[d] / assigned.length);
        }
        if (euclideanDistance(newVec, currentCentroidVectors[c]) > 1e-4) {
          shifted = true;
          currentCentroidVectors[c] = newVec;
        }
      }
    }
    if (!shifted) break;
  }

  // Build final inverted lists
  const finalCentroids: IVFClusterCentroid[] = currentCentroidVectors.map((v, idx) => ({
    id: idx,
    vector: v,
    color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
  }));

  const invertedMap = new Map<number, VectorPoint[]>();
  for (let c = 0; c < actualNlist; c++) {
    invertedMap.set(c, []);
  }

  const assignedPoints: VectorPoint[] = [];

  for (const pt of points) {
    let bestC = 0;
    let bestDist = Infinity;
    for (let c = 0; c < actualNlist; c++) {
      const d = computeDistance(pt.vector, finalCentroids[c].vector, metric);
      if (d < bestDist) {
        bestDist = d;
        bestC = c;
      }
    }
    const updatedPt: VectorPoint = {
      ...pt,
      clusterId: bestC,
      color: finalCentroids[bestC].color,
    };
    assignedPoints.push(updatedPt);
    invertedMap.get(bestC)?.push(updatedPt);
  }

  return {
    centroids: finalCentroids,
    invertedLists: invertedMap,
    nlist: actualNlist,
    metric,
    points: assignedPoints,
  };
}

export function ivfSearch(
  index: IVFIndex,
  query: readonly number[],
  k: number,
  nprobe: number,
  metric: DistanceMetric,
): SearchResult {
  const traces: SearchTraceStep[] = [];
  let distComps = 0;
  let visitedCount = 0;

  const actualNprobe = Math.max(1, Math.min(nprobe, index.nlist));

  traces.push({
    stepIndex: 0,
    action: "init",
    visitedCount: 0,
    distCompsCount: 0,
    description: `Initiated IVF search: nlist=${index.nlist}, nprobe=${actualNprobe}, target k=${k}.`,
    activeCoords: query,
  });

  // Step 1: Compute distance to all centroids
  const centroidDists: { id: number; dist: number; vector: readonly number[] }[] = [];
  for (const cent of index.centroids) {
    const d = computeDistance(query, cent.vector, metric);
    distComps++;
    centroidDists.push({ id: cent.id, dist: d, vector: cent.vector });
  }

  centroidDists.sort((a, b) => a.dist - b.dist);
  const probedCentroids = centroidDists.slice(0, actualNprobe);

  for (const cent of probedCentroids) {
    traces.push({
      stepIndex: traces.length,
      action: "probe_cluster",
      clusterId: cent.id,
      distance: round4(cent.dist),
      visitedCount: visitedCount,
      distCompsCount: distComps,
      activeCoords: cent.vector,
      description: `Probed Voronoi Centroid C${cent.id} (dist=${round4(cent.dist)}). Scanning inverted list with ${index.invertedLists.get(cent.id)?.length ?? 0} vectors.`,
    });
  }

  // Step 2: Scan points in probed inverted lists
  const candidates: { point: VectorPoint; distance: number }[] = [];

  for (const cent of probedCentroids) {
    const bucket = index.invertedLists.get(cent.id) ?? [];
    for (const pt of bucket) {
      visitedCount++;
      const d = computeDistance(query, pt.vector, metric);
      distComps++;
      candidates.push({ point: pt, distance: d });

      if (candidates.length <= 10 || candidates.length % 5 === 0) {
        traces.push({
          stepIndex: traces.length,
          action: "candidate_update",
          pointId: pt.id,
          clusterId: cent.id,
          distance: round4(d),
          visitedCount,
          distCompsCount: distComps,
          activeCoords: pt.vector,
          description: `Checked candidate ${pt.id} in Voronoi cell ${cent.id}: dist=${round4(d)}`,
        });
      }
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const topK = candidates.slice(0, k).map((item, idx) => ({
    point: item.point,
    distance: item.distance,
    rank: idx + 1,
  }));

  traces.push({
    stepIndex: traces.length,
    action: "finalize",
    visitedCount,
    distCompsCount: distComps,
    bestDistances: topK.map((c) => ({ id: c.point.id, dist: round4(c.distance) })),
    description: `IVF search complete: evaluated ${actualNprobe}/${index.nlist} Voronoi cells, computed ${distComps} total distances.`,
  });

  return {
    neighbors: topK,
    distanceComputations: distComps,
    visitedNodesCount: visitedCount,
    traceSteps: traces,
    latencyMs: round4(distComps * 0.001),
  };
}

// 4.4 Product Quantization (PQ with Asymmetric Distance Computation)
export function buildPQIndex(
  points: readonly VectorPoint[],
  M: number,
  Ks: number,
  metric: DistanceMetric = "l2",
  maxIter = 10,
): PQIndex {
  const actualM = Math.max(1, Math.min(M, 2));
  const actualKs = Math.max(2, Math.min(Ks, 16));
  const dim = points[0]?.vector.length ?? 2;
  const subDim = Math.floor(dim / actualM);

  const codebooks: number[][][] = []; // [M][Ks][subDim]
  const rng = createRNG(4321);

  for (let m = 0; m < actualM; m++) {
    const subCentroids: number[][] = [];
    const subPoints = points.map((p) => p.vector.slice(m * subDim, (m + 1) * subDim));

    // Seed centroids
    for (let k = 0; k < actualKs; k++) {
      const idx = Math.floor(rng() * subPoints.length);
      subCentroids.push([...subPoints[idx]]);
    }

    // 1D/sub-dim K-Means
    for (let iter = 0; iter < maxIter; iter++) {
      const assignments: number[][][] = Array.from({ length: actualKs }, () => []);
      for (const sp of subPoints) {
        let bestK = 0;
        let bestD = Infinity;
        for (let k = 0; k < actualKs; k++) {
          const d = euclideanDistance(sp, subCentroids[k]);
          if (d < bestD) {
            bestD = d;
            bestK = k;
          }
        }
        assignments[bestK].push(sp);
      }

      for (let k = 0; k < actualKs; k++) {
        if (assignments[k].length > 0) {
          const newVec = new Array(subDim).fill(0);
          for (const vec of assignments[k]) {
            for (let d = 0; d < subDim; d++) {
              newVec[d] += vec[d];
            }
          }
          for (let d = 0; d < subDim; d++) {
            subCentroids[k][d] = round4(newVec[d] / assignments[k].length);
          }
        }
      }
    }

    codebooks.push(subCentroids);
  }

  // Quantize all points
  const quantizedPoints: VectorPoint[] = points.map((pt) => {
    const codes: number[] = [];
    for (let m = 0; m < actualM; m++) {
      const subVec = pt.vector.slice(m * subDim, (m + 1) * subDim);
      let bestCode = 0;
      let bestDist = Infinity;
      for (let k = 0; k < actualKs; k++) {
        const d = euclideanDistance(subVec, codebooks[m][k]);
        if (d < bestDist) {
          bestDist = d;
          bestCode = k;
        }
      }
      codes.push(bestCode);
    }
    return {
      ...pt,
      subQuantCodes: codes,
    };
  });

  return {
    codebooks,
    points: quantizedPoints,
    M: actualM,
    Ks: actualKs,
    subDim,
    metric,
  };
}

export function computeADCTable(
  query: readonly number[],
  codebooks: readonly (readonly (readonly number[])[])[],
  metric: DistanceMetric,
): number[][] {
  const M = codebooks.length;
  const table: number[][] = [];

  for (let m = 0; m < M; m++) {
    const subDim = codebooks[m][0]?.length ?? 1;
    const qSub = query.slice(m * subDim, (m + 1) * subDim);
    const row: number[] = [];

    for (let k = 0; k < codebooks[m].length; k++) {
      const cent = codebooks[m][k];
      const dist = computeDistance(qSub, cent, metric);
      // For ADC L2, squared distance is additive across orthogonal subspaces
      row.push(metric === "l2" ? dist * dist : dist);
    }
    table.push(row);
  }

  return table;
}

export function pqSearch(index: PQIndex, query: readonly number[], k: number): SearchResult {
  const traces: SearchTraceStep[] = [];
  const M = index.M;
  const Ks = index.Ks;

  // 1. Build ADC Table
  const adcTable = computeADCTable(query, index.codebooks, index.metric);
  const adcComps = M * Ks;

  traces.push({
    stepIndex: 0,
    action: "init",
    visitedCount: 0,
    distCompsCount: adcComps,
    description: `Computed Asymmetric Distance Table (ADC) of size ${M}x${Ks} (${adcComps} sub-vector distance operations).`,
    activeCoords: query,
  });

  // 2. Scan all vectors via ADC lookup
  const candidates: { point: VectorPoint; distance: number }[] = [];

  for (let i = 0; i < index.points.length; i++) {
    const pt = index.points[i];
    const codes = pt.subQuantCodes ?? [0, 0];
    let approxDistSq = 0;

    for (let m = 0; m < M; m++) {
      const code = codes[m] ?? 0;
      approxDistSq += adcTable[m][code] ?? 0;
    }

    const approxDist = index.metric === "l2" ? Math.sqrt(approxDistSq) : approxDistSq;
    candidates.push({ point: pt, distance: round4(approxDist) });

    if (i < 10 || i % Math.max(1, Math.floor(index.points.length / 8)) === 0) {
      traces.push({
        stepIndex: traces.length,
        action: "adc_table_lookup",
        pointId: pt.id,
        distance: round4(approxDist),
        visitedCount: i + 1,
        distCompsCount: adcComps, // no additional vector ops, just table lookups!
        activeCoords: pt.vector,
        description: `ADC Fast Lookup for ${pt.id} [codes: ${codes.join(",")}]: approx dist = ${round4(approxDist)}`,
      });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const topK = candidates.slice(0, k).map((item, idx) => ({
    point: item.point,
    distance: item.distance,
    rank: idx + 1,
  }));

  traces.push({
    stepIndex: traces.length,
    action: "finalize",
    visitedCount: index.points.length,
    distCompsCount: adcComps,
    bestDistances: topK.map((c) => ({ id: c.point.id, dist: round4(c.distance) })),
    description: `PQ ADC Search Complete: ranked ${index.points.length} vectors using only ${adcComps} initial codebook computations!`,
  });

  return {
    neighbors: topK,
    distanceComputations: adcComps,
    visitedNodesCount: index.points.length,
    traceSteps: traces,
    latencyMs: round4(adcComps * 0.0008 + index.points.length * 0.0001),
  };
}

// 4.5 Hierarchical Navigable Small World (HNSW Multi-Layer Graph)
export function buildHNSWIndex(
  points: readonly VectorPoint[],
  M = 4,
  efConstruction = 20,
  mL = 1.0 / Math.log(4),
  metric: DistanceMetric = "l2",
): HNSWIndex {
  const rng = createRNG(999);
  const nodes = new Map<string, HNSWNode>();
  let entryPointId: string | null = null;
  let maxLayer = 0;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    // Assign node layer exponentially: floor(-ln(uniform) * mL)
    const u = Math.max(1e-10, rng());
    const layer = Math.min(3, Math.floor(-Math.log(u) * mL));

    const neighborMap = new Map<number, string[]>();
    for (let l = 0; l <= layer; l++) {
      neighborMap.set(l, []);
    }

    const newNode: HNSWNode = {
      point: pt,
      layer,
      neighbors: neighborMap,
    };
    nodes.set(pt.id, newNode);

    if (i === 0) {
      entryPointId = pt.id;
      maxLayer = layer;
      continue;
    }

    // Connect node into existing graph
    let currObj = entryPointId ? nodes.get(entryPointId) : null;
    if (!currObj) continue;

    // Zoom down from top layer to node's layer
    for (let l = maxLayer; l > layer; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = (currObj.neighbors.get(l) ?? [])
          .map((id) => nodes.get(id))
          .filter(Boolean) as HNSWNode[];
        let bestDist = computeDistance(pt.vector, currObj.point.vector, metric);

        for (const n of neighbors) {
          const d = computeDistance(pt.vector, n.point.vector, metric);
          if (d < bestDist) {
            bestDist = d;
            currObj = n;
            changed = true;
          }
        }
      }
    }

    // Connect at layers from min(maxLayer, layer) down to 0
    const topLevel = Math.min(maxLayer, layer);
    for (let l = topLevel; l >= 0; l--) {
      // Beam search to find nearest neighbors at layer l
      const candidates = new Set<string>([currObj.point.id]);
      const visited = new Set<string>([currObj.point.id]);
      const w: { id: string; dist: number }[] = [
        { id: currObj.point.id, dist: computeDistance(pt.vector, currObj.point.vector, metric) },
      ];

      while (candidates.size > 0) {
        // Find closest in candidates
        let cBestId: string | null = null;
        let cBestDist = Infinity;
        for (const cId of candidates) {
          const cNode = nodes.get(cId);
          if (!cNode) continue;
          const d = computeDistance(pt.vector, cNode.point.vector, metric);
          if (d < cBestDist) {
            cBestDist = d;
            cBestId = cId;
          }
        }
        if (!cBestId) break;
        candidates.delete(cBestId);

        const worstW = w.length >= efConstruction ? w[w.length - 1].dist : Infinity;
        if (cBestDist > worstW) break;

        const cNode = nodes.get(cBestId);
        const neighbors = cNode?.neighbors.get(l) ?? [];
        for (const nId of neighbors) {
          if (!visited.has(nId)) {
            visited.add(nId);
            const nNode = nodes.get(nId);
            if (!nNode) continue;
            const d = computeDistance(pt.vector, nNode.point.vector, metric);
            if (d < worstW || w.length < efConstruction) {
              candidates.add(nId);
              w.push({ id: nId, dist: d });
              w.sort((a, b) => a.dist - b.dist);
              if (w.length > efConstruction) {
                w.pop();
              }
            }
          }
        }
      }

      // Add bidirectional edges up to M
      const selectedNeighbors = w.slice(0, l === 0 ? M * 2 : M).map((item) => item.id);
      (newNode.neighbors.get(l) as string[])?.push(...selectedNeighbors);

      for (const nId of selectedNeighbors) {
        const targetNode = nodes.get(nId);
        const targetNeighbors = targetNode?.neighbors.get(l) as string[] | undefined;
        if (targetNeighbors && !targetNeighbors.includes(pt.id)) {
          targetNeighbors.push(pt.id);
        }
      }
    }

    if (layer > maxLayer) {
      maxLayer = layer;
      entryPointId = pt.id;
    }
  }

  return {
    nodes,
    entryPointId,
    maxLayer,
    M,
    efConstruction,
    mL,
    metric,
    points,
  };
}

export function hnswSearch(
  index: HNSWIndex,
  query: readonly number[],
  k: number,
  efSearch: number,
  metric: DistanceMetric,
): SearchResult {
  const traces: SearchTraceStep[] = [];
  let distComps = 0;
  let visitedCount = 0;

  if (!index.entryPointId || index.nodes.size === 0) {
    return {
      neighbors: [],
      distanceComputations: 0,
      visitedNodesCount: 0,
      traceSteps: [],
    };
  }

  let currNode = index.nodes.get(index.entryPointId)!;
  let currDist = computeDistance(query, currNode.point.vector, metric);
  distComps++;
  visitedCount++;

  traces.push({
    stepIndex: 0,
    action: "init",
    pointId: currNode.point.id,
    layer: index.maxLayer,
    distance: round4(currDist),
    visitedCount,
    distCompsCount: distComps,
    activeCoords: currNode.point.vector,
    description: `Entered HNSW graph at top layer ${index.maxLayer} via entry point ${currNode.point.id} (dist=${round4(currDist)}).`,
  });

  // 1. Zoom down upper layers (greedy 1-NN routing)
  for (let l = index.maxLayer; l >= 1; l--) {
    let changed = true;
    while (changed) {
      changed = false;
      const neighbors = (currNode.neighbors.get(l) ?? [])
        .map((id) => index.nodes.get(id))
        .filter(Boolean) as HNSWNode[];

      for (const n of neighbors) {
        visitedCount++;
        const d = computeDistance(query, n.point.vector, metric);
        distComps++;

        if (d < currDist) {
          traces.push({
            stepIndex: traces.length,
            action: "layer_hop",
            pointId: n.point.id,
            layer: l,
            distance: round4(d),
            visitedCount,
            distCompsCount: distComps,
            activeCoords: n.point.vector,
            highlightEdge: [currNode.point.id, n.point.id],
            description: `Greedy Hop at Layer ${l}: ${currNode.point.id} -> ${n.point.id} (dist ${round4(currDist)} -> ${round4(d)}).`,
          });
          currDist = d;
          currNode = n;
          changed = true;
          break;
        }
      }
    }

    traces.push({
      stepIndex: traces.length,
      action: "layer_switch",
      pointId: currNode.point.id,
      layer: l - 1,
      distance: round4(currDist),
      visitedCount,
      distCompsCount: distComps,
      description: `Descending to Layer ${l - 1} centered at ${currNode.point.id}.`,
    });
  }

  // 2. Beam Search on Layer 0
  const actualEf = Math.max(k, efSearch);
  const visited = new Set<string>([currNode.point.id]);
  const candidates: { id: string; dist: number }[] = [{ id: currNode.point.id, dist: currDist }];
  const w: { id: string; dist: number; point: VectorPoint }[] = [
    { id: currNode.point.id, dist: currDist, point: currNode.point },
  ];

  while (candidates.length > 0) {
    // Extract closest candidate
    candidates.sort((a, b) => a.dist - b.dist);
    const cObj = candidates.shift()!;
    const cNode = index.nodes.get(cObj.id);
    if (!cNode) continue;

    const worstWDist = w.length >= actualEf ? w[w.length - 1].dist : Infinity;
    if (cObj.dist > worstWDist) {
      break;
    }

    const neighbors = cNode.neighbors.get(0) ?? [];
    for (const nId of neighbors) {
      if (!visited.has(nId)) {
        visited.add(nId);
        visitedCount++;
        const nNode = index.nodes.get(nId);
        if (!nNode) continue;

        const d = computeDistance(query, nNode.point.vector, metric);
        distComps++;

        const currentWorst = w.length >= actualEf ? w[w.length - 1].dist : Infinity;
        if (d < currentWorst || w.length < actualEf) {
          candidates.push({ id: nId, dist: d });
          w.push({ id: nId, dist: d, point: nNode.point });
          w.sort((a, b) => a.dist - b.dist);

          if (w.length > actualEf) {
            w.pop();
          }

          if (traces.length < 35 || traces.length % 4 === 0) {
            traces.push({
              stepIndex: traces.length,
              action: "candidate_update",
              pointId: nId,
              layer: 0,
              distance: round4(d),
              visitedCount,
              distCompsCount: distComps,
              activeCoords: nNode.point.vector,
              highlightEdge: [cObj.id, nId],
              description: `Layer 0 Beam Expanded: visited ${nId} (dist=${round4(d)}), beam size=${w.length}/${actualEf}.`,
            });
          }
        }
      }
    }
  }

  const topK: NeighborCandidate[] = w.slice(0, k).map((item, idx) => ({
    point: item.point,
    distance: item.dist,
    rank: idx + 1,
  }));

  traces.push({
    stepIndex: traces.length,
    action: "finalize",
    visitedCount,
    distCompsCount: distComps,
    bestDistances: topK.map((c) => ({ id: c.point.id, dist: round4(c.distance) })),
    description: `HNSW Search Complete: top-${topK.length} found with ${distComps} distance computations across ${visitedCount} visited nodes.`,
  });

  return {
    neighbors: topK,
    distanceComputations: distComps,
    visitedNodesCount: visitedCount,
    traceSteps: traces,
    latencyMs: round4(distComps * 0.0011),
  };
}

// ============================================================================
// 5. RECALL & BENCHMARK CURVE GENERATORS
// ============================================================================

export function calculateRecallAtK(
  retrievedIds: readonly string[],
  groundTruthIds: readonly string[],
  k: number,
): number {
  if (k <= 0) return 0;
  const gtSet = new Set(groundTruthIds.slice(0, k));
  let hits = 0;
  for (let i = 0; i < Math.min(retrievedIds.length, k); i++) {
    if (gtSet.has(retrievedIds[i])) {
      hits++;
    }
  }
  return round4(hits / k);
}

export function generateRecallVsLatencyCurve(
  dataset: readonly VectorPoint[],
  queries: readonly (readonly number[])[],
  algorithm: RetrievalAlgorithm,
  metric: DistanceMetric,
  k: number,
  sweepParams: readonly number[],
): BenchmarkPoint[] {
  const points: BenchmarkPoint[] = [];

  for (const pVal of sweepParams) {
    let totalRecall = 0;
    let totalDistComps = 0;

    for (const q of queries) {
      // Ground truth via Flat Scan
      const gtResult = flatScanSearch(q, dataset, k, metric);
      const gtIds = gtResult.neighbors.map((n) => n.point.id);

      let approxResult: SearchResult;
      switch (algorithm) {
        case "ivf": {
          const ivfIndex = buildIVFIndex(
            dataset,
            Math.max(4, Math.floor(Math.sqrt(dataset.length))),
            metric,
          );
          approxResult = ivfSearch(ivfIndex, q, k, Math.max(1, Math.round(pVal)), metric);
          break;
        }
        case "hnsw": {
          const hnswIndex = buildHNSWIndex(dataset, 4, 25, 1.0 / Math.log(4), metric);
          approxResult = hnswSearch(hnswIndex, q, k, Math.max(k, Math.round(pVal)), metric);
          break;
        }
        case "pq": {
          const pqIndex = buildPQIndex(dataset, 2, Math.max(2, Math.round(pVal)), metric);
          approxResult = pqSearch(pqIndex, q, k);
          break;
        }
        case "kd_tree": {
          const kdTree = buildKDTree(dataset);
          approxResult = kdTreeSearch(kdTree, q, k, metric);
          break;
        }
        case "flat":
        default: {
          approxResult = gtResult;
          break;
        }
      }

      const approxIds = approxResult.neighbors.map((n) => n.point.id);
      totalRecall += calculateRecallAtK(approxIds, gtIds, k);
      totalDistComps += approxResult.distanceComputations;
    }

    const avgRecall = totalRecall / queries.length;
    const avgDistComps = Math.round(totalDistComps / queries.length);
    points.push({
      paramValue: pVal,
      recall: round4(avgRecall),
      distanceComputations: avgDistComps,
      latencyEstimateMs: round4(avgDistComps * 0.0012),
    });
  }

  return points;
}

// ============================================================================
// 6. PRESETS CONFIGURATION
// ============================================================================

export const VECTOR_DB_PRESETS: Record<PresetId, VectorDBPreset> = {
  semantic_text: {
    id: "semantic_text",
    name: "Semantic Text Retrieval",
    description:
      "High-dimensional text embedding simulation using HNSW multi-layer graph with cosine distance metric.",
    algorithm: "hnsw",
    metric: "cosine",
    distribution: "gaussian_clusters",
    numPoints: 60,
    k: 5,
    query: [1.2, 1.8],
    hnswM: 4,
    efSearch: 15,
    theoryNotes:
      "Dense embeddings represent concepts where angle (cosine similarity) matters more than vector magnitude. HNSW logarithmic hierarchy provides 95%+ recall with O(log N) hops.",
  },
  image_ivf_pq: {
    id: "image_ivf_pq",
    name: "Large-Scale Image IVF-PQ",
    description:
      "Scalable billion-scale inverted file index combined with 2-subspace Product Quantization for low memory footprint.",
    algorithm: "ivf",
    metric: "l2",
    distribution: "concentric_rings",
    numPoints: 80,
    k: 6,
    query: [-1.5, 2.2],
    nlist: 8,
    nprobe: 3,
    pqM: 2,
    pqKs: 4,
    theoryNotes:
      "IVF partitions the space into Voronoi cells so search only inspects `nprobe` cells. PQ compresses vectors into short quantized codes, enabling cache-resident Asymmetric Distance Computation.",
  },
  spatial_gis: {
    id: "spatial_gis",
    name: "Spatial GIS K-D Tree",
    description:
      "2D spatial coordinates indexed via axis-aligned orthogonal split planes with hyperplane branch pruning.",
    algorithm: "kd_tree",
    metric: "l2",
    distribution: "uniform",
    numPoints: 50,
    k: 4,
    query: [0.5, -1.2],
    theoryNotes:
      "K-D Trees recursively split coordinate axes at median values. In low dimensions (d <= 10), hyperplanes prune large subtrees, giving O(log N) average query time.",
  },
  flat_golden: {
    id: "flat_golden",
    name: "Flat Golden Baseline",
    description:
      "Exhaustive brute-force scan providing exact 100% ground truth Recall@k on complex non-linear Swiss roll manifold.",
    algorithm: "flat",
    metric: "l2",
    distribution: "swiss_roll",
    numPoints: 70,
    k: 5,
    query: [0.0, 1.5],
    theoryNotes:
      "Brute force scans every single vector (N distance computations). It establishes the golden baseline to evaluate recall and speedup tradeoffs of ANN indexes.",
  },
  adversarial_hubness: {
    id: "adversarial_hubness",
    name: "Adversarial Hubness Trap",
    description:
      "Pathological dense hub vectors that attract graph hops, challenging greedy local search algorithms.",
    algorithm: "hnsw",
    metric: "cosine",
    distribution: "adversarial_hubness",
    numPoints: 65,
    k: 5,
    query: [0.2, 0.1],
    hnswM: 4,
    efSearch: 8,
    theoryNotes:
      "Hubness occurs when central points appear in the k-NN lists of disproportionately many queries. Expanding beam width `efSearch` helps escape hub-induced local minima.",
  },
};

// ============================================================================
// 7. VORONOI & CANVAS GEOMETRY HELPERS
// ============================================================================

interface VoronoiPolygon {
  readonly centroidId: number;
  readonly path: string;
}

// Compute 2D Voronoi polygons via half-plane clipping for canvas bounds
function computeVoronoiPolygons(
  centroids: readonly IVFClusterCentroid[],
  bounds = { minX: -5, maxX: 5, minY: -5, maxY: 5 },
): VoronoiPolygon[] {
  const result: VoronoiPolygon[] = [];

  for (let i = 0; i < centroids.length; i++) {
    const c1 = centroids[i];
    let poly: [number, number][] = [
      [bounds.minX, bounds.minY],
      [bounds.maxX, bounds.minY],
      [bounds.maxX, bounds.maxY],
      [bounds.minX, bounds.maxY],
    ];

    for (let j = 0; j < centroids.length; j++) {
      if (i === j) continue;
      const c2 = centroids[j];
      // Perpendicular bisector: midpoint M, normal N = c2 - c1
      const mx = (c1.vector[0] + c2.vector[0]) / 2;
      const my = (c1.vector[1] + c2.vector[1]) / 2;
      const nx = c2.vector[0] - c1.vector[0];
      const ny = c2.vector[1] - c1.vector[1];

      // Clip poly against halfplane: (P - M) . N <= 0
      const nextPoly: [number, number][] = [];
      for (let k = 0; k < poly.length; k++) {
        const pA = poly[k];
        const pB = poly[(k + 1) % poly.length];
        const sideA = (pA[0] - mx) * nx + (pA[1] - my) * ny;
        const sideB = (pB[0] - mx) * nx + (pB[1] - my) * ny;

        if (sideA <= 0) {
          nextPoly.push(pA);
        }
        if ((sideA <= 0 && sideB > 0) || (sideA > 0 && sideB <= 0)) {
          // Compute line intersection
          const t = sideA / (sideA - sideB);
          const ix = pA[0] + t * (pB[0] - pA[0]);
          const iy = pA[1] + t * (pB[1] - pA[1]);
          nextPoly.push([ix, iy]);
        }
      }
      poly = nextPoly;
      if (poly.length === 0) break;
    }

    if (poly.length >= 3) {
      const pathStr =
        poly.map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt[0]} ${pt[1]}`).join(" ") + " Z";
      result.push({ centroidId: c1.id, path: pathStr });
    }
  }

  return result;
}

// Collect split lines for K-D Tree visualization
function collectKDLines(
  node: KDNode | null,
  lines: { x1: number; y1: number; x2: number; y2: number; axis: number; depth: number }[] = [],
): { x1: number; y1: number; x2: number; y2: number; axis: number; depth: number }[] {
  if (!node) return lines;

  if (node.splitAxis === 0) {
    // Vertical split line: x = splitValue between bbox.minY and bbox.maxY
    lines.push({
      x1: node.splitValue,
      y1: node.bbox.minY,
      x2: node.splitValue,
      y2: node.bbox.maxY,
      axis: 0,
      depth: node.depth,
    });
  } else {
    // Horizontal split line: y = splitValue between bbox.minX and bbox.maxX
    lines.push({
      x1: node.bbox.minX,
      y1: node.splitValue,
      x2: node.bbox.maxX,
      y2: node.splitValue,
      axis: 1,
      depth: node.depth,
    });
  }

  collectKDLines(node.left, lines);
  collectKDLines(node.right, lines);
  return lines;
}

// ============================================================================
// 8. MAIN INTERACTIVE WORKBENCH COMPONENT
// ============================================================================

export function VectorDBRetrievalWorkbench({
  initialAlgorithm = "hnsw",
  initialMetric = "l2",
  initialK = 5,
  initialPreset = "semantic_text",
  className = "",
  title = "Vector DB & Approximate Nearest Neighbor Retrieval Studio",
  standalone = true,
  onQueryChange,
  onAlgorithmChange,
}: VectorDBRetrievalWorkbenchProps): React.JSX.Element {
  // State: Preset & Hyperparameters
  const [selectedPreset, setSelectedPreset] = useState<PresetId>(initialPreset);
  const [algorithm, setAlgorithm] = useState<RetrievalAlgorithm>(initialAlgorithm);
  const [metric, setMetric] = useState<DistanceMetric>(initialMetric);
  const [k, setK] = useState<number>(initialK);
  const [distribution, setDistribution] = useState<DatasetDistribution>("gaussian_clusters");
  const [numPoints, setNumPoints] = useState<number>(60);
  const [noise, setNoise] = useState<number>(0.2);

  // Indexing Parameters
  const [nlist, setNlist] = useState<number>(8);
  const [nprobe, setNprobe] = useState<number>(3);
  const [hnswM, setHnswM] = useState<number>(4);
  const [efSearch, setEfSearch] = useState<number>(15);
  const [pqKs, setPqKs] = useState<number>(4);
  const [activeHnswLayer, setActiveHnswLayer] = useState<number>(0);

  // Query Probe State
  const [query, setQuery] = useState<readonly [number, number]>([1.0, 1.5]);
  const [isDraggingQuery, setIsDraggingQuery] = useState<boolean>(false);

  // Playback & Animation State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Tab
  const [activeInspectorTab, setActiveInspectorTab] = useState<
    "dashboard" | "theory" | "benchmark" | "trace"
  >("dashboard");

  // Generate Base Dataset
  const dataset = useMemo(() => {
    return generateVectorDataset({
      distribution,
      numPoints,
      dimensions: 2,
      noise,
      range: 4.0,
      seed: 42,
    });
  }, [distribution, numPoints, noise]);

  // Build Indexes
  const kdTreeIndex = useMemo(() => buildKDTree(dataset), [dataset]);
  const ivfIndex = useMemo(() => buildIVFIndex(dataset, nlist, metric), [dataset, nlist, metric]);
  const pqIndex = useMemo(() => buildPQIndex(dataset, 2, pqKs, metric), [dataset, pqKs, metric]);
  const hnswIndex = useMemo(
    () => buildHNSWIndex(dataset, hnswM, 25, 1.0 / Math.log(hnswM), metric),
    [dataset, hnswM, metric],
  );

  // Ground Truth (Flat Scan)
  const groundTruthResult = useMemo(() => {
    return flatScanSearch(query, dataset, k, metric);
  }, [query, dataset, k, metric]);

  // Active Search Execution
  const currentSearchResult = useMemo<SearchResult>(() => {
    switch (algorithm) {
      case "flat":
        return flatScanSearch(query, dataset, k, metric);
      case "kd_tree":
        return kdTreeSearch(kdTreeIndex, query, k, metric);
      case "ivf":
        return ivfSearch(ivfIndex, query, k, nprobe, metric);
      case "pq":
        return pqSearch(pqIndex, query, k);
      case "hnsw":
        return hnswSearch(hnswIndex, query, k, efSearch, metric);
      default:
        return flatScanSearch(query, dataset, k, metric);
    }
  }, [
    algorithm,
    query,
    dataset,
    k,
    metric,
    kdTreeIndex,
    ivfIndex,
    nprobe,
    pqIndex,
    hnswIndex,
    efSearch,
  ]);

  // Computed Recall
  const computedRecall = useMemo(() => {
    const retrievedIds = currentSearchResult.neighbors.map((n) => n.point.id);
    const gtIds = groundTruthResult.neighbors.map((n) => n.point.id);
    return calculateRecallAtK(retrievedIds, gtIds, k);
  }, [currentSearchResult, groundTruthResult, k]);

  // Trace steps
  const traceSteps = currentSearchResult.traceSteps;
  const currentStep =
    traceSteps[Math.min(currentStepIndex, traceSteps.length - 1)] ?? traceSteps[0];

  // Benchmark Curve Data
  const benchmarkCurve = useMemo(() => {
    const sampleQueries: [number, number][] = [
      [1.0, 1.0],
      [-1.5, 2.0],
      [2.0, -1.0],
      [-2.0, -2.0],
    ];
    let sweep: number[];
    if (algorithm === "ivf") sweep = [1, 2, 4, 6, 8];
    else if (algorithm === "hnsw") sweep = [k, k + 5, k + 15, k + 30, k + 50];
    else if (algorithm === "pq") sweep = [2, 4, 8, 16];
    else sweep = [1, 2, 3, 4, 5];

    return generateRecallVsLatencyCurve(dataset, sampleQueries, algorithm, metric, k, sweep);
  }, [dataset, algorithm, metric, k]);

  // Playback Step Runner
  const handleNextStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev < traceSteps.length - 1 ? prev + 1 : prev));
  }, [traceSteps.length]);

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const handleResetPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = setTimeout(() => {
        if (currentStepIndex < traceSteps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 400 / playbackSpeed);
    }
    return () => {
      if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    };
  }, [isPlaying, currentStepIndex, traceSteps.length, playbackSpeed]);

  // Reset step index on algorithm/query change
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [algorithm, query, nprobe, efSearch]);

  // Preset Applicator
  const applyPreset = (pId: PresetId) => {
    const p = VECTOR_DB_PRESETS[pId];
    if (!p) return;
    setSelectedPreset(pId);
    setAlgorithm(p.algorithm);
    setMetric(p.metric);
    setDistribution(p.distribution);
    setNumPoints(p.numPoints);
    setK(p.k);
    setQuery([p.query[0], p.query[1]]);
    if (p.nlist) setNlist(p.nlist);
    if (p.nprobe) setNprobe(p.nprobe);
    if (p.hnswM) setHnswM(p.hnswM);
    if (p.efSearch) setEfSearch(p.efSearch);
    if (p.pqKs) setPqKs(p.pqKs);
    onAlgorithmChange?.(p.algorithm);
    onQueryChange?.(p.query);
  };

  // SVG Coordinate Conversion
  const svgWidth = 560;
  const svgHeight = 420;
  const coordRange = 5.0; // [-5, 5]

  const toSvgX = (x: number) => ((x + coordRange) / (2 * coordRange)) * svgWidth;
  const toSvgY = (y: number) => ((coordRange - y) / (2 * coordRange)) * svgHeight;
  const fromSvgX = (sx: number) => (sx / svgWidth) * 2 * coordRange - coordRange;
  const fromSvgY = (sy: number) => coordRange - (sy / svgHeight) * 2 * coordRange;

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const qx = round4(fromSvgX(sx));
    const qy = round4(fromSvgY(sy));
    setQuery([qx, qy]);
    setIsDraggingQuery(true);
    onQueryChange?.([qx, qy]);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingQuery) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = Math.max(0, Math.min(svgWidth, e.clientX - rect.left));
    const sy = Math.max(0, Math.min(svgHeight, e.clientY - rect.top));
    const qx = round4(fromSvgX(sx));
    const qy = round4(fromSvgY(sy));
    setQuery([qx, qy]);
    onQueryChange?.([qx, qy]);
  };

  const handleSvgPointerUp = () => {
    setIsDraggingQuery(false);
  };

  // Voronoi Polygons for IVF
  const voronoiPolygons = useMemo(() => {
    if (algorithm !== "ivf") return [];
    return computeVoronoiPolygons(ivfIndex.centroids);
  }, [algorithm, ivfIndex.centroids]);

  // KD Split Lines
  const kdSplitLines = useMemo(() => {
    if (algorithm !== "kd_tree") return [];
    return collectKDLines(kdTreeIndex);
  }, [algorithm, kdTreeIndex]);

  // Ground truth IDs set for quick check
  const gtIdsSet = useMemo(() => {
    return new Set(groundTruthResult.neighbors.map((n) => n.point.id));
  }, [groundTruthResult]);

  return (
    <div
      className={`flex flex-col w-full ${standalone ? "max-w-6xl mx-auto my-4" : ""} bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${className}`}
    >
      {/* 1. Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {title}
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ANN Studio
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Interactive high-dimensional indexing, vector clustering, Voronoi partitions &
              multi-layer HNSW graphs
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
          </span>
          {(Object.keys(VECTOR_DB_PRESETS) as PresetId[]).map((pId) => (
            <button
              key={pId}
              onClick={() => applyPreset(pId)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                selectedPreset === pId
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {VECTOR_DB_PRESETS[pId].name}
            </button>
          ))}
        </div>
      </header>

      {/* 2. Controls & Parameter Bar */}
      <section className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3 px-6 py-3.5 bg-slate-900/50 border-b border-slate-800 text-xs">
        {/* Algorithm */}
        <div className="flex flex-col gap-1">
          <label className="text-slate-400 font-semibold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => {
              const algo = e.target.value as RetrievalAlgorithm;
              setAlgorithm(algo);
              onAlgorithmChange?.(algo);
            }}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="hnsw">HNSW (Hierarchical Graph)</option>
            <option value="ivf">IVF (Inverted Voronoi Index)</option>
            <option value="pq">Product Quantization (PQ-ADC)</option>
            <option value="kd_tree">K-D Tree (Spatial Partition)</option>
            <option value="flat">Flat Scan (Exact Baseline)</option>
          </select>
        </div>

        {/* Distance Metric */}
        <div className="flex flex-col gap-1">
          <label className="text-slate-400 font-semibold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" /> Metric
          </label>
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as DistanceMetric)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="l2">Euclidean Distance (L2)</option>
            <option value="cosine">Cosine Distance (1 - cos)</option>
            <option value="dot">Dot Product Similarity</option>
            <option value="manhattan">Manhattan Distance (L1)</option>
          </select>
        </div>

        {/* Top-K Target */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-semibold">Top-k Neighbors:</span>
            <span className="text-indigo-400 font-mono font-bold">{k}</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="accent-indigo-500 h-1.5 bg-slate-700 rounded cursor-pointer"
          />
        </div>

        {/* Algorithm-Specific Param 1 */}
        {algorithm === "ivf" && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-semibold">nprobe (Cells):</span>
              <span className="text-cyan-400 font-mono font-bold">
                {nprobe} / {nlist}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={nlist}
              value={nprobe}
              onChange={(e) => setNprobe(Number(e.target.value))}
              className="accent-cyan-500 h-1.5 bg-slate-700 rounded cursor-pointer"
            />
          </div>
        )}

        {algorithm === "hnsw" && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-semibold">efSearch Beam:</span>
              <span className="text-amber-400 font-mono font-bold">{efSearch}</span>
            </div>
            <input
              type="range"
              min={k}
              max={40}
              value={efSearch}
              onChange={(e) => setEfSearch(Number(e.target.value))}
              className="accent-amber-500 h-1.5 bg-slate-700 rounded cursor-pointer"
            />
          </div>
        )}

        {algorithm === "pq" && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-semibold">Ks Codebook:</span>
              <span className="text-emerald-400 font-mono font-bold">{pqKs} codes</span>
            </div>
            <input
              type="range"
              min={2}
              max={8}
              value={pqKs}
              onChange={(e) => setPqKs(Number(e.target.value))}
              className="accent-emerald-500 h-1.5 bg-slate-700 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Dataset Distribution */}
        <div className="flex flex-col gap-1">
          <label className="text-slate-400 font-semibold flex items-center gap-1">
            <Grid className="w-3.5 h-3.5 text-purple-400" /> Distribution
          </label>
          <select
            value={distribution}
            onChange={(e) => setDistribution(e.target.value as DatasetDistribution)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="gaussian_clusters">Gaussian Clusters</option>
            <option value="concentric_rings">Concentric Rings</option>
            <option value="swiss_roll">Swiss Roll Manifold</option>
            <option value="adversarial_hubness">Adversarial Hubs</option>
            <option value="uniform">Uniform Random</option>
          </select>
        </div>

        {/* Noise Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="font-semibold">Noise / Jitter:</span>
            <span className="text-purple-400 font-mono font-bold">{noise.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            value={Math.round(noise * 100)}
            onChange={(e) => setNoise(Number(e.target.value) / 100)}
            className="accent-purple-500 h-1.5 bg-slate-700 rounded cursor-pointer"
          />
        </div>
      </section>

      {/* 3. Main Interactive Workspace */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-slate-800 flex-1 min-h-[460px]">
        {/* Left 7 Columns: Interactive 2D Vector Canvas */}
        <div className="lg:col-span-7 p-4 flex flex-col items-center justify-center bg-slate-950 relative border-r border-slate-800 select-none">
          {/* Canvas Sub-Header Badges */}
          <div className="w-full flex items-center justify-between mb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono text-slate-300">
                <Crosshair className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                q = ({query[0].toFixed(2)}, {query[1].toFixed(2)})
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Click or drag beacon to query</span>
            </div>

            {/* HNSW Layer Filter (if HNSW active) */}
            {algorithm === "hnsw" && (
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                <span className="text-slate-400 mr-1 text-[11px]">Layer:</span>
                {[0, 1, 2].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setActiveHnswLayer(lvl)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                      activeHnswLayer === lvl
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SVG Vector Canvas */}
          <div className="relative w-full max-w-[560px] aspect-[4/3] rounded-lg border border-slate-800 bg-slate-900/90 shadow-inner overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full cursor-crosshair"
              onPointerDown={handleSvgPointerDown}
              onPointerMove={handleSvgPointerMove}
              onPointerUp={handleSvgPointerUp}
            >
              {/* Grid Lines */}
              <defs>
                <pattern id="canvas-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#1e293b" strokeWidth="0.8" />
                </pattern>
                <radialGradient id="query-halo" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width={svgWidth} height={svgHeight} fill="url(#canvas-grid)" />

              {/* Coordinate Axes */}
              <line
                x1={0}
                y1={svgHeight / 2}
                x2={svgWidth}
                y2={svgHeight / 2}
                stroke="#334155"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />
              <line
                x1={svgWidth / 2}
                y1={0}
                x2={svgWidth / 2}
                y2={svgHeight}
                stroke="#334155"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* 1. IVF Voronoi Cells */}
              {algorithm === "ivf" &&
                voronoiPolygons.map((vp) => {
                  const isProbed = currentSearchResult.traceSteps.some(
                    (s) => s.action === "probe_cluster" && s.clusterId === vp.centroidId,
                  );
                  return (
                    <path
                      key={vp.centroidId}
                      d={vp.path
                        .split(" ")
                        .map((token, i) => {
                          if (i % 3 === 1) return toSvgX(Number(token));
                          if (i % 3 === 2) return toSvgY(Number(token));
                          return token;
                        })
                        .join(" ")}
                      fill={isProbed ? "#6366f1" : "#1e1b4b"}
                      fillOpacity={isProbed ? "0.22" : "0.08"}
                      stroke={isProbed ? "#818cf8" : "#312e81"}
                      strokeWidth={isProbed ? "2" : "1"}
                      strokeDasharray={isProbed ? undefined : "3 3"}
                    />
                  );
                })}

              {/* 2. K-D Tree Split Lines */}
              {algorithm === "kd_tree" &&
                kdSplitLines.map((line, idx) => (
                  <line
                    key={idx}
                    x1={toSvgX(line.x1)}
                    y1={toSvgY(line.y1)}
                    x2={toSvgX(line.x2)}
                    y2={toSvgY(line.y2)}
                    stroke={line.axis === 0 ? "#06b6d4" : "#f59e0b"}
                    strokeWidth={Math.max(1, 2.5 - line.depth * 0.4)}
                    strokeOpacity="0.75"
                    strokeDasharray={line.depth > 2 ? "4 4" : undefined}
                  />
                ))}

              {/* 3. Product Quantization Subspace Grid */}
              {algorithm === "pq" && (
                <g opacity="0.6">
                  {pqIndex.codebooks[0]?.map((cb, idx) => (
                    <line
                      key={`pq_x_${idx}`}
                      x1={toSvgX(cb[0])}
                      y1={0}
                      x2={toSvgX(cb[0])}
                      y2={svgHeight}
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                  ))}
                  {pqIndex.codebooks[1]?.map((cb, idx) => (
                    <line
                      key={`pq_y_${idx}`}
                      x1={0}
                      y1={toSvgY(cb[0])}
                      x2={svgWidth}
                      y2={toSvgY(cb[0])}
                      stroke="#10b981"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                  ))}
                </g>
              )}

              {/* 4. HNSW Graph Edges */}
              {algorithm === "hnsw" &&
                Array.from(hnswIndex.nodes.values()).map((node) => {
                  if (node.layer < activeHnswLayer) return null;
                  const nIds = node.neighbors.get(activeHnswLayer) ?? [];
                  const x1 = toSvgX(node.point.vector[0]);
                  const y1 = toSvgY(node.point.vector[1]);

                  return nIds.map((targetId) => {
                    const targetNode = hnswIndex.nodes.get(targetId);
                    if (!targetNode || targetNode.layer < activeHnswLayer) return null;
                    const x2 = toSvgX(targetNode.point.vector[0]);
                    const y2 = toSvgY(targetNode.point.vector[1]);

                    return (
                      <line
                        key={`${node.point.id}_${targetId}_${activeHnswLayer}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#4338ca"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                      />
                    );
                  });
                })}

              {/* Trace Active Highlight Edge */}
              {currentStep?.highlightEdge && (
                <g>
                  {(() => {
                    const [fromId, toId] = currentStep.highlightEdge;
                    const nA = hnswIndex.nodes.get(fromId)?.point.vector;
                    const nB = hnswIndex.nodes.get(toId)?.point.vector;
                    if (!nA || !nB) return null;
                    return (
                      <line
                        x1={toSvgX(nA[0])}
                        y1={toSvgY(nA[1])}
                        x2={toSvgX(nB[0])}
                        y2={toSvgY(nB[1])}
                        stroke="#f59e0b"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                    );
                  })()}
                </g>
              )}

              {/* Dataset Points */}
              {dataset.map((pt) => {
                const sx = toSvgX(pt.vector[0]);
                const sy = toSvgY(pt.vector[1]);
                const isRetrieved = currentSearchResult.neighbors.some((n) => n.point.id === pt.id);
                const isGroundTruth = gtIdsSet.has(pt.id);
                const isVisitedInStep = currentStep?.pointId === pt.id;

                return (
                  <g key={pt.id}>
                    {/* Ground Truth True Target Halo */}
                    {isGroundTruth && (
                      <circle
                        cx={sx}
                        cy={sy}
                        r={12}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                        opacity="0.8"
                      />
                    )}

                    {/* Point Circle */}
                    <circle
                      cx={sx}
                      cy={sy}
                      r={isRetrieved ? 6 : 3.5}
                      fill={isVisitedInStep ? "#f59e0b" : (pt.color ?? "#94a3b8")}
                      stroke={isRetrieved ? "#ffffff" : isVisitedInStep ? "#fbbf24" : "#0f172a"}
                      strokeWidth={isRetrieved ? 2.5 : 1}
                      className="transition-all duration-200"
                    />

                    {/* Top-k Ranking Badge */}
                    {isRetrieved && (
                      <g>
                        <circle cx={sx + 8} cy={sy - 8} r={6.5} fill="#6366f1" />
                        <text
                          x={sx + 8}
                          y={sy - 5.5}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="#ffffff"
                        >
                          {currentSearchResult.neighbors.find((n) => n.point.id === pt.id)?.rank}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* IVF Centroids */}
              {algorithm === "ivf" &&
                ivfIndex.centroids.map((cent) => {
                  const cx = toSvgX(cent.vector[0]);
                  const cy = toSvgY(cent.vector[1]);
                  const isProbed = currentSearchResult.traceSteps.some(
                    (s) => s.action === "probe_cluster" && s.clusterId === cent.id,
                  );
                  return (
                    <g key={`cent_${cent.id}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isProbed ? 9 : 6}
                        fill={cent.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#ffffff"
                      >
                        C{cent.id}
                      </text>
                    </g>
                  );
                })}

              {/* Query Probe Point */}
              <g>
                <circle
                  cx={toSvgX(query[0])}
                  cy={toSvgY(query[1])}
                  r={28}
                  fill="url(#query-halo)"
                />
                <circle
                  cx={toSvgX(query[0])}
                  cy={toSvgY(query[1])}
                  r={8}
                  fill="#ec4899"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  className="shadow-lg animate-pulse cursor-grab active:cursor-grabbing"
                />
                <circle
                  cx={toSvgX(query[0])}
                  cy={toSvgY(query[1])}
                  r={14}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {/* Distance Rays to Top-K */}
                {currentSearchResult.neighbors.map((n) => (
                  <line
                    key={`ray_${n.point.id}`}
                    x1={toSvgX(query[0])}
                    y1={toSvgY(query[1])}
                    x2={toSvgX(n.point.vector[0])}
                    y2={toSvgY(n.point.vector[1])}
                    stroke="#ec4899"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                    strokeDasharray="2 2"
                  />
                ))}
              </g>
            </svg>
          </div>

          {/* Canvas Legend */}
          <div className="w-full flex flex-wrap items-center justify-between mt-3 text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 ring-2 ring-pink-500/30" />{" "}
                Query Probe
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Top-k Retrieved
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-emerald-400 border-dashed" />{" "}
                True Ground Truth
              </span>
            </div>
            <div>
              <span className="font-mono text-slate-300">N={dataset.length} points</span>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Analytical Dashboard & Results Table */}
        <div className="lg:col-span-5 p-4 flex flex-col gap-4 bg-slate-900/40 overflow-y-auto max-h-[520px]">
          {/* Dashboard Metrics Strip */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Recall@k Card */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Recall@{k}
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {(computedRecall * 100).toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-400">
                  {Math.round(computedRecall * k)}/{k} hits
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${computedRecall * 100}%` }}
                />
              </div>
            </div>

            {/* Distance Computations Card */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Dist Comps
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-black font-mono text-amber-400">
                  {currentSearchResult.distanceComputations}
                </span>
                <span className="text-[11px] text-slate-400">vs {dataset.length} flat</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1">
                {round4(dataset.length / Math.max(1, currentSearchResult.distanceComputations))}x
                Speedup
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveInspectorTab("dashboard")}
              className={`pb-2 px-3 transition-colors border-b-2 ${
                activeInspectorTab === "dashboard"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Candidates
            </button>
            <button
              onClick={() => setActiveInspectorTab("benchmark")}
              className={`pb-2 px-3 transition-colors border-b-2 ${
                activeInspectorTab === "benchmark"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Recall Curve
            </button>
            <button
              onClick={() => setActiveInspectorTab("theory")}
              className={`pb-2 px-3 transition-colors border-b-2 ${
                activeInspectorTab === "theory"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              Architecture
            </button>
          </div>

          {/* Tab 1: Candidates Table */}
          {activeInspectorTab === "dashboard" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Top-{k} Nearest Neighbors</span>
                <span>Ground Truth Check</span>
              </div>
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[240px] pr-1">
                {currentSearchResult.neighbors.map((cand) => {
                  const isMatch = gtIdsSet.has(cand.point.id);
                  return (
                    <div
                      key={cand.point.id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all ${
                        isMatch
                          ? "bg-slate-900 border-slate-800 hover:border-indigo-500/50"
                          : "bg-red-950/20 border-red-900/40 text-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[11px]">
                          #{cand.rank}
                        </span>
                        <div className="flex flex-col font-sans">
                          <span className="font-semibold text-slate-200 text-xs">
                            {cand.point.id} ({cand.point.label ?? "Point"})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{cand.point.vector[0].toFixed(2)}, {cand.point.vector[1].toFixed(2)}]
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-slate-300 font-bold">
                          d = {cand.distance.toFixed(3)}
                        </span>
                        {isMatch ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-sans font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> True NN
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-sans font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <XCircle className="w-3 h-3" /> Miss
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Recall vs Distance Computations Curve */}
          {activeInspectorTab === "benchmark" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-200">
                  Pareto Frontier: Recall vs Distance Ops
                </span>
                <span>{algorithm.toUpperCase()}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <svg viewBox="0 0 280 140" className="w-full h-36">
                  {/* Grid Lines */}
                  <line
                    x1="30"
                    y1="20"
                    x2="270"
                    y2="20"
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                  <line
                    x1="30"
                    y1="65"
                    x2="270"
                    y2="65"
                    stroke="#334155"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                  <line x1="30" y1="110" x2="270" y2="110" stroke="#475569" strokeWidth="1" />
                  <line x1="30" y1="10" x2="30" y2="110" stroke="#475569" strokeWidth="1" />

                  {/* Y Axis Labels */}
                  <text x="5" y="24" fontSize="8" fill="#94a3b8">
                    100%
                  </text>
                  <text x="12" y="69" fontSize="8" fill="#94a3b8">
                    50%
                  </text>
                  <text x="18" y="114" fontSize="8" fill="#94a3b8">
                    0%
                  </text>

                  {/* Curve Polyline */}
                  {benchmarkCurve.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      points={benchmarkCurve
                        .map((pt, idx) => {
                          const px = 30 + (idx / (benchmarkCurve.length - 1)) * 230;
                          const py = 110 - pt.recall * 90;
                          return `${px},${py}`;
                        })
                        .join(" ")}
                    />
                  )}

                  {/* Data Points */}
                  {benchmarkCurve.map((pt, idx) => {
                    const px = 30 + (idx / (benchmarkCurve.length - 1)) * 230;
                    const py = 110 - pt.recall * 90;
                    return (
                      <g key={idx}>
                        <circle
                          cx={px}
                          cy={py}
                          r="4"
                          fill="#a5b4fc"
                          stroke="#312e81"
                          strokeWidth="1.5"
                        />
                        <text
                          x={px}
                          y={py - 6}
                          fontSize="7.5"
                          textAnchor="middle"
                          fill="#c7d2fe"
                          fontWeight="bold"
                        >
                          {(pt.recall * 100).toFixed(0)}%
                        </text>
                        <text x={px} y={122} fontSize="7.5" textAnchor="middle" fill="#64748b">
                          p={pt.paramValue}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Increasing probe / beam width parameters raises Recall@k towards the theoretical
                Flat Scan upper bound.
              </p>
            </div>
          )}

          {/* Tab 3: Mathematical Architecture Inspector */}
          {activeInspectorTab === "theory" && (
            <div className="flex flex-col gap-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <h2 className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Algorithmic Mechanics
                </h2>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {VECTOR_DB_PRESETS[selectedPreset]?.theoryNotes ??
                    "Vector DB indexing balances index construction overhead, query latency, memory footprint, and retrieval recall."}
                </p>
              </div>

              {/* Complexity Comparison Table */}
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="font-bold text-slate-200 block mb-2">Complexity Trade-Offs</span>
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-1">Index</th>
                      <th className="pb-1">Search Time</th>
                      <th className="pb-1">Memory</th>
                      <th className="pb-1">Exactness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[10px]">
                    <tr>
                      <td className="py-1 text-slate-200 font-sans">Flat Scan</td>
                      <td className="py-1 text-amber-400">O(N · d)</td>
                      <td className="py-1 text-slate-300">O(N · d)</td>
                      <td className="py-1 text-emerald-400">100%</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-200 font-sans">IVF</td>
                      <td className="py-1 text-cyan-400">O(nprobe · N/nlist)</td>
                      <td className="py-1 text-slate-300">O(N · d)</td>
                      <td className="py-1 text-indigo-300">Approx</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-200 font-sans">PQ (ADC)</td>
                      <td className="py-1 text-emerald-400">O(M·Ks + N·M)</td>
                      <td className="py-1 text-emerald-400">O(N · M bytes)</td>
                      <td className="py-1 text-amber-300">Quantized</td>
                    </tr>
                    <tr>
                      <td className="py-1 text-slate-200 font-sans">HNSW</td>
                      <td className="py-1 text-indigo-400">O(log N · efSearch)</td>
                      <td className="py-1 text-amber-400">O(N · M · layers)</td>
                      <td className="py-1 text-emerald-300">95-99%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 4. Playback Stepper & Animation Controller Bar */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-900/90 border-t border-slate-800 text-xs">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetPlayback}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            title="Step Back"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors shadow-md"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? "Pause" : "Play Trace"}</span>
          </button>
          <button
            onClick={handleNextStep}
            disabled={currentStepIndex >= traceSteps.length - 1}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center ml-2 bg-slate-800 rounded border border-slate-700 p-0.5 text-[11px]">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-1.5 py-0.5 rounded ${
                  playbackSpeed === spd ? "bg-indigo-600 text-white font-bold" : "text-slate-400"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Step Explanation Bar */}
        <div className="flex-1 max-w-xl mx-2 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 truncate">
          <span className="text-indigo-400 font-bold shrink-0">
            [{currentStepIndex + 1}/{traceSteps.length}]
          </span>
          <span className="truncate">{currentStep?.description ?? "Ready to search."}</span>
        </div>

        {/* Step Progress Scrubber */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Step:</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, traceSteps.length - 1)}
            value={currentStepIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentStepIndex(Number(e.target.value));
            }}
            className="w-24 accent-indigo-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>
      </footer>
    </div>
  );
}
