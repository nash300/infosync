"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Device = {
  id: string;
  name: string | null;
  device_code: string;
  serial_number: string | null;
  location: string | null;
  is_active: boolean | null;
  customers: {
    name: string | null;
    status: string | null;
  } | null;
  playlists: { count: number }[];
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const loadDevices = async () => {
    const { data } = await supabase
      .from("devices")
      .select(
        `
        id,
        name,
        device_code,
        serial_number,
        location,
        is_active,
        customers(name, status),
        playlists(count)
        `,
      )
      .order("created_at", { ascending: false });

    setDevices((data || []) as unknown as Device[]);
    setLoading(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const filteredDevices = devices.filter((device) => {
    const playlistCount = device.playlists?.[0]?.count || 0;

    const matchesSearch =
      device.name?.toLowerCase().includes(search.toLowerCase()) ||
      device.device_code.toLowerCase().includes(search.toLowerCase()) ||
      device.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      device.location?.toLowerCase().includes(search.toLowerCase()) ||
      device.customers?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && device.is_active) ||
      (filter === "inactive" && !device.is_active) ||
      (filter === "needs_playlist" && playlistCount === 0);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Devices</h1>
          <p className="mt-2 text-gray-600">
            Manage your screens and assign video content.
          </p>
        </div>

        <Link
          href="/admin/devices/new"
          className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Add device
        </Link>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Your devices</h2>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, code, customer, serial, location..."
            className="w-full rounded-lg border px-3 py-2 md:max-w-md"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "needs_playlist", label: "Needs playlist" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`rounded-full px-3 py-1 text-sm ${
                  filter === item.value
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-gray-500">Loading...</p>
        ) : filteredDevices.length === 0 ? (
          <p className="mt-4 text-gray-500">No devices yet</p>
        ) : (
          <div className="mt-4 space-y-3">
            {filteredDevices.map((device) => {
              const playlistCount = device.playlists?.[0]?.count || 0;

              return (
                <Link
                  key={device.id}
                  href={`/admin/devices/${device.device_code}`}
                  className="block rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {device.name || "Unnamed device"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Code: {device.device_code}
                      </p>

                      <p className="text-sm text-gray-500">
                        Customer: {device.customers?.name || "Not assigned"}
                      </p>

                      <p className="text-sm text-gray-500">
                        Location: {device.location || "Not set"}
                      </p>

                      {playlistCount === 0 && (
                        <p className="mt-2 text-sm font-medium text-red-600">
                          Needs playlist
                        </p>
                      )}
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      <p>Videos: {playlistCount}</p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          device.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {device.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
