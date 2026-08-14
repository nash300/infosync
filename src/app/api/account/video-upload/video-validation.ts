export const MAX_CUSTOMER_VIDEO_BYTES = 100 * 1024 * 1024;

const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);

export function validateCustomerVideo({
  fileName,
  contentType,
  fileSize,
}: {
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  if (!fileName) return "Videofilen saknar ett giltigt filnamn.";
  if (!allowedVideoTypes.has(contentType)) {
    return "Endast MP4- och WEBM-videor kan laddas upp.";
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return "Videofilen är tom eller har en ogiltig storlek.";
  }
  if (fileSize > MAX_CUSTOMER_VIDEO_BYTES) {
    return "Videofilen får vara högst 100 MB.";
  }
  return null;
}
