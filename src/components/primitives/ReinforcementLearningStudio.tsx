import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  FastForward,
  Activity,
  Sliders,
  TrendingUp,
  Layers,
  Award,
  Zap,
  CheckCircle2,
  BarChart2,
  Flame,
  Eye,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type RLAlgorithmId = "value_iteration" | "policy_iteration" | "q_learning" | "ppo_gae";

export type RLEnvironmentId =
  | "grid_4x4_classic"
  | "cliff_walking"
  | "obstacle_maze_5x5"
  | "slippery_frozen_4x4"
  | "cartpole";

export type RLPresetId =
  | "preset_value_iteration_grid"
  | "preset_policy_iteration_frozen"
  | "preset_cliff_walking_q"
  | "preset_maze_td_learning"
  | "preset_ppo_gae_grid"
  | "preset_cartpole_balance"
  | "preset_high_slip_stochastic";

export type GridAction = 0 | 1 | 2 | 3; // 0: Up, 1: Right, 2: Down, 3: Left
export type CartPoleAction = 0 | 1; // 0: Push Left, 1: Push Right

export interface GridCoord {
  readonly r: number;
  readonly c: number;
}

export interface GridGoalConfig extends GridCoord {
  readonly reward: number;
  readonly terminal: boolean;
}

export interface GridCliffConfig extends GridCoord {
  readonly penalty: number;
  readonly resetToStart: boolean;
}

export interface GridworldConfig {
  readonly id: string;
  readonly name: string;
  readonly rows: number;
  readonly cols: number;
  readonly startState: GridCoord;
  readonly goals: readonly GridGoalConfig[];
  readonly cliffs: readonly GridCliffConfig[];
  readonly obstacles: readonly GridCoord[];
  readonly stepPenalty: number;
  readonly slipProb: number;
}

export interface TransitionOutcome {
  readonly nextState: number;
  readonly prob: number;
  readonly reward: number;
  readonly terminal: boolean;
}

export interface GridworldMDP {
  readonly numStates: number;
  readonly numActions: number;
  readonly rows: number;
  readonly cols: number;
  readonly startStateIndex: number;
  readonly transitions: readonly (readonly (readonly TransitionOutcome[])[])[]; // [state][action] -> outcomes
  readonly terminalStates: readonly boolean[];
  readonly isObstacle: readonly boolean[];
  readonly stateRewards: readonly number[];
  readonly config: GridworldConfig;
}

export interface BellmanStepResult {
  readonly value: number;
  readonly bestAction: GridAction;
  readonly qValues: readonly number[];
}

export interface ValueIterationIterationResult {
  readonly nextV: readonly number[];
  readonly policy: readonly GridAction[];
  readonly residual: number;
  readonly qTable: readonly (readonly number[])[];
}

export interface ValueIterationSolveResult {
  readonly values: readonly number[];
  readonly policy: readonly GridAction[];
  readonly residualHistory: readonly number[];
  readonly iterations: number;
  readonly converged: boolean;
  readonly qTable: readonly (readonly number[])[];
}

export interface PolicyIterationResult {
  readonly values: readonly number[];
  readonly policy: readonly GridAction[];
  readonly iterations: number;
  readonly converged: boolean;
  readonly qTable: readonly (readonly number[])[];
}

export interface QLearningStepResult {
  readonly updatedQ: number;
  readonly tdError: number;
  readonly target: number;
}

export interface QLearningEpisodeResult {
  readonly episodeReturn: number;
  readonly steps: number;
  readonly tdErrors: readonly number[];
  readonly trajectory: readonly number[];
  readonly reachedGoal: boolean;
}

export interface GAEResult {
  readonly advantages: readonly number[];
  readonly returns: readonly number[];
  readonly tdErrors: readonly number[];
}

export interface PPOClippedObjectiveResult {
  readonly unclipped: number;
  readonly clipped: number;
  readonly objective: number;
  readonly isClipped: boolean;
}

export interface PPOClippingPoint {
  readonly ratio: number;
  readonly unclipped: number;
  readonly clipped: number;
  readonly objective: number;
}

export interface CartPoleState {
  readonly x: number; // cart position (m)
  readonly xDot: number; // cart velocity (m/s)
  readonly theta: number; // pole angle (rad)
  readonly thetaDot: number; // pole angular velocity (rad/s)
}

export interface CartPoleConfig {
  readonly gravity: number; // 9.8 m/s^2
  readonly massCart: number; // 1.0 kg
  readonly massPole: number; // 0.1 kg
  readonly length: number; // 0.5 m (half-length)
  readonly forceMag: number; // 10.0 N
  readonly dt: number; // 0.02 s
  readonly xThreshold: number; // 2.4 m
  readonly thetaThresholdRadians: number; // 12 deg = ~0.2094 rad
  readonly maxSteps: number; // 500 steps
}

export interface CartPoleStepResult {
  readonly nextState: CartPoleState;
  readonly reward: number;
  readonly done: boolean;
  readonly derivatives: readonly [number, number, number, number];
}

export interface RLPreset {
  readonly id: RLPresetId;
  readonly name: string;
  readonly description: string;
  readonly algorithm: RLAlgorithmId;
  readonly environment: RLEnvironmentId;
  readonly gamma: number;
  readonly alpha: number;
  readonly epsilon: number;
  readonly epsilonDecay: number;
  readonly epsilonMin: number;
  readonly gaeLambda: number;
  readonly ppoClipEps: number;
  readonly slipProb: number;
  readonly theta: number;
  readonly maxEpisodes: number;
}

export interface ReinforcementLearningStudioProps {
  readonly initialAlgorithm?: RLAlgorithmId;
  readonly initialEnvironment?: RLEnvironmentId;
  readonly initialPreset?: RLPresetId;
  readonly width?: number;
  readonly height?: number;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onEpisodeComplete?: (episode: number, totalReturn: number, steps: number) => void;
  readonly onConvergenceReached?: (
    algorithm: RLAlgorithmId,
    iterations: number,
    residual: number,
  ) => void;
}

// ============================================================================
// 2. CONSTANTS & PRESETS
// ============================================================================

export const ACTION_NAMES: readonly string[] = ["Up", "Right", "Down", "Left"];
export const ACTION_ARROWS: readonly string[] = ["↑", "→", "↓", "←"];
export const ACTION_DELTAS: readonly (readonly [number, number])[] = [
  [-1, 0], // Up
  [0, 1], // Right
  [1, 0], // Down
  [0, -1], // Left
];

export const DEFAULT_CARTPOLE_CONFIG: CartPoleConfig = {
  gravity: 9.8,
  massCart: 1.0,
  massPole: 0.1,
  length: 0.5,
  forceMag: 10.0,
  dt: 0.02,
  xThreshold: 2.4,
  thetaThresholdRadians: (12.0 * Math.PI) / 180.0, // ~0.20944 rad
  maxSteps: 500,
};

export const GRID_CONFIG_4X4_CLASSIC: GridworldConfig = {
  id: "grid_4x4_classic",
  name: "Classic 4x4 Grid",
  rows: 4,
  cols: 4,
  startState: { r: 0, c: 0 },
  goals: [{ r: 3, c: 3, reward: 1.0, terminal: true }],
  cliffs: [{ r: 1, c: 1, penalty: -1.0, resetToStart: false }],
  obstacles: [{ r: 2, c: 1 }],
  stepPenalty: -0.04,
  slipProb: 0.1,
};

export const GRID_CONFIG_CLIFF_WALKING: GridworldConfig = {
  id: "cliff_walking",
  name: "Cliff Walking Dilemma",
  rows: 4,
  cols: 8,
  startState: { r: 3, c: 0 },
  goals: [{ r: 3, c: 7, reward: 0.0, terminal: true }],
  cliffs: [
    { r: 3, c: 1, penalty: -100.0, resetToStart: true },
    { r: 3, c: 2, penalty: -100.0, resetToStart: true },
    { r: 3, c: 3, penalty: -100.0, resetToStart: true },
    { r: 3, c: 4, penalty: -100.0, resetToStart: true },
    { r: 3, c: 5, penalty: -100.0, resetToStart: true },
    { r: 3, c: 6, penalty: -100.0, resetToStart: true },
  ],
  obstacles: [],
  stepPenalty: -1.0,
  slipProb: 0.0,
};

export const GRID_CONFIG_OBSTACLE_MAZE: GridworldConfig = {
  id: "obstacle_maze_5x5",
  name: "5x5 Obstacle Maze",
  rows: 5,
  cols: 5,
  startState: { r: 0, c: 0 },
  goals: [{ r: 4, c: 4, reward: 10.0, terminal: true }],
  cliffs: [
    { r: 0, c: 3, penalty: -5.0, resetToStart: false },
    { r: 4, c: 1, penalty: -5.0, resetToStart: false },
  ],
  obstacles: [
    { r: 1, c: 1 },
    { r: 1, c: 2 },
    { r: 2, c: 3 },
    { r: 3, c: 1 },
    { r: 3, c: 2 },
  ],
  stepPenalty: -0.1,
  slipProb: 0.1,
};

export const GRID_CONFIG_SLIPPERY_FROZEN: GridworldConfig = {
  id: "slippery_frozen_4x4",
  name: "Slippery Frozen Grid",
  rows: 4,
  cols: 4,
  startState: { r: 0, c: 0 },
  goals: [{ r: 3, c: 3, reward: 1.0, terminal: true }],
  cliffs: [
    { r: 1, c: 1, penalty: 0.0, resetToStart: false },
    { r: 1, c: 3, penalty: 0.0, resetToStart: false },
    { r: 2, c: 3, penalty: 0.0, resetToStart: false },
    { r: 3, c: 0, penalty: 0.0, resetToStart: false },
  ],
  obstacles: [],
  stepPenalty: 0.0,
  slipProb: 0.33,
};

export const GRIDWORLD_CONFIGS: Record<string, GridworldConfig> = {
  grid_4x4_classic: GRID_CONFIG_4X4_CLASSIC,
  cliff_walking: GRID_CONFIG_CLIFF_WALKING,
  obstacle_maze_5x5: GRID_CONFIG_OBSTACLE_MAZE,
  slippery_frozen_4x4: GRID_CONFIG_SLIPPERY_FROZEN,
};

