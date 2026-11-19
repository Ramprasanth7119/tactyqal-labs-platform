// Typed content for the Tactyqal Labs homepage.
// Source: current tactyqal.com (see docs/source-site-content.md). Copy tightened, no invented facts.

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tactyqal.com";

export const contact = {
  email: "tactyqal.labs@gmail.com",
  phoneDisplay: "+91-98047-72106",
  phoneHref: "tel:+919804772106",
  whatsappHref:
    "https://wa.me/919804772106?text=" +
    encodeURIComponent("Hi Tactyqal Labs, I'd like to book a free consultation for my teen."),
  hours: "Mon-Sat, 9am-7pm",
  response: "We reply within 24 hours",
  mailtoHref:
    "mailto:tactyqal.labs@gmail.com?subject=" + encodeURIComponent("Free consultation request"),
};

export const nav = [
  { label: "Program", href: "/#program" },
  { label: "Success stories", href: "/#stories" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const CTA_HREF = "/#contact";

export const heroBadges = [
  { value: "100+", label: "students mentored" },
  { value: "Top", label: "university admissions" },
  { value: "1000s", label: "of people impacted" },
] as const;

export const heroPoints = [
  "1:1 mentoring",
  "Idea to full-stack app",
  "No coding needed",
  "Grants and media coverage",
] as const;

export type Step = {
  weeks: string;
  title: string;
  summary: string;
  doing: string[];
  outcome: string;
};

export const journey: Step[] = [
  {
    weeks: "Weeks 1-2",
    title: "Ideation and market research",
    summary:
      "Your teen learns to find a problem worth solving, then checks that real people want it solved.",
    doing: [
      "Explore ideas with the founder, using Startup Ideas 101",
      "Research who the users are and what already exists",
      "Pick one idea and shape it into a clear plan",
    ],
    outcome: "A validated app idea your teen believes in.",
  },
  {
    weeks: "Weeks 3-4",
    title: "Design and prototyping",
    summary: "The idea becomes something you can see, tap and test.",
    doing: [
      "Sketch the screens and the user flow",
      "Build a clickable prototype",
      "Get feedback and refine the design",
    ],
    outcome: "A prototype ready to be built for real.",
  },
  {
    weeks: "Weeks 5-6",
    title: "Full-stack development",
    summary:
      "With no-code tools and a mentor beside them, your teen builds a working full-stack app. No programming background required.",
    doing: [
      "Build the front end and the data behind it",
      "Connect the pieces into one working app",
      "Test it with real people",
    ],
    outcome: "A working app, built by your teen.",
  },
  {
    weeks: "Weeks 7-8",
    title: "Launch and marketing",
    summary: "The app goes out into the world, along with the skills to talk about it.",
    doing: [
      "Plan a marketing strategy and build a pitch deck",
      "Practise pitching and presenting",
      "Launch on Product Hunt",
    ],
    outcome: "A live app, a pitch, and a launch story for applications.",
  },
];

export const journeyFacts = [
  "Personal 1:1 live sessions, 1 hour each",
  "About 2-3 hours a week in total",
  "Beginners welcome",
] as const;

export type StoryCategory = "AI" | "E-commerce" | "Social good" | "Education";

export type Story = {
  name: string;
  blurb: string;
  categories: StoryCategory[];
  tag?: string;
  proof?: string;
  icon: "sprout" | "bag" | "book" | "paw" | "music" | "languages";
  tone: "clay" | "sage" | "sun" | "sky" | "rose" | "ink";
};

export const storyFilters: ("All" | StoryCategory)[] = [
  "All",
  "AI",
  "E-commerce",
  "Social good",
  "Education",
];

export const stories: Story[] = [
  {
    name: "KrishiDrishti",
    blurb: "AI-powered soil analysis and crop recommendations for farmers in India.",
    categories: ["AI", "Social good"],
    icon: "sprout",
    tone: "sage",
  },
  {
    name: "Elenor Vegan Handbags",
    blurb: "A corporate gifting platform for vegan handbags.",
    categories: ["E-commerce"],
    tag: "Started by a 16-year-old",
    proof: "INR 9,000 in its first week",
    icon: "bag",
    tone: "rose",
  },
  {
    name: "One Last Chapter",
    blurb: "A subscription service that delivers books to kids.",
    categories: ["E-commerce", "Education"],
    tag: "Started by a 13-year-old",
    proof: "INR 100,000 monthly revenue",
    icon: "book",
    tone: "sun",
  },
  {
    name: "Paws of Promise",
    blurb: "A virtual pet adoption app that connects pet lovers with shelter pets.",
    categories: ["Social good"],
    icon: "paw",
    tone: "clay",
  },
  {
    name: "AudioNova",
    blurb: "An AI-driven music and video production company.",
    categories: ["AI"],
    icon: "music",
    tone: "ink",
  },
  {
    name: "Converza",
    blurb: 'A Spanish-learning app with "Luna", an AI language-learning bot.',
    categories: ["AI", "Education"],
    icon: "languages",
    tone: "sky",
  },
];

export type Feature = { title: string; text: string; icon: string };

export const features: Feature[] = [
  {
    icon: "users",
    title: "1:1 personal mentoring",
    text: "A dedicated expert works with your teen directly. No group classes.",
  },
  {
    icon: "layers",
    title: "A real app, with no code",
    text: "Your teen builds a full-stack app using no-code tools.",
  },
  {
    icon: "cap",
    title: "A university admission edge",
    text: "A real project with real users gives applications something to stand on.",
  },
  {
    icon: "coins",
    title: "A path to revenue",
    text: "Build, launch and monetise an app. Some students have earned real income.",
  },
  {
    icon: "mic",
    title: "Pitch and presentation skills",
    text: "Your teen learns to pitch and launches on Product Hunt.",
  },
  {
    icon: "bulb",
    title: "Startup Ideas 101",
    text: "How to find and validate startup ideas, taught by the founder.",
  },
  {
    icon: "check",
    title: "Proven track record",
    text: "Real revenue, top university admits and apps that reach real users.",
  },
  {
    icon: "heart",
    title: "Lifelong support",
    text: "Help from the first idea through launch, and an alumni community afterwards.",
  },
];

export const pricing = {
  was: "₹25,000",
  now: "₹16,000",
  note: "Limited-time price",
  seats: "Only 15 spots available each month",
  guarantee: "Results guaranteed or your money back.",
  included: [
    "8 weeks of 1:1 live mentoring",
    "Full-stack app development",
    "Product Hunt launch",
    "Pitch deck creation",
    "Marketing strategy",
    "Ongoing support after the program",
  ],
};

export const tools = [
  "Startup Idea Generator",
  "Fundability Assessment",
  "Team Evaluation Tool",
  "Pitch Deck Analyzer",
  "Top 10 Traits for Business Success",
  "Cofounder Compatibility Test",
  "Problem-Solution Fit",
  "Website Landing Page Assessment",
];

export const TOOLS_URL = "https://www.tactyqal.com/#tools";

export const testimonials = [
  { name: "Aarav Sharma", quote: "I had to struggle to find a tech cofounder." },
  { name: "Isha Patel", quote: "Now I feel independent and can build anything I want." },
  { name: "Rohan Verma", quote: "It's the future." },
  {
    name: "Simran Kaur",
    quote: "I can focus on the creative side and don't have to worry about whether it can be built.",
  },
  { name: "Devansh Mehta", quote: "I went on from having no idea to launching my app." },
  { name: "Priya Nair", quote: "My impact app was only in my head till I built it." },
];

export const faqs = [
  {
    q: "What if my teen has no coding experience?",
    a: "That is the normal starting point. The program is built for beginners, uses no-code tools, and guides your teen step by step.",
  },
  {
    q: "How do you guarantee university admissions?",
    a: "No one can promise a seat. What we do is help your teen build a real project that strengthens their applications.",
  },
  {
    q: "What kind of apps do students typically build?",
    a: "AI tools, e-commerce stores, subscription services and social-good apps. Your teen picks the idea.",
  },
  {
    q: "How much time commitment is required?",
    a: "About 2-3 hours a week, including one hour of live 1:1 mentoring.",
  },
  {
    q: "What is the success rate?",
    a: "Every student launches a working app.",
  },
  {
    q: "Can my teen generate real revenue?",
    a: "Yes. Some students have earned revenue, and some have won grants and media coverage.",
  },
  {
    q: "What universities have your students gotten into?",
    a: "Our alumni are at top universities in the US and the UK.",
  },
  {
    q: "What ongoing support do you provide?",
    a: "Support continues after the program, along with an alumni community and guidance on what to do next.",
  },
];

export const quote = {
  text: "Learn to sell. Learn to build. If you can do both, you will be unstoppable.",
  by: "Naval Ravikant",
};
