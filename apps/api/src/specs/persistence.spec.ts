import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  createMemoryKeyValueStore,
  createSqliteKeyValueStore,
  serializeStateValue,
} from "../persistence";

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

  it("uses an explicit nested database path for its database parent and JSON fallback", () => {
    const directory = temporaryDirectory();
    const databasePath = join(directory, "nested", "data", "state.sqlite");
    const store = createSqliteKeyValueStore({ databasePath, forceJsonFallback: true });

    store.set("nested", "works");

    expect(store.getAll()).toMatchObject({ nested: "works" });
    expect(existsSync(join(directory, "nested", "data"))).toBe(true);
    expect(existsSync(join(directory, "nested", "data", "kv_fallback.json"))).toBe(true);
    store.close?.();
    rmSync(directory, { recursive: true, force: true });
  });

  it("recovers from corrupt fallback state and keeps writes best effort", () => {
    const directory = temporaryDirectory();
    writeFileSync(join(directory, "kv_fallback.json"), "not-json", "utf8");
    const recovered = createSqliteKeyValueStore({
      databasePath: join(directory, "state.sqlite"),
      forceJsonFallback: true,
    });
    expect(recovered.getAll()).toEqual({});
    recovered.close?.();

    rmSync(join(directory, "kv_fallback.json"), { force: true });
    mkdirSync(join(directory, "kv_fallback.json"));
    const unwritableFallback = createSqliteKeyValueStore({
      databasePath: join(directory, "other.sqlite"),
      forceJsonFallback: true,
    });
    expect(() => unwritableFallback.set("still-usable", "yes")).not.toThrow();
    expect(unwritableFallback.getAll()).toMatchObject({ "still-usable": "yes" });
    unwritableFallback.close?.();
    rmSync(directory, { recursive: true, force: true });
  });
});

function temporaryDirectory(): string {
  const directory = join(tmpdir(), `dsa-api-${crypto.randomUUID()}`);
  mkdirSync(directory, { recursive: true });
  return directory;
}
