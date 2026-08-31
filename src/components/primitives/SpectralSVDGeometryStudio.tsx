import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Grid,
  Activity,
  Compass,
  Layers,
  Info,
  Shuffle,
} from "lucide-react";
import { useCanvasBox } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type SpectralStudioMode = "svd" | "eigen" | "gram_schmidt" | "covariance";

export type SpectralPresetId =
  | "shear"
  | "rotation"
  | "scaling"
  | "singular"
  | "ill_conditioned"
  | "covariance"
  | "saddle_reflection"
  | "identity";

export type Matrix2x2 = [[number, number], [number, number]];
export type Vector2 = [number, number];

export interface ComplexNumber {
  readonly re: number;
  readonly im: number;
}

export interface SVDResult2x2 {
  readonly U: Matrix2x2;
  readonly sigma: [number, number];
  readonly Sigma: Matrix2x2;
  readonly Vt: Matrix2x2;
  readonly V: Matrix2x2;
  readonly reconstruction: Matrix2x2;
  readonly reconstructionError: number;
  readonly u1: Vector2;
  readonly u2: Vector2;
  readonly v1: Vector2;
  readonly v2: Vector2;
  readonly conditionNumber: number;
  readonly thetaV: number;
  readonly thetaU: number;
  readonly detU: number;
  readonly detV: number;
}

export type EigenClassification =
  | "stable_node"
  | "unstable_node"
  | "saddle"
  | "stable_spiral"
  | "unstable_spiral"
  | "center"
  | "star_node"
  | "degenerate_defective"
  | "line_of_fixed_points";

export interface EigenResult2x2 {
  readonly eigenvalues: [number, number];
  readonly eigenvaluesComplex?: [ComplexNumber, ComplexNumber];
  readonly isReal: boolean;
  readonly isDefective: boolean;
  readonly discriminant: number;
  readonly trace: number;
  readonly determinant: number;
  readonly eigenvectors: [Vector2, Vector2];
  readonly classification: EigenClassification;
  readonly algebraicMultiplicity: [number, number] | number;
  readonly geometricMultiplicity: [number, number] | number;
}

export interface GramSchmidtResult2x2 {
  readonly v1: Vector2;
  readonly v2: Vector2;
  readonly u1: Vector2;
  readonly q1: Vector2;
  readonly projV2OnQ1: Vector2;
  readonly projScalar: number;
  readonly u2: Vector2;
  readonly q2: Vector2;
  readonly Q: Matrix2x2;
  readonly R: Matrix2x2;
  readonly orthogonalityLoss: number;
  readonly dotProduct: number;
  readonly reconstructionError: number;
  readonly isLinearlyDependent: boolean;
}

export interface ConfidenceEllipseInfo {
  readonly radiusX: number;
  readonly radiusY: number;
  readonly prob: number;
}

export interface MahalanobisResult2x2 {
  readonly mean: Vector2;
  readonly covariance: Matrix2x2;
  readonly precision: Matrix2x2;
  readonly point: Vector2;
  readonly diff: Vector2;
  readonly euclideanDistance: number;
  readonly mahalanobisDistance: number;
  readonly mahalanobisDistanceSquared: number;
  readonly eigenvalues: [number, number];
  readonly eigenvectors: [Vector2, Vector2];
  readonly whitenedPoint: Vector2;
  readonly whiteningMatrix: Matrix2x2;
  readonly confidenceEllipses: {
    readonly sigma1: ConfidenceEllipseInfo;
    readonly sigma2: ConfidenceEllipseInfo;
    readonly sigma3: ConfidenceEllipseInfo;
  };
  readonly isPositiveDefinite: boolean;
}

export interface MatrixProperties2x2 {
  readonly determinant: number;
  readonly trace: number;
  readonly frobeniusNorm: number;
  readonly rank: number;
  readonly conditionNumber: number;
  readonly isInvertible: boolean;
  readonly inverse: Matrix2x2 | null;
  readonly isSymmetric: boolean;
  readonly isOrthogonal: boolean;
}

export interface SpectralPreset {
  readonly id: SpectralPresetId;
  readonly name: string;
  readonly category: "geometric" | "singular" | "spectral" | "statistical";
  readonly matrix: Matrix2x2;
  readonly description: string;
  readonly recommendedMode: SpectralStudioMode;
  readonly theoryExplanation: string;
  readonly probePoint?: Vector2;
}

export interface SpectralSVDGeometryStudioProps {
  readonly initialMode?: SpectralStudioMode;
  readonly initialPreset?: SpectralPresetId;
  readonly initialMatrix?: Matrix2x2;
  readonly width?: number;
  readonly height?: number;
  readonly title?: string;
  readonly showTheory?: boolean;
  readonly standalone?: boolean;
  readonly onMatrixChange?: (m: Matrix2x2) => void;
  readonly onModeChange?: (mode: SpectralStudioMode) => void;
}

// ============================================================================
// 2. PURE MATHEMATICAL UTILITY FUNCTIONS
// ============================================================================

/**
 * Computes the complete Singular Value Decomposition A = U Σ V^T for a real 2x2 matrix.
 * Always guarantees U Σ V^T = A, U^T U = I, V^T V = I, and σ₁ >= σ₂ >= 0.
 */
export function computeSVD2x2(A: Matrix2x2): SVDResult2x2 {
  const [[a, b], [c, d]] = A;

  // Form S = A^T A = [[E, F], [F, G]]
  const E = a * a + c * c;
  const G = b * b + d * d;
  const F = a * b + c * d;

  // Eigenvalues of A^T A (squares of singular values)
  const traceS = E + G;
  const deltaS = Math.max(0, (E - G) * (E - G) + 4 * F * F);
  const sqrtDeltaS = Math.sqrt(deltaS);

  const sigma1Sq = Math.max(0, (traceS + sqrtDeltaS) / 2);
  const sigma2Sq = Math.max(0, (traceS - sqrtDeltaS) / 2);

  const sigma1 = Math.sqrt(sigma1Sq);
  const sigma2 = Math.sqrt(sigma2Sq);

  // Right singular vectors V = [v1, v2]
  // Angle of principal axis of A^T A
  let thetaV = 0;
  if (Math.abs(F) > 1e-12 || Math.abs(E - G) > 1e-12) {
    thetaV = 0.5 * Math.atan2(2 * F, E - G);
  }

  const v1: Vector2 = [Math.cos(thetaV), Math.sin(thetaV)];
  const v2: Vector2 = [-Math.sin(thetaV), Math.cos(thetaV)];

  const V: Matrix2x2 = [
    [v1[0], v2[0]],
    [v1[1], v2[1]],
  ];
  const Vt: Matrix2x2 = [
    [v1[0], v1[1]],
    [v2[0], v2[1]],
  ];

  // Left singular vectors U = [u1, u2]
  let u1: Vector2 = [1, 0];
  let u2: Vector2 = [0, 1];

  const detA = a * d - b * c;

  if (sigma1 > 1e-12) {
    const Av1_x = a * v1[0] + b * v1[1];
    const Av1_y = c * v1[0] + d * v1[1];
    const len1 = Math.sqrt(Av1_x * Av1_x + Av1_y * Av1_y);
    u1 = len1 > 1e-12 ? [Av1_x / len1, Av1_y / len1] : [1, 0];

    if (sigma2 > 1e-12) {
      const Av2_x = a * v2[0] + b * v2[1];
      const Av2_y = c * v2[0] + d * v2[1];
      const len2 = Math.sqrt(Av2_x * Av2_x + Av2_y * Av2_y);
      u2 = len2 > 1e-12 ? [Av2_x / len2, Av2_y / len2] : [-u1[1], u1[0]];
    } else {
      // Rank 1 degenerate case: construct orthogonal u2 with consistent sign
      const sign = detA < 0 ? -1 : 1;
      u2 = [-u1[1] * sign, u1[0] * sign];
    }
  } else {
    // Rank 0 (zero matrix)
    u1 = [1, 0];
    u2 = [0, 1];
  }

  const U: Matrix2x2 = [
    [u1[0], u2[0]],
    [u1[1], u2[1]],
  ];

  const Sigma: Matrix2x2 = [
    [sigma1, 0],
    [0, sigma2],
  ];

  // Reconstructed matrix: U * Sigma * Vt
  // U * Sigma = [[sigma1 * u1x, sigma2 * u2x], [sigma1 * u1y, sigma2 * u2y]]
  const rec00 = sigma1 * u1[0] * v1[0] + sigma2 * u2[0] * v2[0];
  const rec01 = sigma1 * u1[0] * v1[1] + sigma2 * u2[0] * v2[1];
  const rec10 = sigma1 * u1[1] * v1[0] + sigma2 * u2[1] * v2[0];
  const rec11 = sigma1 * u1[1] * v1[1] + sigma2 * u2[1] * v2[1];

  const reconstruction: Matrix2x2 = [
    [rec00, rec01],
    [rec10, rec11],
  ];

  const err00 = rec00 - a;
  const err01 = rec01 - b;
  const err10 = rec10 - c;
  const err11 = rec11 - d;
  const reconstructionError = Math.sqrt(
    err00 * err00 + err01 * err01 + err10 * err10 + err11 * err11,
  );

  const conditionNumber = sigma2 > 1e-12 ? sigma1 / sigma2 : Infinity;
  const thetaU = Math.atan2(u1[1], u1[0]);
  const detU = u1[0] * u2[1] - u1[1] * u2[0];
  const detV = v1[0] * v2[1] - v1[1] * v2[0];

  return {
    U,
    sigma: [sigma1, sigma2],
    Sigma,
    Vt,
    V,
    reconstruction,
    reconstructionError,
    u1,
    u2,
    v1,
    v2,
    conditionNumber,
    thetaV,
    thetaU,
    detU,
    detV,
  };
}

