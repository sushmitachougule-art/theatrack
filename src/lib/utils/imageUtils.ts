// ============================================
// PawShield — Client-side Image Compression
// Reduces photo/certificate files before upload
// to Firebase Storage, saving costs and quota.
// ============================================

interface CompressOptions {
  maxWidthPx?: number; // default 800
  maxHeightPx?: number; // default 800
  quality?: number; // 0–1, default 0.75
  maxSizeBytes?: number; // default 300 KB
}

/**
 * Compress an image File using the browser Canvas API.
 * Returns the original file unchanged if it's already small
 * or if it's a PDF (Canvas cannot compress PDFs).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<File> {
  const {
    maxWidthPx = 800,
    maxHeightPx = 800,
    quality = 0.75,
    maxSizeBytes = 300 * 1024, // 300 KB
  } = options;

  // Don't compress PDFs or non-image files
  if (!file.type.startsWith("image/")) return file;

  // Already small enough
  if (file.size <= maxSizeBytes) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down proportionally
      if (width > maxWidthPx || height > maxHeightPx) {
        const ratio = Math.min(maxWidthPx / width, maxHeightPx / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          // If compression made it bigger somehow, keep original
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}
