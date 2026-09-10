"use client";

import Image from "next/image";

type AteneoImageMosaicItem = {
  id: string;
  src: string;
  alt: string;
};

type AteneoImageMosaicProps = {
  images: AteneoImageMosaicItem[];
  onOpenImage: (index: number) => void;
  className?: string;
};

function Tile({
  image,
  index,
  onOpenImage,
  className,
  extraCount,
}: {
  image: AteneoImageMosaicItem;
  index: number;
  onOpenImage: (index: number) => void;
  className?: string;
  extraCount?: number;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpenImage(index)}
      className={[
        "group relative overflow-hidden rounded-lg bg-[var(--surface-2)]",
        className ?? "",
      ].join(" ")}
      aria-label={`Abrir imagen ${index + 1}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 768px) 100vw, 700px"
        className="object-cover object-center"
        unoptimized
      />

      {extraCount && extraCount > 0 ? (
        <span className="absolute inset-0 flex items-center justify-center bg-[color:color-mix(in_srgb,var(--navy-900)_64%,transparent)] text-[1.35rem] font-semibold text-white">
          +{extraCount}
        </span>
      ) : null}
    </button>
  );
}

export function AteneoImageMosaic({ images, onOpenImage, className }: AteneoImageMosaicProps) {
  if (images.length === 0) {
    return null;
  }

  const visible = images.slice(0, 4);
  const extraCount = Math.max(images.length - 4, 0);
  const heightClassName = "h-[220px] sm:h-[280px]";

  return (
    <div className={[
      "overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]",
      className ?? "",
    ].join(" ")}>
      {visible.length === 1 ? (
        <div className={["relative", heightClassName].join(" ")}>
          <Tile image={visible[0]} index={0} onOpenImage={onOpenImage} className="h-full w-full rounded-none" />
        </div>
      ) : null}

      {visible.length === 2 ? (
        <div className={["grid grid-cols-2 gap-0.5 bg-[var(--line)] p-0.5", heightClassName].join(" ")}>
          {visible.map((image, index) => (
            <Tile key={image.id} image={image} index={index} onOpenImage={onOpenImage} className="rounded-none" />
          ))}
        </div>
      ) : null}

      {visible.length === 3 ? (
        <div className={["grid grid-cols-2 grid-rows-2 gap-0.5 bg-[var(--line)] p-0.5", heightClassName].join(" ")}>
          <Tile image={visible[0]} index={0} onOpenImage={onOpenImage} className="row-span-2 rounded-none" />
          <Tile image={visible[1]} index={1} onOpenImage={onOpenImage} className="rounded-none" />
          <Tile image={visible[2]} index={2} onOpenImage={onOpenImage} className="rounded-none" />
        </div>
      ) : null}

      {visible.length >= 4 ? (
        <div className={["grid grid-cols-2 grid-rows-2 gap-0.5 bg-[var(--line)] p-0.5", heightClassName].join(" ")}>
          <Tile image={visible[0]} index={0} onOpenImage={onOpenImage} className="rounded-none" />
          <Tile image={visible[1]} index={1} onOpenImage={onOpenImage} className="rounded-none" />
          <Tile image={visible[2]} index={2} onOpenImage={onOpenImage} className="rounded-none" />
          <Tile
            image={visible[3]}
            index={3}
            onOpenImage={onOpenImage}
            className="rounded-none"
            extraCount={extraCount}
          />
        </div>
      ) : null}
    </div>
  );
}
