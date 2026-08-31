import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_arrays_and_hashing_c1_p2",
  pageNumber: 2,
  title: "Systems Interplay",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Reality",
      content:
        "Linear probing exploits 64B cache lines perfectly. Quadratic probing quickly jumps to cold cache lines, incurring 100ns DRAM stalls.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps",
      content:
        "High load factors in Robin Hood hashing can cause cascading re-insertions, stalling the engine.",
    },
  ],
};
