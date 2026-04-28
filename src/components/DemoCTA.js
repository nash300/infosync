import React from "react";
import "./DemoCTA.css";

export default function DemoCTA() {
  return (
    <section id="demo" className="demo-section text-center py-5 fade-up">
      <div className="container">
        <h2 className="fw-bold mb-3">Redo att testa Infosync?</h2>
        <p className="text-secondary mb-4">
          Boka en kostnadsfri demo och se hur enkelt det är att komma igång.
        </p>
        <button className="btn btn-dark rounded-pill px-5 py-3">
          Boka demo
        </button>
      </div>
    </section>
  );
}
