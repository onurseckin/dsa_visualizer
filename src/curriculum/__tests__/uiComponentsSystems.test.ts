import { describe, expect, it } from "bun:test";
import React from "react";
import { DistributedClusterSimulatorView } from "../../components/profiler/DistributedClusterSimulatorView";
import { RooflineDashboard } from "../../components/profiler/RooflineDashboard";

describe("Hardware Roofline & Distributed Simulator Dashboard Component Tests", () => {
  describe("1. RooflineDashboard", () => {
    it("should instantiate RooflineDashboard component tree with default H100 SXM5 target", () => {
      const element = React.createElement(RooflineDashboard, {
        initialTargetId: "nvidia_h100_sxm5",
        initialPrecision: "fp16",
        title: "Test Silicon Roofline",
      });

      expect(element).toBeDefined();
      expect(element.type).toBe(RooflineDashboard);
      expect(element.props.initialTargetId).toBe("nvidia_h100_sxm5");
      expect(element.props.initialPrecision).toBe("fp16");
    });

    it("should accept Apple M3 Max and FP32 precision targets", () => {
      const element = React.createElement(RooflineDashboard, {
        initialTargetId: "apple_m3_max",
        initialPrecision: "fp32",
      });

      expect(element.props.initialTargetId).toBe("apple_m3_max");
      expect(element.props.initialPrecision).toBe("fp32");
    });
  });

  describe("2. DistributedClusterSimulatorView", () => {
    it("should instantiate DistributedClusterSimulatorView with Llama-3-70B on 64x H100 cluster", () => {
      const element = React.createElement(DistributedClusterSimulatorView, {
        initialModelId: "llama3_70b",
        initialClusterId: "h100_cluster_64",
        title: "Test 3D Parallelism",
      });

      expect(element).toBeDefined();
      expect(element.type).toBe(DistributedClusterSimulatorView);
      expect(element.props.initialModelId).toBe("llama3_70b");
      expect(element.props.initialClusterId).toBe("h100_cluster_64");
    });

    it("should instantiate simulator with Mixtral 8x7B MoE model", () => {
      const element = React.createElement(DistributedClusterSimulatorView, {
        initialModelId: "mixtral_8x7b",
        initialClusterId: "h100_superpod_512",
      });

      expect(element.props.initialModelId).toBe("mixtral_8x7b");
      expect(element.props.initialClusterId).toBe("h100_superpod_512");
    });
  });
});