/**
 * Computes the analytical eigendecomposition of a 2x2 matrix,
 * including complex eigenvalues, defective matrix classification, and trace-determinant bifurcation.
 */
export function computeEigendecomposition2x2(A: Matrix2x2): EigenResult2x2 {
  const [[a, b], [c, d]] = A;

  const trace = a + d;
  const determinant = a * d - b * c;
  const discriminant = trace * trace - 4 * determinant;

  let classification: EigenClassification = "stable_node";
  let isReal = true;
  let isDefective = false;
  let eigenvalues: [number, number] = [0, 0];
  let eigenvaluesComplex: [ComplexNumber, ComplexNumber] | undefined = undefined;
  let eigenvectors: [Vector2, Vector2] = [
    [1, 0],
    [0, 1],
  ];
  let algebraicMultiplicity: [number, number] | number = [1, 1];
  let geometricMultiplicity: [number, number] | number = [1, 1];

  if (discriminant > 1e-10) {
    // Two distinct real eigenvalues
    isReal = true;
    const sqrtD = Math.sqrt(discriminant);
    const lambda1 = (trace + sqrtD) / 2;
    const lambda2 = (trace - sqrtD) / 2;
    eigenvalues = [lambda1, lambda2];

    // Compute eigenvector for lambda1: (A - lambda1 I) v1 = 0
    const findEigenvector = (lam: number): Vector2 => {
      // Candidates: [b, lam - a] or [lam - d, c]
      const cand1: Vector2 = [b, lam - a];
      const cand2: Vector2 = [lam - d, c];
      const len1 = Math.sqrt(cand1[0] * cand1[0] + cand1[1] * cand1[1]);
      const len2 = Math.sqrt(cand2[0] * cand2[0] + cand2[1] * cand2[1]);

      if (len1 >= len2 && len1 > 1e-12) {
        return [cand1[0] / len1, cand1[1] / len1];
      }
      if (len2 > 1e-12) {
        return [cand2[0] / len2, cand2[1] / len2];
      }
      // Diagonal fallback
      return Math.abs(a - lam) < 1e-9 ? [1, 0] : [0, 1];
    };

    const ev1 = findEigenvector(lambda1);
    const ev2 = findEigenvector(lambda2);
    eigenvectors = [ev1, ev2];
    algebraicMultiplicity = [1, 1];
    geometricMultiplicity = [1, 1];

    // Classification
    if (determinant < -1e-10) {
      classification = "saddle";
    } else if (Math.abs(determinant) <= 1e-10) {
      classification = "line_of_fixed_points";
    } else if (trace < -1e-10) {
      classification = "stable_node";
    } else if (trace > 1e-10) {
      classification = "unstable_node";
    } else {
      classification = "saddle";
    }
  } else if (Math.abs(discriminant) <= 1e-10) {
    // Repeated real eigenvalue
    isReal = true;
    const lambda = trace / 2;
    eigenvalues = [lambda, lambda];
    algebraicMultiplicity = 2;

    // Check if matrix is scalar: A = lambda * I
    const diffNorm = Math.sqrt(
      (a - lambda) * (a - lambda) + b * b + c * c + (d - lambda) * (d - lambda),
    );

    if (diffNorm < 1e-9) {
      // Scalar matrix: geometric multiplicity = 2
      isDefective = false;
      geometricMultiplicity = 2;
      eigenvectors = [
        [1, 0],
        [0, 1],
      ];
      classification = "star_node";
    } else {
      // Defective matrix (shear / Jordan block)
      isDefective = true;
      geometricMultiplicity = 1;
      const cand1: Vector2 = [b, lambda - a];
      const cand2: Vector2 = [lambda - d, c];
      const len1 = Math.sqrt(cand1[0] * cand1[0] + cand1[1] * cand1[1]);
      const len2 = Math.sqrt(cand2[0] * cand2[0] + cand2[1] * cand2[1]);
      let ev1: Vector2 = [1, 0];
      if (len1 >= len2 && len1 > 1e-12) {
        ev1 = [cand1[0] / len1, cand1[1] / len1];
      } else if (len2 > 1e-12) {
        ev1 = [cand2[0] / len2, cand2[1] / len2];
      }
      eigenvectors = [ev1, [-ev1[1], ev1[0]]];
      classification = "degenerate_defective";
    }
  } else {
    // Complex conjugate eigenvalues: alpha +/- i * beta
    isReal = false;
    isDefective = false;
    const alpha = trace / 2;
    const beta = Math.sqrt(-discriminant) / 2;
    eigenvalues = [alpha, alpha];
    eigenvaluesComplex = [
      { re: alpha, im: beta },
      { re: alpha, im: -beta },
    ];
    algebraicMultiplicity = [1, 1];
    geometricMultiplicity = [1, 1];
    eigenvectors = [
      [1, 0],
      [0, 1],
    ];

    const isOrthogonalRotation =
      Math.abs(a - d) < 1e-6 && Math.abs(b + c) < 1e-6 && Math.abs(determinant - 1) < 1e-6;

    if (Math.abs(trace) < 1e-10 || isOrthogonalRotation) {
      classification = "center";
    } else if (trace < 0) {
      classification = "stable_spiral";
    } else {
      classification = "unstable_spiral";
    }
  }

  return {
    eigenvalues,
    eigenvaluesComplex,
    isReal,
    isDefective,
    discriminant,
    trace,
    determinant,
    eigenvectors,
    classification,
    algebraicMultiplicity,
    geometricMultiplicity,
  };
}

/**
 * Computes Modified Gram-Schmidt (MGS) Orthogonalization for the columns of a 2x2 matrix,
 * producing orthonormal basis Q, upper triangular R, and orthogonality loss metrics.
 */
export function computeGramSchmidt2x2(A: Matrix2x2): GramSchmidtResult2x2 {
  const [[a, b], [c, d]] = A;

  // Column vectors v1, v2
  const v1: Vector2 = [a, c];
  const v2: Vector2 = [b, d];

  // Step 1: u1 = v1, normalize to q1
  const u1: Vector2 = [v1[0], v1[1]];
  const normU1 = Math.sqrt(u1[0] * u1[0] + u1[1] * u1[1]);
  const q1: Vector2 = normU1 > 1e-12 ? [u1[0] / normU1, u1[1] / normU1] : [1, 0];

  // Step 2: Project v2 onto q1
  const projScalar = v2[0] * q1[0] + v2[1] * q1[1];
  const projV2OnQ1: Vector2 = [projScalar * q1[0], projScalar * q1[1]];

  // Step 3: Orthogonal residual u2 = v2 - proj_{q1}(v2)
  const u2: Vector2 = [v2[0] - projV2OnQ1[0], v2[1] - projV2OnQ1[1]];
  const normU2 = Math.sqrt(u2[0] * u2[0] + u2[1] * u2[1]);

  // Step 4: Normalize u2 to q2 (with robust orthogonal complement fallback for linearly dependent input)
  const isLinearlyDependent = normU1 <= 1e-12 || normU2 <= 1e-10;
  const q2: Vector2 = normU2 > 1e-10 ? [u2[0] / normU2, u2[1] / normU2] : [-q1[1], q1[0]];

  // Matrix Q = [q1, q2]
  const Q: Matrix2x2 = [
    [q1[0], q2[0]],
    [q1[1], q2[1]],
  ];

  // Matrix R = [[||u1||, projScalar], [0, ||u2||]]
  const R: Matrix2x2 = [
    [normU1, projScalar],
    [0, normU2],
  ];

  // Orthogonality loss: ||Q^T Q - I||_F
  const dotProduct = q1[0] * q2[0] + q1[1] * q2[1];
  const q1DotQ1 = q1[0] * q1[0] + q1[1] * q1[1];
  const q2DotQ2 = q2[0] * q2[0] + q2[1] * q2[1];
  const orthogonalityLoss = Math.sqrt(
    (q1DotQ1 - 1) * (q1DotQ1 - 1) + 2 * dotProduct * dotProduct + (q2DotQ2 - 1) * (q2DotQ2 - 1),
  );

  // Reconstruction error: ||Q R - A||_F
  const qr00 = Q[0][0] * R[0][0] + Q[0][1] * R[1][0];
  const qr01 = Q[0][0] * R[0][1] + Q[0][1] * R[1][1];
  const qr10 = Q[1][0] * R[0][0] + Q[1][1] * R[1][0];
  const qr11 = Q[1][0] * R[0][1] + Q[1][1] * R[1][1];

  const reconstructionError = Math.sqrt(
    (qr00 - a) * (qr00 - a) +
      (qr01 - b) * (qr01 - b) +
      (qr10 - c) * (qr10 - c) +
      (qr11 - d) * (qr11 - d),
  );

  return {
    v1,
    v2,
    u1,
    q1,
    projV2OnQ1,
    projScalar,
    u2,
    q2,
    Q,
    R,
    orthogonalityLoss,
    dotProduct,
    reconstructionError,
    isLinearlyDependent,
  };
}

/**
 * Computes the Mahalanobis distance metric, PCA confidence contours,
 * and Whitening transformation z = Σ^{-1/2} (x - μ) for a 2D covariance matrix.
 */
