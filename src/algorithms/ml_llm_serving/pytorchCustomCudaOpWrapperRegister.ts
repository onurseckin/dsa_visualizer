import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface pytorchCustomCudaOpWrapperRegisterInput {
  data: number[];
  target?: number;
}

export const PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_CODE = `def pytorch_custom_cuda_op_wrapper_register(data: list[int], target: int = 30) -> list[int]:
    """
    Simulates PyTorch @torch.library.custom_op registration and CUDA kernel dispatching.
    Validates tensor input buffers, dispatches thread block grid, and executes C++ kernel.
    """
    output_buffer = []
    grid_dim = len(data)

    for thread_id in range(grid_dim):
        val = data[thread_id]
        if val == target:
            processed_val = val * 2
        else:
            processed_val = val
        output_buffer.append(processed_val)

    return output_buffer
`;

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
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
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
        customState: {
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    6,
    "Initialize PyTorch `@CustomOp.register` C++ CUDA Kernel Register",
    "Setting up C++ extension schema bindings and GPU grid/block thread execution structures.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`thread_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      10,
      `Process element ${idx}: value = ${val}`,
      `Executing custom C++ CUDA thread block for element ${idx}. Target match = ${isTarget}.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    17,
    "Execution Complete",
    "Successfully dispatched CUDA kernel, unwrapped PyTorch C++ output tensor, and returned result buffer.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const PYTORCHCUSTOMCUDAOPWRAPPERREGISTER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 10, hint: "Process elements sequentially in GPU device memory." }],
  lineExplanations: {
    6: "Defines entry point for PyTorch `@CustomOp.register` C++ CUDA Kernel Register.",
    10: "Dispatches CUDA thread blocks across input tensor memory.",
    17: "Returns computed result array to PyTorch Python runtime.",
  },
};

export const pytorchCustomCudaOpWrapperRegister: AlgorithmDefinition<pytorchCustomCudaOpWrapperRegisterInput> =
  {
    id: "pytorch-custom-cuda-op-wrapper-register",
    title: "PyTorch `@CustomOp.register` C++ CUDA Kernel Register",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Integrating custom high-performance C++ and CUDA operators (such as FlashAttention, PagedAttention, or custom quantized GEMMs) into PyTorch model computational graphs requires registering native extension bindings via PyTorch's `torch.library.custom_op` API. This pattern exposes C++ CUDA kernels directly to PyTorch autograd engine, managing device pointer unwrapping, contiguous memory layout validation, schema type checking, and stream synchronization.\n\nInput Format:\n- `data`: Array of numerical values representing a GPU/CPU input tensor buffer.\n- `target`: Optional target value or scalar threshold for thread-level kernel execution.\n\nOutput Format:\n- Returns an array representing the output tensor buffer post C++/CUDA kernel execution.\n\nEdge Cases & Constraints:\n- Non-contiguous input tensors must be converted via `.contiguous()` before launching CUDA kernels to prevent invalid memory indexing.\n- Device mismatch errors when passing host memory pointers to CUDA device kernels.\n- Pointer alignment boundaries (128-bit vector loads) required for optimal SIMD/SIMT GPU throughput.",
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
      time: "O(N) parallel runtime across N threads in GPU grid dispatch.",
      space: "O(N) memory allocation for target output tensor buffer.",
    },
    topicGuide: {
      overview:
        "PyTorch `@CustomOp.register` provides a native C++/CUDA extension registration system that binds custom GPU kernels directly into PyTorch's C++ core runtime, TorchScript, and Autograd engines without Python interpreter latency.",
      sections: [
        {
          heading: "1. Overview & Theoretical Foundations",
          body: "Standard PyTorch operations are implemented as optimized C++ kernels registered in PyTorch dispatch tables. When high-performance ML workloads require custom hardware operations (such as FlashAttention or PagedAttention), writing the kernel in CUDA and registering it via PyTorch's native library mechanism allows seamless execution within PyTorch computational graphs.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "The custom op registration process involves four main components: (1) Declaring a formal functional schema (e.g. `my_namespace::custom_op(Tensor x) -> Tensor`), (2) Writing the host C++ wrapper function to extract raw device pointers from `at::Tensor`, (3) Launching the CUDA kernel configuration `<<<grid, block, shared_mem, stream>>>`, and (4) Registering the symbol using `TORCH_LIBRARY_IMPL` or `@torch.library.custom_op` in Python.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "Bypassing Python runtime overhead during high-frequency execution saves critical CPU wall-clock latency in LLM serving loops. Furthermore, custom C++/CUDA wrappers enable fusing multiple memory-bound elementwise operations into a single kernel launch, dramatically reducing GPU DRAM memory bandwidth consumption.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
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
