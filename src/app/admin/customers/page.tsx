"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { showAdminNotification } from "@/lib/admin/notifications";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  notes: string | null;
  status: string | null;
  onboarding_token: string | null;
  onboarding_token_expires_at: string | null;
  terms_accepted_at: string | null;
  payment_status: string | null;
  devices: {
    id: string;
    playlists: { count: number }[];
  }[];
};

const statusFilters = [
  { value: "new_request", label: "New requests" },
  { value: "invited_pending", label: "Link sent, incomplete" },
  { value: "paid_setup", label: "Payment complete" },
  { value: "needs_device", label: "Needs device" },
  { value: "needs_playlist", label: "Needs playlist" },
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "invited", label: "Invited" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersFallback />}>
      <CustomersPageContent />
    </Suspense>
  );
}

function CustomersFallback() {
  return (
    <div className="admin-card p-6">
      <p className="admin-muted">Loading customers...</p>
    </div>
  );
}

function CustomersPageContent() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("filter") || "all",
  );
  const [hasSelectedFilter, setHasSelectedFilter] = useState(
    Boolean(searchParams.get("filter")),
  );

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select(
        `
        id,
        name,
        email,
        phone,
        contact_person,
        notes,
        status,
        onboarding_token,
        onboarding_token_expires_at,
        terms_accepted_at,
        payment_status,
        devices(
          id,
          playlists(count)
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load customers error:", error);
      setCustomers([]);
    } else {
      setCustomers((data || []) as Customer[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    const filter = searchParams.get("filter");
    setStatusFilter(filter || "all");
    setHasSelectedFilter(Boolean(filter));
  }, [searchParams]);

  useEffect(() => {
    loadCustomers();

    const refreshInterval = window.setInterval(loadCustomers, 30000);
    const refreshOnFocus = () => loadCustomers();

    window.addEventListener("focus", refreshOnFocus);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, []);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const createCustomer = async () => {
    if (!name.trim()) {
      showAdminNotification("warning", "Customer name is required.");
      return;
    }

    if (!email.trim()) {
      showAdminNotification("warning", "Email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      showAdminNotification("warning", "Email address is not valid.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("customers").insert({
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      status: "draft",
    });

    if (error) {
      console.error("Create customer error:", error);
      showAdminNotification("error", error.message || "Could not create customer.");
      setSaving(false);
      return;
    }

    setName("");
    setEmail("");
    showAdminNotification("success", "Customer draft created successfully.");

    await loadCustomers();
    setSaving(false);
  };

  const getDeviceCount = (customer: Customer) => {
    return customer.devices?.length || 0;
  };

  const hasDeviceWithoutPlaylist = (customer: Customer) => {
    return customer.devices?.some(
      (device) => (device.playlists?.[0]?.count || 0) === 0,
    );
  };

  const matchesCustomerFilter = (customer: Customer, filter: string) => {
    const deviceCount = getDeviceCount(customer);

    if (filter === "all") return true;

    if (filter === "needs_device") {
      return customer.status === "active" && deviceCount === 0;
    }

    if (filter === "paid_setup") {
      return customer.payment_status === "paid" && deviceCount === 0;
    }

    if (filter === "invited_pending") {
      return Boolean(
        customer.onboarding_token &&
          !customer.terms_accepted_at &&
          customer.status !== "active" &&
          customer.status !== "suspended",
      );
    }

    if (filter === "needs_playlist") {
      return customer.status === "active" && hasDeviceWithoutPlaylist(customer);
    }

    return customer.status === filter;
  };

  const getFilterCount = (filter: string) => {
    return customers.filter((customer) =>
      matchesCustomerFilter(customer, filter),
    ).length;
  };

  const getStatusClass = (status: string | null) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "invited") return "bg-blue-100 text-blue-700";
    if (status === "suspended") return "bg-red-100 text-red-700";
    if (status === "new_request") return "bg-yellow-100 text-yellow-800";
    return "bg-slate-100 text-slate-700";
  };

  const getRequestedPlan = (customer: Customer) => {
    const match = customer.notes?.match(/Requested plan:\s*(.+)/i);
    return match?.[1] || null;
  };

  const getPreferredLanguage = (customer: Customer) => {
    const match = customer.notes?.match(/Preferred language:\s*(en|sv)/i);
    return match?.[1]?.toUpperCase() || "SV";
  };

  const getStartGuideSentAt = (customer: Customer) => {
    const match = customer.notes?.match(/Start guide email sent:\s*(.+)/i);
    return match?.[1] || null;
  };

  const openCustomer = (customerId: string) => {
    router.push(`/admin/customers/${customerId}`);
  };

  const generateOnboardingLink = async (customer: Customer) => {
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

    await loadCustomers();
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

  const filteredCustomers = customers.filter((customer) => {
    const value = search.toLowerCase();

    return (
      matchesCustomerFilter(customer, statusFilter) &&
      (customer.name.toLowerCase().includes(value) ||
        customer.email?.toLowerCase().includes(value) ||
        customer.phone?.toLowerCase().includes(value))
    );
  });

  return (
    <div className="admin-customers-page">
      {/* ==============================
          Page Header
      ============================== */}
      <div className="admin-page-header">
        <h1 className="admin-title">Customers</h1>
        <p className="admin-subtitle">
          Create customer drafts, search records, and open customer profiles.
        </p>
      </div>

      <div className="admin-customers-controls">
        {/* ==============================
            Create Customer Draft
        ============================== */}
        <section className="admin-card admin-customers-create p-6">
          <h2 className="admin-card-title text-xl">Create customer draft</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Company name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Example: Salon Bella"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[rgb(8,184,238)] focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Contact email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[rgb(8,184,238)] focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>

          <button
            onClick={createCustomer}
            disabled={saving}
            className="admin-button-primary mt-4 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create customer draft"}
          </button>
        </section>

        {/* ==============================
            Search Customers
        ============================== */}
        <section className="admin-card admin-customers-search p-6">
          <h2 className="admin-card-title text-xl">Search customers</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {statusFilters.map((status) => {
              const count = getFilterCount(status.value);
              const isActive = hasSelectedFilter && statusFilter === status.value;
              const shouldFlag =
                (status.value === "new_request" ||
                  status.value === "invited_pending" ||
                  status.value === "paid_setup" ||
                  status.value === "needs_device" ||
                  status.value === "needs_playlist") &&
                count > 0 &&
                !isActive;

              return (
                <button
                  key={status.value}
                  onClick={() => {
                    setStatusFilter(status.value);
                    setHasSelectedFilter(true);
                  }}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-sm"
                      : shouldFlag
                        ? "border border-red-200 bg-red-50 text-red-700 shadow-sm ring-2 ring-red-100"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {shouldFlag && (
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                    {status.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHasSelectedFilter(e.target.value.trim().length > 0);
            }}
            placeholder="Search by name, email, or phone..."
            className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[rgb(8,184,238)] focus:ring-2 focus:ring-cyan-100"
          />
        </section>
      </div>

      {/* ==============================
          Customer List
      ============================== */}
      <section
        className={`admin-card admin-customers-list-panel p-6 ${
          hasSelectedFilter ? "" : "admin-customers-list-panel-empty"
        }`}
      >
        <h2 className="admin-card-title text-xl">Customer list</h2>

        {hasSelectedFilter ? (
          <div className="admin-customer-list mt-4 space-y-3">
          {loading ? (
            <p className="admin-muted">Loading...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="admin-muted">No customers found.</p>
          ) : (
            filteredCustomers.map((customer) => {
              const deviceCount = getDeviceCount(customer);
              const requestedPlan = getRequestedPlan(customer);
              const customerHasDeviceWithoutPlaylist =
                hasDeviceWithoutPlaylist(customer);

              const setupStatus =
                customer.status !== "active"
                  ? null
                  : deviceCount === 0
                    ? "Needs device"
                    : customerHasDeviceWithoutPlaylist
                      ? "Needs playlist"
                      : "Ready";

              return (
                <article
                  key={customer.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openCustomer(customer.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openCustomer(customer.id);
                    }
                  }}
                  className="admin-customer-row rounded-2xl border border-slate-200 bg-white/70 p-4 transition hover:bg-white hover:shadow-md"
                >
                  <div className="admin-customer-row-main">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-950">
                        {customer.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {customer.email || "No email"}
                      </p>
                    </div>

                    <div className="admin-customer-row-meta">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          customer.status,
                        )}`}
                      >
                        {customer.status || "draft"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {deviceCount} devices
                      </span>
                    </div>
                  </div>

                  <div className="admin-customer-row-details">
                    <span>{customer.contact_person || "No contact"}</span>
                    <span>{customer.phone || "No phone"}</span>
                    {requestedPlan && <span>{requestedPlan}</span>}
                    {customer.payment_status && (
                      <span>Payment: {customer.payment_status}</span>
                    )}
                    {customer.onboarding_token && !customer.terms_accepted_at && (
                      <span className="text-blue-700">
                        Link sent, form incomplete
                      </span>
                    )}
                    {getStartGuideSentAt(customer) && (
                      <span>Sent: {getStartGuideSentAt(customer)}</span>
                    )}
                    {customer.onboarding_token_expires_at && (
                      <span>Expires: {customer.onboarding_token_expires_at}</span>
                    )}
                    <span>Language: {getPreferredLanguage(customer)}</span>
                    {setupStatus && <span>Setup: {setupStatus}</span>}
                    {customer.payment_status === "paid" && deviceCount === 0 && (
                      <span className="text-blue-700">
                        Payment complete, screen setup needed
                      </span>
                    )}
                  </div>

                  {customer.status === "new_request" && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        generateOnboardingLink(customer);
                      }}
                      disabled={saving}
                      className="admin-button-primary mt-3 text-xs disabled:opacity-50"
                    >
                      Send onboarding link
                    </button>
                  )}
                </article>
              );
            })
          )}
          </div>
        ) : (
          <div className="admin-customers-empty-message">
            Select a filter above to load matching customers.
          </div>
        )}
      </section>
    </div>
  );
}
