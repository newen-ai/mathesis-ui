"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { extractUniqueUrlsFromText, fetchLinkPreview, type LinkPreviewData } from "@/lib/utils/link-preview";

type LinkPreviewListProps = {
  text: string;
  className?: string;
};

type CachedPreview = {
  data: LinkPreviewData;
  expiresAt: number;
};

const PREVIEW_CACHE_TTL_MS = 5 * 60 * 1000;
const previewCache = new Map<string, CachedPreview>();

function FallbackPreviewImage({ title }: { title: string }) {
  const letter = title.trim().charAt(0).toUpperCase() || "L";

  return (
    <div className="flex h-full min-h-[138px] w-full items-center justify-center bg-[linear-gradient(130deg,var(--brand-700),var(--navy-900))] text-[2.2rem] font-semibold text-[var(--brand-100)]">
      {letter}
    </div>
  );
}

function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  const subtitle = preview.description?.trim() || preview.hostname;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] transition hover:border-[var(--brand-700)] hover:bg-[var(--surface-2)]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="overflow-hidden border-b border-[var(--line)] bg-[var(--surface-2)]">
        {preview.imageUrl ? (
          <div className="relative h-[138px] w-full">
            <Image
              src={preview.imageUrl}
              alt={`Vista previa de ${preview.title}`}
              fill
              sizes="(max-width: 640px) 100vw, 460px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <FallbackPreviewImage title={preview.title} />
        )}
      </div>

      <div className="space-y-1 px-3 py-2.5">
        <p className="truncate text-scale-2 font-semibold text-[var(--heading-primary)]">{preview.title}</p>
        <p className="line-clamp-2 text-scale-1 text-[var(--text-secondary)]">{subtitle}</p>
      </div>
    </a>
  );
}

export function LinkPreviewList({ text, className }: LinkPreviewListProps) {
  const urls = useMemo(() => extractUniqueUrlsFromText(text, 3), [text]);
  const [previewByUrl, setPreviewByUrl] = useState<Record<string, LinkPreviewData | null>>({});

  useEffect(() => {
    if (urls.length === 0) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      const loaded = await Promise.all(
        urls.map(async (url) => {
          const cached = previewCache.get(url);
          if (cached && cached.expiresAt > Date.now()) {
            return [url, cached.data] as const;
          }

          const preview = await fetchLinkPreview(url, controller.signal);
          if (preview) {
            previewCache.set(url, {
              data: preview,
              expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS,
            });
          }
          return [url, preview] as const;
        })
      );

      if (!controller.signal.aborted) {
        setPreviewByUrl((current) => {
          const next = { ...current };
          loaded.forEach(([url, preview]) => {
            next[url] = preview;
          });
          return next;
        });
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [urls]);

  const previews = useMemo(
    () => urls.map((url) => previewByUrl[url]).filter((item): item is LinkPreviewData => Boolean(item)),
    [previewByUrl, urls]
  );

  if (previews.length === 0) {
    return null;
  }

  return (
    <div className={className ?? "mt-3 grid gap-2 sm:grid-cols-2"}>
      {previews.map((preview) => (
        <LinkPreviewCard key={preview.url} preview={preview} />
      ))}
    </div>
  );
}
