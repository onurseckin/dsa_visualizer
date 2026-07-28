import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fftFrequencyDomainConvolution2dInput {
  image?: number[][];
  kernel?: number[][];
  data?: number[];
  target?: number;
}

export const FFTFREQUENCYDOMAINCONVOLUTION2D_CODE = `import cmath

def fft_1d(x):
    N = len(x)
    if N <= 1:
        return x
    even = fft_1d(x[0::2])
    odd = fft_1d(x[1::2])
    T = [cmath.rect(1.0, -2 * cmath.pi * k / N) * odd[k] for k in range(N // 2)]
    return [even[k] + T[k] for k in range(N // 2)] + [even[k] - T[k] for k in range(N // 2)]

def ifft_1d(x):
    N = len(x)
    conj_x = [val.conjugate() for val in x]
    transformed = fft_1d(conj_x)
    return [val.conjugate() / N for val in transformed]

def fft_2d(matrix):
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
    h_in, w_in = len(image), len(image[0])
    k_h, k_w = len(kernel), len(kernel[0])
    target_h = 1
    while target_h < h_in + k_h - 1:
        target_h *= 2
    target_w = 1
    while target_w < w_in + k_w - 1:
        target_w *= 2
    padded_img = [[0.0] * target_w for _ in range(target_h)]
    for r in range(h_in):
        for c in range(w_in):
            padded_img[r][c] = float(image[r][c])
    padded_krn = [[0.0] * target_w for _ in range(target_h)]
    for r in range(k_h):
        for c in range(k_w):
            padded_krn[r][c] = float(kernel[r][c])
    fft_img = fft_2d(padded_img)
    fft_krn = fft_2d(padded_krn)
    fft_prod = [[fft_img[r][c] * fft_krn[r][c] for c in range(target_w)] for r in range(target_h)]
    spatial_conv = ifft_2d(fft_prod)
    return spatial_conv
`;

export const DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT: fftFrequencyDomainConvolution2dInput = {
  image: [
    [1, 2],
    [3, 4],
  ],
  kernel: [
    [1, 0.5],
    [0.5, 1],
  ],
  data: [10, 20, 30, 40, 50],
  target: 30,
};

type Complex = { re: number; im: number };

