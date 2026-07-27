import { describe, it, expect } from "vitest";
import { fftFrequencyDomainConvolution2d, DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT, generateFftFrequencyDomainConvolution2dSteps } from "./fftFrequencyDomainConvolution2d";

describe("fft-frequency-domain-convolution-2d (2D Fast Fourier Transform (FFT) Convolution Engine)", () => {
  it("should have correct metadata", () => {
    expect(fftFrequencyDomainConvolution2d.id).toBe("fft-frequency-domain-convolution-2d");
    expect(fftFrequencyDomainConvolution2d.isMlInfra).toBe(true);
    expect(fftFrequencyDomainConvolution2d.mlInfraLevel).toBe(8);
    expect(fftFrequencyDomainConvolution2d.mlInfraCategory).toBe("ml_convolutions");
    expect(fftFrequencyDomainConvolution2d.categories).toContain("ml_convolutions");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateFftFrequencyDomainConvolution2dSteps(DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("2D Fast Fourier Transform (FFT) Convolution Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
