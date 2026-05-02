"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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
    <div className="mx-auto max-w-7xl">
      <div className="rounded-3xl border border-white bg-white/80 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">
          InfoSync Admin
        </p>

        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-950">
              Dashboard
            </h1>
            <p className="mt-2 text-slate-500">
              Overview of customers, screens, and tasks that need attention.
            </p>
          </div>

          <button
            onClick={loadStats}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total customers</p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-slate-950">
            {loading ? "..." : customerCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total devices</p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-slate-950">
            {loading ? "..." : deviceCount}
          </p>
        </div>

        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-sm">
          <p className="text-sm font-medium text-orange-700">
            Clients need device
          </p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-orange-900">
            {loading ? "..." : needsDeviceCount}
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-sm">
          <p className="text-sm font-medium text-red-700">
            Devices need playlist
          </p>
          <p className="mt-4 text-5xl font-bold tracking-tight text-red-900">
            {loading ? "..." : needsPlaylistCount}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Today’s priorities</h2>

        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-2xl bg-orange-50 px-5 py-4">
            <div>
              <p className="font-semibold text-orange-900">
                Create missing devices
              </p>
              <p className="text-sm text-orange-700">
                Active customers without any screen assigned.
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
                Devices that exist but have no content.
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
