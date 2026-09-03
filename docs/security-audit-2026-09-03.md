# Security audit — 2026-09-03

## Result

This review found and fixed several meaningful security weaknesses. No security
review can guarantee that a changing internet service is 100% safe. The
application hardening and all production database migrations are now live and
have been verified against the production endpoints.

## Fixed in this change

| Area | Finding | Resolution |
| --- | --- | --- |
| Supabase Data API | Anonymous row policies could expose every column in eligible customer, device, and playlist rows. | Moved public lookups behind narrow server APIs and added a separate policy/privilege lockdown migration. |
| Customer accounts | A confirmed Supabase user with an email matching an unpaid lead could reach the portal through the email fallback. | The shared account data layer now requires a paid, trialing, or otherwise eligible customer state. |
| Redirects | A path such as `/\\security-test.invalid` could become an external redirect. | Redirect destinations are parsed and restricted to safe local paths. |
| Query construction | Admin asset search inserted input into a raw PostgREST `or` expression. | Replaced it with encoded field queries and escaped wildcard literals. |
| Rate limiting | Process-memory limits did not reliably span Vercel instances. | Added an atomic Supabase-backed limiter with hashed bucket identifiers. A follow-up migration corrected PostgreSQL expression and identifier ambiguities found during live verification. A missing migration RPC uses the previous in-memory limiter during rollout; all other production database failures fail closed. |
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
- The complete release gate passes: 41 test files, 304 tests, lint, TypeScript,
  security checks, billing checks, framework checks, and production build.

## Completed production rollout

1. The hardened application build was deployed and its public, authentication,
   cron, onboarding, display, Stripe, and Resend boundaries were smoke-tested.
2. `202609030000_security_hardening.sql` was applied. The shared rate-limit RPC
   is present. `202609030200_fix_security_rate_limit_greatest.sql` corrected two
   PostgreSQL runtime ambiguities found by the live check. The RPC now proves
   the intended allow, allow, block sequence and its QA row was removed.
3. `202609030100_private_data_api_lockdown.sql` was applied after the new build
   was healthy.
4. Anonymous Data API requests to `customers`, `devices`, and `playlists` now
   return HTTP 401. The supported server APIs and homepage still respond as
   expected.

## External settings and remaining work

- Supabase public self-sign-up is disabled; paid customer accounts continue to
  be created through the service-role invitation flow. Email confirmation stays
  required.
- Supabase now requires 12-character passwords with letters and digits and
  requires recent authentication for password changes. Leaked-password
  protection is unavailable on the current Free plan. CAPTCHA and enforced MFA
  require application work before they can be enabled without breaking login.
- Supabase Auth redirects are limited to the production site and the single
  hardened `/auth/callback` route; the localhost wildcard and unused direct
  account redirects were removed.
- GitHub Dependabot alerts and security updates, secret scanning, push
  protection, CodeQL default setup, private vulnerability reporting, and main
  branch force-push/deletion protection are enabled.
- Vercel uses sensitive Production environment variables, standard deployment
  protection, Git fork protection, and its platform DDoS protections. Custom
  WAF rules are not available on the current plan.
- Production email sending now uses a dedicated Resend key restricted to
  `screenia.se`. The separate inbound-processing key is retained because it
  needs different permissions. Two obsolete sending keys were removed after a
  successful deployment and delivery check.
- DMARC moved from monitoring-only to a staged 25% quarantine policy, with
  aggregate reports sent to `service@screenia.se`. Review delivery and reports
  before increasing enforcement to 100%.
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

## Current live-site verification

On 2026-09-03 production returned the hardened CSP and browser headers, rejected
the external redirect payload, rejected anonymous access to the three sensitive
Data API tables, and kept the supported homepage, onboarding, display, cron, and
provider-webhook boundaries healthy. A uniquely labelled contact-form check
sent both outbound messages and recorded both delivery events; its inquiry,
notification, audit, and delivery-event rows were then removed and verified
absent.
