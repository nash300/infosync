"use client";

import { useEffect, useState } from "react";
import {
  normalizeCustomerLanguage,
  type CustomerLanguage,
} from "@/lib/customer-language";
import "../../landing.css";

const copy = {
  sv: {
    title: "Betalningen lyckades",
    text:
      "Tack. Din betalning är mottagen och InfoSync förbereder nu nästa steg för din skärm.",
    home: "Till startsidan",
  },
  en: {
    title: "Payment successful",
    text:
      "Thank you. Your payment has been received and InfoSync is preparing the next step for your screen.",
    home: "Go to homepage",
  },
} as const;

export default function PaymentSuccessPage() {
  const [language, setLanguage] = useState<CustomerLanguage>("sv");

  useEffect(() => {
    const lang = normalizeCustomerLanguage(
      new URLSearchParams(window.location.search).get("lang") ||
        window.localStorage.getItem("infosync-language"),
    );
    setLanguage(lang);
    window.localStorage.setItem("infosync-language", lang);
  }, []);

  const t = copy[language];

  return (
    <div className="landing-page flow-page">
      <main className="flow-shell flow-result">
        <span className="flow-result-icon">✓</span>
        <h1>{t.title}</h1>
        <p>{t.text}</p>
        <a href={`/?lang=${language}`} className="landing-button landing-button-primary">
          {t.home}
        </a>
      </main>
    </div>
  );
}
