import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemHeader } from "../ProblemHeader";

describe("ProblemHeader", () => {
  it("renders problem title, difficulty level badge, and category tag", () => {
    render(<ProblemHeader title="Merge Intervals" category="intervals" difficulty="Medium" />);

    expect(screen.getByText("Merge Intervals")).toBeInTheDocument();
    const difficultyBadge = screen.getByText("Medium");
    const categoryBadge = screen.getByText("Intervals");
    expect(difficultyBadge).toBeInTheDocument();
    expect(categoryBadge).toBeInTheDocument();
    expect(difficultyBadge).toHaveClass("ui-badge--md");
    expect(categoryBadge).toHaveClass("ui-badge--md");
  });

  it("applies className and style when provided", () => {
    render(
      <ProblemHeader
        title="Merge Intervals"
        category="intervals"
        difficulty="Medium"
        className="custom-class"
        style={{ opacity: 0.5 }}
      />,
    );

    const header = screen.getByTestId("problem-header");
    expect(header).toHaveClass("custom-class");
    expect(header).toHaveStyle({ opacity: "0.5" });
  });

  it("does not render any toggle buttons", () => {
    render(<ProblemHeader title="Merge Intervals" category="intervals" difficulty="Medium" />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders LeetCode badge when leetcode prop is provided", () => {
    render(
      <ProblemHeader
        title="Two Sum"
        category="arrays_and_hashing"
        difficulty="Easy"
        leetcode={{ id: 1, url: "https://leetcode.com/problems/two-sum/" }}
      />,
    );

    const leetcodeBadge = screen.getByText("LC #1");
    expect(leetcodeBadge).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "LeetCode #1" });
    expect(link).toHaveAttribute("href", "https://leetcode.com/problems/two-sum/");
  });
});
