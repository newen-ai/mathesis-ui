import { BRAND_LOGO_FULL_SRC } from "@/lib/assets";

type BrandLockupProps = {
  // Size it with height classes (e.g. "h-10"); the width follows the lockup's proportions (about 2:1).
  className?: string;
};

// Sophium horizontal lockup (symbol + name), the logo shown top-left on every screen.
export function BrandLockup({ className = "h-10" }: BrandLockupProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={BRAND_LOGO_FULL_SRC}
      alt="Sophium"
      width={376}
      height={192}
      loading="eager"
      decoding="async"
      draggable={false}
      className={`w-auto max-w-none shrink-0 object-contain ${className}`}
    />
  );
}
