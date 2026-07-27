export const LANDING_EXAMPLE_VIDEO_BUCKET = "landing-media";
export const LANDING_EXAMPLE_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
export const LANDING_EXAMPLE_VIDEO_MIME_TYPE = "video/mp4";
export type LandingExampleVideoOrientation = "portrait" | "landscape";

export type LandingExampleVideo = {
  id: string;
  title: string;
  body: string;
  video_url: string;
  storage_path?: string | null;
  poster_url?: string | null;
  poster_storage_path?: string | null;
  orientation: LandingExampleVideoOrientation;
  sort_order: number;
  is_active: boolean;
};

export const fallbackLandingExampleVideos: LandingExampleVideo[] = [
  {
    id: "published-example-video-01",
    title: "Digital kampanjvisning",
    body: "Ett exempel på hur rörligt innehåll kan presenteras på en kundskärm.",
    video_url: "/landing/hero-videos/p3.mp4",
    storage_path: null,
    poster_url: null,
    poster_storage_path: null,
    orientation: "landscape",
    sort_order: 1,
    is_active: true,
  },
];

export function safeLandingVideoFileName(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9.-]/g, "")
      .slice(0, 120) || "presentation.mp4"
  );
}

export function validateLandingExampleVideo({
  fileName,
  contentType,
  fileSize,
}: {
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  if (!fileName || !fileName.toLowerCase().endsWith(".mp4")) {
    return "Choose an MP4 video.";
  }
  if (contentType !== LANDING_EXAMPLE_VIDEO_MIME_TYPE) {
    return "Choose an MP4 video.";
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return "The video file is empty or invalid.";
  }
  if (fileSize > LANDING_EXAMPLE_VIDEO_MAX_BYTES) {
    return "Choose an MP4 video up to 100 MB.";
  }
  return null;
}
