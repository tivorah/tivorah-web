# Tivorah web agent guide

## Scope and precedence

This file applies to every file under `tivorah-web/`. The repository-level
`../AGENTS.md` remains mandatory. Its accessibility, responsive-design, data-state,
terminology, and design-review requirements apply to both the public site and admin.

Keep this guide current when routes, deployment, environment configuration, legal
surfaces, authentication, or shared styling changes.

## Operational rule

- Do not start, restart, stop, or kill the Next.js app or another Tivorah process
  unless the user explicitly asks.
- If port `7456` is occupied, identify/report the owning process or give the user a
  command; do not kill it or silently move ports without authorization.
- Read-only inspection, type checking, linting, and production builds are allowed
  when relevant.
- Do not deploy, change Netlify configuration in the dashboard, or mutate production
  data unless the user explicitly requests it.

## What this project is

`tivorah-web` is Tivorah's public marketing, trust, legal, waitlist/contact, Stripe
Connect return, and staff administration application. It is a Next.js App Router
project currently served on Railway. The public product domain is `https://tivorah.com`.
The repository retains its previous Netlify configuration; do not assume it controls
the active deployment.

Primary stack:

- Next.js 15 App Router
- React 19 and TypeScript
- Better Auth client for staff sessions
- Tivorah API for forms, staff data, feature controls, and operational actions
- Netlify with the official Next.js plugin

## Project map

- `app/layout.tsx` — root metadata, header, page shell, and footer.
- `app/page.tsx` — public homepage and waitlist-oriented launch messaging.
- `app/about/` — dedicated About Tivorah page.
- `app/why-tivorah/` — product purpose and value proposition.
- `app/hub-organisers/` — organiser information, responsibilities, and rules.
- `app/service-providers/` — provider listing, responsibility, and payment information.
- `app/contact/` — contact/support surface.
- `app/admin/` — protected staff sign-in, MFA, dashboard, and operational UI.
- `app/connect/return/` and `app/connect/refresh/` — Stripe Connect onboarding returns.
- `app/newsletter/` — newsletter-related flows.
- `app/legal/` — legal hub and individual policy pages.
- `components/` — reusable public-site components, header, forms, and visual sections.
- `lib/` — API, authentication, configuration, and shared web infrastructure.
- `public/` — static brand/media assets.
- `*.css` and shared style files — established brand and layout systems.
- `netlify.toml` — Netlify build, plugin, environment, headers, and caching behavior.
- `.env.example` — public web configuration contract; never put credentials in it.

Key legal routes include privacy, terms, community guidelines, safety, child-safety
standards, account deletion, cookies, accessibility, disclaimers, and unsubscribe
flows. Inspect `app/legal/` for the canonical current route names before linking.

## Brand and business facts

Use the existing legal/business presentation consistently:

- Legal entity: TIVORAH PTY LTD
- ABN: 94 702 094 844
- Public business location: Adelaide, South Australia
- Product term: “Hub,” not “community” as a competing feature name
- Core public message: helping people find trusted communities and build their life
  in Australia

Do not publish a full private street address. Do not invent registrations, licences,
guarantees, legal obligations, or claims not supported by the codebase or supplied
source documents.

## Public site structure and design

- The marketing site currently uses a light visual direction. Preserve it unless the
  user explicitly requests a theme change.
- Preserve the established logo, typography, spacing, centered content widths, and
  mobile navigation patterns in shared styles/components.
- Public content uses a centered 1280px maximum-width shell at every zoom level.
  Decorative sections use overflow clipping without becoming hidden scroll containers,
  so search-engine text-fragment links cannot shift the hero sideways.
- The homepage uses a spacious split invitation/product opening in `home-polish.css`,
  with a single supporting paragraph and two upright, separated app screens;
  the business identity and Adelaide origin share the aligned `footer-bottom` block.
- The homepage flows from the product introduction to the Hub journey rail,
  newcomer story, interactive app tour, organiser/provider tools, Adelaide origin
  and waitlist. Keep these sections distinct rather than repeating belonging copy.
- Write public copy in plain, natural language. Avoid invented hyphenated phrases,
  vague slogans and stock-sounding promises; describe what people can actually do.
- Homepage previews are user-controlled, with keyboard-accessible tabs.
- Reuse shared styles such as brand, centered-layout, hero/preview, product-tour,
  journey-polish, and legal styles rather than creating page-specific duplicates.
- Mobile navigation must expose essential links through a familiar accessible menu;
  desktop-only navigation is not acceptable.
- Keep page sections at the established mobile content width and prevent narrower
  sections from appearing accidentally indented beside their peers.
- Images must use Next-compatible optimized/static paths and retain useful Netlify
  caching headers. Do not disable optimization globally to hide a configuration bug.
- Every form needs persistent labels, field-specific errors, submission feedback,
  success/recovery states, and keyboard/focus support.
- Web interactive targets should normally be at least 40 by 40 CSS pixels and must
  satisfy WCAG 2.2 target-size requirements.

## Legal and safety content

Legal pages protect users and Tivorah, but they are not a substitute for product
enforcement. When changing a policy-related feature, verify that the API/mobile
behavior, reporting paths, age controls, moderation, retention, and account-deletion
flows still match the public statement.

