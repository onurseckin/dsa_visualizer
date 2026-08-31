import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_intervals_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: 1D Temporal Geometry & Interval Engine",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "meeting-rooms-ii-sweep",
      title: "Meeting Rooms II via 2-Pointer Event Sweep Line",
      difficulty: "Medium",
      rationale:
        "Implement Meeting Rooms II in strictly $O(N \\log N)$ time and $O(N)$ auxiliary space. The algorithm deconstructs intervals into independent start and end coordinate arrays, sweeping across time with two pointers to compute the maximum concurrency depth.",
      starterCode: `/**
 * Meeting Rooms II (Interval Partitioning) Solver
 */

export function minMeetingRooms(intervals: number[][]): number {
  const n = intervals.length;
  if (n <= 1) return n;

  const starts = new Int32Array(n);
  const ends = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    starts[i] = intervals[i][0];
    ends[i] = intervals[i][1];
  }

  // Sort starts and ends independently in O(N log N)
  starts.sort();
  ends.sort();

  let maxRooms = 0;
  let activeRooms = 0;
  let startPtr = 0;
  let endPtr = 0;

  // 2-pointer event sweep
  while (startPtr < n) {
    if (starts[startPtr] < ends[endPtr]) {
      // A new meeting starts before the earliest meeting finishes: allocate a room
      activeRooms++;
      if (activeRooms > maxRooms) {
        maxRooms = activeRooms;
      }
      startPtr++;
    } else {
      // A meeting finishes: free a room
      activeRooms--;
      endPtr++;
    }
  }

  return maxRooms;
}`,
    },
  ],
};
