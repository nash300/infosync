"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { showAdminNotification } from "@/lib/admin/notifications";

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

type AuditEvent = {
  id: string;
  event_type: string;
  event_description: string;
  actor_type: string;
  created_at: string;
};

type ConsentRecord = {
  id: string;
  consent_type: string;
  granted: boolean;
  document_name: string;
  document_version: string;
  created_at: string;
};

type DisplayAsset = {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
  downloadUrl: string | null;
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = use(params);
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [displayAssets, setDisplayAssets] = useState<DisplayAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editContactPerson, setEditContactPerson] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editNotes, setEditNotes] = useState("");

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
    if (status === "new_request") return "bg-yellow-100 text-yellow-800";
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
      setDisplayAssets([]);
      setLoading(false);
      return;
    }

    const loadedCustomer = customerData as Customer;

    setCustomer(loadedCustomer);
    setEditName(loadedCustomer.name || "");
    setEditContactPerson(loadedCustomer.contact_person || "");
    setEditPhone(loadedCustomer.phone || "");
    setEditAddress(loadedCustomer.address || "");
    setEditCity(loadedCustomer.city || "");
    setEditCountry(loadedCustomer.country || "");
    setEditNotes(loadedCustomer.notes || "");

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

    const { data: auditData, error: auditError } = await supabase
      .from("audit_events")
      .select("id, event_type, event_description, actor_type, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(12);

    if (auditError) {
      console.warn("Audit events unavailable:", auditError.message);
      setAuditEvents([]);
    } else {
      setAuditEvents((auditData || []) as AuditEvent[]);
    }

    const { data: consentData, error: consentError } = await supabase
      .from("consent_records")
      .select("id, consent_type, granted, document_name, document_version, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (consentError) {
      console.warn("Consent records unavailable:", consentError.message);
      setConsentRecords([]);
    } else {
      setConsentRecords((consentData || []) as ConsentRecord[]);
    }

    const assetResponse = await fetch(
      `/api/admin/customer-assets?customerId=${customerId}`,
    );

    if (assetResponse.ok) {
      const assetData = await assetResponse.json();
      setDisplayAssets(assetData.assets || []);
    } else {
      setDisplayAssets([]);
    }

    setLoading(false);
  };

  const getPreferredLanguage = () => {
    const match = customer?.notes?.match(/Preferred language:\s*(en|sv)/i);
    return match?.[1]?.toUpperCase() || "SV";
  };

  const getStartGuideSentAt = () => {
    const match = customer?.notes?.match(/Start guide email sent:\s*(.+)/i);
    return match?.[1] || "Not sent yet";
  };

  const saveCustomerDetails = async () => {
    if (!customer) return;

    if (!editName.trim()) {
      showAdminNotification("warning", "Company name is required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("customers")
      .update({
        name: editName.trim(),
        contact_person: editContactPerson.trim() || null,
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
        city: editCity.trim() || null,
        country: editCountry.trim() || null,
        notes: editNotes.trim() || null,
      })
      .eq("id", customer.id);

    if (error) {
      console.error("Save customer details error:", error);
      showAdminNotification("error", "Could not save customer details.");
      setSaving(false);
      return;
    }

    await loadData();
    showAdminNotification("success", "Customer details updated.");
    setSaving(false);
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
      showAdminNotification("error", "Could not suspend customer.");
      setSaving(false);
      return;
    }

    await loadData();
    showAdminNotification("warning", "Customer suspended.");
    setSaving(false);
  };

  const cancelSubscription = async () => {
    if (!customer) return;

    if (!customer.stripe_subscription_id) {
      showAdminNotification("warning", "No Stripe subscription found.");
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
      showAdminNotification(
        "error",
        data.error || "Could not cancel subscription.",
      );
      setSaving(false);
      return;
    }

    await loadData();
    showAdminNotification("success", "Subscription cancelled and customer suspended.");
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
      showAdminNotification("error", "Could not reactivate customer.");
      setSaving(false);
      return;
    }

    await loadData();
    showAdminNotification("success", "Customer reactivated.");
    setSaving(false);
  };

  const generateOnboardingLink = async () => {
    if (!customer) return;

    setSaving(true);

    const response = await fetch("/api/admin/send-onboarding-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerId: customer.id }),
    });
    const data: {
      error?: string;
      emailSent?: boolean;
      onboardingUrl?: string;
      sentTo?: string;
      warning?: string;
    } = await response.json();

    if (!response.ok) {
      console.error("Send onboarding email error:", data);
      showAdminNotification(
        "error",
        data.error || "Could not send onboarding email.",
      );
      setSaving(false);
      return;
    }

    await loadData();
    if (data.emailSent) {
      showAdminNotification(
        "success",
        `Onboarding email sent to ${data.sentTo || customer.email}.`,
      );
    } else {
      showAdminNotification(
        "warning",
        data.warning || "Onboarding link generated, but no email was sent.",
      );
    }

    setSaving(false);
  };

  const clearEditableDetails = async () => {
    if (!customer) return;

    if (
      !confirm(
        "Clear editable customer details? Static identifiers, legal consent, payment data, and system history will be kept.",
      )
    ) {
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("customers")
      .update({
        contact_person: null,
        phone: null,
        address: null,
        city: null,
        country: null,
        notes: null,
      })
      .eq("id", customer.id);

    if (error) {
      console.error("Clear customer details error:", error);
      showAdminNotification("error", "Could not clear editable details.");
      setSaving(false);
      return;
    }

    await loadData();
    showAdminNotification("success", "Editable customer details cleared.");
    setSaving(false);
  };

  const canDeleteCustomer =
    customer?.status !== "active" &&
    customer?.payment_status !== "paid" &&
    !customer?.stripe_customer_id &&
    !customer?.stripe_subscription_id &&
    devices.length === 0 &&
    consentRecords.length === 0 &&
    displayAssets.length === 0;

  const deleteCustomer = async () => {
    if (!customer || !canDeleteCustomer) return;

    const typedName = prompt(
      `Type the customer name exactly to delete this record:\n${customer.name}`,
    );

    if (typedName !== customer.name) {
      showAdminNotification("warning", "Customer deletion was not confirmed.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", customer.id);

    if (error) {
      console.error("Delete customer error:", error);
      showAdminNotification("error", "Could not delete customer.");
      setSaving(false);
      return;
    }

    showAdminNotification("success", "Customer record deleted.");
    router.push("/admin/customers?filter=all");
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
          Back to customers
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="admin-title">{customer.name}</h1>
            <p className="admin-subtitle">
              Manage this customer&apos;s onboarding and display screens.
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
          Customer Details
      ============================== */}
      <div className="admin-detail-grid">
        <section className="admin-card p-6">
          <h2 className="admin-card-title text-xl">Editable details</h2>
          <p className="admin-muted mt-2 text-sm">
            Update operational customer details. Legal, payment, and system
            identifiers are protected separately.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input
              label="Company name"
              value={editName}
              onChange={setEditName}
              required
            />
            <Input
              label="Contact person"
              value={editContactPerson}
              onChange={setEditContactPerson}
            />
            <Input label="Phone" value={editPhone} onChange={setEditPhone} />
            <Input label="City" value={editCity} onChange={setEditCity} />
            <Input
              label="Address"
              value={editAddress}
              onChange={setEditAddress}
            />
            <Input
              label="Country"
              value={editCountry}
              onChange={setEditCountry}
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-semibold text-slate-700">
              Internal notes
            </label>
            <textarea
              value={editNotes}
              onChange={(event) => setEditNotes(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--admin-cyan)] focus:ring-2 focus:ring-cyan-100"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={saveCustomerDetails}
              disabled={saving}
              className="admin-button-primary disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={clearEditableDetails}
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Clear editable details
            </button>
          </div>
        </section>

        <section className="admin-card p-6">
          <h2 className="admin-card-title text-xl">Protected record</h2>
          <p className="admin-muted mt-2 text-sm">
            Static identifiers, payment references, and consent history are
            visible here, but not edited from this panel.
          </p>

          <div className="admin-compact-info-grid mt-4">
            <InfoRow label="Customer ID" value={customer.id} />
            <InfoRow label="Contact email" value={customer.email || "Not set"} />
            <InfoRow
              label="Organisation number"
              value={customer.organisation_number || "Not set"}
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
          </div>
        </section>
      </div>

      {/* ==============================
          Onboarding
      ============================== */}
      <div className="admin-card p-6">
        <h2 className="admin-card-title text-xl">Onboarding</h2>

        {customer.payment_status === "paid" && devices.length === 0 && (
          <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-800">
            Payment is complete. This customer is waiting for screen/device
            setup and playlist preparation.
          </p>
        )}

        <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
          <InfoRow
            label="Onboarding token"
            value={customer.onboarding_token || "Not generated yet"}
          />
          <InfoRow
            label="Token expires"
            value={customer.onboarding_token_expires_at || "Not generated yet"}
          />
          <InfoRow label="Preferred language" value={getPreferredLanguage()} />
          <InfoRow label="Start guide email sent" value={getStartGuideSentAt()} />
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
          {customer.onboarding_token && !customer.terms_accepted_at && (
            <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              The setup link has been sent, but the customer has not completed
              the form yet. Confirm the email address, preferred language, sent
              timestamp, and expiry above before following up.
            </p>
          )}

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
                {saving
                  ? "Sending..."
                  : customer.status === "new_request"
                    ? "Send onboarding link"
                    : "Generate onboarding link"}
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

      <div className="admin-card mt-6 p-6">
        <h2 className="admin-card-title text-xl">Customer display material</h2>

        {displayAssets.length === 0 ? (
          <p className="admin-muted mt-4">No display material uploaded yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {displayAssets.map((asset) => (
              <div
                key={asset.id}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4"
              >
                <p className="font-semibold text-slate-950">
                  {asset.fileName}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {asset.contentType} - {Math.ceil(asset.fileSize / 1024)} KB -{" "}
                  {new Date(asset.createdAt).toLocaleString()}
                </p>
                {asset.downloadUrl && (
                  <a
                    href={asset.downloadUrl}
                    target="_blank"
                    className="mt-3 inline-flex rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 no-underline"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card mt-6 p-6">
        <h2 className="admin-card-title text-xl">Consent records</h2>

        {consentRecords.length === 0 ? (
          <p className="admin-muted mt-4">
            No consent history found. Run the audit and consent database
            migration if this section should be active.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {consentRecords.map((record) => (
              <div
                key={record.id}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4"
              >
                <p className="font-semibold text-slate-950">
                  {record.document_name} v{record.document_version}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {record.consent_type} - {record.granted ? "Granted" : "Declined"} -{" "}
                  {new Date(record.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card mt-6 p-6">
        <h2 className="admin-card-title text-xl">System history</h2>

        {auditEvents.length === 0 ? (
          <p className="admin-muted mt-4">
            No action history found. Run the audit and consent database
            migration if this section should be active.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {auditEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-slate-200 bg-white/70 p-4"
              >
                <p className="font-semibold text-slate-950">
                  {event.event_description}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {event.event_type} - {event.actor_type} -{" "}
                  {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card admin-danger-panel mt-6 p-6">
        <h2 className="admin-card-title text-xl">Controlled deletion</h2>
        <p className="admin-muted mt-2 text-sm">
          Draft or unused customer records can be deleted after exact-name
          confirmation. Active customers, paid customers, Stripe records,
          assigned devices, uploaded material, and consent history are protected
          from accidental deletion.
        </p>

        {canDeleteCustomer ? (
          <button
            onClick={deleteCustomer}
            disabled={saving}
            className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 disabled:opacity-50"
          >
            Delete customer record
          </button>
        ) : (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Deletion locked because this record has business-critical payment,
            device, active status, or consent data.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-info-row-compact">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--admin-cyan)] focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}
