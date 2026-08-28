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

## Current Active UI Directions (2026-08-16 Ateneo Explore)
- Implement Ateneo flow one screen at a time; pause after each screen for user review before proceeding to the next screen.
- For the explore-groups screen, replace stacked section headers with tabs in this order: `Tus grupos`, `Descubrir`, `Grupos que administrás`.
- Preserve existing repo color tokens and spacing language while matching the screenshot layout for both desktop and mobile.

## Current Active UI Directions (2026-08-17 Ateneo Topic Detail)
- Keep the shared 3-column Ateneo shell intact and only swap the middle content when the user opens a topic.
- For the topic detail view, ignore the highlight banner and badge at the top of the feed; render only the post content block in the middle column.
- Use the feed reaction pattern and copy for the main action row, with the bookmark/save control triggering a toast with the exact message `Coming soon`.
- Keep comment/reaction affordances lightweight and platform-consistent until real comment/back-end data exists.

## Current Active UI Directions (2026-08-19 Ateneo Topic/Create Polish)
- In the Ateneo create-group form, render `Grupo oficial` as visibly disabled and add an information icon on the right with a hover tooltip that says `Coming soon`.
- In the Ateneo topic detail view, add a three-dotted overflow button on the post itself with a `Denunciar` action.
- The `Denunciar` action must include a flag icon and use the danger red color for both icon and text.
- In the Ateneo new-topic form, the first field label should read `Grupo`.
- In topic comments, clicking `Responder` should open the input prefilled with `@<autor> ` so replies can target and notify the addressed user.

## Current Active UI Directions (2026-08-19 Ateneo Left Rail)
- Replace the Ateneo left-rail placeholder with the actual group list content from `/ateneo`.
- The first fixed left-rail option must be `Feed`.
- The `Fijado` section must show a `Coming soon` label beneath its title.
- Limit `Administrás`, `Tus grupos`, and `Recomendados para vos` to three visible groups by default, then reveal up to five more with `Ver más`; if more groups remain after that, show `Ver todos` for a future redirect.
- Add four bottom shortcut buttons; `Guardado` and `Salud del grupo` must look disabled and show `Coming soon` on hover.

## Current Active UI Directions (2026-08-19 Ateneo Feed Page)
- Add a dedicated `/ateneo` 3-column feed page that reuses the same left and right rails as the group/topic views.
- The feed middle column should mix topics from groups the user is already in with some recommended topics.
- The left-rail `Feed` shortcut should navigate to `/ateneo`.
- Keep `/ateneo/feed` as a redirect to `/ateneo` for compatibility.

## Current Active UI Directions (2026-08-19 Ateneo Groups Page)
- Move the explore-groups screen to `/ateneo/groups`.
- Preserve the existing explore-groups layout, search, tabs, and left-rail grouping behavior on that page.

## Current Active UI Directions (2026-08-21 Directorio Mensa Empresarios)
- Add a topbar entry called `Directorio` that routes to `/directorio` and stays aligned with the e-commerce/business section of the app shell.
- The directory page should mirror the provided mockup: a community header with the Mensa Empresarios badge tone, a `Recién lanzado` banner, and enterprise cards showing founder, sector tag, description, city/size/website, and a CTA link at the lower right.
- The top-of-page `Solicitar membresía Empresarios` action must be visually present but disabled for now; the hover/focus tooltip text must read `Próximamente`.
- Use the existing theme tokens and card styling conventions instead of introducing ad-hoc contrast values.
- Keep the directory content representative but static for this pass until the backend exposes a dedicated verified-directory endpoint.

## Current Active UI Directions (2026-08-21 Global Footer)
- The `Powered by Newen.Solutions` footer must be implemented once in the root app shell and inherited by all routes, including auth/public and platform screens.
- The footer must remain fixed to the viewport bottom so it stays visible while scrolling.
- Avoid page-level footer duplication; new pages should not require any local footer markup.
- Keep footer styling theme-aware using semantic tokens from `globals.css` and preserve light/dark readability.

## Current Active UI Directions (2026-08-27 Welcome Onboarding)
- Registration remains the only place where new accounts collect required `Nombre` and `Apellido`; `Segundo nombre` is optional.
- After successful email confirmation, the user should enter a one-time authenticated welcome flow instead of returning directly to `/login`.
- Welcome page 1 should follow the first provided screenshot as a desktop-first composition, while page 2 should follow the second and third screenshots as one continuous scrollable page.
- The first welcome CTA must read `¿Qué viene a futuro?`.
- The final welcome CTA must route the user to `/ateneo`.
- Keep both welcome pages theme-aware using semantic tokens from `globals.css`; preserve brand navy hero areas and gold CTA emphasis.
## Current Active UI Directions (2026-08-27 Digital Credential)
- Add a new entry labeled `Credencial digital` in the profile/account menu and keep the route at `/perfil/credencial`.
- Render the credential card with a fixed, square-ish proportion by keeping height as the anchor and deriving width from the correct aspect ratio.
- Remove the ID block, the `Compartir` button, and the `Descargar` button from the credential card.
- Show a QR-style square on the front panel as a visual placeholder until the backend defines the exact verification payload format.
- Hide the online verification copy from the back card and replace it with the user’s current badge grid.
- Keep the UI visualized as front/back flip card for the mockup stage; backend adaptation for QR payload generation and credential verification remains a follow-up task.

## Current Active UI Directions (2026-08-27 Bug Reports)
- The bug report entry point must be a floating round button anchored at the bottom-right of authenticated platform pages.
- Opening and closing the bug report panel must preserve the current draft; only successful submit or an explicit `Limpiar` action may clear it.
- Persist the bug report draft in localStorage so users can reload the page and continue writing.
- Include title, description, automatic current-URL capture, screenshot attachments, and short reporting guidance focused on reproduction steps and expected vs actual behavior.
- Gate the widget behind an environment-level public flag so it can be enabled only in selected environments.
- When open, the bug report UI should behave as a centered modal with a dimmed backdrop that blocks interaction with the underlying page and closes on outside click.
- The detected URL should remain internal to the draft and submit payload; do not render it as a visible user-facing field.
- Users should be able to attach screenshots by pasting from the clipboard with `Ctrl+V` or `Cmd+V`, not only by file selection.
- The floating bug report button should be draggable, but only snap to the four allowed corners: top-left, top-right, bottom-left, and bottom-right.
- When frontend code needs to translate backend or service error messages, do not hardcode ad-hoc message maps inside components; route them through `src/lib/i18n/*` helpers and locale JSON so future agents extend the same translation path.
