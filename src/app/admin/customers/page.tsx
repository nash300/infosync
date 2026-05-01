"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  devices: { count: number }[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadCustomers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("id, name, email, phone, status, devices(count)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load customers error:", error);
      setCustomers([]);
    } else {
      setCustomers((data || []) as Customer[]);
    }

    setLoading(false);
  };

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

  const filteredCustomers = customers.filter((customer) => {
    const value = search.toLowerCase();

    return (
      customer.name.toLowerCase().includes(value) ||
      customer.email?.toLowerCase().includes(value) ||
      customer.phone?.toLowerCase().includes(value)
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
            filteredCustomers.map((customer) => (
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
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <p>Devices: {customer.devices?.[0]?.count || 0}</p>
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
                    </span>{" "}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
