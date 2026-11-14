<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Cross-Repo Live Files (Mandatory)

For every coding task in this workspace, agents must:

1. Read `../sophium-backend/docs/ui-spec-live.md` before implementation.
2. Read `../sophium-backend/docs/agent-live-context.md` before implementation.
3. Read `docs/ui-agent-live-guidelines.md` before implementation.
4. Reconcile requested scope with statuses in `ui-spec-live.md`.
5. If scope/status changed, update `ui-spec-live.md` first.
6. Append a session entry in `agent-live-context.md` after meaningful changes.
7. If new UI direction is provided (font size, spacing, color usage, interaction rules), update `docs/ui-agent-live-guidelines.md` before or alongside UI code changes.
8. Validate UI changes in both light and dark themes; prefer semantic theme tokens/classes from `globals.css` over hardcoded color values.

Required session entry fields:
- Date/time
- Agent name
- Summary
- Changed files
- Next actions

If these files conflict with task request, document the conflict in `agent-live-context.md` and proceed with explicit scope notes.

# Command Autonomy
- Agents should run non-destructive verification commands automatically after meaningful edits, without asking for conversational confirmation first.
- Pre-approved verification commands include: npm run lint, npm run typecheck, npm run build, npm test.
- Agents should still avoid destructive or state-changing commands unless explicitly requested (for example: database reset, hard git reset, force push).
<!-- END:nextjs-agent-rules -->

## Commit Message Suggestions (Mandatory)
- When finishing a task, end the final reply with a suggested commit message for each repo that has changes (backend, ui, admin), one per repo, labeled by repo name.
- Format: Conventional Commits, single line, lowercase, short (for example `fix: profile edit drafts`, `feat: ...`, `chore: ...`).
- In the backend repo, when the only changes are the agent docs (`docs/agent-live-context.md`, `docs/ui-spec-live.md`, `docs/agent-log/`), use the `log-ai:` prefix (for example `log-ai: profile edit split`).
- Put each commit message in its own fenced code block (```), preceded by the repo name in bold, so the chat UI shows a copy button per message. Do not group several messages in one block.
- Only suggest; do not commit unless explicitly asked.

## Backend/UI Compatibility (Mandatory)
- Backend, UI and admin deploy independently (backend via server deploy, UI/admin via Vercel), so for a short window old and new versions run together. Deploy order is backend first, then UI/admin.
- Every backend change must keep working with the UI/admin currently deployed. Adding endpoints, optional fields or new enum values is compatible; renaming or removing endpoints, fields or enum values, making a field required, or changing a response shape is breaking.
- Every migration must keep working with the backend code currently deployed (code rollback does not roll back the database). Renames/drops of columns, tables or enum values are breaking.
- When a change is breaking, say so explicitly in the final reply (what breaks, for which client, and for how long), and propose the two-step alternative: first add the new shape while still accepting the old one, then remove the old one in a later deploy.
