import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/devices", label: "Device Management", icon: "🖥️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4f7fb] text-slate-900">
      <aside className="relative flex w-72 flex-col overflow-hidden border-r border-white/10 bg-[#071d3b] text-white shadow-2xl">
        <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-20 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative px-6 py-6">
          <Link href="/admin" className="block no-underline">
            <div className="rounded-2xl border border-white/15 bg-white/95 p-3 shadow-xl shadow-black/20">
              <img
                src="/brand/infosync-logo2.png"
                alt="InfoSync"
                className="mx-auto h-11 w-auto object-contain"
              />
            </div>
          </Link>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
              Admin Panel
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Manage customers, screens, and content.
            </p>
          </div>
        </div>

        <nav className="relative flex-1 space-y-2 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-white/0 px-4 py-3 text-sm font-semibold text-white no-underline transition hover:border-white/10 hover:bg-white/10 hover:text-white hover:no-underline hover:shadow-lg hover:shadow-black/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg ring-1 ring-white/10 transition group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-orange-500 group-hover:ring-white/20">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="relative mx-4 mb-4 rounded-2xl border border-white/10 bg-white/8 p-4 shadow-lg shadow-black/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
            InfoSync
          </p>
          <p className="mt-1 text-xs text-slate-400">Version 0.1</p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-cyan-400 to-orange-500" />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(8,184,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,122,0,0.12),transparent_28%)] p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
