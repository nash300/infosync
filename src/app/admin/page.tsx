import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">InfoSync Admin</h1>
        <p className="mt-2 text-gray-600">
          Manage screens, upload videos, and control display content.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/devices"
            className="rounded-xl bg-white p-6 shadow hover:bg-gray-50"
          >
            <h2 className="text-xl font-semibold">Devices</h2>
            <p className="mt-2 text-gray-600">
              Create and manage client screens.
            </p>
          </Link>

          <div className="rounded-xl bg-white p-6 shadow opacity-50">
            <h2 className="text-xl font-semibold">Billing</h2>
            <p className="mt-2 text-gray-600">
              Stripe billing will be added later.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
