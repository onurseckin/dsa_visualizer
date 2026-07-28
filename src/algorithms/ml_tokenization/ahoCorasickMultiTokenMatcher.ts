import {
  AlgorithmDefinition,
  AlgorithmStep,
  ElementState,
  GraphEdgeItem,
  GraphNodeItem,
} from "../../types/dsa";

export interface AhoCorasickMultiTokenMatcherInput {
  text: string;
  keywords: string[];
}

export const DEFAULT_AHO_CORASICK_INPUT: AhoCorasickMultiTokenMatcherInput = {
  text: "hehersher",
  keywords: ["he", "she", "his", "hers"],
};

export const AHO_CORASICK_CODE = `from collections import deque

def aho_corasick_match(text: str, keywords: list[str]) -> list[tuple[int, int, str]]:
    trie = [{"children": {}, "fail": 0, "output": []}]

    for kw in keywords:
        curr = 0
        for char in kw:
            if char not in trie[curr]["children"]:
                trie.append({"children": {}, "fail": 0, "output": []})
                trie[curr]["children"][char] = len(trie) - 1
            curr = trie[curr]["children"][char]
        trie[curr]["output"].append(kw)

    queue = deque()
    for char, child_node in trie[0]["children"].items():
        queue.append(child_node)

    while queue:
        r = queue.popleft()
        for char, child_node in trie[r]["children"].items():
            queue.append(child_node)
            f = trie[r]["fail"]
            while f > 0 and char not in trie[f]["children"]:
                f = trie[f]["fail"]
            trie[child_node]["fail"] = trie[f]["children"].get(char, 0)
            trie[child_node]["output"].extend(trie[trie[child_node]["fail"]]["output"])

    matches = []
    curr = 0
    for idx, char in enumerate(text):
        while curr > 0 and char not in trie[curr]["children"]:
            curr = trie[curr]["fail"]
        curr = trie[curr]["children"].get(char, 0)

        for kw in trie[curr]["output"]:
            start_idx = idx - len(kw) + 1
            matches.append((start_idx, idx, kw))

    return matches`;

interface InternalTrieNode {
  id: number;
  char: string;
  depth: number;
  children: Record<string, number>;
  fail: number;
  output: string[];
}

function buildGraphSnapshot(
  trie: InternalTrieNode[],
  activeNodeId: number | null,
  visitedNodes: Set<number>,
  queuedNodes: Set<number>,
  matchedNodes: Set<number>,
  highlightEdge?: { from: number; to: number } | null,
) {
  const depthGroups = new Map<number, number[]>();
  for (const node of trie) {
    const group = depthGroups.get(node.depth) || [];
    group.push(node.id);
    depthGroups.set(node.depth, group);
  }

  const nodes: GraphNodeItem[] = [];
  const edges: GraphEdgeItem[] = [];

  for (const node of trie) {
    const group = depthGroups.get(node.depth) || [node.id];
    const indexInDepth = group.indexOf(node.id);
    const countInDepth = group.length;

    const canvasW = 800;
    const marginX = 80;
    const stepX = countInDepth > 1 ? (canvasW - 2 * marginX) / (countInDepth - 1) : 0;
    const x = countInDepth === 1 ? canvasW / 2 : marginX + indexInDepth * stepX;
    const y = 60 + node.depth * 90;

    let state: ElementState = "default";
    if (node.id === activeNodeId) {
      state = "active";
    } else if (matchedNodes.has(node.id)) {
      state = "sorted";
    } else if (queuedNodes.has(node.id)) {
      state = "queued";
    } else if (visitedNodes.has(node.id)) {
      state = "visited";
    }

    const label =
      node.id === 0
        ? "0: root"
        : `${node.id}: '${node.char}'${
            node.output.length > 0 ? ` [${node.output.join(",")}]` : ""
          }`;

    nodes.push({
      id: `node-${node.id}`,
      label,
      x,
      y,
      state,
      val: node.id,
    });

    for (const [childChar, childId] of Object.entries(node.children)) {
      const isHighlighted =
        highlightEdge && highlightEdge.from === node.id && highlightEdge.to === childId;

      edges.push({
        from: `node-${node.id}`,
        to: `node-${childId}`,
        weight: childChar.charCodeAt(0),
        isPath: Boolean(isHighlighted),
        isTraversed: visitedNodes.has(childId) || matchedNodes.has(childId),
      });
    }
  }

  return {
    kind: "graph" as const,
    nodes,
    edges,
  };
}

