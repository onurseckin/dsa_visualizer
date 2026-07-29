import { describe, expect, it } from "vitest";

import { trainingLoopState } from "../training-loop-state";
import { getLearningItemPlayground } from "../../../types";
import { describeRequiredFoundation } from "./focusedItemSpec";

describeRequiredFoundation(trainingLoopState, {
  id: "training-loop-state",
  kind: "debugging",
  snapshotKind: "array",
  contractTerm: "zero_grad",
});

const requiredTransitions = [
  "forward",
  "loss",
  "backward",
  "zero_grad",
  "optimizer_step",
  "accumulated_gradient",
  "train_mode",
  "eval_mode",
  "checkpoint",
] as const;

describe("training loop transition contract", () => {
  it("covers the full ordered train/eval and checkpoint state machine", () => {
    const playground = getLearningItemPlayground(trainingLoopState);
    expect(playground).toBeDefined();
    if (!playground) return;
    const authoredEvidence = JSON.stringify({
      code: playground.code,
      contract: playground.execution.outputContract,
      cases: playground.execution.cases,
      assessment: trainingLoopState.assessment,
    });

    for (const transition of requiredTransitions) {
      expect(authoredEvidence).toContain(transition);
    }
    expect(playground.execution.entrypoint).toBe("execute_training_schedule");
    expect(playground.execution.cases.map((testCase) => testCase.id)).toEqual([
      "single-train-step",
      "gradient-accumulation",
      "resume-partial-accumulation",
      "evaluation-mode",
    ]);
  });

  it("visualizes the faithful event ordering through the returned checkpoint", () => {
    const playground = getLearningItemPlayground(trainingLoopState);
    expect(playground).toBeDefined();
    if (!playground) return;
    const steps = playground.generateSteps(playground.execution.cases[0].input);
    const explanations = steps.map((step) => step.explanation.what).join(" ");

    expect(steps.length).toBeGreaterThanOrEqual(8);
    expect(explanations).toMatch(
      /train mode.*zero.*forward.*loss.*backward.*accumulat.*optimizer.*checkpoint/i,
    );
  });
});
