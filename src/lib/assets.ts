const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

// Official flat logos from the brand manual (v3): flat versions are the ones meant for the interface.
export const BRAND_LOGO_SRC = withBasePath("/brand/sophium-symbol-gold.png");
// Top-left logo on every screen (logged in and before login): realistic horizontal lockup supplied by the brand designer.
export const BRAND_LOGO_FULL_SRC = withBasePath("/brand/sophium-horizontal-realista.png");
export const BRAND_APP_ICON_SRC = withBasePath("/brand/app-icon.png");
export const BRAND_FAVICON_SRC = withBasePath("/brand/favicon.png");

export type BrandSymbolName = "sophium" | "nexum" | "agora";
export type BrandSymbolFinish = "gold" | "silver";

// Brand manual rule: silver while a section is at rest, gold when it is active or selected.
export function brandSymbolSrc(name: BrandSymbolName, finish: BrandSymbolFinish): string {
  return withBasePath(`/brand/${name}-symbol-${finish}.png`);
}
export const MENSA_ARGENTINA_LOGO_SRC = withBasePath("/logo-mensa-argentina.png");
