import { ALGORITHM_REGISTRY } from "../../../algorithms/registry";
import { advancedRangeQueriesExecutions } from "./advanced_range_queries";
import { arraysAndHashingExecutions } from "./arrays_and_hashing";
import { backtrackingExecutions } from "./backtracking";
import { binarySearchExecutions } from "./binary_search";
import { bitManipulationExecutions } from "./bit_manipulation";
import { dp1dExecutions } from "./dp_1d";
import { dp2dExecutions } from "./dp_2d";
import { gameTheoryExecutions } from "./game_theory";
import { geometryAndSweepLineExecutions } from "./geometry_and_sweep_line";
import { graphDirectedAndSccExecutions } from "./graph_directed_and_scc";
import { graphFlowsAndCutsExecutions } from "./graph_flows_and_cuts";
import { graphShortestPathsExecutions } from "./graph_shortest_paths";
import { graphSpanningTreesExecutions } from "./graph_spanning_trees";
import { graphTraversalExecutions } from "./graph_traversal";
import { greedyAlgorithmsExecutions } from "./greedy_algorithms";
import { heapAndPriorityQueueExecutions } from "./heap_and_priority_queue";
import { intervalsExecutions } from "./intervals";
import { linkedListExecutions } from "./linked_list";
import { mathAndNumberTheoryExecutions } from "./math_and_number_theory";
import { slidingWindowExecutions } from "./sliding_window";
import { stackAndQueueExecutions } from "./stack_and_queue";
import { treeFundamentalsExecutions } from "./tree_fundamentals";
import { treeQueriesAndDiameterExecutions } from "./tree_queries_and_diameter";
import { triesAndStringsExecutions } from "./tries_and_strings";
import { twoPointersExecutions } from "./two_pointers";
import type { DsaExecutionAuditEntry, DsaExecutionEntry } from "./types";

export type {
  DsaCaseFixture,
  DsaExecutionAuditEntry,
  DsaExecutionAuditSeed,
  DsaExecutionEntry,
} from "./types";

export const DSA_EXECUTION_ENTRIES: readonly DsaExecutionEntry[] = Object.freeze([
  ...arraysAndHashingExecutions,
  ...twoPointersExecutions,
  ...binarySearchExecutions,
  ...slidingWindowExecutions,
  ...stackAndQueueExecutions,
  ...linkedListExecutions,
  ...treeFundamentalsExecutions,
  ...triesAndStringsExecutions,
  ...heapAndPriorityQueueExecutions,
  ...intervalsExecutions,
  ...dp1dExecutions,
  ...dp2dExecutions,
  ...bitManipulationExecutions,
  ...mathAndNumberTheoryExecutions,
  ...gameTheoryExecutions,
  ...advancedRangeQueriesExecutions,
  ...backtrackingExecutions,
  ...geometryAndSweepLineExecutions,
  ...graphDirectedAndSccExecutions,
  ...graphFlowsAndCutsExecutions,
  ...graphShortestPathsExecutions,
  ...graphSpanningTreesExecutions,
  ...graphTraversalExecutions,
  ...greedyAlgorithmsExecutions,
  ...treeQueriesAndDiameterExecutions,
]);

const duplicateIds = DSA_EXECUTION_ENTRIES.map((entry) => entry.id).filter(
  (id, index, ids) => ids.indexOf(id) !== index,
);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate DSA execution ids: ${duplicateIds.join(", ")}`);
}

export const DSA_EXECUTION_SPECS = new Map(
  DSA_EXECUTION_ENTRIES.map((entry) => [entry.id, entry.spec] as const),
);

export const DSA_STARTER_CODE = new Map(
  DSA_EXECUTION_ENTRIES.map((entry) => [entry.id, entry.starterCode] as const),
);

export const DSA_EXECUTION_AUDIT: readonly DsaExecutionAuditEntry[] = Object.freeze(
  DSA_EXECUTION_ENTRIES.map((entry) => {
    const algorithm = ALGORITHM_REGISTRY[entry.id];
    if (!algorithm) {
      throw new Error(`DSA execution spec references unknown algorithm: ${entry.id}`);
    }

    return Object.freeze({
      id: entry.id,
      ...entry.audit,
      topicIds: algorithm.topicIds,
      defaultInput: algorithm.defaultInput,
      examples: (algorithm.examples ?? []).map((example, index) => {
        const authored = example as typeof example & { readonly kind?: string };
        return Object.freeze({
          kind: authored.kind ?? `example-${index + 1}`,
          input: example.input,
          output: example.output,
        });
      }),
    });
  }),
);
