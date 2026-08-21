export function PoweredByFooter() {
  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:color-mix(in_srgb,var(--line)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-sm"
      aria-label="Powered by Newen"
    >
      <p className="px-4 py-2 text-center text-[0.65rem] tracking-wide text-[var(--text-secondary)] md:py-2.5">
        Powered by <span className="font-semibold text-[var(--brand-700)]">Newen.Solutions</span>
      </p>
    </footer>
  );
}