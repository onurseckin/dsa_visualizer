import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface stridedMaxPoolingInput {
  matrix?: number[][];
  poolSize?: number;
  stride?: number;
  data?: number[];
}

export const STRIDEDMAXPOOLING_CODE = `def strided_max_pooling(matrix, pool_size=2, stride=2):
    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0
    out_rows = (rows - pool_size) // stride + 1
    out_cols = (cols - pool_size) // stride + 1
    pooled = []

    for r in range(out_rows):
        row_out = []
        for c in range(out_cols):
            max_val = float('-inf')
            for pr in range(pool_size):
                for pc in range(pool_size):
                    val = matrix[r * stride + pr][c * stride + pc]
                    if val > max_val:
                        max_val = val
            row_out.append(max_val)
        pooled.append(row_out)

    return pooled`;

export const DEFAULT_STRIDEDMAXPOOLING_INPUT: stridedMaxPoolingInput = {
  matrix: [
    [1, 3, 2, 4],
    [5, 6, 1, 8],
    [9, 2, 7, 3],
    [4, 8, 5, 6],
  ],
  poolSize: 2,
  stride: 2,
};

export const generateStridedMaxPoolingSteps = (input: stridedMaxPoolingInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  let matrix = input.matrix;
  if (!matrix && input.data && input.data.length > 0) {
    const side = Math.floor(Math.sqrt(input.data.length));
    matrix = [];
    for (let i = 0; i < side; i++) {
      matrix.push(input.data.slice(i * side, (i + 1) * side));
    }
  }
  if (!matrix || matrix.length === 0) {
    matrix = [
      [1, 3, 2, 4],
      [5, 6, 1, 8],
      [9, 2, 7, 3],
      [4, 8, 5, 6],
    ];
  }

  const poolSize = input.poolSize ?? 2;
  const stride = input.stride ?? 2;

  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;

  const outRows = rows >= poolSize ? Math.floor((rows - poolSize) / stride) + 1 : 0;
  const outCols = cols >= poolSize ? Math.floor((cols - poolSize) / stride) + 1 : 0;

  const pooled: number[][] = [];
  const completedWindows = new Set<string>();

  const makeMatrixSnapshot = (
    activeOutR: number | null,
    activeOutC: number | null,
    activePr: number | null,
    activePc: number | null,
    currentMax: number,
    titleText?: string,
  ) => {
    const cells: MatrixCellItem[] = [];

    const winR1 = activeOutR !== null ? activeOutR * stride : -1;
    const winC1 = activeOutC !== null ? activeOutC * stride : -1;
    const winR2 = winR1 >= 0 ? winR1 + poolSize - 1 : -1;
    const winC2 = winC1 >= 0 ? winC1 + poolSize - 1 : -1;

    const currEvalR = winR1 >= 0 && activePr !== null ? winR1 + activePr : -1;
    const currEvalC = winC1 >= 0 && activePc !== null ? winC1 + activePc : -1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let state: MatrixCellItem["state"] = "default";
        const cellKey = `${r},${c}`;

        if (completedWindows.has(cellKey)) {
          state = "sorted";
        }

        if (r === currEvalR && c === currEvalC) {
          state = "active";
        } else if (r >= winR1 && r <= winR2 && c >= winC1 && c <= winC2) {
          state = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          label: `[${r}][${c}]`,
          state,
        });
      }
    }

    const maxDisp = currentMax === -Infinity ? "-inf" : String(currentMax);

    return {
      kind: "matrix" as const,
      rows,
      cols,
      rowHeaders: Array.from({ length: rows }, (_, i) => `Row ${i}`),
      colHeaders: Array.from({ length: cols }, (_, i) => `Col ${i}`),
      title: titleText ?? `2D Strided Max Pooling (Current Window Max: ${maxDisp})`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeOutR: number | null,
    activeOutC: number | null,
    activePr: number | null,
    activePc: number | null,
    currentMax: number,
    titleText?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        activeOutR,
        activeOutC,
        activePr,
        activePc,
        currentMax,
        titleText,
      ),
      auxiliaryState: {
        customState: {
          inputShape: `${rows}x${cols}`,
          poolSize: String(poolSize),
          stride: String(stride),
          outputShape: `${outRows}x${outCols}`,
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    "Initialize 2D Strided Max Pooling Operator",
    `Entry into strided_max_pooling with ${rows}x${cols} matrix, poolSize = ${poolSize}, stride = ${stride}.`,
    { rows, cols, pool_size: poolSize, stride },
    null,
    null,
    null,
    null,
    -Infinity,
    "Function Entry",
  );

  // Line 2: Read rows
  addStep(
    2,
    `Get Matrix Rows: rows = ${rows}`,
    `Extracting row count ${rows} from input feature map matrix.`,
    { rows },
    null,
    null,
    null,
    null,
    -Infinity,
    "Get Rows",
  );

  // Line 3: Read cols
  addStep(
    3,
    `Get Matrix Columns: cols = ${cols}`,
    `Extracting column count ${cols} from input feature map matrix.`,
    { rows, cols },
    null,
    null,
    null,
    null,
    -Infinity,
    "Get Cols",
  );

  // Line 4: out_rows
  addStep(
    4,
    `Compute Output Rows: out_rows = (${rows} - ${poolSize}) // ${stride} + 1 = ${outRows}`,
    `Calculating pooled output row count out_rows = ${outRows}.`,
    { out_rows: outRows, rows, pool_size: poolSize, stride },
    null,
    null,
    null,
    null,
    -Infinity,
    "Compute Out Rows",
  );

  // Line 5: out_cols
  addStep(
    5,
    `Compute Output Cols: out_cols = (${cols} - ${poolSize}) // ${stride} + 1 = ${outCols}`,
    `Calculating pooled output column count out_cols = ${outCols}.`,
    { out_cols: outCols, cols, pool_size: poolSize, stride },
    null,
    null,
    null,
    null,
    -Infinity,
    "Compute Out Cols",
  );

  // Line 6: pooled = []
  addStep(
    6,
    "Initialize Pooled Feature Map Array pooled = []",
    "Allocating list pooled to collect downsampled 2D feature map rows.",
    { pooled: "[]" },
    null,
    null,
    null,
    null,
    -Infinity,
    "Init Output List",
  );

  // Spatial loop
  for (let r = 0; r < outRows; r++) {
    // Line 8: Loop r
    addStep(
      8,
      `Outer Output Row Loop r = ${r}`,
      `Processing output spatial row ${r}.`,
      { r, outRows },
      r,
      null,
      null,
      null,
      -Infinity,
      `Output Row ${r}`,
    );

    const rowOut: number[] = [];
    // Line 9: row_out = []
    addStep(
      9,
      `Initialize Output Row Array row_out = [] for Row ${r}`,
      `Allocating row_out list to store pooled activations for output row ${r}.`,
      { r, row_out: "[]" },
      r,
      null,
      null,
      null,
      -Infinity,
      `Init Row ${r} List`,
    );

    for (let c = 0; c < outCols; c++) {
      // Line 10: Loop c
      addStep(
        10,
        `Middle Output Column Loop c = ${c}`,
        `Processing output spatial cell (${r}, ${c}).`,
        { r, c, outCols },
        r,
        c,
        null,
        null,
        -Infinity,
        `Output Cell (${r}, ${c})`,
      );

      let maxVal = -Infinity;
      // Line 11: max_val = float('-inf')
      addStep(
        11,
        "Initialize Receptive Window Max: max_val = -inf",
        `Setting local maximum tracker max_val to -infinity for output cell (${r}, ${c}).`,
        { r, c, max_val: "-inf" },
        r,
        c,
        null,
        null,
        maxVal,
        `Cell (${r}, ${c}) - Reset Max`,
      );

      for (let pr = 0; pr < poolSize; pr++) {
        // Line 12: Loop pr
        addStep(
          12,
          `Window Relative Row Loop pr = ${pr}`,
          `Scanning window relative row offset pr = ${pr} within poolSize ${poolSize}.`,
          { r, c, pr, poolSize },
          r,
          c,
          pr,
          null,
          maxVal,
          `Cell (${r}, ${c}) - Window Row ${pr}`,
        );

        for (let pc = 0; pc < poolSize; pc++) {
          // Line 13: Loop pc
          addStep(
            13,
            `Window Relative Column Loop pc = ${pc}`,
            `Scanning window relative column offset pc = ${pc} within poolSize ${poolSize}.`,
            { r, c, pr, pc, poolSize },
            r,
            c,
            pr,
            pc,
            maxVal,
            `Cell (${r}, ${c}) - Window Col ${pc}`,
          );

          const inR = r * stride + pr;
          const inC = c * stride + pc;
          const val = matrix[inR][inC];

          // Line 14: val = matrix[...]
          addStep(
            14,
            `Read Feature Map Cell matrix[${inR}][${inC}] = ${val}`,
            `Reading activation val = ${val} at input spatial position (${inR}, ${inC}) = (${r}*${stride}+${pr}, ${c}*${stride}+${pc}).`,
            { r, c, pr, pc, inR, inC, val },
            r,
            c,
            pr,
            pc,
            maxVal,
            `Read matrix[${inR}][${inC}] = ${val}`,
          );

          // Line 15 & 16: if val > max_val: max_val = val
          const isNewMax = val > maxVal;
          if (isNewMax) {
            maxVal = val;
            addStep(
              16,
              `Update Window Max: max_val = ${val} (New Max)`,
              `Activation ${val} exceeds previous max. Updating max_val to ${val}.`,
              { r, c, pr, pc, inR, inC, val, max_val: maxVal, isNewMax: true },
              r,
              c,
              pr,
              pc,
              maxVal,
              `New Max = ${maxVal}`,
            );
          } else {
            addStep(
              15,
              `Compare val (${val}) <= max_val (${maxVal})`,
              `Activation ${val} does not exceed current max ${maxVal}. Keeping max_val unchanged.`,
              { r, c, pr, pc, inR, inC, val, max_val: maxVal, isNewMax: false },
              r,
              c,
              pr,
              pc,
              maxVal,
              `Keep Max = ${maxVal}`,
            );
          }
        }
      }

      // Mark the poolSize x poolSize window cells as completed
      for (let pr = 0; pr < poolSize; pr++) {
        for (let pc = 0; pc < poolSize; pc++) {
          completedWindows.add(`${r * stride + pr},${c * stride + pc}`);
        }
      }

      // Line 17: row_out.append(max_val)
      rowOut.push(maxVal);
      addStep(
        17,
        `Append Window Max ${maxVal} to row_out for Cell (${r}, ${c})`,
        `Storing spatial max ${maxVal} into row_out list for output column ${c}.`,
        { r, c, max_val: maxVal, row_out: `[${rowOut.join(", ")}]` },
        r,
        c,
        null,
        null,
        maxVal,
        `Append to Row ${r}: ${maxVal}`,
      );
    }

    // Line 18: pooled.append(row_out)
    pooled.push(rowOut);
    addStep(
      18,
      `Append Completed Row ${r} to pooled Matrix`,
      `Storing completed row array [${rowOut.join(", ")}] into output feature map matrix pooled.`,
      { r, row_out: `[${rowOut.join(", ")}]`, pooled: JSON.stringify(pooled) },
      r,
      null,
      null,
      null,
      -Infinity,
      `Append Row ${r} to Pooled`,
    );
  }

  // Line 20: Return pooled
  addStep(
    20,
    "Return Downsampled Pooled Feature Map Matrix",
    "Returning downsampled 2D pooled matrix.",
    { pooled: JSON.stringify(pooled) },
    null,
    null,
    null,
    null,
    -Infinity,
    "Return Pooled Matrix",
  );

  return steps;
};

