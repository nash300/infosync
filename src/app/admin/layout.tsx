import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      <header className="h-[65px] border-b bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
          <Link href="/admin" className="text-xl font-bold">
            InfoSync Admin
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-gray-700 hover:text-black">
              Dashboard
            </Link>

            <Link
              href="/admin/customers"
              className="text-gray-700 hover:text-black"
            >
              Customers
            </Link>
          </nav>
        </div>
      </header>

      <main className="h-[calc(100vh-65px)] overflow-y-auto">{children}</main>
    </div>
  );
}
