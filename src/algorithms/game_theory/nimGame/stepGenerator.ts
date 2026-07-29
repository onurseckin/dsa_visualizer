import type { AlgorithmStep, ArrayElement, ElementState } from "../../../types/dsa";
import { createTutorialStep } from "../../../learning/authoring/tutorialSteps";

export interface NimInput {
  piles: number[];
}

const createIntroSnapshots = (): AlgorithmStep[] => {
  const introData = [
    {
      narrative:
        "Nim is a two-player impartial game played with piles of objects where players take turns removing one or more objects from a single pile.",
      piles: [3, 4, 5],
      xorSum: 0,
      overrideState: "default" as ElementState,
      vars: { "Piles Count": 3, Rule: "Remove >= 1 from 1 pile" },
    },
    {
      narrative:
        "Under normal play convention, the player who removes the last object wins, leaving the board empty with zero legal moves for the opponent.",
      piles: [0, 0, 0],
      xorSum: 0,
      overrideState: "visited" as ElementState,
      vars: { "Terminal State": "0 objects", Winner: "Last moving player" },
    },
    {
      narrative:
        "Evaluating positions via standard game tree search requires exponential time because each move branches into multiple sub-pile choices.",
      piles: [3, 4, 5],
      xorSum: 0,
      overrideState: "compare" as ElementState,
      vars: { "Search Time": "O(b^d) exponential", Bottleneck: "Impractical for large piles" },
    },
    {
      narrative:
        "The Sprague-Grundy theorem proves that the game state is completely governed by the bitwise XOR sum S of all pile sizes.",
      piles: [3, 4, 5],
      xorSum: 2,
      overrideState: "default" as ElementState,
      vars: { Formula: "S = 3 ^ 4 ^ 5", "Nim-Sum S": 2 },
    },
    {
      narrative:
        "Expressing pile sizes in binary shows that the Nim-sum measures whether the number of set bits in each column is even or odd.",
      piles: [3, 4, 5],
      xorSum: 2,
      overrideState: "active" as ElementState,
      vars: { "Binary 3": "011", "Binary 4": "100", "Binary 5": "101", "XOR Sum": "010 (2)" },
    },
    {
      narrative:
        "A Nim-sum S equal to zero is a losing P-position for the player to move, whereas S non-zero is a winning N-position.",
      piles: [3, 4, 5],
      xorSum: 2,
      overrideState: "pivot" as ElementState,
      vars: { "S = 0": "P-Position (Loss)", "S != 0": "N-Position (Win)", "Current S": 2 },
    },
    {
      narrative:
        "From any N-position with S non-zero, there is always at least one pile where reducing its size to its XOR with S leaves S equal to zero.",
      piles: [1, 4, 5],
      xorSum: 0,
      overrideState: "sorted" as ElementState,
      vars: { "Target Rule": "x_i ^ S < x_i", "Reduced Pile 0": "3 -> 1", "New S": 0 },
    },
    {
      narrative:
        "Any move from a P-position with S equal to zero necessarily changes S to a non-zero value, handing an N-position back to the opponent.",
      piles: [1, 4, 5],
      xorSum: 0,
      overrideState: "visited" as ElementState,
      vars: { "P-Position Action": "Must change S to > 0", "Opponent Advantage": "Gets S != 0" },
    },
    {
      narrative:
        "The bitwise XOR algorithm evaluates the winning player and optimal move in O(n) linear time using O(1) auxiliary space.",
      piles: [3, 4, 5],
      xorSum: 2,
      overrideState: "sorted" as ElementState,
      vars: { "Time Complexity": "O(n)", "Space Complexity": "O(1)" },
    },
  ];

  return introData.map((data, idx) =>
    createTutorialStep({
      stepIndex: idx,
      phase: "intro",
      narrative: data.narrative,
      variables: data.vars,
      primarySnapshot: {
        kind: "composite",
        layout: "horizontal",
        heading: "Nim Game Bitwise Representation",
        items: [
          {
            id: "piles_view",
            role: "primary",
            snapshot: {
              kind: "array",
              name: "piles",
              mode: "box",
              elements: data.piles.map((val, i) => ({
                id: `intro-p-${i}`,
                value: val,
                label: `Pile ${i}`,
                state: data.overrideState,
              })),
            },
          },
          {
            id: "bitmask_view",
            role: "auxiliary",
            snapshot: {
              kind: "bitmask",
              name: "nim_sum_bits",
              value: data.xorSum,
              bitWidth: 4,
              bits: Array.from({ length: 4 }, (_, bitIdx) => {
                const shift = 3 - bitIdx;
                const bitVal = (data.xorSum >> shift) & 1;
                return {
                  index: shift,
                  value: bitVal,
                  label: `b${shift}`,
                  state: bitVal ? ("active" as const) : ("default" as const),
                };
              }),
              operation: {
                name: "Bitwise XOR Sum (S)",
                result: data.xorSum,
              },
            },
          },
        ],
      },
    }),
  );
};

