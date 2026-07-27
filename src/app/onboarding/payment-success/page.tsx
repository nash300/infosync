import Link from "next/link";
import Image from "next/image";

export default function PaymentSuccessPage() {
  return (
    <div className="landing-page flow-page flow-result-page flow-payment-success-page">
      <main className="flow-payment-success-shell">
        <section
          className="flow-payment-success-copy"
          aria-labelledby="payment-success-title"
        >
          <Link href="/" className="flow-payment-success-logo" aria-label="Screenia">
            <Image
              src="/brand/screenia-logo-full-transparent.webp"
              alt="Screenia"
              width={300}
              height={86}
              priority
            />
          </Link>

          <div className="flow-payment-success-heading">
            <span className="flow-payment-success-icon" aria-hidden="true">
              <span>✓</span>
            </span>
            <div>
              <p className="landing-eyebrow">Betalning mottagen</p>
              <h1 id="payment-success-title">Betalningen &auml;r klar</h1>
            </div>
          </div>

          <p className="flow-payment-success-lede">
            Tack f&ouml;r din best&auml;llning. Betalningen &auml;r registrerad och vi
            f&ouml;rbereder nu din Screenia-l&ouml;sning.
          </p>

          <div className="flow-payment-success-actions">
            <Link href="/login" className="landing-button landing-button-primary">
              Till kundportalen
            </Link>
            <Link
              href="/support-service-policy"
              className="landing-button landing-button-secondary flow-payment-success-secondary"
            >
              L&auml;s servicevillkoren
            </Link>
          </div>

          <p className="flow-payment-success-help">
            Har du inte skapat ditt l&ouml;senord &auml;n? F&ouml;lj l&auml;nken i
            e-postmeddelandet fr&aring;n Screenia.
          </p>
        </section>

        <aside className="flow-payment-success-next" aria-label="Nästa steg">
          <div className="flow-payment-success-next-heading">
            <span>Din best&auml;llning &auml;r mottagen</span>
            <strong>N&auml;sta steg</strong>
          </div>

          <ol className="flow-payment-success-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Aktivera kundkontot</strong>
                <p>Du f&aring;r ett e-postmeddelande med en s&auml;ker aktiveringsl&auml;nk.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Skicka ditt material</strong>
                <p>Ladda upp logotyp, bilder, texter och annat inneh&aring;ll i portalen.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Vi bygger din sk&auml;rml&ouml;sning</strong>
                <p>Screenia tar hand om layout, inst&auml;llningar och teknisk drift.</p>
              </div>
            </li>
          </ol>

          <div className="flow-payment-success-assurance">
            <span aria-hidden="true">✓</span>
            <p>
              <strong>Betalningen &auml;r registrerad</strong>
              <small>N&auml;sta steg skickas till din e-post.</small>
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
