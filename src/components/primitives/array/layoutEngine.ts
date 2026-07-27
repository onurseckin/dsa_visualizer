import { ArrayElement } from "../../../types/dsa";
import { Size, clamp, fitSlots } from "../vizGeometry";
import { BarRun, GAP, MAX_GAP_RATIO, PAD_X, MIN_BAR_W, MAX_BAR_W } from "./arrayTypes";

export const barRun = (count: number, avail: number): BarRun => {
  const gaps = Math.max(count - 1, 0);
  const roomy = fitSlots(count, avail, GAP, MIN_BAR_W, MAX_BAR_W);

  if (roomy.span > avail) {
    const gap = gaps > 0 ? Math.min(GAP, avail / (count * 4)) : 0;
    const size = Math.max((avail - gap * gaps) / count, 1);
    return { size, gap, span: size * count + gap * gaps };
  }

  const maxGap = Math.max(GAP, roomy.size * MAX_GAP_RATIO);
  const gap = gaps > 0 ? clamp((avail - roomy.span) / gaps + roomy.gap, GAP, maxGap) : 0;
  return { size: roomy.size, gap, span: roomy.size * count + gap * gaps };
};

export interface ArrayMetrics {
  run: BarRun;
  barWidth: number;
  valueFont: number;
  indexFont: number;
  pointerFont: number;
  pointerRowH: number;
  topPad: number;
  bottomPad: number;
  bandHeight: number;
  baselineY: number;
  isBoxMode: boolean;
  boxSize: number;
  boxY: number;
  startX: number;
  minBarHeight: number;
  barRadius: number;
  labelY: number;
  maxVal: number;
}

export const computeArrayLayout = (
  elements: ArrayElement[],
  box: Size,
  mode: "bar" | "box" = "bar",
): ArrayMetrics => {
  const maxVal = Math.max(...elements.map((el) => el.value), 1);
  const count = Math.max(elements.length, 1);
  const pointerRows = elements.reduce(
    (rows, element) => Math.max(rows, element.pointers?.length ?? 0),
    0,
  );

  const run = barRun(count, Math.max(box.width - PAD_X * 2, 1));
  const barWidth = run.size;

  const valueFont = clamp(barWidth * 0.34, 9, 30);
  const indexFont = clamp(barWidth * 0.24, 8, 16);
  const pointerFont = clamp(barWidth * 0.24, 9, 15);
  const pointerRowH = pointerFont * 1.55;

  const topPad = Math.min(pointerRows > 0 ? pointerRows * pointerRowH + 16 : 4, box.height * 0.32);
  const bottomPad = Math.max(indexFont * 2.2 + 16, 32);
  const bandHeight = Math.max(box.height - topPad - bottomPad, 1);
  const baselineY = topPad + bandHeight;

  const isBoxMode = mode === "box";
  const boxSize = Math.min(barWidth, bandHeight);
  const boxY = topPad + (bandHeight - boxSize) / 2;

  const startX = (box.width - run.span) / 2;
  const minBarHeight = Math.max(bandHeight * 0.04, 4);
  const barRadius = clamp(barWidth * 0.12, 3, 10);
  const labelY = Math.min(baselineY + bottomPad / 2, box.height - indexFont * 0.6);

  return {
    run,
    barWidth,
    valueFont,
    indexFont,
    pointerFont,
    pointerRowH,
    topPad,
    bottomPad,
    bandHeight,
    baselineY,
    isBoxMode,
    boxSize,
    boxY,
    startX,
    minBarHeight,
    barRadius,
    labelY,
    maxVal,
  };
};
