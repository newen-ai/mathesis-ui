import Link from "next/link";
import type { ReactNode } from "react";

// Profile route for any user; the own id opens the member preview of the own profile.
export function userProfileHref(userId: string): string {
  return `/perfil?userId=${encodeURIComponent(userId)}`;
}

type UserProfileLinkProps = {
  userId?: string | null;
  children: ReactNode;
  className?: string;
};

// A user's name rendered as a link to their profile. Without a userId (deleted placeholders, missing data)
// it renders plain text with the same classes. Clicks don't bubble, so it is safe inside clickable cards.
export function UserProfileLink({ userId, children, className = "" }: UserProfileLinkProps) {
  if (!userId) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link
      href={userProfileHref(userId)}
      onClick={(event) => event.stopPropagation()}
      className={`${className} hover:underline focus-visible:underline`.trim()}
    >
      {children}
    </Link>
  );
}
