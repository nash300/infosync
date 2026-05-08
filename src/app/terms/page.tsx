"use client";

import { useEffect, useState } from "react";
import { normalizeCustomerLanguage, type CustomerLanguage } from "@/lib/customer-language";
import "../landing.css";

const copy = {
  sv: {
    title: "Villkor",
    intro: "Dessa villkor gäller för användning av InfoSyncs tjänst för digital skyltning och skärmhantering.",
    sections: [
      ["Tjänsten", "InfoSync tillhandahåller en plattform för att hantera och visa digitalt innehåll på anslutna skärmar och enheter."],
      ["Betalning", "Abonnemangsavgifter hanteras via Stripe. Utebliven betalning kan leda till att tjänsten pausas."],
      ["Användning", "Kunden ansvarar för att innehåll som visas på skärmarna är korrekt, lagligt och lämpligt för verksamheten."],
      ["Avslut och pausning", "Konton kan pausas om villkoren bryts eller om betalning inte kan genomföras."],
    ],
  },
  en: {
    title: "Terms",
    intro: "These terms apply to the use of InfoSync's digital signage and screen management service.",
    sections: [
      ["Service", "InfoSync provides a platform for managing and displaying digital content on connected screens and devices."],
      ["Payment", "Subscription fees are handled through Stripe. Missed payment may lead to the service being paused."],
      ["Use", "The customer is responsible for ensuring that screen content is correct, lawful, and suitable for the business."],
      ["Cancellation and pausing", "Accounts may be paused if terms are breached or payment cannot be completed."],
    ],
  },
} as const;

export default function TermsPage() {
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
