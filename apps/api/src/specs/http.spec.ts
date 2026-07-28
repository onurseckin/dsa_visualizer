import { describe, expect, it } from "vitest";

import { createApiHandler } from "../http";
import { createMemoryKeyValueStore } from "../persistence";

const LOCAL_ORIGIN = "http://localhost:5173";

function handlerForTest() {
  return createApiHandler({ store: createMemoryKeyValueStore(), maxBodyBytes: 512 });
}

async function json(response: Response): Promise<unknown> {
  return response.json();
}

describe("API HTTP handler", () => {
  it("answers the health endpoint", async () => {
    const response = await handlerForTest()(new Request("http://api.local/api/health"));

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ ok: true, service: "api" });
  });

  it("rejects bodies above the configured limit with a normalized error", async () => {
    const response = await handlerForTest()(
      new Request("http://api.local/api/db/state", {
        method: "POST",
        body: JSON.stringify({ entries: { too_large: "x".repeat(600) } }),
      }),
    );

    expect(response.status).toBe(413);
    expect(await json(response)).toEqual({
      error: { code: "body_too_large", message: "Request body exceeds the 512 byte limit." },
    });
  });

  it("normalizes malformed JSON errors", async () => {
    const response = await handlerForTest()(
      new Request("http://api.local/api/db/state", { method: "POST", body: "{" }),
    );

    expect(response.status).toBe(400);
    expect(await json(response)).toEqual({
      error: { code: "invalid_json", message: "Request body must be valid JSON." },
    });
  });

  it("gets, sets, batch sets, and deletes persisted state", async () => {
    const handle = handlerForTest();
    const headers = { "Content-Type": "application/json" };

    expect(
      await json(
        await handle(
          new Request("http://api.local/api/db/state", {
            method: "POST",
            headers,
            body: JSON.stringify({ key: "one", value: "1" }),
          }),
        ),
      ),
    ).toEqual({ ok: true });

    await handle(
      new Request("http://api.local/api/db/state", {
        method: "POST",
        headers,
        body: JSON.stringify({ entries: { two: { value: 2 }, one: null } }),
      }),
    );

    const response = await handle(new Request("http://api.local/api/db/state"));
    expect(await json(response)).toEqual({ two: '{"value":2}' });
  });

  it("resets only the documented layout and trivia prefixes", async () => {
    const handle = handlerForTest();
    const headers = { "Content-Type": "application/json" };
    await handle(
      new Request("http://api.local/api/db/state", {
        method: "POST",
        headers,
        body: JSON.stringify({
          entries: {
            dsa_visualizer_workspace_layout_v1: "layout",
            dsa_trivia_layout_v1: "trivia-layout",
            dsa_trivia_session_v1: "trivia-session",
            keep: "value",
          },
        }),
      }),
    );

    await handle(new Request("http://api.local/api/db/reset", { method: "POST" }));
    expect(await json(await handle(new Request("http://api.local/api/db/state")))).toEqual({
      dsa_trivia_session_v1: "trivia-session",
      keep: "value",
    });

    await handle(new Request("http://api.local/api/db/clear-trivia", { method: "POST" }));
    expect(await json(await handle(new Request("http://api.local/api/db/state")))).toEqual({
      keep: "value",
    });
  });

  it("rejects unsupported methods with an Allow header", async () => {
    const response = await handlerForTest()(
      new Request("http://api.local/api/db/state", { method: "DELETE" }),
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET, POST");
    expect(await json(response)).toEqual({
      error: {
        code: "method_not_allowed",
        message: "Method DELETE is not allowed for this route.",
      },
    });
  });

  it("allows localhost CORS preflights and rejects untrusted origins", async () => {
    const handle = handlerForTest();
    const allowed = await handle(
      new Request("http://api.local/api/db/state", {
        method: "OPTIONS",
        headers: { Origin: LOCAL_ORIGIN, "Access-Control-Request-Method": "POST" },
      }),
    );
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("Access-Control-Allow-Origin")).toBe(LOCAL_ORIGIN);

    const denied = await handle(
      new Request("http://api.local/api/health", { headers: { Origin: "https://example.com" } }),
    );
    expect(denied.status).toBe(403);
    expect(await json(denied)).toEqual({
      error: { code: "origin_not_allowed", message: "This origin is not allowed." },
    });
  });
});
