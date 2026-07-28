import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProblemHeader } from "../ProblemHeader";

describe("ProblemHeader", () => {
  it("renders problem title, difficulty level badge, and every topic tag", () => {
    render(
      <ProblemHeader
        title="Merge Intervals"
        topicIds={["intervals", "two_pointers"]}
        difficulty="Medium"
      />,
    );

    expect(screen.getByText("Merge Intervals")).toBeInTheDocument();
    const difficultyBadge = screen.getByText("Medium");
    const topicBadge = screen.getByText("Intervals");
    expect(screen.getByText("Two Pointers")).toBeInTheDocument();
    expect(difficultyBadge).toBeInTheDocument();
    expect(topicBadge).toBeInTheDocument();
    expect(difficultyBadge).toHaveClass("ui-badge--md");
    expect(topicBadge).toHaveClass("ui-badge--md");
  });

  it("applies className and style when provided", () => {
    render(
      <ProblemHeader
        title="Merge Intervals"
        topicIds={["intervals"]}
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
    render(<ProblemHeader title="Merge Intervals" topicIds={["intervals"]} difficulty="Medium" />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders LeetCode badge when leetcode prop is provided", () => {
    render(
      <ProblemHeader
        title="Two Sum"
        topicIds={["arrays_and_hashing"]}
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
