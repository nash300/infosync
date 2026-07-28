"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { LandingNav } from "@/components/LandingNav";
import { LandingScrollReveal } from "@/components/LandingScrollReveal";
import ScreeniaLogo from "@/components/ScreeniaLogo";
import { serializeJsonLd } from "@/lib/seo";
import {
  copy,
  fallbackHeroBenefits,
  featureIcons,
  heroHighlightWords,
  planCopy,
  plans,
  publicSiteUrl,
  visualCopy,
  visualImages,
  workflowImages,
  type HeroBenefit,
  type HeroSlideAsset,
  type LandingAsset,
} from "./landing-content";
import {
  ADDITIONAL_SETUP_FEE_PER_SCREEN_SEK,
  INCLUDED_SETUP_SCREEN_COUNT,
  additionalSetupScreenCount,
  calculateSetupFeeSek,
} from "@/lib/pricing/setup-fee";
import {
  ADDITIONAL_SHIPPING_FEE_PER_DEVICE_SEK,
  BASE_SHIPPING_FEE_SEK,
  INCLUDED_SHIPPING_DEVICE_COUNT,
  additionalShippingDeviceCount,
  calculateShippingFeeSek,
} from "@/lib/pricing/shipping-fee";
import {
  type LandingExampleVideo,
} from "@/lib/landing/example-videos";

