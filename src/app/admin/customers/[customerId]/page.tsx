"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Device = {
  id: string;
  name: string | null;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const generateDeviceCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const loadData = async () => {
    setLoading(true);

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("name")
      .eq("id", customerId)
      .single();

    if (customerError || !customer) {
      console.error("Customer error:", customerError);
      setCustomerName("");
      setDevices([]);
      setLoading(false);
      return;
    }

    setCustomerName(customer.name);

    const { data: devicesData, error: devicesError } = await supabase
      .from("devices")
      .select("id, name, device_code")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (devicesError) {
      console.error("Devices error:", devicesError);
      setDevices([]);
    } else {
      setDevices(devicesData || []);
    }

    setLoading(false);
  };

  const createDevice = async () => {
    if (!newDeviceName.trim()) {
      alert("Device name is required");
      return;
    }

    setSaving(true);

    let created = false;
    let attempts = 0;

    while (!created && attempts < 5) {
      attempts++;

      const deviceCode = generateDeviceCode();

      const { error } = await supabase.from("devices").insert({
        id: crypto.randomUUID(),
        name: newDeviceName.trim(),
        device_code: deviceCode,
        customer_id: customerId,
        is_active: true,
      });

      if (!error) {
        created = true;
        break;
      }

      if (error.code !== "23505") {
        console.error("Create device error:", error);
        alert("Could not create device.");
        setSaving(false);
        return;
      }
    }

    if (!created) {
      alert("Could not generate a unique device code. Try again.");
      setSaving(false);
      return;
    }

    setNewDeviceName("");
    await loadData();
    setSaving(false);
  };

  useEffect(() => {
    loadData();
  }, [customerId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <p>Loading customer...</p>
      </div>
    );
  }

  if (!customerName) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-bold">Customer not found</h1>
        <Link
          href="/admin/customers"
          className="mt-4 inline-block text-blue-600"
        >
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <Link href="/admin/customers" className="text-sm text-gray-600">
        ← Back to customers
      </Link>

      <h1 className="mt-4 text-3xl font-bold">{customerName}</h1>
      <p className="mt-2 text-gray-600">
        Manage this customer’s display screens.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Add device</h2>

        <div className="mt-3 flex gap-2">
          <input
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            placeholder="Example: Reception Screen"
            className="w-full rounded-lg border px-3 py-2"
          />

          <button
            onClick={createDevice}
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Devices</h2>

        {devices.length === 0 ? (
          <p className="mt-4 text-gray-500">No devices yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {devices.map((device) => (
              <div key={device.id} className="rounded-lg border p-4">
                <p className="font-semibold">
                  {device.name || "Unnamed device"}
                </p>

                <p className="text-sm text-gray-500">
                  Device code: {device.device_code}
                </p>

                <p className="text-sm text-gray-500">
                  Display: /display/{device.device_code}
                </p>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/admin/devices/${device.device_code}`}
                    className="rounded bg-black px-3 py-2 text-xs text-white"
                  >
                    Manage
                  </Link>

                  <a
                    href={`/display/${device.device_code}`}
                    target="_blank"
                    className="rounded border px-3 py-2 text-xs"
                  >
                    Preview
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
