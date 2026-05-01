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
            {navLinks.map((link) => (
              <li key={link.href} className="nav-item">
                <a className="nav-link" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}
            <li className="nav-item">
              <button className="btn btn-dark rounded-pill px-4" type="button">
                Boka demo
              </button>
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

          <button
            className="btn btn-dark rounded-pill w-100 mt-3"
            type="button"
          >
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
