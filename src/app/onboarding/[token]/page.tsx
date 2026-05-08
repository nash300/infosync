"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  email: string;
  status: string;
  notes: string | null;
  onboarding_token_expires_at: string | null;
};

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [organisationNumber, setOrganisationNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sverige");
  const [displayNotes, setDisplayNotes] = useState("");
  const [displayFiles, setDisplayFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const fileToPayload = (file: File) => {
    return new Promise<{
      name: string;
      type: string;
      size: number;
      data: string;
    }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: String(reader.result || ""),
        });
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const saveProfile = async () => {
    if (!customer) return;

    if (!contactPerson.trim()) {
      setMessage("Kontaktperson måste anges.");
      return;
    }
    if (!acceptedTerms) {
      setMessage("Du måste godkänna villkoren.");
      return;
    }

    if (!acceptedPrivacy) {
      setMessage("Du måste godkänna integritetspolicyn.");
      return;
    }

    const totalFileSize = displayFiles.reduce((sum, file) => sum + file.size, 0);
    if (totalFileSize > 20 * 1024 * 1024) {
      setMessage("Filerna får tillsammans vara högst 20 MB.");
      return;
    }

    setSaving(true);
    const displayFilePayloads = await Promise.all(displayFiles.map(fileToPayload));

    const response = await fetch("/api/onboarding/complete-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        contactPerson,
        phone,
        organisationNumber,
        address,
        city,
        country,
        acceptedTerms,
        acceptedPrivacy,
        marketingConsent,
        displayNotes,
        displayFiles: displayFilePayloads,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Det gick inte att spara uppgifterna.");
      setSaving(false);
      return;
    }

    setCustomer({
      ...customer,
      status: "accepted_terms",
    });

    setMessage("Uppgifterna har sparats.");
    setDisplayFiles([]);
    setSaving(false);
  };

  useEffect(() => {
    const loadCustomer = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email, status, notes, onboarding_token_expires_at")
        .eq("onboarding_token", token)
        .single();

      if (error || !data) {
        setCustomer(null);
        setLoading(false);
        return;
      }

      setCustomer(data as Customer);
      setLoading(false);
    };

    loadCustomer();
  }, [token]);

  const startPayment = async () => {
    if (!customer) return;

    const pricingPlanCode =
      customer.notes?.match(/\((standard_fhd|premium_4k)\)/)?.[1] || "";

    if (!pricingPlanCode) {
      setMessage(
        "Inget prispaket är kopplat till din startlänk. Kontakta InfoSync.",
      );
      return;
    }

    setSaving(true);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: customer.id,
        email: customer.email,
        pricingPlanCode,
        legalAccepted: true,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      setMessage(data.error || "Det gick inte att starta betalningen.");
      setSaving(false);
      return;
    }

    window.location.href = data.url;
  };

  if (loading) {
    return <div className="p-8">Laddar din startlänk...</div>;
  }

  if (!customer) {
    return <div className="p-8">Ogiltig startlänk.</div>;
  }

  const isExpired =
    customer.onboarding_token_expires_at &&
    new Date(customer.onboarding_token_expires_at) < new Date();

  if (isExpired) {
    return <div className="p-8">Den här startlänken har gått ut.</div>;
  }
  if (customer.status === "accepted_terms") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-bold">Nästan klart</h1>
        <p className="mt-3 text-gray-600">
          Dina uppgifter och ditt material är inskickade. Nästa steg är att
          slutföra betalningen.
        </p>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Betalning</h2>
          <p className="mt-2 text-gray-600">
            Du skickas vidare till en säker betalningssida.
          </p>

          <button
            onClick={startPayment}
            disabled={saving}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Startar betalning..." : "Fortsätt till betalning"}
          </button>
        </div>
      </div>
    );
  }

  if (customer.status === "active") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-bold">Kontot är aktivt</h1>
        <p className="mt-3 text-gray-600">Ditt InfoSync-konto är aktivt.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Välkommen till InfoSync</h1>

      <p className="mt-3 text-gray-600">
        Kontrollera uppgifterna, lägg till material för skärmen och gå vidare
        till betalning.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-gray-500">Företag</p>
        <p className="font-semibold">{customer.name}</p>

        <p className="mt-4 text-sm text-gray-500">E-post</p>
        <p className="font-semibold">{customer.email}</p>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Fyll i dina uppgifter</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Kontaktperson *"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Telefon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Organisationsnummer"
            value={organisationNumber}
            onChange={(e) => setOrganisationNumber(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Ort"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Adress"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Land"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h3 className="font-semibold">Material till din skärm</h3>
          <p className="mt-1 text-sm text-gray-600">
            Ladda gärna upp meny, prislista, logotyp eller bilder som hjälper
            oss att skapa layouten. PDF, JPG, PNG, WEBP och HEIC stöds.
          </p>

          <textarea
            value={displayNotes}
            onChange={(e) => setDisplayNotes(e.target.value)}
            rows={3}
            placeholder="Exempel: använd menybilden, visa luncherbjudande och öppettider."
            className="mt-4 w-full rounded-lg border px-3 py-2"
          />

          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => setDisplayFiles(Array.from(e.target.files || []))}
            className="mt-3 block w-full rounded-lg border bg-white px-3 py-2 text-sm"
          />

          {displayFiles.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-gray-600">
              {displayFiles.map((file) => (
                <li key={`${file.name}-${file.size}`}>
                  {file.name} ({Math.ceil(file.size / 1024)} KB)
                </li>
              ))}
            </ul>
          )}
        </div>

        {message && (
          <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm text-gray-700">
            {message}
          </p>
        )}
        <div className="mt-4 space-y-3 text-sm">
          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            <span>
              Jag godkänner{" "}
              <a href="/terms" target="_blank" className="underline">
                villkoren
              </a>{" "}
              och förstår att de gäller för InfoSync-abonnemanget. *
            </span>
          </label>

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            />
            <span>
              Jag godkänner{" "}
              <a href="/privacy" target="_blank" className="underline">
                integritetspolicyn
              </a>{" "}
              och förstår att InfoSync behandlar företagets och
              kontaktpersonens uppgifter för start, fakturering, support
              och leverans av tjänsten. *
            </span>
          </label>

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
            />
            <span>Jag vill få relevanta nyheter och erbjudanden från InfoSync</span>
          </label>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Sparar..." : "Spara och fortsätt"}
        </button>
      </div>
    </div>
  );
}
