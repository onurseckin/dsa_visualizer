import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface FastSubwordLatticeViterbiBeamInput {
  text: string;
  tokenCosts: Record<string, number>; // token string -> negative log-prob cost
  beamSize: number;
}

export const DEFAULT_VITERBI_BEAM_INPUT: FastSubwordLatticeViterbiBeamInput = {
  text: "unwanted",
  tokenCosts: {
    un: 1.0,
    want: 1.5,
    ed: 1.0,
    unwant: 4.0,
    wanted: 3.5,
    u: 3.0,
    n: 3.0,
    w: 3.0,
    a: 3.0,
    t: 3.0,
    e: 3.0,
    d: 3.0,
  },
  beamSize: 2,
};

export const FAST_SUBWORD_LATTICE_VITERBI_BEAM_CODE = `import math

def viterbi_beam_subword_segment(text: str, token_costs: dict[str, float], beam_size: int = 2) -> list[str]:
    N = len(text)
    dp = [[] for _ in range(N + 1)]
    dp[0] = [(0.0, [])]

    for i in range(N):
        if not dp[i]:
            continue

        for total_cost, path in dp[i]:
            for j in range(i + 1, N + 1):
                sub = text[i:j]
                if sub in token_costs:
                    cost = token_costs[sub]
                    new_cost = total_cost + cost
                    new_path = path + [sub]
                    dp[j].append((new_cost, new_path))

        for j in range(i + 1, N + 1):
            if dp[j]:
                dp[j].sort(key=lambda x: x[0])
                dp[j] = dp[j][:beam_size]

    best_path = dp[N][0][1] if dp[N] else []
    return best_path`;

