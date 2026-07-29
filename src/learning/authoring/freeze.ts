export function deepFreezeCopy<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry) => deepFreezeCopy(entry))) as T;
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }

  const copy = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, deepFreezeCopy(entry)]),
  );
  return Object.freeze(copy) as T;
}
