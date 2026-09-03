# Security audit — 2026-09-03

## Result

This review found and locally fixed several meaningful security weaknesses. No
security review can guarantee that a changing internet service is 100% safe.
The controls below reduce the verified risks, but production remains on the old
build until the staged rollout is completed.

## Fixed in this change

| Area | Finding | Resolution |
| --- | --- | --- |
| Supabase Data API | Anonymous row policies could expose every column in eligible customer, device, and playlist rows. | Moved public lookups behind narrow server APIs and added a separate policy/privilege lockdown migration. |
| Customer accounts | A confirmed Supabase user with an email matching an unpaid lead could reach the portal through the email fallback. | The shared account data layer now requires a paid, trialing, or otherwise eligible customer state. |
| Redirects | A path such as `/\\security-test.invalid` could become an external redirect. | Redirect destinations are parsed and restricted to safe local paths. |
| Query construction | Admin asset search inserted input into a raw PostgREST `or` expression. | Replaced it with encoded field queries and escaped wildcard literals. |
| Rate limiting | Process-memory limits did not reliably span Vercel instances. | Added an atomic Supabase-backed limiter with hashed bucket identifiers and a production fail-closed policy. |
| Cron authentication | Missing `CRON_SECRET` was accepted outside production. | All cron routes now fail closed and compare the secret safely. |
| Display access | New display codes used only eight hexadecimal characters. | New codes use the full UUID payload; lookup input is validated and rate limited. Existing codes are preserved to avoid disconnecting installed screens. |
| Browser protection | The site had no Content Security Policy and weaker framing/isolation headers. | Added CSP, clickjacking protection, referrer policy, MIME sniffing protection, and same-origin isolation headers. |
| Stored URLs | Customer-facing stored links were returned without a protocol allowlist. | Only local, HTTP, and HTTPS destinations are accepted; dangerous and ambiguous URL forms are rejected. |
| CSV exports | Spreadsheet formula characters could execute when an admin opened an export. | Export cells now neutralize formula prefixes and escape CSV content. |
| Credentials | Onboarding credentials remained valid after the first completed checkout, and the success URL exposed a customer UUID. | Initial checkout now clears the onboarding token and no longer puts the customer UUID in the URL. |
| Passwords | Customer passwords allowed six characters. | The app now requires 12–128 characters with a letter and a number. |

## Checks that passed

- Audited all application API routes for authentication boundaries. Admin APIs
  use the central server-side admin guard.
- Runtime database access uses the Supabase query builder; no application raw
  SQL execution path was found.
- Stripe and Resend webhooks verify provider signatures before processing.
- Unsafe cross-origin state-changing requests are rejected by the proxy, with
  explicit webhook exceptions.
- Git files and Git history contain no matching live Stripe, Supabase, Resend,
  Vercel, JWT, or GitHub secret values from the local environment.
- Production browser bundles contain none of the tested server secrets.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is intentionally public; its safety depends on
  strict RLS and grants, which the lockdown migration enforces.
- `npm audit --audit-level=high` reports zero known dependency vulnerabilities.
- The complete release gate passes: 40 test files, 298 tests, lint, TypeScript,
  security checks, billing checks, framework checks, and production build.

## Required production rollout order

1. Apply `202609030000_security_hardening.sql`. This creates the shared rate
   limiter and strengthens the default for future display codes without
   removing an existing public path.
2. Deploy this application build and smoke-test login, password reset, contact,
   onboarding, display playback, Stripe checkout, and both provider webhooks.
3. Apply `202609030100_private_data_api_lockdown.sql` immediately after the new
   build is healthy. This removes the old anonymous table access.
4. Confirm anonymous Data API queries to `customers`, `devices`, and
   `playlists` are denied, then repeat the application smoke tests.

Applying both migrations before the code deployment would interrupt the old
onboarding/display client. Deploying the code before the first migration would
make production rate-limited routes fail closed. Keep the sequence above.

## External settings and remaining work

- Supabase currently reports that public Auth sign-up is enabled. Disable it in
  Authentication settings because customer accounts are created through the
  paid onboarding/invitation flow. Email confirmation is already required.
- Match Supabase password settings to the 12-character application policy and
  enable leaked-password protection, CAPTCHA, and MFA where the plan supports
  them.
- Rotate existing short display codes during a planned maintenance window; the
  API protection is improved now, but changing them immediately could disconnect
  installed displays.
- Add file content inspection or malware scanning if customer uploads will be
  downloaded or opened by staff. Current controls enforce size and declared
  MIME/type allowlists.
- The CSP permits inline styles required by the current rendering approach. A
  nonce-based CSP can tighten this further in a separate rendering change.
- The redundant ignored `.env.vercel.production` file was removed from the
  local computer. Keep production secrets in the deployment provider and only
  the minimum ignored local environment file needed for development.
- Continue dependency monitoring, access-log review, key rotation, backup
  testing, and periodic external penetration testing after deployment.

## Current live-site warning

On 2026-09-03 the deployed site still redirected
`/auth/callback?next=%2F%5Csecurity-test.invalid` to the external test domain and
did not return the new CSP. The production issue is therefore confirmed open
until this change is deployed.
