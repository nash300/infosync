import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer id="kontakt" className="footer-section py-5 fade-up">
      <div className="container text-center">
        {/* Logo */}
        <h3 className="footer-logo fw-bold mb-4">Infosync</h3>

        {/* Links */}
        <ul className="footer-links list-unstyled d-flex justify-content-center gap-4 mb-4">
          <li>
            <a href="#">Funktioner</a>
          </li>
          <li>
            <a href="#">Så fungerar det</a>
          </li>
          <li>
            <a href="#">Priser</a>
          </li>
          <li>
            <a href="#">Demo</a>
          </li>
          <li>
            <a href="#">Kontakt</a>
          </li>
        </ul>

        {/* Copyright */}
        <p className="text-muted small mb-0">
          © {new Date().getFullYear()} Infosync. Alla rättigheter förbehållna.
        </p>
      </div>
    </footer>
  );
}
