import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Split,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  Sliders,
  Link2,
  Unlink2,
  Eye,
  Info,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { useCanvasBox } from "./vizGeometry";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type TreapSplayModality =
  | "cartesian_treap_split_merge"
  | "implicit_treap_range_reversal"
  | "splay_tree_rotations"
  | "link_cut_tree_access";

export type TreapSplayPresetId =
  | "cartesian_balanced_random"
  | "cartesian_skewed_vs_heap"
  | "cartesian_split_merge_demo"
  | "implicit_string_reversals"
  | "implicit_cyclic_shifts"
  | "implicit_text_buffer"
  | "splay_skewed_chain"
  | "splay_zig_zag_cascade"
  | "splay_zipfian_cache"
  | "lct_dynamic_pipeline"
  | "lct_distributed_forest"
  | "lct_star_reroot";

// --- Modality 1: Cartesian Treap Node & Invariants ---
export interface CartesianNode {
  readonly id: string;
  readonly key: number;
  readonly priority: number;
  readonly size: number;
  readonly left: CartesianNode | null;
  readonly right: CartesianNode | null;
  readonly val?: string | number;
}

// --- Modality 2: Implicit Treap Node & Invariants ---
export interface ImplicitNode {
  readonly id: string;
  readonly val: string | number;
  readonly priority: number;
  readonly size: number;
  readonly rev: boolean;
  readonly left: ImplicitNode | null;
  readonly right: ImplicitNode | null;
}

// --- Modality 3: Splay Tree Node & Invariants ---
export interface SplayNode {
  readonly id: string;
  readonly key: number;
  readonly val?: string | number;
  readonly size: number;
  readonly left: SplayNode | null;
  readonly right: SplayNode | null;
}

export type SplayRotationType = "zig" | "zig-zig" | "zig-zag" | "none";

// --- Modality 4: Link-Cut Tree Node & Invariants ---
export interface LCTNode {
  readonly id: string;
  readonly name: string;
  readonly val?: number | string;
  readonly left: string | null;
  readonly right: string | null;
  readonly parent: string | null;
  readonly isPathParent: boolean;
  readonly rev: boolean;
  readonly size: number;
}

export interface LCTForest {
  nodes: Record<string, LCTNode>;
  readonly rootIds: readonly string[];
}

// --- Unified Telemetry & Step Tracking ---
export interface TreapSplayTelemetry {
  readonly nodeCount: number;
  readonly treeHeight: number;
  readonly balanceFactor: number;
  readonly potentialPhi: number;
  readonly zigCount: number;
  readonly zigZigCount: number;
  readonly zigZagCount: number;
  readonly totalRotations: number;
  readonly operationCount: number;
  readonly amortizedCostBound: string;
}

export interface TreapSplayAnimationStep {
  readonly stepIndex: number;
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly modality: TreapSplayModality;
  readonly activeNodeIds?: readonly string[];
  readonly highlightedEdgeIds?: readonly string[];
  readonly cartesianRoot?: CartesianNode | null;
  readonly cartesianLeft?: CartesianNode | null;
  readonly cartesianRight?: CartesianNode | null;
  readonly implicitRoot?: ImplicitNode | null;
  readonly implicitArray?: readonly (string | number)[];
  readonly activeRange?: readonly [number, number];
  readonly splayRoot?: SplayNode | null;
  readonly splayRotationType?: SplayRotationType;
  readonly splayPotentialPhi?: number;
  readonly lctForest?: LCTForest;
  readonly lctPreferredEdges?: readonly (readonly [string, string])[];
  readonly lctPathParentEdges?: readonly (readonly [string, string])[];
  readonly telemetry: TreapSplayTelemetry;
}

export interface TreapSplayPreset {
  readonly id: TreapSplayPresetId;
  readonly modality: TreapSplayModality;
  readonly name: string;
  readonly description: string;
  readonly theoryNotes: string;
  readonly tags: readonly string[];
  readonly initialCartesian?: CartesianNode | null;
  readonly initialImplicit?: ImplicitNode | null;
  readonly initialSplay?: SplayNode | null;
  readonly initialLCT?: LCTForest;
  readonly defaultOperations?: readonly {
    readonly type: string;
    readonly args: readonly (string | number)[];
  }[];
}

// Layout helper interface
export interface RenderNodeLayout {
  readonly id: string;
  readonly label: string;
  readonly subLabel?: string;
  readonly badgeTop?: string;
  readonly badgeBottom?: string;
  readonly x: number;
  readonly y: number;
  readonly isAuxRoot?: boolean;
  readonly isReversed?: boolean;
  readonly isActive?: boolean;
  readonly isSplitL?: boolean;
  readonly isSplitR?: boolean;
  readonly color?: string;
}

export interface RenderEdgeLayout {
  readonly id: string;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly isPreferred?: boolean;
  readonly isPathParent?: boolean;
  readonly isHighlighted?: boolean;
  readonly label?: string;
}

// ============================================================================
// 2. PURE ALGORITHMIC ENGINE: CARTESIAN TREAP
// ============================================================================

let globalNodeIdCounter = 1000;
export const generateUniqueNodeId = (prefix = "node"): string => {
  globalNodeIdCounter += 1;
  return `${prefix}_${globalNodeIdCounter}_${Math.random().toString(36).substring(2, 6)}`;
};

export const getCartesianSize = (node: CartesianNode | null): number => (node ? node.size : 0);

export const createCartesianNode = (
  key: number,
  priority?: number,
  val?: string | number,
  id?: string,
): CartesianNode => {
  const p = priority !== undefined ? priority : Math.floor(Math.random() * 100) + 1;
  return {
    id: id || generateUniqueNodeId("cart"),
    key,
    priority: p,
    size: 1,
    left: null,
    right: null,
    val: val !== undefined ? val : key,
  };
};

export const updateCartesianSize = (
  node: CartesianNode,
  left: CartesianNode | null,
  right: CartesianNode | null,
): CartesianNode => ({
  ...node,
  left,
  right,
  size: 1 + getCartesianSize(left) + getCartesianSize(right),
});

export const cloneCartesianTree = (root: CartesianNode | null): CartesianNode | null => {
  if (!root) return null;
  return {
    ...root,
    left: cloneCartesianTree(root.left),
    right: cloneCartesianTree(root.right),
  };
};

/**
 * Splits Cartesian Treap `root` into `[L, R]` where all keys in `L` are <= `splitKey`
 * and all keys in `R` are > `splitKey`.
 */
export const splitCartesian = (
  root: CartesianNode | null,
  splitKey: number,
): readonly [CartesianNode | null, CartesianNode | null] => {
  if (!root) return [null, null];

  if (root.key <= splitKey) {
    const [rightL, rightR] = splitCartesian(root.right, splitKey);
    const newRoot = updateCartesianSize(root, root.left, rightL);
    return [newRoot, rightR];
  } else {
    const [leftL, leftR] = splitCartesian(root.left, splitKey);
    const newRoot = updateCartesianSize(root, leftR, root.right);
    return [leftL, newRoot];
  }
};

/**
 * Merges Cartesian Treaps `L` and `R` assuming all keys in `L` are <= all keys in `R`.
 * Maintains Max-Heap priority order.
 */
export const mergeCartesian = (
  L: CartesianNode | null,
  R: CartesianNode | null,
): CartesianNode | null => {
  if (!L) return R;
  if (!R) return L;

  if (L.priority >= R.priority) {
    const newRight = mergeCartesian(L.right, R);
    return updateCartesianSize(L, L.left, newRight);
  } else {
    const newLeft = mergeCartesian(L, R.left);
    return updateCartesianSize(R, newLeft, R.right);
  }
};

export const insertCartesian = (
  root: CartesianNode | null,
  key: number,
  priority?: number,
  val?: string | number,
): CartesianNode => {
  const [L, R] = splitCartesian(root, key);
  const newNode = createCartesianNode(key, priority, val);
  return mergeCartesian(mergeCartesian(L, newNode), R) as CartesianNode;
};

export const deleteCartesian = (root: CartesianNode | null, key: number): CartesianNode | null => {
  const [L, R] = splitCartesian(root, key - 0.0001);
  const [, R2] = splitCartesian(R, key + 0.0001);
  return mergeCartesian(L, R2);
};

export const findCartesian = (root: CartesianNode | null, key: number): CartesianNode | null => {
  if (!root) return null;
  if (root.key === key) return root;
  if (key < root.key) return findCartesian(root.left, key);
  return findCartesian(root.right, key);
};

export const kthCartesian = (root: CartesianNode | null, k: number): CartesianNode | null => {
  if (!root || k < 1 || k > root.size) return null;
  const leftSize = getCartesianSize(root.left);
  if (k === leftSize + 1) return root;
  if (k <= leftSize) return kthCartesian(root.left, k);
  return kthCartesian(root.right, k - leftSize - 1);
};

export const collectCartesianInOrder = (root: CartesianNode | null): CartesianNode[] => {
  const result: CartesianNode[] = [];
  const traverse = (node: CartesianNode | null) => {
    if (!node) return;
    traverse(node.left);
    result.push(node);
    traverse(node.right);
  };
  traverse(root);
  return result;
};

export const computeCartesianHeight = (root: CartesianNode | null): number => {
  if (!root) return 0;
  return 1 + Math.max(computeCartesianHeight(root.left), computeCartesianHeight(root.right));
};

export const validateCartesianTreap = (
  root: CartesianNode | null,
): {
  valid: boolean;
  bstValid: boolean;
  heapValid: boolean;
  sizeValid: boolean;
  error?: string;
} => {
  if (!root) return { valid: true, bstValid: true, heapValid: true, sizeValid: true };

  let bstValid = true;
  let heapValid = true;
  let sizeValid = true;
  let errorMessage: string | undefined;

  const validate = (
    node: CartesianNode | null,
    minKey: number,
    maxKey: number,
    maxPriority: number,
  ): boolean => {
    if (!node) return true;

    if (node.key < minKey || node.key > maxKey) {
      bstValid = false;
      errorMessage = `BST invariant violated: key ${node.key} outside valid range [${minKey}, ${maxKey}]`;
      return false;
    }

    if (node.priority > maxPriority) {
      heapValid = false;
      errorMessage = `Max-Heap invariant violated: priority ${node.priority} exceeds parent priority ${maxPriority}`;
      return false;
    }

    const expectedSize = 1 + getCartesianSize(node.left) + getCartesianSize(node.right);
    if (node.size !== expectedSize) {
      sizeValid = false;
      errorMessage = `Size invariant violated at key ${node.key}: stored size ${node.size} vs computed ${expectedSize}`;
      return false;
    }

    return (
      validate(node.left, minKey, node.key - 0.0001, node.priority) &&
      validate(node.right, node.key + 0.0001, maxKey, node.priority)
    );
  };

  const valid = validate(root, -Infinity, Infinity, Infinity);
  return { valid, bstValid, heapValid, sizeValid, error: errorMessage };
};

// ============================================================================
// 3. PURE ALGORITHMIC ENGINE: IMPLICIT TREAP (RANGE REVERSALS & SLICES)
// ============================================================================

export const getImplicitSize = (node: ImplicitNode | null): number => (node ? node.size : 0);

export const createImplicitNode = (
  val: string | number,
  priority?: number,
  id?: string,
): ImplicitNode => {
  const p = priority !== undefined ? priority : Math.floor(Math.random() * 100) + 1;
  return {
    id: id || generateUniqueNodeId("impl"),
    val,
    priority: p,
    size: 1,
    rev: false,
    left: null,
    right: null,
  };
};

