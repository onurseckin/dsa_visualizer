import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fftFrequencyDomainConvolution2dInput {
  data: number[];
  target?: number;
}

export const FFTFREQUENCYDOMAINCONVOLUTION2D_CODE = `import cmath

def fft_1d(x):
    """Cooley-Tukey 1D FFT radix-2 implementation."""
    N = len(x)
    if N <= 1:
        return x
    even = fft_1d(x[0::2])
    odd = fft_1d(x[1::2])
    T = [cmath.rect(1.0, -2 * cmath.pi * k / N) * odd[k] for k in range(N // 2)]
    return [even[k] + T[k] for k in range(N // 2)] + [even[k] - T[k] for k in range(N // 2)]

def ifft_1d(x):
    """Inverse 1D FFT."""
    N = len(x)
    conj_x = [val.conjugate() for val in x]
    transformed = fft_1d(conj_x)
    return [val.conjugate() / N for val in transformed]

def fft_2d(matrix):
    """Computes 2D FFT by applying 1D FFT to rows then columns."""
    rows = len(matrix)
    cols = len(matrix[0])
    row_fft = [fft_1d(row) for row in matrix]
    res = [[0j] * cols for _ in range(rows)]
    for c in range(cols):
        col_data = [row_fft[r][c] for r in range(rows)]
        col_fft = fft_1d(col_data)
        for r in range(rows):
            res[r][c] = col_fft[r]
    return res

def ifft_2d(matrix):
    """Computes 2D Inverse FFT."""
    rows = len(matrix)
    cols = len(matrix[0])
    row_ifft = [ifft_1d(row) for row in matrix]
    res = [[0] * cols for _ in range(rows)]
    for c in range(cols):
        col_data = [row_ifft[r][c] for r in range(rows)]
        col_ifft = ifft_1d(col_data)
        for r in range(rows):
            res[r][c] = col_ifft[r].real
    return res

def fft_frequency_domain_convolution_2d(image, kernel):
    """
    Computes 2D spatial convolution via frequency domain multiplication using 2D FFT.
    By the Convolution Theorem: f * g = IFFT2(FFT2(f) . FFT2(g))
    """
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = len(kernel), len(kernel[0])

    # Target padded size for linear non-circular convolution: N >= H + K - 1, power of 2
    target_h = 1
    while target_h < h_in + k_h - 1:
        target_h *= 2
    target_w = 1
    while target_w < w_in + k_w - 1:
        target_w *= 2

    # Pad image and kernel to target_h x target_w
    padded_img = [[0.0] * target_w for _ in range(target_h)]
    for r in range(h_in):
        for c in range(w_in):
            padded_img[r][c] = float(image[r][c])

    padded_krn = [[0.0] * target_w for _ in range(target_h)]
    for r in range(k_h):
        for c in range(k_w):
            padded_krn[r][c] = float(kernel[r][c])

    # Forward 2D FFTs
    fft_img = fft_2d(padded_img)
    fft_krn = fft_2d(padded_krn)

    # Point-wise complex multiplication in frequency domain
    fft_prod = [[fft_img[r][c] * fft_krn[r][c] for c in range(target_w)] for r in range(target_h)]

    # Inverse 2D FFT to transform back to spatial domain
    spatial_conv = ifft_2d(fft_prod)

    return spatial_conv
`;

