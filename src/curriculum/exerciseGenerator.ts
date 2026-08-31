import type {
  CalloutSection,
  CoursePage,
  MathProofSection,
  MentalModelSection,
} from "./courseTypes";
import { ALL_COURSE_JOURNEYS, getCourseJourney } from "./index";

/**
 * High-yield active recall flashcard item.
 */
export interface CourseFlashcard {
  readonly id: string;
  readonly topicId: string;
  readonly courseTitle: string;
  readonly category: "concept" | "theorem" | "systems";
  readonly front: string;
  readonly back: string;
  readonly keyTakeaway: string;
  readonly difficulty: "Easy" | "Medium" | "Hard";
}

/**
 * Parameterized numerical problem with interactive solution verifier.
 */
export interface NumericalExercise {
  readonly id: string;
  readonly topicId: string;
  readonly title: string;
  readonly prompt: string;
  readonly parameters: Record<string, number | string>;
  readonly correctAnswer: number;
  readonly unit: string;
  readonly tolerance: number;
  readonly solutionSteps: readonly string[];
  verify(studentAnswer: number): {
    readonly isCorrect: boolean;
    readonly errorPct: number;
    readonly feedback: string;
  };
}

/**
 * Simple deterministic pseudo-random number generator for seeded exercises.
 */
function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates high-yield active recall flashcards for a specific course topic.
 */
export function generateTopicFlashcards(topicId: string): readonly CourseFlashcard[] {
  const journey = getCourseJourney(topicId);
  if (!journey) return [];

  const flashcards: CourseFlashcard[] = [];
  let cardIdx = 1;

  for (const chapter of journey.chapters || []) {
    const pages: readonly CoursePage[] =
      chapter.pages && chapter.pages.length > 0
        ? chapter.pages
        : [
            {
              id: `${chapter.id}_p1`,
              pageNumber: 1,
              title: chapter.title,
              sections: chapter.sections || [],
            },
          ];

    for (const page of pages) {
      for (const section of page.sections || []) {
        // 1. Theorem Flashcards from MathProofSection
        if (section.type === "math_proof") {
          const sec = section as MathProofSection;
          flashcards.push({
            id: `${journey.id}_fc_${cardIdx++}`,
            topicId: journey.id,
            courseTitle: journey.title,
            category: "theorem",
            front: `State the mathematical formulation and significance of: "${sec.title}"`,
            back: `Theorem:\n${sec.theorem}\n\nProof Outline:\n${sec.proof.slice(0, 300)}...`,
            keyTakeaway: `Key Invariant: ${sec.theorem.split("\n")[0].slice(0, 120)}`,
            difficulty: "Hard",
          });
        }

        // 2. Mental Model & Invariant Flashcards
        if (section.type === "mental_model") {
          const sec = section as MentalModelSection;
          flashcards.push({
            id: `${journey.id}_fc_${cardIdx++}`,
            topicId: journey.id,
            courseTitle: journey.title,
            category: "concept",
            front: `What core structural invariant governs: "${sec.title}"?`,
            back: `Invariant:\n${sec.invariant}\n\nVisual Intuition:\n${sec.visualIntuition}\n\nOptimal Insight:\n${sec.optimalInsight}`,
            keyTakeaway: sec.invariant,
            difficulty: "Medium",
          });
        }

        // 3. Systems Realities & Hardware Callouts
        if (section.type === "callout" && (section as CalloutSection).variant === "systems") {
          const sec = section as CalloutSection;
          flashcards.push({
            id: `${journey.id}_fc_${cardIdx++}`,
            topicId: journey.id,
            courseTitle: journey.title,
            category: "systems",
            front: `Hardware Reality: What microarchitectural or memory bottleneck does "${sec.title}" address?`,
            back: sec.content,
            keyTakeaway: `Systems Takeaway: ${sec.content.slice(0, 140)}...`,
            difficulty: "Hard",
          });
        }
      }
    }
  }

  // Ensure every course has at least 3 flashcards
  if (flashcards.length === 0) {
    flashcards.push({
      id: `${journey.id}_fc_fallback_1`,
      topicId: journey.id,
      courseTitle: journey.title,
      category: "concept",
      front: `What is the primary algorithmic objective of ${journey.title}?`,
      back:
        journey.subtitle ||
        `Mastery of algorithmic structures and systems optimizations in ${journey.title}.`,
      keyTakeaway: journey.title,
      difficulty: "Medium",
    });
  }

  return flashcards;
}

