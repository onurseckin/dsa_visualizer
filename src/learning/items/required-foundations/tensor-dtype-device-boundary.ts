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
    source = np.array(record["data"], dtype=record["source_dtype"])
    if record["conversion"] == "view":
        tensor = np.asarray(source, dtype=record["dtype"])
    else:
        tensor = np.array(source, dtype=record["dtype"], copy=True)
    peer_shape = tuple(record["peer_shape"])
    return {
        "source_shape": list(source.shape),
        "shape": list(tensor.shape),
        "dtype": str(tensor.dtype),
        "device": "numpy-host",
        "broadcast_shape": list(np.broadcast_shapes(tensor.shape, peer_shape)),
        "shares_memory": bool(np.shares_memory(source, tensor)),
        "copy_made": not bool(np.shares_memory(source, tensor)),
        "nbytes": int(tensor.nbytes),
    }`;

const starterCode = semanticStarter({
  entrypoint,
  parameters: ["record"],
  contract:
    "Create a NumPy-host array/tensor boundary and return source shape, shape, dtype, host device label, broadcast shape, copy/view memory sharing, and byte size.",
});

const execution = functionExecution({
  entrypoint,
  packages: ["numpy"],
  outputContract:
    "Return {source_shape, shape, dtype, device, broadcast_shape, shares_memory, copy_made, nbytes}. The exercise models a NumPy-host boundary; it does not claim accelerator availability. Compute broadcast_shape without materializing the broadcast.",
  cases: [
    {
      id: "broadcast-view",
      label: "Float32 array view broadcasts with a feature vector",
      input: {
        data: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        source_dtype: "float32",
        dtype: "float32",
        conversion: "view",
        peer_shape: [3],
      },
      expected: {
        source_shape: [2, 3],
        shape: [2, 3],
        dtype: "float32",
        device: "numpy-host",
        broadcast_shape: [2, 3],
        shares_memory: true,
        copy_made: false,
        nbytes: 24,
      },
      comparison: "deep-equal",
    },
    {
      id: "dtype-copy",
      label: "Dtype conversion deliberately makes an independent copy",
      input: {
        data: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        source_dtype: "int32",
        dtype: "float32",
        conversion: "copy",
        peer_shape: [1, 3],
      },
      expected: {
        source_shape: [2, 3],
        shape: [2, 3],
        dtype: "float32",
        device: "numpy-host",
        broadcast_shape: [2, 3],
        shares_memory: false,
        copy_made: true,
        nbytes: 24,
      },
      comparison: "deep-equal",
    },
    {
      id: "scalar-peer",
      label: "Int64 vector broadcasts with a scalar without allocating a tiled tensor",
      input: {
        data: [4, 5, 6],
        source_dtype: "int64",
        dtype: "int64",
        conversion: "view",
        peer_shape: [],
      },
      expected: {
        source_shape: [3],
        shape: [3],
        dtype: "int64",
        device: "numpy-host",
        broadcast_shape: [3],
        shares_memory: true,
        copy_made: false,
        nbytes: 24,
      },
      comparison: "deep-equal",
    },
  ],
});

export const tensorDtypeDeviceBoundary = defineTraceItem({
  id: "tensor-dtype-device-boundary",
  title: "Tensor Dtype and Device Boundary",
  topicIds: ["ml_python_scientific_computing"],
  difficultyProfile: profile(2, 3, 2, 2),
  description:
    "Trace an explicit NumPy-host array/tensor boundary: shape, dtype, host device label, broadcasting, and copy-versus-view memory behavior.",
  objective:
    "Inspect shape, dtype, host placement, broadcast compatibility, and ownership independently without asserting that unavailable accelerator hardware exists.",
  completionEvidence:
    "A passing boundary inspector distinguishes a view from a copy, reports broadcast output shape without allocation, and accounts for dtype-dependent byte size.",
  sources: [
    verifiedSource({
      label: "NumPy broadcasting",
      url: "https://numpy.org/doc/stable/user/basics.broadcasting.html",
    }),
    verifiedSource({
      label: "NumPy shares_memory",
      url: "https://numpy.org/doc/stable/reference/generated/numpy.shares_memory.html",
    }),
  ],
  code,
  starterCode,
  execution,
  generateSteps: (value) => {
    const record = value as {
      data: unknown;
      source_dtype: string;
      dtype: string;
      conversion: string;
      peer_shape: readonly number[];
    };
    const logicalShape = (current: unknown): readonly number[] => {
      if (!Array.isArray(current)) return [];
      if (current.length === 0) return [0];
      const childShapes = current.map(logicalShape);
      const firstChildShape = childShapes[0] ?? [];
      const rectangular = childShapes.every(
        (shape) => JSON.stringify(shape) === JSON.stringify(firstChildShape),
      );
      return rectangular ? [current.length, ...firstChildShape] : [current.length];
    };
    const shape = logicalShape(record.data);
    return matrixSteps([
      {
        codeLine: 4,
        what: "Materialize the supplied array shape and source dtype on the NumPy host.",
        why: "The exercise names its host boundary rather than implying a device that was not used.",
        values: [
          ["logical shape", JSON.stringify(shape)],
          ["source dtype", record.source_dtype],
        ],
        colHeaders: ["metadata", "value"],
        activeCells: [
          [0, 1],
          [1, 1],
        ],
      },
      {
        codeLine: 6,
        what: "Choose an explicit view or copy while converting to the requested dtype.",
        why: "Matching dtypes can preserve storage; explicit copying creates independent storage.",
        values: [
          ["requested dtype", record.dtype],
          ["conversion", record.conversion],
        ],
        colHeaders: ["boundary choice", "value"],
        activeCells: [
          [0, 1],
          [1, 1],
        ],
      },
      {
        codeLine: 10,
        what: "Check broadcast compatibility against the supplied peer shape.",
        why: "Broadcasting changes the logical result shape without requiring a tiled allocation.",
        values: [
          ["peer shape", JSON.stringify(record.peer_shape)],
          ["broadcast", "validate trailing dimensions"],
        ],
        colHeaders: ["operation", "evidence"],
        completedCells: [
          [0, 1],
          [1, 1],
        ],
      },
    ]);
  },
  assessmentPayload: {
    variant: "array-tensor-boundary",
    changedContext: true,
    isomorphicRetest: true,
    prompt:
      "Predict shape, broadcast compatibility, and whether the requested conversion shares memory.",
    currentState:
      "The artifact is a NumPy-host array boundary, not a claim about an accelerator runtime.",
    referenceNextState:
      "A dtype-preserving asarray view can share memory; an explicit copy cannot.",
  },
});