export function computeMahalanobis2x2(
  C: Matrix2x2,
  point: Vector2,
  mean: Vector2 = [0, 0],
): MahalanobisResult2x2 {
  // Symmetrize covariance matrix
  const [[c00, c01], [c10, c11]] = C;
  const s00 = Math.max(0, c00);
  const s11 = Math.max(0, c11);
  const s01 = (c01 + c10) / 2;

  const covariance: Matrix2x2 = [
    [s00, s01],
    [s01, s11],
  ];

  const detC = s00 * s11 - s01 * s01;
  const traceC = s00 + s11;
  const deltaC = Math.max(0, (s00 - s11) * (s00 - s11) + 4 * s01 * s01);
  const sqrtDeltaC = Math.sqrt(deltaC);

  const lambda1 = Math.max(0, (traceC + sqrtDeltaC) / 2);
  const lambda2 = Math.max(0, (traceC - sqrtDeltaC) / 2);
  const isPositiveDefinite = lambda1 > 1e-10 && lambda2 > 1e-10 && detC > 1e-10;

  // Precision matrix C^{-1}
  let precision: Matrix2x2 = [
    [1, 0],
    [0, 1],
  ];
  if (isPositiveDefinite) {
    precision = [
      [s11 / detC, -s01 / detC],
      [-s01 / detC, s00 / detC],
    ];
  }

  // PCA Eigenvectors
  let thetaC = 0;
  if (Math.abs(s01) > 1e-12 || Math.abs(s00 - s11) > 1e-12) {
    thetaC = 0.5 * Math.atan2(2 * s01, s00 - s11);
  }

  const u1: Vector2 = [Math.cos(thetaC), Math.sin(thetaC)];
  const u2: Vector2 = [-Math.sin(thetaC), Math.cos(thetaC)];
  const eigenvectors: [Vector2, Vector2] = [u1, u2];

  // Distances for probe point
  const diff: Vector2 = [point[0] - mean[0], point[1] - mean[1]];
  const euclideanDistance = Math.sqrt(diff[0] * diff[0] + diff[1] * diff[1]);

  const mahalSq =
    diff[0] * (precision[0][0] * diff[0] + precision[0][1] * diff[1]) +
    diff[1] * (precision[1][0] * diff[0] + precision[1][1] * diff[1]);

  const mahalanobisDistanceSquared = Math.max(0, mahalSq);
  const mahalanobisDistance = Math.sqrt(mahalanobisDistanceSquared);

  // Whitening Matrix C^{-1/2} = U Lambda^{-1/2} U^T
  const invSqrt1 = lambda1 > 1e-12 ? 1 / Math.sqrt(lambda1) : 0;
  const invSqrt2 = lambda2 > 1e-12 ? 1 / Math.sqrt(lambda2) : 0;

  const w00 = invSqrt1 * u1[0] * u1[0] + invSqrt2 * u2[0] * u2[0];
  const w01 = invSqrt1 * u1[0] * u1[1] + invSqrt2 * u2[0] * u2[1];
  const w10 = w01;
  const w11 = invSqrt1 * u1[1] * u1[1] + invSqrt2 * u2[1] * u2[1];

  const whiteningMatrix: Matrix2x2 = [
    [w00, w01],
    [w10, w11],
  ];

  const whitenedPoint: Vector2 = [
    whiteningMatrix[0][0] * diff[0] + whiteningMatrix[0][1] * diff[1],
    whiteningMatrix[1][0] * diff[0] + whiteningMatrix[1][1] * diff[1],
  ];

  // Confidence Ellipses Radii (1-sigma, 2-sigma, 3-sigma)
  const confidenceEllipses = {
    sigma1: {
      radiusX: 1 * Math.sqrt(lambda1),
      radiusY: 1 * Math.sqrt(lambda2),
      prob: 1 - Math.exp(-0.5), // ~39.35%
    },
    sigma2: {
      radiusX: 2 * Math.sqrt(lambda1),
      radiusY: 2 * Math.sqrt(lambda2),
      prob: 1 - Math.exp(-2.0), // ~86.47%
    },
    sigma3: {
      radiusX: 3 * Math.sqrt(lambda1),
      radiusY: 3 * Math.sqrt(lambda2),
      prob: 1 - Math.exp(-4.5), // ~98.89%
    },
  };

  return {
    mean,
    covariance,
    precision,
    point,
    diff,
    euclideanDistance,
    mahalanobisDistance,
    mahalanobisDistanceSquared,
    eigenvalues: [lambda1, lambda2],
    eigenvectors,
    whitenedPoint,
    whiteningMatrix,
    confidenceEllipses,
    isPositiveDefinite,
  };
}

/**
 * Computes general matrix properties for a 2x2 matrix:
 * Determinant, Trace, Frobenius norm, Rank, Condition Number, Invertibility, Symmetry, Orthogonality.
 */
export function computeMatrixProperties2x2(A: Matrix2x2): MatrixProperties2x2 {
  const [[a, b], [c, d]] = A;
  const determinant = a * d - b * c;
  const trace = a + d;
  const frobeniusNorm = Math.sqrt(a * a + b * b + c * c + d * d);

  const svd = computeSVD2x2(A);
  const conditionNumber = svd.conditionNumber;

  const isInvertible = Math.abs(determinant) > 1e-10;
  const inverse: Matrix2x2 | null = isInvertible
    ? [
        [d / determinant, -b / determinant],
        [-c / determinant, a / determinant],
      ]
    : null;

  let rank = 2;
  if (Math.abs(determinant) <= 1e-10) {
    rank = frobeniusNorm > 1e-10 ? 1 : 0;
  }

  const isSymmetric = Math.abs(b - c) < 1e-9;

  // Check if A^T A = I
  const ata00 = a * a + c * c;
  const ata01 = a * b + c * d;
  const ata11 = b * b + d * d;
  const isOrthogonal =
    Math.abs(ata00 - 1) < 1e-6 && Math.abs(ata11 - 1) < 1e-6 && Math.abs(ata01) < 1e-6;

  return {
    determinant,
    trace,
    frobeniusNorm,
    rank,
    conditionNumber,
    isInvertible,
    inverse,
    isSymmetric,
    isOrthogonal,
  };
}

// ============================================================================
// 3. PRESETS DEFINITION
// ============================================================================

export const SPECTRAL_STUDIO_PRESETS: Record<SpectralPresetId, SpectralPreset> = {
  shear: {
    id: "shear",
    name: "Horizontal Shear",
    category: "geometric",
    matrix: [
      [1.0, 1.2],
      [0.0, 1.0],
    ],
    description:
      "Slants Cartesian grid lines horizontally while preserving unit area (det = 1) and leaving the x-axis invariant.",
    recommendedMode: "svd",
    theoryExplanation:
      "Shear transformations possess repeated eigenvalue λ = 1 but only a single linearly independent eigenvector, making them defective. SVD smoothly decomposes the strain into principal elongation directions.",
    probePoint: [1.2, 1.0],
  },
  rotation: {
    id: "rotation",
    name: "Pure Rotation (45°)",
    category: "geometric",
    matrix: [
      [Math.cos(Math.PI / 4), -Math.sin(Math.PI / 4)],
      [Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)],
    ],
    description:
      "Orthogonal transformation rotating all vectors rigidly by 45° without strain or volumetric change.",
    recommendedMode: "eigen",
    theoryExplanation:
      "Pure 2D rotations have no real eigenvectors (complex eigenvalues e^(±iθ)), giving rise to closed circular periodic orbits in continuous spectral flow.",
    probePoint: [1.0, 1.0],
  },
  scaling: {
    id: "scaling",
    name: "Anisotropic Scaling",
    category: "geometric",
    matrix: [
      [2.0, 0.0],
      [0.0, 0.6],
    ],
    description: "Stretches along the x-axis by 2.0x while compressing along the y-axis to 0.6x.",
    recommendedMode: "svd",
    theoryExplanation:
      "Symmetric diagonal matrix where eigenvalues equal singular values. Directly deforms the unit circle onto an axis-aligned bounding ellipse.",
    probePoint: [1.0, 1.0],
  },
  singular: {
    id: "singular",
    name: "Singular Projection (Rank 1)",
    category: "singular",
    matrix: [
      [1.5, 1.0],
      [1.5, 1.0],
    ],
    description:
      "Degenerate matrix with det = 0 collapsing the entire 2D plane onto a 1-dimensional ray.",
    recommendedMode: "gram_schmidt",
    theoryExplanation:
      "Rank-deficient matrix where σ₂ = 0. The first singular vector spans the 1D range (column space), while the second spans the 1D kernel (null space).",
    probePoint: [1.0, 0.5],
  },
  ill_conditioned: {
    id: "ill_conditioned",
    name: "Ill-Conditioned Matrix (κ ≈ 400)",
    category: "singular",
    matrix: [
      [2.0, 1.99],
      [1.99, 2.0],
    ],
    description:
      "Nearly collinear column vectors resulting in severe numerical sensitivity with condition number κ >> 1.",
    recommendedMode: "svd",
    theoryExplanation:
      "A large condition number κ(A) = σ₁/σ₂ causes gradient descent trajectories to oscillate across narrow ravines and amplifies measurement noise in linear systems.",
    probePoint: [1.0, -1.0],
  },
  covariance: {
    id: "covariance",
    name: "Bivariate Covariance Ellipse",
    category: "statistical",
    matrix: [
      [2.5, 1.2],
      [1.2, 1.0],
    ],
    description:
      "Symmetric positive-definite covariance matrix representing correlated Gaussian scatter.",
    recommendedMode: "covariance",
    theoryExplanation:
      "The eigenvectors of the covariance matrix form the principal component axes (PCA); its inverse defines the Riemannian Mahalanobis distance metric.",
    probePoint: [1.5, 0.8],
  },
  saddle_reflection: {
    id: "saddle_reflection",
    name: "Saddle / Hyperbolic Reflection",
    category: "spectral",
    matrix: [
      [1.5, 0.5],
      [0.5, -1.2],
    ],
    description:
      "Indefinite matrix with opposite-sign eigenvalues generating a hyperbolic saddle flow.",
    recommendedMode: "eigen",
    theoryExplanation:
      "Eigenvalues with opposite signs (λ₁ > 0 > λ₂) create an unstable saddle point with stable and unstable invariant manifold directions.",
    probePoint: [1.0, 0.5],
  },
  identity: {
    id: "identity",
    name: "Identity Matrix",
    category: "geometric",
    matrix: [
      [1.0, 0.0],
      [0.0, 1.0],
    ],
    description: "Neutral transformation preserving all lengths, angles, and orientations intact.",
    recommendedMode: "svd",
    theoryExplanation:
      "Every non-zero vector in the plane is an eigenvector with eigenvalue 1. SVD yields U = I, Σ = I, V = I.",
    probePoint: [1.0, 1.0],
  },
};