export const pushDownImplicit = (node: ImplicitNode | null): ImplicitNode | null => {
  if (!node || !node.rev) return node;

  const newLeft = node.right ? { ...node.right, rev: !node.right.rev } : null;
  const newRight = node.left ? { ...node.left, rev: !node.left.rev } : null;

  return {
    ...node,
    left: newLeft,
    right: newRight,
    rev: false,
  };
};

export const updateImplicitSize = (
  node: ImplicitNode,
  left: ImplicitNode | null,
  right: ImplicitNode | null,
): ImplicitNode => ({
  ...node,
  left,
  right,
  size: 1 + getImplicitSize(left) + getImplicitSize(right),
});

/**
 * Splits implicit treap `root` into `[L, R]` where `L` contains the first `k` elements in-order,
 * and `R` contains the remaining elements.
 */
export const splitImplicit = (
  root: ImplicitNode | null,
  k: number,
): readonly [ImplicitNode | null, ImplicitNode | null] => {
  if (!root) return [null, null];
  if (k <= 0) return [null, root];
  if (k >= root.size) return [root, null];

  const node = pushDownImplicit(root)!;
  const leftSize = getImplicitSize(node.left);

  if (leftSize + 1 <= k) {
    const [rightL, rightR] = splitImplicit(node.right, k - leftSize - 1);
    const newRoot = updateImplicitSize(node, node.left, rightL);
    return [newRoot, rightR];
  } else {
    const [leftL, leftR] = splitImplicit(node.left, k);
    const newRoot = updateImplicitSize(node, leftR, node.right);
    return [leftL, newRoot];
  }
};

/**
 * Merges two implicit treaps `L` and `R` in implicit sequence order.
 */
export const mergeImplicit = (
  L: ImplicitNode | null,
  R: ImplicitNode | null,
): ImplicitNode | null => {
  if (!L) return R;
  if (!R) return L;

  const nodeL = pushDownImplicit(L)!;
  const nodeR = pushDownImplicit(R)!;

  if (nodeL.priority >= nodeR.priority) {
    const newRight = mergeImplicit(nodeL.right, nodeR);
    return updateImplicitSize(nodeL, nodeL.left, newRight);
  } else {
    const newLeft = mergeImplicit(nodeL, nodeR.left);
    return updateImplicitSize(nodeR, newLeft, nodeR.right);
  }
};

/**
 * Reverses range [l, r] (1-indexed inclusive) in O(log N) time using lazy reversal tag.
 */
export const reverseRangeImplicit = (
  root: ImplicitNode | null,
  l: number,
  r: number,
): ImplicitNode | null => {
  if (!root || l > r || l < 1 || r > root.size) return root;

  const [T1, T23] = splitImplicit(root, l - 1);
  const [T2, T3] = splitImplicit(T23, r - l + 1);

  const reversedT2 = T2 ? { ...T2, rev: !T2.rev } : null;

  return mergeImplicit(T1, mergeImplicit(reversedT2, T3));
};

/**
 * Cyclically shifts range [l, r] to the right by `shift` positions.
 */
export const cyclicShiftImplicit = (
  root: ImplicitNode | null,
  l: number,
  r: number,
  shift: number,
): ImplicitNode | null => {
  if (!root || l >= r || l < 1 || r > root.size) return root;
  const len = r - l + 1;
  const k = ((shift % len) + len) % len;
  if (k === 0) return root;

  const [T1, T23] = splitImplicit(root, l - 1);
  const [T2, T3] = splitImplicit(T23, len);

  const [T2A, T2B] = splitImplicit(T2, len - k);
  const shiftedT2 = mergeImplicit(T2B, T2A);

  return mergeImplicit(T1, mergeImplicit(shiftedT2, T3));
};

export const insertAtImplicit = (
  root: ImplicitNode | null,
  index: number,
  val: string | number,
  priority?: number,
): ImplicitNode => {
  const [L, R] = splitImplicit(root, Math.max(0, index - 1));
  const newNode = createImplicitNode(val, priority);
  return mergeImplicit(mergeImplicit(L, newNode), R) as ImplicitNode;
};

export const deleteAtImplicit = (root: ImplicitNode | null, index: number): ImplicitNode | null => {
  if (!root || index < 1 || index > root.size) return root;
  const [L, R] = splitImplicit(root, index - 1);
  const [, R2] = splitImplicit(R, 1);
  return mergeImplicit(L, R2);
};

export const extractImplicitArray = (root: ImplicitNode | null): (string | number)[] => {
  const result: (string | number)[] = [];
  const traverse = (node: ImplicitNode | null) => {
    if (!node) return;
    const pushed = pushDownImplicit(node);
    if (!pushed) return;
    traverse(pushed.left);
    result.push(pushed.val);
    traverse(pushed.right);
  };
  traverse(root);
  return result;
};

export const computeImplicitHeight = (root: ImplicitNode | null): number => {
  if (!root) return 0;
  return 1 + Math.max(computeImplicitHeight(root.left), computeImplicitHeight(root.right));
};

export const validateImplicitTreap = (
  root: ImplicitNode | null,
): { valid: boolean; heapValid: boolean; sizeValid: boolean; error?: string } => {
  if (!root) return { valid: true, heapValid: true, sizeValid: true };

  let heapValid = true;
  let sizeValid = true;
  let errorMessage: string | undefined;

  const validate = (node: ImplicitNode | null, maxPriority: number): boolean => {
    if (!node) return true;

    if (node.priority > maxPriority) {
      heapValid = false;
      errorMessage = `Max-Heap invariant violated: priority ${node.priority} exceeds ${maxPriority}`;
      return false;
    }

    const expectedSize = 1 + getImplicitSize(node.left) + getImplicitSize(node.right);
    if (node.size !== expectedSize) {
      sizeValid = false;
      errorMessage = `Size invariant mismatch: node size ${node.size} vs expected ${expectedSize}`;
      return false;
    }

    return validate(node.left, node.priority) && validate(node.right, node.priority);
  };

  const valid = validate(root, Infinity);
  return { valid, heapValid, sizeValid, error: errorMessage };
};

// ============================================================================
// 4. PURE ALGORITHMIC ENGINE: SPLAY TREE & AMORTIZED POTENTIAL
// ============================================================================

export const getSplaySize = (node: SplayNode | null): number => (node ? node.size : 0);

export const createSplayNode = (key: number, val?: string | number, id?: string): SplayNode => ({
  id: id || generateUniqueNodeId("splay"),
  key,
  val: val !== undefined ? val : key,
  size: 1,
  left: null,
  right: null,
});

export const updateSplaySize = (
  node: SplayNode,
  left: SplayNode | null,
  right: SplayNode | null,
): SplayNode => ({
  ...node,
  left,
  right,
  size: 1 + getSplaySize(left) + getSplaySize(right),
});

export const rotateRightSplay = (node: SplayNode): SplayNode => {
  if (!node.left) return node;
  const L = node.left;
  const newRight = updateSplaySize(node, L.right, node.right);
  return updateSplaySize(L, L.left, newRight);
};

export const rotateLeftSplay = (node: SplayNode): SplayNode => {
  if (!node.right) return node;
  const R = node.right;
  const newLeft = updateSplaySize(node, node.left, R.left);
  return updateSplaySize(R, newLeft, R.right);
};

/**
 * Calculates Sleator-Tarjan Amortized Potential:
 * Phi(T) = sum_{u in T} log2(size(u))
 */
export const calculateSplayPotentialPhi = (root: SplayNode | null): number => {
  if (!root) return 0;
  let phi = 0;
  const traverse = (node: SplayNode | null) => {
    if (!node) return;
    phi += Math.log2(Math.max(node.size, 1));
    traverse(node.left);
    traverse(node.right);
  };
  traverse(root);
  return Math.round(phi * 1000) / 1000;
};

export const computeSplayHeight = (root: SplayNode | null): number => {
  if (!root) return 0;
  return 1 + Math.max(computeSplayHeight(root.left), computeSplayHeight(root.right));
};

export interface SplayStepLog {
  readonly rotationType: SplayRotationType;
  readonly description: string;
  readonly rootSnapshot: SplayNode;
  readonly phi: number;
}

/**
 * Splays `key` to the root of the tree, recording rotation steps.
 */
export const splayTree = (
  root: SplayNode | null,
  key: number,
): {
  newRoot: SplayNode | null;
  steps: SplayStepLog[];
  zigCount: number;
  zigZigCount: number;
  zigZagCount: number;
} => {
  if (!root) return { newRoot: null, steps: [], zigCount: 0, zigZigCount: 0, zigZagCount: 0 };

  const steps: SplayStepLog[] = [];
  let zigs = 0;
  let zigZigs = 0;
  let zigZags = 0;

  const splayRec = (node: SplayNode | null): SplayNode | null => {
    if (!node || node.key === key) return node;

    if (key < node.key) {
      if (!node.left) return node;

      if (key < node.left.key) {
        // Zig-Zig (Left-Left)
        if (node.left.left) {
          node = updateSplaySize(
            node,
            updateSplaySize(node.left, splayRec(node.left.left), node.left.right),
            node.right,
          );
          node = rotateRightSplay(node);
          zigZigs += 1;
          steps.push({
            rotationType: "zig-zig",
            description: `Zig-Zig (Left-Left): rotated parent ${node.key} around grandparent`,
            rootSnapshot: node,
            phi: calculateSplayPotentialPhi(node),
          });
        }
      } else if (key > node.left.key) {
        // Zig-Zag (Left-Right)
        if (node.left.right) {
          const newLR = splayRec(node.left.right);
          const newLeft = updateSplaySize(node.left, node.left.left, newLR);
          node = updateSplaySize(node, rotateLeftSplay(newLeft), node.right);
          zigZags += 1;
          steps.push({
            rotationType: "zig-zag",
            description: `Zig-Zag (Left-Right): rotated child left around parent`,
            rootSnapshot: node,
            phi: calculateSplayPotentialPhi(node),
          });
        }
      }

      if (!node.left) return node;
      const res = rotateRightSplay(node);
      zigs += 1;
      steps.push({
        rotationType: "zig",
        description: `Zig: single right rotation bringing target toward root`,
        rootSnapshot: res,
        phi: calculateSplayPotentialPhi(res),
      });
      return res;
    } else {
      if (!node.right) return node;

      if (key > node.right.key) {
        // Zig-Zig (Right-Right)
        if (node.right.right) {
          node = updateSplaySize(
            node,
            node.left,
            updateSplaySize(node.right, node.right.left, splayRec(node.right.right)),
          );
          node = rotateLeftSplay(node);
          zigZigs += 1;
          steps.push({
            rotationType: "zig-zig",
            description: `Zig-Zig (Right-Right): rotated parent ${node.key} around grandparent`,
            rootSnapshot: node,
            phi: calculateSplayPotentialPhi(node),
          });
        }
      } else if (key < node.right.key) {
        // Zig-Zag (Right-Left)
        if (node.right.left) {
          const newRL = splayRec(node.right.left);
          const newRight = updateSplaySize(node.right, newRL, node.right.right);
          node = updateSplaySize(node, node.left, rotateRightSplay(newRight));
          zigZags += 1;
          steps.push({
            rotationType: "zig-zag",
            description: `Zig-Zag (Right-Left): rotated child right around parent`,
            rootSnapshot: node,
            phi: calculateSplayPotentialPhi(node),
          });
        }
      }

      if (!node.right) return node;
      const res = rotateLeftSplay(node);
      zigs += 1;
      steps.push({
        rotationType: "zig",
        description: `Zig: single left rotation bringing target toward root`,
        rootSnapshot: res,
        phi: calculateSplayPotentialPhi(res),
      });
      return res;
    }
  };

  const finalRoot = splayRec(root);
  return { newRoot: finalRoot, steps, zigCount: zigs, zigZigCount: zigZigs, zigZagCount: zigZags };
};

