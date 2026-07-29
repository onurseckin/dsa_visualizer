import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalculatorAssessment } from "../CalculatorAssessment";

describe("CalculatorAssessment", () => {
  it("requires an estimate before checking a unit-aware result within tolerance", () => {
    render(
      <CalculatorAssessment
        title="KV memory"
        payload={{
          prompt: "Estimate the memory needed for the cache.",
          inputs: [{ id: "tokens", label: "Tokens", unit: "tokens", defaultValue: "1024" }],
          result: { value: 2, unit: "GiB", tolerance: 0.05 },
        }}
      />,
    );

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
  });
});
