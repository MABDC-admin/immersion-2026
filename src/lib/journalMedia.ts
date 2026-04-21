const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESSION_QUALITY = 0.82;
const IMAGE_COMPRESSION_THRESHOLD_BYTES = 1.25 * 1024 * 1024;

const COMPRESSIBLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

export function filterJournalMediaFiles(files: File[]) {
  const accepted: File[] = [];
  const rejected: File[] = [];

  files.forEach((file) => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      accepted.push(file);
    } else {
      rejected.push(file);
    }
  });

  return { accepted, rejected };
}

export function formatJournalMediaSize(size?: number | null) {
  if (!size) return 'Media';

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function canOptimizeJournalImage(file: File) {
  return COMPRESSIBLE_IMAGE_TYPES.has(file.type.toLowerCase());
}

function replaceFileExtension(fileName: string, extension: string) {
  if (!fileName.includes('.')) return `${fileName}.${extension}`;
  return fileName.replace(/\.[^.]+$/, `.${extension}`);
}

function getImageOutputType(file: File) {
  const lowerType = file.type.toLowerCase();
  if (lowerType === 'image/png' || lowerType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

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
      reject(new Error(`Unable to load image ${file.name}`));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

export async function optimizeJournalUploadFile(file: File) {
  if (!file.type.startsWith('image/') || !canOptimizeJournalImage(file)) {
    return file;
  }

  const image = await loadImage(file);
  const needsResize = image.width > MAX_IMAGE_DIMENSION || image.height > MAX_IMAGE_DIMENSION;
  const needsCompression = file.size > IMAGE_COMPRESSION_THRESHOLD_BYTES;

  if (!needsResize && !needsCompression) {
    return file;
  }

  const resizeRatio = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
  );
  const width = Math.max(1, Math.round(image.width * resizeRatio));
  const height = Math.max(1, Math.round(image.height * resizeRatio));
  const outputType = getImageOutputType(file);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return file;

  if (outputType === 'image/jpeg') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }

  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, outputType, IMAGE_COMPRESSION_QUALITY);
  if (!blob) return file;

  if (blob.size >= file.size * 0.97 && !needsResize) {
    return file;
  }

  const nextExtension = outputType === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], replaceFileExtension(file.name, nextExtension), {
    type: outputType,
    lastModified: file.lastModified,
  });
}