export const insertSplay = (
  root: SplayNode | null,
  key: number,
  val?: string | number,
): { newRoot: SplayNode; steps: SplayStepLog[] } => {
  if (!root) {
    const single = createSplayNode(key, val);
    return { newRoot: single, steps: [] };
  }

  const splayRes = splayTree(root, key);
  const curr = splayRes.newRoot!;
  if (curr.key === key) {
    return { newRoot: curr, steps: splayRes.steps };
  }

  const newNode = createSplayNode(key, val);
  if (key < curr.key) {
    const leftSub = curr.left;
    const rightSub = updateSplaySize(curr, null, curr.right);
    const newRoot = updateSplaySize(newNode, leftSub, rightSub);
    return { newRoot, steps: splayRes.steps };
  } else {
    const rightSub = curr.right;
    const leftSub = updateSplaySize(curr, curr.left, null);
    const newRoot = updateSplaySize(newNode, leftSub, rightSub);
    return { newRoot, steps: splayRes.steps };
  }
};

export const deleteSplay = (
  root: SplayNode | null,
  key: number,
): { newRoot: SplayNode | null; steps: SplayStepLog[] } => {
  if (!root) return { newRoot: null, steps: [] };

  const splayRes = splayTree(root, key);
  const curr = splayRes.newRoot!;
  if (curr.key !== key) {
    return { newRoot: curr, steps: splayRes.steps };
  }

  if (!curr.left) {
    return { newRoot: curr.right, steps: splayRes.steps };
  } else {
    const leftSplayed = splayTree(curr.left, key);
    const newLeftRoot = leftSplayed.newRoot!;
    const newRoot = updateSplaySize(newLeftRoot, newLeftRoot.left, curr.right);
    return { newRoot, steps: [...splayRes.steps, ...leftSplayed.steps] };
  }
};

export const validateSplayTree = (
  root: SplayNode | null,
): { valid: boolean; bstValid: boolean; sizeValid: boolean; error?: string } => {
  if (!root) return { valid: true, bstValid: true, sizeValid: true };

  let bstValid = true;
  let sizeValid = true;
  let errorMessage: string | undefined;

  const validate = (node: SplayNode | null, minKey: number, maxKey: number): boolean => {
    if (!node) return true;

    if (node.key < minKey || node.key > maxKey) {
      bstValid = false;
      errorMessage = `BST invariant violated: key ${node.key} outside [${minKey}, ${maxKey}]`;
      return false;
    }

    const expectedSize = 1 + getSplaySize(node.left) + getSplaySize(node.right);
    if (node.size !== expectedSize) {
      sizeValid = false;
      errorMessage = `Size mismatch at ${node.key}: stored ${node.size} vs computed ${expectedSize}`;
      return false;
    }

    return (
      validate(node.left, minKey, node.key - 0.0001) &&
      validate(node.right, node.key + 0.0001, maxKey)
    );
  };

  const valid = validate(root, -Infinity, Infinity);
  return { valid, bstValid, sizeValid, error: errorMessage };
};

// ============================================================================
// 5. PURE ALGORITHMIC ENGINE: LINK-CUT TREE (LCT)
// ============================================================================

export const createLCTNode = (id: string, name?: string, val?: number | string): LCTNode => ({
  id,
  name: name || id,
  val: val !== undefined ? val : id,
  left: null,
  right: null,
  parent: null,
  isPathParent: false,
  rev: false,
  size: 1,
});

export const createEmptyLCTForest = (): LCTForest => ({
  nodes: {},
  rootIds: [],
});

export const cloneLCTForest = (forest: LCTForest): LCTForest => {
  const newNodes: Record<string, LCTNode> = {};
  for (const key of Object.keys(forest.nodes)) {
    newNodes[key] = { ...forest.nodes[key] };
  }
  return {
    nodes: newNodes,
    rootIds: [...forest.rootIds],
  };
};

export const isLCTAuxRoot = (forest: LCTForest, u: string): boolean => {
  const node = forest.nodes[u];
  if (!node || !node.parent) return true;
  return node.isPathParent;
};

export const pushDownLCTNode = (forest: LCTForest, u: string): void => {
  const node = forest.nodes[u];
  if (!node || !node.rev) return;

  const leftId = node.left;
  const rightId = node.right;

  forest.nodes[u] = {
    ...node,
    left: rightId,
    right: leftId,
    rev: false,
  };

  if (rightId && forest.nodes[rightId]) {
    forest.nodes[rightId] = {
      ...forest.nodes[rightId],
      rev: !forest.nodes[rightId].rev,
    };
  }

  if (leftId && forest.nodes[leftId]) {
    forest.nodes[leftId] = {
      ...forest.nodes[leftId],
      rev: !forest.nodes[leftId].rev,
    };
  }
};

export const updateLCTNodeSize = (forest: LCTForest, u: string): void => {
  const node = forest.nodes[u];
  if (!node) return;
  const leftSize = node.left && forest.nodes[node.left] ? forest.nodes[node.left].size : 0;
  const rightSize = node.right && forest.nodes[node.right] ? forest.nodes[node.right].size : 0;
  forest.nodes[u] = {
    ...node,
    size: 1 + leftSize + rightSize,
  };
};

export const pushDownLCTPath = (forest: LCTForest, u: string): void => {
  const path: string[] = [];
  let curr: string | null = u;
  while (curr) {
    path.push(curr);
    if (isLCTAuxRoot(forest, curr)) break;
    curr = forest.nodes[curr].parent;
  }
  for (let i = path.length - 1; i >= 0; i -= 1) {
    pushDownLCTNode(forest, path[i]);
  }
};

export const rotateLCT = (forest: LCTForest, x: string): void => {
  const xNode = forest.nodes[x];
  if (!xNode || !xNode.parent || isLCTAuxRoot(forest, x)) return;

  const p = xNode.parent;
  const pNode = forest.nodes[p];
  const g = pNode.parent;
  const isLeft = pNode.left === x;
  const b = isLeft ? xNode.right : xNode.left;

  if (isLeft) {
    forest.nodes[p] = { ...pNode, left: b };
    forest.nodes[x] = { ...xNode, right: p, parent: g, isPathParent: pNode.isPathParent };
  } else {
    forest.nodes[p] = { ...pNode, right: b };
    forest.nodes[x] = { ...xNode, left: p, parent: g, isPathParent: pNode.isPathParent };
  }

  if (b && forest.nodes[b]) {
    forest.nodes[b] = { ...forest.nodes[b], parent: p, isPathParent: false };
  }

  forest.nodes[p] = { ...forest.nodes[p], parent: x, isPathParent: false };

  if (g && forest.nodes[g] && !pNode.isPathParent) {
    if (forest.nodes[g].left === p) {
      forest.nodes[g] = { ...forest.nodes[g], left: x };
    } else if (forest.nodes[g].right === p) {
      forest.nodes[g] = { ...forest.nodes[g], right: x };
    }
  }

  updateLCTNodeSize(forest, p);
  updateLCTNodeSize(forest, x);
};

export const splayLCT = (forest: LCTForest, x: string): void => {
  pushDownLCTPath(forest, x);

  while (!isLCTAuxRoot(forest, x)) {
    const p = forest.nodes[x].parent!;
    if (isLCTAuxRoot(forest, p)) {
      rotateLCT(forest, x);
    } else {
      const g = forest.nodes[p].parent!;
      const isXLeft = forest.nodes[p].left === x;
      const isPLeft = forest.nodes[g].left === p;

      if (isXLeft === isPLeft) {
        rotateLCT(forest, p);
        rotateLCT(forest, x);
      } else {
        rotateLCT(forest, x);
        rotateLCT(forest, x);
      }
    }
  }
};

/**
 * Access(u): Restructures preferred paths such that represented root -> u is a single preferred path,
 * and u is the root of this auxiliary Splay tree with no right child.
 */
export const accessLCT = (forest: LCTForest, u: string): void => {
  let last: string | null = null;
  let curr: string | null = u;

  while (curr) {
    splayLCT(forest, curr);

    // Detach old right child to make it path-parent
    const oldRight = forest.nodes[curr].right;
    if (oldRight && forest.nodes[oldRight]) {
      forest.nodes[oldRight] = {
        ...forest.nodes[oldRight],
        isPathParent: true,
      };
    }

    // Attach new preferred child `last`
    forest.nodes[curr] = {
      ...forest.nodes[curr],
      right: last,
    };
    if (last && forest.nodes[last]) {
      forest.nodes[last] = {
        ...forest.nodes[last],
        parent: curr,
        isPathParent: false,
      };
    }

    updateLCTNodeSize(forest, curr);
    last = curr;
    curr = forest.nodes[curr].parent;
  }

  splayLCT(forest, u);
};

export const makeRootLCT = (forest: LCTForest, u: string): void => {
  accessLCT(forest, u);
  splayLCT(forest, u);
  forest.nodes[u] = {
    ...forest.nodes[u],
    rev: !forest.nodes[u].rev,
  };
};

export const findRootLCT = (forest: LCTForest, u: string): string => {
  accessLCT(forest, u);
  splayLCT(forest, u);
  let curr = u;
  while (true) {
    pushDownLCTNode(forest, curr);
    if (forest.nodes[curr].left) {
      curr = forest.nodes[curr].left!;
    } else {
      break;
    }
  }
  splayLCT(forest, curr);
  return curr;
};

export const linkLCT = (forest: LCTForest, u: string, v: string): boolean => {
  if (u === v) return false;
  makeRootLCT(forest, u);
  if (findRootLCT(forest, v) === u) return false; // Cycle detected

  forest.nodes[u] = {
    ...forest.nodes[u],
    parent: v,
    isPathParent: true,
  };
  return true;
};

export const cutLCT = (forest: LCTForest, u: string, v?: string): boolean => {
  if (v) {
    makeRootLCT(forest, u);
    accessLCT(forest, v);
    splayLCT(forest, v);

    if (forest.nodes[v].left === u && !forest.nodes[u].right) {
      forest.nodes[v] = { ...forest.nodes[v], left: null };
      forest.nodes[u] = { ...forest.nodes[u], parent: null, isPathParent: false };
      updateLCTNodeSize(forest, v);
      return true;
    }
    return false;
  } else {
    // Cut edge to represented parent
    accessLCT(forest, u);
    splayLCT(forest, u);
    if (forest.nodes[u].left) {
      const leftChild = forest.nodes[u].left!;
      forest.nodes[leftChild] = { ...forest.nodes[leftChild], parent: null, isPathParent: false };
      forest.nodes[u] = { ...forest.nodes[u], left: null };
      updateLCTNodeSize(forest, u);
      return true;
    }
    return false;
  }
};

export const getLCTPreferredEdges = (forest: LCTForest): [string, string][] => {
  const edges: [string, string][] = [];
  for (const id of Object.keys(forest.nodes)) {
    const node = forest.nodes[id];
    if (node.left) edges.push([id, node.left]);
    if (node.right) edges.push([id, node.right]);
  }
  return edges;
};

