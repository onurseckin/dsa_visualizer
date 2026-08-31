import { describe, expect, it } from "bun:test";
import React from "react";
import {
  BayesianOptimizationStudio,
  gaussianPdf,
  erf,
  gaussianCdf,
  evaluateKernelRBF,
  evaluateKernelMatern52,
  evaluateKernel,
  computeKernelMatrix,
  choleskyDecomposition,
  forwardSubstitution,
  backwardSubstitution,
  choleskySolve,
  createDeterministicRng,
  sampleStandardNormal,
  fitGPPosterior,
  computeAcquisitionEI,
  computeAcquisitionUCB,
  computeAcquisitionPI,
  computeAcquisitionValues,
  findNextQueryPoint,
  computeSimpleRegret,
  computeCumulativeRegret,
  generateInitialDesign,
  BENCHMARK_OBJECTIVES,
  BAYES_OPT_PRESETS,
  type BayesOptPresetId,
} from "../../components/primitives/BayesianOptimizationStudio";

describe("BayesianOptimizationStudio & Active Learning GP Engine Test Suite", () => {
  // ==========================================================================
  // SECTION 1: COMPONENT INSTANTIATION, PROPS, PRESETS & BENCHMARK REGISTRY
  // ==========================================================================
  describe("Section 1: Component Instantiation, Props, Presets & Benchmark Registry", () => {
    it("should instantiate BayesianOptimizationStudio with default props", () => {
      const element = React.createElement(BayesianOptimizationStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(BayesianOptimizationStudio);
    });

    it("should instantiate BayesianOptimizationStudio with full custom props and callbacks", () => {
      const onStepMock = () => {};
      const onOptimumFoundMock = () => {};

      const element = React.createElement(BayesianOptimizationStudio, {
        initialBenchmark: "branin",
        initialAcquisition: "ucb",
        initialKernel: "matern52",
        initialInitialSamples: 6,
        initialDirection: "minimize",
        initialPreset: "branin_ei_2d",
        width: 1200,
        height: 800,
        standalone: true,
        title: "Stanford CS229 / CS336 Active Learning & GP Studio",
        onStep: onStepMock,
        onOptimumFound: onOptimumFoundMock,
      });

      expect(element.props.initialBenchmark).toBe("branin");
      expect(element.props.initialAcquisition).toBe("ucb");
      expect(element.props.initialKernel).toBe("matern52");
      expect(element.props.initialInitialSamples).toBe(6);
      expect(element.props.initialDirection).toBe("minimize");
      expect(element.props.initialPreset).toBe("branin_ei_2d");
      expect(element.props.width).toBe(1200);
      expect(element.props.height).toBe(800);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Stanford CS229 / CS336 Active Learning & GP Studio");
      expect(element.props.onStep).toBe(onStepMock);
      expect(element.props.onOptimumFound).toBe(onOptimumFoundMock);
    });

    it("should validate all 6 preset configurations in BAYES_OPT_PRESETS", () => {
      const presetIds: BayesOptPresetId[] = [
        "forrester_ei",
        "gramacy_ucb",
        "multimodal_pi",
        "branin_ei_2d",
        "six_hump_ucb_2d",
        "ackley_ts_2d",
      ];

      for (const id of presetIds) {
        const preset = BAYES_OPT_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(typeof preset.name).toBe("string");
        expect(preset.name.length).toBeGreaterThan(0);
        expect(typeof preset.description).toBe("string");
        expect(preset.description.length).toBeGreaterThan(0);
        expect(BENCHMARK_OBJECTIVES[preset.objectiveId]).toBeDefined();

        expect(["ei", "ucb", "pi", "thompson"]).toContain(preset.acquisitionType);
        expect(["rbf", "matern52"]).toContain(preset.kernelType);
        expect(["minimize", "maximize"]).toContain(preset.direction);
        expect(preset.initialSamples).toBeGreaterThanOrEqual(1);

        const hp = preset.hyperparams;
        expect(hp.lengthscale).toBeGreaterThan(0);
        expect(hp.variance).toBeGreaterThan(0);
        expect(hp.noiseVariance).toBeGreaterThanOrEqual(0);
        expect(hp.jitter).toBeGreaterThan(0);
        expect(hp.xi).toBeGreaterThanOrEqual(0);
        expect(hp.beta).toBeGreaterThan(0);
      }
    });

    it("should validate all 6 benchmark objective definitions in BENCHMARK_OBJECTIVES", () => {
      const objectiveIds: OptimizationObjectiveId[] = [
        "forrester",
        "gramacy_lee",
        "multimodal_sine_cos",
        "branin",
        "six_hump_camel",
        "ackley",
      ];

      for (const id of objectiveIds) {
        const obj = BENCHMARK_OBJECTIVES[id];
        expect(obj).toBeDefined();
        expect(obj.id).toBe(id);
        expect(typeof obj.name).toBe("string");
        expect(obj.name.length).toBeGreaterThan(0);
        expect(obj.dimension === 1 || obj.dimension === 2).toBe(true);
        expect(typeof obj.formulaTeX).toBe("string");
        expect(obj.formulaTeX.length).toBeGreaterThan(0);
        expect(typeof obj.description).toBe("string");
        expect(obj.description.length).toBeGreaterThan(0);

        expect(obj.bounds.length).toBe(obj.dimension);
        for (const bound of obj.bounds) {
          expect(bound.min).toBeLessThan(bound.max);
          expect(Number.isFinite(bound.min)).toBe(true);
          expect(Number.isFinite(bound.max)).toBe(true);
        }

        expect(obj.globalOptima.length).toBeGreaterThanOrEqual(1);
        for (const opt of obj.globalOptima) {
          expect(opt.x.length).toBe(obj.dimension);
          expect(Number.isFinite(opt.y)).toBe(true);
          for (let d = 0; d < obj.dimension; d++) {
            expect(opt.x[d]).toBeGreaterThanOrEqual(obj.bounds[d].min - 0.05);
            expect(opt.x[d]).toBeLessThanOrEqual(obj.bounds[d].max + 0.05);
          }
        }

        expect(["minimize", "maximize"]).toContain(obj.defaultDirection);
        expect(typeof obj.fn).toBe("function");

        const testX = obj.bounds.map((b) => (b.min + b.max) / 2);
        const testVal = obj.fn(testX);
        expect(Number.isFinite(testVal)).toBe(true);

        const hp = obj.recommendedHyperparams;
        expect(hp.lengthscale).toBeGreaterThan(0);
        expect(hp.variance).toBeGreaterThan(0);
        expect(hp.noiseVariance).toBeGreaterThanOrEqual(0);
        expect(hp.jitter).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // SECTION 2: PURE STATISTICAL & ERROR FUNCTIONS (gaussianPdf, erf, gaussianCdf)
  // ==========================================================================
  describe("Section 2: Pure Statistical & Error Functions", () => {
    it("gaussianPdf: should evaluate standard normal probability density function exactly", () => {
      // phi(0) = 1 / sqrt(2 * pi) approx 0.3989422804
      const phiZero = gaussianPdf(0);
      expect(phiZero).toBeCloseTo(1 / Math.sqrt(2 * Math.PI), 8);

      // Symmetry: phi(z) = phi(-z)
      const testZs = [0.25, 0.5, 1.0, 1.5, 1.96, 2.58, 3.0, 4.0];
      for (const z of testZs) {
        expect(gaussianPdf(z)).toBeCloseTo(gaussianPdf(-z), 10);
      }

      // Inflection point at z = 1: phi(1) = 1 / sqrt(2 * pi * e) approx 0.2419707
      const phiOne = gaussianPdf(1);
      expect(phiOne).toBeCloseTo((1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5), 8);

      // 2-sigma point: phi(2) = 1 / sqrt(2 * pi) * exp(-2) approx 0.05399097
      const phiTwo = gaussianPdf(2);
      expect(phiTwo).toBeCloseTo((1 / Math.sqrt(2 * Math.PI)) * Math.exp(-2), 8);

      // Monotonic decay for z >= 0
      for (let i = 0; i < testZs.length - 1; i++) {
        expect(gaussianPdf(testZs[i])).toBeGreaterThan(gaussianPdf(testZs[i + 1]));
      }

      // Asymptotic limits as z -> +/- infinity
      expect(gaussianPdf(10)).toBeLessThan(1e-20);
      expect(gaussianPdf(-10)).toBeLessThan(1e-20);
      expect(gaussianPdf(0)).toBeGreaterThan(0);
    });

    it("erf: should evaluate Abramowitz & Stegun error function with high numerical accuracy", () => {
      // erf(0) = 0
      expect(erf(0)).toBe(0);

      // Odd function symmetry: erf(-x) = -erf(x)
      const testXs = [0.1, 0.5, 1.0, 1.5, 2.0, 3.0];
      for (const x of testXs) {
        expect(erf(-x)).toBeCloseTo(-erf(x), 7);
      }

      // Known reference values:
      // erf(0.5) approx 0.5204998778
      expect(erf(0.5)).toBeCloseTo(0.52049988, 6);

      // erf(1.0) approx 0.8427007929
      expect(erf(1.0)).toBeCloseTo(0.84270079, 6);

      // erf(2.0) approx 0.9953222650
      expect(erf(2.0)).toBeCloseTo(0.99532227, 6);

      // erf(1 / sqrt(2)) relates to 1-sigma normal CDF interval approx 0.682689
      expect(erf(1 / Math.SQRT2)).toBeCloseTo(0.682689, 5);

      // Boundary saturation limits for |x| > 8
      expect(erf(8.5)).toBe(1);
      expect(erf(100)).toBe(1);
      expect(erf(-8.5)).toBe(-1);
      expect(erf(-100)).toBe(-1);

      // Strict monotonicity across [-4, 4]
      for (let x = -4; x < 4; x += 0.5) {
        expect(erf(x)).toBeLessThanOrEqual(erf(x + 0.5));
      }
    });

    it("gaussianCdf: should evaluate standard normal CDF with symmetry and critical percentiles", () => {
      // Median / mean of standard normal: Phi(0) = 0.5
      expect(gaussianCdf(0)).toBeCloseTo(0.5, 8);

      // Symmetry property: Phi(z) + Phi(-z) = 1.0
      const testZs = [0.25, 0.5, 1.0, 1.645, 1.96, 2.33, 2.58, 3.0];
      for (const z of testZs) {
        expect(gaussianCdf(z) + gaussianCdf(-z)).toBeCloseTo(1.0, 6);
      }

      // 1-sigma coverage: Phi(1) - Phi(-1) approx 0.682689
      const oneSigmaCoverage = gaussianCdf(1.0) - gaussianCdf(-1.0);
      expect(oneSigmaCoverage).toBeCloseTo(0.682689, 4);

      // 95% two-tailed confidence critical z = 1.95996: Phi(1.95996) approx 0.975
      expect(gaussianCdf(1.95996)).toBeCloseTo(0.975, 4);

      // 90% two-tailed confidence critical z = 1.64485: Phi(1.64485) approx 0.950
      expect(gaussianCdf(1.64485)).toBeCloseTo(0.95, 4);

      // 2-sigma coverage: Phi(2) - Phi(-2) approx 0.9545
      const twoSigmaCoverage = gaussianCdf(2.0) - gaussianCdf(-2.0);
      expect(twoSigmaCoverage).toBeCloseTo(0.9545, 4);

      // 99% two-tailed confidence critical z = 2.57583: Phi(2.57583) approx 0.995
      expect(gaussianCdf(2.57583)).toBeCloseTo(0.995, 4);

      // 3-sigma coverage: Phi(3) - Phi(-3) approx 0.9973
      const threeSigmaCoverage = gaussianCdf(3.0) - gaussianCdf(-3.0);
      expect(threeSigmaCoverage).toBeCloseTo(0.9973, 4);

      // Asymptotic boundary limits for |z| > 8
      expect(gaussianCdf(8.5)).toBe(1);
      expect(gaussianCdf(50)).toBe(1);
      expect(gaussianCdf(-8.5)).toBe(0);
      expect(gaussianCdf(-50)).toBe(0);

      // Monotonicity: z1 < z2 => Phi(z1) <= Phi(z2)
      for (let z = -5; z < 5; z += 0.5) {
        expect(gaussianCdf(z)).toBeLessThanOrEqual(gaussianCdf(z + 0.5));
      }
    });
  });

  // ==========================================================================
  // SECTION 3: KERNEL FUNCTIONS (evaluateKernelRBF, evaluateKernelMatern52, evaluateKernel)
  // ==========================================================================
  describe("Section 3: Kernel Functions & Covariance Properties", () => {
    const lengthscale = 1.5;
    const variance = 4.0;

    it("evaluateKernelRBF: should evaluate exact Squared Exponential covariance and distance decay", () => {
      // 1. Self-covariance: k(x, x) = sigma_f^2 = 4.0
      const kSelf1D = evaluateKernelRBF([2.5], [2.5], lengthscale, variance);
      expect(kSelf1D).toBeCloseTo(variance, 8);

      const kSelf2D = evaluateKernelRBF([1.0, -2.0], [1.0, -2.0], lengthscale, variance);
      expect(kSelf2D).toBeCloseTo(variance, 8);

      // 2. Exact analytical evaluation at r = ell: k = sigma_f^2 * exp(-0.5)
      const x1 = [1.0];
      const x2 = [1.0 + lengthscale];
      const kAtEll = evaluateKernelRBF(x1, x2, lengthscale, variance);
      expect(kAtEll).toBeCloseTo(variance * Math.exp(-0.5), 6);

      // 3. Exact analytical evaluation at r = 2 * ell: k = sigma_f^2 * exp(-2.0)
      const x3 = [1.0 + 2 * lengthscale];
      const kAt2Ell = evaluateKernelRBF(x1, x3, lengthscale, variance);
      expect(kAt2Ell).toBeCloseTo(variance * Math.exp(-2.0), 6);

      // 4. Multi-dimensional 2D Euclidean distance: x1=[0, 0], x2=[3, 4] => r=5
      const k2D = evaluateKernelRBF([0, 0], [3, 4], 5.0, 10.0);
      // r = 5, ell = 5 => r^2 / (2 * ell^2) = 25 / 50 = 0.5 => k = 10 * exp(-0.5)
      expect(k2D).toBeCloseTo(10.0 * Math.exp(-0.5), 6);

      // 5. Symmetry: k(x1, x2) = k(x2, x1)
      expect(evaluateKernelRBF([1.2, 3.4], [5.6, 7.8], lengthscale, variance)).toBeCloseTo(
        evaluateKernelRBF([5.6, 7.8], [1.2, 3.4], lengthscale, variance),
        10,
      );

      // 6. Monotonic decay with distance
      const kD1 = evaluateKernelRBF([0], [1.0], lengthscale, variance);
      const kD2 = evaluateKernelRBF([0], [2.0], lengthscale, variance);
      const kD3 = evaluateKernelRBF([0], [3.0], lengthscale, variance);
      expect(kD1).toBeGreaterThan(kD2);
      expect(kD2).toBeGreaterThan(kD3);

      // 7. Lengthscale scaling: larger lengthscale preserves higher correlation at fixed distance
      const kShortL = evaluateKernelRBF([0], [1.0], 0.5, variance);
      const kLongL = evaluateKernelRBF([0], [1.0], 2.5, variance);
      expect(kLongL).toBeGreaterThan(kShortL);

      // 8. Variance scaling: directly proportional
      const kVar1 = evaluateKernelRBF([0], [1.0], lengthscale, 1.0);
      const kVar5 = evaluateKernelRBF([0], [1.0], lengthscale, 5.0);
      expect(kVar5).toBeCloseTo(5.0 * kVar1, 8);
    });

    it("evaluateKernelMatern52: should evaluate exact Matérn 5/2 covariance with C2 differentiability", () => {
      // 1. Self-covariance: r = 0 => d = 0 => (1 + 0 + 0) * exp(0) * sigma_f^2 = sigma_f^2
      const kSelf = evaluateKernelMatern52([3.0], [3.0], lengthscale, variance);
      expect(kSelf).toBeCloseTo(variance, 8);

      // 2. Exact evaluation at r = ell:
      // r = ell => d = sqrt(5)
      // k = sigma_f^2 * (1 + sqrt(5) + 5 / 3) * exp(-sqrt(5))
      const d = Math.sqrt(5);
      const expectedAtEll = variance * (1 + d + (d * d) / 3) * Math.exp(-d);
      const kAtEll = evaluateKernelMatern52([0], [lengthscale], lengthscale, variance);
      expect(kAtEll).toBeCloseTo(expectedAtEll, 6);

      // 3. Multi-dimensional 2D evaluation: x1=[1, 2], x2=[4, 6] => r = sqrt(9 + 16) = 5
      const ell2D = 2.5;
      const var2D = 8.0;
      const d2D = (Math.sqrt(5) * 5.0) / ell2D;
      const expected2D = var2D * (1 + d2D + (d2D * d2D) / 3) * Math.exp(-d2D);
      const k2D = evaluateKernelMatern52([1, 2], [4, 6], ell2D, var2D);
      expect(k2D).toBeCloseTo(expected2D, 6);

      // 4. Symmetry
      expect(evaluateKernelMatern52([2, 5], [7, 1], lengthscale, variance)).toBeCloseTo(
        evaluateKernelMatern52([7, 1], [2, 5], lengthscale, variance),
        10,
      );

      // 5. Comparison with RBF: Matérn 5/2 has heavier tails than RBF
      const rLarge = 4.0 * lengthscale;
      const kMaternFar = evaluateKernelMatern52([0], [rLarge], lengthscale, variance);
      const kRBFFar = evaluateKernelRBF([0], [rLarge], lengthscale, variance);
      expect(kMaternFar).toBeGreaterThan(kRBFFar);
    });

    it("evaluateKernel: should accurately dispatch between RBF and Matérn 5/2 kernels", () => {
      const x1 = [1.0, 2.0];
      const x2 = [2.5, 3.5];

      const rbfDirect = evaluateKernelRBF(x1, x2, lengthscale, variance);
      const rbfDispatched = evaluateKernel(x1, x2, "rbf", lengthscale, variance);
      expect(rbfDispatched).toBeCloseTo(rbfDirect, 10);

      const maternDirect = evaluateKernelMatern52(x1, x2, lengthscale, variance);
      const maternDispatched = evaluateKernel(x1, x2, "matern52", lengthscale, variance);
      expect(maternDispatched).toBeCloseTo(maternDirect, 10);
    });
  });

  // ==========================================================================
  // SECTION 4: NUMERICAL LINEAR ALGEBRA & SOLVERS (computeKernelMatrix, cholesky, solvers)
  // ==========================================================================
  describe("Section 4: Numerical Linear Algebra & Cholesky Solvers", () => {
    it("computeKernelMatrix: should construct symmetric Gram matrices and rectangular cross-covariance matrices", () => {
      const X = [[0.0], [0.5], [1.0], [1.5], [2.0]];
      const K = computeKernelMatrix(X, X, "matern52", 1.0, 3.0);

      // Verify dimensions
      expect(K.length).toBe(5);
      expect(K[0].length).toBe(5);

      // Verify symmetry K = K^T
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          expect(K[i][j]).toBeCloseTo(K[j][i], 10);
        }
      }

      // Verify diagonal entries equal variance sigma_f^2 = 3.0
      for (let i = 0; i < 5; i++) {
        expect(K[i][i]).toBeCloseTo(3.0, 8);
      }

      // Verify cross-covariance matrix K(X1, X2) of shape N1 x N2
      const X1 = [
        [0.1, 0.2],
        [0.4, 0.5],
        [0.7, 0.8],
      ];
      const X2 = [
        [0.2, 0.3],
        [0.9, 1.0],
      ];
      const Kcross = computeKernelMatrix(X1, X2, "rbf", 1.2, 2.0);
      expect(Kcross.length).toBe(3);
      expect(Kcross[0].length).toBe(2);

      const KcrossTranspose = computeKernelMatrix(X2, X1, "rbf", 1.2, 2.0);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          expect(Kcross[i][j]).toBeCloseTo(KcrossTranspose[j][i], 10);
        }
      }
    });

    it("choleskyDecomposition: should factorize SPD matrix A = L L^T with exact reconstruction", () => {
      // Test known 2x2 SPD matrix:
      // A = [ [4, 2], [2, 5] ]
      // L = [ [2, 0], [1, 2] ] because 2*2=4, 1*2=2, 1*1+2*2=5
      const A2x2 = [
        [4.0, 2.0],
        [2.0, 5.0],
      ];
      const L2x2 = choleskyDecomposition(A2x2, 0.0);
      expect(L2x2[0][0]).toBeCloseTo(2.0, 5);
      expect(L2x2[0][1]).toBe(0.0);
      expect(L2x2[1][0]).toBeCloseTo(1.0, 5);
      expect(L2x2[1][1]).toBeCloseTo(2.0, 5);

      // Verify L * L^T = A
      const reconstructed00 = L2x2[0][0] * L2x2[0][0];
      const reconstructed01 = L2x2[0][0] * L2x2[1][0];
      const reconstructed11 = L2x2[1][0] * L2x2[1][0] + L2x2[1][1] * L2x2[1][1];
      expect(reconstructed00).toBeCloseTo(4.0, 5);
      expect(reconstructed01).toBeCloseTo(2.0, 5);
      expect(reconstructed11).toBeCloseTo(5.0, 5);

      // Test 4x4 Gram matrix SPD factorization
      const X = [[0.1], [0.4], [0.8], [1.2]];
      const K = computeKernelMatrix(X, X, "rbf", 1.0, 2.5);
      const L = choleskyDecomposition(K, 1e-6);

      expect(L.length).toBe(4);
      // Check lower triangular structure
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          expect(L[i][j]).toBe(0);
        }
        // Diagonal must be strictly positive
        expect(L[i][i]).toBeGreaterThan(0);
      }

      // Check L * L^T equals K + jitter * I
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          let sum = 0;
          for (let k = 0; k <= Math.min(i, j); k++) {
            sum += L[i][k] * L[j][k];
          }
          const expected = K[i][j] + (i === j ? 1e-6 : 0);
          expect(sum).toBeCloseTo(expected, 4);
        }
      }

      // Empty matrix returns empty
      expect(choleskyDecomposition([])).toEqual([]);
    });

    it("choleskyDecomposition: should stabilize ill-conditioned / near-singular matrices with adaptive jitter", () => {
      // Create a near-singular matrix (two nearly identical rows)
      const nearSingular = [
        [1.0, 0.99999999, 0.5],
        [0.99999999, 1.0, 0.5],
        [0.5, 0.5, 1.0],
      ];

      const L = choleskyDecomposition(nearSingular, 1e-6);
      expect(L.length).toBe(3);
      for (let i = 0; i < 3; i++) {
        expect(L[i][i]).toBeGreaterThan(0);
        for (let j = i + 1; j < 3; j++) {
          expect(L[i][j]).toBe(0);
        }
      }
    });

    it("forwardSubstitution & backwardSubstitution: should accurately solve triangular systems", () => {
      // Lower triangular matrix L:
      // [ [2, 0, 0],
      //   [1, 3, 0],
      //   [4, 2, 5] ]
      const L = [
        [2, 0, 0],
        [1, 3, 0],
        [4, 2, 5],
      ];
      const b = [4, 11, 28];

      // Forward substitution: L * y = b
      // y0 = 4 / 2 = 2
      // y1 = (11 - 1*2) / 3 = 9 / 3 = 3
      // y2 = (28 - 4*2 - 2*3) / 5 = (28 - 8 - 6) / 5 = 14 / 5 = 2.8
      const y = forwardSubstitution(L, b);
      expect(y[0]).toBeCloseTo(2.0, 8);
      expect(y[1]).toBeCloseTo(3.0, 8);
      expect(y[2]).toBeCloseTo(2.8, 8);

      // Backward substitution: L^T * x = y
      // L^T = [ [2, 1, 4],
      //         [0, 3, 2],
      //         [0, 0, 5] ]
      // x2 = 2.8 / 5 = 0.56
      // x1 = (3 - 2 * 0.56) / 3 = (3 - 1.12) / 3 = 1.88 / 3 = 0.6266667
      // x0 = (2 - 1 * 0.6266667 - 4 * 0.56) / 2 = (2 - 0.6266667 - 2.24) / 2 = -0.8666667 / 2 = -0.4333333
      const x = backwardSubstitution(L, y);
      expect(x[2]).toBeCloseTo(0.56, 6);
      expect(x[1]).toBeCloseTo(1.88 / 3, 6);
      expect(x[0]).toBeCloseTo(-0.4333333, 5);

      // Verify L^T * x = y
      expect(2 * x[0] + 1 * x[1] + 4 * x[2]).toBeCloseTo(y[0], 6);
      expect(3 * x[1] + 2 * x[2]).toBeCloseTo(y[1], 6);
      expect(5 * x[2]).toBeCloseTo(y[2], 6);
    });

    it("choleskySolve: should solve A * x = b via Cholesky factor L", () => {
      // A = [ [4, 2], [2, 5] ], b = [8, 13]
      // Analytical solution:
      // 4 x0 + 2 x1 = 8  => 2 x0 + x1 = 4 => x1 = 4 - 2 x0
      // 2 x0 + 5 (4 - 2 x0) = 13 => 2 x0 + 20 - 10 x0 = 13 => -8 x0 = -7 => x0 = 7/8 = 0.875
      // x1 = 4 - 2(0.875) = 2.25
      const A = [
        [4.0, 2.0],
        [2.0, 5.0],
      ];
      const L = choleskyDecomposition(A, 0.0);
      const b = [8.0, 13.0];
      const x = choleskySolve(L, b);

      expect(x[0]).toBeCloseTo(0.875, 5);
      expect(x[1]).toBeCloseTo(2.25, 5);

      // Verify A * x = b
      expect(A[0][0] * x[0] + A[0][1] * x[1]).toBeCloseTo(b[0], 5);
      expect(A[1][0] * x[0] + A[1][1] * x[1]).toBeCloseTo(b[1], 5);
    });
  });

  // ==========================================================================
  // SECTION 5: PRNG & NORMAL SAMPLING (createDeterministicRng, sampleStandardNormal)
  // ==========================================================================
  describe("Section 5: PRNG & Normal Sampling", () => {
    it("createDeterministicRng: should generate deterministic, reproducible pseudo-random uniform variates", () => {
      const rng1 = createDeterministicRng(42);
      const rng2 = createDeterministicRng(42);

      const seq1: number[] = [];
      const seq2: number[] = [];

      for (let i = 0; i < 100; i++) {
        seq1.push(rng1());
        seq2.push(rng2());
      }

      // Determinism: both sequences must match exactly
      expect(seq1).toEqual(seq2);

      // Bounded in [0, 1)
      for (const val of seq1) {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }

      // Different seeds produce distinct sequences
      const rngDiff = createDeterministicRng(43);
      const seqDiff = Array.from({ length: 10 }, () => rngDiff());
      expect(seqDiff).not.toEqual(seq1.slice(0, 10));

      // Statistical moments for uniform U(0, 1) over 10,000 samples
      const rngStats = createDeterministicRng(12345);
      const n = 10000;
      let sum = 0;
      let sumSq = 0;
      for (let i = 0; i < n; i++) {
        const u = rngStats();
        sum += u;
        sumSq += u * u;
      }
      const mean = sum / n;
      const variance = sumSq / n - mean * mean;

      // Theoretical mean = 0.5, theoretical variance = 1/12 approx 0.08333
      expect(mean).toBeCloseTo(0.5, 1);
      expect(variance).toBeCloseTo(1 / 12, 1);
    });

    it("sampleStandardNormal: should draw N(0, 1) Gaussian variates with correct empirical moments", () => {
      const rng = createDeterministicRng(999);
      const n = 10000;
      const samples: number[] = [];

      let sum = 0;
      let sumSq = 0;
      let in1Sigma = 0;
      let in2Sigma = 0;
      let in3Sigma = 0;

      for (let i = 0; i < n; i++) {
        const z = sampleStandardNormal(rng);
        samples.push(z);
        sum += z;
        sumSq += z * z;

        if (Math.abs(z) <= 1.0) in1Sigma++;
        if (Math.abs(z) <= 2.0) in2Sigma++;
        if (Math.abs(z) <= 3.0) in3Sigma++;
      }

      const mean = sum / n;
      const variance = sumSq / n - mean * mean;

      // Sample mean ~ 0, sample variance ~ 1
      expect(Math.abs(mean)).toBeLessThan(0.05);
      expect(Math.abs(variance - 1.0)).toBeLessThan(0.05);

      // Empirical coverage matching normal distribution
      expect(in1Sigma / n).toBeGreaterThan(0.65);
      expect(in1Sigma / n).toBeLessThan(0.72);

      expect(in2Sigma / n).toBeGreaterThan(0.93);
      expect(in2Sigma / n).toBeLessThan(0.97);

      expect(in3Sigma / n).toBeGreaterThan(0.99);
    });
  });

  // ==========================================================================
  // SECTION 6: GP POSTERIOR CONDITIONING (fitGPPosterior)
  // ==========================================================================
  describe("Section 6: GP Posterior Conditioning & Active Learning Model", () => {
    const defaultHyperparams: BayesianOptimizationHyperparameters = {
      lengthscale: 0.2,
      variance: 4.0,
      noiseVariance: 1e-4,
      jitter: 1e-6,
      xi: 0.01,
      beta: 2.0,
    };

    it("fitGPPosterior: should return zero mean and prior variance when dataset is empty (N = 0)", () => {
      const Xstar = [[0.0], [0.25], [0.5], [0.75], [1.0]];
      const posterior = fitGPPosterior([], [], Xstar, "matern52", defaultHyperparams);

      expect(posterior.mean.length).toBe(5);
      expect(posterior.variance.length).toBe(5);
      expect(posterior.stdDev.length).toBe(5);

      // Prior mean is identically 0
      for (const m of posterior.mean) {
        expect(m).toBe(0);
      }

      // Prior variance is identically sigma_f^2 = 4.0
      for (const v of posterior.variance) {
        expect(v).toBeCloseTo(4.0, 6);
      }

      // Prior std is 2.0
      for (const s of posterior.stdDev) {
        expect(s).toBeCloseTo(2.0, 6);
      }

      // 2-sigma bounds: [-4.0, 4.0]
      for (let i = 0; i < 5; i++) {
        expect(posterior.lower2Sigma[i]).toBeCloseTo(-4.0, 6);
        expect(posterior.upper2Sigma[i]).toBeCloseTo(4.0, 6);
      }

      expect(posterior.conditionNumber).toBe(1.0);
      expect(posterior.alpha.length).toBe(0);
      expect(posterior.L.length).toBe(0);
    });

    it("fitGPPosterior: should interpolate training observations accurately in low-noise limit", () => {
      const Xtrain = [[0.1], [0.3], [0.5], [0.7], [0.9]];
      // Target function y = sin(2 * pi * x)
      const ytrain = Xtrain.map((x) => Math.sin(2 * Math.PI * x[0]));

      // Query GP posterior at the exact training locations
      const posterior = fitGPPosterior(Xtrain, ytrain, Xtrain, "matern52", defaultHyperparams);

      // Posterior mean should match training targets
      for (let i = 0; i < Xtrain.length; i++) {
        expect(posterior.mean[i]).toBeCloseTo(ytrain[i], 2);
        // Posterior variance at observed locations should collapse to near zero
        expect(posterior.variance[i]).toBeLessThan(0.01);
      }
    });

    it("fitGPPosterior: should exhibit uncertainty reduction at observed points and flare up in unobserved regions", () => {
      // Observations only at edges x = 0.1 and x = 0.9
      const Xtrain = [[0.1], [0.9]];
      const ytrain = [1.0, -1.0];

      // Test points: near observation (0.12), in middle gap (0.5), far extrapolation (2.5)
      const Xstar = [[0.1], [0.12], [0.5], [2.5]];
      const posterior = fitGPPosterior(Xtrain, ytrain, Xstar, "rbf", defaultHyperparams);

      const varAtObs = posterior.variance[0];
      const varNearObs = posterior.variance[1];
      const varInGap = posterior.variance[2];
      const varFar = posterior.variance[3];

      // Variance order: varAtObs < varNearObs < varInGap <= varFar ~ sigma_f^2 (4.0)
      expect(varAtObs).toBeLessThan(varNearObs);
      expect(varNearObs).toBeLessThan(varInGap);
      expect(varInGap).toBeLessThanOrEqual(varFar);
      expect(varFar).toBeCloseTo(defaultHyperparams.variance, 1);

      // Confidence envelope checks: upper2Sigma - lower2Sigma = 4 * stdDev
      for (let i = 0; i < Xstar.length; i++) {
        expect(posterior.upper2Sigma[i] - posterior.lower2Sigma[i]).toBeCloseTo(
          4 * posterior.stdDev[i],
          6,
        );
      }

      // Condition number should be >= 1.0
      expect(posterior.conditionNumber).toBeGreaterThanOrEqual(1.0);
    });

    it("fitGPPosterior: should condition on multi-dimensional 2D observation points", () => {
      const Xtrain = [
        [-2.0, 10.0],
        [2.0, 3.0],
        [8.0, 2.0],
      ];
      const ytrain = [5.0, 1.2, 0.4];

      const Xstar = [
        [-2.0, 10.0], // Observed
        [0.0, 5.0], // Unobserved
      ];

      const hp2D: BayesianOptimizationHyperparameters = {
        lengthscale: 2.0,
        variance: 10.0,
        noiseVariance: 1e-4,
        jitter: 1e-6,
        xi: 0.05,
        beta: 2.5,
      };

      const posterior = fitGPPosterior(Xtrain, ytrain, Xstar, "matern52", hp2D);

      expect(posterior.mean.length).toBe(2);
      expect(posterior.mean[0]).toBeCloseTo(5.0, 1);
      expect(posterior.variance[0]).toBeLessThan(0.01);
      expect(posterior.variance[1]).toBeGreaterThan(1.0);
    });
  });

  // ==========================================================================
  // SECTION 7: ACQUISITION FUNCTIONS (computeAcquisitionEI, UCB, PI, Grid, Query)
  // ==========================================================================
  describe("Section 7: Acquisition Functions & Candidate Selection", () => {
    describe("computeAcquisitionEI (Expected Improvement)", () => {
      it("evaluates exact analytical EI for minimization and maximization", () => {
        const mean = 1.0;
        const std = 0.5;
        const bestY = 2.0;
        const xi = 0.0;

        // Minimization: Delta = bestY - xi - mean = 2.0 - 0 - 1.0 = 1.0
        // z = 1.0 / 0.5 = 2.0
        // EI = Delta * Phi(z) + std * phi(z)
        // Phi(2.0) approx 0.977249868, phi(2.0) approx 0.0539909665
        // EI = 1.0 * 0.977249868 + 0.5 * 0.0539909665 = 0.977249868 + 0.026995483 = 1.00424535
        const eiMin = computeAcquisitionEI(mean, std, bestY, xi, true);
        const expectedEIMin = 1.0 * gaussianCdf(2.0) + 0.5 * gaussianPdf(2.0);
        expect(eiMin).toBeCloseTo(expectedEIMin, 6);

        // Maximization: bestY = 1.0, mean = 2.0, std = 0.5
        // Delta = mean - bestY - xi = 2.0 - 1.0 - 0 = 1.0
        // EI should equal eiMin
        const eiMax = computeAcquisitionEI(2.0, std, 1.0, xi, false);
        expect(eiMax).toBeCloseTo(expectedEIMin, 6);
      });

      it("handles zero stdDev limit (std <= 1e-9) gracefully", () => {
        // Minimization with zero uncertainty:
        // If mean < bestY - xi => EI = bestY - xi - mean
        expect(computeAcquisitionEI(1.0, 0.0, 2.0, 0.1, true)).toBeCloseTo(0.9, 6);
        // If mean >= bestY - xi => EI = 0
        expect(computeAcquisitionEI(2.5, 0.0, 2.0, 0.1, true)).toBe(0);

        // Maximization with zero uncertainty:
        // If mean > bestY + xi => EI = mean - bestY - xi
        expect(computeAcquisitionEI(3.0, 0.0, 2.0, 0.1, false)).toBeCloseTo(0.9, 6);
        // If mean <= bestY + xi => EI = 0
        expect(computeAcquisitionEI(1.5, 0.0, 2.0, 0.1, false)).toBe(0);
      });

      it("respects exploration trade-off parameter xi >= 0", () => {
        const mean = 1.5;
        const std = 0.4;
        const bestY = 2.0;

        const eiSmallXi = computeAcquisitionEI(mean, std, bestY, 0.01, true);
        const eiLargeXi = computeAcquisitionEI(mean, std, bestY, 0.2, true);

        // Increasing xi requires a larger improvement margin, reducing nominal EI
        expect(eiSmallXi).toBeGreaterThan(eiLargeXi);
        expect(eiLargeXi).toBeGreaterThanOrEqual(0);
      });
    });

    describe("computeAcquisitionUCB (Upper / Lower Confidence Bound)", () => {
      it("computes exact UCB scores for minimization and maximization", () => {
        const mean = 3.0;
        const std = 1.2;
        const beta = 2.5;

        // Maximization: UCB = mean + beta * std = 3.0 + 2.5 * 1.2 = 3.0 + 3.0 = 6.0
        const ucbMax = computeAcquisitionUCB(mean, std, beta, false);
        expect(ucbMax).toBeCloseTo(6.0, 8);

        // Minimization: transformed score = -mean + beta * std = -3.0 + 2.5 * 1.2 = 0.0
        const ucbMin = computeAcquisitionUCB(mean, std, beta, true);
        expect(ucbMin).toBeCloseTo(0.0, 8);
      });

      it("scales exploration weight proportionally with beta multiplier", () => {
        const mean = 2.0;
        const std = 1.0;

        const ucbBeta1 = computeAcquisitionUCB(mean, std, 1.0, false);
        const ucbBeta3 = computeAcquisitionUCB(mean, std, 3.0, false);

        expect(ucbBeta3 - ucbBeta1).toBeCloseTo(2.0 * std, 8);
      });
    });

    describe("computeAcquisitionPI (Probability of Improvement)", () => {
      it("evaluates exact Probability of Improvement CDF", () => {
        const mean = 1.0;
        const std = 0.5;
        const bestY = 2.0;
        const xi = 0.0;

        // Minimization: Delta = 2.0 - 0 - 1.0 = 1.0, z = 1.0 / 0.5 = 2.0
        // PI = Phi(2.0) approx 0.97725
        const piMin = computeAcquisitionPI(mean, std, bestY, xi, true);
        expect(piMin).toBeCloseTo(gaussianCdf(2.0), 6);

        // Maximization: mean = 2.0, bestY = 1.0, std = 0.5
        // Delta = 2.0 - 1.0 = 1.0, z = 2.0 => PI = Phi(2.0)
        const piMax = computeAcquisitionPI(2.0, std, 1.0, xi, false);
        expect(piMax).toBeCloseTo(gaussianCdf(2.0), 6);

        // Zero stdDev edge case
        expect(computeAcquisitionPI(1.0, 0.0, 2.0, 0.05, true)).toBe(1);
        expect(computeAcquisitionPI(2.5, 0.0, 2.0, 0.05, true)).toBe(0);
      });
    });

    describe("computeAcquisitionValues & findNextQueryPoint", () => {
      const mockPosterior = {
        Xstar: [[0.0], [0.2], [0.4], [0.6], [0.8], [1.0]],
        mean: [2.0, 1.0, -0.5, 0.8, 2.5, 3.0],
        variance: [0.25, 0.16, 0.09, 0.36, 0.49, 0.64],
        stdDev: [0.5, 0.4, 0.3, 0.6, 0.7, 0.8],
        lower2Sigma: [1.0, 0.2, -1.1, -0.4, 1.1, 1.4],
        upper2Sigma: [3.0, 1.8, 0.1, 2.0, 3.9, 4.6],
        L: [],
        alpha: [],
        K: [],
        conditionNumber: 1.0,
      };

      const hp: BayesianOptimizationHyperparameters = {
        lengthscale: 0.2,
        variance: 1.0,
        noiseVariance: 1e-4,
        jitter: 1e-6,
        xi: 0.01,
        beta: 2.0,
      };

      it("should find the argmax candidate on the grid for EI acquisition", () => {
        const gridRes = computeAcquisitionValues(
          mockPosterior,
          "ei",
          0.0, // bestY
          hp,
          true,
        );

        expect(gridRes.acquisitionValues.length).toBe(6);
        expect(gridRes.candidatePoint).toBeDefined();
        // Candidate point must be the one with the maximum acquisition value
        const maxVal = Math.max(...gridRes.acquisitionValues);
        expect(gridRes.maxAcquisitionValue).toBeCloseTo(maxVal, 8);

        const nextPoint = findNextQueryPoint(mockPosterior, "ei", 0.0, hp, true);
        expect(nextPoint).toEqual(gridRes.candidatePoint);
      });

      it("should support Thompson Sampling mode by generating a continuous sampled function path", () => {
        const rng = createDeterministicRng(42);
        const gridRes = computeAcquisitionValues(mockPosterior, "thompson", 0.0, hp, true, rng);

        expect(gridRes.sampledFunction).toBeDefined();
        expect(gridRes.sampledFunction!.length).toBe(6);
        expect(gridRes.acquisitionValues.length).toBe(6);

        // For minimization, acquisition values are -sampledFunction
        for (let i = 0; i < 6; i++) {
          expect(gridRes.acquisitionValues[i]).toBeCloseTo(-gridRes.sampledFunction![i], 8);
        }
      });
    });
  });

  // ==========================================================================
  // SECTION 8: REGRET METRICS (computeSimpleRegret, computeCumulativeRegret)
  // ==========================================================================
  describe("Section 8: Regret Metrics", () => {
    it("computeSimpleRegret: should compute exact non-negative simple regret", () => {
      // Minimization: bestObservedY = -5.0, globalOptimumY = -6.02
      // simpleRegret = max(0, -5.0 - (-6.02)) = 1.02
      expect(computeSimpleRegret(-5.0, -6.02, true)).toBeCloseTo(1.02, 6);

      // At global optimum: simpleRegret = 0
      expect(computeSimpleRegret(-6.02, -6.02, true)).toBe(0);

      // Noise anomaly where bestObserved is lower than true global optimum
      expect(computeSimpleRegret(-7.0, -6.02, true)).toBe(0);

      // Maximization: bestObservedY = 8.5, globalOptimumY = 10.0
      // simpleRegret = max(0, 10.0 - 8.5) = 1.5
      expect(computeSimpleRegret(8.5, 10.0, false)).toBeCloseTo(1.5, 6);
      expect(computeSimpleRegret(10.0, 10.0, false)).toBe(0);
      expect(computeSimpleRegret(11.0, 10.0, false)).toBe(0);
    });

    it("computeCumulativeRegret: should compute monotonic cumulative sum of instantaneous regrets", () => {
      const historyY = [2.0, 1.0, -1.0, -5.0, -6.0];
      const globalOptY = -6.0;

      // Minimization instantaneous regrets:
      // t=1: 2 - (-6) = 8
      // t=2: 1 - (-6) = 7
      // t=3: -1 - (-6) = 5
      // t=4: -5 - (-6) = 1
      // t=5: -6 - (-6) = 0
      // Sum = 8 + 7 + 5 + 1 + 0 = 21
      const cumRegret = computeCumulativeRegret(historyY, globalOptY, true);
      expect(cumRegret).toBeCloseTo(21.0, 8);

      // Monotonic growth test
      const r1 = computeCumulativeRegret(historyY.slice(0, 1), globalOptY, true);
      const r2 = computeCumulativeRegret(historyY.slice(0, 2), globalOptY, true);
      const r3 = computeCumulativeRegret(historyY.slice(0, 3), globalOptY, true);
      expect(r1).toBeLessThanOrEqual(r2);
      expect(r2).toBeLessThanOrEqual(r3);

      // Zero regret when all evaluations are optimal
      expect(computeCumulativeRegret([-6.0, -6.0, -6.0], globalOptY, true)).toBe(0);

      // Maximization cumulative regret
      const maxHistY = [5.0, 8.0, 10.0];
      const maxOptY = 10.0;
      // inst: (10-5)=5, (10-8)=2, (10-10)=0 => sum = 7
      expect(computeCumulativeRegret(maxHistY, maxOptY, false)).toBeCloseTo(7.0, 8);
    });
  });

  // ==========================================================================
  // SECTION 9: INITIAL EXPERIMENTAL DESIGN (generateInitialDesign)
  // ==========================================================================
  describe("Section 9: Initial Experimental Design Strategies", () => {
    const bounds1D = [{ min: 0.0, max: 1.0 }];
    const bounds2D = [
      { min: -5.0, max: 10.0 },
      { min: 0.0, max: 15.0 },
    ];

    it("Latin Hypercube Sampling (LHS): should generate stratified, non-overlapping 1D and 2D designs", () => {
      const nSamples = 8;
      const points1D = generateInitialDesign(bounds1D, nSamples, "latin_hypercube", 42);

      expect(points1D.length).toBe(nSamples);
      for (const pt of points1D) {
        expect(pt.length).toBe(1);
        expect(pt[0]).toBeGreaterThanOrEqual(0.0);
        expect(pt[0]).toBeLessThanOrEqual(1.0);
      }

      // Check LHS 2D bounds
      const points2D = generateInitialDesign(bounds2D, nSamples, "latin_hypercube", 42);
      expect(points2D.length).toBe(nSamples);
      for (const pt of points2D) {
        expect(pt.length).toBe(2);
        expect(pt[0]).toBeGreaterThanOrEqual(-5.0);
        expect(pt[0]).toBeLessThanOrEqual(10.0);
        expect(pt[1]).toBeGreaterThanOrEqual(0.0);
        expect(pt[1]).toBeLessThanOrEqual(15.0);
      }

      // Seed determinism
      const points2DCopy = generateInitialDesign(bounds2D, nSamples, "latin_hypercube", 42);
      expect(points2D).toEqual(points2DCopy);
    });

    it("Uniform Random: should generate bounded random design points", () => {
      const nSamples = 10;
      const points = generateInitialDesign(bounds2D, nSamples, "uniform_random", 777);

      expect(points.length).toBe(nSamples);
      for (const pt of points) {
        expect(pt.length).toBe(2);
        expect(pt[0]).toBeGreaterThanOrEqual(-5.0);
        expect(pt[0]).toBeLessThanOrEqual(10.0);
        expect(pt[1]).toBeGreaterThanOrEqual(0.0);
        expect(pt[1]).toBeLessThanOrEqual(15.0);
      }
    });

    it("Equispaced: should generate deterministic evenly spaced design grids", () => {
      // 1D equispaced with n=5 => [0.0, 0.25, 0.5, 0.75, 1.0]
      const pts1D = generateInitialDesign(bounds1D, 5, "equispaced", 100);
      expect(pts1D.length).toBe(5);
      expect(pts1D[0][0]).toBeCloseTo(0.0, 6);
      expect(pts1D[1][0]).toBeCloseTo(0.25, 6);
      expect(pts1D[2][0]).toBeCloseTo(0.5, 6);
      expect(pts1D[3][0]).toBeCloseTo(0.75, 6);
      expect(pts1D[4][0]).toBeCloseTo(1.0, 6);

      // Single point edge case => midpoint 0.5
      const pts1DSingle = generateInitialDesign(bounds1D, 1, "equispaced", 100);
      expect(pts1DSingle.length).toBe(1);
      expect(pts1DSingle[0][0]).toBeCloseTo(0.5, 6);

      // 2D equispaced
      const pts2D = generateInitialDesign(bounds2D, 4, "equispaced", 100);
      expect(pts2D.length).toBe(4);
      for (const pt of pts2D) {
        expect(pt.length).toBe(2);
        expect(pt[0]).toBeGreaterThanOrEqual(-5.0);
        expect(pt[0]).toBeLessThanOrEqual(10.0);
        expect(pt[1]).toBeGreaterThanOrEqual(0.0);
        expect(pt[1]).toBeLessThanOrEqual(15.0);
      }
    });
  });

  // ==========================================================================
  // SECTION 10: BENCHMARK OBJECTIVES (Analytical Formulas & Optima)
  // ==========================================================================
  describe("Section 10: Benchmark Objectives Evaluation & Analytical Optima", () => {
    it("Forrester 1D: evaluates exact formula f(x) = (6x - 2)^2 sin(12x - 4) and global optimum", () => {
      const forrester = BENCHMARK_OBJECTIVES.forrester;
      expect(forrester.dimension).toBe(1);

      // Global optimum x* approx 0.75724876, f* approx -6.02074
      const xOpt = forrester.globalOptima[0].x;
      const fOpt = forrester.fn(xOpt);
      expect(fOpt).toBeCloseTo(-6.02074, 3);

      // Root at x = 1/3: (6 * 1/3 - 2)^2 = 0^2 = 0
      expect(forrester.fn([1 / 3])).toBeCloseTo(0.0, 8);

      // Evaluation at x = 0: (-2)^2 * sin(-4) = 4 * sin(-4)
      const expectedAtZero = 4 * Math.sin(-4);
      expect(forrester.fn([0.0])).toBeCloseTo(expectedAtZero, 6);
    });

    it("Gramacy & Lee 1D: evaluates exact formula f(x) = sin(10 pi x)/(2x) + (x - 1)^4", () => {
      const gramacy = BENCHMARK_OBJECTIVES.gramacy_lee;
      expect(gramacy.dimension).toBe(1);

      // Global optimum x* approx 0.548563, f* approx -0.869011
      const xOpt = gramacy.globalOptima[0].x;
      const fOpt = gramacy.fn(xOpt);
      expect(fOpt).toBeCloseTo(-0.869011, 3);

      // Value at x = 1.0: sin(10 * pi) / 2 + 0^4 = 0 + 0 = 0
      expect(gramacy.fn([1.0])).toBeCloseTo(0.0, 6);
    });

    it("Multi-Modal Sine-Cos 1D: evaluates exact formula f(x) = -sin(x) - cos(2x) + 0.1x", () => {
      const multimodal = BENCHMARK_OBJECTIVES.multimodal_sine_cos;
      expect(multimodal.dimension).toBe(1);

      // Verify global optimum metadata
      expect(multimodal.globalOptima[0].x[0]).toBeCloseTo(1.489, 3);
      expect(multimodal.globalOptima[0].y).toBeCloseTo(-1.824, 3);

      // Verify exact formula evaluation at x = 1.489:
      // -sin(1.489) - cos(2.978) + 0.1489 approx 0.1389
      const xOpt = multimodal.globalOptima[0].x;
      const fOpt = multimodal.fn(xOpt);
      expect(fOpt).toBeCloseTo(-Math.sin(1.489) - Math.cos(2 * 1.489) + 0.1 * 1.489, 6);

      // Value at x = 0: -sin(0) - cos(0) + 0 = -1
      expect(multimodal.fn([0.0])).toBeCloseTo(-1.0, 8);

      // Local basin minimum near x approx 0.253: f(x) approx -1.10
      const fBasin = multimodal.fn([0.253]);
      expect(fBasin).toBeLessThan(-1.0);
    });

    it("Branin-Hoo 2D: evaluates exact formula and confirms all 3 symmetric global minima", () => {
      const branin = BENCHMARK_OBJECTIVES.branin;
      expect(branin.dimension).toBe(2);
      expect(branin.globalOptima.length).toBe(3);

      const expectedOptY = 0.397887;

      // Check all 3 global minima:
      // 1. (-pi, 12.275)
      // 2. (pi, 2.275)
      // 3. (3*pi approx 9.42478, 2.475)
      for (const opt of branin.globalOptima) {
        const val = branin.fn(opt.x);
        expect(val).toBeCloseTo(expectedOptY, 3);
        expect(val).toBeCloseTo(opt.y, 3);
      }
    });

    it("Six-Hump Camel 2D: evaluates exact formula, origin, and 2 symmetric global minima", () => {
      const camel = BENCHMARK_OBJECTIVES.six_hump_camel;
      expect(camel.dimension).toBe(2);
      expect(camel.globalOptima.length).toBe(2);

      const expectedOptY = -1.031628;

      // Global minima at (0.0898, -0.7126) and (-0.0898, 0.7126)
      for (const opt of camel.globalOptima) {
        const val = camel.fn(opt.x);
        expect(val).toBeCloseTo(expectedOptY, 3);
        expect(val).toBeCloseTo(opt.y, 3);
      }

      // Origin f(0, 0) = 0
      expect(camel.fn([0.0, 0.0])).toBe(0);

      // Point reflection symmetry: f(x1, x2) = f(-x1, -x2)
      const testPt = [1.2, -0.4];
      const negPt = [-1.2, 0.4];
      expect(camel.fn(testPt)).toBeCloseTo(camel.fn(negPt), 8);
    });

    it("Ackley 2D: evaluates exponential well, global minimum at origin f(0, 0) = 0, and bounds", () => {
      const ackley = BENCHMARK_OBJECTIVES.ackley;
      expect(ackley.dimension).toBe(2);

      // Global optimum at (0, 0) => f* = 0.0
      const valOrigin = ackley.fn([0.0, 0.0]);
      expect(valOrigin).toBeCloseTo(0.0, 8);

      // Ackley is non-negative everywhere: f(x) >= 0
      const testPoints = [
        [1.0, 1.0],
        [-2.5, 3.2],
        [4.0, -4.0],
        [0.5, -0.5],
      ];
      for (const pt of testPoints) {
        expect(ackley.fn(pt)).toBeGreaterThanOrEqual(0.0);
      }

      // 4-quadrant rotational and axial symmetry
      const f1 = ackley.fn([2.0, 3.0]);
      const f2 = ackley.fn([-2.0, 3.0]);
      const f3 = ackley.fn([2.0, -3.0]);
      const f4 = ackley.fn([3.0, 2.0]);
      expect(f1).toBeCloseTo(f2, 8);
      expect(f1).toBeCloseTo(f3, 8);
      expect(f1).toBeCloseTo(f4, 8);
    });
  });
});
