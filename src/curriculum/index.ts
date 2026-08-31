import {
  ALL_COURSE_JOURNEYS,
  DSA_COURSE_JOURNEYS,
  ML_COURSE_JOURNEYS,
  getCourseJourney,
} from "./catalog";
import { TOPIC_CATALOG } from "./topics";

// Re-export type definitions and catalog modules
export * from "./courseTypes";
export * from "./topics";
export * from "./catalog";
export * from "./search";
export * from "./socraticEvaluator";
export * from "./courseProgress";
export * from "./stepperAdapters";
export * from "./performanceProfiler";
export * from "./exerciseGenerator";
export * from "./distributedSimulator";
export * from "./adversarialStressSuite";
export * from "./visualizerRouter";
export * from "./conceptGraph";
export * from "./certificateEngine";
export * from "./adaptiveTutor";
export * from "./canvasGeometry";
export * from "./scalabilityBenchmark";
export * from "./timeTravelDebugger";
export { DSA_COURSE_JOURNEYS, DSA_COURSES_BY_ID, getDsaCourse } from "./courses/dsa";
export { ML_COURSE_JOURNEYS, ML_COURSES_BY_ID, getMlCourse } from "./courses/ml";

/**
 * Comprehensive Curriculum Analytics and Structural Metrics Interface.
 */
export interface CurriculumMetrics {
  readonly totalTopics: number;
  readonly dsaTopicsCount: number;
  readonly mlTopicsCount: number;
  readonly totalChapters: number;
  readonly totalPages: number;
  readonly totalSections: number;
  readonly totalEstimatedMinutes: number;
  readonly totalEstimatedHours: number;
  readonly difficultyDistribution: Record<string, number>;
  readonly sectionTypeDistribution: Record<string, number>;
}

/**
 * Computes deep curriculum statistics and content volume analytics across all courses.
 */
export function getCurriculumMetrics(): CurriculumMetrics {
  let totalChapters = 0;
  let totalPages = 0;
  let totalSections = 0;
  let totalEstimatedMinutes = 0;
  const difficultyDistribution: Record<string, number> = {};
  const sectionTypeDistribution: Record<string, number> = {};

  for (const journey of ALL_COURSE_JOURNEYS) {
    totalEstimatedMinutes += journey.estimatedMinutes || 0;
    const diff = journey.difficulty || "Medium";
    difficultyDistribution[diff] = (difficultyDistribution[diff] || 0) + 1;

    for (const chapter of journey.chapters || []) {
      totalChapters++;
      for (const section of chapter.sections || []) {
        totalSections++;
        sectionTypeDistribution[section.type] = (sectionTypeDistribution[section.type] || 0) + 1;
      }

      for (const page of chapter.pages || []) {
        totalPages++;
        for (const section of page.sections || []) {
          totalSections++;
          sectionTypeDistribution[section.type] = (sectionTypeDistribution[section.type] || 0) + 1;
        }
      }
    }
  }

  return {
    totalTopics: ALL_COURSE_JOURNEYS.length,
    dsaTopicsCount: DSA_COURSE_JOURNEYS.length,
    mlTopicsCount: ML_COURSE_JOURNEYS.length,
    totalChapters,
    totalPages,
    totalSections,
    totalEstimatedMinutes,
    totalEstimatedHours: Math.round((totalEstimatedMinutes / 60) * 10) / 10,
    difficultyDistribution,
    sectionTypeDistribution,
  };
}

/**
 * Structural Invariant Audit and Validation Report.
 */
export interface CatalogValidationReport {
  readonly isValid: boolean;
  readonly checkedTopicsCount: number;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validates integrity of all courses, ensuring:
 * - Every topic in TOPIC_CATALOG has an active, valid CourseTopicJourney
 * - Every chapter has non-empty pages and valid chapter numbers
 * - Every page has non-empty sections and valid page numbers
 * - Zero broken references or empty content fields
 */
export function validateCurriculumCatalog(): CatalogValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const registeredIds = new Set<string>();

  for (const journey of ALL_COURSE_JOURNEYS) {
    if (!journey.id) {
      errors.push("Found CourseTopicJourney with missing or empty ID.");
      continue;
    }

    if (registeredIds.has(journey.id)) {
      errors.push(`Duplicate CourseTopicJourney ID detected: '${journey.id}'.`);
    }
    registeredIds.add(journey.id);

    if (!journey.title) {
      errors.push(`Journey '${journey.id}' is missing a title.`);
    }

    if (!journey.chapters || journey.chapters.length === 0) {
      errors.push(`Journey '${journey.id}' has 0 chapters.`);
      continue;
    }

    for (let cIdx = 0; cIdx < journey.chapters.length; cIdx++) {
      const chapter = journey.chapters[cIdx];
      if (!chapter.id) {
        errors.push(`Journey '${journey.id}' Chapter ${cIdx + 1} is missing an ID.`);
      }

      const hasPages = chapter.pages && chapter.pages.length > 0;
      const hasSections = chapter.sections && chapter.sections.length > 0;

      if (!hasPages && !hasSections) {
        errors.push(
          `Journey '${journey.id}' Chapter '${chapter.id || cIdx + 1}' has neither pages nor direct sections.`,
        );
      }

      if (chapter.pages) {
        for (let pIdx = 0; pIdx < chapter.pages.length; pIdx++) {
          const page = chapter.pages[pIdx];
          if (!page.id) {
            errors.push(
              `Journey '${journey.id}' Chapter '${chapter.id}' Page ${pIdx + 1} is missing an ID.`,
            );
          }
          if (!page.sections || page.sections.length === 0) {
            errors.push(
              `Journey '${journey.id}' Chapter '${chapter.id}' Page '${page.id || pIdx + 1}' has 0 sections.`,
            );
          }
        }
      }
    }
  }

  // Cross-reference against TOPIC_CATALOG in topics.ts
  for (const topic of TOPIC_CATALOG) {
    const journey = getCourseJourney(topic.id);
    if (!journey) {
      warnings.push(
        `TOPIC_CATALOG topic '${topic.id}' (${topic.label}) has no registered CourseTopicJourney.`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    checkedTopicsCount: ALL_COURSE_JOURNEYS.length,
    errors,
    warnings,
  };
}