/**
 * Retrieves all flashcards across the curriculum with optional track filtering.
 */
export function getAllFlashcards(trackFilter?: string): readonly CourseFlashcard[] {
  const cards: CourseFlashcard[] = [];

  for (const journey of ALL_COURSE_JOURNEYS) {
    if (trackFilter && trackFilter !== "all") {
      const isMlFilter =
        trackFilter === "machine-learning" || trackFilter === "ml" || trackFilter === "ml-infra";
      const isDsaFilter = trackFilter === "dsa";
      const isMlCourse =
        journey.trackId === "machine-learning" ||
        journey.trackId === "ml" ||
        journey.trackId === "ml-infra" ||
        journey.id.startsWith("ml_");
      const isDsaCourse =
        journey.trackId === "dsa" || !journey.trackId || journey.id.startsWith("dsa_");

      if (isMlFilter && !isMlCourse) continue;
      if (isDsaFilter && !isDsaCourse) continue;
      if (!isMlFilter && !isDsaFilter && journey.trackId !== trackFilter) continue;
    }
    cards.push(...generateTopicFlashcards(journey.id));
  }

  return cards;
}

/**
 * Builds a numerical exercise with verification logic.
 */
function createNumericalExercise(def: {
  id: string;
  topicId: string;
  title: string;
  prompt: string;
  parameters: Record<string, number | string>;
  correctAnswer: number;
  unit: string;
  tolerance?: number;
  solutionSteps: readonly string[];
}): NumericalExercise {
  const tolerance = def.tolerance ?? 0.01;
  const target = def.correctAnswer;

  return {
    id: def.id,
    topicId: def.topicId,
    title: def.title,
    prompt: def.prompt,
    parameters: def.parameters,
    correctAnswer: target,
    unit: def.unit,
    tolerance,
    solutionSteps: def.solutionSteps,
    verify: (studentAnswer: number) => {
      const error = Math.abs(studentAnswer - target);
      const errorPct = target !== 0 ? (error / Math.abs(target)) * 100 : error * 100;
      const isCorrect = error <= tolerance || errorPct <= tolerance * 100;

      let feedback = "";
      if (isCorrect) {
        feedback = `Correct! Exact answer: ${target} ${def.unit} (your answer: ${studentAnswer} ${def.unit}).`;
      } else {
        feedback = `Incorrect. Expected ~${target} ${def.unit}, received ${studentAnswer} ${def.unit} (${errorPct.toFixed(2)}% error). Review the solution steps.`;
      }

      return { isCorrect, errorPct, feedback };
    },
  };
}

/**
 * Generates parameterized, self-grading numerical calculations.
 */