export const generateNimGameSteps = (input: NimInput): AlgorithmStep[] => {
  const introSteps = createIntroSnapshots();
  const steps: AlgorithmStep[] = [...introSteps];
  let stepIndex = introSteps.length;

  const piles = input?.piles && Array.isArray(input.piles) ? [...input.piles] : [3, 4, 5];
  const n = piles.length;

  const createCompositeSnapshot = (
    currentPiles: number[],
    activeIdx?: number,
    winningIdx?: number,
    xorSum: number = 0,
    headingText: string = "Nim Evaluation",
  ) => {
    const arrayElements: ArrayElement[] = currentPiles.map((val, idx) => {
      let state: ElementState = "default";
      if (idx === winningIdx) state = "sorted";
      else if (idx === activeIdx) state = "active";

      return {
        id: `pile-${idx}`,
        value: val,
        label: `Pile ${idx}`,
        state,
        pointers: idx === activeIdx ? ["current"] : idx === winningIdx ? ["target"] : undefined,
      };
    });

    const bitWidth = 4;
    const bits = Array.from({ length: bitWidth }, (_, bitIdx) => {
      const shift = bitWidth - 1 - bitIdx;
      const bitVal = (xorSum >> shift) & 1;
      return {
        index: shift,
        value: bitVal,
        label: `b${shift}`,
        state: bitVal ? ("active" as const) : ("default" as const),
      };
    });

    return {
      kind: "composite" as const,
      layout: "horizontal" as const,
      heading: headingText,
      items: [
        {
          id: "piles_array",
          role: "primary" as const,
          snapshot: {
            kind: "array" as const,
            name: "piles",
            mode: "box" as const,
            elements: arrayElements,
          },
        },
        {
          id: "xor_bitmask",
          role: "auxiliary" as const,
          snapshot: {
            kind: "bitmask" as const,
            name: "nim_sum_bits",
            value: xorSum,
            bitWidth,
            bits,
            operation: {
              name: "Bitwise XOR Sum (S)",
              result: xorSum,
            },
          },
        },
      ],
    };
  };

  // Step 1: Initialize
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `We initialize Nim evaluation with ${n} pile${n === 1 ? "" : "s"} containing sizes [${piles.join(", ")}] and reset Nim-sum accumulator S to 0.`,
      variables: {
        "Piles Count": n,
        "Accumulator S": 0,
        "Current Pile": "None",
      },
      primarySnapshot: createCompositeSnapshot(piles, undefined, undefined, 0, "Initialization"),
    }),
  );

  // Step 2..N+1: Accumulate XOR sum
  let currentXorSum = 0;
  for (let i = 0; i < n; i++) {
    const prevXor = currentXorSum;
    currentXorSum ^= piles[i];

    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `We XOR pile ${i} of size ${piles[i]} into the accumulator: ${prevXor} ^ ${piles[i]} = ${currentXorSum}.`,
        variables: {
          "Current Pile": i,
          "Pile Size": piles[i],
          "Previous S": prevXor,
          "Updated S": currentXorSum,
        },
        primarySnapshot: createCompositeSnapshot(
          piles,
          i,
          undefined,
          currentXorSum,
          `Accumulating Pile ${i}`,
        ),
      }),
    );
  }

  // Step S == 0 case
  if (currentXorSum === 0) {
    steps.push(
      createTutorialStep({
        stepIndex: stepIndex++,
        phase: "walkthrough",
        narrative: `The final calculated Nim-sum S equals 0. This is a losing P-position for the player to move; Second Player forces a win.`,
        variables: {
          "Final Nim-Sum S": 0,
          "Game State": "P-Position (Losing)",
          "Winning Player": "Second Player",
        },
        primarySnapshot: createCompositeSnapshot(
          piles,
          undefined,
          undefined,
          0,
          "P-Position Outcome",
        ),
      }),
    );
    return steps;
  }

  // Find winning move
  let winningPile = -1;
  let targetSize = -1;
  for (let i = 0; i < n; i++) {
    const target = piles[i] ^ currentXorSum;
    if (target < piles[i]) {
      winningPile = i;
      targetSize = target;
      break;
    }
  }

  // Inspect winning move
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `The final calculated Nim-sum S equals ${currentXorSum} != 0, marking an N-position. Inspecting pile ${winningPile} shows target size ${piles[winningPile]} ^ ${currentXorSum} = ${targetSize} < ${piles[winningPile]}.`,
      variables: {
        "Final Nim-Sum S": currentXorSum,
        "Target Pile": winningPile,
        "Current Size": piles[winningPile],
        "Target Size": targetSize,
        Condition: `${targetSize} < ${piles[winningPile]} (Valid Target)`,
      },
      primarySnapshot: createCompositeSnapshot(
        piles,
        winningPile,
        undefined,
        currentXorSum,
        "Inspecting Optimal Move",
      ),
    }),
  );

  // Consequence frame: reduce pile
  const updatedPiles = [...piles];
  updatedPiles[winningPile] = targetSize;
  const newXorSum = currentXorSum ^ piles[winningPile] ^ targetSize; // should be 0

  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `First Player executes the optimal move by reducing Pile ${winningPile} from ${piles[winningPile]} to ${targetSize}, leaving the opponent with Nim-sum S = ${newXorSum}.`,
      variables: {
        "Target Pile": winningPile,
        "Original Size": piles[winningPile],
        "New Size": targetSize,
        "New Nim-Sum S": newXorSum,
        "Opponent State": "P-Position (Losing)",
      },
      primarySnapshot: createCompositeSnapshot(
        updatedPiles,
        undefined,
        winningPile,
        newXorSum,
        "Executing Optimal Move",
      ),
    }),
  );

  // Completion frame
  steps.push(
    createTutorialStep({
      stepIndex: stepIndex++,
      phase: "walkthrough",
      narrative: `Nim evaluation complete: First Player forces a win by reducing Pile ${winningPile} to size ${targetSize}.`,
      variables: {
        "Winning Player": "First Player",
        "Optimal Move": `Reduce Pile ${winningPile} from ${piles[winningPile]} to ${targetSize}`,
        "Final Board Nim-Sum": 0,
      },
      primarySnapshot: createCompositeSnapshot(
        updatedPiles,
        undefined,
        winningPile,
        0,
        "Evaluation Complete",
      ),
    }),
  );

  return steps;
};
