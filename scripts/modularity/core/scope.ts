import { extname } from "node:path";
import type { ScopeDecision, Violation } from "./contracts.ts";
import { assertRepositoryRelativePosixPath } from "./errors.ts";

const APPROVED_ROOT_PATHS = new Set([
  ".cta.json",
  ".dockerignore",
  ".gitignore",
  ".oxfmtrc.json",
  ".oxlintrc.json",
  "AGENTS.md",
  "Dockerfile.api",
  "Dockerfile.runner",
  "Dockerfile.web",
  "LICENSE",
  "README.md",
  "TUTORIAL_GUIDE.md",
  "bun.lock",
  "bunfig.toml",
  "compose.yaml",
  "index.html",
  "lefthook.yml",
  "package.json",
  "tsconfig.json",
  "tsr.config.json",
  "vite.config.ts",
]);

const EXCLUDED_ROOTS = new Set([
  ".git",
  ".olt",
  "build",
  "cache",
  "capsules",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "scratch",
  "vendor",
  "vendored",
  "third_party",
]);

const LOCKFILES = new Set([
  "bun.lock",
  "bun.lockb",
  "npm-shrinkwrap.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
]);

const EXCLUDED: ScopeDecision = {
  included: false,
  lineLimited: false,
  fanoutCounted: false,
  importScanned: false,
};

const FANOUT_ONLY: ScopeDecision = {
  included: true,
  lineLimited: false,
  fanoutCounted: true,
  importScanned: false,
};

const DATA_FILE: ScopeDecision = {
  included: true,
  lineLimited: true,
  fanoutCounted: true,
  importScanned: false,
};

const TYPESCRIPT_FILE: ScopeDecision = {
  included: true,
  lineLimited: true,
  fanoutCounted: true,
  importScanned: true,
};

function hasExcludedDirectory(path: string): boolean {
  const segments = path.split("/");
  return segments.some((segment, index) => {
    if (EXCLUDED_ROOTS.has(segment)) return true;
    if (segment === ".cache") return true;
    if (index === 0 && segment === "runtime") return true;
    return false;
  });
}

function isModularityBaselineArtifact(path: string): boolean {
  return path.startsWith("scripts/modularity/baseline/");
}

function isQuestionFile(path: string): boolean {
  if (path.startsWith("src/curriculum/mlQuestions/")) return true;
  if (path.includes("/questions/") || path.includes("/mlQuestions/")) return true;
  if (path.endsWith("Question.ts") || path.endsWith("Questions.ts")) return true;
  return false;
}

function isNonTypeScriptFixture(path: string, extension: string): boolean {
  if (extension === ".ts") return false;
  if (extension === ".tsx") return false;
  if (extension === ".mts") return false;
  if (extension === ".cts") return false;
  return path.split("/").some((segment) => {
    if (segment === "fixtures") return true;
    if (segment === "__snapshots__") return true;
    return false;
  });
}

export function classifyPath(path: string): ScopeDecision {
  assertRepositoryRelativePosixPath(path);

  if (hasExcludedDirectory(path)) {
    return EXCLUDED;
  }
  if (LOCKFILES.has(path)) {
    return EXCLUDED;
  }

  if (isModularityBaselineArtifact(path)) {
    return FANOUT_ONLY;
  }

  if (path === "src/routeTree.gen.ts") {
    return FANOUT_ONLY;
  }

  const extension = extname(path);

  if (isQuestionFile(path)) {
    return {
      included: true,
      lineLimited: false,
      fanoutCounted: true,
      importScanned: extension === ".ts" || extension === ".tsx",
    };
  }

  if (extension === ".ts" || extension === ".tsx" || extension === ".mts" || extension === ".cts") {
    return TYPESCRIPT_FILE;
  }

  if (isNonTypeScriptFixture(path, extension)) {
    return FANOUT_ONLY;
  }

  if (extension === ".json") {
    return DATA_FILE;
  }

  if (
    extension === ".jsonl" ||
    extension === ".md" ||
    extension === ".yaml" ||
    extension === ".yml" ||
    extension === ".html" ||
    extension === ".css"
  ) {
    return FANOUT_ONLY;
  }

  if (extension === ".py" || extension === ".sh") {
    return DATA_FILE;
  }

  return EXCLUDED;
}

export function assertRootConvention(paths: readonly string[]): Violation[] {
  return paths
    .filter((path) => {
      if (path.includes("/")) return false;
      if (LOCKFILES.has(path)) return false;
      if (APPROVED_ROOT_PATHS.has(path)) return false;
      return true;
    })
    .sort()
    .map((path) => ({
      rule: "root_no_growth" as const,
      path,
      observed: path,
      detail: "Root path is not in the approved conventional set.",
    }));
}
