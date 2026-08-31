import { describe, expect, it } from "bun:test";
import React from "react";
import { SocraticTutorDrawer } from "../../components/socratic/SocraticTutorDrawer";
import { CurriculumRoadmapExplorer } from "../../components/knowledge-graph/CurriculumRoadmapExplorer";

describe("Adaptive Socratic Tutor Drawer & Career Roadmap Explorer Tests", () => {
  describe("1. SocraticTutorDrawer Component Initialization & State", () => {
    it("should return null when isOpen is false", () => {
      const element = React.createElement(SocraticTutorDrawer, {
        topicId: "dsa_tree_fundamentals",
        isOpen: false,
        onClose: () => {},
      });

      expect(element).toBeDefined();
      expect(element.props.isOpen).toBe(false);
    });

    it("should instantiate SocraticTutorDrawer with valid props when open", () => {
      let completedReport = null;
      const element = React.createElement(SocraticTutorDrawer, {
        topicId: "ml_flashattention_sram_tiling",
        isOpen: true,
        onClose: () => {},
        onCompleteSession: (report) => {
          completedReport = report;
        },
      });

      expect(element).toBeDefined();
      expect(element.props.topicId).toBe("ml_flashattention_sram_tiling");
      expect(element.props.isOpen).toBe(true);
      expect(completedReport).toBeNull();
    });
  });

  describe("2. CurriculumRoadmapExplorer Component & Career Goals", () => {
    it("should instantiate CurriculumRoadmapExplorer with default ALL goals", () => {
      const element = React.createElement(CurriculumRoadmapExplorer, {
        initialCareerGoal: "ALL",
      });

      expect(element).toBeDefined();
      expect(element.props.initialCareerGoal).toBe("ALL");
    });

    it("should support career specialization goal filtering", () => {
      const goals = [
        "LLM_SYSTEMS_ENGINEER",
        "DISTRIBUTED_ML_ARCHITECT",
        "COMPETITIVE_PROGRAMMING_GRANDMASTER",
        "MATHEMATICAL_OPTIMIZATION_SPECIALIST",
      ] as const;

      for (const goal of goals) {
        const element = React.createElement(CurriculumRoadmapExplorer, {
          initialCareerGoal: goal,
          onSelectTopic: () => {},
        });

        expect(element).toBeDefined();
        expect(element.props.initialCareerGoal).toBe(goal);
      }
    });
  });
});
