<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Cross-Repo Live Files (Mandatory)

For every coding task in this workspace, agents must:

1. Read `../mathesis-backend/docs/ui-spec-live.md` before implementation.
2. Read `../mathesis-backend/docs/agent-live-context.md` before implementation.
3. Reconcile requested scope with statuses in `ui-spec-live.md`.
4. If scope/status changed, update `ui-spec-live.md` first.
5. Append a session entry in `agent-live-context.md` after meaningful changes.

Required session entry fields:
- Date/time
- Agent name
- Summary
- Changed files
- Next actions

If these files conflict with task request, document the conflict in `agent-live-context.md` and proceed with explicit scope notes.
<!-- END:nextjs-agent-rules -->
