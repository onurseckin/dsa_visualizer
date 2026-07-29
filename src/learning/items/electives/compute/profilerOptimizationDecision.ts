import { scenario } from "./shared";

export const profilerOptimizationDecision = scenario({
  id: "profiler-optimization-decision",
  title: "Make a Profiler Optimization Decision",
  topicId: "ml_accelerator_performance",
  entrypoint: "choose_optimization",
  contract:
    "Classify supplied profiler fractions into a conservative focus and threshold decision; it does not profile hardware.",
  code: `def choose_optimization(record):
    largest = max(("memory", record["memory_fraction"]), ("compute", record["compute_fraction"]), ("launch", record["launch_fraction"]), key=lambda pair: pair[1])
    focus = {"memory": "reduce-memory-traffic", "compute": "improve-compute-efficiency", "launch": "reduce-launch-overhead"}[largest[0]]
    return {"focus": focus, "dominant_fraction": largest[1], "optimize": largest[1] >= record["minimum_fraction"]}`,
  cases: [
    {
      id: "memory",
      label: "Memory dominated",
      input: {
        memory_fraction: 0.7,
        compute_fraction: 0.2,
        launch_fraction: 0.1,
        minimum_fraction: 0.5,
      },
      expected: { focus: "reduce-memory-traffic", dominant_fraction: 0.7, optimize: true },
      comparison: "deep-equal",
    },
    {
      id: "launch",
      label: "Launch dominated",
      input: {
        memory_fraction: 0.2,
        compute_fraction: 0.2,
        launch_fraction: 0.6,
        minimum_fraction: 0.65,
      },
      expected: { focus: "reduce-launch-overhead", dominant_fraction: 0.6, optimize: false },
      comparison: "deep-equal",
    },
    {
      id: "compute",
      label: "Compute dominated",
      input: {
        memory_fraction: 0.1,
        compute_fraction: 0.8,
        launch_fraction: 0.1,
        minimum_fraction: 0.5,
      },
      expected: { focus: "improve-compute-efficiency", dominant_fraction: 0.8, optimize: true },
      comparison: "deep-equal",
    },
  ],
  source: ["PyTorch profiler documentation", "https://docs.pytorch.org/docs/stable/profiler.html"],
  values: (r) => {
    const fractions = [
      ["memory fraction", Number(r.memory_fraction)],
      ["compute fraction", Number(r.compute_fraction)],
      ["launch fraction", Number(r.launch_fraction)],
    ] as const;
    const dominant = fractions.reduce((a, b) => (a[1] >= b[1] ? a : b));
    return [
      ...fractions,
      ["dominant cause", dominant[0]],
      ["threshold met", dominant[1] >= Number(r.minimum_fraction)],
    ];
  },
});
