"use client";

import { useEffect, useState } from "react";
import { navItems, professionalStampLines } from "../../_lib/constants";
import { useHomeFeed } from "../../_lib/hooks/useHomeFeed";
import { useProfessionalProfile } from "../../_lib/hooks/useProfessionalProfile";
import { TopBar } from "../TopBar";
import { ComposerCard } from "./ComposerCard";
import { FeedPostCard } from "./FeedPostCard";
import { ProfileInitializationView } from "./ProfileInitializationView";
import { RightSidebar } from "./RightSidebar";

function MobileBottomNav() {
	return (
		<nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[var(--navy-900)] px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 text-white lg:hidden">
			<ul className="grid grid-cols-5 gap-1 text-center text-[0.8rem] font-medium">
				<li className="text-[var(--brand-500)]">
					<button type="button" className="w-full">
						<span className="mx-auto mb-1 block h-5 w-5 rounded-[4px] border border-current" />
						Feed
					</button>
				</li>
				<li className="text-[var(--text-secondary)]">
					<button type="button" className="w-full">
						<span className="mx-auto mb-1 block h-5 w-5 rounded-full border border-current" />
						Notificaciones
					</button>
				</li>
				<li>
					<button
						type="button"
						className="mx-auto -mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-500)] text-3xl text-[var(--navy-900)]"
					>
						+
					</button>
					<span className="mt-1 block text-[var(--text-secondary)]">Publicar</span>
				</li>
				<li className="text-[var(--text-secondary)]">
					<button type="button" className="w-full">
						<span className="mx-auto mb-1 block h-5 w-5 rounded-[3px] border border-current" />
						Mensajes
					</button>
				</li>
				<li className="text-[var(--text-secondary)]">
					<button type="button" className="w-full">
						<span className="mx-auto mb-1 block h-5 w-5 rounded-full border border-current" />
						Perfil
					</button>
				</li>
			</ul>
		</nav>
	);
}

function FeedSkeleton() {
	return (
		<div className="space-y-4">
			{[1, 2].map((item) => (
				<div key={item} className="animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
					<div className="flex items-center gap-3">
						<div className="h-11 w-11 rounded-full bg-[var(--surface-2)]" />
						<div className="flex-1 space-y-2">
							<div className="h-4 w-36 rounded-full bg-[var(--surface-2)]" />
							<div className="h-3 w-48 rounded-full bg-[var(--surface-2)]" />
						</div>
					</div>
					<div className="mt-4 space-y-2">
						<div className="h-4 w-full rounded-full bg-[var(--surface-2)]" />
						<div className="h-4 w-[92%] rounded-full bg-[var(--surface-2)]" />
						<div className="h-4 w-[76%] rounded-full bg-[var(--surface-2)]" />
					</div>
				</div>
			))}
		</div>
	);
}

export function HomeView() {
	const {
		profile,
		initials,
		needsProfileInitialization,
		isSavingProfile,
		profileSaveError,
		onSaveProfile,
		clearProfileSaveError,
	} = useProfessionalProfile();
	const {
		currentUserId,
		posts,
		isLoading,
		isLoadingMore,
		isMutating,
		error,
		hasMore,
		createPost,
		deletePost,
		toggleReaction,
		loadMore,
	} = useHomeFeed();
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const onPublishPost = async ({
		content,
		pdfFiles,
		imageFiles,
	}: {
		content: string;
		pdfFiles: File[];
		imageFiles: File[];
	}) => {
		return createPost({ content, pdfFiles, imageFiles });
	};

	const onShowComingSoon = () => {
		setToastMessage("Coming soon...");
	};

	useEffect(() => {
		if (!toastMessage) return;
		const timeoutId = window.setTimeout(() => {
			setToastMessage(null);
		}, 2200);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [toastMessage]);

	if (needsProfileInitialization) {
		return (
			<ProfileInitializationView
				isSaving={isSavingProfile}
				saveError={profileSaveError}
				onSave={onSaveProfile}
				onClearSaveError={clearProfileSaveError}
			/>
		);
	}

	return (
		<div className="mathesis-shell min-h-screen pb-24 lg:pb-0">
			<TopBar navItems={navItems} />

			<main className="mx-auto grid w-full max-w-[1370px] gap-5 px-0 py-0 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:px-8 lg:py-4">
				<section className="mathesis-fade-up-delay space-y-4 px-0 md:px-4 lg:px-0">
					<ComposerCard
						initials={initials}
						avatarImageUrl={profile.imagenPerfilUrl}
						isSubmitting={isMutating}
						onPublish={onPublishPost}
					/>

					{error ? (
						<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
							{error}
						</div>
					) : null}

					{isLoading && posts.length === 0 ? <FeedSkeleton /> : null}

					{!isLoading && posts.length === 0 && !error ? (
						<div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center text-[var(--text-secondary)]">
							Todavía no hay publicaciones en el feed.
						</div>
					) : null}

					{posts.map((post) => (
						<FeedPostCard
							key={post.id}
							post={post}
							currentUserId={currentUserId}
							onDelete={deletePost}
							onToggleReaction={toggleReaction}
							onShowComingSoon={onShowComingSoon}
						/>
					))}

					{hasMore ? (
						<div className="flex justify-center pb-2 pt-1">
							<button
								type="button"
								onClick={loadMore}
								disabled={isLoadingMore}
								className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
							>
								{isLoadingMore ? "Cargando..." : "Cargar más"}
							</button>
						</div>
					) : null}
				</section>

				<RightSidebar professionalStampLines={professionalStampLines} />
			</main>

			<MobileBottomNav />

			{toastMessage ? (
				<div className="mathesis-toast fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-lg lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
					{toastMessage}
				</div>
			) : null}
		</div>
	);
}