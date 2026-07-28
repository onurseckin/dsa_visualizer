import { describe, expect, it } from "vitest";

import { createMemoryKeyValueStore, serializeStateValue } from "../persistence";

describe("KeyValueStore", () => {
  it("keeps state values as strings and clears exact prefixes", () => {
    const store = createMemoryKeyValueStore({ one: "1", "dsa_trivia:one": "a" });

    store.set("two", "2");
    store.delete("one");
    store.clearPrefix("dsa_trivia");

    expect(store.getAll()).toEqual({ two: "2" });
  });

  it("serializes legacy string values unchanged and JSON values safely", () => {
    expect(serializeStateValue("raw")).toBe("raw");
    expect(serializeStateValue({ enabled: true })).toBe('{"enabled":true}');
    expect(serializeStateValue([1, 2])).toBe("[1,2]");
  });
});