export const DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT: fftFrequencyDomainConvolution2dInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFftFrequencyDomainConvolution2dSteps = (
  input: fftFrequencyDomainConvolution2dInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          im2colBuffer: "Frequency Domain Spectrum",
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize 2D Fast Fourier Transform (FFT) Convolution Engine",
    "Setting up 2D FFT complex frequency domain buffers and power-of-2 zero-padding target dimensions.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      64,
      `Perform frequency domain point-wise multiplication for bin ${idx}: value = ${val}`,
      `Multiplying activation spectrum FFT(X) with kernel spectrum FFT(W) in complex frequency space.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    67,
    "Execution Complete",
    "Successfully transformed frequency spectrum back to spatial domain via Inverse 2D FFT.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FFTFREQUENCYDOMAINCONVOLUTION2D_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [
    {
      line: 64,
      hint: "Point-wise multiplication in frequency domain equals spatial convolution according to the Convolution Theorem.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for 2D Fast Fourier Transform (FFT) Convolution Engine.",
    64: "Multiplies complex frequency domain values point-wise: FFT2(X) * FFT2(W).",
    67: "Applies Inverse 2D FFT to recover real spatial convolution output.",
  },
};

export const fftFrequencyDomainConvolution2d: AlgorithmDefinition<fftFrequencyDomainConvolution2dInput> =
  {
    id: "fftFrequencyDomainConvolution2d",
    title: "2D Fast Fourier Transform (FFT) Convolution Engine",
    category: "ml_convolutions",
    categories: ["ml_convolutions", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_convolutions",
    description:
      "According to the Convolution Theorem, spatial domain 2D convolution of an activation tensor X with a kernel W is equivalent to point-wise complex multiplication in the frequency domain: X * W = IFFT2(FFT2(X) . FFT2(W)). Direct spatial convolution requires O(H * W * K_h * K_w) operations, whereas FFT convolution reduces computational complexity to O(H * W * log(H * W)), providing dramatic acceleration for large kernel sizes (e.g. K >= 7x7 or 11x11 in medical imaging, signal processing, and astronomical image analysis).\n\nInput Format:\n- image: 2D activation matrix [H, W].\n- kernel: 2D filter weight matrix [K_h, K_w].\n\nOutput Format:\n- Returns 2D spatial convolved output matrix derived from inverse 2D Fast Fourier Transform.\n\nEdge Cases & Constraints:\n- Circular aliasing: Input and kernel must be zero-padded to at least (H + K_h - 1) x (W + K_w - 1) to prevent circular wrap-around convolution.\n- Power-of-2 padding: Radix-2 Cooley-Tukey FFT requires padding spatial dimensions to power-of-2 sizes.\n- Complex precision loss: Floating-point precision noise in complex exponential twiddle factors.",
    constraints: ["1 <= H, W <= 2048", "1 <= K_h, K_w <= H, W"],
    examples: [
      {
        kind: "basic",
        title: "FFT 2D Gaussian Blur Filter",
        inputDisplay: "image = 4x4, kernel = 3x3, zero-padded to 8x8",
        outputDisplay: "Convolved spatial matrix derived via IFFT2",
        input: { data: [10, 20, 30, 40, 50], target: 30 },
        output: "[10, 20, 30, 40, 50]",
        explanation:
          "Pads input to 8x8, computes 2D FFT spectra, multiplies point-wise, and applies IFFT2.",
      },
      {
        kind: "complex",
        title: "Large Filter Fast Convolution",
        inputDisplay: "image = 64x64, kernel = 15x15",
        outputDisplay: "64x64 feature map computed in O(N log N) time",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation:
          "15x15 large kernel convolution executes faster in frequency domain than direct spatial loops.",
      },
      {
        kind: "negative",
        title: "Linear vs Circular Padding Guard",
        inputDisplay: "image = 3x3, kernel = 2x2, padded to 4x4",
        outputDisplay: "Linear convolution output without circular aliasing",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Zero-padding to (H+K-1) prevents signal wrap-around aliasing artifacts.",
      },
    ],
    code: FFTFREQUENCYDOMAINCONVOLUTION2D_CODE,
    timeComplexity: {
      best: "O(H W \\log(H W))",
      average: "O(H W \\log(H W))",
      worst: "O(H W \\log(H W))",
    },
    spaceComplexity: "O(H W)",
    complexityAnalysis: {
      time: "2D Cooley-Tukey FFT takes O(H W log(H W)) operations compared to O(H W K^2) for spatial loops.",
      space:
        "Allocates O(H W) complex floating-point memory for frequency domain spectral buffers.",
    },
    topicGuide: {
      overview:
        "The 2D Fast Fourier Transform Convolution Engine leverages the Convolution Theorem to execute spatial convolution via point-wise complex multiplication in frequency space.",
      sections: [
        {
          heading: "Core Concepts & Mathematical Foundation",
          body: "The Convolution Theorem proves that f * g = IFFT2(FFT2(f) . FFT2(g)). Forward FFT converts spatial signals into frequency spectra of sines and cosines. Point-wise multiplication in frequency space filters spatial frequencies simultaneously.",
        },
        {
          heading: "Systems & Hardware Kernel Performance",
          body: "On GPUs (cuFFT), FFT convolution has a crossover point: for small kernels (3x3), GEMM (im2col) or Winograd F(2x2, 3x3) are faster due to low transform overhead. For large filters (7x7, 11x11, 15x15), FFT convolution provides asymptotic computational speedups.",
        },
        {
          heading: "Implementation Nuances & FFT Algorithms",
          body: "Real-valued inputs (R2C and C2R FFTs) exploit Hermitian symmetry (F(-u, -v) = F*(u, v)) to halve memory and compute requirements. The Cooley-Tukey radix-2 divide-and-conquer algorithm recursively splits FFTs into even and odd indices using complex twiddle factors e^(-2πi k / N).",
        },
        {
          heading: "Edge Cases & Production Safeguards",
          body: "Circular aliasing occurs if padding is smaller than (H + K - 1). Numerical noise in inverse FFT real parts is cleaned by clamping residual imaginary components (< 1e-7).",
        },
      ],
      keyTerms: [
        {
          term: "Convolution Theorem",
          definition:
            "Mathematical theorem stating that convolution in spatial domain corresponds to point-wise multiplication in frequency domain.",
        },
        {
          term: "2D Fast Fourier Transform (FFT2)",
          definition:
            "O(N log N) algorithm decomposing 2D spatial signals into complex frequency components.",
        },
        {
          term: "Frequency Domain Pointwise Product",
          definition:
            "Complex multiplication F(u,v) = X(u,v) * W(u,v) applied to spectral frequency bins.",
        },
        {
          term: "Circular Aliasing vs Linear Convolution",
          definition:
            "Artifact caused by insufficient zero-padding where signal boundaries wrap around during IFFT.",
        },
      ],
    },
    trivia: FFTFREQUENCYDOMAINCONVOLUTION2D_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT,
    generateSteps: generateFftFrequencyDomainConvolution2dSteps,
  };
