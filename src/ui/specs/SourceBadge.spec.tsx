import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SourceBadge, SourceBadgeList, BookBadge, StandardBadge } from "../atoms/SourceBadge";
import type { BookSource, LeetCodeSource, StandardSource } from "../atoms/SourceBadge";
import type { LearningSource } from "../../learning/types";

describe("BookBadge", () => {
  it("renders null when book prop or required fields are missing", () => {
    const { container } = render(<BookBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders BookBadge with book object prop", () => {
    const book: BookSource = {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 12,
      chapterTitle: "Graph algorithms",
      section: "12.1",
    };

    render(<BookBadge book={book} />);

    expect(screen.getByText("CP Handbook Ch 12")).toBeInTheDocument();
    const badge = screen.getByTitle(
      "Competitive Programmer's Handbook — Chapter 12: Graph algorithms (12.1)",
    );
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute(
      "aria-label",
      "Competitive Programmer's Handbook — Chapter 12: Graph algorithms (12.1)",
    );
    expect(badge.className).toContain("text-cyan-300");
    expect(badge.className).toContain("border-indigo-500/30");
    expect(badge.className).toContain("bg-indigo-950/40");
  });

  it("renders BookBadge with individual props and custom shortTitle", () => {
    render(
      <BookBadge
        bookTitle="Introduction to Algorithms"
        chapter="4"
        chapterTitle="Divide-and-Conquer"
        section="4.1"
        shortTitle="CLRS"
      />,
    );

    expect(screen.getByText("CLRS Ch 4")).toBeInTheDocument();
    expect(
      screen.getByTitle("Introduction to Algorithms — Chapter 4: Divide-and-Conquer (4.1)"),
    ).toBeInTheDocument();
  });
});

describe("StandardBadge", () => {
  it("renders Standard badge", () => {
    render(<StandardBadge />);
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });
});

describe("SourceBadge", () => {
  it("renders null when source prop is missing", () => {
    const { container } = render(<SourceBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders LeetCodeBadge when kind === 'leetcode'", () => {
    const source: LeetCodeSource = {
      kind: "leetcode",
      id: 1,
      url: "https://leetcode.com/problems/two-sum/",
    };

    render(<SourceBadge source={source} />);

    const badgeLink = screen.getByRole("link", { name: "LeetCode #1" });
    expect(badgeLink).toBeInTheDocument();
    expect(badgeLink).toHaveAttribute("href", "https://leetcode.com/problems/two-sum/");
    expect(screen.getByText("LC #1")).toBeInTheDocument();
  });

  it("renders BookBadge when kind === 'book'", () => {
    const source: BookSource = {
      kind: "book",
      bookTitle: "Competitive Programmer's Handbook",
      chapter: 12,
      chapterTitle: "Graph algorithms",
      section: "12.1",
    };

    render(<SourceBadge source={source} />);

    expect(screen.getByText("CP Handbook Ch 12")).toBeInTheDocument();
    expect(
      screen.getByTitle("Competitive Programmer's Handbook — Chapter 12: Graph algorithms (12.1)"),
    ).toBeInTheDocument();
  });

  it("renders StandardBadge when kind === 'standard'", () => {
    const source: StandardSource = {
      kind: "standard",
    };

    render(<SourceBadge source={source} />);

    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("shows explicitly unverified learning provenance without fabricating a link", () => {
    const source = {
      kind: "leetcode",
      label: "LeetCode #1",
      id: 1,
      provenance: "unverified",
    } satisfies LearningSource;

    render(<SourceBadge source={source} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByLabelText("LeetCode #1 — source URL unverified")).toBeInTheDocument();
  });

  it("does not invent a standard source when no source was provided", () => {
    const { container } = render(<SourceBadgeList />);

    expect(container.querySelector('[aria-label="Standard CS Algorithm"]')).toBeNull();
    expect(container.textContent).toBe("");
  });
});
