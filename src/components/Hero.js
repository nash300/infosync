import React, { useState, useEffect } from "react";
import "./Hero.css";

const slides = [
  {
    image: "./salon1.jpg",
    title: "Förvandla din TV till en säljande skärm",
    subtitle:
      "Priser, erbjudanden och stilinspiration – uppdatera direkt från mobilen.",
  },
  {
    image: "./salon2.jpg",
    title: "Visa kampanjer och erbjudanden i realtid",
    subtitle:
      "Infosync gör det enkelt att uppdatera dina skärmar var du än är.",
  },
  {
    image: "./salon3.jpg",
    title: "Skapa en modern kundupplevelse",
    subtitle: "Professionell digital signage för salonger och butiker.",
  },
  {
    image: "./salon4.jpg",
    title: "rge erhger hgergh",
    subtitle: "Professionell digital signage för salonger och butiker.",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  const { image, title, subtitle } = slides[current];

  return (
    <section id="hero" className="hero-section">
      <div className="hero-slide" style={{ backgroundImage: `url(${image})` }}>
        <div className="hero-overlay">
          <div className="hero-content container text-start">
            <span className="badge bg-success mb-3">För salonger</span>
            <h1 className="fw-bold mb-3">{title}</h1>
            <p className="text-light mb-4">{subtitle}</p>

            <div className="d-flex gap-3">
              <button className="btn btn-light rounded-pill px-4">
                Boka demo
              </button>
              <button className="btn btn-outline-light rounded-pill px-4">
                Se hur det fungerar
              </button>
            </div>

            <div className="hero-stats mt-5 d-flex gap-5 text-light">
              <div>
                <h4>25+</h4>
                <small>Kunder</small>
              </div>
              <div>
                <h4>80+</h4>
                <small>Skärmar</small>
              </div>
              <div>
                <h4>99%</h4>
                <small>Uptime</small>
              </div>
            </div>
          </div>

          <button className="hero-arrow left" onClick={prevSlide}>
            ‹
          </button>
          <button className="hero-arrow right" onClick={nextSlide}>
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
