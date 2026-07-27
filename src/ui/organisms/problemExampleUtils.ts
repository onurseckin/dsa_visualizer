import type { ProblemExample } from "../../types/dsa";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseNumericIfPossible(val: unknown): unknown {
  if (typeof val === "string" && /^-?\d+$/.test(val)) {
    return parseInt(val, 10);
  }
  return val;
}

function sanitizeKey(key: string): string {
  const map: Record<string, string> = {
    pVal: "p",
    qVal: "q",
    targetVal: "target",
    kVal: "k",
    nVal: "n",
  };
  return map[key] ?? key;
}

export function formatVal(val: unknown, isObjectPropertyValue = false): string {
  if (val === null) {
    return "null";
  }
  if (val === undefined) {
    return "";
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  if (typeof val === "string") {
    if (isObjectPropertyValue) {
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        return val;
      }
      return JSON.stringify(val);
    }
    return val;
  }
  if (Array.isArray(val)) {
    return JSON.stringify(val).replace(/,/g, ", ");
  }
  if (isRecord(val)) {
    return JSON.stringify(val).replace(/,/g, ", ");
  }
  return String(val);
}

function buildTreeArrayFromNodes(
  nodes: Record<string, unknown>[],
  rootId?: string
): (unknown | null)[] {
  const nodeMap = new Map<string, Record<string, unknown>>();
  const childIds = new Set<string>();

  for (const node of nodes) {
    const id = String(node.id ?? node.val ?? "");
    nodeMap.set(id, node);

    if (node.leftId !== undefined && node.leftId !== null) childIds.add(String(node.leftId));
    if (node.left !== undefined && node.left !== null && typeof node.left !== "object") {
      childIds.add(String(node.left));
    }
    if (node.rightId !== undefined && node.rightId !== null) childIds.add(String(node.rightId));
    if (node.right !== undefined && node.right !== null && typeof node.right !== "object") {
      childIds.add(String(node.right));
    }
  }

  let startId = rootId !== undefined && rootId !== null ? String(rootId) : undefined;
  if (!startId || !nodeMap.has(startId)) {
    for (const node of nodes) {
      const id = String(node.id ?? node.val ?? "");
      if (!childIds.has(id)) {
        startId = id;
        break;
      }
    }
  }

  if (!startId || !nodeMap.has(startId)) {
    if (nodes.length > 0) {
      startId = String(nodes[0].id ?? nodes[0].val ?? "");
    } else {
      return [];
    }
  }

  const queue: (string | null)[] = [startId];
  const result: (unknown | null)[] = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (currentId === null || currentId === undefined) {
      result.push(null);
      continue;
    }

    const node = nodeMap.get(currentId);
    if (!node) {
      result.push(null);
      continue;
    }

    const val = node.val ?? node.value ?? node.id;
    result.push(val);

    const left =
      node.leftId ??
      (typeof node.left !== "object"
        ? node.left
        : isRecord(node.left)
          ? node.left.id ?? node.left.val
          : null);
    const right =
      node.rightId ??
      (typeof node.right !== "object"
        ? node.right
        : isRecord(node.right)
          ? node.right.id ?? node.right.val
          : null);

    queue.push(left !== undefined && left !== null ? String(left) : null);
    queue.push(right !== undefined && right !== null ? String(right) : null);
  }

  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }

  return result;
}

