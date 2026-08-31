import type { CoursePage, CourseTopicJourney, CurriculumTrackId } from "./courseTypes";
import { DSA_COURSE_JOURNEYS, DSA_COURSES_BY_ID } from "./courses/dsa";
import { ML_COURSE_JOURNEYS, ML_COURSES_BY_ID } from "./courses/ml";

const ALL_COURSE_JOURNEYS: readonly CourseTopicJourney[] = [
  ...DSA_COURSE_JOURNEYS,
  ...ML_COURSE_JOURNEYS,
];

function getCourseJourney(topicId: string): CourseTopicJourney | undefined {
  return (
    DSA_COURSES_BY_ID[topicId] ||
    DSA_COURSES_BY_ID[`dsa_${topicId}`] ||
    ML_COURSES_BY_ID[topicId] ||
    ML_COURSES_BY_ID[`ml_${topicId}`]
  );
}

/**
 * Single page progress within a course journey.
 */
export interface PageProgress {
  pageId: string;
  pageNumber: number;
  completed: boolean;
  completedAt?: number;
  timeSpentSeconds: number;
  lastVisitedAt: number;
}

/**
 * Checkpoint/coding problem performance status.
 */
export interface CheckpointProgress {
  problemId: string;
  bestScore: number;
  attempts: number;
  passed: boolean;
  lastAttemptAt: number;
}

/**
 * Socratic question bank diagnostic scores.
 */
export interface QuestionBankProgress {
  topicId: string;
  partScores: Record<string, number>;
  completedQuestions: string[];
  totalScore: number;
  lastAttemptAt: number;
}

/**
 * Granular topic-level mastery and progress state.
 */
export interface TopicProgress {
  topicId: string;
  trackId: CurriculumTrackId;
  completed: boolean;
  completedAt?: number;
  completionPercentage: number;
  pages: Record<string, PageProgress>;
  checkpoints: Record<string, CheckpointProgress>;
  questionBank?: QuestionBankProgress;
  timeSpentSeconds: number;
  lastActiveTimestamp: number;
}

/**
 * Earned specialization badge and mastery milestone.
 */
export interface MasteryCredential {
  id: string;
  title: string;
  category: "dsa" | "ml" | "general";
  description: string;
  requiredTopicIds: string[];
  unlocked: boolean;
  unlockedAt?: number;
  progressFraction: number; // 0.0 to 1.0
  completedTopicCount: number;
  totalRequiredTopicCount: number;
}

/**
 * Root serialized progress state container.
 */
export interface CourseProgressState {
  version: number;
  topics: Record<string, TopicProgress>;
  globalLastActiveTimestamp: number;
  totalLearningTimeSeconds: number;
}

/**
 * Metrics breakdown for a specific course journey.
 */
export interface CourseProgressMetrics {
  topicId: string;
  title: string;
  trackId: CurriculumTrackId;
  completionPercentage: number;
  totalPages: number;
  completedPagesCount: number;
  chapters: Array<{
    chapterNumber: number;
    title: string;
    totalPages: number;
    completedPages: number;
    isCompleted: boolean;
  }>;
  checkpointsPassed: number;
  totalCheckpoints: number;
  isFullyMastered: boolean;
  estimatedMinutesRemaining: number;
  timeSpentMinutes: number;
}

/**
 * Global curriculum mastery dashboard overview.
 */
export interface OverallMasteryOverview {
  totalCourses: number;
  completedCoursesCount: number;
  dsaCoursesTotal: number;
  dsaCoursesCompleted: number;
  dsaCompletionPercentage: number;
  mlCoursesTotal: number;
  mlCoursesCompleted: number;
  mlCompletionPercentage: number;
  overallCompletionPercentage: number;
  totalLearningHours: number;
  totalCheckpointsPassed: number;
  credentials: MasteryCredential[];
  recentActiveTopicIds: string[];
}

/**
 * Definitions for industry and research mastery credentials.
 */
