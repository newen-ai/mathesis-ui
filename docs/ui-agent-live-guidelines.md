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
- Do not use hardcoded hex colors in component class names for text/background/border unless there is an explicit approved exception; prefer semantic global tokens/classes from `globals.css`.
- For headings and high-emphasis text, use semantic heading tokens/classes (for example `--heading-primary` / `.mathesis-heading-primary`) so dark mode does not inherit light-only navy values.
- For filled brand buttons, use semantic foreground tokens/classes (for example `--on-brand` / `.mathesis-on-brand`) instead of fixed text hex values.

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

## Current Active UI Directions (2026-08-09)
- Feed post reaction action should remain a single toggle for now, with button text switching between `Valorar` and `Valorado` based on the current user's reaction state.
- Do not introduce a reaction picker in the UI until the backend exposes more than one usable reaction.

## Current Active UI Directions (2026-08-10)
- Main Configuración route for this pass is /account/configuration while visible UI copy remains Spanish.
- The first configuration pass must ship both mobile and desktop together.
- On mobile, the initial Configuración view must match the provided screenshot structure and density before follow-up subpages are implemented.
- On desktop, keep the existing HTML v0.2 settings information architecture and align presentation to the current app shell/tokens.
- Remove the standalone theme toggle from the topbar and mobile drawer; the active dark-mode control belongs inside Configuración for this pass.
- Bloqueados should be implemented as a dedicated page (not an overlay) and visually match the provided screenshot with a two-column desktop layout and an explicit back button next to the page title.
- Password visibility (eye) controls must use the brand gold token in dark mode to maintain contrast and visual consistency.

## Current Active UI Directions (2026-08-12)
- In perfil header, render zero or more badge chips below the display name from backend-provided active badges.
- Badge chip label must be generated from slug: split by underscore, replace underscores with spaces, and capitalize first letter of each word.
- Badge chips must include the integral sign prefix `∫` before the formatted badge label.

## Current Active UI Directions (2026-08-12 Typography)
- Use the shared global type-scale utility classes for product UI text to prevent ad-hoc size inflation: `.text-scale-1`, `.text-scale-2`, `.text-scale-3`, `.text-scale-4`, `.text-scale-5`.
- Prefer these classes for new UI work instead of one-off `text-[...]` values unless a screenshot explicitly requires an exception.
- For page composition by default: helper/meta/chips use `text-scale-1`; action labels and compact buttons use `text-scale-2`; body copy uses `text-scale-3`; section headings use `text-scale-4`; page titles use `text-scale-5`.

## Current Active UI Directions (2026-08-12 Theme Parity)
- Any UI change must be validated in both light and dark themes before signoff.
- New color usage should be introduced in `globals.css` as semantic tokens/classes first, then consumed by pages/components.
- Avoid light-only navy text colors in dark mode paths; use theme-aware semantic heading/text tokens.

## Current Active UI Directions (2026-08-15 Admin Tabs)
- In admin dashboards, tab controls must stay readable in all themes by avoiding white-on-white states.
- Use brand navy/blue styling for inactive tab states.
- Use brand gold styling for active/selected tab states.
- In the Mathesis admin Mensa section, the visible admin list must include only current Mensa Empresarios admins.
- Use blue/navy row backgrounds for the Mensa admin list (avoid white list rows there).
- Provide an "Agregar admin" popup flow with searchable users to grant Mensa Empresarios admin access.
- Prioritize high-contrast text for summary/subtitle/helper copy on admin screens.
- The dedicated Mensa admin URL is `/admin/companies-admin`.
- On `companies-admin`, use tabs for `Solicitudes pendientes` and `Usuarios aprobados`.
- Pending requests in `companies-admin` must use icon-only approve/reject actions (check and cross) with semantic success/danger colors.
- Approved users in `companies-admin` must include an icon action to remove access from the Mensa Empresarios group.
- On `companies-admin`, apply the same blue-background + white-text readability rules used in Mathesis admin lists.
- In Home right sidebar, the Mensa Empresarios CTA must be state-driven:
  - `Solicitar membresía` when user has no badge and no open request.
  - `Cancelar solicitud` (danger/negative color) when user has an open pending request and no badge.
  - `Ir a Mensa Empresarios` when user already has the badge.
- Add a temporary topbar shortcut for ME admins only that links directly to `/admin/companies-admin` for testing.
- Keep the shortcut hidden for users who do not pass the ME admin access check.