export const getLCTPathParentEdges = (forest: LCTForest): [string, string][] => {
  const edges: [string, string][] = [];
  for (const id of Object.keys(forest.nodes)) {
    const node = forest.nodes[id];
    if (node.parent && node.isPathParent) {
      edges.push([id, node.parent]);
    }
  }
  return edges;
};

// ============================================================================
// 6. RICH PRESETS CONFIGURATION
// ============================================================================

export const TREAP_SPLAY_PRESETS: Record<TreapSplayPresetId, TreapSplayPreset> = {
  cartesian_balanced_random: {
    id: "cartesian_balanced_random",
    modality: "cartesian_treap_split_merge",
    name: "Randomized Balanced Treap",
    description:
      "Cartesian Treap maintaining BST ordering on keys and Max-Heap priority invariants, achieving O(log N) expected height.",
    theoryNotes:
      "Treaps eliminate pathological BST skewing by assigning uniform random priorities. Max-heap property guarantees random binary search tree properties with expected depth 2 ln N.",
    tags: ["Cartesian Treap", "Heap Priority", "Randomized BST", "O(log N)"],
    initialCartesian: (() => {
      let root: CartesianNode | null = null;
      const data = [
        { k: 40, p: 95 },
        { k: 20, p: 82 },
        { k: 60, p: 88 },
        { k: 10, p: 45 },
        { k: 30, p: 70 },
        { k: 50, p: 60 },
        { k: 70, p: 76 },
      ];
      for (const item of data) {
        root = insertCartesian(root, item.k, item.p);
      }
      return root;
    })(),
    defaultOperations: [
      { type: "insert", args: [35, 90] },
      { type: "split", args: [35] },
      { type: "delete", args: [20] },
    ],
  },
  cartesian_skewed_vs_heap: {
    id: "cartesian_skewed_vs_heap",
    modality: "cartesian_treap_split_merge",
    name: "Skewed Insertion vs Priority Rebalancing",
    description:
      "Strictly ascending keys [10, 20, 30, 40, 50, 60] with heap priorities preventing a degenerate linked list.",
    theoryNotes:
      "Inserting sorted data into an ordinary BST creates an O(N) chain. In a Treap, heap rotations continuously restructure the tree into logarithmic balance.",
    tags: ["Degenerate BST", "Heap Balancing", "Rotations", "Split/Merge"],
    initialCartesian: (() => {
      let root: CartesianNode | null = null;
      const data = [
        { k: 10, p: 30 },
        { k: 20, p: 85 },
        { k: 30, p: 60 },
        { k: 40, p: 99 },
        { k: 50, p: 40 },
        { k: 60, p: 75 },
      ];
      for (const item of data) {
        root = insertCartesian(root, item.k, item.p);
      }
      return root;
    })(),
  },
  cartesian_split_merge_demo: {
    id: "cartesian_split_merge_demo",
    modality: "cartesian_treap_split_merge",
    name: "Partition & Join (Split/Merge)",
    description:
      "Two disjoint Cartesian Treaps demonstrating partition at key K and recombining subtrees in O(log N).",
    theoryNotes:
      "Split(T, k) cuts the Treap into keys <= k and > k. Merge(L, R) joins disjoint subtrees respecting max priority at the root.",
    tags: ["Split", "Merge", "Range Queries", "Set Operations"],
    initialCartesian: (() => {
      let root: CartesianNode | null = null;
      const data = [
        { k: 15, p: 92 },
        { k: 8, p: 64 },
        { k: 25, p: 78 },
        { k: 4, p: 30 },
        { k: 12, p: 50 },
        { k: 35, p: 88 },
        { k: 48, p: 70 },
      ];
      for (const item of data) {
        root = insertCartesian(root, item.k, item.p);
      }
      return root;
    })(),
  },
  implicit_string_reversals: {
    id: "implicit_string_reversals",
    modality: "implicit_treap_range_reversal",
    name: "String Substring Reversal Buffer",
    description:
      "Implicit Treap representing string 'ALGORITHM' with O(log N) lazy range reversal operations.",
    theoryNotes:
      "Implicit Treaps replace explicit keys with in-order subtree sizes. Range reversal toggles a lazy tag `rev` on root of subarray, propagating downward in O(1) per node.",
    tags: ["Implicit Treap", "Lazy Propagation", "String Reversal", "O(log N)"],
    initialImplicit: (() => {
      let root: ImplicitNode | null = null;
      const chars = ["A", "L", "G", "O", "R", "I", "T", "H", "M"];
      const priorities = [72, 89, 54, 98, 43, 67, 85, 30, 60];
      for (let i = 0; i < chars.length; i += 1) {
        root = insertAtImplicit(root, i + 1, chars[i], priorities[i]);
      }
      return root;
    })(),
    defaultOperations: [
      { type: "reverse", args: [2, 6] },
      { type: "reverse", args: [4, 8] },
    ],
  },
  implicit_cyclic_shifts: {
    id: "implicit_cyclic_shifts",
    modality: "implicit_treap_range_reversal",
    name: "Range Cyclic Shifts & Slices",
    description:
      "Dynamic array [10, 20, 30, 40, 50, 60, 70, 80] executing subarray cyclic rotations and insertions.",
    theoryNotes:
      "Cyclic shifting a range [L, R] by k cuts the range into two sub-segments and swaps them via 3 splits and 3 merges in O(log N).",
    tags: ["Cyclic Shift", "Array Slice", "Permutations", "Subarray"],
    initialImplicit: (() => {
      let root: ImplicitNode | null = null;
      const vals = [10, 20, 30, 40, 50, 60, 70, 80];
      const priorities = [88, 55, 94, 70, 35, 99, 45, 62];
      for (let i = 0; i < vals.length; i += 1) {
        root = insertAtImplicit(root, i + 1, vals[i], priorities[i]);
      }
      return root;
    })(),
  },
  implicit_text_buffer: {
    id: "implicit_text_buffer",
    modality: "implicit_treap_range_reversal",
    name: "Text Editor Rope Buffer",
    description:
      "Text sequence buffer simulating editor cursor operations: insert, delete, and block inversion.",
    theoryNotes:
      "Rope data structures built over implicit treaps enable fast text editing, multi-cursor insertion, and block-level clipboard operations.",
    tags: ["Rope", "Text Editor", "Cursor", "Buffer"],
    initialImplicit: (() => {
      let root: ImplicitNode | null = null;
      const chars = ["H", "e", "l", "l", "o", "_", "W", "o", "r", "l", "d"];
      for (let i = 0; i < chars.length; i += 1) {
        root = insertAtImplicit(root, i + 1, chars[i]);
      }
      return root;
    })(),
  },
  splay_skewed_chain: {
    id: "splay_skewed_chain",
    modality: "splay_tree_rotations",
    name: "Skewed Chain Splay & Depth Halving",
    description:
      "Accessing the deepest leaf in a skewed chain triggers Zig-Zig rotations that halve the depth of all accessed nodes.",
    theoryNotes:
      "Unlike naive single rotations which only move a target up 1 level leaving other nodes deep, Sleator-Tarjan Zig-Zig rotations restructure the entire access path.",
    tags: ["Splay Tree", "Zig-Zig", "Depth Halving", "Amortized O(log N)"],
    initialSplay: (() => {
      let root: SplayNode | null = null;
      const keys = [10, 20, 30, 40, 50, 60, 70];
      for (const k of keys) {
        root = insertSplay(root, k).newRoot;
      }
      return root;
    })(),
    defaultOperations: [
      { type: "splay", args: [10] },
      { type: "splay", args: [70] },
    ],
  },
  splay_zig_zag_cascade: {
    id: "splay_zig_zag_cascade",
    modality: "splay_tree_rotations",
    name: "Zig-Zag Alternating Restructuring",
    description:
      "Deep alternating left-right BST undergoing double rotations to restore balance and amortized potential.",
    theoryNotes:
      "Zig-Zag rotations rotate the node first around its parent, then around its grandparent, pulling the deep child to the top.",
    tags: ["Zig-Zag", "Double Rotation", "Potential Phi", "Self-Adjusting"],
    initialSplay: (() => {
      let root: SplayNode | null = null;
      const keys = [50, 25, 40, 30, 35, 60, 55];
      for (const k of keys) {
        root = insertSplay(root, k).newRoot;
      }
      return root;
    })(),
  },
  splay_zipfian_cache: {
    id: "splay_zipfian_cache",
    modality: "splay_tree_rotations",
    name: "Zipfian Access / LRU Cache Property",
    description:
      "Repeated queries on frequently accessed keys keep hot nodes near the root, achieving O(1) best-case access time.",
    theoryNotes:
      "Splay trees satisfy the Static Optimality and Working Set theorems: frequently accessed subsets reside within O(log |WorkingSet|) depth.",
    tags: ["Working Set", "Static Optimality", "LRU Cache", "Telemetry"],
    initialSplay: (() => {
      let root: SplayNode | null = null;
      const keys = [15, 30, 45, 60, 75, 90, 105];
      for (const k of keys) {
        root = insertSplay(root, k).newRoot;
      }
      return root;
    })(),
  },
  lct_dynamic_pipeline: {
    id: "lct_dynamic_pipeline",
    modality: "link_cut_tree_access",
    name: "Dynamic Pipeline Preferred Paths",
    description:
      "Represented linear chain tree 1 -> 2 -> 3 -> 4 -> 5 -> 6 decomposed into auxiliary splay trees connected by dashed path-parent edges.",
    theoryNotes:
      "Access(u) transitions path edges into preferred solid edges in auxiliary splay trees, routing dynamic path queries in amortized O(log N).",
    tags: ["Link-Cut Tree", "Preferred Paths", "Auxiliary Splay", "Dynamic Trees"],
    initialLCT: (() => {
      const forest = createEmptyLCTForest();
      const nodeIds = ["N1", "N2", "N3", "N4", "N5", "N6"];
      for (const id of nodeIds) {
        forest.nodes[id] = createLCTNode(id, `Node ${id.replace("N", "")}`);
      }
      linkLCT(forest, "N2", "N1");
      linkLCT(forest, "N3", "N2");
      linkLCT(forest, "N4", "N3");
      linkLCT(forest, "N5", "N4");
      linkLCT(forest, "N6", "N5");
      return forest;
    })(),
    defaultOperations: [
      { type: "access", args: ["N4"] },
      { type: "makeRoot", args: ["N6"] },
    ],
  },
  lct_distributed_forest: {
    id: "lct_distributed_forest",
    modality: "link_cut_tree_access",
    name: "Distributed Dynamic Trees & Link/Cut",
    description:
      "Two disjoint dynamic trees executing dynamic link and cut operations to restructure forest topology.",
    theoryNotes:
      "Dynamic trees support dynamic network connectivity, maximum flow augmentations, and MST maintenance in O(log N) time per operation.",
    tags: ["Forest", "Dynamic Connectivity", "Link", "Cut"],
    initialLCT: (() => {
      const forest = createEmptyLCTForest();
      const ids = ["A", "B", "C", "D", "E", "F", "G"];
      for (const id of ids) {
        forest.nodes[id] = createLCTNode(id, id);
      }
      linkLCT(forest, "B", "A");
      linkLCT(forest, "C", "B");
      linkLCT(forest, "E", "D");
      linkLCT(forest, "F", "E");
      linkLCT(forest, "G", "F");
      return forest;
    })(),
  },
  lct_star_reroot: {
    id: "lct_star_reroot",
    modality: "link_cut_tree_access",
    name: "Star Topology Dynamic Rerooting",
    description:
      "Hub node connected to leaves. Calling makeRoot on any leaf dynamically inverts depth orientations across the entire represented tree.",
    theoryNotes:
      "MakeRoot(u) accesses u, splays u to aux root, and toggles lazy reversal `rev`, making u the new root of the represented tree.",
    tags: ["MakeRoot", "Reroot", "Star Topology", "Lazy Inversion"],
    initialLCT: (() => {
      const forest = createEmptyLCTForest();
      const ids = ["Hub", "Leaf1", "Leaf2", "Leaf3", "Leaf4"];
      for (const id of ids) {
        forest.nodes[id] = createLCTNode(id, id);
      }
      linkLCT(forest, "Leaf1", "Hub");
      linkLCT(forest, "Leaf2", "Hub");
      linkLCT(forest, "Leaf3", "Hub");
      linkLCT(forest, "Leaf4", "Hub");
      return forest;
    })(),
  },
};

