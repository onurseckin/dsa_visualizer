import { describe, expect, it } from "bun:test";
import React from "react";
import {
  GaussianProcessesKernelStudio,
  evaluateKernel,
  evaluateKernelComposed,
  computeGramMatrix,
  choleskyDecomposition,
  forwardSubstitution,
  backwardSubstitution,
  choleskySolve,
  createDeterministicRng,
  sampleStandardNormal,
  sampleMultivariateNormal,
  computeMarginalLogLikelihood,
  computeRKHSNorm,
  computeGramEigenvalues,
  fitGPRegression,
  GP_PRESETS,
  DEFAULT_GP_HYPERPARAMS,
  KERNEL_DEFINITIONS,
  type KernelType,
  type KernelCompositionMode,
  type KernelHyperparameters,
  type ComposedKernelConfig,
  type GPPresetId,
} from "../../components/primitives/GaussianProcessesKernelStudio";

describe("GaussianProcessesKernelStudio & Exact Bayesian GP Engine Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PRESET CONFIGURATIONS
  // ==========================================================================
  describe("1. Component Instantiation & Preset Configurations", () => {
    it("should instantiate GaussianProcessesKernelStudio with default props", () => {
      const element = React.createElement(GaussianProcessesKernelStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(GaussianProcessesKernelStudio);
    });

    it("should instantiate GaussianProcessesKernelStudio with custom props and callbacks", () => {
      const onHyperparamsChange = () => {};
      const onObservationsChange = () => {};

      const element = React.createElement(GaussianProcessesKernelStudio, {
        initialPreset: "periodic_seasonality",
        width: 1000,
        height: 700,
        standalone: true,
        title: "Mauna Loa CO2 Periodic Studio",
        onHyperparamsChange,
        onObservationsChange,
      });

      expect(element.props.initialPreset).toBe("periodic_seasonality");
      expect(element.props.width).toBe(1000);
      expect(element.props.height).toBe(700);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Mauna Loa CO2 Periodic Studio");
    });

    it("should provide valid configuration objects for all defined presets", () => {
      const presetIds: GPPresetId[] = [
        "step_function",
        "periodic_seasonality",
        "noisy_sine",
        "gap_uncertainty_flare",
        "linear_outliers",
        "freeform_empty",
      ];

      for (const id of presetIds) {
        const p = GP_PRESETS[id];
        expect(p).toBeDefined();
        expect(p.id).toBe(id);
        expect(p.name).toBeDefined();
        expect(p.category).toBeDefined();
        expect(p.description).toBeDefined();
        expect(p.kernelMode).toBeDefined();
        expect(p.kernel1).toBeDefined();
        expect(p.kernel2).toBeDefined();
        expect(p.params1).toBeDefined();
        expect(p.params2).toBeDefined();
        expect(p.noiseVariance).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(p.points)).toBe(true);
      }
    });

    it("should verify metadata definitions for all 6 Mercer kernels", () => {
      const kernelTypes: KernelType[] = [
        "rbf",
        "matern32",
        "matern52",
        "periodic",
        "rational_quadratic",
        "linear",
      ];

      for (const kType of kernelTypes) {
        const meta = KERNEL_DEFINITIONS[kType];
        expect(meta).toBeDefined();
        expect(meta.id).toBe(kType);
        expect(meta.name.length).toBeGreaterThan(0);
        expect(meta.shortFormula.length).toBeGreaterThan(0);
        expect(meta.fullFormulaTeX.length).toBeGreaterThan(0);
        expect(meta.description.length).toBeGreaterThan(0);
        expect(meta.smoothness.length).toBeGreaterThan(0);
        expect(meta.bestFor.length).toBeGreaterThan(0);
        expect(meta.params.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 2. ANALYTICAL ACCURACY OF 6 MERCER KERNEL FUNCTIONS
  // ==========================================================================
  describe("2. Analytical Accuracy of 6 Mercer Kernel Functions", () => {
    const baseParams: KernelHyperparameters = {
      lengthscale: 2.0,
      variance: 3.0,
      period: 4.0,
      alpha: 1.5,
      offset: 1.0,
      sigma0: 0.5,
      noiseVariance: 0.01,
      jitter: 1e-6,
    };

    it("Squared Exponential (RBF): evaluates exact Gaussian decay", () => {
      // k(x, x) = sigma_f^2 = 3.0
      const kSelf = evaluateKernel("rbf", 1.5, 1.5, baseParams);
      expect(kSelf).toBeCloseTo(3.0, 6);

      // Distance r = 2.0 (equals lengthscale ell = 2.0)
      // k(x, x') = 3.0 * exp(-2^2 / (2 * 2^2)) = 3.0 * exp(-0.5) = 1.81959
      const kDist = evaluateKernel("rbf", 1.0, 3.0, baseParams);
      expect(kDist).toBeCloseTo(3.0 * Math.exp(-0.5), 6);

      // As distance increases, covariance decays monotonically towards 0
      const kFar = evaluateKernel("rbf", 1.0, 10.0, baseParams);
      expect(kFar).toBeLessThan(kDist);
      expect(kFar).toBeGreaterThanOrEqual(0);
    });

    it("Matérn 3/2: evaluates exact (1 + √3 r / ℓ) exp(-√3 r / ℓ)", () => {
      const kSelf = evaluateKernel("matern32", 2.0, 2.0, baseParams);
      expect(kSelf).toBeCloseTo(3.0, 6);

      // Distance r = 2.0, ell = 2.0 => sqrt(3)*r/ell = sqrt(3)
      const expected = 3.0 * (1 + Math.sqrt(3)) * Math.exp(-Math.sqrt(3));
      const kDist = evaluateKernel("matern32", 1.0, 3.0, baseParams);
      expect(kDist).toBeCloseTo(expected, 6);
    });

    it("Matérn 5/2: evaluates exact (1 + √5 r / ℓ + 5r² / 3ℓ²) exp(-√5 r / ℓ)", () => {
      const kSelf = evaluateKernel("matern52", 0.0, 0.0, baseParams);
      expect(kSelf).toBeCloseTo(3.0, 6);

      // Distance r = 2.0, ell = 2.0 => sqrt(5)*r/ell = sqrt(5), term2 = 5/3
      const expected = 3.0 * (1 + Math.sqrt(5) + 5 / 3) * Math.exp(-Math.sqrt(5));
      const kDist = evaluateKernel("matern52", 0.0, 2.0, baseParams);
      expect(kDist).toBeCloseTo(expected, 6);
    });

    it("Periodic (Exp-Sine-Squared): evaluates exact periodic repetition", () => {
      const kSelf = evaluateKernel("periodic", 0.0, 0.0, baseParams);
      expect(kSelf).toBeCloseTo(3.0, 6);

      // Exactly 1 period apart (period = 4.0): k(0, 4) should equal k(0, 0)
      const kOnePeriod = evaluateKernel("periodic", 0.0, 4.0, baseParams);
      expect(kOnePeriod).toBeCloseTo(3.0, 6);

      // Multiple periods: k(1.2, 1.2 + 8.0) == k(1.2, 1.2)
      const kTwoPeriods = evaluateKernel("periodic", 1.2, 9.2, baseParams);
      expect(kTwoPeriods).toBeCloseTo(3.0, 6);

      // Half period: r = 2.0, sin(pi*2/4) = sin(pi/2) = 1
      // k = 3.0 * exp(-2 * 1^2 / 2^2) = 3.0 * exp(-0.5)
      const kHalfPeriod = evaluateKernel("periodic", 0.0, 2.0, baseParams);
      expect(kHalfPeriod).toBeCloseTo(3.0 * Math.exp(-0.5), 6);
    });

    it("Rational Quadratic: evaluates exact scale mixture & converges to RBF as α → ∞", () => {
      const kSelf = evaluateKernel("rational_quadratic", 1.0, 1.0, baseParams);
      expect(kSelf).toBeCloseTo(3.0, 6);

      // Standard RQ evaluation with alpha = 1.5
      // d = (1 - 3)^2 = 4, 2 * alpha * ell^2 = 2 * 1.5 * 4 = 12
      // base = 1 + 4/12 = 1 + 1/3 = 4/3
      // k = 3.0 * (4/3)^(-1.5)
      const expectedRQ = 3.0 * Math.pow(4 / 3, -1.5);
      const kRQ = evaluateKernel("rational_quadratic", 1.0, 3.0, baseParams);
      expect(kRQ).toBeCloseTo(expectedRQ, 6);

      // As alpha -> infinity, RQ converges to RBF
      const largeAlphaParams = { ...baseParams, alpha: 50000 };
      const kRQapprox = evaluateKernel("rational_quadratic", 1.0, 3.0, largeAlphaParams);
      const kRBF = evaluateKernel("rbf", 1.0, 3.0, baseParams);
      expect(kRQapprox).toBeCloseTo(kRBF, 3);
    });

    it("Linear / Non-Stationary: evaluates σ_0² + σ_f² (x - c)(x' - c)", () => {
      // sigma0 = 0.5, variance sf2 = 3.0, offset c = 1.0
      // k(1.0, 1.0) = 0.5 + 3.0 * 0 * 0 = 0.5
      const kCenter = evaluateKernel("linear", 1.0, 1.0, baseParams);
      expect(kCenter).toBeCloseTo(0.5, 6);

      // x1 = 3.0 (dx1 = 2.0), x2 = 2.0 (dx2 = 1.0)
      // k(3, 2) = 0.5 + 3.0 * (2.0 * 1.0) = 0.5 + 6.0 = 6.5
      const kLin = evaluateKernel("linear", 3.0, 2.0, baseParams);
      expect(kLin).toBeCloseTo(6.5, 6);
    });
  });

  // ==========================================================================
  // 3. MULTI-KERNEL ARITHMETIC COMPOSITIONS
  // ==========================================================================
  describe("3. Multi-Kernel Arithmetic Compositions", () => {
    const params1: KernelHyperparameters = {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 1.0,
      variance: 2.0,
    };
    const params2: KernelHyperparameters = {
      ...DEFAULT_GP_HYPERPARAMS,
      lengthscale: 3.0,
      variance: 1.5,
    };

    it("evaluates Single mode returning exactly kernel 1", () => {
      const mode: KernelCompositionMode = "single";
      const val = evaluateKernelComposed(mode, "rbf", "linear", params1, params2, 0.5, 1.5);
      const expected = evaluateKernel("rbf", 0.5, 1.5, params1);
      expect(val).toBeCloseTo(expected, 8);
    });

    it("evaluates Sum mode: k(x, x') = k1(x, x') + k2(x, x')", () => {
      const mode: KernelCompositionMode = "sum";
      const val = evaluateKernelComposed(mode, "rbf", "periodic", params1, params2, 0.5, 1.5);
      const k1 = evaluateKernel("rbf", 0.5, 1.5, params1);
      const k2 = evaluateKernel("periodic", 0.5, 1.5, params2);
      expect(val).toBeCloseTo(k1 + k2, 8);
    });

    it("evaluates Product mode: k(x, x') = k1(x, x') * k2(x, x')", () => {
      const mode: KernelCompositionMode = "product";
      const val = evaluateKernelComposed(mode, "matern52", "linear", params1, params2, 0.5, 1.5);
      const k1 = evaluateKernel("matern52", 0.5, 1.5, params1);
      const k2 = evaluateKernel("linear", 0.5, 1.5, params2);
      expect(val).toBeCloseTo(k1 * k2, 8);
    });
  });

  // ==========================================================================
  // 4. GRAM MATRIX SYMMETRY & POSITIVE SEMI-DEFINITENESS
  // ==========================================================================
  describe("4. Gram Matrix Symmetry & Positive Semi-Definiteness", () => {
    const config: ComposedKernelConfig = {
      mode: "single",
      kernel1: "rbf",
      kernel2: "linear",
      params1: { ...DEFAULT_GP_HYPERPARAMS, lengthscale: 1.2, variance: 2.0 },
      params2: DEFAULT_GP_HYPERPARAMS,
      noiseVariance: 0.05,
      jitter: 1e-6,
    };

    it("computes exact symmetric Gram matrix K(X, X) for arbitrary 1D points", () => {
      const X = [-3.0, -1.5, 0.0, 1.2, 2.8];
      const K = computeGramMatrix(X, X, config);

      expect(K.length).toBe(5);
      expect(K[0].length).toBe(5);

      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          expect(K[i][j]).toBeCloseTo(K[j][i], 10);
        }
      }
    });

    it("verifies all Gram matrix eigenvalues are non-negative (K >= 0)", () => {
      const X = [-4.0, -2.5, -1.0, 0.5, 2.0, 3.5];
      const K = computeGramMatrix(X, X, config);
      const spectrum = computeGramEigenvalues(K);

      expect(spectrum.eigenvalues.length).toBe(6);
      for (const eig of spectrum.eigenvalues) {
        expect(eig).toBeGreaterThanOrEqual(-1e-12);
      }

      // Check condition number is valid
      expect(spectrum.conditionNumber).toBeGreaterThanOrEqual(1.0);
    });
  });

  // ==========================================================================
  // 5. CHOLESKY FACTORIZATION & LINEAR SOLVER ACCURACY
  // ==========================================================================
  describe("5. Cholesky Factorization & Linear Solver Accuracy", () => {
    it("decomposes symmetric positive-definite matrix A into lower triangular L such that L L^T = A", () => {
      const A = [
        [4.0, 1.0, 0.5],
        [1.0, 5.0, 2.0],
        [0.5, 2.0, 6.0],
      ];

      const L = choleskyDecomposition(A, 0);

      // Verify lower triangular structure
      expect(L[0][1]).toBe(0);
      expect(L[0][2]).toBe(0);
      expect(L[1][2]).toBe(0);

      // Verify L * L^T == A
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          let sum = 0;
          for (let k = 0; k < 3; k++) {
            sum += L[i][k] * L[j][k];
          }
          expect(sum).toBeCloseTo(A[i][j], 8);
        }
      }
    });

    it("evaluates forwardSubstitution and backwardSubstitution solvers independently", () => {
      const L = [
        [2.0, 0.0, 0.0],
        [0.5, 3.0, 0.0],
        [1.0, 1.5, 4.0],
      ];
      const b = [4.0, 10.0, 18.0];

      // Forward solve: L y = b
      const y = forwardSubstitution(L, b);
      expect(y[0]).toBeCloseTo(2.0, 8); // 4 / 2
      expect(y[1]).toBeCloseTo(3.0, 8); // (10 - 0.5*2) / 3 = 9/3
      expect(y[2]).toBeCloseTo(2.875, 8); // (18 - 1*2 - 1.5*3) / 4 = (18 - 2 - 4.5) / 4 = 11.5/4

      // Backward solve: L^T x = y
      const x = backwardSubstitution(L, y);
      expect(Number.isFinite(x[0])).toBe(true);
      expect(Number.isFinite(x[1])).toBe(true);
      expect(Number.isFinite(x[2])).toBe(true);
    });

    it("accurately solves linear system A x = b via Cholesky forward/backward substitution", () => {
      const A = [
        [4.0, 1.0, 0.5],
        [1.0, 5.0, 2.0],
        [0.5, 2.0, 6.0],
      ];
      const b = [7.0, 15.0, 19.0];

      const L = choleskyDecomposition(A, 0);
      const x = choleskySolve(L, b);

      // Verify A * x == b
      for (let i = 0; i < 3; i++) {
        let sum = 0;
        for (let j = 0; j < 3; j++) {
          sum += A[i][j] * x[j];
        }
        expect(sum).toBeCloseTo(b[i], 8);
      }
    });

    it("applies adaptive jitter to prevent factorization failure on near-singular matrices", () => {
      // Coincident points creating singular Gram matrix
      const X = [1.0, 1.0, 1.0];
      const config: ComposedKernelConfig = {
        mode: "single",
        kernel1: "rbf",
        kernel2: "rbf",
        params1: DEFAULT_GP_HYPERPARAMS,
        params2: DEFAULT_GP_HYPERPARAMS,
        noiseVariance: 0.0, // No noise
        jitter: 1e-6,
      };

      const K = computeGramMatrix(X, X, config);
      const L = choleskyDecomposition(K, 1e-4);

      expect(L.length).toBe(3);
      for (let i = 0; i < 3; i++) {
        expect(Number.isFinite(L[i][i])).toBe(true);
        expect(L[i][i]).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 6. DETERMINISTIC PRNG & MULTIVARIATE NORMAL SAMPLING
  // ==========================================================================
  describe("6. Deterministic PRNG & Multivariate Normal Sampling", () => {
    it("generates deterministic reproducible random numbers from fixed seed", () => {
      const rng1 = createDeterministicRng(999);
      const rng2 = createDeterministicRng(999);

      const seq1 = [rng1(), rng1(), rng1(), rng1()];
      const seq2 = [rng2(), rng2(), rng2(), rng2()];

      expect(seq1).toEqual(seq2);
    });

    it("generates standard normal variates with mean ~ 0 and var ~ 1", () => {
      const rng = createDeterministicRng(42);
      const N = 1000;
      const samples: number[] = [];

      for (let i = 0; i < N; i++) {
        samples.push(sampleStandardNormal(rng));
      }

      const mean = samples.reduce((a, b) => a + b, 0) / N;
      const variance = samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (N - 1);

      expect(mean).toBeCloseTo(0.0, 0.2);
      expect(variance).toBeCloseTo(1.0, 0.2);
    });

    it("samples multivariate normal vector matching target dimension", () => {
      const mean = [1.0, 2.0, 3.0];
      const cov = [
        [1.0, 0.3, 0.1],
        [0.3, 1.0, 0.2],
        [0.1, 0.2, 1.0],
      ];
      const rng = createDeterministicRng(77);

      const sample = sampleMultivariateNormal(mean, cov, rng, 1e-6);
      expect(sample.length).toBe(3);
      for (const val of sample) {
        expect(Number.isFinite(val)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 7. GP PRIOR SPACE SAMPLING & PROPERTIES
  // ==========================================================================
  describe("7. GP Prior Space Sampling & Properties", () => {
    const config: ComposedKernelConfig = {
      mode: "single",
      kernel1: "rbf",
      kernel2: "rbf",
      params1: { ...DEFAULT_GP_HYPERPARAMS, variance: 2.25, lengthscale: 1.5 },
      params2: DEFAULT_GP_HYPERPARAMS,
      noiseVariance: 0.04,
      jitter: 1e-6,
    };

    it("produces zero prior mean and uniform variance equal to kernel variance sigma_f^2", () => {
      const Xstar = [-3.0, -1.5, 0.0, 1.5, 3.0];
      const priorResult = fitGPRegression([], [], Xstar, config, 4, 123);

      expect(priorResult.mean.length).toBe(5);
      for (const m of priorResult.mean) {
        expect(m).toBe(0);
      }

      for (const v of priorResult.variance) {
        expect(v).toBeCloseTo(2.25, 4);
      }

      for (const sd of priorResult.stdDev) {
        expect(sd).toBeCloseTo(1.5, 4); // sqrt(2.25) = 1.5
      }

      expect(priorResult.samples.length).toBe(4);
      expect(priorResult.samples[0].length).toBe(5);
    });
  });

  // ==========================================================================
  // 8. EXACT GP POSTERIOR CONDITIONING & UNCERTAINTY BEHAVIOR
  // ==========================================================================
  describe("8. Exact GP Posterior Conditioning & Uncertainty Behavior", () => {
    const config: ComposedKernelConfig = {
      mode: "single",
      kernel1: "rbf",
      kernel2: "rbf",
      params1: { ...DEFAULT_GP_HYPERPARAMS, variance: 2.0, lengthscale: 1.0 },
      params2: DEFAULT_GP_HYPERPARAMS,
      noiseVariance: 1e-4, // Low noise for precise interpolation test
      jitter: 1e-6,
    };

    it("interpolates training observations exactly in low-noise limit", () => {
      const X = [-2.0, 0.0, 2.0];
      const y = [1.5, -0.8, 2.2];
      const Xstar = [-2.0, -1.0, 0.0, 1.0, 2.0];

      const result = fitGPRegression(X, y, Xstar, config, 0, 42);

      // At training points x = -2.0, 0.0, 2.0 (indices 0, 2, 4)
      expect(result.mean[0]).toBeCloseTo(1.5, 2);
      expect(result.mean[2]).toBeCloseTo(-0.8, 2);
      expect(result.mean[4]).toBeCloseTo(2.2, 2);
    });

    it("exhibits severe variance reduction at observed points and flares up in gaps", () => {
      // Observations clustered at ends with a gap in [-1.5, 1.5]
      const X = [-3.0, 3.0];
      const y = [1.0, 1.0];
      const Xstar = [-3.0, 0.0, 3.0]; // x=0 is in the unobserved gap

      const result = fitGPRegression(X, y, Xstar, config, 0, 42);

      const varObservedLeft = result.variance[0];
      const varGapMiddle = result.variance[1];
      const varObservedRight = result.variance[2];

      // At observations, variance is near noise floor ~ 1e-4
      expect(varObservedLeft).toBeLessThan(0.01);
      expect(varObservedRight).toBeLessThan(0.01);

      // In unobserved gap, epistemic uncertainty flares up close to prior variance = 2.0
      expect(varGapMiddle).toBeGreaterThan(1.5);
    });

    it("computes consistent 1-sigma, 2-sigma, and 3-sigma confidence envelopes", () => {
      const X = [0.0];
      const y = [1.0];
      const Xstar = [-1.0, 0.0, 1.0];

      const result = fitGPRegression(X, y, Xstar, config, 0, 42);

      for (let i = 0; i < 3; i++) {
        const m = result.mean[i];
        const sd = result.stdDev[i];

        expect(result.lower1Sigma[i]).toBeCloseTo(m - sd, 6);
        expect(result.upper1Sigma[i]).toBeCloseTo(m + sd, 6);
        expect(result.lower2Sigma[i]).toBeCloseTo(m - 2 * sd, 6);
        expect(result.upper2Sigma[i]).toBeCloseTo(m + 2 * sd, 6);
        expect(result.lower3Sigma[i]).toBeCloseTo(m - 3 * sd, 6);
        expect(result.upper3Sigma[i]).toBeCloseTo(m + 3 * sd, 6);
      }
    });
  });

  // ==========================================================================
  // 9. MARGINAL LOG-LIKELIHOOD (MLL) DECOMPOSITION
  // ==========================================================================
  describe("9. Marginal Log-Likelihood (MLL) Decomposition", () => {
    const config: ComposedKernelConfig = {
      mode: "single",
      kernel1: "rbf",
      kernel2: "rbf",
      params1: { ...DEFAULT_GP_HYPERPARAMS, variance: 1.5, lengthscale: 1.2 },
      params2: DEFAULT_GP_HYPERPARAMS,
      noiseVariance: 0.05,
      jitter: 1e-6,
    };

    it("decomposes MLL into Data Fit, Complexity Penalty, and Normalization", () => {
      const X = [-2.0, -1.0, 0.0, 1.0, 2.0];
      const y = [-1.2, -0.5, 0.1, 0.8, 1.4];

      const mllResult = computeMarginalLogLikelihood(X, y, config);

      expect(Number.isFinite(mllResult.mll)).toBe(true);
      expect(Number.isFinite(mllResult.dataFit)).toBe(true);
      expect(Number.isFinite(mllResult.complexityPenalty)).toBe(true);
      expect(Number.isFinite(mllResult.normalizationConstant)).toBe(true);

      // Verify exact sum identity: MLL = DataFit + Complexity + Normalization
      const calculatedTotal =
        mllResult.dataFit + mllResult.complexityPenalty + mllResult.normalizationConstant;

      expect(mllResult.mll).toBeCloseTo(calculatedTotal, 8);
      expect(mllResult.perPointMLL).toBeCloseTo(mllResult.mll / X.length, 8);
    });

    it("returns zero MLL for empty dataset N = 0", () => {
      const mllEmpty = computeMarginalLogLikelihood([], [], config);
      expect(mllEmpty.mll).toBe(0);
      expect(mllEmpty.dataFit).toBe(0);
      expect(mllEmpty.complexityPenalty).toBe(0);
    });
  });

  // ==========================================================================
  // 10. RKHS NORM & SPECTRAL ANALYSIS
  // ==========================================================================
  describe("10. RKHS Norm & Spectral Analysis", () => {
    const config: ComposedKernelConfig = {
      mode: "single",
      kernel1: "rbf",
      kernel2: "rbf",
      params1: { ...DEFAULT_GP_HYPERPARAMS, variance: 2.0, lengthscale: 1.0 },
      params2: DEFAULT_GP_HYPERPARAMS,
      noiseVariance: 0.04,
      jitter: 1e-6,
    };

    it("computes non-negative RKHS norm squared ||f_bar||_H^2", () => {
      const X = [-2.0, 0.0, 2.0];
      const y = [1.0, -1.0, 1.0];

      const rkhsNorm = computeRKHSNorm(X, y, config);
      expect(rkhsNorm).toBeGreaterThan(0);
      expect(Number.isFinite(rkhsNorm)).toBe(true);
    });

    it("returns zero RKHS norm for zero targets y = 0", () => {
      const X = [-1.0, 0.0, 1.0];
      const y = [0.0, 0.0, 0.0];

      const rkhsNorm = computeRKHSNorm(X, y, config);
      expect(rkhsNorm).toBeCloseTo(0.0, 8);
    });

    it("evaluates spectral decomposition and cumulative explained variance", () => {
      const X = [-3.0, -1.5, 0.0, 1.5, 3.0];
      const K = computeGramMatrix(X, X, config);
      const spectrum = computeGramEigenvalues(K);

      expect(spectrum.eigenvalues.length).toBe(5);
      // Sorted descending
      for (let i = 0; i < 4; i++) {
        expect(spectrum.eigenvalues[i]).toBeGreaterThanOrEqual(spectrum.eigenvalues[i + 1]);
      }

      // Cumulative variance must reach 1.0 at the last component
      expect(spectrum.cumulativeVariance[4]).toBeCloseTo(1.0, 6);
    });
  });
});
