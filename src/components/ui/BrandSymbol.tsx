import { brandSymbolSrc, type BrandSymbolFinish, type BrandSymbolName } from "@/lib/assets";

type BrandSymbolProps = {
  name: BrandSymbolName;
  finish?: BrandSymbolFinish;
  // Size it with height classes (e.g. "h-6"); the width follows the symbol's own proportions.
  className?: string;
  // Decorative by default: the section or brand name is always written next to the symbol.
  alt?: string;
};

export function BrandSymbol({ name, finish = "gold", className = "h-6", alt = "" }: BrandSymbolProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brandSymbolSrc(name, finish)}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      draggable={false}
      className={`inline-block w-auto shrink-0 object-contain ${className}`}
    />
  );
}
