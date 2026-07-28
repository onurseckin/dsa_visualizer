import { describe, expect, it } from "vitest";

import { readApiConfig } from "../config";

describe("readApiConfig", () => {
  it("uses local defaults and parses valid overrides", () => {
    expect(readApiConfig({})).toMatchObject({
      host: "0.0.0.0",
      port: 3000,
      maxBodyBytes: 262_144,
      pythonMaxBodyBytes: 3_145_728,
      allowedOrigins: [],
      pythonRunnerUrl: "http://python-runner:8080",
      pythonRunnerTimeoutMs: 31_000,
    });
    expect(
      readApiConfig({
        API_HOST: "127.0.0.1",
        API_PORT: "4100",
        API_DATA_DIR: "/tmp/data",
        API_MAX_BODY_BYTES: "123",
        API_PYTHON_MAX_BODY_BYTES: "456",
        API_ALLOWED_ORIGINS: "http://localhost:5173, http://127.0.0.1:5173",
        PYTHON_RUNNER_URL: "http://runner.local:9000/",
        PYTHON_RUNNER_TIMEOUT_MS: "456",
      }),
    ).toEqual({
      host: "127.0.0.1",
      port: 4100,
      dataDirectory: "/tmp/data",
      maxBodyBytes: 123,
      pythonMaxBodyBytes: 456,
      allowedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
      pythonRunnerUrl: "http://runner.local:9000/",
      pythonRunnerTimeoutMs: 456,
    });
  });

  it("falls back for invalid numeric configuration", () => {
    expect(
      readApiConfig({
        API_PORT: "0",
        API_MAX_BODY_BYTES: "nope",
        API_PYTHON_MAX_BODY_BYTES: "-1",
        PYTHON_RUNNER_TIMEOUT_MS: "-1",
      }),
    ).toMatchObject({
      port: 3000,
      maxBodyBytes: 262_144,
      pythonMaxBodyBytes: 3_145_728,
      pythonRunnerTimeoutMs: 31_000,
    });
  });
});
