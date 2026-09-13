type ProfileCollapsibleDescriptionProps = {
  text: string;
  isExpanded: boolean;
  onToggle: () => void;
};

export function ProfileCollapsibleDescription({
  text,
  isExpanded,
  onToggle,
}: ProfileCollapsibleDescriptionProps) {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return null;
  }

  const shouldShowToggle = normalizedText.length > 120 || normalizedText.includes("\n");

  return (
    <>
      <p
        className={`mt-2 max-w-full text-[0.64rem] leading-[1.5] text-[var(--text-secondary)] [overflow-wrap:anywhere] break-words ${
          isExpanded ? "whitespace-pre-wrap" : "whitespace-pre-line overflow-hidden"
        }`}
        style={
          !isExpanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {text}
      </p>
      {shouldShowToggle ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 text-[0.6rem] font-bold text-[var(--brand-700)] hover:text-[var(--brand-900)]"
        >
          {isExpanded ? "menos" : "más"}
        </button>
      ) : null}
    </>
  );
}