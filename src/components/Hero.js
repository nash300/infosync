import React, { useEffect, useState } from "react";
import "./Hero.css";

const slides = [
  {
    image: "./window_screen1.jpg",
    title: "Förvandla ditt fönster till en säljare",
    subtitle: "Använd glasytan som en kraftfull reklamplats.",
  },
  {
    image: "./salon2.jpg",
    title: "Ingen teknik. Inget krångel.",
    subtitle: "Plugga in – vi tar hand om resten.",
  },
  {
    image: "./window_screen2.jpg",
    title: "Din skärm arbetar för dig – dygnet runt",
    subtitle: "Till en kostnad lägre än en Netflix-prenumeration",
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
      <button
        className="hero-arrow left"
        onClick={prevSlide}
        type="button"
        aria-label="Previous slide"
      >
        ‹
      </button>

      <div className="hero-shell">
        <div className="hero-copy">
          <div className="hero-content">
            <p className="hero-kicker">Digital signage för moderna företag</p>

            <h1>{title}</h1>

            <h3 className="hero-subtitle">{subtitle}</h3>

            <div className="hero-actions">
              <a href="#kontakt" className="hero-primary">
                Kontakta oss
              </a>

              <a href="#how-it-works" className="hero-secondary">
                Se hur det fungerar
              </a>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div
            className="hero-image"
            style={{ backgroundImage: `url(${image})` }}
          />

          <div className="hero-shape shape-one" />
        </div>
      </div>

      <button
        className="hero-arrow right"
        onClick={nextSlide}
        type="button"
        aria-label="Next slide"
      >
        ›
      </button>

      <div className="hero-dots" aria-label="Hero slides">
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={index === current ? "hero-dot active" : "hero-dot"}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
