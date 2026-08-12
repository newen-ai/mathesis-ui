export function formatBadgeSlug(slug: string): string {
  return slug
    .split("_")
    .filter((word) => word.trim().length > 0)
    .map((word) => word[0]?.toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
