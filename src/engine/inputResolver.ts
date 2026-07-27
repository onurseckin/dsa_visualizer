export function resolveInput(input: unknown, defaultInput: unknown): unknown {
  if (input === null || input === undefined) {
    return defaultInput;
  }
  if (typeof input !== "string") {
    return input;
  }

  const str = input.trim();
  if (!str) return defaultInput;

  // If defaultInput is an Array (e.g. [5, 2, 8, 1, 4])
  if (Array.isArray(defaultInput)) {
    const arrayMatch = str.match(/\[([^\]]*)\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(`[${arrayMatch[1]}]`);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // Fall back
      }
    }
  }

  // If defaultInput is an object (e.g. { nums: [...], target: 9 })
  if (typeof defaultInput === "object" && defaultInput !== null && !Array.isArray(defaultInput)) {
    const obj = { ...(defaultInput as Record<string, unknown>) };
    let modified = false;

    for (const key of Object.keys(obj)) {
      const keyRegex = new RegExp(`${key}\\s*[:=]\\s*([^\n,]+|\\[[^\\]]*\\])`, "i");
      const match = str.match(keyRegex);
      if (match) {
        const valStr = match[1].trim();
        try {
          const parsedVal = JSON.parse(valStr);
          obj[key] = parsedVal;
          modified = true;
        } catch {
          if (!isNaN(Number(valStr))) {
            obj[key] = Number(valStr);
            modified = true;
          } else {
            obj[key] = valStr.replace(/^["']|["']$/g, "");
            modified = true;
          }
        }
      }
    }

    if (modified) {
      return obj;
    }
  }

  // If defaultInput is a number
  if (typeof defaultInput === "number") {
    const numMatch = str.match(/[:=]\s*(-?\d+(\.\d+)?)/) || str.match(/(-?\d+(\.\d+)?)/);
    if (numMatch) {
      const parsedNum = Number(numMatch[1]);
      if (!isNaN(parsedNum)) return parsedNum;
    }
  }

  // If defaultInput is a string
  if (typeof defaultInput === "string") {
    const strMatch = str.match(/[:=]\s*["']?([^"',\n]+)["']?/) || str.match(/["']([^"']+)["']/);
    if (strMatch) {
      return strMatch[1];
    }
    return str;
  }

  // Fallback try JSON parse
  try {
    return JSON.parse(str);
  } catch {
    return defaultInput;
  }
}
