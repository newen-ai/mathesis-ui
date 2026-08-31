import { buildLinkifiedSegments } from "@/lib/utils/link-preview";

type LinkifiedTextProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export function LinkifiedText({ text, className, linkClassName }: LinkifiedTextProps) {
  const segments = buildLinkifiedSegments(text);

  return (
    <p className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "link") {
          return (
            <a
              key={`link-${segment.href}-${index}`}
              href={segment.href}
              target="_blank"
              rel="noreferrer"
              className={linkClassName ?? "mathesis-link-accent underline underline-offset-2"}
              onClick={(event) => event.stopPropagation()}
            >
              {segment.value}
            </a>
          );
        }

        return <span key={`text-${index}`}>{segment.value}</span>;
      })}
    </p>
  );
}
