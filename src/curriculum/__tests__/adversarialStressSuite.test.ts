import { describe, expect, it } from "bun:test";
import { generateAdversarialHarnesses, runStressHarness } from "../adversarialStressSuite";

describe("Adversarial Edge-Case Stress Testing Suite Tests", () => {
  describe("1. Stress Scenario Catalog & Domain Filtering", () => {
    it("should retrieve adversarial scenarios across all 4 core domains", () => {
      const allScenarios = generateAdversarialHarnesses();
      expect(allScenarios.length).toBeGreaterThanOrEqual(8);

      const domains = new Set(allScenarios.map((s) => s.domain));
      expect(domains.has("numerical")).toBe(true);
      expect(domains.has("geometry")).toBe(true);
      expect(domains.has("asymptotic_pathology")).toBe(true);
      expect(domains.has("distributed_systems")).toBe(true);
    });

    it("should filter scenarios accurately by domain", () => {
      const numScenarios = generateAdversarialHarnesses(undefined, "numerical");
      expect(numScenarios.length).toBeGreaterThanOrEqual(3);
      for (const s of numScenarios) {
        expect(s.domain).toBe("numerical");
      }

      const distScenarios = generateAdversarialHarnesses(undefined, "distributed_systems");
      expect(distScenarios.length).toBeGreaterThanOrEqual(2);
      for (const s of distScenarios) {
        expect(s.domain).toBe("distributed_systems");
      }
    });

    it("should filter scenarios accurately by topicId", () => {
      const softmaxScenarios = generateAdversarialHarnesses("ml_loss_functions_info_theory");
      expect(softmaxScenarios.length).toBe(1);
      expect(softmaxScenarios[0].id).toBe("adv_num_softmax_overflow");
    });
  });

  describe("2. Numerical Instability & Precision Stress Evaluation", () => {
    it("should flag un-mitigated naive softmax as failed due to NaN/Inf overflow", () => {
      const scenario = generateAdversarialHarnesses("ml_loss_functions_info_theory")[0];
      expect(scenario).toBeDefined();

      // Flawed naive implementation without max subtraction
      const naiveSoftmax = (input: Record<string, unknown>) => {
        const logits = (input.logits as number[][])[0];
        const exps = logits.map((z) => Math.exp(z));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map((e) => e / sum);
      };

      const report = runStressHarness(scenario, naiveSoftmax);
      expect(report.passed).toBe(false);
      expect(report.resilient).toBe(false);
      expect(report.numericalStability.hasNaN || report.numericalStability.hasInf).toBe(true);
      expect(report.violationReport).toContain("Numerical Instability");
    });

    it("should verify resilient stabilized Log-Sum-Exp softmax as passed", () => {
      const scenario = generateAdversarialHarnesses("ml_loss_functions_info_theory")[0];
      expect(scenario).toBeDefined();

      // Numerically stable softmax with max subtraction
      const stableSoftmax = (input: Record<string, unknown>) => {
        const batch = input.logits as number[][];
        return batch.map((row) => {
          const maxVal = Math.max(...row);
          const exps = row.map((z) => Math.exp(z - maxVal));
          const sum = exps.reduce((a, b) => a + b, 0);
          return exps.map((e) => e / sum);
        });
      };

      const report = runStressHarness(scenario, stableSoftmax);
      expect(report.passed).toBe(true);
      expect(report.resilient).toBe(true);
      expect(report.numericalStability.hasNaN).toBe(false);
      expect(report.numericalStability.hasInf).toBe(false);
    });

    it("should verify AdamW resilience under zero-gradients", () => {
      const scenario = generateAdversarialHarnesses("ml_gradient_descent_adamw")[0];
      expect(scenario).toBeDefined();

      const adamwStep = (input: Record<string, unknown>) => {
        const param = input.param as number[];
        const m = input.m as number[];
        const v = input.v as number[];
        const lr = input.lr as number;
        const eps = input.eps as number;
        const wd = input.weight_decay as number;

        const updatedParam = param.map((p, i) => {
          const decayed = p * (1 - lr * wd);
          const update = lr * (m[i] / (Math.sqrt(v[i]) + eps));
          return decayed - update;
        });

        return { updatedParam };
      };

      const report = runStressHarness(scenario, adamwStep);
      expect(report.passed).toBe(true);
      expect(report.resilient).toBe(true);
      expect(report.numericalStability.hasNaN).toBe(false);
    });
  });

  describe("3. Distributed & Asymptotic Pathology Stress Evaluation", () => {
    it("should evaluate Ring-AllReduce boundary conditions (P = 1 and P = 1024)", () => {
      const scenario = generateAdversarialHarnesses("ml_distributed_data_parallel_ddp")[0];
      expect(scenario).toBeDefined();

      const ringAllreduce = (input: Record<string, unknown>) => {
        const ranks = input.ranks as number[];
        const size = input.tensorSizeMB as number;
        const bw = input.bandwidthMBs as number;

        return ranks.map((P) => {
          if (P <= 1) return 0.0;
          return (2 * ((P - 1) / P) * size) / bw;
        });
      };

      const report = runStressHarness(scenario, ringAllreduce);
      expect(report.passed).toBe(true);
      expect(report.resilient).toBe(true);
      expect(report.numericalStability.hasNaN).toBe(false);
    });

    it("should evaluate MoE expert capacity capping on 100% token skew", () => {
      const scenario = generateAdversarialHarnesses("ml_mixture_of_experts_moe")[0];
      expect(scenario).toBeDefined();

      const moeRouter = (input: Record<string, unknown>) => {
        const numExperts = input.numExperts as number;
        const tokensPerBatch = input.tokensPerBatch as number;
        const capFactor = input.expertCapFactor as number;

        const maxTokensPerExpert = Math.floor((tokensPerBatch / numExperts) * capFactor);
        const expertCounts = new Array(numExperts).fill(0);
        let droppedTokens = 0;

        for (let t = 0; t < tokensPerBatch; t++) {
          const expertId = 0; // All route to 0
          if (expertCounts[expertId] < maxTokensPerExpert) {
            expertCounts[expertId]++;
          } else {
            droppedTokens++;
          }
        }

        return { expertCounts, droppedTokens, maxCapacity: maxTokensPerExpert };
      };

      const report = runStressHarness(scenario, moeRouter);
      expect(report.passed).toBe(true);
      expect(report.resilient).toBe(true);
    });
  });
});
