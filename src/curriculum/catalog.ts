import type { CourseTopicJourney, CurriculumTrackId } from "./courseTypes";
import { DSA_COURSE_JOURNEYS, DSA_COURSES_BY_ID } from "./courses/dsa";
import { ML_COURSE_JOURNEYS, ML_COURSES_BY_ID } from "./courses/ml";

/**
 * Master Unified Course Catalog combining all 23 DSA courses and 41 ML Infra & Foundations courses.
 */
export const ALL_COURSE_JOURNEYS: readonly CourseTopicJourney[] = [
  ...DSA_COURSE_JOURNEYS,
  ...ML_COURSE_JOURNEYS,
];

/**
 * Global lookup table indexed by both full topic ID (e.g. 'dsa_arrays_and_hashing', 'ml_matrix_memory_layout')
 * and stripped shorthand ID (e.g. 'arrays_and_hashing', 'matrix_memory_layout').
 */
export const ALL_COURSES_BY_ID: Record<string, CourseTopicJourney> = {
  ...DSA_COURSES_BY_ID,
  ...ML_COURSES_BY_ID,
};

/**
 * Retrieves a course journey by topic ID with flexible prefix matching.
 */
export function getCourseJourney(topicId: string): CourseTopicJourney | undefined {
  return (
    ALL_COURSES_BY_ID[topicId] ||
    ALL_COURSES_BY_ID[`dsa_${topicId}`] ||
    ALL_COURSES_BY_ID[`ml_${topicId}`] ||
    ALL_COURSES_BY_ID[topicId.replace(/^(dsa_|ml_)/, "")]
  );
}

/**
 * Returns all active course journeys.
 */
export function getAllCourseJourneys(): readonly CourseTopicJourney[] {
  return ALL_COURSE_JOURNEYS;
}

/**
 * Filters course journeys by curriculum track identifier.
 */
export function getCourseJourneysByTrack(
  trackId: CurriculumTrackId,
): readonly CourseTopicJourney[] {
  if (trackId === "dsa") {
    return DSA_COURSE_JOURNEYS;
  }
  if (trackId === "machine-learning" || trackId === "ml" || trackId === "ml-infra") {
    return ML_COURSE_JOURNEYS;
  }
  return ALL_COURSE_JOURNEYS.filter(
    (journey) => journey.trackId === trackId || (!journey.trackId && trackId === "dsa"),
  );
}

export { DSA_COURSE_JOURNEYS, DSA_COURSES_BY_ID, getDsaCourse } from "./courses/dsa";
export { ML_COURSE_JOURNEYS, ML_COURSES_BY_ID, getMlCourse } from "./courses/ml";
