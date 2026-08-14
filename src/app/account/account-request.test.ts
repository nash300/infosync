import { describe, expect, it, vi } from "vitest";
import { accountRequest } from "./account-request";

describe("customer account actions", () => {
  it("returns a normal API response unchanged", async () => {
    const response = new Response(JSON.stringify({ success: true }), { status: 200 });
    const fetcher = vi.fn().mockResolvedValue(response);
    expect(await accountRequest("/api/account/messages", {}, fetcher)).toBe(response);
  });

  it("converts a network failure into a customer-safe API response", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await accountRequest(
      "/api/account/messages",
      {},
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    expect(response.status).toBe(503);
    expect((await response.json()).error).toContain("Kontrollera nätverket");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
