"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AppCard } from "@/components/ui/AppCard";
import { UserAvatar } from "@/components/ui/UserAvatar";

const MAX_PDF_FILES = 5;
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

type ComposerPublishInput = {
	content: string;
	pdfFiles: File[];
	imageFiles: File[];
};

type ComposerPublishResult = {
	ok: boolean;
	message?: string;
};

type ComposerCardProps = {
	initials: string;
	avatarImageUrl?: string | null;
	isSubmitting: boolean;
	onPublish: (input: ComposerPublishInput) => Promise<ComposerPublishResult>;
};

function formatFileSize(sizeBytes: number) {
	if (sizeBytes < 1024) return `${sizeBytes} B`;
	if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
	return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComposerCard({
	initials,
	avatarImageUrl,
	isSubmitting,
	onPublish,
}: ComposerCardProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [content, setContent] = useState("");
	const [pdfFiles, setPdfFiles] = useState<File[]>([]);
	const [imageFiles, setImageFiles] = useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = useState<Array<{ file: File; url: string }>>([]);
	const [error, setError] = useState<string | null>(null);
	const pdfInputRef = useRef<HTMLInputElement | null>(null);
	const imageInputRef = useRef<HTMLInputElement | null>(null);

	const canSubmit = useMemo(() => {
		return Boolean(content.trim() || pdfFiles.length > 0 || imageFiles.length > 0);
	}, [content, imageFiles.length, pdfFiles.length]);

	useEffect(() => {
		return () => {
			imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
		};
	}, [imagePreviews]);

	const clearComposer = () => {
		imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
		setContent("");
		setPdfFiles([]);
		setImageFiles([]);
		setImagePreviews([]);
		setError(null);
		setIsOpen(false);
		if (pdfInputRef.current) {
			pdfInputRef.current.value = "";
		}
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
	};

	const onPickPdfFiles = (files: File[]) => {
		if (files.length === 0) return;

		const nextFiles = [...pdfFiles, ...files];
		if (nextFiles.length > MAX_PDF_FILES) {
			setError(`Solo se pueden adjuntar hasta ${MAX_PDF_FILES} PDFs.`);
			return;
		}

		for (const file of files) {
			if (file.type !== "application/pdf") {
				setError(`El archivo ${file.name} no es un PDF válido.`);
				return;
			}

			if (file.size > MAX_PDF_SIZE_BYTES) {
				setError(`El archivo ${file.name} supera 10 MB.`);
				return;
			}
		}

		setError(null);
		setPdfFiles(nextFiles);
	};

	const onPickImageFiles = (files: File[]) => {
		if (files.length === 0) return;

		const nextFiles = [...imageFiles, ...files];
		const nextPreviews = [
			...imagePreviews,
			...files.map((file) => ({ file, url: URL.createObjectURL(file) })),
		];

		setError(null);
		setImageFiles(nextFiles);
		setImagePreviews(nextPreviews);
	};

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const trimmed = content.trim();
		if (!trimmed && pdfFiles.length === 0 && imageFiles.length === 0) {
			setError("Escribe algo o adjunta al menos un PDF o una imagen.");
			return;
		}

		const result = await onPublish({
			content,
			pdfFiles,
			imageFiles,
		});

		if (!result.ok) {
			setError(result.message ?? "No pudimos publicar el post.");
			return;
		}

		clearComposer();
	};

	const removePdf = (file: File) => {
		setPdfFiles((current) => current.filter((item) => item !== file));
	};

	const removeImage = (file: File) => {
		const preview = imagePreviews.find((item) => item.file === file);
		if (preview) {
			URL.revokeObjectURL(preview.url);
		}
		setImageFiles((current) => current.filter((item) => item !== file));
		setImagePreviews((current) => current.filter((item) => item.file !== file));
	};

	return (
		<AppCard className="rounded-none border-x-0 p-4 md:rounded-2xl md:border-x">
			<form onSubmit={onSubmit}>
				<div className="flex items-center gap-3">
					<UserAvatar
						imageUrl={avatarImageUrl}
						initials={initials}
						label="Foto de perfil"
						className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--line-strong)] bg-[var(--navy-900)]"
						initialsClassName="text-lg font-bold text-[var(--brand-500)]"
					/>
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="mathesis-composer-trigger w-full rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2.5 text-left text-lg font-medium text-[var(--text-secondary)]"
					>
						¿Qué querés compartir con la comunidad?
					</button>
				</div>

				{isOpen ? (
					<>
						<textarea
							value={content}
							onChange={(event) => setContent(event.target.value)}
							rows={4}
							autoFocus
							placeholder="Escribí tu publicación..."
							maxLength={4000}
							className="mt-3 w-full rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
						/>

						<div className="mt-3 flex flex-wrap items-center gap-2">
							<label className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]">
								<input
									ref={pdfInputRef}
									type="file"
									accept="application/pdf"
									multiple
									className="hidden"
									onChange={(event) => onPickPdfFiles(Array.from(event.target.files ?? []))}
								/>
								Adjuntar PDF
							</label>
							<label className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]">
								<input
									ref={imageInputRef}
									type="file"
									accept="image/*"
									multiple
									className="hidden"
									onChange={(event) => onPickImageFiles(Array.from(event.target.files ?? []))}
								/>
								Adjuntar imagen
							</label>
						</div>

						{pdfFiles.length > 0 ? (
							<div className="mt-3 space-y-2">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">PDFs</p>
								<div className="flex flex-wrap gap-2">
									{pdfFiles.map((file) => (
										<span key={file.name} className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
											<span>PDF</span>
											<span>{file.name}</span>
											<span>{formatFileSize(file.size)}</span>
											<button
												type="button"
												onClick={() => removePdf(file)}
												className="text-[var(--text-soft)] transition hover:text-[var(--text-primary)]"
												aria-label={`Quitar ${file.name}`}
											>
												×
											</button>
										</span>
									))}
								</div>
							</div>
						) : null}

						{imageFiles.length > 0 ? (
							<div className="mt-3 space-y-2">
								<p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">Imágenes</p>
								<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
									{imageFiles.map((file, index) => (
										<figure key={`${file.name}-${index}`} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
											{imagePreviews[index] ? (
												<Image
													src={imagePreviews[index].url}
													alt={file.name}
													width={400}
													height={224}
													unoptimized
													className="h-28 w-full object-cover"
												/>
											) : null}
											<figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-[var(--text-secondary)]">
												<span className="truncate">{file.name}</span>
												<button
													type="button"
													onClick={() => removeImage(file)}
													className="text-[var(--text-soft)] transition hover:text-[var(--text-primary)]"
													aria-label={`Quitar ${file.name}`}
												>
													×
												</button>
											</figcaption>
										</figure>
									))}
								</div>
								<p className="text-xs text-amber-700">
									Las imágenes todavía no se publican en el backend; quedan como borrador visual.
								</p>
							</div>
						) : null}

						{error ? (
							<p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
								{error}
							</p>
						) : null}

						<div className="mt-3 flex flex-wrap items-center gap-2">
							<button
								type="submit"
								disabled={isSubmitting || !canSubmit}
								className="rounded-full bg-[var(--brand-500)] px-4 py-2 text-xs font-semibold text-[var(--navy-900)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{isSubmitting ? "Publicando..." : "Publicar"}
							</button>
							<button
								type="button"
								onClick={clearComposer}
								className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]"
							>
								Cancelar
							</button>
						</div>
					</>
				) : null}
			</form>
		</AppCard>
	);
}