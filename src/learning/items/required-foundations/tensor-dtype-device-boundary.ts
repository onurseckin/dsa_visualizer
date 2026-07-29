import {
  defineTraceItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "inspect_tensor_boundary";

const code = `import numpy as np

def inspect_tensor_boundary(record):
    if record["device"] != "cpu":
        raise ValueError("This NumPy exercise supports the CPU device only")
    tensor = np.asarray(record["data"], dtype=record["dtype"])
    return {
        "shape": list(tensor.shape),
        "dtype": str(tensor.dtype),
        "device": "cpu",
        "contiguous": bool(tensor.flags.c_contiguous),
        "nbytes": int(tensor.nbytes),
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Materialize the requested NumPy dtype on CPU and return shape, dtype, device, C-contiguity, and byte size.",
});

const execution = functionExecution({
  entrypoint,
  packages: ["numpy"],
  outputContract:
    "For the requested CPU NumPy array, return {shape, dtype, device, contiguous, nbytes} using JSON-native values.",
  cases: [
    {
      id: "float-matrix",
      label: "Float32 matrix",
      input: {
        data: [
          [1, 2],
          [3, 4],
        ],
        dtype: "float32",
        device: "cpu",
      },
      expected: {
        shape: [2, 2],
        dtype: "float32",
        device: "cpu",
        contiguous: true,
        nbytes: 16,
      },
      comparison: "deep-equal",
    },
    {
      id: "integer-vector",
      label: "Int64 vector",
      input: { data: [4, 5, 6], dtype: "int64", device: "cpu" },
      expected: {
        shape: [3],
        dtype: "int64",
        device: "cpu",
        contiguous: true,
        nbytes: 24,
      },
      comparison: "deep-equal",
    },
    {
      id: "boolean-row",
      label: "Boolean row",
      input: { data: [[true, false, true]], dtype: "bool", device: "cpu" },
      expected: {
        shape: [1, 3],
        dtype: "bool",
        device: "cpu",
        contiguous: true,
        nbytes: 3,
      },
      comparison: "deep-equal",
    },
  ],
});

const representativeMatrix = [
  [1, 2],
  [3, 4],
] as const;

export const tensorDtypeDeviceBoundary = defineTraceItem({
  id: "tensor-dtype-device-boundary",
  title: "Tensor Dtype and Device Boundary",
  topicIds: ["ml_python_scientific_computing"],
  difficultyProfile: profile(1, 2, 2, 2),
  description:
    "Trace how shape, dtype, device, contiguity, and storage size become explicit at a tensor boundary.",
  objective:
    "Inspect a concrete tensor representation without treating shape, dtype, layout, and device as interchangeable.",
  completionEvidence:
    "A passing NumPy boundary inspector and a trace that accounts for element count times dtype width.",
  sources: [
    verifiedSource({
      label: "NumPy ndarray",
      url: "https://numpy.org/doc/stable/reference/generated/numpy.ndarray.html",
    }),
    verifiedSource({
      label: "PyTorch tensor views",
      url: "https://docs.pytorch.org/docs/stable/tensor_view.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: () =>
    matrixSteps([
      {
        codeLine: 5,
        what: "Read the logical tensor values and requested dtype.",
        why: "Logical values do not yet expose physical byte width.",
        values: representativeMatrix,
        activeCells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
        title: "Logical 2 × 2 values",
        variables: { elementCount: 4 },
      },
      {
        codeLine: 5,
        what: "Materialize four float32 elements on CPU.",
        why: "The dtype fixes four bytes per element at this boundary.",
        values: representativeMatrix,
        activeCells: [[0, 0]],
        title: "float32 · 4 bytes per element",
        variables: { dtypeBytes: 4, device: "cpu" },
      },
      {
        codeLine: 11,
        what: "Report shape, layout, device, and total storage.",
        why: "Four contiguous float32 elements occupy exactly sixteen bytes.",
        values: representativeMatrix,
        completedCells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
        title: "C-contiguous · 16 bytes",
        variables: { nbytes: 16, invariant: "elements × dtype width" },
      },
    ]),
  assessmentPayload: {
    variant: "changed-dtype-width",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict the representation metadata after materialization.",
    currentState: "A 2 × 2 logical matrix is requested as float32 on CPU.",
    referenceNextState: "shape=[2,2], dtype=float32, contiguous=true, nbytes=16",
  },
});
