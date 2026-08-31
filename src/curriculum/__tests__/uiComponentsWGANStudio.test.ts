import { describe, it, expect } from "bun:test";
import React from "react";
import {
  WassersteinGANStudio,
  SeededRNG,
  norm2D,
  dist2D,
  dot2D,
  add2D,
  sub2D,
  scale2D,
  lerp2D,
  generateEightGaussians,
  generateTwentyFiveGaussians,
  generateSwissRoll,
  generateTwoMoons,
  generateConcentricRings,
  generatePinwheel,
  generateDatasetBatch,
  DATASET_DEFINITIONS,
  createMLPLayer,
  createMLPNetwork,
  powerIterationSpectralNorm,
  updateSpectralNorm,
  clipWeights,
  forwardMLP,
  computeInputGradient,
  backwardMLP,
  createAdamState,
  createRMSPropState,
  computeKantorovichWasserstein,
  computeSlicedWassersteinDistance,
  computeJensenShannonDivergence,
  computeModeCoverageMetrics,
  trainGANStep,
  GAN_PARADIGM_INFOS,
  WGAN_STUDIO_PRESETS,
  type GANParadigmId,
  type WGANPresetId,
  type DatasetId,
  type Vector2,
  type GANTrainingState,
} from "../../components/primitives/WassersteinGANStudio";

// ============================================================================
// 1. COMPONENT INSTANTIATION & PROPS
// ============================================================================

describe("Wasserstein GAN Studio - Component Structure & Props", () => {
  it("should create React element with default configuration", () => {
    const element = React.createElement(WassersteinGANStudio, {});
    expect(element).toBeDefined();
    expect(element.type).toBe(WassersteinGANStudio);
    expect(element.props).toEqual({});
  });

  it("should create React element with custom props", () => {
    const onStepChange = () => {};
    const element = React.createElement(WassersteinGANStudio, {
      initialPreset: "wgan_gp_swiss_roll",
      initialParadigm: "wgan_gp",
      initialDataset: "swiss_roll",
      seed: 9876,
      onStepChange,
      className: "custom-wgan-studio",
    });

    expect(element.props.initialPreset).toBe("wgan_gp_swiss_roll");
    expect(element.props.initialParadigm).toBe("wgan_gp");
    expect(element.props.initialDataset).toBe("swiss_roll");
    expect(element.props.seed).toBe(9876);
    expect(element.props.className).toBe("custom-wgan-studio");
  });
});

// ============================================================================
// 2. DETERMINISTIC PRNG & VECTOR UTILITIES
// ============================================================================

describe("Deterministic PRNG & 2D Vector Math", () => {
  it("should produce reproducible pseudo-random numbers with fixed seed", () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    for (let i = 0; i < 25; i++) {
      expect(rng1.next()).toBeCloseTo(rng2.next(), 8);
    }
  });

  it("should produce distinct sequences with different seeds", () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(999);

    const val1 = rng1.next();
    const val2 = rng2.next();
    expect(val1).not.toBe(val2);
  });

  it("should generate Gaussian distribution samples with approximate 0 mean and 1 variance", () => {
    const rng = new SeededRNG(12345);
    const N = 2500;
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < N; i++) {
      const g = rng.nextGaussian(0, 1);
      sum += g;
      sumSq += g * g;
    }

    const mean = sum / N;
    const variance = sumSq / N - mean * mean;

    expect(Math.abs(mean)).toBeLessThan(0.08);
    expect(Math.abs(variance - 1.0)).toBeLessThan(0.12);
  });

  it("should compute vector operations correctly", () => {
    const a: Vector2 = [3, 4];
    const b: Vector2 = [1, 2];

    expect(norm2D(a)).toBeCloseTo(5.0, 6);
    expect(dist2D(a, b)).toBeCloseTo(Math.hypot(2, 2), 6);
    expect(dot2D(a, b)).toBe(3 * 1 + 4 * 2);
    expect(add2D(a, b)).toEqual([4, 6]);
    expect(sub2D(a, b)).toEqual([2, 2]);
    expect(scale2D(a, 2)).toEqual([6, 8]);
    expect(lerp2D(a, b, 0.5)).toEqual([2, 3]);
  });
});

// ============================================================================
// 3. 2D DATASET GENERATORS
// ============================================================================

