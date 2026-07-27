import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface TensorContiguityReshapeInput {
  shape: number[];
  strides: number[];
  targetShape: number[];
}

export const TENSOR_CONTIGUITY_RESHAPE_CODE = `def check_contiguity_and_reshape(shape: list[int], strides: list[int], target_shape: list[int]) -> dict:
    ndim = len(shape)
    expected_strides = [1] * ndim
    acc = 1
    for d in range(ndim - 1, -1, -1):
        expected_strides[d] = acc
        acc *= shape[d]
        
    is_contiguous = (strides == expected_strides)
    
    total_elements = acc
    target_elements = 1
    for dim in target_shape:
        target_elements *= dim
        
    if total_elements != target_elements:
        return {"is_contiguous": is_contiguous, "can_zero_copy": False, "target_strides": [], "reason": "Element count mismatch"}
        
    if is_contiguous:
        target_ndim = len(target_shape)
        target_strides = [1] * target_ndim
        acc_t = 1
        for d in range(target_ndim - 1, -1, -1):
            target_strides[d] = acc_t
            acc_t *= target_shape[d]
        return {"is_contiguous": is_contiguous, "can_zero_copy": True, "target_strides": target_strides, "reason": "Zero-copy view created"}
    else:
        return {"is_contiguous": is_contiguous, "can_zero_copy": False, "target_strides": [], "reason": "Non-contiguous tensor requires copy"}`;

export const DEFAULT_TENSOR_CONTIGUITY_INPUT: TensorContiguityReshapeInput = {
  shape: [2, 3, 4],
  strides: [12, 4, 1],
  targetShape: [6, 4],
};

