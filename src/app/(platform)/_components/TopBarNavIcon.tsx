type TopBarNavIconProps = {
  icon: string;
};

export function TopBarNavIcon({ icon }: TopBarNavIconProps) {
  const className = "h-5 w-5";

  if (icon === "grid") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="6" rx="1.5" />
        <rect x="4" y="14" width="16" height="6" rx="1.5" />
      </svg>
    );
  }

  if (icon === "chat") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7A2.5 2.5 0 0 1 17.5 16h-8L5 20v-4H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" />
      </svg>
    );
  }

  if (icon === "groups") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8.5" cy="9" r="2.2" />
        <circle cx="15.5" cy="10.5" r="2.2" />
        <path d="M4.5 18.5a4 4 0 0 1 8 0" />
        <path d="M11.5 18.5a4 4 0 0 1 8 0" />
      </svg>
    );
  }

  if (icon === "bell") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 17h8m-5.5 3h3" />
        <path d="M6.5 16h11l-1.2-1.9a4 4 0 0 1-.55-2.08v-1.3A4.3 4.3 0 0 0 12 6.5a4.3 4.3 0 0 0-3.75 4.23v1.3c0 .75-.2 1.5-.58 2.15L6.5 16Z" />
      </svg>
    );
  }

  if (icon === "user") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }

  if (icon === "search") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="6.3" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (icon === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5.5" width="16" height="14.5" rx="2" />
        <path d="M8 3.5v4m8-4v4M4 10.5h16" />
      </svg>
    );
  }

  if (icon === "settings") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.8v2.1M12 18.1v2.1M20.2 12h-2.1M5.9 12H3.8M18 6l-1.5 1.5M7.5 16.5 6 18M18 18l-1.5-1.5M7.5 7.5 6 6" />
      </svg>
    );
  }

  if (icon === "building") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20V7a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v13M14 20h6V11.5a1 1 0 0 0-1-1h-5" />
        <path d="M8 10h2m-2 3h2m-2 3h2m6-2h2m-2 3h2" />
      </svg>
    );
  }

  if (icon === "briefcase") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="7" width="16" height="12" rx="2" />
        <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
        <path d="M4 12h16" />
      </svg>
    );
  }

  if (icon === "puzzle") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8.3 4h3.2a1.4 1.4 0 0 1 1.4 1.4V7a1.6 1.6 0 1 0 3.2 0V5.4A1.4 1.4 0 0 1 17.5 4h2.2v4.2a1.6 1.6 0 1 1 0 3.2V16h-4.1a1.6 1.6 0 1 0 0 3.2h-1.1A1.5 1.5 0 0 1 13 20.7V16H8.3v-4.1a1.6 1.6 0 1 0-3.2 0V9.2A1.5 1.5 0 0 1 6.6 7.7H8.3V4Z" />
      </svg>
    );
  }

  if (icon === "users-soft") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="9" cy="9" r="2.5" />
        <circle cx="15.5" cy="10.8" r="2.2" />
        <path d="M4.8 18.6A4.2 4.2 0 0 1 9 14.4a4.2 4.2 0 0 1 4.2 4.2" />
        <path d="M12.8 18.6a3.3 3.3 0 0 1 6.2 0" />
      </svg>
    );
  }

  if (icon === "cup") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 6h10v3.6A5.4 5.4 0 0 1 10.6 15H9.4A5.4 5.4 0 0 1 4 9.6V6h2" />
        <path d="M16 7h1.4a2.6 2.6 0 1 1 0 5.2H16" />
        <path d="M7 19h8" />
      </svg>
    );
  }

  if (icon === "mark") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M13.8 4.5c-3.8 0-6.2 2.5-6.2 5.7 0 2.9 1.9 4.9 4.7 4.9h.9c1.7 0 2.8 1 2.8 2.4 0 1.4-.9 2-2.2 2-1.4 0-2.5-.7-3.2-2" />
      </svg>
    );
  }

  if (icon === "doc") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3.8h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1Z" />
        <path d="M14 3.8v4h4" />
      </svg>
    );
  }

  if (icon === "wave") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 18c1.2 0 2-1.3 2-3.1 0-2.8 1.1-6.8 3.4-9.4" />
      </svg>
    );
  }

  if (icon === "ban") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="m7 7 10 10" />
      </svg>
    );
  }

  if (icon === "message") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4.5 6.8A1.8 1.8 0 0 1 6.3 5h11.4a1.8 1.8 0 0 1 1.8 1.8v7.1a1.8 1.8 0 0 1-1.8 1.8H8.5L5 19v-3.3h-1a1.8 1.8 0 0 1-1.8-1.8V6.8a1.8 1.8 0 0 1 1.8-1.8" />
      </svg>
    );
  }

  if (icon === "badge") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="5" width="14" height="14" rx="2.5" />
        <path d="M9 10h6M9 14h6M12 9v6" />
      </svg>
    );
  }

  if (icon === "logout") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M10 6H5.8A1.8 1.8 0 0 0 4 7.8v8.4A1.8 1.8 0 0 0 5.8 18H10" />
        <path d="M14 8.5 18 12l-4 3.5" />
        <path d="M9 12h9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4m0 3h.01" />
    </svg>
  );
}
