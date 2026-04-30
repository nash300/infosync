import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-xl font-bold">
            InfoSync Admin
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin" className="text-gray-700 hover:text-black">
              Dashboard
            </Link>

            <Link
              href="/admin/devices"
              className="text-gray-700 hover:text-black"
            >
              Devices
            </Link>

            <Link href="/login" className="text-gray-700 hover:text-black">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
