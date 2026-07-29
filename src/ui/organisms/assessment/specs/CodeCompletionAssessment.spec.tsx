import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CodeCompletionAssessment } from "../CodeCompletionAssessment";

describe("CodeCompletionAssessment", () => {
  it("collects a semantic completion and consequence explanation rather than random-line recall", () => {
    render(
      <CodeCompletionAssessment
        payload={{
          prompt: "Complete the stable normalization decision.",
          context: "shifted = logits - logits.max()\nprobabilities = ___",
          requiredConcepts: ["normalization", "stability"],
          consequencePrompt: "What fails if the stabilizing decision is removed?",
        }}
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
  });
});
