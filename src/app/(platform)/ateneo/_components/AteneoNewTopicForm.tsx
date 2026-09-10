"use client";

import { createAteneoTopic, getAteneoGroup, listAteneoGroups } from "@/lib/api/ateneo";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { toast } from "sonner";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { LinkPreviewList } from "@/components/ui/LinkPreviewList";
import { extractUniqueUrlsFromText } from "@/lib/utils/link-preview";
import { createRenderableImageUrlFromBlob } from "@/lib/utils/image-preview";

const toneOptions = ["SERIO", "RECOMENDADO", "LIBRE"] as const;
const TOPIC_TITLE_LIMIT = 100;
const TOPIC_DESCRIPTION_LIMIT = 1000;

type AteneoNewTopicFormProps = {
  groupId?: string;
};

type TopicGroupOption = {
  id: string;
  name: string;
  canCreateTopics: boolean;
};

type TopicAttachmentDraft = {
  file: File;
  kind: "image" | "pdf";
  previewUrl?: string;
};

type TopicImagePreviewItem = {
  attachmentIndex: number;
  file: File;
  previewUrl: string;
};

const IMAGE_ATTACHMENT_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/heic", "image/heif"]);
const PDF_ATTACHMENT_MIME_TYPE = "application/pdf";

export function AteneoNewTopicForm({ groupId }: AteneoNewTopicFormProps) {
  const preferredGroupId = groupId?.trim() ?? "";
  const hasFixedGroupContext = preferredGroupId.length > 0;
  const router = useRouter();
  const searchParams = useSearchParams();
  const cameFromFooter = searchParams.get("source") === "footer";
  const [groupOptions, setGroupOptions] = useState<TopicGroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState(preferredGroupId);
  const [isGroupPickerOpen, setIsGroupPickerOpen] = useState(false);
  const [canCreateTopics, setCanCreateTopics] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTone, setSelectedTone] = useState<(typeof toneOptions)[number]>("LIBRE");
  const [attachments, setAttachments] = useState<TopicAttachmentDraft[]>([]);
  const [activePreviewImageIndex, setActivePreviewImageIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentsRef = useRef<TopicAttachmentDraft[]>([]);
  const previewTouchStartXRef = useRef<number | null>(null);
  const previewTouchStartYRef = useRef<number | null>(null);
  const isTitleTooLong = title.length > TOPIC_TITLE_LIMIT;
  const isDescriptionTooLong = description.length > TOPIC_DESCRIPTION_LIMIT;
  const isOverAnyLimit = isTitleTooLong || isDescriptionTooLong;
  const canPublish =
    canCreateTopics &&
    !isSubmitting &&
    selectedGroupId.trim().length > 0 &&
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    !isOverAnyLimit;
  const detectedUrls = extractUniqueUrlsFromText(description, 3);
  const imagePreviewItems = useMemo<TopicImagePreviewItem[]>(() => {
    const nextItems: TopicImagePreviewItem[] = [];

    attachments.forEach((attachment, attachmentIndex) => {
      if (attachment.kind !== "image" || !attachment.previewUrl) {
        return;
      }

      nextItems.push({
        attachmentIndex,
        file: attachment.file,
        previewUrl: attachment.previewUrl,
      });
    });

    return nextItems;
  }, [attachments]);
  const normalizedActivePreviewImageIndex =
    activePreviewImageIndex === null || imagePreviewItems.length === 0
      ? null
      : Math.min(activePreviewImageIndex, imagePreviewItems.length - 1);
  const isImagePreviewOpen = normalizedActivePreviewImageIndex !== null;
  const activePreviewImage =
    normalizedActivePreviewImageIndex !== null
      ? (imagePreviewItems[normalizedActivePreviewImageIndex] ?? null)
      : null;
  const isImageCarouselEnabled = imagePreviewItems.length > 1;
  const shouldLockBodyScroll = isGroupPickerOpen || isImagePreviewOpen;
  const selectedGroupLabel = useMemo(() => {
    if (!selectedGroupId) {
      return "Seleccioná un grupo";
    }

    return (
      groupOptions.find((group) => group.id === selectedGroupId)?.name ||
      "Seleccioná un grupo"
    );
  }, [groupOptions, selectedGroupId]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
    };
  }, []);

  const buildImagePreviewUrl = async (file: File): Promise<string> => {
    return createRenderableImageUrlFromBlob(file);
  };

  const registerAttachments = async (files: FileList | File[] | null, kind: TopicAttachmentDraft["kind"]) => {
    if (!files) return;

    const allowedFiles = Array.from(files)
      .filter((file) => {
        if (kind === "image") {
          return IMAGE_ATTACHMENT_MIME_TYPES.has(file.type);
        }

        return file.type === PDF_ATTACHMENT_MIME_TYPE;
      });

    if (allowedFiles.length === 0) {
      toast.info(kind === "image" ? "Elegí una imagen JPG, PNG o HEIC." : "Elegí un archivo PDF.");
      return;
    }

    const nextAttachments = await Promise.all(
      allowedFiles.map(async (file) => {
        if (kind === "image") {
          const previewUrl = await buildImagePreviewUrl(file);
          return { file, kind, previewUrl };
        }

        return { file, kind };
      })
    );

    const droppedCount = Math.max(0, attachments.length + nextAttachments.length - 5);
    if (droppedCount > 0) {
      toast.info("Máximo 5 adjuntos por tema.");
    }

    setAttachments((current) => {
      const merged = [...current, ...nextAttachments];
      const kept = merged.slice(0, 5);
      const dropped = merged.slice(5);
      dropped.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
      return kept;
    });
  };

  const removeAttachmentAt = (indexToRemove: number) => {
    setAttachments((current) => {
      const target = current[indexToRemove];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((_, index) => index !== indexToRemove);
    });
  };

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        let nextOptions: TopicGroupOption[] = [];

        if (hasFixedGroupContext) {
          const groupResponse = await getAteneoGroup(preferredGroupId);
          const currentGroup = groupResponse.data.group;
          nextOptions = [
            {
              id: currentGroup.id,
              name: currentGroup.name,
              canCreateTopics: currentGroup.createTopicsMode !== "admins" || currentGroup.isAdmin,
            },
          ];
        } else {
          const mineGroupsResponse = await listAteneoGroups("mine", 50);
          nextOptions = mineGroupsResponse.data.groups.map((group) => ({
            id: group.id,
            name: group.name,
            canCreateTopics: group.createTopicsMode !== "admins" || group.isAdmin,
          }));
        }

        if (cancelled) {
          return;
        }

        setGroupOptions(nextOptions);

        const defaultGroupId = hasFixedGroupContext
          ? preferredGroupId
          : cameFromFooter
            ? ""
            : (nextOptions[0]?.id ?? "");
        setSelectedGroupId(defaultGroupId);
        const selectedGroup = nextOptions.find((option) => option.id === defaultGroupId);
        setCanCreateTopics(
          defaultGroupId.length > 0 ? Boolean(selectedGroup?.canCreateTopics) : true
        );
      } catch {
        if (!cancelled) {
          setGroupOptions([]);
          setSelectedGroupId("");
          setCanCreateTopics(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [cameFromFooter, hasFixedGroupContext, preferredGroupId]);

  useEffect(() => {
    if (!shouldLockBodyScroll) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.setProperty("overflow", "hidden");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isImagePreviewOpen) {
          setActivePreviewImageIndex(null);
          return;
        }

        setIsGroupPickerOpen(false);
        return;
      }

      if (!isImagePreviewOpen || imagePreviewItems.length === 0) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActivePreviewImageIndex((current) => {
          const currentIndex = current ?? 0;
          return (currentIndex + 1) % imagePreviewItems.length;
        });
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActivePreviewImageIndex((current) => {
          const currentIndex = current ?? 0;
          return (currentIndex - 1 + imagePreviewItems.length) % imagePreviewItems.length;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [imagePreviewItems, isImagePreviewOpen, shouldLockBodyScroll]);

  const handleGroupChange = (nextGroupId: string) => {
    setSelectedGroupId(nextGroupId);
    const nextGroup = groupOptions.find((group) => group.id === nextGroupId);
    setCanCreateTopics(nextGroupId.length > 0 ? Boolean(nextGroup?.canCreateTopics) : true);
    setIsGroupPickerOpen(false);
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
        tone: selectedTone,
        attachments: attachments.map((attachment) => attachment.file)
      });

      toast.success("Tema publicado");
      attachments.forEach((attachment) => {
        if (attachment.previewUrl) {
          URL.revokeObjectURL(attachment.previewUrl);
        }
      });
      setAttachments([]);
      setActivePreviewImageIndex(null);
      router.push(`/ateneo/groups/${encodeURIComponent(targetGroupId)}/topics/${encodeURIComponent(response.data.topic.id)}`);
    } catch {
      toast.error("No pudimos publicar el tema.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openImagePreviewAt = (targetIndex: number) => {
    if (!imagePreviewItems[targetIndex]) {
      return;
    }

    setActivePreviewImageIndex(targetIndex);
  };

  const closeImagePreview = () => {
    setActivePreviewImageIndex(null);
  };

  const showNextPreviewImage = () => {
    if (imagePreviewItems.length === 0) {
      return;
    }

    setActivePreviewImageIndex((current) => {
      const currentIndex = current ?? 0;
      return (currentIndex + 1) % imagePreviewItems.length;
    });
  };

  const showPreviousPreviewImage = () => {
    if (imagePreviewItems.length === 0) {
      return;
    }

    setActivePreviewImageIndex((current) => {
      const currentIndex = current ?? 0;
      return (currentIndex - 1 + imagePreviewItems.length) % imagePreviewItems.length;
    });
  };

  const handlePreviewTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!isImageCarouselEnabled) {
      return;
    }

    const touch = event.changedTouches[0];
    previewTouchStartXRef.current = touch.clientX;
    previewTouchStartYRef.current = touch.clientY;
  };

  const handlePreviewTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!isImageCarouselEnabled) {
      return;
    }

    const startX = previewTouchStartXRef.current;
    const startY = previewTouchStartYRef.current;
    if (startX === null || startY === null) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    previewTouchStartXRef.current = null;
    previewTouchStartYRef.current = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      showNextPreviewImage();
      return;
    }

    showPreviousPreviewImage();
  };

  const removeActivePreviewImage = () => {
    if (!activePreviewImage || normalizedActivePreviewImageIndex === null) {
      return;
    }

    const nextPreviewIndex =
      imagePreviewItems.length <= 1
        ? null
        : Math.min(normalizedActivePreviewImageIndex, imagePreviewItems.length - 2);

    removeAttachmentAt(activePreviewImage.attachmentIndex);
    setActivePreviewImageIndex(nextPreviewIndex);
  };

  return (
    <div className="space-y-4">
      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/heic,image/heif" multiple className="hidden" onChange={(event) => {
        void registerAttachments(event.target.files, "image");
        event.currentTarget.value = "";
      }} />
      <input ref={fileInputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(event) => {
        void registerAttachments(event.target.files, "pdf");
        event.currentTarget.value = "";
      }} />
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

      {!hasFixedGroupContext && groupOptions.length === 0 ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-scale-3 text-[var(--text-secondary)]">
          Todavía no tenés grupos disponibles para publicar temas. Sumate a un grupo o creá uno nuevo desde Ateneo.
        </div>
      ) : null}

      {groupOptions.length > 0 && selectedGroupId.trim().length > 0 && !canCreateTopics ? (
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-scale-3 text-[var(--text-secondary)]">
          Solo los administradores pueden crear temas en este grupo.
        </div>
      ) : null}

      <div
        className={[
          "rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5",
          !canCreateTopics || (!hasFixedGroupContext && groupOptions.length === 0)
            ? "pointer-events-none opacity-60"
            : "",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <label className="min-w-0 flex-1">
            <span className="mb-2 block text-scale-3 font-semibold text-[var(--heading-primary)]">Grupo</span>
            {hasFixedGroupContext ? (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-scale-3 font-medium text-[var(--text-primary)]">
                {groupOptions.find((group) => group.id === selectedGroupId)?.name || "Grupo seleccionado"}
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setIsGroupPickerOpen(true)}
                  className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-left text-scale-3 outline-none transition hover:bg-[var(--surface-2)] focus:border-[var(--brand-700)] md:hidden"
                >
                  <span className={selectedGroupId ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}>
                    {selectedGroupLabel}
                  </span>
                  <span aria-hidden="true" className="text-[var(--text-secondary)]">⌄</span>
                </button>

                <div className="relative hidden md:block">
                  <select
                    value={selectedGroupId}
                    onChange={(event) => handleGroupChange(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 pr-10 text-scale-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)]"
                  >
                    {groupOptions.length > 0 ? (
                      <option value="">Seleccioná un grupo</option>
                    ) : (
                      <option value="">No hay grupos disponibles</option>
                    )}
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
              </div>
            )}
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
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-scale-2 font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
                >
                  <span aria-hidden="true">◫</span>
                  Foto
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-scale-2 font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface)]"
                >
                  <span aria-hidden="true">▣</span>
                  Archivo
                </button>
              </div>

              {attachments.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {attachments.map((attachment, index) => {
                    if (attachment.kind === "image") {
                      const previewItem = imagePreviewItems.find((item) => item.attachmentIndex === index);
                      if (!previewItem) {
                        return null;
                      }

                      return (
                        <div
                          key={`${attachment.file.name}-${index}`}
                          className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] text-left transition hover:border-[var(--brand-700)]"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              const previewIndex = imagePreviewItems.findIndex((item) => item.attachmentIndex === index);
                              if (previewIndex >= 0) {
                                openImagePreviewAt(previewIndex);
                              }
                            }}
                            className="block"
                            aria-label={`Abrir vista previa de ${attachment.file.name}`}
                          >
                            <Image
                              src={previewItem.previewUrl}
                              alt={`Vista previa de ${attachment.file.name}`}
                              width={80}
                              height={80}
                              unoptimized
                              className="h-20 w-20 object-cover"
                            />
                          </button>
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-[color:color-mix(in_srgb,var(--navy-900)_58%,transparent)] px-2 py-1 text-scale-1 text-white">
                            {attachment.file.name}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeAttachmentAt(index);
                            }}
                            className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)] text-sm text-[var(--text-primary)] backdrop-blur transition hover:bg-[var(--surface)]"
                            aria-label={`Quitar ${attachment.file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={`${attachment.file.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-scale-2 text-[var(--text-primary)]">
                        <span aria-hidden="true">📄</span>
                        <span className="max-w-[180px] truncate">{attachment.file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeAttachmentAt(index)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                          aria-label={`Quitar ${attachment.file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : null}

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

      {!hasFixedGroupContext && isGroupPickerOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4 md:hidden">
          <button
            type="button"
            aria-label="Cerrar selector de grupos"
            className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--navy-900)_48%,transparent)]"
            onClick={() => setIsGroupPickerOpen(false)}
          />
          <section className="relative z-[141] w-full max-w-[28rem] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_20px_50px_color-mix(in_srgb,var(--navy-900)_26%,transparent)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
                Elegir grupo
              </h2>
              <button
                type="button"
                onClick={() => setIsGroupPickerOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]"
                aria-label="Cerrar selector"
              >
                ×
              </button>
            </div>

            <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => handleGroupChange("")}
                className={[
                  "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-scale-3",
                  selectedGroupId.length === 0
                    ? "border-[var(--brand-700)] bg-[var(--brand-100)] text-[var(--brand-900)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]",
                ].join(" ")}
              >
                <span>Seleccioná un grupo</span>
              </button>

              {groupOptions.length === 0 ? (
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-scale-2 text-[var(--text-secondary)]">
                  No hay grupos disponibles
                </div>
              ) : null}

              {groupOptions.map((group) => {
                const isSelected = selectedGroupId === group.id;

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => handleGroupChange(group.id)}
                    className={[
                      "flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-scale-3",
                      isSelected
                        ? "border-[var(--brand-700)] bg-[var(--brand-100)] text-[var(--brand-900)]"
                        : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-primary)]",
                    ].join(" ")}
                  >
                    <span className="truncate">{group.name}</span>
                    {isSelected ? <span aria-hidden="true">✓</span> : null}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}

      {isImagePreviewOpen && activePreviewImage ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center px-3 sm:px-6">
          <button
            type="button"
            aria-label="Cerrar vista previa"
            className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--navy-900)_72%,transparent)]"
            onClick={closeImagePreview}
          />

          <section className="relative z-[151] w-full max-w-5xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_24px_60px_color-mix(in_srgb,var(--navy-900)_40%,transparent)] sm:p-4">
            <div className="flex items-center justify-between gap-3 pb-3">
              <p className="min-w-0 truncate text-scale-2 font-semibold text-[var(--heading-primary)]">
                {activePreviewImage.file.name}
              </p>
              <div className="flex items-center gap-2">
                {isImageCarouselEnabled ? (
                  <p className="text-scale-1 text-[var(--text-secondary)]">
                    {normalizedActivePreviewImageIndex !== null ? normalizedActivePreviewImageIndex + 1 : 1}/{imagePreviewItems.length}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={removeActivePreviewImage}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--danger-500)] bg-[var(--surface)] text-[var(--danger-500)] transition hover:bg-[color:color-mix(in_srgb,var(--danger-500)_12%,var(--surface))]"
                  aria-label="Quitar imagen actual"
                >
                  🗑
                </button>
                <button
                  type="button"
                  onClick={closeImagePreview}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]"
                  aria-label="Cerrar vista previa"
                >
                  ×
                </button>
              </div>
            </div>

            <div
              className="relative flex min-h-[220px] items-center justify-center rounded-xl bg-[var(--surface-2)] p-2 sm:min-h-[320px] sm:p-3"
              onTouchStart={handlePreviewTouchStart}
              onTouchEnd={handlePreviewTouchEnd}
            >
              <Image
                src={activePreviewImage.previewUrl}
                alt={`Vista previa de ${activePreviewImage.file.name}`}
                width={1600}
                height={1200}
                unoptimized
                className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
              />

              {isImageCarouselEnabled ? (
                <>
                  <button
                    type="button"
                    onClick={showPreviousPreviewImage}
                    className="absolute left-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] text-xl text-[var(--text-primary)] backdrop-blur sm:left-3"
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={showNextPreviewImage}
                    className="absolute right-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] text-xl text-[var(--text-primary)] backdrop-blur sm:right-3"
                    aria-label="Imagen siguiente"
                  >
                    ›
                  </button>
                </>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
