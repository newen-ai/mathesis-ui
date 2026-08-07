const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

export const BRAND_LOGO_SRC = withBasePath("/mathesis-logo.png");
export const BRAND_LOGO_FULL_SRC = withBasePath("/mathesis-logo-full.png");
