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

  const getStatusClass = (status: string | null) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "invited") return "bg-blue-100 text-blue-700";
    if (status === "suspended") return "bg-red-100 text-red-700";
    if (status === "completed_profile") return "bg-purple-100 text-purple-700";
    if (status === "accepted_terms") return "bg-yellow-100 text-yellow-700";
    return "bg-slate-100 text-slate-700";
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
    if (!confirm("Suspend this customer?")) return;

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

    if (
      !confirm(
        "Cancel this customer's Stripe subscription and suspend the customer?",
      )
    ) {
      return;
    }

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
    if (!confirm("Reactivate this customer?")) return;

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
      <div className="admin-card p-6">
        <p className="admin-muted">Loading customer...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div>
        <div className="admin-page-header">
          <h1 className="admin-title">Customer not found</h1>
          <p className="admin-subtitle">
            This customer could not be found in the database.
          </p>
        </div>

        <Link href="/admin/customers" className="admin-button-primary">
          Back to customers
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ==============================
          Page Header
      ============================== */}
      <div className="admin-page-header">
        <Link
          href="/admin/customers"
          className="text-sm font-semibold text-[rgb(8,184,238)] no-underline"
        >
          ← Back to customers
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="admin-title">{customer.name}</h1>
            <p className="admin-subtitle">
              Manage this customer’s onboarding and display screens.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
              customer.status,
            )}`}
          >
            {customer.status || "draft"}
          </span>
        </div>
      </div>

      {/* ==============================
          Onboarding
      ============================== */}
      <div className="admin-card p-6">
        <h2 className="admin-card-title text-xl">Onboarding</h2>

        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <InfoRow
            label="Onboarding token"
            value={customer.onboarding_token || "Not generated yet"}
          />
          <InfoRow
            label="Token expires"
            value={customer.onboarding_token_expires_at || "Not generated yet"}
          />
          <InfoRow
            label="Terms accepted"
            value={customer.terms_accepted_at ? "Yes" : "No"}
          />
          <InfoRow
            label="Privacy accepted"
            value={customer.privacy_accepted_at ? "Yes" : "No"}
          />
          <InfoRow
            label="Marketing consent"
            value={customer.marketing_consent ? "Yes" : "No"}
          />
          <InfoRow
            label="Payment status"
            value={customer.payment_status || "Not paid"}
          />
          <InfoRow
            label="Stripe customer"
            value={customer.stripe_customer_id || "Not created yet"}
          />
          <InfoRow
            label="Stripe subscription"
            value={customer.stripe_subscription_id || "Not created yet"}
          />
          <InfoRow
            label="Activated at"
            value={customer.activated_at || "Not active yet"}
          />
          <InfoRow
            label="Inactive reason"
            value={formatInactiveReason(customer.inactive_reason)}
          />
          <InfoRow
            label="Cancelled at"
            value={customer.cancelled_at || "Not cancelled"}
          />
          <InfoRow
            label="Cancellation source"
            value={formatCancellationSource(customer.cancellation_source)}
          />
        </div>

        <div className="mt-6">
          {customer.status === "active" ? (
            <>
              <p className="rounded-2xl bg-green-50 p-4 text-sm font-medium text-green-700">
                Onboarding completed. Customer is active and paid.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={suspendCustomer}
                  disabled={saving}
                  className="rounded-xl bg-yellow-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Suspend customer"}
                </button>

                {customer.stripe_subscription_id && (
                  <button
                    onClick={cancelSubscription}
                    disabled={saving}
                    className="rounded-xl bg-red-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Cancel subscription"}
                  </button>
                )}
              </div>
            </>
          ) : customer.status === "suspended" ? (
            <>
              <p className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700">
                Customer is suspended. Displays should not run for this
                customer.
              </p>

              <button
                onClick={reactivateCustomer}
                disabled={saving}
                className="mt-4 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Reactivate customer"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={generateOnboardingLink}
                disabled={saving}
                className="admin-button-primary"
              >
                {saving ? "Generating..." : "Generate onboarding link"}
              </button>

              {customer.onboarding_token && (
                <p className="mt-4 break-all rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                  Onboarding link: /onboarding/{customer.onboarding_token}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ==============================
          Device Management
      ============================== */}
      <div className="admin-card mt-6 p-6">
        <h2 className="admin-card-title text-xl">Device management</h2>

        <p className="admin-muted mt-2 text-sm">
          Add a device through Device Management so inventory, warranty, and
          assignment records are stored correctly.
        </p>

        <Link
          href={`/admin/devices/new?customerId=${customer.id}`}
          className="admin-button-primary mt-4"
        >
          Add device for this customer
        </Link>
      </div>

      {/* ==============================
          Devices
      ============================== */}
      <div className="admin-card mt-6 p-6">
        <h2 className="admin-card-title text-xl">Devices</h2>

        {devices.length === 0 ? (
          <p className="admin-muted mt-4">No devices yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {devices.map((device) => (
              <div
                key={device.id}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4"
              >
                <p className="font-semibold text-slate-950">
                  {device.name || "Unnamed device"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Device code: {device.device_code}
                </p>

                <p className="text-sm text-slate-500">
                  Display: /display/{device.device_code}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/devices/${device.device_code}`}
                    className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white no-underline"
                  >
                    Manage
                  </Link>

                  <a
                    href={`/display/${device.device_code}`}
                    target="_blank"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 no-underline"
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}
