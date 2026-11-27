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
- For headings and high-emphasis text, use semantic heading tokens/classes (for example `--heading-primary` / `.sophium-heading-primary`) so dark mode does not inherit light-only navy values.
- For filled brand buttons, use semantic foreground tokens/classes (for example `--on-brand` / `.sophium-on-brand`) instead of fixed text hex values.

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
- In auth and other one-shot flows, avoid using translation functions inside side-effect hooks (`useEffect`) that trigger API calls; keep effects keyed to business inputs (for example tokens/ids) and derive localized copy at render time from status state.

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
- Perfil editing split (2026-11-14): the `Acerca de` card edit mode shows only the about textarea; profile base data (name, surname, birth date, nationality, headline, current company, location) is edited from an `Editar perfil` header button (own profile) that opens a modal. Edit drafts must be seeded from the latest loaded profile when editing opens, never at component mount.
- Perfil edit overlays (2026-11-14): all perfil section edits use `ProfileEditModal` (portal, z above mobile footer, bottom sheet on mobile). Cards stay read-only. Long content collapses with `ProfileCollapsibleText` (toggle only on real overflow) and `ProfileShowAllToggle` for long lists (3 items for experience/education, 12 chips for interests).
- Badge chip label must be generated from slug: split by underscore, replace underscores with spaces, and capitalize first letter of each word.
- Badge chips must include the integral sign prefix `∫` before the formatted badge label, except `Mensa Argentina`, which uses the shared logo asset with the same visual size as the previous prefix glyph.

## Current Active UI Directions (2026-08-12 Typography)
- Use the shared global type-scale utility classes for product UI text to prevent ad-hoc size inflation: `.text-scale-1`, `.text-scale-2`, `.text-scale-3`, `.text-scale-4`, `.text-scale-5`.
- Prefer these classes for new UI work instead of one-off `text-[...]` values unless a screenshot explicitly requires an exception.
- Base size (2026-11-14): root `html` font-size is `16px` (was `14px`, then `15px`). To resize the whole UI proportionally, change only this root value; do not bump individual type-scale tokens. Never use px font sizes (`text-[Npx]`, `font-size: Npx`) outside this root rule; use rem so everything follows the base.
- Spanish copy (2026-11-23): all Spanish UI text uses full accents and ñ, opening `¿`/`¡`, and Rioplatense voseo, matching the rest of the app ("tenés", "querés", "Seleccioná", "Escribí", "Intentá"), never tuteo ("tienes", "Selecciona"). Use `←`/`→` instead of `<-`/`->` in visible labels.
- Font sizes (2026-11-23): every page title (`h1`) inside the platform uses `text-scale-5` and every section/card title uses `text-scale-4`, including account pages and perfil. Larger one-off sizes are allowed only in hero/brand panels (auth left panels, bienvenida, digital credential card). Readable text never goes below `text-scale-1` (0.78rem). Perfil follows the global scale too: item title `text-scale-3`, meta/description/toggles `text-scale-2`, chips/pills `text-scale-1`, about body `text-scale-3`. Sub-0.78rem sizes are only for counters/badges inside fixed-size shapes.
- Font families (2026-11-23): only two. Titles/display text use `font-display` (Spectral); everything else inherits Sora from `body`. Never use ad-hoc families (`font-[family-name:Georgia]`, `Arial`, `var(--font-spectral)` inline). Spectral loads 400/500/600/700 + italic.
- For page composition by default: helper/meta/chips use `text-scale-1`; action labels and compact buttons use `text-scale-2`; body copy uses `text-scale-3`; section headings use `text-scale-4`; page titles use `text-scale-5`.

## Current Active UI Directions (2026-08-12 Theme Parity)
- Any UI change must be validated in both light and dark themes before signoff.
- New color usage should be introduced in `globals.css` as semantic tokens/classes first, then consumed by pages/components.
- Avoid light-only navy text colors in dark mode paths; use theme-aware semantic heading/text tokens.

