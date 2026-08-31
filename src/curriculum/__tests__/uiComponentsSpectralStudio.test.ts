import { describe, expect, it } from "bun:test";
import React from "react";
import {
  SpectralSVDGeometryStudio,
  SPECTRAL_STUDIO_PRESETS,
  computeSVD2x2,
  computeEigendecomposition2x2,
  computeGramSchmidt2x2,
  computeMahalanobis2x2,
  computeMatrixProperties2x2,
  type Matrix2x2,
  type Vector2,
  type SpectralPresetId,
} from "../../components/primitives/SpectralSVDGeometryStudio";

describe("SpectralSVDGeometryStudio & 2D Spectral Linear Algebra Tests", () => {
  describe("1. Component Instantiation & Configurations", () => {
    it("should instantiate SpectralSVDGeometryStudio with default props", () => {
      const element = React.createElement(SpectralSVDGeometryStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(SpectralSVDGeometryStudio);
    });

    it("should instantiate SpectralSVDGeometryStudio with custom modes, presets and callbacks", () => {
      const onMatrixChangeMock = () => {};
      const onModeChangeMock = () => {};

      const element = React.createElement(SpectralSVDGeometryStudio, {
        initialMode: "covariance",
        initialPreset: "ill_conditioned",
        initialMatrix: [
          [2.0, 1.99],
          [1.99, 2.0],
        ],
        width: 1024,
        height: 640,
        standalone: true,
        title: "Ill-Conditioned SVD & Metric Studio",
        onMatrixChange: onMatrixChangeMock,
        onModeChange: onModeChangeMock,
      });

      expect(element.props.initialMode).toBe("covariance");
      expect(element.props.initialPreset).toBe("ill_conditioned");
      expect(element.props.width).toBe(1024);
      expect(element.props.height).toBe(640);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Ill-Conditioned SVD & Metric Studio");
    });

    it("should provide valid preset structures for all defined presets", () => {
      const presetIds: SpectralPresetId[] = [
        "shear",
        "rotation",
        "scaling",
        "singular",
        "ill_conditioned",
        "covariance",
        "saddle_reflection",
        "identity",
      ];

      for (const id of presetIds) {
        const p = SPECTRAL_STUDIO_PRESETS[id];
        expect(p).toBeDefined();
        expect(p.id).toBe(id);
        expect(p.name).toBeDefined();
        expect(p.matrix).toBeDefined();
        expect(p.matrix.length).toBe(2);
        expect(p.matrix[0].length).toBe(2);
        expect(p.description).toBeDefined();
        expect(p.recommendedMode).toBeDefined();
        expect(p.theoryExplanation).toBeDefined();
      }
    });
  });

  describe("2. SVD 2x2 Decomposition (A = U Σ V^T)", () => {
    it("should compute exact SVD reconstruction U * Sigma * Vt = A across all presets", () => {
      const presetIds: SpectralPresetId[] = [
        "shear",
        "rotation",
        "scaling",
        "singular",
        "ill_conditioned",
        "covariance",
        "saddle_reflection",
        "identity",
      ];

      for (const id of presetIds) {
        const A = SPECTRAL_STUDIO_PRESETS[id].matrix;
        const svd = computeSVD2x2(A);

        // Reconstruction check
        expect(svd.reconstructionError).toBeLessThan(1e-10);
        expect(svd.reconstruction[0][0]).toBeCloseTo(A[0][0], 8);
        expect(svd.reconstruction[0][1]).toBeCloseTo(A[0][1], 8);
        expect(svd.reconstruction[1][0]).toBeCloseTo(A[1][0], 8);
        expect(svd.reconstruction[1][1]).toBeCloseTo(A[1][1], 8);

        // Singular values ordering: sigma1 >= sigma2 >= 0
        expect(svd.sigma[0]).toBeGreaterThanOrEqual(svd.sigma[1]);
        expect(svd.sigma[1]).toBeGreaterThanOrEqual(0);

        // Orthogonality of U: U^T U = I
        const utU00 = svd.U[0][0] * svd.U[0][0] + svd.U[1][0] * svd.U[1][0];
        const utU01 = svd.U[0][0] * svd.U[0][1] + svd.U[1][0] * svd.U[1][1];
        const utU11 = svd.U[0][1] * svd.U[0][1] + svd.U[1][1] * svd.U[1][1];
        expect(utU00).toBeCloseTo(1, 8);
        expect(utU11).toBeCloseTo(1, 8);
        expect(Math.abs(utU01)).toBeLessThan(1e-10);

        // Orthogonality of V: V^T V = I
        const vtV00 = svd.V[0][0] * svd.V[0][0] + svd.V[1][0] * svd.V[1][0];
        const vtV01 = svd.V[0][0] * svd.V[0][1] + svd.V[1][0] * svd.V[1][1];
        const vtV11 = svd.V[0][1] * svd.V[0][1] + svd.V[1][1] * svd.V[1][1];
        expect(vtV00).toBeCloseTo(1, 8);
        expect(vtV11).toBeCloseTo(1, 8);
        expect(Math.abs(vtV01)).toBeLessThan(1e-10);
      }
    });

    it("should accurately compute singular values for anisotropic scaling matrix", () => {
      const A: Matrix2x2 = [
        [2.0, 0.0],
        [0.0, 0.6],
      ];
      const svd = computeSVD2x2(A);

      expect(svd.sigma[0]).toBeCloseTo(2.0, 8);
      expect(svd.sigma[1]).toBeCloseTo(0.6, 8);
      expect(svd.conditionNumber).toBeCloseTo(2.0 / 0.6, 8);
    });

    it("should handle singular rank-1 matrix with sigma2 = 0 and condition number Infinity", () => {
      const A: Matrix2x2 = [
        [1.5, 1.0],
        [1.5, 1.0],
      ];
      const svd = computeSVD2x2(A);

      expect(svd.sigma[0]).toBeGreaterThan(0);
      expect(svd.sigma[1]).toBeCloseTo(0, 10);
      expect(svd.conditionNumber).toBe(Infinity);
      expect(svd.reconstructionError).toBeLessThan(1e-10);
    });

    it("should handle zero matrix without NaN or crashing", () => {
      const zeroMatrix: Matrix2x2 = [
        [0, 0],
        [0, 0],
      ];
      const svd = computeSVD2x2(zeroMatrix);

      expect(svd.sigma[0]).toBe(0);
      expect(svd.sigma[1]).toBe(0);
      expect(svd.reconstructionError).toBe(0);
      expect(svd.conditionNumber).toBe(Infinity);
    });

    it("should handle orientation-reversing reflection matrices (det < 0)", () => {
      const refl: Matrix2x2 = [
        [1.0, 0.0],
        [0.0, -1.0],
      ];
      const svd = computeSVD2x2(refl);

      expect(svd.sigma[0]).toBeCloseTo(1.0, 8);
      expect(svd.sigma[1]).toBeCloseTo(1.0, 8);
      expect(svd.reconstructionError).toBeLessThan(1e-10);
      expect(svd.detU * svd.detV).toBeLessThan(0); // Product of determinants reflects det(A) = -1
    });

    it("should accurately compute high condition number for ill-conditioned matrix", () => {
      const A: Matrix2x2 = [
        [2.0, 1.99],
        [1.99, 2.0],
      ];
      const svd = computeSVD2x2(A);

      // (2.0 + 1.99) / (2.0 - 1.99) = 3.99 / 0.01 = 399
      expect(svd.conditionNumber).toBeCloseTo(399, 1);
      expect(svd.reconstructionError).toBeLessThan(1e-10);
    });
  });

  describe("3. Eigendecomposition & Spectral Flow (A v = λ v)", () => {
    it("should verify A v = λ v for real diagonalizable matrices", () => {
      const A: Matrix2x2 = [
        [3.0, 1.0],
        [0.0, 2.0],
      ];
      const eigen = computeEigendecomposition2x2(A);

      expect(eigen.isReal).toBe(true);
      expect(eigen.eigenvalues[0]).toBeCloseTo(3.0, 8);
      expect(eigen.eigenvalues[1]).toBeCloseTo(2.0, 8);

      // Check A v1 = lambda1 v1
      const v1 = eigen.eigenvectors[0];
      const Av1_x = A[0][0] * v1[0] + A[0][1] * v1[1];
      const Av1_y = A[1][0] * v1[0] + A[1][1] * v1[1];
      expect(Av1_x).toBeCloseTo(eigen.eigenvalues[0] * v1[0], 8);
      expect(Av1_y).toBeCloseTo(eigen.eigenvalues[0] * v1[1], 8);

      // Check A v2 = lambda2 v2
      const v2 = eigen.eigenvectors[1];
      const Av2_x = A[0][0] * v2[0] + A[0][1] * v2[1];
      const Av2_y = A[1][0] * v2[0] + A[1][1] * v2[1];
      expect(Av2_x).toBeCloseTo(eigen.eigenvalues[1] * v2[0], 8);
      expect(Av2_y).toBeCloseTo(eigen.eigenvalues[1] * v2[1], 8);
    });

    it("should maintain Trace and Determinant algebraic consistency across all matrices", () => {
      const matrices: Matrix2x2[] = [
        [
          [1.0, 1.2],
          [0.0, 1.0],
        ],
        [
          [2.0, 0.0],
          [0.0, 0.6],
        ],
        [
          [1.5, 0.5],
          [0.5, -1.2],
        ],
        [
          [2.5, 1.2],
          [1.2, 1.0],
        ],
      ];

      for (const A of matrices) {
        const eigen = computeEigendecomposition2x2(A);
        const expectedTr = A[0][0] + A[1][1];
        const expectedDet = A[0][0] * A[1][1] - A[0][1] * A[1][0];

        expect(eigen.trace).toBeCloseTo(expectedTr, 8);
        expect(eigen.determinant).toBeCloseTo(expectedDet, 8);

        if (eigen.isReal) {
          const sumLambdas = eigen.eigenvalues[0] + eigen.eigenvalues[1];
          const prodLambdas = eigen.eigenvalues[0] * eigen.eigenvalues[1];
          expect(sumLambdas).toBeCloseTo(expectedTr, 8);
          expect(prodLambdas).toBeCloseTo(expectedDet, 8);
        } else if (eigen.eigenvaluesComplex) {
          const [c1, c2] = eigen.eigenvaluesComplex;
          expect(c1.re + c2.re).toBeCloseTo(expectedTr, 8);
          expect(c1.re * c2.re - c1.im * c2.im).toBeCloseTo(expectedDet, 8);
        }
      }
    });

    it("should identify complex conjugate eigenvalues and Center classification for pure rotation", () => {
      const angle = Math.PI / 4;
      const rot: Matrix2x2 = [
        [Math.cos(angle), -Math.sin(angle)],
        [Math.sin(angle), Math.cos(angle)],
      ];
      const eigen = computeEigendecomposition2x2(rot);

      expect(eigen.isReal).toBe(false);
      expect(eigen.discriminant).toBeLessThan(0);
      expect(eigen.classification).toBe("center");
      expect(eigen.eigenvaluesComplex).toBeDefined();

      if (eigen.eigenvaluesComplex) {
        expect(eigen.eigenvaluesComplex[0].re).toBeCloseTo(Math.cos(angle), 8);
        expect(eigen.eigenvaluesComplex[0].im).toBeCloseTo(Math.sin(angle), 8);
        expect(eigen.eigenvaluesComplex[1].im).toBeCloseTo(-Math.sin(angle), 8);
      }
    });

    it("should identify defective matrices with algebraic multiplicity 2 and geometric multiplicity 1", () => {
      const shear: Matrix2x2 = [
        [1.0, 1.2],
        [0.0, 1.0],
      ];
      const eigen = computeEigendecomposition2x2(shear);

      expect(eigen.isReal).toBe(true);
      expect(eigen.isDefective).toBe(true);
      expect(eigen.algebraicMultiplicity).toBe(2);
      expect(eigen.geometricMultiplicity).toBe(1);
      expect(eigen.classification).toBe("degenerate_defective");
      expect(eigen.eigenvalues[0]).toBeCloseTo(1.0, 8);
      expect(eigen.eigenvalues[1]).toBeCloseTo(1.0, 8);
    });

    it("should identify non-defective scalar matrices as Star Nodes", () => {
      const scalar: Matrix2x2 = [
        [2.0, 0.0],
        [0.0, 2.0],
      ];
      const eigen = computeEigendecomposition2x2(scalar);

      expect(eigen.isReal).toBe(true);
      expect(eigen.isDefective).toBe(false);
      expect(eigen.algebraicMultiplicity).toBe(2);
      expect(eigen.geometricMultiplicity).toBe(2);
      expect(eigen.classification).toBe("star_node");
    });

    it("should classify matrices with det < 0 as Saddles", () => {
      const saddle: Matrix2x2 = [
        [1.5, 0.5],
        [0.5, -1.2],
      ];
      const eigen = computeEigendecomposition2x2(saddle);

      expect(eigen.determinant).toBeLessThan(0);
      expect(eigen.classification).toBe("saddle");
      expect(eigen.isReal).toBe(true);
      expect(eigen.eigenvalues[0]).toBeGreaterThan(0);
      expect(eigen.eigenvalues[1]).toBeLessThan(0);
    });
  });

  describe("4. Modified Gram-Schmidt Orthogonalization (MGS)", () => {
    it("should produce strictly orthonormal vectors Q = [q1, q2] with q1 · q2 = 0", () => {
      const matrices: Matrix2x2[] = [
        [
          [1.0, 1.2],
          [0.0, 1.0],
        ],
        [
          [2.0, 0.0],
          [0.0, 0.6],
        ],
        [
          [2.5, 1.2],
          [1.2, 1.0],
        ],
        [
          [1.5, 0.5],
          [0.5, -1.2],
        ],
      ];

      for (const A of matrices) {
        const mgs = computeGramSchmidt2x2(A);

        // Dot product q1 · q2 = 0
        expect(Math.abs(mgs.dotProduct)).toBeLessThan(1e-10);

        // Unit norms ||q1|| = 1, ||q2|| = 1
        const normQ1 = Math.sqrt(mgs.q1[0] * mgs.q1[0] + mgs.q1[1] * mgs.q1[1]);
        const normQ2 = Math.sqrt(mgs.q2[0] * mgs.q2[0] + mgs.q2[1] * mgs.q2[1]);
        expect(normQ1).toBeCloseTo(1.0, 8);
        expect(normQ2).toBeCloseTo(1.0, 8);

        // Orthogonality loss ||Q^T Q - I||_F ≈ 0
        expect(mgs.orthogonalityLoss).toBeLessThan(1e-10);

        // QR reconstruction ||Q R - A||_F ≈ 0
        expect(mgs.reconstructionError).toBeLessThan(1e-10);

        // Upper triangularity of R
        expect(mgs.R[1][0]).toBe(0);
      }
    });

    it("should handle linearly dependent column vectors via orthogonal complement fallback", () => {
      const singularA: Matrix2x2 = [
        [1.0, 2.0],
        [2.0, 4.0],
      ];
      const mgs = computeGramSchmidt2x2(singularA);

      expect(mgs.isLinearlyDependent).toBe(true);
      expect(Math.abs(mgs.dotProduct)).toBeLessThan(1e-10);

      const normQ1 = Math.sqrt(mgs.q1[0] * mgs.q1[0] + mgs.q1[1] * mgs.q1[1]);
      const normQ2 = Math.sqrt(mgs.q2[0] * mgs.q2[0] + mgs.q2[1] * mgs.q2[1]);
      expect(normQ1).toBeCloseTo(1.0, 8);
      expect(normQ2).toBeCloseTo(1.0, 8);
    });

    it("should verify scalar projection formula r_12 = v_2 · q_1", () => {
      const A: Matrix2x2 = [
        [3.0, 4.0],
        [4.0, 1.0],
      ];
      const mgs = computeGramSchmidt2x2(A);

      const expectedProjScalar = A[0][1] * mgs.q1[0] + A[1][1] * mgs.q1[1];
      expect(mgs.projScalar).toBeCloseTo(expectedProjScalar, 8);
      expect(mgs.R[0][1]).toBeCloseTo(expectedProjScalar, 8);
    });
  });

  describe("5. Covariance & Mahalanobis Metric (d_M & PCA Whitening)", () => {
    it("should verify positive definite covariance properties and precision matrix", () => {
      const C: Matrix2x2 = [
        [2.5, 1.2],
        [1.2, 1.0],
      ];
      const point: Vector2 = [1.5, 0.8];
      const res = computeMahalanobis2x2(C, point, [0, 0]);

      expect(res.isPositiveDefinite).toBe(true);
      expect(res.eigenvalues[0]).toBeGreaterThan(0);
      expect(res.eigenvalues[1]).toBeGreaterThan(0);

      // Verify C * Precision = I
      const p00 =
        res.covariance[0][0] * res.precision[0][0] + res.covariance[0][1] * res.precision[1][0];
      const p01 =
        res.covariance[0][0] * res.precision[0][1] + res.covariance[0][1] * res.precision[1][1];
      const p10 =
        res.covariance[1][0] * res.precision[0][0] + res.covariance[1][1] * res.precision[1][0];
      const p11 =
        res.covariance[1][0] * res.precision[0][1] + res.covariance[1][1] * res.precision[1][1];

      expect(p00).toBeCloseTo(1.0, 8);
      expect(p11).toBeCloseTo(1.0, 8);
      expect(Math.abs(p01)).toBeLessThan(1e-10);
      expect(Math.abs(p10)).toBeLessThan(1e-10);
    });

    it("should compute exact Mahalanobis distance d_M = 1.0 on 1-sigma PCA principal axis point", () => {
      const C: Matrix2x2 = [
        [2.0, 0.5],
        [0.5, 1.5],
      ];
      const baseRes = computeMahalanobis2x2(C, [0, 0], [0, 0]);

      // Point on 1-sigma ellipse along major principal axis: x = u1 * sqrt(lambda1)
      const u1 = baseRes.eigenvectors[0];
      const lam1 = baseRes.eigenvalues[0];
      const point1Sigma: Vector2 = [u1[0] * Math.sqrt(lam1), u1[1] * Math.sqrt(lam1)];

      const res = computeMahalanobis2x2(C, point1Sigma, [0, 0]);
      expect(res.mahalanobisDistance).toBeCloseTo(1.0, 6);
      expect(res.mahalanobisDistanceSquared).toBeCloseTo(1.0, 6);

      // Point on 2-sigma ellipse along minor principal axis: x = 2 * u2 * sqrt(lambda2)
      const u2 = baseRes.eigenvectors[1];
      const lam2 = baseRes.eigenvalues[1];
      const point2Sigma: Vector2 = [2 * u2[0] * Math.sqrt(lam2), 2 * u2[1] * Math.sqrt(lam2)];

      const res2 = computeMahalanobis2x2(C, point2Sigma, [0, 0]);
      expect(res2.mahalanobisDistance).toBeCloseTo(2.0, 6);
    });

    it("should verify Whitening transformation z = C^{-1/2} (x - mu) satisfies ||z||_2 = d_M", () => {
      const C: Matrix2x2 = [
        [2.5, 1.2],
        [1.2, 1.0],
      ];
      const mean: Vector2 = [0.5, -0.3];
      const point: Vector2 = [1.8, 1.2];

      const res = computeMahalanobis2x2(C, point, mean);

      const zNorm = Math.sqrt(
        res.whitenedPoint[0] * res.whitenedPoint[0] + res.whitenedPoint[1] * res.whitenedPoint[1],
      );

      expect(zNorm).toBeCloseTo(res.mahalanobisDistance, 6);
    });

    it("should provide exact cumulative Gaussian probability percentiles for confidence ellipses", () => {
      const C: Matrix2x2 = [
        [1.0, 0.0],
        [0.0, 1.0],
      ];
      const res = computeMahalanobis2x2(C, [0, 0]);

      // 1 - exp(-k^2 / 2)
      expect(res.confidenceEllipses.sigma1.prob).toBeCloseTo(1 - Math.exp(-0.5), 6); // ~39.35%
      expect(res.confidenceEllipses.sigma2.prob).toBeCloseTo(1 - Math.exp(-2.0), 6); // ~86.47%
      expect(res.confidenceEllipses.sigma3.prob).toBeCloseTo(1 - Math.exp(-4.5), 6); // ~98.89%
    });
  });

  describe("6. Matrix Properties & Invariant Checks", () => {
    it("should correctly compute rank, determinant, trace, Frobenius norm and inverse", () => {
      const A: Matrix2x2 = [
        [4.0, 7.0],
        [2.0, 6.0],
      ];
      const props = computeMatrixProperties2x2(A);

      // det = 4*6 - 7*2 = 24 - 14 = 10
      expect(props.determinant).toBeCloseTo(10.0, 8);
      // tr = 4 + 6 = 10
      expect(props.trace).toBeCloseTo(10.0, 8);
      // ||A||_F = sqrt(16 + 49 + 4 + 36) = sqrt(105)
      expect(props.frobeniusNorm).toBeCloseTo(Math.sqrt(105), 8);
      expect(props.rank).toBe(2);
      expect(props.isInvertible).toBe(true);

      expect(props.inverse).toBeDefined();
      if (props.inverse) {
        // A * A^{-1} = I
        const i00 = A[0][0] * props.inverse[0][0] + A[0][1] * props.inverse[1][0];
        const i01 = A[0][0] * props.inverse[0][1] + A[0][1] * props.inverse[1][1];
        const i10 = A[1][0] * props.inverse[0][0] + A[1][1] * props.inverse[1][0];
        const i11 = A[1][0] * props.inverse[0][1] + A[1][1] * props.inverse[1][1];

        expect(i00).toBeCloseTo(1.0, 8);
        expect(i11).toBeCloseTo(1.0, 8);
        expect(Math.abs(i01)).toBeLessThan(1e-10);
        expect(Math.abs(i10)).toBeLessThan(1e-10);
      }
    });

    it("should correctly detect singular matrix rank and null inverse", () => {
      const singularA: Matrix2x2 = [
        [2.0, 4.0],
        [1.0, 2.0],
      ];
      const props = computeMatrixProperties2x2(singularA);

      expect(props.determinant).toBeCloseTo(0.0, 8);
      expect(props.rank).toBe(1);
      expect(props.isInvertible).toBe(false);
      expect(props.inverse).toBeNull();
    });

    it("should correctly identify orthogonal matrices (A^T A = I)", () => {
      const angle = Math.PI / 3; // 60 degrees
      const rot: Matrix2x2 = [
        [Math.cos(angle), -Math.sin(angle)],
        [Math.sin(angle), Math.cos(angle)],
      ];
      const props = computeMatrixProperties2x2(rot);

      expect(props.isOrthogonal).toBe(true);
      expect(props.conditionNumber).toBeCloseTo(1.0, 8);
    });

    it("should correctly identify symmetric matrices (A = A^T)", () => {
      const sym: Matrix2x2 = [
        [3.0, -1.5],
        [-1.5, 2.0],
      ];
      const props = computeMatrixProperties2x2(sym);

      expect(props.isSymmetric).toBe(true);
    });
  });
});
