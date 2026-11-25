"use client";

import Link from "next/link";
import { useCallback, useEffect, useEffectEvent, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AppCard } from "@/components/ui/AppCard";
import {
  getVerbumErrorCode,
  getVerbumPuzzle,
  isVerbumSessionExpired,
  submitVerbumGuess,
  type VerbumPuzzleState
} from "@/lib/api/verbum";
import { withBasePath } from "@/lib/assets";
import {
  VERBUM_HOME_PATH,
  buildVerbumKeyboardStates,
  buildVerbumShareText,
  buildWhatsAppShareUrl,
  formatCountdown,
  formatVerbumDate,
  normalizeVerbumInput,
  verbumPuzzlePath
} from "@/lib/utils/verbum";
import { VerbumDialog } from "./VerbumDialog";
import { VerbumCalendarContent, VerbumHelpContent, VerbumStatsContent } from "./VerbumPanels";
import { VerbumBoard, VerbumKeyboard, verbumRevealDurationMs } from "./VerbumTiles";
import { initialVerbumPlayState, isVerbumFinished, verbumPlayReducer } from "./verbumPlayReducer";
import { useEndExpiredSession, useVerbumRequest } from "./useVerbumRequest";

const HELP_SEEN_STORAGE_KEY = "sophium-verbum-help-seen";
const MESSAGE_DURATION_MS = 1800;
// Pause between the end of the last flip and scrolling the result panel into view.
const RESULT_SCROLL_DELAY_MS = 450;

type DialogKind = "help" | "stats" | "calendar";

const subscribeToNothing = () => () => undefined;

function HeaderButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--heading-primary)]"
    >
      {children}
    </button>
  );
}

function Countdown({ target, onReached }: { target: string; onReached: () => void }) {
  const { t } = useTranslation("games");
  const [now, setNow] = useState(() => Date.now());
  const msLeft = new Date(target).getTime() - now;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (msLeft <= 0) {
    return (
      <button type="button" onClick={onReached} className="font-semibold text-[var(--link-accent)] hover:underline">
        {t("verbum.result.newAvailable")}
      </button>
    );
  }

  return (
    <p className="text-scale-2 text-[var(--text-secondary)]">
      {t("verbum.result.nextIn")}{" "}
      <span className="font-mono font-semibold tabular-nums text-[var(--heading-primary)]">{formatCountdown(msLeft)}</span>
    </p>
  );
}

function VerbumResult({ state, onReload }: { state: VerbumPuzzleState; onReload: () => void }) {
  const { t } = useTranslation("games");
  const canNativeShare = useSyncExternalStore(
    subscribeToNothing,
    () => typeof navigator.share === "function",
    () => false
  );
  const solution = state.solution;

  const shareText = useMemo(() => {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return buildVerbumShareText(state, `${origin}${withBasePath(verbumPuzzlePath(state.puzzle.date))}`);
  }, [state]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(t("verbum.result.copied"));
    } catch {
      toast.error(t("verbum.result.copyFailed"));
    }
  };

  const onNativeShare = async () => {
    try {
      await navigator.share({ text: shareText });
    } catch {
      // The user closed the share sheet; nothing to do.
    }
  };

  if (!solution) {
    return null;
  }

  const won = state.play.status === "WON";

  return (
    <AppCard className="mx-auto w-full max-w-xl p-5 sm:p-6">
      <div className="text-center">
        <h2 className="font-display text-scale-5 font-semibold text-[var(--heading-primary)]">
          {won ? t("verbum.result.wonTitle") : t("verbum.result.lostTitle")}
        </h2>
        <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
          {won ? t("verbum.result.wonSubtitle", { count: state.play.attemptsUsed }) : t("verbum.result.lostSubtitle")}
        </p>
        <p className="mt-3 font-display text-[2rem] font-bold tracking-[0.2em] text-[var(--heading-primary)]">{solution.word}</p>
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--surface-2)] p-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-700)]">{t("verbum.result.whyTitle")}</h3>
        <p className="mt-1.5 text-scale-2 leading-relaxed text-[var(--text-primary)]">{solution.context}</p>
        {solution.readMoreUrl ? (
          <a
            href={solution.readMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-scale-2 font-semibold text-[var(--link-accent)] hover:underline"
          >
            {t("verbum.result.readMore")}
            {solution.readMoreLabel ? ` · ${solution.readMoreLabel}` : ""} →
          </a>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <a
          href={buildWhatsAppShareUrl(shareText)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "var(--verbum-correct)", color: "var(--verbum-on-tile)" }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
          </svg>
          {t("verbum.result.shareWhatsApp")}
        </a>
        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void onNativeShare()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-500)] px-4 py-2.5 text-sm font-semibold text-[var(--on-brand)]"
          >
            {t("verbum.result.share")}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void onCopy()}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          {t("verbum.result.copy")}
        </button>
      </div>

      <div className="mt-4 border-t border-[var(--line)] pt-3 text-center">
        {state.puzzle.isToday ? (
          <Countdown target={state.nextPuzzleAt} onReached={onReload} />
        ) : (
          <div className="space-y-1.5">
            {!state.play.finishedOnPuzzleDay ? (
              <p className="text-xs text-[var(--text-secondary)]">{t("verbum.result.archiveNote")}</p>
            ) : null}
            <Link href={VERBUM_HOME_PATH} className="text-scale-2 font-semibold text-[var(--link-accent)] hover:underline">
              {t("verbum.backToToday")} →
            </Link>
          </div>
        )}
      </div>
    </AppCard>
  );
}

