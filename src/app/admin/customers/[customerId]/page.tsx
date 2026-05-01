"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  organisation_number: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  notes: string | null;
  status: string | null;
  onboarding_token: string | null;
  onboarding_token_expires_at: string | null;
  terms_accepted_at: string | null;
  privacy_accepted_at: string | null;
  marketing_consent: boolean | null;
  payment_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  activated_at: string | null;
};

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

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceName, setNewDeviceName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);

    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .select(
        `
        id,
        name,
        email,
        phone,
        contact_person,
        organisation_number,
        address,
        city,
        country,
        notes,
        status,
        onboarding_token,
        onboarding_token_expires_at,
        terms_accepted_at,
        privacy_accepted_at,
        marketing_consent,
        payment_status,
        stripe_customer_id,
        stripe_subscription_id,
        activated_at
      `,
      )
      .eq("id", customerId)
      .single();

    if (customerError || !customerData) {
      console.error("Customer error:", customerError);
      setCustomer(null);
      setDevices([]);
      setLoading(false);
      return;
    }

    setCustomer(customerData as Customer);

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

    const { error } = await supabase.from("devices").insert({
      id: crypto.randomUUID(),
      name: newDeviceName.trim(),
      customer_id: customerId,
      is_active: true,
    });

    if (error) {
      console.error("Create device error:", error);
      alert("Could not create device.");
      setSaving(false);
      return;
    }

    setNewDeviceName("");
    await loadData();
    setSaving(false);
  };

  const generateOnboardingLink = async () => {
    if (!customer) return;

    setSaving(true);

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { error } = await supabase
      .from("customers")
      .update({
        onboarding_token: token,
        onboarding_token_expires_at: expiresAt.toISOString(),
        status: "invited",
      })
      .eq("id", customer.id);

    if (error) {
      console.error("Generate onboarding link error:", error);
      alert("Could not generate onboarding link.");
      setSaving(false);
      return;
    }

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

  if (!customer) {
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

      <h1 className="mt-4 text-3xl font-bold">{customer.name}</h1>

      <span
        className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
          customer.status === "active"
            ? "bg-green-100 text-green-700"
            : customer.status === "invited"
              ? "bg-blue-100 text-blue-700"
              : customer.status === "suspended"
                ? "bg-red-100 text-red-700"
                : customer.status === "completed_profile"
                  ? "bg-purple-100 text-purple-700"
                  : customer.status === "accepted_terms"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
        }`}
      >
        {customer.status || "draft"}
      </span>

      <p className="mt-2 text-gray-600">
        Manage this customer’s onboarding and display screens.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Onboarding</h2>

        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <p>
            Onboarding token: {customer.onboarding_token || "Not generated yet"}
          </p>

          <p>
            Token expires:{" "}
            {customer.onboarding_token_expires_at || "Not generated yet"}
          </p>

          <p>Terms accepted: {customer.terms_accepted_at ? "Yes" : "No"}</p>

          <p>Privacy accepted: {customer.privacy_accepted_at ? "Yes" : "No"}</p>

          <p>Marketing consent: {customer.marketing_consent ? "Yes" : "No"}</p>

          <p>Payment status: {customer.payment_status || "Not paid"}</p>
          <p>
            Stripe customer: {customer.stripe_customer_id || "Not created yet"}
          </p>

          <p>
            Stripe subscription:{" "}
            {customer.stripe_subscription_id || "Not created yet"}
          </p>

          <p>Activated at: {customer.activated_at || "Not active yet"}</p>
        </div>

        {customer.status === "active" ? (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Onboarding completed. Customer is active and paid.
          </p>
        ) : (
          <>
            <button
              onClick={generateOnboardingLink}
              disabled={saving}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Generating..." : "Generate onboarding link"}
            </button>

            {customer.onboarding_token && (
              <p className="mt-3 break-all rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
                Onboarding link: /onboarding/{customer.onboarding_token}
              </p>
            )}
          </>
        )}
      </div>

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
