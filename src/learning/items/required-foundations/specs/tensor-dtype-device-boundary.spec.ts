import { expect, it } from "vitest";
import { getLearningItemPlayground } from "../../../types";
import { tensorDtypeDeviceBoundary } from "../tensor-dtype-device-boundary";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(tensorDtypeDeviceBoundary, {
  id: "tensor-dtype-device-boundary",
  kind: "trace",
  snapshotKind: "matrix",
  contractTerm: "nbytes",
});

it("traces boundary metadata, broadcast shape, and copy-versus-view behavior", () => {
  const playground = getLearningItemPlayground(tensorDtypeDeviceBoundary);
  if (!playground) throw new Error("tensor-dtype-device-boundary: missing playground");
  const execution = playground.execution;
  expect(execution.outputContract).toContain("broadcast_shape");
  expect(execution.outputContract).toContain("shares_memory");
  expect(playground.code).not.toContain("supports the CPU device only");
  expect(execution.cases).toContainEqual(
    expect.objectContaining({
      id: "broadcast-view",
      expected: expect.objectContaining({
        broadcast_shape: [2, 3],
        shares_memory: true,
      }),
    }),
  );
  expect(execution.cases).toContainEqual(
    expect.objectContaining({
      id: "scalar-peer",
      input: expect.objectContaining({ peer_shape: [] }),
      expected: expect.objectContaining({
        source_shape: [3],
        shape: [3],
        broadcast_shape: [3],
      }),
    }),
  );
  const scalarPeer = execution.cases.find((testCase) => testCase.id === "scalar-peer");
  if (!scalarPeer) throw new Error("tensor-dtype-device-boundary: missing scalar peer");
  const logicalShapeVisual = JSON.stringify(
    playground.generateSteps(scalarPeer.input)[0]?.primarySnapshot,
  );
  expect(logicalShapeVisual).toContain("[3]");
  expect(logicalShapeVisual).not.toContain("1 × 3");
  const rankThreeVisual = JSON.stringify(
    playground.generateSteps({
      data: [[[1, 2]], [[3, 4]]],
      source_dtype: "int64",
      dtype: "int64",
      conversion: "view",
      peer_shape: [1, 2],
    })[0]?.primarySnapshot,
  );
  expect(rankThreeVisual).toContain("[2,1,2]");
  expect(playground.generateSteps(execution.cases[0]!.input)).not.toEqual(
    playground.generateSteps(execution.cases[1]!.input),
  );
});
