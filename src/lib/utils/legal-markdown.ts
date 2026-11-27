// Minimal Markdown for the legal texts (backend legal/README.md): "#"/"##"/"###" headings, paragraphs, "- " lists,
// **bold**, [text](href) links and bare email addresses. Produces plain data that React renders as elements, so
// the text is never injected as HTML.

export type LegalInline =
  | { type: "text"; text: string }
  | { type: "bold"; text: string }
  | { type: "link"; text: string; href: string };

export type LegalBlock =
  | { type: "heading"; level: 1 | 2 | 3; content: LegalInline[] }
  | { type: "paragraph"; content: LegalInline[] }
  | { type: "list"; items: LegalInline[][] };

const INLINE_PATTERN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;

// Relative app paths, https and mailto only: anything else is shown as plain text.
function isSafeHref(href: string): boolean {
  return /^\/(?!\/)/.test(href) || /^https:\/\//i.test(href) || /^mailto:/i.test(href);
}

export function parseLegalInline(text: string): LegalInline[] {
  const tokens: LegalInline[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: "text", text: text.slice(lastIndex, index) });
    }

    const [, bold, linkText, linkHref, email] = match;
    if (bold !== undefined) {
      tokens.push({ type: "bold", text: bold });
    } else if (linkText !== undefined && linkHref !== undefined) {
      tokens.push(isSafeHref(linkHref) ? { type: "link", text: linkText, href: linkHref } : { type: "text", text: linkText });
    } else if (email !== undefined) {
      // A trailing dot belongs to the sentence, not to the address.
      const address = email.replace(/\.+$/, "");
      tokens.push({ type: "link", text: address, href: `mailto:${address}` });
      if (address.length < email.length) {
        tokens.push({ type: "text", text: email.slice(address.length) });
      }
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", text: text.slice(lastIndex) });
  }

  return tokens;
}

export function parseLegalMarkdown(markdown: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", content: parseLegalInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems.map(parseLegalInline) });
      listItems = [];
    }
  };

  for (const rawLine of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, content: parseLegalInline(heading[2]) });
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      flushParagraph();
      listItems.push(listItem[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
