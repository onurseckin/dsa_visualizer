import { describe, it, expect } from "bun:test";
import React from "react";
import {
  ContrastiveLearningStudio,
  SeededRNG,
  dotProduct3D,
  norm3D,
  normalize3D,
  euclideanDistance3D,
  cosineSimilarity,
  tangentSpaceProject,
  matrixVectorMultiply3x3,
  createIdentityMatrix3x3,
  compute3x3Eigenvalues,
  computeSingularValueSpectrum,
  sigmoid,
  computeSimCLRInfoNCELoss,
  computeWangIsolaAlignment,
  computeWangIsolaUniformity,
  computeBYOLLoss,
  computeSigLIPLoss,
  computeSimilarityMatrixData,
  generateImageTextDataset,
  generateAugmentationDataset,
  generateClusteredHypersphereDataset,
  generateHardNegativesDataset,
  generateDimensionalCollapseDataset,
  generateBenchmarkDataset,
  CONTRASTIVE_PARADIGM_INFOS,
  CONTRASTIVE_STUDIO_PRESETS,
  stepContrastiveOptimization,
  project3DToHypersphereView,
  type Vector3,
  type EmbeddingPoint,
  type AlgorithmHyperparameters,
  type OptimizationState,
} from "../../components/primitives/ContrastiveLearningStudio";

// ============================================================================
// 1. COMPONENT INSTANTIATION & PROPS
// ============================================================================

describe("Contrastive Learning Studio - Component Structure & Props", () => {
  it("should create React element with default configuration", () => {
    const element = React.createElement(ContrastiveLearningStudio, {});
    expect(element).toBeDefined();
    expect(element.type).toBe(ContrastiveLearningStudio);
    expect(element.props).toEqual({});
  });

  it("should create React element with comprehensive custom props", () => {
    const onStepChange = (_step: number, _loss: number) => {};
    const element = React.createElement(ContrastiveLearningStudio, {
      initialParadigm: "wang_isola",
      initialDataset: "clustered_hypersphere",
      initialPreset: "wang_isola_pareto_balance",
      initialTemperature: 0.07,
      initialLearningRate: 0.08,
      initialBatchSize: 16,
      seed: 9876,
      width: 1200,
      height: 750,
      standalone: true,
      title: "Custom Contrastive Alignment Studio",
      onStepChange,
      className: "custom-contrastive-studio-class",
    });

    expect(element.props.initialParadigm).toBe("wang_isola");
    expect(element.props.initialDataset).toBe("clustered_hypersphere");
    expect(element.props.initialPreset).toBe("wang_isola_pareto_balance");
    expect(element.props.initialTemperature).toBe(0.07);
    expect(element.props.initialLearningRate).toBe(0.08);
    expect(element.props.initialBatchSize).toBe(16);
    expect(element.props.seed).toBe(9876);
    expect(element.props.width).toBe(1200);
    expect(element.props.height).toBe(750);
    expect(element.props.standalone).toBe(true);
    expect(element.props.title).toBe("Custom Contrastive Alignment Studio");
    expect(element.props.onStepChange).toBe(onStepChange);
    expect(element.props.className).toBe("custom-contrastive-studio-class");
  });
});

// ============================================================================
// 2. DETERMINISTIC PRNG & 3D VECTOR MATH UTILITIES
// ============================================================================