// ============================================================================
// 4. REACT STUDIO COMPONENT
// ============================================================================

export const SpectralSVDGeometryStudio: React.FC<SpectralSVDGeometryStudioProps> = ({
  initialMode = "svd",
  initialPreset = "shear",
  initialMatrix,
  width = 960,
  height = 580,
  title = "Spectral & SVD Geometry Studio: SVD Deformations, Spectral Flow, MGS QR & Mahalanobis Metric",
  showTheory = true,
  standalone = false,
  onMatrixChange,
  onModeChange,
}) => {
  const { ref, box } = useCanvasBox({ width, height });

  // State
  const [mode, setMode] = useState<SpectralStudioMode>(initialMode);
  const [presetId, setPresetId] = useState<SpectralPresetId>(initialPreset);
  const [matrix, setMatrix] = useState<Matrix2x2>(
    initialMatrix ?? SPECTRAL_STUDIO_PRESETS[initialPreset].matrix,
  );

  // SVD stage interpolation slider t in [0, 3]
  const [svdStage, setSvdStage] = useState<number>(3.0);
  const [isSvdPlaying, setIsSvdPlaying] = useState<boolean>(false);

  // MGS Step slider (0 to 4)
  const [mgsStep, setMgsStep] = useState<number>(4);

  // Covariance / Probe point state
  const [probePoint, setProbePoint] = useState<Vector2>(
    SPECTRAL_STUDIO_PRESETS[initialPreset].probePoint ?? [1.5, 0.8],
  );
  const [showWhitenedView, setShowWhitenedView] = useState<boolean>(false);

  // Theory panel toggle
  const [showTheoryPanel, setShowTheoryPanel] = useState<boolean>(showTheory);
  const [activeTheoryTab, setActiveTheoryTab] = useState<
    "geometry" | "svd" | "eigen" | "qr" | "mahalanobis"
  >("geometry");

  // Synchronize preset changes
  const handleSelectPreset = (newPresetId: SpectralPresetId) => {
    setPresetId(newPresetId);
    const p = SPECTRAL_STUDIO_PRESETS[newPresetId];
    setMatrix(p.matrix);
    setMode(p.recommendedMode);
    if (p.probePoint) {
      setProbePoint(p.probePoint);
    }
    setSvdStage(3.0);
    setIsSvdPlaying(false);
    onMatrixChange?.(p.matrix);
    onModeChange?.(p.recommendedMode);
  };

  const handleModeChange = (newMode: SpectralStudioMode) => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const updateMatrixEntry = (row: 0 | 1, col: 0 | 1, val: number) => {
    setMatrix((prev) => {
      const next: Matrix2x2 = [
        [prev[0][0], prev[0][1]],
        [prev[1][0], prev[1][1]],
      ];
      next[row][col] = Number.isFinite(val) ? val : 0;
      onMatrixChange?.(next);
      return next;
    });
  };

  // Matrix action shortcuts
  const handleTranspose = () => {
    setMatrix((prev) => {
      const next: Matrix2x2 = [
        [prev[0][0], prev[1][0]],
        [prev[0][1], prev[1][1]],
      ];
      onMatrixChange?.(next);
      return next;
    });
  };

  const handleSymmetrize = () => {
    setMatrix((prev) => {
      const avg = (prev[0][1] + prev[1][0]) / 2;
      const next: Matrix2x2 = [
        [prev[0][0], avg],
        [avg, prev[1][1]],
      ];
      onMatrixChange?.(next);
      return next;
    });
  };

  const handleInvert = () => {
    const props = computeMatrixProperties2x2(matrix);
    if (props.inverse) {
      setMatrix(props.inverse);
      onMatrixChange?.(props.inverse);
    }
  };

  const handleResetIdentity = () => {
    const ident: Matrix2x2 = [
      [1, 0],
      [0, 1],
    ];
    setMatrix(ident);
    onMatrixChange?.(ident);
  };

  const handleRandomize = () => {
    const rnd = (): number => Math.round((Math.random() * 4 - 2) * 10) / 10;
    const next: Matrix2x2 = [
      [rnd(), rnd()],
      [rnd(), rnd()],
    ];
    setMatrix(next);
    onMatrixChange?.(next);
  };

  // Calculations
  const svdResult = useMemo(() => computeSVD2x2(matrix), [matrix]);
  const eigenResult = useMemo(() => computeEigendecomposition2x2(matrix), [matrix]);
  const mgsResult = useMemo(() => computeGramSchmidt2x2(matrix), [matrix]);
  const mahalanobisResult = useMemo(
    () => computeMahalanobis2x2(matrix, probePoint, [0, 0]),
    [matrix, probePoint],
  );
  const matrixProps = useMemo(() => computeMatrixProperties2x2(matrix), [matrix]);

  // SVD Animation Loop
  useEffect(() => {
    if (!isSvdPlaying) return;
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      setSvdStage((prev) => {
        let next = prev + dt * 0.8;
        if (next > 3.0) {
          next = 0.0;
        }
        return next;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSvdPlaying]);

  // Interpolated SVD Matrix at stage t in [0, 3]
  const interpolatedSvdMatrix = useMemo((): Matrix2x2 => {
    const t = Math.max(0, Math.min(3, svdStage));
    const { thetaV, thetaU, sigma, detU } = svdResult;

    if (t <= 1.0) {
      // Stage 1: Interpolate rotation by V^T (angle -t * thetaV)
      const angle = -t * thetaV;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      return [
        [cosA, -sinA],
        [sinA, cosA],
      ];
    } else if (t <= 2.0) {
      // Stage 2: Scaling by Sigma on top of V^T
      const s = t - 1.0;
      const s1 = 1.0 + s * (sigma[0] - 1.0);
      const s2 = 1.0 + s * (sigma[1] - 1.0);

      const cosV = Math.cos(-thetaV);
      const sinV = Math.sin(-thetaV);

      // Sigma(s) * V^T
      return [
        [s1 * cosV, -s1 * sinV],
        [s2 * sinV, s2 * cosV],
      ];
    } else {
      // Stage 3: Rotation by U on top of Sigma * V^T
      const s = t - 2.0;
      const angleU = s * thetaU;
      const cosU = Math.cos(angleU);
      const sinU = Math.sin(angleU);

      // Current rotation matrix R_U(s) (handling reflections if detU < 0)
      const reflY = detU < 0 ? 1 - 2 * s : 1.0;
      const Ru: Matrix2x2 = [
        [cosU, -sinU],
        [sinU * reflY, cosU * reflY],
      ];

      const s1 = svdResult.sigma[0];
      const s2 = svdResult.sigma[1];
      const cosV = Math.cos(-thetaV);
      const sinV = Math.sin(-thetaV);

      const svt00 = s1 * cosV;
      const svt01 = -s1 * sinV;
      const svt10 = s2 * sinV;
      const svt11 = s2 * cosV;

      return [
        [Ru[0][0] * svt00 + Ru[0][1] * svt10, Ru[0][0] * svt01 + Ru[0][1] * svt11],
        [Ru[1][0] * svt00 + Ru[1][1] * svt10, Ru[1][0] * svt01 + Ru[1][1] * svt11],
      ];
    }
  }, [svdStage, svdResult]);

  // Coordinate System Mapping
  const canvasWidth = Math.max(300, box.width);
  const canvasHeight = Math.max(260, box.height);

  const worldExtent = 3.6; // World coordinate range [-3.6, 3.6]
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const scale = Math.min(canvasWidth, canvasHeight) / (2 * worldExtent);

  const worldToSvg = useCallback(
    (wx: number, wy: number): [number, number] => {
      const sx = centerX + wx * scale;
      const sy = centerY - wy * scale; // invert Y for SVG
      return [sx, sy];
    },
    [centerX, centerY, scale],
  );

  const svgToWorld = useCallback(
    (sx: number, sy: number): [number, number] => {
      const wx = (sx - centerX) / scale;
      const wy = (centerY - sy) / scale;
      return [wx, wy];
    },
    [centerX, centerY, scale],
  );

  // SVG Mouse interaction for dragging probe point in Covariance mode
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (mode === "covariance") {
      isDraggingRef.current = true;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [wx, wy] = svgToWorld(sx, sy);
        setProbePoint([Math.round(wx * 100) / 100, Math.round(wy * 100) / 100]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingRef.current && mode === "covariance") {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const [wx, wy] = svgToWorld(sx, sy);
        setProbePoint([Math.round(wx * 100) / 100, Math.round(wy * 100) / 100]);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    }
  };

  // Unit circle deformed points for SVD mode
  const svdEllipsePoints = useMemo(() => {
    const pts: string[] = [];
    const segments = 72;
    const M = interpolatedSvdMatrix;
    for (let i = 0; i <= segments; i++) {
      const phi = (i / segments) * 2 * Math.PI;
      const cx = Math.cos(phi);
      const cy = Math.sin(phi);
      const tx = M[0][0] * cx + M[0][1] * cy;
      const ty = M[1][0] * cx + M[1][1] * cy;
      const [sx, sy] = worldToSvg(tx, ty);
      pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [interpolatedSvdMatrix, worldToSvg]);

  // Phase portrait vector field arrows for Eigen mode
  const phaseArrows = useMemo(() => {
    if (mode !== "eigen") return [];
    const arrows: Array<{
      x0: number;
      y0: number;
      x1: number;
      y1: number;
      color: string;
      mag: number;
    }> = [];
    const gridSpan = 6;
    const step = 0.9;
    const maxMag = 4.0;

    for (let x = -gridSpan * step * 0.5; x <= gridSpan * step * 0.5; x += step) {
      for (let y = -gridSpan * step * 0.5; y <= gridSpan * step * 0.5; y += step) {
        if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) continue;
        const dx = matrix[0][0] * x + matrix[0][1] * y;
        const dy = matrix[1][0] * x + matrix[1][1] * y;
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag < 1e-4) continue;

        const arrowLen = 0.35;
        const dirX = (dx / mag) * arrowLen;
        const dirY = (dy / mag) * arrowLen;

        const [sx0, sy0] = worldToSvg(x, y);
        const [sx1, sy1] = worldToSvg(x + dirX, y + dirY);

        const hue = Math.min(220, Math.max(160, 180 + (mag / maxMag) * 40));
        arrows.push({
          x0: sx0,
          y0: sy0,
          x1: sx1,
          y1: sy1,
          color: `hsl(${hue}, 85%, 60%)`,
          mag,
        });
      }
    }
    return arrows;
  }, [mode, matrix, worldToSvg]);

  // Coordinates helper for rendering vector arrows
  const renderVectorArrow = (
    start: Vector2,
    end: Vector2,
    color: string,
    label?: string,
    dashed: boolean = false,
    strokeWidth: number = 2.5,
  ) => {
    const [sx0, sy0] = worldToSvg(start[0], start[1]);
    const [sx1, sy1] = worldToSvg(end[0], end[1]);

    const dx = sx1 - sx0;
    const dy = sy1 - sy0;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return null;

    const angle = Math.atan2(dy, dx);
    const arrowHeadLen = 10;
    const arrowAngle = Math.PI / 7;

    const ah1_x = sx1 - arrowHeadLen * Math.cos(angle - arrowAngle);
    const ah1_y = sy1 - arrowHeadLen * Math.sin(angle - arrowAngle);
    const ah2_x = sx1 - arrowHeadLen * Math.cos(angle + arrowAngle);
    const ah2_y = sy1 - arrowHeadLen * Math.sin(angle + arrowAngle);

    // Label positioning
    const labelX = sx1 + 12 * Math.cos(angle);
    const labelY = sy1 + 12 * Math.sin(angle);

    return (
      <g key={`${label}-${start}-${end}`}>
        <line
          x1={sx0}
          y1={sy0}
          x2={sx1}
          y2={sy1}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dashed ? "5,4" : undefined}
          strokeLinecap="round"
        />
        <polygon points={`${sx1},${sy1} ${ah1_x},${ah1_y} ${ah2_x},${ah2_y}`} fill={color} />
        {label && (
          <text
            x={labelX}
            y={labelY}
            fill={color}
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            className="select-none font-mono filter drop-shadow"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  // Render Cartesian Grid
  const renderGridAndAxes = () => {
    const gridLines: React.ReactNode[] = [];
    const ticks: React.ReactNode[] = [];

    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue;
      const [gx0, gy0] = worldToSvg(i, -worldExtent);
      const [gx1, gy1] = worldToSvg(i, worldExtent);
      gridLines.push(
        <line
          key={`v-${i}`}
          x1={gx0}
          y1={gy0}
          x2={gx1}
          y2={gy1}
          stroke="rgba(148, 163, 184, 0.12)"
          strokeWidth="1"
        />,
      );

      const [hx0, hy0] = worldToSvg(-worldExtent, i);
      const [hx1, hy1] = worldToSvg(worldExtent, i);
      gridLines.push(
        <line
          key={`h-${i}`}
          x1={hx0}
          y1={hy0}
          x2={hx1}
          y2={hy1}
          stroke="rgba(148, 163, 184, 0.12)"
          strokeWidth="1"
        />,
      );

      const [tx, ty] = worldToSvg(i, 0);
      ticks.push(
        <text
          key={`tx-${i}`}
          x={tx}
          y={ty + 14}
          fontSize="10"
          fill="rgba(148, 163, 184, 0.45)"
          textAnchor="middle"
          className="select-none font-mono"
        >
          {i}
        </text>,
      );

      const [tyx, tyy] = worldToSvg(0, i);
      ticks.push(
        <text
          key={`ty-${i}`}
          x={tyx - 12}
          y={tyy + 3}
          fontSize="10"
          fill="rgba(148, 163, 184, 0.45)"
          textAnchor="end"
          className="select-none font-mono"
        >
          {i}
        </text>,
      );
    }

    const [ax0, ay0] = worldToSvg(-worldExtent, 0);
    const [ax1, ay1] = worldToSvg(worldExtent, 0);
    const [bx0, by0] = worldToSvg(0, -worldExtent);
    const [bx1, by1] = worldToSvg(0, worldExtent);

    return (
      <g className="axes-grid">
        {gridLines}
        <line
          x1={ax0}
          y1={ay0}
          x2={ax1}
          y2={ay1}
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth="1.5"
        />
        <line
          x1={bx0}
          y1={by0}
          x2={bx1}
          y2={by1}
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth="1.5"
        />
        {ticks}
      </g>
    );
  };

  return (
    <div
      ref={ref}
      className={`spectral-studio-root w-full select-none rounded-xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl transition-all ${
        standalone ? "p-6" : "p-4"
      }`}
    >
      {/* 1. STUDIO HEADER & CONTROLS */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/40">
              <Zap className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            Interactive Spectral Decomposition, SVD Deformation Manifold, MGS QR Orthogonalization &
            Mahalanobis PCA Space
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center rounded-lg bg-slate-900/90 p-1 ring-1 ring-slate-800">
          <button
            onClick={() => handleModeChange("svd")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "svd"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            SVD Geometry
          </button>
          <button
            onClick={() => handleModeChange("eigen")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "eigen"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Eigen Spectral Flow
          </button>
          <button
            onClick={() => handleModeChange("gram_schmidt")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "gram_schmidt"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
            MGS Orthogonalization
          </button>
          <button
            onClick={() => handleModeChange("covariance")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "covariance"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Covariance & Metric
          </button>
        </div>
      </div>

      {/* 2. TOP TOOLBAR: PRESET SELECTOR & MATRIX SHORTCUTS */}
      <div className="mb-4 grid grid-cols-1 items-center gap-3 md:grid-cols-12">
        {/* Preset Dropdown */}
        <div className="flex items-center gap-2 md:col-span-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Preset:
          </label>
          <select
            value={presetId}
            onChange={(e) => handleSelectPreset(e.target.value as SpectralPresetId)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition hover:border-slate-600 focus:border-indigo-500 focus:outline-none"
          >
            {Object.values(SPECTRAL_STUDIO_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Matrix Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 md:col-span-8 md:justify-end">
          <button
            onClick={handleTranspose}
            title="Transpose Matrix A^T"
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            Aᵀ
          </button>
          <button
            onClick={handleSymmetrize}
            title="Symmetrize Matrix (A + A^T) / 2"
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            Sym(A)
          </button>
          <button
            onClick={handleInvert}
            disabled={!matrixProps.isInvertible}
            title="Invert Matrix A^{-1}"
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs transition ${
              matrixProps.isInvertible
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                : "cursor-not-allowed bg-slate-900 text-slate-600"
            }`}
          >
            A⁻¹
          </button>
          <button
            onClick={handleResetIdentity}
            title="Reset to Identity Matrix"
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            Identity
          </button>
          <button
            onClick={handleRandomize}
            title="Randomize Matrix Entries"
            className="flex items-center gap-1 rounded bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <Shuffle className="h-3 w-3" />
            Random
          </button>
          <button
            onClick={() => setShowTheoryPanel((prev) => !prev)}
            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition ${
              showTheoryPanel
                ? "bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            }`}
          >
            <Info className="h-3 w-3" />
            Theory
          </button>
        </div>
      </div>

      {/* 3. MAIN INTERACTION SPLIT: MATRIX CONTROLS & SVG CANVAS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Side: 2x2 Matrix Input Grid & Mode-Specific Controllers */}
        <div className="space-y-4 lg:col-span-4">
          {/* Matrix Input Editor */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-inner">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Matrix A (2×2)
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-indigo-400">
                det(A) = {matrixProps.determinant.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-mono text-slate-400">a₁₁</label>
                <input
                  type="number"
                  step="0.1"
                  value={matrix[0][0]}
                  onChange={(e) => updateMatrixEntry(0, 0, parseFloat(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono text-sm text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.05"
                  value={matrix[0][0]}
                  onChange={(e) => updateMatrixEntry(0, 0, parseFloat(e.target.value))}
                  className="mt-1 w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400">a₁₂</label>
                <input
                  type="number"
                  step="0.1"
                  value={matrix[0][1]}
                  onChange={(e) => updateMatrixEntry(0, 1, parseFloat(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono text-sm text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.05"
                  value={matrix[0][1]}
                  onChange={(e) => updateMatrixEntry(0, 1, parseFloat(e.target.value))}
                  className="mt-1 w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400">a₂₁</label>
                <input
                  type="number"
                  step="0.1"
                  value={matrix[1][0]}
                  onChange={(e) => updateMatrixEntry(1, 0, parseFloat(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono text-sm text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.05"
                  value={matrix[1][0]}
                  onChange={(e) => updateMatrixEntry(1, 0, parseFloat(e.target.value))}
                  className="mt-1 w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400">a₂₂</label>
                <input
                  type="number"
                  step="0.1"
                  value={matrix[1][1]}
                  onChange={(e) => updateMatrixEntry(1, 1, parseFloat(e.target.value))}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-center font-mono text-sm text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="range"
                  min="-3.0"
                  max="3.0"
                  step="0.05"
                  value={matrix[1][1]}
                  onChange={(e) => updateMatrixEntry(1, 1, parseFloat(e.target.value))}
                  className="mt-1 w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Mode-Specific Interactive Controller Cards */}
          {mode === "svd" && (
            <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-3.5 ring-1 ring-indigo-500/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">
                  SVD Transformation Factorization
                </span>
                <span className="text-xs font-mono text-indigo-400">
                  Stage t = {svdStage.toFixed(2)} / 3.0
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => setIsSvdPlaying((prev) => !prev)}
                  className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-indigo-500"
                >
                  {isSvdPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isSvdPlaying ? "Pause" : "Morph"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.02"
                  value={svdStage}
                  onChange={(e) => {
                    setIsSvdPlaying(false);
                    setSvdStage(parseFloat(e.target.value));
                  }}
                  className="flex-1 accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-1 text-[10px] font-medium text-slate-400">
                <button
                  onClick={() => {
                    setIsSvdPlaying(false);
                    setSvdStage(0);
                  }}
                  className={`rounded p-1 text-center transition ${
                    svdStage <= 0.1 ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-800"
                  }`}
                >
                  0: Circle
                </button>
                <button
                  onClick={() => {
                    setIsSvdPlaying(false);
                    setSvdStage(1);
                  }}
                  className={`rounded p-1 text-center transition ${
                    Math.abs(svdStage - 1) <= 0.1
                      ? "bg-indigo-600 text-white font-bold"
                      : "hover:bg-slate-800"
                  }`}
                >
                  1: Vᵀ (Rotate)
                </button>
                <button
                  onClick={() => {
                    setIsSvdPlaying(false);
                    setSvdStage(2);
                  }}
                  className={`rounded p-1 text-center transition ${
                    Math.abs(svdStage - 2) <= 0.1
                      ? "bg-indigo-600 text-white font-bold"
                      : "hover:bg-slate-800"
                  }`}
                >
                  2: Σ (Scale)
                </button>
                <button
                  onClick={() => {
                    setIsSvdPlaying(false);
                    setSvdStage(3);
                  }}
                  className={`rounded p-1 text-center transition ${
                    svdStage >= 2.9 ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-800"
                  }`}
                >
                  3: U (Rotate)
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-300">
                {svdStage < 1 ? (
                  <span>
                    🔄 <b>Stage 1 (Vᵀ)</b>: Right singular vectors v₁, v₂ align with standard axes.
                  </span>
                ) : svdStage < 2 ? (
                  <span>
                    📏 <b>Stage 2 (Σ)</b>: Scaling circle into ellipse with semi-axes σ₁ ={" "}
                    {svdResult.sigma[0].toFixed(2)}, σ₂ = {svdResult.sigma[1].toFixed(2)}.
                  </span>
                ) : (
                  <span>
                    🎯 <b>Stage 3 (U)</b>: Left singular vectors u₁, u₂ rotate ellipse to final
                    transformed state.
                  </span>
                )}
              </div>
            </div>
          )}

          {mode === "eigen" && (
            <div className="rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-3.5 ring-1 ring-cyan-500/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">Phase Portrait & Flow</span>
                <span className="rounded bg-cyan-900/60 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                  {eigenResult.classification.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Invariant eigenspaces represent lines where the matrix acts as pure scalar
                multiplication Av = λv. Streamlines visualize dynamic trajectory vector flow.
              </p>
              <div className="mt-2.5 flex items-center justify-between rounded bg-slate-900/80 p-2 text-xs font-mono">
                <span className="text-slate-400">Δ = tr² - 4det:</span>
                <span className="font-bold text-cyan-400">
                  {eigenResult.discriminant.toFixed(3)}
                </span>
              </div>
            </div>
          )}

          {mode === "gram_schmidt" && (
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 ring-1 ring-emerald-500/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300">
                  MGS Projection Pipeline (Step {mgsStep} / 4)
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={mgsStep}
                  onChange={(e) => setMgsStep(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-slate-400">
                <button
                  onClick={() => setMgsStep(0)}
                  className={`rounded p-1 text-center ${
                    mgsStep === 0 ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
                  }`}
                >
                  v₁, v₂
                </button>
                <button
                  onClick={() => setMgsStep(1)}
                  className={`rounded p-1 text-center ${
                    mgsStep === 1 ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
                  }`}
                >
                  q₁ = v̂₁
                </button>
                <button
                  onClick={() => setMgsStep(2)}
                  className={`rounded p-1 text-center ${
                    mgsStep === 2 ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
                  }`}
                >
                  proj(v₂)
                </button>
                <button
                  onClick={() => setMgsStep(3)}
                  className={`rounded p-1 text-center ${
                    mgsStep === 3 ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
                  }`}
                >
                  u₂ ⟂ q₁
                </button>
                <button
                  onClick={() => setMgsStep(4)}
                  className={`rounded p-1 text-center ${
                    mgsStep === 4 ? "bg-emerald-600 text-white font-bold" : "hover:bg-slate-800"
                  }`}
                >
                  Q R
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-300">
                {mgsStep === 0 && "1. Original non-orthogonal column vectors v₁ and v₂."}
                {mgsStep === 1 && "2. Normalize first vector: q₁ = v₁ / ||v₁||."}
                {mgsStep === 2 &&
                  `3. Orthogonal projection of v₂ along q₁: (v₂ · q₁) q₁ = ${mgsResult.projScalar.toFixed(2)} q₁.`}
                {mgsStep === 3 &&
                  "4. Compute orthogonal residual: u₂ = v₂ - proj_{q₁}(v₂) (perpendicular drop)."}
                {mgsStep === 4 && "5. Normalize residual: q₂ = u₂ / ||u₂||, forming QR basis."}
              </div>
            </div>
          )}

          {mode === "covariance" && (
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-3.5 ring-1 ring-amber-500/20">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Mahalanobis Metric & Probe</span>
                <button
                  onClick={() => setShowWhitenedView((prev) => !prev)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                    showWhitenedView
                      ? "bg-amber-600 text-white shadow"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {showWhitenedView ? "Whitened View" : "Original View"}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400">
                    <span>Probe Point x:</span>
                    <span className="font-mono text-amber-400">
                      ({probePoint[0].toFixed(2)}, {probePoint[1].toFixed(2)})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.05"
                    value={probePoint[0]}
                    onChange={(e) => setProbePoint([parseFloat(e.target.value), probePoint[1]])}
                    className="w-full accent-amber-500"
                  />
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.05"
                    value={probePoint[1]}
                    onChange={(e) => setProbePoint([probePoint[0], parseFloat(e.target.value)])}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 rounded bg-slate-900/80 p-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400">Euclidean d_E:</span>
                    <p className="font-bold text-slate-200">
                      {mahalanobisResult.euclideanDistance.toFixed(3)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Mahalanobis d_M:</span>
                    <p className="font-bold text-amber-400">
                      {mahalanobisResult.mahalanobisDistance.toFixed(3)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Metrics Badge Ribbon */}
          <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-2.5 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400">Trace:</span>
              <p className="font-mono font-bold text-slate-200">{matrixProps.trace.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Condition κ:</span>
              <p className="font-mono font-bold text-indigo-400">
                {Number.isFinite(matrixProps.conditionNumber)
                  ? matrixProps.conditionNumber.toFixed(2)
                  : "∞"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Frobenius ||A||:</span>
              <p className="font-mono font-bold text-slate-200">
                {matrixProps.frobeniusNorm.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Crisp SVG Canvas */}
        <div className="relative flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner lg:col-span-8">
          <svg
            ref={svgRef}
            width="100%"
            height={canvasHeight}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="cursor-crosshair overflow-hidden rounded-lg"
          >
            <defs>
              <linearGradient id="ellipseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.10" />
              </linearGradient>
              <linearGradient id="whitenedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.10" />
              </linearGradient>
            </defs>

            {/* Background Grid and Reference Axes */}
            {renderGridAndAxes()}

            {/* ---------------- MODE 1: SVD GEOMETRY ---------------- */}
            {mode === "svd" && (
              <g className="svd-layer">
                {/* Unit circle reference in domain */}
                <circle
                  cx={centerX}
                  cy={centerY}
                  r={scale}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />

                {/* Transformed Ellipse Polygon */}
                <polygon
                  points={svdEllipsePoints}
                  fill="url(#ellipseGrad)"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                />

                {/* Transformed Basis Vectors A e1, A e2 */}
                {renderVectorArrow(
                  [0, 0],
                  [interpolatedSvdMatrix[0][0], interpolatedSvdMatrix[1][0]],
                  "#38bdf8",
                  "M e₁",
                )}
                {renderVectorArrow(
                  [0, 0],
                  [interpolatedSvdMatrix[0][1], interpolatedSvdMatrix[1][1]],
                  "#ec4899",
                  "M e₂",
                )}

                {/* Principal Singular Vectors u1 * sigma1, u2 * sigma2 when stage reaches 3 */}
                {svdStage >= 2.8 && (
                  <>
                    {renderVectorArrow(
                      [0, 0],
                      [svdResult.u1[0] * svdResult.sigma[0], svdResult.u1[1] * svdResult.sigma[0]],
                      "#f59e0b",
                      `σ₁ u₁ (${svdResult.sigma[0].toFixed(1)})`,
                      false,
                      3,
                    )}
                    {renderVectorArrow(
                      [0, 0],
                      [svdResult.u2[0] * svdResult.sigma[1], svdResult.u2[1] * svdResult.sigma[1]],
                      "#10b981",
                      `σ₂ u₂ (${svdResult.sigma[1].toFixed(1)})`,
                      false,
                      3,
                    )}
                  </>
                )}
              </g>
            )}

            {/* ---------------- MODE 2: EIGEN SPECTRAL FLOW ---------------- */}
            {mode === "eigen" && (
              <g className="eigen-layer">
                {/* Vector field arrows */}
                {phaseArrows.map((arr, idx) => (
                  <line
                    key={`arrow-${idx}`}
                    x1={arr.x0}
                    y1={arr.y0}
                    x2={arr.x1}
                    y2={arr.y1}
                    stroke={arr.color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    opacity="0.65"
                  />
                ))}

                {/* Invariant Eigenspace Lines if Real Eigenvalues */}
                {eigenResult.isReal &&
                  eigenResult.eigenvectors.map((ev, idx) => {
                    const [ex0, ey0] = worldToSvg(-ev[0] * worldExtent, -ev[1] * worldExtent);
                    const [ex1, ey1] = worldToSvg(ev[0] * worldExtent, ev[1] * worldExtent);
                    const color = idx === 0 ? "#06b6d4" : "#a855f7";
                    const lam = eigenResult.eigenvalues[idx];

                    return (
                      <g key={`inv-line-${idx}`}>
                        <line
                          x1={ex0}
                          y1={ey0}
                          x2={ex1}
                          y2={ey1}
                          stroke={color}
                          strokeWidth="1.5"
                          strokeDasharray="6,4"
                          opacity="0.8"
                        />
                        {/* Eigenvector v_i */}
                        {renderVectorArrow(
                          [0, 0],
                          [ev[0] * 1.5, ev[1] * 1.5],
                          color,
                          `v${idx + 1} (λ=${lam.toFixed(2)})`,
                          false,
                          3,
                        )}
                      </g>
                    );
                  })}
              </g>
            )}

            {/* ---------------- MODE 3: MGS ORTHOGONALIZATION ---------------- */}
            {mode === "gram_schmidt" && (
              <g className="mgs-layer">
                {/* Original Column Vectors v1, v2 */}
                {renderVectorArrow([0, 0], mgsResult.v1, "#38bdf8", "v₁")}
                {renderVectorArrow([0, 0], mgsResult.v2, "#f43f5e", "v₂")}

                {/* Step 1: Unit vector q1 */}
                {mgsStep >= 1 && renderVectorArrow([0, 0], mgsResult.q1, "#06b6d4", "q₁", false, 3)}

                {/* Step 2: Projection of v2 onto q1 */}
                {mgsStep >= 2 && (
                  <>
                    {renderVectorArrow(
                      [0, 0],
                      mgsResult.projV2OnQ1,
                      "#fbbf24",
                      "proj_{q₁}(v₂)",
                      true,
                    )}
                    {/* Dashed drop line from v2 to projV2 */}
                    {(() => {
                      const [vx, vy] = worldToSvg(mgsResult.v2[0], mgsResult.v2[1]);
                      const [px, py] = worldToSvg(mgsResult.projV2OnQ1[0], mgsResult.projV2OnQ1[1]);
                      return (
                        <line
                          x1={vx}
                          y1={vy}
                          x2={px}
                          y2={py}
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          strokeDasharray="4,4"
                        />
                      );
                    })()}
                  </>
                )}

                {/* Step 3: Orthogonal residual u2 */}
                {mgsStep >= 3 &&
                  renderVectorArrow(
                    mgsResult.projV2OnQ1,
                    mgsResult.v2,
                    "#10b981",
                    "u₂ ⟂ q₁",
                    false,
                    2.5,
                  )}

                {/* Step 4 & 5: Normalized q2 */}
                {mgsStep >= 4 && renderVectorArrow([0, 0], mgsResult.q2, "#34d399", "q₂", false, 3)}
              </g>
            )}

            {/* ---------------- MODE 4: COVARIANCE & MAHALANOBIS ---------------- */}
            {mode === "covariance" && (
              <g className="covariance-layer">
                {!showWhitenedView ? (
                  <>
                    {/* 1-sigma, 2-sigma, 3-sigma Confidence Ellipses */}
                    {[
                      {
                        info: mahalanobisResult.confidenceEllipses.sigma3,
                        color: "rgba(245, 158, 11, 0.15)",
                        stroke: "rgba(245, 158, 11, 0.4)",
                        label: "3σ (98.9%)",
                      },
                      {
                        info: mahalanobisResult.confidenceEllipses.sigma2,
                        color: "rgba(245, 158, 11, 0.25)",
                        stroke: "rgba(245, 158, 11, 0.6)",
                        label: "2σ (86.5%)",
                      },
                      {
                        info: mahalanobisResult.confidenceEllipses.sigma1,
                        color: "rgba(245, 158, 11, 0.4)",
                        stroke: "#f59e0b",
                        label: "1σ (39.3%)",
                      },
                    ].map((ell, idx) => {
                      const angleDeg =
                        (-Math.atan2(
                          mahalanobisResult.eigenvectors[0][1],
                          mahalanobisResult.eigenvectors[0][0],
                        ) *
                          180) /
                        Math.PI;
                      return (
                        <ellipse
                          key={`conf-${idx}`}
                          cx={centerX}
                          cy={centerY}
                          rx={ell.info.radiusX * scale}
                          ry={ell.info.radiusY * scale}
                          transform={`rotate(${angleDeg}, ${centerX}, ${centerY})`}
                          fill={ell.color}
                          stroke={ell.stroke}
                          strokeWidth="1.5"
                          strokeDasharray={idx === 0 ? "4,4" : undefined}
                        />
                      );
                    })}

                    {/* PCA Principal Axes */}
                    {renderVectorArrow(
                      [0, 0],
                      [
                        mahalanobisResult.eigenvectors[0][0] *
                          Math.sqrt(mahalanobisResult.eigenvalues[0]),
                        mahalanobisResult.eigenvectors[0][1] *
                          Math.sqrt(mahalanobisResult.eigenvalues[0]),
                      ],
                      "#38bdf8",
                      "PC₁",
                    )}
                    {renderVectorArrow(
                      [0, 0],
                      [
                        mahalanobisResult.eigenvectors[1][0] *
                          Math.sqrt(mahalanobisResult.eigenvalues[1]),
                        mahalanobisResult.eigenvectors[1][1] *
                          Math.sqrt(mahalanobisResult.eigenvalues[1]),
                      ],
                      "#a855f7",
                      "PC₂",
                    )}

                    {/* Interactive Probe Point x and vector from origin */}
                    {renderVectorArrow(
                      [0, 0],
                      probePoint,
                      "#ec4899",
                      `x (d_M=${mahalanobisResult.mahalanobisDistance.toFixed(2)})`,
                      true,
                    )}

                    {/* Draggable handle on probe point */}
                    {(() => {
                      const [px, py] = worldToSvg(probePoint[0], probePoint[1]);
                      return (
                        <circle
                          cx={px}
                          cy={py}
                          r="6"
                          fill="#ec4899"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="cursor-grab active:cursor-grabbing filter drop-shadow-md"
                        />
                      );
                    })()}
                  </>
                ) : (
                  <>
                    {/* Whitened Coordinate Plane: Isotropic Concentric Circles */}
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={3 * scale}
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.3)"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={2 * scale}
                      fill="rgba(16, 185, 129, 0.15)"
                      stroke="rgba(16, 185, 129, 0.6)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={1 * scale}
                      fill="rgba(16, 185, 129, 0.3)"
                      stroke="#10b981"
                      strokeWidth="2"
                    />

                    {/* Whitened Point z = C^{-1/2} x */}
                    {renderVectorArrow(
                      [0, 0],
                      mahalanobisResult.whitenedPoint,
                      "#10b981",
                      `z = Σ^{-1/2} x (||z||=${mahalanobisResult.mahalanobisDistance.toFixed(2)})`,
                    )}
                  </>
                )}
              </g>
            )}
          </svg>

          <div className="absolute bottom-3 right-3 rounded bg-slate-900/90 px-2 py-1 text-[10px] font-mono text-slate-400 backdrop-blur ring-1 ring-slate-800">
            {mode === "svd" && "Drag slider to interpolate SVD stages"}
            {mode === "eigen" && "Invariant directions: Av = λv"}
            {mode === "gram_schmidt" && "Modified Gram-Schmidt orthogonal projections"}
            {mode === "covariance" && "Click or drag probe point x to evaluate d_M"}
          </div>
        </div>
      </div>

      {/* 4. ANALYTICAL BREAKDOWN CARDS */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        {/* SVD Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400">SVD Spectrum</span>
            <span className="text-[10px] font-mono text-slate-400">
              κ ={" "}
              {Number.isFinite(svdResult.conditionNumber)
                ? svdResult.conditionNumber.toFixed(2)
                : "∞"}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <div>
              σ₁ = <span className="text-amber-400">{svdResult.sigma[0].toFixed(3)}</span>, σ₂ ={" "}
              <span className="text-emerald-400">{svdResult.sigma[1].toFixed(3)}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              θ_V = {((svdResult.thetaV * 180) / Math.PI).toFixed(1)}°, θ_U ={" "}
              {((svdResult.thetaU * 180) / Math.PI).toFixed(1)}°
            </div>
            <div className="text-[10px] text-slate-400">
              ||U Σ Vᵀ - A||_F = {svdResult.reconstructionError.toExponential(2)}
            </div>
          </div>
        </div>

        {/* Eigen Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400">Eigensystem</span>
            <span className="text-[10px] font-mono text-slate-400">
              {eigenResult.isReal ? "Real" : "Complex"}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            {eigenResult.isReal ? (
              <div>
                λ₁ = <span className="text-cyan-400">{eigenResult.eigenvalues[0].toFixed(3)}</span>,
                λ₂ = <span className="text-cyan-400">{eigenResult.eigenvalues[1].toFixed(3)}</span>
              </div>
            ) : (
              <div>
                λ = {eigenResult.eigenvaluesComplex?.[0].re.toFixed(2)} ±{" "}
                {eigenResult.eigenvaluesComplex?.[0].im.toFixed(2)}i
              </div>
            )}
            <div className="text-[10px] text-slate-400">
              Type: {eigenResult.classification.replace(/_/g, " ")}
            </div>
            <div className="text-[10px] text-slate-400">
              Defective: {eigenResult.isDefective ? "Yes (Jordan)" : "No"}
            </div>
          </div>
        </div>

        {/* Gram-Schmidt Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">QR Factorization</span>
            <span className="text-[10px] font-mono text-slate-400">MGS</span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <div>
              q₁ · q₂ ={" "}
              <span
                className={
                  Math.abs(mgsResult.dotProduct) < 1e-4 ? "text-emerald-400" : "text-rose-400"
                }
              >
                {mgsResult.dotProduct.toExponential(2)}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              ||QᵀQ - I||_F = {mgsResult.orthogonalityLoss.toExponential(2)}
            </div>
            <div className="text-[10px] text-slate-400">
              ||QR - A||_F = {mgsResult.reconstructionError.toExponential(2)}
            </div>
          </div>
        </div>

        {/* Covariance / Mahalanobis Card */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">Covariance & Metric</span>
            <span className="text-[10px] font-mono text-slate-400">
              {mahalanobisResult.isPositiveDefinite ? "SPD Matrix" : "Indefinite"}
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300">
            <div>
              d_M ={" "}
              <span className="font-bold text-amber-400">
                {mahalanobisResult.mahalanobisDistance.toFixed(3)}
              </span>{" "}
              (d_E = {mahalanobisResult.euclideanDistance.toFixed(2)})
            </div>
            <div className="text-[10px] text-slate-400">
              Ratio d_M / d_E ={" "}
              {(
                mahalanobisResult.mahalanobisDistance / (mahalanobisResult.euclideanDistance || 1)
              ).toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">
              PCA Variances: {mahalanobisResult.eigenvalues[0].toFixed(2)},{" "}
              {mahalanobisResult.eigenvalues[1].toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. COLLAPSIBLE DEEP THEORY & INSIGHTS DRAWER */}
      {showTheoryPanel && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">
                Spectral & SVD Mathematical Foundations
              </h3>
            </div>
            <div className="flex gap-1">
              {(["geometry", "svd", "eigen", "qr", "mahalanobis"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTheoryTab(tab)}
                  className={`rounded px-2.5 py-1 text-xs font-semibold capitalize transition ${
                    activeTheoryTab === tab
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs leading-relaxed text-slate-300">
            {activeTheoryTab === "geometry" && (
              <div className="space-y-2">
                <p>
                  <b>Linear Transformations as Geometric Action</b>: Any real 2×2 matrix represents
                  a linear mapping from {"ℝ² → ℝ²"}. It maps lines to lines, the origin to the
                  origin, and deforms the unit circle {"𝕊¹"} into an ellipse.
                </p>
                <p>
                  <b>Area Deformation & Determinant</b>: The determinant {"det(A) = ad - bc"}{" "}
                  measures the oriented area scaling factor. If {"det(A) < 0"}, the mapping reverses
                  spatial orientation (reflection component). If {"det(A) = 0"}, the transformation
                  is singular and collapses 2D space onto a 1D line or point.
                </p>
              </div>
            )}

            {activeTheoryTab === "svd" && (
              <div className="space-y-2">
                <p>
                  <b>Singular Value Decomposition (A = U Σ Vᵀ)</b>: Every linear mapping can be
                  factored into three canonical geometric operations:
                </p>
                <ul className="list-inside list-disc space-y-1 text-slate-400">
                  <li>
                    <b className="text-slate-200">1. Right Rotation Vᵀ</b>: Rotates the orthonormal
                    input singular basis v₁, v₂ to align with standard Cartesian axes.
                  </li>
                  <li>
                    <b className="text-slate-200">2. Anisotropic Scaling Σ</b>: Stretches/shrinks
                    along the axes by singular values σ₁ ≥ σ₂ ≥ 0, transforming the unit circle into
                    an axis-aligned ellipse.
                  </li>
                  <li>
                    <b className="text-slate-200">3. Left Rotation U</b>: Rotates the semi-axes of
                    the ellipse into output singular vectors u₁, u₂.
                  </li>
                </ul>
                <p>
                  <b>Machine Learning Connection</b>: SVD is the foundation of Low-Rank Adaptation
                  (LoRA in LLMs), Principal Component Analysis (PCA), Latent Semantic Analysis
                  (LSA), and condition number optimization κ(A) = σ₁ / σ₂.
                </p>
              </div>
            )}

            {activeTheoryTab === "eigen" && (
              <div className="space-y-2">
                <p>
                  <b>Eigendecomposition (A v = λ v)</b>: Identifies invariant directional lines in
                  the vector space where the transformation acts purely as a scalar stretch λ.
                </p>
                <p>
                  <b>Trace-Determinant Bifurcation Classification</b>: The characteristic equation{" "}
                  {"λ² - tr(A)λ + det(A) = 0"} has discriminant {"Δ = tr(A)² - 4 det(A)"}:
                </p>
                <ul className="list-inside list-disc space-y-1 text-slate-400">
                  <li>
                    {"det(A) < 0"}: <b>Saddle Point</b> (hyperbolic flow with stable & unstable
                    eigen-directions).
                  </li>
                  <li>
                    {"Δ > 0, det(A) > 0"}: <b>Nodes</b> (stable sink if {"tr < 0"}, unstable source
                    if {"tr > 0"}).
                  </li>
                  <li>
                    {"Δ < 0"}: <b>Spirals / Centers</b> (complex eigenvalues creating rotation and
                    vorticity).
                  </li>
                </ul>
              </div>
            )}

            {activeTheoryTab === "qr" && (
              <div className="space-y-2">
                <p>
                  <b>Modified Gram-Schmidt Orthogonalization (MGS)</b>: Successively projects each
                  column vector onto the orthogonal complement of the subspace spanned by previous
                  vectors:
                </p>
                <p className="font-mono text-emerald-400">
                  q₁ = v₁ / ||v₁||, &emsp; u₂ = v₂ - (v₂ · q₁) q₁, &emsp; q₂ = u₂ / ||u₂||
                </p>
                <p>
                  This yields the QR factorization {"A = QR"}, where Q is an orthonormal matrix{" "}
                  {"(Qᵀ Q = I)"} and R is upper triangular. MGS exhibits superior numerical
                  stability over Classical Gram-Schmidt in finite-precision floating-point
                  arithmetic.
                </p>
              </div>
            )}

            {activeTheoryTab === "mahalanobis" && (
              <div className="space-y-2">
                <p>
                  <b>Mahalanobis Distance & Precision Metric</b>: In correlated Gaussian
                  distributions with covariance Σ, standard Euclidean distance fails to capture
                  variance anisotropy. The Mahalanobis distance measures statistical distance in
                  units of standard deviation:
                </p>
                <p className="font-mono text-amber-400">d_M(x, μ) = √((x - μ)ᵀ Σ⁻¹ (x - μ))</p>
                <p>
                  <b>Whitening (ZCA / PCA Sphereing)</b>: The transformation{" "}
                  {"z = Σ^{-1/2}(x - μ)}"} decorrelates and standardizes the variables so that{" "}
                  {"Cov(z) = I"}. In whitened space, the Mahalanobis distance simplifies directly to
                  standard Euclidean distance {"||z||₂ = d_M"}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
