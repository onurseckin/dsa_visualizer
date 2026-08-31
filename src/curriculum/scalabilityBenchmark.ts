/**
 * Empirical Scalability Benchmark & Curve Fitting Engine
 *
 * Implements statistical benchmarking, log-log least-squares regression for asymptotic
 * complexity classification (O(1), O(log N), O(N), O(N log N), O(N^2), O(N^3), O(2^N)),
 * and hardware cache inflection cliff detection (L1, L2, L3, DRAM).
 */

export interface BenchmarkDataPoint {
  readonly n: number;
  readonly samplesCount: number;
  readonly medianTimeMs: number;
  readonly meanTimeMs: number;
  readonly stdDevMs: number;
  readonly minTimeMs: number;
  readonly maxTimeMs: number;
  readonly opsPerSec: number;
  readonly workingSetBytes: number;
}

export type AsymptoticComplexityClass =
  | "O(1)"
  | "O(log N)"
  | "O(N)"
  | "O(N log N)"
  | "O(N^2)"
  | "O(N^3)"
  | "O(2^N)";

export interface CurveFitResult {
  readonly complexityClass: AsymptoticComplexityClass;
  readonly logLogSlope: number; // \alpha in T(N) = c * N^\alpha
  readonly coefficient: number; // c in T(N) = c * N^\alpha
  readonly rSquared: number; // 0.0 to 1.0
  readonly confidenceLevel: "High" | "Medium" | "Low";
  readonly modelEquations: {
    readonly fitted: string;
    readonly theoreticalComparison: string;
  };
}

export interface CacheInflectionPoint {
  readonly boundaryType: "L1" | "L2" | "L3" | "DRAM";
  readonly thresholdBytes: number;
  readonly crossedAtN: number;
  readonly workingSetBytes: number;
  readonly latencyMultiplier: number;
  readonly description: string;
}

export interface ScalabilityAnalysisReport {
  readonly algorithmName: string;
  readonly scalePoints: readonly BenchmarkDataPoint[];
  readonly curveFit: CurveFitResult;
  readonly cacheInflections: readonly CacheInflectionPoint[];
  readonly theoreticalVsEmpiricalMatch: boolean;
  readonly hardwareBottlenecks: readonly string[];
}

export interface BenchmarkExecutionOptions<T> {
  readonly name: string;
  readonly scalePoints?: readonly number[];
  readonly warmupIterations?: number;
  readonly sampleIterations?: number;
  readonly bytesPerElement?: number;
  readonly setup: (n: number) => T;
  readonly run: (input: T, n: number) => void;
}

/**
 * Standard CPU cache sizes in bytes (x86_64 / ARM64 defaults).
 */
export const CACHE_THRESHOLDS = {
  L1: 32 * 1024, // 32 KB
  L2: 512 * 1024, // 512 KB
  L3: 32 * 1024 * 1024, // 32 MB
} as const;

/**
 * Benchmarks an algorithm synchronously across scale points, gathering timing distributions.
 */
export function benchmarkAlgorithmScaling<T>(
  options: BenchmarkExecutionOptions<T>,
): BenchmarkDataPoint[] {
  const {
    scalePoints = [10, 50, 100, 500, 1000, 5000, 10000],
    warmupIterations = 3,
    sampleIterations = 10,
    bytesPerElement = 4,
    setup,
    run,
  } = options;

  const dataPoints: BenchmarkDataPoint[] = [];

  for (const n of scalePoints) {
    const input = setup(n);

    // Warmup phase
    for (let w = 0; w < warmupIterations; w++) {
      run(input, n);
    }

    // Measurement phase
    const samples: number[] = [];
    for (let s = 0; s < sampleIterations; s++) {
      const start = performance.now();
      run(input, n);
      const elapsed = performance.now() - start;
      samples.push(elapsed);
    }

    samples.sort((a, b) => a - b);
    const minTimeMs = samples[0];
    const maxTimeMs = samples[samples.length - 1];
    const medianTimeMs =
      samples.length % 2 === 1
        ? samples[Math.floor(samples.length / 2)]
        : (samples[samples.length / 2 - 1] + samples[samples.length / 2]) / 2;

    const sum = samples.reduce((acc, val) => acc + val, 0);
    const meanTimeMs = sum / samples.length;
    const variance =
      samples.reduce((acc, val) => acc + Math.pow(val - meanTimeMs, 2), 0) /
      Math.max(1, samples.length - 1);
    const stdDevMs = Math.sqrt(variance);

    const safeMedianSec = Math.max(medianTimeMs / 1000, 1e-9);
    const opsPerSec = Math.round(1 / safeMedianSec);
    const workingSetBytes = n * bytesPerElement;

    dataPoints.push({
      n,
      samplesCount: sampleIterations,
      medianTimeMs,
      meanTimeMs,
      stdDevMs,
      minTimeMs,
      maxTimeMs,
      opsPerSec,
      workingSetBytes,
    });
  }

  return dataPoints;
}

