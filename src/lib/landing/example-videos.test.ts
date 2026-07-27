import { describe, expect, it } from "vitest";
import {
  LANDING_EXAMPLE_VIDEO_MAX_BYTES,
  safeLandingVideoFileName,
  validateLandingExampleVideo,
} from "@/lib/landing/example-videos";

describe("landing example videos", () => {
  it("accepts an MP4 within the upload limit", () => {
    expect(
      validateLandingExampleVideo({
        fileName: "presentation.mp4",
        contentType: "video/mp4",
        fileSize: LANDING_EXAMPLE_VIDEO_MAX_BYTES,
      }),
    ).toBeNull();
  });

  it("rejects non-MP4 files and oversized videos", () => {
    expect(
      validateLandingExampleVideo({
        fileName: "presentation.webm",
        contentType: "video/webm",
        fileSize: 1024,
      }),
    ).toContain("MP4");
    expect(
      validateLandingExampleVideo({
        fileName: "presentation.mp4",
        contentType: "video/mp4",
        fileSize: LANDING_EXAMPLE_VIDEO_MAX_BYTES + 1,
      }),
    ).toContain("100 MB");
  });

  it("sanitizes storage file names", () => {
    expect(safeLandingVideoFileName("My Presentation #1.MP4")).toBe(
      "my-presentation-1.mp4",
    );
  });
});
