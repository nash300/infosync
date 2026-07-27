"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseBrowserConfigured, supabase } from "@/lib/supabase/client";
import ScreeniaLogo from "@/components/ScreeniaLogo";

const missingSupabaseMessage =
  "Supabase saknas i lokal miljö. Lägg till NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY i .env.local och starta om servern.";
const isGoogleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const urlMessage = new URLSearchParams(window.location.search).get("message");
    if (urlMessage) setMessage(urlMessage);
  }, []);

  const submit = async () => {
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, mode: "customer" }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      next?: string;
    };

    if (!response.ok) {
      setMessage(result.error || "E-post eller lösenord är fel.");
      setLoading(false);
      return;
    }

    router.push(result.next || "/account");
    router.refresh();
  };

  const signInWithGoogle = async () => {
    if (!isGoogleAuthEnabled) {
      setMessage("Google-inloggning är snart klar. Använd e-post och lösenord under tiden.");
      return;
    }

    setGoogleLoading(true);
    setMessage("");

    if (!isSupabaseBrowserConfigured) {
      setMessage(missingSupabaseMessage);
      setGoogleLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=/account&provider=google`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
  };

  const sendResetEmail = async () => {
    if (!email) {
      setMessage("Skriv din e-postadress först.");
      return;
    }

    setResetLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      setMessage(result.error || "Det gick inte att skicka återställningslänken.");
    } else {
      setMessage(
        result.message ||
          "Om e-postadressen finns hos Screenia skickar vi en återställningslänk.",
      );
    }

    setResetLoading(false);
  };

  return (
    <main className="screenia-auth-shell screenia-customer-login">
      <div className="screenia-auth-bg" />

      <div className="screenia-auth-layout screenia-customer-login-layout">
        <section className="screenia-customer-login-visual">
          <div className="screenia-customer-login-image" aria-hidden="true" />
          <div className="screenia-customer-login-shade" aria-hidden="true" />

          <div className="screenia-customer-login-visual-content">
            <Link href="/" className="screenia-auth-logo-link">
              <ScreeniaLogo className="screenia-logo-auth-card" />
            </Link>

            <div className="screenia-customer-login-story">
              <p className="screenia-auth-hero-kicker">Allt samlat på ett ställe</p>
              <h1 className="screenia-auth-hero-title">
                Din skärmverksamhet, nära till hands.
              </h1>
              <p className="screenia-auth-hero-copy">
                Följ dina beställningar, dela material och få personlig support
                i en portal byggd för en enklare vardag.
              </p>

              <ul className="screenia-customer-login-features" aria-label="Funktioner i kundportalen">
                <li><span aria-hidden="true">✓</span> Order och leverans</li>
                <li><span aria-hidden="true">✓</span> Innehåll och underlag</li>
                <li><span aria-hidden="true">✓</span> Personlig support</li>
              </ul>
            </div>

            <p className="screenia-customer-login-caption">
              En trygg plats för allt som rör dina skärmar.
            </p>
          </div>
        </section>

        <section className="screenia-auth-card-wrap screenia-customer-login-form-panel">
          <div className="screenia-auth-card screenia-customer-login-card">
            <Link href="/" className="screenia-auth-logo-link screenia-auth-logo-link-mobile">
              <ScreeniaLogo className="screenia-logo-auth-inline" />
            </Link>

            <p className="screenia-auth-card-kicker screenia-auth-card-kicker-responsive">
              Säker kundinloggning
            </p>
            <h2 className="screenia-customer-login-title">Välkommen</h2>
            <p className="screenia-customer-login-intro">
              Logga in för att fortsätta till din personliga Screenia-portal.
            </p>

            <div className="screenia-auth-form-stack">
              <label className="screenia-auth-field">
                <span className="screenia-auth-label">E-post</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="namn@foretag.se"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="screenia-auth-input"
                />
              </label>

              <label className="screenia-auth-field">
                <span className="screenia-auth-label">Lösenord</span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Ditt lösenord"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && email && password && !loading) {
                      submit();
                    }
                  }}
                  className="screenia-auth-input"
                />
              </label>
            </div>

            {message && <p className="screenia-auth-alert">{message}</p>}

            <div className="screenia-auth-actions">
              <button
                type="button"
                onClick={submit}
                disabled={loading || !email || !password}
                className="screenia-auth-button screenia-auth-button-full"
              >
                <span>{loading ? "Kontrollerar..." : "Logga in"}</span>
                <span className="screenia-auth-button-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M10 7 8.6 8.4l2.6 2.6H3v2h8.2l-2.6 2.6L10 17l5-5-5-5Z" />
                    <path d="M13 4h5v16h-5v-2h3V6h-3V4Z" />
                  </svg>
                </span>
              </button>

              <div className="screenia-auth-divider">
                <span />
                eller
                <span />
              </div>

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={googleLoading || !isGoogleAuthEnabled}
                className="screenia-auth-secondary-button"
              >
                <span
                  aria-hidden="true"
                  role="presentation"
                  className="screenia-auth-provider-mark"
                >
                  G
                </span>
                {googleLoading
                  ? "Öppnar Google..."
                  : isGoogleAuthEnabled
                    ? "Fortsätt med Google"
                    : "Google-inloggning kommer snart"}
              </button>

              {isGoogleAuthEnabled && (
                <p className="screenia-auth-helper">
                  Google fungerar bara om e-postadressen redan hör till ett
                  betalt Screenia-konto.
                </p>
              )}
            </div>

            <div className="screenia-auth-link-row screenia-customer-login-links">
              <button
                type="button"
                onClick={sendResetEmail}
                disabled={resetLoading || !email}
                className="screenia-auth-link-button"
              >
                {resetLoading ? "Skickar..." : "Glömt lösenord?"}
              </button>
              <Link href="/" className="screenia-auth-link">
                Till startsidan
              </Link>
            </div>
          </div>

          <p className="screenia-customer-login-security">
            <span aria-hidden="true">✓</span>
            Säker anslutning och personlig åtkomst
          </p>
        </section>
      </div>
    </main>
  );
}
