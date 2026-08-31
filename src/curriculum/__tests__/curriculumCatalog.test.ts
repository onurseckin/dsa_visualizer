import { describe, expect, it } from "bun:test";
import {
  ALL_COURSE_JOURNEYS,
  ALL_COURSES_BY_ID,
  DSA_COURSE_JOURNEYS,
  ML_COURSE_JOURNEYS,
  getAllCourseJourneys,
  getCourseJourney,
  getCourseJourneysByTrack,
  getCurriculumMetrics,
  getDsaCourse,
  getMlCourse,
  validateCurriculumCatalog,
} from "../index";

describe("Unified Curriculum Master Catalog Tests", () => {
  describe("1. Catalog Completeness & Reachability", () => {
    it("should register exactly 64 course journeys (23 DSA + 41 ML)", () => {
      expect(ALL_COURSE_JOURNEYS.length).toBe(64);
      expect(DSA_COURSE_JOURNEYS.length).toBe(23);
      expect(ML_COURSE_JOURNEYS.length).toBe(41);
      expect(getAllCourseJourneys().length).toBe(64);
    });

    it("should retrieve every course via getCourseJourney by both raw and stripped IDs", () => {
      for (const journey of ALL_COURSE_JOURNEYS) {
        const foundByRaw = getCourseJourney(journey.id);
        expect(foundByRaw).toBeDefined();
        expect(foundByRaw?.id).toBe(journey.id);

        const strippedId = journey.id.replace(/^(dsa_|ml_)/, "");
        const foundByStripped = getCourseJourney(strippedId);
        expect(foundByStripped).toBeDefined();
        expect(foundByStripped?.id).toBe(journey.id);
      }
    });

    it("should correctly partition and filter by trackId", () => {
      const dsaCourses = getCourseJourneysByTrack("dsa");
      expect(dsaCourses.length).toBe(23);

      const mlCourses = getCourseJourneysByTrack("machine-learning");
      expect(mlCourses.length).toBe(41);

      const mlInfraCourses = getCourseJourneysByTrack("ml-infra");
      expect(mlInfraCourses.length).toBe(41);
    });

    it("should retrieve specialized courses via getDsaCourse and getMlCourse", () => {
      expect(getDsaCourse("dsa_arrays_and_hashing")).toBeDefined();
      expect(getDsaCourse("arrays_and_hashing")).toBeDefined();
      expect(getDsaCourse("non_existent_topic")).toBeUndefined();

      expect(getMlCourse("ml_matrix_memory_layout")).toBeDefined();
      expect(getMlCourse("matrix_memory_layout")).toBeDefined();
      expect(getMlCourse("non_existent_topic")).toBeUndefined();
    });

    it("should have all journeys present in ALL_COURSES_BY_ID map", () => {
      for (const journey of ALL_COURSE_JOURNEYS) {
        expect(ALL_COURSES_BY_ID[journey.id]).toBe(journey);
      }
    });
  });

  describe("2. Structural Invariants & Hierarchy", () => {
    it("every course journey must adhere to structural schema requirements", () => {
      const validDifficulties = new Set([
        "Easy",
        "Medium",
        "Hard",
        "Expert",
        "easy",
        "medium",
        "hard",
        "expert",
      ]);

      for (const journey of ALL_COURSE_JOURNEYS) {
        expect(journey.id.length).toBeGreaterThan(0);
        expect(journey.title.length).toBeGreaterThan(0);
        expect(journey.subtitle.length).toBeGreaterThan(0);
        expect(journey.icon.length).toBeGreaterThan(0);
        expect(validDifficulties.has(journey.difficulty)).toBe(true);
        expect(journey.estimatedMinutes).toBeGreaterThan(0);
        expect(journey.chapters.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("every chapter must have valid chapter numbers, titles, and non-empty pages", () => {
      for (const journey of ALL_COURSE_JOURNEYS) {
        for (let idx = 0; idx < journey.chapters.length; idx++) {
          const chapter = journey.chapters[idx];
          expect(chapter.id.length).toBeGreaterThan(0);
          expect(chapter.chapterNumber).toBe(idx + 1);
          expect(chapter.title.length).toBeGreaterThan(0);
          expect(chapter.subtitle.length).toBeGreaterThan(0);

          const hasPages = Boolean(chapter.pages && chapter.pages.length > 0);
          const hasSections = Boolean(chapter.sections && chapter.sections.length > 0);
          expect(hasPages || hasSections).toBe(true);

          if (chapter.pages) {
            expect(chapter.pages.length).toBeGreaterThanOrEqual(1);
            for (let pIdx = 0; pIdx < chapter.pages.length; pIdx++) {
              const page = chapter.pages[pIdx];
              expect(page.id.length).toBeGreaterThan(0);
              expect(page.pageNumber).toBe(pIdx + 1);
              expect(page.title.length).toBeGreaterThan(0);
              expect(page.sections.length).toBeGreaterThanOrEqual(1);
            }
          }
        }
      }
    });
  });

  describe("3. Section Invariants & Discriminated Union Integrity", () => {
    it("every section must satisfy its discriminated union variant contract", () => {
      const validSectionTypes = new Set([
        "prose",
        "callout",
        "code_progression",
        "mental_model",
        "math_proof",
        "problem_checkpoint",
        "question_bank_suite",
      ]);

      let totalSectionsCount = 0;

      for (const journey of ALL_COURSE_JOURNEYS) {
        for (const chapter of journey.chapters) {
          const allSections = [
            ...(chapter.sections || []),
            ...(chapter.pages?.flatMap((p) => p.sections) || []),
          ];

          for (const section of allSections) {
            totalSectionsCount++;
            expect(validSectionTypes.has(section.type)).toBe(true);

            switch (section.type) {
              case "prose":
                expect(section.content.trim().length).toBeGreaterThan(20);
                break;
              case "callout":
                expect(section.title.trim().length).toBeGreaterThan(0);
                expect(section.content.trim().length).toBeGreaterThan(20);
                expect(["systems", "tip", "warning", "note", "theoretical"]).toContain(
                  section.variant,
                );
                break;
              case "code_progression":
                expect(section.title.trim().length).toBeGreaterThan(0);
                expect(section.language.trim().length).toBeGreaterThan(0);
                expect(section.stages.length).toBeGreaterThanOrEqual(2);
                for (const stage of section.stages) {
                  expect(stage.label.trim().length).toBeGreaterThan(0);
                  expect(stage.code.trim().length).toBeGreaterThan(20);
                  expect(stage.explanation.trim().length).toBeGreaterThan(10);
                }
                break;
              case "mental_model":
                expect(section.title.trim().length).toBeGreaterThan(0);
                expect(section.visualIntuition.trim().length).toBeGreaterThan(10);
                expect(section.invariant.trim().length).toBeGreaterThan(10);
                expect(section.stateTransitions.trim().length).toBeGreaterThan(10);
                expect(section.naiveBottleneck.trim().length).toBeGreaterThan(10);
                expect(section.optimalInsight.trim().length).toBeGreaterThan(10);
                break;
              case "math_proof":
                expect(section.title.trim().length).toBeGreaterThan(0);
                expect(section.theorem.trim().length).toBeGreaterThan(20);
                expect(section.proof.trim().length).toBeGreaterThan(30);
                break;
              case "problem_checkpoint":
                expect(section.problemId.trim().length).toBeGreaterThan(0);
                expect(section.title.trim().length).toBeGreaterThan(0);
                expect(section.rationale.trim().length).toBeGreaterThan(10);
                break;
              case "question_bank_suite":
                expect(section.topicId.trim().length).toBeGreaterThan(0);
                break;
            }
          }
        }
      }

      expect(totalSectionsCount).toBeGreaterThanOrEqual(700);
    });
  });

  describe("4. Anti-Boilerplate & Quality Checks", () => {
    it("should have zero generic copy-paste placeholders across ML Foundations topics", () => {
      const mlFoundations = [
        "ml_linear_logistic_regression",
        "ml_decision_trees_cart",
        "ml_ensemble_xgboost",
        "ml_clustering_kmeans_dbscan",
        "ml_svm_kernel_smo",
        "ml_collaborative_filtering_als",
      ];

      for (const topicId of mlFoundations) {
        const journey = getCourseJourney(topicId);
        expect(journey).toBeDefined();

        const serialized = JSON.stringify(journey);
        // Ensure no leftover placeholder text
        expect(serialized).not.toContain("TODO");
        expect(serialized).not.toContain("def naive(): pass");
        expect(serialized).not.toContain("Placeholder text");
      }
    });

    it("should contain authentic mathematical rigor and theorems", () => {
      const metrics = getCurriculumMetrics();
      expect(metrics.sectionTypeDistribution["math_proof"]).toBeGreaterThanOrEqual(200);
      expect(metrics.sectionTypeDistribution["callout"]).toBeGreaterThanOrEqual(150);
      expect(metrics.sectionTypeDistribution["question_bank_suite"]).toBeGreaterThanOrEqual(60);
    });
  });

  describe("5. Curriculum Analytics & Catalog Invariant Validator", () => {
    it("getCurriculumMetrics should return accurate comprehensive aggregates", () => {
      const metrics = getCurriculumMetrics();

      expect(metrics.totalTopics).toBe(64);
      expect(metrics.dsaTopicsCount).toBe(23);
      expect(metrics.mlTopicsCount).toBe(41);
      expect(metrics.totalChapters).toBe(128);
      expect(metrics.totalPages).toBeGreaterThanOrEqual(350);
      expect(metrics.totalSections).toBeGreaterThanOrEqual(700);
      expect(metrics.totalEstimatedMinutes).toBeGreaterThanOrEqual(5000);
      expect(metrics.totalEstimatedHours).toBeGreaterThanOrEqual(80);
    });

    it("validateCurriculumCatalog should pass with 0 errors", () => {
      const report = validateCurriculumCatalog();
      expect(report.isValid).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.checkedTopicsCount).toBe(64);
    });
  });
});
