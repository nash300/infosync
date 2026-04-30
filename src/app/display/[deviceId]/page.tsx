"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type PlaylistItem = {
  src: string;
};

const CACHE_NAME = "infosync-video-cache-v1";

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
    setIndex((prev) => {
      if (playlist.length === 0) return 0;
      return (prev + 1) % playlist.length;
    });
  };

  const cacheVideos = async (items: PlaylistItem[]) => {
    if (!("caches" in window)) return;

    const cache = await caches.open(CACHE_NAME);

    for (const item of items) {
      try {
        const existing = await cache.match(item.src);

        if (!existing) {
          await cache.add(item.src);
          console.log("Cached video:", item.src);
        }
      } catch (error) {
        console.error("Could not cache video:", item.src, error);
      }
    }
  };

  const getCachedPlaylist = async () => {
    if (!("localStorage" in window)) return [];

    const saved = localStorage.getItem(`playlist-${deviceId}`);

    if (!saved) return [];

    try {
      return JSON.parse(saved) as PlaylistItem[];
    } catch {
      return [];
    }
  };

  const saveCachedPlaylist = (items: PlaylistItem[]) => {
    localStorage.setItem(`playlist-${deviceId}`, JSON.stringify(items));
  };

  useEffect(() => {
    const fetchPlaylist = async () => {
      const { data: device, error: deviceError } = await supabase
        .from("devices")
        .select("id")
        .eq("device_code", deviceId)
        .single();
      
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .then(() => console.log("Service Worker registered"))
          .catch((err) => console.error("SW error:", err));
      }
      if (deviceError || !device) {
        console.error("Device not found:", deviceError);

        const cached = await getCachedPlaylist();
        setPlaylist(cached);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("playlists")
        .select("src")
        .eq("device_id", device.id)
        .order("order_index");

      if (error) {
        console.error("Playlist error:", error);

        const cached = await getCachedPlaylist();
        setPlaylist(cached);
        setLoading(false);
        return;
      }

      const freshPlaylist = data || [];

      setPlaylist(freshPlaylist);
      saveCachedPlaylist(freshPlaylist);
      cacheVideos(freshPlaylist);

      setIndex((currentIndex) => {
        if (freshPlaylist.length === 0) return 0;
        if (currentIndex >= freshPlaylist.length) return 0;
        return currentIndex;
      });

      setLoading(false);
    };

    fetchPlaylist();

    const interval = setInterval(fetchPlaylist, 3000);

    return () => clearInterval(interval);
  }, [deviceId]);

  if (loading) {
    return (
      <main className="fixed inset-0 bg-black flex items-center justify-center text-white">
        Loading...
      </main>
    );
  }

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
      <video
        key={currentItem.src}
        src={currentItem.src}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={goToNextItem}
        onError={goToNextItem}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute top-2 left-2 text-white text-sm opacity-40">
        Device: {deviceId}
      </div>
    </main>
  );
}