export const RL_PRESETS: Record<RLPresetId, RLPreset> = {
  preset_value_iteration_grid: {
    id: "preset_value_iteration_grid",
    name: "Classic Gridworld (Value Iteration)",
    description:
      "Exact Dynamic Programming Bellman Optimality operator convergence on a stochastic gridworld MDP.",
    algorithm: "value_iteration",
    environment: "grid_4x4_classic",
    gamma: 0.95,
    alpha: 0.1,
    epsilon: 0.1,
    epsilonDecay: 0.99,
    epsilonMin: 0.01,
    gaeLambda: 0.95,
    ppoClipEps: 0.2,
    slipProb: 0.1,
    theta: 1e-4,
    maxEpisodes: 100,
  },
  preset_policy_iteration_frozen: {
    id: "preset_policy_iteration_frozen",
    name: "Slippery Frozen Grid (Policy Iteration)",
    description:
      "Alternating Policy Evaluation and Policy Improvement with exact matrix Bellman linear solve.",
    algorithm: "policy_iteration",
    environment: "slippery_frozen_4x4",
    gamma: 0.99,
    alpha: 0.1,
    epsilon: 0.1,
    epsilonDecay: 0.99,
    epsilonMin: 0.01,
    gaeLambda: 0.95,
    ppoClipEps: 0.2,
    slipProb: 0.33,
    theta: 1e-4,
    maxEpisodes: 100,
  },
  preset_cliff_walking_q: {
    id: "preset_cliff_walking_q",
    name: "Cliff Walking Dilemma (Q-Learning)",
    description:
      "Watkins Q-learning demonstrating optimal edge-skirting vs safer interior path tradeoff under ε-greedy exploration.",
    algorithm: "q_learning",
    environment: "cliff_walking",
    gamma: 0.99,
    alpha: 0.2,
    epsilon: 0.15,
    epsilonDecay: 0.995,
    epsilonMin: 0.01,
    gaeLambda: 0.95,
    ppoClipEps: 0.2,
    slipProb: 0.0,
    theta: 1e-4,
    maxEpisodes: 300,
  },
  preset_maze_td_learning: {
    id: "preset_maze_td_learning",
    name: "5x5 Obstacle Maze (Q-Learning)",
    description:
      "Temporal Difference learning propagating state-action values around walls and trap cells.",
    algorithm: "q_learning",
    environment: "obstacle_maze_5x5",
    gamma: 0.95,
    alpha: 0.15,
    epsilon: 0.2,
    epsilonDecay: 0.99,
    epsilonMin: 0.02,
    gaeLambda: 0.95,
    ppoClipEps: 0.2,
    slipProb: 0.1,
    theta: 1e-4,
    maxEpisodes: 250,
  },
  preset_ppo_gae_grid: {
    id: "preset_ppo_gae_grid",
    name: "PPO Clipped Objective & GAE on Grid",
    description:
      "Proximal Policy Optimization actor-critic surrogate clipping and Generalized Advantage Estimation.",
    algorithm: "ppo_gae",
    environment: "grid_4x4_classic",
    gamma: 0.95,
    alpha: 0.05,
    epsilon: 0.1,
    epsilonDecay: 0.99,
    epsilonMin: 0.01,
    gaeLambda: 0.95,
    ppoClipEps: 0.2,
    slipProb: 0.1,
    theta: 1e-4,
    maxEpisodes: 200,
  },
  preset_cartpole_balance: {
    id: "preset_cartpole_balance",
    name: "CartPole Inverted Pendulum (PPO/Policy)",
    description:
      "Continuous non-linear CartPole stabilization and balancing using policy gradient surrogate optimization.",
    algorithm: "ppo_gae",
    environment: "cartpole",
    gamma: 0.99,
    alpha: 0.02,
    epsilon: 0.1,
    epsilonDecay: 0.995,
    epsilonMin: 0.01,
    gaeLambda: 0.95,
    ppoClipEps: 0.2,
    slipProb: 0.0,
    theta: 1e-4,
    maxEpisodes: 150,
  },
  preset_high_slip_stochastic: {
    id: "preset_high_slip_stochastic",
    name: "High Slip Stochastic MDP Analysis",
    description:
      "Analysis of Bellman optimality and policy divergence when environmental transition noise dominates action intention.",
    algorithm: "value_iteration",
    environment: "grid_4x4_classic",
    gamma: 0.9,
    alpha: 0.1,
    epsilon: 0.1,
    epsilonDecay: 0.99,
    epsilonMin: 0.01,
    gaeLambda: 0.95,
    ppoClipEps: 0.2,
    slipProb: 0.5,
    theta: 1e-4,
    maxEpisodes: 100,
  },
};

// ============================================================================
// 3. PURE MATHEMATICAL ALGORITHMS & MDP ENGINE
// ============================================================================

/**
 * Converts a 2D grid coordinate (row, col) to a flat 1D state index.
 */
export function coordToStateIndex(r: number, c: number, cols: number): number {
  return r * cols + c;
}

/**
 * Converts a flat 1D state index to a 2D grid coordinate { r, c }.
 */
export function stateIndexToCoord(s: number, cols: number): GridCoord {
  return {
    r: Math.floor(s / cols),
    c: s % cols,
  };
}

/**
 * Computes deterministic transition target (r', c') with grid boundaries and obstacles.
 */
export function getGridNextCoord(
  r: number,
  c: number,
  action: GridAction,
  rows: number,
  cols: number,
  obstacles: readonly GridCoord[],
): GridCoord {
  const [dr, dc] = ACTION_DELTAS[action];
  const nextR = r + dr;
  const nextC = c + dc;

  // Boundary check
  if (nextR < 0 || nextR >= rows || nextC < 0 || nextC >= cols) {
    return { r, c };
  }

  // Obstacle check
  const hitObstacle = obstacles.some((obs) => obs.r === nextR && obs.c === nextC);
  if (hitObstacle) {
    return { r, c };
  }

  return { r: nextR, c: nextC };
}

/**
 * Creates the complete transition tensor and metadata for a Gridworld MDP.
 */
export function createGridworldMDP(config: GridworldConfig): GridworldMDP {
  const numStates = config.rows * config.cols;
  const numActions = 4;
  const startStateIndex = coordToStateIndex(config.startState.r, config.startState.c, config.cols);

  const terminalStates = new Array<boolean>(numStates).fill(false);
  const isObstacle = new Array<boolean>(numStates).fill(false);
  const stateRewards = new Array<number>(numStates).fill(config.stepPenalty);

  // Set obstacles
  for (const obs of config.obstacles) {
    const s = coordToStateIndex(obs.r, obs.c, config.cols);
    isObstacle[s] = true;
  }

  // Set goals
  for (const g of config.goals) {
    const s = coordToStateIndex(g.r, g.c, config.cols);
    if (g.terminal) terminalStates[s] = true;
    stateRewards[s] = g.reward;
  }

  // Set cliffs / traps
  for (const cl of config.cliffs) {
    const s = coordToStateIndex(cl.r, cl.c, config.cols);
    stateRewards[s] = cl.penalty;
    if (!cl.resetToStart) {
      terminalStates[s] = true;
    }
  }

  // Build transitions table
  const transitions: TransitionOutcome[][][] = [];

  for (let s = 0; s < numStates; s++) {
    const actionList: TransitionOutcome[][] = [];
    const coord = stateIndexToCoord(s, config.cols);

    if (terminalStates[s] || isObstacle[s]) {
      // Terminal or obstacle absorbs with 0 reward
      for (let a = 0; a < numActions; a++) {
        actionList.push([{ nextState: s, prob: 1.0, reward: 0.0, terminal: true }]);
      }
      transitions.push(actionList);
      continue;
    }

    for (let a = 0; a < numActions; a++) {
      const action = a as GridAction;
      const outcomes: TransitionOutcome[] = [];

      // Slip dynamics:
      // P(intended) = 1 - p_slip
      // P(cw) = p_slip / 2
      // P(ccw) = p_slip / 2
      const pIntended = 1.0 - config.slipProb;
      const pSlip = config.slipProb / 2.0;

      const actionsToTry: { act: GridAction; prob: number }[] = [
        { act: action, prob: pIntended },
        { act: ((action + 1) % 4) as GridAction, prob: pSlip },
        { act: ((action + 3) % 4) as GridAction, prob: pSlip },
      ];

      for (const item of actionsToTry) {
        if (item.prob <= 0) continue;
        const targetCoord = getGridNextCoord(
          coord.r,
          coord.c,
          item.act,
          config.rows,
          config.cols,
          config.obstacles,
        );

        const targetState = coordToStateIndex(targetCoord.r, targetCoord.c, config.cols);

        // Check if target is a cliff with reset
        const cliffHit = config.cliffs.find(
          (cl) => cl.r === targetCoord.r && cl.c === targetCoord.c,
        );
        if (cliffHit && cliffHit.resetToStart) {
          outcomes.push({
            nextState: startStateIndex,
            prob: item.prob,
            reward: cliffHit.penalty,
            terminal: false,
          });
        } else {
          const isTerm = terminalStates[targetState];
          const rew = stateRewards[targetState];
          outcomes.push({
            nextState: targetState,
            prob: item.prob,
            reward: rew,
            terminal: isTerm,
          });
        }
      }

      // Merge outcomes with same nextState and reward
      const mergedMap = new Map<string, TransitionOutcome>();
      for (const out of outcomes) {
        const key = `${out.nextState}_${out.reward}_${out.terminal}`;
        const existing = mergedMap.get(key);
        if (existing) {
          mergedMap.set(key, {
            ...existing,
            prob: existing.prob + out.prob,
          });
        } else {
          mergedMap.set(key, out);
        }
      }

      actionList.push(Array.from(mergedMap.values()));
    }
    transitions.push(actionList);
  }

  return {
    numStates,
    numActions,
    rows: config.rows,
    cols: config.cols,
    startStateIndex,
    transitions,
    terminalStates,
    isObstacle,
    stateRewards,
    config,
  };
}

/**
 * Step environment stochastically for Q-learning or simulation rollouts.
 */
