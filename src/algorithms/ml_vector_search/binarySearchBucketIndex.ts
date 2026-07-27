import { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";

export interface BinarySearchBucketIndexInput {
  queryValue: number;
  bucketBoundaries: number[];
}

export const DEFAULT_BINARY_SEARCH_BUCKET_INDEX_INPUT: BinarySearchBucketIndexInput = {
  queryValue: 42.5,
  bucketBoundaries: [10.0, 25.0, 40.0, 55.0, 70.0, 85.0],
};

export const BINARY_SEARCH_BUCKET_INDEX_CODE = `def binary_search_bucket_index(query_val: float, boundaries: list[float]) -> int:
    """
    Finds the bucket index for a query value using binary search over sorted boundaries.
    Returns index i such that boundaries[i-1] <= query_val < boundaries[i].
    """
    low = 0
    high = len(boundaries) - 1
    target_bucket = len(boundaries)

    while low <= high:
        mid = (low + high) // 2
        if boundaries[mid] > query_val:
            target_bucket = mid
            high = mid - 1
        else:
            low = mid + 1

    return target_bucket`;

export const generateBinarySearchBucketIndexSteps = (
  input: BinarySearchBucketIndexInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { queryValue, bucketBoundaries } = input;
  const N = bucketBoundaries.length;

  let low = 0;
  let high = N - 1;
  let targetBucket = N;
  let stepIndex = 0;

  // Step 0: Initial state setup
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize Binary Search Bucket Locator",
      why: `Searching for bucket containing query_value = ${queryValue} within ${N} sorted partition boundaries [${bucketBoundaries.join(
        ", ",
      )}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: bucketBoundaries.map((val, idx) => ({
        id: `b-${idx}`,
        value: val,
        state: "default",
        pointers: idx === 0 ? ["low"] : idx === N - 1 ? ["high"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        queryValue: String(queryValue),
        low: String(low),
        high: String(high),
        targetBucket: String(targetBucket),
        phase: "Initial State",
      },
    },
    variables: { low, high, targetBucket, queryValue },
  });

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = bucketBoundaries[mid];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Calculate midpoint index mid = ${mid}`,
        why: `Evaluating boundary value boundaries[${mid}] = ${midVal} against queryValue = ${queryValue}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: bucketBoundaries.map((val, idx) => {
          let state: "default" | "active" | "visited" | "compare" = "default";
          if (idx === mid) state = "active";
          else if (idx >= low && idx <= high) state = "compare";
          else state = "visited";

          const ptrs: string[] = [];
          if (idx === low) ptrs.push("low");
          if (idx === mid) ptrs.push("mid");
          if (idx === high) ptrs.push("high");

          return { id: `b-${idx}`, value: val, state, pointers: ptrs };
        }),
      },
      auxiliaryState: {
        customState: {
          queryValue: String(queryValue),
          low: String(low),
          mid: String(mid),
          high: String(high),
          midValue: String(midVal),
          comparison:
            midVal > queryValue ? `${midVal} > ${queryValue}` : `${midVal} <= ${queryValue}`,
        },
      },
      variables: { low, mid, high, midVal, queryValue },
    });

    if (midVal > queryValue) {
      targetBucket = mid;
      high = mid - 1;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 13,
        explanation: {
          what: `Boundary boundaries[${mid}] (${midVal}) > queryValue (${queryValue})`,
          why: `Query falls to the left of index ${mid}. Update potential target bucket to ${mid} and contract high to ${high}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: bucketBoundaries.map((val, idx) => ({
            id: `b-${idx}`,
            value: val,
            state:
              idx === mid
                ? ("active" as const)
                : idx >= low && idx <= high
                  ? ("compare" as const)
                  : ("visited" as const),
            pointers: idx === targetBucket ? [`target=${targetBucket}`] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            queryValue: String(queryValue),
            low: String(low),
            high: String(high),
            targetBucket: String(targetBucket),
            action: "Shrink search space left",
          },
        },
        variables: { low, high, targetBucket },
      });
    } else {
      low = mid + 1;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 16,
        explanation: {
          what: `Boundary boundaries[${mid}] (${midVal}) <= queryValue (${queryValue})`,
          why: `Query falls to the right of index ${mid}. Advance low pointer to ${low}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: bucketBoundaries.map((val, idx) => ({
            id: `b-${idx}`,
            value: val,
            state:
              idx === mid
                ? ("active" as const)
                : idx >= low && idx <= high
                  ? ("compare" as const)
                  : ("visited" as const),
            pointers: idx === low ? ["low"] : idx === high ? ["high"] : [],
          })),
        },
        auxiliaryState: {
          customState: {
            queryValue: String(queryValue),
            low: String(low),
            high: String(high),
            targetBucket: String(targetBucket),
            action: "Shrink search space right",
          },
        },
        variables: { low, high, targetBucket },
      });
    }
  }

  // Final Step: Complete
  const lowerBound = targetBucket === 0 ? "-∞" : String(bucketBoundaries[targetBucket - 1]);
  const upperBound = targetBucket === N ? "+∞" : String(bucketBoundaries[targetBucket]);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: `Binary Search Complete: Assigned to Bucket ${targetBucket}`,
      why: `Query value ${queryValue} lies in range [${lowerBound}, ${upperBound}), corresponding to Bucket ${targetBucket}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: bucketBoundaries.map((val, idx) => ({
        id: `b-${idx}`,
        value: val,
        state: idx === targetBucket || idx === targetBucket - 1 ? "sorted" : "visited",
        pointers: idx === targetBucket ? [`Bucket ${targetBucket}`] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        queryValue: String(queryValue),
        assignedBucketIndex: String(targetBucket),
        bucketInterval: `[${lowerBound}, ${upperBound})`,
        status: "Completed",
      },
    },
    variables: { targetBucket, queryValue, complete: true },
  });

  return steps;
};