describe("Deterministic PRNG & 3D Hypersphere Math", () => {
  it("should produce reproducible pseudo-random numbers with fixed seed", () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(42);

    for (let i = 0; i < 30; i++) {
      expect(rng1.next()).toBeCloseTo(rng2.next(), 8);
    }
  });

  it("should produce distinct sequences with different seeds", () => {
    const rng1 = new SeededRNG(42);
    const rng2 = new SeededRNG(1337);
    expect(rng1.next()).not.toBe(rng2.next());
  });

  it("should sample points strictly on the 3D unit sphere S^2 (norm = 1.0)", () => {
    const rng = new SeededRNG(777);
    for (let i = 0; i < 50; i++) {
      const pt = rng.sampleUnitSphere3D();
      const length = norm3D(pt);
      expect(length).toBeCloseTo(1.0, 6);
    }
  });

  it("should compute vector operations correctly (dot, norm, normalize, dist, cosine)", () => {
    const u: Vector3 = [1, 0, 0];
    const v: Vector3 = [0, 1, 0];
    const w: Vector3 = [3, 4, 0];

    // Dot product
    expect(dotProduct3D(u, v)).toBe(0);
    expect(dotProduct3D(u, u)).toBe(1);

    // Norm & Normalize
    expect(norm3D(w)).toBe(5);
    const normW = normalize3D(w);
    expect(normW[0]).toBeCloseTo(0.6, 6);
    expect(normW[1]).toBeCloseTo(0.8, 6);
    expect(normW[2]).toBe(0);
    expect(norm3D(normW)).toBeCloseTo(1.0, 6);

    // Euclidean Distance
    expect(euclideanDistance3D(u, v)).toBeCloseTo(Math.sqrt(2), 6);

    // Cosine similarity
    expect(cosineSimilarity([2, 0, 0], [5, 0, 0])).toBeCloseTo(1.0, 6);
    expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1.0, 6);
    expect(cosineSimilarity(u, v)).toBeCloseTo(0.0, 6);
  });

  it("should project vectors onto the tangent space of the unit sphere S^2", () => {
    const p: Vector3 = [0, 0, 1]; // North pole of sphere
    const arbitraryGrad: Vector3 = [2, 3, 5]; // Has radial and tangential components

    const tanGrad = tangentSpaceProject(arbitraryGrad, p);
    // Tangent gradient at [0,0,1] must have zero Z-component
    expect(tanGrad[0]).toBe(2);
    expect(tanGrad[1]).toBe(3);
    expect(tanGrad[2]).toBe(0);

    // Tangent vector must be orthogonal to position vector p
    expect(dotProduct3D(tanGrad, p)).toBeCloseTo(0, 8);
  });

  it("should execute 3x3 matrix-vector multiplication correctly", () => {
    const I = createIdentityMatrix3x3();
    const v: Vector3 = [1.5, -2.0, 4.0];
    const res = matrixVectorMultiply3x3(I, v);
    expect(res[0]).toBe(1.5);
    expect(res[1]).toBe(-2.0);
    expect(res[2]).toBe(4.0);

    const rotZ = [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
    ];
    const rotated = matrixVectorMultiply3x3(rotZ, [1, 0, 0]);
    expect(rotated[0]).toBeCloseTo(0, 6);
    expect(rotated[1]).toBeCloseTo(1, 6);
    expect(rotated[2]).toBeCloseTo(0, 6);
  });
});

// ============================================================================
// 3. SIMILARITY MATRIX & CONTRAST MARGIN COMPUTATION
// ============================================================================

describe("Cosine Similarity Matrix & Diagnostic Metrics", () => {
  it("should compute symmetric cosine similarity matrix and positive masks", () => {
    const p1: EmbeddingPoint = {
      id: "p1",
      label: "Point 1",
      vector: [1, 0, 0],
      clusterId: 0,
      modality: "view1",
      pairId: "p2",
      color: "#38bdf8",
    };
    const p2: EmbeddingPoint = {
      id: "p2",
      label: "Point 2",
      vector: normalize3D([0.9, 0.1, 0]),
      clusterId: 0,
      modality: "view2",
      pairId: "p1",
      color: "#38bdf8",
    };
    const p3: EmbeddingPoint = {
      id: "p3",
      label: "Point 3",
      vector: [0, 1, 0],
      clusterId: 1,
      modality: "view1",
      pairId: "p4",
      color: "#34d399",
    };
    const p4: EmbeddingPoint = {
      id: "p4",
      label: "Point 4",
      vector: [0, 1, 0],
      clusterId: 1,
      modality: "view2",
      pairId: "p3",
      color: "#34d399",
    };

    const simData = computeSimilarityMatrixData([p1, p2, p3, p4], 0.1);

    expect(simData.matrix.length).toBe(4);
    expect(simData.matrix[0][0]).toBeCloseTo(1.0, 6);
    expect(simData.matrix[1][1]).toBeCloseTo(1.0, 6);
    expect(simData.isPositiveMask[0][1]).toBe(true);
    expect(simData.isPositiveMask[1][0]).toBe(true);
    expect(simData.isPositiveMask[0][2]).toBe(false);

    // Contrast margin Delta = meanPosSim - meanNegSim > 0
    expect(simData.meanPosSim).toBeGreaterThan(0.9);
    expect(simData.contrastMargin).toBeGreaterThan(0.5);
  });
});

