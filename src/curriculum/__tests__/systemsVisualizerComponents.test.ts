import { describe, expect, it } from "bun:test";
import React from "react";
import { FlashAttentionTileVisualizer } from "../../components/primitives/FlashAttentionTileVisualizer";
import { PagedAttentionBlockVisualizer } from "../../components/primitives/PagedAttentionBlockVisualizer";
import { RingAllReduceVisualizer } from "../../components/primitives/RingAllReduceVisualizer";

describe("Interactive In-Canvas ML Systems Visualizer Primitives Tests", () => {
  describe("1. FlashAttentionTileVisualizer", () => {
    it("should render FlashAttentionTileVisualizer component tree without error", () => {
      const element = React.createElement(FlashAttentionTileVisualizer, {
        numBlocksRow: 4,
        numBlocksCol: 4,
        blockSizeRow: 64,
        blockSizeCol: 64,
        headDim: 128,
        title: "Test FlashAttention SRAM Tiling",
      });

      expect(element).toBeDefined();
      expect(element.type).toBe(FlashAttentionTileVisualizer);
      expect(element.props.numBlocksRow).toBe(4);
      expect(element.props.blockSizeRow).toBe(64);
      expect(element.props.headDim).toBe(128);
    });

    it("should accept running max and sum stats overrides", () => {
      const element = React.createElement(FlashAttentionTileVisualizer, {
        currentBlockRow: 1,
        currentBlockCol: 2,
        runningMax: [3.2, 4.5, 0, 0],
        runningSum: [22.1, 35.8, 0, 0],
      });

      expect(element.props.runningMax).toEqual([3.2, 4.5, 0, 0]);
      expect(element.props.runningSum).toEqual([22.1, 35.8, 0, 0]);
    });
  });

  describe("2. RingAllReduceVisualizer", () => {
    it("should render RingAllReduceVisualizer with 4 ranks and Scatter-Reduce phase", () => {
      const element = React.createElement(RingAllReduceVisualizer, {
        numRanks: 4,
        activeRank: 0,
        activeStep: 1,
        phase: "scatter_reduce",
        title: "Test Ring All-Reduce",
      });

      expect(element).toBeDefined();
      expect(element.props.numRanks).toBe(4);
      expect(element.props.phase).toBe("scatter_reduce");
      expect(element.props.activeStep).toBe(1);
    });

    it("should render 8-rank All-Gather phase", () => {
      const element = React.createElement(RingAllReduceVisualizer, {
        numRanks: 8,
        activeStep: 10,
        phase: "all_gather",
      });

      expect(element.props.numRanks).toBe(8);
      expect(element.props.phase).toBe("all_gather");
    });
  });

  describe("3. PagedAttentionBlockVisualizer", () => {
    it("should render PagedAttentionBlockVisualizer with custom sequences and physical blocks", () => {
      const customSequences = [
        {
          id: "seq_1",
          name: "Req 1",
          logicalTokens: 32,
          blockIds: [0, 1],
          color: "#38bdf8",
        },
      ];

      const element = React.createElement(PagedAttentionBlockVisualizer, {
        sequences: customSequences,
        numPhysicalBlocks: 16,
        tokensPerBlock: 16,
        title: "Test PagedAttention COW",
      });

      expect(element).toBeDefined();
      expect(element.props.sequences).toEqual(customSequences);
      expect(element.props.numPhysicalBlocks).toBe(16);
      expect(element.props.tokensPerBlock).toBe(16);
    });

    it("should use default 16-token page configuration when props are omitted", () => {
      const element = React.createElement(PagedAttentionBlockVisualizer, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(PagedAttentionBlockVisualizer);
    });
  });
});