export const MASTERY_CREDENTIAL_DEFINITIONS: Array<{
  id: string;
  title: string;
  category: "dsa" | "ml" | "general";
  description: string;
  requiredTopicIds: string[];
}> = [
  {
    id: "cred_dsa_graph_flows",
    title: "Graph Theory & Network Flows Master",
    category: "dsa",
    description:
      "Mastery of topological sorts, shortest paths (Dijkstra, Bellman-Ford), minimum spanning trees, and polynomial max-flow cuts (Dinic, Edmonds-Karp).",
    requiredTopicIds: [
      "dsa_graph_traversal",
      "dsa_graph_shortest_paths",
      "dsa_graph_spanning_trees",
      "dsa_graph_flows_and_cuts",
    ],
  },
  {
    id: "cred_dsa_dp_grandmaster",
    title: "Dynamic Programming Grandmaster",
    category: "dsa",
    description:
      "Mastery of high-dimensional state transitions: 1D/2D DP, Interval Scheduling, Game Theory minimax, and Bitmask manipulations.",
    requiredTopicIds: [
      "dsa_dp_1d",
      "dsa_dp_2d",
      "dsa_intervals",
      "dsa_game_theory",
      "dsa_bit_manipulation",
    ],
  },
  {
    id: "cred_dsa_spatial_strings",
    title: "Spatial Partitioning & Automata Specialist",
    category: "dsa",
    description:
      "Mastery of Aho-Corasick multi-pattern search, K-D Trees, Segment Trees, and Fenwick trees.",
    requiredTopicIds: [
      "dsa_tries_and_strings",
      "dsa_advanced_range_queries",
      "ml_trie_aho_corasick",
      "ml_kd_trees_top_k",
      "ml_ann_hnsw_ivfpq",
    ],
  },
  {
    id: "cred_ml_math_optimization",
    title: "Mathematical Optimization & Convexity Architect",
    category: "ml",
    description:
      "Rigorous foundations in Gram-Schmidt orthogonalization, SVD/PCA, KKT dual multipliers, and Adam momentum.",
    requiredTopicIds: [
      "ml_matrix_memory_layout",
      "ml_vector_spaces_gram_schmidt",
      "ml_matrix_svd_pca",
      "ml_convex_optimization_duality",
      "ml_first_order_optimization_adam",
    ],
  },
  {
    id: "cred_ml_llm_attention",
    title: "Transformer & Attention Kernel Architect",
    category: "ml",
    description:
      "Mastery of causal SDPA, RoPE/GQA, FlashAttention SRAM tiling, Online Softmax, and RMSNorm.",
    requiredTopicIds: [
      "ml_attention_causal_sdpa",
      "ml_rope_gqa_attention",
      "ml_flashattention_sram_tiling",
      "ml_activations_online_softmax",
      "ml_normalization_rmsnorm",
      "ml_subword_bpe_tiktoken",
    ],
  },
  {
    id: "cred_ml_distributed_systems",
    title: "Distributed ML & Parameter Sharding Expert",
    category: "ml",
    description:
      "Mastery of Hockney interconnect modeling, Ring-AllReduce collectives, ZeRO-3 sharding, 3D Parallelism, and Compiler Fusion.",
    requiredTopicIds: [
      "ml_interconnect_alpha_beta",
      "ml_ring_allreduce_collective",
      "ml_zero3_parameter_sharding",
      "ml_parallelism_3d_moe_1f1b",
      "ml_dense_gemm_tiling",
      "ml_compiler_fusion_liveness",
    ],
  },
  {
    id: "cred_ml_inference_acceleration",
    title: "High-Throughput LLM Inference Systems Engineer",
    category: "ml",
    description:
      "Mastery of Orca continuous batching, PagedAttention Copy-On-Write, Speculative Decoding, and Affine Quantization.",
    requiredTopicIds: [
      "ml_continuous_batching_orca",
      "ml_pagedattention_cow_vllm",
      "ml_speculative_decoding",
      "ml_affine_quantization_int8",
      "ml_floating_point_kahan",
    ],
  },
  {
    id: "cred_general_polymath",
    title: "Full-Spectrum Computer Science Polymath",
    category: "general",
    description:
      "Full mastery and completion of all 64 DSA and ML Systems courses in the curriculum.",
    requiredTopicIds: ALL_COURSE_JOURNEYS.map((j) => j.id),
  },
];

/**
 * Creates an empty, clean initial progress state.
 */
export function createInitialProgressState(): CourseProgressState {
  return {
    version: 1,
    topics: {},
    globalLastActiveTimestamp: Date.now(),
    totalLearningTimeSeconds: 0,
  };
}

/**
 * Normalizes a topic ID by matching against catalog journeys.
 */
function normalizeTopicId(topicId: string): string {
  const journey = getCourseJourney(topicId);
  return journey ? journey.id : topicId;
}

