export const APP = {
  name: "JwellCheck",
  locale: "en-SG",
  currency: "SGD",
  baseUrl: "https://jwellcheck.example",
  contact: {
    name: "Akash Kumar",
    location: "Singapore",
    email: "akashkr2929@gmail.com",
    maskedEmail: "a••••••••@gmail.com",
    phone: "+65 9347 8235",
    maskedPhone: "+65 •••• ••••",
  },
  links: {
    home: "/",
    feedback: "/feedback",
    contact: "/contact",
    support: "/support",
    calendly: "https://calendly.com/mrakashkumar/10min",
  },
  storageKeys: {
    coffeeInvite: "jwellcheck-coffee-invite",
  },
} as const;

export const PRICING_DEFAULTS = {
  purity: "22K (916)",
  gstPercent: 9,
  touristRefundPercent: 7,
  minimumWeight: 0.001,
  numericStep: 0.01,
  weightStep: 0.001,
  maximumPercent: 100,
} as const;

export const UI_TIMINGS = {
  saveSuccessMs: 2000,
  saveErrorMs: 2400,
  inlineMessageMs: 2400,
  coffeeThankYouMs: 2000,
  mailDraftDelayMs: 250,
} as const;

export const JEWELLERY_CATEGORIES = [
  "Necklace",
  "Choker",
  "Rani haar / long necklace",
  "Mangalsutra",
  "Chain",
  "Pendant",
  "Ring",
  "Earrings",
  "Studs",
  "Jhumka / Jhumki",
  "Nose pin / Nath",
  "Maang tikka",
  "Bracelet",
  "Bangle / Kangan",
  "Kada",
  "Armlet / Bajuband",
  "Anklet / Payal",
  "Toe ring / Bichiya",
  "Waist chain / Kamarband",
  "Gold bar / biscuit",
  "Gold coin",
  "Other",
] as const;

export const PURITY_OPTIONS = [
  "24K (999/999.9)",
  PRICING_DEFAULTS.purity,
  "21K (875)",
  "18K (750)",
  "14K (585)",
  "Custom",
] as const;

export const FEEDBACK_TYPES = [
  "Suggestion",
  "Improvement",
  "Design issue",
  "Incorrect information",
  "Not useful",
  "Feature request",
  "Missing information",
  "Other",
] as const;

export const NAVIGATION = {
  ariaLabel: "Help and support",
  items: [
    { href: APP.links.feedback, label: "Feedback" },
    { href: APP.links.contact, label: "Reach us" },
    { href: APP.links.support, label: "Coffee" },
  ],
} as const;

