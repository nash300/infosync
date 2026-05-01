import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F4F7FB] text-slate-900">
      <aside className="flex w-72 flex-col bg-[#08224A] text-white">
        <div className="px-6 py-6">
          <Link href="/admin" className="block">
            <div className="flex items-center justify-center rounded-2xl bg-white p-1 shadow-sm">
              <img
                src="/brand/infosync-logo.png"
                alt="InfoSync"
                className="h-10 w-auto object-contain"
              />
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 px-4 text-sm">
          <Link
            href="/admin"
            className="block rounded-xl px-4 py-3 font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/customers"
            className="block rounded-xl px-4 py-3 font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            Customers
          </Link>
        </nav>

        <div className="px-6 py-5 text-xs text-white/40">InfoSync v0.1</div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full p-8">{children}</div>
      </main>
    </div>
  );
}