- Do not casually rewrite legal meaning for visual polish.
- Preserve version/effective dates where present.
- Keep links to privacy and terms reachable before mobile registration.
- Maintain child-safety and adults-only disclosures consistently.
- Ensure every published support/reporting method maps to a maintained destination.
- Flag material legal uncertainty for professional review rather than representing
  generated text as legal advice.

## Staff administration

The admin application under `app/admin/` uses Better Auth against the Tivorah API.
Owner/admin access uses the established email/password and TOTP/recovery flow.

- Never hard-code, expose, log, or place staff passwords, TOTP secrets, cookies, or
  recovery codes in source, documentation, test fixtures, or browser-visible env.
- Do not add an authentication bypass for local testing or demos.
- Preserve loading indicators for sign-in, verification, and every staff mutation.
- Protected pages must verify the session/role through the API; hiding UI is not
  authorization.
- Destructive or high-impact admin actions require clear scope, confirmation where
  appropriate, immediate progress, and a useful completion/error state.
- Feature controls must describe their client impact and must update the database
  configuration consumed by API and mobile, not a web-only local value.
- Preserve the established light admin appearance and sidebar unless a redesign is
  explicitly requested.

## API and environment configuration

Public browser variables are bundled and are never secret. Important environment
values include:

- `NEXT_PUBLIC_API_URL` — Tivorah API origin/base used by browser requests
- `NEXT_PUBLIC_SITE_URL` — canonical web origin, normally `https://tivorah.com`
- Public App Store and Play Store URLs where configured
- `APPLE_TEAM_ID` and `APPLE_APP_BUNDLE_IDENTIFIER` — server-only iOS Universal Link verification
- `ANDROID_APP_PACKAGE_NAME` and `ANDROID_APP_SHA256_CERT_FINGERPRINTS` — server-only Android App Link verification

Keep `.env.example` synchronized with actual runtime reads and remove unused entries
only after repository search confirms there are no code or deployment references.
Never include real passwords, API secrets, Stripe secret keys, recovery codes, or
private tokens in `NEXT_PUBLIC_*` values.

Stripe Connect callback pages must validate/display server-derived onboarding state
and provide a safe recovery route. They must not decide payout eligibility from query
parameters alone.

## Hosting and legacy Netlify configuration

Railway is the current host. Verify its build/start settings before diagnosing
hosting issues; do not change Railway settings without authorisation.

For the previous Netlify deployment, `netlify.toml` uses the Netlify
Next.js plugin. Do not add a generic single-page-app redirect to `index.html`; Next.js
routes are handled by the plugin and such a rewrite can cause false 404s or broken
server routes.

When diagnosing deployment:

1. Confirm Netlify's base directory is `tivorah-web` when the repository root contains
   multiple projects.
2. Confirm the build command and publish settings agree with `netlify.toml`.
3. Confirm required public environment variables exist in the deployment context.
4. Inspect the Netlify build log before changing redirects.
5. Verify `/`, representative content/legal routes, admin, and Connect callback routes.
6. Verify static images return cacheable responses and updated assets invalidate
   correctly.

Do not add “Powered by Netlify” branding unless it is contractually required.

## Common commands

Run checks from `tivorah-web/`:

```bash
npm run typecheck
npm run lint
npm run build
```

The local development command is defined in `package.json` and uses port `7456`.
Provide it to the user when needed; do not launch it unless explicitly requested.

## Change standards

- Prefer Server Components by default; add `"use client"` only where browser state,
  effects, or event handlers require it.
- Keep API/auth utilities centralized. Do not scatter raw fetch/session handling among
  presentation components.
- Preserve metadata, canonical URLs, semantic headings, and descriptive link text.
- Do not duplicate header, footer, legal notices, input, button, loading, or error
  patterns across pages.
- Avoid layout shifts by reserving image/content space and using meaningful skeletons
  only where content is actually loading.
- Preserve form input after recoverable errors.
- Remove obsolete code, comments, assets, env values, and files only after all callers
  are migrated and repository search confirms they are unused.
- Never commit generated `.next` output or secrets.

## Verification checklist

For a normal web change:

1. Identify the page's primary goal and one primary action.
2. Verify mobile width, desktop width, 200% zoom, keyboard navigation, focus states,
   labels, contrast, and reduced motion in touched UI.
3. Verify loading, empty, error/retry, success, and protected states for data surfaces.
4. Check all internal links and the corresponding route folders.
5. Run `npm run typecheck`, lint, and focused tests if present.
6. Run `npm run build` for routing, metadata, dependency, config, or deployment changes.
7. For admin changes, verify unauthenticated, MFA-required, unauthorized, and session-
   expired behavior as well as the success path.
8. For legal/safety changes, verify the claimed behavior exists in API/mobile and note
   anything requiring legal review.

## Public event tickets

- `/events/[id]` renders published event details and guest ticket checkout, without
  requiring an app install or account. It uses `/api/v1/public/events` on the API.
- `/event-orders/[id]` is a private, non-indexed ticket/status page. Keep the access
  token in the URL fragment/session storage and send it only as a Bearer header.
- Ticket entry codes require a server-confirmed order. Never infer payment success
  from a browser redirect or a Stripe session ID in a URL.
- `/events/*` is included in the iOS association file; deploy association configuration
  and the corresponding native build before claiming installed-app routing is live.

- Keep homepage carousel cards visible in server-rendered HTML. JavaScript may
  position the rail and enable buttons, but must not be required to reveal content.
