import React, { useEffect, useState } from "react";
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
    title: "Gör varje skärm till en del av varumärket",
    subtitle: "Visa priser, tjänster och kampanjer med en premiumkänsla.",
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
    <section className="hero-section">
      <div className="hero-copy">
        <button className="hero-arrow left" onClick={prevSlide}>
          ‹
        </button>

        <div className="hero-content text-start">
          <h1>{title}</h1>

          <p>{subtitle}</p>

          <div className="hero-actions">
            <a href="#kontakt" className="hero-primary">
              Kontakta oss
            </a>
            <a href="#how-it-works" className="hero-secondary">
              Se hur det fungerar
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>25+</strong>
              <span>Kunder</span>
            </div>
            <div>
              <strong>80+</strong>
              <span>Skärmar</span>
            </div>
            <div>
              <strong>99%</strong>
              <span>Uptime</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-image" style={{ backgroundImage: `url(${image})` }}>
        <button className="hero-arrow right" onClick={nextSlide}>
          ›
        </button>
      </div>
    </section>
  );
}
