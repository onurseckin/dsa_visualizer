import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { determinismTriage } from "../../../../learning/items/required-foundations";
import { createMasteryScope, evaluateMastery } from "../../../../learning/progress/grading";
import { createAttemptStorage } from "../../../../learning/progress/storage";
import { createAttemptRecord } from "../../../../learning/progress/types";
import { AssessmentWorkspace } from "../AssessmentWorkspace";

const persistedCriticalFailure = (variant = "platform-and-release-change") =>
  createAttemptRecord({
    itemId: "determinism-triage",
    mode: "scenario",
    variant,
    response: { decision: "A seed is sufficient." },
    gradingStatus: "graded",
    score: 2 / 7,
    rubric: [
      { id: "evidence-boundary", score: 0, maxScore: 3 },
      { id: "controlled-replay", score: 2, maxScore: 2 },
      { id: "scoped-guarantee", score: 0, maxScore: 2 },
    ],
    criticalFailures: ["evidence-boundary", "scoped-guarantee"],
    confidence: 3,
    misconceptionCodes: [],
    repairedMisconceptionCodes: [],
    isomorphicRetest: false,
    changedContext: false,
    invariantEvidence: "",
    tradeoffEvidence: "",
    createdAt: 100,
    updatedAt: 200,
  });

describe("critical repair workspace flow", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("moves from failed self-review through an explicit changed-case repair to no unresolved failures", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    let timestamp = 100;
    render(
      <AssessmentWorkspace item={determinismTriage} storage={storage} now={() => timestamp} />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Decision" }), {
      target: { value: "Replay from the recorded seed." },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Rationale" }), {
      target: { value: "The seed controls the random stream." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save response" }));

    const firstReview = screen.getByRole("region", {
      name: "Determinism Triage self review",
    });
    fireEvent.click(within(firstReview).getByRole("checkbox", { name: /controlled replay/i }));
    timestamp = 200;
    fireEvent.click(within(firstReview).getByRole("button", { name: "Save reviewed grade" }));

    expect(storage.load()[0]).toMatchObject({
      gradingStatus: "graded",
      criticalFailures: ["evidence-boundary", "scoped-guarantee"],
    });
    const repair = screen.getByRole("region", {
      name: "Determinism Triage critical repair",
    });
    expect(within(repair).getByText("evidence-boundary")).toBeInTheDocument();
    expect(within(repair).getByText("scoped-guarantee")).toBeInTheDocument();

    fireEvent.change(within(repair).getByRole("combobox", { name: "Changed-context case" }), {
      target: { value: "missing-boundaries" },
    });
    fireEvent.change(
      within(repair).getByRole("textbox", { name: "Changed-context repair evidence" }),
      {
        target: {
          value:
            "This record is missing the seed and platform, so both must be captured before a controlled replay.",
        },
      },
    );
    timestamp = 300;
    fireEvent.click(within(repair).getByRole("button", { name: "Submit changed-context repair" }));

    expect(storage.load()[1]).toMatchObject({
      gradingStatus: "pending",
      variant: "repair-missing-boundaries",
      repairedMisconceptionCodes: ["evidence-boundary", "scoped-guarantee"],
      isomorphicRetest: true,
      changedContext: true,
    });
    expect(within(repair).getByRole("status")).toHaveTextContent(
      /changed-context repair awaits self-review/i,
    );

    const repairReview = screen.getByRole("region", {
      name: "Determinism Triage self review",
    });
    const authoredRepairReference = within(repairReview).getByRole("region", {
      name: "Authored changed-context repair reference",
    });
    expect(authoredRepairReference).toHaveTextContent('"expected": [');
    expect(authoredRepairReference).toHaveTextContent('"seed"');
    expect(authoredRepairReference).toHaveTextContent('"platform"');
    expect(authoredRepairReference).toHaveTextContent('"comparison": "deep-equal"');
    for (const checkbox of within(repairReview).getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    timestamp = 400;
    fireEvent.click(within(repairReview).getByRole("button", { name: "Save reviewed grade" }));

    const result = evaluateMastery(storage.load(), {
      targetId: "determinism-triage",
      itemIds: ["determinism-triage"],
    });
    expect(result.unresolvedCriticalFailures).toEqual([]);
    expect(screen.queryByRole("region", { name: "Determinism Triage critical repair" })).toBeNull();
  });

  it("requires evidence and excludes a case whose repair variant is already failing", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    storage.save(persistedCriticalFailure("repair-complete-record"));
    render(<AssessmentWorkspace item={determinismTriage} storage={storage} now={() => 300} />);

    const repair = screen.getByRole("region", {
      name: "Determinism Triage critical repair",
    });
    expect(
      within(repair).queryByRole("option", { name: "Complete replay record" }),
    ).not.toBeInTheDocument();
    fireEvent.click(within(repair).getByRole("button", { name: "Submit changed-context repair" }));

    expect(storage.load()).toHaveLength(1);
    expect(within(repair).getByRole("alert")).toHaveTextContent(/evidence/i);
    expect(
      evaluateMastery(
        storage.load(),
        createMasteryScope({
          targetId: "determinism-triage",
          itemIds: ["determinism-triage"],
        }),
      ).unresolvedCriticalFailures,
    ).toEqual(["evidence-boundary", "scoped-guarantee"]);
  });

  it("waits for an ordinary pending response without relabeling it as a repair", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const failure = persistedCriticalFailure();
    storage.save(failure);
    storage.save(
      createAttemptRecord({
        ...failure,
        variant: "new-static-response",
        gradingStatus: "pending",
        score: 0,
        rubric: failure.rubric.map((dimension) => ({
          ...dimension,
          score: 0,
        })) as unknown as typeof failure.rubric,
        criticalFailures: [],
        createdAt: 300,
        updatedAt: 300,
      }),
    );

    render(<AssessmentWorkspace item={determinismTriage} storage={storage} now={() => 400} />);

    const repair = screen.getByRole("region", {
      name: "Determinism Triage critical repair",
    });
    expect(
      within(repair).getByRole("button", { name: "Submit changed-context repair" }),
    ).toBeDisabled();
    expect(within(repair).getByRole("status")).toHaveTextContent(
      /finish the existing self-review first/i,
    );
    expect(storage.load()[1]).toMatchObject({
      variant: "new-static-response",
      repairedMisconceptionCodes: [],
      changedContext: false,
      isomorphicRetest: false,
    });
  });

  it("refuses to review a persisted repair whose case is not in the authored execution spec", () => {
    const storage = createAttemptStorage({ sync: vi.fn() });
    const failure = persistedCriticalFailure();
    storage.save(failure);
    storage.save(
      createAttemptRecord({
        ...failure,
        variant: "repair-invented-case",
        response: {
          repairCase: {
            id: "invented-case",
            label: "Invented",
            input: { anything: true },
            expected: "trust me",
            comparison: "deep-equal",
          },
          changedContextEvidence: "This is not tied to an authored oracle.",
        },
        gradingStatus: "pending",
        score: 0,
        rubric: failure.rubric.map((dimension) => ({
          ...dimension,
          score: 0,
        })) as unknown as typeof failure.rubric,
        criticalFailures: [],
        repairedMisconceptionCodes: ["evidence-boundary", "scoped-guarantee"],
        changedContext: true,
        isomorphicRetest: true,
        invariantEvidence: "This is not tied to an authored oracle.",
        createdAt: 300,
        updatedAt: 300,
      }),
    );

    render(<AssessmentWorkspace item={determinismTriage} storage={storage} now={() => 400} />);

    const review = screen.getByRole("region", {
      name: "Determinism Triage self review",
    });
    for (const checkbox of within(review).getAllByRole("checkbox")) {
      fireEvent.click(checkbox);
    }
    fireEvent.click(within(review).getByRole("button", { name: "Save reviewed grade" }));

    expect(storage.load()[1]).toMatchObject({ gradingStatus: "pending" });
    expect(screen.getByText(/repair provenance is invalid/i)).toBeInTheDocument();
    expect(
      evaluateMastery(
        storage.load(),
        createMasteryScope({
          targetId: "determinism-triage",
          itemIds: ["determinism-triage"],
        }),
      ).unresolvedCriticalFailures,
    ).toEqual(["evidence-boundary", "scoped-guarantee"]);
  });
});