## Current Active UI Directions (2026-08-15 Admin Tabs)
- In admin dashboards, tab controls must stay readable in all themes by avoiding white-on-white states.
- Use brand navy/blue styling for inactive tab states.
- Use brand gold styling for active/selected tab states.
- In the Sophium admin Mensa section, the visible admin list must include only current Sophium Empresarios admins.
- Use blue/navy row backgrounds for the Mensa admin list (avoid white list rows there).
- Provide an "Agregar admin" popup flow with searchable users to grant Sophium Empresarios admin access.
- Prioritize high-contrast text for summary/subtitle/helper copy on admin screens.
- The dedicated Mensa admin URL is `/admin/companies-admin`.
- On `companies-admin`, use tabs for `Solicitudes pendientes` and `Usuarios aprobados`.
- Pending requests in `companies-admin` must use icon-only approve/reject actions (check and cross) with semantic success/danger colors.
- Approved users in `companies-admin` must include an icon action to remove access from the Sophium Empresarios group.
- On `companies-admin`, apply the same blue-background + white-text readability rules used in Sophium admin lists.
- In Home right sidebar, the Sophium Empresarios CTA must be state-driven:
  - `Solicitar membresía` when user has no badge and no open request.
  - `Cancelar solicitud` (danger/negative color) when user has an open pending request and no badge.
  - `Ir a Sophium Empresarios` when user already has the badge.
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

## Current Active UI Directions (2026-08-21 Directorio Sophium Empresarios)
- Add a topbar entry called `Directorio` that routes to `/directorio` and stays aligned with the e-commerce/business section of the app shell.
- The directory page should mirror the provided mockup: a community header with the Sophium Empresarios badge tone, a `Recién lanzado` banner, and enterprise cards showing founder, sector tag, description, city/size/website, and a CTA link at the lower right.
- The top-of-page membership CTA must be state-driven from Sophium Empresarios membership state:
  - If user has no badge and no open request: show enabled `Solicitar membresía Empresarios` action.
  - If user has no badge and has open request: show enabled `Cancelar solicitud` action.
  - If user already has Sophium Empresarios badge: hide this CTA.
- Use the existing theme tokens and card styling conventions instead of introducing ad-hoc contrast values.
- Keep the directory content representative but static for this pass until the backend exposes a dedicated verified-directory endpoint.

## Current Active UI Directions (2026-10-20 Global Footer)
- The legacy `Powered by Newen.Solutions` footer has been removed from product scope.
- Do not add the powered footer back to root layouts or individual pages unless product direction changes again.

## Current Active UI Directions (2026-08-27 Welcome Onboarding)
- Registration remains the only place where new accounts collect required `Nombre` and `Apellido`; `Segundo nombre` is optional.
- After successful email confirmation, the user should enter a one-time authenticated welcome flow instead of returning directly to `/login`.
- Welcome page 1 should follow the first provided screenshot as a desktop-first composition, while page 2 should follow the second and third screenshots as one continuous scrollable page.
- The first welcome CTA must read `¿Qué viene a futuro?`.
- The final welcome CTA must route the user to `/ateneo`.
- Keep both welcome pages theme-aware using semantic tokens from `globals.css`; preserve brand navy hero areas and gold CTA emphasis.
- On `/bienvenida/futuro`, keep the final `Empezar a explorar` CTA visually compact on mobile (avoid oversized height/text) and keep `PRÓXIMAMENTE` badges in feature cards smaller than primary action buttons.
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
- Follow-up direction (2026-09-13): when `NEXT_PUBLIC_ENABLE_BUG_REPORTS=true`, show the bug report trigger across app screens; keep bottom-right as the default placement on all routes, and use top-right only on mobile `/mensajes`.

## Current Active UI Directions (2026-09-05 Mobile Signed-In Footer)
- Redesign and standardize the mobile footer for all signed-in routes under `(platform)` with one shared implementation.
- Footer taps for `Nexum` and `Agora` must open modal-style overlays with a dim backdrop, matching the provided references.
- Footer center CTA `Crear` must open the topic-creation flow without preselecting a group.
- `Acertijos` in the Agora overlay remains disabled and visibly labeled `PRÓXIMAMENTE`.
- Keep `Mensajes` and `Perfil` as direct route navigation items.
- Preserve light/dark parity and prefer semantic theme tokens from `globals.css` for all new footer and overlay styles.

## Current Active UI Directions (2026-09-05 Ateneo New Topic Group Picker)
- In `/ateneo/new-topic` mobile flow, the group chooser should use a centered overlay picker with a dim backdrop instead of relying only on the native compact select dropdown.
- The mobile picker must support a larger visual format with scrollable options and explicit close affordances.
- When the entry source is the footer and there is no fixed group context, keep `Seleccioná un grupo` selected by default until the user chooses an option.
- For group-scoped routes (`/ateneo/groups/[groupId]/new-topic`), keep the group field fixed/read-only and skip the picker.

