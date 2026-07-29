import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createAttemptRecord } from "../../../../learning/progress/types";
import { AttemptSelfReview } from "../AttemptSelfReview";

const attempt = createAttemptRecord({
  itemId: "queue-review",
  mode: "trace",
  variant: "changed-queue",
  response: { prediction: "A runs" },
  gradingStatus: "pending",
  score: 0,
  rubric: [{ id: "prediction", score: 0, maxScore: 1 }],
  criticalFailures: [],
  confidence: 3,
  misconceptionCodes: [],
  repairedMisconceptionCodes: [],
  isomorphicRetest: false,
  changedContext: true,
  invariantEvidence: "",
  tradeoffEvidence: "",
  createdAt: 100,
  updatedAt: 100,
});

const criteria = [
  {
    id: "prediction",
    label: "Prediction",
    description: "The state matches the authored transition.",
    points: 1,
    critical: true,
  },
] as const;

describe("AttemptSelfReview", () => {
  afterEach(cleanup);

  it("lets a learner check and uncheck evidence before saving", () => {
    const onReview = vi.fn(() => true);
    render(
      <AttemptSelfReview
        title="Queue review"
        attempt={attempt}
        criteria={criteria}
        onReview={onReview}
      />,
    );
    const checkbox = screen.getByRole("checkbox", { name: /prediction/i });

    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Save reviewed grade" }));

    expect(onReview).toHaveBeenCalledWith([]);
    expect(screen.getByRole("status")).toHaveTextContent("Reviewed grade saved.");
  });

  it("preserves the pending attempt when persistence rejects the review", () => {
    render(
      <AttemptSelfReview
        title="Queue review"
        attempt={attempt}
        criteria={criteria}
        onReview={() => false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save reviewed grade" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/pending attempt was preserved/i);
  });
});
