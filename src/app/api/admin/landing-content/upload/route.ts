import {
  getAuthenticatedAdmin,
  supabaseAdmin,
} from "@/lib/server/admin-api";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getRequestIp, recordAuditEvent } from "@/lib/server/audit";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeFileName(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9.-]/g, "").slice(0, 120) || "hero-image";
}

export async function POST(request: Request) {
  const user = await getAuthenticatedAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const purpose = formData?.get("purpose") === "example-poster" ? "example-poster" : "hero";
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Choose a PNG, JPG, or WebP image up to 10 MB." }, { status: 400 });
  }
  const path = `${purpose === "example-poster" ? "example-posters" : "hero"}/${randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabaseAdmin.storage.from("landing-media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: "Could not upload the image." }, { status: 500 });
  const { data } = supabaseAdmin.storage.from("landing-media").getPublicUrl(path);
  await recordAuditEvent(supabaseAdmin, {
    actorType: "admin", actorId: user.id,
    eventType: purpose === "example-poster" ? "landing_example_poster_uploaded" : "landing_hero_image_uploaded",
    eventDescription: purpose === "example-poster"
      ? "Admin uploaded a poster image for the landing example gallery."
      : "Admin uploaded an image for landing hero content.",
    metadata: { path, purpose, fileName: file.name, contentType: file.type, size: file.size },
    ipAddress: getRequestIp(request), userAgent: request.headers.get("user-agent"),
  });
  return NextResponse.json({ imageUrl: data.publicUrl, path });
}
