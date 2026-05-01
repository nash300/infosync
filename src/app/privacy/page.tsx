export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>

      <p className="mt-4 text-gray-600">
        This policy explains how InfoSync handles personal data.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Data collected</h2>
      <p className="mt-2 text-gray-600">
        We collect contact details, company information, and usage data.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Usage</h2>
      <p className="mt-2 text-gray-600">
        Data is used to provide and improve the service.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Third parties</h2>
      <p className="mt-2 text-gray-600">
        Payments are handled by Stripe. We do not store card details.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Rights</h2>
      <p className="mt-2 text-gray-600">
        Users can request access or deletion of their data.
      </p>
    </div>
  );
}
