import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getAuthenticatedAdmin,
  supabaseAdmin,
} from "@/lib/server/admin-api";
import { getRequestIp, recordAuditEvent } from "@/lib/server/audit";
import {
  LANDING_EXAMPLE_VIDEO_BUCKET,
  safeLandingVideoFileName,
  validateLandingExampleVideo,
} from "@/lib/landing/example-videos";

type UploadBody = {
  action?: string;
  fileName?: string;
  contentType?: string;
  fileSize?: number;
  storagePath?: string;
};

export async function POST(request: Request) {
  const user = await getAuthenticatedAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as UploadBody;
  const action = String(body.action || "");
  const fileName = safeLandingVideoFileName(String(body.fileName || ""));
  const contentType = String(body.contentType || "");
  const fileSize = Number(body.fileSize || 0);

  if (action === "create") {
    const validationError = validateLandingExampleVideo({
      fileName,
      contentType,
      fileSize,
    });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const storagePath = `examples/${randomUUID()}-${fileName}`;
    const { data, error } = await supabaseAdmin.storage
      .from(LANDING_EXAMPLE_VIDEO_BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token) {
      console.error("Create landing example upload URL error:", error);
      return NextResponse.json(
        { error: "Could not start the video upload." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      bucket: LANDING_EXAMPLE_VIDEO_BUCKET,
      storagePath,
      token: data.token,
    });
  }

  if (action !== "complete") {
    return NextResponse.json({ error: "Invalid upload action." }, { status: 400 });
  }

  const storagePath = String(body.storagePath || "");
  if (
    !storagePath.startsWith("examples/") ||
    storagePath.includes("..")
  ) {
    return NextResponse.json(
      { error: "Could not verify the uploaded video." },
      { status: 400 },
    );
  }

  const storedName = storagePath.slice("examples/".length);
  const { data: storedObjects, error: listError } = await supabaseAdmin.storage
    .from(LANDING_EXAMPLE_VIDEO_BUCKET)
    .list("examples", { search: storedName, limit: 10 });
  const storedObject = storedObjects?.find((item) => item.name === storedName);

  if (listError || !storedObject) {
    return NextResponse.json(
      { error: "The video was not found after upload." },
      { status: 400 },
    );
  }

  const storedValidationError = validateLandingExampleVideo({
    fileName: storedName,
    contentType: String(
      storedObject.metadata?.mimetype ||
        storedObject.metadata?.contentType ||
        contentType,
    ),
    fileSize: Number(storedObject.metadata?.size || fileSize),
  });

  if (storedValidationError) {
    await supabaseAdmin.storage
      .from(LANDING_EXAMPLE_VIDEO_BUCKET)
      .remove([storagePath]);
    return NextResponse.json({ error: storedValidationError }, { status: 400 });
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from(LANDING_EXAMPLE_VIDEO_BUCKET)
    .getPublicUrl(storagePath);

  await recordAuditEvent(supabaseAdmin, {
    actorType: "admin",
    actorId: user.id,
    eventType: "landing_example_video_uploaded",
    eventDescription: "Admin uploaded an MP4 for the landing example gallery.",
    metadata: {
      storagePath,
      fileName: storedName,
      contentType: storedObject.metadata?.mimetype || storedObject.metadata?.contentType || null,
      fileSize: storedObject.metadata?.size || null,
    },
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({
    videoUrl: publicUrl.publicUrl,
    storagePath,
  });
}
