import { describe, expect, it } from "bun:test";
import React from "react";
import {
  VectorDBRetrievalWorkbench,
  VECTOR_DB_PRESETS,
  euclideanDistance,
  cosineDistance,
  dotProductSimilarity,
  manhattanDistance,
  computeDistance,
  generateVectorDataset,
  flatScanSearch,
  buildKDTree,
  kdTreeSearch,
  buildIVFIndex,
  ivfSearch,
  buildPQIndex,
  computeADCTable,
  pqSearch,
  buildHNSWIndex,
  hnswSearch,
  calculateRecallAtK,
  generateRecallVsLatencyCurve,
  type DatasetDistribution,
  type PresetId,
} from "../../components/primitives";

describe("VectorDBRetrievalWorkbench & ANN Indexing Suite", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PRESETS
  // ==========================================================================
  describe("1. Component Instantiation & Presets", () => {
    it("should instantiate VectorDBRetrievalWorkbench with default props", () => {
      const element = React.createElement(VectorDBRetrievalWorkbench, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(VectorDBRetrievalWorkbench);
    });

    it("should instantiate VectorDBRetrievalWorkbench with custom props and handlers", () => {
      const onQueryChangeMock = () => {};
      const onAlgorithmChangeMock = () => {};

      const element = React.createElement(VectorDBRetrievalWorkbench, {
        initialAlgorithm: "ivf",
        initialMetric: "cosine",
        initialK: 8,
        initialPreset: "image_ivf_pq",
        className: "custom-workbench-class",
        title: "Test Vector DB Studio",
        standalone: true,
        onQueryChange: onQueryChangeMock,
        onAlgorithmChange: onAlgorithmChangeMock,
      });

      expect(element.props.initialAlgorithm).toBe("ivf");
      expect(element.props.initialMetric).toBe("cosine");
      expect(element.props.initialK).toBe(8);
      expect(element.props.initialPreset).toBe("image_ivf_pq");
      expect(element.props.className).toBe("custom-workbench-class");
      expect(element.props.title).toBe("Test Vector DB Studio");
      expect(element.props.standalone).toBe(true);
    });

    it("should provide well-formed configurations for all predefined presets", () => {
      const presetIds: PresetId[] = [
        "semantic_text",
        "image_ivf_pq",
        "spatial_gis",
        "flat_golden",
        "adversarial_hubness",
      ];

      for (const pId of presetIds) {
        const p = VECTOR_DB_PRESETS[pId];
        expect(p).toBeDefined();
        expect(p.id).toBe(pId);
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.description.length).toBeGreaterThan(0);
        expect(["flat", "kd_tree", "ivf", "pq", "hnsw"]).toContain(p.algorithm);
        expect(["l2", "cosine", "dot", "manhattan"]).toContain(p.metric);
        expect(p.numPoints).toBeGreaterThan(0);
        expect(p.k).toBeGreaterThan(0);
        expect(p.query.length).toBe(2);
        expect(p.theoryNotes.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 2. MATHEMATICAL DISTANCE METRICS
  // ==========================================================================
  describe("2. Mathematical Distance Metrics", () => {
    it("should compute exact Euclidean distance (L2)", () => {
      const a = [0, 0];
      const b = [3, 4];
      expect(euclideanDistance(a, b)).toBe(5);

      // Identity & Symmetry
      expect(euclideanDistance(a, a)).toBe(0);
      expect(euclideanDistance(a, b)).toBe(euclideanDistance(b, a));

      // Triangle inequality: d(A, C) <= d(A, B) + d(B, C)
      const c = [6, 0];
      const dAC = euclideanDistance(a, c);
      const dAB = euclideanDistance(a, b);
      const dBC = euclideanDistance(b, c);
      expect(dAC).toBeLessThanOrEqual(dAB + dBC + 1e-9);
    });

    it("should compute exact Cosine distance (1 - cos(theta))", () => {
      const a = [1, 0];
      const b = [0, 1];
      const c = [2, 0];
      const d = [-1, 0];

      // Orthogonal vectors: dot = 0 => cosine distance = 1 - 0 = 1
      expect(cosineDistance(a, b)).toBeCloseTo(1.0, 6);

      // Parallel collinear vectors: dot / (norm*norm) = 1 => cosine distance = 0
      expect(cosineDistance(a, c)).toBeCloseTo(0.0, 6);

      // Opposite vectors: dot = -1 => cosine distance = 1 - (-1) = 2
      expect(cosineDistance(a, d)).toBeCloseTo(2.0, 6);

      // Scale invariance: cosineDistance(v, 5*v) = 0
      expect(cosineDistance([1, 2, 3], [5, 10, 15])).toBeCloseTo(0.0, 6);

      // Zero vector fallback
      expect(cosineDistance([0, 0], [1, 1])).toBe(1.0);
    });

    it("should compute exact Dot Product similarity", () => {
      const a = [2, 3];
      const b = [4, -1];
      // 2*4 + 3*(-1) = 8 - 3 = 5
      expect(dotProductSimilarity(a, b)).toBe(5);

      const c = [1, 0];
      const d = [0, 1];
      expect(dotProductSimilarity(c, d)).toBe(0);
    });

    it("should compute exact Manhattan distance (L1)", () => {
      const a = [1, 2];
      const b = [4, 6];
      // |1-4| + |2-6| = 3 + 4 = 7
      expect(manhattanDistance(a, b)).toBe(7);

      expect(manhattanDistance(a, a)).toBe(0);
      expect(manhattanDistance(a, b)).toBe(manhattanDistance(b, a));
    });

    it("should dispatch correct metric via computeDistance helper", () => {
      const a = [0, 0];
      const b = [3, 4];

      expect(computeDistance(a, b, "l2")).toBe(5);
      expect(computeDistance(a, b, "manhattan")).toBe(7);
      expect(computeDistance([1, 0], [0, 1], "cosine")).toBeCloseTo(1.0, 6);
      expect(computeDistance([2, 3], [4, 1], "dot")).toBe(-11); // -dot product for minimization
    });
  });

  // ==========================================================================
  // 3. DATASET GENERATION
  // ==========================================================================
  describe("3. Dataset Generation", () => {
    const distributions: DatasetDistribution[] = [
      "gaussian_clusters",
      "uniform",
      "concentric_rings",
      "swiss_roll",
      "adversarial_hubness",
    ];

    for (const dist of distributions) {
      it(`should generate valid dataset for distribution: ${dist}`, () => {
        const dataset = generateVectorDataset({
          distribution: dist,
          numPoints: 50,
          dimensions: 2,
          noise: 0.15,
          seed: 42,
        });

        expect(dataset.length).toBe(50);
        for (const pt of dataset) {
          expect(pt.id).toBeDefined();
          expect(pt.vector.length).toBe(2);
          expect(Number.isFinite(pt.vector[0])).toBe(true);
          expect(Number.isFinite(pt.vector[1])).toBe(true);
        }
      });
    }

    it("should produce deterministic reproducible points when seed is fixed", () => {
      const ds1 = generateVectorDataset({
        distribution: "gaussian_clusters",
        numPoints: 30,
        dimensions: 2,
        seed: 12345,
      });

      const ds2 = generateVectorDataset({
        distribution: "gaussian_clusters",
        numPoints: 30,
        dimensions: 2,
        seed: 12345,
      });

      expect(ds1.length).toBe(ds2.length);
      for (let i = 0; i < ds1.length; i++) {
        expect(ds1[i].vector[0]).toBe(ds2[i].vector[0]);
        expect(ds1[i].vector[1]).toBe(ds2[i].vector[1]);
      }
    });
  });

  // ==========================================================================
  // 4. FLAT SCAN (EXACT GROUND TRUTH)
  // ==========================================================================
  describe("4. Flat Scan Search (Golden Baseline)", () => {
    const dataset = generateVectorDataset({
      distribution: "gaussian_clusters",
      numPoints: 40,
      dimensions: 2,
      seed: 100,
    });
    const query = [0.5, 0.5];
    const k = 5;

    it("should retrieve top-k sorted by ascending distance", () => {
      const result = flatScanSearch(query, dataset, k, "l2");
      expect(result.neighbors.length).toBe(k);
      expect(result.distanceComputations).toBe(dataset.length);
      expect(result.recall).toBe(1.0);

      // Verify strict monotonicity
      for (let i = 1; i < result.neighbors.length; i++) {
        expect(result.neighbors[i].distance).toBeGreaterThanOrEqual(
          result.neighbors[i - 1].distance,
        );
        expect(result.neighbors[i].rank).toBe(i + 1);
      }
    });

    it("should record trace steps during flat scan", () => {
      const result = flatScanSearch(query, dataset, k, "l2");
      expect(result.traceSteps.length).toBeGreaterThan(0);
      expect(result.traceSteps[0].action).toBe("init");
      expect(result.traceSteps[result.traceSteps.length - 1].action).toBe("finalize");
    });
  });

  // ==========================================================================
  // 5. K-D TREE SPATIAL INDEX
  // ==========================================================================
  describe("5. K-D Tree Indexing & Spatial Search", () => {
    const dataset = generateVectorDataset({
      distribution: "uniform",
      numPoints: 50,
      dimensions: 2,
      seed: 200,
    });
    const query = [0.0, 0.0];
    const k = 4;

    it("should build a valid K-D Tree structure", () => {
      const tree = buildKDTree(dataset);
      expect(tree).not.toBeNull();
      expect(tree?.point).toBeDefined();
      expect(tree?.bbox).toBeDefined();
      expect([0, 1]).toContain(tree?.splitAxis ?? -1);
    });

    it("should perform spatial search matching ground truth recall in 2D", () => {
      const tree = buildKDTree(dataset);
      const kdResult = kdTreeSearch(tree, query, k, "l2");
      const flatResult = flatScanSearch(query, dataset, k, "l2");

      expect(kdResult.neighbors.length).toBe(k);

      const kdIds = kdResult.neighbors.map((n) => n.point.id);
      const flatIds = flatResult.neighbors.map((n) => n.point.id);
      const recall = calculateRecallAtK(kdIds, flatIds, k);

      // In 2D exact K-D tree branch and bound guarantees 100% recall
      expect(recall).toBe(1.0);
    });

    it("should record visit and pruning trace steps", () => {
      const tree = buildKDTree(dataset);
      const kdResult = kdTreeSearch(tree, query, k, "l2");

      const actions = kdResult.traceSteps.map((s) => s.action);
      expect(actions).toContain("init");
      expect(actions).toContain("visit_node");
      expect(actions).toContain("finalize");
    });
  });

  // ==========================================================================
  // 6. INVERTED FILE INDEX (IVF)
  // ==========================================================================
  describe("6. IVF (Inverted File Index with Voronoi Partitioning)", () => {
    const dataset = generateVectorDataset({
      distribution: "gaussian_clusters",
      numPoints: 60,
      dimensions: 2,
      seed: 300,
    });
    const query = [1.0, 1.0];
    const k = 5;
    const nlist = 6;

    it("should build IVF index with nlist Voronoi centroids and assigned buckets", () => {
      const ivf = buildIVFIndex(dataset, nlist, "l2");
      expect(ivf.centroids.length).toBe(nlist);
      expect(ivf.invertedLists.size).toBe(nlist);

      // Total points across all buckets must equal dataset size
      let totalAssigned = 0;
      for (let c = 0; c < nlist; c++) {
        totalAssigned += ivf.invertedLists.get(c)?.length ?? 0;
      }
      expect(totalAssigned).toBe(dataset.length);
    });

    it("should scale recall as nprobe increases towards nlist", () => {
      const ivf = buildIVFIndex(dataset, nlist, "l2");
      const flatResult = flatScanSearch(query, dataset, k, "l2");
      const flatIds = flatResult.neighbors.map((n) => n.point.id);

      const resProbe1 = ivfSearch(ivf, query, k, 1, "l2");
      const resProbeFull = ivfSearch(ivf, query, k, nlist, "l2");

      const recall1 = calculateRecallAtK(
        resProbe1.neighbors.map((n) => n.point.id),
        flatIds,
        k,
      );
      const recallFull = calculateRecallAtK(
        resProbeFull.neighbors.map((n) => n.point.id),
        flatIds,
        k,
      );

      // Scanning all Voronoi cells guarantees 100% recall
      expect(recallFull).toBe(1.0);
      expect(recallFull).toBeGreaterThanOrEqual(recall1);
    });

    it("should record probe_cluster trace steps", () => {
      const ivf = buildIVFIndex(dataset, nlist, "l2");
      const res = ivfSearch(ivf, query, k, 2, "l2");
      const actions = res.traceSteps.map((s) => s.action);
      expect(actions).toContain("probe_cluster");
    });
  });

  // ==========================================================================
  // 7. PRODUCT QUANTIZATION (PQ & ADC)
  // ==========================================================================
  describe("7. Product Quantization (PQ with ADC)", () => {
    const dataset = generateVectorDataset({
      distribution: "concentric_rings",
      numPoints: 50,
      dimensions: 2,
      seed: 400,
    });
    const query = [0.8, -0.8];
    const M = 2; // 2 subspaces for 2D vectors
    const Ks = 4; // 4 codes per subspace

    it("should build PQ index and quantize points into codes", () => {
      const pq = buildPQIndex(dataset, M, Ks, "l2");
      expect(pq.codebooks.length).toBe(M);
      expect(pq.codebooks[0].length).toBe(Ks);

      for (const pt of pq.points) {
        expect(pt.subQuantCodes).toBeDefined();
        expect(pt.subQuantCodes?.length).toBe(M);
        for (const code of pt.subQuantCodes ?? []) {
          expect(code).toBeGreaterThanOrEqual(0);
          expect(code).toBeLessThan(Ks);
        }
      }
    });

    it("should compute Asymmetric Distance Table (ADC) of dimensions M x Ks", () => {
      const pq = buildPQIndex(dataset, M, Ks, "l2");
      const adcTable = computeADCTable(query, pq.codebooks, "l2");

      expect(adcTable.length).toBe(M);
      expect(adcTable[0].length).toBe(Ks);
      expect(adcTable[1].length).toBe(Ks);

      for (let m = 0; m < M; m++) {
        for (let k = 0; k < Ks; k++) {
          expect(adcTable[m][k]).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("should perform PQ ADC search with fixed initial distance operations", () => {
      const pq = buildPQIndex(dataset, M, Ks, "l2");
      const result = pqSearch(pq, query, 5);

      expect(result.neighbors.length).toBe(5);
      // Distance computations should strictly equal M * Ks
      expect(result.distanceComputations).toBe(M * Ks);
    });
  });

  // ==========================================================================
  // 8. HNSW GRAPH INDEX
  // ==========================================================================
  describe("8. HNSW (Hierarchical Navigable Small World)", () => {
    const dataset = generateVectorDataset({
      distribution: "gaussian_clusters",
      numPoints: 50,
      dimensions: 2,
      seed: 500,
    });
    const query = [1.2, 1.2];
    const k = 5;

    it("should construct multi-layer HNSW graph with entry point", () => {
      const hnsw = buildHNSWIndex(dataset, 4, 20, 1.0 / Math.log(4), "l2");
      expect(hnsw.entryPointId).not.toBeNull();
      expect(hnsw.nodes.size).toBe(dataset.length);
      expect(hnsw.maxLayer).toBeGreaterThanOrEqual(0);

      // Layer 0 must contain all nodes
      for (const pt of dataset) {
        const node = hnsw.nodes.get(pt.id);
        expect(node).toBeDefined();
        expect(node?.neighbors.has(0)).toBe(true);
      }
    });

    it("should perform multi-layer zoom and beam search with high recall", () => {
      const hnsw = buildHNSWIndex(dataset, 4, 25, 1.0 / Math.log(4), "l2");
      const flatResult = flatScanSearch(query, dataset, k, "l2");
      const flatIds = flatResult.neighbors.map((n) => n.point.id);

      const hnswResult = hnswSearch(hnsw, query, k, 20, "l2");
      expect(hnswResult.neighbors.length).toBe(k);

      const hnswIds = hnswResult.neighbors.map((n) => n.point.id);
      const recall = calculateRecallAtK(hnswIds, flatIds, k);
      expect(recall).toBeGreaterThanOrEqual(0.6); // HNSW achieves high recall
    });

    it("should increase or maintain recall as efSearch beam width expands", () => {
      const hnsw = buildHNSWIndex(dataset, 4, 25, 1.0 / Math.log(4), "l2");
      const flatResult = flatScanSearch(query, dataset, k, "l2");
      const flatIds = flatResult.neighbors.map((n) => n.point.id);

      const resEfSmall = hnswSearch(hnsw, query, k, 5, "l2");
      const resEfLarge = hnswSearch(hnsw, query, k, 35, "l2");

      const recallSmall = calculateRecallAtK(
        resEfSmall.neighbors.map((n) => n.point.id),
        flatIds,
        k,
      );
      const recallLarge = calculateRecallAtK(
        resEfLarge.neighbors.map((n) => n.point.id),
        flatIds,
        k,
      );

      expect(recallLarge).toBeGreaterThanOrEqual(recallSmall);
    });

    it("should generate trace steps for greedy hops and layer switches", () => {
      const hnsw = buildHNSWIndex(dataset, 4, 20, 1.0 / Math.log(4), "l2");
      const result = hnswSearch(hnsw, query, k, 15, "l2");

      const actions = result.traceSteps.map((s) => s.action);
      expect(actions).toContain("init");
      expect(actions).toContain("finalize");
    });
  });

  // ==========================================================================
  // 9. RECALL COMPUTATION & BENCHMARK CURVE
  // ==========================================================================
  describe("9. Recall@k & Benchmark Curve Generator", () => {
    it("should calculate exact Recall@k values", () => {
      const gt = ["a", "b", "c", "d", "e"];
      const retrievedFull = ["a", "b", "c", "d", "e"];
      const retrievedPartial = ["a", "x", "c", "y", "z"];
      const retrievedNone = ["1", "2", "3", "4", "5"];

      expect(calculateRecallAtK(retrievedFull, gt, 5)).toBe(1.0);
      expect(calculateRecallAtK(retrievedPartial, gt, 5)).toBe(0.4); // 2 out of 5
      expect(calculateRecallAtK(retrievedNone, gt, 5)).toBe(0.0);
      expect(calculateRecallAtK([], gt, 0)).toBe(0);
    });

    it("should generate valid Pareto trade-off benchmark curve", () => {
      const dataset = generateVectorDataset({
        distribution: "gaussian_clusters",
        numPoints: 40,
        dimensions: 2,
        seed: 600,
      });
      const queries = [
        [0.5, 0.5],
        [-0.5, -0.5],
      ];
      const sweep = [1, 2, 4];

      const curve = generateRecallVsLatencyCurve(dataset, queries, "ivf", "l2", 4, sweep);
      expect(curve.length).toBe(sweep.length);

      for (const pt of curve) {
        expect(pt.paramValue).toBeDefined();
        expect(pt.recall).toBeGreaterThanOrEqual(0);
        expect(pt.recall).toBeLessThanOrEqual(1.0);
        expect(pt.distanceComputations).toBeGreaterThan(0);
        expect(pt.latencyEstimateMs).toBeGreaterThan(0);
      }
    });
  });
});
