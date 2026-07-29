import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const readProjectFile = (path: string): string =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("Docker development stack", () => {
  it("defines live development services for the web app, API, and Python runner", () => {
    const compose = readProjectFile("compose.dev.yaml");

    expect(compose).toContain("command: bun run dev:docker");
    expect(compose).toContain("command: bun --watch apps/api/src/index.ts");
    expect(compose).toContain("command: python dev_runner.py");
    expect(compose).toContain("5173:5173");
    expect(compose).toContain("api_data:/data");
    expect(compose).toContain("name: dsa-visualizer_api_data");
    expect(compose).toContain('VITE_USE_DOCKER_API: "1"');
    expect(readProjectFile("apps/python-runner/dev_runner.py")).toContain("runner_service.py");
  });

  it("exposes a dedicated Docker development command without changing production startup", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts.ddev).toBe("docker compose -f compose.dev.yaml up --build --watch");
    expect(packageJson.scripts["ddev:down"]).toBe("docker compose -f compose.dev.yaml down");
    expect(packageJson.scripts["compose:dev:check"]).toBe(
      "docker compose -f compose.dev.yaml config",
    );
    expect(packageJson.scripts.check).toContain("bun run compose:dev:check");
    expect(packageJson.scripts.dup).toBe("docker compose up --build --wait");
  });
});
