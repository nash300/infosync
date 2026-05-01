"use client";

import { useState } from "react";

import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import DemoCTA from "@/components/DemoCTA";
import Footer from "@/components/Footer";
import useReveal from "@/hooks/useReveal";

const navLinks = [
  { href: "#hero", label: "Funktioner" },
  { href: "#how-it-works", label: "Så fungerar det" },
  { href: "#pricing", label: "Priser" },
  { href: "#demo", label: "Demo" },
  { href: "#kontakt", label: "Kontakt" },
];

export default function Home() {
  useReveal();

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-vh-100 bg-white text-dark overflow-auto">
      <nav className="navbar navbar-light bg-white shadow-sm py-3 fixed-top">
        <div className="container d-flex align-items-center justify-content-between">
          <a
            className="navbar-brand fw-bold fs-4"
            href="#hero"
            onClick={() => setMenuOpen(false)}
          >
            Infosync
          </a>

          <button
            className="mobile-toggle d-lg-none border-0 bg-transparent"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
            aria-label="Toggle menu"
          >
            <span className={menuOpen ? "bar open" : "bar"}></span>
            <span className={menuOpen ? "bar open" : "bar"}></span>
            <span className={menuOpen ? "bar open" : "bar"}></span>
          </button>

          <ul className="navbar-nav ms-auto d-none d-lg-flex flex-row align-items-center gap-4">
            {navLinks.map((link) => (
              <li key={link.href} className="nav-item">
                <a className="nav-link fw-medium text-dark" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}

            <li className="nav-item">
              <a
                href="#demo"
                className="btn btn-dark rounded-pill px-4 fw-semibold"
              >
                Boka demo
              </a>
            </li>
          </ul>
        </div>

        <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}

          <a
            href="#demo"
            onClick={() => setMenuOpen(false)}
            className="btn btn-dark rounded-pill w-100 mt-3"
          >
            Boka demo
          </a>
        </div>
      </nav>

      <div
        className={`mobile-backdrop ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      ></div>

      <main style={{ paddingTop: "76px" }}>
        <section id="hero">
          <Hero />
        </section>

        <section id="how-it-works">
          <HowItWorks />
        </section>

        <section id="pricing">
          <Pricing />
        </section>

        <section id="demo">
          <DemoCTA />
        </section>

        <section id="kontakt">
          <Footer />
        </section>
      </main>
    </div>
  );
}
