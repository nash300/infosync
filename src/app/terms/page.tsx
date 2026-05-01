export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Terms & Conditions</h1>

      <p className="mt-4 text-gray-600">
        These Terms & Conditions govern the use of InfoSync digital signage
        service.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Service</h2>
      <p className="mt-2 text-gray-600">
        InfoSync provides a platform to manage and display digital content on
        connected devices.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Payments</h2>
      <p className="mt-2 text-gray-600">
        Subscription fees are billed via Stripe. Failure to pay may result in
        suspension.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Usage</h2>
      <p className="mt-2 text-gray-600">
        Customers are responsible for the content displayed on their devices.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Termination</h2>
      <p className="mt-2 text-gray-600">
        Accounts may be suspended if terms are violated or payments fail.
      </p>
    </div>
  );
}
