import { PYTHON_RUN_REQUEST_BODY_CEILING_BYTES } from "@dsa-visualizer/execution-contracts";

export interface ApiConfig {
  readonly host: string;
  readonly port: number;
  readonly dataDirectory: string | undefined;
  readonly maxBodyBytes: number;
  readonly pythonMaxBodyBytes: number;
  readonly allowedOrigins: readonly string[];
  readonly pythonRunnerUrl: string;
  readonly pythonRunnerTimeoutMs: number;
}

export const DEFAULT_MAX_BODY_BYTES = 256 * 1024;
export const DEFAULT_PYTHON_MAX_BODY_BYTES = PYTHON_RUN_REQUEST_BODY_CEILING_BYTES;
const DEFAULT_PYTHON_RUNNER_TIMEOUT_MS = 31_000;

export function readApiConfig(
  environment: Record<string, string | undefined> = process.env,
): ApiConfig {
  return {
    host: environment.API_HOST || "0.0.0.0",
    port: parsePositiveInteger(environment.API_PORT, 3000),
    dataDirectory: environment.API_DATA_DIR,
    maxBodyBytes: parsePositiveInteger(environment.API_MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES),
    pythonMaxBodyBytes: parseIntegerAtLeast(
      environment.API_PYTHON_MAX_BODY_BYTES,
      DEFAULT_PYTHON_MAX_BODY_BYTES,
    ),
    allowedOrigins: parseOrigins(environment.API_ALLOWED_ORIGINS),
    pythonRunnerUrl: environment.PYTHON_RUNNER_URL || "http://python-runner:8080",
    pythonRunnerTimeoutMs: parsePositiveInteger(
      environment.PYTHON_RUNNER_TIMEOUT_MS,
      DEFAULT_PYTHON_RUNNER_TIMEOUT_MS,
    ),
  };
}

function parsePositiveInteger(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function parseIntegerAtLeast(raw: string | undefined, minimum: number): number {
  const value = parsePositiveInteger(raw, minimum);
  return value >= minimum ? value : minimum;
}

function parseOrigins(raw: string | undefined): readonly string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
