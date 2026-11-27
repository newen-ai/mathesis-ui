const HEIC_IMAGE_MIME_TYPES = new Set(["image/heic", "image/heif"]);

type Heic2AnyModule = (config: {
  blob: Blob;
  toType: string;
  quality?: number;
}) => Promise<Blob | Blob[]>;

function isHeicLikeBlob(blob: Blob): boolean {
  return HEIC_IMAGE_MIME_TYPES.has(blob.type);
}

export async function createRenderableImageUrlFromBlob(blob: Blob): Promise<string> {
  if (!isHeicLikeBlob(blob)) {
    return URL.createObjectURL(blob);
  }

  try {
    const heicModule = await import("heic2any");
    const convert = heicModule.default as Heic2AnyModule;
    const converted = await convert({
      blob,
      toType: "image/jpeg",
      quality: 0.92,
    });

    const normalizedBlob = Array.isArray(converted) ? converted[0] : converted;
    if (normalizedBlob instanceof Blob) {
      return URL.createObjectURL(normalizedBlob);
    }
  } catch {
    // Fall back to original blob URL when conversion is unavailable.
  }

  return URL.createObjectURL(blob);
}

export function revokeObjectUrls(urls: string[]) {
  urls.forEach((url) => {
    URL.revokeObjectURL(url);
  });
}
