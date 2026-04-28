import React from "react";
import "./Pricing.css";

export default function Pricing() {
  return (
    <section id="pricing" className="pricing-section py-5 fade-up">
      <div className="container text-center">
        <h6 className="text-uppercase text-muted mb-2">Priser</h6>
        <h2 className="fw-bold mb-3">Enkelt och tydligt</h2>
        <p className="text-secondary mb-5">
          Välj det paket som passar dig bäst. Inga dolda avgifter.
        </p>

        <div className="row justify-content-center">
          <PriceCard
            title="Basic"
            price="99 kr"
            period="/månad"
            features={[
              "1 skärm",
              "Standard support",
              "Grundläggande funktioner",
            ]}
            highlighted={false}
          />

          <PriceCard
            title="Pro"
            price="199 kr"
            period="/månad"
            features={[
              "Upp till 5 skärmar",
              "Prioriterad support",
              "Alla funktioner",
              "Schemaläggning",
            ]}
            highlighted={true}
          />

          <PriceCard
            title="Enterprise"
            price="Kontakta oss"
            period=""
            features={[
              "Obegränsat antal skärmar",
              "Premium support",
              "Skräddarsydda lösningar",
            ]}
            highlighted={false}
          />
        </div>
      </div>
    </section>
  );
}

function PriceCard({ title, price, period, features, highlighted }) {
  return (
    <div className="col-md-3 mb-4 fade-up">
      <div
        className={
          "price-card p-4 rounded-4 shadow-sm h-100 " +
          (highlighted ? "highlighted" : "")
        }
      >
        <h5 className="fw-bold mb-3">{title}</h5>

        <div className="price mb-3">
          <span className="price-amount">{price}</span>
          <span className="price-period">{period}</span>
        </div>

        <ul className="list-unstyled text-start mb-4">
          {features.map((f, i) => (
            <li key={i} className="mb-2">
              • {f}
            </li>
          ))}
        </ul>

        <button className="btn btn-dark w-100 rounded-pill">Välj paket</button>
      </div>
    </div>
  );
}
