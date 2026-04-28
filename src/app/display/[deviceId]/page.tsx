"use client";

import { use, useEffect, useState } from "react";

type PlaylistItem = {
  type: "image" | "video";
  src: string;
  duration?: number;
};

const playlist: PlaylistItem[] = [
  { type: "image", src: "/salon1.jpg", duration: 5000 },
  { type: "video", src: "/v1.mp4" },
  { type: "image", src: "/salon2.jpg", duration: 5000 },
];

export default function DisplayPage({
  params,
}: {
  params: Promise<{ deviceId: string }>;
}) {
  const { deviceId } = use(params);
  const [index, setIndex] = useState(0);

  const currentItem = playlist[index];

  const goToNextItem = () => {
    setIndex((prev) => (prev + 1) % playlist.length);
  };

  useEffect(() => {
    if (currentItem.type !== "image") return;

    const timer = setTimeout(() => {
      goToNextItem();
    }, currentItem.duration ?? 5000);

    return () => clearTimeout(timer);
  }, [currentItem]);

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