## Current Active UI Directions (2026-09-10 Ateneo Overflow Menu)
- In Ateneo topic overflow menus, `Denunciar publicación` must always use danger red styling for both icon and text.
- Overflow menus should close when clicking outside the menu/trigger area.

## Current Active UI Directions (2026-09-13 Mensajes Mobile Header Typography)
- In `/mensajes` mobile conversation detail mode, reduce the fixed header text scale.
- Conversation title should use a smaller heading size than current `text-2xl`.
- Members/role secondary line should use compact helper sizing (`text-xs`) for tighter vertical density.
- Follow-up refinement: shrink one more step (`text-lg` title scale and sub-`text-xs` secondary line density) while preserving readability.
- Follow-up refinement 2: shrink again from current values to approximately `15px` for title and `10px` for members/role line.
- Follow-up refinement 3: reduce mobile conversation header container padding (`px`/`py`) for tighter title block spacing.
- Overflow menus should close when pressing `Esc`.

## Current Active UI Directions (2026-09-10 Ateneo New Topic Image Preview)
- In the Ateneo new-topic composer, image attachments must render as inline previews before publish.
- Clicking any previewed image must open a centered modal carousel over a dim backdrop.
- The image preview modal must close when users click outside the image container.
- The modal should support iterating across all attached images in the current draft.
- Attachment previews in the composer must include remove controls for both images and PDFs.
- On mobile, the image preview modal should support swipe-left and swipe-right navigation when multiple images are present.
- The opened image preview modal should expose a trash-icon action that removes the currently displayed image from the draft.

## Current Active UI Directions (2026-11-02 Ateneo Group Picker Polish)
- In Ateneo new-topic group selectors, keep trigger content vertically centered and align chevron icons inside a dedicated circular affordance.
- Group picker options must present two text levels (group name + permission hint) and clear selected state contrast.
- For groups where topic creation is restricted, show a warning indicator with hover tooltip explaining the permission constraint.

## Current Active UI Directions (2026-11-04 Auth Password Inputs)
- Shared password inputs with visibility toggles must guarantee full-width field rendering so the toggle never renders outside the input container.
- Auth error text in dark mode must use the semantic danger token with sufficient contrast (avoid fixed Tailwind reds like `text-red-600` on dark surfaces).

## Current Active UI Directions (2026-09-10 Link Preview Images)
- Link preview images should display fully (no cropping) using centered contain-fit behavior.
- Link preview image areas should use a neutral dark/gray backdrop to fill side gaps created by aspect-ratio differences.

## Current Active UI Directions (2026-09-10 Published Topic Attachment Images)
- In already published Ateneo topics, image attachments should render as visual previews (not filename-only rows).
- Published-topic image attachments should use centered contain-fit rendering with neutral dark/gray side fill when aspect ratios do not match the preview canvas.
- Clicking a published-topic image attachment preview should open an in-app carousel modal (overlay + outside click close) instead of triggering direct file download/navigation.
- Published-topic image previews should be loaded through authenticated API fetch (blob URL) so private attachment endpoints still render correctly in UI previews.
- In published topics, image attachments should render as a combined mosaic block (Facebook-style feel), hiding filename rows for images.
- Mosaic behavior should support 1-4 image layouts with varied tile proportions and a `+N` overlay on the last tile when more than four images exist.
- Keep published image mosaics compact by default (avoid square blocks that feel too tall); use responsive fixed-height blocks that preserve readability.

## Current Active UI Directions (2026-09-12 Mensajes Group Header)
- In group chats under `/mensajes`, header secondary text should prioritize participant names over count-only copy.
- Because names can be long, show a single-line truncated preview with ellipsis in the header summary.
- Clicking/tapping the group-chat header should open an overlay modal listing full members with profile images.
- Keep this modal theme-aware and readable in both light and dark themes.

## Current Active UI Directions (2026-09-12 Mensajes Navigation)
- In `/mensajes` on mobile, use a master-detail flow where the conversation list and active detail are separate panes with horizontal slide transition (list -> detail).
- Entering a conversation should happen by tapping/clicking the conversation row itself, and the detail pane must provide a consistent back action to return to the list.
- Apply the same contact-row interaction in the new-conversation composer on desktop and mobile: selecting recipients is triggered by clicking the contact row, without dedicated plus-icon controls.
- Replace visible `Nuevo mensaje` entry/heading copy with `Nueva conversación`.