export const generateAhoCorasickSteps = (
  input: AhoCorasickMultiTokenMatcherInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, keywords } = input;
  let stepIndex = 0;

  const trie: InternalTrieNode[] = [
    { id: 0, char: "root", depth: 0, children: {}, fail: 0, output: [] },
  ];

  const visitedNodes = new Set<number>([0]);
  const queuedNodes = new Set<number>();
  const matchedNodes = new Set<number>();

  // Step 1: Init Trie Root
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Trie Root Node (State 0)",
      why: `Constructing Aho-Corasick finite-state automaton for patterns [${keywords
        .map((k) => `"${k}"`)
        .join(", ")}]. State 0 represents root prefix.`,
    },
    primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
    auxiliaryState: {
      customState: {
        phase: "Phase 1: Trie Construction",
        keywords: keywords.join(", "),
        trieNodeCount: "1",
        status: "Initialized Trie root",
      },
    },
    variables: { numKeywords: keywords.length, textLen: text.length, numTrieNodes: 1 },
  });

  // Phase 1: Build Trie structure
  for (const kw of keywords) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Select keyword "${kw}" for Trie insertion`,
        why: `Iterate characters in "${kw}" starting from automaton root state 0.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        customState: {
          phase: "Phase 1: Trie Construction",
          currentKeyword: kw,
          status: `Inserting "${kw}"`,
        },
      },
      variables: { kw, curr: 0 },
    });

    let curr = 0;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Set current state pointer to root (State 0)`,
        why: `Begin inserting pattern "${kw}" from the root state.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        customState: {
          phase: "Phase 1: Trie Construction",
          currentKeyword: kw,
          currState: "Node 0 (root)",
        },
      },
      variables: { kw, curr },
    });

    for (let cIdx = 0; cIdx < kw.length; cIdx++) {
      const char = kw[cIdx];

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Inspect character '${char}' (position ${cIdx} in "${kw}")`,
          why: `Check if state ${curr} already has an outgoing transition edge labeled '${char}'.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          customState: {
            phase: "Phase 1: Trie Construction",
            currentKeyword: kw,
            char,
            currState: `Node ${curr}`,
          },
        },
        variables: { kw, curr, char },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 8,
        explanation: {
          what: `Check if '${char}' is in state ${curr} children: ${
            trie[curr].children[char] !== undefined ? "YES" : "NO"
          }`,
          why:
            trie[curr].children[char] !== undefined
              ? `Transition edge for '${char}' exists pointing to state ${trie[curr].children[char]}.`
              : `No existing transition edge for '${char}' at state ${curr}; allocating new node.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          customState: {
            phase: "Phase 1: Trie Construction",
            currentKeyword: kw,
            char,
            hasTransition: trie[curr].children[char] !== undefined ? "Yes" : "No",
          },
        },
        variables: { kw, curr, char },
      });

      if (trie[curr].children[char] === undefined) {
        const newId = trie.length;
        const newDepth = trie[curr].depth + 1;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 9,
          explanation: {
            what: `Append new state Node ${newId} (char '${char}', depth ${newDepth})`,
            why: `Allocate node for character '${char}' in Trie path.`,
          },
          primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
          auxiliaryState: {
            customState: {
              phase: "Phase 1: Trie Construction",
              currentKeyword: kw,
              newNodeId: String(newId),
            },
          },
          variables: { kw, curr, char, newId },
        });

        trie[curr].children[char] = newId;
        trie.push({
          id: newId,
          char,
          depth: newDepth,
          children: {},
          fail: 0,
          output: [],
        });
        visitedNodes.add(newId);

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 10,
          explanation: {
            what: `Set transition trie[${curr}]["children"]['${char}'] = ${newId}`,
            why: `Add directed Trie edge from parent state ${curr} to child state ${newId}.`,
          },
          primarySnapshot: buildGraphSnapshot(
            trie,
            newId,
            visitedNodes,
            queuedNodes,
            matchedNodes,
            { from: curr, to: newId },
          ),
          auxiliaryState: {
            customState: {
              phase: "Phase 1: Trie Construction",
              currentKeyword: kw,
              addedEdge: `Node ${curr} --'${char}'--> Node ${newId}`,
            },
          },
          variables: { kw, curr, char, newId },
        });
      }

      curr = trie[curr].children[char];

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 11,
        explanation: {
          what: `Advance state pointer to state ${curr}`,
          why: `Follow edge labeled '${char}' to state ${curr}.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          customState: {
            phase: "Phase 1: Trie Construction",
            currentKeyword: kw,
            currState: `Node ${curr}`,
          },
        },
        variables: { kw, curr, char },
      });
    }

    trie[curr].output.push(kw);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Append keyword "${kw}" to state ${curr} output dictionary`,
        why: `Reaching state ${curr} signifies an exact match for dictionary token "${kw}".`,
      },
      primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        customState: {
          phase: "Phase 1: Trie Construction",
          currentKeyword: kw,
          acceptingState: `Node ${curr}`,
          nodeOutputs: trie[curr].output.join(", "),
        },
      },
      variables: { kw, curr, outputCount: trie[curr].output.length },
    });
  }

  // Phase 2: Build Failure Links via BFS
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: "Initialize Queue for BFS Failure Link Construction",
      why: "BFS level-by-level processing guarantees failure links point to shorter, already-computed suffix states.",
    },
    primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
    auxiliaryState: {
      queue: [],
      customState: {
        phase: "Phase 2: BFS Failure Links",
        status: "BFS Queue Initialized",
      },
    },
    variables: { queueLength: 0 },
  });

  const queue: number[] = [];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: "Iterate direct children of root state 0",
      why: "Root's immediate children correspond to single-character prefixes; their failure fallback is root 0.",
    },
    primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
    auxiliaryState: {
      queue: [],
      customState: {
        phase: "Phase 2: BFS Failure Links",
        rootChildren: Object.values(trie[0].children).join(", "),
      },
    },
    variables: { rootChildCount: Object.keys(trie[0].children).length },
  });

  for (const childId of Object.values(trie[0].children)) {
    queue.push(childId);
    queuedNodes.add(childId);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Enqueue root child state ${childId}`,
        why: `Depth-1 state ${childId} has fail transition = 0. Enqueued to compute failure links for its subtrees.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, childId, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        queue: queue.map((id) => `Node ${id}`),
        customState: {
          phase: "Phase 2: BFS Failure Links",
          enqueued: `Node ${childId}`,
          failLink: `fail(${childId}) = 0`,
        },
      },
      variables: { enqueuedId: childId, queueLength: queue.length },
    });
  }

  while (queue.length > 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Check BFS Queue (Length: ${queue.length})`,
        why: `Continue popping states from queue to calculate failure and output transitions.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, queue[0], visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        queue: queue.map((id) => `Node ${id}`),
        customState: {
          phase: "Phase 2: BFS Failure Links",
          queueSize: String(queue.length),
        },
      },
      variables: { queueLength: queue.length },
    });

    const r = queue.shift()!;
    queuedNodes.delete(r);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Pop state ${r} from BFS Queue`,
        why: `Process failure transitions for all outgoing children of state ${r}.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, r, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        queue: queue.map((id) => `Node ${id}`),
        customState: {
          phase: "Phase 2: BFS Failure Links",
          poppedState: `Node ${r}`,
        },
      },
      variables: { r, queueLength: queue.length },
    });

    for (const [char, childId] of Object.entries(trie[r].children)) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 20,
        explanation: {
          what: `Inspect child state ${childId} via char '${char}' from state ${r}`,
          why: `Calculate failure pointer fail(${childId}) using parent failure link fail(${r}).`,
        },
        primarySnapshot: buildGraphSnapshot(
          trie,
          childId,
          visitedNodes,
          queuedNodes,
          matchedNodes,
          { from: r, to: childId },
        ),
        auxiliaryState: {
          queue: queue.map((id) => `Node ${id}`),
          customState: {
            phase: "Phase 2: BFS Failure Links",
            parentState: `Node ${r}`,
            childState: `Node ${childId}`,
            char,
          },
        },
        variables: { r, childId, char },
      });

      queue.push(childId);
      queuedNodes.add(childId);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 21,
        explanation: {
          what: `Enqueue state ${childId} into BFS queue`,
          why: `State ${childId} will be processed in subsequent BFS depth iteration.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, childId, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          queue: queue.map((id) => `Node ${id}`),
          customState: {
            phase: "Phase 2: BFS Failure Links",
            enqueued: `Node ${childId}`,
          },
        },
        variables: { r, childId, queueLength: queue.length },
      });

      let f = trie[r].fail;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 22,
        explanation: {
          what: `Fetch parent failure link: f = fail(${r}) = ${f}`,
          why: `Parent failure state ${f} represents the longest proper suffix match of state ${r}.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, f, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          queue: queue.map((id) => `Node ${id}`),
          customState: {
            phase: "Phase 2: BFS Failure Links",
            fState: `Node ${f}`,
            parentFail: String(f),
          },
        },
        variables: { r, childId, f },
      });

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 23,
        explanation: {
          what: `Check if f (${f}) > 0 and '${char}' not in children of Node ${f}`,
          why:
            f > 0 && trie[f].children[char] === undefined
              ? `Node ${f} has no edge for '${char}'; must follow failure links further.`
              : `Found matching transition or reached root 0.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, f, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          queue: queue.map((id) => `Node ${id}`),
          customState: {
            phase: "Phase 2: BFS Failure Links",
            fState: `Node ${f}`,
            hasCharEdge: trie[f].children[char] !== undefined ? "Yes" : "No",
          },
        },
        variables: { f, char },
      });

      while (f > 0 && trie[f].children[char] === undefined) {
        const prevF = f;
        f = trie[f].fail;

        steps.push({
          stepIndex: stepIndex++,
          codeLine: 24,
          explanation: {
            what: `Follow failure link from Node ${prevF} to Node ${f}`,
            why: `Node ${prevF} could not match '${char}'; step to next longest suffix state.`,
          },
          primarySnapshot: buildGraphSnapshot(trie, f, visitedNodes, queuedNodes, matchedNodes),
          auxiliaryState: {
            queue: queue.map((id) => `Node ${id}`),
            customState: {
              phase: "Phase 2: BFS Failure Links",
              fallbackFrom: `Node ${prevF}`,
              fallbackTo: `Node ${f}`,
            },
          },
          variables: { prevF, f, char },
        });
      }

      const failTarget = trie[f].children[char] !== undefined ? trie[f].children[char] : 0;
      trie[childId].fail = failTarget;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 25,
        explanation: {
          what: `Set failure pointer fail(Node ${childId}) = Node ${failTarget}`,
          why: `Node ${failTarget} is the longest proper suffix of Node ${childId}'s pattern that forms a valid prefix.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, childId, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          queue: queue.map((id) => `Node ${id}`),
          customState: {
            phase: "Phase 2: BFS Failure Links",
            node: `Node ${childId}`,
            computedFail: `Node ${failTarget}`,
          },
        },
        variables: { childId, failTarget },
      });

      const inheritedOutputs = trie[failTarget].output;
      trie[childId].output.push(...inheritedOutputs);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 26,
        explanation: {
          what: `Merge output dictionary from Node ${failTarget} into Node ${childId}`,
          why:
            inheritedOutputs.length > 0
              ? `Inherited output tokens [${inheritedOutputs
                  .map((k) => `"${k}"`)
                  .join(", ")}] from failure state Node ${failTarget}.`
              : `No extra output tokens to inherit from failure state Node ${failTarget}.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, childId, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          queue: queue.map((id) => `Node ${id}`),
          customState: {
            phase: "Phase 2: BFS Failure Links",
            node: `Node ${childId}`,
            outputList: trie[childId].output.join(", ") || "None",
          },
        },
        variables: { childId, failTarget, outputCount: trie[childId].output.length },
      });
    }
  }

  // Phase 3: Stream match across text
  const matches: { start: number; end: number; kw: string }[] = [];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 28,
    explanation: {
      what: "Initialize matches output list",
      why: "Automaton is fully built. Ready to stream input text and record token matches.",
    },
    primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
    auxiliaryState: {
      customState: {
        phase: "Phase 3: Text Streaming & Matching",
        text,
        matchesFound: "0",
      },
    },
    variables: { matchesCount: 0 },
  });

  let curr = 0;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 29,
    explanation: {
      what: "Set automaton state pointer curr = 0 (root)",
      why: "Begin streaming input text from the automaton initial root state.",
    },
    primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
    auxiliaryState: {
      customState: {
        phase: "Phase 3: Text Streaming & Matching",
        currState: "Node 0 (root)",
      },
    },
    variables: { curr },
  });

  for (let idx = 0; idx < text.length; idx++) {
    const char = text[idx];

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 30,
      explanation: {
        what: `Stream character text[${idx}] = '${char}'`,
        why: `Process character #${idx + 1}/${text.length} through automaton state transitions.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        customState: {
          phase: "Phase 3: Text Streaming & Matching",
          textIndex: String(idx),
          char: `'${char}'`,
          currState: `Node ${curr}`,
        },
      },
      variables: { idx, char, curr },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 31,
      explanation: {
        what: `Check if curr (${curr}) > 0 and '${char}' not in children of Node ${curr}`,
        why:
          curr > 0 && trie[curr].children[char] === undefined
            ? `State ${curr} has no outgoing edge for '${char}'; initiating failure link fallback.`
            : `Transition available or at root 0.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        customState: {
          phase: "Phase 3: Text Streaming & Matching",
          currState: `Node ${curr}`,
          char,
          hasEdge: trie[curr].children[char] !== undefined ? "Yes" : "No",
        },
      },
      variables: { curr, char },
    });

    while (curr > 0 && trie[curr].children[char] === undefined) {
      const prevCurr = curr;
      curr = trie[curr].fail;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 32,
        explanation: {
          what: `Follow failure link: state Node ${prevCurr} --> Node ${curr}`,
          why: `Node ${prevCurr} failed on '${char}'. Fall back to failure state ${curr} representing the longest suffix match.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          customState: {
            phase: "Phase 3: Text Streaming & Matching",
            fallbackFrom: `Node ${prevCurr}`,
            fallbackTo: `Node ${curr}`,
            char,
          },
        },
        variables: { prevCurr, curr, char },
      });
    }

    const nextState = trie[curr].children[char] !== undefined ? trie[curr].children[char] : 0;
    const prevCurr = curr;
    curr = nextState;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 33,
      explanation: {
        what: `Transition to Node ${curr} via char '${char}'`,
        why:
          trie[prevCurr].children[char] !== undefined
            ? `Followed edge '${char}' from state Node ${prevCurr} to state Node ${curr}.`
            : `No match for '${char}'; returned to root state 0.`,
      },
      primarySnapshot: buildGraphSnapshot(
        trie,
        curr,
        visitedNodes,
        queuedNodes,
        matchedNodes,
        prevCurr !== curr ? { from: prevCurr, to: curr } : null,
      ),
      auxiliaryState: {
        customState: {
          phase: "Phase 3: Text Streaming & Matching",
          currState: `Node ${curr}`,
          char,
        },
      },
      variables: { prevCurr, curr, char },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 35,
      explanation: {
        what: `Check dictionary outputs at state Node ${curr}: ${
          trie[curr].output.length > 0 ? trie[curr].output.join(", ") : "None"
        }`,
        why:
          trie[curr].output.length > 0
            ? `State Node ${curr} contains ${trie[curr].output.length} token match(es).`
            : `No token patterns end at state Node ${curr}.`,
      },
      primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
      auxiliaryState: {
        customState: {
          phase: "Phase 3: Text Streaming & Matching",
          currState: `Node ${curr}`,
          outputs: trie[curr].output.join(", ") || "None",
        },
      },
      variables: { curr, outputCount: trie[curr].output.length },
    });

    for (const kw of trie[curr].output) {
      const startIdx = idx - kw.length + 1;

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 36,
        explanation: {
          what: `Calculate match start index: start_idx = ${idx} - ${kw.length} + 1 = ${startIdx}`,
          why: `Pattern "${kw}" ends at text index ${idx}, so it starts at text index ${startIdx}.`,
        },
        primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          customState: {
            phase: "Phase 3: Text Streaming & Matching",
            kw,
            startIdx: String(startIdx),
            endIdx: String(idx),
          },
        },
        variables: { kw, startIdx, idx },
      });

      matches.push({ start: startIdx, end: idx, kw });
      matchedNodes.add(curr);

      steps.push({
        stepIndex: stepIndex++,
        codeLine: 37,
        explanation: {
          what: `Emit Match: "${kw}" at range [${startIdx}..${idx}]`,
          why: `Recorded match #${matches.length} for token "${kw}".`,
        },
        primarySnapshot: buildGraphSnapshot(trie, curr, visitedNodes, queuedNodes, matchedNodes),
        auxiliaryState: {
          customState: {
            phase: "Phase 3: Text Streaming & Matching",
            emittedMatch: `"${kw}"@[${startIdx}..${idx}]`,
            totalMatchesSoFar: String(matches.length),
          },
        },
        variables: { kw, startIdx, idx, totalMatches: matches.length },
      });
    }
  }

  // Step Final: Return matches
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 39,
    explanation: {
      what: `Aho-Corasick Match Complete: Found ${matches.length} Total Occurrences`,
      why: `Scanned text in linear time O(N + M). Emitted matches: [${matches
        .map((m) => `"${m.kw}"@[${m.start}..${m.end}]`)
        .join(", ")}].`,
    },
    primarySnapshot: buildGraphSnapshot(trie, 0, visitedNodes, queuedNodes, matchedNodes),
    auxiliaryState: {
      customState: {
        phase: "Complete",
        totalMatches: String(matches.length),
        matchedTokens: matches.map((m) => `"${m.kw}"@[${m.start}..${m.end}]`).join(", "),
        status: "Completed",
      },
    },
    variables: { totalMatches: matches.length, complete: true },
  });

  return steps;
};

