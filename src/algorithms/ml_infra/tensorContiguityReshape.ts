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
  input: TensorContiguityReshapeInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { shape, strides, targetShape } = input;
  const ndim = shape.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
  ) => {
    const baseElements: ArrayElement[] = shape.map((s, idx) => ({
      id: `dim-${idx}`,
      label: `d${idx}`,
      value: s,
      state: "default",
      pointers: [`str=${strides[idx]}`],
    }));

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || baseElements).map((el) => ({
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
    2,
    "Initialize Stride Analysis",
    `Analyzing tensor shape [${shape.join(", ")}] (ndim=${ndim}) and strides [${strides.join(", ")}] against target reshape [${targetShape.join(", ")}].`,
    { ndim, acc: 1 },
  );

  const expectedStrides: number[] = new Array(ndim).fill(1);
  let acc = 1;

  for (let d = ndim - 1; d >= 0; d--) {
    expectedStrides[d] = acc;
    const currentDimSize = shape[d];
    acc *= currentDimSize;

    const currentElements: ArrayElement[] = shape.map((s, idx) => ({
      id: `dim-${idx}`,
      label: `d${idx}`,
      value: s,
      state: idx === d ? "active" : idx > d ? "sorted" : "default",
      pointers: [`str=${strides[idx]}`, ...(idx >= d ? [`exp=${expectedStrides[idx]}`] : [])],
    }));

    addStep(
      6,
      `Compute Expected Stride for Dim ${d} (size ${currentDimSize})`,
      `Expected stride for dimension d=${d} is current accumulator acc = ${expectedStrides[d]}. Next acc = ${expectedStrides[d]} * ${currentDimSize} = ${acc}.`,
      { d, shape_d: currentDimSize, expected_stride_d: expectedStrides[d], acc },
      currentElements,
      {
        expectedStrides: `[${expectedStrides.map((s, i) => (i >= d ? s : "?")).join(", ")}]`,
        currentAcc: acc,
      },
    );
  }

  const isContiguous = strides.every((val, idx) => val === expectedStrides[idx]);
  const totalElements = acc;

  const checkedElements: ArrayElement[] = shape.map((s, idx) => ({
    id: `dim-${idx}`,
    label: `d${idx}`,
    value: s,
    state: isContiguous ? "sorted" : "compare",
    pointers: [`str=${strides[idx]}`, `exp=${expectedStrides[idx]}`],
  }));

  addStep(
    9,
    `Evaluate C-Contiguity: ${isContiguous ? "Contiguous" : "Non-Contiguous"}`,
    `Comparing input strides [${strides.join(", ")}] with expected contiguous strides [${expectedStrides.join(", ")}]. Result: ${isContiguous}.`,
    { is_contiguous: isContiguous },
    checkedElements,
    {
      actualStrides: `[${strides.join(", ")}]`,
      expectedStrides: `[${expectedStrides.join(", ")}]`,
      isContiguous: String(isContiguous),
    },
  );

  let targetElements = 1;
  for (const dim of targetShape) {
    targetElements *= dim;
  }

  addStep(
    13,
    `Calculate Target Element Volume (${targetElements} elements)`,
    `Multiplying target shape [${targetShape.join(", ")}] dimensions yields total volume of ${targetElements} elements (vs input ${totalElements}).`,
    { total_elements: totalElements, target_elements: targetElements },
    checkedElements,
    {
      totalElements,
      targetElements,
    },
  );

  if (totalElements !== targetElements) {
    addStep(
      17,
      `Reshape Failed: Element Volume Mismatch (${totalElements} vs ${targetElements})`,
      `Cannot reshape tensor with ${totalElements} elements into target shape [${targetShape.join(", ")}] requiring ${targetElements} elements.`,
      { total_elements: totalElements, target_elements: targetElements, can_zero_copy: false },
      checkedElements.map((el) => ({ ...el, state: "compare", pointers: ["MISMATCH"] })),
      { reason: "Element count mismatch", totalElements, targetElements },
    );
    return steps;
  }

  if (isContiguous) {
    const targetNdim = targetShape.length;
    const targetStrides: number[] = new Array(targetNdim).fill(1);
    let accT = 1;

    for (let d = targetNdim - 1; d >= 0; d--) {
      targetStrides[d] = accT;
      const tDimSize = targetShape[d];
      accT *= tDimSize;

      const targetElementsSnap: ArrayElement[] = targetShape.map((s, idx) => ({
        id: `target-dim-${idx}`,
        label: `t${idx}`,
        value: s,
        state: idx === d ? "active" : idx > d ? "sorted" : "default",
        pointers: idx >= d ? [`target_str=${targetStrides[idx]}`] : undefined,
      }));

      addStep(
        24,
        `Compute Target Stride for Dim ${d} (size ${tDimSize})`,
        `Target dimension d=${d} gets stride acc_t = ${targetStrides[d]}. Next acc_t = ${targetStrides[d]} * ${tDimSize} = ${accT}.`,
        { target_d: d, target_shape_d: tDimSize, target_stride_d: targetStrides[d], acc_t: accT },
        targetElementsSnap,
        {
          targetStrides: `[${targetStrides.map((s, i) => (i >= d ? s : "?")).join(", ")}]`,
          acc_t: accT,
        },
      );
    }

    const finalTargetElements: ArrayElement[] = targetShape.map((s, idx) => ({
      id: `target-dim-${idx}`,
      label: `t${idx}`,
      value: s,
      state: "sorted",
      pointers: [`target_str=${targetStrides[idx]}`],
    }));

    addStep(
      26,
      `Reshape Success: Zero-Copy View Created`,
      `Input buffer is contiguous and element count matches (${totalElements}). Zero-copy view returned with target strides [${targetStrides.join(", ")}].`,
      { can_zero_copy: true, target_strides: targetStrides.join(",") },
      finalTargetElements,
      {
        targetStrides: `[${targetStrides.join(", ")}]`,
        can_zero_copy: "true",
        reason: "Zero-copy view created",
      },
    );
  } else {
    addStep(
      28,
      `Reshape Notice: Memory Copy Required`,
      `Tensor is non-contiguous. Zero-copy view cannot be created. Reshape requires a contiguous physical memory copy.`,
      { can_zero_copy: false },
      checkedElements.map((el) => ({ ...el, state: "compare", pointers: ["COPY REQ"] })),
      { can_zero_copy: "false", reason: "Non-contiguous tensor requires copy" },
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
      line: 6,
      hint: "Calculate expected C-contiguous strides by accumulating trailing dimension sizes from right to left.",
    },
    {
      line: 16,
      hint: "Ensure overall element volume (product of shape sizes) matches target shape volume.",
    },
    {
      line: 26,
      hint: "For contiguous tensors, zero-copy view computes new strides directly without memory reallocation.",
    },
  ],
  lineExplanations: {
    1: "Defines function to verify tensor contiguity and evaluate zero-copy reshape feasibility.",
    2: "Determines input tensor dimensionality.",
    6: "Iterates right-to-left over dimensions to compute standard major-to-minor C-strides.",
    9: "Compares actual strides against expected contiguous strides.",
    13: "Calculates overall target element volume by accumulating dimension sizes.",
    16: "Rejects reshape if total element counts disagree.",
    24: "Derives new strides for target shape when input buffer is contiguous.",
    26: "Returns zero-copy view metadata when tensor is contiguous.",
    28: "Flags requirement for physical buffer memory copy for non-contiguous inputs.",
  },
};

export const tensorContiguityReshape: AlgorithmDefinition<TensorContiguityReshapeInput> = {
  id: "tensor-contiguity-reshape",
  title: "Tensor Contiguity Check & Zero-Copy Reshape Engine",
  topicIds: ["ml_tensor_algebra"],
  difficulty: "Easy",
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
      explanation:
        "Shape [2, 3, 4] with strides [12, 4, 1] is contiguous. Reshape to [6, 4] (24 elements) succeeds zero-copy.",
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
      output:
        "{is_contiguous: false, can_zero_copy: false, reason: 'Non-contiguous tensor requires copy'}",
      explanation:
        "Strides [1, 3] indicate a transposed tensor layout (expected [4, 1]). Reshaping to flat [12] requires a contiguous memory copy.",
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
      explanation:
        "Input volume is 6 elements, target volume is 5 elements. Reshape fails validation.",
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
        definition:
          "Row-major memory layout where adjacent elements in the last dimension occupy adjacent memory addresses.",
      },
      {
        term: "Zero-Copy View",
        definition:
          "A new tensor object sharing the same underlying memory buffer with different shape and stride metadata.",
      },
    ],
  },
  trivia: TENSOR_CONTIGUITY_RESHAPE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra" }],
  defaultInput: DEFAULT_TENSOR_CONTIGUITY_INPUT,
  generateSteps: generateTensorContiguityReshapeSteps,
};
