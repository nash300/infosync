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
  const [deviceName, setDeviceName] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const loadDeviceAndPlaylist = async () => {
    setLoading(true);

    const { data: device, error: deviceError } = await supabase
      .from("devices")
      .select("id, name, is_active")
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
    setDeviceName(device.name || deviceId);
    setIsActive(device.is_active);
    setNewDeviceName(device.name || deviceId);

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

  const renameDevice = async () => {
    if (!deviceUuid) return;
    if (!newDeviceName.trim()) {
      alert("Device name is required");
      return;
    }

    setRenaming(true);

    const { error } = await supabase
      .from("devices")
      .update({
        name: newDeviceName.trim(),
      })
      .eq("id", deviceUuid);

    if (error) {
      console.error("Rename device error:", error);
      alert("Could not rename device");
      setRenaming(false);
      return;
    }

    await loadDeviceAndPlaylist();
    setRenaming(false);
  };
  const deleteDevice = async () => {
    if (!deviceUuid) return;

    const confirmed = window.confirm(
      "Delete this device? This will also remove its playlist.",
    );

    if (!confirmed) return;

    await supabase.from("playlists").delete().eq("device_id", deviceUuid);

    const { error } = await supabase
      .from("devices")
      .delete()
      .eq("id", deviceUuid);

    if (error) {
      console.error("Delete device error:", error);
      alert("Could not delete device");
      return;
    }

    window.location.href = "/admin/devices";
  };
  const toggleDeviceActive = async () => {
    if (!deviceUuid) return;

    const nextValue = !isActive;

    const { error } = await supabase
      .from("devices")
      .update({ is_active: nextValue })
      .eq("id", deviceUuid);

    if (error) {
      console.error("Device status error:", error);
      alert("Could not update device status");
      return;
    }

    setIsActive(nextValue);
  };

  const uploadVideo = async () => {
    if (!deviceUuid || !videoFile) return;

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
      <main className="bg-gray-100 p-8">
        <p>Loading...</p>
      </main>
    );
  }

  if (!deviceUuid) {
    return (
      <main className="bg-gray-100 p-8">
        <h1 className="text-2xl font-bold">Device not found</h1>
        <p className="mt-2 text-gray-600">Device: {deviceId}</p>
      </main>
    );
  }

  return (
    <main className="bg-gray-100 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">{deviceName}</h1>

        <p className="mt-1 text-sm text-gray-500">Device code: {deviceId}</p>

        <button
          onClick={toggleDeviceActive}
          className={`mt-4 rounded-lg px-4 py-2 text-white ${
            isActive ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {isActive ? "Deactivate device" : "Activate device"}
        </button>
        <button
          onClick={deleteDevice}
          className="mt-4 ml-2 rounded-lg bg-gray-800 px-4 py-2 text-white"
        >
          Delete device
        </button>
        <div className="mt-6 rounded-lg border p-4">
          <label className="block text-sm font-medium text-gray-700">
            Rename device
          </label>

          <div className="mt-2 flex gap-2">
            <input
              value={newDeviceName}
              onChange={(e) => setNewDeviceName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />

            <button
              onClick={renameDevice}
              disabled={renaming}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {renaming ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border bg-black p-2">
          <div className="mb-2 flex items-center justify-between text-white">
            <p className="text-sm font-medium">Live screen preview</p>

            <a
              href={`/display/${deviceId}`}
              target="_blank"
              className="rounded bg-white px-3 py-1 text-xs text-black"
            >
              Open full screen
            </a>
          </div>

          <div className="aspect-video overflow-hidden rounded bg-black">
            <iframe
              src={`/display/${deviceId}`}
              className="h-full w-full border-0"
              title="Display preview"
            />
          </div>
        </div>

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
          <h2 className="text-lg font-semibold">Current playlist</h2>

          {playlist.length === 0 ? (
            <p className="mt-2 text-gray-500">No videos assigned yet.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {playlist.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <p className="mb-2 text-sm text-gray-500">
                    Order: {item.order_index}
                  </p>

                  <video src={item.src} controls className="w-full rounded" />

                  <button
                    onClick={() => deleteVideo(item.id)}
                    className="mt-3 rounded bg-red-600 px-3 py-2 text-sm text-white"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p>Display URL:</p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-mono text-xs break-all">
              /display/{deviceId}
            </span>

            <a
              href={`/display/${deviceId}`}
              target="_blank"
              className="rounded-lg bg-black px-3 py-2 text-xs text-white"
            >
              Preview
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
