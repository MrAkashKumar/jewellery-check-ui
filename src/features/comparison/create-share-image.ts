import { APP, SHARE_IMAGE_CONFIG, UI_COPY } from "@/config/app-constants";
import UPNG from "upng-js";

type ShareLine = { label: string; value: string };
type ShareComparison = {
  item: string;
  shops: Array<{ shop: string; price: string; best: boolean }>;
};

type ShareImageInput = {
  shop: string;
  item: string;
  purity: string;
  weight: string;
  finalPrice: string;
  breakdown: ShareLine[];
  comparisons: ShareComparison[];
};

const WIDTH = SHARE_IMAGE_CONFIG.logicalWidth;
const PADDING = 70;
const OUTPUT_SCALE = SHARE_IMAGE_CONFIG.outputWidth / WIDTH;
const COLORS = {
  background: "#171512",
  surface: "#221f1a",
  border: "#4b4438",
  text: "#f7f2e8",
  muted: "#beb5a5",
  gold: "#f2dfad",
  green: "#74b28a",
} as const;

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fill();
  context.stroke();
}

function encodeSmallPng(source: HTMLCanvasElement) {
  let canvas = source;
  let smallest: ArrayBuffer | undefined;

  while (canvas.width >= SHARE_IMAGE_CONFIG.minimumOutputWidth) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable");
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);

    for (const paletteSize of SHARE_IMAGE_CONFIG.paletteSizes) {
      const encoded = UPNG.encode(
        [pixels.data.buffer.slice(0) as ArrayBuffer],
        canvas.width,
        canvas.height,
        paletteSize,
      );
      if (!smallest || encoded.byteLength < smallest.byteLength) smallest = encoded;
      if (encoded.byteLength <= SHARE_IMAGE_CONFIG.maximumBytes) return encoded;
    }

    const nextWidth = Math.max(
      SHARE_IMAGE_CONFIG.minimumOutputWidth,
      Math.floor(canvas.width * SHARE_IMAGE_CONFIG.resizeScale),
    );
    if (nextWidth === canvas.width) break;
    const resized = document.createElement("canvas");
    resized.width = nextWidth;
    resized.height = Math.max(1, Math.round(canvas.height * (nextWidth / canvas.width)));
    const resizedContext = resized.getContext("2d");
    if (!resizedContext) throw new Error("Canvas is unavailable");
    resizedContext.imageSmoothingEnabled = true;
    resizedContext.imageSmoothingQuality = "high";
    resizedContext.drawImage(canvas, 0, 0, resized.width, resized.height);
    canvas = resized;
  }

  if (!smallest) throw new Error("Image export failed");
  return smallest;
}

export function createShareImage(input: ShareImageInput): File {
  const comparisonRows = input.comparisons.reduce(
    (count, comparison) => count + 1 + comparison.shops.length,
    0,
  );
  const logicalHeight = Math.min(
    SHARE_IMAGE_CONFIG.maximumLogicalHeight,
    520 + input.breakdown.length * 58 + comparisonRows * 54,
  );
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_IMAGE_CONFIG.outputWidth;
  canvas.height = Math.ceil(logicalHeight * OUTPUT_SCALE);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  context.scale(OUTPUT_SCALE, OUTPUT_SCALE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  context.fillStyle = COLORS.background;
  context.fillRect(0, 0, WIDTH, logicalHeight);
  context.fillStyle = COLORS.gold;
  context.font = "700 34px system-ui, sans-serif";
  context.fillText(APP.name, PADDING, 80);
  context.fillStyle = COLORS.text;
  context.font = "800 58px system-ui, sans-serif";
  context.fillText(UI_COPY.dashboard.shareCard.title, PADDING, 155);
  context.fillStyle = COLORS.muted;
  context.font = "400 25px system-ui, sans-serif";
  context.fillText(`${input.shop}  •  ${input.item}`, PADDING, 205);
  context.fillText(`${input.purity}  •  ${input.weight}`, PADDING, 243);

  context.fillStyle = COLORS.surface;
  context.strokeStyle = COLORS.border;
  context.lineWidth = 2;
  roundedRect(context, PADDING, 280, WIDTH - PADDING * 2, 135, 24);
  context.fillStyle = COLORS.muted;
  context.font = "600 25px system-ui, sans-serif";
  context.fillText(UI_COPY.dashboard.labels.finalPrice, PADDING + 34, 325);
  context.fillStyle = COLORS.text;
  context.font = "800 52px system-ui, sans-serif";
  context.fillText(input.finalPrice, PADDING + 34, 385);

  let y = 475;
  context.fillStyle = COLORS.text;
  context.font = "750 31px system-ui, sans-serif";
  context.fillText(UI_COPY.dashboard.shareCard.breakdown, PADDING, y);
  y += 35;
  context.fillStyle = COLORS.surface;
  context.strokeStyle = COLORS.border;
  roundedRect(
    context,
    PADDING,
    y,
    WIDTH - PADDING * 2,
    input.breakdown.length * 58 + 28,
    22,
  );
  y += 42;
  for (const line of input.breakdown) {
    context.fillStyle = COLORS.muted;
    context.font = "500 24px system-ui, sans-serif";
    context.fillText(line.label, PADDING + 30, y);
    context.fillStyle = COLORS.text;
    context.font = "700 24px system-ui, sans-serif";
    context.textAlign = "right";
    context.fillText(line.value, WIDTH - PADDING - 30, y);
    context.textAlign = "left";
    y += 58;
  }
  y += 48;

  if (input.comparisons.length) {
    context.fillStyle = COLORS.text;
    context.font = "750 31px system-ui, sans-serif";
    context.fillText(UI_COPY.dashboard.shareCard.comparison, PADDING, y);
    y += 48;
    for (const comparison of input.comparisons) {
      context.fillStyle = COLORS.gold;
      context.font = "750 26px system-ui, sans-serif";
      context.fillText(comparison.item, PADDING, y);
      y += 42;
      for (const entry of comparison.shops) {
        context.fillStyle = entry.best ? COLORS.green : COLORS.muted;
        context.font = `${entry.best ? "700" : "500"} 23px system-ui, sans-serif`;
        context.fillText(`${entry.best ? `${UI_COPY.dashboard.shareCard.best} • ` : ""}${entry.shop}`, PADDING + 20, y);
        context.textAlign = "right";
        context.fillText(entry.price, WIDTH - PADDING, y);
        context.textAlign = "left";
        y += 48;
      }
      y += 18;
    }
  }

  const blob = new Blob([encodeSmallPng(canvas)], {
    type: SHARE_IMAGE_CONFIG.mimeType,
  });
  return new File([blob], UI_COPY.dashboard.labels.shareImageName, {
    type: "image/png",
  });
}