/**
 * Finds all pages belonging to a course journey.
 */
function getJourneyPages(journey: CourseTopicJourney): CoursePage[] {
  const pages: CoursePage[] = [];
  for (const chapter of journey.chapters) {
    if (chapter.pages) {
      pages.push(...chapter.pages);
    }
  }
  return pages;
}

/**
 * Finds all checkpoint problems belonging to a course journey.
 */
function getJourneyProblemIds(journey: CourseTopicJourney): string[] {
  const problemIds: string[] = [];
  for (const chapter of journey.chapters) {
    if (chapter.pages) {
      for (const page of chapter.pages) {
        for (const section of page.sections) {
          if (section.type === "problem_checkpoint" && section.problemId) {
            problemIds.push(section.problemId);
          }
        }
      }
    }
  }
  return problemIds;
}

/**
 * Ensures topic progress entry exists in state.
 */
function ensureTopicProgress(state: CourseProgressState, topicId: string): TopicProgress {
  const canonicalId = normalizeTopicId(topicId);
  const journey = getCourseJourney(canonicalId);
  const trackId: CurriculumTrackId =
    journey?.trackId || (canonicalId.startsWith("ml_") ? "machine-learning" : "dsa");

  if (!state.topics[canonicalId]) {
    state.topics[canonicalId] = {
      topicId: canonicalId,
      trackId,
      completed: false,
      completionPercentage: 0,
      pages: {},
      checkpoints: {},
      timeSpentSeconds: 0,
      lastActiveTimestamp: Date.now(),
    };
  }

  return state.topics[canonicalId];
}

/**
 * Recalculates topic completion percentage based on pages and checkpoints.
 */
function recalculateTopicProgress(state: CourseProgressState, topicId: string): void {
  const canonicalId = normalizeTopicId(topicId);
  const topicProgress = state.topics[canonicalId];
  if (!topicProgress) return;

  const journey = getCourseJourney(canonicalId);
  if (!journey) return;

  const allPages = getJourneyPages(journey);
  if (allPages.length === 0) return;

  let completedPagesCount = 0;
  for (const page of allPages) {
    const pageProg = topicProgress.pages[page.id] || topicProgress.pages[`p_${page.pageNumber}`];
    if (pageProg && pageProg.completed) {
      completedPagesCount++;
    }
  }

  const rawPercentage = Math.round((completedPagesCount / allPages.length) * 100);
  topicProgress.completionPercentage = Math.min(100, Math.max(0, rawPercentage));

  if (topicProgress.completionPercentage === 100 && !topicProgress.completed) {
    topicProgress.completed = true;
    topicProgress.completedAt = Date.now();
  } else if (topicProgress.completionPercentage < 100) {
    topicProgress.completed = false;
    delete topicProgress.completedAt;
  }
}

/**
 * Records that a user has visited a specific page.
 */
export function markPageVisited(
  state: CourseProgressState,
  topicId: string,
  pageIdOrNumber: string | number,
  timeSpentSeconds: number = 0,
): CourseProgressState {
  const topicProgress = ensureTopicProgress(state, topicId);
  const canonicalId = topicProgress.topicId;
  const journey = getCourseJourney(canonicalId);

  const pageKey = typeof pageIdOrNumber === "number" ? `p_${pageIdOrNumber}` : pageIdOrNumber;
  let pageNumber = typeof pageIdOrNumber === "number" ? pageIdOrNumber : 1;

  if (journey) {
    const allPages = getJourneyPages(journey);
    const foundPage =
      typeof pageIdOrNumber === "number"
        ? allPages.find((p) => p.pageNumber === pageIdOrNumber)
        : allPages.find((p) => p.id === pageIdOrNumber);
    if (foundPage) {
      pageNumber = foundPage.pageNumber;
    }
  }

  const existing = topicProgress.pages[pageKey] || {
    pageId: pageKey,
    pageNumber,
    completed: false,
    timeSpentSeconds: 0,
    lastVisitedAt: Date.now(),
  };

  existing.timeSpentSeconds += Math.max(0, timeSpentSeconds);
  existing.lastVisitedAt = Date.now();
  topicProgress.pages[pageKey] = existing;

  topicProgress.timeSpentSeconds += Math.max(0, timeSpentSeconds);
  topicProgress.lastActiveTimestamp = Date.now();
  state.globalLastActiveTimestamp = Date.now();
  state.totalLearningTimeSeconds += Math.max(0, timeSpentSeconds);

  return state;
}

