import { describe, expect, it } from "bun:test";
import React from "react";
import { ALL_COURSE_JOURNEYS, getCourseStepperAdapter, TimeTravelController } from "../index";
import { CoursePlayerStage, TimeTravelStepControls } from "../../components/curriculum";

describe("Master Course Player & UI Components Tests", () => {
  describe("1. TimeTravelStepControls Component", () => {
    it("should instantiate TimeTravelStepControls React element cleanly", () => {
      const adapter = getCourseStepperAdapter("dsa_graph_flows_and_cuts");
      const steps = adapter ? adapter.generateSteps() : [];
      const controller = new TimeTravelController(steps);

      const el = React.createElement(TimeTravelStepControls, {
        controller,
        currentStep: controller.currentStep,
        playbackSpeed: 2,
      });

      expect(React.isValidElement(el)).toBe(true);
      expect(el.props.controller.totalSteps).toBe(steps.length);
      expect(el.props.playbackSpeed).toBe(2);
    });

    it("should step through execution snapshots via controller", () => {
      const adapter = getCourseStepperAdapter("dsa_geometry_and_sweep_line");
      const steps = adapter ? adapter.generateSteps() : [];
      const controller = new TimeTravelController(steps);

      expect(controller.currentIndex).toBe(0);
      const fwd = controller.stepForward();
      expect(controller.currentIndex).toBe(1);
      expect(fwd.step?.stepNumber).toBe(2);

      controller.reset();
      expect(controller.currentIndex).toBe(0);
    });
  });

  describe("2. CoursePlayerStage Component", () => {
    it("should instantiate CoursePlayerStage for DSA topic with Chapter and Page routing", () => {
      const el = React.createElement(CoursePlayerStage, {
        topicId: "dsa_graph_flows_and_cuts",
        initialChapterNumber: 1,
        initialPageNumber: 1,
      });

      expect(React.isValidElement(el)).toBe(true);
      expect(el.props.topicId).toBe("dsa_graph_flows_and_cuts");
      expect(el.props.initialChapterNumber).toBe(1);
    });

    it("should instantiate CoursePlayerStage for ML Systems topic", () => {
      const el = React.createElement(CoursePlayerStage, {
        topicId: "ml_flashattention_sram_tiling",
        initialChapterNumber: 1,
        initialPageNumber: 2,
      });

      expect(React.isValidElement(el)).toBe(true);
      expect(el.props.topicId).toBe("ml_flashattention_sram_tiling");
    });
  });

  describe("3. Catalog & Course Filtering Logic", () => {
    it("should accurately partition 64 courses across DSA and ML tracks", () => {
      const dsaCourses = ALL_COURSE_JOURNEYS.filter((c) => c.id.startsWith("dsa_"));
      const mlCourses = ALL_COURSE_JOURNEYS.filter((c) => c.id.startsWith("ml_"));

      expect(ALL_COURSE_JOURNEYS.length).toBe(64);
      expect(dsaCourses.length).toBe(23);
      expect(mlCourses.length).toBe(41);
    });

    it("should filter courses by query substring matches", () => {
      const searchDinic = ALL_COURSE_JOURNEYS.filter(
        (c) =>
          c.title.toLowerCase().includes("dinic") || c.id.toLowerCase().includes("flows_and_cuts"),
      );

      expect(searchDinic.length).toBeGreaterThanOrEqual(1);
      expect(searchDinic[0].id).toBe("dsa_graph_flows_and_cuts");

      const searchFlash = ALL_COURSE_JOURNEYS.filter((c) =>
        c.title.toLowerCase().includes("flashattention"),
      );

      expect(searchFlash.length).toBeGreaterThanOrEqual(1);
      expect(searchFlash[0].id).toBe("ml_flashattention_sram_tiling");
    });
  });
});
