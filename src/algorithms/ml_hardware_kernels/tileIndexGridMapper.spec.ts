import { describe, it, expect } from "vitest";
import { tileIndexGridMapper, DEFAULT_TILEINDEXGRIDMAPPER_INPUT, generateTileIndexGridMapperSteps } from "./tileIndexGridMapper";

describe("tile-index-grid-mapper (Triton SPMD Block Tile Grid Mapper)", () => {
  it("should have correct metadata", () => {
    expect(tileIndexGridMapper.id).toBe("tile-index-grid-mapper");
    expect(tileIndexGridMapper.isMlInfra).toBe(true);
    expect(tileIndexGridMapper.mlInfraLevel).toBe(10);
    expect(tileIndexGridMapper.mlInfraCategory).toBe("ml_hardware_kernels");
    expect(tileIndexGridMapper.categories).toContain("ml_hardware_kernels");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateTileIndexGridMapperSteps(DEFAULT_TILEINDEXGRIDMAPPER_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Triton SPMD Block Tile Grid Mapper");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
