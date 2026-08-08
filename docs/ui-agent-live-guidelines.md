# UI Agent Live Guidelines

Purpose: Define persistent frontend UI direction rules that every agent must read before implementing or modifying UI.

## Mandatory Defaults
- Match existing auth page scale first. Do not enlarge typography unless a screenshot explicitly requires it.
- Mobile-first sizing baseline for auth forms:
  - Headline: large display only in top hero/header section.
  - Body/help text: small-to-medium readable text, avoid oversized paragraphs.
  - Labels: compact (`text-xs` or `text-sm`).
  - Inputs: compact-to-regular height (`py-2.5` to `py-3`), avoid oversized field text.
  - Primary button text: compact (`text-sm` to `text-base`) unless screenshot explicitly shows larger.
- Keep spacing rhythm consistent with login page.
- Keep white content blocks clean and avoid unnecessary decorative elements in mobile form areas.

## Color and Theme Rules
- Use shared theme tokens (`var(--...)`) for light/dark parity.
- Preserve brand colors:
  - Navy surfaces for auth hero/header areas.
  - Gold accent for call-to-action and section separators.
- Ensure contrast stays readable in both light and dark themes.

## Shared Asset Rules
- Do not redefine `basePath` + logo path constants in each page/component.
- Reuse shared exports from `src/lib/assets.ts` for brand image paths and base-path composition.
- When adding new globally reused asset paths, extend `src/lib/assets.ts` first.

## Shared Logic Rules
- Before creating helper functions, search and reuse existing utilities first.
- Centralize repeated frontend logic under `src/lib/utils/`.
- If the same logic appears in 2+ files (e.g., normalization, masking, query-param parsing), extract it to a shared utility module.

## Reusable Function Lookup (Check First)
- `src/lib/assets.ts`: base path composition and brand logo sources.
- `src/lib/utils/email.ts`: email normalization, query-param resolution, and masked email display helpers.
- `src/lib/utils/password.ts`: password strength evaluation and policy checks.
- `src/lib/api/`: API clients and shared request/response behavior.
- `src/lib/auth/`: reusable auth-related client hooks/behavior.

## Interaction Rules
- Back/navigation text in auth mobile headers must be actionable links/buttons, never static labels.
- Form validation messaging should stay concise and consistent with existing auth pages.

## Spanish Copy Rules
- When UI copy is in Spanish, always use correct orthography: tildes and "ñ" are mandatory.
- Do not ship fallback spellings like "contrasena", "Atras", or "esta" when the correct forms are "contraseña", "Atrás", and "está".
- Apply the same rule to labels, helper text, buttons, headings, and toasts.

## Update Protocol
- When a user gives new UI direction (sizes, spacing, colors, copy style), append/update this file first.
- Then implement code changes.
- Mention this file in session logs when its rules are updated.

## Current Active UI Directions (2026-08-07)
- Forgot-password pages should visually align with login page sizing system.
- Implement one page at a time; apply fixes before moving to next page.
- Each page must be acceptable in both light and dark modes before signoff.
- Mobile forgot-password top header label should be `Atrás` and navigate to `/login`.
- Avoid oversized mobile text on forgot-password pages; keep form controls and CTA sizes near login scale.
- Spanish UI copy must preserve accents and "ñ" consistently.
- Reuse shared base-path/logo helpers instead of duplicating asset path logic.
- Reuse shared utility modules (`src/lib/utils/*`) before introducing page-local helper duplicates.
- When only mobile screenshot exists for an auth page, implement mobile to match screenshot and infer desktop from existing `/login` and forgot-password desktop patterns.
- Reset-password header title `Creá una nueva contraseña` should be `1.35rem`.
- Reset-password header should not show the `Restablecer acceso` eyebrow text.
- Reset-password semaphore criteria must follow:
  - Weak: only left bar red.
  - Normal: left and middle bars yellow.
  - Strong: all three bars green.
- After successful reset-password submit, show an inline success state first, then auto-redirect to `/login` after 2 seconds, with a manual "Ir ahora a iniciar sesión" action.

## Current Active UI Directions (2026-08-08)
- New profile menu pass is desktop-first and must be opened from the topbar user-initial trigger (not a persistent left sidebar).
- Match provided screenshot hierarchy for menu structure and copy where feasible while preserving existing theme tokens.
- Keep mobile menu behavior unchanged for this pass; mobile redesign will be implemented later.
- Menu interactions for this pass: keep `Cerrar sesión` fully functional; keep profile and any existing route-backed entries navigable; keep non-routed entries visible with hover/click affordances but no navigation.
