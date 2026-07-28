export type JsonPrimitive = boolean | null | number | string;

export type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject;

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export function isJsonValue(value: unknown): value is JsonValue {
  try {
    return isJsonValueInternal(value, new WeakSet<object>());
  } catch {
    return false;
  }
}

function isJsonValueInternal(value: unknown, ancestors: WeakSet<object>): boolean {
  if (value === null) return true;

  switch (typeof value) {
    case "boolean":
    case "string":
      return true;
    case "number":
      return Number.isFinite(value);
    case "object":
      break;
    default:
      return false;
  }

  if (ancestors.has(value)) return false;
  ancestors.add(value);

  try {
    if (Array.isArray(value)) {
      return value.every((item) => isJsonValueInternal(item, ancestors));
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return false;

    const record = value as Record<string, unknown>;
    return Object.keys(record).every((key) => isJsonValueInternal(record[key], ancestors));
  } finally {
    ancestors.delete(value);
  }
}
