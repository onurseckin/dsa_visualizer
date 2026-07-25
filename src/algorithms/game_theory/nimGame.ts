import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  TopicGuide,
} from '../../types/dsa';

export interface NimInput {
  piles: number[];
}

export const NIM_GAME_CODE = `def nim_game(piles):
    xor_sum = 0
    n = len(piles)
    for i in range(n):
        xor_sum ^= piles[i]

    if xor_sum == 0:
        return {"winner": "Second Player", "winning_pile": -1, "target_size": 0}

    for i in range(n):
        target_size = piles[i] ^ xor_sum
        if target_size < piles[i]:
            return {
                "winner": "First Player",
                "winning_pile": i,
                "target_size": target_size,
                "remove": piles[i] - target_size,
            }

    return {"winner": "Second Player", "winning_pile": -1, "target_size": 0}`;

export const DEFAULT_NIM_INPUT: NimInput = {
  piles: [3, 4, 5],
};

export const generateNimGameSteps = (input: NimInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const piles = input.piles ? [...input.piles] : [];
  const n = piles.length;

  const elements: ArrayElement[] = piles.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: 'default',
  }));

  let currentXorSum = 0;

  const getAuxiliaryState = (
    xorVal: number,
    winningPileIdx: number = -1,
    targetVal: number = -1,
    winner: string = 'In Progress'
  ) => {
    const hashMap: Record<string, string | number> = {
      xorSum: xorVal,
      xorSumBinary: `0b${xorVal.toString(2)}`,
      winner,
    };
    piles.forEach((pSize, idx) => {
      hashMap[`pile_${idx}`] = pSize;
    });

    return {
      hashMap,
      customState: {
        xorSum: xorVal,
        xorSumBinary: xorVal.toString(2),
        piles: piles.join(', '),
        winningPile: winningPileIdx >= 0 ? `Pile ${winningPileIdx}` : 'None',
        targetSize: targetVal >= 0 ? targetVal : 'N/A',
        winnerStatus: winner,
      },
      visited: piles.map((size, idx) => `Pile ${idx}: ${size} objects`),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    winningPileIdx: number = -1,
    targetVal: number = -1,
    winner: string = 'In Progress'
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: 'array',
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: getAuxiliaryState(
        currentXorSum,
        winningPileIdx,
        targetVal,
        winner
      ),
      variables: {
        xorSum: currentXorSum,
        ...variables,
      },
    });
  };

  addStep(
    1,
    `Evaluate ${n} piles: [${piles.join(', ')}]`,
    `To decide who wins this Nim position we never simulate moves — we compute the Nim-sum, the XOR of every pile size, starting the running total at 0.`,
    { n, piles: piles.join(', ') }
  );

  if (n === 0) {
    addStep(
      8,
      'Game complete: no piles to play',
      'With no piles there is no legal first move, so the First Player loses on the spot and the Second Player wins by default.',
      { n, xorSum: 0 },
      -1,
      -1,
      'Second Player'
    );
    return steps;
  }

  // XOR Sum calculation loop
  for (let i = 0; i < n; i++) {
    elements[i].state = 'active';
    elements[i].pointers = [`i=${i}`, `val=${piles[i]}`];

    const prevXor = currentXorSum;
    currentXorSum ^= piles[i];

    addStep(
      5,
      `XOR in pile ${i} of size ${piles[i]}`,
      `We fold pile ${i} into the running total: ${prevXor} ^ ${piles[i]} = ${currentXorSum} (binary 0b${currentXorSum.toString(2)}). Each bit of the Nim-sum tracks whether that power of two appears an odd number of times across the piles.`,
      { i, pileSize: piles[i], prevXorSum: prevXor, xorSum: currentXorSum }
    );

    elements[i].state = 'visited';
    elements[i].pointers = undefined;
  }

  addStep(
    7,
    `Nim-sum settles at ${currentXorSum}`,
    `This one number decides the whole game: a Nim-sum of 0 means every available move hands the opponent a winning position, while a non-zero sum means we can strike first and win.`,
    { xorSum: currentXorSum }
  );

  if (currentXorSum === 0) {
    addStep(
      8,
      'Nim-sum is 0: Second Player Wins',
      'Whatever the First Player does, the Nim-sum turns non-zero, and the Second Player can always answer with a move that resets it to 0. Trapped in that cycle, the First Player eventually runs out of moves.',
      { xorSum: 0, winner: 'Second Player' },
      -1,
      -1,
      'Second Player'
    );
    return steps;
  }

  // Find winning move for First Player
  addStep(
    10,
    `Nim-sum ${currentXorSum} ≠ 0: First Player wins`,
    `A non-zero Nim-sum guarantees at least one pile can be shrunk so that everything XORs back to 0. We now search for that pile to make the win concrete.`,
    { xorSum: currentXorSum, winner: 'First Player' },
    -1,
    -1,
    'First Player'
  );

  for (let i = 0; i < n; i++) {
    const targetSize = piles[i] ^ currentXorSum;

    elements[i].state = 'compare';
    elements[i].pointers = [`i=${i}`, `target=${targetSize}`];

    addStep(
      12,
      `Test pile ${i}: target size ${targetSize}`,
      targetSize < piles[i]
        ? `XOR-ing pile ${i}'s size ${piles[i]} with the Nim-sum gives ${targetSize}, which is smaller — so we can legally shrink this pile down to it. That is our winning move.`
        : `XOR-ing ${piles[i]} with the Nim-sum gives ${targetSize}, which is not smaller than the pile, and Nim only lets us remove objects. We move on to the next pile.`,
      { i, pileSize: piles[i], targetSize, isWinningMove: targetSize < piles[i] },
      -1,
      -1,
      'First Player'
    );

    if (targetSize < piles[i]) {
      const removeAmount = piles[i] - targetSize;
      elements[i].state = 'sorted';
      elements[i].pointers = ['winning move'];

      addStep(
        13,
        `Shrink pile ${i} from ${piles[i]} to ${targetSize}`,
        `Removing ${removeAmount} objects leaves the piles XOR-ing to exactly 0, handing the opponent the losing position. From here we simply keep restoring a zero Nim-sum after each of their moves until they have nothing left.`,
        {
          winningPile: i,
          originalSize: piles[i],
          targetSize,
          removeAmount,
          winner: 'First Player',
        },
        i,
        targetSize,
        'First Player'
      );
      break;
    }

    elements[i].state = 'visited';
    elements[i].pointers = undefined;
  }

  return steps;
};