export function generateNumericalExercises(
  topicId?: string,
  seed: number = 42,
): readonly NumericalExercise[] {
  const rng = createPRNG(seed);
  const exercises: NumericalExercise[] = [];

  // 1. KV Cache Sizing
  if (
    !topicId ||
    topicId.includes("attention") ||
    topicId.includes("llm") ||
    topicId.includes("serving")
  ) {
    const layers = [32, 40, 80][Math.floor(rng() * 3)];
    const kvHeads = [8, 16, 32][Math.floor(rng() * 3)];
    const headDim = 128;
    const seqLen = [2048, 4096, 8192][Math.floor(rng() * 3)];
    const batchSize = [8, 16, 32][Math.floor(rng() * 3)];
    const bytesPerElem = 2; // FP16/BF16

    // Total bytes = 2 * layers * kvHeads * headDim * seqLen * batchSize * bytesPerElem
    const totalBytes = 2 * layers * kvHeads * headDim * seqLen * batchSize * bytesPerElem;
    const totalGB = Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100;

    exercises.push(
      createNumericalExercise({
        id: `num_kv_cache_${seed}`,
        topicId: "ml_attention_causal_sdpa",
        title: "LLM Serving: Exact KV Cache Memory Sizing",
        prompt: `Calculate the total GPU memory footprint in Gigabytes (GB) for an LLM KV cache with:\n- ${layers} Transformer layers\n- ${kvHeads} Key/Value heads per layer\n- Head dimension $d_{\\text{head}} = ${headDim}$\n- Context sequence length $L = ${seqLen}$\n- Batch size $B = ${batchSize}$\n- FP16 precision (2 bytes per element).`,
        parameters: { layers, kvHeads, headDim, seqLen, batchSize, bytesPerElem },
        correctAnswer: totalGB,
        unit: "GB",
        tolerance: 0.1,
        solutionSteps: [
          `1. Memory per token per layer = 2 (Key + Value) * ${kvHeads} heads * ${headDim} dim * 2 bytes = ${2 * kvHeads * headDim * 2} bytes.`,
          `2. Memory per sequence across all ${layers} layers = ${layers} * ${2 * kvHeads * headDim * 2} * ${seqLen} bytes = ${(layers * 2 * kvHeads * headDim * 2 * seqLen) / 1e6} MB.`,
          `3. Total memory for batch ${batchSize} = ${totalBytes} bytes = ${totalGB} GB.`,
        ],
      }),
    );
  }

  // 2. Ring-AllReduce Transfer Time
  if (
    !topicId ||
    topicId.includes("allreduce") ||
    topicId.includes("distributed") ||
    topicId.includes("parallel")
  ) {
    const P = [8, 16, 32, 64][Math.floor(rng() * 4)];
    const modelGB = [10, 20, 70][Math.floor(rng() * 3)];
    const bandwidthGBs = [50, 100, 300][Math.floor(rng() * 3)]; // NVLink / InfiniBand

    // Transfer time = 2 * ((P - 1) / P) * (modelGB / bandwidthGBs)
    const factor = (2 * (P - 1)) / P;
    const timeSec = Math.round(((factor * modelGB) / bandwidthGBs) * 1000) / 1000;

    exercises.push(
      createNumericalExercise({
        id: `num_ring_allreduce_${seed}`,
        topicId: "ml_distributed_data_parallel_ddp",
        title: "Distributed DDP: Ring-AllReduce Transfer Latency",
        prompt: `In a Ring-AllReduce collective over $P = ${P}$ GPUs communicating a gradient tensor of size $S = ${modelGB}\\text{ GB}$ with interconnect bandwidth $B = ${bandwidthGBs}\\text{ GB/s}$, calculate the theoretical network transfer time in seconds (ignoring latency $\\alpha$).`,
        parameters: { P, modelGB, bandwidthGBs },
        correctAnswer: timeSec,
        unit: "seconds",
        tolerance: 0.01,
        solutionSteps: [
          `1. Ring-AllReduce communicates exactly $2 \\frac{P-1}{P} S$ total bytes per GPU.`,
          `2. Multiplier = 2 * (${P} - 1) / ${P} = ${factor.toFixed(4)}.`,
          `3. Time = (${factor.toFixed(4)} * ${modelGB} GB) / ${bandwidthGBs} GB/s = ${timeSec} seconds.`,
        ],
      }),
    );
  }

  // 3. ZeRO-3 Parameter Sharding
  if (
    !topicId ||
    topicId.includes("zero") ||
    topicId.includes("memory") ||
    topicId.includes("optim")
  ) {
    const paramsBillion = [7, 13, 70][Math.floor(rng() * 3)];
    const gpus = [8, 16, 32, 64][Math.floor(rng() * 4)];

    // ZeRO-3 memory per GPU = (16 * paramsBillion) / gpus
    const totalStateGB = 16 * paramsBillion;
    const perGpuGB = Math.round((totalStateGB / gpus) * 100) / 100;

    exercises.push(
      createNumericalExercise({
        id: `num_zero3_sharding_${seed}`,
        topicId: "ml_zero_stage_123_optimizer",
        title: "ZeRO-3 DeepSpeed: Static Memory Footprint Per GPU",
        prompt: `Under ZeRO-3 parameter, gradient, and optimizer state sharding (fp16 params 2B + fp16 grads 2B + fp32 master params 4B + Adam moments 8B = 16 bytes/param), compute the static memory footprint in GB per GPU for a ${paramsBillion}B parameter model sharded across $N = ${gpus}$ GPUs.`,
        parameters: { paramsBillion, gpus, bytesPerParam: 16 },
        correctAnswer: perGpuGB,
        unit: "GB",
        tolerance: 0.05,
        solutionSteps: [
          `1. Total un-sharded optimizer + parameter state = 16 bytes * ${paramsBillion}B = ${totalStateGB} GB.`,
          `2. Sharded across ${gpus} GPUs = ${totalStateGB} / ${gpus} = ${perGpuGB} GB per GPU.`,
        ],
      }),
    );
  }

  // 4. Fenwick Tree Lowbit Jump
  if (
    !topicId ||
    topicId.includes("range") ||
    topicId.includes("fenwick") ||
    topicId.includes("tree")
  ) {
    const indices = [12, 28, 44, 56, 72, 88];
    const idx = indices[Math.floor(rng() * indices.length)];
    const lowbit = idx & -idx;
    const nextIdx = idx + lowbit;

    exercises.push(
      createNumericalExercise({
        id: `num_fenwick_lowbit_${seed}`,
        topicId: "dsa_advanced_range_queries",
        title: "Fenwick Binary Indexed Tree: Prefix Update Jump",
        prompt: `In a 1-indexed Fenwick Tree, when updating index $i = ${idx}$, what is the immediate parent index updated in the next step ($i \\leftarrow i + (i \\,\\&\\, -i)$)?`,
        parameters: { index: idx, lowbit },
        correctAnswer: nextIdx,
        unit: "index",
        tolerance: 0,
        solutionSteps: [
          `1. Binary representation of ${idx} = 0b${idx.toString(2)}.`,
          `2. Two's complement isolation: lowbit = ${idx} & -${idx} = ${lowbit}.`,
          `3. Next index = ${idx} + ${lowbit} = ${nextIdx}.`,
        ],
      }),
    );
  }

  // 5. Im2Col Unfolded Memory Expansion
  if (
    !topicId ||
    topicId.includes("convolution") ||
    topicId.includes("im2col") ||
    topicId.includes("gemm")
  ) {
    const C_in = [16, 32, 64][Math.floor(rng() * 3)];
    const K = 3; // 3x3 kernel
    const H = [64, 128, 256][Math.floor(rng() * 3)];
    const W = H;
    const B = 8;

    // Im2Col blowup = K * K = 9x
    const rawMB = Math.round(((B * C_in * H * W * 4) / 1e6) * 100) / 100;
    const colMB = Math.round(((B * (C_in * K * K) * H * W * 4) / 1e6) * 100) / 100;

    exercises.push(
      createNumericalExercise({
        id: `num_im2col_expansion_${seed}`,
        topicId: "ml_convolutions_im2col_gemm",
        title: "Im2Col Memory Expansion Ratio",
        prompt: `For a $3 \\times 3$ stride-1 convolution with input tensor shape ($B=${B}, C=${C_in}, H=${H}, W=${W}$) in FP32 (4 bytes/elem), what is the total memory footprint of the materialized unfolded matrix $X_{\\text{col}}$ in Megabytes (MB)?`,
        parameters: { B, C_in, K, H, W, rawMB },
        correctAnswer: colMB,
        unit: "MB",
        tolerance: 1.0,
        solutionSteps: [
          `1. Raw input size = ${B} * ${C_in} * ${H} * ${W} * 4 bytes = ${rawMB} MB.`,
          `2. Unfolded column matrix rows = C_in * K * K = ${C_in * K * K}.`,
          `3. Materialized matrix size = 9 * raw_size = ${colMB} MB.`,
        ],
      }),
    );
  }

  return exercises;
}
