import { describe, expect, it } from "vitest";
import { Route } from "../workspace.index";

describe("workspace.index route", () => {
  it("beforeLoad throws a redirect to bubble-sort algorithm workspace", () => {
    const beforeLoad = Route.options.beforeLoad;
    expect(beforeLoad).toBeDefined();
    if (!beforeLoad) return;

    try {
      beforeLoad({} as never);
      expect.fail("Should have thrown a redirect");
    } catch (err: unknown) {
      expect(err).toBeDefined();
      const redirectObj = err as { options?: { to?: string; params?: { algorithmId?: string } } };
      expect(redirectObj.options?.to).toBe("/workspace/$algorithmId");
      expect(redirectObj.options?.params?.algorithmId).toBe("bubble-sort");
    }
  });
});
