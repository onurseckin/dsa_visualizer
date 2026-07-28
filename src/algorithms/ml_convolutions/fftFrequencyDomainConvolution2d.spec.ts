import { describe, it, expect } from "vitest";
import {
  fftFrequencyDomainConvolution2d,
  DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT,
  generateFftFrequencyDomainConvolution2dSteps,
} from "./fftFrequencyDomainConvolution2d";

describe("fftFrequencyDomainConvolution2d (2D Fast Fourier Transform (FFT) Convolution Engine)", () => {
  it("should have correct metadata", () => {
    expect(fftFrequencyDomainConvolution2d.id).toBe("fft-frequency-domain-convolution-2d");
    expect(
      fftFrequencyDomainConvolution2d.topicIds.some((topicId) => topicId.startsWith("ml_")),
    ).toBe(true);
    expect(fftFrequencyDomainConvolution2d.topicIds).toContain("ml_convolutions");
    expect(fftFrequencyDomainConvolution2d.topicIds).toContain("ml_convolutions");
  });

  it("should generate at least 20 algorithm steps for default input", () => {
    const steps = generateFftFrequencyDomainConvolution2dSteps(
      DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "2D Fast Fourier Transform (FFT) Convolution Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = fftFrequencyDomainConvolution2d.code.split("\n");
    const lineExplanations = fftFrequencyDomainConvolution2d.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    codeLines.forEach((_, index) => {
      const lineNum = index + 1;
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    });
  });

  it("should teach the topic through a topicGuide with Markdown and LaTeX", () => {
    const guide = fftFrequencyDomainConvolution2d.topicGuide;
    expect(guide.overview.length).toBeGreaterThan(120);
    expect(guide.sections.length).toBeGreaterThanOrEqual(4);
    expect(guide.sections.length).toBeLessThanOrEqual(6);

    guide.sections.forEach((section) => {
      expect(section.heading.length).toBeGreaterThan(0);
      expect(section.body.length).toBeGreaterThan(50);
    });

    const allText = [guide.overview, ...guide.sections.map((s) => s.body)].join(" ");
    expect(allText).toContain("$");
    expect(allText.toLowerCase()).toContain("fft");

    expect(guide.keyTerms?.length).toBeGreaterThanOrEqual(3);
    expect(guide.keyTerms?.length).toBeLessThanOrEqual(6);
  });
});
