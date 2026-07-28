import type { Connect } from "vite";

import type { KeyValueStore } from "./persistence";
import { serializeStateValue } from "./persistence";

export interface ApiHandlerOptions {
  readonly store: KeyValueStore;
  readonly maxBodyBytes?: number;
  readonly allowedOrigins?: readonly string[];
}

export type ApiHandler = (request: Request) => Promise<Response>;

const DEFAULT_MAX_BODY_BYTES = 256 * 1024;
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

export function createApiHandler(options: ApiHandlerOptions): ApiHandler {
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const allowedOrigins = options.allowedOrigins ?? [];

  return async (request) => {
    const origin = request.headers.get("Origin");
    if (origin && !isAllowedOrigin(origin, allowedOrigins)) {
      return errorResponse(403, "origin_not_allowed", "This origin is not allowed.");
    }

    const corsHeaders = origin ? corsHeadersFor(origin) : undefined;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const pathname = new URL(request.url).pathname;
    let response: Response;
    if (pathname === "/api/health") {
      response =
        request.method === "GET"
          ? jsonResponse({ ok: true, service: "api" })
          : methodNotAllowed(request.method, "GET");
    } else if (pathname === "/api/db/state") {
      response = await handleState(request, options.store, maxBodyBytes);
    } else if (pathname === "/api/db/reset") {
      response = await handlePrefixReset(
        request,
        options.store,
        ["dsa_visualizer_workspace_layout", "dsa_trivia_layout"],
        maxBodyBytes,
      );
    } else if (pathname === "/api/db/clear-trivia") {
      response = await handlePrefixReset(request, options.store, ["dsa_trivia"], maxBodyBytes);
    } else {
      response = errorResponse(404, "not_found", "Route not found.");
    }

    return withCors(response, corsHeaders);
  };
}

/** Adapt the same Fetch handler for Vite's Connect middleware in development. */
export function createViteApiMiddleware(handler: ApiHandler): Connect.NextHandleFunction {
  return async (request, response, next) => {
    if (!request.url?.startsWith("/api/")) {
      next();
      return;
    }

    try {
      const body = await readNodeBody(request);
      const headers = new Headers();
      for (const [name, value] of Object.entries(request.headers ?? {})) {
        if (Array.isArray(value)) headers.set(name, value.join(", "));
        else if (value !== undefined) headers.set(name, value);
      }
      const forwarded = request.headers?.["x-forwarded-proto"];
      const protocol = typeof forwarded === "string" ? forwarded.split(",")[0] : "http";
      const host = request.headers?.host ?? "localhost";
      const apiRequest = new Request(`${protocol}://${host}${request.url}`, {
        method: request.method ?? "GET",
        headers,
        body: body.byteLength > 0 ? new TextDecoder().decode(body) : undefined,
      });
      const apiResponse = await handler(apiRequest);
      response.statusCode = apiResponse.status;
      apiResponse.headers.forEach((value, name) => response.setHeader(name, value));
      response.end(Buffer.from(await apiResponse.arrayBuffer()));
    } catch {
      response.statusCode = 500;
      response.setHeader("Content-Type", JSON_HEADERS["Content-Type"]);
      response.end(
        JSON.stringify({ error: { code: "internal_error", message: "Unexpected API error." } }),
      );
    }
  };
}

async function handleState(
  request: Request,
  store: KeyValueStore,
  maxBodyBytes: number,
): Promise<Response> {
  if (request.method === "GET") return jsonResponse(store.getAll());
  if (request.method !== "POST") return methodNotAllowed(request.method, "GET, POST");

  const body = await parseJsonBody(request, maxBodyBytes);
  if (!body.ok) return body.response;
  if (!isRecord(body.value))
    return errorResponse(400, "invalid_state", "State body must be an object.");

  if (Object.hasOwn(body.value, "key")) {
    if (typeof body.value.key !== "string" || body.value.key.length === 0) {
      return errorResponse(400, "invalid_state", "State key must be a non-empty string.");
    }
    const serialized = serializeStateValue(body.value.value);
    if (serialized === undefined) store.delete(body.value.key);
    else store.set(body.value.key, serialized);
    return jsonResponse({ ok: true });
  }

  if (Object.hasOwn(body.value, "entries")) {
    if (!isRecord(body.value.entries)) {
      return errorResponse(400, "invalid_state", "State entries must be an object.");
    }
    for (const [key, value] of Object.entries(body.value.entries)) {
      const serialized = serializeStateValue(value);
      if (serialized === undefined) store.delete(key);
      else store.set(key, serialized);
    }
  }
  return jsonResponse({ ok: true });
}

async function handlePrefixReset(
  request: Request,
  store: KeyValueStore,
  prefixes: readonly string[],
  maxBodyBytes: number,
): Promise<Response> {
  if (request.method !== "POST") return methodNotAllowed(request.method, "POST");
  const body = await parseJsonBody(request, maxBodyBytes);
  if (!body.ok) return body.response;
  for (const prefix of prefixes) store.clearPrefix(prefix);
  return jsonResponse({ ok: true });
}

async function parseJsonBody(
  request: Request,
  maxBodyBytes: number,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  const declaredLength = request.headers.get("Content-Length");
  if (declaredLength && Number(declaredLength) > maxBodyBytes) {
    return { ok: false, response: bodyTooLarge(maxBodyBytes) };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBodyBytes) {
    return { ok: false, response: bodyTooLarge(maxBodyBytes) };
  }
  if (!text.trim()) return { ok: true, value: {} };
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "invalid_json", "Request body must be valid JSON."),
    };
  }
}

function bodyTooLarge(maxBodyBytes: number): Response {
  return errorResponse(
    413,
    "body_too_large",
    `Request body exceeds the ${maxBodyBytes} byte limit.`,
  );
}

function methodNotAllowed(method: string, allowed: string): Response {
  return errorResponse(
    405,
    "method_not_allowed",
    `Method ${method} is not allowed for this route.`,
    {
      Allow: allowed,
    },
  );
}

function jsonResponse(value: unknown, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

function withCors(response: Response, corsHeaders: Headers | undefined): Response {
  if (!corsHeaders) return response;
  const headers = new Headers(response.headers);
  corsHeaders.forEach((value, name) => headers.set(name, value));
  return new Response(response.body, { status: response.status, headers });
}

function corsHeadersFor(origin: string): Headers {
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  });
}

function isAllowedOrigin(origin: string, configuredOrigins: readonly string[]): boolean {
  if (configuredOrigins.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    return (
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "[::1]")
    );
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNodeBody(request: Connect.IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}
