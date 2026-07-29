import {
  defineTraceItem,
  functionExecution,
  matrixSteps,
  profile,
  semanticStarter,
  verifiedSource,
} from "../../authoring";

const entrypoint = "tensor_layout";

const code = `import numpy as np

def tensor_layout(record):
    base = np.asarray(record["data"], dtype=record["dtype"])
    view = base.transpose(tuple(record["axes"]))
    return {
        "shape": list(view.shape),
        "strides": list(view.strides),
        "contiguous": bool(view.flags.c_contiguous),
        "shares_memory": bool(np.shares_memory(base, view)),
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Transpose the NumPy tensor and return shape, byte strides, C-contiguity, and whether it shares memory with the base.",
});

const execution = functionExecution({
  entrypoint,
  packages: ["numpy"],
  outputContract:
    "Return {shape, strides, contiguous, shares_memory} for base.transpose(axes); strides are byte strides.",
  cases: [
    {
      id: "matrix-transpose",
      label: "Float32 matrix transpose",
      input: {
        data: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        dtype: "float32",
        axes: [1, 0],
      },
      expected: {
        shape: [3, 2],
        strides: [4, 12],
        contiguous: false,
        shares_memory: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "identity-vector",
      label: "Int64 vector identity axes",
      input: { data: [1, 2, 3], dtype: "int64", axes: [0] },
      expected: {
        shape: [3],
        strides: [8],
        contiguous: true,
        shares_memory: true,
      },
      comparison: "deep-equal",
    },
    {
      id: "three-dimensional-swap",
      label: "Swap leading axes of a cube",
      input: {
        data: [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [5, 6],
            [7, 8],
          ],
        ],
        dtype: "float32",
        axes: [1, 0, 2],
      },
      expected: {
        shape: [2, 2, 2],
        strides: [8, 16, 4],
        contiguous: false,
        shares_memory: true,
      },
      comparison: "deep-equal",
    },
  ],
});

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
] as const;

export const tensorLayoutExplorer = defineTraceItem({
  id: "tensor-layout-explorer",
  title: "Tensor Layout Explorer",
  topicIds: ["ml_numerical_tensors"],
  difficultyProfile: profile(2, 3, 2, 2),
  description:
    "Trace how a transpose changes logical shape and byte strides while retaining a shared-memory view.",
  objective:
    "Use shape and strides to reason about a tensor view without assuming every transpose copies or remains contiguous.",
  completionEvidence:
    "Correct layout metadata for matrix, vector, and three-dimensional views plus a stride-based explanation.",
  sources: [
    verifiedSource({
      label: "NumPy copies and views",
      url: "https://numpy.org/doc/stable/user/basics.copies.html",
    }),
    verifiedSource({
      label: "NumPy ndarray strides",
      url: "https://numpy.org/doc/stable/reference/generated/numpy.ndarray.strides.html",
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
        codeLine: 4,
        what: "Materialize the contiguous 2 × 3 base matrix.",
        why: "The base establishes row-major byte strides [12, 4] for float32.",
        values: matrix,
        activeCells: [
          [0, 0],
          [0, 1],
          [0, 2],
        ],
        title: "shape [2,3] · strides [12,4]",
      },
      {
        codeLine: 5,
        what: "Swap the two logical axes without copying values.",
        why: "The view indexes the same buffer with the stride order reversed.",
        values: [
          [1, 4],
          [2, 5],
          [3, 6],
        ],
        activeCells: [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        title: "shape [3,2] · strides [4,12]",
      },
      {
        codeLine: 10,
        what: "Report the non-contiguous shared-memory view.",
        why: "Logical transpose order no longer matches C-contiguous traversal.",
        values: [
          [1, 4],
          [2, 5],
          [3, 6],
        ],
        completedCells: [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
          [2, 0],
          [2, 1],
        ],
        title: "view · shared memory · non-contiguous",
        variables: { sharesMemory: true, contiguous: false },
      },
    ]),
  assessmentPayload: {
    variant: "stride-order-change",
    changedContext: true,
    isomorphicRetest: true,
    prompt: "Predict shape, byte strides, contiguity, and aliasing after transpose.",
    currentState: "float32 base shape=[2,3], strides=[12,4], axes=[1,0]",
    referenceNextState: "shape=[3,2], strides=[4,12], contiguous=false, shares_memory=true",
  },
});