function tryFormatTree(obj: Record<string, unknown>): { formatted: string; extraKeys: string[] } | null {
  if ("root" in obj) {
    const root = obj.root;
    let treeArrayStr = "";
    if (Array.isArray(root)) {
      treeArrayStr = formatVal(root);
    } else if (isRecord(root)) {
      const nodes: Record<string, unknown>[] = [];
      const collect = (curr: Record<string, unknown>): string => {
        const id = String(curr.id ?? curr.val ?? nodes.length);
        const nodeObj: Record<string, unknown> = { id, val: curr.val ?? curr.value ?? id };
        nodes.push(nodeObj);
        if (isRecord(curr.left)) {
          nodeObj.leftId = collect(curr.left);
        }
        if (isRecord(curr.right)) {
          nodeObj.rightId = collect(curr.right);
        }
        return id;
      };
      const rootId = collect(root);
      const arr = buildTreeArrayFromNodes(nodes, rootId);
      treeArrayStr = formatVal(arr);
    } else {
      treeArrayStr = formatVal(root);
    }
    return { formatted: `root = ${treeArrayStr}`, extraKeys: ["root", "rootId", "nodes"] };
  }

  if (Array.isArray(obj.nodes) && obj.nodes.length > 0) {
    const firstNode = obj.nodes[0];
    if (
      isRecord(firstNode) &&
      ("leftId" in firstNode || "rightId" in firstNode || "left" in firstNode || "right" in firstNode)
    ) {
      const nodeRecords: Record<string, unknown>[] = obj.nodes.filter(isRecord);
      const rootId = typeof obj.rootId === "string" || typeof obj.rootId === "number" ? String(obj.rootId) : undefined;
      const arr = buildTreeArrayFromNodes(nodeRecords, rootId);
      return { formatted: `root = ${formatVal(arr)}`, extraKeys: ["root", "rootId", "nodes"] };
    }
  }

  return null;
}

function tryFormatLinkedList(obj: Record<string, unknown>): { formatted: string; extraKeys: string[] } | null {
  if ("head" in obj) {
    const head = obj.head;
    let listArrayStr = "";
    if (Array.isArray(head)) {
      listArrayStr = formatVal(head);
    } else if (isRecord(head)) {
      const arr: unknown[] = [];
      let curr: unknown = head;
      while (isRecord(curr)) {
        arr.push(curr.val ?? curr.value);
        curr = curr.next;
      }
      listArrayStr = formatVal(arr);
    } else {
      listArrayStr = formatVal(head);
    }
    return { formatted: `head = ${listArrayStr}`, extraKeys: ["head", "headId", "nodes"] };
  }

  if (Array.isArray(obj.nodes) && obj.nodes.length > 0) {
    const firstNode = obj.nodes[0];
    if (isRecord(firstNode) && ("nextId" in firstNode || ("next" in firstNode && !("left" in firstNode)))) {
      const nodeRecords: Record<string, unknown>[] = obj.nodes.filter(isRecord);
      const nodeMap = new Map<string, Record<string, unknown>>();
      const pointedTo = new Set<string>();

      for (const n of nodeRecords) {
        const id = String(n.id ?? n.val ?? "");
        nodeMap.set(id, n);
        const nextTarget = n.nextId ?? (typeof n.next !== "object" ? n.next : (n.next as Record<string, unknown>)?.id);
        if (nextTarget !== undefined && nextTarget !== null) {
          pointedTo.add(String(nextTarget));
        }
      }

      let startId = typeof obj.headId === "string" || typeof obj.headId === "number" ? String(obj.headId) : undefined;
      if (!startId || !nodeMap.has(startId)) {
        for (const n of nodeRecords) {
          const id = String(n.id ?? n.val ?? "");
          if (!pointedTo.has(id)) {
            startId = id;
            break;
          }
        }
      }
      if (!startId && nodeRecords.length > 0) {
        startId = String(nodeRecords[0].id ?? nodeRecords[0].val ?? "");
      }

      const arr: unknown[] = [];
      const visited = new Set<string>();
      let currId: string | undefined = startId;

      while (currId && nodeMap.has(currId) && !visited.has(currId)) {
        visited.add(currId);
        const node = nodeMap.get(currId)!;
        arr.push(node.val ?? node.value ?? node.id);
        const nextTarget = node.nextId ?? (typeof node.next !== "object" ? node.next : (node.next as Record<string, unknown>)?.id);
        currId = nextTarget !== undefined && nextTarget !== null ? String(nextTarget) : undefined;
      }

      return { formatted: `head = ${formatVal(arr)}`, extraKeys: ["head", "headId", "nodes"] };
    }
  }

  return null;
}