// ============================================================================
// 7. STEP TRACE GENERATORS FOR ANIMATION
// ============================================================================

export const generateCartesianOperationSteps = (
  initialTree: CartesianNode | null,
  opType: "insert" | "delete" | "split" | "merge",
  args: { key?: number; priority?: number; splitKey?: number; rightTree?: CartesianNode | null },
): TreapSplayAnimationStep[] => {
  const steps: TreapSplayAnimationStep[] = [];
  const nodeCount = getCartesianSize(initialTree);
  const height = computeCartesianHeight(initialTree);

  const baseTelemetry: TreapSplayTelemetry = {
    nodeCount,
    treeHeight: height,
    balanceFactor: nodeCount > 0 ? Math.round((height / Math.log2(nodeCount + 1)) * 100) / 100 : 1,
    potentialPhi: 0,
    zigCount: 0,
    zigZigCount: 0,
    zigZagCount: 0,
    totalRotations: 0,
    operationCount: 1,
    amortizedCostBound: "O(log N) expected",
  };

  steps.push({
    stepIndex: 0,
    phase: "init",
    title: "Initial Treap State",
    description: `Current Cartesian Treap contains ${nodeCount} nodes with BST ordering and Max-Heap priority.`,
    modality: "cartesian_treap_split_merge",
    cartesianRoot: initialTree,
    telemetry: baseTelemetry,
  });

  if (opType === "split" && args.splitKey !== undefined) {
    const k = args.splitKey;
    const [L, R] = splitCartesian(initialTree, k);
    steps.push({
      stepIndex: 1,
      phase: "split_exec",
      title: `Split at Key ${k}`,
      description: `Partitioned Treap into Left (keys <= ${k}, size ${getCartesianSize(L)}) and Right (keys > ${k}, size ${getCartesianSize(R)}).`,
      modality: "cartesian_treap_split_merge",
      cartesianRoot: null,
      cartesianLeft: L,
      cartesianRight: R,
      telemetry: {
        ...baseTelemetry,
        treeHeight: Math.max(computeCartesianHeight(L), computeCartesianHeight(R)),
      },
    });
  } else if (opType === "insert" && args.key !== undefined) {
    const k = args.key;
    const p = args.priority || Math.floor(Math.random() * 100) + 1;
    const [L, R] = splitCartesian(initialTree, k);

    steps.push({
      stepIndex: 1,
      phase: "split_for_insert",
      title: `Split Tree at Key ${k}`,
      description: `Temporarily split tree into Left (keys <= ${k}) and Right (keys > ${k}) to prepare slot.`,
      modality: "cartesian_treap_split_merge",
      cartesianLeft: L,
      cartesianRight: R,
      telemetry: baseTelemetry,
    });

    const newNode = createCartesianNode(k, p);
    const mergedLeft = mergeCartesian(L, newNode);
    const finalTree = mergeCartesian(mergedLeft, R);

    steps.push({
      stepIndex: 2,
      phase: "merge_complete",
      title: `Merged New Node (Key ${k}, Priority ${p})`,
      description: `Joined new node with subtrees, automatically respecting max-heap priority order.`,
      modality: "cartesian_treap_split_merge",
      cartesianRoot: finalTree,
      activeNodeIds: [newNode.id],
      telemetry: {
        ...baseTelemetry,
        nodeCount: getCartesianSize(finalTree),
        treeHeight: computeCartesianHeight(finalTree),
      },
    });
  } else if (opType === "delete" && args.key !== undefined) {
    const k = args.key;
    const finalTree = deleteCartesian(initialTree, k);
    steps.push({
      stepIndex: 1,
      phase: "delete_complete",
      title: `Deleted Key ${k}`,
      description: `Split out target key node and recombined remaining disjoint subtrees.`,
      modality: "cartesian_treap_split_merge",
      cartesianRoot: finalTree,
      telemetry: {
        ...baseTelemetry,
        nodeCount: getCartesianSize(finalTree),
        treeHeight: computeCartesianHeight(finalTree),
      },
    });
  }

  return steps;
};

export const generateImplicitOperationSteps = (
  initialTree: ImplicitNode | null,
  opType: "reverse" | "shift" | "insert" | "delete",
  args: { l?: number; r?: number; shift?: number; index?: number; val?: string | number },
): TreapSplayAnimationStep[] => {
  const steps: TreapSplayAnimationStep[] = [];
  const nodeCount = getImplicitSize(initialTree);
  const height = computeImplicitHeight(initialTree);
  const initialArray = extractImplicitArray(initialTree);

  const baseTelemetry: TreapSplayTelemetry = {
    nodeCount,
    treeHeight: height,
    balanceFactor: nodeCount > 0 ? Math.round((height / Math.log2(nodeCount + 1)) * 100) / 100 : 1,
    potentialPhi: 0,
    zigCount: 0,
    zigZigCount: 0,
    zigZagCount: 0,
    totalRotations: 0,
    operationCount: 1,
    amortizedCostBound: "O(log N) strict",
  };

  steps.push({
    stepIndex: 0,
    phase: "init",
    title: "Initial Implicit Treap State",
    description: `Sequence of length ${nodeCount}: [${initialArray.join(", ")}].`,
    modality: "implicit_treap_range_reversal",
    implicitRoot: initialTree,
    implicitArray: initialArray,
    telemetry: baseTelemetry,
  });

  if (opType === "reverse" && args.l !== undefined && args.r !== undefined) {
    const l = Math.max(1, args.l);
    const r = Math.min(nodeCount, args.r);

    steps.push({
      stepIndex: 1,
      phase: "range_isolate",
      title: `Isolate Range [${l}, ${r}]`,
      description: `Splitting implicit treap into prefix T1 (len ${l - 1}), target subarray T2 (len ${r - l + 1}), and suffix T3.`,
      modality: "implicit_treap_range_reversal",
      implicitRoot: initialTree,
      implicitArray: initialArray,
      activeRange: [l, r],
      telemetry: baseTelemetry,
    });

    const newTree = reverseRangeImplicit(initialTree, l, r);
    const newArray = extractImplicitArray(newTree);

    steps.push({
      stepIndex: 2,
      phase: "lazy_rev_applied",
      title: `Lazy Reversal Tag Applied`,
      description: `Toggled lazy reversal flag on subarray root. Projected array is now: [${newArray.join(", ")}].`,
      modality: "implicit_treap_range_reversal",
      implicitRoot: newTree,
      implicitArray: newArray,
      activeRange: [l, r],
      telemetry: {
        ...baseTelemetry,
        treeHeight: computeImplicitHeight(newTree),
      },
    });
  } else if (
    opType === "shift" &&
    args.l !== undefined &&
    args.r !== undefined &&
    args.shift !== undefined
  ) {
    const l = Math.max(1, args.l);
    const r = Math.min(nodeCount, args.r);
    const s = args.shift;
    const newTree = cyclicShiftImplicit(initialTree, l, r, s);
    const newArray = extractImplicitArray(newTree);

    steps.push({
      stepIndex: 1,
      phase: "cyclic_shift_complete",
      title: `Cyclic Shifted [${l}, ${r}] by ${s}`,
      description: `Subarray partitioned and recombined in rotated order: [${newArray.join(", ")}].`,
      modality: "implicit_treap_range_reversal",
      implicitRoot: newTree,
      implicitArray: newArray,
      activeRange: [l, r],
      telemetry: baseTelemetry,
    });
  }

  return steps;
};

export const generateSplayOperationSteps = (
  initialTree: SplayNode | null,
  targetKey: number,
): TreapSplayAnimationStep[] => {
  const steps: TreapSplayAnimationStep[] = [];
  const initialPhi = calculateSplayPotentialPhi(initialTree);
  const nodeCount = getSplaySize(initialTree);
  const initialHeight = computeSplayHeight(initialTree);

  let zigCount = 0;
  let zigZigCount = 0;
  let zigZagCount = 0;

  const baseTelemetry: TreapSplayTelemetry = {
    nodeCount,
    treeHeight: initialHeight,
    balanceFactor:
      nodeCount > 0 ? Math.round((initialHeight / Math.log2(nodeCount + 1)) * 100) / 100 : 1,
    potentialPhi: initialPhi,
    zigCount: 0,
    zigZigCount: 0,
    zigZagCount: 0,
    totalRotations: 0,
    operationCount: 1,
    amortizedCostBound: "3(r'(x) - r(x)) + 1 <= 3 log N + 1",
  };

  steps.push({
    stepIndex: 0,
    phase: "init",
    title: `Targeting Key ${targetKey}`,
    description: `Initial Splay Tree potential Phi = ${initialPhi}. Beginning bottom-up self-adjusting splay.`,
    modality: "splay_tree_rotations",
    splayRoot: initialTree,
    splayPotentialPhi: initialPhi,
    telemetry: baseTelemetry,
  });

  const splayResult = splayTree(initialTree, targetKey);
  zigCount = splayResult.zigCount;
  zigZigCount = splayResult.zigZigCount;
  zigZagCount = splayResult.zigZagCount;

  for (let i = 0; i < splayResult.steps.length; i += 1) {
    const sLog = splayResult.steps[i];
    const snapHeight = computeSplayHeight(sLog.rootSnapshot);
    steps.push({
      stepIndex: i + 1,
      phase: `rotation_${sLog.rotationType}`,
      title: `${sLog.rotationType.toUpperCase()} Rotation`,
      description: `${sLog.description}. Updated potential Phi = ${sLog.phi}.`,
      modality: "splay_tree_rotations",
      splayRoot: sLog.rootSnapshot,
      splayRotationType: sLog.rotationType,
      splayPotentialPhi: sLog.phi,
      telemetry: {
        ...baseTelemetry,
        treeHeight: snapHeight,
        potentialPhi: sLog.phi,
        zigCount,
        zigZigCount,
        zigZagCount,
        totalRotations: zigCount + zigZigCount * 2 + zigZagCount * 2,
      },
    });
  }

  if (splayResult.steps.length === 0) {
    steps.push({
      stepIndex: 1,
      phase: "already_root",
      title: `Node ${targetKey} is already Root`,
      description: `No rotations needed. Key ${targetKey} is at the root.`,
      modality: "splay_tree_rotations",
      splayRoot: initialTree,
      splayPotentialPhi: initialPhi,
      telemetry: baseTelemetry,
    });
  }

  return steps;
};

