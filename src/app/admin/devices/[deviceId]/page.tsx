"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type PlaylistItem = {
  id: string;
  src: string;
  order_index: number;
};

export default function AdminDevicePage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = use(params);

  const [deviceUuid, setDeviceUuid] = useState<string | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDeviceAndPlaylist = async () => {
    setLoading(true);

    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id")
      .eq("device_code", deviceId)
      .single();

    if (deviceError || !device) {
      console.error("Device not found:", deviceError);
      setDeviceUuid(null);
      setPlaylist([]);
      setLoading(false);
      return;
    }

    setDeviceUuid(device.id);

    const { data, error } = await supabase
      .from("playlists")
      .select("id, src, order_index")
      .eq("device_id", device.id)
      .order("order_index");

    if (error) {
      console.error("Playlist error:", error);
      setPlaylist([]);
    } else {
      setPlaylist(data || []);
    }

    setLoading(false);
  };

  const uploadVideo = async () => {
    if (!deviceUuid) return;
    if (!videoFile) return;

    if (videoFile.type !== "video/mp4") {
      alert("Please upload an MP4 video.");
      return;
    }

    setSaving(true);

const safeFileName = videoFile.name
  .toLowerCase()
  .replace(/\s+/g, "-")
  .replace(/[^a-z0-9.-]/g, "");

const fileName = `${deviceId}/${Date.now()}-${safeFileName}`;
    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(fileName, videoFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Could not upload video");
      setSaving(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    const nextOrderIndex = playlist.length + 1;

    const { error: playlistError } = await supabase.from("playlists").insert({
      id: crypto.randomUUID(),
      device_id: deviceUuid,
      type: "video",
      src: publicUrlData.publicUrl,
      order_index: nextOrderIndex,
    });

    if (playlistError) {
      console.error("Playlist error:", playlistError);
      alert("Video uploaded, but could not add it to playlist");
      setSaving(false);
      return;
    }

    setVideoFile(null);
    await loadDeviceAndPlaylist();
    setSaving(false);
  };

  const deleteVideo = async (playlistId: string) => {
    const confirmed = window.confirm("Delete this video?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", playlistId);

    if (error) {
      console.error("Delete video error:", error);
      alert("Could not delete video");
      return;
    }

    await loadDeviceAndPlaylist();
  };

  useEffect(() => {
    loadDeviceAndPlaylist();
  }, [deviceId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p>Loading...</p>
      </main>
    );
  }

  if (!deviceUuid) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <h1 className="text-2xl font-bold">Device not found</h1>
        <p className="mt-2 text-gray-600">Device: {deviceId}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Device: {deviceId}</h1>
        <p className="mt-1 text-sm text-gray-500">Upload MP4 video content</p>

        <div className="mt-6 rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700">
            Upload video (.mp4)
          </label>

          <input
            type="file"
            accept="video/mp4"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            className="mt-2 w-full rounded-lg border px-3 py-2"
          />

          <button
            onClick={uploadVideo}
            disabled={saving || !videoFile}
            className="mt-3 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Uploading..." : "Upload video"}
          </button>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Current videos</h2>

          {playlist.length === 0 ? (
            <p className="mt-2 text-gray-500">No videos assigned yet.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {playlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Order: {item.order_index}
                    </p>
                    <p className="break-all text-sm text-gray-500">
                      {item.src}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteVideo(item.id)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          Display URL:
          <br />
          <span className="font-mono">/display/{deviceId}</span>
        </div>
      </div>
    </main>
  );
}