const STRIDEDMAXPOOLING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["val = matrix[r + pr][c + pc]", "out_rows = rows // stride", "max_val = 0"],
  hints: [
    {
      line: 14,
      hint: "Fetch input feature map cell using spatial stride equation: matrix[r * stride + pr][c * stride + pc].",
    },
  ],
  lineExplanations: {
    1: "Function declaration taking input matrix grid, pool_size window, and stride.",
    2: "Retrieves input matrix row count.",
    3: "Retrieves input matrix column count.",
    4: "Computes output spatial row count: out_rows = (rows - pool_size) // stride + 1.",
    5: "Computes output spatial column count: out_cols = (cols - pool_size) // stride + 1.",
    6: "Initializes list pooled to store downsampled 2D output feature map.",
    7: "Blank line separating output allocation from the pooling loops.",
    8: "Outer loop iterating over output row indices r from 0 to out_rows - 1.",
    9: "Allocates list row_out to collect pooled scalar values for current output row.",
    10: "Middle loop iterating over output column indices c from 0 to out_cols - 1.",
    11: "Initializes local receptive window maximum accumulator max_val to negative infinity.",
    12: "Window loop iterating over relative row offset pr within pool_size window.",
    13: "Window loop iterating over relative column offset pc within pool_size window.",
    14: "Fetches input grid element at spatial coordinate matrix[r*stride + pr][c*stride + pc].",
    15: "Checks if current feature activation val is strictly greater than max_val.",
    16: "Updates local window max tracker max_val with new maximum activation val.",
    17: "Appends local receptive window maximum max_val to row_out row array.",
    18: "Appends completed row array row_out to downsampled output matrix pooled.",
    19: "Blank line separating the pooling loops from the return statement.",
    20: "Returns downsampled 2D pooled feature map matrix pooled.",
  },
};