export const ahoCorasickMultiTokenMatcher: AlgorithmDefinition<AhoCorasickMultiTokenMatcherInput> =
  {
    id: "aho-corasick-multi-token-matcher",
    title: "Aho-Corasick Multi-Token Automaton Matcher",
    topicIds: ["ml_tokenization", "tries_and_strings"],
    difficulty: "Hard",
    description:
      "Constructs an Aho-Corasick finite-state automaton (Aho & Corasick, 1975) for multi-pattern token matching. Integrates Trie prefix trees with failure transitions (suffix pointers) and dictionary output links to locate all dictionary token occurrences in linear O(N + M) time.\n\nInput Format:\n- text: Input text string of length N.\n- keywords: List of M dictionary token pattern strings.\n\nOutput Format:\n- Returns list of (startIdx, endIdx, keyword) matches.\n\nEdge Cases & Constraints:\n- Overlapping keywords: Successfully emits all overlapping matches (e.g. 'he' and 'hers').",
    constraints: ["text.length >= 1.", "keywords.length >= 1."],
    examples: [
      {
        kind: "basic",
        title: "Overlapping Multi-Token Matching",
        inputDisplay: "text = 'hehersher', keywords = ['he', 'she', 'his', 'hers']",
        outputDisplay: "Matches: 'he'@[0..1], 'he'@[2..3], 'hers'@[2..5], 'she'@[4..6]",
        input: DEFAULT_AHO_CORASICK_INPUT,
        output: "4 matches found",
        explanation:
          "Finds all overlapping occurrences of dictionary tokens using failure transition links.",
      },
      {
        kind: "complex",
        title: "No Match In Text",
        inputDisplay: "text = 'xyz', keywords = ['abc', 'def']",
        outputDisplay: "No matches found",
        input: { text: "xyz", keywords: ["abc", "def"] },
        output: "[]",
        explanation: "Automaton transitions to root on failure with zero matches.",
      },
      {
        kind: "negative",
        title: "Sub-token Matching Inside Long Words",
        inputDisplay: "text = 'tokenizer', keywords = ['token', 'ize']",
        outputDisplay: "Matches 'token' and 'ize'",
        input: { text: "tokenizer", keywords: ["token", "ize"] },
        output: "['token', 'ize']",
        explanation: "Locates embedded tokens within text.",
      },
    ],
    defaultInput: DEFAULT_AHO_CORASICK_INPUT,
    code: AHO_CORASICK_CODE,
    timeComplexity: {
      best: "O(N + M)",
      average: "O(N + M + Matches)",
      worst: "O(N + M + Matches)",
    },
    spaceComplexity: "O(M * L)",
    complexityAnalysis: {
      time: "O(M * L) to construct Trie automaton (M keywords of length L), plus O(N) linear text scan time.",
      space: "O(M * L) memory to store Trie nodes, failure pointers, and output lists.",
    },
    topicGuide: {
      overview:
        "The Aho-Corasick algorithm (1975) generalizes KMP string matching to multi-pattern dictionaries. In machine learning pipelines (vLLM, HuggingFace, SpaCy), Aho-Corasick is used for fast multi-keyword extraction, regex token filtering, and stop-word detection.",
      sections: [
        {
          heading: "Core Concept & Failure Pointer BFS",
          body: "A Trie of keywords is augmented with failure links constructed via Breadth-First Search (BFS). If a character match fails at node u, the automaton follows fail(u) to the longest proper suffix that is a prefix in the Trie.",
        },
        {
          heading: "Output Link Chain Traversal",
          body: "Output links allow emitting all dictionary matches ending at position i, even when one match is a proper suffix of another (e.g. 'hers' and 'she').",
        },
        {
          heading: "Systems & Deterministic Automaton Optimization",
          body: "Compiling failure links into a fully deterministic transition table (DFA) eliminates runtime failure loops, guaranteeing exactly 1 state transition per input character.",
        },
      ],
      keyTerms: [
        {
          term: "Aho-Corasick Automaton",
          definition:
            "A Trie-based state machine with failure transitions for multi-pattern matching.",
        },
        {
          term: "Failure Link",
          definition:
            "Fallback state pointer directing the automaton to the longest suffix prefix match.",
        },
        {
          term: "Output Link",
          definition: "Direct pointer to dictionary keywords that match at the current state.",
        },
      ],
    },
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Aho-Corasick Algorithm (CACM 1975)" }],
    generateSteps: generateAhoCorasickSteps,
  };
