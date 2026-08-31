import { describe, expect, it } from "bun:test";
import React from "react";
import {
  TreapSplayTreeStudio,
  TREAP_SPLAY_PRESETS,
  generateUniqueNodeId,
  getCartesianSize,
  createCartesianNode,
  cloneCartesianTree,
  splitCartesian,
  mergeCartesian,
  insertCartesian,
  deleteCartesian,
  findCartesian,
  kthCartesian,
  collectCartesianInOrder,
  computeCartesianHeight,
  validateCartesianTreap,
  getImplicitSize,
  createImplicitNode,
  pushDownImplicit,
  splitImplicit,
  reverseRangeImplicit,
  cyclicShiftImplicit,
  insertAtImplicit,
  deleteAtImplicit,
  extractImplicitArray,
  validateImplicitTreap,
  getSplaySize,
  createSplayNode,
  updateSplaySize,
  calculateSplayPotentialPhi,
  splayTree,
  insertSplay,
  deleteSplay,
  validateSplayTree,
  createLCTNode,
  createEmptyLCTForest,
  cloneLCTForest,
  accessLCT,
  makeRootLCT,
  findRootLCT,
  linkLCT,
  cutLCT,
  generateCartesianOperationSteps,
  generateImplicitOperationSteps,
  generateSplayOperationSteps,
  generateLCTOperationSteps,
  layoutBinaryTree,
  layoutLCTForest,
  type TreapSplayModality,
  type TreapSplayPresetId,
  type CartesianNode,
  type ImplicitNode,
  type SplayNode,
} from "../../components/primitives";

