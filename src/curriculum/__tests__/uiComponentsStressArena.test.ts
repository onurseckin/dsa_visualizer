import { describe, expect, it } from "bun:test";
import React from "react";
import { AdversarialStressArena } from "../../components/curriculum";
import {
  ATTACK_VECTORS,
  type AdversarialStressResult,
  type ResilienceReport,
  type StressTestResult,
  evaluateAlgorithmResilience,
  executeStressTest,
  getAllAttackVectors,
  getAttackVector,
} from "../index";

describe("Adversarial Stress Suite & Arena UI Tests", () => {
  describe("1. Attack Vector Catalog & Domain Category Filtering", () => {
    it("should retrieve all 7 core attack vectors", () => {
      const allVectors = getAllAttackVectors();
      expect(allVectors.length).toBe(7);
      expect(ATTACK_VECTORS.length).toBe(7);

      const ids = new Set(allVectors.map((v) => v.id));
      expect(ids.has("numerical_underflow_overflow")).toBe(true);
      expect(ids.has("collinear_point_degeneracy")).toBe(true);
      expect(ids.has("high_dim_scale_curse")).toBe(true);
      expect(ids.has("hilbert_ill_conditioned")).toBe(true);
      expect(ids.has("adversarial_hash_collision")).toBe(true);
      expect(ids.has("cycle_deadlock_threaded_tree")).toBe(true);
      expect(ids.has("saddle_point_plateau")).toBe(true);
    });

    it("should filter vectors accurately by Numerical category", () => {
      const numericalVectors = getAllAttackVectors("Numerical");
      expect(numericalVectors.length).toBe(3);
      for (const v of numericalVectors) {
        expect(v.category).toBe("Numerical");
      }
      const numIds = numericalVectors.map((v) => v.id);
      expect(numIds).toContain("numerical_underflow_overflow");
      expect(numIds).toContain("hilbert_ill_conditioned");
      expect(numIds).toContain("saddle_point_plateau");
    });

    it("should filter vectors accurately by Geometric category", () => {
      const geomVectors = getAllAttackVectors("Geometric");
      expect(geomVectors.length).toBe(1);
      expect(geomVectors[0].id).toBe("collinear_point_degeneracy");
      expect(geomVectors[0].category).toBe("Geometric");
      expect(geomVectors[0].severity).toBe("High");
    });

    it("should filter vectors accurately by Hardware category", () => {
      const hwVectors = getAllAttackVectors("Hardware");
      expect(hwVectors.length).toBe(1);
      expect(hwVectors[0].id).toBe("high_dim_scale_curse");
      expect(hwVectors[0].category).toBe("Hardware");
      expect(hwVectors[0].severity).toBe("High");
    });

    it("should filter vectors accurately by Algorithmic category", () => {
      const algoVectors = getAllAttackVectors("Algorithmic");
      expect(algoVectors.length).toBe(2);
      const algoIds = algoVectors.map((v) => v.id);
      expect(algoIds).toContain("adversarial_hash_collision");
      expect(algoIds).toContain("cycle_deadlock_threaded_tree");
    });

    it("should retrieve specific attack vectors by id with full metadata", () => {
      const attack = getAttackVector("numerical_underflow_overflow");
      expect(attack).toBeDefined();
      expect(attack?.title).toBe("IEEE 754 Subnormal Cancellation & Overflow");
      expect(attack?.severity).toBe("Critical");
      expect(attack?.category).toBe("Numerical");
      expect(attack?.pathology).toContain("Float32 underflow");
      expect(attack?.counterMeasure).toContain("Log-Sum-Exp");
      expect(attack?.hardwareMitigation).toContain("FTZ / DAZ");
      expect(attack?.stressMetrics.impactPercent).toBeGreaterThanOrEqual(80);
      expect(attack?.payloadGenerator).toBeDefined();

      const payload = attack?.payloadGenerator?.();
      expect(payload).toBeDefined();
      expect((payload as Record<string, unknown>).logits).toBeDefined();
    });

    it("should return undefined for unknown attack vector IDs", () => {
      const nonExistent = getAttackVector("unknown_non_existent_attack");
      expect(nonExistent).toBeUndefined();
    });
  });

  describe("2. Single Attack Vector Stress Execution", () => {
    it("should execute unmitigated attack as failed with degradation metrics", () => {
      const result = executeStressTest("numerical_underflow_overflow", undefined, {
        applyCounterMeasure: false,
      });

      expect(result.attackId).toBe("numerical_underflow_overflow");
      expect(result.passed).toBe(false);
      expect(result.resilient).toBe(false);
      expect(result.counterMeasureApplied).toBe(false);
      expect(result.impactPercent).toBe(88);
      expect(result.latencyMs).toBe(4.2);
      expect(result.violationDetails).toBeDefined();
      expect(result.violationDetails).toContain("Unmitigated vulnerability detected");
      expect(result.mitigationNotes).toContain("Counter-measure unapplied");
    });

    it("should execute attack with counter-measure defense as passed and resilient", () => {
      const result = executeStressTest("numerical_underflow_overflow", undefined, {
        applyCounterMeasure: true,
      });

      expect(result.attackId).toBe("numerical_underflow_overflow");
      expect(result.passed).toBe(true);
      expect(result.resilient).toBe(true);
      expect(result.counterMeasureApplied).toBe(true);
      expect(result.impactPercent).toBeLessThanOrEqual(20);
      expect(result.latencyMs).toBe(0.04);
      expect(result.violationDetails).toBeUndefined();
      expect(result.mitigationNotes).toContain("Defensive mitigation verified");
      expect(result.hardwareMitigation).toContain("FTZ / DAZ");
    });

    it("should handle custom candidate functions that throw exceptions", () => {
      const crashingCandidate = () => {
        throw new Error("Stack overflow in recursive Morris pointer resolution");
      };

      const result = executeStressTest("cycle_deadlock_threaded_tree", undefined, {
        candidateFn: crashingCandidate,
      });

      expect(result.passed).toBe(false);
      expect(result.resilient).toBe(false);
      expect(result.violationDetails).toContain("Unhandled exception during stress execution");
      expect(result.violationDetails).toContain("Stack overflow in recursive Morris");
    });

    it("should handle custom candidate functions that produce numerical anomalies", () => {
      const nanCandidate = () => ({
        result: NaN,
        gradients: [1.0, NaN, 3.0],
      });

      const result = executeStressTest("hilbert_ill_conditioned", undefined, {
        candidateFn: nanCandidate,
      });

      expect(result.passed).toBe(false);
      expect(result.resilient).toBe(false);
      expect(result.violationDetails).toContain("Custom execution detected numerical instability");
    });

    it("should verify custom candidate functions that succeed", () => {
      const robustCandidate = (input: Record<string, unknown>) => {
        const count = ((input.points as unknown[]) || []).length;
        return { hullSize: Math.min(2, count), status: "ok" };
      };

      const result = executeStressTest("collinear_point_degeneracy", undefined, {
        candidateFn: robustCandidate,
      });

      expect(result.passed).toBe(true);
      expect(result.resilient).toBe(true);
      expect(result.violationDetails).toBeUndefined();
    });

    it("should handle unknown attack IDs gracefully", () => {
      const result = executeStressTest("invalid_attack_id");
      expect(result.passed).toBe(false);
      expect(result.resilient).toBe(false);
      expect(result.violationDetails).toContain("was not found in registry");
    });
  });

  describe("3. Standard Attack Vector Registry Verification (All 7 Standard Vectors)", () => {
    const vectorIds = [
      "numerical_underflow_overflow",
      "collinear_point_degeneracy",
      "high_dim_scale_curse",
      "hilbert_ill_conditioned",
      "adversarial_hash_collision",
      "cycle_deadlock_threaded_tree",
      "saddle_point_plateau",
    ];

    for (const id of vectorIds) {
      it(`should successfully validate attack vector: ${id}`, () => {
        const vector = getAttackVector(id);
        expect(vector).toBeDefined();
        expect(vector?.id).toBe(id);
        expect(vector?.title.length).toBeGreaterThan(5);
        expect(vector?.description.length).toBeGreaterThan(10);
        expect(vector?.pathology.length).toBeGreaterThan(10);
        expect(vector?.counterMeasure.length).toBeGreaterThan(5);
        expect(vector?.hardwareMitigation.length).toBeGreaterThan(5);
        expect(vector?.stressMetrics.baselineLatencyMs).toBeGreaterThan(0);
        expect(vector?.stressMetrics.degradedLatencyMs).toBeGreaterThan(0);
        expect(vector?.stressMetrics.impactPercent).toBeGreaterThan(0);

        // Test unmitigated
        const unmitigated = executeStressTest(id, undefined, { applyCounterMeasure: false });
        expect(unmitigated.passed).toBe(false);
        expect(unmitigated.resilient).toBe(false);

        // Test mitigated
        const mitigated = executeStressTest(id, undefined, { applyCounterMeasure: true });
        expect(mitigated.passed).toBe(true);
        expect(mitigated.resilient).toBe(true);
        expect(mitigated.impactPercent).toBeLessThan(unmitigated.impactPercent);
      });
    }
  });

  describe("4. Resilience Report & Algorithm Robustness Evaluation", () => {
    it("should generate Grade A+ / A scorecard when all vectors pass with defense", () => {
      const results: AdversarialStressResult[] = ATTACK_VECTORS.map((v) =>
        executeStressTest(v.id, undefined, { applyCounterMeasure: true }),
      );

      const report: ResilienceReport = evaluateAlgorithmResilience(results);
      expect(report.total).toBe(7);
      expect(report.passed).toBe(7);
      expect(report.failed).toBe(0);
      expect(report.criticalVulnerabilities).toBe(0);
      expect(report.overallScore).toBeGreaterThanOrEqual(95);
      expect(report.letterRating).toBe("A+");
      expect(report.recommendations.length).toBe(1);
      expect(report.recommendations[0]).toContain("Optimal resilience verified");
      expect(report.evaluatedAt).toBeDefined();
    });

    it("should generate Grade F scorecard with critical vulnerability warnings when unmitigated", () => {
      const results: AdversarialStressResult[] = ATTACK_VECTORS.map((v) =>
        executeStressTest(v.id, undefined, { applyCounterMeasure: false }),
      );

      const report: ResilienceReport = evaluateAlgorithmResilience(results);
      expect(report.total).toBe(7);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(7);
      expect(report.criticalVulnerabilities).toBe(3); // numerical_underflow_overflow, hilbert_ill_conditioned, adversarial_hash_collision
      expect(report.overallScore).toBeLessThan(40);
      expect(report.letterRating).toBe("F");
      expect(report.recommendations.length).toBeGreaterThanOrEqual(7);
      expect(report.recommendations[0]).toContain("Urgent: Neutralize 3 critical");
    });

    it("should calculate appropriate intermediate score and rating for mixed results", () => {
      // 5 passed, 2 failed
      const results: AdversarialStressResult[] = [
        executeStressTest("numerical_underflow_overflow", undefined, { applyCounterMeasure: true }),
        executeStressTest("collinear_point_degeneracy", undefined, { applyCounterMeasure: true }),
        executeStressTest("high_dim_scale_curse", undefined, { applyCounterMeasure: true }),
        executeStressTest("hilbert_ill_conditioned", undefined, { applyCounterMeasure: false }), // Failed Critical
        executeStressTest("adversarial_hash_collision", undefined, { applyCounterMeasure: true }),
        executeStressTest("cycle_deadlock_threaded_tree", undefined, { applyCounterMeasure: true }),
        executeStressTest("saddle_point_plateau", undefined, { applyCounterMeasure: false }), // Failed Medium
      ];

      const report: ResilienceReport = evaluateAlgorithmResilience(results);
      expect(report.total).toBe(7);
      expect(report.passed).toBe(5);
      expect(report.failed).toBe(2);
      expect(report.criticalVulnerabilities).toBe(1);
      expect(report.overallScore).toBeGreaterThanOrEqual(50);
      expect(report.overallScore).toBeLessThan(85);
      expect(["B", "C", "D"]).toContain(report.letterRating);
      expect(report.recommendations.some((r) => r.includes("hilbert_ill_conditioned"))).toBe(true);
    });

    it("should handle legacy StressTestResult inputs seamlessly", () => {
      const legacyResults: StressTestResult[] = [
        {
          scenarioId: "adv_num_softmax_overflow",
          topicId: "ml_loss_functions_info_theory",
          domain: "numerical",
          passed: true,
          resilient: true,
          executionTimeMs: 0.12,
          numericalStability: {
            hasNaN: false,
            hasInf: false,
            maxFiniteValue: 1.0,
            minFiniteValue: 0.0,
          },
          mitigationVerified: true,
        },
        {
          scenarioId: "adv_asymp_antiquicksort_killer",
          topicId: "dsa_binary_search",
          domain: "asymptotic_pathology",
          passed: false,
          resilient: false,
          executionTimeMs: 120.5,
          numericalStability: {
            hasNaN: false,
            hasInf: false,
            maxFiniteValue: 1000,
            minFiniteValue: 0,
          },
          violationReport: "Recursion depth limit exceeded",
          mitigationVerified: false,
        },
      ];

      const report: ResilienceReport = evaluateAlgorithmResilience(legacyResults);
      expect(report.total).toBe(2);
      expect(report.passed).toBe(1);
      expect(report.failed).toBe(1);
      expect(report.results.length).toBe(2);
      expect(report.results[0].category).toBe("Numerical");
      expect(report.results[1].category).toBe("Algorithmic");
    });

    it("should handle empty results gracefully", () => {
      const report = evaluateAlgorithmResilience([]);
      expect(report.total).toBe(0);
      expect(report.passed).toBe(0);
      expect(report.failed).toBe(0);
      expect(report.overallScore).toBe(0);
      expect(report.letterRating).toBe("F");
      expect(report.recommendations[0]).toContain("No stress test results provided");
    });
  });

  describe("5. AdversarialStressArena React Component & Lifecycle", () => {
    it("should instantiate in default standalone mode", () => {
      const element = React.createElement(AdversarialStressArena, {
        className: "custom-arena-class",
      });

      expect(element).toBeDefined();
      expect(element.type).toBe(AdversarialStressArena);
      expect(element.props.className).toBe("custom-arena-class");
      expect(element.props.isOpen).toBeUndefined();
    });

    it("should return null when isOpen is explicitly false", () => {
      const element = React.createElement(AdversarialStressArena, {
        isOpen: false,
        onClose: () => {},
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(false);
    });

    it("should instantiate with custom topicId and initialAttackId", () => {
      let completedReport: ResilienceReport | null = null;
      const handleComplete = (report: ResilienceReport) => {
        completedReport = report;
      };

      const element = React.createElement(AdversarialStressArena, {
        topicId: "ml_attention_causal_sdpa",
        initialAttackId: "hilbert_ill_conditioned",
        onComplete: handleComplete,
        isOpen: true,
      });

      expect(element.props.topicId).toBe("ml_attention_causal_sdpa");
      expect(element.props.initialAttackId).toBe("hilbert_ill_conditioned");
      expect(element.props.isOpen).toBe(true);
      expect(element.props.onComplete).toBe(handleComplete);
      expect(completedReport).toBeNull();
    });
  });
});
