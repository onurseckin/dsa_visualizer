import { existsSync, readFileSync } from "node:fs";

interface ComposeService {
  readonly build?: unknown;
  readonly cap_drop?: unknown;
  readonly depends_on?: unknown;
  readonly environment?: unknown;
  readonly healthcheck?: unknown;
  readonly image?: unknown;
  readonly networks?: unknown;
  readonly network_mode?: unknown;
  readonly ports?: unknown;
  readonly read_only?: unknown;
  readonly security_opt?: unknown;
  readonly tmpfs?: unknown;
  readonly user?: unknown;
  readonly volumes?: unknown;
  readonly deploy?: unknown;
  readonly pids_limit?: unknown;
}

interface ComposeConfig {
  readonly services?: Record<string, ComposeService>;
  readonly networks?: Record<string, { readonly internal?: boolean }>;
  readonly volumes?: Record<string, unknown>;
}

function fail(message: string): never {
  throw new Error(`Compose configuration check failed: ${message}`);
}

function stringValues(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function objectValues(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function requires(service: ComposeService, field: keyof ComposeService, label: string): void {
  if (service[field] === undefined) fail(`${label} must define ${field}.`);
}

function hasHealthcheck(service: ComposeService): boolean {
  const healthcheck = objectValues(service.healthcheck);
  return Array.isArray(healthcheck.test) && healthcheck.test.length > 0;
}

function networkNames(value: unknown): readonly string[] {
  if (Array.isArray(value)) return stringValues(value);
  return Object.keys(objectValues(value));
}

function publishedPorts(
  value: unknown,
): readonly { readonly target: number; readonly published?: string; readonly hostIp?: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      const target = Number(entry.split(":").at(-1));
      return Number.isFinite(target) ? [{ target }] : [];
    }
    const port = objectValues(entry);
    return typeof port.target === "number"
      ? [
          {
            target: port.target,
            published: typeof port.published === "string" ? port.published : undefined,
            hostIp: typeof port.host_ip === "string" ? port.host_ip : undefined,
          },
        ]
      : [];
  });
}

function verifyCompose(config: ComposeConfig): void {
  const services = config.services ?? {};
  const web = services.web;
  const api = services.api;
  const runner = services["python-runner"];
  if (!web || !api || !runner) fail("web, api, and python-runner services are required.");

  for (const [name, service] of Object.entries({ web, api, "python-runner": runner })) {
    requires(service, "build", name);
    if (!hasHealthcheck(service)) fail(`${name} must define a healthcheck.`);
  }

  const webPorts = publishedPorts(web.ports);
  if (
    webPorts.length !== 1 ||
    webPorts[0].target !== 80 ||
    !webPorts[0].published ||
    webPorts[0].hostIp !== "127.0.0.1"
  ) {
    fail("web must publish exactly one host port to container port 80.");
  }
  if (publishedPorts(api.ports).length > 0) fail("api must not publish a host port.");
  if (publishedPorts(runner.ports).length > 0) {
    fail("python-runner must not publish a host port.");
  }

  const networks = config.networks ?? {};
  if (networks.runner?.internal !== true) fail("runner network must be internal.");
  if (networkNames(runner.networks).join(",") !== "runner") {
    fail("python-runner must only use the internal runner network.");
  }
  if (!networkNames(api.networks).includes("runner")) fail("api must connect to runner network.");

  if (runner.read_only !== true) fail("python-runner must use a read-only root filesystem.");
  if (runner.user === undefined || String(runner.user) === "0") {
    fail("python-runner must run as a non-root user.");
  }
  if (!stringValues(runner.cap_drop).includes("ALL"))
    fail("python-runner must drop all capabilities.");
  if (!stringValues(runner.security_opt).includes("no-new-privileges:true")) {
    fail("python-runner must set no-new-privileges.");
  }
  if (stringValues(runner.tmpfs).length === 0)
    fail("python-runner must define writable tmpfs mounts.");
  if (runner.pids_limit === undefined) fail("python-runner must define pids_limit.");
  const deploy = objectValues(runner.deploy);
  const resources = objectValues(deploy.resources);
  const limits = objectValues(resources.limits);
  if (limits.cpus === undefined || limits.memory === undefined) {
    fail("python-runner must define CPU and memory limits.");
  }

  const apiEnvironment = objectValues(api.environment);
  if (apiEnvironment.PYTHON_RUNNER_URL !== "http://python-runner:8080") {
    fail("api must point PYTHON_RUNNER_URL at the internal runner.");
  }
  const apiDependencies = objectValues(api.depends_on);
  if (objectValues(apiDependencies["python-runner"]).condition !== "service_healthy") {
    fail("api must wait for a healthy python-runner.");
  }
  const webDependencies = objectValues(web.depends_on);
  if (objectValues(webDependencies.api).condition !== "service_healthy") {
    fail("web must wait for a healthy api.");
  }
  if (!objectValues(config.volumes).api_data) fail("api_data named volume is required.");
}

function verifyPinnedBuildFiles(): void {
  const webDockerfile = readFileSync("Dockerfile.web", "utf8");
  const apiDockerfile = readFileSync("Dockerfile.api", "utf8");
  const runnerDockerfile = readFileSync("Dockerfile.runner", "utf8");
  const nginx = readFileSync("docker/web/nginx.conf", "utf8");
  const requiredPins: readonly [string, string, string][] = [
    ["Dockerfile.web", webDockerfile, "FROM oven/bun:1.3.14-alpine AS build"],
    ["Dockerfile.web", webDockerfile, "FROM nginx:1.27.4-alpine"],
    ["Dockerfile.api", apiDockerfile, "FROM oven/bun:1.3.14-alpine"],
    ["Dockerfile.runner", runnerDockerfile, "FROM python:3.12.10-slim-bookworm"],
    ["Dockerfile.runner", runnerDockerfile, "numpy==2.2.5"],
    ["Dockerfile.runner", runnerDockerfile, "torch==2.6.0+cpu"],
    ["Dockerfile.runner", runnerDockerfile, "USER 10001:10001"],
    ["docker/web/nginx.conf", nginx, "location /api/"],
    ["docker/web/nginx.conf", nginx, "proxy_pass http://api:3000;"],
    ["docker/web/nginx.conf", nginx, "application/wasm wasm;"],
    ["docker/web/nginx.conf", nginx, "immutable"],
    ["docker/web/nginx.conf", nginx, "try_files $uri $uri/ /index.html;"],
  ];
  for (const [file, contents, expected] of requiredPins) {
    if (!contents.includes(expected)) fail(`${file} must include ${expected}.`);
  }
}

if (!existsSync("compose.yaml")) fail("compose.yaml is missing.");
if (
  !existsSync("Dockerfile.web") ||
  !existsSync("Dockerfile.api") ||
  !existsSync("Dockerfile.runner")
) {
  fail("all three Dockerfiles are required.");
}
if (!existsSync("docker/web/nginx.conf")) fail("docker/web/nginx.conf is required.");
const result = Bun.spawnSync(["docker", "compose", "config", "--format", "json"], {
  cwd: process.cwd(),
  stdout: "pipe",
  stderr: "pipe",
});
if (result.exitCode !== 0) {
  fail(new TextDecoder().decode(result.stderr).trim() || "docker compose config failed.");
}

let config: ComposeConfig;
try {
  config = JSON.parse(new TextDecoder().decode(result.stdout)) as ComposeConfig;
} catch {
  fail("docker compose config did not return JSON.");
}
verifyCompose(config);
verifyPinnedBuildFiles();
console.log("Compose configuration check passed.");