export const stridedMaxPooling: AlgorithmDefinition<stridedMaxPoolingInput> = {
  id: "strided-max-pooling",
  title: "2D Strided Max Pooling Operator",
  topicIds: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  description:
    "In convolutional neural networks (CNNs, e.g. ResNet, VGG, UNet, YOLOv8), 2D max-pooling layers downsample spatial feature map dimensions while introducing local translation invariance.\n\nA sliding receptive window of size $K \\times K$ (`pool_size`) shifts across the input feature map with spatial step size $S$ (`stride`), extracting the maximum activation value within each window:\n$$P[r][c] = \\max_{0 \\le pr < K, 0 \\le pc < K} M[r \\times S + pr][c \\times S + pc]$$\n\nThis algorithm implements the 2D strided max-pooling primitive used in PyTorch `torch.nn.MaxPool2d` and cuDNN pooling kernels, demonstrating step-by-step how output spatial dimensions $(H_{\\text{out}}, W_{\\text{out}})$ are computed and local max reductions are evaluated.",
  constraints: [
    "1 <= matrix.length, matrix[i].length <= 100",
    "1 <= poolSize <= matrix.length",
    "1 <= stride <= poolSize",
    "-10^4 <= matrix[i][j] <= 10^4",
  ],
  examples: [
    {
      kind: "basic",
      title: "4x4 Matrix Non-Overlapping 2x2 Max Pooling",
      inputDisplay: "matrix = [[1,3,2,4],[5,6,1,8],[9,2,7,3],[4,8,5,6]], poolSize = 2, stride = 2",
      outputDisplay: "[[6, 8], [9, 7]]",
      input: {
        matrix: [
          [1, 3, 2, 4],
          [5, 6, 1, 8],
          [9, 2, 7, 3],
          [4, 8, 5, 6],
        ],
        poolSize: 2,
        stride: 2,
      },
      output: "[[6, 8], [9, 7]]",
      explanation: "Downsamples 4x4 feature map to 2x2 matrix by extracting local maxima.",
    },
    {
      kind: "complex",
      title: "Overlapping Windows (Stride 1)",
      inputDisplay: "matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], poolSize = 2, stride = 1",
      outputDisplay: "[[5, 6], [8, 9]]",
      input: {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        poolSize: 2,
        stride: 1,
      },
      output: "[[5, 6], [8, 9]]",
      explanation: "Evaluates overlapping 2x2 pooling windows with stride step size 1.",
    },
    {
      kind: "negative",
      title: "Single Cell Identity Pass",
      inputDisplay: "matrix = [[5]], poolSize = 1, stride = 1",
      outputDisplay: "[[5]]",
      input: { matrix: [[5]], poolSize: 1, stride: 1 },
      output: "[[5]]",
      explanation: "1x1 pool window with stride 1 returns the original matrix.",
    },
  ],
  code: STRIDEDMAXPOOLING_CODE,
  timeComplexity: {
    best: "O(H_out * W_out * poolSize^2)",
    average: "O(H_out * W_out * poolSize^2)",
    worst: "O(H_out * W_out * poolSize^2)",
  },
  spaceComplexity: "O(H_out * W_out)",
  complexityAnalysis: {
    time: "O(H_out * W_out * poolSize^2) time to evaluate every scalar cell in all sliding receptive windows.",
    space: "O(H_out * W_out) memory space to store the downsampled output feature map.",
  },
  topicGuide: {
    overview:
      "2D Max-Pooling downsamples spatial dimensions of tensor feature maps in CNNs. By replacing spatial neighborhoods with their local maximum activation, neural networks maintain feature responses under small spatial translations and reduce parameter memory footprints.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "For an input feature map $M$ of shape $(H, W)$, the pooled output coordinate $(r, c)$ evaluates:\n$$P[r][c] = \\max_{0 \\le pr < K, 0 \\le pc < K} M[r \\times S + pr][c \\times S + pc]$$\nwhere $K$ is `pool_size` and $S$ is `stride`. Spatial output dimension is:\n$$\\text{out\\_dim} = \\lfloor \\frac{\\text{in\\_dim} - K}{S} \\rfloor + 1$$",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Max pooling provides translation invariance in vision architectures (ResNet, VGG, YOLO). It reduces spatial resolution before classification layers, cutting GPU DRAM memory traffic.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "In a $4 \\times 4$ matrix with $K=2, S=2$:\n1. Top-left window $[0..1, 0..1]$: $\\max([1, 3, 5, 6]) = 6$.\n2. Top-right window $[0..1, 2..3]$: $\\max([2, 4, 1, 8]) = 8$.\n3. Bottom-left window $[2..3, 0..1]$: $\\max([9, 2, 4, 8]) = 9$.\n4. Bottom-right window $[2..3, 2..3]$: $\\max([7, 3, 5, 6]) = 7$.\nResulting downsampled feature map is `[[6, 8], [9, 7]]`.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "In deep learning frameworks during forward pass execution, max pooling layers record the argmax indices in a boolean/integer mask. During backward backpropagation, gradients route strictly to the winning argmax location while non-max cells receive zero gradient.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Each of the $H_{\\text{out}} \\times W_{\\text{out}}$ output cells scans a $K \\times K$ window. Total time complexity is $\\mathcal{O}(H_{\\text{out}} \\times W_{\\text{out}} \\times K^2)$. Memory space for the pooled matrix is $\\mathcal{O}(H_{\\text{out}} \\times W_{\\text{out}})$.",
      },
    ],
    keyTerms: [
      {
        term: "Max Pooling",
        definition:
          "Downsampling reduction that selects the maximum activation value in a local spatial window.",
      },
      {
        term: "Receptive Window",
        definition:
          "The local spatial grid of size pool_size x pool_size evaluated in each reduction step.",
      },
      {
        term: "Spatial Stride",
        definition: "The step size increment the sliding window shifts across feature map axes.",
      },
      {
        term: "Argmax Mask",
        definition:
          "Index memory mask recorded during forward pass to direct backward backpropagation gradients.",
      },
    ],
  },
  trivia: STRIDEDMAXPOOLING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_STRIDEDMAXPOOLING_INPUT,
  generateSteps: generateStridedMaxPoolingSteps,
};
