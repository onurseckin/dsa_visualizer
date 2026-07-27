import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

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
    """
    Computes angular Locality-Sensitive Hash (LSH) bitcode via random hyperplanes (Charikar 2002).
    For each hyperplane normal vector w_i, bit b_i = 1 if (w_i . v) >= 0 else 0.
    Maps cosine similarity to Hamming distance between bitcodes.
    """
    bits = []
    bitcode_int = 0

    for idx, w in enumerate(hyperplanes):
        dot_product = sum(wi * vi for wi, vi in zip(w, vector))
        bit_val = 1 if dot_product >= 0 else 0
        bits.append(str(bit_val))
        bitcode_int = (bitcode_int << 1) | bit_val

    bitcode_str = "".join(bits)
    return bitcode_str, bitcode_int`;

export const generateRandomHyperplaneSteps = (
  input: RandomHyperplaneSignHashInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { vector, hyperplanes } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Random Hyperplane Sign Hashing (Charikar LSH)`,
      why: `Computing K = ${hyperplanes.length}-bit angular LSH code for vector [${vector.join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: hyperplanes.map((w, idx) => ({
        id: `plane-${idx}`,
        value: idx,
        label: `H${idx} normal [${w.join(",")}]`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        vector: `[${vector.join(", ")}]`,
        numHyperplanes: String(hyperplanes.length),
        status: "Initialized",
      },
    },
    variables: { totalPlanes: hyperplanes.length },
  });

  const bits: number[] = [];
  let bitcodeInt = 0;

  for (let i = 0; i < hyperplanes.length; i++) {
    const w = hyperplanes[i];
    const dotProduct = w.reduce((acc, wi, d) => acc + wi * vector[d], 0);
    const bitVal = dotProduct >= 0 ? 1 : 0;

    bits.push(bitVal);
    bitcodeInt = (bitcodeInt << 1) | bitVal;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Evaluate Hyperplane H${i} Normal [${w.join(", ")}]`,
        why: `Dot product (w . v) = ${dotProduct.toFixed(3)}. Sign is ${dotProduct >= 0 ? ">= 0" : "< 0"} -> Bit b_${i} = ${bitVal}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: hyperplanes.map((_, idx) => ({
          id: `plane-${idx}`,
          value: idx === i ? bitVal : idx < i ? bits[idx] : idx,
          label: `b_${idx} = ${idx <= i ? bits[idx] : "?"}`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`bit=${bitVal}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activePlane: `H${i}`,
          dotProduct: dotProduct.toFixed(3),
          bitResult: String(bitVal),
          accumulatedBitstring: bits.join(""),
          bitcodeInteger: String(bitcodeInt),
        },
      },
      variables: { planeIdx: i, dotProduct: Math.round(dotProduct * 100) / 100, bitVal },
    });
  }

  // Step Final: Complete
  const bitcodeStr = bits.join("");

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Random Hyperplane Sign Hash Complete: Bitcode "${bitcodeStr}" (Int: ${bitcodeInt})`,
      why: `Vector mapped to binary bitcode "${bitcodeStr}". Angular distance cos(theta) corresponds to Hamming distance between bitcodes.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: bits.map((b, idx) => ({
        id: `bit-${idx}`,
        value: b,
        label: `Bit ${idx} = ${b}`,
        state: "sorted" as ElementState,
        pointers: idx === 0 ? [`Bitcode: "${bitcodeStr}"`] : [],
      })),
    },
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
  id: "randomHyperplaneSignHash",
  title: "Random Hyperplane Sign Hashing (Charikar Angular LSH)",
  category: "ml_vector_search",
  categories: ["ml_vector_search"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_vector_search",
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
