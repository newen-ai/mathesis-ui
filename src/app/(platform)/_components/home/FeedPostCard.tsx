"use client";

import { useCallback, useMemo, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
	downloadFeedAttachmentFile,
	FeedAttachmentDownloadError,
	type FeedPost,
} from "@/lib/api/feed";
import { getTwoInitials } from "@/lib/utils/name";

type FeedPostCardProps = {
	post: FeedPost;
	currentUserId: string | null;
	onDelete: (postId: string) => Promise<{ ok: boolean; message?: string }>;
	onToggleReaction: (postId: string) => Promise<{ ok: boolean; message?: string }>;
	onShowComingSoon?: () => void;
};

function formatRelativeTime(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";

	const diffMs = Date.now() - date.getTime();
	const diffMinutes = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMinutes < 1) return "ahora";
	if (diffMinutes < 60) return `hace ${diffMinutes} min`;
	if (diffHours < 24) return `hace ${diffHours} h`;
	if (diffDays < 7) return `hace ${diffDays} d`;

	return date.toLocaleDateString("es-AR", {
		day: "2-digit",
		month: "short",
	});
}

function formatFileSize(sizeBytes: number) {
	if (sizeBytes < 1024) return `${sizeBytes} B`;
	if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
	return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FeedPostCard({
	post,
	currentUserId,
	onDelete,
	onToggleReaction,
	onShowComingSoon,
}: FeedPostCardProps) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [attachmentDownloadState, setAttachmentDownloadState] = useState<Record<string, boolean>>({});
	const [attachmentDownloadErrors, setAttachmentDownloadErrors] = useState<Record<string, string>>({});
	const [isTogglingReaction, setIsTogglingReaction] = useState(false);

	const isOwnPost = currentUserId !== null && currentUserId === post.authorUserId;

	const authorName = useMemo(() => {
		const parts = [post.author.firstName, post.author.lastName].filter(Boolean);
		return parts.length > 0 ? parts.join(" ") : "Usuario";
	}, [post.author.firstName, post.author.lastName]);

	const authorMeta = useMemo(() => {
		const jobParts = [post.author.currentJobTitle, post.author.currentCompany]
			.filter(Boolean)
			.join(" · ");
		return jobParts;
	}, [post.author.currentCompany, post.author.currentJobTitle]);

	const authorInitials = useMemo(
		() =>
			getTwoInitials({
				firstName: post.author.firstName,
				lastName: post.author.lastName,
			}),
		[post.author.firstName, post.author.lastName]
	);

	const attachmentCount = post.attachments.length;
	const timeLabel = formatRelativeTime(post.createdAt);
	const isReacted = post.currentUserReactionValue !== null;

	const handleToggleReaction = async () => {
		if (isTogglingReaction) return;

		setActionError(null);
		setIsTogglingReaction(true);
		try {
			const result = await onToggleReaction(post.id);
			if (!result.ok) {
				setActionError(result.message ?? "No pudimos actualizar la reacción.");
			}
		} finally {
			setIsTogglingReaction(false);
		}
	};

	const onConfirmDelete = async () => {
		setActionError(null);
		setIsDeleting(true);
		const result = await onDelete(post.id);
		setIsDeleting(false);

		if (!result.ok) {
			setActionError(result.message ?? "No pudimos eliminar la publicación.");
			return;
		}

		setIsDeleteConfirmOpen(false);
		setMenuOpen(false);
	};

	const onDownloadAttachment = useCallback(
		async (attachmentId: string, fallbackFileName: string) => {
			if (attachmentDownloadState[attachmentId]) return;

			setAttachmentDownloadState((current) => ({
				...current,
				[attachmentId]: true,
			}));
			setAttachmentDownloadErrors((current) => {
				const next = { ...current };
				delete next[attachmentId];
				return next;
			});

			try {
				const payload = await downloadFeedAttachmentFile(post.id, attachmentId);
				const fileName = (payload.fileName?.trim() || fallbackFileName || "adjunto.pdf").trim();

				const fileUrl = URL.createObjectURL(payload.blob);
				const anchor = document.createElement("a");
				anchor.href = fileUrl;
				anchor.download = fileName;
				document.body.appendChild(anchor);
				anchor.click();
				anchor.remove();
				URL.revokeObjectURL(fileUrl);
			} catch (error) {
				const message =
					error instanceof FeedAttachmentDownloadError
						? error.code === "UNAUTHORIZED"
							? "Tu sesión expiró. Inicia sesión nuevamente."
							: error.code === "NOT_FOUND"
								? "No se encontró el archivo o no tienes permisos para verlo."
								: "No pudimos descargar este PDF."
						: "No pudimos descargar este PDF.";

				setAttachmentDownloadErrors((current) => ({
					...current,
					[attachmentId]: message,
				}));
			} finally {
				setAttachmentDownloadState((current) => ({
					...current,
					[attachmentId]: false,
				}));
			}
		},
		[attachmentDownloadState, post.id]
	);

	return (
		<>
			<AppCard className="rounded-none border-x-0 bg-[var(--post-body-bg)] p-0 md:rounded-2xl md:border-x">
				<div className="px-4 pt-4">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-start gap-3">
								<UserAvatar
									imageUrl={post.author.profileImageUrl}
									initials={authorInitials}
									label={`Foto de perfil de ${authorName}`}
									className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--line-strong)] bg-[var(--navy-900)]"
									initialsClassName="text-xl font-bold text-[var(--brand-500)]"
								/>

							<div>
								<div className="flex flex-wrap items-center gap-2">
									<p className="text-[1.1rem] font-semibold text-[var(--text-primary)]">{authorName}</p>
								</div>
								{authorMeta ? (
									<p className="text-sm text-[var(--text-secondary)]">{authorMeta}</p>
								) : null}
								<p className="text-sm text-[var(--text-secondary)]">{timeLabel}</p>
							</div>
						</div>

						<div className="relative">
							<button
								type="button"
								className="mensa-icon-button flex h-9 w-9 items-center justify-center"
								aria-label="Más acciones"
								onClick={() => setMenuOpen((current) => !current)}
							>
								...
							</button>

							{menuOpen ? (
								<div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 min-w-56 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-2xl">
									{isOwnPost ? (
										<button
											type="button"
											onClick={() => {
											setMenuOpen(false);
											setIsDeleteConfirmOpen(true);
										}}
											className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
										>
											<span className="text-[var(--danger-500)]">🗑</span>
											Eliminar publicación
										</button>
									) : (
										<button
											type="button"
											onClick={() => {
											setMenuOpen(false);
											onShowComingSoon?.();
										}}
											className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-2)]"
										>
											<span>⚑</span>
											Denunciar publicación
										</button>
									)}
								</div>
							) : null}
						</div>
					</div>

					{post.content ? (
						<p className="mt-4 pb-4 text-[1.02rem] leading-8 text-[var(--text-primary)]">{post.content}</p>
					) : null}

					{attachmentCount > 0 ? (
						<div className="mt-4 space-y-3">
							{post.attachments.map((attachment) => {
								const isPdf = attachment.mimeType === "application/pdf";
								const isImage = attachment.mimeType.startsWith("image/");
								const isDownloading = attachmentDownloadState[attachment.id] ?? false;
								const attachmentError = attachmentDownloadErrors[attachment.id];

								return (
									<div
										key={attachment.id}
										className="overflow-hidden border-y border-[var(--line)] bg-[var(--post-file-bg)]"
									>
										<div className="flex items-center justify-between gap-3 px-4 py-3">
											<div className="flex items-center gap-3">
												<span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--brand-700)]">
													{isPdf ? (
														<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
															<path d="M7 3.8h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1Z" />
															<path d="M14 3.8v4h4" />
														</svg>
													) : isImage ? (
														<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
															<rect x="4" y="5" width="16" height="14" rx="2" />
															<path d="m7 14 3-3 3 3 2-2 2 2" />
															<circle cx="9" cy="9" r="1.2" />
														</svg>
													) : (
														<svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
															<path d="M7 3.8h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1Z" />
															<path d="M14 3.8v4h4" />
														</svg>
													)}
											</span>
												<div>
													<p className="text-[1rem] font-semibold text-[var(--text-primary)]">{attachment.fileName}</p>
													<p className="text-xs text-[var(--text-secondary)]">
														{isPdf ? "PDF" : isImage ? "Imagen" : attachment.mimeType} · {formatFileSize(attachment.sizeBytes)}
													</p>
												</div>
											</div>

											{isPdf ? (
												<button
													type="button"
													onClick={() => onDownloadAttachment(attachment.id, attachment.fileName)}
													disabled={isDownloading}
													className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
												>
													{isDownloading ? "Descargando..." : "Descargar PDF"}
												</button>
											) : isImage ? (
												<span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
													Imagen adjunta
												</span>
											) : null}
										</div>

										{attachmentError ? (
											<p className="px-4 pb-3 text-xs font-medium text-[var(--danger-500)]">
												{attachmentError}
											</p>
										) : null}
									</div>
								);
							})}
						</div>
					) : null}
				</div>

				<div className="flex items-center justify-between px-4 py-3">
					<button
						type="button"
						onClick={handleToggleReaction}
						disabled={isTogglingReaction}
						className={`rounded-lg px-3 py-1 text-[1rem] font-semibold transition hover:brightness-95 ${
							isReacted
								? "bg-[var(--surface-muted)] text-[var(--brand-700)]"
								: "bg-[var(--surface-2)] text-[var(--text-secondary)]"
						}`}
					>
						▲ {isReacted ? "Valorado" : "Valorar"}
						{isTogglingReaction ? (
							<span className="mensa-spin ml-2 inline-block h-3 w-3 rounded-full border border-current border-r-transparent" aria-hidden="true" />
						) : null}
					</button>

					<div className="flex items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
						<button type="button" className="transition hover:text-[var(--text-primary)]" onClick={() => onShowComingSoon?.()}>
							Comentar
						</button>
						<button type="button" className="transition hover:text-[var(--text-primary)]" onClick={() => onShowComingSoon?.()}>
							Compartir
						</button>
					</div>
				</div>

				{actionError ? (
					<p className="px-4 pb-4 text-xs font-medium text-[var(--danger-500)]">{actionError}</p>
				) : null}
			</AppCard>

			{isDeleteConfirmOpen ? (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4" role="dialog" aria-modal="true">
					<div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl">
						<h3 className="text-lg font-semibold text-[var(--text-primary)]">Eliminar publicación</h3>
						<p className="mt-2 text-sm text-[var(--text-secondary)]">¿Seguro que quieres eliminar esta publicación?</p>

						<div className="mt-4 flex justify-end gap-2">
							<button
								type="button"
								onClick={() => setIsDeleteConfirmOpen(false)}
								className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
							>
								Cancelar
							</button>
							<button
								type="button"
								onClick={onConfirmDelete}
								disabled={isDeleting}
								className="rounded-full bg-[var(--danger-500)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{isDeleting ? "Eliminando..." : "Eliminar"}
							</button>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}