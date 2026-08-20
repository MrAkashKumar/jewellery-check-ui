import { ITEM_IMAGE_CONFIG } from "@/config/app-constants";

type CompressedItemImage = {
  dataUrl: string;
  sizeBytes: number;
};

function dataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to load image"));
    };
    image.src = url;
  });
}

export async function compressItemImage(file: File): Promise<CompressedItemImage> {
  const image = await loadImage(file);
  let maximumDimension: number = ITEM_IMAGE_CONFIG.initialMaxDimension;
  let best = "";

  while (maximumDimension >= ITEM_IMAGE_CONFIG.minimumDimension) {
    const scale = Math.min(1, maximumDimension / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (
      let quality = ITEM_IMAGE_CONFIG.initialQuality;
      quality >= ITEM_IMAGE_CONFIG.minimumQuality;
      quality -= ITEM_IMAGE_CONFIG.qualityStep
    ) {
      best = canvas.toDataURL(ITEM_IMAGE_CONFIG.mimeType, quality);
      if (dataUrlBytes(best) <= ITEM_IMAGE_CONFIG.targetBytes) {
        return { dataUrl: best, sizeBytes: dataUrlBytes(best) };
      }
    }
    maximumDimension = Math.floor(maximumDimension * ITEM_IMAGE_CONFIG.dimensionScale);
  }

  if (!best) throw new Error("Unable to compress image");
  return { dataUrl: best, sizeBytes: dataUrlBytes(best) };
}
