import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Activity,
  CheckCircle2,
  Info,
  Workflow,
  RefreshCw,
  Network,
} from "lucide-react";
import { useCanvasBox } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type VoronoiStudioModality =
  | "fortune_sweep_voronoi"
  | "bowyer_watson_delaunay"
  | "dual_graph_morphing"
  | "euclidean_minimum_spanning_tree";

export type VoronoiPresetId =
  | "random_poisson_disk"
  | "hexagonal_honeycomb"
  | "delaunay_super_triangle"
  | "collinear_perturbation"
  | "centroidal_relaxation";

export interface Point2D {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly label?: string;
  readonly color?: string;
}

export interface BoundingBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface Circumcircle {
  readonly center: Point2D;
  readonly radius: number;
  readonly radiusSq: number;
  readonly valid: boolean;
}

export interface Triangle2D {
  readonly id: string;
  readonly a: Point2D;
  readonly b: Point2D;
  readonly c: Point2D;
  readonly circumcenter: Point2D;
  readonly circumradius: number;
  readonly circumradiusSq: number;
}

export interface DelaunayEdge {
  readonly id: string;
  readonly p1: Point2D;
  readonly p2: Point2D;
  readonly length: number;
  readonly triangleIds: readonly string[];
}

export interface VoronoiEdge {
  readonly id: string;
  readonly p1: Point2D;
  readonly p2: Point2D;
  readonly isInfinite?: boolean;
  readonly direction?: Point2D;
  readonly site1Id: string;
  readonly site2Id: string;
  readonly delaunayEdgeId?: string;
}

export interface VoronoiCell {
  readonly siteId: string;
  readonly site: Point2D;
  readonly vertices: readonly Point2D[];
  readonly area: number;
  readonly centroid: Point2D;
  readonly neighborSiteIds: readonly string[];
  readonly isClosed: boolean;
  readonly color?: string;
}

// --- Bowyer-Watson Step Tracing ---
export type BowyerWatsonAction =
  | "init"
  | "find_bad_triangles"
  | "create_cavity"
  | "stitch_triangles"
  | "cleanup_super_triangle"
  | "done";

export interface BowyerWatsonStep {
  readonly stepIndex: number;
  readonly insertedPoint?: Point2D;
  readonly candidateIndex?: number;
  readonly violatedTriangles: readonly Triangle2D[];
  readonly cavityEdges: readonly { readonly p1: Point2D; readonly p2: Point2D }[];
  readonly newTriangles: readonly Triangle2D[];
  readonly currentTriangles: readonly Triangle2D[];
  readonly action: BowyerWatsonAction;
  readonly description: string;
}

export interface BowyerWatsonResult {
  readonly triangles: readonly Triangle2D[];
  readonly edges: readonly DelaunayEdge[];
  readonly steps: readonly BowyerWatsonStep[];
  readonly superTriangle: readonly [Point2D, Point2D, Point2D];
}

// --- Fortune's Sweep Step Tracing ---
export type FortuneEventType = "site" | "circle";

export interface SiteEvent {
  readonly id: string;
  readonly type: "site";
  readonly sweepY: number;
  readonly site: Point2D;
}

export interface CircleEvent {
  readonly id: string;
  readonly type: "circle";
  readonly sweepY: number;
  readonly circumcenter: Point2D;
  readonly radius: number;
  readonly sites: readonly [Point2D, Point2D, Point2D];
  readonly triangleId?: string;
  readonly valid: boolean;
}

export type FortuneEvent = SiteEvent | CircleEvent;

export interface BeachlineArc {
  readonly site: Point2D;
  readonly xMin: number;
  readonly xMax: number;
  readonly samples: readonly Point2D[];
}

export interface FortuneSweepStep {
  readonly stepIndex: number;
  readonly sweepY: number;
  readonly currentEvent?: FortuneEvent;
  readonly activeSites: readonly Point2D[];
  readonly circleEvents: readonly CircleEvent[];
  readonly arcs: readonly BeachlineArc[];
  readonly breakpoints: readonly Point2D[];
  readonly voronoiVertices: readonly Point2D[];
  readonly voronoiEdges: readonly VoronoiEdge[];
  readonly description: string;
  readonly action: "init" | "site_event" | "circle_event" | "sweep_move" | "done";
}

// --- Euclidean Minimum Spanning Tree (EMST) ---
export type EMSTEdgeStatus = "uninspected" | "inspecting" | "accepted" | "rejected_cycle";

export interface EMSTEdge {
  readonly id: string;
  readonly u: Point2D;
  readonly v: Point2D;
  readonly weight: number;
  readonly status: EMSTEdgeStatus;
}

export interface EMSTStep {
  readonly stepIndex: number;
  readonly currentEdge?: EMSTEdge;
  readonly action: "init" | "inspect" | "accept" | "reject" | "done";
  readonly mstEdges: readonly EMSTEdge[];
  readonly totalWeight: number;
  readonly componentsCount: number;
  readonly description: string;
}

export interface EMSTResult {
  readonly mstEdges: readonly EMSTEdge[];
  readonly allEdges: readonly EMSTEdge[];
  readonly totalWeight: number;
  readonly steps: readonly EMSTStep[];
}

// --- Presets & Telemetry ---
export interface VoronoiPreset {
  readonly id: VoronoiPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly points: readonly Point2D[];
}

export interface VoronoiStudioTelemetry {
  readonly numPoints: number;
  readonly numTriangles: number;
  readonly numDelaunayEdges: number;
  readonly numVoronoiVertices: number;
  readonly numVoronoiEdges: number;
  readonly emstTotalWeight: number;
  readonly eulerCharacteristic: number;
  readonly isEulerValid: boolean;
  readonly averageDegree: number;
  readonly maxDegree: number;
}

export interface ModalityConfig {
  readonly id: VoronoiStudioModality;
  readonly name: string;
  readonly shortName: string;
  readonly iconName: string;
  readonly badge: string;
  readonly complexity: string;
  readonly formulaTeX: string;
  readonly description: string;
}

// ============================================================================
// 2. CONSTANTS & PALETTES
// ============================================================================

export const DEFAULT_CANVAS_WIDTH = 880;
export const DEFAULT_CANVAS_HEIGHT = 560;

export const VORONOI_DEFAULT_CANVAS_WIDTH = DEFAULT_CANVAS_WIDTH;
export const VORONOI_DEFAULT_CANVAS_HEIGHT = DEFAULT_CANVAS_HEIGHT;

export const DEFAULT_BOUNDS: BoundingBox = {
  minX: 20,
  minY: 20,
  maxX: 860,
  maxY: 540,
};
export const VORONOI_DEFAULT_BOUNDS = DEFAULT_BOUNDS;

export const PASTEL_PALETTE: readonly string[] = [
  "#38bdf8", // Sky
  "#818cf8", // Indigo
  "#a78bfa", // Violet
  "#f472b6", // Pink
  "#fb7185", // Rose
  "#fb923c", // Orange
  "#facc15", // Amber
  "#4ade80", // Green
  "#2dd4bf", // Teal
  "#22d3ee", // Cyan
  "#c084fc", // Purple
  "#a3e635", // Lime
];
export const VORONOI_PASTEL_PALETTE = PASTEL_PALETTE;

export const VORONOI_MODALITIES: readonly ModalityConfig[] = [
  {
    id: "fortune_sweep_voronoi",
    name: "Fortune's Sweep-Line Voronoi",
    shortName: "Fortune's Sweep",
    iconName: "Activity",
    badge: "O(N log N)",
    complexity: "O(N log N) Time | O(N) Space",
    formulaTeX: "y(x) = \\frac{(x - p_x)^2 + p_y^2 - y_s^2}{2(p_y - y_s)}",
    description:
      "Simulates Steven Fortune's sweep-line algorithm with parabolic beachline envelopes, site arrival events, and circle event collapses.",
  },
  {
    id: "bowyer_watson_delaunay",
    name: "Bowyer-Watson Delaunay Triangulation",
    shortName: "Bowyer-Watson",
    iconName: "Workflow",
    badge: "Incremental",
    complexity: "O(N log N) Randomized / O(N²) Worst-Case",
    formulaTeX:
      "\\det \\begin{pmatrix} A_x-D_x & A_y-D_y & |A-D|^2 \\\\ B_x-D_x & B_y-D_y & |B-D|^2 \\\\ C_x-D_x & C_y-D_y & |C-D|^2 \\end{pmatrix} > 0",
    description:
      "Incremental point insertion maintaining the Delaunay empty-circumcircle property by removing bad triangles, forming star-shaped cavities, and stitching new triangles.",
  },
  {
    id: "dual_graph_morphing",
    name: "Planar Dual Graph Morphing",
    shortName: "Dual Morphing",
    iconName: "Layers",
    badge: "Delaunay ↔ Voronoi",
    complexity: "Planar Duality: V - E + F = 2",
    formulaTeX: "P(t) = (1 - t) \\cdot E_{\\text{Delaunay}} + t \\cdot E_{\\text{Voronoi}}",
    description:
      "Continuous geometric interpolation between the Delaunay triangulation and its orthogonal dual Voronoi diagram tessellation.",
  },
  {
    id: "euclidean_minimum_spanning_tree",
    name: "Euclidean Minimum Spanning Tree (EMST)",
    shortName: "Euclidean MST",
    iconName: "Network",
    badge: "Kruskal via Delaunay",
    complexity: "O(N log N) via Delaunay Subgraph",
    formulaTeX: "\\text{EMST}(P) \\subseteq \\text{Delaunay}(P) \\implies O(N \\log N)",
    description:
      "Computes the exact minimum spanning tree in O(N log N) time by running Kruskal with Disjoint Set Union on the O(N) Delaunay edges rather than O(N²) complete graph.",
  },
];