// ============================================================================
// 4. SIMCLR INFONCE / NT-XENT LOSS ENGINE
// ============================================================================

describe("SimCLR (InfoNCE / NT-Xent Loss)", () => {
  it("should calculate exact InfoNCE loss and sharp gradients with temperature tau", () => {
    const p1: EmbeddingPoint = {
      id: "a",
      label: "Anchor A",
      vector: [1, 0, 0],
      clusterId: 0,
      modality: "view1",
      pairId: "b",
      color: "#38bdf8",
    };
    const p2: EmbeddingPoint = {
      id: "b",
      label: "Positive B",
      vector: [1, 0, 0], // Perfectly aligned positive
      clusterId: 0,
      modality: "view2",
      pairId: "a",
      color: "#38bdf8",
    };
    const p3: EmbeddingPoint = {
      id: "c",
      label: "Negative C",
      vector: [0, 1, 0], // Orthogonal negative
      clusterId: 1,
      modality: "view1",
      pairId: "d",
      color: "#34d399",
    };
    const p4: EmbeddingPoint = {
      id: "d",
      label: "Negative D",
      vector: [0, -1, 0],
      clusterId: 1,
      modality: "view2",
      pairId: "c",
      color: "#34d399",
    };

    const res = computeSimCLRInfoNCELoss([p1, p2, p3, p4], 0.1);
    expect(res.loss).toBeGreaterThan(0);
    expect(res.gradients.length).toBe(4);

    // Probability of positive pair (b given a) should be close to 1
    const pIdxB = 1;
    expect(res.probabilities[0][pIdxB]).toBeGreaterThan(0.99);
  });

  it("should increase loss as positive pairs are separated further apart", () => {
    const makePoints = (posVec: Vector3): EmbeddingPoint[] => [
      {
        id: "1",
        label: "1",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "view1",
        pairId: "2",
        color: "#fff",
      },
      {
        id: "2",
        label: "2",
        vector: posVec,
        clusterId: 0,
        modality: "view2",
        pairId: "1",
        color: "#fff",
      },
      {
        id: "3",
        label: "3",
        vector: [0, 1, 0],
        clusterId: 1,
        modality: "view1",
        pairId: "4",
        color: "#fff",
      },
      {
        id: "4",
        label: "4",
        vector: [0, -1, 0],
        clusterId: 1,
        modality: "view2",
        pairId: "3",
        color: "#fff",
      },
    ];

    const closePoints = makePoints(normalize3D([1, 0.1, 0]));
    const farPoints = makePoints(normalize3D([0.2, 0.9, 0]));

    const lossClose = computeSimCLRInfoNCELoss(closePoints, 0.1).loss;
    const lossFar = computeSimCLRInfoNCELoss(farPoints, 0.1).loss;

    expect(lossFar).toBeGreaterThan(lossClose);
  });
});

// ============================================================================
// 5. WANG & ISOLA ALIGNMENT & UNIFORMITY METRICS
// ============================================================================

