import { normalizeImageUrl } from "@/lib/utils/name";

type UserAvatarProps = {
  imageUrl?: string | null;
  initials: string;
  label: string;
  className: string;
  imageClassName?: string;
  initialsClassName?: string;
};

export function UserAvatar({
  imageUrl,
  initials,
  label,
  className,
  imageClassName = "h-full w-full bg-cover bg-center",
  initialsClassName,
}: UserAvatarProps) {
  const normalizedImageUrl = normalizeImageUrl(imageUrl);

  return (
    <span className={className}>
      {normalizedImageUrl ? (
        <span
          role="img"
          aria-label={label}
          className={imageClassName}
          style={{ backgroundImage: `url(${normalizedImageUrl})` }}
        />
      ) : (
        <span className={initialsClassName}>{initials}</span>
      )}
    </span>
  );
}
