export function buildReplyMentionPrefill(author: string): string {
  return `@${author.trim()} `;
}
