"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

type Device = {
  id: string;
  name: string;
  device_code: string;
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);

  const [customerName, setCustomerName] = useState("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceName, setNewDeviceName] = useState("");

  const loadData = async () => {
    const { data: customer } = await supabase
      .from("customers")
      .select("name")
      .eq("id", customerId)
      .single();

    setCustomerName(customer?.name || "");

    const { data: devicesData } = await supabase
      .from("devices")
      .select("id, name, device_code")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    setDevices(devicesData || []);
  };

  const createDevice = async () => {
    if (!newDeviceName.trim()) return;

    const code = newDeviceName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await supabase.from("devices").insert({
      id: crypto.randomUUID(),
      name: newDeviceName,
      device_code: code,
      customer_id: customerId,
      is_active: true,
    });

    setNewDeviceName("");
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">{customerName}</h1>
      <p className="mt-2 text-gray-600">Manage devices for this customer.</p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Add device</h2>

        <div className="mt-3 flex gap-2">
          <input
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="Device name"
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

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Devices</h2>

        {devices.length === 0 ? (
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
