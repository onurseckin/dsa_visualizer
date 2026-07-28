import { describe, it, expect } from "vitest";
import {
  cudnnImplicitGemmOnTheFlyKernel,
  DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT,
  generateCudnnImplicitGemmOnTheFlyKernelSteps,
} from "./cudnnImplicitGemmOnTheFlyKernel";

describe("cudnnImplicitGemmOnTheFlyKernel (cuDNN Implicit GEMM On-The-Fly Kernel)", () => {
  it("should have correct metadata", () => {
    expect(cudnnImplicitGemmOnTheFlyKernel.id).toBe("cudnn-implicit-gemm-on-the-fly-kernel");
    expect(
      cudnnImplicitGemmOnTheFlyKernel.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(cudnnImplicitGemmOnTheFlyKernel.topicIds).toContain("ml_convolutions");
    expect(cudnnImplicitGemmOnTheFlyKernel.topicIds).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateCudnnImplicitGemmOnTheFlyKernelSteps(
      DEFAULT_CUDNNIMPLICITGEMMONTHEFLYKERNEL_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("cuDNN Implicit GEMM On-The-Fly Kernel");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = cudnnImplicitGemmOnTheFlyKernel.code.split("\n");
    const lineExplanations = cudnnImplicitGemmOnTheFlyKernel.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = cudnnImplicitGemmOnTheFlyKernel.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("implicit");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
