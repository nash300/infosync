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
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organisationNumber, setOrganisationNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sweden");
  const [notes, setNotes] = useState("");
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
    if (!value.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const createCustomer = async () => {
    setMessage("");

    if (!name.trim()) {
      setMessage("Customer name is required.");
      return;
    }

    if (email && !isValidEmail(email)) {
      setMessage("Email address is not valid.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("customers").insert({
      id: crypto.randomUUID(),
      name: name.trim(),
      contact_person: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      organisation_number: organisationNumber.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      country: country.trim() || "Sweden",
      notes: notes.trim() || null,
      status: "active",
    });

    if (error) {
      console.error("Create customer error:", error);
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setOrganisationNumber("");
    setAddress("");
    setCity("");
    setCountry("Sweden");
    setNotes("");
    setMessage("Customer created successfully.");

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
        Add customers, search records, and open customer profiles.
      </p>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Add new customer</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Customer name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Example: Salon Bella"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Contact person</label>
            <input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Example: Anna Svensson"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+46..."
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Organisation number</label>
            <input
              value={organisationNumber}
              onChange={(e) => setOrganisationNumber(e.target.value)}
              placeholder="Example: 559123-4567"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Example: Malmö"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal notes about customer, setup, agreement, etc."
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={3}
          />
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
          {saving ? "Creating..." : "Create customer"}
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
                    <p>Status: {customer.status || "active"}</p>
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
