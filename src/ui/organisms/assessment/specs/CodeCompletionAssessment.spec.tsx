import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CodeCompletionAssessment } from "../CodeCompletionAssessment";

describe("CodeCompletionAssessment", () => {
  it("collects a semantic completion and consequence explanation rather than random-line recall", () => {
    const onSubmit = vi.fn(() => true);
    render(
      <CodeCompletionAssessment
        payload={{
          variant: "stable-softmax",
          changedContext: false,
          isomorphicRetest: false,
          prompt: "Complete the stable normalization decision.",
          context: "shifted = logits - logits.max()\nprobabilities = ___",
          requiredConcepts: ["normalization", "stability"],
          consequencePrompt: "What fails if the stabilizing decision is removed?",
        }}
        submissionContext={{
          confidence: 4,
          invariantEvidence: "Probabilities stay normalized.",
          tradeoffEvidence: "",
        }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Semantic completion" }), {
      target: { value: "exp(shifted) / exp(shifted).sum()" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Why this preserves the invariant" }), {
      target: { value: "Normalization keeps probabilities stable and summing to one." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit completion" }));

    expect(screen.getByRole("status")).toHaveTextContent("submitted for semantic review");
    expect(screen.getByText("normalization")).toBeInTheDocument();
    expect(screen.getByText("stability")).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "code-completion",
        gradingStatus: "pending",
        response: expect.objectContaining({
          completion: "exp(shifted) / exp(shifted).sum()",
        }),
      }),
    );
  });

  it("does not claim submission or review when persistence declines the completion", () => {
    render(
      <CodeCompletionAssessment
        payload={{
          variant: "stable-softmax",
          changedContext: false,
          isomorphicRetest: false,
          prompt: "Complete the stable normalization decision.",
          context: "probabilities = ___",
          requiredConcepts: ["normalization"],
          consequencePrompt: "What fails without normalization?",
        }}
        submissionContext={{
          confidence: 3,
          invariantEvidence: "",
          tradeoffEvidence: "",
        }}
        onSubmit={() => false}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Semantic completion" }), {
      target: { value: "exp(logits) / exp(logits).sum()" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Why this preserves the invariant" }), {
      target: { value: "The probabilities sum to one." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit completion" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Completion was not submitted or saved. No semantic review was queued.",
    );
    expect(screen.getByRole("alert")).not.toHaveTextContent(/pending/i);
  });
});
