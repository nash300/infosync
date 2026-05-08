"use client";

import { useState, type FormEvent } from "react";
import "./landing.css";

const navLinks = [
  { href: "#platform", label: "Tjänsten" },
  { href: "#workflow", label: "Så fungerar det" },
  { href: "#pricing", label: "Priser" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Kontakt" },
];

const plans = [
  {
    code: "standard_fhd",
    name: "Standard",
    resolution: "FHD",
    setupFee: "1 998 kr",
    monthlyFee: "219 kr",
    description: "För en skärm som visar kampanjer, erbjudanden och information i Full HD.",
    features: [
      "Uppspelning i Full HD",
      "Personlig start med säker länk",
      "Vi hjälper dig att få skärmen redo",
      "14 dagars provperiod på månadsabonnemang",
      "Ingen bindningstid",
    ],
  },
  {
    code: "premium_4k",
    name: "Premium",
    resolution: "4K",
    setupFee: "2 398 kr",
    monthlyFee: "269 kr",
    description: "För verksamheter som vill visa extra skarpt innehåll i 4K.",
    features: [
      "Uppspelning för 4K-innehåll",
      "Personlig start med säker länk",
      "Vi hjälper dig att få skärmen redo",
      "14 dagars provperiod på månadsabonnemang",
      "Ingen bindningstid",
    ],
    featured: true,
  },
];

const stats = [
  { value: "24/7", label: "kontinuerlig skärmvisning" },
  { value: "14 dagar", label: "provperiod på abonnemang" },
  { value: "0", label: "månaders bindningstid" },
];

const heroSlides = [
  {
    image:
      "https://images.pexels.com/photos/10660199/pexels-photo-10660199.jpeg?auto=compress&cs=tinysrgb&w=1600",
    kicker: "Menyer och prislistor",
    title: "Visa erbjudanden där kunden redan tittar.",
  },
  {
    image:
      "https://images.pexels.com/photos/2482119/pexels-photo-2482119.jpeg?auto=compress&cs=tinysrgb&w=1600",
    kicker: "Butik och service",
    title: "Gör lokalen tydligare med levande information.",
  },
  {
    image:
      "https://images.pexels.com/photos/11344549/pexels-photo-11344549.jpeg?auto=compress&cs=tinysrgb&w=1600",
    kicker: "Redo för kunder",
    title: "En enkel start från skärm till färdig visning.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Välj paket",
    text: "Välj Standard eller Premium och skicka en kort förfrågan med företagets uppgifter.",
    detail: "Det är inte en beställning ännu. Vi använder uppgifterna för att skapa din säkra startlänk.",
  },
  {
    number: "02",
    title: "Skicka material och betala",
    text: "Via länken bekräftar du uppgifter, godkänner villkor, laddar upp material och går vidare till betalning.",
    detail: "Meny, prislista, logotyp, bilder eller enkla instruktioner räcker fint.",
  },
  {
    number: "03",
    title: "Vi bygger layouten",
    text: "Efter betalning skapar vi skärmlayouten utifrån materialet och skickar USB-enheten inom 4 arbetsdagar.",
    detail: "Under tiden kan du montera eller placera din Smart TV i lokalen.",
  },
  {
    number: "04",
    title: "Koppla in och starta",
    text: "När enheten kommer kopplar du den till HDMI, ansluter till Wi-Fi och följer instruktionerna vi skickar med.",
    detail: "Sedan är skärmen redo att visa ditt innehåll.",
  },
];

const faqs = [
  {
    question: "Vad betyder startlänk?",
    answer:
      "Det är en säker länk där du kontrollerar företagsuppgifter, skickar material till skärmen, godkänner villkor och går vidare till betalning.",
  },
  {
    question: "Vilket material behöver jag skicka?",
    answer:
      "Du kan ladda upp meny, prislista, logotyp, bilder eller PDF-filer. Det går också bra att skriva kort vad skärmen ska visa.",
  },
  {
    question: "Hur snabbt kan jag komma igång?",
    answer:
      "När betalningen är klar skapar vi layouten och postar USB-enheten inom 4 arbetsdagar. Leveranstiden beror sedan på posten.",
  },
  {
    question: "Behöver jag köpa en särskild TV?",
    answer:
      "Du behöver en Smart TV eller skärm med HDMI-ingång och tillgång till Wi-Fi. Du kan förbereda placering och montering medan vi gör layouten.",
  },
  {
    question: "Kan jag ändra innehållet senare?",
    answer:
      "Ja. InfoSync är byggt för löpande skärminnehåll. Kontakta oss när du vill byta kampanj, prislista eller annat material.",
  },
  {
    question: "Vad gäller kring ångerrätt och villkor?",
    answer:
      "Du får tydliga villkor, integritetsinformation och betalningsuppgifter innan du betalar. Vid distansköp gäller normalt 14 dagars ångerrätt enligt svensk konsumenträtt, med de undantag som framgår av villkoren.",
  },
];

const serviceMarks = [
  { label: "Stripe", className: "stripe" },
  { label: "Visa", className: "visa" },
  { label: "Mastercard", className: "mastercard" },
  { label: "Säker betalning", className: "secure" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<(typeof plans)[number] | null>(
    null,
  );
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [requestMessage, setRequestMessage] = useState("");

  const openPlanRequest = (plan: (typeof plans)[number]) => {
    setSelectedPlan(plan);
    setRequestStatus("idle");
    setRequestMessage("");
  };

  const closePlanRequest = () => {
    if (requestStatus === "saving") return;
    setSelectedPlan(null);
  };

  const submitPlanRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlan) return;

    setRequestStatus("saving");
    setRequestMessage("");

    const response = await fetch("/api/onboarding-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planCode: selectedPlan.code,
        companyName,
        email,
        contactPerson,
        phone,
        message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setRequestStatus("error");
      setRequestMessage(data.error || "Det gick inte att skicka din förfrågan.");
      return;
    }

    setCompanyName("");
    setEmail("");
    setContactPerson("");
    setPhone("");
    setMessage("");
    setRequestStatus("success");
    setRequestMessage(
      "Tack. Din förfrågan är mottagen och InfoSync återkommer med en säker startlänk.",
    );
  };

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a
          className="landing-brand"
          href="#top"
          onClick={() => setMenuOpen(false)}
        >
          <img src="/brand/infosync-logo1.png" alt="" />
          <span>InfoSync</span>
        </a>

        <button
          className="landing-menu-button"
          type="button"
          aria-label="Öppna meny"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={menuOpen ? "landing-links open" : "landing-links"}>
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
            className="landing-nav-cta"
            href="#contact"
            onClick={() => setMenuOpen(false)}
          >
            Boka demo
          </a>
        </nav>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Digital skyltning för företag</p>
            <div className="landing-hero-trust" aria-label="Trygga betalningsalternativ">
              {serviceMarks.map((service) => (
                <span
                  key={service.label}
                  className={`landing-service-mark landing-service-${service.className}`}
                >
                  {service.label}
                </span>
              ))}
            </div>
            <h1>Professionellt skärminnehåll, hanterat från en tydlig plattform.</h1>
            <p className="landing-lede">
              InfoSync hjälper salonger, butiker och serviceföretag att visa
              kampanjer, prislistor och information på skärm. Du väljer paket,
              skickar in dina uppgifter och får hjälp att komma igång utan
              tekniskt krångel.
            </p>

            <div className="landing-actions">
              <a href="#pricing" className="landing-button landing-button-primary">
                Se paket
              </a>
              <a href="#workflow" className="landing-button landing-button-secondary">
                Så fungerar det
              </a>
            </div>

            <div className="landing-stats">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-hero-media" aria-label="Bildspel för InfoSync">
            {heroSlides.map((slide, index) => (
              <img
                key={slide.image}
                src={slide.image}
                alt={slide.title}
                className={index === activeSlide ? "active" : ""}
              />
            ))}
            <div className="landing-slide-caption">
              <span>{heroSlides[activeSlide].kicker}</span>
              <strong>{heroSlides[activeSlide].title}</strong>
            </div>
            <div className="landing-slide-controls" aria-label="Byt bild">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.image}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className={index === activeSlide ? "active" : ""}
                  aria-label={`Visa bild ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="landing-section landing-platform">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Tjänsten</p>
            <h2>En enklare väg till professionell skärmvisning</h2>
            <p>
              Du behöver inte bygga ett eget system eller hantera tekniska
              inställningar. InfoSync hjälper dig från första förfrågan till
              en skärm som visar rätt innehåll i din verksamhet.
            </p>
          </div>

          <div className="landing-feature-grid">
            <Feature
              title="Smidig start"
              text="Du väljer paket och får en säker startlänk där allt fortsätter på ett tydligt sätt."
            />
            <Feature
              title="Tydlig kostnad"
              text="Du ser startavgift, månadskostnad, provperiod och bindningstid innan du går vidare."
            />
            <Feature
              title="Hjälp med skärmen"
              text="Vi gör layouten utifrån ditt material och skickar enheten med instruktioner."
            />
            <Feature
              title="Innehåll som syns"
              text="Du kan visa erbjudanden, prislistor, nyheter eller annan information som passar din lokal."
            />
          </div>
        </section>

        <section id="workflow" className="landing-section landing-workflow">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Så fungerar det</p>
            <h2>Från paketval till fungerande skärm</h2>
            <p>
              Startlänken är den säkra sidan där du bekräftar uppgifter, skickar
              material och går vidare till betalning. Resten håller vi enkelt.
            </p>
          </div>

          <div className="landing-timeline">
            {processSteps.map((step) => (
              <Step
                key={step.number}
                number={step.number}
                title={step.title}
                text={step.text}
                detail={step.detail}
              />
            ))}
          </div>

          <div className="landing-process-visual" aria-label="Översikt av processen">
            <div>
              <span>Förfrågan</span>
              <strong>Paket valt</strong>
            </div>
            <div>
              <span>Material</span>
              <strong>Meny, bilder, logotyp</strong>
            </div>
            <div>
              <span>Produktion</span>
              <strong>Layout + USB-enhet</strong>
            </div>
            <div>
              <span>Start</span>
              <strong>HDMI + Wi-Fi</strong>
            </div>
          </div>
        </section>

        <section id="pricing" className="landing-section landing-pricing">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Priser</p>
            <h2>Tydliga paket för hanterade skärmar</h2>
            <p>
              Startavgiften betalas en gång. Månadsabonnemanget har 14 dagars
              provperiod och ingen bindningstid.
            </p>
          </div>

          <div className="landing-price-grid">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={
                  plan.featured
                    ? "landing-price-card featured"
                    : "landing-price-card"
                }
              >
                {plan.featured && <span className="landing-plan-badge">Rekommenderas</span>}
                <div className="landing-plan-heading">
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.resolution}</p>
                  </div>
                  <span>{plan.resolution}</span>
                </div>
                <p className="landing-plan-description">{plan.description}</p>

                <div className="landing-price-row">
                  <span>Startavgift</span>
                  <strong>{plan.setupFee}</strong>
                </div>
                <div className="landing-price-row">
                  <span>Per månad</span>
                  <strong>{plan.monthlyFee}</strong>
                </div>

                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => openPlanRequest(plan)}
                  className="landing-button landing-button-primary"
                >
                  Välj {plan.name}
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-trust">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Trygg betalning</p>
            <h2>Betalning och uppgifter hanteras säkert</h2>
            <p>
              Betalningen sker via en säker betalningssida. Vi visar bara
              betalningssätt som är aktiverade för din betalning.
            </p>
          </div>

          <div className="landing-service-grid" aria-label="Betalning och tjänster">
            {serviceMarks.map((service) => (
              <span
                key={service.label}
                className={`landing-service-mark landing-service-${service.className}`}
              >
                {service.label}
              </span>
            ))}
          </div>
        </section>

        <section id="faq" className="landing-section landing-faq">
          <div className="landing-section-heading">
            <p className="landing-eyebrow">Vanliga frågor</p>
            <h2>Svar innan du väljer paket</h2>
          </div>

          <div className="landing-faq-grid">
            {faqs.map((item) => (
              <details key={item.question} className="landing-faq-item">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-section landing-company">
          <div>
            <p className="landing-eyebrow">Om InfoSync</p>
            <h2>Företagsinformation kommer snart</h2>
            <p>
              Här kommer vi att lägga in organisationsnummer, registrerad
              företagsadress, kontaktuppgifter och övrig bolagsinformation när
              registreringen är klar.
            </p>
          </div>
          <div className="landing-company-card">
            <span>InfoSync</span>
            <strong>Digital skyltning för lokala företag</strong>
            <p>Plats för uppdaterad företagsinformation.</p>
          </div>
        </section>

        <section id="contact" className="landing-contact">
          <div>
            <p className="landing-eyebrow">Redo att komma igång?</p>
            <h2>Starta din nästa skärm med ett enklare arbetsflöde.</h2>
            <p>
              Berätta hur många skärmar du vill hantera och vilket innehåll
              du vill visa. Vi hjälper dig att välja rätt paket.
            </p>
          </div>
          <a href="mailto:hello@infosync.se" className="landing-button landing-button-primary">
            Kontakta InfoSync
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <span>InfoSync</span>
        <nav>
          <a href="/terms">Villkor</a>
          <a href="/privacy">Integritet</a>
        </nav>
        <p>{new Date().getFullYear()} InfoSync. Alla rättigheter förbehållna.</p>
      </footer>

      {selectedPlan && (
        <div className="landing-modal-backdrop" role="presentation">
          <section
            className="landing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-request-title"
          >
            <button
              type="button"
              onClick={closePlanRequest}
              className="landing-modal-close"
              aria-label="Stäng formulär"
            >
              Stäng
            </button>

            <p className="landing-eyebrow">Skicka förfrågan</p>
            <h2 id="landing-request-title">
              Starta med {selectedPlan.name} {selectedPlan.resolution}
            </h2>
            <p>
              Skicka företagets uppgifter så kontaktar InfoSync dig med en
              säker startlänk för uppgifter, villkor och betalning.
            </p>

            <form onSubmit={submitPlanRequest} className="landing-request-form">
              <label>
                <span>Företagsnamn *</span>
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  required
                  placeholder="Exempel: Salon Bella"
                />
              </label>

              <label>
                <span>E-post *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="namn@foretag.se"
                />
              </label>

              <label>
                <span>Kontaktperson</span>
                <input
                  value={contactPerson}
                  onChange={(event) => setContactPerson(event.target.value)}
                  placeholder="Ditt namn"
                />
              </label>

              <label>
                <span>Telefon</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+46..."
                />
              </label>

              <label className="landing-request-form-wide">
                <span>Meddelande</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={3}
                  placeholder="Antal skärmar, plats eller annat vi bör känna till."
                />
              </label>

              {requestMessage && (
                <p
                  className={`landing-request-message landing-request-${requestStatus}`}
                >
                  {requestMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={requestStatus === "saving"}
                className="landing-button landing-button-primary landing-request-submit"
              >
                {requestStatus === "saving"
                  ? "Skickar förfrågan..."
                  : "Skicka förfrågan"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <article className="landing-feature">
      <span />
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Step({
  number,
  title,
  text,
  detail,
}: {
  number: string;
  title: string;
  text: string;
  detail?: string;
}) {
  return (
    <article className="landing-step">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {detail && <small>{detail}</small>}
    </article>
  );
}
