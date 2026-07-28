export interface ApiConfig {
  readonly host: string;
  readonly port: number;
  readonly dataDirectory: string | undefined;
  readonly maxBodyBytes: number;
  readonly allowedOrigins: readonly string[];
}

const DEFAULT_MAX_BODY_BYTES = 256 * 1024;

export function readApiConfig(
  environment: Record<string, string | undefined> = process.env,
): ApiConfig {
  return {
    host: environment.API_HOST || "0.0.0.0",
    port: parsePositiveInteger(environment.API_PORT, 3000),
    dataDirectory: environment.API_DATA_DIR,
    maxBodyBytes: parsePositiveInteger(environment.API_MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES),
    allowedOrigins: parseOrigins(environment.API_ALLOWED_ORIGINS),
  };
}

function parsePositiveInteger(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function parseOrigins(raw: string | undefined): readonly string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
