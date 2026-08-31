"use client";

import { createAteneoTopic, getAteneoGroup, listAteneoGroups } from "@/lib/api/ateneo";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { LinkPreviewList } from "@/components/ui/LinkPreviewList";
import { extractUniqueUrlsFromText } from "@/lib/utils/link-preview";

const toneOptions = ["SERIO", "RECOMENDADO", "LIBRE"] as const;
const TOPIC_TITLE_LIMIT = 100;
const TOPIC_DESCRIPTION_LIMIT = 1000;

type AteneoNewTopicFormProps = {
  groupId: string;
};

type TopicGroupOption = {
  id: string;
  name: string;
  canCreateTopics: boolean;
};

export function AteneoNewTopicForm({ groupId }: AteneoNewTopicFormProps) {
  const router = useRouter();
  const [groupOptions, setGroupOptions] = useState<TopicGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [canCreateTopics, setCanCreateTopics] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTone, setSelectedTone] = useState<(typeof toneOptions)[number]>("LIBRE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isTitleTooLong = title.length > TOPIC_TITLE_LIMIT;
  const isDescriptionTooLong = description.length > TOPIC_DESCRIPTION_LIMIT;
  const isOverAnyLimit = isTitleTooLong || isDescriptionTooLong;
  const canPublish =
    canCreateTopics &&
    !isSubmitting &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !isOverAnyLimit;
  const detectedUrls = extractUniqueUrlsFromText(description, 3);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getAteneoGroup(groupId), listAteneoGroups("mine", 50)])
      .then(([groupResponse, mineGroupsResponse]) => {
        if (cancelled) {
          return;
        }

        const mineGroupOptions = mineGroupsResponse.data.groups.map((group) => ({
          id: group.id,
          name: group.name,
          canCreateTopics: group.createTopicsMode !== "admins" || group.isAdmin,
        }));

        const currentGroup = groupResponse.data.group;
        const hasCurrentGroupInMine = mineGroupOptions.some((option) => option.id === currentGroup.id);
        const nextOptions = hasCurrentGroupInMine
          ? mineGroupOptions
          : [
              {
                id: currentGroup.id,
                name: currentGroup.name,
                canCreateTopics: currentGroup.createTopicsMode !== "admins" || currentGroup.isAdmin,
              },
              ...mineGroupOptions,
            ];

        setGroupOptions(nextOptions);

        const defaultGroupId = nextOptions.some((option) => option.id === groupId) ? groupId : (nextOptions[0]?.id ?? groupId);
        setSelectedGroupId(defaultGroupId);
        const selectedGroup = nextOptions.find((option) => option.id === defaultGroupId);
        setCanCreateTopics(Boolean(selectedGroup?.canCreateTopics));
      })
      .catch(() => {
        if (!cancelled) {
          setGroupOptions([]);
          setCanCreateTopics(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const handleGroupChange = (nextGroupId: string) => {
    setSelectedGroupId(nextGroupId);
    const nextGroup = groupOptions.find((group) => group.id === nextGroupId);
    setCanCreateTopics(Boolean(nextGroup?.canCreateTopics));
  };

  const handleSubmit = async () => {
    const targetGroupId = selectedGroupId.trim();
    const safeTitle = title.trim();
    const safeDescription = description.trim();

    if (!targetGroupId) {
      toast.info("Elegí un grupo antes de publicar.");
      return;
    }

    if (!safeTitle || !safeDescription) {
      toast.info("Completá título y descripción antes de publicar.");
      return;
    }

    if (isOverAnyLimit) {
      toast.info("Respetá los límites: título hasta 100 y descripción hasta 1000 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createAteneoTopic(targetGroupId, {
        title: safeTitle,
        description: safeDescription,
        tone: selectedTone
      });

      toast.success("Tema publicado");
      router.push(`/ateneo/groups/${encodeURIComponent(targetGroupId)}/topics/${encodeURIComponent(response.data.topic.id)}`);
    } catch {
      toast.error("No pudimos publicar el tema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Volver"
            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-scale-2 font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <h1 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
            Nuevo tema
          </h1>
        </div>

        {canCreateTopics ? (
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => void handleSubmit()}
            className="rounded-full bg-[var(--brand-500)] px-5 py-2.5 text-scale-3 font-semibold text-[var(--navy-900)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
          >
            {isSubmitting ? "Publicando..." : "Publicar"}
          </button>
        ) : null}
      </div>

      {!canCreateTopics ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-scale-3 text-[var(--text-secondary)]">
          Solo los administradores pueden crear temas en este grupo.
        </div>
      ) : null}

      <div className={`rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5 ${!canCreateTopics ? "pointer-events-none opacity-60" : ""}`}>
        <div className="flex items-center gap-3">
          <label className="min-w-0 flex-1">
            <span className="mb-2 block text-scale-3 font-semibold text-[var(--heading-primary)]">Grupo</span>
            <div className="relative">
              <select
                value={selectedGroupId}
                onChange={(event) => handleGroupChange(event.target.value)}
                className="w-full appearance-none rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 pr-10 text-scale-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)]"
              >
                {groupOptions.length === 0 ? <option value="">No hay grupos disponibles</option> : null}
                {groupOptions.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--text-secondary)]">
                ⌄
              </span>
            </div>
          </label>
        </div>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className="mb-2 block text-scale-3 font-semibold text-[var(--heading-primary)]">Título</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título del tema..."
              className={[
                "w-full rounded-xl border bg-[var(--surface)] px-3 py-3 text-scale-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)]",
                isTitleTooLong ? "border-[var(--danger-500)] focus:border-[var(--danger-500)]" : "border-[var(--line)] focus:border-[var(--brand-700)]",
              ].join(" ")}
            />
            <div
              className={[
                "mt-1 text-right text-scale-1",
                isTitleTooLong ? "text-[var(--danger-500)]" : "text-[var(--text-secondary)]",
              ].join(" ")}
            >
              {title.length}/{TOPIC_TITLE_LIMIT}
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-scale-3 font-semibold text-[var(--heading-primary)]">Descripción</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Contá de qué se trata..."
              rows={6}
              className={[
                "w-full resize-none rounded-xl border bg-[var(--surface)] px-3 py-3 text-scale-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)]",
                isDescriptionTooLong
                  ? "border-[var(--danger-500)] focus:border-[var(--danger-500)]"
                  : "border-[var(--line)] focus:border-[var(--brand-700)]",
              ].join(" ")}
            />
            <div
              className={[
                "mt-1 text-right text-scale-1",
                isDescriptionTooLong ? "text-[var(--danger-500)]" : "text-[var(--text-secondary)]",
              ].join(" ")}
            >
              {description.length}/{TOPIC_DESCRIPTION_LIMIT}
            </div>

            {detectedUrls.length > 0 ? (
              <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <p className="text-scale-2 font-semibold text-[var(--heading-primary)]">Links detectados</p>
                <LinkifiedText
                  text={description}
                  className="mt-2 whitespace-pre-wrap text-scale-2 text-[var(--text-secondary)]"
                  linkClassName="mathesis-link-accent underline underline-offset-2"
                />
                <LinkPreviewList text={description} className="mt-3 grid gap-2" />
              </div>
            ) : null}
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-scale-3 font-semibold text-[var(--heading-primary)]">Adjuntar</span>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-scale-2 font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
                >
                  <span aria-hidden="true">◫</span>
                  Foto
                </button>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-scale-2 font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
                >
                  <span aria-hidden="true">▣</span>
                  Archivo
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-scale-2 text-[var(--text-secondary)]">
                Foto: JPG, PNG o HEIC · Archivo: solo PDF
              </div>
            </div>
          </div>

          <div className="pt-1">
              <div className="mb-3 text-scale-3 font-semibold text-[var(--heading-primary)]">Tono del tema (opcional, indicativo)</div>
            <div className="grid grid-cols-3 gap-2">
              {toneOptions.map((tone) => {
                const isSelected = selectedTone === tone;

                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedTone(tone)}
                    className={[
                      "rounded-xl border px-3 py-2.5 text-scale-2 font-medium transition",
                      isSelected
                        ? "border-[var(--brand-700)] bg-[var(--brand-100)] text-[var(--brand-800)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
                    ].join(" ")}
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">
              Solo indicativo — no cambia moderación ni el Sermonio real de reacciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