export const generateViterbiBeamSteps = (
  input: FastSubwordLatticeViterbiBeamInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { text, tokenCosts, beamSize } = input;
  let stepIndex = 0;

  const N = text.length;
  const dp: { cost: number; path: string[] }[][] = Array.from({ length: N + 1 }, () => []);
  dp[0] = [{ cost: 0.0, path: [] }];

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Initialize Viterbi Beam Subword Lattice (beamSize = ${beamSize})`,
      why: `Segmenting text "${text}" (length N = ${N}) into subword tokens using beam capacity ${beamSize}. Set dp[0] = [(0.0, [])].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: text.split("").map((ch, idx) => ({
        id: `c-${idx}`,
        value: idx,
        label: `'${ch}'`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        text: `"${text}"`,
        beamSize: String(beamSize),
        status: "Initialized",
        dpBeamAt0: "[(cost: 0.0, path: [])]",
      },
    },
    variables: { N, beamSize },
  });

  for (let i = 0; i < N; i++) {
    if (dp[i].length === 0) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Position i = ${i} ('${text[i]}') has no candidate paths in DP beam`,
          why: `Skipping index ${i} because dp[${i}] is empty (unreachable string position).`,
        },
        primarySnapshot: {
          kind: "array",
          elements: text.split("").map((ch, idx) => ({
            id: `c-${idx}`,
            value: idx,
            label: `'${ch}'`,
            state:
              idx === i
                ? ("pivot" as ElementState)
                : idx < i
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
          })),
        },
        auxiliaryState: {
          customState: {
            currentPos: String(i),
            status: "Skipped (Empty Beam)",
          },
        },
        variables: { i, char: text[i] },
      });
      continue;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Process Position i = ${i} ('${text[i]}')`,
        why: `Evaluating candidate outgoing subwords starting at position ${i}. Beam size at index ${i}: ${dp[i].length}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: text.split("").map((ch, idx) => ({
          id: `c-${idx}`,
          value: idx,
          label: `'${ch}'`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`i=${i}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentPos: String(i),
          char: `'${text[i]}'`,
          beamPathsAtI: dp[i]
            .map((p) => `[${p.path.join("+")}] (cost: ${p.cost.toFixed(2)})`)
            .join("; "),
        },
      },
      variables: { i, char: text[i] },
    });

    let foundMatchAtI = false;

    for (const { cost: totalCost, path } of dp[i]) {
      for (let j = i + 1; j <= N; j++) {
        const sub = text.substring(i, j);
        if (sub in tokenCosts) {
          foundMatchAtI = true;
          const cost = tokenCosts[sub];
          const newCost = totalCost + cost;
          const newPath = [...path, sub];
          dp[j].push({ cost: newCost, path: newPath });

          steps.push({
            stepIndex: stepIndex++,
            codeLine: 19,
            explanation: {
              what: `Found subword match "${sub}" from index ${i} to ${j} (cost = ${cost.toFixed(2)})`,
              why: `Extending path [${path.join(", ")}] with token "${sub}". New cumulative cost = ${newCost.toFixed(2)}. Appending to dp[${j}].`,
            },
            primarySnapshot: {
              kind: "array",
              elements: text.split("").map((ch, idx) => ({
                id: `c-${idx}`,
                value: idx,
                label: `'${ch}'`,
                state:
                  idx >= i && idx < j
                    ? ("compare" as ElementState)
                    : idx < i
                      ? ("visited" as ElementState)
                      : ("default" as ElementState),
                pointers: idx === i ? [`i=${i}`] : idx === j - 1 ? [`j-1=${j - 1}`] : [],
              })),
            },
            auxiliaryState: {
              customState: {
                currentPos: String(i),
                subword: `"${sub}"`,
                subwordCost: cost.toFixed(2),
                newCost: newCost.toFixed(2),
                extendedPath: `[${newPath.join(", ")}]`,
                targetIndex: String(j),
              },
            },
            variables: { i, j, sub, cost, newCost },
          });
        }
      }
    }

    for (let j = i + 1; j <= N; j++) {
      if (dp[j].length > 0) {
        dp[j].sort((a, b) => a.cost - b.cost);
        dp[j] = dp[j].slice(0, beamSize);
      }
    }

    if (foundMatchAtI) {
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 24,
        explanation: {
          what: `Prune beam candidates for reachable indices after position ${i}`,
          why: `Sorted candidate paths at indices ${i + 1}..${N} by total cost and kept top ${beamSize} paths per position.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: text.split("").map((ch, idx) => ({
            id: `c-${idx}`,
            value: idx,
            label: `'${ch}'`,
            state: idx <= i ? ("visited" as ElementState) : ("default" as ElementState),
          })),
        },
        auxiliaryState: {
          customState: {
            currentPos: String(i),
            beamSize: String(beamSize),
            status: `Beam Pruned (max capacity B=${beamSize})`,
          },
        },
        variables: { i, beamSize },
      });
    }
  }

  const bestResult = dp[N] && dp[N].length > 0 ? dp[N][0] : null;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: bestResult
        ? `Viterbi Beam Search Complete: Best Path [${bestResult.path.join(", ")}]`
        : `Viterbi Beam Search Complete: No valid segmentation path found`,
      why: bestResult
        ? `Optimal low-cost subword path found: [${bestResult.path.join(
            ", ",
          )}] with total cost ${bestResult.cost.toFixed(2)}.`
        : `No subword tokens matched the end of text index ${N}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: (bestResult?.path || text.split("")).map((tok, rank) => ({
        id: `tok-${rank}`,
        value: rank,
        label: bestResult ? `"${tok}"` : `'${tok}'`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        optimalSegmentation: bestResult ? bestResult.path.map((t) => `"${t}"`).join(" + ") : "None",
        totalCost: bestResult ? bestResult.cost.toFixed(2) : "N/A",
        status: "Completed",
      },
    },
    variables: { optimalCost: bestResult?.cost ?? -1, complete: true },
  });

  return steps;
};

