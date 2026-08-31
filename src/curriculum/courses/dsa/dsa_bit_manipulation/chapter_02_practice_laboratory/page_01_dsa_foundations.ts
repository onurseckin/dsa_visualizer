import type { CoursePage } from "../../../../courseTypes";

export const page1: CoursePage = {
  id: "dsa_bit_manipulation_c2_p1",
  pageNumber: 1,
  title: "Interactive Laboratory: Bitwise Arithmetic & Word Engines",
  sections: [
    {
      type: "problem_checkpoint",
      problemId: "single-number-ii-state-machine",
      title: "Single Number II via Bitwise Finite State Machine",
      difficulty: "Medium",
      rationale:
        "Implement Single Number II: Given an integer array nums where every element appears three times except for one which appears exactly once, find that single element in $O(N)$ time and $O(1)$ extra space using a 2-bit modulo-3 digital counter.",
      starterCode: `/**
 * Single Number II (Modulo-3 Bit Counter) Solver
 */

export function singleNumber(nums: number[]): number {
  let ones = 0; // Tracks bits that have appeared 1 mod 3 times
  let twos = 0; // Tracks bits that have appeared 2 mod 3 times

  for (let i = 0; i < nums.length; i++) {
    const x = nums[i];

    // State transition for 2-bit counter: (twos, ones)
    // 00 + x -> 01
    // 01 + x -> 10
    // 10 + x -> 00
    ones = (ones ^ x) & ~twos;
    twos = (twos ^ x) & ~ones;
  }

  return ones;
}`,
    },
  ],
};
