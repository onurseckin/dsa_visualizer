import {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  VectorItem,
  VectorVisualSnapshot,
} from "../../types/dsa";

export interface RandomHyperplaneSignHashInput {
  vector: number[];
  hyperplanes: number[][];
}

export const DEFAULT_RANDOM_HYPERPLANE_INPUT: RandomHyperplaneSignHashInput = {
  vector: [1.5, -2.0, 0.5],
  hyperplanes: [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
    [Math.SQRT1_2, Math.SQRT1_2, 0.0],
  ],
};

export const RANDOM_HYPERPLANE_SIGN_HASH_CODE = `def random_hyperplane_sign_hash(vector: list[float], hyperplanes: list[list[float]]) -> tuple[str, int]:
    bits = []
    bitcode_int = 0

    for idx, w in enumerate(hyperplanes):
        dot_product = sum(wi * vi for wi, vi in zip(w, vector))
        bit_val = 1 if dot_product >= 0 else 0
        bits.append(str(bit_val))
        bitcode_int = (bitcode_int << 1) | bit_val

    bitcode_str = "".join(bits)
    return bitcode_str, bitcode_int`;

const createVectorSnapshot = (
  vector: number[],
  hyperplanes: number[][],
  currentIdx?: number,
  bits: number[] = [],
  phase: "init" | "dot" | "bit" | "complete" = "init",
): VectorVisualSnapshot => {
  const is3D = vector.length >= 3;
  const vectors: VectorItem[] = [];

  vectors.push({
    id: "vec-query",
    label: `v = [${vector.join(", ")}]`,
    x: vector[0] ?? 0,
    y: vector[1] ?? 0,
    z: is3D ? vector[2] : undefined,
    color: "#3b82f6",
    state: phase === "complete" ? "result" : "active",
    subText: "Query Vector v",
  });

  hyperplanes.forEach((w, idx) => {
    let state: ElementState = "default";
    let color = "#6b7280";
    let subText = `H${idx} normal`;

    if (phase === "complete") {
      state = "sorted";
      color = "#10b981";
      subText = `b_${idx} = ${bits[idx]}`;
    } else if (currentIdx !== undefined) {
      if (idx === currentIdx) {
        state = phase === "dot" ? "active" : "compare";
        color = "#f59e0b";
        if (phase === "bit") {
          subText = `b_${idx} = ${bits[idx]}`;
        }
      } else if (idx < currentIdx) {
        state = "sorted";
        color = "#10b981";
        subText = `b_${idx} = ${bits[idx]}`;
      }
    }

    vectors.push({
      id: `plane-${idx}`,
      label: `H${idx} [${w.join(", ")}]`,
      x: w[0] ?? 0,
      y: w[1] ?? 0,
      z: is3D ? w[2] : undefined,
      color,
      state,
      subText,
    });
  });

  return {
    kind: "vector",
    vectors,
    planeTitle: `Random Hyperplane Sign Hashing Space (${is3D ? "3D" : "2D"})`,
    dimensions: is3D ? "3d" : "2d",
  };
};

