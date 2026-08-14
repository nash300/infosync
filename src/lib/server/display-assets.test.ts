import { describe, expect, it, vi } from "vitest";
import {
  MAX_DISPLAY_FILE_BYTES,
  saveDisplayAssets,
  validateDisplayAssetRequest,
} from "./display-assets";

const pngFile = (overrides: Record<string, unknown> = {}) => ({
  name: "customer logo.png",
  type: "image/png",
  size: 3,
  data: Buffer.from("png").toString("base64"),
  category: "image",
  ...overrides,
});

describe("customer display material", () => {
  it("accepts a supported image and description-only instructions", () => {
    expect(validateDisplayAssetRequest([pngFile()], "Use on the menu screen").error).toBeNull();
    expect(validateDisplayAssetRequest([], "Replace the weekend offer").error).toBeNull();
  });

  it.each([
    [[pngFile({ type: "application/x-msdownload" })], "", "Endast JPG"],
    [[pngFile({ name: "" })], "", "saknar filnamn"],
    [[], "", "Lägg till en beskrivning"],
    [[], "a".repeat(1201), "högst 1200"],
  ])("rejects unsafe material input %#", (files, description, message) => {
    expect(validateDisplayAssetRequest(files, description).error).toContain(message);
  });

  it("uses decoded bytes instead of a forged client size", () => {
    const oversized = Buffer.alloc(MAX_DISPLAY_FILE_BYTES + 1).toString("base64");
    expect(
      validateDisplayAssetRequest(
        [pngFile({ size: 1, data: oversized })],
        "",
      ).error,
    ).toContain("för stor");
  });

  it("stores uploaded file bytes and sanitized metadata", async () => {
    const insert = vi.fn(() => ({
      select: () => ({
        single: async () => ({ data: { id: "asset-1" }, error: null }),
      }),
    }));
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: () => ({ insert }),
      storage: {
        from: () => ({ upload, remove }),
      },
    };

    const result = await saveDisplayAssets({
      supabase: supabase as never,
      customerId: "customer-1",
      files: [pngFile()],
      description: "Main logo",
      source: "account",
    });

    expect(upload).toHaveBeenCalledWith(
      expect.stringContaining("customer-1/"),
      expect.any(Buffer),
      { contentType: "image/png", upsert: false },
    );
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: "customer-1",
        file_name: "customer-logo.png",
        file_size: 3,
        source: "account",
      }),
    );
    expect(result.storedAssetIds).toEqual(["asset-1"]);
  });

  it("removes an uploaded object when its database record fails", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: null, error: new Error("insert failed") }),
          }),
        }),
      }),
      storage: { from: () => ({ upload, remove }) },
    };

    await expect(
      saveDisplayAssets({
        supabase: supabase as never,
        customerId: "customer-1",
        files: [pngFile()],
        description: "",
        source: "account",
      }),
    ).rejects.toThrow("insert failed");
    expect(remove).toHaveBeenCalledWith([expect.stringContaining("customer-1/")]);
  });
});
