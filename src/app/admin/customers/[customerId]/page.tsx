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
  inactive_reason: string | null;
  cancelled_at: string | null;
  cancellation_source: string | null;
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const formatInactiveReason = (reason: string | null) => {
    if (reason === "manual_suspend") return "Manually suspended";
    if (reason === "payment_failed") return "Payment failed";
    if (reason === "subscription_cancelled") return "Subscription cancelled";
    if (reason === "customer_cancelled") return "Cancelled by customer";

    return "None";
  };

  const formatCancellationSource = (source: string | null) => {
    if (source === "admin") return "Admin";
    if (source === "customer") return "Customer";
    if (source === "stripe") return "Stripe";

    return "None";
  };

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
        activated_at,
        inactive_reason,
        cancelled_at,
        cancellation_source
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

  const suspendCustomer = async () => {
    if (!customer) return;

    const confirmed = confirm("Suspend this customer?");
    if (!confirmed) return;

    setSaving(true);

    const { error } = await supabase
      .from("customers")
      .update({
        status: "suspended",
        inactive_reason: "manual_suspend",
        cancellation_source: "admin",
      })
      .eq("id", customer.id);

    if (error) {
      console.error("Suspend customer error:", error);
      alert("Could not suspend customer.");
      setSaving(false);
      return;
    }

    await loadData();
    setSaving(false);
  };

  const cancelSubscription = async () => {
    if (!customer) return;

    if (!customer.stripe_subscription_id) {
      alert("No Stripe subscription found.");
      return;
    }

    const confirmed = confirm(
      "Cancel this customer's Stripe subscription and suspend the customer?",
    );

    if (!confirmed) return;

    setSaving(true);

    const response = await fetch("/api/stripe/cancel-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: customer.id,
        subscriptionId: customer.stripe_subscription_id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cancel subscription error:", data);
      alert(data.error || "Could not cancel subscription.");
      setSaving(false);
      return;
    }

    await loadData();
    setSaving(false);
  };

  const reactivateCustomer = async () => {
    if (!customer) return;

    const confirmed = confirm("Reactivate this customer?");
    if (!confirmed) return;

    setSaving(true);

    const { error } = await supabase
      .from("customers")
      .update({
        status: "active",
        inactive_reason: null,
        cancelled_at: null,
        cancellation_source: null,
      })
      .eq("id", customer.id);

    if (error) {
      console.error("Reactivate customer error:", error);
      alert("Could not reactivate customer.");
      setSaving(false);
      return;
    }

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
          <p>
            Inactive reason: {formatInactiveReason(customer.inactive_reason)}
          </p>
          <p>Cancelled at: {customer.cancelled_at || "Not cancelled"}</p>
          <p>
            Cancellation source:{" "}
            {formatCancellationSource(customer.cancellation_source)}
          </p>
        </div>

        {customer.status === "active" ? (
          <>
            <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Onboarding completed. Customer is active and paid.
            </p>

            <button
              onClick={suspendCustomer}
              disabled={saving}
              className="mt-4 rounded-lg bg-yellow-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Suspend customer"}
            </button>

            {customer.stripe_subscription_id && (
              <button
                onClick={cancelSubscription}
                disabled={saving}
                className="ml-3 mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Cancel subscription"}
              </button>
            )}
          </>
        ) : customer.status === "suspended" ? (
          <>
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              Customer is suspended. Displays should not run for this customer.
            </p>

            <button
              onClick={reactivateCustomer}
              disabled={saving}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Reactivate customer"}
            </button>
          </>
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
        <h2 className="text-lg font-semibold">Device management</h2>

        <p className="mt-2 text-sm text-gray-600">
          Add a device through Device Management so inventory, warranty, and
          assignment records are stored correctly.
        </p>

        <Link
          href={`/admin/devices/new?customerId=${customer.id}`}
          className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Add device for this customer
        </Link>
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
