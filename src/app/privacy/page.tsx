"use client";

import { useEffect, useState } from "react";
import { normalizeCustomerLanguage, type CustomerLanguage } from "@/lib/customer-language";
import "../landing.css";

const copy = {
  sv: {
    title: "Integritetspolicy",
    intro: "Denna policy beskriver hur InfoSync behandlar personuppgifter och företagsuppgifter i samband med start av tjänsten, betalning, support och leverans.",
    sections: [
      ["Uppgifter vi samlar in", "Vi samlar in kontaktuppgifter, företagsuppgifter, samtycken, betalningsstatus och information som behövs för att hantera skärmar och innehåll."],
      ["Hur uppgifterna används", "Uppgifterna används för att skapa kundkonto, hantera starten, administrera betalningar, ge support och leverera InfoSync-tjänsten."],
      ["Tredjepartstjänster", "Betalningar hanteras av Stripe. InfoSync lagrar inte kortuppgifter. E-postmeddelanden kan skickas via Resend."],
      ["Dina rättigheter", "Du kan begära information om vilka uppgifter som behandlas och be om rättelse eller radering när det är möjligt enligt lag och avtal."],
    ],
  },
  en: {
    title: "Privacy Policy",
    intro: "This policy describes how InfoSync processes personal and company data for service setup, payment, support, and delivery.",
    sections: [
      ["Data we collect", "We collect contact details, company details, consents, payment status, and information needed to manage screens and content."],
      ["How data is used", "Data is used to create the customer account, handle setup, administer payments, provide support, and deliver the InfoSync service."],
      ["Third-party services", "Payments are handled by Stripe. InfoSync does not store card details. Email messages may be sent through Resend."],
      ["Your rights", "You can request information about processed data and ask for correction or deletion where possible under law and agreement."],
    ],
  },
} as const;

export default function PrivacyPage() {
  const [language, setLanguage] = useState<CustomerLanguage>("sv");

  useEffect(() => {
    setLanguage(normalizeCustomerLanguage(new URLSearchParams(window.location.search).get("lang")));
  }, []);

  const t = copy[language];

  return (
    <div className="landing-page flow-page">
      <main className="flow-shell legal-shell">
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        {t.sections.map(([title, text]) => (
          <section key={title} className="flow-card">
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
      </main>
    </div>
  );
}
