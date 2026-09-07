/**
 * English copy. Mirrors the shape of sv.js — a missing key silently falls back
 * to Swedish rather than breaking the page.
 *
 * Note: the booking form sends Swedish VALUES to the CRM even in English (the
 * backend's duration estimator matches Swedish keywords). Only the labels the
 * customer reads are translated — see StudioLeadFormEnhanced.jsx.
 */
export const en = {
  common: {
    logoAlt: "Ink Revenue logo",
    loading: "Loading...",
    close: "Close",
    back: "Back",
    next: "Next step",
    seeAllStudios: "See all studios",
    exploreStudios: "Explore studios"
  },

  languageSwitcher: {
    label: "Language",
    sv: "Svenska",
    en: "English",
    svShort: "SV",
    enShort: "EN"
  },

  languageHint: {
    text: "Den här sidan finns även på svenska.",
    action: "Byt till svenska",
    dismiss: "Stäng"
  },

  header: {
    nav: "Main navigation",
    home: "Home",
    studios: "Studios",
    faq: "FAQ",
    cta: "Book a free strategy call",
    openMenu: "Open menu",
    closeMenu: "Close menu"
  },

  footer: {
    home: "Home",
    studios: "Studios",
    faq: "FAQ",
    strategy: "Book a strategy call",
    privacy: "Privacy policy",
    terms: "Terms of use",
    discoveryLabel: "Explore tattoos",
    cities: "Cities",
    styles: "Styles",
    cityLink: "Tattoos in {{city}}",
    styleLink: "{{style}} tattoos",
    contactHeading: "Contact us:",
    phone: "Phone:",
    email: "Email:",
    copyright: "Copyright 2026. Ink Revenue. All rights reserved.",
    credit: "Web design by"
  },

  home: {
    metaTitle: "More clients for your tattoo studio",
    metaDescription:
      "Ink Revenue handles your entire marketing — ads, content and client enquiries from start to finish. You focus on the art. We fill the calendar.",
    heroTitleLine1: "More bookings. Less admin.",
    heroTitleLine2: "We run the marketing for you.",
    heroLeadBefore: "Ink Revenue takes care of ",
    heroLeadBold: "your entire marketing",
    heroLeadAfter:
      " — ads, content and client enquiries from start to finish. You focus on the art. We fill the calendar.",
    ctaStrategy: "Book a free strategy call",
    ctaTrial: "Try free for 30 days",
    ctaNote:
      "No lock-in, no hidden fees — try it yourself without a card, or let us handle everything",
    audienceStudioEyebrow: "For studio owners",
    audienceStudioTitle: "Stop chasing clients. Let them find you.",
    audienceStudioText:
      "We set up your studio page, run the ads and handle enquiries — so you can stay focused on tattooing.",
    audienceStudioCta: "See how we help studios",
    audienceCustomerEyebrow: "For tattoo clients",
    audienceCustomerTitle: "Find the right studio for your style.",
    audienceCustomerText:
      "Browse studios by style, city and feel — see the gallery and send an enquiry straight away. Easier than hunting hashtags.",

    howEyebrow: "For Studio Owners",
    howTitle: "How Ink Revenue works",
    howLead: "Three simple steps from getting in touch to enquiries landing in your inbox.",
    howStep1Title: "Book a strategy call",
    howStep1Text:
      "We get to know your studio, your goals and the kind of clients you want to reach. The call is free and with no obligation.",
    howStep2Title: "We set everything up for you",
    howStep2Text:
      "We build your studio page, optimise your profile and launch the right marketing channels. You approve — we run it.",
    howStep3Title: "The enquiries start coming in",
    howStep3Text:
      "Log in and see enquiries, bookings and statistics in one place. We handle the follow-up — you tattoo.",

    studiosEyebrow: "For Studio Owners",
    studiosTitle: "You handle the tattoos. We handle the rest.",
    studiosLead:
      "Most studios lose clients because they are hard to find or reply too slowly. We solve that for you — you never have to learn a single marketing tool.",
    studiosBody:
      "You get a studio page that sells, ads that turn into booked clients, and a person who actually follows up on every enquiry.",
    studiosBadge1: "✓ You run no ads",
    studiosBadge2: "✓ You write no copy",
    studiosBadge3: "✓ We handle the inbox",
    studiosCard1Title: "Visible where clients look",
    studiosCard1Text:
      "We make sure you show up on Google, on social media and in our studio directory — where clients are already searching.",
    studiosCard2Title: "A studio page that sells you",
    studiosCard2Text:
      "Your page highlights style, gallery and feel — so the right clients recognise themselves straight away and pick you.",
    studiosCard3Title: "Better enquiries from the start",
    studiosCard3Text:
      "Clients describe idea, placement and budget up front — no more back and forth, and you can reply with a quote right away.",

    customersEyebrow: "For Tattoo Clients",
    customersTitle: "Find studios by your style — not by hashtags",
    customersLead:
      "Filter by style, city and feel. See the gallery, read about the studio — then send an enquiry directly without chasing DMs.",
    customersLoading: "Loading studios...",
    customersEmptyTitle: "More studios coming soon",
    customersEmptyText:
      "We add to the directory continuously. Come back soon to discover more studios and artists.",

    whyTitle: "Why Ink Revenue Works",
    whyCard1Title: "100% managed service",
    whyCard1Text:
      "You pay for results, not for learning tools. We are your marketing department — you don't have to lift a finger.",
    whyCard2Title: "Better matches from the start",
    whyCard2Text:
      "Clients see style, location and gallery clearly — they get in touch because they have already chosen you, not on a hunch.",
    whyCard3Title: "No investment without results",
    whyCard3Text:
      "We work continuously and you see the statistics in real time. No hidden costs, no lock-in — cancel whenever you want.",
    trust1: "No lock-in period",
    trust2: "Free strategy call",
    trust3: "You always own your data",
    trust4: "Live within 1 week",

    plansEyebrow: "Plans & Pricing",
    plansTitle: "Pick what fits you",
    plansLead:
      "We offer four plans — you only pay for what you actually need. We go through exact pricing during the strategy call.",
    plan1Title: "Website build",
    plan1Model: "One-off cost",
    plan1Text:
      "We build you your own website from scratch — professional, mobile-friendly and ready to take on clients.",
    plan2Title: "Marketing plan",
    plan2Model: "% per client generated",
    plan2Text:
      "We run your marketing on social media and ads. You pay a share per client we generate — no fixed monthly fee.",
    plan3Title: "Booking plan",
    plan3Model: "Monthly subscription",
    plan3Text:
      "A fixed monthly fee with no lock-in. You get your studio page in the directory, a booking form and your own login with full overview. Try it for 30 days first — no card needed.",
    plan3Link: "Try free for 30 days",
    plan4Title: "Combo package",
    plan4Model: "% per client generated",
    plan4Text:
      "Everything in one — marketing, studio page and booking management. You pay per client we deliver.",
    plansCta: "Book a free strategy call — we'll go through pricing",

    faqEyebrow: "Common questions",
    faqTitle: "Answers to what you're wondering",

    bookingEyebrow: "For Studio Owners",
    bookingTitle: "Ready for more bookings?",
    bookingLead:
      "Book a free strategy call — 20 minutes. We go through your goals, the clients you want to reach and which plan suits you best.",
    bookingBody: "The call comes with no obligation. You decide whether to move forward.",
    bookingBadge1: "✓ Free call",
    bookingBadge2: "✓ 20 minutes",
    bookingBadge3: "✓ Reply within 24h",

    faqItems: [
      {
        q: "Do we have to handle anything ourselves?",
        a: "No. You approve material and answer our questions — that's it. We handle ads, content, client contact and follow-up. The more you tell us about your style, the better the result."
      },
      {
        q: "How quickly do we see results?",
        a: "Most studios see their first enquiries within 1–2 weeks of launch. Volume and quality keep improving over the first 60–90 days as we optimise your channels."
      },
      {
        q: "How is this different from running Instagram or Google ourselves?",
        a: "Doing it yourself takes time and often gives uneven results. We specialise in the tattoo industry and know what works — you get a full marketing department for a fraction of the cost."
      },
      {
        q: "What does our studio page look like?",
        a: "Every studio gets a tailored page with your logo, gallery, style tags, an about text and a customised enquiry form. Clients can filter by style, city and feel — and send an enquiry with their idea and budget right away."
      },
      {
        q: "What happens if we want to cancel?",
        a: "You can cancel month by month without giving a reason. You always own your data, your images and your social media channels. We help with handover if you'd like."
      },
      {
        q: "Does it work for solo artists too?",
        a: "Absolutely. Ink Revenue suits solo artists just as well as studios with several artists. We adapt the setup and budget to your situation."
      },
      {
        q: "How quickly can we get started?",
        a: "Launch normally happens within 1 week of you approving the setup. We set up your studio page, start the right channels, and you can begin receiving enquiries almost immediately."
      }
    ]
  },

  faqPage: {
    metaTitle: "Frequently asked questions about Ink Revenue",
    metaDescription:
      "Answers to common questions about Ink Revenue — how the service works, what it costs, how quickly you see results and what happens if you want to cancel.",
    eyebrow: "Common questions",
    title: "Answers to what you're wondering",
    lead: "Everything you need to know about how Ink Revenue works — before you book a call.",
    ctaText: "Didn't find the answer to your question?",
    ctaButton: "Book a free strategy call",
    pricingIntro: "The price depends on the plan you choose. We offer four setups:",
    pricingItems: [
      { term: "Website build", text: " — one-off cost" },
      { term: "Marketing plan", text: " — a percentage per client generated, no fixed monthly fee" },
      { term: "Booking plan", text: " — a fixed monthly subscription with no lock-in" },
      {
        term: "Combo package",
        text: " — everything in one (except the website build), a percentage per client generated"
      }
    ],
    pricingOutro: "Book a free strategy call and we'll go through which setup suits you best.",
    items: [
      {
        q: "Do we have to handle anything ourselves?",
        a: "No. You approve material and answer our questions — that's it. We handle ads, content, client contact and follow-up. The more you tell us about your style, the better the result."
      },
      {
        q: "How quickly do we see results?",
        a: "Most studios see their first enquiries within 1–2 weeks of launch. Volume and quality keep improving over the first 60–90 days as we optimise your channels."
      },
      {
        q: "How is this different from running Instagram or Google ourselves?",
        a: "Doing it yourself takes time and often gives uneven results. We specialise in the tattoo industry and know what works — you get a full marketing department for a fraction of the cost."
      },
      {
        q: "What does our studio page look like?",
        a: "Every studio gets a tailored page with your logo, gallery, style tags, an about text and a customised enquiry form. Clients can filter by style, city and feel — and send an enquiry with their idea and budget right away."
      },
      {
        q: "What happens if we want to cancel?",
        a: "You can cancel month by month without giving a reason. You always own your data, your images and your social media channels. We help with handover if you'd like."
      },
      {
        q: "Does it work for solo artists too?",
        a: "Absolutely. Ink Revenue suits solo artists just as well as studios with several artists. We adapt the setup and budget to your situation."
      },
      {
        q: "How quickly can we get started?",
        a: "Launch normally happens within 1 week of you approving the setup. We set up your studio page, start the right channels, and you can begin receiving enquiries almost immediately."
      },
      {
        q: "What does it cost?",
        a: "The price depends on the plan you choose: Website build (one-off cost), Marketing plan (a percentage per client generated), Booking plan (monthly subscription) or Combo package (everything except the website build, a percentage per client). Book a free strategy call and we'll go through which setup suits you best.",
        rich: "pricing"
      },
      {
        q: "How do clients get in touch with us through Ink Revenue?",
        a: "In two ways. We market you in your own channels — Instagram, TikTok and Facebook — so you keep gaining followers and enquiries from there. You also appear in our studio directory, where clients filter by style and city and send an enquiry straight from your studio page. All enquiries collect with you — we reply and book them in."
      },
      {
        q: "Can we see how many enquiries we get?",
        a: "Yes. You log in and see all enquiries, bookings and your statistics in real time."
      }
    ]
  },

  directory: {
    metaTitleDefault: "Find tattoo studios in Sweden",
    metaTitleFiltered: "Tattoo studios {{parts}}",
    metaTitleCityPart: "in {{city}}",
    metaDescriptionBoth:
      "Find tattoo studios doing {{style}} in {{city}}. Filter, browse galleries and send your enquiry directly via Ink Revenue.",
    metaDescriptionStyle:
      "Tattoo studios specialising in {{style}}. See the gallery, read about the studio and send your enquiry directly.",
    metaDescriptionCity:
      "Tattoo studios in {{city}}. Filter by style, browse galleries and send your enquiry directly via Ink Revenue.",
    metaDescriptionDefault:
      "Explore tattoo studios in Sweden by style, city and feel. Filter down to a studio that fits your idea and send your enquiry directly.",
    eyebrow: "Find The Right Studio",
    titleBoth: "{{style}} tattoos in {{city}}",
    titleStyle: "Tattoo studios — {{style}}",
    titleCity: "Tattoo studios in {{city}}",
    titleDefault: "Explore tattoo studios in Sweden",
    leadFiltered: "Filter further by style, city and feel — then send your enquiry directly.",
    leadDefault: "Filter by style, city and feel to find a studio that fits your idea.",
    searchLabel: "Search",
    searchPlaceholder: "Studio, city or style",
    cityLabel: "City",
    allCities: "All cities",
    styleLabel: "Style",
    allStyles: "All styles",
    loading: "Loading studios...",
    resultsHeading: "{{count}} studios match your filters",
    emptyTitle: "No studios matched the filters",
    emptyText: "Try clearing the search or picking a different style or city.",
    seoBothText:
      "Find the best {{style}} artists in {{city}}. Send an enquiry directly to the studio — describe your idea, style and placement to get started.",
    seoStyleTitle: "{{style}} tattoos in Sweden",
    seoStyleText:
      "Explore tattoo studios specialising in {{style}} across Sweden. Every studio has its own expression — filter by city to find the right one.",
    seoCityText:
      "Browse tattoo studios in {{city}}. Compare styles, see galleries and send your enquiry directly to the studio that suits you best.",
    showAllCities: "Show all cities",
    showAllStyles: "Show all styles",
    styleInCity: "{{style}} in {{city}}",
    exploreTitle: "Explore tattoos by city and style",
    exploreText:
      "Ink Revenue gathers tattoo studios from all over Sweden. Pick a city or style to find the right studio for your idea.",
    exploreCityLink: "Tattoo studio in {{city}}",
    exploreStyleLink: "{{style}} tattoos",
    jsonLdName: "Tattoo studios on Ink Revenue"
  },

  studioCard: {
    fallbackSummary: "Explore the studio's style, images and how to get in touch.",
    country: "Sweden",
    kind: "Tattoo studio",
    cta: "View studio",
    ariaLabel: "View studio {{name}}",
    logoAlt: "{{name}} logo"
  },

  studio: {
    metaFallbackTitle: "Studio page",
    metaErrorTitle: "Studio page could not be shown",
    metaDescriptionFallback: "Explore tattoo studios and send your enquiry directly to the studio.",
    metaDescriptionGenerated:
      "{{name}}{{city}} — tattoo studio on Ink Revenue{{styles}}. Send your enquiry directly.",
    metaCityPart: " in {{city}}",
    metaStylePart: ". Specialising in {{styles}}",
    loading: "Loading the studio page...",
    errorTitle: "The studio page could not be shown",
    errorText: "This studio could not be found.",
    backToDirectory: "Back to studios",
    kind: "Tattoo studio",
    sendRequest: "Send an enquiry",
    backToCatalog: "Back to the directory",
    logoAlt: "{{name}} logo",
    location: "Location",
    serviceArea: "Area",
    visitWebsite: "Visit website",
    seeInstagram: "See Instagram",
    aboutEyebrow: "About The Studio",
    aboutTitle: "About the studio",
    howEyebrow: "How It Works",
    howTitle: "How a first enquiry works",
    previewEyebrow: "Preview mode",
    previewTitle: "Quick test without a full studio setup",
    previewText:
      "You don't need to fill in all the CRM information to see the design. For a real end-to-end test it's enough that the test studio has a slug, is active and has its public page enabled.",
    previewMessageWithSlug:
      'This is a demo page with a local test design, but the form is submitted to the CRM studio "{{slug}}".',
    previewMessageNoSlug:
      "This is a local demo page for quick testing. To test real leads, open /studio-preview/your-slug.",
    cardEyebrow: "Directory card",
    cardTitle: "How you appear in the directory",
    cardArea: "Area: {{area}}",
    trustEyebrow: "Good To Know",
    trustTitle: "Before you send",
    trustContactLabel: "Contact",
    trustContactValue: "Straight to the studio",
    trustContactText: "Your enquiry goes directly to the studio you picked.",
    trustReplyLabel: "Reply",
    trustReplyValue: "Email or phone",
    trustReplyText: "Leave whichever suits you best and it'll be easy for them to get back to you.",
    trustGalleryLabel: "Gallery",
    trustGalleryValue: "{{count}} images to browse",
    trustGalleryText: "Have a look through earlier work before you send your enquiry.",
    trustDetailsLabel: "Good detail",
    trustDetailsValue: "Style, placement and budget",
    trustDetailsText:
      "A little more detail makes it easier for the studio to give you a relevant first reply.",
    stepsFlowTitle1: "Tell them about your idea",
    stepsFlowText1:
      "Fill in style, placement, size and a description so the studio gets a clear picture straight away.",
    stepsFlowTitle2: "Send your enquiry",
    stepsFlowText2:
      "Feel free to add a reference image if you want to show style, feel or inspiration more clearly.",
    stepsFlowTitle3: "The next step becomes clear",
    stepsFlowText3:
      "You get the right next step based on the studio's setup — whether that's a booking, a reply or a manual review.",
    stepsBasicTitle1: "Briefly describe your idea",
    stepsBasicText1: "Describe the motif, style, placement and any references or inspiration.",
    stepsBasicTitle2: "The studio gets back to you",
    stepsBasicText2:
      "You'll hear about the next step, pricing, a consultation or a booking depending on their setup.",
    galleryEyebrow: "Gallery",
    galleryTitle: "Selected work from the studio",
    relatedEyebrow: "More Studios",
    relatedTitle: "Similar studios to explore",
    reserveActionName: "Send an enquiry",
    photoDescription: "{{name}} — tattoo work",
    mapsQuery: "tattoo studio {{name}} {{city}}"
  },

  themedStudio: {
    loading: "Loading...",
    error: "The studio page could not be loaded.",
    bookNow: "Book now",
    instagram: "Instagram",
    website: "Website",
    aboutLine1: "About",
    aboutLine2: "the studio",
    visitWebsite: "Visit website",
    howTitle: "How it works",
    step1Title: "Tell us about your idea",
    step1Text:
      "Fill in style, placement, size and a short description. Feel free to attach a reference image.",
    step2Title: "The studio gets back to you",
    step2Text:
      "You'll hear from the studio about a price estimate, a consultation or a direct booking — depending on their setup.",
    step3Title: "Time for the tattoo",
    step3Text:
      "Come to the studio at the agreed time and turn your idea into lasting art.",
    gallery: "Gallery",
    formTitle: "Send your enquiry",
    formIntro:
      "Fill in the form below — the more you tell them, the easier it is for the studio to give you a relevant answer right away.",
    studioAlt: "{{name}} studio",
    imageAlt: "{{name}} — image {{index}}",
    fallbackTitle: "Studio",
    cityKind: "{{city}} · Tattoo studio"
  },

  gallery: {
    openImage: "Open image {{index}} of {{total}}",
    imageAlt: "{{studio}} – tattoo {{index}}",
    imageCount: "{{count}} images",
    seePortfolio: "See the full portfolio",
    portfolioAria: "Portfolio – {{studio}}",
    portfolioEyebrow: "Portfolio",
    portfolioSub: "Click an image to see it close up.",
    closePortfolio: "Close the portfolio",
    close: "Close",
    prevImage: "Previous image",
    nextImage: "Next image",
    lightboxAria: "Image {{index}} of {{total}}"
  },

  trial: {
    metaTitle: "Try free for 30 days",
    metaDescription:
      "Create an account and try Ink Revenue free for 30 days — no card needed. Your own studio page, smarter booking enquiries and everything in one place. No lock-in.",
    eyebrow: "For tattoo studios & artists",
    title: "Try free for 30 days",
    lead: "Your own studio page, booking enquiries with idea, placement and budget already filled in — and everything gathered in your own login. Create the account in a few minutes.",
    ctaPrimary: "Get started free",
    ctaNote: "30 days free — no card, no lock-in, cancel whenever you want",
    badge1: "✓ No card needed",
    badge2: "✓ Done in minutes",
    badge3: "✓ You always own your data",
    includedEyebrow: "What's included",
    includedTitle: "Everything you need to take on more bookings",
    includedLead:
      "The trial gives you the full booking plan — the same tools our paying studios use every day.",
    included1Title: "Your own studio page",
    included1Text:
      "Logo, gallery, style tags and an about text — in our directory where clients search for studios by style and city.",
    included2Title: "Enquiries with substance",
    included2Text:
      "Clients describe idea, placement and budget right in the form — no more back and forth in DMs, and you can reply with a quote right away.",
    included3Title: "Everything in one place",
    included3Text:
      "Enquiries, bookings and statistics in your own login. No spreadsheets, no missed messages.",
    startEyebrow: "Getting started",
    startTitle: "From account to enquiries in three steps",
    start1Title: "Create your account",
    start1Text:
      "Register the studio in a couple of minutes. No card, no sales calls — you test at your own pace.",
    start2Title: "Set up your page",
    start2Text: "Upload your logo and gallery, pick your styles and enable the booking form.",
    start3Title: "Start receiving enquiries",
    start3Text: "Share your page in your bio and let clients reach out — it all lands in your inbox.",
    readyTitle: "Ready to try?",
    readyText:
      "30 days is plenty to set up your page and get a feel for the flow. You never enter a card, and the trial doesn't roll into a subscription — if you want to continue you pick a plan yourself. If you don't like it, it costs you nothing.",
    readyCta: "Try free for 30 days",
    trust1: "30 days free",
    trust2: "No card needed",
    trust3: "No lock-in period",
    trust4: "You always own your data",
    trust5: "Up and running in minutes",
    altEyebrow: "Would you rather not do it yourself?",
    altTitle: "We can run the whole marketing for you",
    altText:
      "Ads, content and follow-up on every enquiry — fully managed by us. Book a free strategy call and we'll go through what suits your studio best.",
    altCta: "Book a free strategy call"
  },

  notFound: {
    metaTitle: "Page not found",
    metaDescription:
      "The page you're looking for no longer exists. Go back to the home page or open the studio directory.",
    title: "Page not found",
    text: "The link seems wrong, or the page no longer exists. You can always go back to the home page or open the studio directory.",
    home: "To the home page",
    studios: "See studios"
  },

  productPreview: {
    eyebrow: "The product",
    title: "This is what you see when you log in",
    lead:
      "Enquiries, bookings, waiting list and social media in one place. Click through the views below — these are the same screens studios work in every day.",
    tabsLabel: "Choose a view",
    note:
      "Shown with sample data, and in Swedish — that is the language of the CRM. Your studio only ever sees its own data."
  },

  crmPreview: {
    waiting: "Waiting for live preview from the CRM...",
    savedMessage:
      "Saved public page for {{name}}. When the preview is embedded in the CRM it updates live as you type.",
    fallbackStudio: "the studio"
  },

  legal: {
    updated: "Last updated: {{date}}",
    questions: "Questions about how we handle your data?",
    readAlso: "Read also: {{name}}",
    openAsPage: "Open as its own page",
    closeDocument: "Close the document",
    swedishOnlyNotice:
      "This document is only available in Swedish. The Swedish version is the legally binding one. If you have any questions about it in English, email info@inkrevenue.online and we'll explain.",
    privacyLabel: "Privacy policy",
    termsLabel: "Terms of use"
  },

  consent: {
    eyebrow: "Consent",
    title: "Do you accept our terms?",
    lead: "To use the forms you need to accept our privacy policy and our terms of use.",
    privacy: "Privacy policy",
    terms: "Terms of use",
    decline: "Don't accept",
    accept: "Accept",
    notePrefix: "By continuing you accept our",
    notePrivacy: "privacy policy",
    noteMiddle: "and our",
    noteTerms: "terms of use"
  },

  strategyForm: {
    note: "Briefly tell us where you are today and what you'd like help with, so we can make the first call more relevant.",
    name: "Name",
    namePlaceholder: "Your name",
    studio: "Studio",
    studioPlaceholder: "Studio name",
    email: "Email",
    emailPlaceholder: "name@yourstudio.com",
    phone: "Phone number",
    phonePlaceholder: "+46 70 000 00 00",
    message: "Message",
    messagePlaceholder: "Briefly describe your goals and the kind of help you're looking for",
    honeypot: "Leave this field empty",
    submit: "Book the strategy call",
    submitting: "Sending...",
    errorName: "Please enter your name.",
    errorStudio: "Please enter the studio name.",
    errorEmail: "Please enter a valid email address.",
    errorConsent: "Accept the privacy policy and terms to continue.",
    errorFields: "Check the fields marked in red and try again.",
    sending: "Sending your enquiry...",
    success: "Thanks! We've received your enquiry and normally get back within 24 hours.",
    errorGeneric: "We couldn't send that right now. Check your details and try again shortly."
  },

  leadForm: {
    campaign: {
      badge: "Offer right now",
      deadline: "Valid through {{date}}",
      deadlineToday: "Valid until midnight tonight",
      note: "You get the offer automatically when you submit the form — no code needed.",
      appliesToTattoo: "Applies to tattoo sessions.",
      appliesToConsultation: "Applies to consultations.",
      granted: "The offer is attached to your request."
    },
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    otherStyle: "Other (style not listed)",
    otherPlacement: "Other (type it yourself)",
    fallbackStyles: [
      "Fineline / fine detail",
      "Black & grey realism",
      "Cover-up",
      "Ornamental / heavy pattern"
    ],
    sizeTiny: "Very small (up to {{cm}} cm)",
    sizeSmall: "Small (up to {{cm}} cm)",
    sizeMedium: "Medium (up to {{cm}} cm)",
    sizeLarge: "Large (up to {{cm}} cm)",
    sizeExtra: "Extra large (over {{cm}} cm)",
    sizeExtraNoThreshold: "Extra large / full sleeve / back",
    sizeTinyName: "Very small",
    sizeSmallName: "Small",
    sizeMediumName: "Medium",
    sizeLargeName: "Large",
    sizeExtraName: "Extra large",
    sizeRangeUpTo: "up to {{cm}} cm",
    sizeRangeOver: "over {{cm}} cm",
    sizeRangeNoThreshold: "full sleeve / back",

    stepTattooLabel: "About the tattoo",
    stepTattooHeading: "Tell us about your tattoo",
    stepTimeLabel: "Pick a time",
    stepTimeHeading: "Pick a time that suits you",
    stepContactLabel: "Your details",
    stepContactHeading: "Your contact details",
    progressAria: "Step {{current}} of {{total}}",
    progressLabel: "Step {{current}} of {{total}}",

    honeypot: "Leave this field empty",
    typeTattoo: "Tattoo booking",
    typeConsultation: "Consultation",
    fallbackNote:
      "The style you were after isn't among the studio's selectable styles, so we've switched to a consultation. Describe what you want and the studio will come back with a suggestion.",
    fallbackBack: "Back to the styles",

    styleLabel: "Style",
    stylePlaceholder: "Choose a style...",
    placementLabel: "Placement",
    placementPlaceholder: "Choose a placement...",
    placementFreeText: "Arm, back, leg...",
    placementUseList: "Pick from the list instead",
    sizeLabel: "Size",
    sizePlaceholder: "Choose a size...",
    sizeFreeText: "Small, medium or in cm",
    budgetLabel: "Budget",
    budgetPlaceholder: "E.g. SEK 3000-5000",
    descriptionConsultation: "What would you like to discuss?",
    descriptionTattoo: "Tell us about your tattoo",
    descriptionPlaceholderConsultation:
      "Briefly describe your idea, your questions or what you'd like to go through during the consultation.",
    descriptionPlaceholderTattoo:
      "Describe the motif, the feel, references and anything else the studio should know.",

    imageLabel: "Reference image",
    imageHint:
      "Optional. Upload an image if you want to show style, motif or a reference more clearly. JPG, PNG or WEBP, max {{max}} MB.",
    imageProcessing: "Processing the image...",
    imagePreviewAlt: "Preview of the reference image",
    imageRemove: "Remove image",
    imageError: "We couldn't prepare that image for upload. Please try again.",

    checkingAvailability: "Checking available times...",
    availabilityError: "We couldn't check available times right now.",
    availabilityStale:
      "We couldn't refresh the times right now. The times below are from the most recent check, so we can't book them directly — pick a time again and we'll send it as a request for the studio to confirm.",
    prevWeek: "Previous week",
    nextWeek: "Next week",
    selectedTime: "Selected time",
    selectedTimeValue: "{{date}} at {{time}}",
    pickTimeFirst: "Pick at least one available time before continuing.",

    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "name@mail.com",
    phoneLabel: "Phone number",
    phonePlaceholder: "+46 70 000 00 00",

    depositLabel: "Deposit required:",
    depositText: "SEK {{amount}} is paid when booking and is deducted from the final price.",
    feeLabel: "Booking fee:",
    feeText:
      "SEK {{amount}} is an administrative fee paid when booking and is not deducted from the final price.",
    stripeNote: "Payment is handled securely via Stripe, straight to the studio.",
    depositLaterText:
      "The studio charges a SEK {{amount}} deposit when your time is confirmed. You pay nothing now.",
    feeLaterText:
      "The studio charges a SEK {{amount}} booking fee when your time is confirmed. You pay nothing now.",

    payHeading: "Pay SEK {{amount}}",
    paySecure: "Secure payment via Stripe",
    payButton: "Pay SEK {{amount}}",
    payProcessing: "Processing...",
    payFailed: "The payment failed. Please try again.",
    payUnconfirmed: "The payment wasn't confirmed. Contact the studio if you were charged.",
    payPreparing: "Preparing payment...",
    payStartFailed: "We couldn't start the payment. Please try again.",
    payToPayment: "Go to payment — SEK {{amount}}",
    payRegistering: "Registering your booking...",
    paySavedFailed:
      "The payment went through but the booking couldn't be saved. Try registering it again below.",
    payRegisterRetryInfo:
      "Your payment is complete. The request couldn't be registered — try again below. You won't be charged twice.",
    payRegisterRetry: "Register the request again",

    paidTitle: "Payment complete",
    paidAmount: "SEK {{amount}}",
    paidMessageBefore: "Your enquiry has been sent to ",
    paidMessageAfter:
      " and the deposit is paid. You'll receive a confirmation by email shortly.",
    paidNewRequest: "Send another enquiry",
    paidFallbackStudio: "the studio",

    successPreviewNote: "Preview of the thank-you message shown after an enquiry is sent",
    previewNotice:
      "Preview mode: connect the page to a CRM slug to test sending real leads.",
    previewDisabled: "This demo page isn't connected to a real studio in the CRM yet.",
    previewReadOnly:
      "Preview: the form can't be submitted from here. Open your public page to send a real enquiry.",

    consentRequired: "Accept the privacy policy and terms to continue.",
    submitting: "Sending...",
    submit: "Send enquiry",
    sending: "Sending your enquiry...",
    sendFailed: "We couldn't send that right now. Please try again shortly.",
    imageUploadFailedInfo:
      "Your inspiration image couldn't be saved. You can send the enquiry without it — the studio will get in touch and can ask for it later.",
    submitWithoutImage: "Send without the image",
    success:
      "Thanks! Your enquiry has been sent. We normally get back within 24 hours by email or phone — any day of the week.",

    errorStyle: "Please pick a tattoo style.",
    errorPlacement: "Please fill in the placement.",
    errorSize: "Please fill in the size.",
    errorDescriptionConsultation: "Briefly describe what you'd like to discuss.",
    errorDescriptionTattoo: "Describe the motif and what you're after.",
    errorName: "Please enter your name.",
    errorContact: "Enter at least your email or your phone number.",
    errorEmail: "Please enter a valid email address."
  }
};
