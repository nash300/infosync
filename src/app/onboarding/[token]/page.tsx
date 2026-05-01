"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Customer = {
  id: string;
  name: string;
  email: string;
  status: string;
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
  const [country, setCountry] = useState("Sweden");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const saveProfile = async () => {
    if (!customer) return;

    if (!contactPerson.trim()) {
      setMessage("Contact person is required.");
      return;
    }
    if (!acceptedTerms) {
      setMessage("You must accept the Terms & Conditions.");
      return;
    }

    if (!acceptedPrivacy) {
      setMessage("You must accept the Privacy Policy.");
      return;
    }
    setSaving(true);

    const { error } = await supabase
      .from("customers")
      .update({
        contact_person: contactPerson.trim(),
        phone: phone.trim() || null,
        organisation_number: organisationNumber.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        country: country.trim() || "Sweden",
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        marketing_consent: marketingConsent,
        status: "accepted_terms",
      })
      .eq("id", customer.id);

    if (error) {
      console.error("Update profile error:", error);
      setMessage("Could not save profile.");
      setSaving(false);
      return;
    }

    setCustomer({
      ...customer,
      status: "accepted_terms",
    });

    setMessage("Profile saved successfully.");
    setSaving(false);
  };

  useEffect(() => {
    const loadCustomer = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, email, status, onboarding_token_expires_at")
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

    setSaving(true);

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: customer.id,
        email: customer.email,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      setMessage(data.error || "Could not start payment.");
      setSaving(false);
      return;
    }

    window.location.href = data.url;
  };

  if (loading) {
    return <div className="p-8">Loading onboarding...</div>;
  }

  if (!customer) {
    return <div className="p-8">Invalid onboarding link.</div>;
  }

  const isExpired =
    customer.onboarding_token_expires_at &&
    new Date(customer.onboarding_token_expires_at) < new Date();

  if (isExpired) {
    return <div className="p-8">This onboarding link has expired.</div>;
  }
  if (customer.status === "accepted_terms") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-bold">Almost done</h1>
        <p className="mt-3 text-gray-600">
          Your onboarding has been submitted. Payment setup is the next step.
        </p>

        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold">Payment</h2>
          <p className="mt-2 text-gray-600">
            Stripe payment will be added here next.
          </p>

          <button
            onClick={startPayment}
            disabled={saving}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Starting payment..." : "Continue to payment"}
          </button>
        </div>
      </div>
    );
  }

  if (customer.status === "active") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-3xl font-bold">Account active</h1>
        <p className="mt-3 text-gray-600">Your InfoSync account is active.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Welcome to InfoSync</h1>

      <p className="mt-3 text-gray-600">
        Complete onboarding for {customer.name}.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <p className="text-sm text-gray-500">Company</p>
        <p className="font-semibold">{customer.name}</p>

        <p className="mt-4 text-sm text-gray-500">Contact email</p>
        <p className="font-semibold">{customer.email}</p>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold">Complete your details</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Contact person *"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Organisation number"
            value={organisationNumber}
            onChange={(e) => setOrganisationNumber(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />

          <input
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
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
              I accept the{" "}
              <a href="/terms" target="_blank" className="underline">
                Terms & Conditions
              </a>{" "}
              *
            </span>
          </label>

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
            />
            <span>
              I accept the{" "}
              <a href="/privacy" target="_blank" className="underline">
                Privacy Policy
              </a>{" "}
              *
            </span>
          </label>

          <label className="flex gap-2">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
            />
            <span>I agree to receive marketing emails</span>
          </label>
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save and continue"}
        </button>
      </div>
    </div>
  );
}