/**
 * Fits asymptotic complexity curve using log-log least-squares regression.
 */
export function fitAsymptoticComplexity(dataPoints: readonly BenchmarkDataPoint[]): CurveFitResult {
  if (dataPoints.length === 0) {
    return {
      complexityClass: "O(1)",
      logLogSlope: 0,
      coefficient: 0,
      rSquared: 0,
      confidenceLevel: "Low",
      modelEquations: {
        fitted: "T(N) = 0",
        theoreticalComparison: "Insufficient data points",
      },
    };
  }

  const validPoints = dataPoints.filter((p) => p.n > 0 && p.medianTimeMs >= 0);
  if (validPoints.length < 2) {
    return {
      complexityClass: "O(1)",
      logLogSlope: 0,
      coefficient: validPoints[0]?.medianTimeMs ?? 0,
      rSquared: 1.0,
      confidenceLevel: "Low",
      modelEquations: {
        fitted: `T(N) = ${(validPoints[0]?.medianTimeMs ?? 0).toFixed(4)} ms`,
        theoreticalComparison: "Single data point",
      },
    };
  }

  const k = validPoints.length;
  const x = validPoints.map((p) => Math.log(p.n));
  // Use minimum positive epsilon to prevent log(0)
  const y = validPoints.map((p) => Math.log(Math.max(p.medianTimeMs, 1e-6)));

  const meanX = x.reduce((acc, v) => acc + v, 0) / k;
  const meanY = y.reduce((acc, v) => acc + v, 0) / k;

  let num = 0;
  let den = 0;

  for (let i = 0; i < k; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    den += dx * dx;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  const coefficient = Math.exp(intercept);

  // Compute R^2 goodness of fit
  let ssTot = 0;
  let ssRes = 0;

  for (let i = 0; i < k; i++) {
    const yPred = intercept + slope * x[i];
    ssTot += Math.pow(y[i] - meanY, 2);
    ssRes += Math.pow(y[i] - yPred, 2);
  }

  let rSquared = ssTot > 1e-9 ? Math.max(0, 1 - ssRes / ssTot) : 1.0;
  rSquared = Math.min(1.0, Math.round(rSquared * 10000) / 10000);

  // Classify Complexity
  let complexityClass: AsymptoticComplexityClass = "O(N)";

  if (slope < 0.2) {
    complexityClass = "O(1)";
  } else if (slope < 0.6) {
    complexityClass = "O(log N)";
  } else if (slope >= 0.6 && slope < 1.15) {
    // Distinguish between O(N) and O(N log N) by comparing normalized variance
    const nRatios = validPoints.map((p) => Math.max(p.medianTimeMs, 1e-6) / p.n);
    const nLogNRatios = validPoints.map(
      (p) => Math.max(p.medianTimeMs, 1e-6) / (p.n * Math.log2(Math.max(p.n, 2))),
    );

    const varN = calculateCoefficientOfVariation(nRatios);
    const varNLogN = calculateCoefficientOfVariation(nLogNRatios);

    complexityClass = varNLogN < varN && slope > 0.95 ? "O(N log N)" : "O(N)";
  } else if (slope >= 1.15 && slope < 1.45) {
    complexityClass = "O(N log N)";
  } else if (slope >= 1.45 && slope < 2.3) {
    complexityClass = "O(N^2)";
  } else if (slope >= 2.3 && slope < 3.4) {
    complexityClass = "O(N^3)";
  } else {
    complexityClass = "O(2^N)";
  }

  const confidenceLevel: CurveFitResult["confidenceLevel"] =
    rSquared >= 0.95 ? "High" : rSquared >= 0.8 ? "Medium" : "Low";

  const fittedEquation = `T(N) = ${coefficient.toExponential(3)} * N^${slope.toFixed(2)}`;
  const theoreticalComparison = `Empirical slope α = ${slope.toFixed(3)} corresponds to ${complexityClass} (R² = ${rSquared.toFixed(4)})`;

  return {
    complexityClass,
    logLogSlope: Math.round(slope * 1000) / 1000,
    coefficient,
    rSquared,
    confidenceLevel,
    modelEquations: {
      fitted: fittedEquation,
      theoreticalComparison,
    },
  };
}

function calculateCoefficientOfVariation(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (Math.abs(mean) < 1e-9) return 0;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Detects performance cliffs where memory access exceeds L1/L2/L3 cache capacity.
 */
export function detectCacheInflectionPoints(
  dataPoints: readonly BenchmarkDataPoint[],
): CacheInflectionPoint[] {
  const inflections: CacheInflectionPoint[] = [];

  const boundaries: { type: "L1" | "L2" | "L3"; threshold: number; name: string }[] = [
    { type: "L1", threshold: CACHE_THRESHOLDS.L1, name: "L1 Data Cache (32 KB)" },
    { type: "L2", threshold: CACHE_THRESHOLDS.L2, name: "L2 Unified Cache (512 KB)" },
    { type: "L3", threshold: CACHE_THRESHOLDS.L3, name: "L3 Last-Level Cache (32 MB)" },
  ];

  for (let i = 0; i < dataPoints.length - 1; i++) {
    const p1 = dataPoints[i];
    const p2 = dataPoints[i + 1];

    for (const b of boundaries) {
      if (p1.workingSetBytes < b.threshold && p2.workingSetBytes >= b.threshold) {
        // Normalize by N to see per-element latency penalty
        const unitCost1 = p1.medianTimeMs / p1.n;
        const unitCost2 = p2.medianTimeMs / p2.n;
        const multiplier = unitCost1 > 0 ? unitCost2 / unitCost1 : 1.0;

        inflections.push({
          boundaryType: b.type,
          thresholdBytes: b.threshold,
          crossedAtN: p2.n,
          workingSetBytes: p2.workingSetBytes,
          latencyMultiplier: Math.round(multiplier * 100) / 100,
          description: `Working set (${(p2.workingSetBytes / 1024).toFixed(1)} KB) exceeds ${b.name}, causing L1/L2 cache misses and DRAM bus latency penalties.`,
        });
      }
    }
  }

  return inflections;
}

/**
 * Performs full scalability analysis combining curve fitting, cache detection, and bottleneck diagnosis.
 */
export function analyzeScalability(
  algorithmName: string,
  dataPoints: readonly BenchmarkDataPoint[],
  expectedTheoretical?: AsymptoticComplexityClass,
): ScalabilityAnalysisReport {
  const curveFit = fitAsymptoticComplexity(dataPoints);
  const cacheInflections = detectCacheInflectionPoints(dataPoints);

  const theoreticalVsEmpiricalMatch = expectedTheoretical
    ? curveFit.complexityClass === expectedTheoretical
    : true;

  const bottlenecks: string[] = [];

  if (curveFit.complexityClass === "O(N^2)" || curveFit.complexityClass === "O(N^3)") {
    bottlenecks.push(
      "Algorithmic Complexity: Polynomial scaling bounds practical throughput on large inputs.",
    );
  }

  if (cacheInflections.length > 0) {
    bottlenecks.push(
      `Cache Thrashing: Working set crossed ${cacheInflections.map((c) => c.boundaryType).join(", ")} boundaries resulting in non-linear DRAM latency cliffs.`,
    );
  }

  if (curveFit.rSquared < 0.85) {
    bottlenecks.push(
      "Measurement Noise / GC Jitter: Low R² score indicates Garbage Collector pauses or CPU frequency throttling.",
    );
  }

  return {
    algorithmName,
    scalePoints: dataPoints,
    curveFit,
    cacheInflections,
    theoreticalVsEmpiricalMatch,
    hardwareBottlenecks: bottlenecks,
  };
}
