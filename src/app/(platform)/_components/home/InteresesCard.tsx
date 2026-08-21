import { useMemo, useRef, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { searchInterestSuggestions } from "@/lib/api/profile";
import type { Profile } from "../../_lib/types";

type InteresesCardProps = {
  profile: Profile;
  canEdit: boolean;
  isEditingMode: boolean;
  onStartEditing: () => void;
  onCloseEditing: () => void;
  isSaving: boolean;
  saveError: string | null;
  onSave: (profile: Profile) => Promise<{ ok: boolean; message?: string }>;
  onClearSaveError: () => void;
};

function normalizeInterest(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function uniqueInterests(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeInterest(value);
    if (!normalized) {
      return;
    }

    const dedupeKey = normalized.toLocaleLowerCase();
    if (seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    result.push(dedupeKey);
  });

  return result;
}

export function InteresesCard({
  profile,
  canEdit,
  isEditingMode,
  onStartEditing,
  onCloseEditing,
  isSaving,
  saveError,
  onSave,
  onClearSaveError,
}: InteresesCardProps) {
  const [workingInterests, setWorkingInterests] = useState<string[]>(profile.intereses);
  const [draftInterest, setDraftInterest] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(0);
  const [suggestionOptions, setSuggestionOptions] = useState<string[]>([]);
  const [draggedInterest, setDraggedInterest] = useState<string | null>(null);
  const [dragOverInterest, setDragOverInterest] = useState<string | null>(null);

  const suggestionTimeoutRef = useRef<number | null>(null);
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);

  const hasChanges = useMemo(() => {
    if (profile.intereses.length !== workingInterests.length) {
      return true;
    }

    return profile.intereses.some((value, index) => value !== workingInterests[index]);
  }, [profile.intereses, workingInterests]);

  const draftNormalized = normalizeInterest(draftInterest);

  const resetSuggestionFetch = () => {
    if (suggestionTimeoutRef.current !== null) {
      window.clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = null;
    }

    if (suggestionsAbortControllerRef.current) {
      suggestionsAbortControllerRef.current.abort();
      suggestionsAbortControllerRef.current = null;
    }
  };

  const scheduleSuggestionsFetch = (value: string, interestsSource: string[]) => {
    const normalized = normalizeInterest(value);
    resetSuggestionFetch();

    if (normalized.length < 3) {
      setSuggestionOptions([]);
      setIsSuggestionsLoading(false);
      return;
    }

    setIsSuggestionsLoading(true);

    suggestionTimeoutRef.current = window.setTimeout(() => {
      const controller = new AbortController();
      suggestionsAbortControllerRef.current = controller;

      void searchInterestSuggestions(normalized, controller.signal)
        .then((result) => {
          const currentInterests = new Set(
            interestsSource.map((item) => item.toLocaleLowerCase())
          );

          const nextOptions = (result.data ?? [])
            .map((item) => normalizeInterest(item.value))
            .filter((item) => item.length > 0)
            .filter((item) => !currentInterests.has(item.toLocaleLowerCase()))
            .slice(0, 8);

          setSuggestionOptions(nextOptions);
          setHighlightedSuggestionIndex(0);
        })
        .catch((error: unknown) => {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          setSuggestionOptions([]);
        })
        .finally(() => {
          setIsSuggestionsLoading(false);
          suggestionsAbortControllerRef.current = null;
        });
    }, 180);
  };

  const onAddInterest = () => {
    const normalized = normalizeInterest(draftInterest);
    if (!normalized) {
      setDraftError("Ingresa un interés válido antes de agregarlo.");
      return;
    }

    const exists = workingInterests.some(
      (item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase()
    );
    if (exists) {
      setDraftError("Ese interés ya está agregado.");
      return;
    }

    const nextInterests = [...workingInterests, normalized];
    setWorkingInterests(nextInterests);
    setDraftInterest("");
    setDraftError(null);
    setSuggestionOptions([]);
    setIsSuggestionsOpen(false);
    setHighlightedSuggestionIndex(0);
    setIsSuggestionsLoading(false);
    resetSuggestionFetch();
  };

  const onSelectSuggestion = (value: string) => {
    const normalized = normalizeInterest(value);
    const exists = workingInterests.some(
      (item) => item.toLocaleLowerCase() === normalized.toLocaleLowerCase()
    );
    if (exists) {
      return;
    }

    const nextInterests = [...workingInterests, normalized];
    setWorkingInterests(nextInterests);
    setDraftInterest("");
    setDraftError(null);
    setSuggestionOptions([]);
    setIsSuggestionsOpen(false);
    setHighlightedSuggestionIndex(0);
    setIsSuggestionsLoading(false);
    resetSuggestionFetch();
  };

  const onRemoveInterest = (interest: string) => {
    const nextInterests = workingInterests.filter((item) => item !== interest);
    setWorkingInterests(nextInterests);
    setDraftError(null);
    if (draggedInterest === interest) {
      setDraggedInterest(null);
    }
    if (dragOverInterest === interest) {
      setDragOverInterest(null);
    }

    if (draftNormalized.length >= 3) {
      scheduleSuggestionsFetch(draftNormalized, nextInterests);
    }
  };

  const onDropInterest = (targetInterest: string) => {
    if (!draggedInterest || draggedInterest === targetInterest) {
      return;
    }

    setWorkingInterests((current) => {
      const fromIndex = current.indexOf(draggedInterest);
      const toIndex = current.indexOf(targetInterest);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    setDraggedInterest(null);
    setDragOverInterest(null);
  };

  const onDiscard = () => {
    setWorkingInterests(profile.intereses);
    setDraftInterest("");
    setDraftError(null);
    setSuggestionOptions([]);
    setIsSuggestionsOpen(false);
    setHighlightedSuggestionIndex(0);
    setIsSuggestionsLoading(false);
    setDraggedInterest(null);
    setDragOverInterest(null);
    onClearSaveError();
    resetSuggestionFetch();
    onCloseEditing();
  };

  const onSaveAll = async () => {
    const nextInterests = uniqueInterests(workingInterests);

    const result = await onSave({
      ...profile,
      intereses: nextInterests,
    });

    if (!result.ok) {
      return;
    }

    setDraftError(null);
    setSuggestionOptions([]);
    setIsSuggestionsOpen(false);
    setHighlightedSuggestionIndex(0);
    setIsSuggestionsLoading(false);
    setDraggedInterest(null);
    setDragOverInterest(null);
    resetSuggestionFetch();
    onCloseEditing();
  };

  const onEnterEdit = () => {
    setWorkingInterests(profile.intereses);
    setDraftInterest("");
    setDraftError(null);
    setSuggestionOptions([]);
    setIsSuggestionsOpen(false);
    setHighlightedSuggestionIndex(0);
    setIsSuggestionsLoading(false);
    setDraggedInterest(null);
    setDragOverInterest(null);
    onClearSaveError();
    resetSuggestionFetch();
    onStartEditing();
  };

  return (
    <AppCard className="px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] pb-2">
        <h2 className="font-[family-name:var(--font-spectral)] text-[0.85rem] font-bold text-[var(--navy-900)]">
          Intereses
        </h2>
        {canEdit && !isEditingMode ? (
          <button
            type="button"
            onClick={onEnterEdit}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-3 py-1 text-[0.62rem] font-semibold text-[var(--brand-700)] transition hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden="true">✎</span>
            Editar
          </button>
        ) : null}
      </div>

      {canEdit && isEditingMode ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="relative w-full">
              <input
                value={draftInterest}
                onChange={(event) => {
                  const value = event.target.value;
                  const normalized = normalizeInterest(value);

                  setDraftInterest(value);
                  setIsSuggestionsOpen(normalized.length >= 3);
                  setHighlightedSuggestionIndex(0);

                  if (draftError) {
                    setDraftError(null);
                  }

                  scheduleSuggestionsFetch(value, workingInterests);
                }}
                onFocus={() => {
                  if (draftNormalized.length >= 3) {
                    setIsSuggestionsOpen(true);
                    scheduleSuggestionsFetch(draftNormalized, workingInterests);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setIsSuggestionsOpen(false);
                  }, 120);
                }}
                onKeyDown={(event) => {
                  if (!isSuggestionsOpen || suggestionOptions.length === 0) {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onAddInterest();
                    }
                    return;
                  }

                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setHighlightedSuggestionIndex((current) =>
                      Math.min(current + 1, suggestionOptions.length - 1)
                    );
                    return;
                  }

                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setHighlightedSuggestionIndex((current) => Math.max(current - 1, 0));
                    return;
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    setIsSuggestionsOpen(false);
                    return;
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                    onSelectSuggestion(
                      suggestionOptions[highlightedSuggestionIndex] ?? suggestionOptions[0]
                    );
                  }
                }}
                placeholder="Agregar interés"
                className="w-full rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-500)] focus:ring-2 focus:ring-[var(--brand-200)]"
              />

              {isSuggestionsOpen && suggestionOptions.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-lg">
                  {suggestionOptions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onSelectSuggestion(suggestion);
                      }}
                      onMouseEnter={() => setHighlightedSuggestionIndex(index)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                        index === highlightedSuggestionIndex
                          ? "bg-[var(--surface-2)] text-[var(--text-primary)]"
                          : "bg-[var(--surface)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span>{suggestion}</span>
                      <span className="text-xs text-[var(--text-soft)]">sugerencia</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {isSuggestionsOpen && draftNormalized.length >= 3 && isSuggestionsLoading ? (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)] shadow-lg">
                  Buscando sugerencias...
                </div>
              ) : null}

              {isSuggestionsOpen &&
              draftNormalized.length >= 3 &&
              suggestionOptions.length === 0 &&
              !isSuggestionsLoading ? (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)] shadow-lg">
                  No hay sugerencias para este texto.
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={onAddInterest}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--brand-500)] bg-[var(--brand-50)] px-4 py-2 text-sm font-semibold text-[var(--brand-700)] transition hover:bg-[var(--brand-100)]"
            >
              Agregar
            </button>
          </div>

          <p className="text-[0.65rem] text-[var(--text-soft)]">
            Escribe al menos 3 caracteres para ver sugerencias.
          </p>
          <p className="text-[0.65rem] text-[var(--text-soft)]">
            Arrastra y suelta los intereses para reordenarlos.
          </p>

          {workingInterests.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {workingInterests.map((interest) => (
                <span
                  key={interest}
                  draggable
                  onDragStart={() => {
                    setDraggedInterest(interest);
                    setDragOverInterest(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggedInterest && draggedInterest !== interest) {
                      setDragOverInterest(interest);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    onDropInterest(interest);
                  }}
                  onDragEnd={() => {
                    setDraggedInterest(null);
                    setDragOverInterest(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-[0.32rem] text-[0.64rem] font-semibold text-[var(--brand-700)] ${
                    draggedInterest === interest
                      ? "cursor-grabbing border-[var(--brand-500)] bg-[var(--brand-100)]"
                      : "cursor-grab border-[var(--line-strong)] bg-[var(--brand-50)]"
                  } ${
                    dragOverInterest === interest
                      ? "ring-2 ring-[var(--brand-300)] ring-offset-1"
                      : ""
                  }`}
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => onRemoveInterest(interest)}
                    className="text-[0.85rem] leading-none text-[var(--danger-500)] transition hover:opacity-85"
                    aria-label={`Eliminar interés ${interest}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[0.7rem] text-[var(--text-secondary)]">
              Aún no agregaste intereses.
            </p>
          )}

          {draftError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {draftError}
            </p>
          ) : null}

          {saveError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {saveError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void onSaveAll();
              }}
              disabled={isSaving || !hasChanges}
              className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={onDiscard}
              disabled={isSaving}
              className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              Descartar
            </button>
          </div>
        </div>
      ) : profile.intereses.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {profile.intereses.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center rounded-full border border-[var(--line-strong)] bg-[var(--brand-50)] px-3 py-[0.32rem] text-[0.64rem] font-semibold text-[var(--brand-700)]"
            >
              {interest}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[0.7rem] leading-[1.55] text-[var(--text-primary)]">
          Aún no agregaste intereses.
        </p>
      )}
    </AppCard>
  );
}
