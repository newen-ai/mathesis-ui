import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PdfAttachmentCard } from "./PdfAttachmentCard";

describe("PdfAttachmentCard", () => {
  it("links published PDFs with name, size and the PDF icon", () => {
    render(<PdfAttachmentCard fileName="paper.pdf" sizeBytes={2.4 * 1024 * 1024} href="https://api/x.pdf" openLabel="Abrir PDF" />);

    const link = screen.getByRole("link", { name: /paper\.pdf/ });
    expect(link).toHaveAttribute("href", "https://api/x.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveTextContent("2,4 MB");
    expect(link).toHaveTextContent("Abrir PDF");
    expect(link.querySelector("svg text")).toHaveTextContent("PDF");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows the thumbnail, page count and remove action for local files", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onRemove = vi.fn();
    const { container } = render(
      <PdfAttachmentCard
        fileName="apunte.pdf"
        sizeBytes={50 * 1024}
        pageCount={3}
        thumbnailUrl="blob:thumb"
        onOpen={onOpen}
        openLabel="Ver PDF"
        pagesLabel={(count) => `${count} págs.`}
        onRemove={onRemove}
        removeLabel="Quitar apunte.pdf"
      />
    );

    expect(container.querySelector("img")).toHaveAttribute("src", "blob:thumb");
    expect(screen.getByRole("button", { name: /^apunte\.pdf/ })).toHaveTextContent("3 págs. · 50 KB");

    await user.click(screen.getByRole("button", { name: /^apunte\.pdf/ }));
    await user.click(screen.getByRole("button", { name: "Quitar apunte.pdf" }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("pulses the icon while the thumbnail is loading", () => {
    const { container } = render(<PdfAttachmentCard fileName="a.pdf" sizeBytes={1024} isLoadingThumbnail openLabel="Ver PDF" />);
    expect(container.querySelector("svg")).toHaveClass("animate-pulse");
  });
});
