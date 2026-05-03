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
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-title">Add device</h1>
        <p className="admin-subtitle">
          Register a physical device and assign it to a customer.
        </p>
      </div>

      {/* Device Form */}
      <div className="admin-card p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectInput
            label="Customer *"
            value={customerId}
            onChange={setCustomerId}
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.status || "draft"})
              </option>
            ))}
          </SelectInput>

          <TextInput
            label="Device name *"
            value={name}
            onChange={setName}
            placeholder="Menu screen, price list, special offers..."
          />

          <TextInput
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="Reception, entrance, waiting area..."
          />

          <TextInput label="Make" value={make} onChange={setMake} />

          <TextInput
            label="Model"
            value={model}
            onChange={setModel}
            placeholder="TV Box S 2nd Gen"
          />

          <TextInput
            label="Serial number"
            value={serialNumber}
            onChange={setSerialNumber}
          />

          <TextInput
            label="Purchase cost"
            type="number"
            value={purchaseCost}
            onChange={setPurchaseCost}
            placeholder="599"
          />

          <TextInput
            label="Purchase date"
            type="date"
            value={purchaseDate}
            onChange={setPurchaseDate}
          />

          <TextInput
            label="Warranty period (months)"
            type="number"
            value={warrantyPeriod}
            onChange={setWarrantyPeriod}
            placeholder="12"
          />

          <TextInput
            label="Supplier"
            value={supplier}
            onChange={setSupplier}
            placeholder="Elgiganten, Amazon, etc."
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold text-slate-700">
            Internal notes
          </label>
          <textarea
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--admin-cyan)] focus:ring-2 focus:ring-cyan-100"
            rows={4}
          />
        </div>

        <button
          onClick={createDevice}
          disabled={saving}
          className="admin-button-primary mt-6 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create device"}
        </button>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--admin-cyan)] focus:ring-2 focus:ring-cyan-100"
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--admin-cyan)] focus:ring-2 focus:ring-cyan-100"
      >
        {children}
      </select>
    </div>
  );
}
