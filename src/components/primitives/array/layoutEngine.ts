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
  titleY: number;
  maxVal: number;
}

export const computeArrayLayout = (
  elements: ArrayElement[],
  box: Size,
  mode: "bar" | "box" = "bar",
  title?: string,
): ArrayMetrics => {
  const maxVal = Math.max(
    ...elements.map((el) => (typeof el.value === "number" ? el.value : Number(el.value) || 1)),
    1,
  );
  const count = Math.max(elements.length, 1);
  const pointerRows = elements.reduce(
    (rows, element) => Math.max(rows, element.pointers?.length ?? 0),
    0,
  );

  const maxCharLen = Math.max(...elements.map((el) => String(el.value ?? "").length), 1);

  // Content-aware dynamic cell width calculation
  const requiredCharWidth = Math.ceil(maxCharLen * 14 * 0.58 + 20);
  const targetBarW = Math.max(MIN_BAR_W, requiredCharWidth, 54);

  const gaps = Math.max(count - 1, 0);
  const avail = Math.max(box.width - PAD_X * 2, 1);
  const maxGap = Math.max(GAP, targetBarW * MAX_GAP_RATIO);
  const gap = gaps > 0 ? clamp((avail - targetBarW * count) / gaps, GAP, maxGap) : 0;
  const span = targetBarW * count + gap * gaps;
  const run: BarRun = { size: targetBarW, gap, span };

  const barWidth = targetBarW;
  const valueFont = clamp(Math.min(15, barWidth / (maxCharLen * 0.55 + 1)), 11, 16);
  const indexFont = 12;
  const pointerFont = 12;
  const pointerRowH = pointerFont * 1.5;

  const hasTitle = Boolean(title && title.trim().length > 0);
  const titleHeight = hasTitle ? 20 : 0;
  const pointerHeight = pointerRows > 0 ? pointerRows * pointerRowH + 8 : 0;
  const topPad = titleHeight + pointerHeight + 8;
  const titleY = hasTitle ? 12 : 0;

  const bottomPad = 24;
  const bandHeight = Math.max(box.height - topPad - bottomPad, 1);
  const baselineY = topPad + bandHeight;

  const isBoxMode = mode === "box";
  const boxSize = Math.min(Math.max(bandHeight, 48), 56);
  const boxY = topPad + (bandHeight - boxSize) / 2;

  const titleWidth = hasTitle && title ? title.trim().length * 8.5 : 0;
  const titleGap = hasTitle ? 12 : 0;
  const startX = Math.max(
    (box.width - run.span + titleWidth + titleGap) / 2,
    PAD_X + titleWidth + titleGap,
  );
  const minBarHeight = Math.max(bandHeight * 0.04, 4);
  const barRadius = 6;
  const labelY = boxY + boxSize + 16;

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
    titleY,
    maxVal,
  };
};
