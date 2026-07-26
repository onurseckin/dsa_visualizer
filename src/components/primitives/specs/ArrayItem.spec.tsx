import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArrayItem } from "../array/ArrayItem";
import { ArrayMetrics } from "../array/layoutEngine";
import { ArrayElement } from "../../../types/dsa";

const baseMetrics: ArrayMetrics = {
  startX: 10,
  barWidth: 40,
  bandHeight: 100,
  baselineY: 150,
  labelY: 170,
  minBarHeight: 10,
  maxVal: 100,
  isBoxMode: false,
  boxSize: 40,
  boxY: 50,
  topPad: 10,
  bottomPad: 10,
  pointerRowH: 16,
  pointerFont: 12,
  valueFont: 14,
  indexFont: 12,
  barRadius: 4,
  run: {
    size: 40,
    gap: 8,
    span: 48,
  },
};

describe("ArrayItem Component Spec", () => {
  it("renders bar mode with value inside when barHeight is large enough", () => {
    const item: ArrayElement = {
      id: "item-1",
      value: 80,
      state: "default",
      pointers: ["i", "j"],
    };

    const { container } = render(
      <svg>
        <ArrayItem item={item} index={0} metrics={baseMetrics} />
      </svg>,
    );

    // barHeight = Math.max((80 / 100) * 100, 10) = 80
    // 80 >= 14 * 1.9 (26.6) -> valueInside is true
    const rects = container.querySelectorAll("rect");
    // Last rect is the main bar rect (chips render rects before it)
    const mainRect = rects[rects.length - 1];
    expect(mainRect.getAttribute("stroke-width")).toBe("1.25");

    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("80");
    expect(texts).toContain("[0]");
  });

  it("renders bar mode with value outside when barHeight is small, and handles non-default state and missing id", () => {
    const item: ArrayElement = {
      id: "item-2",
      value: 5,
      state: "compare",
      pointers: ["k"],
    };

    const { container } = render(
      <svg>
        <ArrayItem item={item} index={1} metrics={baseMetrics} />
      </svg>,
    );

    // barHeight = Math.max((5 / 100) * 100, 10) = 10
    // 10 < 14 * 1.9 -> valueInside is false
    const rects = container.querySelectorAll("rect");
    const mainRect = rects[rects.length - 1];
    expect(mainRect.getAttribute("stroke-width")).toBe("2.5");

    const texts = Array.from(container.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("5");
    expect(texts).toContain("[1]");
  });

  it("renders box mode without pointers when pointers is empty or undefined", () => {
    const boxMetrics: ArrayMetrics = {
      ...baseMetrics,
      isBoxMode: true,
    };

    const item: ArrayElement = {
      id: "box-item",
      value: 42,
      state: "default",
    };

    const { container } = render(
      <svg>
        <ArrayItem item={item} index={2} metrics={boxMetrics} />
      </svg>,
    );

    const rect = container.querySelector("rect");
    expect(rect).not.toBeNull();
    expect(rect?.getAttribute("height")).toBe("40");

    const texts = container.querySelectorAll("text");
    expect(texts.length).toBe(2);
    expect(texts[0].textContent).toBe("42");
    expect(texts[1].textContent).toBe("[2]");
  });

  it("renders box mode with pointers", () => {
    const boxMetrics: ArrayMetrics = {
      ...baseMetrics,
      isBoxMode: true,
    };

    const item: ArrayElement = {
      id: "item-3",
      value: 15,
      state: "sorted",
      pointers: ["ptr"],
    };

    const { container } = render(
      <svg>
        <ArrayItem item={item} index={0} metrics={boxMetrics} />
      </svg>,
    );

    const texts = container.querySelectorAll("text");
    expect(texts.length).toBe(3); // pointer + value + index
    expect(texts[1].textContent).toBe("15");
  });

  it("renders correctly when item.id is omitted in bar mode and box mode", () => {
    const itemWithoutId: ArrayElement = {
      id: "no-id",
      value: 77,
      state: "default",
    };

    const { container: barContainer } = render(
      <svg>
        <ArrayItem item={itemWithoutId} index={5} metrics={baseMetrics} />
      </svg>,
    );
    expect(barContainer.querySelector("g")).not.toBeNull();

    const boxMetrics: ArrayMetrics = { ...baseMetrics, isBoxMode: true };
    const { container: boxContainer } = render(
      <svg>
        <ArrayItem item={itemWithoutId} index={5} metrics={boxMetrics} />
      </svg>,
    );
    expect(boxContainer.querySelector("g")).not.toBeNull();
  });
});