export const generateTensorContiguityReshapeSteps = (
  input: TensorContiguityReshapeInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { shape, strides, targetShape } = input;
  const ndim = shape.length;

  const elements: ArrayElement[] = shape.map((s, idx) => ({
    id: `dim-${idx}`,
    value: s,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: customState || {
          shape: `[${shape.join(", ")}]`,
          strides: `[${strides.join(", ")}]`,
          targetShape: `[${targetShape.join(", ")}]`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Contiguity & Reshape Check",
    `Analyzing tensor shape [${shape.join(", ")}] and strides [${strides.join(", ")}] against target reshape [${targetShape.join(", ")}].`,
    { ndim }
  );

  // Compute expected C-contiguous strides
  const expectedStrides: number[] = new Array(ndim).fill(1);
  let acc = 1;
  for (let d = ndim - 1; d >= 0; d--) {
    expectedStrides[d] = acc;
    acc *= shape[d];
  }

  const isContiguous = strides.every((val, idx) => val === expectedStrides[idx]);

  const checkedElements: ArrayElement[] = elements.map((el, i) => ({
    ...el,
    state: isContiguous ? "sorted" : "compare",
    pointers: [`str=${strides[i]}`, `exp=${expectedStrides[i]}`],
  }));

  addStep(
    8,
    `Evaluate C-Contiguity: ${isContiguous ? "Contiguous" : "Non-Contiguous"}`,
    `Computed expected contiguous strides [${expectedStrides.join(", ")}]. Match with input strides [${strides.join(", ")}]: ${isContiguous}.`,
    { isContiguous },
    checkedElements,
    {
      expectedStrides: `[${expectedStrides.join(", ")}]`,
      actualStrides: `[${strides.join(", ")}]`,
      isContiguous: String(isContiguous),
    }
  );

  const totalElements = acc;
  const targetElements = targetShape.reduce((a, b) => a * b, 1);

  if (totalElements !== targetElements) {
    addStep(
      16,
      `Reshape Failed: Element Volume Mismatch (${totalElements} vs ${targetElements})`,
      `Cannot reshape tensor with ${totalElements} total elements into target shape [${targetShape.join(", ")}] requiring ${targetElements} elements.`,
      { totalElements, targetElements, can_zero_copy: false },
      checkedElements,
      { reason: "Element count mismatch", totalElements, targetElements }
    );
    return steps;
  }

  if (isContiguous) {
    const targetNdim = targetShape.length;
    const targetStrides: number[] = new Array(targetNdim).fill(1);
    let accT = 1;
    for (let d = targetNdim - 1; d >= 0; d--) {
      targetStrides[d] = accT;
      accT *= targetShape[d];
    }

    addStep(
      24,
      `Reshape Success: Zero-Copy View Created with strides [${targetStrides.join(", ")}]`,
      `Tensor is C-contiguous. Reshape to [${targetShape.join(", ")}] succeeded zero-copy with target strides [${targetStrides.join(", ")}].`,
      { can_zero_copy: true, target_strides: targetStrides.join(",") },
      checkedElements.map((el) => ({ ...el, state: "sorted", pointers: ["VIEW READY"] })),
      {
        targetStrides: `[${targetStrides.join(", ")}]`,
        can_zero_copy: "true",
        reason: "Zero-copy view created",
      }
    );
  } else {
    addStep(
      26,
      `Reshape Notice: Memory Copy Required`,
      `Tensor is non-contiguous. Reshape requires contiguous memory reallocation and copy before reshaping.`,
      { can_zero_copy: false },
      checkedElements.map((el) => ({ ...el, state: "compare", pointers: ["COPY REQ"] })),
      { can_zero_copy: "false", reason: "Non-contiguous tensor requires copy" }
    );
  }

  return steps;
};

const TENSOR_CONTIGUITY_RESHAPE_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "is_contiguous = (shape == target_shape)",
    "target_strides = [0] * len(target_shape)",
    "if total_elements == target_elements: return True",
    "acc += shape[d]",
  ],
  hints: [
    {
      line: 8,
      hint: "Calculate expected C-contiguous strides by accumulating trailing dimension sizes from right to left.",
    },
    {
      line: 16,
      hint: "Ensure overall element volume (product of shape sizes) matches target shape volume.",
    },
    {
      line: 24,
      hint: "For contiguous tensors, zero-copy view computes new strides directly without memory reallocation.",
    },
  ],
  lineExplanations: {
    1: "Defines function to verify tensor contiguity and evaluate zero-copy reshape feasibility.",
    4: "Iterates right-to-left over dimensions to compute standard major-to-minor C-strides.",
    8: "Compares actual strides against expected contiguous strides.",
    16: "Rejects reshape if total element counts disagree.",
    24: "Derives new strides for target shape when input buffer is contiguous.",
    26: "Flags requirement for physical buffer memory copy for non-contiguous inputs.",
  },
};

export const tensorContiguityReshape: AlgorithmDefinition<TensorContiguityReshapeInput> = {
  id: "tensor-contiguity-reshape",
  title: "Tensor Contiguity Check & Zero-Copy Reshape Engine",
  category: "ml_tensor_algebra",
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  description:
    "Verifies if a multi-dimensional tensor is C-contiguous in memory and determines whether a target shape reshape operation can be executed as a zero-copy metadata view or requires a memory copy.",
  constraints: [
    "len(shape) == len(strides)",
    "shape[i] > 0 for all i",
    "targetShape[j] > 0 for all j",
  ],
  examples: [
    {
      kind: "basic",
      title: "Standard Contiguous 3D to 2D Reshape",
      inputDisplay: "shape = [2, 3, 4], strides = [12, 4, 1], targetShape = [6, 4]",
      outputDisplay: "can_zero_copy = true, target_strides = [4, 1]",
      input: DEFAULT_TENSOR_CONTIGUITY_INPUT,
      output: "{is_contiguous: true, can_zero_copy: true, target_strides: [4, 1]}",
      explanation: "Shape [2, 3, 4] with strides [12, 4, 1] is contiguous. Reshape to [6, 4] (24 elements) succeeds zero-copy.",
    },
    {
      kind: "complex",
      title: "Transposed Non-Contiguous Tensor Reshape",
      inputDisplay: "shape = [3, 4], strides = [1, 3], targetShape = [12]",
      outputDisplay: "is_contiguous = false, can_zero_copy = false",
      input: {
        shape: [3, 4],
        strides: [1, 3],
        targetShape: [12],
      },
      output: "{is_contiguous: false, can_zero_copy: false, reason: 'Non-contiguous tensor requires copy'}",
      explanation: "Strides [1, 3] indicate a transposed tensor layout (expected [4, 1]). Reshaping to flat [12] requires a contiguous memory copy.",
    },
    {
      kind: "negative",
      title: "Element Count Mismatch Reshape Error",
      inputDisplay: "shape = [2, 3], strides = [3, 1], targetShape = [5]",
      outputDisplay: "can_zero_copy = false, reason = 'Element count mismatch'",
      input: {
        shape: [2, 3],
        strides: [3, 1],
        targetShape: [5],
      },
      output: "{can_zero_copy: false, reason: 'Element count mismatch'}",
      explanation: "Input volume is 6 elements, target volume is 5 elements. Reshape fails validation.",
    },
  ],
  code: TENSOR_CONTIGUITY_RESHAPE_CODE,
  timeComplexity: {
    best: "O(D + D_target)",
    average: "O(D + D_target)",
    worst: "O(D + D_target)",
  },
  spaceComplexity: "O(D_target)",
  complexityAnalysis: {
    time: "Calculates stride vectors in a single pass over input dimensions D and target dimensions D_target, operating in O(D) time.",
    space: "Allocates small stride vector array for the target shape.",
  },
  topicGuide: {
    overview:
      "In deep learning frameworks (PyTorch `.reshape()` vs `.view()`), reshaping a tensor without allocating new GPU/CPU memory requires that the underlying storage buffer is contiguous. If stride mechanics allow a direct view representation, `.view()` returns a zero-copy pointer with updated strides; otherwise `.reshape()` triggers a contiguous clone.",
    sections: [
      {
        heading: "Contiguous Stride Definition",
        body: "A C-contiguous N-dimensional tensor has stride s_d = prod_{k=d+1}^{N-1} dim_k for each dimension d, with the last dimension stride s_{N-1} = 1.",
      },
      {
        heading: "Zero-Copy Views vs Memory Copies",
        body: "Zero-copy tensor views avoid expensive HBM buffer copies and CUDA memory allocation overhead during multi-head attention projection reshaping (e.g., [B, S, H, D] -> [B*S, H*D]).",
      },
    ],
    keyTerms: [
      {
        term: "C-Contiguous",
        definition: "Row-major memory layout where adjacent elements in the last dimension occupy adjacent memory addresses.",
      },
      {
        term: "Zero-Copy View",
        definition: "A new tensor object sharing the same underlying memory buffer with different shape and stride metadata.",
      },
    ],
  },
  trivia: TENSOR_CONTIGUITY_RESHAPE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra" }],
  defaultInput: DEFAULT_TENSOR_CONTIGUITY_INPUT,
  generateSteps: generateTensorContiguityReshapeSteps,
};
