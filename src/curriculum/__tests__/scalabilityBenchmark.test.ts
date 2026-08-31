import { describe, expect, it } from "bun:test";
import {
  analyzeScalability,
  BenchmarkDataPoint,
  benchmarkAlgorithmScaling,
  detectCacheInflectionPoints,
  fitAsymptoticComplexity,
} from "../scalabilityBenchmark";

describe("Empirical Scalability Benchmark & Curve Fitting Engine Tests", () => {
  describe("1. Benchmark Execution & Sampling Engine", () => {
    it("should measure linear scan across scale points and collect statistical metrics", () => {
      const scalePoints = [100, 500, 1000, 2000];
      const dataPoints = benchmarkAlgorithmScaling({
        name: "Linear Array Sum",
        scalePoints,
        warmupIterations: 2,
        sampleIterations: 5,
        bytesPerElement: 4,
        setup: (n) => Array.from({ length: n }, (_, i) => i),
        run: (arr, n) => {
          let sum = 0;
          for (let i = 0; i < n; i++) {
            sum += arr[i];
          }
          return sum;
        },
      });

      expect(dataPoints.length).toBe(4);
      for (let i = 0; i < dataPoints.length; i++) {
        const dp = dataPoints[i];
        expect(dp.n).toBe(scalePoints[i]);
        expect(dp.samplesCount).toBe(5);
        expect(dp.medianTimeMs).toBeGreaterThanOrEqual(0);
        expect(dp.meanTimeMs).toBeGreaterThanOrEqual(0);
        expect(dp.minTimeMs).toBeLessThanOrEqual(dp.maxTimeMs);
        expect(dp.workingSetBytes).toBe(scalePoints[i] * 4);
        expect(dp.opsPerSec).toBeGreaterThan(0);
      }
    });
  });

  describe("2. Log-Log Asymptotic Curve Fitting", () => {
    it("should accurately classify simulated O(1) constant time scaling", () => {
      const dataPoints: BenchmarkDataPoint[] = [10, 50, 100, 500, 1000, 5000].map((n) => ({
        n,
        samplesCount: 10,
        medianTimeMs: 0.05 + Math.sin(n) * 0.001,
        meanTimeMs: 0.05,
        stdDevMs: 0.001,
        minTimeMs: 0.048,
        maxTimeMs: 0.052,
        opsPerSec: 20000,
        workingSetBytes: n * 4,
      }));

      const fit = fitAsymptoticComplexity(dataPoints);

      expect(fit.complexityClass).toBe("O(1)");
      expect(fit.logLogSlope).toBeLessThan(0.2);
      expect(fit.rSquared).toBeGreaterThanOrEqual(0);
    });

    it("should accurately classify simulated O(N) linear time scaling", () => {
      const dataPoints: BenchmarkDataPoint[] = [100, 500, 1000, 5000, 10000].map((n) => ({
        n,
        samplesCount: 10,
        medianTimeMs: 0.0005 * n,
        meanTimeMs: 0.0005 * n,
        stdDevMs: 0.001,
        minTimeMs: 0.00049 * n,
        maxTimeMs: 0.00051 * n,
        opsPerSec: 1 / (0.0005 * n),
        workingSetBytes: n * 4,
      }));

      const fit = fitAsymptoticComplexity(dataPoints);

      expect(fit.complexityClass).toBe("O(N)");
      expect(fit.logLogSlope).toBeGreaterThanOrEqual(0.95);
      expect(fit.logLogSlope).toBeLessThanOrEqual(1.05);
      expect(fit.rSquared).toBeGreaterThanOrEqual(0.99);
      expect(fit.confidenceLevel).toBe("High");
    });

    it("should accurately classify simulated O(N log N) sorting time scaling", () => {
      const dataPoints: BenchmarkDataPoint[] = [100, 500, 1000, 5000, 10000, 50000].map((n) => ({
        n,
        samplesCount: 10,
        medianTimeMs: 0.0001 * n * Math.log2(n),
        meanTimeMs: 0.0001 * n * Math.log2(n),
        stdDevMs: 0.01,
        minTimeMs: 0.00009 * n * Math.log2(n),
        maxTimeMs: 0.00011 * n * Math.log2(n),
        opsPerSec: 1000,
        workingSetBytes: n * 4,
      }));

      const fit = fitAsymptoticComplexity(dataPoints);

      expect(fit.complexityClass).toBe("O(N log N)");
      expect(fit.logLogSlope).toBeGreaterThanOrEqual(1.0);
      expect(fit.logLogSlope).toBeLessThan(1.4);
      expect(fit.rSquared).toBeGreaterThanOrEqual(0.98);
    });

    it("should accurately classify simulated O(N^2) quadratic time scaling", () => {
      const dataPoints: BenchmarkDataPoint[] = [10, 30, 100, 300, 1000].map((n) => ({
        n,
        samplesCount: 10,
        medianTimeMs: 0.00002 * Math.pow(n, 2),
        meanTimeMs: 0.00002 * Math.pow(n, 2),
        stdDevMs: 0.01,
        minTimeMs: 0.000019 * Math.pow(n, 2),
        maxTimeMs: 0.000021 * Math.pow(n, 2),
        opsPerSec: 1000,
        workingSetBytes: n * 4,
      }));

      const fit = fitAsymptoticComplexity(dataPoints);

      expect(fit.complexityClass).toBe("O(N^2)");
      expect(fit.logLogSlope).toBeGreaterThanOrEqual(1.95);
      expect(fit.logLogSlope).toBeLessThanOrEqual(2.05);
      expect(fit.rSquared).toBeGreaterThanOrEqual(0.99);
    });
  });

  describe("3. Hardware Cache Boundary Inflection Detection", () => {
    it("should detect L1 and L2 cache boundary threshold crossings", () => {
      // Scale points spanning from 4 KB to 2 MB (element size = 4 bytes)
      // N = 1000 -> 4 KB (< L1 32KB)
      // N = 10000 -> 40 KB (> L1 32KB, < L2 512KB)
      // N = 200000 -> 800 KB (> L2 512KB)
      const dataPoints: BenchmarkDataPoint[] = [
        {
          n: 1000,
          samplesCount: 10,
          medianTimeMs: 0.02, // 0.02 / 1000 = 0.00002 ms/elem
          meanTimeMs: 0.02,
          stdDevMs: 0.001,
          minTimeMs: 0.019,
          maxTimeMs: 0.021,
          opsPerSec: 50000,
          workingSetBytes: 1000 * 4, // 4 KB
        },
        {
          n: 10000,
          samplesCount: 10,
          medianTimeMs: 0.4, // 0.40 / 10000 = 0.00004 ms/elem (2x slowdown due to L1 miss)
          meanTimeMs: 0.4,
          stdDevMs: 0.01,
          minTimeMs: 0.39,
          maxTimeMs: 0.41,
          opsPerSec: 2500,
          workingSetBytes: 10000 * 4, // 40 KB (crosses 32KB L1)
        },
        {
          n: 200000,
          samplesCount: 10,
          medianTimeMs: 20.0, // 20.0 / 200000 = 0.00010 ms/elem (2.5x slowdown due to L2 miss)
          meanTimeMs: 20.0,
          stdDevMs: 0.5,
          minTimeMs: 19.5,
          maxTimeMs: 20.5,
          opsPerSec: 50,
          workingSetBytes: 200000 * 4, // 800 KB (crosses 512KB L2)
        },
      ];

      const inflections = detectCacheInflectionPoints(dataPoints);

      expect(inflections.length).toBe(2);
      expect(inflections[0].boundaryType).toBe("L1");
      expect(inflections[0].crossedAtN).toBe(10000);
      expect(inflections[0].latencyMultiplier).toBeGreaterThanOrEqual(1.5);

      expect(inflections[1].boundaryType).toBe("L2");
      expect(inflections[1].crossedAtN).toBe(200000);
      expect(inflections[1].latencyMultiplier).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe("4. Full Scalability Analysis Report", () => {
    it("should generate comprehensive report with bottleneck diagnostics", () => {
      const dataPoints: BenchmarkDataPoint[] = [100, 500, 1000, 5000].map((n) => ({
        n,
        samplesCount: 10,
        medianTimeMs: 0.0005 * n,
        meanTimeMs: 0.0005 * n,
        stdDevMs: 0.001,
        minTimeMs: 0.00049 * n,
        maxTimeMs: 0.00051 * n,
        opsPerSec: 1 / (0.0005 * n),
        workingSetBytes: n * 4,
      }));

      const report = analyzeScalability("Two Pointer Scan", dataPoints, "O(N)");

      expect(report.algorithmName).toBe("Two Pointer Scan");
      expect(report.theoreticalVsEmpiricalMatch).toBe(true);
      expect(report.curveFit.complexityClass).toBe("O(N)");
      expect(report.curveFit.confidenceLevel).toBe("High");
    });
  });
});
