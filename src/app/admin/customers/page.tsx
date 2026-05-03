"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  devices: {
    id: string;
    playlists: { count: number }[];
  }[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("filter") || "all",
  );
  const statusFilters = [
    { value: "all", label: "All" },
    { value: "needs_device", label: "Needs device" },
    { value: "needs_playlist", label: "Needs playlist" },
    { value: "draft", label: "Draft" },
    { value: "invited", label: "Invited" },
    { value: "active", label: "Active" },
    { value: "suspended", label: "Suspended" },
  ];
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        status,
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
    const filterFromUrl = searchParams.get("filter") || "all";
    setStatusFilter(filterFromUrl);
  }, [searchParams]);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const createCustomer = async () => {
    setMessage("");

    if (!name.trim()) {
      setMessage("Customer name is required.");
      return;
    }

    if (!email.trim()) {
      setMessage("Email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Email address is not valid.");
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
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setEmail("");
    setMessage("Customer draft created successfully.");

    await loadCustomers();
    setSaving(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

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
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="text-3xl font-bold">Customers</h1>
      <p className="mt-2 text-gray-600">
        Create customer drafts, search records, and open customer profiles.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Create customer draft</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Company name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Salon Bella"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Contact email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        {message && (
          <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
            {message}
          </p>
        )}

        <button
          onClick={createCustomer}
          disabled={saving}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create customer draft"}
        </button>
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Search customer</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusFilters.map((status) => {
            const count = getFilterCount(status.value);
            const isActive = statusFilter === status.value;
            const shouldFlag =
              (status.value === "needs_device" ||
                status.value === "needs_playlist") &&
              count > 0 &&
              !isActive;

            return (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  isActive
                    ? "bg-black text-white shadow-sm"
                    : shouldFlag
                      ? "border border-red-200 bg-red-50 text-red-700 shadow-sm ring-2 ring-red-100"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="mt-4 w-full rounded-lg border px-3 py-2"
        />

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-gray-500">No customers found.</p>
          ) : (
            filteredCustomers.map((customer) => {
              const deviceCount = getDeviceCount(customer);

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
                <Link
                  key={customer.id}
                  href={`/admin/customers/${customer.id}`}
                  className="block rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      <p className="text-sm text-gray-500">
                        {customer.email || "No email"} ·{" "}
                        {customer.phone || "No phone"}
                      </p>

                      {setupStatus && (
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            setupStatus === "Ready"
                              ? "text-green-600"
                              : setupStatus === "Needs device"
                                ? "text-orange-600"
                                : "text-red-600"
                          }`}
                        >
                          Setup: {setupStatus}
                        </p>
                      )}
                    </div>

                    <div className="text-right text-sm text-gray-500">
                      <p>Devices: {deviceCount}</p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-700"
                            : customer.status === "invited"
                              ? "bg-blue-100 text-blue-700"
                              : customer.status === "suspended"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {customer.status || "draft"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