describe("Wang & Isola Alignment & Uniformity Analysis", () => {
  it("should compute alignment loss L_align = 0 when positive pairs coincide", () => {
    const points: EmbeddingPoint[] = [
      {
        id: "1",
        label: "1",
        vector: [0, 0, 1],
        clusterId: 0,
        modality: "view1",
        pairId: "2",
        color: "#fff",
      },
      {
        id: "2",
        label: "2",
        vector: [0, 0, 1],
        clusterId: 0,
        modality: "view2",
        pairId: "1",
        color: "#fff",
      },
    ];

    const alignRes = computeWangIsolaAlignment(points, 2.0);
    expect(alignRes.loss).toBeCloseTo(0.0, 6);
  });

  it("should compute higher uniformity loss when points are collapsed vs uniformly spread", () => {
    // Collapsed points (all clustered at [1, 0, 0])
    const collapsedPoints: EmbeddingPoint[] = [
      {
        id: "1",
        label: "1",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "view1",
        pairId: "2",
        color: "#fff",
      },
      {
        id: "2",
        label: "2",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "view2",
        pairId: "1",
        color: "#fff",
      },
      {
        id: "3",
        label: "3",
        vector: [1, 0, 0],
        clusterId: 1,
        modality: "view1",
        pairId: "4",
        color: "#fff",
      },
      {
        id: "4",
        label: "4",
        vector: [1, 0, 0],
        clusterId: 1,
        modality: "view2",
        pairId: "3",
        color: "#fff",
      },
    ];

    // Uniformly spread points on orthogonal axes
    const spreadPoints: EmbeddingPoint[] = [
      {
        id: "1",
        label: "1",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "view1",
        pairId: "2",
        color: "#fff",
      },
      {
        id: "2",
        label: "2",
        vector: [-1, 0, 0],
        clusterId: 0,
        modality: "view2",
        pairId: "1",
        color: "#fff",
      },
      {
        id: "3",
        label: "3",
        vector: [0, 1, 0],
        clusterId: 1,
        modality: "view1",
        pairId: "4",
        color: "#fff",
      },
      {
        id: "4",
        label: "4",
        vector: [0, -1, 0],
        clusterId: 1,
        modality: "view2",
        pairId: "3",
        color: "#fff",
      },
    ];

    const unifCollapsed = computeWangIsolaUniformity(collapsedPoints, 2.0).loss;
    const unifSpread = computeWangIsolaUniformity(spreadPoints, 2.0).loss;

    // Collapsed uniformity is exp(0) = 1 => log(1) = 0
    // Spread uniformity has large distance ||u-v||^2 => exp(-t*dist^2) is small => log is negative
    expect(unifCollapsed).toBeCloseTo(0.0, 4);
    expect(unifSpread).toBeLessThan(unifCollapsed);
  });
});

// ============================================================================
// 6. BYOL ONLINE-TARGET PREDICTOR & EMA DYNAMICS
// ============================================================================

describe("BYOL (Bootstrap Your Own Latent)", () => {
  it("should compute BYOL normalized cosine loss L_byol = 2 - 2*cos(q, z')", () => {
    const onlinePoints: EmbeddingPoint[] = [
      {
        id: "1",
        label: "Online 1",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "view1",
        pairId: "2",
        color: "#fff",
      },
    ];
    const targetPoints: EmbeddingPoint[] = [
      {
        id: "2",
        label: "Target 2",
        vector: [0, 1, 0], // Orthogonal target => cos = 0 => loss = 2.0
        clusterId: 0,
        modality: "view2",
        pairId: "1",
        color: "#fff",
      },
    ];

    const predictor = createIdentityMatrix3x3();
    const res = computeBYOLLoss(onlinePoints, targetPoints, predictor);

    expect(res.loss).toBeCloseTo(2.0, 6);
    expect(res.onlineGradients.length).toBe(1);
  });

  it("should achieve near-zero BYOL loss when online prediction matches target", () => {
    const onlinePoints: EmbeddingPoint[] = [
      {
        id: "1",
        label: "Online 1",
        vector: [0, 0, 1],
        clusterId: 0,
        modality: "view1",
        pairId: "2",
        color: "#fff",
      },
    ];
    const targetPoints: EmbeddingPoint[] = [
      {
        id: "2",
        label: "Target 2",
        vector: [0, 0, 1], // Exactly matched target => cos = 1.0 => loss = 0.0
        clusterId: 0,
        modality: "view2",
        pairId: "1",
        color: "#fff",
      },
    ];

    const predictor = createIdentityMatrix3x3();
    const res = computeBYOLLoss(onlinePoints, targetPoints, predictor);

    expect(res.loss).toBeCloseTo(0.0, 6);
  });
});

// ============================================================================
// 7. SIGLIP PAIRWISE SIGMOID LOSS & CLIP COMPARISON
// ============================================================================