describe("2D Data Distributions (6 Manifolds)", () => {
  const rng = new SeededRNG(777);

  it("should generate 8 Gaussians in a Ring with radius 2.0", () => {
    const batch = generateEightGaussians(80, rng, 2.0, 0.08);
    expect(batch.points.length).toBe(80);
    expect(batch.modeInfos.length).toBe(8);

    for (const info of batch.modeInfos) {
      const r = norm2D(info.center);
      expect(r).toBeCloseTo(2.0, 4);
    }
  });

  it("should generate 25 Gaussians on a 5x5 Grid", () => {
    const batch = generateTwentyFiveGaussians(100, rng, 1.0, 0.05);
    expect(batch.points.length).toBe(100);
    expect(batch.modeInfos.length).toBe(25);

    // Verify grid centers are within [-2, 2]
    for (const info of batch.modeInfos) {
      expect(info.center[0]).toBeGreaterThanOrEqual(-2.0);
      expect(info.center[0]).toBeLessThanOrEqual(2.0);
      expect(info.center[1]).toBeGreaterThanOrEqual(-2.0);
      expect(info.center[1]).toBeLessThanOrEqual(2.0);
    }
  });

  it("should generate Swiss Roll spiral manifold", () => {
    const batch = generateSwissRoll(120, rng, 0.05);
    expect(batch.points.length).toBe(120);
    expect(batch.modeInfos.length).toBe(8);

    for (const pt of batch.points) {
      expect(Math.abs(pt[0])).toBeLessThan(3.0);
      expect(Math.abs(pt[1])).toBeLessThan(3.0);
    }
  });

  it("should generate Two Moons crescent distribution", () => {
    const batch = generateTwoMoons(100, rng, 0.06);
    expect(batch.points.length).toBe(100);
    expect(batch.modeInfos.length).toBe(8);
  });

  it("should generate Concentric Rings distribution", () => {
    const batch = generateConcentricRings(120, rng, 1.0, 2.2, 0.08);
    expect(batch.points.length).toBe(120);
    expect(batch.modeInfos.length).toBe(12);
  });

  it("should generate Pinwheel spiral arms", () => {
    const batch = generatePinwheel(100, rng, 5, 0.06);
    expect(batch.points.length).toBe(100);
    expect(batch.modeInfos.length).toBe(5);
  });

  it("should generate batches via the generic dispatcher", () => {
    const datasets: DatasetId[] = [
      "eight_gaussians",
      "twenty_five_gaussians",
      "swiss_roll",
      "two_moons",
      "concentric_rings",
      "pinwheel",
    ];

    for (const ds of datasets) {
      const batch = generateDatasetBatch(ds, 50, rng);
      expect(batch.points.length).toBe(50);
      expect(batch.modeInfos.length).toBe(DATASET_DEFINITIONS[ds].modeCount);
    }
  });
});

// ============================================================================
// 4. MLP AUTODIFF & NEURAL NETWORK ENGINE
// ============================================================================

describe("MLP Neural Network Engine & Autodiff", () => {
  it("should initialize MLP layers with proper dimensions and non-zero weights", () => {
    const rng = new SeededRNG(101);
    const net = createMLPNetwork(2, [32, 16], 1, "leaky_relu", "linear", rng);

    expect(net.layers.length).toBe(3);
    expect(net.layers[0].weights.length).toBe(32);
    expect(net.layers[0].weights[0].length).toBe(2);
    expect(net.layers[1].weights.length).toBe(16);
    expect(net.layers[1].weights[0].length).toBe(32);
    expect(net.layers[2].weights.length).toBe(1);
    expect(net.layers[2].weights[0].length).toBe(16);
  });

  it("should perform forward pass with leaky_relu and sigmoid", () => {
    const rng = new SeededRNG(202);
    const net = createMLPNetwork(2, [16], 1, "leaky_relu", "sigmoid", rng);
    const out = forwardMLP(net, [1.0, -1.0]);

    expect(out.output.length).toBe(1);
    expect(out.output[0]).toBeGreaterThan(0.0);
    expect(out.output[0]).toBeLessThan(1.0);
  });

  it("should calculate exact analytical input gradient matching finite differences", () => {
    const rng = new SeededRNG(303);
    const net = createMLPNetwork(2, [16, 16], 1, "leaky_relu", "linear", rng);
    const testPoint: Vector2 = [0.8, -0.5];

    // Analytical gradient
    const analyticalGrad = computeInputGradient(net, testPoint, false);

    // Finite difference numerical gradient
    const eps = 1e-5;
    const outXPlus = forwardMLP(net, [testPoint[0] + eps, testPoint[1]]).output[0];
    const outXMinus = forwardMLP(net, [testPoint[0] - eps, testPoint[1]]).output[0];
    const numGradX = (outXPlus - outXMinus) / (2 * eps);

    const outYPlus = forwardMLP(net, [testPoint[0], testPoint[1] + eps]).output[0];
    const outYMinus = forwardMLP(net, [testPoint[0], testPoint[1] - eps]).output[0];
    const numGradY = (outYPlus - outYMinus) / (2 * eps);

    expect(analyticalGrad[0]).toBeCloseTo(numGradX, 3);
    expect(analyticalGrad[1]).toBeCloseTo(numGradY, 3);
  });

  it("should backpropagate loss gradients and compute layer weight updates", () => {
    const rng = new SeededRNG(404);
    const net = createMLPNetwork(2, [16], 1, "leaky_relu", "linear", rng);
    const input = [1.0, 2.0];
    const cache = forwardMLP(net, input);
    const gradLossWrtOut = [1.0];

    const back = backwardMLP(net, gradLossWrtOut, cache);
    expect(back.gradWeights.length).toBe(2);
    expect(back.gradBiases.length).toBe(2);
    expect(back.gradInput.length).toBe(2);
  });
});