export const VORONOI_STUDIO_PRESETS: Record<VoronoiPresetId, VoronoiPreset> = {
  random_poisson_disk: {
    id: "random_poisson_disk",
    name: "Poisson-Disk Distribution",
    subtitle: "Uniform spacing with blue noise characteristics",
    description:
      "Well-spaced random points demonstrating clean, balanced Voronoi partitions and Delaunay meshes.",
    points: [
      { id: "p1", x: 120, y: 130, label: "P1", color: PASTEL_PALETTE[0] },
      { id: "p2", x: 260, y: 90, label: "P2", color: PASTEL_PALETTE[1] },
      { id: "p3", x: 420, y: 120, label: "P3", color: PASTEL_PALETTE[2] },
      { id: "p4", x: 590, y: 100, label: "P4", color: PASTEL_PALETTE[3] },
      { id: "p5", x: 740, y: 160, label: "P5", color: PASTEL_PALETTE[4] },
      { id: "p6", x: 160, y: 280, label: "P6", color: PASTEL_PALETTE[5] },
      { id: "p7", x: 330, y: 260, label: "P7", color: PASTEL_PALETTE[6] },
      { id: "p8", x: 500, y: 270, label: "P8", color: PASTEL_PALETTE[7] },
      { id: "p9", x: 680, y: 310, label: "P9", color: PASTEL_PALETTE[8] },
      { id: "p10", x: 110, y: 440, label: "P10", color: PASTEL_PALETTE[9] },
      { id: "p11", x: 280, y: 430, label: "P11", color: PASTEL_PALETTE[10] },
      { id: "p12", x: 460, y: 450, label: "P12", color: PASTEL_PALETTE[11] },
      { id: "p13", x: 630, y: 460, label: "P13", color: PASTEL_PALETTE[0] },
      { id: "p14", x: 770, y: 410, label: "P14", color: PASTEL_PALETTE[1] },
    ],
  },
  hexagonal_honeycomb: {
    id: "hexagonal_honeycomb",
    name: "Hexagonal Honeycomb Lattice",
    subtitle: "Regular hexagonal Voronoi & equilateral Delaunay",
    description:
      "Regular triangular lattice producing perfect regular hexagonal Voronoi cells and equilateral Delaunay triangles.",
    points: [
      { id: "h1", x: 260, y: 110, label: "H1", color: PASTEL_PALETTE[0] },
      { id: "h2", x: 440, y: 110, label: "H2", color: PASTEL_PALETTE[1] },
      { id: "h3", x: 620, y: 110, label: "H3", color: PASTEL_PALETTE[2] },
      { id: "h4", x: 170, y: 240, label: "H4", color: PASTEL_PALETTE[3] },
      { id: "h5", x: 350, y: 240, label: "H5", color: PASTEL_PALETTE[4] },
      { id: "h6", x: 530, y: 240, label: "H6", color: PASTEL_PALETTE[5] },
      { id: "h7", x: 710, y: 240, label: "H7", color: PASTEL_PALETTE[6] },
      { id: "h8", x: 260, y: 370, label: "H8", color: PASTEL_PALETTE[7] },
      { id: "h9", x: 440, y: 370, label: "H9", color: PASTEL_PALETTE[8] },
      { id: "h10", x: 620, y: 370, label: "H10", color: PASTEL_PALETTE[9] },
      { id: "h11", x: 350, y: 490, label: "H11", color: PASTEL_PALETTE[10] },
      { id: "h12", x: 530, y: 490, label: "H12", color: PASTEL_PALETTE[11] },
    ],
  },
  delaunay_super_triangle: {
    id: "delaunay_super_triangle",
    name: "Enclosing Hull Triangulation",
    subtitle: "3 outer boundary anchors with dense interior",
    description:
      "Three outer triangular vertices enclosing interior cluster points, showcasing incremental cavity expansion.",
    points: [
      { id: "t_top", x: 440, y: 50, label: "Top", color: PASTEL_PALETTE[0] },
      { id: "t_left", x: 90, y: 500, label: "Left", color: PASTEL_PALETTE[1] },
      { id: "t_right", x: 790, y: 500, label: "Right", color: PASTEL_PALETTE[2] },
      { id: "in1", x: 440, y: 200, label: "I1", color: PASTEL_PALETTE[3] },
      { id: "in2", x: 340, y: 280, label: "I2", color: PASTEL_PALETTE[4] },
      { id: "in3", x: 540, y: 280, label: "I3", color: PASTEL_PALETTE[5] },
      { id: "in4", x: 260, y: 380, label: "I4", color: PASTEL_PALETTE[6] },
      { id: "in5", x: 440, y: 360, label: "I5", color: PASTEL_PALETTE[7] },
      { id: "in6", x: 620, y: 380, label: "I6", color: PASTEL_PALETTE[8] },
      { id: "in7", x: 360, y: 440, label: "I7", color: PASTEL_PALETTE[9] },
      { id: "in8", x: 520, y: 440, label: "I8", color: PASTEL_PALETTE[10] },
    ],
  },
  collinear_perturbation: {
    id: "collinear_perturbation",
    name: "Near-Collinear Perturbation",
    subtitle: "High circumcircle sensitivity & elongated Voronoi cells",
    description:
      "Sites placed nearly along a straight line, illustrating how degenerate configurations cause circumcircles to stretch.",
    points: [
      { id: "c1", x: 100, y: 280, label: "C1", color: PASTEL_PALETTE[0] },
      { id: "c2", x: 210, y: 275, label: "C2", color: PASTEL_PALETTE[1] },
      { id: "c3", x: 320, y: 286, label: "C3", color: PASTEL_PALETTE[2] },
      { id: "c4", x: 440, y: 273, label: "C4", color: PASTEL_PALETTE[3] },
      { id: "c5", x: 560, y: 287, label: "C5", color: PASTEL_PALETTE[4] },
      { id: "c6", x: 670, y: 276, label: "C6", color: PASTEL_PALETTE[5] },
      { id: "c7", x: 780, y: 282, label: "C7", color: PASTEL_PALETTE[6] },
    ],
  },
  centroidal_relaxation: {
    id: "centroidal_relaxation",
    name: "Clustered Centroidal Relaxation",
    subtitle: "Non-uniform clusters ready for Lloyd's smoothing",
    description:
      "Highly clustered points designed to demonstrate Lloyd's Centroidal Voronoi Relaxation converging into uniform cells.",
    points: [
      { id: "cl1_1", x: 200, y: 160, label: "A1", color: PASTEL_PALETTE[0] },
      { id: "cl1_2", x: 230, y: 190, label: "A2", color: PASTEL_PALETTE[1] },
      { id: "cl1_3", x: 180, y: 210, label: "A3", color: PASTEL_PALETTE[2] },
      { id: "cl1_4", x: 250, y: 140, label: "A4", color: PASTEL_PALETTE[3] },
      { id: "cl2_1", x: 440, y: 320, label: "B1", color: PASTEL_PALETTE[4] },
      { id: "cl2_2", x: 470, y: 300, label: "B2", color: PASTEL_PALETTE[5] },
      { id: "cl2_3", x: 420, y: 350, label: "B3", color: PASTEL_PALETTE[6] },
      { id: "cl2_4", x: 490, y: 360, label: "B4", color: PASTEL_PALETTE[7] },
      { id: "cl3_1", x: 680, y: 180, label: "C1", color: PASTEL_PALETTE[8] },
      { id: "cl3_2", x: 710, y: 210, label: "C2", color: PASTEL_PALETTE[9] },
      { id: "cl3_3", x: 660, y: 230, label: "C3", color: PASTEL_PALETTE[10] },
      { id: "cl3_4", x: 730, y: 160, label: "C4", color: PASTEL_PALETTE[11] },
    ],
  },
};

// ============================================================================
// 3. CORE GEOMETRIC & MATHEMATICAL ROUTINES
// ============================================================================

export const distanceSq = (p1: Point2D, p2: Point2D): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
};

export const distance = (p1: Point2D, p2: Point2D): number => Math.sqrt(distanceSq(p1, p2));

export const crossProduct2D = (o: Point2D, a: Point2D, b: Point2D): number => {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
};

export const isCCW = (a: Point2D, b: Point2D, c: Point2D): boolean => {
  return crossProduct2D(a, b, c) > 1e-9;
};

export const turnOrientation = (a: Point2D, b: Point2D, c: Point2D): "ccw" | "cw" | "collinear" => {
  const cp = crossProduct2D(a, b, c);
  if (Math.abs(cp) <= 1e-9) return "collinear";
  return cp > 0 ? "ccw" : "cw";
};

/**
 * Computes the circumcircle of 3 points (center, radius, radiusSq).
 */
export const computeCircumcircle = (a: Point2D, b: Point2D, c: Point2D): Circumcircle => {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-9) {
    return {
      center: { id: "collinear_center", x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 },
      radius: Infinity,
      radiusSq: Infinity,
      valid: false,
    };
  }
  const aSq = a.x * a.x + a.y * a.y;
  const bSq = b.x * b.x + b.y * b.y;
  const cSq = c.x * c.x + c.y * c.y;

  const ux = (aSq * (b.y - c.y) + bSq * (c.y - a.y) + cSq * (a.y - b.y)) / d;
  const uy = (aSq * (c.x - b.x) + bSq * (a.x - c.x) + cSq * (b.x - a.x)) / d;

  const radSq = (a.x - ux) * (a.x - ux) + (a.y - uy) * (a.y - uy);
  const rad = Math.sqrt(radSq);

  return {
    center: { id: `cc_${Math.round(ux * 10) / 10}_${Math.round(uy * 10) / 10}`, x: ux, y: uy },
    radius: rad,
    radiusSq: radSq,
    valid: true,
  };
};

/**
 * Exact 3x3 determinant test for point in circumcircle:
 * det = | A_x-D_x  A_y-D_y  |A-D|^2 |
 *       | B_x-D_x  B_y-D_y  |B-D|^2 |
 *       | C_x-D_x  C_y-D_y  |C-D|^2 |
 * Normalized by triangle CCW orientation.
 */