describe("CLIP & SigLIP (Cross-Modal Pre-training)", () => {
  it("should calculate SigLIP pairwise binary sigmoid loss", () => {
    const points: EmbeddingPoint[] = [
      {
        id: "img_0",
        label: "Cat (Img)",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "image",
        pairId: "txt_0",
        color: "#38bdf8",
      },
      {
        id: "txt_0",
        label: "Cat (Txt)",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "text",
        pairId: "img_0",
        color: "#38bdf8",
      },
      {
        id: "img_1",
        label: "Car (Img)",
        vector: [0, 1, 0],
        clusterId: 1,
        modality: "image",
        pairId: "txt_1",
        color: "#34d399",
      },
      {
        id: "txt_1",
        label: "Car (Txt)",
        vector: [0, 1, 0],
        clusterId: 1,
        modality: "text",
        pairId: "img_1",
        color: "#34d399",
      },
    ];

    const siglipRes = computeSigLIPLoss(points, 0.1, -5.0);
    expect(siglipRes.loss).toBeGreaterThan(0);
    expect(siglipRes.gradients.length).toBe(4);
    expect(siglipRes.probabilities.length).toBe(4);
  });

  it("should compute numerical sigmoid function with bounding", () => {
    expect(sigmoid(0)).toBeCloseTo(0.5, 6);
    expect(sigmoid(50)).toBe(1.0);
    expect(sigmoid(-50)).toBe(0.0);
    expect(sigmoid(2)).toBeCloseTo(1 / (1 + Math.exp(-2)), 6);
  });
});

// ============================================================================
// 8. SINGULAR VALUE SPECTRUM & EFFECTIVE RANK
// ============================================================================

describe("Singular Value Spectrum & Effective Rank Analysis", () => {
  it("should compute eigenvalues accurately using 3x3 Jacobi solver", () => {
    const diagMatrix = [
      [9, 0, 0],
      [0, 4, 0],
      [0, 0, 1],
    ];
    const eig = compute3x3Eigenvalues(diagMatrix);
    expect(eig[0]).toBeCloseTo(9, 6);
    expect(eig[1]).toBeCloseTo(4, 6);
    expect(eig[2]).toBeCloseTo(1, 6);
  });

  it("should detect complete 1D dimensional collapse (EffRank ~ 1.0)", () => {
    const rng = new SeededRNG(42);
    const collapsedPoints = generateDimensionalCollapseDataset(rng, 10);
    const rankAnalysis = computeSingularValueSpectrum(collapsedPoints);

    expect(rankAnalysis.effectiveRank).toBeLessThan(1.4);
    expect(rankAnalysis.collapseStatus).toBe("collapsed");
  });

  it("should compute near-maximal Effective Rank ~ 3.0 on isotropic distribution", () => {
    // Generate orthogonal basis pairs spanning all 3 dimensions
    const isotropicPoints: EmbeddingPoint[] = [
      {
        id: "1",
        label: "1",
        vector: [1, 0, 0],
        clusterId: 0,
        modality: "view1",
        pairId: "2",
        color: "#fff",
      },
      {
        id: "2",
        label: "2",
        vector: [-1, 0, 0],
        clusterId: 0,
        modality: "view2",
        pairId: "1",
        color: "#fff",
      },
      {
        id: "3",
        label: "3",
        vector: [0, 1, 0],
        clusterId: 1,
        modality: "view1",
        pairId: "4",
        color: "#fff",
      },
      {
        id: "4",
        label: "4",
        vector: [0, -1, 0],
        clusterId: 1,
        modality: "view2",
        pairId: "3",
        color: "#fff",
      },
      {
        id: "5",
        label: "5",
        vector: [0, 0, 1],
        clusterId: 2,
        modality: "view1",
        pairId: "6",
        color: "#fff",
      },
      {
        id: "6",
        label: "6",
        vector: [0, 0, -1],
        clusterId: 2,
        modality: "view2",
        pairId: "5",
        color: "#fff",
      },
    ];

    const rankAnalysis = computeSingularValueSpectrum(isotropicPoints);
    expect(rankAnalysis.effectiveRank).toBeGreaterThan(2.85);
    expect(rankAnalysis.collapseStatus).toBe("isotropic");
  });
});

