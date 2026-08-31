import type { CourseTopicJourney } from "../../courseTypes";
import { dsa_arrays_and_hashing_journey } from "./dsa_arrays_and_hashing";
import { dsa_two_pointers_journey } from "./dsa_two_pointers";
import { dsa_sliding_window_journey } from "./dsa_sliding_window";
import { dsa_stack_and_queue_journey } from "./dsa_stack_and_queue";
import { dsa_binary_search_journey } from "./dsa_binary_search";
import { dsa_linked_list_journey } from "./dsa_linked_list";
import { dsa_tree_fundamentals_journey } from "./dsa_tree_fundamentals";
import { dsa_tree_queries_and_diameter_journey } from "./dsa_tree_queries_and_diameter";
import { dsa_heap_and_priority_queue_journey } from "./dsa_heap_and_priority_queue";
import { dsa_graph_traversal_journey } from "./dsa_graph_traversal";
import { dsa_graph_shortest_paths_journey } from "./dsa_graph_shortest_paths";
import { dsa_graph_spanning_trees_journey } from "./dsa_graph_spanning_trees";
import { dsa_graph_flows_and_cuts_journey } from "./dsa_graph_flows_and_cuts";
import { dsa_dp_1d_journey } from "./dsa_dp_1d";
import { dsa_dp_2d_journey } from "./dsa_dp_2d";
import { dsa_advanced_range_queries_journey } from "./dsa_advanced_range_queries";
import { dsa_bit_manipulation_journey } from "./dsa_bit_manipulation";
import { dsa_math_and_number_theory_journey } from "./dsa_math_and_number_theory";
import { dsa_geometry_and_sweep_line_journey } from "./dsa_geometry_and_sweep_line";
import { dsa_tries_and_strings_journey } from "./dsa_tries_and_strings";
import { dsa_backtracking_journey } from "./dsa_backtracking";
import { dsa_game_theory_journey } from "./dsa_game_theory";
import { dsa_intervals_journey } from "./dsa_intervals";

export const DSA_COURSE_JOURNEYS: readonly CourseTopicJourney[] = [
  dsa_arrays_and_hashing_journey,
  dsa_two_pointers_journey,
  dsa_sliding_window_journey,
  dsa_stack_and_queue_journey,
  dsa_binary_search_journey,
  dsa_linked_list_journey,
  dsa_tree_fundamentals_journey,
  dsa_tree_queries_and_diameter_journey,
  dsa_heap_and_priority_queue_journey,
  dsa_graph_traversal_journey,
  dsa_graph_shortest_paths_journey,
  dsa_graph_spanning_trees_journey,
  dsa_graph_flows_and_cuts_journey,
  dsa_dp_1d_journey,
  dsa_dp_2d_journey,
  dsa_advanced_range_queries_journey,
  dsa_bit_manipulation_journey,
  dsa_math_and_number_theory_journey,
  dsa_geometry_and_sweep_line_journey,
  dsa_tries_and_strings_journey,
  dsa_backtracking_journey,
  dsa_game_theory_journey,
  dsa_intervals_journey,
];

export const DSA_COURSES_BY_ID: Record<string, CourseTopicJourney> = Object.fromEntries(
  DSA_COURSE_JOURNEYS.flatMap((journey) => {
    const rawId = journey.id;
    const strippedId = rawId.replace(/^dsa_/, "");
    return [
      [rawId, journey],
      [strippedId, journey],
    ];
  }),
);

export function getDsaCourse(topicId: string): CourseTopicJourney | undefined {
  return DSA_COURSES_BY_ID[topicId] || DSA_COURSES_BY_ID[`dsa_${topicId}`];
}