export const UI_COPY = {
  common: {
    show: "Show",
    hide: "Hide",
    optional: "Optional",
    homeAriaLabel: `${APP.name} home`,
  },
  dashboard: {
    title: "Compare jewellery prices",
    subtitle: "One item. Multiple shops. A clear final price.",
    save: "Save",
    savedSuccessfully: "Saved successfully",
    savedBrowser: "Your price is saved in this browser.",
    cannotSave: "Cannot save yet",
    validation: {
      item: "Select an item before saving.",
      weight: "Enter the item weight before saving.",
      rate: "Enter the rate per gram before saving.",
      makingCharge: "Enter the making charge or select Making: None.",
      gst: "Enter GST or select No GST.",
      refund: "Enter tourist refund or select No refund.",
      discount: "Enter the discount value or select No discount.",
    },
    controls: {
      noGst: "No GST",
      editGst: "Edit GST",
      gstRate: "GST rate",
      noRefund: "No refund",
      editRefund: "Edit rate",
      touristRate: "Tourist rate",
    },
    purchaseNote:
      "For comparison only. Before purchasing, confirm the final price with the shopkeeper.",
    labels: {
      savedAutomatically: "Saved automatically",
      clear: "Clear",
      clearAll: "Clear all data",
      share: "Share",
      shareComparison: "Share comparison",
      startTitle: "Start your comparison",
      startText: "Add your first shop and jewellery item.",
      addFirstShop: "Add first shop",
      chooseShop: "Choose shop",
      yourShops: "Your shops",
      itemsAtShop: "Items at this shop",
      shopNamePlaceholder: "Enter shop name",
      weightPlaceholder: "Enter weight",
      priceForItem: "Price for selected item",
      ratePlaceholder: "Enter rate",
      discountNotes: "Discount & notes",
      discount: "Discount",
      notes: "Notes",
      compareSaved: "Compare saved prices",
      compareHelp: "Find the best price for matching items.",
      compareBest: "Compare best prices",
      finalPrice: "Final price",
      searchItem: "Search jewellery item",
      noMatchingItem: "No matching item",
    },
    messages: {
      comparisonCopied: "Comparison copied",
      sharingUnavailable: "Sharing is unavailable",
      clearConfirmation: "Clear every item and shop price? This cannot be undone.",
      minimumItem: "Every shop needs at least one item",
    },
  },
  feedback: {
    metadataTitle: `Feedback — ${APP.name}`,
    title: "Share feedback",
    description:
      "Report an issue or suggest a clearer way to compare jewellery prices.",
    name: "Name",
    email: "Email",
    type: "Feedback type",
    selectType: "Select feedback type",
    message: "Message",
    messagePlaceholder:
      `Tell us what happened or what would make ${APP.name} better.`,
    chooseTypeError: "Please choose a feedback type.",
    openingEmail: "Opening your email application…",
    send: "Send feedback",
  },
  contact: {
    metadataTitle: `Reach us — ${APP.name}`,
    title: "Reach us",
    description:
      "Questions, community ideas, and thoughtful collaborations are always welcome.",
    contact: "Contact",
    location: "Location",
    email: "Email",
    phone: "Phone number",
    collaborationTitle: "Let's build something useful",
    collaborationText:
      "Have an innovative idea? Let's collaborate on simple solutions that support our community and make everyday life easier.",
    collaborationQuote:
      "“Small ideas, shared together, can create meaningful change.”",
    shareIdea: "Share an idea or feedback",
  },
  support: {
    metadataTitle: `Buy us a coffee — ${APP.name}`,
    imagePath: "/images/coffee-invitation.jpg",
    imageAlt: "A centered cappuccino ready for a conversation",
    eyebrow: "A kind gesture",
    title: "Buy us a coffee",
    quote: "“A coffee is a kind gesture—and a lovely way to share a good idea.”",
    formTitle: "Thank you for offering us a coffee",
    formDescription: "Send your kind invitation and share an idea with us.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    place: "Place",
    placePlaceholder: "Coffee shop or meeting place",
    idea: "Your idea (optional)",
    ideaPlaceholder: "Tell us what you would like to discuss.",
    schedule: "Schedule a meeting",
    send: "Send invitation",
    thankYouTitle: "Thank you for the invitation!",
    thankYouText:
      "We appreciate your kind gesture and look forward to connecting.",
    fallbackIdea: "Let's connect and exchange ideas.",
  },
} as const;

export const SEO = {
  title: `${APP.name} — Compare Jewellery Prices Clearly`,
  titleTemplate: `%s · ${APP.name}`,
  description:
    "Compare jewellery prices across shops with transparent metal value, making charge, GST, discount, fee and tourist refund calculations.",
  keywords: [
    "jewellery price comparison",
    "gold making charge calculator",
    "Singapore jewellery",
    "gold price per gram",
  ],
  openGraphTitle: `${APP.name} — Compare with confidence`,
  openGraphDescription:
    "Save multiple jewellery items, compare shop quotations and understand every charge.",
  manifestDescription:
    "Compare jewellery quotations with a clear final-price breakdown.",
  theme: {
    light: "#f7f4ed",
    dark: "#171512",
    manifest: "#2b2721",
  },
} as const;
