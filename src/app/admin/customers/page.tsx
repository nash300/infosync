"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  devices: { count: number }[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadCustomers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("id, name, devices(count)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load customers error:", error);
      setMessage(error.message);
      setCustomers([]);
    } else {
      setCustomers((data || []) as Customer[]);
    }

    setLoading(false);
  };

  const createCustomer = async () => {
    setMessage("");

    if (!newName.trim()) {
      setMessage("Customer name is required.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("customers")
      .insert({
        id: crypto.randomUUID(),
        name: newName.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Create customer error:", error);
      setMessage(error.message);
      setSaving(false);
      return;
    }

    console.log("Customer created:", data);

    setNewName("");
    setSearch("");
    await loadCustomers();

    setMessage("Customer added successfully.");
    setSaving(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">Customers</h1>

        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium">Add new customer</p>

          <div className="mt-3 flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Customer name"
              className="flex-1 rounded border px-3 py-2"
            />

            <button
              onClick={createCustomer}
              disabled={saving}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add"}
            </button>
          </div>

          {message && (
            <p className="mt-3 rounded bg-gray-100 p-2 text-sm text-gray-700">
              {message}
            </p>
          )}
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <p className="text-sm font-medium">Search customer</p>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type customer name..."
            className="mt-3 w-full rounded border px-3 py-2"
          />
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold">Results</h2>

          {loading ? (
            <p className="mt-2 text-gray-500">Loading...</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="mt-2 text-gray-500">No customers found.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {filteredCustomers.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/customers/${c.id}`}
                  className="block rounded border p-3 hover:bg-gray-50"
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-500">
                    Devices: {c.devices?.[0]?.count || 0}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
