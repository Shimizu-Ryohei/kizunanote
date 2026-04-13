type CompressImageOptions = {
  maxDimension?: number;
  quality?: number;
  minQuality?: number;
  targetMaxBytes?: number;
};

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました。"));
    };

    image.src = objectUrl;
  });
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const {
    maxDimension = 960,
    quality = 0.74,
    minQuality = 0.52,
    targetMaxBytes = 350 * 1024,
  } = options;
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return file;
  }

  const scale = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  let currentQuality = quality;
  let blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", currentQuality);
  });

  while (blob && blob.size > targetMaxBytes && currentQuality > minQuality) {
    currentQuality = Math.max(minQuality, Number((currentQuality - 0.06).toFixed(2)));
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", currentQuality);
    });
  }

  if (!blob) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");

  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