const NIM_GAME_TOPIC_GUIDE: TopicGuide = {
  overview:
    'Nim is the reference example of an impartial combinatorial game: several piles of objects sit on the table, a move removes any positive number of objects from exactly one pile, and the player who cannot move loses. Its entire theory collapses into one number, the Nim-sum, which is the bitwise XOR of all the pile sizes and tells you both who wins under perfect play and what move to make. Studying it teaches you to evaluate a game with algebra instead of searching a game tree, which is the difference between an instant answer and an exponential one. The Sprague-Grundy theorem then extends that same algebra to essentially every impartial game, which is why Nim is where game theory for programmers begins.',
  sections: [
    {
      heading: 'Positions, and what winning actually means',
      body: 'Under the normal play convention the player who makes the last move wins, so being unable to move is losing. That lets you classify every position as one of two kinds without any reference to strategy: a position is losing for whoever must move if every available move hands the opponent a winning position, and it is winning if at least one move hands the opponent a losing one. These are traditionally called P-positions, good for the previous player, and N-positions, good for the next player. The definition is recursive and perfectly correct, and you could evaluate it by exploring the game tree bottom up, but the tree explodes because a single pile of size k already offers k moves. What Bouton discovered is that for Nim this recursive classification has a closed form, so the whole search evaporates.',
    },
    {
      heading: 'The Nim-sum test and the move it hands you',
      body: 'Compute the XOR of every pile size and call it the Nim-sum. If it is zero the player about to move loses against a perfect opponent, and if it is non-zero that player wins. The winning move is constructive rather than mysterious: look at the highest set bit of the Nim-sum, find a pile whose size also has that bit set, and reduce that pile to its size XOR the Nim-sum, which is guaranteed to be strictly smaller and leaves the total XOR at zero. In practice you can simply test every pile and take the first one whose size XOR the Nim-sum is smaller than the pile, which is exactly what this implementation does. The intuition behind the bits is worth holding on to: bit k of the Nim-sum is 1 precisely when an odd number of piles have that bit set, so a Nim-sum of zero means every power of two is paired off evenly across the piles.',
    },
    {
      heading: 'Why zero is exactly the losing set',
      body: 'The proof is two short observations that together satisfy the recursive definition. From a position with Nim-sum zero, any legal move changes exactly one pile, and changing a number necessarily flips at least one of its bits, so the new Nim-sum cannot still be zero; every move out of zero lands on non-zero. From a position with non-zero Nim-sum there is always a move back to zero, namely the reduction described above, which is legal precisely because XOR-ing with a value whose highest set bit is also set in the pile makes the pile smaller. So zero positions offer only moves to non-zero, and non-zero positions offer at least one move to zero, which is the definition of losing and winning respectively. Termination is guaranteed because every move strictly decreases the total number of objects, and the empty board, which has Nim-sum zero, is the terminal losing position. The winner therefore simply restores a Nim-sum of zero after each opponent move until the opponent faces an empty table.',
    },
    {
      heading: 'From Nim to every impartial game',
      body: 'The Sprague-Grundy theorem says that any position in an impartial game under normal play behaves exactly like a single Nim pile, whose size is called the Grundy value of the position. You compute it recursively as the minimum excludant, or mex, of the Grundy values of all positions reachable in one move, meaning the smallest non-negative integer not appearing among them. A Nim pile of size k has Grundy value k, and a terminal position has Grundy value 0, which is why zero means losing in general and not just in Nim. The second half of the theorem is the part that makes it practical: when a game splits into independent components played side by side, the Grundy value of the whole is the XOR of the components. So for a subtraction game, a row of coins, or a strip of Kayles, you tabulate Grundy values for one component with dynamic programming and then XOR across components exactly as you XOR pile sizes here.',
    },
    {
      heading: 'Pitfalls and the limits of the theory',
      body: 'Everything above assumes the game is impartial, meaning both players have the same moves available from any position, and that it uses normal play. Misere Nim, where taking the last object loses, has a genuinely different answer: if every pile has size one, the parity of the number of piles decides it, and otherwise the winner is the same as in normal play but the endgame is handled differently. Games where the two players have different move sets, chess and checkers among them, are partizan and lie outside Grundy theory entirely. Smaller traps are easy to trip on in code: empty piles contribute nothing to the XOR and are not a legal source of a move, so they can be ignored but not counted; and when hunting for the winning pile you must require the target size to be strictly smaller than the pile, since equal would mean removing nothing, which is not a legal move.',
    },
    {
      heading: 'Where this shows up in practice',
      body: 'Subtraction games, where each move removes a size from a fixed allowed set, are the standard first exercise, and their Grundy values are periodic in a way you discover by tabulating a few dozen positions. Staircase Nim maps a seemingly different game about sliding coins along a strip onto plain Nim by noticing that only the piles at alternating distances matter. Coin-turning games such as Turning Turtles reduce to Nim by treating each face-up coin position as a pile, and Green Hackenbush reduces tree pruning to XOR of branch values. The habit these all reward is the same: look for independent components, compute a Grundy value for each, XOR them, and only then think about the specific move. If the components are not independent, the theory does not apply and you are back to explicit search over states, which is a useful signal in itself.',
    },
  ],
  keyTerms: [
    {
      term: 'Impartial game',
      definition:
        'A two-player game where the set of legal moves depends only on the position, not on whose turn it is, and there is no chance or hidden information. Nim is impartial, which is what makes Grundy theory apply.',
    },
    {
      term: 'Nim-sum',
      definition:
        'The bitwise XOR of all pile sizes. Its value alone decides the outcome, because zero means the player to move loses and anything else means that player has a winning move.',
    },
    {
      term: 'P-position and N-position',
      definition:
        'A P-position is losing for the player about to move, so it favours the previous player, while an N-position favours the next player. In Nim the P-positions are exactly those with a Nim-sum of zero.',
    },
    {
      term: 'Grundy value',
      definition:
        'The size of the single Nim pile a position is equivalent to, computed as the mex of the Grundy values of its options. A value of zero marks a losing position.',
    },
    {
      term: 'Mex',
      definition:
        'The minimum excludant of a set of non-negative integers, meaning the smallest one absent from the set. It is the operation that turns the Grundy values of a position options into the value of the position itself.',
    },
    {
      term: 'Normal play convention',
      definition:
        'The rule that a player with no legal move loses, so the last player to move wins. Reversing it gives misere play, where the analysis of Nim changes.',
    },
  ],
};