// ============================================================================
// 5. SPECTRAL NORMALIZATION & WEIGHT CLIPPING
// ============================================================================

describe("Spectral Normalization & Weight Clipping", () => {
  it("should estimate matrix spectral norm via 1-step power iteration", () => {
    const rng = new SeededRNG(505);
    const layer = createMLPLayer(4, 4, rng);
    const sigma = powerIterationSpectralNorm(layer, 10);

    expect(sigma).toBeGreaterThan(0);
    expect(layer.u).toBeDefined();
    expect(layer.v).toBeDefined();
    expect(layer.sigma).toBeCloseTo(sigma, 5);
  });

  it("should update spectral norm across all network layers", () => {
    const rng = new SeededRNG(606);
    const net = createMLPNetwork(2, [32, 16], 1, "leaky_relu", "linear", rng);
    updateSpectralNorm(net, 3);

    for (const layer of net.layers) {
      expect(layer.sigma).toBeGreaterThan(0);
    }
  });

  it("should enforce strict weight clipping bounds [-c, c]", () => {
    const rng = new SeededRNG(707);
    const net = createMLPNetwork(2, [16, 16], 1, "leaky_relu", "linear", rng);
    const c = 0.02;
    clipWeights(net, c);

    for (const layer of net.layers) {
      for (const row of layer.weights) {
        for (const w of row) {
          expect(w).toBeGreaterThanOrEqual(-c);
          expect(w).toBeLessThanOrEqual(c);
        }
      }
      for (const b of layer.biases) {
        expect(b).toBeGreaterThanOrEqual(-c);
        expect(b).toBeLessThanOrEqual(c);
      }
    }
  });
});

// ============================================================================
// 6. METRICS & DIVERGENCES
// ============================================================================

describe("Optimal Transport & GAN Divergence Metrics", () => {
  const rng = new SeededRNG(808);
  const realBatch = generateEightGaussians(64, rng, 2.0, 0.08).points;
  const fakeBatch = generateEightGaussians(64, rng, 2.0, 0.08).points;
  const shiftedFakeBatch = realBatch.map((p) => [p[0] + 5.0, p[1] + 5.0] as Vector2);

  it("should compute Kantorovich-Rubinstein estimated Wasserstein distance", () => {
    const critic = createMLPNetwork(2, [16], 1, "leaky_relu", "linear", rng);
    const w1 = computeKantorovichWasserstein(critic, realBatch, fakeBatch);
    expect(typeof w1).toBe("number");
  });

  it("should compute Sliced Wasserstein Distance with proper invariance", () => {
    const swdSame = computeSlicedWassersteinDistance(realBatch, realBatch, 16, rng);
    const swdShifted = computeSlicedWassersteinDistance(realBatch, shiftedFakeBatch, 16, rng);

    expect(swdSame).toBeCloseTo(0.0, 4);
    expect(swdShifted).toBeGreaterThan(3.0);
  });

  it("should compute Jensen-Shannon Divergence bounded in [0, 1]", () => {
    const jsSame = computeJensenShannonDivergence(realBatch, realBatch, 16);
    const jsShifted = computeJensenShannonDivergence(realBatch, shiftedFakeBatch, 16);

    expect(jsSame).toBeCloseTo(0.0, 3);
    expect(jsShifted).toBeGreaterThan(0.5);
    expect(jsShifted).toBeLessThanOrEqual(1.0);
  });

  it("should compute Mode Coverage and Shannon Entropy correctly", () => {
    const dataset = generateEightGaussians(64, rng, 2.0, 0.08);
    const modeMetrics = computeModeCoverageMetrics(dataset.points, dataset.modeInfos);

    expect(modeMetrics.totalModes).toBe(8);
    expect(modeMetrics.capturedModes).toBeGreaterThanOrEqual(6);
    expect(modeMetrics.entropy).toBeGreaterThan(1.5);
    expect(modeMetrics.modeCollapseRatio).toBeLessThan(0.4);
  });
});

