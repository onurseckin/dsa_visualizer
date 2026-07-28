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

function healthcheckCommand(service: ComposeService): string {
  const healthcheck = objectValues(service.healthcheck);
  return Array.isArray(healthcheck.test)
    ? healthcheck.test.filter((part): part is string => typeof part === "string").join(" ")
    : "";
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

function hasVolumeMount(service: ComposeService, source: string, target: string): boolean {
  if (!Array.isArray(service.volumes)) return false;
  return service.volumes.some((volume) => {
    if (typeof volume === "string") return volume === `${source}:${target}`;
    const mount = objectValues(volume);
    return mount.source === source && mount.target === target;
  });
}

function hasRequiredTmpfs(value: unknown, required: string): boolean {
  return stringValues(value).includes(required);
}

export function verifyCompose(config: ComposeConfig): void {
  const services = config.services ?? {};
  const web = services.web;
  const api = services.api;
  const runner = services["python-runner"];
  if (!web || !api || !runner) fail("web, api, and python-runner services are required.");

  for (const [name, service] of Object.entries({ web, api, "python-runner": runner })) {
    requires(service, "build", name);
    if (!healthcheckCommand(service)) fail(`${name} must define a healthcheck.`);
  }
  if (!healthcheckCommand(web).includes("http://127.0.0.1/")) {
    fail("web healthcheck must call the web root.");
  }
  if (!healthcheckCommand(api).includes("http://127.0.0.1:3000/api/health")) {
    fail("api healthcheck must call /api/health.");
  }
  if (!healthcheckCommand(runner).includes("http://127.0.0.1:8080/health")) {
    fail("python-runner healthcheck must call /health.");
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
  if (networks.app?.internal !== true) fail("app network must be internal.");
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
  if (!hasRequiredTmpfs(runner.tmpfs, "/tmp:rw,noexec,nosuid,size=256m")) {
    fail("python-runner must mount /tmp as a 256m noexec,nosuid tmpfs.");
  }
  if (!hasRequiredTmpfs(runner.tmpfs, "/run:rw,noexec,nosuid,size=8m")) {
    fail("python-runner must mount /run as an 8m noexec,nosuid tmpfs.");
  }
  if (runner.pids_limit === undefined) fail("python-runner must define pids_limit.");
  const deploy = objectValues(runner.deploy);
  const resources = objectValues(deploy.resources);
  const limits = objectValues(resources.limits);
  if (Number(limits.cpus) < 2 || Number(limits.memory) < 2_147_483_648) {
    fail("python-runner must define at least 2 CPUs and 2G memory.");
  }

  const apiEnvironment = objectValues(api.environment);
  if (apiEnvironment.PYTHON_RUNNER_URL !== "http://python-runner:8080") {
    fail("api must point PYTHON_RUNNER_URL at the internal runner.");
  }
  if (!hasVolumeMount(api, "api_data", "/data")) {
    fail("api must mount api_data at /data.");
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
    [
      "Dockerfile.web",
      webDockerfile,
      "FROM oven/bun:1.3.14-alpine@sha256:5acc90a93e91ff07bf72aa90a7c9f0fa189765aec90b47bdbf2152d2196383c0 AS build",
    ],
    [
      "Dockerfile.web",
      webDockerfile,
      "FROM nginx:1.27.4-alpine@sha256:4ff102c5d78d254a6f0da062b3cf39eaf07f01eec0927fd21e219d0af8bc0591",
    ],
    [
      "Dockerfile.api",
      apiDockerfile,
      "FROM oven/bun:1.3.14-alpine@sha256:5acc90a93e91ff07bf72aa90a7c9f0fa189765aec90b47bdbf2152d2196383c0",
    ],
    [
      "Dockerfile.runner",
      runnerDockerfile,
      "FROM python:3.12.10-slim-bookworm@sha256:fd95fa221297a88e1cf49c55ec1828edd7c5a428187e67b5d1805692d11588db",
    ],
    ["Dockerfile.runner", runnerDockerfile, "numpy==2.2.5"],
    ["Dockerfile.runner", runnerDockerfile, "torch==2.6.0+cpu"],
    ["Dockerfile.runner", runnerDockerfile, "USER 10001:10001"],
    ["docker/web/nginx.conf", nginx, "location /api/"],
    ["docker/web/nginx.conf", nginx, "proxy_pass http://api:3000;"],
    ["docker/web/nginx.conf", nginx, "application/wasm wasm;"],
    ["docker/web/nginx.conf", nginx, "immutable"],
    ["docker/web/nginx.conf", nginx, "client_max_body_size 5m;"],
    ["docker/web/nginx.conf", nginx, 'add_header Cache-Control "no-cache" always;'],
    ["docker/web/nginx.conf", nginx, "try_files $uri $uri/ /index.html;"],
  ];
  for (const [file, contents, expected] of requiredPins) {
    if (!contents.includes(expected)) fail(`${file} must include ${expected}.`);
  }
}

export function main(): void {
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
}

if ((import.meta as ImportMeta & { readonly main?: boolean }).main) main();
