import type { PythonExecutionSpec } from "@dsa-visualizer/execution-contracts";
import type { DifficultyLevel, ProblemCheckpointSection } from "../curriculum/courseTypes";
import { ALL_COURSE_JOURNEYS } from "../curriculum/index";
import { getPythonExecutionSpec, getPythonStarterCode } from "./executionSpecs";
import { resolveExecutionSpec } from "./runnerAdapter";
import { DSA_EXECUTION_SPECS, DSA_STARTER_CODE } from "./specs-data/dsa";
import { ML_SPECS_MAP, ML_STARTER_CODE } from "./specs-data/ml";

/**
 * Extracted checkpoint reference pointing back to its curriculum hierarchy.
 */
export interface CheckpointReference {
  readonly topicId: string;
  readonly courseTitle: string;
  readonly chapterNumber: number;
  readonly chapterTitle: string;
  readonly pageNumber: number;
  readonly pageTitle: string;
  readonly problemId: string;
  readonly title: string;
  readonly difficulty: DifficultyLevel;
  readonly rationale: string;
  readonly starterCode?: string;
}

/**
 * Fully resolved checkpoint metadata and linked execution spec.
 */
export interface ResolvedCheckpoint {
  readonly reference: CheckpointReference;
  readonly spec?: PythonExecutionSpec;
  readonly resolvedStarterCode?: string;
  readonly executionSource: "dsa_registry" | "ml_registry" | "authored_checkpoint" | "unresolved";
  readonly hasValidSignature: boolean;
  readonly testCasesCount: number;
  readonly isValid: boolean;
  readonly issues: readonly string[];
}

/**
 * Comprehensive validation summary across all course problem checkpoints.
 */
export interface CheckpointValidationSummary {
  readonly totalCourses: number;
  readonly totalCheckpoints: number;
  readonly validCheckpointsCount: number;
  readonly dsaCheckpointsCount: number;
  readonly mlCheckpointsCount: number;
  readonly isValid: boolean;
  readonly issues: readonly {
    readonly topicId: string;
    readonly problemId: string;
    readonly message: string;
  }[];
  readonly checkpoints: readonly ResolvedCheckpoint[];
}

function normalizeId(id: string): string {
  return id.replace(/^(dsa_|ml_)/, "").replace(/_/g, "-");
}

/**
 * Resolves a problem ID to its corresponding PythonExecutionSpec using fallback strategies.
 */
export function resolveSpecForProblem(
  problemId: string,
  topicId: string,
): { spec?: PythonExecutionSpec; source: ResolvedCheckpoint["executionSource"] } {
  // 1. Direct lookup by exact problemId
  let spec = getPythonExecutionSpec(problemId);
  if (spec) {
    const isMl = ML_SPECS_MAP.has(problemId);
    return { spec, source: isMl ? "ml_registry" : "dsa_registry" };
  }

  // 2. Lookup by topicId
  spec = getPythonExecutionSpec(topicId);
  if (spec) {
    const isMl = ML_SPECS_MAP.has(topicId);
    return { spec, source: isMl ? "ml_registry" : "dsa_registry" };
  }

  // 3. Lookup normalized problemId (e.g. kebab-case vs snake_case)
  const normProblem = normalizeId(problemId);
  spec = getPythonExecutionSpec(normProblem);
  if (spec) {
    return { spec, source: ML_SPECS_MAP.has(normProblem) ? "ml_registry" : "dsa_registry" };
  }

  // 4. Lookup normalized topicId
  const normTopic = normalizeId(topicId);
  spec = getPythonExecutionSpec(normTopic);
  if (spec) {
    return { spec, source: ML_SPECS_MAP.has(normTopic) ? "ml_registry" : "dsa_registry" };
  }

  // 5. Lookup via DSA_EXECUTION_SPECS key aliases
  for (const [key, entry] of DSA_EXECUTION_SPECS.entries()) {
    if (
      key === problemId ||
      key === normProblem ||
      key.replace(/-/g, "_") === problemId ||
      problemId.includes(key)
    ) {
      return { spec: entry, source: "dsa_registry" };
    }
  }

  for (const [key, entry] of ML_SPECS_MAP.entries()) {
    if (
      key === problemId ||
      key === normProblem ||
      key.replace(/-/g, "_") === problemId ||
      problemId.includes(key)
    ) {
      return { spec: entry, source: "ml_registry" };
    }
  }

  return { spec: undefined, source: "unresolved" };
}

/**
 * Validates whether a given starter code contains a recognizable function, class, or export signature.
 */