// ============================================================================
// 7. GAN TRAINING STEP FOR ALL 4 PARADIGMS
// ============================================================================

describe("GAN Training Engine Execution (4 Paradigms)", () => {
  const paradigms: GANParadigmId[] = ["standard_gan", "wgan_clip", "wgan_gp", "sngan"];

  for (const paradigm of paradigms) {
    it(`should successfully execute 1 training iteration for ${paradigm}`, () => {
      const rng = new SeededRNG(909);
      const dataset = generateEightGaussians(64, rng, 2.0, 0.08);

      const critic = createMLPNetwork(
        2,
        [16, 16],
        1,
        "leaky_relu",
        paradigm === "standard_gan" ? "sigmoid" : "linear",
        rng,
      );
      const generator = createMLPNetwork(2, [16, 16], 2, "leaky_relu", "linear", rng);

      const state: GANTrainingState = {
        critic,
        generator,
        genAdam: createAdamState(generator),
        criticAdam: paradigm !== "wgan_clip" ? createAdamState(critic) : undefined,
        criticRMSProp: paradigm === "wgan_clip" ? createRMSPropState(critic) : undefined,
        iteration: 0,
        totalRealSeen: 0,
      };

      const result = trainGANStep(
        state,
        dataset.points,
        dataset,
        paradigm,
        {
          lr: 0.002,
          nCritic: 2,
          lambdaGP: 10,
          clipC: 0.01,
          batchSize: 32,
        },
        rng,
      );

      expect(result.state.iteration).toBe(1);
      expect(result.state.totalRealSeen).toBe(64);
      expect(result.fakeSamples.length).toBe(32);
      expect(result.snapshot.iteration).toBe(1);
      expect(typeof result.snapshot.criticLoss).toBe("number");
      expect(typeof result.snapshot.genLoss).toBe("number");
      expect(typeof result.snapshot.wassersteinD).toBe("number");
      expect(typeof result.snapshot.slicedWassersteinD).toBe("number");
    });
  }
});

// ============================================================================
// 8. PRESET CONFIGURATIONS & METADATA
// ============================================================================

describe("Preset Configurations & Metadata Integrity", () => {
  it("should provide valid presets covering all target datasets and paradigms", () => {
    const presetIds = Object.keys(WGAN_STUDIO_PRESETS);
    expect(presetIds.length).toBeGreaterThanOrEqual(6);

    for (const [id, preset] of Object.entries(WGAN_STUDIO_PRESETS)) {
      expect(preset.id).toBe(id as unknown as WGANPresetId);
      expect(preset.name.length).toBeGreaterThan(5);
      expect(preset.description.length).toBeGreaterThan(10);
      expect(preset.lr).toBeGreaterThan(0);
      expect(preset.nCritic).toBeGreaterThanOrEqual(1);
      expect(preset.batchSize).toBeGreaterThan(0);
      expect(preset.hiddenDim).toBeGreaterThan(0);
    }
  });

  it("should contain comprehensive theory information for all 4 GAN paradigms", () => {
    const paradigms: GANParadigmId[] = ["standard_gan", "wgan_clip", "wgan_gp", "sngan"];

    for (const p of paradigms) {
      const info = GAN_PARADIGM_INFOS[p];
      expect(info).toBeDefined();
      expect(info.id).toBe(p);
      expect(info.objectiveFormula.length).toBeGreaterThan(5);
      expect(info.lipschitzEnforcement.length).toBeGreaterThan(5);
      expect(info.keyAdvantage.length).toBeGreaterThan(5);
      expect(info.knownFailureMode.length).toBeGreaterThan(5);
    }
  });
});