function tryFormatGraph(obj: Record<string, unknown>): { formatted: string; extraKeys: string[] } | null {
  const gridKey = ["grid", "matrix", "board"].find((k) => k in obj && Array.isArray(obj[k]));
  if (gridKey) {
    const formatted = `${gridKey} = ${formatVal(obj[gridKey])}`;
    return { formatted, extraKeys: [gridKey] };
  }

  if ("edges" in obj && Array.isArray(obj.edges)) {
    const edgesArr = obj.edges.map((e) => {
      if (isRecord(e)) {
        const from = parseNumericIfPossible(e.from);
        const to = parseNumericIfPossible(e.to);
        if ("weight" in e && e.weight !== undefined) {
          return [from, to, parseNumericIfPossible(e.weight)];
        }
        return [from, to];
      }
      return e;
    });

    const formattedEdges = `edges = ${formatVal(edgesArr)}`;
    const extraKeys = ["edges"];

    if ("n" in obj && typeof obj.n === "number") {
      extraKeys.push("n");
      return { formatted: `n = ${obj.n}, ${formattedEdges}`, extraKeys };
    }

    if ("nodes" in obj && Array.isArray(obj.nodes)) {
      extraKeys.push("nodes");
      return { formatted: `n = ${obj.nodes.length}, ${formattedEdges}`, extraKeys };
    }

    return { formatted: formattedEdges, extraKeys };
  }

  return null;
}

export function formatExampleInput(example: ProblemExample): string {
  if (!example) return "";

  if (example.inputDisplay && example.inputDisplay.trim() !== "") {
    return example.inputDisplay;
  }

  const rawInput = example.inputValue ?? example.input;
  if (rawInput === undefined || rawInput === null) {
    return "";
  }

  let inputObj: unknown = rawInput;

  if (typeof rawInput === "string") {
    const trimmed = rawInput.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        inputObj = JSON.parse(trimmed);
      } catch {
        return rawInput;
      }
    } else {
      return rawInput;
    }
  }

  if (!isRecord(inputObj)) {
    return formatVal(inputObj);
  }

  let primaryPart: { formatted: string; extraKeys: string[] } | null = null;

  primaryPart = tryFormatTree(inputObj);
  if (!primaryPart) {
    primaryPart = tryFormatLinkedList(inputObj);
  }
  if (!primaryPart) {
    primaryPart = tryFormatGraph(inputObj);
  }

  const usedKeys = new Set<string>([
    "id",
    "kind",
    "state",
    "title",
    ...(primaryPart ? primaryPart.extraKeys : []),
  ]);

  const additionalParts: string[] = [];
  for (const [key, val] of Object.entries(inputObj)) {
    if (usedKeys.has(key)) continue;
    const cleanKey = sanitizeKey(key);
    additionalParts.push(`${cleanKey} = ${formatVal(val, true)}`);
  }

  if (primaryPart) {
    if (additionalParts.length > 0) {
      return `${primaryPart.formatted}, ${additionalParts.join(", ")}`;
    }
    return primaryPart.formatted;
  }

  return additionalParts.length > 0 ? additionalParts.join(", ") : formatVal(inputObj);
}

export function formatExampleOutput(exampleOrOutput: ProblemExample | unknown): string {
  if (exampleOrOutput === null || exampleOrOutput === undefined) {
    return "";
  }

  if (isRecord(exampleOrOutput) && ("output" in exampleOrOutput || "outputDisplay" in exampleOrOutput)) {
    const example = exampleOrOutput as unknown as ProblemExample;
    if (example.outputDisplay && example.outputDisplay.trim() !== "") {
      return example.outputDisplay;
    }
    if (example.output !== undefined && example.output !== null) {
      return formatVal(example.output);
    }
    return "";
  }

  return formatVal(exampleOrOutput);
}
