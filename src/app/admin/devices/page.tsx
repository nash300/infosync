"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Device = {
  id: string;
  name: string;
  device_code: string;
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDevices = async () => {
    const { data } = await supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: false });

    setDevices(data || []);
    setLoading(false);
  };

const createDevice = async () => {
  if (!newName.trim()) return;

  const { error } = await supabase.from("devices").insert({
    name: newName.trim(),
  });

  if (error) {
    console.error(error);
    alert("Error creating device");
    return;
  }

  setNewName("");
  loadDevices();
};
  useEffect(() => {
    loadDevices();
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Devices</h1>
      <p className="mt-2 text-gray-600">
        Manage your screens and assign video content.
      </p>

      {/* Create device */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Add new device</h2>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Device name (e.g. Store Screen)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />

          <button
            onClick={createDevice}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Add
          </button>
        </div>
      </div>

      {/* Device list */}
      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Your devices</h2>

        {loading ? (
          <p className="mt-4 text-gray-500">Loading...</p>
        ) : devices.length === 0 ? (
          <p className="mt-4 text-gray-500">No devices yet</p>
        ) : (
          <div className="mt-4 space-y-3">
            {devices.map((device) => (
              <Link
                key={device.id}
                href={`/admin/devices/${device.device_code}`}
                className="block rounded-lg border p-4 hover:bg-gray-50"
              >
                <p className="font-semibold">{device.name}</p>
                <p className="text-sm text-gray-500">
                  Code: {device.device_code}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
