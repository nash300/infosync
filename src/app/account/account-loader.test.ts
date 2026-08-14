import { describe, expect, it, vi } from "vitest";
import { fetchAccountData } from "./account-loader";

describe("customer account loader", () => {
  it("returns account data for a successful response", async () => {
    const data = { customer: { id: "customer-1" } };
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(data), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchAccountData(fetcher)).resolves.toEqual({
      unauthorized: false,
      data,
    });
  });

  it("reports an expired login without parsing the response", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    await expect(fetchAccountData(fetcher)).resolves.toEqual({ unauthorized: true });
  });

  it("rejects server, network, and invalid JSON failures", async () => {
    await expect(
      fetchAccountData(
        vi.fn().mockResolvedValue(new Response("failure", { status: 500 })),
      ),
    ).rejects.toThrow("status 500");

    await expect(
      fetchAccountData(vi.fn().mockRejectedValue(new Error("offline"))),
    ).rejects.toThrow("offline");

    await expect(
      fetchAccountData(
        vi.fn().mockResolvedValue(
          new Response("not-json", {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        ),
      ),
    ).rejects.toThrow();
  });
});
