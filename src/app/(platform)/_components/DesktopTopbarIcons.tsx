import type { ReactNode } from "react";

type DesktopTopbarIconProps = {
  className?: string;
};

type DesktopTopbarIconName =
  | "feed"
  | "ateneo"
  | "directory"
  | "message"
  | "bell"
  | "admin"
  | "nexum"
  | "agora";

function IconFrame({ className, children }: DesktopTopbarIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function FeedIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
    </IconFrame>
  );
}

function MessageIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <path d="M20 5H4a1 1 0 0 0-1 1v11l3.2-2.6H20a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
    </IconFrame>
  );
}

function AteneoIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <circle cx="8.5" cy="9" r="2.1" />
      <circle cx="15.5" cy="10.5" r="2.1" />
      <path d="M4.5 18.5a4 4 0 0 1 8 0" />
      <path d="M11.5 18.5a4 4 0 0 1 8 0" />
    </IconFrame>
  );
}

function BellIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </IconFrame>
  );
}

function DirectoryIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <path d="M6 20V7.5A1.5 1.5 0 0 1 7.5 6H10v14H6Z" />
      <path d="M10 6h7.5A1.5 1.5 0 0 1 19 7.5V20h-9V6Z" />
      <path d="M10 10h9M10 14h9M13 6v14" />
    </IconFrame>
  );
}

function AdminIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <path d="M14.8 10.2a2.6 2.6 0 1 0-3.7-3.7l-5.6 5.6v4h4l5.3-5.3" />
      <path d="m12 8 3.7 3.7" />
    </IconFrame>
  );
}

function NexumIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <path d="M8 4.8h8" />
      <path d="m9.2 4.8 1 4.2v4.1A3.7 3.7 0 0 1 6.5 16.8h0" />
      <path d="m14.8 4.8-1 4.2v4.1a3.7 3.7 0 0 0 3.7 3.7h0" />
      <path d="M6.5 16.8h11" />
    </IconFrame>
  );
}

function AgoraIcon({ className }: DesktopTopbarIconProps) {
  return (
    <IconFrame className={className}>
      <ellipse cx="9" cy="12" rx="4.2" ry="4.7" />
      <ellipse cx="15" cy="12" rx="4.2" ry="4.7" />
    </IconFrame>
  );
}

export function DesktopTopbarIcon({
  name,
  className = "h-[1.15rem] w-[1.15rem]",
}: DesktopTopbarIconProps & { name: DesktopTopbarIconName }) {
  if (name === "feed") {
    return <FeedIcon className={className} />;
  }

  if (name === "message") {
    return <MessageIcon className={className} />;
  }

  if (name === "ateneo") {
    return <AteneoIcon className={className} />;
  }

  if (name === "bell") {
    return <BellIcon className={className} />;
  }

  if (name === "directory") {
    return <DirectoryIcon className={className} />;
  }

  if (name === "nexum") {
    return <NexumIcon className={className} />;
  }

  if (name === "agora") {
    return <AgoraIcon className={className} />;
  }

  return <AdminIcon className={className} />;
}

export type { DesktopTopbarIconName };