/**
 * Marks a specific page as completed, recalculating progress percentages.
 */
export function markPageCompleted(
  state: CourseProgressState,
  topicId: string,
  pageIdOrNumber: string | number,
  timeSpentSeconds: number = 0,
): CourseProgressState {
  const topicProgress = ensureTopicProgress(state, topicId);
  const canonicalId = topicProgress.topicId;
  const journey = getCourseJourney(canonicalId);

  let pageKey = typeof pageIdOrNumber === "number" ? `p_${pageIdOrNumber}` : pageIdOrNumber;
  let pageNumber = typeof pageIdOrNumber === "number" ? pageIdOrNumber : 1;

  if (journey) {
    const allPages = getJourneyPages(journey);
    const foundPage =
      typeof pageIdOrNumber === "number"
        ? allPages.find((p) => p.pageNumber === pageIdOrNumber)
        : allPages.find((p) => p.id === pageIdOrNumber);
    if (foundPage) {
      pageKey = foundPage.id;
      pageNumber = foundPage.pageNumber;
    }
  }

  const existing = topicProgress.pages[pageKey] || {
    pageId: pageKey,
    pageNumber,
    completed: false,
    timeSpentSeconds: 0,
    lastVisitedAt: Date.now(),
  };

  if (!existing.completed) {
    existing.completed = true;
    existing.completedAt = Date.now();
  }
  existing.timeSpentSeconds += Math.max(0, timeSpentSeconds);
  existing.lastVisitedAt = Date.now();
  topicProgress.pages[pageKey] = existing;

  topicProgress.timeSpentSeconds += Math.max(0, timeSpentSeconds);
  topicProgress.lastActiveTimestamp = Date.now();
  state.globalLastActiveTimestamp = Date.now();
  state.totalLearningTimeSeconds += Math.max(0, timeSpentSeconds);

  recalculateTopicProgress(state, canonicalId);
  return state;
}

/**
 * Records coding problem checkpoint test evaluation results.
 */
export function recordCheckpointResult(
  state: CourseProgressState,
  topicId: string,
  problemId: string,
  score: number,
  passed?: boolean,
): CourseProgressState {
  const topicProgress = ensureTopicProgress(state, topicId);
  const isPassed = passed !== undefined ? passed : score >= 80;

  const existing = topicProgress.checkpoints[problemId] || {
    problemId,
    bestScore: 0,
    attempts: 0,
    passed: false,
    lastAttemptAt: Date.now(),
  };

  existing.attempts += 1;
  existing.bestScore = Math.max(existing.bestScore, score);
  existing.passed = existing.passed || isPassed;
  existing.lastAttemptAt = Date.now();

  topicProgress.checkpoints[problemId] = existing;
  topicProgress.lastActiveTimestamp = Date.now();
  state.globalLastActiveTimestamp = Date.now();

  return state;
}

/**
 * Records Socratic question bank diagnostic scores.
 */
export function recordSocraticQuestionAnswer(
  state: CourseProgressState,
  topicId: string,
  part: string,
  questionIndex: number,
  score: number,
): CourseProgressState {
  const topicProgress = ensureTopicProgress(state, topicId);
  const qId = `${part}_q${questionIndex}`;

  if (!topicProgress.questionBank) {
    topicProgress.questionBank = {
      topicId: topicProgress.topicId,
      partScores: {},
      completedQuestions: [],
      totalScore: 0,
      lastAttemptAt: Date.now(),
    };
  }

  const qb = topicProgress.questionBank;
  qb.partScores[part] = Math.max(qb.partScores[part] || 0, score);
  if (!qb.completedQuestions.includes(qId)) {
    qb.completedQuestions.push(qId);
  }
  qb.totalScore = Object.values(qb.partScores).reduce((acc, s) => acc + s, 0);
  qb.lastAttemptAt = Date.now();

  topicProgress.lastActiveTimestamp = Date.now();
  state.globalLastActiveTimestamp = Date.now();

  return state;
}

/**
 * Computes deep progress metrics for a single topic journey.
 */