export const inCircumcircleDeterminant = (
  a: Point2D,
  b: Point2D,
  c: Point2D,
  d: Point2D,
): number => {
  const ax = a.x - d.x;
  const ay = a.y - d.y;
  const aw = ax * ax + ay * ay;

  const bx = b.x - d.x;
  const by = b.y - d.y;
  const bw = bx * bx + by * by;

  const cx = c.x - d.x;
  const cy = c.y - d.y;
  const cw = cx * cx + cy * cy;

  const det = ax * (by * cw - cy * bw) - ay * (bx * cw - cx * bw) + aw * (bx * cy - cx * by);

  const orient = crossProduct2D(a, b, c);
  return orient >= 0 ? det : -det;
};

export const inCircumcircle = (
  a: Point2D,
  b: Point2D,
  c: Point2D,
  queryPoint: Point2D,
): boolean => {
  const det = inCircumcircleDeterminant(a, b, c, queryPoint);
  return det > 1e-7;
};

/**
 * Clips a polygon against a half-plane defined by the perpendicular bisector of segment (siteI, siteJ),
 * keeping the side closer to siteI.
 */
export const clipPolygonWithBisector = (
  polygon: readonly Point2D[],
  siteI: Point2D,
  siteJ: Point2D,
): Point2D[] => {
  if (polygon.length === 0) return [];
  const midX = (siteI.x + siteJ.x) / 2;
  const midY = (siteI.y + siteJ.y) / 2;
  const nx = siteJ.x - siteI.x;
  const ny = siteJ.y - siteI.y;

  const isInside = (p: Point2D): boolean => {
    return (p.x - midX) * nx + (p.y - midY) * ny <= 1e-9;
  };

  const lineIntersection = (p1: Point2D, p2: Point2D): Point2D => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const denom = dx * nx + dy * ny;
    if (Math.abs(denom) < 1e-12) return p1;
    const t = ((midX - p1.x) * nx + (midY - p1.y) * ny) / denom;
    return {
      id: `clip_${Math.round((p1.x + t * dx) * 10) / 10}_${Math.round((p1.y + t * dy) * 10) / 10}`,
      x: p1.x + t * dx,
      y: p1.y + t * dy,
    };
  };

  const output: Point2D[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const curr = polygon[i];
    const prev = polygon[(i - 1 + polygon.length) % polygon.length];
    const currIn = isInside(curr);
    const prevIn = isInside(prev);

    if (currIn) {
      if (!prevIn) {
        output.push(lineIntersection(prev, curr));
      }
      output.push(curr);
    } else if (prevIn) {
      output.push(lineIntersection(prev, curr));
    }
  }

  return output;
};

/**
 * Computes polygon area and centroid via Shoelace Formula.
 */
export const computePolygonAreaAndCentroid = (
  vertices: readonly Point2D[],
): { area: number; centroid: Point2D } => {
  const n = vertices.length;
  if (n < 3) {
    if (n === 0) return { area: 0, centroid: { id: "c_0", x: 0, y: 0 } };
    return { area: 0, centroid: { id: `c_${vertices[0].id}`, x: vertices[0].x, y: vertices[0].y } };
  }
  let areaSum = 0;
  let cxSum = 0;
  let cySum = 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const factor = vertices[i].x * vertices[j].y - vertices[j].x * vertices[i].y;
    areaSum += factor;
    cxSum += (vertices[i].x + vertices[j].x) * factor;
    cySum += (vertices[i].y + vertices[j].y) * factor;
  }

  const signedArea = areaSum / 2;
  const absArea = Math.abs(signedArea);

  if (absArea < 1e-9) {
    let sumX = 0;
    let sumY = 0;
    for (const v of vertices) {
      sumX += v.x;
      sumY += v.y;
    }
    return { area: 0, centroid: { id: "c_deg", x: sumX / n, y: sumY / n } };
  }

  const cx = cxSum / (6 * signedArea);
  const cy = cySum / (6 * signedArea);

  return {
    area: absArea,
    centroid: { id: `centroid_${Math.round(cx)}_${Math.round(cy)}`, x: cx, y: cy },
  };
};

// ============================================================================
// 4. BOWYER-WATSON INCREMENTAL DELAUNAY TRIANGULATION
// ============================================================================