export const generateLCTOperationSteps = (
  initialForest: LCTForest,
  opType: "access" | "makeRoot" | "link" | "cut",
  args: { u: string; v?: string },
): TreapSplayAnimationStep[] => {
  const steps: TreapSplayAnimationStep[] = [];
  const forest = cloneLCTForest(initialForest);
  const nodeCount = Object.keys(forest.nodes).length;

  const baseTelemetry: TreapSplayTelemetry = {
    nodeCount,
    treeHeight: 0,
    balanceFactor: 1,
    potentialPhi: 0,
    zigCount: 0,
    zigZigCount: 0,
    zigZagCount: 0,
    totalRotations: 0,
    operationCount: 1,
    amortizedCostBound: "O(log N) amortized",
  };

  steps.push({
    stepIndex: 0,
    phase: "init",
    title: "Initial LCT Forest State",
    description: `Represented dynamic forest contains ${nodeCount} nodes across preferred paths.`,
    modality: "link_cut_tree_access",
    lctForest: cloneLCTForest(forest),
    lctPreferredEdges: getLCTPreferredEdges(forest),
    lctPathParentEdges: getLCTPathParentEdges(forest),
    telemetry: baseTelemetry,
  });

  if (opType === "access") {
    accessLCT(forest, args.u);
    steps.push({
      stepIndex: 1,
      phase: "access_complete",
      title: `Access(${args.u}) Executed`,
      description: `Path from represented root to ${args.u} converted into a single preferred path; ${args.u} is now root of its aux splay tree with no right child.`,
      modality: "link_cut_tree_access",
      lctForest: cloneLCTForest(forest),
      lctPreferredEdges: getLCTPreferredEdges(forest),
      lctPathParentEdges: getLCTPathParentEdges(forest),
      activeNodeIds: [args.u],
      telemetry: baseTelemetry,
    });
  } else if (opType === "makeRoot") {
    makeRootLCT(forest, args.u);
    steps.push({
      stepIndex: 1,
      phase: "make_root_complete",
      title: `MakeRoot(${args.u}) Executed`,
      description: `Accessed ${args.u} and applied lazy reversal tag, making ${args.u} the root of the represented tree.`,
      modality: "link_cut_tree_access",
      lctForest: cloneLCTForest(forest),
      lctPreferredEdges: getLCTPreferredEdges(forest),
      lctPathParentEdges: getLCTPathParentEdges(forest),
      activeNodeIds: [args.u],
      telemetry: baseTelemetry,
    });
  } else if (opType === "link" && args.v) {
    const success = linkLCT(forest, args.u, args.v);
    steps.push({
      stepIndex: 1,
      phase: "link_complete",
      title: success ? `Linked ${args.u} -> ${args.v}` : `Link Failed (Cycle or Identical Nodes)`,
      description: success
        ? `Made ${args.u} root and added path-parent dashed edge to ${args.v}.`
        : `Could not link ${args.u} and ${args.v}: they are already in the same represented tree.`,
      modality: "link_cut_tree_access",
      lctForest: cloneLCTForest(forest),
      lctPreferredEdges: getLCTPreferredEdges(forest),
      lctPathParentEdges: getLCTPathParentEdges(forest),
      activeNodeIds: [args.u, args.v],
      telemetry: baseTelemetry,
    });
  } else if (opType === "cut") {
    const success = cutLCT(forest, args.u, args.v);
    steps.push({
      stepIndex: 1,
      phase: "cut_complete",
      title: success ? `Cut Edge at ${args.u}` : `Cut Failed (No Direct Parent Edge)`,
      description: success
        ? `Disconnected node ${args.u} from its parent.`
        : `Node ${args.u} has no edge to cut.`,
      modality: "link_cut_tree_access",
      lctForest: cloneLCTForest(forest),
      lctPreferredEdges: getLCTPreferredEdges(forest),
      lctPathParentEdges: getLCTPathParentEdges(forest),
      activeNodeIds: [args.u],
      telemetry: baseTelemetry,
    });
  }

  return steps;
};

// ============================================================================
// 8. HIERARCHICAL REINGOLD-TILFORD / TIDY TREE LAYOUT ENGINE
// ============================================================================

export const layoutBinaryTree = (
  root: CartesianNode | ImplicitNode | SplayNode | null,
  width: number,
  height: number,
  isLeftSplit = false,
  isRightSplit = false,
): { nodes: RenderNodeLayout[]; edges: RenderEdgeLayout[] } => {
  if (!root) return { nodes: [], edges: [] };

  const nodes: RenderNodeLayout[] = [];
  const edges: RenderEdgeLayout[] = [];

  // In-order traversal assigns x coordinates 0..N-1
  let inOrderCounter = 0;
  type LayoutableNode = {
    id: string;
    left: LayoutableNode | null;
    right: LayoutableNode | null;
    [key: string]: unknown;
  };
  const positions: Map<string, { inOrder: number; depth: number; node: LayoutableNode }> =
    new Map();
  let maxDepth = 0;

  const assignPositions = (curr: LayoutableNode | null, depth: number) => {
    if (!curr) return;
    if (depth > maxDepth) maxDepth = depth;
    assignPositions(curr.left, depth + 1);
    positions.set(curr.id, { inOrder: inOrderCounter, depth, node: curr });
    inOrderCounter += 1;
    assignPositions(curr.right, depth + 1);
  };

  assignPositions(root as unknown as LayoutableNode | null, 0);

  const totalNodes = Math.max(inOrderCounter, 1);
  const padX = 60;
  const padY = 50;
  const usableWidth = Math.max(width - padX * 2, 100);
  const usableHeight = Math.max(height - padY * 2, 80);
  const levelHeight = maxDepth > 0 ? usableHeight / (maxDepth + 0.5) : usableHeight / 2;

  const nodePosMap = new Map<string, { x: number; y: number }>();

  positions.forEach(({ inOrder, depth, node }, id) => {
    const x = totalNodes > 1 ? padX + (inOrder / (totalNodes - 1)) * usableWidth : width / 2;
    const y = padY + depth * levelHeight;
    nodePosMap.set(id, { x, y });

    let label = String(
      node.key !== undefined ? node.key : node.val !== undefined ? node.val : node.id,
    );
    let subLabel: string | undefined;
    let badgeTop: string | undefined;
    let badgeBottom: string | undefined;

    if ("priority" in node) {
      badgeTop = `p:${node.priority}`;
    }
    if ("size" in node) {
      badgeBottom = `sz:${node.size}`;
    }
    if ("rev" in node && node.rev) {
      subLabel = "rev";
    }

    nodes.push({
      id,
      label,
      subLabel,
      badgeTop,
      badgeBottom,
      x,
      y,
      isSplitL: isLeftSplit,
      isSplitR: isRightSplit,
      isReversed: "rev" in node ? Boolean(node.rev) : false,
    });
  });

  const generateEdges = (curr: LayoutableNode | null) => {
    if (!curr) return;
    const currPos = nodePosMap.get(curr.id);
    if (!currPos) return;

    if (curr.left) {
      const leftPos = nodePosMap.get(curr.left.id);
      if (leftPos) {
        edges.push({
          id: `edge_${curr.id}_${curr.left.id}`,
          sourceX: currPos.x,
          sourceY: currPos.y,
          targetX: leftPos.x,
          targetY: leftPos.y,
          isPreferred: true,
        });
      }
      generateEdges(curr.left);
    }

    if (curr.right) {
      const rightPos = nodePosMap.get(curr.right.id);
      if (rightPos) {
        edges.push({
          id: `edge_${curr.id}_${curr.right.id}`,
          sourceX: currPos.x,
          sourceY: currPos.y,
          targetX: rightPos.x,
          targetY: rightPos.y,
          isPreferred: true,
        });
      }
      generateEdges(curr.right);
    }
  };

  generateEdges(root as unknown as LayoutableNode | null);

  return { nodes, edges };
};

export const layoutLCTForest = (
  forest: LCTForest,
  width: number,
  height: number,
): { nodes: RenderNodeLayout[]; edges: RenderEdgeLayout[] } => {
  const nodeIds = Object.keys(forest.nodes);
  if (nodeIds.length === 0) return { nodes: [], edges: [] };

  const nodes: RenderNodeLayout[] = [];
  const edges: RenderEdgeLayout[] = [];

  // Group nodes by connected auxiliary trees
  const auxRoots = nodeIds.filter((id) => isLCTAuxRoot(forest, id));
  const cols = Math.max(auxRoots.length, 1);
  const colWidth = width / cols;

  auxRoots.forEach((auxRootId, colIdx) => {
    const colCenterX = colWidth * (colIdx + 0.5);
    let inOrder = 0;
    const auxPositions = new Map<string, { inOrder: number; depth: number }>();
    let maxD = 0;

    const traverseAux = (id: string | null, depth: number) => {
      if (!id || !forest.nodes[id]) return;
      if (depth > maxD) maxD = depth;
      traverseAux(forest.nodes[id].left, depth + 1);
      auxPositions.set(id, { inOrder, depth });
      inOrder += 1;
      traverseAux(forest.nodes[id].right, depth + 1);
    };

    traverseAux(auxRootId, 0);
    const count = inOrder;
    const padY = 50;
    const levelH = maxD > 0 ? (height - 100) / (maxD + 1) : 60;

    auxPositions.forEach(({ inOrder: order, depth }, id) => {
      const x =
        count > 1
          ? colCenterX - colWidth * 0.35 + (order / (count - 1)) * (colWidth * 0.7)
          : colCenterX;
      const y = padY + depth * levelH;
      const node = forest.nodes[id];

      nodes.push({
        id,
        label: node.name || id,
        badgeBottom: `sz:${node.size}`,
        badgeTop: id === auxRootId ? "aux-root" : undefined,
        x,
        y,
        isAuxRoot: id === auxRootId,
        isReversed: node.rev,
      });
    });
  });

  const nodePosMap = new Map<string, { x: number; y: number }>();
  nodes.forEach((n) => nodePosMap.set(n.id, { x: n.x, y: n.y }));

  // Add solid preferred edges within auxiliary splay trees
  for (const id of nodeIds) {
    const node = forest.nodes[id];
    const p1 = nodePosMap.get(id);
    if (!p1) continue;

    if (node.left && nodePosMap.has(node.left)) {
      const p2 = nodePosMap.get(node.left)!;
      edges.push({
        id: `pref_${id}_${node.left}`,
        sourceX: p1.x,
        sourceY: p1.y,
        targetX: p2.x,
        targetY: p2.y,
        isPreferred: true,
      });
    }

    if (node.right && nodePosMap.has(node.right)) {
      const p2 = nodePosMap.get(node.right)!;
      edges.push({
        id: `pref_${id}_${node.right}`,
        sourceX: p1.x,
        sourceY: p1.y,
        targetX: p2.x,
        targetY: p2.y,
        isPreferred: true,
      });
    }

    // Path-Parent dashed edges
    if (node.parent && node.isPathParent && nodePosMap.has(node.parent)) {
      const pParent = nodePosMap.get(node.parent)!;
      edges.push({
        id: `pathparent_${id}_${node.parent}`,
        sourceX: p1.x,
        sourceY: p1.y,
        targetX: pParent.x,
        targetY: pParent.y,
        isPathParent: true,
        label: "path-parent",
      });
    }
  }

  return { nodes, edges };
};

// ============================================================================
// 9. REACT STUDIO PROPS & MAIN STUDIO COMPONENT
// ============================================================================

