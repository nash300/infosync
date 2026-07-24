import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/auth/password-policy.ts",
        "src/lib/admin/customer-workflow.ts",
        "src/lib/pricing/setup-fee.ts",
        "src/lib/pricing/shipping-fee.ts",
        "src/lib/pricing/vat.ts",
        "src/lib/server/subscription-entitlements.ts",
        "src/lib/server/audit.ts",
        "src/app/admin/orders/order-workflow.ts",
        "src/app/api/onboarding-requests/route.ts",
      ],
    },
  },
});