export const computeBowyerWatsonDelaunay = (
  points: readonly Point2D[],
  bounds: BoundingBox = DEFAULT_BOUNDS,
): BowyerWatsonResult => {
  if (points.length < 3) {
    return {
      triangles: [],
      edges: [],
      steps: [
        {
          stepIndex: 0,
          violatedTriangles: [],
          cavityEdges: [],
          newTriangles: [],
          currentTriangles: [],
          action: "init",
          description: "Insufficient points for triangulation (N < 3).",
        },
      ],
      superTriangle: [
        { id: "st_1", x: bounds.minX, y: bounds.minY },
        { id: "st_2", x: bounds.maxX, y: bounds.minY },
        { id: "st_3", x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY },
      ],
    };
  }

  const steps: BowyerWatsonStep[] = [];
  const minX = Math.min(...points.map((p) => p.x), bounds.minX);
  const maxX = Math.max(...points.map((p) => p.x), bounds.maxX);
  const minY = Math.min(...points.map((p) => p.y), bounds.minY);
  const maxY = Math.max(...points.map((p) => p.y), bounds.maxY);

  const dx = maxX - minX;
  const dy = maxY - minY;
  const deltaMax = Math.max(dx, dy, 200);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  // Super-triangle vertices enclosing all points comfortably
  const st1: Point2D = { id: "__st_1", x: midX - 20 * deltaMax, y: midY - deltaMax, label: "ST1" };
  const st2: Point2D = { id: "__st_2", x: midX, y: midY + 20 * deltaMax, label: "ST2" };
  const st3: Point2D = { id: "__st_3", x: midX + 20 * deltaMax, y: midY - deltaMax, label: "ST3" };

  const superTriangle: [Point2D, Point2D, Point2D] = [st1, st2, st3];
  const stCc = computeCircumcircle(st1, st2, st3);

  let triangles: Triangle2D[] = [
    {
      id: "tri_super",
      a: st1,
      b: st2,
      c: st3,
      circumcenter: stCc.center,
      circumradius: stCc.radius,
      circumradiusSq: stCc.radiusSq,
    },
  ];

  steps.push({
    stepIndex: 0,
    violatedTriangles: [],
    cavityEdges: [],
    newTriangles: triangles,
    currentTriangles: [...triangles],
    action: "init",
    description: `Constructed bounding super-triangle [ST1, ST2, ST3] enclosing ${points.length} points.`,
  });

  for (let ptIdx = 0; ptIdx < points.length; ptIdx++) {
    const p = points[ptIdx];

    // 1. Identify bad triangles whose circumcircles contain p
    const badTriangles: Triangle2D[] = [];
    const validTriangles: Triangle2D[] = [];

    for (const tri of triangles) {
      if (inCircumcircle(tri.a, tri.b, tri.c, p)) {
        badTriangles.push(tri);
      } else {
        validTriangles.push(tri);
      }
    }

    steps.push({
      stepIndex: steps.length,
      insertedPoint: p,
      candidateIndex: ptIdx,
      violatedTriangles: badTriangles,
      cavityEdges: [],
      newTriangles: [],
      currentTriangles: [...triangles],
      action: "find_bad_triangles",
      description: `Inserting site ${p.label ?? p.id} (${p.x}, ${p.y}): found ${badTriangles.length} violated Delaunay circumcircle(s).`,
    });

    // 2. Extract cavity boundary: edges of bad triangles that are NOT shared with any other bad triangle
    const edgeList: { p1: Point2D; p2: Point2D }[] = [];
    for (const tri of badTriangles) {
      edgeList.push({ p1: tri.a, p2: tri.b });
      edgeList.push({ p1: tri.b, p2: tri.c });
      edgeList.push({ p1: tri.c, p2: tri.a });
    }

    const cavityEdges: { p1: Point2D; p2: Point2D }[] = [];
    for (let i = 0; i < edgeList.length; i++) {
      const e1 = edgeList[i];
      let shared = false;
      for (let j = 0; j < edgeList.length; j++) {
        if (i === j) continue;
        const e2 = edgeList[j];
        if (
          (e1.p1.id === e2.p1.id && e1.p2.id === e2.p2.id) ||
          (e1.p1.id === e2.p2.id && e1.p2.id === e2.p1.id)
        ) {
          shared = true;
          break;
        }
      }
      if (!shared) {
        cavityEdges.push(e1);
      }
    }

    steps.push({
      stepIndex: steps.length,
      insertedPoint: p,
      candidateIndex: ptIdx,
      violatedTriangles: badTriangles,
      cavityEdges,
      newTriangles: [],
      currentTriangles: [...validTriangles],
      action: "create_cavity",
      description: `Formed star-shaped cavity with ${cavityEdges.length} boundary edge(s) around site ${p.label ?? p.id}.`,
    });

    // 3. Stitch new triangles from cavity edges to point p
    const stitchedTriangles: Triangle2D[] = [];
    for (let i = 0; i < cavityEdges.length; i++) {
      const edge = cavityEdges[i];
      let a = edge.p1;
      let b = edge.p2;
      let c = p;
      if (!isCCW(a, b, c)) {
        const tmp = a;
        a = b;
        b = tmp;
      }
      const cc = computeCircumcircle(a, b, c);
      stitchedTriangles.push({
        id: `tri_${p.id}_${a.id}_${b.id}_${i}`,
        a,
        b,
        c,
        circumcenter: cc.center,
        circumradius: cc.radius,
        circumradiusSq: cc.radiusSq,
      });
    }

    triangles = [...validTriangles, ...stitchedTriangles];

    steps.push({
      stepIndex: steps.length,
      insertedPoint: p,
      candidateIndex: ptIdx,
      violatedTriangles: [],
      cavityEdges,
      newTriangles: stitchedTriangles,
      currentTriangles: [...triangles],
      action: "stitch_triangles",
      description: `Stitched ${stitchedTriangles.length} new Delaunay triangle(s) connecting site ${p.label ?? p.id} to cavity boundary.`,
    });
  }

  // 4. Remove triangles sharing any super-triangle vertices
  const isSuperVertex = (pt: Point2D): boolean =>
    pt.id === st1.id || pt.id === st2.id || pt.id === st3.id;

  const finalTriangles = triangles.filter(
    (t) => !isSuperVertex(t.a) && !isSuperVertex(t.b) && !isSuperVertex(t.c),
  );

  steps.push({
    stepIndex: steps.length,
    violatedTriangles: [],
    cavityEdges: [],
    newTriangles: [],
    currentTriangles: finalTriangles,
    action: "cleanup_super_triangle",
    description: `Cleaned up auxiliary super-triangle. Finalized ${finalTriangles.length} valid Delaunay triangles.`,
  });

  // Extract unique Delaunay edges
  const edgeMap = new Map<string, { p1: Point2D; p2: Point2D; triangleIds: string[] }>();
  for (const tri of finalTriangles) {
    const triEdges = [
      [tri.a, tri.b],
      [tri.b, tri.c],
      [tri.c, tri.a],
    ];
    for (const [u, v] of triEdges) {
      const key = u.id < v.id ? `${u.id}_${v.id}` : `${v.id}_${u.id}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.triangleIds.push(tri.id);
      } else {
        edgeMap.set(key, { p1: u, p2: v, triangleIds: [tri.id] });
      }
    }
  }

  const edges: DelaunayEdge[] = Array.from(edgeMap.entries()).map(([key, data]) => ({
    id: `del_edge_${key}`,
    p1: data.p1,
    p2: data.p2,
    length: distance(data.p1, data.p2),
    triangleIds: data.triangleIds,
  }));

  steps.push({
    stepIndex: steps.length,
    violatedTriangles: [],
    cavityEdges: [],
    newTriangles: [],
    currentTriangles: finalTriangles,
    action: "done",
    description: `Delaunay Triangulation complete: ${finalTriangles.length} triangles, ${edges.length} edges.`,
  });

  return {
    triangles: finalTriangles,
    edges,
    steps,
    superTriangle,
  };
};

// ============================================================================
// 5. VORONOI DIAGRAM GENERATION & LLOYD'S RELAXATION
// ============================================================================

export const computeVoronoiDiagramFromDelaunay = (
  points: readonly Point2D[],
  triangles: readonly Triangle2D[],
  bounds: BoundingBox = DEFAULT_BOUNDS,
): {
  cells: readonly VoronoiCell[];
  vertices: readonly Point2D[];
  edges: readonly VoronoiEdge[];
} => {
  if (points.length === 0) {
    return { cells: [], vertices: [], edges: [] };
  }

  const initialBoundingPoly: readonly Point2D[] = [
    { id: "bb_tl", x: bounds.minX, y: bounds.minY },
    { id: "bb_tr", x: bounds.maxX, y: bounds.minY },
    { id: "bb_br", x: bounds.maxX, y: bounds.maxY },
    { id: "bb_bl", x: bounds.minX, y: bounds.maxY },
  ];

  // Map each site to its neighbors via Delaunay triangles
  const neighborsMap = new Map<string, Set<string>>();
  for (const p of points) {
    neighborsMap.set(p.id, new Set());
  }

  for (const tri of triangles) {
    neighborsMap.get(tri.a.id)?.add(tri.b.id);
    neighborsMap.get(tri.a.id)?.add(tri.c.id);
    neighborsMap.get(tri.b.id)?.add(tri.a.id);
    neighborsMap.get(tri.b.id)?.add(tri.c.id);
    neighborsMap.get(tri.c.id)?.add(tri.a.id);
    neighborsMap.get(tri.c.id)?.add(tri.b.id);
  }

  const cells: VoronoiCell[] = [];
  const pointLookup = new Map<string, Point2D>(points.map((p) => [p.id, p]));

  for (const site of points) {
    let cellPoly = initialBoundingPoly;
    const neighborIds = Array.from(neighborsMap.get(site.id) ?? []);

    // Clip bounding polygon against perpendicular bisectors with all Delaunay neighbors
    // (or all other sites if neighbors is empty/small)
    const clipTargets =
      neighborIds.length > 0
        ? neighborIds.map((id) => pointLookup.get(id)!).filter(Boolean)
        : points.filter((p) => p.id !== site.id);

    for (const neighbor of clipTargets) {
      cellPoly = clipPolygonWithBisector(cellPoly, site, neighbor);
    }

    const { area, centroid } = computePolygonAreaAndCentroid(cellPoly);

    cells.push({
      siteId: site.id,
      site,
      vertices: cellPoly,
      area,
      centroid,
      neighborSiteIds: neighborIds,
      isClosed: cellPoly.length >= 3,
      color: site.color,
    });
  }

  // Voronoi vertices are triangle circumcenters
  const voronoiVertices = triangles.map((t) => t.circumcenter);

  // Voronoi edges connecting adjacent triangle circumcenters
  const voronoiEdges: VoronoiEdge[] = [];
  for (let i = 0; i < triangles.length; i++) {
    for (let j = i + 1; j < triangles.length; j++) {
      const t1 = triangles[i];
      const t2 = triangles[j];
      // Count shared vertices
      const shared: Point2D[] = [];
      for (const v1 of [t1.a, t1.b, t1.c]) {
        for (const v2 of [t2.a, t2.b, t2.c]) {
          if (v1.id === v2.id) {
            shared.push(v1);
          }
        }
      }
      if (shared.length === 2) {
        voronoiEdges.push({
          id: `vedge_${t1.id}_${t2.id}`,
          p1: t1.circumcenter,
          p2: t2.circumcenter,
          site1Id: shared[0].id,
          site2Id: shared[1].id,
        });
      }
    }
  }

  return {
    cells,
    vertices: voronoiVertices,
    edges: voronoiEdges,
  };
};

/**
 * Performs Lloyd's Relaxation step: Moves each site to its Voronoi cell centroid.
 */
export const computeLloydRelaxation = (
  points: readonly Point2D[],
  bounds: BoundingBox = DEFAULT_BOUNDS,
  iterations: number = 1,
): Point2D[] => {
  let currentPoints = [...points];

  for (let iter = 0; iter < iterations; iter++) {
    const delaunay = computeBowyerWatsonDelaunay(currentPoints, bounds);
    const voronoi = computeVoronoiDiagramFromDelaunay(currentPoints, delaunay.triangles, bounds);

    currentPoints = voronoi.cells.map((cell, idx) => {
      const original = currentPoints[idx] ?? cell.site;
      const target = cell.isClosed && cell.area > 1e-3 ? cell.centroid : original;
      const clampedX = Math.max(bounds.minX + 15, Math.min(bounds.maxX - 15, target.x));
      const clampedY = Math.max(bounds.minY + 15, Math.min(bounds.maxY - 15, target.y));

      return {
        ...original,
        x: Math.round(clampedX * 10) / 10,
        y: Math.round(clampedY * 10) / 10,
      };
    });
  }

  return currentPoints;
};

// ============================================================================
// 6. FORTUNE'S SWEEP-LINE SIMULATION
// ============================================================================

export const computeFortuneSweep = (
  points: readonly Point2D[],
  bounds: BoundingBox = DEFAULT_BOUNDS,
): {
  steps: readonly FortuneSweepStep[];
  allEvents: readonly FortuneEvent[];
} => {
  if (points.length === 0) {
    return { steps: [], allEvents: [] };
  }

  const delaunay = computeBowyerWatsonDelaunay(points, bounds);

  // 1. Generate Site Events
  const siteEvents: SiteEvent[] = points.map((p) => ({
    id: `sevent_${p.id}`,
    type: "site",
    sweepY: p.y,
    site: p,
  }));

  // 2. Generate Circle Events from Delaunay triangles
  const circleEvents: CircleEvent[] = [];
  for (const tri of delaunay.triangles) {
    const sweepTriggerY = tri.circumcenter.y + tri.circumradius;
    // Valid circle event triggers when sweep line reaches lowest point of circumcircle
    if (
      sweepTriggerY >= Math.max(tri.a.y, tri.b.y, tri.c.y) &&
      Number.isFinite(sweepTriggerY) &&
      tri.circumradius < 1000
    ) {
      circleEvents.push({
        id: `cevent_${tri.id}`,
        type: "circle",
        sweepY: sweepTriggerY,
        circumcenter: tri.circumcenter,
        radius: tri.circumradius,
        sites: [tri.a, tri.b, tri.c],
        triangleId: tri.id,
        valid: true,
      });
    }
  }

  // Combine and sort events by sweepY ascending
  const allEvents: FortuneEvent[] = [...siteEvents, ...circleEvents].sort(
    (a, b) => a.sweepY - b.sweepY,
  );

  const steps: FortuneSweepStep[] = [];

  // Initial step at top of canvas
  steps.push({
    stepIndex: 0,
    sweepY: bounds.minY,
    activeSites: [],
    circleEvents,
    arcs: [],
    breakpoints: [],
    voronoiVertices: [],
    voronoiEdges: [],
    action: "init",
    description: `Sweep-line initialized at y = ${bounds.minY}px with ${siteEvents.length} site events and ${circleEvents.length} circle events.`,
  });

  // Sample sweep positions across each event and intermediate intervals
  for (let eventIdx = 0; eventIdx < allEvents.length; eventIdx++) {
    const event = allEvents[eventIdx];
    const sweepY = event.sweepY;

    // Active sites above or at sweep line
    const activeSites = points.filter((p) => p.y <= sweepY);

    // Active circle events upcoming
    const pendingCircleEvents = circleEvents.filter((ce) => ce.sweepY >= sweepY);

    // Completed Voronoi vertices formed at or above sweep line
    const completedTriangles = delaunay.triangles.filter(
      (t) => t.circumcenter.y + t.circumradius <= sweepY + 1e-4,
    );
    const voronoiVertices = completedTriangles.map((t) => t.circumcenter);

    // Completed Voronoi edges
    const voronoiEdges: VoronoiEdge[] = [];
    for (let i = 0; i < completedTriangles.length; i++) {
      for (let j = i + 1; j < completedTriangles.length; j++) {
        const t1 = completedTriangles[i];
        const t2 = completedTriangles[j];
        const shared = [t1.a, t1.b, t1.c].filter((v1) =>
          [t2.a, t2.b, t2.c].some((v2) => v2.id === v1.id),
        );
        if (shared.length === 2) {
          voronoiEdges.push({
            id: `fe_${t1.id}_${t2.id}`,
            p1: t1.circumcenter,
            p2: t2.circumcenter,
            site1Id: shared[0].id,
            site2Id: shared[1].id,
          });
        }
      }
    }

    // Compute Beachline Parabolic Arcs for active sites
    const arcs: BeachlineArc[] = [];
    const sampleCount = 60;
    const xSpan = bounds.maxX - bounds.minX;

    for (const site of activeSites) {
      const deltaY = site.y - sweepY;
      if (Math.abs(deltaY) < 1e-4) continue; // Site exactly on sweep line

      const samples: Point2D[] = [];
      for (let s = 0; s <= sampleCount; s++) {
        const x = bounds.minX + (s / sampleCount) * xSpan;
        // Parabola equation: y(x) = ((x - px)^2 + py^2 - ys^2) / (2(py - ys))
        const yVal = ((x - site.x) ** 2 + site.y ** 2 - sweepY ** 2) / (2 * (site.y - sweepY));
        if (yVal >= bounds.minY - 50 && yVal <= sweepY + 100) {
          samples.push({ id: `sample_${s}`, x, y: yVal });
        }
      }

      arcs.push({
        site,
        xMin: bounds.minX,
        xMax: bounds.maxX,
        samples,
      });
    }

    const isSite = event.type === "site";
    const desc = isSite
      ? `Site Event at y = ${Math.round(sweepY)}px: New parabolic arc inserted for site ${(event as SiteEvent).site.label ?? (event as SiteEvent).site.id}.`
      : `Circle Event at y = ${Math.round(sweepY)}px: Beachline arc collapsed, finalizing Voronoi vertex at (${Math.round((event as CircleEvent).circumcenter.x)}, ${Math.round((event as CircleEvent).circumcenter.y)}).`;

    steps.push({
      stepIndex: steps.length,
      sweepY,
      currentEvent: event,
      activeSites,
      circleEvents: pendingCircleEvents,
      arcs,
      breakpoints: [],
      voronoiVertices,
      voronoiEdges,
      action: isSite ? "site_event" : "circle_event",
      description: desc,
    });
  }

  // Final step at bottom of canvas
  steps.push({
    stepIndex: steps.length,
    sweepY: bounds.maxY,
    activeSites: points,
    circleEvents: [],
    arcs: [],
    breakpoints: [],
    voronoiVertices: delaunay.triangles.map((t) => t.circumcenter),
    voronoiEdges: [],
    action: "done",
    description: `Sweep-line reached bottom boundary y = ${bounds.maxY}px. Fortune's Voronoi diagram complete.`,
  });

  return { steps, allEvents };
};

