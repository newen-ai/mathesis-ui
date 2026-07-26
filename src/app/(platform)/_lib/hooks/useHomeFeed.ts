"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyProfileIdentity } from "@/lib/api/profile";
import {
	createFeedPost,
	deleteFeedPost,
	listFeedPosts,
	type FeedPost,
	type FeedSortBy,
} from "@/lib/api/feed";

const FEED_PAGE_SIZE = 10;
const FEED_SORT_BY: FeedSortBy = "HOT";

type CreateFeedPostInput = {
	content: string;
	pdfFiles: File[];
	imageFiles: File[];
};

const getFileSizeLabel = (sizeBytes: number) => {
	if (sizeBytes < 1024) return `${sizeBytes} B`;
	if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
	return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const useHomeFeed = () => {
	const [posts, setPosts] = useState<FeedPost[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [limit, setLimit] = useState(FEED_PAGE_SIZE);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [isMutating, setIsMutating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [hasMore, setHasMore] = useState(true);

	useEffect(() => {
		let isMounted = true;

		const loadCurrentUserId = async () => {
			const nextUserId = await getMyProfileIdentity();
			if (!isMounted) return;
			setCurrentUserId(nextUserId);
		};

		void loadCurrentUserId();

		return () => {
			isMounted = false;
		};
	}, []);

	const loadFeed = useCallback(
		async (nextLimit: number, signal?: AbortSignal) => {
			const payload = await listFeedPosts({
				limit: nextLimit,
				sortBy: FEED_SORT_BY,
				signal,
			});

			setPosts(payload.data.posts);
			setHasMore(payload.data.posts.length >= nextLimit);
			setError(null);
		},
		[]
	);

	useEffect(() => {
		let isMounted = true;
		const controller = new AbortController();

		const run = async () => {
			try {
				await loadFeed(limit, controller.signal);
			} catch (error) {
				if (!isMounted || controller.signal.aborted) return;

				const message =
					error instanceof Error &&
					error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
						? "NEXT_PUBLIC_API_BASE_URL no está configurada."
						: "No pudimos cargar el feed.";

				setError(message);
				setPosts([]);
				setHasMore(false);
			} finally {
				if (!isMounted || controller.signal.aborted) return;
				setIsLoading(false);
				setIsLoadingMore(false);
			}
		};

		void run();

		return () => {
			isMounted = false;
			controller.abort();
		};
	}, [loadFeed, limit]);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			await loadFeed(limit);
		} catch (error) {
			const message =
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no está configurada."
					: "No pudimos cargar el feed.";

			setError(message);
			setPosts([]);
			setHasMore(false);
		} finally {
			setIsLoading(false);
		}
	}, [limit, loadFeed]);

	const loadMore = useCallback(() => {
		if (!hasMore || isLoadingMore || isLoading) return;
		setIsLoadingMore(true);
		setLimit((current) => current + FEED_PAGE_SIZE);
	}, [hasMore, isLoading, isLoadingMore]);

	const createPost = useCallback(
		async ({ content, pdfFiles, imageFiles }: CreateFeedPostInput) => {
			const trimmedContent = content.trim();

			if (imageFiles.length > 0) {
				return {
					ok: false,
					message:
						"Las imágenes todavía no se pueden publicar desde el backend del feed.",
				};
			}

			if (!trimmedContent && pdfFiles.length === 0) {
				return {
					ok: false,
					message: "Escribe un texto o adjunta al menos un PDF.",
				};
			}

			if (pdfFiles.length > 5) {
				return {
					ok: false,
					message: "Solo se pueden adjuntar hasta 5 PDFs por publicación.",
				};
			}

			for (const file of pdfFiles) {
				if (file.type !== "application/pdf") {
					return {
						ok: false,
						message: `El archivo ${file.name} no es un PDF válido.`,
					};
				}

				if (file.size > 10 * 1024 * 1024) {
					return {
						ok: false,
						message: `El archivo ${file.name} supera el máximo de 10 MB.`,
					};
				}
			}

			setIsMutating(true);
			setError(null);

			try {
				const payload = await createFeedPost({
					content: trimmedContent || undefined,
					pdfFiles,
				});

				setPosts((current) => [payload.data.post, ...current]);
				setHasMore(true);
				return { ok: true };
			} catch (error) {
				const message =
					error instanceof Error &&
					error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
						? "NEXT_PUBLIC_API_BASE_URL no está configurada."
						: "No pudimos crear la publicación.";

				return { ok: false, message };
			} finally {
				setIsMutating(false);
			}
		},
		[]
	);

	const removePost = useCallback(async (postId: string) => {
		setIsMutating(true);
		setError(null);

		try {
			const response = await deleteFeedPost(postId);
			if (!response.success) {
				return { ok: false, message: response.message };
			}

			setPosts((current) => current.filter((post) => post.id !== postId));
			return { ok: true };
		} catch (error) {
			const message =
				error instanceof Error &&
				error.message === "NEXT_PUBLIC_API_BASE_URL is not configured"
					? "NEXT_PUBLIC_API_BASE_URL no está configurada."
					: "No pudimos eliminar la publicación.";

			return { ok: false, message };
		} finally {
			setIsMutating(false);
		}
	}, []);

	const feedState = useMemo(
		() => ({
			currentUserId,
			posts,
			isLoading,
			isLoadingMore,
			isMutating,
			error,
			hasMore,
		}),
		[currentUserId, error, hasMore, isLoading, isLoadingMore, isMutating, posts]
	);

	return {
		...feedState,
		createPost,
		deletePost: removePost,
		loadMore,
		refresh,
		pageSize: FEED_PAGE_SIZE,
		getFileSizeLabel,
	};
};