"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Device = {
  id: string;
  device_code: string;
  name: string | null;
  created_at: string;
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceCode, setDeviceCode] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDevices = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("devices")
      .select("id, device_code, name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load devices error:", error);
      setDevices([]);
    } else {
      setDevices(data || []);
    }

    setLoading(false);
  };

  const createDevice = async () => {
    if (!deviceCode.trim()) {
      alert("Device code is required");
      return;
    }

    setSaving(true);

    const cleanDeviceCode = deviceCode
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { error } = await supabase.from("devices").insert({
      id: crypto.randomUUID(),
      device_code: cleanDeviceCode,
      name: deviceName.trim() || cleanDeviceCode,
      is_active: true,
    });

    if (error) {
      console.error("Create device error:", error);
      alert("Could not create device. Maybe the device code already exists.");
      setSaving(false);
      return;
    }

    setDeviceCode("");
    setDeviceName("");
    await loadDevices();
    setSaving(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">InfoSync Admin</h1>
        <p className="mt-1 text-gray-600">Manage screens and video playlists</p>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Create new device</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Device code
              </label>
              <input
                value={deviceCode}
                onChange={(e) => setDeviceCode(e.target.value)}
                placeholder="example: salon-screen-1"
                className="mt-2 w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Device name
              </label>
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="example: Salon Screen 1"
                className="mt-2 w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          <button
            onClick={createDevice}
            disabled={saving}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create device"}
          </button>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Devices</h2>

          {loading ? (
            <p className="mt-4 text-gray-500">Loading devices...</p>
          ) : devices.length === 0 ? (
            <p className="mt-4 text-gray-500">No devices yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div>
                    <p className="font-semibold">
                      {device.name || device.device_code}
                    </p>
                    <p className="text-sm text-gray-500">
                      Code: {device.device_code}
                    </p>
                    <p className="text-sm text-gray-500">
                      Display URL: /display/{device.device_code}
                    </p>
                  </div>

                  <Link
                    href={`/admin/devices/${device.device_code}`}
                    className="rounded-lg bg-black px-4 py-2 text-sm text-white"
                  >
                    Manage
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
