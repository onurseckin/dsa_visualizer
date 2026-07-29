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
  showIndices: boolean;
}

export const computeArrayLayout = (
  elements: ArrayElement[],
  box: Size,
  mode: "bar" | "box" = "bar",
  title?: string,
  density?: "compact",
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
  const hasTitle = Boolean(title && title.trim().length > 0);
  const titleWidth = hasTitle && title ? title.trim().length * 8.5 : 0;
  const titleGap = hasTitle ? 12 : 0;
  const isBoxMode = mode === "box";

  let run: BarRun;
  let barWidth: number;
  let valueFont: number;
  let startX: number;

  if (isBoxMode) {
    const runStart = PAD_X + titleWidth + titleGap;
    const runAvail = Math.max(box.width - PAD_X - runStart, 0);
    const maxGap = Math.max(GAP, targetBarW * MAX_GAP_RATIO);
    const targetSpan = targetBarW * count + GAP * gaps;
    const fitsAtTarget = targetSpan <= runAvail;
    const gap =
      gaps === 0
        ? 0
        : fitsAtTarget
          ? clamp((runAvail - targetBarW * count) / gaps, GAP, maxGap)
          : Math.min(GAP, runAvail / Math.max(count * 4, 1));
    const size = fitsAtTarget ? targetBarW : Math.max((runAvail - gap * gaps) / count, 0);
    const span = size * count + gap * gaps;

    run = { size, gap, span };
    barWidth = size;
    valueFont = clamp(Math.min(15, barWidth / (maxCharLen * 0.55 + 1)), fitsAtTarget ? 11 : 9, 16);
    startX = runStart + Math.max((runAvail - span) / 2, 0);
  } else {
    const maxGap = Math.max(GAP, targetBarW * MAX_GAP_RATIO);
    const gap = gaps > 0 ? clamp((avail - targetBarW * count) / gaps, GAP, maxGap) : 0;
    const span = targetBarW * count + gap * gaps;

    run = { size: targetBarW, gap, span };
    barWidth = targetBarW;
    valueFont = clamp(Math.min(15, barWidth / (maxCharLen * 0.55 + 1)), 11, 16);
    startX = Math.max(
      (box.width - run.span + titleWidth + titleGap) / 2,
      PAD_X + titleWidth + titleGap,
    );
  }

  const isCompact = density === "compact";
  const indexFont = isCompact ? 10 : 12;
  const pointerFont = isCompact ? 10 : 12;
  const pointerRowH = pointerFont * 1.5;

  const titleHeight = hasTitle && !isCompact ? 20 : 0;
  const pointerHeight = pointerRows > 0 ? pointerRows * pointerRowH + (isCompact ? 4 : 8) : 0;
  const topPad = titleHeight + pointerHeight + (isCompact ? 4 : 8);
  const titleY = hasTitle ? (isCompact ? 10 : 12) : 0;

  const bottomPad = isCompact ? 6 : 24;
  const bandHeight = Math.max(box.height - topPad - bottomPad, 1);
  const baselineY = topPad + bandHeight;

  const boxSize = Math.min(Math.max(bandHeight, isCompact ? 24 : 48), 56);
  const boxY = topPad + (bandHeight - boxSize) / 2;

  const minBarHeight = Math.max(bandHeight * 0.04, 4);
  const barRadius = 6;
  const labelY = boxY + boxSize + (isCompact ? 0 : 16);

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
    showIndices: !isCompact,
  };
};
