import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldLabel } from "../FieldLabel";

describe("FieldLabel render spec", () => {
  it("renders label and optional hint", () => {
    render(<FieldLabel label="Username" hint="Enter unique handle" htmlFor="user-input" />);
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Enter unique handle")).toBeInTheDocument();
  });

  it("renders required asterisk when required is true", () => {
    render(<FieldLabel label="Password" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