export const generateRandomHyperplaneSteps = (
  input: RandomHyperplaneSignHashInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { vector, hyperplanes } = input;
  let stepIndex = 0;

  // Step 0: Init bits and bitcode_int
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Initialize bit collection array and integer bitcode counter",
      why: `Preparing to compute ${hyperplanes.length}-bit angular LSH code for query vector [${vector.join(", ")}].`,
    },
    primarySnapshot: createVectorSnapshot(vector, hyperplanes, undefined, [], "init"),
    auxiliaryState: {
      customState: {
        vector: `[${vector.join(", ")}]`,
        numHyperplanes: String(hyperplanes.length),
        status: "Initialized",
      },
    },
    variables: { vector: `[${vector.join(", ")}]`, totalPlanes: hyperplanes.length },
  });

  const bits: number[] = [];
  let bitcodeInt = 0;

  for (let i = 0; i < hyperplanes.length; i++) {
    const w = hyperplanes[i];
    const dotProduct = w.reduce((acc, wi, d) => acc + wi * (vector[d] ?? 0), 0);

    // Step 1 of iteration: Dot product calculation
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Evaluate Hyperplane H${i} Normal Vector [${w.join(", ")}]`,
        why: `Compute dot product (w · v) = ${dotProduct.toFixed(3)}.`,
      },
      primarySnapshot: createVectorSnapshot(vector, hyperplanes, i, bits, "dot"),
      auxiliaryState: {
        customState: {
          activePlane: `H${i}`,
          planeNormal: `[${w.join(", ")}]`,
          dotProduct: dotProduct.toFixed(3),
          status: "Computing Dot Product",
        },
      },
      variables: { planeIdx: i, dotProduct: Math.round(dotProduct * 1000) / 1000 },
    });

    const bitVal = dotProduct >= 0 ? 1 : 0;
    bits.push(bitVal);
    bitcodeInt = (bitcodeInt << 1) | bitVal;

    // Step 2 of iteration: Bit decision & packing
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Threshold sign: (w · v) = ${dotProduct.toFixed(3)} ${dotProduct >= 0 ? ">= 0" : "< 0"} -> bit b_${i} = ${bitVal}`,
        why: `Bit b_${i} = ${bitVal} appended to bits. Bitcode integer updated to (bitcode_int << 1) | ${bitVal} = ${bitcodeInt}.`,
      },
      primarySnapshot: createVectorSnapshot(vector, hyperplanes, i, bits, "bit"),
      auxiliaryState: {
        customState: {
          activePlane: `H${i}`,
          bitResult: String(bitVal),
          accumulatedBitstring: bits.join(""),
          bitcodeInteger: String(bitcodeInt),
          status: "Bit Determined",
        },
      },
      variables: { planeIdx: i, bitVal, bitcodeInt },
    });
  }

  const bitcodeStr = bits.join("");

  // Step Join
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 9,
    explanation: {
      what: `Join binary bitcode string: "${bitcodeStr}"`,
      why: `Concatenated evaluated bits [${bits.join(", ")}] into ${bits.length}-bit string "${bitcodeStr}".`,
    },
    primarySnapshot: createVectorSnapshot(
      vector,
      hyperplanes,
      hyperplanes.length - 1,
      bits,
      "complete",
    ),
    auxiliaryState: {
      customState: {
        bitcodeString: bitcodeStr,
        bitcodeInteger: String(bitcodeInt),
        status: "Bitstring Joined",
      },
    },
    variables: { bitcodeStr, bitcodeInt },
  });

  // Step Return
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Return LSH bitcode tuple ("${bitcodeStr}", ${bitcodeInt})`,
      why: `Completed Charikar Angular LSH hashing. Angular distance theta(u, v) is preserved as Hamming distance between bitcodes.`,
    },
    primarySnapshot: createVectorSnapshot(
      vector,
      hyperplanes,
      hyperplanes.length - 1,
      bits,
      "complete",
    ),
    auxiliaryState: {
      customState: {
        bitcodeString: bitcodeStr,
        bitcodeInteger: String(bitcodeInt),
        status: "Completed",
      },
    },
    variables: { bitcodeStr, bitcodeInt, complete: true },
  });

  return steps;
};

export const randomHyperplaneSignHash: AlgorithmDefinition<RandomHyperplaneSignHashInput> = {
  id: "random-hyperplane-sign-hash",
  title: "Random Hyperplane Sign Hashing (Charikar Angular LSH)",
  topicIds: ["ml_vector_search"],
  difficulty: "Medium",
  description:
    "Computes angular Locality-Sensitive Hashing (LSH) bitcodes using random hyperplanes (Charikar 2002). For each random hyperplane normal vector w_i, bit b_i = 1 if (w_i · v) >= 0 else 0. Maps vector cosine similarity directly to Hamming distance between binary bitcode integers.\n\nInput Format:\n- vector: Multi-dimensional query vector.\n- hyperplanes: K random normal vectors w_i defining hyperplanes through the origin.\n\nOutput Format:\n- Returns tuple (bitcodeString, bitcodeInteger).\n\nEdge Cases & Constraints:\n- Exact origin vector [0,0,...,0]: Dot product is 0, assigned bit 1.",
  constraints: ["hyperplanes normal vectors must match vector dimension D."],
  examples: [
    {
      kind: "basic",
      title: "4-Bit Random Hyperplane Bitcode",
      inputDisplay: "vector = [1.5, -2.0, 0.5], 4 hyperplanes",
      outputDisplay: "Bitcode: '1010' (Int: 10)",
      input: DEFAULT_RANDOM_HYPERPLANE_INPUT,
      output: "'1010'",
      explanation: "Evaluates signs of dot products against 4 coordinate and diagonal hyperplanes.",
    },
    {
      kind: "complex",
      title: "Opposite Vector Inverted Bitcode",
      inputDisplay: "vector = [-1.5, 2.0, -0.5]",
      outputDisplay: "Bitcode: '0101' (Int: 5)",
      input: {
        ...DEFAULT_RANDOM_HYPERPLANE_INPUT,
        vector: [-1.5, 2.0, -0.5],
      },
      output: "'0101'",
      explanation: "Diametrically opposed vector produces exact bitwise NOT complement ('0101').",
    },
    {
      kind: "negative",
      title: "Zero Vector",
      inputDisplay: "vector = [0.0, 0.0, 0.0]",
      outputDisplay: "Bitcode: '1111' (Int: 15)",
      input: {
        ...DEFAULT_RANDOM_HYPERPLANE_INPUT,
        vector: [0.0, 0.0, 0.0],
      },
      output: "'1111'",
      explanation: "Zero vector dot products evaluate to 0 >= 0, producing all ones.",
    },
  ],
  defaultInput: DEFAULT_RANDOM_HYPERPLANE_INPUT,
  code: RANDOM_HYPERPLANE_SIGN_HASH_CODE,
  timeComplexity: {
    best: "O(K * D)",
    average: "O(K * D)",
    worst: "O(K * D)",
  },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "O(K * D) where K is number of hyperplanes and D is vector dimension.",
    space: "O(K) auxiliary space to store binary bitcode strings and integers.",
  },
  topicGuide: {
    overview:
      "Random Hyperplane LSH (Charikar 2002, Goemans & Williamson 1995) provides a theoretical guarantee connecting angular distance to Hamming bit distance: P(b_i(u) == b_i(v)) = 1 - theta(u, v) / pi. This allows vector similarity search over high-dimensional spaces to be executed as hardware POPCNT (population count) bitwise XOR instructions on 64-bit integers.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "A random hyperplane passing through origin splits R^D into two half-spaces. The probability that two vectors u, v fall on opposite sides of a random hyperplane is directly proportional to angle theta(u, v) = arccos(u . v / (||u|| ||v||)).",
      },
      {
        heading: "Hardware POPCNT & Hamming Distance Speedups",
        body: "Hamming distance between two K-bit hash codes is computed via CPU `POPCNT(code1 ^ code2)` in 1 CPU instruction cycle, running up to 100x faster than floating-point dot products.",
      },
      {
        heading: "Bit Packing (uint64_t)",
        body: "Bitcodes are packed into 64-bit integer registers (`uint64_t`). For K = 64 hyperplanes, each vector requires only 8 bytes of storage.",
      },
    ],
    keyTerms: [
      {
        term: "Charikar LSH",
        definition:
          "Locality-Sensitive Hashing algorithm preserving cosine angle using random hyperplanes.",
      },
      {
        term: "Hamming Distance",
        definition: "The number of bit positions in which two binary strings differ.",
      },
      {
        term: "POPCNT (Population Count)",
        definition: "Hardware instruction returning the number of set 1-bits in a binary word.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "Charikar Random Hyperplane LSH (STOC 2002)" },
  ],
  generateSteps: generateRandomHyperplaneSteps,
};
