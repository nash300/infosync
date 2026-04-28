"use client";

import { useState } from "react";

import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import DemoCTA from "@/components/DemoCTA";
import Footer from "@/components/Footer";
import useReveal from "@/hooks/useReveal";

export default function Home() {
  useReveal();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <nav className="navbar navbar-light bg-white shadow-sm py-3 fixed-top">
        <div className="container d-flex align-items-center justify-content-between">
          <a
            className="navbar-brand fw-bold"
            href="#hero"
            onClick={() => setMenuOpen(false)}
          >
            Infosync
          </a>

          <button
            className="mobile-toggle d-lg-none"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? "bar open" : "bar"}></span>
            <span className={menuOpen ? "bar open" : "bar"}></span>
            <span className={menuOpen ? "bar open" : "bar"}></span>
          </button>

          <ul className="navbar-nav ms-auto d-none d-lg-flex align-items-center gap-3">
            <li className="nav-item">
              <a className="nav-link" href="#hero">
                Funktioner
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#how-it-works">
                Så fungerar det
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#pricing">
                Priser
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#demo">
                Demo
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#kontakt">
                Kontakt
              </a>
            </li>
            <li className="nav-item">
              <button className="btn btn-dark rounded-pill px-4" type="button">
                Boka demo
              </button>
            </li>
          </ul>
        </div>

        <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          <a href="#hero" onClick={() => setMenuOpen(false)}>
            Funktioner
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            Så fungerar det
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>
            Priser
          </a>
          <a href="#demo" onClick={() => setMenuOpen(false)}>
            Demo
          </a>
          <a href="#kontakt" onClick={() => setMenuOpen(false)}>
            Kontakt
          </a>

          <button className="btn btn-dark rounded-pill w-100 mt-3" type="button">
            Boka demo
          </button>
        </div>
      </nav>

      <div
        className={`mobile-backdrop ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      ></div>

      <Hero />
      <HowItWorks />
      <Pricing />
      <DemoCTA />
      <Footer />
    </div>
  );
}