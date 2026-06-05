"use client";

import {
  catchyLines,
  navItems,
  professionalStampLines,
} from "../../_lib/constants";
import { useHomeFeed } from "../../_lib/hooks/useHomeFeed";
import { useProfessionalProfile } from "../../_lib/hooks/useProfessionalProfile";
import { TopBar } from "../TopBar";
import { CatchyPhrasesBanner } from "./CatchyPhrasesBanner";
import { ComposerCard } from "./ComposerCard";
import { FeedPostCard } from "./FeedPostCard";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";

export function HomeView() {
  const {
    activeProfileId,
    profile,
    profileCompletion,
    userDisplayName,
    initials,
  } = useProfessionalProfile();
  const { feedPosts, customPostIds, addPost, updatePost, deletePost } =
    useHomeFeed(activeProfileId);

  const onPublishPost = (content: string) => {
    addPost({
      autor: userDisplayName,
      cargo: profile.puesto || "Miembro de Mensa Argentina",
      contenido: content,
    });
  };

  return (
    <div className="linkedin-shell min-h-screen">
      <TopBar navItems={navItems} />
      <CatchyPhrasesBanner lines={catchyLines} />

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)_290px] lg:items-start lg:px-8">
        <LeftSidebar
          initials={initials}
          userDisplayName={userDisplayName}
          puesto={profile.puesto}
          empresaActual={profile.empresaActual}
          profileCompletion={profileCompletion}
        />

        <section className="mensa-fade-up-delay space-y-4">
          <ComposerCard initials={initials} onPublish={onPublishPost} />

          {feedPosts.map((post) => (
            (() => {
              const canManage = customPostIds.has(post.id);
              const safeTag =
                !canManage && post.etiqueta === "Tu publicacion"
                  ? undefined
                  : post.etiqueta;

              return (
            <FeedPostCard
              key={post.id}
              autor={post.autor}
              cargo={post.cargo}
              tiempo={post.tiempo}
              etiqueta={safeTag}
              contenido={post.contenido}
              id={post.id}
              canManage={canManage}
              onEdit={updatePost}
              onDelete={deletePost}
            />
              );
            })()
          ))}
        </section>

        <RightSidebar professionalStampLines={professionalStampLines} />
      </main>
    </div>
  );
}
