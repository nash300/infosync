"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("customers")
      .select("id, name, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load customers error:", error);
      setCustomers([]);
    } else {
      setCustomers(data || []);
    }

    setLoading(false);
  };

  const createCustomer = async () => {
    if (!newName.trim()) {
      alert("Customer name is required");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("customers").insert({
      name: newName.trim(),
    });

    if (error) {
      console.error("Create customer error:", error);
      alert("Could not create customer");
      setSaving(false);
      return;
    }

    setNewName("");
    await loadCustomers();
    setSaving(false);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Customers</h1>
      <p className="mt-2 text-gray-600">
        Manage customers and their display devices.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Add new customer</h2>

        <div className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Customer name"
            className="w-full rounded-lg border px-3 py-2"
          />

          <button
            onClick={createCustomer}
            disabled={saving}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Your customers</h2>

        {loading ? (
          <p className="mt-4 text-gray-500">Loading...</p>
        ) : customers.length === 0 ? (
          <p className="mt-4 text-gray-500">No customers yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="block rounded-lg border p-4 hover:bg-gray-50"
              >
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-gray-500">ID: {customer.id}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