## Current Active UI Directions (2026-09-12 Mensajes Detail Layout)
- In `/mensajes` conversation-detail mode, hide the module hero/title block (`Mensajes` + subtitle) so chat content starts higher on screen.
- Keep the composer bar pinned at the bottom of the viewport area and, on mobile, offset it to remain visible above the fixed mobile navbar.
- For app-like messaging behavior (WhatsApp/Telegram style), the composer must sit flush at the bottom of the chat area without extra artificial gap below it.
- Prefer a fixed mobile composer bar positioned directly above the platform mobile navbar, with conversation area spacing so content is not covered.
- In mobile detail mode, keep the gap between the latest message and the composer equal to the standard message-to-message vertical spacing.
- In mobile detail mode, keep the conversation header fixed under the global topbar while scrolling so back navigation and members access stay always visible.
- In mobile detail mode, fixed conversation header and composer bars should span full width and entering a conversation should land on the latest messages (bottom) immediately.
- In mobile `/mensajes`, the conversation shell should be full-bleed (no extra outer side margins/gutters around the main conversation container).
- On `/mensajes`, place the floating `Reportar bug` trigger near the top-right conversation area so it does not cover the latest messages near the composer.
- In `/mensajes` detail viewport, keep conversation `padding-top` and `margin-bottom` compact at `10px`.

## Current Active UI Directions (2026-11-14 Ateneo group header)
- Ateneo group main view: do not render group rules for members (they belong in `/ateneo/groups/:groupId/info`); keep them only in the non-member join view.
- The group header card mirrors the left-rail active group style: `border-[var(--brand-500)]` + `bg-[color:color-mix(in_srgb,var(--brand-100)_42%,var(--surface))]`.

## Current Active UI Directions (2026-11-14 Ateneo live comments)
- New comments arriving while a topic is open must never be injected silently: show a reveal button at the insertion point (thread end for replies, list end for new top-level comments) plus a header shortcut; highlight revealed items briefly.
- Polling must pause while the tab is hidden and must not drop visible comments missing from a poll response.

## Testing (2026-11-15)
- CI (`.github/workflows/ci.yml`) runs on PRs to dev/test/main: lint, `npm run typecheck` (next typegen + tsc), `npm run test:coverage`, build. Use Node 24 locally (`engines` + `engine-strict`).
- Coverage targets the logic layer (`src/lib/**`, `src/app/**/_lib/**` and listed components); thresholds 90/90/80/90 in `vitest.config.ts`. Pages/JSX are not chased for coverage.
- `.test.ts` runs on node, `.test.tsx` on jsdom. Mock HTTP with `src/test/fetch-mock.ts` (`mockFetch`, `okData`); never hit the network.
- Every new API helper gets a row in `src/lib/api/contract.test.ts` (method, path, body). Renaming a backend route means updating both sides (see Backend/UI Compatibility in AGENTS.md).
- Fix a bug together with a regression test (examples: `ProfileAboutCard.test.tsx` draft seeding, `AteneoTopicDiscussion.test.tsx` polling, `useProfessionalProfile.test.tsx` save error message).

## Forms: validate on submit (2026-11-16)
- Submit buttons stay enabled; disable them only while the request is in flight. Do not disable them for incomplete or invalid input.
- On submit, validate on the client with the same rules as the backend schema (keep limits in a `_lib/*-validation.ts` module that cites the backend schema), then show the message under each invalid field (`aria-invalid`, `role="alert"`) and focus the first one. Do not also toast field errors; toasts are only for errors that do not belong to a specific input (network, permissions, attachments, unknown). Clear a field's error when the user edits it.
- Backend 400 responses carry the validation issues in `details` (all environments). Map them to the same field errors; fall back to the generic error translation otherwise.
- Reference implementation: `AteneoNewTopicForm` + `ateneo/_lib/new-topic-validation.ts`.

## Attachments: PDFs (2026-11-16)
- Render PDFs with `src/components/ui/PdfAttachmentCard.tsx` everywhere (form, topic detail, cards). Do not use emoji icons for files.
- Thumbnails only for local files before upload (`src/lib/utils/pdf-preview.ts`, PDF.js loaded on demand). Never download published PDFs just to draw a thumbnail.

