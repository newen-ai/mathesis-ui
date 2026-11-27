"use client";

import { useCallback, useEffect, useState } from "react";
import { getLegalDocument, type LegalDocument, type LegalDocumentSlug } from "@/lib/api/legal";

type LegalDocumentsState =
  | { status: "loading"; documents: null }
  | { status: "error"; documents: null }
  | { status: "ready"; documents: Record<LegalDocumentSlug, LegalDocument> };

/** Loads the current version of the given legal texts. `reload` fetches them again (for example after a version change). */
export function useLegalDocuments(slugs: LegalDocumentSlug[]) {
  const [state, setState] = useState<LegalDocumentsState>({ status: "loading", documents: null });
  const [attempt, setAttempt] = useState(0);
  const key = slugs.join(",");

  useEffect(() => {
    const controller = new AbortController();
    const requested = key.split(",") as LegalDocumentSlug[];

    void Promise.all(requested.map((slug) => getLegalDocument(slug, controller.signal)))
      .then((responses) => {
        if (controller.signal.aborted) return;
        const documents = Object.fromEntries(responses.map((response) => [response.data.slug, response.data]));
        setState({ status: "ready", documents: documents as Record<LegalDocumentSlug, LegalDocument> });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({ status: "error", documents: null });
      });

    return () => controller.abort();
  }, [key, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading", documents: null });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, reload };
}
