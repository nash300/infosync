"use client";

import { useEffect, useState } from "react";
import {
  normalizeCustomerLanguage,
  type CustomerLanguage,
} from "@/lib/customer-language";
import "../../landing.css";

const copy = {
  sv: {
    title: "Betalningen avbröts",
    text:
      "Ingen betalning genomfördes. Du kan gå tillbaka till din startlänk och försöka igen.",
    home: "Till startsidan",
  },
  en: {
    title: "Payment cancelled",
    text:
      "No payment was completed. You can go back to your setup link and try again.",
    home: "Go to homepage",
  },
} as const;

export default function PaymentCancelledPage() {
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
        <span className="flow-result-icon warning">!</span>
        <h1>{t.title}</h1>
        <p>{t.text}</p>
        <a href={`/?lang=${language}`} className="landing-button landing-button-primary">
          {t.home}
        </a>
      </main>
    </div>
  );
}
