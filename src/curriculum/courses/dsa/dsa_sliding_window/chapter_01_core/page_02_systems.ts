import type { CoursePage } from "../../../../courseTypes";

export const page2: CoursePage = {
  id: "dsa_sliding_window_c1_p2",
  pageNumber: 2,
  title: "Systems Interplay",
  sections: [
    {
      type: "callout",
      variant: "systems",
      title: "Silicon Reality",
      content:
        "Sequential memory access perfectly triggers hardware prefetchers, filling cache lines proactively.",
    },
    {
      type: "callout",
      variant: "warning",
      title: "Production Traps",
      content:
        "Off-by-one errors at boundaries can invalidate the invariant, causing subtle production bugs.",
    },
  ],
};