// ============================================================================
// 7. DISJOINT SET UNION (DSU) & EUCLIDEAN MINIMUM SPANNING TREE (EMST)
// ============================================================================

export class DisjointSetUnion {
  private readonly parent: number[];
  private readonly rank: number[];
  private components: number;

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.components = n;
  }

  public find(i: number): number {
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }

  public union(i: number, j: number): boolean {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI === rootJ) return false;

    if (this.rank[rootI] < this.rank[rootJ]) {
      this.parent[rootI] = rootJ;
    } else if (this.rank[rootI] > this.rank[rootJ]) {
      this.parent[rootJ] = rootI;
    } else {
      this.parent[rootJ] = rootI;
      this.rank[rootI]++;
    }
    this.components--;
    return true;
  }

  public connected(i: number, j: number): boolean {
    return this.find(i) === this.find(j);
  }

  public getComponentCount(): number {
    return this.components;
  }
}

/**
 * Computes EMST in O(N log N) using Kruskal's algorithm on Delaunay edges.
 */
export const computeEMST = (
  points: readonly Point2D[],
  delaunayTriangles: readonly Triangle2D[],
): EMSTResult => {
  if (points.length < 2) {
    return {
      mstEdges: [],
      allEdges: [],
      totalWeight: 0,
      steps: [
        {
          stepIndex: 0,
          action: "init",
          mstEdges: [],
          totalWeight: 0,
          componentsCount: points.length,
          description: "Insufficient vertices for MST (N < 2).",
        },
      ],
    };
  }

  const pointIndexMap = new Map<string, number>();
  points.forEach((p, idx) => pointIndexMap.set(p.id, idx));

  // Extract unique Delaunay edges
  const edgeMap = new Map<string, { u: Point2D; v: Point2D; weight: number }>();
  for (const tri of delaunayTriangles) {
    const pairs = [
      [tri.a, tri.b],
      [tri.b, tri.c],
      [tri.c, tri.a],
    ];
    for (const [u, v] of pairs) {
      const key = u.id < v.id ? `${u.id}_${v.id}` : `${v.id}_${u.id}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { u, v, weight: distance(u, v) });
      }
    }
  }

  // Sort Delaunay edges by Euclidean weight ascending
  const sortedEdges: EMSTEdge[] = Array.from(edgeMap.entries())
    .map(([key, data]) => ({
      id: `emst_${key}`,
      u: data.u,
      v: data.v,
      weight: data.weight,
      status: "uninspected" as EMSTEdgeStatus,
    }))
    .sort((a, b) => a.weight - b.weight);

  const dsu = new DisjointSetUnion(points.length);
  const mstEdges: EMSTEdge[] = [];
  const steps: EMSTStep[] = [];
  let totalWeight = 0;

  steps.push({
    stepIndex: 0,
    action: "init",
    mstEdges: [],
    totalWeight: 0,
    componentsCount: points.length,
    description: `Extracted ${sortedEdges.length} Delaunay edges. Initialized Kruskal's algorithm with ${points.length} disjoint components.`,
  });

  for (let i = 0; i < sortedEdges.length; i++) {
    const edge = sortedEdges[i];
    const uIdx = pointIndexMap.get(edge.u.id);
    const vIdx = pointIndexMap.get(edge.v.id);

    if (uIdx === undefined || vIdx === undefined) continue;

    const connectsDisjoint = !dsu.connected(uIdx, vIdx);

    if (connectsDisjoint) {
      dsu.union(uIdx, vIdx);
      const acceptedEdge: EMSTEdge = { ...edge, status: "accepted" };
      mstEdges.push(acceptedEdge);
      totalWeight += edge.weight;

      steps.push({
        stepIndex: steps.length,
        currentEdge: acceptedEdge,
        action: "accept",
        mstEdges: [...mstEdges],
        totalWeight,
        componentsCount: dsu.getComponentCount(),
        description: `Accepted edge (${edge.u.label ?? edge.u.id} - ${edge.v.label ?? edge.v.id}, wt = ${edge.weight.toFixed(1)}): merged components. Remaining components: ${dsu.getComponentCount()}.`,
      });

      if (mstEdges.length === points.length - 1) {
        break; // Spanning tree complete
      }
    } else {
      const rejectedEdge: EMSTEdge = { ...edge, status: "rejected_cycle" };
      steps.push({
        stepIndex: steps.length,
        currentEdge: rejectedEdge,
        action: "reject",
        mstEdges: [...mstEdges],
        totalWeight,
        componentsCount: dsu.getComponentCount(),
        description: `Rejected edge (${edge.u.label ?? edge.u.id} - ${edge.v.label ?? edge.v.id}, wt = ${edge.weight.toFixed(1)}): creates a cycle in existing component.`,
      });
    }
  }

  steps.push({
    stepIndex: steps.length,
    action: "done",
    mstEdges: [...mstEdges],
    totalWeight,
    componentsCount: dsu.getComponentCount(),
    description: `EMST computation complete: ${mstEdges.length} tree edges, total weight = ${totalWeight.toFixed(2)}.`,
  });

  return {
    mstEdges,
    allEdges: sortedEdges,
    totalWeight,
    steps,
  };
};

/**
 * Brute-force complete graph K_N MST for optimality verification.
 */
export const computeBruteForceMST = (
  points: readonly Point2D[],
): { mstEdges: readonly EMSTEdge[]; totalWeight: number } => {
  if (points.length < 2) return { mstEdges: [], totalWeight: 0 };

  const pointIndexMap = new Map<string, number>();
  points.forEach((p, idx) => pointIndexMap.set(p.id, idx));

  const allPairsEdges: EMSTEdge[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      allPairsEdges.push({
        id: `bf_${points[i].id}_${points[j].id}`,
        u: points[i],
        v: points[j],
        weight: distance(points[i], points[j]),
        status: "uninspected",
      });
    }
  }

  allPairsEdges.sort((a, b) => a.weight - b.weight);

  const dsu = new DisjointSetUnion(points.length);
  const mstEdges: EMSTEdge[] = [];
  let totalWeight = 0;

  for (const edge of allPairsEdges) {
    const uIdx = pointIndexMap.get(edge.u.id)!;
    const vIdx = pointIndexMap.get(edge.v.id)!;
    if (!dsu.connected(uIdx, vIdx)) {
      dsu.union(uIdx, vIdx);
      mstEdges.push({ ...edge, status: "accepted" });
      totalWeight += edge.weight;
      if (mstEdges.length === points.length - 1) break;
    }
  }

  return { mstEdges, totalWeight };
};

// ============================================================================
// 8. TELEMETRY & EULER PLANAR INVARIANT
// ============================================================================

