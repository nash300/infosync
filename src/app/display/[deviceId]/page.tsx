"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type PlaylistItem = {
  type: "image" | "video";
  src: string;
  duration: number | null;
};

export default function DisplayPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = use(params);

  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentItem = playlist[index];

  const goToNextItem = () => {
    setIndex((prev) => (prev + 1) % playlist.length);
  };

  // 🔥 Fetch playlist from Supabase
  useEffect(() => {
    const fetchPlaylist = async () => {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .eq("device_id", deviceId)
        .order("order_index");

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setPlaylist([]);
        setLoading(false);
        return;
      }

      setPlaylist(data);
      setLoading(false);
    };

    fetchPlaylist();
  }, [deviceId]);

  // ⏱️ Image timer
  useEffect(() => {
    if (!currentItem || currentItem.type !== "image") return;

    const timer = setTimeout(() => {
      goToNextItem();
    }, currentItem.duration || 5000);

    return () => clearTimeout(timer);
  }, [currentItem]);

  // ⏳ Loading state
  if (loading) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center text-white">
        Loading...
      </main>
    );
  }

  // ⚠️ No content
  if (!currentItem) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center text-white text-center">
        <div>
          <p className="text-xl mb-2">No content assigned</p>
          <p className="text-sm opacity-50">Device: {deviceId}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-[9999] bg-black overflow-hidden">
      {currentItem.type === "image" && (
        <img
          src={currentItem.src}
          alt="Display content"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {currentItem.type === "video" && (
        <video
          key={currentItem.src}
          src={currentItem.src}
          autoPlay
          muted
          playsInline
          onEnded={goToNextItem}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      <div className="absolute top-2 left-2 text-white text-sm opacity-40">
        Device: {deviceId}
      </div>
    </main>
  );
}