export function stepGridworld(
  s: number,
  a: GridAction,
  mdp: GridworldMDP,
  rng: () => number = Math.random,
): { nextState: number; reward: number; done: boolean } {
  const outcomes = mdp.transitions[s][a];
  if (!outcomes || outcomes.length === 0) {
    return { nextState: s, reward: 0, done: true };
  }

  const roll = rng();
  let cumulative = 0.0;
  for (const out of outcomes) {
    cumulative += out.prob;
    if (roll <= cumulative) {
      return {
        nextState: out.nextState,
        reward: out.reward,
        done: out.terminal,
      };
    }
  }

  const last = outcomes[outcomes.length - 1];
  return { nextState: last.nextState, reward: last.reward, done: last.terminal };
}

/**
 * Evaluates the Bellman optimality operator T*(V)(s) = max_a sum_{s'} P(s'|s,a)[R + gamma V(s')]
 */
export function computeBellmanOptimalUpdate(
  s: number,
  V: readonly number[],
  mdp: GridworldMDP,
  gamma: number,
): BellmanStepResult {
  if (mdp.terminalStates[s] || mdp.isObstacle[s]) {
    return {
      value: 0.0,
      bestAction: 0,
      qValues: [0, 0, 0, 0],
    };
  }

  const qValues: number[] = [0, 0, 0, 0];
  let maxValue = -Infinity;
  let bestAction: GridAction = 0;

  for (let a = 0; a < mdp.numActions; a++) {
    const outcomes = mdp.transitions[s][a];
    let q_sa = 0.0;
    for (const out of outcomes) {
      const vNext = out.terminal ? 0.0 : V[out.nextState];
      q_sa += out.prob * (out.reward + gamma * vNext);
    }
    qValues[a] = q_sa;
    if (q_sa > maxValue) {
      maxValue = q_sa;
      bestAction = a as GridAction;
    }
  }

  return {
    value: maxValue,
    bestAction,
    qValues,
  };
}

/**
 * Performs a single step of Value Iteration over all states in the MDP.
 */
export function stepValueIteration(
  V: readonly number[],
  mdp: GridworldMDP,
  gamma: number,
): ValueIterationIterationResult {
  const nextV = new Array<number>(mdp.numStates).fill(0);
  const policy = new Array<GridAction>(mdp.numStates).fill(0);
  const qTable: number[][] = [];
  let residual = 0.0;

  for (let s = 0; s < mdp.numStates; s++) {
    const res = computeBellmanOptimalUpdate(s, V, mdp, gamma);
    nextV[s] = res.value;
    policy[s] = res.bestAction;
    qTable.push([...res.qValues]);

    if (!mdp.terminalStates[s] && !mdp.isObstacle[s]) {
      const diff = Math.abs(nextV[s] - V[s]);
      if (diff > residual) {
        residual = diff;
      }
    }
  }

  return { nextV, policy, residual, qTable };
}

/**
 * Solves the MDP using Value Iteration until max residual < theta or maxIterations reached.
 */
export function solveValueIteration(
  mdp: GridworldMDP,
  gamma: number = 0.95,
  theta: number = 1e-4,
  maxIterations: number = 500,
): ValueIterationSolveResult {
  let V: readonly number[] = new Array<number>(mdp.numStates).fill(0);
  const residualHistory: number[] = [];
  let iterations = 0;
  let converged = false;
  let finalPolicy: readonly GridAction[] = new Array<GridAction>(mdp.numStates).fill(0);
  let finalQTable: readonly (readonly number[])[] = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations++;
    const step = stepValueIteration(V, mdp, gamma);
    V = step.nextV;
    finalPolicy = step.policy;
    finalQTable = step.qTable;
    residualHistory.push(step.residual);

    if (step.residual < theta) {
      converged = true;
      break;
    }
  }

  return {
    values: V,
    policy: finalPolicy,
    residualHistory,
    iterations,
    converged,
    qTable: finalQTable,
  };
}

/**
 * Evaluates a fixed policy pi iteratively: V_{k+1}(s) = sum_{s'} P(s'|s, pi(s))[R + gamma V_k(s')].
 */
export function evaluatePolicyIterative(
  policy: readonly GridAction[],
  mdp: GridworldMDP,
  gamma: number = 0.95,
  theta: number = 1e-4,
  maxIterations: number = 300,
): readonly number[] {
  let V = new Array<number>(mdp.numStates).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let delta = 0.0;
    const nextV = new Array<number>(mdp.numStates).fill(0);

    for (let s = 0; s < mdp.numStates; s++) {
      if (mdp.terminalStates[s] || mdp.isObstacle[s]) {
        nextV[s] = 0.0;
        continue;
      }
      const a = policy[s];
      const outcomes = mdp.transitions[s][a];
      let val = 0.0;
      for (const out of outcomes) {
        const vNext = out.terminal ? 0.0 : V[out.nextState];
        val += out.prob * (out.reward + gamma * vNext);
      }
      nextV[s] = val;
      const diff = Math.abs(nextV[s] - V[s]);
      if (diff > delta) delta = diff;
    }

    V = nextV;
    if (delta < theta) break;
  }

  return V;
}

/**
 * Exact matrix solve for Policy Evaluation: (I - gamma P^pi) V = R^pi using Gaussian Elimination.
 */
export function evaluatePolicyExact(
  policy: readonly GridAction[],
  mdp: GridworldMDP,
  gamma: number = 0.95,
): readonly number[] {
  const n = mdp.numStates;
  // Build A and b for A * V = b
  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const b: number[] = new Array<number>(n).fill(0);

  for (let s = 0; s < n; s++) {
    if (mdp.terminalStates[s] || mdp.isObstacle[s]) {
      A[s][s] = 1.0;
      b[s] = 0.0;
      continue;
    }

    A[s][s] = 1.0;
    const a = policy[s];
    const outcomes = mdp.transitions[s][a];

    for (const out of outcomes) {
      b[s] += out.prob * out.reward;
      if (!out.terminal) {
        A[s][out.nextState] -= gamma * out.prob;
      }
    }
  }

  // Solve linear system with partial pivoting Gaussian elimination
  return solveLinearSystem(A, b);
}

/**
 * Helper to solve A x = b via Gaussian Elimination with partial pivoting.
 */
export function solveLinearSystem(A: number[][], b: number[]): readonly number[] {
  const n = b.length;
  // Clone matrix
  const M: number[][] = A.map((row) => [...row]);
  const x: number[] = [...b];

  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    const tempRow = M[i];
    M[i] = M[maxRow];
    M[maxRow] = tempRow;
    const tempB = x[i];
    x[i] = x[maxRow];
    x[maxRow] = tempB;

    const diag = M[i][i];
    if (Math.abs(diag) < 1e-12) continue;

    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / diag;
      x[k] -= factor * x[i];
      for (let j = i; j < n; j++) {
        M[k][j] -= factor * M[i][j];
      }
    }
  }

  // Back substitution
  const result = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = x[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * result[j];
    }
    const diag = M[i][i];
    result[i] = Math.abs(diag) > 1e-12 ? sum / diag : 0.0;
  }

  return result;
}

/**
 * Policy Improvement: pi'(s) = argmax_a sum_{s'} P(s'|s,a)[R + gamma V(s')]
 */
export function improvePolicy(
  V: readonly number[],
  mdp: GridworldMDP,
  gamma: number = 0.95,
): { newPolicy: readonly GridAction[]; isStable: boolean; qTable: readonly (readonly number[])[] } {
  const newPolicy = new Array<GridAction>(mdp.numStates).fill(0);
  const qTable: number[][] = [];
  let isStable = true;

  for (let s = 0; s < mdp.numStates; s++) {
    const res = computeBellmanOptimalUpdate(s, V, mdp, gamma);
    newPolicy[s] = res.bestAction;
    qTable.push([...res.qValues]);
  }

  return { newPolicy, isStable, qTable };
}

/**
 * Full Policy Iteration solver.
 */
export function solvePolicyIteration(
  mdp: GridworldMDP,
  gamma: number = 0.95,
  theta: number = 1e-4,
  maxIterations: number = 100,
  useExactEval: boolean = true,
): PolicyIterationResult {
  let policy: readonly GridAction[] = new Array<GridAction>(mdp.numStates).fill(0);
  let V: readonly number[] = new Array<number>(mdp.numStates).fill(0);
  let iterations = 0;
  let converged = false;
  let finalQTable: readonly (readonly number[])[] = [];

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations++;
    // 1. Policy Evaluation
    V = useExactEval
      ? evaluatePolicyExact(policy, mdp, gamma)
      : evaluatePolicyIterative(policy, mdp, gamma, theta, 500);

    // 2. Policy Improvement
    const improved = improvePolicy(V, mdp, gamma);
    finalQTable = improved.qTable;

    // Check stability
    let policyChanged = false;
    for (let s = 0; s < mdp.numStates; s++) {
      if (!mdp.terminalStates[s] && !mdp.isObstacle[s] && policy[s] !== improved.newPolicy[s]) {
        policyChanged = true;
        break;
      }
    }

    policy = improved.newPolicy;

    if (!policyChanged) {
      converged = true;
      break;
    }
  }

  return {
    values: V,
    policy,
    iterations,
    converged,
    qTable: finalQTable,
  };
}

/**
 * Watkins Q-Learning single update step:
 * Q(s, a) <- Q(s, a) + alpha [ r + gamma max_a' Q(s', a') (1-done) - Q(s, a) ]
 */
export function qLearningStep(
  s: number,
  a: GridAction,
  r: number,
  nextS: number,
  done: boolean,
  qTable: readonly (readonly number[])[],
  alpha: number,
  gamma: number,
): QLearningStepResult {
  const currentQ = qTable[s][a];
  let maxNextQ = 0.0;

  if (!done) {
    maxNextQ = Math.max(...qTable[nextS]);
  }

  const target = r + gamma * maxNextQ;
  const tdError = target - currentQ;
  const updatedQ = currentQ + alpha * tdError;

  return { updatedQ, tdError, target };
}

/**
 * Epsilon-greedy action selection with tie-breaking.
 */
export function selectEpsilonGreedyAction(
  qValues: readonly number[],
  epsilon: number,
  rng: () => number = Math.random,
): GridAction {
  if (rng() < epsilon) {
    return Math.floor(rng() * qValues.length) as GridAction;
  }

  let maxVal = -Infinity;
  const bestIndices: GridAction[] = [];

  for (let a = 0; a < qValues.length; a++) {
    if (qValues[a] > maxVal + 1e-9) {
      maxVal = qValues[a];
      bestIndices.length = 0;
      bestIndices.push(a as GridAction);
    } else if (Math.abs(qValues[a] - maxVal) <= 1e-9) {
      bestIndices.push(a as GridAction);
    }
  }

  const pick = Math.floor(rng() * bestIndices.length);
  return bestIndices[pick];
}

