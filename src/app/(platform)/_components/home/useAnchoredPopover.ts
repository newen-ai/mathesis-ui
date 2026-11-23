import { useEffect, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

const GAP = 4;
const VIEWPORT_MARGIN = 8;

/**
 * Fixed-position style for a popup rendered in a portal next to `anchorRef`, so it is not clipped
 * by scrolling containers (the profile edit modal body scrolls). Opens below the anchor, or above
 * when there is not enough room, and follows the anchor on scroll and resize.
 */
export function useAnchoredPopover(
  anchorRef: RefObject<HTMLElement | null>,
  popupRef: RefObject<HTMLElement | null>,
  open: boolean,
  width: "anchor" | number = "anchor"
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const popupWidth = width === "anchor" ? rect.width : Math.min(width, window.innerWidth - VIEWPORT_MARGIN * 2);
      const popupHeight = popupRef.current?.offsetHeight ?? 0;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < popupHeight + GAP + VIEWPORT_MARGIN && rect.top > spaceBelow;
      const top = placeAbove ? Math.max(VIEWPORT_MARGIN, rect.top - popupHeight - GAP) : rect.bottom + GAP;
      const left = Math.min(Math.max(VIEWPORT_MARGIN, rect.left), window.innerWidth - popupWidth - VIEWPORT_MARGIN);
      setStyle({ position: "fixed", top, left, width: popupWidth });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, popupRef, open, width]);

  return style;
}

/** Calls `onDismiss` on a pointer press outside every given element while `open`. */
export function useDismissOnOutsidePress(
  refs: RefObject<HTMLElement | null>[],
  open: boolean,
  onDismiss: () => void
) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [refs, open, onDismiss]);
}