export function getCourseProgressMetrics(
  state: CourseProgressState,
  topicId: string,
): CourseProgressMetrics | undefined {
  const canonicalId = normalizeTopicId(topicId);
  const journey = getCourseJourney(canonicalId);
  if (!journey) return undefined;

  const topicProgress = state.topics[canonicalId];
  const allPages = getJourneyPages(journey);
  const allProblemIds = getJourneyProblemIds(journey);

  const chaptersBreakdown: CourseProgressMetrics["chapters"] = [];
  let completedPagesTotal = 0;

  for (const chapter of journey.chapters) {
    const chapterPages = chapter.pages || [];
    let chapterCompletedPages = 0;

    for (const page of chapterPages) {
      const pageProg =
        topicProgress?.pages[page.id] || topicProgress?.pages[`p_${page.pageNumber}`];
      if (pageProg && pageProg.completed) {
        chapterCompletedPages++;
        completedPagesTotal++;
      }
    }

    chaptersBreakdown.push({
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      totalPages: chapterPages.length,
      completedPages: chapterCompletedPages,
      isCompleted: chapterPages.length > 0 && chapterCompletedPages === chapterPages.length,
    });
  }

  let checkpointsPassed = 0;
  if (topicProgress) {
    for (const probId of allProblemIds) {
      if (topicProgress.checkpoints[probId]?.passed) {
        checkpointsPassed++;
      }
    }
  }

  const totalPages = allPages.length;
  const completionPercentage =
    totalPages > 0 ? Math.round((completedPagesTotal / totalPages) * 100) : 0;
  const isFullyMastered =
    completionPercentage === 100 &&
    (allProblemIds.length === 0 || checkpointsPassed === allProblemIds.length);

  const estimatedTotalMins = journey.estimatedMinutes || totalPages * 20;
  const estimatedRemaining = Math.max(
    0,
    Math.round(estimatedTotalMins * (1 - completionPercentage / 100)),
  );

  return {
    topicId: canonicalId,
    title: journey.title,
    trackId: journey.trackId || "dsa",
    completionPercentage,
    totalPages,
    completedPagesCount: completedPagesTotal,
    chapters: chaptersBreakdown,
    checkpointsPassed,
    totalCheckpoints: allProblemIds.length,
    isFullyMastered,
    estimatedMinutesRemaining: estimatedRemaining,
    timeSpentMinutes: Math.round((topicProgress?.timeSpentSeconds || 0) / 60),
  };
}

/**
 * Aggregates global track completion, total learning time, and unlocks mastery credentials.
 */
export function getOverallMasteryOverview(state: CourseProgressState): OverallMasteryOverview {
  const dsaJourneys = ALL_COURSE_JOURNEYS.filter((j) => j.trackId === "dsa" || !j.trackId);
  const mlJourneys = ALL_COURSE_JOURNEYS.filter(
    (j) => j.trackId === "machine-learning" || j.trackId === "ml" || j.trackId === "ml-infra",
  );

  let dsaCompleted = 0;
  let mlCompleted = 0;
  let totalCheckpointsPassed = 0;

  for (const journey of dsaJourneys) {
    const prog = state.topics[journey.id];
    if (prog && prog.completionPercentage === 100) {
      dsaCompleted++;
    }
    if (prog) {
      for (const cp of Object.values(prog.checkpoints)) {
        if (cp.passed) totalCheckpointsPassed++;
      }
    }
  }

  for (const journey of mlJourneys) {
    const prog = state.topics[journey.id];
    if (prog && prog.completionPercentage === 100) {
      mlCompleted++;
    }
    if (prog) {
      for (const cp of Object.values(prog.checkpoints)) {
        if (cp.passed) totalCheckpointsPassed++;
      }
    }
  }

  const dsaPercentage =
    dsaJourneys.length > 0 ? Math.round((dsaCompleted / dsaJourneys.length) * 100) : 0;
  const mlPercentage =
    mlJourneys.length > 0 ? Math.round((mlCompleted / mlJourneys.length) * 100) : 0;
  const totalCompleted = dsaCompleted + mlCompleted;
  const overallPercentage =
    ALL_COURSE_JOURNEYS.length > 0
      ? Math.round((totalCompleted / ALL_COURSE_JOURNEYS.length) * 100)
      : 0;

  // Evaluate Mastery Credentials
  const credentials: MasteryCredential[] = MASTERY_CREDENTIAL_DEFINITIONS.map((def) => {
    let completedCount = 0;
    for (const reqId of def.requiredTopicIds) {
      const canonicalReqId = normalizeTopicId(reqId);
      const prog = state.topics[canonicalReqId];
      if (prog && prog.completionPercentage === 100) {
        completedCount++;
      }
    }

    const progressFraction =
      def.requiredTopicIds.length > 0 ? completedCount / def.requiredTopicIds.length : 0;
    const unlocked =
      completedCount === def.requiredTopicIds.length && def.requiredTopicIds.length > 0;

    return {
      id: def.id,
      title: def.title,
      category: def.category,
      description: def.description,
      requiredTopicIds: def.requiredTopicIds,
      unlocked,
      unlockedAt: unlocked ? state.globalLastActiveTimestamp : undefined,
      progressFraction: Math.round(progressFraction * 100) / 100,
      completedTopicCount: completedCount,
      totalRequiredTopicCount: def.requiredTopicIds.length,
    };
  });

  // Collect most recently active topic IDs
  const activeTopics = Object.values(state.topics)
    .filter((t) => t.lastActiveTimestamp > 0)
    .sort((a, b) => b.lastActiveTimestamp - a.lastActiveTimestamp)
    .map((t) => t.topicId)
    .slice(0, 5);

  return {
    totalCourses: ALL_COURSE_JOURNEYS.length,
    completedCoursesCount: totalCompleted,
    dsaCoursesTotal: dsaJourneys.length,
    dsaCoursesCompleted: dsaCompleted,
    dsaCompletionPercentage: dsaPercentage,
    mlCoursesTotal: mlJourneys.length,
    mlCoursesCompleted: mlCompleted,
    mlCompletionPercentage: mlPercentage,
    overallCompletionPercentage: overallPercentage,
    totalLearningHours: Math.round((state.totalLearningTimeSeconds / 3600) * 10) / 10,
    totalCheckpointsPassed,
    credentials,
    recentActiveTopicIds: activeTopics,
  };
}