export const nimGame: AlgorithmDefinition<NimInput> = {
  id: 'nim-game',
  title: 'Nim Game Sprague-Grundy',
  category: 'game_theory',
  difficulty: 'Medium',
  description:
    'Nim is the classic impartial game solved by the Sprague-Grundy theorem. Computing the Nim-sum — the bitwise XOR of all pile sizes — instantly reveals whether the position is a forced win for the First Player (non-zero) or the Second Player (zero), and pinpoints the optimal opening move.',
  constraints: [
    '1 <= piles.length <= 10^4',
    '0 <= piles[i] <= 10^9',
  ],
  examples: [
    {
      input: 'piles = [3, 4, 5]',
      output: 'First Player Wins, reduce pile 0 from 3 to 1 (remove 2)',
      explanation: 'Initial XOR sum: 3 ^ 4 ^ 5 = 2 != 0 (First Player wins). Target size for pile 0 is 3 ^ 2 = 1.',
    },
    {
      input: 'piles = [1, 2, 3]',
      output: 'Second Player Wins',
      explanation: 'Initial XOR sum: 1 ^ 2 ^ 3 = 0 (P-position, Second Player wins).',
    },
  ],
  code: NIM_GAME_CODE,
  timeComplexity: {
    best: 'O(n)',
    average: 'O(n)',
    worst: 'O(n)',
  },
  spaceComplexity: 'O(1)',
  complexityAnalysis: {
    time: 'We make one pass over the piles to XOR their sizes together, then at most one more pass to find a pile whose size shrinks when XOR-ed with the Nim-sum. Both passes do constant work per pile, so the total is linear in the number of piles — O(n). Notably, no game tree is ever explored; the XOR identity replaces all of that search.',
    space: 'All we carry is a single running XOR value and a couple of loop variables, so extra memory stays constant at O(1) no matter how many piles there are.',
  },
  topicGuide: NIM_GAME_TOPIC_GUIDE,
  defaultInput: DEFAULT_NIM_INPUT,
  generateSteps: generateNimGameSteps,
};
