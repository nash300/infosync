import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("security hardening invariants", () => {
  it("removes anonymous access to private customer and display tables", () => {
    const rateLimitMigration = source(
      "supabase/migrations/202609030000_security_hardening.sql",
    );
    const lockdownMigration = source(
      "supabase/migrations/202609030100_private_data_api_lockdown.sql",
    );

    expect(lockdownMigration).toContain(
      'drop policy if exists "Setup links can read pending customer records"',
    );
    expect(lockdownMigration).toContain(
      'drop policy if exists "Displays can read active assigned devices"',
    );
    expect(lockdownMigration).toContain(
      'drop policy if exists "Displays can read playlists for active devices"',
    );
    expect(lockdownMigration).toContain(
      "revoke all privileges on table public.customers from anon",
    );
    expect(rateLimitMigration).toContain("consume_security_rate_limit");
    expect(rateLimitMigration).toContain("to service_role");
  });

  it("loads onboarding data only through the narrow server API", () => {
    const page = source("src/app/onboarding/[token]/page.tsx");
    const route = source("src/app/api/onboarding/order-status/route.ts");

    expect(page).not.toContain('@/lib/supabase/client');
    expect(page).not.toContain('.from("customers")');
    expect(page).toContain('fetch("/api/onboarding/order-status"');
    expect(route).toContain('process.env.SUPABASE_SERVICE_ROLE_KEY');
    expect(route).toContain('"Cache-Control": "no-store"');
  });

  it("keeps cron jobs fail-closed behind the shared verifier", () => {
    const routes = [
      "src/app/api/cron/pause-reminders/route.ts",
      "src/app/api/cron/device-pause-resumes/route.ts",
      "src/app/api/cron/device-cancellations-finalize/route.ts",
    ];

    routes.forEach((path) => {
      const route = source(path);
      expect(route).toContain("authorizeCronRequest(request)");
      expect(route).not.toContain('process.env.NODE_ENV !== "production"');
    });
  });

  it("checks paid portal eligibility in the shared customer data layer", () => {
    const dataLayer = source("src/lib/server/customer-account.ts");
    expect(dataLayer).toContain("hasCustomerPortalAccess(data) ? data : null");
  });

  it("does not concatenate admin search input into a raw PostgREST OR filter", () => {
    const route = source("src/app/api/admin/customer-assets/route.ts");
    expect(route).not.toContain("assetQuery.or(");
    expect(route).toContain("literalContainsPattern");
  });

  it("sanitizes stored links before returning them to customer-facing UI", () => {
    const accountRoute = source("src/app/api/account/route.ts");
    const legalRoute = source("src/app/api/admin/legal-documents/route.ts");

    expect(accountRoute).toContain("preview_url: getSafeWebUrl(");
    expect(accountRoute).toContain("getSafeWebUrl(subscription.tracking_url)");
    expect(accountRoute).toContain("getSafeWebUrl(agreement.document_url)");
    expect(legalRoute).toContain("pdfUrl && !getSafeWebUrl(pdfUrl)");
  });

  it("neutralizes spreadsheet formulas in the admin accounting export", () => {
    const route = source("src/app/api/admin/accounting-export/route.ts");
    expect(route).toContain("map(safeCsvCell)");
  });

  it("invalidates onboarding credentials after the first completed checkout", () => {
    const checkout = source("src/app/api/stripe/checkout/route.ts");
    const webhook = source("src/app/api/stripe/webhook/route.ts");

    expect(checkout).toContain(
      'success_url: `${appUrl}/onboarding/payment-success`',
    );
    expect(checkout).not.toContain("payment-success?customer_id=");
    expect(webhook).toContain("onboarding_token: null");
    expect(webhook).toContain("onboarding_token_expires_at: null");
  });
});