export interface TreapSplayTreeStudioProps {
  readonly initialModality?: TreapSplayModality;
  readonly initialPreset?: TreapSplayPresetId;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onModalityChange?: (modality: TreapSplayModality) => void;
  readonly onPresetChange?: (presetId: TreapSplayPresetId) => void;
}

export const TreapSplayTreeStudio: React.FC<TreapSplayTreeStudioProps> = ({
  initialModality = "cartesian_treap_split_merge",
  initialPreset = "cartesian_balanced_random",
  standalone = true,
  title = "Treap & Splay Tree Studio",
  onModalityChange,
  onPresetChange,
}) => {
  const [modality, setModality] = useState<TreapSplayModality>(initialModality);
  const [presetId, setPresetId] = useState<TreapSplayPresetId>(initialPreset);

  // Active Tree States
  const [cartesianTree, setCartesianTree] = useState<CartesianNode | null>(
    TREAP_SPLAY_PRESETS.cartesian_balanced_random.initialCartesian || null,
  );
  const [implicitTree, setImplicitTree] = useState<ImplicitNode | null>(
    TREAP_SPLAY_PRESETS.implicit_string_reversals.initialImplicit || null,
  );
  const [splayRoot, setSplayRoot] = useState<SplayNode | null>(
    TREAP_SPLAY_PRESETS.splay_skewed_chain.initialSplay || null,
  );
  const [lctForest, setLctForest] = useState<LCTForest>(
    TREAP_SPLAY_PRESETS.lct_dynamic_pipeline.initialLCT || createEmptyLCTForest(),
  );

  // Animation Steps & Player State
  const [steps, setSteps] = useState<TreapSplayAnimationStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // User input controls state
  const [inputKey, setInputKey] = useState<string>("35");
  const [inputPriority, setInputPriority] = useState<string>("85");
  const [inputRangeL, setInputRangeL] = useState<string>("2");
  const [inputRangeR, setInputRangeR] = useState<string>("6");
  const [inputShiftK, setInputShiftK] = useState<string>("2");
  const [inputLCTNodeU, setInputLCTNodeU] = useState<string>("N4");
  const [inputLCTNodeV, setInputLCTNodeV] = useState<string>("N1");

  const { ref: containerRef, box: canvasBox } = useCanvasBox({ width: 600, height: 380 });
  const playTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Switch Presets
  const applyPreset = useCallback(
    (targetPresetId: TreapSplayPresetId) => {
      const preset = TREAP_SPLAY_PRESETS[targetPresetId];
      if (!preset) return;

      setPresetId(targetPresetId);
      setModality(preset.modality);
      onPresetChange?.(targetPresetId);
      onModalityChange?.(preset.modality);

      if (preset.initialCartesian !== undefined && preset.initialCartesian !== null) {
        setCartesianTree(cloneCartesianTree(preset.initialCartesian));
        const initSteps = generateCartesianOperationSteps(preset.initialCartesian, "insert", {
          key: 9999,
        }); // placeholder init
        setSteps([initSteps[0]]);
      }
      if (preset.initialImplicit !== undefined && preset.initialImplicit !== null) {
        setImplicitTree(preset.initialImplicit);
        const initSteps = generateImplicitOperationSteps(preset.initialImplicit, "reverse", {
          l: 1,
          r: 1,
        });
        setSteps([initSteps[0]]);
      }
      if (preset.initialSplay !== undefined && preset.initialSplay !== null) {
        setSplayRoot(preset.initialSplay);
        const initSteps = generateSplayOperationSteps(preset.initialSplay, preset.initialSplay.key);
        setSteps([initSteps[0]]);
      }
      if (preset.initialLCT !== undefined && preset.initialLCT !== null) {
        setLctForest(cloneLCTForest(preset.initialLCT));
        const initSteps = generateLCTOperationSteps(preset.initialLCT, "access", {
          u: Object.keys(preset.initialLCT.nodes)[0] || "N1",
        });
        setSteps([initSteps[0]]);
      }
      setCurrentStepIdx(0);
      setIsPlaying(false);
    },
    [onModalityChange, onPresetChange],
  );

  useEffect(() => {
    applyPreset(initialPreset);
  }, [initialPreset, applyPreset]);

  // Handle Modality Switch
  const handleModalityTabChange = (newModality: TreapSplayModality) => {
    setModality(newModality);
    onModalityChange?.(newModality);
    // Find first preset matching new modality
    const matchingPreset = (Object.keys(TREAP_SPLAY_PRESETS) as TreapSplayPresetId[]).find(
      (id) => TREAP_SPLAY_PRESETS[id].modality === newModality,
    );
    if (matchingPreset) {
      applyPreset(matchingPreset);
    }
  };

  // Step Animation Playback Engine
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }

    if (currentStepIdx >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = Math.max(250, 1200 / playbackSpeed);
    playTimerRef.current = setTimeout(() => {
      setCurrentStepIdx((prev) => Math.min(prev + 1, steps.length - 1));
    }, interval);

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [isPlaying, currentStepIdx, steps.length, playbackSpeed]);

  const currentStep = steps[currentStepIdx] || steps[0];

  // Interactive Action Handlers
  const handleCartesianInsert = () => {
    const k = parseFloat(inputKey) || 10;
    const p = parseFloat(inputPriority) || Math.floor(Math.random() * 100) + 1;
    const newSteps = generateCartesianOperationSteps(cartesianTree, "insert", {
      key: k,
      priority: p,
    });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.cartesianRoot) setCartesianTree(last.cartesianRoot);
    }
  };

  const handleCartesianSplit = () => {
    const k = parseFloat(inputKey) || 25;
    const newSteps = generateCartesianOperationSteps(cartesianTree, "split", { splitKey: k });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
  };

  const handleCartesianDelete = () => {
    const k = parseFloat(inputKey) || 10;
    const newSteps = generateCartesianOperationSteps(cartesianTree, "delete", { key: k });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.cartesianRoot !== undefined) setCartesianTree(last.cartesianRoot);
    }
  };

  const handleImplicitReverse = () => {
    const l = parseInt(inputRangeL, 10) || 1;
    const r = parseInt(inputRangeR, 10) || 4;
    const newSteps = generateImplicitOperationSteps(implicitTree, "reverse", { l, r });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.implicitRoot) setImplicitTree(last.implicitRoot);
    }
  };

  const handleImplicitShift = () => {
    const l = parseInt(inputRangeL, 10) || 1;
    const r = parseInt(inputRangeR, 10) || 6;
    const s = parseInt(inputShiftK, 10) || 2;
    const newSteps = generateImplicitOperationSteps(implicitTree, "shift", { l, r, shift: s });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.implicitRoot) setImplicitTree(last.implicitRoot);
    }
  };

  const handleSplayKey = () => {
    const k = parseFloat(inputKey) || 20;
    const newSteps = generateSplayOperationSteps(splayRoot, k);
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.splayRoot) setSplayRoot(last.splayRoot);
    }
  };

  const handleLCTAccess = () => {
    const u = inputLCTNodeU.trim();
    if (!lctForest.nodes[u]) return;
    const newSteps = generateLCTOperationSteps(lctForest, "access", { u });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.lctForest) setLctForest(last.lctForest);
    }
  };

  const handleLCTMakeRoot = () => {
    const u = inputLCTNodeU.trim();
    if (!lctForest.nodes[u]) return;
    const newSteps = generateLCTOperationSteps(lctForest, "makeRoot", { u });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.lctForest) setLctForest(last.lctForest);
    }
  };

  const handleLCTLink = () => {
    const u = inputLCTNodeU.trim();
    const v = inputLCTNodeV.trim();
    if (!lctForest.nodes[u] || !lctForest.nodes[v]) return;
    const newSteps = generateLCTOperationSteps(lctForest, "link", { u, v });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.lctForest) setLctForest(last.lctForest);
    }
  };

  const handleLCTCut = () => {
    const u = inputLCTNodeU.trim();
    if (!lctForest.nodes[u]) return;
    const newSteps = generateLCTOperationSteps(lctForest, "cut", { u });
    setSteps(newSteps);
    setCurrentStepIdx(0);
    setIsPlaying(true);
    if (newSteps.length > 0) {
      const last = newSteps[newSteps.length - 1];
      if (last.lctForest) setLctForest(last.lctForest);
    }
  };

  // Layout calculation for SVG Canvas
  const layout = useMemo(() => {
    const w = Math.max(canvasBox.width, 600);
    const h = Math.max(canvasBox.height, 380);

    if (modality === "cartesian_treap_split_merge") {
      if (currentStep?.cartesianLeft && currentStep?.cartesianRight) {
        const leftLayout = layoutBinaryTree(currentStep.cartesianLeft, w / 2, h, true, false);
        const rightLayout = layoutBinaryTree(currentStep.cartesianRight, w / 2, h, false, true);
        // Shift right layout nodes horizontally
        const shiftedRightNodes = rightLayout.nodes.map((n) => ({ ...n, x: n.x + w / 2 }));
        const shiftedRightEdges = rightLayout.edges.map((e) => ({
          ...e,
          sourceX: e.sourceX + w / 2,
          targetX: e.targetX + w / 2,
        }));
        return {
          nodes: [...leftLayout.nodes, ...shiftedRightNodes],
          edges: [...leftLayout.edges, ...shiftedRightEdges],
        };
      }
      return layoutBinaryTree(currentStep?.cartesianRoot || cartesianTree, w, h);
    } else if (modality === "implicit_treap_range_reversal") {
      return layoutBinaryTree(currentStep?.implicitRoot || implicitTree, w, h - 80);
    } else if (modality === "splay_tree_rotations") {
      return layoutBinaryTree(currentStep?.splayRoot || splayRoot, w, h);
    } else if (modality === "link_cut_tree_access") {
      return layoutLCTForest(currentStep?.lctForest || lctForest, w, h);
    }
    return { nodes: [], edges: [] };
  }, [modality, currentStep, cartesianTree, implicitTree, splayRoot, lctForest, canvasBox]);

  const telemetry = currentStep?.telemetry || {
    nodeCount: 0,
    treeHeight: 0,
    balanceFactor: 1,
    potentialPhi: 0,
    zigCount: 0,
    zigZigCount: 0,
    zigZagCount: 0,
    totalRotations: 0,
    operationCount: 1,
    amortizedCostBound: "O(log N)",
  };

  const currentPreset = TREAP_SPLAY_PRESETS[presetId];

  return (
    <div
      className={`flex flex-col w-full h-full bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 ${standalone ? "p-4 space-y-4" : "p-2 space-y-2"}`}
    >
      {/* HEADER & MODALITY SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Self-adjusting and randomized search structures with potential invariants & amortized
            bounds.
          </p>
        </div>

        {/* Modality Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => handleModalityTabChange("cartesian_treap_split_merge")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              modality === "cartesian_treap_split_merge"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Cartesian Treap
          </button>
          <button
            type="button"
            onClick={() => handleModalityTabChange("implicit_treap_range_reversal")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              modality === "implicit_treap_range_reversal"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Implicit Treap
          </button>
          <button
            type="button"
            onClick={() => handleModalityTabChange("splay_tree_rotations")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              modality === "splay_tree_rotations"
                ? "bg-fuchsia-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Splay Tree
          </button>
          <button
            type="button"
            onClick={() => handleModalityTabChange("link_cut_tree_access")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              modality === "link_cut_tree_access"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            Link-Cut Tree
          </button>
        </div>
      </div>

      {/* PRESET SELECTOR & THEORY ACCORDION */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-slate-300">Preset:</span>
          <select
            value={presetId}
            onChange={(e) => applyPreset(e.target.value as TreapSplayPresetId)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {(Object.keys(TREAP_SPLAY_PRESETS) as TreapSplayPresetId[])
              .filter((id) => TREAP_SPLAY_PRESETS[id].modality === modality)
              .map((id) => (
                <option key={id} value={id}>
                  {TREAP_SPLAY_PRESETS[id].name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {currentPreset?.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* MAIN VISUALIZATION CANVAS & TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[420px]">
        {/* SVG CANVAS (Cols 1-3) */}
        <div
          ref={containerRef}
          className="relative lg:col-span-3 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden flex flex-col justify-between"
        >
          <svg
            className="w-full h-full min-h-[360px]"
            viewBox={`0 0 ${Math.max(canvasBox.width, 600)} ${Math.max(canvasBox.height, 380)}`}
          >
            <defs>
              <marker
                id="pathParentArrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
              </marker>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* EDGES */}
            {layout.edges.map((edge) => {
              const isPathParent = edge.isPathParent;
              return (
                <g key={edge.id}>
                  <line
                    x1={edge.sourceX}
                    y1={edge.sourceY}
                    x2={edge.targetX}
                    y2={edge.targetY}
                    stroke={isPathParent ? "#f59e0b" : "#475569"}
                    strokeWidth={isPathParent ? 2 : 2.5}
                    strokeDasharray={isPathParent ? "5,4" : undefined}
                    markerEnd={isPathParent ? "url(#pathParentArrow)" : undefined}
                    opacity={0.85}
                  />
                  {edge.label && (
                    <text
                      x={(edge.sourceX + edge.targetX) / 2}
                      y={(edge.sourceY + edge.targetY) / 2 - 6}
                      fill="#fbbf24"
                      fontSize={9}
                      textAnchor="middle"
                      className="select-none font-mono"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* NODES */}
            {layout.nodes.map((node) => {
              const isActive = currentStep?.activeNodeIds?.includes(node.id);
              let circleFill = "#1e293b";
              let circleStroke = "#64748b";

              if (modality === "cartesian_treap_split_merge") {
                circleFill = node.isSplitL ? "#1e1b4b" : node.isSplitR ? "#311042" : "#1e293b";
                circleStroke = node.isSplitL ? "#818cf8" : node.isSplitR ? "#c084fc" : "#6366f1";
              } else if (modality === "implicit_treap_range_reversal") {
                circleFill = node.isReversed ? "#064e3b" : "#1e293b";
                circleStroke = node.isReversed ? "#34d399" : "#10b981";
              } else if (modality === "splay_tree_rotations") {
                circleFill = isActive ? "#581c87" : "#1e293b";
                circleStroke = isActive ? "#d8b4fe" : "#a855f7";
              } else if (modality === "link_cut_tree_access") {
                circleFill = node.isAuxRoot ? "#0c4a6e" : "#1e293b";
                circleStroke = node.isAuxRoot ? "#38bdf8" : "#0284c7";
              }

              if (isActive) {
                circleStroke = "#fbbf24";
              }

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  {/* Outer active aura */}
                  {isActive && (
                    <circle
                      r={24}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      opacity={0.6}
                      filter="url(#glow)"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    r={18}
                    fill={circleFill}
                    stroke={circleStroke}
                    strokeWidth={2.5}
                    className="transition-all duration-200"
                  />

                  {/* Node Label */}
                  <text
                    y={4}
                    fill="#f8fafc"
                    fontSize={12}
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {node.label}
                  </text>

                  {/* Top Priority Badge */}
                  {node.badgeTop && (
                    <g transform="translate(10, -14)">
                      <rect
                        x={-4}
                        y={-8}
                        width={28}
                        height={12}
                        rx={6}
                        fill="#3b0764"
                        stroke="#a855f7"
                        strokeWidth={1}
                      />
                      <text
                        x={10}
                        y={1}
                        fill="#e9d5ff"
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.badgeTop}
                      </text>
                    </g>
                  )}

                  {/* Bottom Size Badge */}
                  {node.badgeBottom && (
                    <g transform="translate(0, 22)">
                      <text
                        x={0}
                        y={0}
                        fill="#94a3b8"
                        fontSize={9}
                        fontWeight="medium"
                        textAnchor="middle"
                      >
                        {node.badgeBottom}
                      </text>
                    </g>
                  )}

                  {/* Lazy Reversal Tag */}
                  {node.isReversed && (
                    <g transform="translate(-18, -14)">
                      <rect
                        x={-4}
                        y={-8}
                        width={24}
                        height={12}
                        rx={6}
                        fill="#065f46"
                        stroke="#34d399"
                        strokeWidth={1}
                      />
                      <text
                        x={8}
                        y={1}
                        fill="#a7f3d0"
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        rev
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* IMPLICIT TREAP 1D ARRAY SLICE BAR */}
          {modality === "implicit_treap_range_reversal" && currentStep?.implicitArray && (
            <div className="border-t border-slate-800/80 bg-slate-900/90 p-2.5 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>In-Order 1D Array Projection (Index 1..N):</span>
                {currentStep.activeRange && (
                  <span className="text-emerald-400 font-semibold">
                    Reversal Range: [{currentStep.activeRange[0]}, {currentStep.activeRange[1]}]
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {currentStep.implicitArray.map((val, idx) => {
                  const oneIndexed = idx + 1;
                  const inRange =
                    currentStep.activeRange &&
                    oneIndexed >= currentStep.activeRange[0] &&
                    oneIndexed <= currentStep.activeRange[1];

                  return (
                    <div
                      key={`slice_${idx}_${val}`}
                      className={`flex flex-col items-center justify-center min-w-[36px] h-10 rounded border transition-all ${
                        inRange
                          ? "bg-emerald-950/80 border-emerald-400 text-emerald-200 font-bold shadow-sm"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      <span className="text-xs">{String(val)}</span>
                      <span className="text-[9px] text-slate-500 font-mono">#{oneIndexed}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* TELEMETRY & OPERATION CONTROL PANEL (Col 4) */}
        <div className="flex flex-col gap-3 justify-between">
          {/* TELEMETRY HUD */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Telemetry HUD
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded-md border border-indigo-800">
                {telemetry.amortizedCostBound}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Tree Height</span>
                <span className="text-sm font-bold text-slate-200">{telemetry.treeHeight}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Node Count</span>
                <span className="text-sm font-bold text-slate-200">{telemetry.nodeCount}</span>
              </div>

              {modality === "splay_tree_rotations" ? (
                <>
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Potential Φ</span>
                    <span className="text-sm font-bold text-fuchsia-400">
                      {telemetry.potentialPhi}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Rotations</span>
                    <span className="text-sm font-bold text-amber-400">
                      {telemetry.totalRotations}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Balance Ratio</span>
                    <span className="text-sm font-bold text-emerald-400">
                      {telemetry.balanceFactor}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Ops Executed</span>
                    <span className="text-sm font-bold text-sky-400">
                      {telemetry.operationCount}
                    </span>
                  </div>
                </>
              )}
            </div>

            {modality === "splay_tree_rotations" && (
              <div className="text-[10px] bg-slate-950/80 p-2 rounded border border-slate-800 flex justify-between text-slate-400 font-mono">
                <span>
                  Zig: <b className="text-slate-200">{telemetry.zigCount}</b>
                </span>
                <span>
                  Zig-Zig: <b className="text-slate-200">{telemetry.zigZigCount}</b>
                </span>
                <span>
                  Zig-Zag: <b className="text-slate-200">{telemetry.zigZagCount}</b>
                </span>
              </div>
            )}
          </div>

          {/* INTERACTIVE ACTIONS PANEL */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-3 flex-1 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Interactive Operations
            </span>

            {/* Modality-specific inputs */}
            {modality === "cartesian_treap_split_merge" && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Key</label>
                    <input
                      type="number"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Priority</label>
                    <input
                      type="number"
                      value={inputPriority}
                      onChange={(e) => setInputPriority(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleCartesianInsert}
                    className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    onClick={handleCartesianSplit}
                    className="px-2 py-1.5 bg-purple-600 hover:bg-purple-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    <Split className="w-3 h-3" /> Split
                  </button>
                  <button
                    type="button"
                    onClick={handleCartesianDelete}
                    className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {modality === "implicit_treap_range_reversal" && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Left (L)</label>
                    <input
                      type="number"
                      value={inputRangeL}
                      onChange={(e) => setInputRangeL(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Right (R)</label>
                    <input
                      type="number"
                      value={inputRangeR}
                      onChange={(e) => setInputRangeR(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Shift k</label>
                    <input
                      type="number"
                      value={inputShiftK}
                      onChange={(e) => setInputShiftK(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleImplicitReverse}
                    className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reverse [L, R]
                  </button>
                  <button
                    type="button"
                    onClick={handleImplicitShift}
                    className="px-2 py-1.5 bg-teal-600 hover:bg-teal-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3" /> Cyclic Shift
                  </button>
                </div>
              </div>
            )}

            {modality === "splay_tree_rotations" && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">
                    Splay Target Key
                  </label>
                  <input
                    type="number"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSplayKey}
                  className="w-full py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 font-semibold rounded text-white flex items-center justify-center gap-1.5"
                >
                  <TrendingUp className="w-3.5 h-3.5" /> Splay to Root
                </button>
              </div>
            )}

            {modality === "link_cut_tree_access" && (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Node u</label>
                    <input
                      type="text"
                      value={inputLCTNodeU}
                      onChange={(e) => setInputLCTNodeU(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Node v</label>
                    <input
                      type="text"
                      value={inputLCTNodeV}
                      onChange={(e) => setInputLCTNodeV(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleLCTAccess}
                    className="px-2 py-1.5 bg-sky-600 hover:bg-sky-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Access(u)
                  </button>
                  <button
                    type="button"
                    onClick={handleLCTMakeRoot}
                    className="px-2 py-1.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> MakeRoot(u)
                  </button>
                  <button
                    type="button"
                    onClick={handleLCTLink}
                    className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    <Link2 className="w-3 h-3" /> Link(u, v)
                  </button>
                  <button
                    type="button"
                    onClick={handleLCTCut}
                    className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 font-semibold rounded text-white flex items-center justify-center gap-1"
                  >
                    <Unlink2 className="w-3 h-3" /> Cut(u)
                  </button>
                </div>
              </div>
            )}

            {/* STEP LOG EXPLAINER */}
            <div className="bg-slate-950/90 rounded-lg p-2.5 border border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                <Info className="w-3.5 h-3.5" />
                <span>{currentStep?.title || "Ready"}</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {currentStep?.description ||
                  "Select an operation to generate step-by-step animation trace."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ANIMATION CONTROLS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
        {/* Play / Pause / Steps */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={steps.length <= 1}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 shadow transition-all ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            type="button"
            onClick={() => setCurrentStepIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentStepIdx === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentStepIdx((prev) => Math.min(steps.length - 1, prev + 1))}
            disabled={currentStepIdx >= steps.length - 1}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStepIdx(0);
              setIsPlaying(false);
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-slate-400 pl-2">
            Step {steps.length > 0 ? currentStepIdx + 1 : 0} of {steps.length}
          </span>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Speed:</span>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono text-slate-300 w-8">{playbackSpeed}x</span>
        </div>
      </div>
    </div>
  );
};

export default TreapSplayTreeStudio;