describe("TreapSplayTreeStudio & Self-Adjusting / Randomized Search Trees Suite", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props Configuration", () => {
    it("should instantiate TreapSplayTreeStudio with default props", () => {
      const element = React.createElement(TreapSplayTreeStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(TreapSplayTreeStudio);
    });

    it("should instantiate TreapSplayTreeStudio with custom props and handlers", () => {
      const onModalityMock = (_mod: TreapSplayModality) => {};
      const onPresetMock = (_p: TreapSplayPresetId) => {};

      const element = React.createElement(TreapSplayTreeStudio, {
        initialModality: "implicit_treap_range_reversal",
        initialPreset: "implicit_string_reversals",
        standalone: true,
        title: "Custom Treap & Splay Playground",
        onModalityChange: onModalityMock,
        onPresetChange: onPresetMock,
      });

      expect(element.props.initialModality).toBe("implicit_treap_range_reversal");
      expect(element.props.initialPreset).toBe("implicit_string_reversals");
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("Custom Treap & Splay Playground");
      expect(element.props.onModalityChange).toBe(onModalityMock);
      expect(element.props.onPresetChange).toBe(onPresetMock);
    });
  });

  // ==========================================================================
  // 2. PRESETS INTEGRITY & DOMAIN INVARIANTS
  // ==========================================================================
  describe("2. Presets Integrity & Domain Invariants", () => {
    const allPresetIds: TreapSplayPresetId[] = [
      "cartesian_balanced_random",
      "cartesian_skewed_vs_heap",
      "cartesian_split_merge_demo",
      "implicit_string_reversals",
      "implicit_cyclic_shifts",
      "implicit_text_buffer",
      "splay_skewed_chain",
      "splay_zig_zag_cascade",
      "splay_zipfian_cache",
      "lct_dynamic_pipeline",
      "lct_distributed_forest",
      "lct_star_reroot",
    ];

    it("should verify all 12 presets exist with complete descriptive metadata", () => {
      for (const id of allPresetIds) {
        const preset = TREAP_SPLAY_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.theoryNotes.length).toBeGreaterThan(0);
        expect(preset.tags.length).toBeGreaterThan(0);
      }
    });

    it("should satisfy Cartesian Treap invariants in all Cartesian presets", () => {
      const cartesianPresets: TreapSplayPresetId[] = [
        "cartesian_balanced_random",
        "cartesian_skewed_vs_heap",
        "cartesian_split_merge_demo",
      ];
      for (const id of cartesianPresets) {
        const preset = TREAP_SPLAY_PRESETS[id];
        expect(preset.initialCartesian).toBeDefined();
        const validation = validateCartesianTreap(preset.initialCartesian!);
        expect(validation.valid).toBe(true);
        expect(validation.bstValid).toBe(true);
        expect(validation.heapValid).toBe(true);
        expect(validation.sizeValid).toBe(true);
      }
    });

    it("should satisfy Implicit Treap invariants in all Implicit presets", () => {
      const implicitPresets: TreapSplayPresetId[] = [
        "implicit_string_reversals",
        "implicit_cyclic_shifts",
        "implicit_text_buffer",
      ];
      for (const id of implicitPresets) {
        const preset = TREAP_SPLAY_PRESETS[id];
        expect(preset.initialImplicit).toBeDefined();
        const validation = validateImplicitTreap(preset.initialImplicit!);
        expect(validation.valid).toBe(true);
        expect(validation.heapValid).toBe(true);
        expect(validation.sizeValid).toBe(true);
      }
    });

    it("should satisfy Splay Tree BST and size invariants in all Splay presets", () => {
      const splayPresets: TreapSplayPresetId[] = [
        "splay_skewed_chain",
        "splay_zig_zag_cascade",
        "splay_zipfian_cache",
      ];
      for (const id of splayPresets) {
        const preset = TREAP_SPLAY_PRESETS[id];
        expect(preset.initialSplay).toBeDefined();
        const validation = validateSplayTree(preset.initialSplay!);
        expect(validation.valid).toBe(true);
        expect(validation.bstValid).toBe(true);
        expect(validation.sizeValid).toBe(true);
      }
    });

    it("should verify Link-Cut Tree structure in all LCT presets", () => {
      const lctPresets: TreapSplayPresetId[] = [
        "lct_dynamic_pipeline",
        "lct_distributed_forest",
        "lct_star_reroot",
      ];
      for (const id of lctPresets) {
        const preset = TREAP_SPLAY_PRESETS[id];
        expect(preset.initialLCT).toBeDefined();
        const forest = preset.initialLCT!;
        expect(Object.keys(forest.nodes).length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // 3. PURE CARTESIAN TREAP ALGORITHMIC ENGINE
  // ==========================================================================
  describe("3. Pure Cartesian Treap Algorithmic Engine", () => {
    it("should create Cartesian nodes with valid key, priority, and default size 1", () => {
      const node = createCartesianNode(42, 99, "val_42");
      expect(node.key).toBe(42);
      expect(node.priority).toBe(99);
      expect(node.val).toBe("val_42");
      expect(node.size).toBe(1);
      expect(node.left).toBeNull();
      expect(node.right).toBeNull();
    });

    it("should clone Cartesian tree preserving exact topology", () => {
      let root: CartesianNode | null = null;
      root = insertCartesian(root, 20, 90);
      root = insertCartesian(root, 10, 70);
      root = insertCartesian(root, 30, 80);

      const cloned = cloneCartesianTree(root);
      expect(cloned).not.toBe(root);
      expect(cloned?.key).toBe(root?.key);
      expect(cloned?.size).toBe(root?.size);
      expect(cloned?.left?.key).toBe(root?.left?.key);
      expect(cloned?.right?.key).toBe(root?.right?.key);
    });

    it("should split Cartesian tree into left (<= key) and right (> key) subtrees", () => {
      let root: CartesianNode | null = null;
      const keys = [10, 20, 30, 40, 50, 60, 70];
      const priorities = [50, 90, 40, 99, 30, 85, 20];
      for (let i = 0; i < keys.length; i += 1) {
        root = insertCartesian(root, keys[i], priorities[i]);
      }

      const [L, R] = splitCartesian(root, 35);
      expect(getCartesianSize(L)).toBe(3); // 10, 20, 30
      expect(getCartesianSize(R)).toBe(4); // 40, 50, 60, 70

      const leftInOrder = collectCartesianInOrder(L).map((n) => n.key);
      const rightInOrder = collectCartesianInOrder(R).map((n) => n.key);

      expect(leftInOrder).toEqual([10, 20, 30]);
      expect(rightInOrder).toEqual([40, 50, 60, 70]);

      expect(validateCartesianTreap(L).valid).toBe(true);
      expect(validateCartesianTreap(R).valid).toBe(true);
    });

    it("should merge two disjoint Cartesian subtrees respecting Max-Heap priority", () => {
      const nodeL = createCartesianNode(20, 95);
      const nodeR = createCartesianNode(40, 75);

      const merged = mergeCartesian(nodeL, nodeR);
      expect(merged?.key).toBe(20); // Higher priority 95 is root
      expect(merged?.right?.key).toBe(40);
      expect(merged?.size).toBe(2);

      const validation = validateCartesianTreap(merged);
      expect(validation.valid).toBe(true);
    });

    it("should insert elements and maintain BST and Max-Heap invariants", () => {
      let root: CartesianNode | null = null;
      const testData = [50, 30, 70, 20, 40, 60, 80, 10, 25, 35, 45];
      for (const k of testData) {
        root = insertCartesian(root, k);
        const val = validateCartesianTreap(root);
        expect(val.valid).toBe(true);
      }
      expect(getCartesianSize(root)).toBe(testData.length);
      const inOrder = collectCartesianInOrder(root).map((n) => n.key);
      expect(inOrder).toEqual([...testData].sort((a, b) => a - b));
    });

    it("should delete elements while maintaining all Treap invariants", () => {
      let root: CartesianNode | null = null;
      const data = [10, 20, 30, 40, 50];
      for (const k of data) {
        root = insertCartesian(root, k, k * 2);
      }

      root = deleteCartesian(root, 30);
      expect(getCartesianSize(root)).toBe(4);
      expect(findCartesian(root, 30)).toBeNull();
      expect(findCartesian(root, 20)?.key).toBe(20);

      const val = validateCartesianTreap(root);
      expect(val.valid).toBe(true);
    });

    it("should find the k-th smallest element (1-indexed) in O(log N)", () => {
      let root: CartesianNode | null = null;
      const keys = [10, 20, 30, 40, 50];
      for (const k of keys) {
        root = insertCartesian(root, k);
      }

      expect(kthCartesian(root, 1)?.key).toBe(10);
      expect(kthCartesian(root, 3)?.key).toBe(30);
      expect(kthCartesian(root, 5)?.key).toBe(50);
      expect(kthCartesian(root, 0)).toBeNull();
      expect(kthCartesian(root, 6)).toBeNull();
    });

    it("should detect invariant violations in validateCartesianTreap", () => {
      // BST violation
      const badBST: CartesianNode = {
        id: "bad1",
        key: 50,
        priority: 100,
        size: 2,
        left: { id: "bad2", key: 60, priority: 80, size: 1, left: null, right: null },
        right: null,
      };
      const bstCheck = validateCartesianTreap(badBST);
      expect(bstCheck.valid).toBe(false);
      expect(bstCheck.bstValid).toBe(false);

      // Heap priority violation
      const badHeap: CartesianNode = {
        id: "bad3",
        key: 50,
        priority: 50,
        size: 2,
        left: { id: "bad4", key: 30, priority: 90, size: 1, left: null, right: null },
        right: null,
      };
      const heapCheck = validateCartesianTreap(badHeap);
      expect(heapCheck.valid).toBe(false);
      expect(heapCheck.heapValid).toBe(false);

      // Size mismatch violation
      const badSize: CartesianNode = {
        id: "bad5",
        key: 50,
        priority: 90,
        size: 99, // Should be 1
        left: null,
        right: null,
      };
      const sizeCheck = validateCartesianTreap(badSize);
      expect(sizeCheck.valid).toBe(false);
      expect(sizeCheck.sizeValid).toBe(false);
    });
  });

  // ==========================================================================
  // 4. PURE IMPLICIT TREAP ALGORITHMIC ENGINE (RANGE REVERSALS & SHIFTS)
  // ==========================================================================
  describe("4. Pure Implicit Treap Algorithmic Engine", () => {
    it("should create implicit nodes and push down lazy reversal tags", () => {
      const node = createImplicitNode("X", 88);
      expect(node.val).toBe("X");
      expect(node.size).toBe(1);
      expect(node.rev).toBe(false);

      const leftChild = createImplicitNode("A", 40);
      const rightChild = createImplicitNode("B", 30);
      const parentNode: ImplicitNode = {
        id: "p1",
        val: "M",
        priority: 90,
        size: 3,
        rev: true,
        left: leftChild,
        right: rightChild,
      };

      const pushed = pushDownImplicit(parentNode);
      expect(pushed?.rev).toBe(false);
      expect(pushed?.left?.val).toBe("B"); // Swapped
      expect(pushed?.right?.val).toBe("A"); // Swapped
      expect(pushed?.left?.rev).toBe(true); // Lazy flag passed down
      expect(pushed?.right?.rev).toBe(true);
    });

    it("should split implicit treap by sequence index", () => {
      let root: ImplicitNode | null = null;
      const chars = ["A", "B", "C", "D", "E", "F"];
      for (let i = 0; i < chars.length; i += 1) {
        root = insertAtImplicit(root, i + 1, chars[i], 100 - i * 5);
      }

      const [L, R] = splitImplicit(root, 3);
      expect(extractImplicitArray(L)).toEqual(["A", "B", "C"]);
      expect(extractImplicitArray(R)).toEqual(["D", "E", "F"]);
    });

    it("should perform O(log N) lazy range reversal on subarray [L, R]", () => {
      let root: ImplicitNode | null = null;
      const chars = ["A", "L", "G", "O", "R", "I", "T", "H", "M"];
      for (let i = 0; i < chars.length; i += 1) {
        root = insertAtImplicit(root, i + 1, chars[i]);
      }

      // Reverse range [2, 6] -> "L", "G", "O", "R", "I" becomes "I", "R", "O", "G", "L"
      root = reverseRangeImplicit(root, 2, 6);
      const result = extractImplicitArray(root);
      expect(result).toEqual(["A", "I", "R", "O", "G", "L", "T", "H", "M"]);

      // Reverse full range [1, 9]
      root = reverseRangeImplicit(root, 1, 9);
      expect(extractImplicitArray(root)).toEqual(["M", "H", "T", "L", "G", "O", "R", "I", "A"]);
    });

    it("should cyclically shift subarray [L, R] by k positions", () => {
      let root: ImplicitNode | null = null;
      const nums = [1, 2, 3, 4, 5, 6, 7, 8];
      for (let i = 0; i < nums.length; i += 1) {
        root = insertAtImplicit(root, i + 1, nums[i]);
      }

      // Shift range [2, 7] (elements 2, 3, 4, 5, 6, 7) by 2 positions right -> 6, 7, 2, 3, 4, 5
      root = cyclicShiftImplicit(root, 2, 7, 2);
      expect(extractImplicitArray(root)).toEqual([1, 6, 7, 2, 3, 4, 5, 8]);
    });

    it("should insert and delete at arbitrary 1-indexed positions", () => {
      let root: ImplicitNode | null = null;
      root = insertAtImplicit(root, 1, "A");
      root = insertAtImplicit(root, 2, "C");
      root = insertAtImplicit(root, 2, "B"); // Insert in middle

      expect(extractImplicitArray(root)).toEqual(["A", "B", "C"]);

      root = deleteAtImplicit(root, 2); // Delete 'B'
      expect(extractImplicitArray(root)).toEqual(["A", "C"]);
    });
  });

  // ==========================================================================
  // 5. PURE SPLAY TREE ALGORITHMIC ENGINE & AMORTIZED POTENTIAL
  // ==========================================================================
  describe("5. Pure Splay Tree Algorithmic Engine", () => {
    it("should calculate Sleator-Tarjan Amortized Potential Phi = sum log2(size(u))", () => {
      let root: SplayNode | null = null;
      // Single node: size = 1, log2(1) = 0 -> phi = 0
      root = createSplayNode(10);
      expect(calculateSplayPotentialPhi(root)).toBe(0);

      // Balanced tree with 3 nodes
      root = insertSplay(null, 20).newRoot;
      root = insertSplay(root, 10).newRoot;
      root = insertSplay(root, 30).newRoot;

      const phi = calculateSplayPotentialPhi(root);
      expect(phi).toBeGreaterThan(0);
    });

    it("should perform single rotation (Zig) when parent is root", () => {
      const root = createSplayNode(20);
      const leftChild = createSplayNode(10);
      const tree = updateSplaySize(root, leftChild, null);

      const splayed = splayTree(tree, 10);
      expect(splayed.newRoot?.key).toBe(10);
      expect(splayed.zigCount).toBe(1);
      expect(splayed.steps.some((s) => s.rotationType === "zig")).toBe(true);
    });

    it("should perform double same-direction rotation (Zig-Zig) on skewed chain", () => {
      // Skewed chain: 30 -> 20 -> 10
      let root: SplayNode | null = null;
      root = insertSplay(root, 30).newRoot;
      root = insertSplay(root, 20).newRoot;
      root = insertSplay(root, 10).newRoot;

      const splayed = splayTree(root, 30);
      expect(splayed.newRoot?.key).toBe(30);
      expect(validateSplayTree(splayed.newRoot).valid).toBe(true);
    });

    it("should perform double opposite-direction rotation (Zig-Zag)", () => {
      // Zig-zag topology: 30 -> left 10 -> right 20
      const node20 = createSplayNode(20);
      const node10 = updateSplaySize(createSplayNode(10), null, node20);
      const node30 = updateSplaySize(createSplayNode(30), node10, null);

      const splayed = splayTree(node30, 20);
      expect(splayed.newRoot?.key).toBe(20);
      expect(splayed.zigZagCount).toBeGreaterThanOrEqual(1);
      expect(validateSplayTree(splayed.newRoot).valid).toBe(true);
    });

    it("should insert and delete keys with proper splay restructuring", () => {
      let root: SplayNode | null = null;
      const keys = [50, 30, 70, 20, 40, 60, 80];
      for (const k of keys) {
        root = insertSplay(root, k).newRoot;
      }
      expect(root.key).toBe(80); // Most recently inserted is at root
      expect(getSplaySize(root)).toBe(7);

      const delResult = deleteSplay(root, 80);
      expect(delResult.newRoot?.key).not.toBe(80);
      expect(getSplaySize(delResult.newRoot)).toBe(6);
    });
  });

  // ==========================================================================
  // 6. PURE LINK-CUT TREE (LCT) ALGORITHMIC ENGINE
  // ==========================================================================
  describe("6. Pure Link-Cut Tree (LCT) Algorithmic Engine", () => {
    it("should create empty forest and clone without cross-mutation", () => {
      const forest = createEmptyLCTForest();
      forest.nodes["A"] = createLCTNode("A", "Node A");
      forest.nodes["B"] = createLCTNode("B", "Node B");

      const cloned = cloneLCTForest(forest);
      expect(Object.keys(cloned.nodes)).toEqual(["A", "B"]);

      cloned.nodes["C"] = createLCTNode("C", "Node C");
      expect(forest.nodes["C"]).toBeUndefined();
    });

    it("should execute Access(u) making path from root to u a single preferred path", () => {
      const forest = createEmptyLCTForest();
      forest.nodes["1"] = createLCTNode("1");
      forest.nodes["2"] = createLCTNode("2");
      forest.nodes["3"] = createLCTNode("3");
      forest.nodes["4"] = createLCTNode("4");

      linkLCT(forest, "2", "1");
      linkLCT(forest, "3", "2");
      linkLCT(forest, "4", "3");

      accessLCT(forest, "3");
      expect(forest.nodes["3"].right).toBeNull(); // 3 is deepest on preferred path
    });

    it("should execute MakeRoot(u) dynamically rerooting the represented tree", () => {
      const forest = createEmptyLCTForest();
      forest.nodes["A"] = createLCTNode("A");
      forest.nodes["B"] = createLCTNode("B");
      forest.nodes["C"] = createLCTNode("C");

      linkLCT(forest, "B", "A");
      linkLCT(forest, "C", "B");

      expect(findRootLCT(forest, "C")).toBe("A"); // Initially A is root

      makeRootLCT(forest, "C");
      expect(findRootLCT(forest, "A")).toBe("C"); // Now C is root
      expect(findRootLCT(forest, "B")).toBe("C");
    });

    it("should link trees and prevent self-links or cycles", () => {
      const forest = createEmptyLCTForest();
      forest.nodes["U"] = createLCTNode("U");
      forest.nodes["V"] = createLCTNode("V");

      expect(linkLCT(forest, "U", "U")).toBe(false); // Self-link rejected

      const success = linkLCT(forest, "U", "V");
      expect(success).toBe(true);
      expect(findRootLCT(forest, "U")).toBe("V");

      // Attempting to link again should fail (cycle)
      expect(linkLCT(forest, "V", "U")).toBe(false);
    });

    it("should cut edges between connected nodes", () => {
      const forest = createEmptyLCTForest();
      forest.nodes["X"] = createLCTNode("X");
      forest.nodes["Y"] = createLCTNode("Y");

      linkLCT(forest, "X", "Y");
      expect(findRootLCT(forest, "X")).toBe("Y");

      const cutSuccess = cutLCT(forest, "X", "Y");
      expect(cutSuccess).toBe(true);
      expect(findRootLCT(forest, "X")).toBe("X");
      expect(findRootLCT(forest, "Y")).toBe("Y");
    });
  });

  // ==========================================================================
  // 7. STEP TRACE GENERATORS FOR ALL 4 MODALITIES
  // ==========================================================================
  describe("7. Step Trace Generators for All 4 Modalities", () => {
    it("should generate valid Cartesian Treap steps for Insert, Split, Delete", () => {
      let root: CartesianNode | null = null;
      root = insertCartesian(root, 20, 90);
      root = insertCartesian(root, 10, 70);

      const insertSteps = generateCartesianOperationSteps(root, "insert", {
        key: 30,
        priority: 80,
      });
      expect(insertSteps.length).toBeGreaterThan(1);
      expect(insertSteps[0].phase).toBe("init");

      const splitSteps = generateCartesianOperationSteps(root, "split", { splitKey: 15 });
      expect(splitSteps.length).toBeGreaterThan(1);
      expect(splitSteps[1].cartesianLeft).toBeDefined();

      const deleteSteps = generateCartesianOperationSteps(root, "delete", { key: 10 });
      expect(deleteSteps.length).toBeGreaterThan(1);
    });

    it("should generate valid Implicit Treap steps for Reverse and Shift", () => {
      let root: ImplicitNode | null = null;
      root = insertAtImplicit(root, 1, "A");
      root = insertAtImplicit(root, 2, "B");
      root = insertAtImplicit(root, 3, "C");
      root = insertAtImplicit(root, 4, "D");

      const revSteps = generateImplicitOperationSteps(root, "reverse", { l: 2, r: 3 });
      expect(revSteps.length).toBeGreaterThan(1);
      expect(revSteps[1].activeRange).toEqual([2, 3]);

      const shiftSteps = generateImplicitOperationSteps(root, "shift", { l: 1, r: 4, shift: 1 });
      expect(shiftSteps.length).toBeGreaterThan(1);
    });

    it("should generate valid Splay Tree rotation steps with potential Phi", () => {
      let root: SplayNode | null = null;
      root = insertSplay(root, 10).newRoot;
      root = insertSplay(root, 20).newRoot;
      root = insertSplay(root, 30).newRoot;

      const steps = generateSplayOperationSteps(root, 10);
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].splayPotentialPhi).toBeDefined();
    });

    it("should generate valid Link-Cut Tree steps for Access, MakeRoot, Link, Cut", () => {
      const forest = createEmptyLCTForest();
      forest.nodes["A"] = createLCTNode("A");
      forest.nodes["B"] = createLCTNode("B");

      const linkSteps = generateLCTOperationSteps(forest, "link", { u: "A", v: "B" });
      expect(linkSteps.length).toBeGreaterThan(1);

      const accessSteps = generateLCTOperationSteps(forest, "access", { u: "A" });
      expect(accessSteps.length).toBeGreaterThan(1);
    });
  });

  // ==========================================================================
  // 8. HIERARCHICAL SVG TREE LAYOUT CALCULATIONS
  // ==========================================================================
  describe("8. Hierarchical SVG Tree Layout Calculations", () => {
    it("should compute finite node layout coordinates with zero NaNs for binary trees", () => {
      let root: CartesianNode | null = null;
      for (const k of [20, 10, 30, 5, 15, 25, 35]) {
        root = insertCartesian(root, k);
      }

      const layout = layoutBinaryTree(root, 800, 400);
      expect(layout.nodes.length).toBe(7);
      expect(layout.edges.length).toBe(6);

      for (const node of layout.nodes) {
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
        expect(node.x).toBeGreaterThan(0);
        expect(node.y).toBeGreaterThan(0);
      }

      for (const edge of layout.edges) {
        expect(Number.isFinite(edge.sourceX)).toBe(true);
        expect(Number.isFinite(edge.sourceY)).toBe(true);
        expect(Number.isFinite(edge.targetX)).toBe(true);
        expect(Number.isFinite(edge.targetY)).toBe(true);
      }
    });

    it("should layout LCT forest distinguishing preferred and path-parent edges", () => {
      const forest = createEmptyLCTForest();
      forest.nodes["1"] = createLCTNode("1");
      forest.nodes["2"] = createLCTNode("2");
      forest.nodes["3"] = createLCTNode("3");
      linkLCT(forest, "2", "1");
      linkLCT(forest, "3", "2");

      const layout = layoutLCTForest(forest, 800, 400);
      expect(layout.nodes.length).toBe(3);
      for (const node of layout.nodes) {
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 9. EDGE CASES & BOUNDARY CONDITIONS
  // ==========================================================================
  describe("9. Edge Cases & Boundary Conditions", () => {
    it("should handle empty trees gracefully across all operations", () => {
      expect(getCartesianSize(null)).toBe(0);
      expect(computeCartesianHeight(null)).toBe(0);
      expect(splitCartesian(null, 10)).toEqual([null, null]);
      expect(mergeCartesian(null, null)).toBeNull();
      expect(deleteCartesian(null, 10)).toBeNull();
      expect(findCartesian(null, 10)).toBeNull();
      expect(kthCartesian(null, 1)).toBeNull();
      expect(validateCartesianTreap(null).valid).toBe(true);

      expect(getImplicitSize(null)).toBe(0);
      expect(pushDownImplicit(null)).toBeNull();
      expect(extractImplicitArray(null)).toEqual([]);
      expect(validateImplicitTreap(null).valid).toBe(true);

      expect(getSplaySize(null)).toBe(0);
      expect(calculateSplayPotentialPhi(null)).toBe(0);
      expect(deleteSplay(null, 10)).toEqual({ newRoot: null, steps: [] });
      expect(validateSplayTree(null).valid).toBe(true);

      const emptyLayout = layoutBinaryTree(null, 800, 400);
      expect(emptyLayout.nodes).toEqual([]);
      expect(emptyLayout.edges).toEqual([]);
    });

    it("should handle single node tree operations", () => {
      const single = createCartesianNode(10, 50);
      expect(getCartesianSize(single)).toBe(1);
      expect(computeCartesianHeight(single)).toBe(1);

      const [L, R] = splitCartesian(single, 5);
      expect(L).toBeNull();
      expect(R?.key).toBe(10);

      const splaySingle = splayTree(createSplayNode(10), 10);
      expect(splaySingle.newRoot?.key).toBe(10);
      expect(splaySingle.steps.length).toBe(0);
    });

    it("should handle out-of-bounds range reversals in implicit treap", () => {
      let root: ImplicitNode | null = null;
      root = insertAtImplicit(root, 1, "A");
      root = insertAtImplicit(root, 2, "B");

      // Invalid range l > r
      const revBad = reverseRangeImplicit(root, 2, 1);
      expect(extractImplicitArray(revBad)).toEqual(["A", "B"]);

      // Out of bounds l < 1
      const revNeg = reverseRangeImplicit(root, -1, 2);
      expect(extractImplicitArray(revNeg)).toEqual(["A", "B"]);
    });

    it("should generate unique node IDs across invocations", () => {
      const id1 = generateUniqueNodeId("test");
      const id2 = generateUniqueNodeId("test");
      expect(id1).not.toBe(id2);
    });
  });
});