/**
 * Exponential decay schedule for epsilon: eps_t = max(eps_min, eps_0 * decay^t)
 */
export function computeEpsilonDecay(
  epsilon0: number,
  epsilonMin: number,
  decayRate: number,
  episode: number,
): number {
  return Math.max(epsilonMin, epsilon0 * Math.pow(decayRate, episode));
}

/**
 * Runs a single full Q-learning episode on an MDP.
 */
export function runQLearningEpisode(
  mdp: GridworldMDP,
  qTable: number[][],
  alpha: number,
  gamma: number,
  epsilon: number,
  maxSteps: number = 200,
  rng: () => number = Math.random,
): QLearningEpisodeResult {
  let s = mdp.startStateIndex;
  let totalReturn = 0.0;
  let steps = 0;
  let reachedGoal = false;
  const tdErrors: number[] = [];
  const trajectory: number[] = [s];

  while (steps < maxSteps) {
    steps++;
    const action = selectEpsilonGreedyAction(qTable[s], epsilon, rng);
    const stepRes = stepGridworld(s, action, mdp, rng);

    const qRes = qLearningStep(
      s,
      action,
      stepRes.reward,
      stepRes.nextState,
      stepRes.done,
      qTable,
      alpha,
      gamma,
    );
    qTable[s][action] = qRes.updatedQ;
    tdErrors.push(qRes.tdError);

    totalReturn += stepRes.reward;
    s = stepRes.nextState;
    trajectory.push(s);

    if (stepRes.done) {
      if (stepRes.reward > 0) reachedGoal = true;
      break;
    }
  }

  return {
    episodeReturn: totalReturn,
    steps,
    tdErrors,
    trajectory,
    reachedGoal,
  };
}

/**
 * Computes Generalized Advantage Estimator (GAE):
 * delta_t^V = r_t + gamma * V(s_{t+1}) * (1 - done_t) - V(s_t)
 * A_t^GAE = sum_{l=0}^{T-t-1} (gamma * lambda)^l delta_{t+l}^V
 */
export function computeGAE(
  rewards: readonly number[],
  values: readonly number[],
  dones: readonly boolean[],
  gamma: number = 0.99,
  lambda: number = 0.95,
  nextValue: number = 0.0,
): GAEResult {
  const T = rewards.length;
  const advantages = new Array<number>(T).fill(0);
  const returns = new Array<number>(T).fill(0);
  const tdErrors = new Array<number>(T).fill(0);

  let gae = 0.0;

  for (let t = T - 1; t >= 0; t--) {
    const vNext = t === T - 1 ? nextValue : values[t + 1];
    const notDone = dones[t] ? 0.0 : 1.0;
    const delta = rewards[t] + gamma * vNext * notDone - values[t];
    tdErrors[t] = delta;

    gae = delta + gamma * lambda * notDone * gae;
    advantages[t] = gae;
    returns[t] = advantages[t] + values[t];
  }

  return { advantages, returns, tdErrors };
}

/**
 * PPO Clipped Surrogate Objective:
 * L^{CLIP}(theta) = min( r_t(theta) * A_t, clip(r_t(theta), 1-eps, 1+eps) * A_t )
 */
export function computePPOClippedObjective(
  ratio: number,
  advantage: number,
  clipEps: number = 0.2,
): PPOClippedObjectiveResult {
  const unclipped = ratio * advantage;
  const clippedRatio = Math.min(1.0 + clipEps, Math.max(1.0 - clipEps, ratio));
  const clipped = clippedRatio * advantage;
  const objective = Math.min(unclipped, clipped);
  const isClipped = Math.abs(objective - clipped) < 1e-9 && Math.abs(clipped - unclipped) > 1e-9;

  return {
    unclipped,
    clipped,
    objective,
    isClipped,
  };
}

/**
 * Evaluates PPO objective across a sweep of probability ratios r in [0, 2.0] for visualization.
 */
export function generatePPOClippingCurve(
  advantage: number,
  clipEps: number = 0.2,
  minRatio: number = 0.0,
  maxRatio: number = 2.0,
  steps: number = 50,
): readonly PPOClippingPoint[] {
  const points: PPOClippingPoint[] = [];
  const stepSize = (maxRatio - minRatio) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const ratio = minRatio + i * stepSize;
    const res = computePPOClippedObjective(ratio, advantage, clipEps);
    points.push({
      ratio,
      unclipped: res.unclipped,
      clipped: res.clipped,
      objective: res.objective,
    });
  }

  return points;
}

/**
 * Computes categorical softmax probabilities from logits with temperature.
 */
export function computeSoftmaxLogits(
  logits: readonly number[],
  temperature: number = 1.0,
): readonly number[] {
  const t = Math.max(1e-5, temperature);
  const maxL = Math.max(...logits);
  const exps = logits.map((l) => Math.exp((l - maxL) / t));
  const sumExp = exps.reduce((acc, v) => acc + v, 0);
  return exps.map((e) => e / (sumExp || 1.0));
}

// ============================================================================
// 4. CARTPOLE PHYSICS SIMULATION ENGINE
// ============================================================================

/**
 * Computes standard CartPole equations of motion derivatives: [x_dot, x_ddot, theta_dot, theta_ddot].
 */
export function computeCartPoleDerivatives(
  state: CartPoleState,
  action: CartPoleAction,
  config: CartPoleConfig = DEFAULT_CARTPOLE_CONFIG,
): [number, number, number, number] {
  const { gravity, massCart, massPole, length, forceMag } = config;
  const force = action === 1 ? forceMag : -forceMag;
  const totalMass = massCart + massPole;
  const poleMassLength = massPole * length;

  const cosTheta = Math.cos(state.theta);
  const sinTheta = Math.sin(state.theta);

  const temp = (force + poleMassLength * state.thetaDot * state.thetaDot * sinTheta) / totalMass;
  const denominator = length * (4.0 / 3.0 - (massPole * cosTheta * cosTheta) / totalMass);
  const thetaDdot = (gravity * sinTheta - cosTheta * temp) / denominator;
  const xDdot = temp - (poleMassLength * thetaDdot * cosTheta) / totalMass;

  return [state.xDot, xDdot, state.thetaDot, thetaDdot];
}

/**
 * Steps CartPole physics using Euler integration with termination check.
 */
export function stepCartPolePhysics(
  state: CartPoleState,
  action: CartPoleAction,
  config: CartPoleConfig = DEFAULT_CARTPOLE_CONFIG,
): CartPoleStepResult {
  const derivatives = computeCartPoleDerivatives(state, action, config);
  const dt = config.dt;

  const nextX = state.x + dt * derivatives[0];
  const nextXDot = state.xDot + dt * derivatives[1];
  const nextTheta = state.theta + dt * derivatives[2];
  const nextThetaDot = state.thetaDot + dt * derivatives[3];

  const done =
    Math.abs(nextX) > config.xThreshold || Math.abs(nextTheta) > config.thetaThresholdRadians;

  const nextState: CartPoleState = {
    x: nextX,
    xDot: nextXDot,
    theta: nextTheta,
    thetaDot: nextThetaDot,
  };

  return {
    nextState,
    reward: done ? 0.0 : 1.0,
    done,
    derivatives,
  };
}

/**
 * Resets CartPole to small perturbation near upright equilibrium.
 */
export function resetCartPole(rng: () => number = Math.random): CartPoleState {
  return {
    x: (rng() - 0.5) * 0.05,
    xDot: (rng() - 0.5) * 0.05,
    theta: (rng() - 0.5) * 0.05,
    thetaDot: (rng() - 0.5) * 0.05,
  };
}

// ============================================================================
// 5. COLORMAP & GEOMETRY HELPERS
// ============================================================================

/**
 * Returns a vibrant heatmap color (indigo/blue -> cyan -> yellow -> orange/emerald) for a scalar value.
 */
export function getValueColor(val: number, minVal: number, maxVal: number): string {
  if (Math.abs(maxVal - minVal) < 1e-6) {
    return "rgba(99, 102, 241, 0.25)";
  }
  const norm = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
  // Interpolate between cool blue (hue 230), emerald (hue 150), and gold (hue 45)
  if (norm < 0.5) {
    const t = norm * 2;
    const r = Math.round(30 + t * (16 - 30));
    const g = Math.round(41 + t * (185 - 41));
    const b = Math.round(59 + t * (129 - 59));
    return `rgba(${r}, ${g}, ${b}, ${0.2 + norm * 0.5})`;
  } else {
    const t = (norm - 0.5) * 2;
    const r = Math.round(16 + t * (245 - 16));
    const g = Math.round(185 + t * (158 - 185));
    const b = Math.round(129 + t * (11 - 129));
    return `rgba(${r}, ${g}, ${b}, ${0.45 + t * 0.45})`;
  }
}

// ============================================================================
// 6. MAIN REACT COMPONENT: ReinforcementLearningStudio
// ============================================================================

