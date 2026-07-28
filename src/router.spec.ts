import { describe, expect, it } from "vitest";
import { router } from "./router";

describe("application router", () => {
  it("uses intent preloading, restores scroll, and resolves a registered route", async () => {
    expect(router.options.defaultPreload).toBe("intent");
    expect(router.options.scrollRestoration).toBe(true);

    await router.navigate({ to: "/problems", search: {} });
    expect(router.state.location.pathname).toBe("/problems");
  });
});