function addC(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function subC(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

function mulC(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function fft1d(x: Complex[]): Complex[] {
  const N = x.length;
  if (N <= 1) return x;
  const even: Complex[] = [];
  const odd: Complex[] = [];
  for (let i = 0; i < N; i++) {
    if (i % 2 === 0) even.push(x[i]);
    else odd.push(x[i]);
  }
  const fftEven = fft1d(even);
  const fftOdd = fft1d(odd);
  const res: Complex[] = new Array(N);
  const half = N / 2;
  for (let k = 0; k < half; k++) {
    const angle = (-2 * Math.PI * k) / N;
    const twiddle: Complex = { re: Math.cos(angle), im: Math.sin(angle) };
    const t = mulC(twiddle, fftOdd[k]);
    res[k] = addC(fftEven[k], t);
    res[k + half] = subC(fftEven[k], t);
  }
  return res;
}

function ifft1d(x: Complex[]): Complex[] {
  const N = x.length;
  const conj = x.map((c) => ({ re: c.re, im: -c.im }));
  const tf = fft1d(conj);
  return tf.map((c) => ({ re: c.re / N, im: -c.im / N }));
}

function fft2d(matrix: Complex[][]): Complex[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rowFft = matrix.map((row) => fft1d(row));
  const res: Complex[][] = Array.from({ length: rows }, () => new Array(cols));
  for (let c = 0; c < cols; c++) {
    const colData = Array.from({ length: rows }, (_, r) => rowFft[r][c]);
    const colFft = fft1d(colData);
    for (let r = 0; r < rows; r++) {
      res[r][c] = colFft[r];
    }
  }
  return res;
}

function ifft2d(matrix: Complex[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rowIfft = matrix.map((row) => ifft1d(row));
  const res: number[][] = Array.from({ length: rows }, () => new Array(cols));
  for (let c = 0; c < cols; c++) {
    const colData = Array.from({ length: rows }, (_, r) => rowIfft[r][c]);
    const colIfft = ifft1d(colData);
    for (let r = 0; r < rows; r++) {
      res[r][c] = Math.round(colIfft[r].re * 1000) / 1000;
    }
  }
  return res;
}

export const generateFftFrequencyDomainConvolution2dSteps = (
  input: fftFrequencyDomainConvolution2dInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const image = input.image || [
    [1, 2],
    [3, 4],
  ];

  const kernel = input.kernel || [
    [1, 0.5],
    [0.5, 1],
  ];

  const hIn = image.length;
  const wIn = image[0].length;
  const kH = kernel.length;
  const kW = kernel[0].length;

  let targetH = 1;
  while (targetH < hIn + kH - 1) {
    targetH *= 2;
  }
  let targetW = 1;
  while (targetW < wIn + kW - 1) {
    targetW *= 2;
  }

  const paddedImg: number[][] = Array.from({ length: targetH }, () => Array(targetW).fill(0));
  for (let r = 0; r < hIn; r++) {
    for (let c = 0; c < wIn; c++) {
      paddedImg[r][c] = image[r][c];
    }
  }

  const paddedKrn: number[][] = Array.from({ length: targetH }, () => Array(targetW).fill(0));
  for (let r = 0; r < kH; r++) {
    for (let c = 0; c < kW; c++) {
      paddedKrn[r][c] = kernel[r][c];
    }
  }

  const imgComplex: Complex[][] = paddedImg.map((row) => row.map((val) => ({ re: val, im: 0 })));
  const krnComplex: Complex[][] = paddedKrn.map((row) => row.map((val) => ({ re: val, im: 0 })));

  const fftImg = fft2d(imgComplex);
  const fftKrn = fft2d(krnComplex);

  const fftProd: Complex[][] = Array.from({ length: targetH }, (_, r) =>
    Array.from({ length: targetW }, (_, c) => mulC(fftImg[r][c], fftKrn[r][c])),
  );

  const spatialConv = ifft2d(fftProd);

  const getSnapshot = (
    matrix: number[][],
    titleStr: string,
    activeR: number = -1,
    activeC: number = -1,
  ): MatrixVisualSnapshot => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const state = r === activeR && c === activeC ? "active" : "default";
        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          label: `[${r},${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: titleStr,
      cells,
    };
  };

  const getComplexSnapshot = (
    matrix: Complex[][],
    titleStr: string,
    activeR: number = -1,
    activeC: number = -1,
  ): MatrixVisualSnapshot => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const state = r === activeR && c === activeC ? "active" : "default";
        const mag = Math.round(Math.hypot(matrix[r][c].re, matrix[r][c].im) * 100) / 100;
        cells.push({
          row: r,
          col: c,
          value: mag,
          label: `|F[${r},${c}]|`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: titleStr,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    snapshot: MatrixVisualSnapshot,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: snapshot,
      auxiliaryState: {
        customState: {
          "Convolution Theorem": "Spatial Conv(f, g) <=> IFFT2(FFT2(f) (*) FFT2(g))",
          "Original Input": `${hIn} x ${wIn}`,
          "Kernel Size": `${kH} x ${kW}`,
          "Padded FFT Shape": `${targetH} x ${targetW}`,
          Complexity: `O(H_out W_out log(H_out W_out))`,
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    42,
    "2D Fast Fourier Transform (FFT) Convolution Engine Entry",
    `Started 2D FFT frequency domain convolution engine on ${hIn}x${wIn} image and ${kH}x${kW} kernel via the Convolution Theorem.`,
    { hIn, wIn, kH, kW },
    getSnapshot(paddedImg, "Padded Spatial Image Matrix (Target Resolution)"),
  );

  // Step 2: Measure image dimensions
  addStep(
    43,
    "Measure Spatial Input Dimensions h_in, w_in",
    `Spatial image height h_in = ${hIn}, width w_in = ${wIn}.`,
    { hIn, wIn },
    getSnapshot(paddedImg, "Padded Spatial Image Matrix"),
  );

  // Step 3: Measure kernel dimensions
  addStep(
    44,
    "Measure Spatial Kernel Dimensions k_h, k_w",
    `Filter kernel height k_h = ${kH}, width k_w = ${kW}.`,
    { kH, kW },
    getSnapshot(paddedKrn, "Padded Spatial Kernel Matrix"),
  );

  // Step 4: Calculate target_h
  addStep(
    46,
    `Calculate Power-of-2 Target Height: target_h = ${targetH}`,
    `Found smallest power-of-2 height target_h = ${targetH} >= ${hIn} + ${kH} - 1 (${hIn + kH - 1}) to prevent circular convolution aliasing.`,
    { targetH, min_h: hIn + kH - 1 },
    getSnapshot(paddedImg, "Padded Spatial Image Matrix"),
  );

  // Step 5: Calculate target_w
  addStep(
    49,
    `Calculate Power-of-2 Target Width: target_w = ${targetW}`,
    `Found smallest power-of-2 width target_w = ${targetW} >= ${wIn} + ${kW} - 1 (${wIn + kW - 1}) to prevent circular convolution aliasing.`,
    { targetW, min_w: wIn + kW - 1 },
    getSnapshot(paddedImg, "Padded Spatial Image Matrix"),
  );

  // Step 6: Pad image
  addStep(
    51,
    `Pad Input Image to ${targetH}x${targetW}`,
    `Zero-padded input image to power-of-2 shape ${targetH}x${targetW}.`,
    { targetH, targetW },
    getSnapshot(paddedImg, "Padded Image Tensor (Power-of-2 Grid)"),
  );

  // Step 7: Pad kernel
  addStep(
    55,
    `Pad Filter Kernel to ${targetH}x${targetW}`,
    `Zero-padded filter kernel to power-of-2 shape ${targetH}x${targetW}.`,
    { targetH, targetW },
    getSnapshot(paddedKrn, "Padded Kernel Tensor (Power-of-2 Grid)"),
  );

  // Step 8: Forward FFT2 on image
  addStep(
    59,
    "Forward 2D FFT: Transform Padded Image to Frequency Domain",
    `Executed 2D Cooley-Tukey FFT transform on image tensor. Converted spatial activations to complex frequency spectrum FFT(Image).`,
    { targetH, targetW },
    getComplexSnapshot(fftImg, "Frequency Domain Spectrum Magnitude |FFT(Image)|"),
  );

  // Step 9: Forward FFT2 on kernel
  addStep(
    60,
    "Forward 2D FFT: Transform Padded Kernel to Frequency Domain",
    `Executed 2D Cooley-Tukey FFT transform on kernel tensor. Converted spatial filter to complex frequency spectrum FFT(Kernel).`,
    { targetH, targetW },
    getComplexSnapshot(fftKrn, "Frequency Domain Spectrum Magnitude |FFT(Kernel)|"),
  );

  // Step 10: Point-wise complex multiplication in frequency domain (elementwise)
  const accumulatedProd: Complex[][] = Array.from({ length: targetH }, () =>
    Array.from({ length: targetW }, () => ({ re: 0, im: 0 })),
  );

  for (let r = 0; r < targetH; r++) {
    for (let c = 0; c < targetW; c++) {
      accumulatedProd[r][c] = fftProd[r][c];
      addStep(
        61,
        `Pointwise Complex Multiplication in Frequency Domain: Cell (${r}, ${c})`,
        `Multiplied complex frequency component FFT(Image)[${r}][${c}] by FFT(Kernel)[${r}][${c}] in O(1) time. Spectrum magnitude: ${Math.round(Math.hypot(fftProd[r][c].re, fftProd[r][c].im) * 100) / 100}.`,
        {
          r,
          c,
          prodRe: Math.round(fftProd[r][c].re * 100) / 100,
          prodIm: Math.round(fftProd[r][c].im * 100) / 100,
        },
        getComplexSnapshot(
          accumulatedProd,
          "Frequency Domain Hadamard Spectrum Magnitude |FFT(Image) (*) FFT(Kernel)|",
          r,
          c,
        ),
      );
    }
  }

  // Step 11: Inverse 2D FFT
  addStep(
    62,
    "Inverse 2D FFT: Transform Frequency Product Back to Spatial Domain",
    `Executed 2D Inverse FFT on frequency product. Converted complex frequency spectrum back to real spatial convolution matrix.`,
    { targetH, targetW },
    getSnapshot(spatialConv, "Inverse FFT Real Spatial Output Matrix"),
  );

  // Final step
  addStep(
    63,
    "Execution Complete",
    `Successfully completed 2D FFT frequency domain convolution. Transformed spatial O(N^4) direct loops into O(N^2 log N) FFT multiplications.`,
    { completed: true, targetH, targetW },
    getSnapshot(spatialConv, "Final 2D Spatial Convolution Result"),
  );

  return steps;
};

const FFTFREQUENCYDOMAINCONVOLUTION2D_TRIVIA: TriviaMeta = {
  skipLines: [2, 11, 17, 29, 41],
  distractors: [
    "spatial_conv = fft_2d(padded_img) @ fft_2d(padded_krn)",
    "target_h = h_in + k_h",
    "spatial_conv = ifft_1d(fft_prod)",
    "fft_prod = padded_img * padded_krn",
  ],
  hints: [
    {
      line: 42,
      hint: "Convolution Theorem: Spatial convolution equals inverse 2D FFT of elementwise product of forward 2D FFTs.",
    },
    {
      line: 46,
      hint: "Pad image and kernel to power of 2 size N >= H + K - 1 to prevent circular convolution aliasing.",
    },
    {
      line: 61,
      hint: "Pointwise complex multiplication in frequency domain executes in O(1) per frequency bin.",
    },
  ],
  lineExplanations: {
    1: "Imports Python complex math library cmath.",
    2: "Blank line after imports.",
    3: "Defines 1D Fast Fourier Transform (Cooley-Tukey radix-2) helper function fft_1d.",
    4: "Measures length N of input sequence x.",
    5: "Base case check for recursion: returns x if N <= 1.",
    6: "Returns base case sequence.",
    7: "Recursively computes 1D FFT on even-indexed elements x[0::2].",
    8: "Recursively computes 1D FFT on odd-indexed elements x[1::2].",
    9: "Computes twiddle factor complex phase rotations T_k = e^(-2pi i k / N) * odd[k].",
    10: "Combines even and odd butterfly outputs into length-N complex spectrum.",
    11: "Blank line after fft_1d function.",
    12: "Defines Inverse 1D FFT helper function ifft_1d.",
    13: "Measures length N of complex spectrum x.",
    14: "Conjugates input complex values conj_x.",
    15: "Executes forward 1D FFT on conjugated input.",
    16: "Conjugates and scales forward FFT output by 1/N to yield inverse spatial signal.",
    17: "Blank line after ifft_1d function.",
    18: "Defines 2D Fast Fourier Transform helper function fft_2d.",
    19: "Measures row count of input matrix.",
    20: "Measures column count of input matrix.",
    21: "Applies 1D FFT to each row of spatial matrix.",
    22: "Allocates 2D complex matrix res filled with zero complex floats.",
    23: "Iterates over column index c of row-transformed matrix.",
    24: "Extracts column data col_data from row-transformed matrix.",
    25: "Applies 1D FFT to column data col_data.",
    26: "Iterates over row index r.",
    27: "Stores column FFT result into 2D frequency spectrum matrix res[r][c].",
    28: "Returns completed 2D FFT complex frequency matrix.",
    29: "Blank line after fft_2d function.",
    30: "Defines 2D Inverse Fast Fourier Transform helper function ifft_2d.",
    31: "Measures row count of frequency matrix.",
    32: "Measures column count of frequency matrix.",
    33: "Applies inverse 1D FFT to each row of frequency matrix.",
    34: "Allocates 2D spatial result matrix res filled with zeros.",
    35: "Iterates over column index c.",
    36: "Extracts column data col_data from row-transformed inverse matrix.",
    37: "Applies inverse 1D FFT to column data col_data.",
    38: "Iterates over row index r.",
    39: "Extracts real component col_ifft[r].real into spatial matrix res[r][c].",
    40: "Returns completed 2D inverse FFT real spatial matrix.",
    41: "Blank line after ifft_2d function.",
    42: "Defines entry point for 2D FFT frequency domain convolution engine function.",
    43: "Measures height h_in and width w_in of input spatial image.",
    44: "Measures height k_h and width k_w of filter kernel.",
    45: "Initializes target_h = 1.",
    46: "Loop doubling target_h until target_h >= h_in + k_h - 1.",
    47: "Doubles target_h in power-of-2 step.",
    48: "Initializes target_w = 1.",
    49: "Loop doubling target_w until target_w >= w_in + k_w - 1.",
    50: "Doubles target_w in power-of-2 step.",
    51: "Allocates padded image matrix of shape target_h x target_w.",
    52: "Iterates over input image row r.",
    53: "Iterates over input image column c.",
    54: "Copies input image pixel image[r][c] into padded image matrix.",
    55: "Allocates padded kernel matrix of shape target_h x target_w.",
    56: "Iterates over filter kernel row r.",
    57: "Iterates over filter kernel column c.",
    58: "Copies filter kernel weight kernel[r][c] into padded kernel matrix.",
    59: "Computes 2D FFT of padded image: fft_img = fft_2d(padded_img).",
    60: "Computes 2D FFT of padded kernel: fft_krn = fft_2d(padded_krn).",
    61: "Computes elementwise Hadamard product fft_img[r][c] * fft_krn[r][c] in frequency domain.",
    62: "Computes 2D Inverse FFT spatial_conv = ifft_2d(fft_prod).",
    63: "Returns computed 2D spatial convolution matrix spatial_conv.",
    64: "Completed 2D spatial convolution execution.",
  },
};

export const fftFrequencyDomainConvolution2d: AlgorithmDefinition<fftFrequencyDomainConvolution2dInput> =
  {
    id: "fft-frequency-domain-convolution-2d",
    title: "2D Fast Fourier Transform (FFT) Convolution Engine",
    topicIds: ["ml_convolutions", "ml_gemm_roofline"],
    difficulty: "Hard",
    description:
      "The **2D Fast Fourier Transform (FFT) Convolution Engine** computes 2D spatial cross-correlation in the frequency domain using the **Convolution Theorem**. For large convolution filter kernels (e.g. $11 \\times 11, 31 \\times 31$ in astronomical imaging, audio Spectrograms, and large-kernel CNNs like RepLKNet), direct 2D spatial convolution incurs quadratic $O(N^2 K^2)$ complexity. The Convolution Theorem converts spatial convolution into **element-wise complex Hadamard multiplication** in frequency space, reducing complexity down to $O(N^2 \\log N)$.\n\n### Why It Exists\nDirect spatial convolution complexity scales quadric-wise with kernel size $K$. When $K > 11$, direct sliding windows and `im2col` GEMM become compute-bound. FFT convolution decouples execution time from filter size $K$: whether $K=3$ or $K=31$, the frequency domain elementwise product takes exactly $O(1)$ scalar multiplication per frequency bin.\n\n### Mathematical Formulation\nBy the Discrete Convolution Theorem, spatial convolution of image $f \\in \\mathbb{R}^{H \\times W}$ and kernel $g \\in \\mathbb{R}^{K_h \\times K_w}$ is mathematically equivalent to the inverse 2D Fourier transform of the pointwise product of their forward 2D Fourier transforms:\n\n$$1. \\quad N_h \\ge H + K_h - 1, \\quad N_w \\ge W + K_w - 1 \\quad (\\text{Zero-Padding to Power of 2})$$\n\n$$2. \\quad F = \\mathcal{F}_{2D}(\\text{pad}(f)), \\quad G = \\mathcal{F}_{2D}(\\text{pad}(g))$$\n\n$$3. \\quad H[u, v] = F[u, v] \\cdot G[u, v] \\quad (\\text{Pointwise Complex Hadamard Multiplication in Frequency Domain})$$\n\n$$4. \\quad y = \\mathcal{F}_{2D}^{-1}(H) \\quad (\\text{Inverse 2D Fourier Transform back to Spatial Domain})$$\n\nwhere $\\mathcal{F}_{2D}(X)_{u, v} = \\sum_{r=0}^{N_h-1} \\sum_{c=0}^{N_w-1} X[r, c] \\cdot e^{-2\\pi i \\left( \\frac{u r}{N_h} + \\frac{v c}{N_w} \\right)}$.\n\n### Step-by-Step Intuition\n1. **Zero-Padding (Circular Aliasing Guard)**: Pad image and kernel to target power-of-2 dimensions $N_h \\ge H + K_h - 1, N_w \\ge W + K_w - 1$ to prevent circular convolution wrap-around aliasing.\n2. **Forward 2D FFT**: Apply 1D Cooley-Tukey FFT along rows, then along columns to obtain 2D complex frequency spectra $F$ and $G$.\n3. **Pointwise Frequency Multiply**: Multiply complex spectrum $F[u, v]$ by $G[u, v]$ at every frequency coordinate $(u, v)$ in $O(1)$ time per bin.\n4. **Inverse 2D FFT**: Apply 2D Inverse FFT to map frequency product $H$ back to real spatial activation values $y[r, c]$.\n\n### Key Trade-Offs & Hardware Execution\n- **Crossover Point**: For small kernels ($K=3, 5$), FFT is slower than `im2col` due to $O(N^2 \\log N)$ transform overhead. For large kernels ($K \\ge 11$), FFT is 5x-20x faster than direct GEMM.\n- **Complex Number Memory Overhead**: FFT requires allocating complex floating-point numbers ($\text{real} + i \\cdot \\text{imag}$), doubling memory consumption (FP32 complex uses 8 bytes per value).",
    constraints: [
      "1 <= H_in, W_in <= 1024",
      "1 <= K_h, K_w <= 1024",
      "Padded shape must be power of 2 for radix-2 FFT",
    ],
    examples: [
      {
        kind: "basic",
        title: "2x2 Image Convolved with 2x2 Kernel via 2D FFT",
        inputDisplay: "Image 2x2, Kernel 2x2",
        outputDisplay: "Padded 4x4 spatial convolution output",
        input: DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT,
        output: "4x4 spatial convolution result",
        explanation:
          "Pads image and kernel to 4x4, transforms via 2D FFT, multiplies frequency spectra, and executes inverse 2D FFT.",
      },
    ],
    code: FFTFREQUENCYDOMAINCONVOLUTION2D_CODE,
    timeComplexity: {
      best: "O(N_h \\cdot N_w \\log(N_h \\cdot N_w))",
      average: "O(N_h \\cdot N_w \\log(N_h \\cdot N_w))",
      worst: "O(N_h \\cdot N_w \\log(N_h \\cdot N_w))",
    },
    spaceComplexity: "O(N_h \\cdot N_w)",
    complexityAnalysis: {
      time: "2D FFT transforms take $O(N_h N_w \\log(N_h N_w))$ time; frequency domain pointwise multiplication takes $O(N_h N_w)$ time, independent of filter size $K$.",
      space: "Requires $O(N_h N_w)$ memory to store complex 2D frequency spectra buffers.",
    },
    topicGuide: {
      overview:
        "The **2D Fast Fourier Transform (FFT) Convolution Engine** converts 2D spatial convolution into element-wise complex multiplication in frequency space via the Convolution Theorem.",
      sections: [
        {
          heading: "1. Core Concept & Convolution Theorem",
          body: "The Convolution Theorem proves that spatial convolution $f * g$ equals the inverse Fourier transform of the pointwise product of their Fourier transforms:\n$$f * g = \\mathcal{F}_{2D}^{-1}(\\mathcal{F}_{2D}(f) \\cdot \\mathcal{F}_{2D}(g))$$\nFrequency multiplication takes $O(1)$ scalar time per bin.",
        },
        {
          heading: "2. Linear vs Circular Convolution & Zero-Padding",
          body: "FFT natively computes circular (periodic) convolution. To compute linear non-circular convolution, both image and kernel must be zero-padded to shape $N_h \\ge H + K_h - 1$ and $N_w \\ge W + K_w - 1$, typically rounded up to the nearest power of 2 for radix-2 Cooley-Tukey FFT.",
        },
        {
          heading: "3. Systems & Large Kernel Crossover",
          body: "For 3x3 or 5x5 filters, cuDNN uses Winograd or GEMM lowering. For large kernels ($11 \\times 11, 31 \\times 31$ in RepLKNet or astronomical image processing), FFT convolution is orders of magnitude faster because its compute cost is independent of filter kernel size $K$.",
        },
        {
          heading: "4. Numerical Precision & Complex Number Layout",
          body: "Real-to-complex (RFFT) optimizations exploit Hermitian symmetry ($F[-u, -v] = F[u, v]^*$), cutting frequency memory storage and FFT compute FLOPs in half.",
        },
      ],
      keyTerms: [
        {
          term: "Convolution Theorem",
          definition:
            "Fundamental theorem stating spatial convolution equals pointwise multiplication in frequency space.",
        },
        {
          term: "Circular Aliasing",
          definition:
            "Wrap-around artifact in FFT convolution avoided by zero-padding to target size N >= H + K - 1.",
        },
        {
          term: "Twiddle Factor",
          definition:
            "Complex phase rotation constant e^(-2pi i k / N) evaluated during Cooley-Tukey FFT butterfly stages.",
        },
        {
          term: "Hermitian Symmetry (RFFT)",
          definition:
            "Symmetry property of real-valued signals allowing 50% savings in complex frequency storage.",
        },
      ],
    },
    trivia: FFTFREQUENCYDOMAINCONVOLUTION2D_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_FFTFREQUENCYDOMAINCONVOLUTION2D_INPUT,
    generateSteps: generateFftFrequencyDomainConvolution2dSteps,
  };
