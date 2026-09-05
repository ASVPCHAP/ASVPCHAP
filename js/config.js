/* =========================================================
   TRUE POWER — SITE CONFIG
   Edit this file to change business details, prices, links
   and form handling. No other file needs to change.
   ========================================================= */
window.TP_CONFIG = {
  business: {
    name: "True Power",
    tagline: "Coaching & Personal Training",
    verse: "He brought them out of darkness and the shadow of death, and broke their chains in pieces.",
    verseRef: "Psalms 107:14",
    email: "",                 // e.g. "coach@truepowercoaching.com" (used for the mailto fallback)
    phone: "",                 // e.g. "+1 555 555 5555"
    location: "Online coaching · Worldwide",
    instagram: "flexxrx",      // handle only, no @
  },

  coach: {
    name: "Kevin Chapman",
    title: "Head Coach & Founder",
    photo: "assets/img/coach.jpg",   // drop a photo at this path; a placeholder shows until then
    heroImage: "assets/img/hero.jpg",// optional full-bleed hero photo (training / stage shot)
    bio: [
      "Kevin Chapman is a licensed pharmacist, a GLP-1 clinician, and a competitive natural bodybuilder. True Power is where that clinical background meets physique coaching: an understanding of how the body actually works, applied with the discipline of an athlete who steps on stage himself.",
      "Every client gets a plan written for their body, schedule and goal, whether that means building macros around a GLP-1 or peptide, working toward a natural transformation, or prepping for a show. Macros are calculated to the gram with training-day, rest-day and high-carb-day targets, cardio is programmed with intent, and every Saturday you check in with numbers, photos and a plan for the week ahead.",
      "Faith is at the center of the brand. Psalms 107:14 is on the logo because the work is about breaking chains, whether that chain is a number on the scale, a habit, or a belief about what you can do."
    ],
    // Add real credentials / achievements here. Leave empty to hide the list.
    credentials: [
      "Licensed pharmacist",
      "Licensed GLP-1 clinician",
      "Natural bodybuilder · INBA / PNBA",
      "Natural Olympia medalist",
      "Online coach · Contest prep",
    ],
    // Photos shown in the gallery section. Add or remove freely.
    gallery: [
      { src: "assets/img/gallery/stage-front.jpg", alt: "Kevin Chapman front double biceps on stage" },
      { src: "assets/img/gallery/stage-back.jpg", alt: "Kevin Chapman rear double biceps on stage" },
      { src: "assets/img/gallery/medals.jpg", alt: "Kevin Chapman with Natural Olympia medals" },
      { src: "assets/img/gallery/pose-outdoor.jpg", alt: "Kevin Chapman side chest pose outdoors" },
      { src: "assets/img/gallery/pose-indoor.jpg", alt: "Kevin Chapman side chest pose" },
    ],
  },

  /* ---------- Memberships ----------
     price:        monthly price in USD
     commitPrice:  monthly price when committing to 12 weeks (billed monthly)
     checkoutUrl:  paste a Stripe Payment Link (or PayPal / Square link) and the
                   button will send people straight to checkout. Leave empty to
                   open the application form instead.
  */
  billing: {
    currency: "$",
    commitLabel: "12-week commitment",
    commitNote: "Billed monthly. Cancel anytime after 12 weeks.",
  },
  plans: [
    {
      id: "lifestyle",
      name: "Lifestyle",
      subtitle: "Nutrition coaching",
      price: 149,
      commitPrice: 129,
      checkoutUrl: "",
      features: [
        "Custom macros built for your body & goal",
        "Training-day, rest-day & high-carb-day targets",
        "Weekly Saturday check-in & feedback",
        "Supplement guidance (Level 1 & 2)",
        "Low / medium / high GI food lists",
        "Direct messaging support",
      ],
    },
    {
      id: "transformation",
      name: "Transformation",
      subtitle: "Nutrition + training",
      price: 249,
      commitPrice: 219,
      popular: true,
      checkoutUrl: "",
      features: [
        "Everything in Lifestyle",
        "Fully programmed training split",
        "Cardio & step targets that progress with you",
        "Weekly progress-photo review (front / back / side)",
        "Waist & bodyweight trend tracking",
        "Plan adjustments every week",
        "Priority messaging support",
      ],
    },
    {
      id: "prep",
      name: "Contest Prep",
      subtitle: "Stage-ready coaching",
      price: 349,
      commitPrice: 299,
      checkoutUrl: "",
      features: [
        "Everything in Transformation",
        "Full prep timeline: off-season to show day",
        "Weeks-out tracking on the True Power prep sheet",
        "Peak week & show-day protocol",
        "Posing feedback",
        "Post-show reverse diet",
      ],
    },
  ],

  /* ---------- Application / contact form ----------
     Easiest option: create a free form at https://formspree.io, then paste the
     endpoint here, e.g. "https://formspree.io/f/abcdwxyz".
     If left empty, the form opens the visitor's email app with the details
     pre-filled and addressed to business.email above.
  */
  formEndpoint: "",

  /* ---------- Calendly / booking link (optional) ----------
     If set, the "Book a free consult" buttons open this link. */
  bookingUrl: "",

  /* ---------- Results section ----------
     Add real client results here. Each item: name, result, quote, image (optional).
     Section is hidden until at least one item exists. */
  results: [
    // { name: "Anthony C.", result: "-32 lb in 16 weeks", quote: "Kevin's check-ins kept me honest every single week.", image: "assets/img/results/anthony.jpg" },
  ],

  faq: [
    {
      q: "How do check-ins work?",
      a: "Once a week, due Saturdays. You send the completed feedback form (weight, waist, cardio, compliance, water, sleep) plus front, back and side progress photos laid out side by side with the previous week. Kevin reviews everything and sends back your adjustments for the week."
    },
    {
      q: "What do I need to get started?",
      a: "A food scale, a body-weight scale, a soft tape measure for your waist, and a macro tracking app. Kevin uses MacroFactor; MyFitnessPal and MyMacros+ work too. A cheap step tracker helps set your cardio baseline."
    },
    {
      q: "Do I have to track everything I eat?",
      a: "Yes. Everything you put in your mouth counts toward your daily macros. Plan food before you eat it, weigh it, and log it. That is the level of honesty that gets results."
    },
    {
      q: "What about supplements?",
      a: "Supplements support the plan; they are not the plan. Level 1 basics with the most research behind them: creatine monohydrate, whey protein, a quality multivitamin, vitamin D3 + K2, and magnesium glycinate. Level 2 add-ons are discussed once Level 1 is dialed in."
    },
    {
      q: "Do you coach competitors?",
      a: "Yes. Contest Prep covers the full timeline from off-season through peak week and the reverse diet after the show, with weeks-out tracking on the True Power prep sheet."
    },
    {
      q: "Do you work with clients on GLP-1s or peptides?",
      a: "Yes. Kevin is a licensed GLP-1 clinician, and coaching adapts to wherever you are with it. If you're just starting out, your macros and training are built around it from day one. If you're planning to come off, he'll help you build a plan for the transition and hold onto your results afterward. If you're staying on long term, that's fine too. There's no one right way to do this."
    },
    {
      q: "Can I cancel?",
      a: "Monthly plans can be cancelled any time before the next billing date. Commitment pricing locks in a lower rate for 12 weeks and can be cancelled after that."
    },
  ],
};