export const binarySearchBucketIndex: AlgorithmDefinition<BinarySearchBucketIndexInput> = {
  id: "binarySearchBucketIndex",
  title: "Binary Search Bucket Indexing",
  category: "ml_vector_search",
  categories: ["ml_vector_search", "binary_search"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
  description:
    "In high-dimensional vector search infrastructure and quantized spatial index engines (such as FAISS, ScaNN, Milvus, and Qdrant), binary search bucket indexing is used to locate target quantization bins or IVF (Inverted File) cluster boundaries in logarithmic O(log K) time.\n\nInput Format:\n- queryValue: Scalar numerical query projection or distance metric value.\n- bucketBoundaries: Monotonically sorted list of scalar partition thresholds.\n\nOutput Format:\n- Returns integer index `b` such that `boundaries[b-1] <= queryValue < boundaries[b]`.\n\nEdge Cases & Constraints:\n- Value below minimum boundary: Maps to bucket 0.\n- Value exceeding maximum boundary: Maps to bucket K.\n- Equal boundary values: Consistently resolves to upper bucket index.",
  constraints: [
    "bucketBoundaries must be sorted in strictly ascending order.",
    "1 <= len(bucketBoundaries) <= 1000 for standard indexing.",
  ],
  examples: [
    {
      kind: "basic",
      title: "Mid-Range Projection Mapping",
      inputDisplay: "queryValue = 42.5, boundaries = [10.0, 25.0, 40.0, 55.0, 70.0, 85.0]",
      outputDisplay: "Bucket Index 3 (Range: [40.0, 55.0))",
      input: DEFAULT_BINARY_SEARCH_BUCKET_INDEX_INPUT,
      output: "3",
      explanation: "42.5 falls between 40.0 and 55.0, corresponding to bucket index 3.",
    },
    {
      kind: "complex",
      title: "Out-of-Bounds High Query Value",
      inputDisplay: "queryValue = 95.0, boundaries = [10.0, 25.0, 40.0, 55.0, 70.0, 85.0]",
      outputDisplay: "Bucket Index 6 (Range: [85.0, +∞))",
      input: {
        queryValue: 95.0,
        bucketBoundaries: [10.0, 25.0, 40.0, 55.0, 70.0, 85.0],
      },
      output: "6",
      explanation:
        "95.0 exceeds all boundaries and is placed in the final rightmost overflow bucket.",
    },
    {
      kind: "negative",
      title: "Below Minimum Boundary Value",
      inputDisplay: "queryValue = 5.0, boundaries = [10.0, 25.0, 40.0, 55.0, 70.0, 85.0]",
      outputDisplay: "Bucket Index 0 (Range: [-∞, 10.0))",
      input: {
        queryValue: 5.0,
        bucketBoundaries: [10.0, 25.0, 40.0, 55.0, 70.0, 85.0],
      },
      output: "0",
      explanation: "5.0 is smaller than boundary 0 (10.0), mapping to bucket 0.",
    },
  ],
  defaultInput: DEFAULT_BINARY_SEARCH_BUCKET_INDEX_INPUT,
  code: BINARY_SEARCH_BUCKET_INDEX_CODE,
  timeComplexity: {
    best: "O(1)",
    average: "O(log K)",
    worst: "O(log K)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Logarithmic time O(log K) where K is the number of bucket boundaries, requiring at most log2(K) comparisons.",
    space: "O(1) auxiliary space as binary search only requires scalar pointers.",
  },
  topicGuide: {
    overview:
      "Binary search bucket indexing is a fundamental building block in modern vector databases (FAISS, Milvus, Qdrant) and scalar/product quantization pipelines. By organizing continuous distance metric spaces or scalar projection ranges into sorted bucket boundaries, systems can determine posting list routes or scalar quantization bins in O(log K) operations per query.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Given a monotonically increasing array of bucket boundaries B = [b_0, b_1, ..., b_{K-1}], the goal is to partition the continuous real line into K+1 intervals (-inf, b_0), [b_0, b_1), ..., [b_{K-1}, +inf). Binary search calculates mid = (low + high) // 2 and compares B[mid] against query scalar q, bisecting the search interval until convergence.",
      },
      {
        heading: "Systems & Performance Impact",
        body: "In production vector search systems like FAISS or ScaNN, bucket routing occurs prior to SIMD distance evaluation. By maintaining boundary arrays in CPU L1 cache or GPU constant memory, binary search eliminates unnecessary floating-point distance comparisons against non-candidate Voronoi clusters.",
      },
      {
        heading: "Implementation Nuances & Edge Case Handling",
        body: "Care must be taken to prevent integer overflow when calculating midpoint `(low + high) // 2` in native compiled languages (C++/Rust). Branchless vectorization or AVX-512 SIMD binning techniques (e.g. `_mm512_cmp_ps_mask`) are used when evaluating batch queries against small boundary sets (K <= 16).",
      },
    ],
    keyTerms: [
      {
        term: "Inverted File (IVF) Index",
        definition:
          "A vector index structure that partitions vector space into Voronoi cells to limit nearest-neighbor searches to relevant buckets.",
      },
      {
        term: "Scalar Quantization (SQ)",
        definition:
          "Compression technique mapping continuous floating-point values to discrete integer bucket indices.",
      },
      {
        term: "Bisective Search",
        definition:
          "Divide-and-conquer search strategy that halves the search domain at each iteration step.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Vector Search Foundations" }],
  generateSteps: generateBinarySearchBucketIndexSteps,
};