export const computeVoronoiStudioTelemetry = (
  points: readonly Point2D[],
  triangles: readonly Triangle2D[],
  edges: readonly DelaunayEdge[],
  voronoiEdges: readonly VoronoiEdge[],
  emstWeight: number,
): VoronoiStudioTelemetry => {
  const V = points.length;
  const E = edges.length;
  const F = triangles.length + 1; // Euler planar faces including exterior face

  // Planar Euler formula: V - E + F = 2 (for connected graph)
  const eulerCharacteristic = V - E + F;
  const isEulerValid = V < 3 || eulerCharacteristic === 2;

  // Degrees
  const degreeMap = new Map<string, number>();
  for (const p of points) degreeMap.set(p.id, 0);
  for (const edge of edges) {
    degreeMap.set(edge.p1.id, (degreeMap.get(edge.p1.id) ?? 0) + 1);
    degreeMap.set(edge.p2.id, (degreeMap.get(edge.p2.id) ?? 0) + 1);
  }

  const degrees = Array.from(degreeMap.values());
  const averageDegree =
    degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;
  const maxDegree = degrees.length > 0 ? Math.max(...degrees) : 0;

  return {
    numPoints: V,
    numTriangles: triangles.length,
    numDelaunayEdges: E,
    numVoronoiVertices: triangles.length,
    numVoronoiEdges: voronoiEdges.length,
    emstTotalWeight: emstWeight,
    eulerCharacteristic,
    isEulerValid,
    averageDegree,
    maxDegree,
  };
};

// ============================================================================
// 9. PROPS & COMPONENT IMPLEMENTATION
// ============================================================================

export interface VoronoiDelaunayStudioProps {
  readonly initialModality?: VoronoiStudioModality;
  readonly initialPreset?: VoronoiPresetId;
  readonly customPoints?: readonly Point2D[];
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onModalityChange?: (modality: VoronoiStudioModality) => void;
  readonly onPointsChange?: (points: readonly Point2D[]) => void;
}

