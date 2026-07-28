import type { AlgorithmDefinition, AlgorithmStep, GridCellNode } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface col2imGradAccumulatorInput {
  d_cols?: number[][];
  image_shape?: [number, number];
  kernel_size?: [number, number];
  stride?: number;
  padding?: number;
  data?: number[];
  target?: number;
}

export const COL2IMGRADACCUMULATOR_CODE = `def col2im_grad_accumulator(d_cols, image_shape, kernel_size, stride=1, padding=0):
    h_in, w_in = image_shape
    k_h, k_w = kernel_size
    h_out = (h_in + 2 * padding - k_h) // stride + 1
    w_out = (w_in + 2 * padding - k_w) // stride + 1

    d_image = [[0.0] * w_in for _ in range(h_in)]

    col_idx = 0
    for r in range(h_out):
        for c in range(w_out):
            k_idx = 0
            for kr in range(k_h):
                for kc in range(k_w):
                    ir = r * stride + kr - padding
                    ic = c * stride + kc - padding
                    if 0 <= ir < h_in and 0 <= ic < w_in:
                        d_image[ir][ic] += d_cols[k_idx][col_idx]
                    k_idx += 1
            col_idx += 1

    return d_image`;

export const DEFAULT_COL2IMGRADACCUMULATOR_INPUT: col2imGradAccumulatorInput = {
  d_cols: [
    [1.0, 1.0, 1.0, 1.0],
    [0.5, 0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5],
    [1.0, 1.0, 1.0, 1.0],
  ],
  image_shape: [3, 3],
  kernel_size: [2, 2],
  stride: 1,
  padding: 0,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCol2imGradAccumulatorSteps = (
  input: col2imGradAccumulatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const image_shape = input.image_shape || [3, 3];
  const kernel_size = input.kernel_size || [2, 2];
  const stride = input.stride ?? 1;
  const padding = input.padding ?? 0;

  const [h_in, w_in] = image_shape;
  const [k_h, k_w] = kernel_size;

  const h_out = Math.floor((h_in + 2 * padding - k_h) / stride) + 1;
  const w_out = Math.floor((w_in + 2 * padding - k_w) / stride) + 1;

  const num_cols = h_out * w_out;
  const num_k = k_h * k_w;

  const d_cols = input.d_cols || Array.from({ length: num_k }, () => Array(num_cols).fill(1.0));

  const d_image: number[][] = Array.from({ length: h_in }, () => Array(w_in).fill(0));

  const createGrid = (activeIr: number = -1, activeIc: number = -1): GridCellNode[][] => {
    return d_image.map((row, r) =>
      row.map((val, c) => {
        let state: "default" | "active" | "compare" | "visited" = "default";
        if (r === activeIr && c === activeIc) {
          state = "active";
        } else if (val > 0) {
          state = "visited";
        }
        return {
          row: r,
          col: c,
          state,
          distance: val,
        };
      }),
    );
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIr: number = -1,
    activeIc: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "grid",
        grid: createGrid(activeIr, activeIc),
      },
      auxiliaryState: {
        customState: {
          "Image Shape": `${h_in} x ${w_in}`,
          "Kernel Shape": `${k_h} x ${k_w}`,
          "Output Spatial Shape": `${h_out} x ${w_out}`,
          "d_cols Shape": `${num_k} x ${num_cols}`,
          "d_image Grid": `[${d_image.map((r) => `[${r.map((v) => v.toFixed(1)).join(", ")}]`).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Initialize col2im Gradient Accumulator",
    `Started col2im spatial gradient accumulation on ${h_in}x${w_in} image tensor from ${num_k}x${num_cols} unrolled column gradient matrix.`,
    { h_in, w_in, k_h, k_w, h_out, w_out, stride, padding },
  );

  // Step 2: Extract image_shape
  addStep(
    2,
    "Extract Image Spatial Dimensions",
    `Original input image spatial dimensions: h_in = ${h_in}, w_in = ${w_in}.`,
    { h_in, w_in },
  );

  // Step 3: Extract kernel_size
  addStep(
    3,
    "Extract Kernel Filter Dimensions",
    `Convolution filter kernel dimensions: k_h = ${k_h}, k_w = ${k_w}.`,
    { k_h, k_w },
  );

  // Step 4: Calculate h_out
  addStep(
    4,
    "Calculate Output Height Dimension",
    `Output feature height h_out = (${h_in} + 2 * ${padding} - ${k_h}) // ${stride} + 1 = ${h_out}.`,
    { h_out, h_in, k_h, stride, padding },
  );

  // Step 5: Calculate w_out
  addStep(
    5,
    "Calculate Output Width Dimension",
    `Output feature width w_out = (${w_in} + 2 * ${padding} - ${k_w}) // ${stride} + 1 = ${w_out}.`,
    { w_out, w_in, k_w, stride, padding },
  );

  // Step 6: Allocate d_image
  addStep(
    7,
    "Allocate Image Gradient Buffer d_image",
    `Created ${h_in}x${w_in} zero-initialized spatial gradient matrix.`,
    { h_in, w_in },
  );

  // Step 7: Init col_idx
  let col_idx = 0;
  addStep(
    9,
    "Initialize Unrolled Column Pointer col_idx = 0",
    `Set column index pointer col_idx = 0.`,
    { col_idx },
  );

  for (let r = 0; r < h_out; r++) {
    addStep(
      10,
      `Outer Output Row Loop: r = ${r}`,
      `Scanning output feature map row r = ${r} of ${h_out - 1}.`,
      { r, h_out },
    );

    for (let c = 0; c < w_out; c++) {
      addStep(
        11,
        `Inner Output Column Loop: c = ${c}`,
        `Scanning output column c = ${c} (col_idx = ${col_idx}).`,
        { r, c, col_idx },
      );

      let k_idx = 0;
      addStep(
        12,
        `Reset Kernel Flattened Tap Index k_idx = 0`,
        `Initialized kernel tap index k_idx = 0 for column col_idx = ${col_idx}.`,
        { r, c, col_idx, k_idx },
      );

      for (let kr = 0; kr < k_h; kr++) {
        addStep(
          13,
          `Kernel Row Loop: kr = ${kr}`,
          `Scanning kernel row kr = ${kr} of ${k_h - 1}.`,
          { r, c, kr },
        );

        for (let kc = 0; kc < k_w; kc++) {
          addStep(
            14,
            `Kernel Col Loop: kc = ${kc}`,
            `Scanning kernel column kc = ${kc} of ${k_w - 1}.`,
            { r, c, kr, kc, k_idx },
          );

          const ir = r * stride + kr - padding;
          addStep(
            15,
            `Map Image Row Index: ir = ${ir}`,
            `Evaluated ir = ${r} * ${stride} + ${kr} - ${padding} = ${ir}.`,
            { r, stride, kr, padding, ir },
          );

          const ic = c * stride + kc - padding;
          addStep(
            16,
            `Map Image Column Index: ic = ${ic}`,
            `Evaluated ic = ${c} * ${stride} + ${kc} - ${padding} = ${ic}.`,
            { c, stride, kc, padding, ic },
          );

          const inside = ir >= 0 && ir < h_in && ic >= 0 && ic < w_in;
          addStep(
            17,
            `Check Boundary: (${ir}, ${ic}) inside image? ${inside}`,
            `Verified spatial bounds: 0 <= ${ir} < ${h_in} and 0 <= ${ic} < ${w_in} -> ${inside}.`,
            { ir, ic, h_in, w_in, inside },
            ir,
            ic,
          );

          if (inside) {
            const gradVal = d_cols[k_idx]?.[col_idx] ?? 0.0;
            d_image[ir][ic] += gradVal;

            addStep(
              18,
              `Accumulate Gradient: d_image[${ir}][${ic}] += d_cols[${k_idx}][${col_idx}] (${gradVal})`,
              `Accumulated column gradient ${gradVal} into image coordinate (${ir}, ${ic}). Total accumulated gradient: ${d_image[ir][ic].toFixed(1)}.`,
              { ir, ic, k_idx, col_idx, gradVal, newGradSum: d_image[ir][ic] },
              ir,
              ic,
            );
          }

          k_idx += 1;
          addStep(
            19,
            `Increment Kernel Tap Index: k_idx = ${k_idx}`,
            `Advanced k_idx to ${k_idx}.`,
            { k_idx },
          );
        }
      }

      col_idx += 1;
      addStep(
        20,
        `Increment Column Index: col_idx = ${col_idx}`,
        `Advanced unrolled column pointer col_idx to ${col_idx}.`,
        { col_idx },
      );
    }
  }

  // Step final
  addStep(
    22,
    "Execution Complete",
    `Finished col2im gradient accumulation across ${h_in}x${w_in} spatial image tensor.`,
    { completed: true, h_in, w_in },
  );

  return steps;
};

const COL2IMGRADACCUMULATOR_TRIVIA: TriviaMeta = {
  skipLines: [6, 8, 21],
  distractors: [
    "d_image[ir][ic] = d_cols[k_idx][col_idx]",
    "col_idx = r * w_out + c",
    "d_image[ir][ic] *= d_cols[k_idx][col_idx]",
    "h_out = (h_in - k_h) // stride",
  ],
  hints: [
    {
      line: 18,
      hint: "Use += to accumulate gradients because overlapping receptive fields share input pixels.",
    },
    {
      line: 15,
      hint: "Image row index equation: ir = r * stride + kr - padding.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for col2im gradient accumulator function.",
    2: "Unpacks height h_in and width w_in from image_shape tuple.",
    3: "Unpacks height k_h and width k_w from kernel_size tuple.",
    4: "Calculates spatial output height h_out using integer division floor.",
    5: "Calculates spatial output width w_out using integer division floor.",
    6: "Blank line before gradient image buffer allocation.",
    7: "Allocates spatial gradient matrix d_image of shape h_in x w_in filled with zero floats.",
    8: "Blank line before column index initialization.",
    9: "Initializes unrolled patch column index pointer col_idx to zero.",
    10: "Iterates over output feature map row index r from 0 to h_out - 1.",
    11: "Iterates over output feature map column index c from 0 to w_out - 1.",
    12: "Resets kernel tap index k_idx to zero for current unrolled patch column.",
    13: "Iterates over convolution kernel row index kr from 0 to k_h - 1.",
    14: "Iterates over convolution kernel column index kc from 0 to k_w - 1.",
    15: "Calculates spatial image row index ir = r * stride + kr - padding.",
    16: "Calculates spatial image column index ic = c * stride + kc - padding.",
    17: "Checks if spatial coordinate (ir, ic) lies within original input image bounds.",
    18: "Accumulates patch gradient d_cols[k_idx][col_idx] into image gradient tensor d_image[ir][ic].",
    19: "Increments kernel tap index k_idx by 1 for next filter weight position.",
    20: "Increments unrolled column index col_idx by 1 for next output spatial position.",
    21: "Blank line separating accumulation loops from return statement.",
    22: "Returns final accumulated 2D spatial image gradient matrix d_image.",
  },
};

export const col2imGradAccumulator: AlgorithmDefinition<col2imGradAccumulatorInput> = {
  id: "col2im-grad-accumulator",
  title: "col2im Gradient Accumulator",
  topicIds: ["ml_convolutions", "ml_autograd_dags"],
  difficulty: "Medium",
  description:
    "The **`col2im`** (column-to-image) transformation is the mathematical transpose (adjoint) of the `im2col` matrix unrolling operation. In automatic differentiation (backpropagation) for 2D convolutions, the gradient w.r.t. input activations $\\frac{\\partial L}{\\partial X}$ is computed by transposing the unrolled GEMM gradient matrix $\\frac{\\partial L}{\\partial X_{col}}$ and accumulating back into spatial image coordinates.\n\n### Why It Exists\nBecause overlapping receptive fields (when stride $S < K$) read the same input activation pixel multiple times during the forward pass, multivariable calculus (the chain rule) dictates that their incoming backpropagated gradients must be **summed** (accumulated via `+=`) at that spatial coordinate.\n\n### Mathematical Formulation\nGiven unrolled gradient matrix $\\frac{\\partial L}{\\partial X_{col}} \\in \\mathbb{R}^{(K_h \\cdot K_w) \\times (H_{out} \\cdot W_{out})}$, spatial image shape $(H_{in}, W_{in})$, and output position indices $(r, c)$, each unrolled column index $col \\in [0, H_{out}W_{out}-1]$ maps to spatial image coordinates:\n\n$$ir = r \\cdot S + kr - P, \\quad ic = c \\cdot S + kc - P$$\n\n$$\\frac{\\partial L}{\\partial X[ir, ic]} += \\frac{\\partial L}{\\partial X_{col}[k_{idx}, col_{idx}]}$$\n\n### Step-by-Step Intuition\n1. **Zero-Buffer Allocation**: Create a zero-initialized gradient matrix $\\nabla X \\in \\mathbb{R}^{H_{in} \\times W_{in}}$.\n2. **Unrolled Column Loop**: Iterate through each unrolled patch column $col_{idx}$ corresponding to output feature pixel $(r, c)$.\n3. **Kernel Tap Mapping**: For each kernel weight tap $k_{idx} = kr \\cdot K_w + kc$, calculate original spatial coordinate $(ir, ic)$.\n4. **Atomic Accumulation**: If $(ir, ic)$ is valid, add $\\nabla X_{col}[k_{idx}, col_{idx}]$ into $\\nabla X[ir, ic]$.\n\n### Key Trade-Offs & Hardware Execution\n- **Atomic GPU Operations**: In parallel CUDA kernels (e.g. PyTorch `col2im_cuda`), multiple thread blocks trying to write to overlapping spatial pixels $(ir, ic)$ cause write conflicts. High-performance kernels use `atomicAdd()` in DRAM or SRAM shared memory to guarantee deterministic gradient accumulation.\n- **Transposed Conv Equivalence**: `col2im` is functionally identical to the spatial scatter phase of transposed convolution.",
  constraints: [
    "1 <= H_in, W_in <= 512",
    "1 <= K_h, K_w <= 11",
    "1 <= stride <= 8",
    "padding >= 0",
  ],
  examples: [
    {
      kind: "basic",
      title: "3x3 Image Gradient Accumulation",
      inputDisplay: "Image 3x3, Kernel 2x2, Stride 1",
      outputDisplay: "3x3 Accumulated Gradient Matrix",
      input: DEFAULT_COL2IMGRADACCUMULATOR_INPUT,
      output: "3x3 Accumulated Spatial Gradient Matrix",
      explanation: "Accumulates unrolled 4x4 column gradients back into 3x3 spatial image layout.",
    },
  ],
  code: COL2IMGRADACCUMULATOR_CODE,
  timeComplexity: {
    best: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    average: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
    worst: "O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)",
  },
  spaceComplexity: "O(H_{in} \\cdot W_{in})",
  complexityAnalysis: {
    time: "Linear in total number of unrolled matrix elements $O(H_{out} \\cdot W_{out} \\cdot K_h \\cdot K_w)$.",
    space: "Requires $O(H_{in} \\cdot W_{in})$ memory for spatial image gradient storage.",
  },
  topicGuide: {
    overview:
      "The **col2im Gradient Accumulator** transforms unrolled column gradient matrices $\\frac{\\partial L}{\\partial X_{col}}$ back into 2D spatial image gradient tensors $\\frac{\\partial L}{\\partial X}$ during neural network backpropagation.",
    sections: [
      {
        heading: "1. Core Concept & Multivariable Chain Rule",
        body: "During convolution backpropagation, input activations $X$ that contribute to multiple sliding windows receive multiple gradient paths. The multivariable chain rule requires summing incoming gradients:\n$$\\frac{\\partial L}{\\partial X[ir, ic]} = \\sum_{\\text{overlapping windows}} \\frac{\\partial L}{\\partial X_{col}[k_{idx}, col_{idx}]}$$",
      },
      {
        heading: "2. Systems & Memory Hierarchy Performance",
        body: "In CUDA kernels, `col2im` presents a scatter-add memory write pattern. Because multiple GPU threads write to adjacent spatial locations concurrently, atomic addition (`atomicAdd`) in L2 cache or SRAM shared memory is required to avoid race conditions.",
      },
      {
        heading: "3. Implementation Nuances & GEMM Adjoints",
        body: "Forward pass: $Y_{col} = W \\cdot X_{col}$ via `im2col`.\nBackward pass: $\\nabla X_{col} = W^T \\cdot \\nabla Y$, followed by $\\nabla X = \\text{col2im}(\\nabla X_{col})$. This mathematical symmetry grounds modern deep learning autograd engines.",
      },
      {
        heading: "4. Edge Case Analysis & Production Safeguards",
        body: "Strided and padded convolutions require exact boundary masking ($0 \\le ir < H_{in}$ and $0 \\le ic < W_{in}$) to drop gradients corresponding to zero-padded border pixels.",
      },
    ],
    keyTerms: [
      {
        term: "col2im",
        definition:
          "Column-to-Image spatial gradient reconstruction algorithm accumulating unrolled GEMM matrices back into image tensors.",
      },
      {
        term: "Gradient Accumulation (+=)",
        definition:
          "Summing gradients across overlapping receptive fields required by the multivariable chain rule.",
      },
      {
        term: "Adjoint Operation",
        definition:
          "The linear transpose operation executed during backpropagation to reverse forward matrix unrolling.",
      },
      {
        term: "Atomic Addition",
        definition:
          "CUDA hardware instruction (atomicAdd) ensuring thread-safe gradient accumulation in GPU memory.",
      },
    ],
  },
  trivia: COL2IMGRADACCUMULATOR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_COL2IMGRADACCUMULATOR_INPUT,
  generateSteps: generateCol2imGradAccumulatorSteps,
};
