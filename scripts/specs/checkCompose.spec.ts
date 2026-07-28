import { describe, expect, it } from "vitest";

import { verifyCompose } from "../checkCompose";

const validConfig = {
  services: {
    web: {
      build: {},
      ports: [{ target: 80, published: "5173", host_ip: "127.0.0.1" }],
      depends_on: { api: { condition: "service_healthy" } },
      networks: { app: null },
      healthcheck: { test: ["CMD-SHELL", "wget -q -O /dev/null http://127.0.0.1/ || exit 1"] },
    },
    api: {
      build: {},
      environment: { PYTHON_RUNNER_URL: "http://python-runner:8080" },
      volumes: [{ source: "api_data", target: "/data" }],
      depends_on: { "python-runner": { condition: "service_healthy" } },
      networks: { app: null, runner: null },
      healthcheck: {
        test: [
          "CMD",
          "bun",
          "-e",
          "const response = await fetch('http://127.0.0.1:3000/api/health'); process.exit(response.ok ? 0 : 1)",
        ],
      },
    },
    "python-runner": {
      build: {},
      user: "10001:10001",
      networks: { runner: null },
      read_only: true,
      cap_drop: ["ALL"],
      security_opt: ["no-new-privileges:true"],
      tmpfs: ["/tmp:rw,noexec,nosuid,size=256m", "/run:rw,noexec,nosuid,size=8m"],
      pids_limit: 64,
      deploy: { resources: { limits: { cpus: 2, memory: "2147483648" } } },
      healthcheck: {
        test: [
          "CMD",
          "python",
          "-c",
          "import urllib.request; response = urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=2); raise SystemExit(0 if response.status == 200 else 1)",
        ],
      },
    },
  },
  networks: { app: { internal: true }, runner: { internal: true } },
  volumes: { api_data: {} },
} as const;

describe("verifyCompose", () => {
  it("rejects an externally reachable app network", () => {
    expect(() =>
      verifyCompose({
        ...validConfig,
        networks: { ...validConfig.networks, app: { internal: false } },
      }),
    ).toThrow("app network must be internal");
  });

  it("rejects a runner health check that does not call the health endpoint", () => {
    expect(() =>
      verifyCompose({
        ...validConfig,
        services: {
          ...validConfig.services,
          "python-runner": {
            ...validConfig.services["python-runner"],
            healthcheck: { test: ["CMD", "python", "-c", "raise SystemExit(0)"] },
          },
        },
      }),
    ).toThrow("python-runner healthcheck must call /health");
  });
});
