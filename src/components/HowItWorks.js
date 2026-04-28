import React from "react";
import "./HowItWorks.css";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="howitworks-section py-5 fade-up">
      <div className="container text-center">
        <h6 className="text-uppercase text-muted mb-2">Så fungerar det</h6>
        <h2 className="fw-bold mb-3">Kom igång på tre enkla steg</h2>
        <p className="text-secondary mb-5">
          Infosync är byggt för att vara snabbt, enkelt och helt utan krångel.
        </p>

        <div className="row justify-content-center">
          <StepCard
            number="1"
            title="Skapa konto"
            text="Registrera dig och logga in på din dashboard."
          />
          <StepCard
            number="2"
            title="Lägg till skärmar"
            text="Koppla dina skärmar med en enkel kod."
          />
          <StepCard
            number="3"
            title="Publicera innehåll"
            text="Ladda upp bilder, priser eller kampanjer och publicera direkt."
          />
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, title, text }) {
  return (
    <div className="col-md-3 mb-4 fade-up">
      <div className="step-card p-4 bg-white rounded-4 shadow-sm h-100">
        <div className="step-number mb-3">{number}</div>
        <h5 className="fw-bold">{title}</h5>
        <p className="text-secondary">{text}</p>
      </div>
    </div>
  );
}