function renderHighlightedText(text: string, words: string[]) {
  const terms = words.map((word) => word.trim()).filter(Boolean);
  if (!terms.length) return text;

  const escapedWords = terms.map((word) =>
    word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const pattern = new RegExp(`(${escapedWords.join("|")})`, "gi");

  return text.split(pattern).map((part, index) => {
    const isHighlighted = terms.some(
      (word) => word.toLowerCase() === part.toLowerCase(),
    );

    if (!isHighlighted) return part;

    return (
      <span key={`${part}-${index}`} className="landing-highlight">
        {part}
      </span>
    );
  });
}

function isValidOptionalPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^[+0-9().\-\s]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function formatLandingSek(value: number) {
  return `${value.toLocaleString("sv-SE")} kr`;
}

function LandingVideoPreviewCard({
  example,
  orientation,
  duplicate,
  onOpen,
}: {
  example: LandingExampleVideo;
  orientation: "portrait" | "landscape";
  duplicate: boolean;
  onOpen: (example: LandingExampleVideo) => void;
}) {
  const [playing, setPlaying] = useState(false);
  const isAccessible = !duplicate;

  return (
    <article
      className={`landing-video-gallery-card landing-video-gallery-card-${orientation}${playing ? " landing-video-gallery-card-playing" : ""}`}
      role={isAccessible ? "button" : undefined}
      tabIndex={isAccessible ? 0 : -1}
      aria-label={isAccessible ? `Spela förhandsvisning: ${example.title}` : undefined}
      onMouseEnter={() => setPlaying(true)}
      onMouseLeave={() => setPlaying(false)}
      onFocus={() => isAccessible && setPlaying(true)}
      onBlur={() => setPlaying(false)}
      onClick={() => {
        setPlaying(false);
        onOpen(example);
      }}
      onKeyDown={(event) => {
        if (!isAccessible || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        setPlaying(false);
        onOpen(example);
      }}
    >
      <div className="landing-video-gallery-media">
        {example.poster_url ? (
          <Image
            src={example.poster_url}
            alt=""
            fill
            sizes={orientation === "portrait" ? "210px" : "390px"}
            unoptimized
            className="landing-video-gallery-poster"
          />
        ) : (
          <video
            src={example.video_url}
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="landing-video-gallery-poster"
          />
        )}
        {playing && (
          <video
            src={example.video_url}
            aria-label={isAccessible ? example.title : undefined}
            aria-hidden={duplicate ? "true" : undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="landing-video-gallery-playing-video"
          />
        )}
      </div>
    </article>
  );
}

function LandingVideoRail({
  items,
  orientation,
  direction,
  onOpen,
}: {
  items: LandingExampleVideo[];
  orientation: "portrait" | "landscape";
  direction: "left" | "right";
  onOpen: (example: LandingExampleVideo) => void;
}) {
  const itemKey = items.map((item) => item.id).join(",");
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    setMoving(false);
    const timer = window.setTimeout(() => setMoving(true), 900);
    return () => window.clearTimeout(timer);
  }, [itemKey, orientation]);

  if (!items.length) return null;

  const renderGroup = (group: number) => (
    <div
      key={group}
      className="landing-video-rail-group"
      aria-hidden={group > 0 ? "true" : undefined}
    >
      {items.map((example) => (
        <LandingVideoPreviewCard
          key={`${example.id}-${group}`}
          example={example}
          orientation={orientation}
          duplicate={group > 0}
          onOpen={onOpen}
        />
      ))}
    </div>
  );

  return (
    <div
      className={`landing-video-rail landing-video-rail-${orientation}`}
      aria-label={orientation === "portrait" ? "Vertikala skärmexempel" : "Horisontella skärmexempel"}
    >
      <div className={`landing-video-rail-track landing-video-rail-track-${direction}${moving ? "" : " landing-video-rail-track-pending"}`}>
        {[0, 1, 2].map(renderGroup)}
      </div>
    </div>
  );
}

export default function Home() {
  const [requestOpen, setRequestOpen] = useState(false);
  const [priceBreakdownOpen, setPriceBreakdownOpen] = useState(false);
  const [expandedExample, setExpandedExample] = useState<LandingExampleVideo | null>(null);
  const [expandedPlanDetails, setExpandedPlanDetails] = useState<Record<string, boolean>>({});
  const [planQuantities, setPlanQuantities] = useState<Record<(typeof plans)[number]["code"], number>>({
    standard_fhd: 0,
    premium_4k: 0,
    premium_plus_4k: 0,
  });
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [requestMessage, setRequestMessage] = useState("");
  const [heroSlides, setHeroSlides] = useState<HeroSlideAsset[]>([]);
  const [managedHeroBenefits, setManagedHeroBenefits] =
    useState<HeroBenefit[]>(fallbackHeroBenefits);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [heroSlideDirection, setHeroSlideDirection] = useState<"next" | "previous">("next");
  const [heroInteractionKey, setHeroInteractionKey] = useState(0);
  const [serviceLogos, setServiceLogos] = useState<LandingAsset[]>([]);
  const [exampleVideos, setExampleVideos] = useState<LandingExampleVideo[]>([]);

  const t = copy.sv;
  const companyEmail = process.env.NEXT_PUBLIC_COMPANY_EMAIL || "service@screenia.se";
  const footerLinks = [
    { label: "Integritet", href: "/privacy" },
    { label: "Villkor", href: "/terms" },
    { label: "Kundinloggning", href: "/login" },
    { label: "Kontakt", href: "/kontakt" },
  ];
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${publicSiteUrl}/#business`,
      name: "Screenia",
      url: publicSiteUrl,
      image: `${publicSiteUrl}/brand/screenia-logo-full-white-bg.png`,
      logo: `${publicSiteUrl}/brand/screenia-logo-full-white-bg.png`,
      email: process.env.NEXT_PUBLIC_COMPANY_EMAIL || "service@screenia.se",
      areaServed: {
        "@type": "Country",
        name: "Sweden",
      },
      priceRange: "SEK 249-399 per månad",
      description: t.seoIntro,
      knowsAbout: [
        "digital skyltning",
        "digital signage",
        "skärmreklam",
        "menyskärm",
        "informationsskärm",
        "TV skyltning",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${publicSiteUrl}/#website`,
      name: "Screenia",
      url: publicSiteUrl,
      inLanguage: "sv-SE",
      publisher: {
        "@id": `${publicSiteUrl}/#business`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${publicSiteUrl}/#digital-signage-service`,
      name: "Digital skyltning för företag",
      serviceType: "Digital signage",
      provider: {
        "@id": `${publicSiteUrl}/#business`,
      },
      areaServed: {
        "@type": "Country",
        name: "Sweden",
      },
      description: t.seoIntro,
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Screenia paket",
        itemListElement: plans.map((plan) => ({
          "@type": "Offer",
          name: `${plan.name} ${plan.resolution}`,
          description: planCopy.sv[plan.code].description,
          priceCurrency: "SEK",
          price: Number(plan.monthlyFee.replace(/\D/g, "")),
          category: "Digital signage subscription",
          availability: "https://schema.org/InStock",
          eligibleDuration: {
            "@type": "QuantitativeValue",
            value: 3,
            unitText: "veckors kostnadsfri provperiod",
          },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${publicSiteUrl}/#faq`,
      inLanguage: "sv-SE",
      mainEntity: t.faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const loadLandingAssets = async () => {
      try {
        const response = await fetch("/api/landing-assets");
        if (!response.ok) return;

        const data = (await response.json()) as {
          heroSlides: HeroSlideAsset[];
          heroBenefits?: HeroBenefit[];
          exampleVideos?: LandingExampleVideo[];
          serviceLogos: LandingAsset[];
        };

        if (!isMounted) return;

        if (data.heroSlides?.length) {
          setHeroSlides(data.heroSlides);
          setActiveHeroSlide(0);
        }

        if (data.heroBenefits?.length) {
          setManagedHeroBenefits(data.heroBenefits);
        }

        if (data.exampleVideos?.length) {
          setExampleVideos(data.exampleVideos);
        }

        setServiceLogos(data.serviceLogos || []);
      } catch {
        return;
      }
    };

    loadLandingAssets();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedQuoteItems = plans
    .map((plan) => ({ plan, quantity: planQuantities[plan.code] }))
    .filter((item) => item.quantity > 0);
  const selectedScreenCount = selectedQuoteItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const selectedSetupFee = calculateSetupFeeSek(
    selectedScreenCount,
    plans[0].setupFeeSek,
  );
  const selectedAdditionalSetupScreens =
    additionalSetupScreenCount(selectedScreenCount);
  const selectedHardwareTotal = selectedQuoteItems.reduce(
    (sum, item) => sum + item.plan.hardwareFeeSek * item.quantity,
    0,
  );
  const selectedAdditionalShippingDevices =
    additionalShippingDeviceCount(selectedScreenCount);
  const selectedShippingTotal = calculateShippingFeeSek(selectedScreenCount);
  const selectedMonthlyTotal = selectedQuoteItems.reduce(
    (sum, item) => sum + item.plan.monthlyFeeSek * item.quantity,
    0,
  );
  const selectedFirstPayment =
    selectedSetupFee + selectedHardwareTotal + selectedShippingTotal;

  const setPlanQuantity = (
    code: (typeof plans)[number]["code"],
    quantity: number,
  ) => {
    setPlanQuantities((current) => {
      const otherQuantity = Object.entries(current).reduce(
        (sum, [itemCode, itemQuantity]) =>
          itemCode === code ? sum : sum + itemQuantity,
        0,
      );
      return {
        ...current,
        [code]: Math.min(50 - otherQuantity, Math.max(0, quantity)),
      };
    });
  };

  const openPlanRequest = () => {
    if (selectedScreenCount === 0) return;
    setPriceBreakdownOpen(false);
    setRequestOpen(true);
    setRequestStatus("idle");
    setRequestMessage("");
  };

  const closePlanRequest = () => {
    if (requestStatus === "saving") return;
    setRequestOpen(false);
  };

  const heroSlideCount = heroSlides.length;
  const currentHeroSlide =
    heroSlideCount > 0
      ? heroSlides[activeHeroSlide % heroSlideCount].sv
      : {
          eyebrow: t.eyebrow,
          title: t.hero,
          text: t.lede,
        };
  const currentHeroMedia =
    heroSlideCount > 0 ? heroSlides[activeHeroSlide % heroSlideCount] : null;
  const currentHeroIndex = heroSlideCount > 0 ? activeHeroSlide % heroSlideCount : 0;
  const currentHighlightWords = currentHeroMedia
    ? currentHeroMedia.highlightTerms?.length
      ? currentHeroMedia.highlightTerms
      : heroHighlightWords[currentHeroMedia.id] || []
    : ["Professionellt", "tydlig plattform"];
  const heroSlideMotionClass = `landing-hero-slide-motion landing-hero-slide-motion-${heroSlideDirection} landing-hero-slide-motion-${heroSlideDirection}-${currentHeroIndex}`;
  const heroSlideMotionKey = `${heroSlideDirection}-${currentHeroIndex}-${heroInteractionKey}`;
  const heroTitleLength = currentHeroSlide.title.trim().length;
  const heroTitleSizeClass =
    heroTitleLength > 58
      ? "landing-hero-title-extra-long"
      : heroTitleLength > 45
        ? "landing-hero-title-long"
        : heroTitleLength > 37
          ? "landing-hero-title-medium"
          : "landing-hero-title-standard";
  const heroCopyDensityClass =
    heroTitleLength + currentHeroSlide.text.trim().length > 155
      ? "landing-hero-copy-main-dense"
      : "";

  const goToHeroSlide = (index: number) => {
    if (heroSlideCount <= 1) return;

    const targetIndex = (index + heroSlideCount) % heroSlideCount;
    const stepForward =
      targetIndex === (currentHeroIndex + 1) % heroSlideCount ||
      (currentHeroIndex === heroSlideCount - 1 && targetIndex === 0);
    setHeroSlideDirection(stepForward ? "next" : "previous");
    setActiveHeroSlide(targetIndex);
    setHeroInteractionKey((current) => current + 1);
  };

  const goToPreviousHeroSlide = () => {
    goToHeroSlide(currentHeroIndex - 1);
  };

  const goToNextHeroSlide = () => {
    goToHeroSlide(currentHeroIndex + 1);
  };

  useEffect(() => {
    if (heroSlideCount <= 1) return;

    const timer = window.setInterval(() => {
      setHeroSlideDirection("next");
      setActiveHeroSlide((current) => (current + 1) % heroSlideCount);
    }, 6500);

    return () => {
      window.clearInterval(timer);
    };
  }, [heroSlideCount, heroInteractionKey]);

  useEffect(() => {
    if (!expandedExample) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedExample(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expandedExample]);

  const submitPlanRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedScreenCount === 0) return;

    if (!isValidOptionalPhone(phone)) {
      setRequestStatus("error");
      setRequestMessage(
        "Ange ett giltigt telefonnummer med 7–15 siffror, eller lämna fältet tomt.",
      );
      return;
    }

    setRequestStatus("saving");
    setRequestMessage("");

    const response = await fetch("/api/onboarding-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteItems: selectedQuoteItems.map(({ plan, quantity }) => ({
          pricingPlanCode: plan.code,
          quantity,
        })),
        companyName,
        email,
        contactPerson,
        phone,
        message,
        privacyAccepted,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setRequestStatus("error");
      setRequestMessage(data.error || t.error);
      return;
    }

    setCompanyName("");
    setEmail("");
    setContactPerson("");
    setPhone("");
    setPlanQuantities({
      standard_fhd: 0,
      premium_4k: 0,
      premium_plus_4k: 0,
    });
    setMessage("");
    setPrivacyAccepted(false);
    setRequestStatus("success");
    setRequestMessage(t.success);
  };

  return (
    <div className="landing-page">
      <LandingScrollReveal />
      <LandingNav currentPath="/" />

      <main id="top">
        <section className="landing-hero landing-hero-background-slide">
          <div className="landing-hero-layout">
            <div
              className="landing-hero-video-layer"
              aria-hidden="true"
            >
              {currentHeroMedia && (
                <Image
                  key={currentHeroMedia.id}
                  src={currentHeroMedia.src}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 980px) 100vw, 48vw"
                  className={`landing-hero-background-image landing-hero-background-image-${heroSlideDirection}`}
                />
              )}
            </div>
            <div className="landing-hero-copy">
              <div
                key={`hero-copy-${heroSlideMotionKey}`}
                className={`landing-hero-copy-main ${heroCopyDensityClass} ${heroSlideMotionClass}`}
              >
                <h1 className={heroTitleSizeClass}>
                  {renderHighlightedText(currentHeroSlide.title, currentHighlightWords)}
                </h1>
                <p className="landing-lede">
                  {currentHeroSlide.text}
                </p>
                <div className="landing-actions">
                  <a href="#pricing" className="landing-button landing-button-primary">
                    {t.pricingCta}
                  </a>
                  <a href="/sa-fungerar-det" className="landing-button landing-button-secondary">
                    {t.workflowCta}
                  </a>
                </div>
                <div className="landing-stats">
                  {t.stats.map(([value, label]) => (
                    <div key={label}>
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
                <p className="landing-seo-copy">{t.seoIntro}</p>
              </div>
            </div>
          </div>
          <div
            className="landing-hero-benefits"
            aria-label="Screenia benefits"
          >
            {managedHeroBenefits.map((benefit) => (
              <div key={benefit.id} className="landing-hero-benefit">
                <span>
                  <strong>{benefit.title}</strong>
                  <small>{benefit.body}</small>
                </span>
              </div>
            ))}
          </div>
          {heroSlideCount > 1 && (
            <div className="landing-hero-controls" aria-label="Bildspel">
              <button
                type="button"
                className="landing-hero-arrow"
                onClick={goToPreviousHeroSlide}
                aria-label="Visa föregående bild"
              >
                <span aria-hidden="true">‹</span>
              </button>
              <div className="landing-hero-dots" role="tablist" aria-label="Välj bild">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={
                      index === currentHeroIndex
                        ? "landing-hero-dot-active"
                        : undefined
                    }
                    onClick={() => goToHeroSlide(index)}
                    role="tab"
                    aria-selected={index === currentHeroIndex}
                    aria-label={`Visa bild ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="landing-hero-arrow"
                onClick={goToNextHeroSlide}
                aria-label="Visa nästa bild"
              >
                <span aria-hidden="true">›</span>
              </button>
            </div>
          )}
        </section>

        <LandingSection id="platform" title={t.platformTitle} text={t.platformText}>
          <div className="landing-feature-grid">
            {t.features.map(([title, text], index) => (
              <Feature
                key={title}
                title={title}
                text={text}
                icon={featureIcons[index] || "spark"}
              />
            ))}
          </div>
          <div className="landing-illustration-grid">
            {visualCopy.sv.map(([title, text], index) => (
              <Illustration
                key={title}
                title={title}
                text={text}
                index={index}
                image={visualImages[index]}
              />
            ))}
          </div>
        </LandingSection>

        <section id="workflow" className="landing-section landing-section-surface landing-workflow">
          <div className="landing-section-panel landing-workflow-panel">
            <div className="landing-workflow-heading">
              <h2>{t.workflowTitle}</h2>
              <p>{t.workflowText}</p>
            </div>
            <div className="landing-workflow-grid">
              {t.steps.map(([number, title, points], index) => (
                <article key={number} className="landing-workflow-step">
                  <div className="landing-workflow-image-wrap">
                    <Image
                      src={workflowImages[index]}
                      alt=""
                      fill
                      sizes="(max-width: 780px) 42vw, (max-width: 1180px) 30vw, 18vw"
                    />
                  </div>
                  <div className="landing-workflow-step-copy">
                    <span>{number}</span>
                    <h3>{title}</h3>
                    <p className="landing-workflow-description">
                      {points.join(" ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <LandingSection
          id="pricing"
          title="Bygg en skärmlösning"
          text="Välj Full HD, Premium 4K eller Premium Plus med egna videor. Paketen kan kombineras i samma förfrågan och kostnaden uppdateras direkt."
        >
          {selectedScreenCount > 0 ? (
            <a
              className="landing-mobile-selection-bar"
              href="#selected-package-summary"
              aria-label={`Visa vald kombination: ${selectedScreenCount} skärm${selectedScreenCount === 1 ? "" : "ar"}, ${formatLandingSek(selectedMonthlyTotal)} per månad`}
            >
              <span>
                <strong>
                  {selectedScreenCount} skärm{selectedScreenCount === 1 ? "" : "ar"} vald
                  {selectedScreenCount === 1 ? "" : "a"}
                </strong>
                <small>{formatLandingSek(selectedMonthlyTotal)}/mån totalt</small>
              </span>
              <b>Visa val</b>
            </a>
          ) : null}
          <div className="landing-price-grid">
            {plans.map((plan) => {
              const planText = planCopy.sv[plan.code];
              return (
                <article
                  key={plan.name}
                  className={`landing-price-card landing-price-card-${plan.cardAccent} ${
                    plan.featured ? "landing-price-card-featured" : ""
                  }`}
                >
                  <div className="landing-plan-card-top">
                    <span
                      className={`landing-plan-badge landing-plan-badge-${plan.badgeTone}`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                  <div className="landing-plan-heading">
                    <h3>{plan.name}</h3>
                    <span>{plan.resolution}</span>
                  </div>
                  <div className="landing-plan-device" aria-hidden="true">
                    <Image
                      src={plan.deviceImage}
                      alt=""
                      width={560}
                      height={528}
                      className="landing-plan-device-image"
                    />
                    <span>{plan.deviceLabel}</span>
                  </div>
                  <div className="landing-plan-price">
                    <strong>{plan.monthlyFee}</strong>
                    <span>per skärm och månad, inkl. moms</span>
                    <span>Startar efter 21 kostnadsfria dagar</span>
                  </div>
                  <div className="landing-price-mini-grid">
                    <PriceRow
                      label="Skärmenhet, engångsvis"
                      value={formatLandingSek(plan.hardwareFeeSek)}
                    />
                    <PriceRow label="Startavgift (upp till 3 skärmar)" value={plan.setupFee} />
                  </div>
                  <div className="landing-plan-quantity">
                    <div>
                      <strong>Antal skärmar</strong>
                    </div>
                    <div className="landing-quantity-stepper">
                      <button
                        type="button"
                        onClick={() => setPlanQuantity(plan.code, planQuantities[plan.code] - 1)}
                        disabled={planQuantities[plan.code] === 0}
                        aria-label={`Minska antal ${plan.name} ${plan.resolution}`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={planQuantities[plan.code]}
                        onChange={(event) =>
                          setPlanQuantity(plan.code, Number(event.target.value) || 0)
                        }
                        aria-label={`Antal ${plan.name} ${plan.resolution}`}
                      />
                      <button
                        type="button"
                        onClick={() => setPlanQuantity(plan.code, planQuantities[plan.code] + 1)}
                        disabled={selectedScreenCount >= 50}
                        aria-label={`Öka antal ${plan.name} ${plan.resolution}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div
                    className={`landing-plan-details ${
                      expandedPlanDetails[plan.code] ? "landing-plan-details-expanded" : ""
                    }`}
                  >
                    <p className="landing-plan-description">{planText.description}</p>
                    <ul>
                      <li>Upp till {plan.maxSlides} slides per skärm</li>
                      <li>Upp till {plan.maxSectionsPerSlide} sektioner per slide</li>
                      {planText.features.map((feature) => <li key={feature}>{feature}</li>)}
                    </ul>
                    <button
                      type="button"
                      className="landing-plan-details-toggle"
                      onClick={() =>
                        setExpandedPlanDetails((current) => ({
                          ...current,
                          [plan.code]: !current[plan.code],
                        }))
                      }
                      aria-expanded={Boolean(expandedPlanDetails[plan.code])}
                    >
                      {expandedPlanDetails[plan.code]
                        ? "Visa mindre"
                        : "Visa alla funktioner"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {selectedScreenCount > 0 ? (
          <section
            id="selected-package-summary"
            className="landing-package-builder"
            aria-live="polite"
          >
            <div className="landing-package-builder-heading">
              <div>
                <p className="landing-eyebrow">Vald kombination</p>
                <h3>
                  {selectedScreenCount > 0
                    ? `${selectedScreenCount} skärm${selectedScreenCount === 1 ? "" : "ar"} vald${selectedScreenCount === 1 ? "" : "a"}`
                    : "Välj antal i korten ovan"}
                </h3>
              </div>
              <span>Alla priser inkl. moms</span>
            </div>

            {selectedScreenCount > 0 ? (
              <>
                <div className="landing-package-lines">
                  {selectedQuoteItems.map(({ plan, quantity }) => (
                    <div key={plan.code}>
                      <span>{quantity} × {plan.name} {plan.resolution}</span>
                      <strong>
                        {formatLandingSek(plan.monthlyFeeSek * quantity)}/mån
                        <small>Skärmenheter: {formatLandingSek(plan.hardwareFeeSek * quantity)} engångsvis</small>
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="landing-package-totals">
                  <div className="landing-package-total-primary">
                    <span>Löpande kostnad efter 21 kostnadsfria dagar</span>
                    <strong>{formatLandingSek(selectedMonthlyTotal)}/mån totalt</strong>
                    <small>Ingen bindningstid.</small>
                  </div>
                  <div className="landing-package-total-secondary">
                    <span>Engångsbetalning vid start</span>
                    <strong>{formatLandingSek(selectedFirstPayment)}</strong>
                    <small>Startavgift, alla valda enheter och frakt.</small>
                    <button
                      type="button"
                      className="landing-package-breakdown-trigger"
                      onClick={() => setPriceBreakdownOpen(true)}
                    >
                      Se exakt prisspecifikation
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openPlanRequest}
                  className="landing-button landing-button-primary landing-package-continue"
                >
                  Fortsätt med valda skärmar
                </button>
              </>
            ) : (
              <p className="landing-package-empty">
                Lägg till Standard, Premium eller Premium Plus för att beräkna kostnaden.
              </p>
            )}
          </section>
          ) : null}
          {serviceLogos.length > 0 && (
            <div className="landing-logo-rail landing-pricing-logo-rail" aria-label="Betalning och leverans">
              <div className="landing-logo-track">
                {[0, 1, 2].map((group) => (
                  <div
                    key={group}
                    className="landing-logo-group"
                    aria-hidden={group > 0 ? "true" : undefined}
                  >
                    {serviceLogos.map((logo) => (
                      <span key={`${logo.label}-${group}`} className="landing-logo-tile">
                        <Image
                          src={logo.src}
                          alt={group === 0 ? `${logo.label} logo` : ""}
                          width={logo.width || 138}
                          height={logo.height || 30}
                        />
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </LandingSection>

        <LandingSection id="examples" title={t.galleryTitle} text={t.galleryText}>
          <div className="landing-video-rails">
            <LandingVideoRail
              items={exampleVideos.filter((example) => example.orientation === "portrait")}
              orientation="portrait"
              direction="left"
              onOpen={setExpandedExample}
            />
            <LandingVideoRail
              items={exampleVideos.filter((example) => example.orientation !== "portrait")}
              orientation="landscape"
              direction="right"
              onOpen={setExpandedExample}
            />
          </div>
        </LandingSection>

        <LandingSection id="faq" title={t.faqTitle}>
          <div className="landing-faq-layout">
            <div className="landing-faq-grid">
              {t.faqs.map(([question, answer]) => (
                <details key={question} className="landing-faq-item">
                  <summary>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </LandingSection>

        <section id="contact" className="landing-section-surface landing-contact">
          <div className="landing-contact-panel">
            <div>
              <p className="landing-eyebrow">{t.contactEyebrow}</p>
              <h2>{t.contactTitle}</h2>
              <p>{t.contactText}</p>
            </div>
            <Link href="/kontakt" className="landing-button landing-button-primary">
              {t.contactButton}
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <Link href="/" aria-label="Screenia startsida">
            <ScreeniaLogo className="screenia-logo-footer" />
          </Link>
          <p>Digital skyltning, tydligt hanterad.</p>
        </div>
        <div className="landing-footer-contact">
          <span>Kundservice</span>
          <a href={`mailto:${companyEmail}`}>{companyEmail}</a>
        </div>
        <nav aria-label="Sidfot">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />

      {expandedExample && (
        <div
          className="landing-video-lightbox-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setExpandedExample(null);
          }}
        >
          <section
            className={`landing-video-lightbox landing-video-lightbox-${expandedExample.orientation}`}
            role="dialog"
            aria-modal="true"
            aria-label="Förstorad videoförhandsvisning"
          >
            <button
              type="button"
              className="landing-video-lightbox-close"
              onClick={() => setExpandedExample(null)}
              aria-label="Stäng förhandsvisning"
              title="Stäng"
            >
              <span aria-hidden="true">×</span>
            </button>
            <video
              key={expandedExample.id}
              src={expandedExample.video_url}
              poster={expandedExample.poster_url || undefined}
              aria-label={expandedExample.title}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />
          </section>
        </div>
      )}

      {requestOpen && selectedScreenCount > 0 && (
        <div className="landing-modal-backdrop" role="presentation">
          <section className="landing-modal" role="dialog" aria-modal="true" aria-labelledby="landing-request-title">
            <button
              type="button"
              onClick={closePlanRequest}
              className="landing-modal-close"
              aria-label={t.close}
              title={t.close}
            >
              <span aria-hidden="true">×</span>
            </button>
            <p className="landing-eyebrow">{t.modalEyebrow}</p>
            <h2 id="landing-request-title">
              Vald skärmlösning
            </h2>
            <p>
              {selectedQuoteItems
                .map(({ plan, quantity }) => `${quantity} × ${plan.name} ${plan.resolution}`)
              .join(" + ")}. Efter den kostnadsfria 21-dagarsperioden är abonnemanget {formatLandingSek(selectedMonthlyTotal)}/månad. Engångsbetalningen vid start är {formatLandingSek(selectedFirstPayment)} och inkluderar startavgift {formatLandingSek(selectedSetupFee)}, alla enheter och frakt {formatLandingSek(selectedShippingTotal)}. Startavgiften täcker upp till tre skärmar och fraktpriset täcker upp till tre enheter.
            </p>
            <form onSubmit={submitPlanRequest} className="landing-request-form">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                className="landing-honeypot"
                aria-hidden="true"
              />
              <FormField label={t.fields[0]} value={companyName} onChange={setCompanyName} placeholder={t.placeholders[0]} required />
              <FormField label={t.fields[1]} value={email} onChange={setEmail} placeholder={t.placeholders[1]} type="email" required />
              <FormField label={t.fields[2]} value={contactPerson} onChange={setContactPerson} placeholder={t.placeholders[2]} />
              <FormField label={t.fields[3]} value={phone} onChange={setPhone} placeholder={t.placeholders[3]} type="tel" />
              <div className="landing-request-selection landing-request-form-wide">
                {selectedQuoteItems.map(({ plan, quantity }) => (
                  <span key={plan.code}>{quantity} × {plan.name} {plan.resolution}</span>
                ))}
              </div>
              <label className="landing-request-form-wide">
                <span>{t.fields[4]}</span>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} placeholder={t.placeholders[4]} />
              </label>

              <p className="landing-request-privacy landing-request-form-wide">
                {t.requestPrivacy} <a href="/privacy" target="_blank">Integritetspolicy</a>
              </p>

              <label className="landing-request-checkbox landing-request-form-wide">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(event) => setPrivacyAccepted(event.target.checked)}
                  required
                />
                <span>{t.requestPrivacyConsent}</span>
              </label>

              {requestMessage && (
                <p className={`landing-request-message landing-request-${requestStatus}`}>
                  {requestMessage}
                </p>
              )}

              <button type="submit" disabled={requestStatus === "saving"} className="landing-button landing-button-primary landing-request-submit">
                {requestStatus === "saving" ? t.sending : t.submit}
              </button>
            </form>
          </section>
        </div>
      )}

      {priceBreakdownOpen && selectedScreenCount > 0 && (
        <div className="landing-modal-backdrop" role="presentation">
          <section
            className="landing-modal landing-pricing-breakdown-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="landing-price-breakdown-title"
          >
            <button
              type="button"
              onClick={() => setPriceBreakdownOpen(false)}
              className="landing-modal-close"
              aria-label={t.close}
              title={t.close}
            >
              <span aria-hidden="true">×</span>
            </button>
            <p className="landing-eyebrow">Prisöversikt</p>
            <h2 id="landing-price-breakdown-title">Exakt prisspecifikation</h2>
            <p>
              Samtliga belopp anges inklusive moms. Specifikationen bygger på
              den valda kombinationen av skärmar.
            </p>
            <dl className="landing-package-breakdown-list landing-package-breakdown-modal-list">
              <div>
                <dt>
                  Start och konfiguration
                  <small>
                    Grundavgift {formatLandingSek(plans[0].setupFeeSek)} (upp till {INCLUDED_SETUP_SCREEN_COUNT} skärmar). Inkluderar personlig rådgivning vid planering, framtagning av layout och överenskomna justeringar under uppstartsfasen.
                    {selectedAdditionalSetupScreens > 0
                      ? ` ${selectedAdditionalSetupScreens} extra skärm${selectedAdditionalSetupScreens === 1 ? "" : "ar"} × ${formatLandingSek(ADDITIONAL_SETUP_FEE_PER_SCREEN_SEK)}.`
                      : ""}
                  </small>
                </dt>
                <dd>{formatLandingSek(selectedSetupFee)}</dd>
              </div>
              <div>
                <dt>
                  Skärmenheter
                  <small className="landing-package-hardware-calculation">
                    {selectedQuoteItems.map(({ plan, quantity }) => (
                      <span key={plan.code}>
                        {quantity} × {plan.name} {plan.resolution} à{" "}
                        {formatLandingSek(plan.hardwareFeeSek)} ={" "}
                        {formatLandingSek(plan.hardwareFeeSek * quantity)}
                      </span>
                    ))}
                  </small>
                </dt>
                <dd>{formatLandingSek(selectedHardwareTotal)}</dd>
              </div>
              <div>
                <dt>
                  Frakt inom Sverige
                  <small>
                    {formatLandingSek(BASE_SHIPPING_FEE_SEK)} (upp till {INCLUDED_SHIPPING_DEVICE_COUNT} enheter)
                    {selectedAdditionalShippingDevices > 0
                      ? ` + ${selectedAdditionalShippingDevices} extra enhet${selectedAdditionalShippingDevices === 1 ? "" : "er"} × ${formatLandingSek(ADDITIONAL_SHIPPING_FEE_PER_DEVICE_SEK)}`
                      : ""}.
                  </small>
                </dt>
                <dd>{formatLandingSek(selectedShippingTotal)}</dd>
              </div>
              <div className="landing-package-breakdown-total">
                <dt>
                  Engångsbetalning vid start
                  <small>Startavgift, skärmenheter och frakt.</small>
                </dt>
                <dd>{formatLandingSek(selectedFirstPayment)}</dd>
              </div>
              <div>
                <dt>
                  Abonnemang efter provperiod
                  <small>Debiteras efter 21 kostnadsfria dagar. Ingen bindningstid.</small>
                </dt>
                <dd>{formatLandingSek(selectedMonthlyTotal)}/mån</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}

function LandingSection({
  id,
  title,
  text,
  children,
}: {
  id: string;
  title: string;
  text?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`landing-section landing-section-surface landing-${id}`}>
      <div className="landing-section-panel">
        <SectionHeading title={title} text={text} />
        {children}
      </div>
    </section>
  );
}

function SectionHeading({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  return (
    <div className="landing-section-heading">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="landing-price-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
      />
    </label>
  );
}

function Illustration({
  title,
  text,
  index,
  image,
}: {
  title: string;
  text: string;
  index: number;
  image: string;
}) {
  return (
    <article className={`landing-illustration landing-illustration-${index + 1}`}>
      <div className="landing-illustration-art" aria-hidden="true">
        <Image src={image} alt="" width={420} height={300} />
        <span className="landing-illustration-icon">
          <SectionIcon name={index === 0 ? "layout" : index === 1 ? "shield" : "screen"} />
        </span>
      </div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

function Feature({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: (typeof featureIcons)[number];
}) {
  return (
    <article className="landing-feature">
      <span className="landing-feature-icon" aria-hidden="true">
        <SectionIcon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function SectionIcon({
  name,
}: {
  name: "spark" | "receipt" | "screen" | "megaphone" | "layout" | "shield";
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  if (name === "receipt") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M7 4h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1Z" />
        <path {...common} d="M9 8h6M9 12h6M9 16h3" />
      </svg>
    );
  }

  if (name === "screen") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect {...common} x="3" y="5" width="18" height="12" rx="2" />
        <path {...common} d="M8 21h8M12 17v4M7 9h5M7 13h10" />
      </svg>
    );
  }

  if (name === "megaphone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 13h3l9 4V7l-9 4H4v2Z" />
        <path {...common} d="M7 13v5a2 2 0 0 0 2 2h1M19 9.5a4 4 0 0 1 0 5" />
      </svg>
    );
  }

  if (name === "layout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect {...common} x="4" y="5" width="16" height="14" rx="2" />
        <path {...common} d="M4 10h16M10 10v9M13 14h4" />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 3 19 6v5c0 4.5-2.8 7.7-7 10-4.2-2.3-7-5.5-7-10V6l7-3Z" />
        <path {...common} d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M12 3v4M12 17v4M4.2 7.2l2.8 2.8M17 17l2.8 2.8M3 12h4M17 12h4M4.2 16.8 7 14M17 7l2.8-2.8" />
      <circle {...common} cx="12" cy="12" r="3.2" />
    </svg>
  );
}