export function VerbumGame({ date }: { date: string | null }) {
  const { t } = useTranslation("games");
  const [play, dispatch] = useReducer(verbumPlayReducer, initialVerbumPlayState);
  const {
    data: state,
    setData: setState,
    errorCode: loadErrorCode,
    isLoading,
    reload
  } = useVerbumRequest(date ?? "today", async (signal) => {
    const response = await getVerbumPuzzle(date, signal);
    dispatch({ type: "loaded", puzzle: response.data });
    return response.data;
  });
  const [shakeKey, setShakeKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const timers = useRef(new Set<number>());
  const messageTimer = useRef<number | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const endExpiredSession = useEndExpiredSession();

  // Every timeout goes through here so none fires after the page is gone.
  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      callback();
    }, delayMs);
    timers.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    // First visit: show how to play once. Deferred so the first paint matches the server render.
    const timer = window.setTimeout(() => {
      if (window.localStorage.getItem(HELP_SEEN_STORAGE_KEY) !== "1") {
        window.localStorage.setItem(HELP_SEEN_STORAGE_KEY, "1");
        setDialog("help");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const showMessage = useCallback(
    (text: string, shake = true) => {
      setMessage(text);
      if (shake) {
        setShakeKey((value) => value + 1);
      }
      if (messageTimer.current) window.clearTimeout(messageTimer.current);
      messageTimer.current = schedule(() => setMessage(null), MESSAGE_DURATION_MS);
    },
    [schedule]
  );

  const submit = async () => {
    if (!state) return;

    const length = state.puzzle.length;
    if (Array.from(play.input).length < length) {
      showMessage(t("verbum.errors.wrongLength", { count: length }));
      return;
    }

    dispatch({ type: "submitStarted" });
    try {
      const response = await submitVerbumGuess(state.puzzle.date, play.input);
      const next = response.data;
      setState(next);
      dispatch({ type: "revealStarted", next });
      schedule(() => {
        dispatch({ type: "revealEnded", next });
        if (isVerbumFinished(next)) {
          schedule(
            () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
            RESULT_SCROLL_DELAY_MS
          );
        }
      }, verbumRevealDurationMs(length));
    } catch (error) {
      dispatch({ type: "submitFailed" });
      const code = getVerbumErrorCode(error);
      if (isVerbumSessionExpired(error)) {
        void endExpiredSession();
      } else if (code === "VERBUM_NOT_A_WORD") {
        showMessage(t("verbum.errors.notAWord"));
      } else if (code === "VERBUM_WRONG_LENGTH") {
        showMessage(t("verbum.errors.wrongLength", { count: length }));
      } else if (code === "VERBUM_ALREADY_FINISHED" || code === "VERBUM_CONCURRENT_GUESS") {
        showMessage(t("verbum.errors.alreadyFinished"), false);
        reload();
      } else {
        showMessage(t("verbum.errors.submit"), false);
      }
    }
  };

  const isFinished = isVerbumFinished(state);
  const isLocked = !state || isFinished || play.phase !== "idle";

  const handleKey = (key: string) => {
    if (isLocked) return;

    if (key === "ENTER") {
      void submit();
    } else if (key === "BACKSPACE") {
      dispatch({ type: "erased" });
    } else {
      const letter = normalizeVerbumInput(key);
      if (letter.length === 1) {
        dispatch({ type: "typed", letter, maxLength: state.puzzle.length });
      }
    }
  };

  const onPhysicalKey = useEffectEvent((event: KeyboardEvent) => {
    if (dialog || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;

    if (event.key === "Enter") {
      event.preventDefault();
      handleKey("ENTER");
    } else if (event.key === "Backspace") {
      event.preventDefault();
      handleKey("BACKSPACE");
    } else if (event.key.length === 1 && /\p{L}/u.test(event.key)) {
      handleKey(event.key);
    }
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onPhysicalKey(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const keyStates = useMemo(() => buildVerbumKeyboardStates(play.keyboardSource), [play.keyboardSource]);
  const closeDialog = useCallback(() => setDialog(null), []);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--brand-700)]">{t("verbum.tagline")}</p>
          <h1 className="font-display text-[1.9rem] font-semibold leading-tight text-[var(--heading-primary)]">{t("verbum.title")}</h1>
          {state ? (
            <p className="flex flex-wrap items-center gap-2 text-scale-2 text-[var(--text-secondary)]">
              {t("verbum.puzzleLabel", { number: state.puzzle.number, date: formatVerbumDate(state.puzzle.date) })}
              {!state.puzzle.isToday ? (
                <span className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-[var(--brand-700)]">
                  {t("verbum.archiveBadge")}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <HeaderButton label={t("verbum.actions.help")} onClick={() => setDialog("help")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.9v.3" />
              <path d="M12 17h.01" />
            </svg>
          </HeaderButton>
          <HeaderButton label={t("verbum.actions.calendar")} onClick={() => setDialog("calendar")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M8 3v4M16 3v4M4 10h16" />
            </svg>
          </HeaderButton>
          <HeaderButton label={t("verbum.actions.stats")} onClick={() => setDialog("stats")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M5 20V11M12 20V5M19 20v-6" />
            </svg>
          </HeaderButton>
        </div>
      </header>

      {isLoading && !state ? (
        <p className="py-16 text-center text-scale-2 text-[var(--text-secondary)]">{t("verbum.loading")}</p>
      ) : loadErrorCode ? (
        <AppCard className="p-6 text-center">
          <p className="text-scale-2 text-[var(--text-primary)]">
            {loadErrorCode === "VERBUM_PUZZLE_NOT_AVAILABLE" ? t("verbum.errors.notAvailable") : t("verbum.errors.load")}
          </p>
          <div className="mt-3 flex justify-center gap-4">
            {loadErrorCode === "VERBUM_PUZZLE_NOT_AVAILABLE" ? (
              <Link href={VERBUM_HOME_PATH} className="font-semibold text-[var(--link-accent)] hover:underline">
                {t("verbum.backToToday")} →
              </Link>
            ) : (
              <button type="button" onClick={reload} className="font-semibold text-[var(--link-accent)] hover:underline">
                {t("verbum.errors.retry")}
              </button>
            )}
          </div>
        </AppCard>
      ) : state ? (
        <>
          <div className="relative">
            <div
              aria-live="polite"
              className={`pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[var(--navy-900)] px-3 py-2 text-sm font-semibold text-white shadow-lg transition-opacity ${
                message ? "opacity-100" : "opacity-0"
              }`}
            >
              {message ?? ""}
            </div>
            <VerbumBoard
              length={state.puzzle.length}
              maxAttempts={state.puzzle.maxAttempts}
              guesses={state.play.guesses}
              input={play.input}
              revealRow={play.revealRow}
              winRow={play.winRow}
              shakeKey={shakeKey}
            />
          </div>

          {isFinished && play.phase !== "revealing" ? (
            <div ref={resultRef}>
              <VerbumResult state={state} onReload={reload} />
            </div>
          ) : (
            <VerbumKeyboard
              keyStates={keyStates}
              disabled={isLocked}
              enterLabel={t("verbum.keyboard.enter")}
              deleteLabel={t("verbum.keyboard.delete")}
              onKey={handleKey}
            />
          )}
        </>
      ) : null}

      {dialog === "help" ? (
        <VerbumDialog title={t("verbum.help.title")} closeLabel={t("verbum.actions.close")} onClose={closeDialog}>
          <VerbumHelpContent />
        </VerbumDialog>
      ) : null}
      {dialog === "stats" ? (
        <VerbumDialog title={t("verbum.stats.title")} closeLabel={t("verbum.actions.close")} onClose={closeDialog}>
          <VerbumStatsContent highlightAttempts={state?.play.status === "WON" ? state.play.attemptsUsed : null} />
        </VerbumDialog>
      ) : null}
      {dialog === "calendar" ? (
        <VerbumDialog title={t("verbum.calendar.title")} closeLabel={t("verbum.actions.close")} onClose={closeDialog}>
          <VerbumCalendarContent currentDate={state?.puzzle.date ?? date ?? ""} onNavigate={closeDialog} />
        </VerbumDialog>
      ) : null}
    </div>
  );
}
