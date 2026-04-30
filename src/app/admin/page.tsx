"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AdminHomePage() {
  const [customerCount, setCustomerCount] = useState(0);
  const [deviceCount, setDeviceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);

    const { count: customers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    const { count: devices } = await supabase
      .from("devices")
      .select("*", { count: "exact", head: true });

    setCustomerCount(customers || 0);
    setDeviceCount(devices || 0);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of customers and screens.</p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total customers</p>
          <p className="mt-2 text-4xl font-bold">
            {loading ? "..." : customerCount}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm text-gray-500">Total devices</p>
          <p className="mt-2 text-4xl font-bold">
            {loading ? "..." : deviceCount}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Quick actions</h2>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/customers"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Manage customers
          </Link>
        </div>
      </div>
    </div>
  );
}