/**
 * Serializes progress state to JSON string with schema validation.
 */
export function serializeProgress(state: CourseProgressState): string {
  return JSON.stringify({
    version: state.version || 1,
    topics: state.topics || {},
    globalLastActiveTimestamp: state.globalLastActiveTimestamp || Date.now(),
    totalLearningTimeSeconds: state.totalLearningTimeSeconds || 0,
  });
}

/**
 * Deserializes and validates a JSON string into a structured CourseProgressState.
 */
export function deserializeProgress(jsonStr: string): CourseProgressState {
  if (!jsonStr || typeof jsonStr !== "string") {
    return createInitialProgressState();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object") {
      return createInitialProgressState();
    }

    const state: CourseProgressState = {
      version: typeof parsed.version === "number" ? parsed.version : 1,
      topics: {},
      globalLastActiveTimestamp:
        typeof parsed.globalLastActiveTimestamp === "number"
          ? parsed.globalLastActiveTimestamp
          : Date.now(),
      totalLearningTimeSeconds:
        typeof parsed.totalLearningTimeSeconds === "number" ? parsed.totalLearningTimeSeconds : 0,
    };

    if (parsed.topics && typeof parsed.topics === "object") {
      for (const [key, rawTopic] of Object.entries(parsed.topics)) {
        if (!rawTopic || typeof rawTopic !== "object") continue;
        const topicObj = rawTopic as Record<string, unknown>;

        const topicId = typeof topicObj.topicId === "string" ? topicObj.topicId : key;
        const canonicalId = normalizeTopicId(topicId);

        state.topics[canonicalId] = {
          topicId: canonicalId,
          trackId: (topicObj.trackId as CurriculumTrackId) || "dsa",
          completed: Boolean(topicObj.completed),
          completedAt: typeof topicObj.completedAt === "number" ? topicObj.completedAt : undefined,
          completionPercentage:
            typeof topicObj.completionPercentage === "number" ? topicObj.completionPercentage : 0,
          pages: (topicObj.pages as Record<string, PageProgress>) || {},
          checkpoints: (topicObj.checkpoints as Record<string, CheckpointProgress>) || {},
          questionBank: (topicObj.questionBank as QuestionBankProgress) || undefined,
          timeSpentSeconds:
            typeof topicObj.timeSpentSeconds === "number" ? topicObj.timeSpentSeconds : 0,
          lastActiveTimestamp:
            typeof topicObj.lastActiveTimestamp === "number"
              ? topicObj.lastActiveTimestamp
              : Date.now(),
        };

        // Validate percentage consistency
        recalculateTopicProgress(state, canonicalId);
      }
    }

    return state;
  } catch {
    return createInitialProgressState();
  }
}
