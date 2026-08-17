window.webloPricingData = {
  currency: "INR",
  locale: "en-IN",
  foundingOffer: {
    enabled: true,
    discountPercent: 40,
    allowedDiscounts: [40, 25, 20, 0],
    clientLimit: 10,
    combinableWithBundles: false
  },
  bundleOptions: {
    none: {
      label: "One-time",
      shortLabel: "Website only",
      description: "Best if you already manage the site.",
      monthlyPrice: 0
    },
    care: {
      label: "Bundle with Care",
      shortLabel: "Care",
      description: "Best for businesses that need occasional updates.",
      monthlyPrice: 999
    },
    carePro: {
      label: "Bundle with Care Pro",
      shortLabel: "Care Pro",
      description: "Best for businesses actively generating enquiries and bookings.",
      monthlyPrice: 2499
    }
  },
  carePlans: {
    care: {
      name: "Care",
      price: 999,
      audience: "For businesses that want their website kept live, secure, current, and supported.",
      allowance: "2 content edits per month",
      support: "Priority support",
      features: [
        "Managed hosting while Care is active",
        "Routine backups, SSL and security monitoring",
        "Uptime checks and routine website health checks",
        "Basic menu, pricing, hours, contact and image updates"
      ]
    },
    carePro: {
      name: "Care Pro",
      price: 2499,
      audience: "For businesses actively using their website to generate enquiries, bookings, promotions, or repeat business.",
      allowance: "Up to 8 reasonable update requests per month",
      support: "Higher-priority support",
      features: [
        "Everything in Care",
        "Menu, seasonal offer and landing-page updates",
        "Booking or enquiry form monitoring",
        "Analytics, conversion tracking and performance optimisation",
        "Google Business Profile or location updates where applicable",
        "Monthly website health and performance summary"
      ]
    }
  },
  tracks: {
    hospitality: {
      label: "Hospitality",
      name: "Homestay Direct",
      description: "Convert guests who discover you on Maps, Instagram, or an OTA into direct enquiries and repeat stays.",
      packages: {
        foundation: {
          code: "P_01",
          name: "Foundation",
          headline: "Start taking direct enquiries",
          basePrice: 14999,
          bundlePrices: { care: 12999, carePro: 11999 },
          outcomes: [
            "Give guests one clear place to compare rooms, rates, location, and policies",
            "Turn mobile visitors into WhatsApp or phone enquiries without OTA commission",
            "Build enough trust for first-time guests to contact you directly"
          ]
        },
        signature: {
          code: "P_02",
          name: "Signature",
          headline: "Convert interest into booking requests",
          basePrice: 27999,
          bundlePrices: { care: 24999, carePro: 22999 },
          outcomes: [
            "Collect stay dates, guest counts, and room preferences in one enquiry",
            "Showcase reviews and experiences so guests decide with less back-and-forth",
            "Win more direct bookings from visitors already comparing you with OTAs"
          ]
        },
        worldbuild: {
          code: "P_03",
          name: "Worldbuild",
          headline: "Own the complete booking journey",
          basePrice: 59999,
          bundlePrices: { care: 54999, carePro: 49999 },
          outcomes: [
            "Take deposits or full payments through your own booking journey",
            "Reduce OTA dependence with a system designed around your rooms and availability",
            "Support multiple properties, packages, or local experiences as you grow"
          ]
        }
      }
    },
    cafe: {
      label: "Food & beverage",
      name: "Café Presence",
      description: "Turn local searches and social attention into visits, calls, group bookings, and catering enquiries.",
      packages: {
        foundation: {
          code: "P_01",
          name: "Foundation",
          headline: "Make every search visit-ready",
          basePrice: 14999,
          bundlePrices: { care: 12999, carePro: 11999 },
          outcomes: [
            "Help customers find your menu, hours, location, and best reasons to visit",
            "Turn Maps and Instagram traffic into calls, directions, and table enquiries",
            "Keep essential information clear on mobile before a customer chooses where to go"
          ]
        },
        signature: {
          code: "P_02",
          name: "Signature",
          headline: "Create more reasons to enquire",
          basePrice: 27999,
          bundlePrices: { care: 24999, carePro: 22999 },
          outcomes: [
            "Capture catering, event, celebration, and large-table enquiries with the right details",
            "Promote seasonal menus and offers without losing customers in social feeds",
            "Build trust with atmosphere, reviews, and food stories that increase intent to visit"
          ]
        },
        worldbuild: {
          code: "P_03",
          name: "Worldbuild",
          headline: "Own ordering and reservations",
          basePrice: 59999,
          bundlePrices: { care: 54999, carePro: 49999 },
          outcomes: [
            "Accept paid orders, reservations, or event deposits through your own platform",
            "Keep more revenue by reducing reliance on high-commission marketplaces",
            "Grow repeat business through a customer journey built around your café"
          ]
        }
      }
    }
  },
  promotions: {
    founding: { label: "Founding client offer", combinable: false },
    careBundle: { label: "Care bundle", combinable: false },
    neighbourhood: { label: "Neighbourhood cluster", combinable: false },
    referral: { label: "Two-way referral", combinable: false },
    payInFull: { label: "Pay in full", combinable: false }
  },
  comparison: [
    { label: "Direct enquiry flow", values: ["Included", "Enhanced", "Complete", "Monitored", "Monitored + optimised"] },
    { label: "Booking / enquiry forms", values: ["Simple", "Advanced", "Custom", "Health checks", "Conversion tracking"] },
    { label: "Payments", values: ["—", "Optional", "Included", "—", "Monitoring"] },
    { label: "Multiple properties / locations", values: ["—", "Optional", "Included", "Info updates", "Ongoing updates"] },
    { label: "Hosting, backups and uptime", values: ["—", "—", "—", "Included", "Included"] },
    { label: "Monthly content updates", values: ["—", "—", "—", "2 edits", "Up to 8 requests"] },
    { label: "Analytics", values: ["Basic setup", "Included", "Advanced", "Health checks", "Tracking + summary"] },
    { label: "Priority support", values: ["14 days", "30 days", "60 days", "Priority", "Higher priority"] },
    { label: "Ongoing optimisation", values: ["—", "—", "—", "Routine health", "Performance + conversion"] }
  ]
};
