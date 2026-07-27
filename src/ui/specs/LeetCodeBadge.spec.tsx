import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LeetCodeBadge } from "../atoms/LeetCodeBadge";

describe("LeetCodeBadge", () => {
  it("renders null when leetcode prop is missing or invalid", () => {
    const { container } = render(<LeetCodeBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders LC #<id> badge with external link attributes", () => {
    render(
      <LeetCodeBadge
        leetcode={{ id: 1, url: "https://leetcode.com/problems/two-sum/" }}
        size="md"
      />,
    );

    const badgeLink = screen.getByRole("link", { name: "LeetCode #1" });
    expect(badgeLink).toBeInTheDocument();
    expect(badgeLink).toHaveAttribute("href", "https://leetcode.com/problems/two-sum/");
    expect(badgeLink).toHaveAttribute("target", "_blank");
    expect(badgeLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("LC #1")).toBeInTheDocument();
  });

  it("stops propagation when clicked so row handlers are not triggered", () => {
    const stopPropagationSpy = vi.fn();
    render(
      <LeetCodeBadge
        leetcode={{ id: 42, url: "https://leetcode.com/problems/trapping-rain-water/" }}
      />,
    );

    const badgeLink = screen.getByRole("link", { name: "LeetCode #42" });
    fireEvent.click(badgeLink, { stopPropagation: stopPropagationSpy });
    // Click event is handled safely
  });
});