export const VoronoiDelaunayStudio: React.FC<VoronoiDelaunayStudioProps> = ({
  initialModality = "fortune_sweep_voronoi",
  initialPreset = "random_poisson_disk",
  customPoints,
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT,
  standalone = true,
  title = "Voronoi & Delaunay Triangulation Studio",
  onModalityChange,
  onPointsChange,
}) => {
  // Container & Canvas sizing
  const { ref: containerRef, box: canvasBox } = useCanvasBox({ width, height });
  const activeWidth = canvasBox.width > 0 ? canvasBox.width : width;
  const activeHeight = canvasBox.height > 0 ? canvasBox.height : height;

  const canvasBounds: BoundingBox = useMemo(
    () => ({
      minX: 20,
      minY: 20,
      maxX: Math.max(activeWidth - 20, 200),
      maxY: Math.max(activeHeight - 20, 200),
    }),
    [activeWidth, activeHeight],
  );

  // State
  const [modality, setModality] = useState<VoronoiStudioModality>(initialModality);
  const [selectedPresetId, setSelectedPresetId] = useState<VoronoiPresetId>(initialPreset);
  const [points, setPoints] = useState<readonly Point2D[]>(
    customPoints ?? VORONOI_STUDIO_PRESETS[initialPreset].points,
  );

  // Animation & Stepping
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [stepIndex, setStepIndex] = useState<number>(0);

  // Modality-Specific Controls
  const [sweepLineY, setSweepLineY] = useState<number>(260);
  const [dualMorphRatio, setDualMorphRatio] = useState<number>(0.5); // 0 = Delaunay, 1 = Voronoi

  // Toggles
  const [showVoronoiCells, setShowVoronoiCells] = useState<boolean>(true);
  const [showDelaunayMesh, setShowDelaunayMesh] = useState<boolean>(true);
  const [showCircumcircles, setShowCircumcircles] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  // Dragging state
  const [draggingSiteId, setDraggingSiteId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Notify parent of points change
  const handlePointsUpdated = useCallback(
    (newPoints: readonly Point2D[]) => {
      setPoints(newPoints);
      onPointsChange?.(newPoints);
    },
    [onPointsChange],
  );

  const handleModalityChange = (newModality: VoronoiStudioModality) => {
    setModality(newModality);
    setIsPlaying(false);
    setStepIndex(0);
    onModalityChange?.(newModality);
  };

  const handlePresetSelect = (presetId: VoronoiPresetId) => {
    setSelectedPresetId(presetId);
    const newPts = VORONOI_STUDIO_PRESETS[presetId].points;
    handlePointsUpdated(newPts);
    setIsPlaying(false);
    setStepIndex(0);
  };

  // Lloyd's relaxation handler
  const handleRelaxLloyd = (iterations: number) => {
    const relaxed = computeLloydRelaxation(points, canvasBounds, iterations);
    handlePointsUpdated(relaxed);
  };

  // Add random site
  const handleAddRandomSite = () => {
    const id = `p_${Date.now().toString(36)}`;
    const pad = 40;
    const x = Math.round(pad + Math.random() * (canvasBounds.maxX - canvasBounds.minX - pad * 2));
    const y = Math.round(pad + Math.random() * (canvasBounds.maxY - canvasBounds.minY - pad * 2));
    const newSite: Point2D = {
      id,
      x,
      y,
      label: `P${points.length + 1}`,
      color: PASTEL_PALETTE[points.length % PASTEL_PALETTE.length],
    };
    handlePointsUpdated([...points, newSite]);
  };

  // Clear all points
  const handleClearPoints = () => {
    handlePointsUpdated([]);
    setSelectedSiteId(null);
  };

  // Reset to default preset
  const handleReset = () => {
    const pts = VORONOI_STUDIO_PRESETS[selectedPresetId].points;
    handlePointsUpdated(pts);
    setStepIndex(0);
    setIsPlaying(false);
    setSweepLineY((canvasBounds.minY + canvasBounds.maxY) / 2);
    setDualMorphRatio(0.5);
  };

  // ==========================================================================
  // COMPUTED ALGORITHMIC RESULTS
  // ==========================================================================

  // Delaunay Triangulation
  const delaunayResult = useMemo(
    () => computeBowyerWatsonDelaunay(points, canvasBounds),
    [points, canvasBounds],
  );

  // Voronoi Diagram
  const voronoiResult = useMemo(
    () => computeVoronoiDiagramFromDelaunay(points, delaunayResult.triangles, canvasBounds),
    [points, delaunayResult.triangles, canvasBounds],
  );

  // Fortune's Sweep Simulation
  const fortuneResult = useMemo(
    () => computeFortuneSweep(points, canvasBounds),
    [points, canvasBounds],
  );

  // EMST Result
  const emstResult = useMemo(
    () => computeEMST(points, delaunayResult.triangles),
    [points, delaunayResult.triangles],
  );

  // Telemetry HUD
  const telemetry = useMemo(
    () =>
      computeVoronoiStudioTelemetry(
        points,
        delaunayResult.triangles,
        delaunayResult.edges,
        voronoiResult.edges,
        emstResult.totalWeight,
      ),
    [
      points,
      delaunayResult.triangles,
      delaunayResult.edges,
      voronoiResult.edges,
      emstResult.totalWeight,
    ],
  );

  // Active steps based on modality
  const totalSteps = useMemo(() => {
    switch (modality) {
      case "bowyer_watson_delaunay":
        return delaunayResult.steps.length;
      case "fortune_sweep_voronoi":
        return fortuneResult.steps.length;
      case "euclidean_minimum_spanning_tree":
        return emstResult.steps.length;
      case "dual_graph_morphing":
      default:
        return 100;
    }
  }, [modality, delaunayResult.steps.length, fortuneResult.steps.length, emstResult.steps.length]);

  const activeBowyerWatsonStep = useMemo(() => {
    if (delaunayResult.steps.length === 0) return undefined;
    const idx = Math.min(stepIndex, delaunayResult.steps.length - 1);
    return delaunayResult.steps[idx];
  }, [delaunayResult.steps, stepIndex]);

  const activeFortuneStep = useMemo(() => {
    if (fortuneResult.steps.length === 0) return undefined;
    const idx = Math.min(stepIndex, fortuneResult.steps.length - 1);
    return fortuneResult.steps[idx];
  }, [fortuneResult.steps, stepIndex]);

  const activeEMSTStep = useMemo(() => {
    if (emstResult.steps.length === 0) return undefined;
    const idx = Math.min(stepIndex, emstResult.steps.length - 1);
    return emstResult.steps[idx];
  }, [emstResult.steps, stepIndex]);

  // Autoplay timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(100, Math.round(800 / playbackSpeed));
    const timer = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, totalSteps]);

  // Sync sweep position with Fortune step
  useEffect(() => {
    if (modality === "fortune_sweep_voronoi" && activeFortuneStep) {
      setSweepLineY(activeFortuneStep.sweepY);
    }
  }, [modality, activeFortuneStep]);

  // Canvas Mouse / Drag Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked near an existing site
    const clickedSite = points.find(
      (p) => distanceSq(p, { id: "test", x: clickX, y: clickY }) <= 144,
    );

    if (e.shiftKey && clickedSite) {
      // Shift-click: Delete site
      handlePointsUpdated(points.filter((p) => p.id !== clickedSite.id));
      if (selectedSiteId === clickedSite.id) setSelectedSiteId(null);
    } else if (clickedSite) {
      // Select site and initiate drag
      setSelectedSiteId(clickedSite.id);
      setDraggingSiteId(clickedSite.id);
    } else {
      // Click empty canvas: Add new site
      setSelectedSiteId(null);
      const newId = `p_${Date.now().toString(36)}`;
      const newPt: Point2D = {
        id: newId,
        x: Math.round(clickX),
        y: Math.round(clickY),
        label: `P${points.length + 1}`,
        color: PASTEL_PALETTE[points.length % PASTEL_PALETTE.length],
      };
      handlePointsUpdated([...points, newPt]);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingSiteId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const newX = Math.max(canvasBounds.minX, Math.min(canvasBounds.maxX, e.clientX - rect.left));
    const newY = Math.max(canvasBounds.minY, Math.min(canvasBounds.maxY, e.clientY - rect.top));

    handlePointsUpdated(
      points.map((p) =>
        p.id === draggingSiteId ? { ...p, x: Math.round(newX), y: Math.round(newY) } : p,
      ),
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingSiteId(null);
  };

  // ==========================================================================
  // RENDER HELPERS
  // ==========================================================================

  const selectedSite = useMemo(
    () => points.find((p) => p.id === selectedSiteId),
    [points, selectedSiteId],
  );

  const selectedCell = useMemo(
    () => voronoiResult.cells.find((c) => c.siteId === selectedSiteId),
    [voronoiResult.cells, selectedSiteId],
  );

  return (
    <div
      ref={containerRef}
      className={`flex flex-col w-full bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden select-none ${
        standalone ? "min-h-[780px]" : "h-full"
      }`}
    >
      {/* -------------------------------------------------------------------- */}
      {/* 1. STUDIO HEADER & MODALITY TABS                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-lg shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {title}
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 font-mono">
                  v3.0 Planar Dual
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Fortune's Sweep-Line, Bowyer-Watson Delaunay, Dual Morphing & Euclidean MST
              </p>
            </div>
          </div>
        </div>

        {/* Modality Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-x-auto max-w-full">
          {VORONOI_MODALITIES.map((mod) => {
            const isActive = modality === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleModalityChange(mod.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                {mod.id === "fortune_sweep_voronoi" && <Activity className="w-3.5 h-3.5" />}
                {mod.id === "bowyer_watson_delaunay" && <Workflow className="w-3.5 h-3.5" />}
                {mod.id === "dual_graph_morphing" && <Layers className="w-3.5 h-3.5" />}
                {mod.id === "euclidean_minimum_spanning_tree" && (
                  <Network className="w-3.5 h-3.5" />
                )}
                <span>{mod.shortName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? "bg-black/30 text-cyan-200" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {mod.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 2. TOOLBAR & PRESET BAR                                               */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs gap-3">
        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Preset:</span>
          <select
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value as VoronoiPresetId)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
          >
            {Object.values(VORONOI_STUDIO_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        {/* Lloyd's Relaxation Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleRelaxLloyd(1)}
            title="Move each site to its Voronoi cell centroid (1 iteration)"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 rounded transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Relax 1x</span>
          </button>
          <button
            onClick={() => handleRelaxLloyd(5)}
            title="Move each site to its Voronoi cell centroid (5 iterations)"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/50 rounded transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Relax 5x</span>
          </button>
        </div>

        {/* Site Mutation Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddRandomSite}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Site</span>
          </button>
          <button
            onClick={handleClearPoints}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded border border-slate-700 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Reset</span>
          </button>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
          <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showVoronoiCells}
              onChange={(e) => setShowVoronoiCells(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span>Voronoi</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showDelaunayMesh}
              onChange={(e) => setShowDelaunayMesh(e.target.checked)}
              className="accent-indigo-500 rounded"
            />
            <span>Delaunay</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showCircumcircles}
              onChange={(e) => setShowCircumcircles(e.target.checked)}
              className="accent-amber-500 rounded"
            />
            <span>Circumcircles</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="accent-violet-500 rounded"
            />
            <span>Labels</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="accent-slate-500 rounded"
            />
            <span>Grid</span>
          </label>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. MAIN INTERACTIVE SVG CANVAS                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[440px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${activeWidth} ${activeHeight}`}
          className="w-full h-full cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* SVG Definitions */}
          <defs>
            <pattern id="voronoi_grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.6" />
            </pattern>
            <linearGradient id="emstGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          {showGrid && <rect width={activeWidth} height={activeHeight} fill="url(#voronoi_grid)" />}

          {/* Canvas Bounding Frame */}
          <rect
            x={canvasBounds.minX}
            y={canvasBounds.minY}
            width={canvasBounds.maxX - canvasBounds.minX}
            height={canvasBounds.maxY - canvasBounds.minY}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="pointer-events-none opacity-40"
          />

          {/* ---------------------------------------------------------------- */}
          {/* MODALITY 1: FORTUNE'S SWEEP-LINE RENDERING                       */}
          {/* ---------------------------------------------------------------- */}
          {modality === "fortune_sweep_voronoi" && (
            <g className="fortune-sweep-layer pointer-events-none">
              {/* Completed Voronoi Vertices and Edges */}
              {activeFortuneStep?.voronoiEdges.map((ve, idx) => (
                <line
                  key={`f_ve_${idx}`}
                  x1={ve.p1.x}
                  y1={ve.p1.y}
                  x2={ve.p2.x}
                  y2={ve.p2.y}
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeOpacity="0.8"
                />
              ))}

              {activeFortuneStep?.voronoiVertices.map((vv, idx) => (
                <circle
                  key={`f_vv_${idx}`}
                  cx={vv.x}
                  cy={vv.y}
                  r="3.5"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />
              ))}

              {/* Beachline Parabolic Arcs */}
              {activeFortuneStep?.arcs.map((arc, idx) => {
                if (arc.samples.length < 2) return null;
                const pathData = arc.samples.reduce(
                  (acc, pt, i) =>
                    `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`,
                  "",
                );
                return (
                  <path
                    key={`arc_${arc.site.id}_${idx}`}
                    d={pathData}
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="2"
                    strokeOpacity="0.75"
                  />
                );
              })}

              {/* Pending Circle Event Triggers */}
              {activeFortuneStep?.circleEvents.map((ce) => (
                <g key={ce.id} className="opacity-60">
                  <circle
                    cx={ce.circumcenter.x}
                    cy={ce.circumcenter.y}
                    r={ce.radius}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={ce.circumcenter.x}
                    cy={ce.circumcenter.y + ce.radius}
                    r="4"
                    fill="#ef4444"
                  />
                </g>
              ))}

              {/* Sweep Line */}
              <line
                x1={canvasBounds.minX}
                y1={sweepLineY}
                x2={canvasBounds.maxX}
                y2={sweepLineY}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                filter="url(#glowFilter)"
              />
              <text
                x={canvasBounds.minX + 8}
                y={Math.max(sweepLineY - 6, canvasBounds.minY + 14)}
                fill="#38bdf8"
                fontSize="11"
                fontWeight="bold"
                fontFamily="monospace"
              >
                Sweep Line y = {Math.round(sweepLineY)}px
              </text>
            </g>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* MODALITY 2: BOWYER-WATSON INCREMENTAL RENDERING                  */}
          {/* ---------------------------------------------------------------- */}
          {modality === "bowyer_watson_delaunay" && activeBowyerWatsonStep && (
            <g className="bowyer-watson-layer pointer-events-none">
              {/* Violated Bad Triangles Fill */}
              {activeBowyerWatsonStep.violatedTriangles.map((tri, idx) => (
                <g key={`bad_tri_${tri.id}_${idx}`}>
                  <polygon
                    points={`${tri.a.x},${tri.a.y} ${tri.b.x},${tri.b.y} ${tri.c.x},${tri.c.y}`}
                    fill="#ef4444"
                    fillOpacity="0.25"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                  />
                  {/* Violated Circumcircle */}
                  <circle
                    cx={tri.circumcenter.x}
                    cy={tri.circumcenter.y}
                    r={tri.circumradius}
                    fill="#ef4444"
                    fillOpacity="0.06"
                    stroke="#ef4444"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                  />
                </g>
              ))}

              {/* Cavity Boundary Edges */}
              {activeBowyerWatsonStep.cavityEdges.map((edge, idx) => (
                <line
                  key={`cavity_edge_${idx}`}
                  x1={edge.p1.x}
                  y1={edge.p1.y}
                  x2={edge.p2.x}
                  y2={edge.p2.y}
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="5 3"
                />
              ))}

              {/* Newly Stitched Triangles */}
              {activeBowyerWatsonStep.newTriangles.map((tri, idx) => (
                <polygon
                  key={`new_tri_${tri.id}_${idx}`}
                  points={`${tri.a.x},${tri.a.y} ${tri.b.x},${tri.b.y} ${tri.c.x},${tri.c.y}`}
                  fill="#10b981"
                  fillOpacity="0.2"
                  stroke="#10b981"
                  strokeWidth="2"
                />
              ))}

              {/* Active Inserted Site Highlight */}
              {activeBowyerWatsonStep.insertedPoint && (
                <circle
                  cx={activeBowyerWatsonStep.insertedPoint.x}
                  cy={activeBowyerWatsonStep.insertedPoint.y}
                  r="9"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  filter="url(#glowFilter)"
                />
              )}
            </g>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* MODALITY 3: DUAL GRAPH MORPHING RENDERING                        */}
          {/* ---------------------------------------------------------------- */}
          {modality === "dual_graph_morphing" && (
            <g className="dual-morphing-layer pointer-events-none">
              {/* Voronoi Cells (Morph Opacity) */}
              {voronoiResult.cells.map((cell) => {
                if (cell.vertices.length < 3) return null;
                const pointsAttr = cell.vertices.map((v) => `${v.x},${v.y}`).join(" ");
                return (
                  <polygon
                    key={`morph_cell_${cell.siteId}`}
                    points={pointsAttr}
                    fill={cell.color ?? "#0ea5e9"}
                    fillOpacity={0.1 + 0.25 * dualMorphRatio}
                    stroke="#0284c7"
                    strokeWidth={1 + dualMorphRatio}
                    strokeOpacity={0.4 + 0.5 * dualMorphRatio}
                  />
                );
              })}

              {/* Interpolated Morphed Edges */}
              {voronoiResult.edges.map((ve, idx) => {
                const s1 = points.find((p) => p.id === ve.site1Id);
                const s2 = points.find((p) => p.id === ve.site2Id);
                if (!s1 || !s2) return null;

                // Delaunay edge endpoints
                const d1 = s1;
                const d2 = s2;
                // Voronoi edge endpoints
                const v1 = ve.p1;
                const v2 = ve.p2;

                // Interpolated endpoints
                const m1x = (1 - dualMorphRatio) * d1.x + dualMorphRatio * v1.x;
                const m1y = (1 - dualMorphRatio) * d1.y + dualMorphRatio * v1.y;
                const m2x = (1 - dualMorphRatio) * d2.x + dualMorphRatio * v2.x;
                const m2y = (1 - dualMorphRatio) * d2.y + dualMorphRatio * v2.y;

                return (
                  <line
                    key={`morph_edge_${idx}`}
                    x1={m1x}
                    y1={m1y}
                    x2={m2x}
                    y2={m2y}
                    stroke={dualMorphRatio > 0.5 ? "#38bdf8" : "#818cf8"}
                    strokeWidth={1.5 + Math.abs(dualMorphRatio - 0.5)}
                    strokeOpacity="0.8"
                  />
                );
              })}
            </g>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* MODALITY 4: EUCLIDEAN MST RENDERING                              */}
          {/* ---------------------------------------------------------------- */}
          {modality === "euclidean_minimum_spanning_tree" && (
            <g className="emst-layer pointer-events-none">
              {/* Non-MST Delaunay Edges (Dashed) */}
              {emstResult.allEdges.map((edge) => {
                const isAccepted = emstResult.mstEdges.some((me) => me.id === edge.id);
                if (isAccepted) return null;
                return (
                  <line
                    key={`del_non_mst_${edge.id}`}
                    x1={edge.u.x}
                    y1={edge.u.y}
                    x2={edge.v.x}
                    y2={edge.v.y}
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    strokeOpacity="0.5"
                  />
                );
              })}

              {/* Accepted EMST Edges */}
              {emstResult.mstEdges.map((edge) => (
                <line
                  key={`mst_${edge.id}`}
                  x1={edge.u.x}
                  y1={edge.u.y}
                  x2={edge.v.x}
                  y2={edge.v.y}
                  stroke="url(#emstGradient)"
                  strokeWidth="3"
                  filter="url(#glowFilter)"
                />
              ))}

              {/* Currently Inspected Edge */}
              {activeEMSTStep?.currentEdge && (
                <line
                  x1={activeEMSTStep.currentEdge.u.x}
                  y1={activeEMSTStep.currentEdge.u.y}
                  x2={activeEMSTStep.currentEdge.v.x}
                  y2={activeEMSTStep.currentEdge.v.y}
                  stroke={activeEMSTStep.action === "accept" ? "#10b981" : "#ef4444"}
                  strokeWidth="4"
                />
              )}
            </g>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* BASE VORONOI CELLS & DELAUNAY MESH (STANDARD VISIBILITY)          */}
          {/* ---------------------------------------------------------------- */}
          {showVoronoiCells && modality !== "dual_graph_morphing" && (
            <g className="voronoi-cells-layer">
              {voronoiResult.cells.map((cell) => {
                if (cell.vertices.length < 3) return null;
                const isSelected = selectedSiteId === cell.siteId;
                const pointsAttr = cell.vertices.map((v) => `${v.x},${v.y}`).join(" ");

                return (
                  <polygon
                    key={`cell_${cell.siteId}`}
                    points={pointsAttr}
                    fill={cell.color ?? "#0ea5e9"}
                    fillOpacity={isSelected ? 0.35 : 0.15}
                    stroke="#0284c7"
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={isSelected ? 0.9 : 0.4}
                    className="cursor-pointer transition-all duration-150 hover:fill-opacity-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSiteId(cell.siteId);
                    }}
                  />
                );
              })}
            </g>
          )}

          {showDelaunayMesh && modality !== "dual_graph_morphing" && (
            <g className="delaunay-triangles-layer pointer-events-none">
              {delaunayResult.triangles.map((tri) => (
                <polygon
                  key={tri.id}
                  points={`${tri.a.x},${tri.a.y} ${tri.b.x},${tri.b.y} ${tri.c.x},${tri.c.y}`}
                  fill="#6366f1"
                  fillOpacity="0.08"
                  stroke="#818cf8"
                  strokeWidth="1.2"
                  strokeOpacity="0.65"
                />
              ))}
            </g>
          )}

          {/* Circumcircle Halos */}
          {showCircumcircles && (
            <g className="circumcircles-layer pointer-events-none">
              {delaunayResult.triangles.map((tri) => {
                if (tri.circumradius > 1200) return null;
                return (
                  <g key={`cc_halo_${tri.id}`}>
                    <circle
                      cx={tri.circumcenter.x}
                      cy={tri.circumcenter.y}
                      r={tri.circumradius}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                      strokeOpacity="0.35"
                    />
                    <circle
                      cx={tri.circumcenter.x}
                      cy={tri.circumcenter.y}
                      r="2.5"
                      fill="#f59e0b"
                      strokeOpacity="0.7"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* SITE POINTS (DRAGGABLE)                                          */}
          {/* ---------------------------------------------------------------- */}
          <g className="site-points-layer">
            {points.map((p) => {
              const isSelected = selectedSiteId === p.id;
              const isDragging = draggingSiteId === p.id;

              return (
                <g
                  key={p.id}
                  transform={`translate(${p.x}, ${p.y})`}
                  className="cursor-move"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedSiteId(p.id);
                    setDraggingSiteId(p.id);
                  }}
                >
                  {/* Outer Pulsing Aura */}
                  {isSelected && (
                    <circle
                      r="14"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                      filter="url(#glowFilter)"
                    />
                  )}

                  {/* Main Site Dot */}
                  <circle
                    r={isSelected || isDragging ? 7 : 5.5}
                    fill={p.color ?? "#38bdf8"}
                    stroke="#0f172a"
                    strokeWidth="2"
                    className="transition-transform duration-75"
                  />

                  {/* Label Text */}
                  {showLabels && (
                    <text
                      x="9"
                      y="4"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="pointer-events-none select-none drop-shadow"
                    >
                      {p.label ?? p.id}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Selected Site Card */}
        {selectedSite && selectedCell && (
          <div className="absolute top-4 right-4 p-3 bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-700/80 shadow-xl text-xs flex flex-col gap-1 w-56 animate-fade-in pointer-events-none">
            <div className="flex items-center justify-between font-bold text-cyan-300 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedSite.color ?? "#38bdf8" }}
                />
                Site {selectedSite.label ?? selectedSite.id}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                ({selectedSite.x}, {selectedSite.y})
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Cell Area:</span>
              <span className="font-mono text-slate-200">{Math.round(selectedCell.area)} px²</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Delaunay Degree:</span>
              <span className="font-mono text-slate-200">
                {selectedCell.neighborSiteIds.length}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Centroid:</span>
              <span className="font-mono text-slate-200">
                ({Math.round(selectedCell.centroid.x)}, {Math.round(selectedCell.centroid.y)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 4. MODALITY PLAYBACK CONTROLS & STEPPER                               */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-col px-6 py-3 bg-slate-900/80 border-t border-slate-800 gap-2">
        {/* Playback Button Controls & Scrubbing */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md font-medium text-xs shadow-md shadow-cyan-900/30 transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>

            <button
              onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              disabled={stepIndex === 0}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700"
              title="Step Back"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setStepIndex((prev) => Math.min(totalSteps - 1, prev + 1))}
              disabled={stepIndex >= totalSteps - 1}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded border border-slate-700"
              title="Step Forward"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* Playback Speed */}
            <div className="flex items-center gap-1 text-xs text-slate-400 ml-2">
              <span>Speed:</span>
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    playbackSpeed === spd
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-700"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Stepper Slider */}
          <div className="flex-1 flex items-center gap-3 min-w-[200px] max-w-md">
            <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
              Step {stepIndex + 1} / {Math.max(1, totalSteps)}
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(0, totalSteps - 1)}
              value={stepIndex}
              onChange={(e) => setStepIndex(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Modality Specific Sliders */}
          {modality === "dual_graph_morphing" && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-xs text-indigo-300 font-medium">Delaunay</span>
              <input
                type="range"
                min="0"
                max="100"
                value={Math.round(dualMorphRatio * 100)}
                onChange={(e) => setDualMorphRatio(parseInt(e.target.value, 10) / 100)}
                className="w-28 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-xs text-cyan-300 font-medium">
                Voronoi ({Math.round(dualMorphRatio * 100)}%)
              </span>
            </div>
          )}

          {modality === "fortune_sweep_voronoi" && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
              <span className="text-xs text-cyan-300 font-medium font-mono">Sweep Y:</span>
              <input
                type="range"
                min={canvasBounds.minY}
                max={canvasBounds.maxY}
                value={sweepLineY}
                onChange={(e) => setSweepLineY(parseInt(e.target.value, 10))}
                className="w-32 accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{Math.round(sweepLineY)}px</span>
            </div>
          )}
        </div>

        {/* Step Description Bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 rounded border border-slate-800/80 text-xs text-slate-300">
          <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span className="font-mono text-cyan-300">
            {modality === "bowyer_watson_delaunay" &&
              (activeBowyerWatsonStep?.description ?? "Ready.")}
            {modality === "fortune_sweep_voronoi" && (activeFortuneStep?.description ?? "Ready.")}
            {modality === "euclidean_minimum_spanning_tree" &&
              (activeEMSTStep?.description ?? "Ready.")}
            {modality === "dual_graph_morphing" &&
              `Morphing planar duality at ${(dualMorphRatio * 100).toFixed(0)}%: Delaunay edges rotate 90° into orthogonal Voronoi bisectors.`}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 5. TELEMETRY & EDUCATIONAL HUD                                        */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex flex-col bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Sites (N)</span>
          <span className="text-lg font-bold text-cyan-400 font-mono">{telemetry.numPoints}</span>
        </div>

        <div className="flex flex-col bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Delaunay Triangles</span>
          <span className="text-lg font-bold text-indigo-400 font-mono">
            {telemetry.numTriangles}
          </span>
        </div>

        <div className="flex flex-col bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Delaunay Edges</span>
          <span className="text-lg font-bold text-violet-400 font-mono">
            {telemetry.numDelaunayEdges}
          </span>
        </div>

        <div className="flex flex-col bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Voronoi Vertices</span>
          <span className="text-lg font-bold text-emerald-400 font-mono">
            {telemetry.numVoronoiVertices}
          </span>
        </div>

        <div className="flex flex-col bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">EMST Total Length</span>
          <span className="text-lg font-bold text-amber-400 font-mono">
            {telemetry.emstTotalWeight.toFixed(1)} px
          </span>
        </div>

        <div className="flex flex-col bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-slate-400">Euler Planar Invariant</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-slate-200 font-mono">
              V - E + F = {telemetry.eulerCharacteristic}
            </span>
            {telemetry.isEulerValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <span className="text-[10px] text-amber-400">Planar</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
