export const PLAN_PRESENTATION_LIMITS = {
  standard_fhd: {
    maxSlides: 8,
    maxSectionsPerSlide: 2,
  },
  premium_4k: {
    maxSlides: 8,
    maxSectionsPerSlide: 3,
  },
  premium_plus_4k: {
    maxSlides: 12,
    maxSectionsPerSlide: 6,
  },
} as const;

export const PRICING_PLANS = [
  {
    code: "standard_fhd",
    name: "Standard",
    resolution: "FHD",
    setupFeeSek: 499,
    hardwareFeeSek: 699,
    shippingFeeSek: 99,
    shippingIncludedDevices: 3,
    additionalShippingFeeSek: 29,
    monthlyFeeSek: 249,
    trialDays: 21,
    ...PLAN_PRESENTATION_LIMITS.standard_fhd,
    binding: "None",
  },
  {
    code: "premium_4k",
    name: "Premium",
    resolution: "4K",
    setupFeeSek: 499,
    hardwareFeeSek: 1099,
    shippingFeeSek: 99,
    shippingIncludedDevices: 3,
    additionalShippingFeeSek: 29,
    monthlyFeeSek: 349,
    trialDays: 21,
    ...PLAN_PRESENTATION_LIMITS.premium_4k,
    binding: "None",
  },
  {
    code: "premium_plus_4k",
    name: "Premium Plus",
    resolution: "4K",
    setupFeeSek: 499,
    hardwareFeeSek: 1099,
    shippingFeeSek: 99,
    shippingIncludedDevices: 3,
    additionalShippingFeeSek: 29,
    monthlyFeeSek: 399,
    trialDays: 21,
    ...PLAN_PRESENTATION_LIMITS.premium_plus_4k,
    binding: "None",
  },
] as const;
