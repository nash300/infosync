export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Integritetspolicy</h1>

      <p className="mt-4 text-gray-600">
        Denna policy beskriver hur InfoSync behandlar personuppgifter och
        företagsuppgifter i samband med start av tjänsten, betalning, support och
        leverans av tjänsten.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Uppgifter vi samlar in</h2>
      <p className="mt-2 text-gray-600">
        Vi samlar in kontaktuppgifter, företagsuppgifter, samtycken,
        betalningsstatus och information som behövs för att hantera skärmar och
        innehåll.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Hur uppgifterna används</h2>
      <p className="mt-2 text-gray-600">
        Uppgifterna används för att skapa kundkonto, hantera starten,
        administrera betalningar, ge support och leverera InfoSync-tjänsten.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Tredjepartstjänster</h2>
      <p className="mt-2 text-gray-600">
        Betalningar hanteras av Stripe. InfoSync lagrar inte kortuppgifter.
        E-postmeddelanden kan skickas via Resend.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Dina rättigheter</h2>
      <p className="mt-2 text-gray-600">
        Du kan begära information om vilka uppgifter som behandlas och be om
        rättelse eller radering när det är möjligt enligt lag och avtal.
      </p>
    </div>
  );
}
