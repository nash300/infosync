"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function AdminHomePage() {
  const [customerCount, setCustomerCount] = useState(0);
  const [deviceCount, setDeviceCount] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const needsDeviceCount = customers.filter((c) => {
    const deviceCount = c.devices?.length || 0;
    return c.status === "active" && deviceCount === 0;
  }).length;

  const needsPlaylistCount = customers.filter((c) => {
    return (
      c.status === "active" &&
      c.devices?.some((d: any) => (d.playlists?.[0]?.count || 0) === 0)
    );
  }).length;

  const loadStats = async () => {
    setLoading(true);

    const { count: customers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    const { count: devices } = await supabase
      .from("devices")
      .select("*", { count: "exact", head: true });

    const { data } = await supabase.from("customers").select(`
      id,
      status,
      devices(
        id,
        playlists(count)
      )
    `);

    setCustomerCount(customers || 0);
    setDeviceCount(devices || 0);
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div>
      {/* ==============================
          Page Header
      ============================== */}
      <div className="admin-page-header flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--admin-cyan)]">
            {" "}
            InfoSync Admin
          </p>

          <h1 className="admin-title mt-3">Dashboard</h1>

          <p className="admin-subtitle">
            Overview of customers, screens, and tasks that need attention.
          </p>
        </div>

        <button onClick={loadStats} className="admin-button-primary">
          Refresh
        </button>
      </div>

      {/* ==============================
          Stats Cards
      ============================== */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="admin-card p-6">
          <p className="text-sm font-medium text-slate-500">Total customers</p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-slate-950">
            {loading ? "..." : customerCount}
          </p>
        </div>

        <div className="admin-card p-6">
          <p className="text-sm font-medium text-slate-500">Total devices</p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-slate-950">
            {loading ? "..." : deviceCount}
          </p>
        </div>

        <Link
          href="/admin/customers?filter=needs_device"
          className="admin-card block p-6 no-underline transition hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="text-sm font-medium text-orange-700">
            Clients need device
          </p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-orange-900">
            {loading ? "..." : needsDeviceCount}
          </p>
        </Link>

        <Link
          href="/admin/customers?filter=needs_playlist"
          className="admin-card block p-6 no-underline transition hover:-translate-y-1 hover:shadow-xl"
        >
          <p className="text-sm font-medium text-red-700">
            Devices need playlist
          </p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-red-900">
            {loading ? "..." : needsPlaylistCount}
          </p>
        </Link>
      </div>

      {/* ==============================
          Today Priorities
      ============================== */}
      <div className="admin-card mt-8 p-6">
        <h2 className="admin-card-title text-xl">Today’s priorities</h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-5 py-4">
            <div>
              <p className="font-semibold text-orange-900">
                Create missing devices
              </p>
              <p className="text-sm text-orange-700">
                Active customers without any screen assigned. Go to Customers -
                Needs Device.
              </p>
            </div>

            <span className="rounded-full bg-orange-200 px-3 py-1 text-sm font-bold text-orange-900">
              {needsDeviceCount}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-red-50 px-5 py-4">
            <div>
              <p className="font-semibold text-red-900">
                Upload missing playlists
              </p>
              <p className="text-sm text-red-700">
                Devices that exist but have no content. Go to Customers -
                Missing Playlists.
              </p>
            </div>

            <span className="rounded-full bg-red-200 px-3 py-1 text-sm font-bold text-red-900">
              {needsPlaylistCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
