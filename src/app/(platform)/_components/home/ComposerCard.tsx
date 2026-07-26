import { FormEvent, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";

type ComposerCardProps = {
  initials: string;
  onPublish: (content: string) => void;
};

export function ComposerCard({ initials, onPublish }: ComposerCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    onPublish(trimmed);
    setContent("");
    setIsOpen(false);
  };

  return (
    <AppCard className="rounded-none border-x-0 p-4 md:rounded-2xl md:border-x">
      <form onSubmit={onSubmit}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--navy-900)] text-lg font-bold text-[var(--brand-500)]">
            {initials || "ME"}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="linkedin-composer-trigger w-full rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2.5 text-left text-lg font-medium text-[var(--text-secondary)]"
          >
            ¿Que queres compartir con la comunidad?
          </button>
        </div>

        {isOpen && (
          <>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              autoFocus
              placeholder="Escribe tu publicacion..."
              className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="submit"
                className="rounded-full bg-[var(--brand-500)] px-4 py-2 text-xs font-semibold text-[var(--navy-900)] transition hover:brightness-95"
              >
                Publicar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setContent("");
                }}
                className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </form>
    </AppCard>
  );
}