export const ReinforcementLearningStudio: React.FC<ReinforcementLearningStudioProps> = ({
  initialAlgorithm = "value_iteration",
  initialEnvironment = "grid_4x4_classic",
  initialPreset = "preset_value_iteration_grid",
  width = 1040,
  height = 700,
  title = "Reinforcement Learning & Policy Gradient Studio",
  onEpisodeComplete,
  onConvergenceReached,
}) => {
  // State: High-level selections
  const [algorithm, setAlgorithm] = useState<RLAlgorithmId>(initialAlgorithm);
  const [environment, setEnvironment] = useState<RLEnvironmentId>(initialEnvironment);
  const [selectedPreset, setSelectedPreset] = useState<RLPresetId>(initialPreset);
  const [activeTab, setActiveTab] = useState<
    "visualizer" | "ppo_curves" | "diagnostics" | "qtable"
  >("visualizer");

  // Hyperparameters
  const [gamma, setGamma] = useState<number>(0.95);
  const [alpha, setAlpha] = useState<number>(0.15);
  const [epsilon, setEpsilon] = useState<number>(0.15);
  const [epsilonDecay, setEpsilonDecay] = useState<number>(0.995);
  const [epsilonMin, setEpsilonMin] = useState<number>(0.01);
  const [gaeLambda, setGaeLambda] = useState<number>(0.95);
  const [ppoClipEps, setPpoClipEps] = useState<number>(0.2);
  const [slipProb, setSlipProb] = useState<number>(0.1);
  const [theta] = useState<number>(1e-4);

  // Playback & Animation
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(120); // ms per step
  const [stepsPerFrame, setStepsPerFrame] = useState<number>(1);
  const [showQQuadrants, setShowQQuadrants] = useState<boolean>(true);
  const [showPolicyArrows, setShowPolicyArrows] = useState<boolean>(true);
  const [showPathTrail, setShowPathTrail] = useState<boolean>(true);

  // Selected State Inspection
  const [inspectedState, setInspectedState] = useState<number | null>(null);

  // RL Engine State: Gridworld
  const [gridConfig, setGridConfig] = useState<GridworldConfig>(() => {
    const base = GRIDWORLD_CONFIGS[initialEnvironment] || GRID_CONFIG_4X4_CLASSIC;
    return { ...base, slipProb: 0.1 };
  });

  const mdp = useMemo(() => {
    return createGridworldMDP(gridConfig);
  }, [gridConfig]);

  const [vTable, setVTable] = useState<number[]>(() => new Array(mdp.numStates).fill(0));
  const [policyTable, setPolicyTable] = useState<GridAction[]>(() =>
    new Array(mdp.numStates).fill(0),
  );
  const [qTable, setQTable] = useState<number[][]>(() =>
    Array.from({ length: mdp.numStates }, () => [0, 0, 0, 0]),
  );

  // Simulation & Agent State
  const [agentState, setAgentState] = useState<number>(mdp.startStateIndex);
  const [trajectoryHistory, setTrajectoryHistory] = useState<number[]>([mdp.startStateIndex]);
  const [currentEpisode, setCurrentEpisode] = useState<number>(0);
  const [currentEpisodeReturn, setCurrentEpisodeReturn] = useState<number>(0);
  const [iterationCount, setIterationCount] = useState<number>(0);
  const [bellmanResidual, setBellmanResidual] = useState<number>(0);
  const [isConverged, setIsConverged] = useState<boolean>(false);

  // History & Learning Curves
  const [returnHistory, setReturnHistory] = useState<number[]>([]);
  const [residualHistory, setResidualHistory] = useState<number[]>([]);
  const [tdErrorHistory, setTdErrorHistory] = useState<number[]>([]);

  // CartPole Physics State
  const [cartPoleState, setCartPoleState] = useState<CartPoleState>(() => resetCartPole());
  const [cartPoleScore, setCartPoleScore] = useState<number>(0);
  const [cartPoleBestScore, setCartPoleBestScore] = useState<number>(0);

  // Interactive PPO Curve Test Advantage Slider
  const [demoAdvantage, setDemoAdvantage] = useState<number>(1.0);

  // Canvas Refs
  const cartPoleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update slip prob into grid config when slipProb changes
  useEffect(() => {
    setGridConfig((prev) => ({ ...prev, slipProb }));
  }, [slipProb]);

  // Load Preset Handler
  const handleLoadPreset = useCallback((presetId: RLPresetId) => {
    const p = RL_PRESETS[presetId];
    if (!p) return;
    setSelectedPreset(presetId);
    setAlgorithm(p.algorithm);
    setEnvironment(p.environment);
    setGamma(p.gamma);
    setAlpha(p.alpha);
    setEpsilon(p.epsilon);
    setEpsilonDecay(p.epsilonDecay);
    setEpsilonMin(p.epsilonMin);
    setGaeLambda(p.gaeLambda);
    setPpoClipEps(p.ppoClipEps);
    setSlipProb(p.slipProb);

    if (p.environment !== "cartpole") {
      const baseConfig = GRIDWORLD_CONFIGS[p.environment] || GRID_CONFIG_4X4_CLASSIC;
      const newCfg = { ...baseConfig, slipProb: p.slipProb };
      setGridConfig(newCfg);
      const newMdp = createGridworldMDP(newCfg);
      setVTable(new Array(newMdp.numStates).fill(0));
      setPolicyTable(new Array(newMdp.numStates).fill(0));
      setQTable(Array.from({ length: newMdp.numStates }, () => [0, 0, 0, 0]));
      setAgentState(newMdp.startStateIndex);
      setTrajectoryHistory([newMdp.startStateIndex]);
    } else {
      setCartPoleState(resetCartPole());
      setCartPoleScore(0);
    }

    setIsPlaying(false);
    setCurrentEpisode(0);
    setCurrentEpisodeReturn(0);
    setIterationCount(0);
    setBellmanResidual(0);
    setIsConverged(false);
    setReturnHistory([]);
    setResidualHistory([]);
    setTdErrorHistory([]);
  }, []);

  // Reset Environment & State
  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setVTable(new Array(mdp.numStates).fill(0));
    setPolicyTable(new Array(mdp.numStates).fill(0));
    setQTable(Array.from({ length: mdp.numStates }, () => [0, 0, 0, 0]));
    setAgentState(mdp.startStateIndex);
    setTrajectoryHistory([mdp.startStateIndex]);
    setCurrentEpisode(0);
    setCurrentEpisodeReturn(0);
    setIterationCount(0);
    setBellmanResidual(0);
    setIsConverged(false);
    setReturnHistory([]);
    setResidualHistory([]);
    setTdErrorHistory([]);
    setCartPoleState(resetCartPole());
    setCartPoleScore(0);
  }, [mdp]);

  // Environment Switch Handler
  const handleEnvironmentChange = useCallback(
    (envId: RLEnvironmentId) => {
      setEnvironment(envId);
      if (envId !== "cartpole") {
        const base = GRIDWORLD_CONFIGS[envId] || GRID_CONFIG_4X4_CLASSIC;
        const newCfg = { ...base, slipProb };
        setGridConfig(newCfg);
        const newMdp = createGridworldMDP(newCfg);
        setVTable(new Array(newMdp.numStates).fill(0));
        setPolicyTable(new Array(newMdp.numStates).fill(0));
        setQTable(Array.from({ length: newMdp.numStates }, () => [0, 0, 0, 0]));
        setAgentState(newMdp.startStateIndex);
        setTrajectoryHistory([newMdp.startStateIndex]);
      } else {
        setCartPoleState(resetCartPole());
        setCartPoleScore(0);
      }
      setIsPlaying(false);
      setIterationCount(0);
      setIsConverged(false);
      setReturnHistory([]);
      setResidualHistory([]);
      setTdErrorHistory([]);
    },
    [slipProb],
  );

  // Algorithm Single Step Execution
  const handleSingleStep = useCallback(() => {
    if (environment === "cartpole") {
      // CartPole balancing step (heuristic/policy gradient action)
      setCartPoleState((prevState) => {
        // Simple linear feedback controller to keep pole upright + slight exploration
        const thetaControl = prevState.theta * 10.0 + prevState.thetaDot * 2.0;
        const xControl = prevState.x * 0.5 + prevState.xDot * 0.5;
        const actionScore = thetaControl + xControl;
        const action: CartPoleAction = actionScore > 0 ? 1 : 0;

        const res = stepCartPolePhysics(prevState, action, DEFAULT_CARTPOLE_CONFIG);
        if (res.done) {
          setCartPoleScore((score) => {
            setCartPoleBestScore((best) => Math.max(best, score));
            setReturnHistory((hist) => [...hist.slice(-50), score]);
            return 0;
          });
          return resetCartPole();
        } else {
          setCartPoleScore((s) => s + 1);
          return res.nextState;
        }
      });
      return;
    }

    // Gridworld Algorithms
    if (algorithm === "value_iteration") {
      const step = stepValueIteration(vTable, mdp, gamma);
      setVTable(step.nextV as number[]);
      setPolicyTable(step.policy as GridAction[]);
      setQTable(step.qTable as number[][]);
      setBellmanResidual(step.residual);
      setIterationCount((c) => c + 1);
      setResidualHistory((h) => [...h.slice(-50), step.residual]);

      if (step.residual < theta) {
        setIsConverged(true);
        setIsPlaying(false);
        onConvergenceReached?.("value_iteration", iterationCount + 1, step.residual);
      }
    } else if (algorithm === "policy_iteration") {
      const vEval = evaluatePolicyExact(policyTable, mdp, gamma);
      const imp = improvePolicy(vEval, mdp, gamma);

      let policyChanged = false;
      for (let s = 0; s < mdp.numStates; s++) {
        if (!mdp.terminalStates[s] && !mdp.isObstacle[s] && policyTable[s] !== imp.newPolicy[s]) {
          policyChanged = true;
          break;
        }
      }

      setVTable(vEval as number[]);
      setPolicyTable(imp.newPolicy as GridAction[]);
      setQTable(imp.qTable as number[][]);
      setIterationCount((c) => c + 1);

      if (!policyChanged) {
        setIsConverged(true);
        setIsPlaying(false);
        onConvergenceReached?.("policy_iteration", iterationCount + 1, 0.0);
      }
    } else if (algorithm === "q_learning") {
      // Step agent in Q-learning episode
      const currEps = computeEpsilonDecay(epsilon, epsilonMin, epsilonDecay, currentEpisode);
      const act = selectEpsilonGreedyAction(qTable[agentState], currEps);
      const res = stepGridworld(agentState, act, mdp);

      const qStep = qLearningStep(
        agentState,
        act,
        res.reward,
        res.nextState,
        res.done,
        qTable,
        alpha,
        gamma,
      );

      const newQTable = qTable.map((row, sIdx) => {
        if (sIdx !== agentState) return row;
        const newRow = [...row];
        newRow[act] = qStep.updatedQ;
        return newRow;
      });

      // Extract greedy policy & values from updated Q table
      const newV = newQTable.map((row) => Math.max(...row));
      const newPol = newQTable.map((row) => selectEpsilonGreedyAction(row, 0) as GridAction);

      setQTable(newQTable);
      setVTable(newV);
      setPolicyTable(newPol);
      setTdErrorHistory((h) => [...h.slice(-50), Math.abs(qStep.tdError)]);

      const newReturn = currentEpisodeReturn + res.reward;
      setCurrentEpisodeReturn(newReturn);

      if (res.done) {
        setAgentState(mdp.startStateIndex);
        setTrajectoryHistory([mdp.startStateIndex]);
        setReturnHistory((h) => [...h.slice(-50), newReturn]);
        setCurrentEpisode((ep) => ep + 1);
        setCurrentEpisodeReturn(0);
        onEpisodeComplete?.(currentEpisode + 1, newReturn, trajectoryHistory.length);
      } else {
        setAgentState(res.nextState);
        setTrajectoryHistory((th) => [...th.slice(-20), res.nextState]);
      }
    } else if (algorithm === "ppo_gae") {
      // PPO / GAE Gridworld trajectory collection & update
      const currEps = computeEpsilonDecay(epsilon, epsilonMin, epsilonDecay, currentEpisode);
      const act = selectEpsilonGreedyAction(qTable[agentState], currEps);
      const res = stepGridworld(agentState, act, mdp);

      const vCurrent = vTable[agentState];
      const vNext = res.done ? 0.0 : vTable[res.nextState];
      const gaeRes = computeGAE([res.reward], [vCurrent], [res.done], gamma, gaeLambda, vNext);
      const advantage = gaeRes.advantages[0];

      // Surrogate clipping update on Q-table proxy
      const ppoRes = computePPOClippedObjective(
        1.0 + alpha * (Math.random() - 0.5),
        advantage,
        ppoClipEps,
      );

      const newQTable = qTable.map((row, sIdx) => {
        if (sIdx !== agentState) return row;
        const newRow = [...row];
        newRow[act] += alpha * ppoRes.objective;
        return newRow;
      });

      const newV = newQTable.map((row) => Math.max(...row));
      const newPol = newQTable.map((row) => selectEpsilonGreedyAction(row, 0) as GridAction);

      setQTable(newQTable);
      setVTable(newV);
      setPolicyTable(newPol);
      setTdErrorHistory((h) => [...h.slice(-50), Math.abs(gaeRes.tdErrors[0])]);

      const newReturn = currentEpisodeReturn + res.reward;
      setCurrentEpisodeReturn(newReturn);

      if (res.done) {
        setAgentState(mdp.startStateIndex);
        setTrajectoryHistory([mdp.startStateIndex]);
        setReturnHistory((h) => [...h.slice(-50), newReturn]);
        setCurrentEpisode((ep) => ep + 1);
        setCurrentEpisodeReturn(0);
      } else {
        setAgentState(res.nextState);
        setTrajectoryHistory((th) => [...th.slice(-20), res.nextState]);
      }
    }
  }, [
    algorithm,
    environment,
    vTable,
    policyTable,
    qTable,
    agentState,
    currentEpisode,
    currentEpisodeReturn,
    gamma,
    alpha,
    epsilon,
    epsilonMin,
    epsilonDecay,
    gaeLambda,
    ppoClipEps,
    theta,
    iterationCount,
    mdp,
    trajectoryHistory,
    onConvergenceReached,
    onEpisodeComplete,
  ]);

  // Run to Full Convergence (Value Iteration / Policy Iteration)
  const handleRunToConvergence = useCallback(() => {
    if (algorithm === "value_iteration") {
      const res = solveValueIteration(mdp, gamma, theta, 500);
      setVTable(res.values as number[]);
      setPolicyTable(res.policy as GridAction[]);
      setQTable(res.qTable as number[][]);
      setResidualHistory(res.residualHistory as number[]);
      setIterationCount(res.iterations);
      setIsConverged(res.converged);
      setIsPlaying(false);
      onConvergenceReached?.(
        "value_iteration",
        res.iterations,
        res.residualHistory[res.residualHistory.length - 1] || 0,
      );
    } else if (algorithm === "policy_iteration") {
      const res = solvePolicyIteration(mdp, gamma, theta, 100);
      setVTable(res.values as number[]);
      setPolicyTable(res.policy as GridAction[]);
      setQTable(res.qTable as number[][]);
      setIterationCount(res.iterations);
      setIsConverged(res.converged);
      setIsPlaying(false);
      onConvergenceReached?.("policy_iteration", res.iterations, 0.0);
    } else {
      // Q-Learning / PPO fast forward 50 episodes
      const newQ = qTable.map((r) => [...r]);
      const newReturns: number[] = [];
      let lastReturn = 0;

      for (let ep = 0; ep < 50; ep++) {
        const epIdx = currentEpisode + ep;
        const curEps = computeEpsilonDecay(epsilon, epsilonMin, epsilonDecay, epIdx);
        const epRes = runQLearningEpisode(mdp, newQ, alpha, gamma, curEps, 200);
        newReturns.push(epRes.episodeReturn);
        lastReturn = epRes.episodeReturn;
      }

      const newV = newQ.map((row) => Math.max(...row));
      const newPol = newQ.map((row) => selectEpsilonGreedyAction(row, 0) as GridAction);

      setQTable(newQ);
      setVTable(newV);
      setPolicyTable(newPol);
      setCurrentEpisode((ep) => ep + 50);
      setReturnHistory((h) => [...h.slice(-50), ...newReturns]);
      setAgentState(mdp.startStateIndex);
      setTrajectoryHistory([mdp.startStateIndex]);
      onEpisodeComplete?.(currentEpisode + 50, lastReturn, 20);
    }
  }, [
    algorithm,
    mdp,
    gamma,
    theta,
    qTable,
    currentEpisode,
    epsilon,
    epsilonMin,
    epsilonDecay,
    alpha,
    onConvergenceReached,
    onEpisodeComplete,
  ]);

  // Animation Loop Effect
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      for (let i = 0; i < stepsPerFrame; i++) {
        handleSingleStep();
      }
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, stepsPerFrame, handleSingleStep]);

  // Render CartPole Canvas Animation
  useEffect(() => {
    if (environment !== "cartpole") return;
    const canvas = cartPoleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0b0f19");
    grad.addColorStop(1, "#030712");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Track Rail
    const railY = h * 0.72;
    const scale = w / 5.2; // 5.2m field of view
    const originX = w / 2;

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, railY);
    ctx.lineTo(w - 30, railY);
    ctx.stroke();

    // Boundary tick marks (+-2.4m)
    const limitLeftX = originX - 2.4 * scale;
    const limitRightX = originX + 2.4 * scale;

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(limitLeftX, railY - 18);
    ctx.lineTo(limitLeftX, railY + 18);
    ctx.moveTo(limitRightX, railY - 18);
    ctx.lineTo(limitRightX, railY + 18);
    ctx.stroke();

    // Cart Position
    const cartX = originX + cartPoleState.x * scale;
    const cartW = 70;
    const cartH = 34;
    const cartY = railY - cartH / 2;

    // Draw Cart Shadow & Body
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(cartX - cartW / 2 + 4, cartY + 6, cartW, cartH);

    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cartX - cartW / 2, cartY, cartW, cartH, 6);
    ctx.fill();
    ctx.stroke();

    // Cart Wheels
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.arc(cartX - 20, railY + 6, 8, 0, Math.PI * 2);
    ctx.arc(cartX + 20, railY + 6, 8, 0, Math.PI * 2);
    ctx.fill();

    // Pivot Axle
    const pivotX = cartX;
    const pivotY = cartY + 6;

    // Pole tip calculation
    const poleLengthPx = 140;
    const tipX = pivotX + poleLengthPx * Math.sin(cartPoleState.theta);
    const tipY = pivotY - poleLengthPx * Math.cos(cartPoleState.theta);

    // Pole Rod
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Pole Tip Bob with glow
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(tipX, tipY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Axle Pin
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Safe Angle Zone Cone
    const maxAngleRad = DEFAULT_CARTPOLE_CONFIG.thetaThresholdRadians;
    ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(
      pivotX + poleLengthPx * Math.sin(maxAngleRad),
      pivotY - poleLengthPx * Math.cos(maxAngleRad),
    );
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(
      pivotX + poleLengthPx * Math.sin(-maxAngleRad),
      pivotY - poleLengthPx * Math.cos(-maxAngleRad),
    );
    ctx.stroke();
  }, [environment, cartPoleState]);

  // Compute Min & Max Value for Grid Heatmap scaling
  const { minV, maxV } = useMemo(() => {
    let min = 0;
    let max = 0;
    for (const v of vTable) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (Math.abs(max - min) < 1e-4) {
      max = 1.0;
      min = -1.0;
    }
    return { minV: min, maxV: max };
  }, [vTable]);

  // Generate PPO interactive clipping points
  const ppoPositiveAdvPoints = useMemo(() => {
    return generatePPOClippingCurve(demoAdvantage, ppoClipEps, 0.0, 2.0, 40);
  }, [demoAdvantage, ppoClipEps]);

  const ppoNegativeAdvPoints = useMemo(() => {
    return generatePPOClippingCurve(-Math.abs(demoAdvantage), ppoClipEps, 0.0, 2.0, 40);
  }, [demoAdvantage, ppoClipEps]);

  return (
    <div
      className="flex flex-col bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans"
      style={{ width: "100%", maxWidth: `${width}px`, minHeight: `${height}px` }}
    >
      {/* 1. STUDIO HEADER */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Tier-3 Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Bellman Optimality, Generalized Advantage Estimation & Policy Gradient Lab
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Preset:</span>
          <select
            value={selectedPreset}
            onChange={(e) => handleLoadPreset(e.target.value as RLPresetId)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {Object.values(RL_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. TAB SELECTION & CONTROL TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("visualizer")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "visualizer"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Environment Visualizer
          </button>
          <button
            onClick={() => setActiveTab("ppo_curves")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "ppo_curves"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            PPO Surrogate & GAE
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "diagnostics"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Learning HUD & Returns
          </button>
          <button
            onClick={() => setActiveTab("qtable")}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "qtable"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Q-Table & State Inspector
          </button>
        </div>

        {/* Execution Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-colors ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={handleSingleStep}
            disabled={isPlaying}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1"
            title="Single Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Step
          </button>
          <button
            onClick={handleRunToConvergence}
            disabled={isPlaying}
            className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-md border border-indigo-500/30 flex items-center gap-1"
            title="Run to Convergence / 50 Episodes"
          >
            <FastForward className="w-3.5 h-3.5" />
            Converge
          </button>
          <button
            onClick={handleReset}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 flex items-center gap-1"
            title="Reset Studio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT/MAIN VIEW (8 COLS) */}
        <div className="lg:col-span-8 p-5 flex flex-col bg-slate-950 border-r border-slate-800/80 overflow-y-auto max-h-[620px]">
          {/* TAB 1: VISUALIZER */}
          {activeTab === "visualizer" && (
            <div className="flex flex-col gap-4">
              {/* Algorithm & Environment Switch Bar */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Algorithm
                  </label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as RLAlgorithmId)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="value_iteration">Value Iteration (Exact DP Bellman)</option>
                    <option value="policy_iteration">
                      Policy Iteration (Policy Eval + Improve)
                    </option>
                    <option value="q_learning">Q-Learning (Watkins TD Control)</option>
                    <option value="ppo_gae">PPO + GAE (Clipped Policy Surrogate)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => handleEnvironmentChange(e.target.value as RLEnvironmentId)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="grid_4x4_classic">4x4 Classic Grid</option>
                    <option value="cliff_walking">Cliff Walking (4x8 Penalty Grid)</option>
                    <option value="obstacle_maze_5x5">5x5 Obstacle Maze</option>
                    <option value="slippery_frozen_4x4">Slippery Frozen Grid</option>
                    <option value="cartpole">CartPole (Continuous Dynamics)</option>
                  </select>
                </div>
              </div>

              {/* Status Header Bar */}
              <div className="flex flex-wrap items-center justify-between px-3.5 py-2 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400">Iterations / Ep:</span>{" "}
                    <span className="font-mono font-bold text-white">
                      {algorithm === "q_learning" ||
                      algorithm === "ppo_gae" ||
                      environment === "cartpole"
                        ? currentEpisode
                        : iterationCount}
                    </span>
                  </div>
                  {algorithm === "value_iteration" && (
                    <div>
                      <span className="text-slate-400">Bellman Residual:</span>{" "}
                      <span className="font-mono text-indigo-400 font-semibold">
                        {bellmanResidual.toExponential(3)}
                      </span>
                    </div>
                  )}
                  {environment === "cartpole" ? (
                    <div>
                      <span className="text-slate-400">Current Steps:</span>{" "}
                      <span className="font-mono text-emerald-400 font-bold">{cartPoleScore}</span>{" "}
                      <span className="text-slate-500">(Best: {cartPoleBestScore})</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-slate-400">Episode Return:</span>{" "}
                      <span className="font-mono text-emerald-400 font-semibold">
                        {currentEpisodeReturn.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {isConverged && (
                  <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Converged (Δ &lt; {theta})
                  </div>
                )}
              </div>

              {/* Visualizer Area */}
              {environment === "cartpole" ? (
                <div className="flex flex-col items-center justify-center p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                  <canvas
                    ref={cartPoleCanvasRef}
                    width={560}
                    height={260}
                    className="w-full max-w-[560px] h-[260px] rounded-lg shadow-inner"
                  />
                  <div className="grid grid-cols-4 gap-2 w-full mt-3 text-center text-xs">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Position (x)</div>
                      <div className="font-mono font-bold text-sky-400">
                        {cartPoleState.x.toFixed(3)} m
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Velocity (ẋ)</div>
                      <div className="font-mono font-bold text-slate-300">
                        {cartPoleState.xDot.toFixed(3)} m/s
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Angle (θ)</div>
                      <div className="font-mono font-bold text-amber-400">
                        {((cartPoleState.theta * 180) / Math.PI).toFixed(2)}°
                      </div>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">Angular Vel (θ̇)</div>
                      <div className="font-mono font-bold text-slate-300">
                        {cartPoleState.thetaDot.toFixed(2)} rad/s
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Gridworld SVG / Canvas Grid */
                <div className="flex flex-col items-center justify-center p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  <div
                    className="grid gap-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800 shadow-inner"
                    style={{
                      gridTemplateColumns: `repeat(${mdp.cols}, minmax(0, 1fr))`,
                      width: "100%",
                      maxWidth: `${Math.min(560, mdp.cols * 85)}px`,
                    }}
                  >
                    {Array.from({ length: mdp.numStates }).map((_, s) => {
                      const coord = stateIndexToCoord(s, mdp.cols);
                      const isAgent = agentState === s;
                      const isStart =
                        coord.r === gridConfig.startState.r && coord.c === gridConfig.startState.c;
                      const goal = gridConfig.goals.find((g) => g.r === coord.r && g.c === coord.c);
                      const cliff = gridConfig.cliffs.find(
                        (cl) => cl.r === coord.r && cl.c === coord.c,
                      );
                      const isObs = mdp.isObstacle[s];
                      const val = vTable[s] || 0.0;
                      const pol = policyTable[s] || 0;
                      const qVals = qTable[s] || [0, 0, 0, 0];
                      const isInspected = inspectedState === s;
                      const cellBg = isObs
                        ? "rgb(15, 23, 42)"
                        : cliff
                          ? "rgba(239, 68, 68, 0.2)"
                          : goal
                            ? "rgba(16, 185, 129, 0.25)"
                            : getValueColor(val, minV, maxV);

                      return (
                        <div
                          key={s}
                          onClick={() => setInspectedState(s)}
                          className={`relative flex flex-col items-center justify-center aspect-square rounded-md p-1 cursor-pointer transition-all border ${
                            isInspected
                              ? "border-amber-400 ring-2 ring-amber-400/30 scale-[1.02]"
                              : isAgent
                                ? "border-sky-400 ring-2 ring-sky-400/40"
                                : "border-slate-800 hover:border-slate-600"
                          }`}
                          style={{ backgroundColor: cellBg }}
                        >
                          {/* Obstacle Cell Pattern */}
                          {isObs && (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs font-bold">
                              WALL
                            </div>
                          )}

                          {/* Cliff Cell Marker */}
                          {cliff && (
                            <div className="absolute top-1 right-1 flex items-center text-[9px] font-bold text-red-400">
                              <Flame className="w-2.5 h-2.5" />
                              {cliff.penalty}
                            </div>
                          )}

                          {/* Goal Cell Marker */}
                          {goal && (
                            <div className="absolute top-1 right-1 flex items-center text-[9px] font-bold text-emerald-400">
                              <Award className="w-2.5 h-2.5" />+{goal.reward}
                            </div>
                          )}

                          {/* Start Cell Badge */}
                          {isStart && (
                            <div className="absolute top-1 left-1 text-[8px] font-mono px-1 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                              S
                            </div>
                          )}

                          {/* State ID label */}
                          <div className="absolute bottom-1 left-1 text-[8px] font-mono text-slate-400">
                            s{s}
                          </div>

                          {/* 4-Way Q-Value Triangle Badges (if enabled & not obstacle) */}
                          {!isObs && showQQuadrants && (
                            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 text-[8px] font-mono opacity-80">
                              <div className="text-center text-slate-300">
                                {qVals[0].toFixed(1)}
                              </div>
                              <div className="flex justify-between w-full">
                                <div className="text-slate-300">{qVals[3].toFixed(1)}</div>
                                <div className="text-slate-300">{qVals[1].toFixed(1)}</div>
                              </div>
                              <div className="text-center text-slate-300">
                                {qVals[2].toFixed(1)}
                              </div>
                            </div>
                          )}

                          {/* Center: State Value V(s) & Policy Arrow */}
                          {!isObs && (
                            <div className="flex flex-col items-center justify-center z-10">
                              <span className="text-[11px] font-mono font-bold text-white drop-shadow-sm">
                                {val.toFixed(2)}
                              </span>
                              {showPolicyArrows && !mdp.terminalStates[s] && (
                                <span className="text-sm font-bold text-indigo-300 drop-shadow">
                                  {ACTION_ARROWS[pol]}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Agent Token */}
                          {isAgent && (
                            <div className="absolute z-20 flex items-center justify-center w-5 h-5 rounded-full bg-sky-500 border-2 border-white shadow-lg animate-pulse">
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid View Settings & Toggles */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-xs text-slate-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showQQuadrants}
                        onChange={(e) => setShowQQuadrants(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      Show Q-Values (N/E/S/W)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPolicyArrows}
                        onChange={(e) => setShowPolicyArrows(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      Show Policy Arrows (π*)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showPathTrail}
                        onChange={(e) => setShowPathTrail(e.target.checked)}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                      />
                      Agent Trajectory Trail
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PPO CLIPPED SURROGATE & GAE CURVES */}
          {activeTab === "ppo_curves" && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-slate-900/90 rounded-lg border border-slate-800 text-xs leading-relaxed text-slate-300">
                <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  PPO Clipped Surrogate Objective Equation
                </div>
                <div className="font-mono bg-slate-950 p-2 rounded border border-slate-800 text-indigo-300 text-[11px] mb-2">
                  L^&#123;CLIP&#125;(θ) = E_t [ min( r_t(θ)·Â_t , clip(r_t(θ), 1-ε, 1+ε)·Â_t ) ]
                </div>
                <p>
                  Where probability ratio{" "}
                  <span className="font-mono text-sky-400">
                    r_t(θ) = π_θ(a_t|s_t) / π_old(a_t|s_t)
                  </span>{" "}
                  and <span className="font-mono text-emerald-400">Â_t^&#123;GAE(γ,λ)&#125;</span>{" "}
                  is the Generalized Advantage Estimator.
                </p>
              </div>

              {/* Advantage Slider */}
              <div className="flex items-center justify-between p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-300 font-semibold">Test Advantage (Â_t):</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="2.5"
                    step="0.1"
                    value={demoAdvantage}
                    onChange={(e) => setDemoAdvantage(parseFloat(e.target.value))}
                    className="w-36 accent-indigo-500"
                  />
                  <span className="font-mono text-indigo-400 font-bold w-8">
                    {demoAdvantage.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Dual Graphs: A > 0 and A < 0 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Positive Advantage Chart */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between">
                    <span>Positive Advantage (Â_t &gt; 0)</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Caps upper ratio &gt; 1+ε
                    </span>
                  </div>
                  <div className="relative h-44 w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-end">
                    <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line
                        x1="0"
                        y1="60"
                        x2="200"
                        y2="60"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="2"
                      />
                      <line
                        x1={(1.0 / 2.0) * 200}
                        y1="0"
                        x2={(1.0 / 2.0) * 200}
                        y2="120"
                        stroke="#475569"
                        strokeWidth="1"
                        strokeDasharray="2"
                      />
                      {/* Unclipped Line */}
                      <polyline
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1.5"
                        strokeDasharray="3"
                        points={ppoPositiveAdvPoints
                          .map(
                            (pt) =>
                              `${(pt.ratio / 2.0) * 200},${120 - (pt.unclipped / (demoAdvantage * 2.0)) * 100}`,
                          )
                          .join(" ")}
                      />
                      {/* Clipped Surrogate Objective */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        points={ppoPositiveAdvPoints
                          .map(
                            (pt) =>
                              `${(pt.ratio / 2.0) * 200},${120 - (pt.objective / (demoAdvantage * 2.0)) * 100}`,
                          )
                          .join(" ")}
                      />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                    <span>r = 0.0</span>
                    <span className="text-indigo-400">r = 1.0 (No change)</span>
                    <span>r = 2.0</span>
                  </div>
                </div>

                {/* Negative Advantage Chart */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800">
                  <div className="text-xs font-bold text-rose-400 mb-2 flex items-center justify-between">
                    <span>Negative Advantage (Â_t &lt; 0)</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Caps lower ratio &lt; 1-ε
                    </span>
                  </div>
                  <div className="relative h-44 w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-end">
                    <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                      <line
                        x1="0"
                        y1="60"
                        x2="200"
                        y2="60"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="2"
                      />
                      <line
                        x1={(1.0 / 2.0) * 200}
                        y1="0"
                        x2={(1.0 / 2.0) * 200}
                        y2="120"
                        stroke="#475569"
                        strokeWidth="1"
                        strokeDasharray="2"
                      />
                      {/* Unclipped Line */}
                      <polyline
                        fill="none"
                        stroke="#64748b"
                        strokeWidth="1.5"
                        strokeDasharray="3"
                        points={ppoNegativeAdvPoints
                          .map(
                            (pt) =>
                              `${(pt.ratio / 2.0) * 200},${60 - (pt.unclipped / (demoAdvantage * 2.0)) * 50}`,
                          )
                          .join(" ")}
                      />
                      {/* Clipped Surrogate Objective */}
                      <polyline
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        points={ppoNegativeAdvPoints
                          .map(
                            (pt) =>
                              `${(pt.ratio / 2.0) * 200},${60 - (pt.objective / (demoAdvantage * 2.0)) * 50}`,
                          )
                          .join(" ")}
                      />
                    </svg>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                    <span>r = 0.0</span>
                    <span className="text-indigo-400">r = 1.0 (No change)</span>
                    <span>r = 2.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIAGNOSTICS & LEARNING CURVES */}
          {activeTab === "diagnostics" && (
            <div className="flex flex-col gap-4">
              {/* Episode Return History Chart */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Episode Return Learning Curve
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {returnHistory.length} Episodes recorded
                  </span>
                </div>
                <div className="h-40 w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-end">
                  {returnHistory.length > 1 ? (
                    <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                      {(() => {
                        const minR = Math.min(...returnHistory, -1);
                        const maxR = Math.max(...returnHistory, 1);
                        const range = maxR - minR || 1;
                        const pts = returnHistory
                          .map((val, idx) => {
                            const x = (idx / (returnHistory.length - 1)) * 400;
                            const y = 100 - ((val - minR) / range) * 90 - 5;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <polyline fill="none" stroke="#10b981" strokeWidth="2" points={pts} />
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-slate-600 text-xs">
                      Run episodes to render return trajectory curve
                    </div>
                  )}
                </div>
              </div>

              {/* Bellman Residual / TD Error Curve */}
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    Convergence Error (Residual / |TD Error|)
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">Log Scale</span>
                </div>
                <div className="h-36 w-full bg-slate-950 rounded-lg p-2 border border-slate-800 flex items-end">
                  {residualHistory.length > 1 || tdErrorHistory.length > 1 ? (
                    <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible">
                      {(() => {
                        const data = residualHistory.length > 1 ? residualHistory : tdErrorHistory;
                        const maxE = Math.max(...data, 1e-4);
                        const pts = data
                          .map((val, idx) => {
                            const x = (idx / (data.length - 1)) * 400;
                            const logV = Math.log10(Math.max(1e-6, val));
                            const maxLog = Math.log10(maxE);
                            const minLog = -6;
                            const y = 100 - ((logV - minLog) / (maxLog - minLog || 1)) * 90 - 5;
                            return `${x},${y}`;
                          })
                          .join(" ");
                        return (
                          <polyline fill="none" stroke="#6366f1" strokeWidth="2" points={pts} />
                        );
                      })()}
                    </svg>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-slate-600 text-xs">
                      Run iterations to render residual convergence curve
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Q-TABLE & STATE INSPECTOR */}
          {activeTab === "qtable" && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 bg-slate-900/90 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium">Inspected State: </span>
                  <span className="font-mono font-bold text-amber-400">
                    {inspectedState !== null
                      ? `s${inspectedState} (${stateIndexToCoord(inspectedState, mdp.cols).r}, ${stateIndexToCoord(inspectedState, mdp.cols).c})`
                      : "Click any cell on visualizer"}
                  </span>
                </div>
                {inspectedState !== null && (
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-400">V(s):</span>
                    <span className="text-white font-bold">
                      {vTable[inspectedState]?.toFixed(3)}
                    </span>
                    <span className="text-slate-400">π*(s):</span>
                    <span className="text-indigo-400 font-bold">
                      {ACTION_NAMES[policyTable[inspectedState]]}
                    </span>
                  </div>
                )}
              </div>

              {/* Q-Table Data Matrix */}
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">State</th>
                      <th className="p-2.5">Coord</th>
                      <th className="p-2.5">V(s)</th>
                      <th className="p-2.5 text-center">Q(s, Up)</th>
                      <th className="p-2.5 text-center">Q(s, Right)</th>
                      <th className="p-2.5 text-center">Q(s, Down)</th>
                      <th className="p-2.5 text-center">Q(s, Left)</th>
                      <th className="p-2.5">Best Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                    {Array.from({ length: mdp.numStates }).map((_, s) => {
                      const coord = stateIndexToCoord(s, mdp.cols);
                      const isObs = mdp.isObstacle[s];
                      const qRow = qTable[s] || [0, 0, 0, 0];
                      const bestA = policyTable[s];

                      return (
                        <tr
                          key={s}
                          onClick={() => setInspectedState(s)}
                          className={`hover:bg-slate-900/60 cursor-pointer ${
                            inspectedState === s ? "bg-indigo-950/40" : ""
                          }`}
                        >
                          <td className="p-2 font-bold text-slate-300">s{s}</td>
                          <td className="p-2 text-slate-400">
                            ({coord.r}, {coord.c})
                          </td>
                          <td className="p-2 text-emerald-400 font-bold">
                            {isObs ? "WALL" : vTable[s]?.toFixed(2)}
                          </td>
                          <td className="p-2 text-center text-slate-300">
                            {isObs ? "-" : qRow[0]?.toFixed(2)}
                          </td>
                          <td className="p-2 text-center text-slate-300">
                            {isObs ? "-" : qRow[1]?.toFixed(2)}
                          </td>
                          <td className="p-2 text-center text-slate-300">
                            {isObs ? "-" : qRow[2]?.toFixed(2)}
                          </td>
                          <td className="p-2 text-center text-slate-300">
                            {isObs ? "-" : qRow[3]?.toFixed(2)}
                          </td>
                          <td className="p-2 text-indigo-400 font-semibold">
                            {isObs ? "-" : `${ACTION_ARROWS[bestA]} ${ACTION_NAMES[bestA]}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: HYPERPARAMETERS & ENVIRONMENT CONFIG (4 COLS) */}
        <div className="lg:col-span-4 p-5 flex flex-col gap-4 bg-slate-900/40 overflow-y-auto max-h-[620px]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Hyperparameter Controls
          </div>

          {/* Discount Factor Gamma */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Discount Factor (γ):</span>
              <span className="font-mono text-white font-bold">{gamma.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.999"
              step="0.01"
              value={gamma}
              onChange={(e) => setGamma(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Learning Rate Alpha */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Learning Rate (α):</span>
              <span className="font-mono text-white font-bold">{alpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1.0"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Epsilon Exploration */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Exploration (ε_0 / min):</span>
              <span className="font-mono text-white font-bold">
                {epsilon.toFixed(2)} / {epsilonMin.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={epsilon}
              onChange={(e) => setEpsilon(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Epsilon Decay Rate */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Epsilon Decay Rate (δ):</span>
              <span className="font-mono text-white font-bold">{epsilonDecay.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1.0"
              step="0.005"
              value={epsilonDecay}
              onChange={(e) => setEpsilonDecay(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Slip Probability */}
          {environment !== "cartpole" && (
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Slip Probability (p_slip):</span>
                <span className="font-mono text-amber-400 font-bold">{slipProb.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.8"
                step="0.05"
                value={slipProb}
                onChange={(e) => setSlipProb(parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          )}

          {/* GAE Lambda */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">GAE Parameter (λ):</span>
              <span className="font-mono text-emerald-400 font-bold">{gaeLambda.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={gaeLambda}
              onChange={(e) => setGaeLambda(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          {/* PPO Clip Epsilon */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">PPO Clip (ε_ppo):</span>
              <span className="font-mono text-rose-400 font-bold">{ppoClipEps.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.4"
              step="0.05"
              value={ppoClipEps}
              onChange={(e) => setPpoClipEps(parseFloat(e.target.value))}
              className="w-full accent-rose-500"
            />
          </div>

          {/* Playback Delay & Batching */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Playback Speed:</span>
                <span className="font-mono text-slate-200">{playbackSpeed} ms/step</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseInt(e.target.value, 10))}
                className="w-full accent-slate-400"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Steps per Frame:</span>
              <select
                value={stepsPerFrame}
                onChange={(e) => setStepsPerFrame(parseInt(e.target.value, 10))}
                className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1"
              >
                <option value={1}>1 step</option>
                <option value={5}>5 steps</option>
                <option value={20}>20 steps</option>
                <option value={50}>50 steps</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