export function validateStarterCodeSignature(code?: string): boolean {
  if (!code || code.trim().length === 0) return false;
  const trimmed = code.trim();

  // Python patterns: def func_name(...) or class ClassName
  const hasPythonDef = /\bdef\s+[a-zA-Z0-9_]+\s*\(/.test(trimmed);
  const hasPythonClass = /\bclass\s+[a-zA-Z0-9_]+/.test(trimmed);

  // TypeScript/JS patterns: function, export function, export class
  const hasTsFunction = /\bfunction\s+[a-zA-Z0-9_]+\s*\(/.test(trimmed);
  const hasTsClass = /\bclass\s+[a-zA-Z0-9_]+/.test(trimmed);
  const hasExport = /\bexport\s+(function|class|const)\s+/.test(trimmed);

  return hasPythonDef || hasPythonClass || hasTsFunction || hasTsClass || hasExport;
}

/**
 * Extracts all problem checkpoints from the entire curriculum catalog.
 */
export function extractAllCheckpoints(): readonly CheckpointReference[] {
  const references: CheckpointReference[] = [];

  for (const journey of ALL_COURSE_JOURNEYS) {
    for (const chapter of journey.chapters || []) {
      for (const page of chapter.pages || []) {
        for (const section of page.sections || []) {
          if (section.type === "problem_checkpoint") {
            const cp = section as ProblemCheckpointSection;
            references.push({
              topicId: journey.id,
              courseTitle: journey.title,
              chapterNumber: chapter.chapterNumber,
              chapterTitle: chapter.title,
              pageNumber: page.pageNumber,
              pageTitle: page.title,
              problemId: cp.problemId,
              title: cp.title,
              difficulty: cp.difficulty,
              rationale: cp.rationale,
              starterCode: cp.starterCode,
            });
          }
        }
      }
    }
  }

  return references;
}

/**
 * Resolves and validates all problem checkpoints across the entire 64-course curriculum.
 */
export function validateCheckpointLinkages(): CheckpointValidationSummary {
  const references = extractAllCheckpoints();
  const resolvedList: ResolvedCheckpoint[] = [];
  const globalIssues: { topicId: string; problemId: string; message: string }[] = [];

  let dsaCount = 0;
  let mlCount = 0;
  let validCount = 0;

  for (const ref of references) {
    const isDsa = ref.topicId.startsWith("dsa_");
    if (isDsa) dsaCount++;
    else mlCount++;

    const issues: string[] = [];

    // 1. Validate problemId format
    if (!ref.problemId || ref.problemId.trim().length === 0) {
      issues.push("Empty problemId");
    }

    // 2. Validate difficulty
    const diffNorm = ref.difficulty.toLowerCase();
    if (!["easy", "medium", "hard", "expert"].includes(diffNorm)) {
      issues.push(`Invalid difficulty rating: ${ref.difficulty}`);
    }

    // 3. Validate rationale
    if (!ref.rationale || ref.rationale.trim().length === 0) {
      issues.push("Empty rationale");
    }

    // 4. Resolve Execution Spec
    const { spec, source } = resolveSpecForProblem(ref.problemId, ref.topicId);

    // 5. Resolve Starter Code
    let starterCode = ref.starterCode;
    if (!starterCode) {
      starterCode =
        getPythonStarterCode(ref.problemId) ||
        (spec
          ? DSA_STARTER_CODE.get(ref.problemId) || ML_STARTER_CODE.get(ref.problemId)
          : undefined);
    }

    const hasValidSig = validateStarterCodeSignature(starterCode);
    if (!hasValidSig) {
      issues.push("Starter code lacks clean function or class signature");
    }

    const testCasesCount = spec ? spec.cases.length : 0;
    const finalSource = spec ? source : starterCode ? "authored_checkpoint" : "unresolved";

    const isValid = issues.length === 0;
    if (isValid) {
      validCount++;
    } else {
      for (const issue of issues) {
        globalIssues.push({
          topicId: ref.topicId,
          problemId: ref.problemId,
          message: issue,
        });
      }
    }

    resolvedList.push({
      reference: ref,
      spec,
      resolvedStarterCode: starterCode,
      executionSource: finalSource,
      hasValidSignature: hasValidSig,
      testCasesCount,
      isValid,
      issues,
    });
  }

  return {
    totalCourses: ALL_COURSE_JOURNEYS.length,
    totalCheckpoints: references.length,
    validCheckpointsCount: validCount,
    dsaCheckpointsCount: dsaCount,
    mlCheckpointsCount: mlCount,
    isValid: globalIssues.length === 0,
    issues: globalIssues,
    checkpoints: resolvedList,
  };
}

/**
 * Retrieves all resolved checkpoints for a specific course topic.
 */
export function getCheckpointsByTopic(topicId: string): readonly ResolvedCheckpoint[] {
  const summary = validateCheckpointLinkages();
  return summary.checkpoints.filter(
    (cp) =>
      cp.reference.topicId === topicId ||
      normalizeId(cp.reference.topicId) === normalizeId(topicId),
  );
}

/**
 * Retrieves a single resolved checkpoint by its unique problem ID.
 */
export function getCheckpointByProblemId(problemId: string): ResolvedCheckpoint | undefined {
  const summary = validateCheckpointLinkages();
  return summary.checkpoints.find(
    (cp) =>
      cp.reference.problemId === problemId ||
      normalizeId(cp.reference.problemId) === normalizeId(problemId),
  );
}

/**
 * Resolves a problem or topic ID to its fully structured ResolvedCheckpoint,
 * attempting direct curriculum checkpoint lookup first, then fallback spec & starter code lookup.
 */
export function resolveCheckpointSpec(
  problemOrTopicId: string,
  topicId?: string,
): ResolvedCheckpoint | undefined {
  if (!problemOrTopicId && !topicId) return undefined;

  const targetId = (problemOrTopicId || topicId || "").trim();

  // 1. Direct curriculum checkpoint lookup by problemId
  const direct = getCheckpointByProblemId(targetId);
  if (direct) return direct;

  // 2. Lookup within curriculum checkpoints by topicId
  if (topicId) {
    const topicCheckpoints = getCheckpointsByTopic(topicId);
    const matched = topicCheckpoints.find(
      (cp) =>
        cp.reference.problemId === targetId ||
        normalizeId(cp.reference.problemId) === normalizeId(targetId) ||
        cp.reference.problemId.includes(targetId) ||
        targetId.includes(cp.reference.problemId),
    );
    if (matched) return matched;
    if (topicCheckpoints.length > 0 && normalizeId(topicId) === normalizeId(targetId)) {
      return topicCheckpoints[0];
    }
  } else {
    const topicCheckpoints = getCheckpointsByTopic(targetId);
    if (topicCheckpoints.length > 0) {
      return topicCheckpoints[0];
    }
  }

  // 3. Dynamic resolution via execution spec catalogs and starter code registries
  const effectiveTopic = topicId || targetId;
  let { spec, source } = resolveSpecForProblem(targetId, effectiveTopic);
  if (!spec) {
    spec = resolveExecutionSpec(targetId) || (topicId ? resolveExecutionSpec(topicId) : undefined);
    if (spec) {
      const isMl =
        ML_SPECS_MAP.has(targetId) ||
        (topicId ? ML_SPECS_MAP.has(topicId) : false) ||
        targetId.startsWith("ml_") ||
        targetId.startsWith("ml-");
      source = isMl ? "ml_registry" : "dsa_registry";
    }
  }

  let starterCode =
    getPythonStarterCode(targetId) ||
    DSA_STARTER_CODE.get(targetId) ||
    ML_STARTER_CODE.get(targetId);

  if (!starterCode && spec) {
    starterCode =
      getPythonStarterCode(spec.entrypoint) ||
      DSA_STARTER_CODE.get(spec.entrypoint) ||
      ML_STARTER_CODE.get(spec.entrypoint);
  }

  if (!starterCode) {
    const norm = normalizeId(targetId);
    starterCode =
      getPythonStarterCode(norm) || DSA_STARTER_CODE.get(norm) || ML_STARTER_CODE.get(norm);
  }

  if (spec || starterCode) {
    const hasValidSig = validateStarterCodeSignature(starterCode);
    const issues: string[] = [];
    if (!hasValidSig) {
      issues.push("Starter code lacks clean function or class signature");
    }

    const title = targetId
      .replace(/^(dsa_|ml_)/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const reference: CheckpointReference = {
      topicId: effectiveTopic,
      courseTitle: title,
      chapterNumber: 1,
      chapterTitle: "Coding Checkpoint",
      pageNumber: 1,
      pageTitle: title,
      problemId: targetId,
      title,
      difficulty: "Medium",
      rationale: `Implement optimal solution for ${title} adhering to complexity constraints.`,
      starterCode,
    };

    return {
      reference,
      spec,
      resolvedStarterCode: starterCode,
      executionSource: spec ? source : starterCode ? "authored_checkpoint" : "unresolved",
      hasValidSignature: hasValidSig,
      testCasesCount: spec ? spec.cases.length : 0,
      isValid: issues.length === 0,
      issues,
    };
  }

  return undefined;
}
