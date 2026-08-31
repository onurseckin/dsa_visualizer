import { describe, expect, it } from "bun:test";
import React from "react";
import {
  COLLECTIVE_ALGORITHMS,
  InterconnectTopologyStudio,
  type InterconnectTopologyStudioProps,
  LINK_TECHNOLOGIES,
  type LinkTechId,
  TOPOLOGY_PRESETS,
  type TopologyType,
  calculateAlgorithmComparison,
  computeBisectionBandwidth,
  computeHockneyLatency,
  computeTopologyHopCount,
  formatBandwidth,
  formatBytes,
  formatTime,
  generateCollectiveSteps,
} from "../../components/primitives/InterconnectTopologyStudio";
import {
  InterconnectTopologyStudio as ProfilerInterconnectTopologyStudio,
  computeBisectionBandwidth as profilerComputeBisectionBandwidth,
} from "../../components/profiler/InterconnectTopologyStudio";

describe("Interconnect Topology & Collective Communication Studio Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS HANDLING
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate InterconnectTopologyStudio with default props", () => {
      const element = React.createElement(InterconnectTopologyStudio, {});

      expect(element).toBeDefined();
      expect(element.type).toBe(InterconnectTopologyStudio);
      expect(element.props.initialPreset).toBeUndefined();
      expect(element.props.initialTopology).toBeUndefined();
    });

    it("should support all 5 topologies via initialTopology prop", () => {
      const topologies: TopologyType[] = [
        "fat_tree",
        "nvlink_mesh",
        "nvswitch",
        "torus_3d",
        "dragonfly_plus",
      ];

      for (const topo of topologies) {
        const element = React.createElement(InterconnectTopologyStudio, {
          initialTopology: topo,
        });
        expect(element.props.initialTopology).toBe(topo);
      }
    });

    it("should accept custom props for preset, topology, link technology, and collective", () => {
      const props: InterconnectTopologyStudioProps = {
        initialPreset: "dgx_cluster_64",
        initialTopology: "torus_3d",
        initialLinkTech: "rocev2_400",
        initialCollective: "tree_allreduce",
        initialGpus: 128,
        initialPayloadMB: 2048,
        title: "Custom Torus HPC Benchmark Studio",
        className: "custom-topology-class",
      };

      const element = React.createElement(InterconnectTopologyStudio, props);

      expect(element.props.initialPreset).toBe("dgx_cluster_64");
      expect(element.props.initialTopology).toBe("torus_3d");
      expect(element.props.initialLinkTech).toBe("rocev2_400");
      expect(element.props.initialCollective).toBe("tree_allreduce");
      expect(element.props.initialGpus).toBe(128);
      expect(element.props.initialPayloadMB).toBe(2048);
      expect(element.props.title).toBe("Custom Torus HPC Benchmark Studio");
      expect(element.props.className).toBe("custom-topology-class");
    });

    it("should maintain backward compatibility when imported from profiler directory", () => {
      const profilerElement = React.createElement(ProfilerInterconnectTopologyStudio, {});
      expect(profilerElement).toBeDefined();
      expect(profilerElement.type).toBe(InterconnectTopologyStudio);
      expect(profilerComputeBisectionBandwidth).toBe(computeBisectionBandwidth);
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & TOPOLOGY SPECIFICATIONS
  // ==========================================================================
  describe("2. Preset Configurations & Specification Integrity", () => {
    it("should provide valid configurations for all canonical presets", () => {
      const presetKeys = [
        "h100_superpod_512",
        "dgx_cluster_64",
        "nvlink_mesh_hgx_8",
        "nvswitch_fabric_64",
        "torus_3d_256",
        "dragonfly_hyperscale_512",
        "moe_ep_64",
      ];

      for (const key of presetKeys) {
        const preset = TOPOLOGY_PRESETS[key];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(key);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.numGpus).toBeGreaterThanOrEqual(8);
        expect(preset.gpusPerNode).toBeGreaterThanOrEqual(4);
        expect(preset.payloadBytes).toBeGreaterThanOrEqual(512 * 1024 * 1024);
        expect(preset.oversubscriptionRatio).toBeGreaterThanOrEqual(1.0);
        expect(LINK_TECHNOLOGIES[preset.linkTechId]).toBeDefined();
        expect(COLLECTIVE_ALGORITHMS[preset.collectiveId]).toBeDefined();
      }
    });

    it("should verify H100 SuperPOD 512 preset specs", () => {
      const p = TOPOLOGY_PRESETS.h100_superpod_512;
      expect(p.numGpus).toBe(512);
      expect(p.topologyType).toBe("fat_tree");
      expect(p.linkTechId).toBe("infiniband_ndr_400");
      expect(p.collectiveId).toBe("ring_allreduce");
      expect(p.payloadBytes).toBe(4 * 1024 * 1024 * 1024); // 4 GB
    });

    it("should verify NVLink Mesh HGX 8 preset specs", () => {
      const p = TOPOLOGY_PRESETS.nvlink_mesh_hgx_8;
      expect(p.numGpus).toBe(8);
      expect(p.topologyType).toBe("nvlink_mesh");
      expect(p.linkTechId).toBe("nvlink_4");
      expect(p.gpusPerNode).toBe(8);
      expect(p.payloadBytes).toBe(2 * 1024 * 1024 * 1024);
    });

    it("should verify NVSwitch Fabric 64 preset specs", () => {
      const p = TOPOLOGY_PRESETS.nvswitch_fabric_64;
      expect(p.numGpus).toBe(64);
      expect(p.topologyType).toBe("nvswitch");
      expect(p.linkTechId).toBe("nvswitch_3");
      expect(p.collectiveId).toBe("recursive_halving_allreduce");
    });

    it("should verify 3D Torus 256 preset specs", () => {
      const p = TOPOLOGY_PRESETS.torus_3d_256;
      expect(p.numGpus).toBe(256);
      expect(p.topologyType).toBe("torus_3d");
      expect(p.dimensions).toEqual([8, 8, 4]);
      expect(p.dimensions![0] * p.dimensions![1] * p.dimensions![2]).toBe(256);
    });

    it("should verify Dragonfly+ Hyperscale 512 preset specs", () => {
      const p = TOPOLOGY_PRESETS.dragonfly_hyperscale_512;
      expect(p.numGpus).toBe(512);
      expect(p.topologyType).toBe("dragonfly_plus");
      expect(p.linkTechId).toBe("infiniband_ndr_400");
      expect(p.collectiveId).toBe("allgather");
    });
  });

  // ==========================================================================
  // 3. LINK TECHNOLOGY CHARACTERISTICS
  // ==========================================================================
  describe("3. Link Technologies & Hardware Parameters", () => {
    it("should configure all 5 link technologies with accurate bandwidth & latency", () => {
      const techKeys: LinkTechId[] = [
        "nvlink_4",
        "nvswitch_3",
        "infiniband_ndr_400",
        "rocev2_400",
        "pcie_gen5",
      ];

      for (const id of techKeys) {
        const link = LINK_TECHNOLOGIES[id];
        expect(link).toBeDefined();
        expect(link.id).toBe(id);
        expect(link.bandwidthGBs).toBeGreaterThan(0);
        expect(link.bandwidthGbps).toBeGreaterThan(0);
        expect(link.latencyMicroseconds).toBeGreaterThan(0);
        expect(link.bidirectional).toBe(true);
      }

      // NVLink 4: 900 GB/s, 0.8 µs
      expect(LINK_TECHNOLOGIES.nvlink_4.bandwidthGBs).toBe(900.0);
      expect(LINK_TECHNOLOGIES.nvlink_4.latencyMicroseconds).toBe(0.8);

      // NVSwitch 3: 900 GB/s, 0.5 µs
      expect(LINK_TECHNOLOGIES.nvswitch_3.bandwidthGBs).toBe(900.0);
      expect(LINK_TECHNOLOGIES.nvswitch_3.latencyMicroseconds).toBe(0.5);

      // InfiniBand NDR 400G: 50 GB/s (400 Gbps), 1.5 µs
      expect(LINK_TECHNOLOGIES.infiniband_ndr_400.bandwidthGBs).toBe(50.0);
      expect(LINK_TECHNOLOGIES.infiniband_ndr_400.bandwidthGbps).toBe(400.0);
      expect(LINK_TECHNOLOGIES.infiniband_ndr_400.latencyMicroseconds).toBe(1.5);

      // PCIe Gen5: 64 GB/s, 2.5 µs
      expect(LINK_TECHNOLOGIES.pcie_gen5.bandwidthGBs).toBe(64.0);
      expect(LINK_TECHNOLOGIES.pcie_gen5.latencyMicroseconds).toBe(2.5);
    });
  });

  // ==========================================================================
  // 4. TOPOLOGICAL ROUTING & BISECTION BANDWIDTH
  // ==========================================================================
  describe("4. Topology Routing & Bisection Bandwidth Calculations", () => {
    it("should compute non-blocking and oversubscribed Fat-Tree bisection bandwidth", () => {
      const numGpus = 512;
      const linkBW = 50.0; // 50 GB/s NDR

      // Non-blocking 1:1 -> (512 / 2) * 50 = 12,800 GB/s = 12.8 TB/s
      const bisection1to1 = computeBisectionBandwidth("fat_tree", numGpus, linkBW, {
        oversubscription: 1.0,
      });
      expect(bisection1to1).toBe(12800);

      // 2:1 Oversubscribed -> 12,800 / 2 = 6,400 GB/s = 6.4 TB/s
      const bisection2to1 = computeBisectionBandwidth("fat_tree", numGpus, linkBW, {
        oversubscription: 2.0,
      });
      expect(bisection2to1).toBe(6400);

      // 3:1 Oversubscribed
      const bisection3to1 = computeBisectionBandwidth("fat_tree", numGpus, linkBW, {
        oversubscription: 3.0,
      });
      expect(bisection3to1).toBeCloseTo(12800 / 3.0, 2);
    });

    it("should compute NVLink Mesh bisection bandwidth correctly", () => {
      const numGpus = 8;
      const linkBW = 900.0; // NVLink 4

      // (8 / 2) * 900 * 0.75 = 2700 GB/s = 2.7 TB/s
      const bisection = computeBisectionBandwidth("nvlink_mesh", numGpus, linkBW, {
        oversubscription: 1.0,
      });
      expect(bisection).toBe(2700);

      const bisectionOversub = computeBisectionBandwidth("nvlink_mesh", numGpus, linkBW, {
        oversubscription: 2.0,
      });
      expect(bisectionOversub).toBe(1350);
    });

    it("should compute NVSwitch full crossbar bisection bandwidth correctly", () => {
      const numGpus = 64;
      const linkBW = 900.0;

      // (64 / 2) * 900 = 28,800 GB/s = 28.8 TB/s
      const bisection = computeBisectionBandwidth("nvswitch", numGpus, linkBW, {
        oversubscription: 1.0,
      });
      expect(bisection).toBe(28800);
    });

    it("should compute 3D Torus bisection bandwidth correctly", () => {
      // 8x8x4 Torus = 256 GPUs
      // minCrossSection = min(64, 32, 32) = 32
      // Bisection = 2 * 32 * 2 * 50 = 6,400 GB/s
      const bisectionTorus = computeBisectionBandwidth("torus_3d", 256, 50.0, {
        dimensions: [8, 8, 4],
      });
      expect(bisectionTorus).toBe(6400);
    });

    it("should compute Dragonfly+ bisection bandwidth correctly", () => {
      const bisectionDf = computeBisectionBandwidth("dragonfly_plus", 512, 50.0, {
        oversubscription: 1.0,
      });
      // (512 / 4) * 50 = 6,400 GB/s
      expect(bisectionDf).toBe(6400);
    });

    it("should compute average hop counts and diameter across all 5 topologies", () => {
      // Fat-Tree 64 GPUs (2-tier)
      const ft64 = computeTopologyHopCount("fat_tree", 64, { gpusPerNode: 8 });
      expect(ft64.diameter).toBe(4);
      expect(ft64.averageHopCount).toBeGreaterThan(2.0);
      expect(ft64.averageHopCount).toBeLessThanOrEqual(4.0);

      // Fat-Tree 512 GPUs (3-tier)
      const ft512 = computeTopologyHopCount("fat_tree", 512, { gpusPerNode: 8 });
      expect(ft512.diameter).toBe(6);
      expect(ft512.averageHopCount).toBeGreaterThan(3.5);
      expect(ft512.averageHopCount).toBeLessThanOrEqual(6.0);

      // NVLink Mesh (8 GPUs)
      const nvMesh = computeTopologyHopCount("nvlink_mesh", 8);
      expect(nvMesh.diameter).toBe(2);
      expect(nvMesh.averageHopCount).toBe(1.35);

      // NVSwitch (uniform crossbar)
      const nvSwitch = computeTopologyHopCount("nvswitch", 64);
      expect(nvSwitch.diameter).toBe(2);
      expect(nvSwitch.averageHopCount).toBe(2.0);

      // 3D Torus 8x8x4: avgHops = 8/4 + 8/4 + 4/4 = 2 + 2 + 1 = 5
      // diameter = 4 + 4 + 2 = 10
      const torusHop = computeTopologyHopCount("torus_3d", 256, { dimensions: [8, 8, 4] });
      expect(torusHop.averageHopCount).toBe(5.0);
      expect(torusHop.diameter).toBe(10);

      // Dragonfly+
      const dfHop = computeTopologyHopCount("dragonfly_plus", 512);
      expect(dfHop.averageHopCount).toBeCloseTo(3.85, 2);
      expect(dfHop.diameter).toBe(5);
    });

    it("should handle edge case with single GPU or zero GPUs", () => {
      const singleBisection = computeBisectionBandwidth("fat_tree", 1, 50.0);
      expect(singleBisection).toBe(0);

      const singleHops = computeTopologyHopCount("fat_tree", 1);
      expect(singleHops.averageHopCount).toBe(0);
      expect(singleHops.diameter).toBe(0);

      const nvMeshSingle = computeBisectionBandwidth("nvlink_mesh", 0, 900.0);
      expect(nvMeshSingle).toBe(0);
    });
  });

  // ==========================================================================
  // 5. HOCKNEY ALPHA-BETA LATENCY MODEL CALCULATIONS
  // ==========================================================================
  describe("5. Hockney Alpha-Beta Latency Model Calculations", () => {
    it("should compute Ring AllReduce latency with exact Hockney formula", () => {
      const numRanks = 8;
      const payloadBytes = 1024 * 1024 * 1024; // 1 GB
      const linkBW = 50.0; // 50 GB/s -> B = 5e10 bytes/sec
      const alphaUs = 1.5; // 1.5 µs
      const hopCount = 3.0;

      const res = computeHockneyLatency({
        algorithm: "ring_allreduce",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
        hopCount,
      });

      // Steps: 2 * (8 - 1) = 14 steps
      expect(res.numSteps).toBe(14);

      // Data volume per rank: 2 * (7/8) * 1024^3 bytes = 1,879,048,192 bytes
      expect(res.transferredPerRankBytes).toBe(((2 * 7) / 8) * payloadBytes);

      // Transfer time: 1.879e9 / 5e10 = 0.03758 s = 37.581 ms
      expect(res.transferLatencyMs).toBeCloseTo(37.581, 1);

      // Alpha time: 14 * (1.5µs * 1.5 hops) = 14 * 2.25µs = 31.5 µs = 0.0315 ms
      expect(res.startupLatencyMicroseconds).toBeCloseTo(31.5, 1);

      // Total latency: ~37.6125 ms
      expect(res.totalLatencyMs).toBeCloseTo(37.6125, 1);

      // High scaling efficiency for large 1GB payload (>98%)
      expect(res.scalingEfficiency).toBeGreaterThan(98);
      expect(res.betaFraction).toBeGreaterThan(0.98);
    });

    it("should compute Tree AllReduce latency with logarithmic steps", () => {
      const numRanks = 64;
      const payloadBytes = 100 * 1024 * 1024; // 100 MB
      const linkBW = 50.0;
      const alphaUs = 1.5;

      const res = computeHockneyLatency({
        algorithm: "tree_allreduce",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
        hopCount: 4.0,
      });

      // Steps: 2 * ceil(log2(64)) = 2 * 6 = 12 steps
      expect(res.numSteps).toBe(12);
      expect(res.totalLatencyMs).toBeGreaterThan(0);
    });

    it("should compute Recursive Halving & Doubling (Rabenseifner) AllReduce", () => {
      const numRanks = 64;
      const payloadBytes = 1024 * 1024 * 1024; // 1 GB
      const linkBW = 50.0;
      const alphaUs = 1.5;

      const rabenseifner = computeHockneyLatency({
        algorithm: "recursive_halving_allreduce",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
      });

      // Steps: 2 * 6 = 12 steps (vs 126 steps for ring)
      expect(rabenseifner.numSteps).toBe(12);
      // Minimal data volume: 2 * (63/64) * S
      expect(rabenseifner.transferredPerRankBytes).toBeCloseTo(((2 * 63) / 64) * payloadBytes, 0);
    });

    it("should compute All-to-All personalized routing with congestion sensitivity", () => {
      const numRanks = 64;
      const payloadBytes = 512 * 1024 * 1024; // 512 MB
      const linkBW = 900.0; // NVLink 4
      const alphaUs = 0.8;

      const res1to1 = computeHockneyLatency({
        algorithm: "all_to_all",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
        oversubscriptionRatio: 1.0,
      });

      const res2to1 = computeHockneyLatency({
        algorithm: "all_to_all",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
        oversubscriptionRatio: 2.0,
      });

      // Steps: P - 1 = 63 steps
      expect(res1to1.numSteps).toBe(63);
      // 2:1 oversubscription doubles transfer latency
      expect(res2to1.transferLatencyMs).toBeCloseTo(res1to1.transferLatencyMs * 2.0, 1);
      expect(res2to1.isBisectionBottlenecked).toBe(true);
    });

    it("should compute AllGather and ReduceScatter primitives", () => {
      const numRanks = 8;
      const payloadBytes = 1024 * 1024 * 1024;
      const linkBW = 50.0;
      const alphaUs = 1.5;

      const ag = computeHockneyLatency({
        algorithm: "allgather",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
      });

      const rs = computeHockneyLatency({
        algorithm: "reduce_scatter",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
      });

      expect(ag.numSteps).toBe(7);
      expect(rs.numSteps).toBe(7);
      expect(ag.totalLatencyMs).toBeCloseTo(rs.totalLatencyMs, 2);
    });

    it("should compute Broadcast latency", () => {
      const numRanks = 16;
      const payloadBytes = 500 * 1024 * 1024;
      const linkBW = 50.0;
      const alphaUs = 1.5;

      const bcast = computeHockneyLatency({
        algorithm: "broadcast",
        numRanks,
        payloadBytes,
        linkBandwidthGBs: linkBW,
        alphaLatencyMicroseconds: alphaUs,
      });

      // Steps: log2(16) = 4
      expect(bcast.numSteps).toBe(4);
      expect(bcast.transferredPerRankBytes).toBe(payloadBytes);
    });

    it("should return zero latency and 100% efficiency for single GPU (P=1)", () => {
      const res = computeHockneyLatency({
        algorithm: "ring_allreduce",
        numRanks: 1,
        payloadBytes: 1024 * 1024 * 1024,
        linkBandwidthGBs: 50.0,
        alphaLatencyMicroseconds: 1.5,
      });

      expect(res.totalLatencyMs).toBe(0);
      expect(res.startupLatencyMs).toBe(0);
      expect(res.transferLatencyMs).toBe(0);
      expect(res.numSteps).toBe(0);
      expect(res.scalingEfficiency).toBe(100);
    });
  });

  // ==========================================================================
  // 6. COLLECTIVE STEP GENERATOR & ANIMATION STATE MACHINE
  // ==========================================================================
  describe("6. Collective Step State Machine & Packet Generator", () => {
    it("should generate exact Ring AllReduce steps for 8 visual ranks", () => {
      const P = 8;
      const payload = 1024 * 1024 * 1024;
      const steps = generateCollectiveSteps("ring_allreduce", P, payload);

      // Step 0: Initial
      // Steps 1..7: Scatter-Reduce (7 steps)
      // Steps 8..14: AllGather (7 steps)
      // Step 15: Completed
      // Total steps = 1 + 7 + 7 + 1 = 16 steps
      expect(steps.length).toBe(16);

      // Step 0: Initial
      expect(steps[0].phaseType).toBe("initial");
      expect(steps[0].stepIndex).toBe(0);
      expect(steps[0].transfers.length).toBe(0);
      expect(steps[0].rankStates.length).toBe(P);

      // Steps 1..7: Scatter-Reduce
      for (let s = 1; s <= 7; s++) {
        expect(steps[s].phaseType).toBe("scatter_reduce");
        expect(steps[s].transfers.length).toBe(P); // Each of the 8 ranks sends a packet
        expect(steps[s].rankStates.length).toBe(P);
      }

      // Steps 8..14: AllGather
      for (let s = 8; s <= 14; s++) {
        expect(steps[s].phaseType).toBe("allgather");
        expect(steps[s].transfers.length).toBe(P);
      }

      // Step 15: Completed
      expect(steps[15].phaseType).toBe("completed");
      expect(steps[15].transfers.length).toBe(0);
      // All chunks on all ranks must be complete
      for (const r of steps[15].rankStates) {
        for (const chunk of r.chunks) {
          expect(chunk.status).toBe("complete");
        }
      }
    });

    it("should generate Tree AllReduce steps with halving and doubling phases", () => {
      const P = 8;
      const steps = generateCollectiveSteps("tree_allreduce", P, 1024 * 1024);

      // Step 0 (initial), 3 halving steps, 3 doubling steps, 1 completion = 8 steps
      expect(steps.length).toBe(8);
      expect(steps[1].phaseType).toBe("halving");
      expect(steps[2].phaseType).toBe("halving");
      expect(steps[3].phaseType).toBe("halving");
      expect(steps[4].phaseType).toBe("doubling");
      expect(steps[5].phaseType).toBe("doubling");
      expect(steps[6].phaseType).toBe("doubling");
      expect(steps[7].phaseType).toBe("completed");
    });

    it("should generate All-to-All personalized steps", () => {
      const P = 4;
      const steps = generateCollectiveSteps("all_to_all", P, 512 * 1024 * 1024);

      // Step 0 + 3 exchange steps + 1 completion = 5 steps
      expect(steps.length).toBe(5);
      expect(steps[1].phaseType).toBe("direct_exchange");
      expect(steps[2].phaseType).toBe("direct_exchange");
      expect(steps[3].phaseType).toBe("direct_exchange");
      expect(steps[4].phaseType).toBe("completed");
    });

    it("should generate AllGather and ReduceScatter steps", () => {
      const P = 4;
      const agSteps = generateCollectiveSteps("allgather", P, 1024 * 1024);
      const rsSteps = generateCollectiveSteps("reduce_scatter", P, 1024 * 1024);

      expect(agSteps.length).toBe(5);
      expect(rsSteps.length).toBe(5);
      expect(agSteps[1].phaseType).toBe("allgather");
      expect(rsSteps[1].phaseType).toBe("scatter_reduce");
    });

    it("should generate Broadcast steps", () => {
      const P = 8;
      const bcastSteps = generateCollectiveSteps("broadcast", P, 1024 * 1024);

      // Step 0 + 3 doubling broadcast steps + 1 completion = 5 steps
      expect(bcastSteps.length).toBe(5);
      expect(bcastSteps[1].phaseType).toBe("broadcast");
      expect(bcastSteps[bcastSteps.length - 1].phaseType).toBe("completed");
    });
  });

  // ==========================================================================
  // 7. COMPARATIVE ALGORITHM BENCHMARK TABLE
  // ==========================================================================
  describe("7. Collective Algorithm Scalability Comparison Matrix", () => {
    it("should generate side-by-side comparison across all 7 collective algorithms", () => {
      const numRanks = 128;
      const payloadBytes = 2 * 1024 * 1024 * 1024; // 2 GB
      const linkBW = 50.0;
      const alphaUs = 1.5;
      const hopCount = 4.0;

      const comparisons = calculateAlgorithmComparison(
        numRanks,
        payloadBytes,
        linkBW,
        alphaUs,
        hopCount,
      );

      expect(comparisons.length).toBe(7);

      const ring = comparisons.find((c) => c.algorithm.id === "ring_allreduce")!;
      const tree = comparisons.find((c) => c.algorithm.id === "tree_allreduce")!;
      const rabenseifner = comparisons.find(
        (c) => c.algorithm.id === "recursive_halving_allreduce",
      )!;

      expect(ring).toBeDefined();
      expect(tree).toBeDefined();
      expect(rabenseifner).toBeDefined();

      // Ring has 2*(128-1) = 254 steps
      expect(ring.numSteps).toBe(254);
      // Tree and Rabenseifner have 2*7 = 14 steps
      expect(tree.numSteps).toBe(14);
      expect(rabenseifner.numSteps).toBe(14);

      // Tree has much higher transfer latency for large 2GB payload than Ring / Rabenseifner
      expect(tree.transferLatencyMs).toBeGreaterThan(ring.transferLatencyMs);
      // Rabenseifner has low startup latency (14 steps) and low data volume (same as ring)
      expect(rabenseifner.latencyMs).toBeLessThan(tree.latencyMs);
    });
  });

  // ==========================================================================
  // 8. FORMATTING UTILITIES & EDGE CASES
  // ==========================================================================
  describe("8. Formatting Utilities & Extreme Edge Cases", () => {
    it("should format bytes accurately across B, KB, MB, GB", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(4096)).toBe("4.0 KB");
      expect(formatBytes(100 * 1024 * 1024)).toBe("100.0 MB");
      expect(formatBytes(4 * 1024 * 1024 * 1024)).toBe("4.00 GB");
    });

    it("should format time accurately across µs, ms, s", () => {
      expect(formatTime(0)).toBe("0.00 ms");
      expect(formatTime(0.0005)).toBe("0.50 µs");
      expect(formatTime(0.75)).toBe("0.750 ms");
      expect(formatTime(45.2)).toBe("45.20 ms");
      expect(formatTime(2500)).toBe("2.50 s");
    });

    it("should format bandwidth in GB/s and TB/s", () => {
      expect(formatBandwidth(50.0)).toBe("50.0 GB/s");
      expect(formatBandwidth(900.0)).toBe("900.0 GB/s");
      expect(formatBandwidth(12800.0)).toBe("12.80 TB/s");
    });

    it("should handle extreme payload sizes and GPU counts gracefully", () => {
      // 1024 GPUs with 16 GB payload
      const hugeCluster = computeHockneyLatency({
        algorithm: "ring_allreduce",
        numRanks: 1024,
        payloadBytes: 16 * 1024 * 1024 * 1024,
        linkBandwidthGBs: 50.0,
        alphaLatencyMicroseconds: 1.5,
        hopCount: 6.0,
      });

      expect(hugeCluster.totalLatencyMs).toBeGreaterThan(0);
      expect(hugeCluster.numSteps).toBe(2046);
      expect(hugeCluster.effectiveBandwidthGBs).toBeGreaterThan(0);
      expect(hugeCluster.scalingEfficiency).toBeGreaterThan(95);
    });
  });
});
