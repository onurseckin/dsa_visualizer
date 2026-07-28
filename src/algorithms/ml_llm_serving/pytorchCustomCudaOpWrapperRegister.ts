import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface pytorchCustomCudaOpWrapperRegisterInput {
  data: number[];
  target?: number;
}

export const PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_CODE = `def pytorch_custom_cuda_op_wrapper_register(data: list[int], target: int = 30) -> list[int]:
    output_buffer = []
    grid_dim = len(data)

    for thread_id in range(grid_dim):
        val = data[thread_id]
        if val == target:
            processed_val = val * 2
        else:
            processed_val = val
        output_buffer.append(processed_val)

    return output_buffer`;

export const DEFAULT_PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_INPUT: pytorchCustomCudaOpWrapperRegisterInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generatePytorchCustomCudaOpWrapperRegisterSteps = (
  input: pytorchCustomCudaOpWrapperRegisterInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const data = input.data;
  const target = input.target ?? 30;

  const elements: ArrayElement[] = data.map((val, idx) => ({
    id: `thread-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeThreadId: number = -1,
    pointersMap: Record<number, string[]> = {},
    customElements?: ArrayElement[],
    currentOutputBuffer: number[] = [],
  ) => {
    const baseElements = customElements || elements;
    const updatedElements: ArrayElement[] = baseElements.map((el, idx) => {
      let state: ArrayElement["state"] = el.state;
      if (activeThreadId >= 0 && idx === activeThreadId) state = "active";
      else if (activeThreadId >= 0 && idx < activeThreadId && state !== "sorted") state = "visited";
      return {
        ...el,
        state,
        pointers: pointersMap[idx] || el.pointers || undefined,
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: updatedElements,
      },
      auxiliaryState: {
        customState: {
          data: `[${data.join(", ")}]`,
          target: String(target),
          grid_dim: String(data.length),
          output_buffer: `[${currentOutputBuffer.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Enter pytorch_custom_cuda_op_wrapper_register function",
    "Initializing PyTorch `@torch.library.custom_op` wrapper for custom C++/CUDA kernel execution.",
    { tensor_size: data.length, target },
  );

  // Step 2: Init output buffer
  addStep(
    2,
    "Initialize output_buffer = []",
    "Allocating PyTorch C++ output tensor buffer in GPU device VRAM memory.",
    { output_buffer: "[]" },
  );

  // Step 3: Compute grid dimension
  const gridDim = data.length;
  addStep(
    3,
    `Compute grid_dim = len(data) -> ${gridDim}`,
    `Calculating CUDA thread block grid dimension: $\\text{grid}\\_dim = ${gridDim}$ threads.`,
    { grid_dim: gridDim },
  );

  // Step 4: Dispatch CUDA grid
  addStep(
    5,
    `Dispatch CUDA grid: for thread_id in range(grid_dim=${gridDim})`,
    `Launching ${gridDim} CUDA threads in parallel over GPU tensor memory.`,
    { grid_dim: gridDim },
  );

  const outputBuffer: number[] = [];
  const currentElements = [...elements];

  for (let threadId = 0; threadId < gridDim; threadId++) {
    addStep(
      5,
      `CUDA Thread [${threadId}]: Begin thread execution`,
      `Thread block index ${threadId} active on CUDA warp.`,
      { thread_id: threadId },
      threadId,
      { [threadId]: [`thread_${threadId}`] },
      currentElements,
      outputBuffer,
    );

    const val = data[threadId];
    addStep(
      6,
      `CUDA Thread [${threadId}]: Read val = data[${threadId}] -> ${val}`,
      `Loaded tensor value ${val} from global VRAM address into thread local register.`,
      { thread_id: threadId, val },
      threadId,
      { [threadId]: [`val=${val}`] },
      currentElements,
      outputBuffer,
    );

    const isMatch = val === target;
    addStep(
      7,
      `CUDA Thread [${threadId}]: Check val (${val}) == target (${target}) -> ${isMatch}`,
      isMatch
        ? `Target match! Thread [${threadId}] executes custom C++ CUDA transformation kernel.`
        : `No target match. Thread [${threadId}] executes identity pass-through.`,
      { thread_id: threadId, val, target, match: isMatch },
      threadId,
      { [threadId]: [isMatch ? "TRANSFORM_KERNEL" : "IDENTITY_PASS"] },
      currentElements,
      outputBuffer,
    );

    let processedVal = val;
    if (isMatch) {
      processedVal = val * 2;
      addStep(
        8,
        `CUDA Thread [${threadId}]: Execute custom op processed_val = val * 2 -> ${processedVal}`,
        `C++ CUDA kernel computation: $${val} \\times 2 = ${processedVal}$.`,
        { thread_id: threadId, val, processed_val: processedVal },
        threadId,
        { [threadId]: [`out=${processedVal}`, "TRANSFORMED"] },
        currentElements,
        outputBuffer,
      );
    } else {
      addStep(
        10,
        `CUDA Thread [${threadId}]: Identity pass-through processed_val = val -> ${processedVal}`,
        `Thread [${threadId}] passes element unchanged: ${processedVal}.`,
        { thread_id: threadId, processed_val: processedVal },
        threadId,
        { [threadId]: [`out=${processedVal}`] },
        currentElements,
        outputBuffer,
      );
    }

    outputBuffer.push(processedVal);
    currentElements[threadId] = {
      ...currentElements[threadId],
      value: processedVal,
      state: "sorted",
    };

    addStep(
      11,
      `CUDA Thread [${threadId}]: Write output_buffer.append(${processedVal})`,
      `Thread [${threadId}] stores processed value ${processedVal} to VRAM output buffer.`,
      { thread_id: threadId, processed_val: processedVal, buffer_len: outputBuffer.length },
      threadId,
      { [threadId]: [`written=${processedVal}`] },
      currentElements,
      outputBuffer,
    );
  }

  // Step 5: Final return
  addStep(
    13,
    "Return output_buffer from C++ CUDA extension wrapper",
    `CUDA kernel execution complete! Returned output tensor [${outputBuffer.join(", ")}] to PyTorch C++ engine.`,
    { output_buffer: `[${outputBuffer.join(", ")}]`, total_threads: gridDim },
    -1,
    {},
    currentElements,
    outputBuffer,
  );

  return steps;
};

const PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_TRIVIA: TriviaMeta = {
  skipLines: [4, 9, 12],
  distractors: [
    "output_buffer = list(data)",
    "grid_dim = len(data) // 32",
    "processed_val = val // 2",
    "output_buffer.append(val + target)",
  ],
  hints: [
    { line: 3, hint: "Calculate CUDA grid dimension based on tensor length." },
    {
      line: 8,
      hint: "Execute custom CUDA operator transformation when thread value matches target.",
    },
  ],
  lineExplanations: {
    1: "Function signature for PyTorch `@CustomOp.register` C++ CUDA kernel wrapper taking data list and target scalar.",
    2: "Initialize empty list output_buffer to hold computed C++ CUDA kernel output tensor values.",
    3: "Calculate CUDA grid dimension grid_dim = len(data) for thread block dispatch.",
    4: "Blank line before grid dispatch loop.",
    5: "Dispatch CUDA thread grid over range(grid_dim).",
    6: "Extract element val = data[thread_id] into GPU thread register.",
    7: "Check if val equals target scalar threshold.",
    8: "If match: execute custom CUDA kernel operation (processed_val = val * 2).",
    9: "Else branch for non-matching elements.",
    10: "If no match: identity pass-through (processed_val = val).",
    11: "Store processed_val in device VRAM output_buffer.",
    12: "Blank line before returning results.",
    13: "Return output_buffer tensor from C++ extension wrapper to PyTorch Python runtime.",
  },
};

export const pytorchCustomCudaOpWrapperRegister: AlgorithmDefinition<pytorchCustomCudaOpWrapperRegisterInput> =
  {
    id: "pytorch-custom-cuda-op-wrapper-register",
    title: "PyTorch `@CustomOp.register` C++ CUDA Kernel Register",
    topicIds: ["ml_llm_serving", "ml_hardware_kernels"],
    difficulty: "Hard",
    description:
      "Integrating custom high-performance C++ and CUDA operators (such as FlashAttention, PagedAttention, or custom quantized GEMMs) into PyTorch model computational graphs requires registering native extension bindings via PyTorch's `torch.library.custom_op` API. This pattern exposes C++ CUDA kernels directly to PyTorch autograd engine, managing device pointer unwrapping, contiguous memory layout validation, schema type checking, and stream synchronization.\n\n### CUDA Grid Thread Dispatch & Transformation\nFor thread index $i \\in \\{0, \\dots, N-1\\}$ in grid dimension $N$:\n$$\\text{out}[i] = \\begin{cases} 2 \\cdot \\text{data}[i] & \\text{if } \\text{data}[i] = \\text{target} \\\\ \\text{data}[i] & \\text{otherwise} \\end{cases}$$\n\n### Input Parameters\n- `data`: Array of numerical values representing GPU/CPU input tensor buffer.\n- `target`: Target scalar threshold for thread-level kernel transformation.\n\n### Output\n- Returns output tensor buffer post C++/CUDA kernel execution.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 60]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 60]",
        explanation:
          "Dispatches CUDA threads over data array; element matching target undergoes C++ kernel transformation.",
      },
      {
        kind: "complex",
        title: "Larger Data Array",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 8, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 8, 5]",
        explanation:
          "Processes 5 elements across CUDA thread grid; target element 4 transformed to 8.",
      },
      {
        kind: "negative",
        title: "Target Not Found",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "No element matches target; kernel passes data through unchanged.",
      },
    ],
    code: PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "$O(N)$ parallel runtime across $N$ threads in GPU grid dispatch.",
      space: "$O(N)$ memory allocation for target output tensor buffer.",
    },
    topicGuide: {
      overview:
        "PyTorch `@CustomOp.register` provides a native C++/CUDA extension registration system that binds custom GPU kernels directly into PyTorch's C++ core runtime, TorchScript, and Autograd engines without Python interpreter latency.",
      sections: [
        {
          heading: "Overview & Theoretical Foundations",
          body: "Standard PyTorch operations are implemented as optimized C++ kernels registered in PyTorch dispatch tables. When high-performance ML workloads require custom hardware operations (such as FlashAttention or PagedAttention), writing the kernel in CUDA and registering it via PyTorch's native library mechanism allows seamless execution within PyTorch computational graphs.",
        },
        {
          heading: "Core Concepts & Algorithmic Design",
          body: "The custom op registration process involves four main components: (1) Declaring a formal functional schema (e.g. `my_namespace::custom_op(Tensor x) -> Tensor`), (2) Writing the host C++ wrapper function to extract raw device pointers from `at::Tensor`, (3) Launching the CUDA kernel configuration `<<<grid, block, shared_mem, stream>>>`, and (4) Registering the symbol using `TORCH_LIBRARY_IMPL` or `@torch.library.custom_op` in Python.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Bypassing Python runtime overhead during high-frequency execution saves critical CPU wall-clock latency in LLM serving loops. Furthermore, custom C++/CUDA wrappers enable fusing multiple memory-bound elementwise operations into a single kernel launch, dramatically reducing GPU DRAM memory bandwidth consumption.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key implementation nuances include handling input tensor contiguity (`tensor.is_contiguous()`), validating CUDA device indices against active PyTorch device contexts, releasing the Python Global Interpreter Lock (GIL) during heavy C++ computations, and registering custom backward pass autograd formulas for training.",
        },
      ],
      keyTerms: [
        {
          term: "CustomOp Registration",
          definition:
            "Mechanism to bind native C++ and CUDA code directly into PyTorch runtime dispatch tables.",
        },
        {
          term: "C++ Extension Wrapper",
          definition:
            "Bridge code that extracts raw device pointers and strides from PyTorch `at::Tensor` objects.",
        },
        {
          term: "CUDA Grid & Block Dispatch",
          definition:
            "GPU hardware thread hierarchy arrangement (`dim3 grid`, `dim3 block`) launched to execute kernels.",
        },
        {
          term: "Tensor Contiguity",
          definition:
            "Memory layout property ensuring multi-dimensional tensor elements occupy sequential physical memory addresses.",
        },
      ],
    },
    trivia: PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "PyTorch Custom Operators and C++ Extensions Documentation (PyTorch Core Team)",
      },
    ],
    defaultInput: DEFAULT_PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_INPUT,
    generateSteps: generatePytorchCustomCudaOpWrapperRegisterSteps,
  };

export default pytorchCustomCudaOpWrapperRegister;
