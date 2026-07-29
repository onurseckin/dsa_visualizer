import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CalculatorAssessment } from "../CalculatorAssessment";

describe("CalculatorAssessment", () => {
  it("requires an estimate before checking a unit-aware result within tolerance", () => {
    const onSubmit = vi.fn(() => true);
    render(
      <CalculatorAssessment
        title="KV memory"
        payload={{
          variant: "fixed-kv-shape",
          changedContext: true,
          isomorphicRetest: false,
          prompt: "Estimate the memory needed for the cache.",
          inputs: [{ id: "tokens", label: "Tokens", unit: "tokens", defaultValue: "1024" }],
          result: { value: 2, unit: "GiB", tolerance: 0.05 },
        }}
        submissionContext={{ confidence: 5, invariantEvidence: "", tradeoffEvidence: "" }}
        onSubmit={onSubmit}
      />,
    );

    const authoredInput = screen.getByRole("textbox", { name: "Calculator input: Tokens" });
    expect(authoredInput).toHaveValue("1024");
    expect(authoredInput).toHaveAttribute("readonly");
    expect(screen.getByText(/fixed authored variant inputs/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("spinbutton", { name: "Exact result" }), {
      target: { value: "2.03" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check result" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Provide an estimate first");

    fireEvent.change(screen.getByRole("spinbutton", { name: "Estimate" }), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

    expect(screen.getByRole("status")).toHaveTextContent("within the authored tolerance");
    expect(screen.getByText("Reference: 2 GiB ± 0.05")).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "calculator",
        variant: "fixed-kv-shape",
        changedContext: true,
        gradingStatus: "graded",
        score: 1,
        response: expect.objectContaining({ exact: 2.03, unit: "GiB" }),
      }),
    );
  });

  it("saves an edited result unit and explains the authored unit requirement", () => {
    const onSubmit = vi.fn(() => true);
    render(
      <CalculatorAssessment
        title="KV memory"
        payload={{
          variant: "fixed-kv-shape",
          changedContext: true,
          isomorphicRetest: false,
          prompt: "Estimate the memory needed for the cache.",
          inputs: [],
          result: { value: 2, unit: "GiB", tolerance: 0.05 },
        }}
        submissionContext={{ confidence: 5, invariantEvidence: "", tradeoffEvidence: "" }}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByRole("spinbutton", { name: "Estimate" }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Exact result" }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Result unit" }), {
      target: { value: "MiB" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check result" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Use the authored result unit: GiB.");
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ response: expect.objectContaining({ unit: "MiB" }) }),
    );
  });
});
