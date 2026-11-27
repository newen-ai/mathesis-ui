import Link from "next/link";
import { Fragment, useMemo } from "react";
import { parseLegalMarkdown, type LegalBlock, type LegalInline } from "@/lib/utils/legal-markdown";

type LegalMarkdownProps = {
  markdown: string;
  // The page shows the title itself (with the update date), so the "# Title" line is skipped by default.
  skipTitle?: boolean;
  // Inside the acceptance screen app links open in a new tab, so the screen is not left behind.
  openLinksInNewTab?: boolean;
};

function InlineContent({ tokens, openLinksInNewTab }: { tokens: LegalInline[]; openLinksInNewTab: boolean }) {
  return (
    <>
      {tokens.map((token, index) => {
        if (token.type === "bold") {
          return (
            <strong key={index} className="font-semibold text-[var(--text-primary)]">
              {token.text}
            </strong>
          );
        }

        if (token.type === "link") {
          const className = "sophium-link-accent font-semibold underline-offset-2 hover:underline";
          if (token.href.startsWith("/")) {
            return (
              <Link
                key={index}
                href={token.href}
                className={className}
                {...(openLinksInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {token.text}
              </Link>
            );
          }

          return (
            <a key={index} href={token.href} className={className} rel="noopener noreferrer">
              {token.text}
            </a>
          );
        }

        return <Fragment key={index}>{token.text}</Fragment>;
      })}
    </>
  );
}

function Block({ block, openLinksInNewTab }: { block: LegalBlock; openLinksInNewTab: boolean }) {
  if (block.type === "heading") {
    const content = <InlineContent tokens={block.content} openLinksInNewTab={openLinksInNewTab} />;
    if (block.level === 1) {
      return <h1 className="font-display text-scale-5 font-semibold leading-tight sophium-heading-primary">{content}</h1>;
    }
    if (block.level === 2) {
      return <h2 className="mt-7 font-display text-scale-4 font-semibold leading-snug sophium-heading-primary">{content}</h2>;
    }
    return <h3 className="mt-5 text-scale-3 font-semibold text-[var(--text-primary)]">{content}</h3>;
  }

  if (block.type === "list") {
    return (
      <ul className="mt-3 list-disc space-y-2 pl-5 text-scale-3 leading-relaxed text-[var(--text-secondary)] marker:text-[var(--brand-500)]">
        {block.items.map((item, index) => (
          <li key={index}>
            <InlineContent tokens={item} openLinksInNewTab={openLinksInNewTab} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p className="mt-3 text-scale-3 leading-relaxed text-[var(--text-secondary)]">
      <InlineContent tokens={block.content} openLinksInNewTab={openLinksInNewTab} />
    </p>
  );
}

export function LegalMarkdown({ markdown, skipTitle = true, openLinksInNewTab = false }: LegalMarkdownProps) {
  const blocks = useMemo(() => {
    const parsed = parseLegalMarkdown(markdown);
    return skipTitle && parsed[0]?.type === "heading" && parsed[0].level === 1 ? parsed.slice(1) : parsed;
  }, [markdown, skipTitle]);

  return (
    <div>
      {blocks.map((block, index) => (
        <Block key={index} block={block} openLinksInNewTab={openLinksInNewTab} />
      ))}
    </div>
  );
}