## Auth: email confirmation errors (2026-11-16)
- `/confirm` uses semantic theme tokens (`--background`, `--surface`, `--line`, `.sophium-heading-primary`, `.sophium-on-brand`), no hardcoded slate/hex, so it works in dark mode.
- Expired link (`EMAIL_VERIFICATION_TOKEN_EXPIRED`): title `El enlace venció`, gold full-width `Reenviar correo de verificación` button (same style as `/unverified`), success/rate-limit notices as bordered tinted boxes; the button disappears after a successful resend because the old token is replaced.
- Invalid link (`EMAIL_VERIFICATION_TOKEN_INVALID`): explanation only, no resend. Every error state shows an outlined `Ir a iniciar sesión` link.

## i18n: backend-generated labels (2026-11-16)
- Do not render Spanish labels built by the backend. Use the raw fields and localize in the UI:
  - Relative times: `formatRelativeTime(isoDate, t, i18n.language)` from `src/lib/utils/relative-time.ts` (copy in `common.json` → `relativeTime.*`). In Ateneo use `<AteneoRelativeTime value={createdAt} fallback={timeLabel} />`.
  - Ateneo group "N miembros · Activo hoy": `<AteneoGroupMeta group={group} />` / `useGroupMetaLabel()` (uses `memberCount` + `activityStatus`, `ateneo.json` → `groupMeta.*`).
  - Deleted comment placeholder: `ateneo.json` → `discussion.deletedComment`; deleted last chat message: `lastMessageIsDeleted` + `messages.json` → `fallbacks.deletedMessage`.
- The backend still sends the old labels (`timeLabel`, `subtitle`, `activity`, `lastMessagePreview: "Message deleted"`); keep them only as fallback for an older backend.

## Layout, hints and lists (2026-11-17)
- There is no global footer. Fixed bottom UI on mobile (navbar, chat composer, sheets) anchors to `bottom: 0` + safe area; content padding under the navbar is `calc(4.3rem + env(safe-area-inset-bottom))`. Do not reintroduce the old 1.9rem / 2.5rem / 2.75rem footer offsets.
- Icon-only buttons get a short hover/focus hint (1-2 words) under them, with the longer label kept as `aria-label`. Pattern: `group relative` on the button, hint span `pointer-events-none absolute top-full mt-2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100` with surface/line tokens.
- Lists that can grow (members, etc.) load in pages with a `Ver más` button, using the backend `limit`/`cursor`/`nextCursor` contract; show "Mostrando X de N" while more remain.
- Admin-only sections next to a regular list go in tabs on the same page (for example Ateneo members: `Miembros` / `Moderación` with a pending-count badge), not below the list.


## Current Active UI Directions (2026-11-27 Legal Documents)
- Terms and Privacy Policy are public pages at `/legal/terms` and `/legal/privacy` (no session), rendered from the backend (`GET /legal/documents/:slug`) with `LegalMarkdown` (`src/components/legal/`): no HTML injection, only headings, paragraphs, lists, bold, app/https/mailto links and auto-linked emails. Show "Última actualización" from the document version; the `# Title` comes from the document.
- Links to the legal pages from flows the user should not lose (register checkbox, acceptance screen) open in a new tab.
- Signed-in users without the current versions see `LegalAcceptanceGate` (rendered by `SessionGate`, blocking): both documents with `Leer` (inline, scrollable) and `Abrir en otra pestaña`, one checkbox, `Aceptar y continuar` (disabled until checked) and `Cerrar sesión`. No dismiss.
- Settings > Legal rows and the mobile drawer `LEGALES` section link to the two pages (separate rows).
- Public (SSR-rendered) pages with translated copy must not render that copy until hydration: the server always renders Spanish while the client starts in the stored language. Use `useHasMounted` (`src/lib/utils/use-has-mounted.ts`) and render a text-free shell until it is true (see `LegalDocumentPage`).

## Current Active UI Directions (2026-11-27 Beta Sign-up Screen)
- `/whitelist-access` matches `whitelist/Sophium_Beta_Mail_confirmado_escritorio_v1_20261126.png`: navy page (`--navy-900`), centered gold symbol + "Sophium" in Georgia, cream card (`--surface-2`, ~45rem wide, 1.25rem radius), green eyebrow with dot (`--success-500`), Georgia regular heading, full-width navy button with gold text (`--brand-300`) for the Google Form, gold-bordered "Importante" box (`--brand-50` / `--brand-500`), numbered steps in navy circles with gold numbers, divider + contact email + underlined `Cerrar sesión`.
