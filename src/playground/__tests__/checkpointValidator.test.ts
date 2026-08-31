import { describe, expect, it } from "bun:test";
import { ALL_COURSE_JOURNEYS } from "../../curriculum/index";
import {
  extractAllCheckpoints,
  getCheckpointByProblemId,
  getCheckpointsByTopic,
  validateCheckpointLinkages,
  validateStarterCodeSignature,
} from "../checkpointValidator";

describe("Problem Checkpoint Starter Code & Solution Validator Suite Tests", () => {
  describe("1. Curriculum Checkpoint Extraction & Reachability", () => {
    it("should extract problem checkpoints across the entire 64-course catalog", () => {
      const checkpoints = extractAllCheckpoints();
      expect(checkpoints.length).toBeGreaterThanOrEqual(64);

      // Verify representations across both tracks
      const dsaCheckpoints = checkpoints.filter((cp) => cp.topicId.startsWith("dsa_"));
      const mlCheckpoints = checkpoints.filter((cp) => cp.topicId.startsWith("ml_"));

      expect(dsaCheckpoints.length).toBeGreaterThanOrEqual(23);
      expect(mlCheckpoints.length).toBeGreaterThanOrEqual(41);
    });

    it("every course in the curriculum should contain at least one problem checkpoint", () => {
      for (const journey of ALL_COURSE_JOURNEYS) {
        const checkpoints = getCheckpointsByTopic(journey.id);
        expect(checkpoints.length).toBeGreaterThanOrEqual(1);

        for (const cp of checkpoints) {
          expect(cp.reference.topicId).toBe(journey.id);
          expect(cp.reference.problemId.length).toBeGreaterThan(0);
          expect(cp.reference.title.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("2. Starter Code Signature Verification", () => {
    it("should correctly validate clean Python and TypeScript function signatures", () => {
      expect(validateStarterCodeSignature("def solve(nums: list[int]) -> int:\n    pass")).toBe(
        true,
      );
      expect(validateStarterCodeSignature("class Solution:\n    def solve(self): pass")).toBe(true);
      expect(
        validateStarterCodeSignature(
          "export function solve(nums: number[]): number {\n  return 0;\n}",
        ),
      ).toBe(true);
      expect(validateStarterCodeSignature("function binarySearch(arr, target) {}")).toBe(true);
    });

    it("should reject empty or malformed code snippets", () => {
      expect(validateStarterCodeSignature("")).toBe(false);
      expect(validateStarterCodeSignature("   \n\t  ")).toBe(false);
      expect(validateStarterCodeSignature("# Just a comment with no signature")).toBe(false);
      expect(validateStarterCodeSignature("var x = 10; var y = 20;")).toBe(false);
    });
  });

  describe("3. Checkpoint Linkage & Integrity Validation", () => {
    it("validateCheckpointLinkages should pass with zero dangling or malformed checkpoints", () => {
      const summary = validateCheckpointLinkages();

      expect(summary.totalCourses).toBe(64);
      expect(summary.totalCheckpoints).toBeGreaterThanOrEqual(64);
      expect(summary.validCheckpointsCount).toBe(summary.totalCheckpoints);
      expect(summary.isValid).toBe(true);
      expect(summary.issues.length).toBe(0);

      for (const cp of summary.checkpoints) {
        expect(cp.isValid).toBe(true);
        expect(cp.hasValidSignature).toBe(true);
        expect(["Easy", "Medium", "Hard"]).toContain(cp.reference.difficulty);
        expect(cp.reference.rationale.length).toBeGreaterThan(10);
        expect(cp.resolvedStarterCode).toBeDefined();
        expect(cp.resolvedStarterCode!.length).toBeGreaterThan(0);
      }
    });
  });

  describe("4. Topic & Problem ID Lookups", () => {
    it("should retrieve checkpoints by topic ID for signature DSA courses", () => {
      const treeCheckpoints = getCheckpointsByTopic("dsa_tree_fundamentals");
      expect(treeCheckpoints.length).toBeGreaterThanOrEqual(1);
      expect(treeCheckpoints[0].reference.title).toContain("Binary Search Tree");

      const flowCheckpoints = getCheckpointsByTopic("dsa_graph_flows_and_cuts");
      expect(flowCheckpoints.length).toBeGreaterThanOrEqual(1);
      expect(flowCheckpoints[0].reference.title).toContain("Cut");
    });

    it("should retrieve checkpoints by topic ID for signature ML courses", () => {
      const flashCheckpoints = getCheckpointsByTopic("ml_flashattention_sram_tiling");
      expect(flashCheckpoints.length).toBeGreaterThanOrEqual(1);
      expect(flashCheckpoints[0].reference.title).toContain("FlashAttention");

      const pagedCheckpoints = getCheckpointsByTopic("ml_pagedattention_cow_vllm");
      expect(pagedCheckpoints.length).toBeGreaterThanOrEqual(1);
      expect(pagedCheckpoints[0].reference.title).toContain("PagedAttention");
    });

    it("should retrieve checkpoint by specific problem ID", () => {
      const all = extractAllCheckpoints();
      const firstProblemId = all[0].problemId;

      const cp = getCheckpointByProblemId(firstProblemId);
      expect(cp).toBeDefined();
      expect(cp?.reference.problemId).toBe(firstProblemId);
      expect(cp?.isValid).toBe(true);
    });
  });
});