export const fastSubwordLatticeViterbiBeam: AlgorithmDefinition<FastSubwordLatticeViterbiBeamInput> =
  {
    id: "fast-subword-lattice-viterbi-beam",
    title: "Fast Subword Lattice Viterbi Beam Search",
    topicIds: ["ml_tokenization", "dp_1d"],
    difficulty: "Hard",
    description:
      "Subword lattice Viterbi beam search engine used by SentencePiece / Unigram LM tokenizers (Kudo, 2018). Maintained by a beam capacity priority queue per character position, this algorithm finds the minimum negative log-likelihood subword segmentation path in bounded O(N * B * L_max) time.\n\nInput Format:\n- text: Input text string to segment.\n- tokenCosts: Dictionary mapping candidate token string to float cost (-log P(t)).\n- beamSize: Priority beam capacity size B.\n\nOutput Format:\n- Returns list of optimal subword token strings `[t_1, t_2, ..., t_K]`.",
    constraints: [
      "beamSize >= 1.",
      "tokenCosts must contain character fallbacks to ensure full text coverage.",
    ],
    examples: [
      {
        kind: "basic",
        title: "Segmenting 'unwanted' into Subwords",
        inputDisplay: "text = 'unwanted', beamSize = 2",
        outputDisplay: "Segmentation: ['un', 'want', 'ed'] (Cost 3.5)",
        input: DEFAULT_VITERBI_BEAM_INPUT,
        output: "['un', 'want', 'ed']",
        explanation: "Finds minimum cost path 'un' (1.0) + 'want' (1.5) + 'ed' (1.0) = 3.5.",
      },
      {
        kind: "complex",
        title: "Narrow Beam Pruning (beamSize = 1)",
        inputDisplay: "beamSize = 1",
        outputDisplay: "Segmentation: ['un', 'want', 'ed']",
        input: {
          ...DEFAULT_VITERBI_BEAM_INPUT,
          beamSize: 1,
        },
        output: "['un', 'want', 'ed']",
        explanation: "Pure Viterbi 1-best dynamic programming.",
      },
      {
        kind: "negative",
        title: "Fallback to Single Characters",
        inputDisplay: "No multi-char tokens available",
        outputDisplay: "Character-by-character tokens",
        input: {
          text: "un",
          tokenCosts: { u: 3.0, n: 3.0 },
          beamSize: 2,
        },
        output: "['u', 'n']",
        explanation:
          "Falls back to individual character tokens when no multi-character subwords match.",
      },
    ],
    defaultInput: DEFAULT_VITERBI_BEAM_INPUT,
    code: FAST_SUBWORD_LATTICE_VITERBI_BEAM_CODE,
    timeComplexity: {
      best: "O(N * B * L_max)",
      average: "O(N * B * L_max)",
      worst: "O(N * B * L_max)",
    },
    spaceComplexity: "O(N * B)",
    complexityAnalysis: {
      time: "O(N * B * L_max) where N is text length, B is beam size, and L_max is maximum subword token length.",
      space: "O(N * B) auxiliary space to store beam paths at each character index position.",
    },
    topicGuide: {
      overview:
        "SentencePiece / Unigram LM tokenizers (Kudo 2018, Taku Kudo) model text segmentation probabilistically as a Directed Acyclic Graph (DAG) lattice. Viterbi beam search finds the sequence of subwords that maximizes total sequence likelihood P(S) = prod_{t in S} P(t).",
      sections: [
        {
          heading: "Core Concept & Subword DAG Lattice",
          body: "Characters 0..N form graph vertices. Valid vocabulary tokens form directed edges (i, j) with weight -log P(t). The Viterbi algorithm computes the shortest path through the DAG.",
        },
        {
          heading: "Beam Search Pruning (B)",
          body: "To prevent memory growth when text length N is large, beam search caps the number of candidate paths at each character vertex to B, trading negligible optimality for guaranteed linear runtime.",
        },
        {
          heading: "BPE vs Unigram LM Viterbi",
          body: "Unlike BPE which applies deterministic greedy merge rules, Unigram LM Viterbi evaluates all valid segmentations probabilistically, supporting stochastic sampling (Subword Regularization) during training.",
        },
      ],
      keyTerms: [
        {
          term: "Subword Lattice",
          definition: "DAG representing all valid token segmentation paths over an input string.",
        },
        {
          term: "Viterbi Algorithm",
          definition:
            "Dynamic programming algorithm for finding the most likely sequence of hidden states.",
        },
        {
          term: "Subword Regularization",
          definition:
            "Sampling non-optimal subword segmentations from the Viterbi lattice during model training to boost robustness.",
        },
      ],
    },
    sources: [
      { type: "ml_infra", kind: "ml_infra", label: "SentencePiece & Unigram LM (Kudo ACL 2018)" },
    ],
    generateSteps: generateViterbiBeamSteps,
  };