// ============================================================================
// 9. BENCHMARK DATASET GENERATORS (5 DATASETS)
// ============================================================================

describe("5 Benchmark Representation Datasets", () => {
  it("should generate image-text cross-modal pairing dataset", () => {
    const rng = new SeededRNG(101);
    const points = generateImageTextDataset(rng, 6);
    expect(points.length).toBe(12);

    const imgPoints = points.filter((p) => p.modality === "image");
    const txtPoints = points.filter((p) => p.modality === "text");
    expect(imgPoints.length).toBe(6);
    expect(txtPoints.length).toBe(6);

    // Each image point must have a text partner
    imgPoints.forEach((ip) => {
      expect(ip.pairId).toBeDefined();
      const match = txtPoints.find((tp) => tp.id === ip.pairId);
      expect(match).toBeDefined();
    });
  });

  it("should generate multi-view stochastic augmentation dataset", () => {
    const rng = new SeededRNG(202);
    const points = generateAugmentationDataset(rng, 8);
    expect(points.length).toBe(16);

    const v1 = points.filter((p) => p.modality === "view1");
    const v2 = points.filter((p) => p.modality === "view2");
    expect(v1.length).toBe(8);
    expect(v2.length).toBe(8);
  });

  it("should generate clustered hypersphere manifold dataset", () => {
    const rng = new SeededRNG(303);
    const points = generateClusteredHypersphereDataset(rng, 4, 4);
    expect(points.length).toBe(16);
    // Distinct cluster assignments
    const clusterIds = new Set(points.map((p) => p.clusterId));
    expect(clusterIds.size).toBe(4);
  });

  it("should generate hard negatives geometry dataset", () => {
    const rng = new SeededRNG(404);
    const points1 = generateHardNegativesDataset(rng, 4, 1);
    expect(points1.length).toBe(8);

    const points2 = generateHardNegativesDataset(rng, 4, 2);
    expect(points2.length).toBe(16);
  });

  it("should dispatch all 5 dataset generators via generic dispatcher", () => {
    const rng = new SeededRNG(505);
    const ds1 = generateBenchmarkDataset("image_text_pairing", 6, rng);
    const ds2 = generateBenchmarkDataset("data_augmentation_views", 6, rng);
    const ds3 = generateBenchmarkDataset("clustered_hypersphere", 6, rng);
    const ds4 = generateBenchmarkDataset("hard_negatives_geometry", 6, rng);
    const ds5 = generateBenchmarkDataset("dimensional_collapse_sandbox", 6, rng);

    expect(ds1.length).toBeGreaterThan(0);
    expect(ds2.length).toBeGreaterThan(0);
    expect(ds3.length).toBeGreaterThan(0);
    expect(ds4.length).toBeGreaterThan(0);
    expect(ds5.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 10. CONTRASTIVE OPTIMIZATION EXECUTION (ALL 4 PARADIGMS)
// ============================================================================

describe("Single-Step Contrastive Optimizer Execution", () => {
  const setupInitialState = (): OptimizationState => {
    const rng = new SeededRNG(42);
    const points = generateAugmentationDataset(rng, 6);
    const rankAnalysis = computeSingularValueSpectrum(points);
    const simData = computeSimilarityMatrixData(points, 0.1);
    const alignMetrics = computeWangIsolaAlignment(points, 2.0);
    const unifMetrics = computeWangIsolaUniformity(points, 2.0);

    return {
      step: 0,
      points,
      targetPoints: points.map((p) => ({ ...p, vector: [...p.vector] as Vector3 })),
      predictorMatrix: createIdentityMatrix3x3(),
      velocities: points.map(() => [0, 0, 0]),
      metrics: {
        step: 0,
        loss: 0,
        alignmentLoss: alignMetrics.loss,
        uniformityLoss: unifMetrics.loss,
        contrastMargin: simData.contrastMargin,
        effectiveRank: rankAnalysis.effectiveRank,
        meanPosSim: simData.meanPosSim,
        meanNegSim: simData.meanNegSim,
        temperature: 0.1,
      },
      history: [],
      paretoTrajectory: [],
    };
  };

  const defaultParams: AlgorithmHyperparameters = {
    temperature: 0.1,
    learningRate: 0.05,
    batchSize: 6,
    alignmentAlpha: 2.0,
    uniformityT: 2.0,
    uniformityWeight: 1.0,
    byolMomentum: 0.99,
    siglipBias: -5.0,
    useSigLIP: true,
    momentumFactor: 0.9,
    seed: 42,
  };

  it("should step SimCLR optimization and preserve unit sphere constraint", () => {
    const initialState = setupInitialState();
    const nextState = stepContrastiveOptimization(initialState, "simclr", defaultParams);

    expect(nextState.step).toBe(1);
    expect(nextState.history.length).toBe(1);
    expect(nextState.points.length).toBe(initialState.points.length);

    // Verify all points remain strictly on the unit sphere
    nextState.points.forEach((p) => {
      expect(norm3D(p.vector)).toBeCloseTo(1.0, 6);
    });
  });

  it("should step Wang & Isola optimization and record Pareto coordinates", () => {
    const initialState = setupInitialState();
    const nextState = stepContrastiveOptimization(initialState, "wang_isola", defaultParams);

    expect(nextState.step).toBe(1);
    expect(nextState.paretoTrajectory.length).toBe(1);
    expect(nextState.paretoTrajectory[0].align).toBeGreaterThan(0);
  });

  it("should step BYOL optimization and update target EMA network", () => {
    const initialState = setupInitialState();
    const nextState = stepContrastiveOptimization(initialState, "byol", defaultParams);

    expect(nextState.step).toBe(1);
    expect(nextState.targetPoints).toBeDefined();
    expect(nextState.targetPoints!.length).toBe(initialState.points.length);
  });

  it("should step CLIP/SigLIP optimization and update representations", () => {
    const initialState = setupInitialState();
    const nextStateSigLIP = stepContrastiveOptimization(initialState, "clip_siglip", defaultParams);
    expect(nextStateSigLIP.step).toBe(1);

    const nextStateCLIP = stepContrastiveOptimization(initialState, "clip_siglip", {
      ...defaultParams,
      useSigLIP: false,
    });
    expect(nextStateCLIP.step).toBe(1);
  });
});

// ============================================================================
// 11. PRESET CONFIGURATIONS & METADATA INTEGRITY
// ============================================================================

describe("Preset Configurations & Metadata Integrity", () => {
  it("should contain complete preset configurations for all target benchmarks", () => {
    const presets = Object.values(CONTRASTIVE_STUDIO_PRESETS);
    expect(presets.length).toBe(6);

    presets.forEach((p) => {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.description).toBeDefined();
      expect(p.paradigmId).toBeDefined();
      expect(p.datasetId).toBeDefined();
      expect(p.educationalInsight).toBeDefined();
    });
  });

  it("should contain comprehensive theory metadata for all 4 contrastive paradigms", () => {
    const paradigms = Object.values(CONTRASTIVE_PARADIGM_INFOS);
    expect(paradigms.length).toBe(4);

    paradigms.forEach((p) => {
      expect(p.name).toBeDefined();
      expect(p.authors).toBeDefined();
      expect(p.year).toBeGreaterThanOrEqual(2020);
      expect(p.formula).toBeDefined();
      expect(p.primaryPros.length).toBeGreaterThan(0);
      expect(p.primaryCons.length).toBeGreaterThan(0);
    });
  });

  it("should project 3D coordinates to canvas screen view with depth ordering", () => {
    const camera = { azimuth: 0, elevation: 0, zoom: 1.0, autoRotate: false };
    const pFront: Vector3 = [0, 0, 1];
    const pBack: Vector3 = [0, 0, -1];

    const projFront = project3DToHypersphereView(pFront, camera, 600, 400);
    const projBack = project3DToHypersphereView(pBack, camera, 600, 400);

    expect(projFront.zDepth).toBeGreaterThan(projBack.zDepth);
  });
});
