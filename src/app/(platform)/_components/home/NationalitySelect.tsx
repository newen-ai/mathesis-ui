import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { withBasePath } from "@/lib/assets";
import { getCountryOptions, normalizeCountrySearch, resolveCountryCode } from "../../_lib/countries";
import { useAnchoredPopover, useDismissOnOutsidePress } from "./useAnchoredPopover";

type NationalitySelectProps = {
  value: string;
  onChange: (countryCode: string) => void;
  id?: string;
};

type Option = { value: string; label: string; flagCode: string | null };

/** Keys typed within this window extend the search ("a", "r", "g" → "arg") instead of restarting it. */
export const TYPEAHEAD_RESET_MS = 700;

function Flag({ code }: { code: string | null }) {
  if (!code) return <span className="inline-block h-[0.9rem] w-[1.2rem] shrink-0" aria-hidden="true" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={withBasePath(`/flags/${code.toLowerCase()}.svg`)}
      alt=""
      aria-hidden="true"
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className="h-[0.9rem] w-[1.2rem] shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_var(--line)]"
    />
  );
}

/**
 * Country select with flags. A native `<select>` cannot show images, so this is a listbox that
 * keeps native-like keyboard behavior: consecutive keys narrow the search to the first country
 * starting with them, arrows/Home/End move, Enter selects, Escape closes.
 */
export function NationalitySelect({ value, onChange, id }: NationalitySelectProps) {
  const { t, i18n } = useTranslation("profile");
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const typeahead = useRef({ buffer: "", timer: 0 as ReturnType<typeof setTimeout> | 0 });

  const resolvedCode = resolveCountryCode(value);
  // A free-text value from before the select existed that matches no country: keep it visible
  // (and selected) so opening the form does not silently erase it.
  const legacyValue = value.trim() && !resolvedCode ? value.trim() : null;

  const options = useMemo<Option[]>(() => {
    const countries = getCountryOptions(i18n.language).map((option) => ({
      value: option.code,
      label: option.label,
      flagCode: option.code,
    }));
    return legacyValue ? [{ value: legacyValue, label: legacyValue, flagCode: null }, ...countries] : countries;
  }, [i18n.language, legacyValue]);

  const selectedValue = resolvedCode ?? legacyValue ?? "";
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const close = useCallback(() => setOpen(false), []);
  const popupStyle = useAnchoredPopover(triggerRef, popupRef, open);
  useDismissOnOutsidePress([triggerRef, popupRef], open, close);

  useEffect(() => {
    if (open && activeIndex >= 0) optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [open, activeIndex]);

  useEffect(() => () => {
    if (typeahead.current.timer) clearTimeout(typeahead.current.timer);
  }, []);

  const openList = (index = selectedIndex) => {
    setActiveIndex(index >= 0 ? index : 0);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const runTypeahead = (key: string) => {
    const state = typeahead.current;
    if (state.timer) clearTimeout(state.timer);
    state.buffer += key;
    state.timer = setTimeout(() => {
      state.buffer = "";
    }, TYPEAHEAD_RESET_MS);

    const query = normalizeCountrySearch(state.buffer);
    const match = options.findIndex((option) => normalizeCountrySearch(option.label).startsWith(query));
    if (match >= 0) openList(match);
    else if (!open) openList();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((index) => Math.min(last, index + 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else setActiveIndex((index) => Math.max(0, index - 1));
        return;
      case "Home":
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(event.key === "Home" ? 0 : last);
        return;
      case "PageDown":
      case "PageUp":
        if (!open) return;
        event.preventDefault();
        setActiveIndex((index) => Math.min(last, Math.max(0, index + (event.key === "PageDown" ? 10 : -10))));
        return;
      case "Enter":
      case " ":
        // Space extends an ongoing search ("Costa Rica"); otherwise it toggles like Enter.
        if (event.key === " " && typeahead.current.buffer) {
          event.preventDefault();
          runTypeahead(" ");
          return;
        }
        event.preventDefault();
        if (open) choose(activeIndex);
        else openList();
        return;
      case "Escape":
        if (!open) return;
        // Consumed here so the profile edit modal does not close too.
        event.preventDefault();
        setOpen(false);
        return;
      case "Tab":
        if (open) choose(activeIndex);
        return;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          runTypeahead(event.key);
        }
    }
  };

  const activeId = open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined;

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="sophium-select-trigger"
      >
        {selected ? (
          <>
            <Flag code={selected.flagCode} />
            <span className="min-w-0 flex-1 truncate text-left">{selected.label}</span>
          </>
        ) : (
          <span className="min-w-0 flex-1 truncate text-left text-[var(--text-soft)]">
            {t("profileForm.placeholders.nationality")}
          </span>
        )}
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-[var(--text-soft)]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open
        ? createPortal(
            <ul
              ref={popupRef}
              id={listboxId}
              role="listbox"
              aria-label={t("profileForm.fields.nationality")}
              style={popupStyle}
              className="sophium-select-popup z-[140] max-h-72 overflow-y-auto py-1"
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  ref={(element) => {
                    optionRefs.current[index] = element;
                  }}
                  id={`${listboxId}-${index}`}
                  role="option"
                  aria-selected={option.value === selectedValue}
                  data-active={index === activeIndex || undefined}
                  onPointerMove={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className="sophium-select-option"
                >
                  <Flag code={option.flagCode} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                </li>
              ))}
            </ul>,
            document.body
          )
        : null}
    </>
  );
}
