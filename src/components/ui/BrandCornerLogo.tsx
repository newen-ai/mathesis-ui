import Link from "next/link";
import { BrandLockup } from "@/components/ui/BrandLockup";

// The Sophium logo in the top-left corner, with the same box, padding and size as the logged-in top bar
// (TopBar.tsx: h-16 / md:h-[5.5rem] row, px-4 / md:px-6 / lg:px-8, link px-2 py-1). Place it inside a
// positioned element that starts at the page's top-left corner, and keep an empty spacer where the logo
// used to sit so the rest of the layout does not move.
export function BrandCornerLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute left-0 top-0 z-20 flex h-16 items-center px-4 md:h-[5.5rem] md:px-6 lg:px-8 ${className}`.trim()}>
      <Link href="/" className="sophium-nav-logo flex shrink-0 items-center px-2 py-1">
        <BrandLockup className="h-8 md:h-12 lg:h-14" />
      </Link>
    </div>
  );
}
