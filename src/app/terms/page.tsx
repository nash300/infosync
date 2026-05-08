export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Villkor</h1>

      <p className="mt-4 text-gray-600">
        Dessa villkor gäller för användning av InfoSyncs tjänst för digital
        skyltning och skärmhantering.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Tjänsten</h2>
      <p className="mt-2 text-gray-600">
        InfoSync tillhandahåller en plattform för att hantera och visa digitalt
        innehåll på anslutna skärmar och enheter.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Betalning</h2>
      <p className="mt-2 text-gray-600">
        Abonnemangsavgifter hanteras via Stripe. Utebliven betalning kan leda
        till att tjänsten pausas.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Användning</h2>
      <p className="mt-2 text-gray-600">
        Kunden ansvarar för att innehåll som visas på skärmarna är korrekt,
        lagligt och lämpligt för verksamheten.
      </p>

      <h2 className="mt-6 text-xl font-semibold">Avslut och pausning</h2>
      <p className="mt-2 text-gray-600">
        Konton kan pausas om villkoren bryts eller om betalning inte kan
        genomföras.
      </p>
    </div>
  );
}
