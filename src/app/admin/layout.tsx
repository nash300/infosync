import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 border-r bg-white">
        <div className="border-b px-6 py-5">
          <Link href="/admin" className="text-xl font-bold">
            InfoSync
          </Link>
          <p className="mt-1 text-xs text-gray-500">Admin panel</p>
        </div>

        <nav className="space-y-1 p-4 text-sm">
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-black"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/customers"
            className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-black"
          >
            Customers
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
