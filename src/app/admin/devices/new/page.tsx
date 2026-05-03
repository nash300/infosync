"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  status: string | null;
};

export default function NewDevicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get("customerId") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState(preselectedCustomerId);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [make, setMake] = useState("Xiaomi");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState("");
  const [supplier, setSupplier] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, name, status")
      .order("name", { ascending: true });

    if (error) {
      console.error("Load customers error:", error);
      setCustomers([]);
      return;
    }

    setCustomers(data || []);
  };

  const createDevice = async () => {
    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    if (!name.trim()) {
      alert("Device name is required.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("devices")
      .insert({
        id: crypto.randomUUID(),
        customer_id: customerId,
        name: name.trim(),
        location: location.trim() || null,
        make: make.trim() || null,
        model: model.trim() || null,
        serial_number: serialNumber.trim() || null,
        purchase_cost: purchaseCost ? Number(purchaseCost) : null,
        purchase_date: purchaseDate || null,
        warranty_period_months: warrantyPeriod ? Number(warrantyPeriod) : null,
        supplier: supplier.trim() || null,
        internal_notes: internalNotes.trim() || null,
        is_active: true,
      })
      .select("device_code")
      .single();

    if (error) {
      console.error("Create device error:", error);
      alert(error.message);
      setSaving(false);
      return;
    }

    router.push(`/admin/devices/${data.device_code}`);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold">Add device</h1>
      <p className="mt-2 text-slate-500">
        Register a physical device and assign it to a customer.
      </p>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Customer *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.status || "draft"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Device name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Menu screen, price list, special offers..."
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Reception, entrance, waiting area..."
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Make</label>
            <input
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="TV Box S 2nd Gen"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Serial number</label>
            <input
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Purchase cost</label>
            <input
              type="number"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              placeholder="599"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Purchase date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Warranty period (months)
            </label>
            <input
              type="number"
              min="0"
              value={warrantyPeriod}
              onChange={(e) => setWarrantyPeriod(e.target.value)}
              placeholder="12"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Supplier</label>
            <input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Elgiganten, Amazon, etc."
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">Internal notes</label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={4}
          />
        </div>

        <button
          onClick={createDevice}
          disabled={saving}
          className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create device"}
        </button>
      </div>
    </div>
  );
}
