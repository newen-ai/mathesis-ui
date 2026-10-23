const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

export const BRAND_LOGO_SRC = withBasePath("/sophium-logo.png");
export const BRAND_LOGO_FULL_SRC = withBasePath("/sophium-logo-full.png");
export const MENSA_ARGENTINA_LOGO_SRC = withBasePath("/logo-mensa-argentina.png");
