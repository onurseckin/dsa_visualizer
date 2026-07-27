import { describe, it, expect } from "vitest";
import { tileIndexGridMapper } from "./tileIndexGridMapper";

describe("tileIndexGridMapper", () => {
  it("should have valid metadata", () => {
    expect(tileIndexGridMapper.id).toBeDefined();
    expect(tileIndexGridMapper.title).toBeDefined();
    expect(tileIndexGridMapper.code).toBeDefined();
    expect(tileIndexGridMapper.examples?.length).toBeGreaterThan(0);
  });

  it("should generate valid steps", () => {
    const steps = tileIndexGridMapper.generateSteps(tileIndexGridMapper.defaultInput);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBeDefined();
    expect(steps[steps.length - 1].primarySnapshot.kind).toBeDefined();
  });
});
