import { test } from "vitest";
import { trainingResourceSizing } from "../training-resource-sizing";
import { expectFocusedProductionItem } from "./focusedItemContract";

test("computes GPU hours, utilization, waste, storage, and network independently", () => {
  const gpus = 4;
  const steps = 3600;
  const secondsPerStep = 2;
  const capacityGpuSeconds = gpus * steps * secondsPerStep;
  const gpuHours = capacityGpuSeconds / 3600;
  const utilization = 21600 / capacityGpuSeconds;

  expectFocusedProductionItem(trainingResourceSizing, {
    id: "training-resource-sizing",
    topic: "ml_training_platform",
    kind: "calculator",
    caseId: "four-gpu",
    expected: {
      peak_memory_per_gpu_gb: (16 * (1 + 3)) / gpus + 6,
      gpu_hours: gpuHours,
      utilization,
      wasted_gpu_hours: gpuHours * (1 - utilization),
      checkpoint_storage_gb: 3 * 20,
      network_transfer_gb: steps * 0.4,
      throughput_samples_per_second: 128 / secondsPerStep,
    },
  });
});
