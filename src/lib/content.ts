/**
 * ThinkLab Digital Solutions — canonical content.
 * Preserved from thinklabdigitalsolutions.com (headings, services, FAQs,
 * case studies, testimonials, blogs, navigation, SEO copy).
 */

export const BRAND = {
  name: 'Thinklab Digital Solutions',
  short: 'TLDS',
  email: 'info@thinklabdigitalsolutions.com',
  descriptor:
    'Thinklab Digital Solutions is a full-service digital marketing agency helping businesses grow online through SEO, Google Ads, social media marketing, web design, brand strategy, CRM and AI/workflow automation.',
  phones: [
    { label: '+61 493 305 496', href: 'tel:+61493305496', region: 'Australia' },
    { label: '+91 93475 80911', href: 'tel:+919347580911', region: 'India' },
  ],
  locations: ['Vijayawada, AP, India', 'Mascot, Sydney, Australia'],
  copyright: 'Copyright © 2026 - All Right Reserved to Thinklab Digital Solutions',
};

export const NAV = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Insights', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

export interface Service {
  id: string;
  index: string;
  title: string;
  /** What the service contributes to the living structure (scene language). */
  layer: string;
  /** One-line version used on the services explorer. */
  summary: string;
  description: string;
  capabilities: string[];
}

export const SERVICES: Service[] = [
  {
    id: 'digital-marketing',
    index: '01',
    title: 'Digital Marketing',
    layer: 'Marketing adds motion',
    summary:
      'SEO, paid ads and social campaigns that bring in consistent, qualified leads.',
    description:
      'Our digital marketing services combine SEO, paid advertising, and social media marketing to improve online visibility, audience, and generate consistent leads through data-driven campaigns and continuous optimisation.',
    capabilities: ['SEO & Content', 'Google & Meta Ads', 'Social Media Marketing', 'Performance Campaigns'],
  },
  {
    id: 'website-development',
    index: '02',
    title: 'Website Development',
    layer: 'Development adds architectural geometry',
    summary:
      'Fast, responsive websites and stores built to turn visitors into customers.',
    description:
      'We create fast, responsive websites including business sites, e-commerce platforms, and conversion-focused landing pages, designed to engage visitors, support marketing campaigns, and turn traffic into customers.',
    capabilities: ['Business Websites', 'E-Commerce Platforms', 'Landing Pages', 'CRO & Speed'],
  },
  {
    id: 'brand-strategy',
    index: '03',
    title: 'Brand Strategy',
    layer: 'Branding adds colour and identity',
    summary:
      'Positioning, identity and messaging that make your business instantly recognisable.',
    description:
      'Our brand strategy services cover brand positioning, visual identity, and messaging development to help businesses communicate clearly, build recognition, and maintain a consistent professional presence online.',
    capabilities: ['Brand Positioning', 'Visual Identity', 'Messaging', 'Brand Guidelines'],
  },
  {
    id: 'workflow-automation',
    index: '04',
    title: 'Workflow/AI Automation',
    layer: 'Automation connects systems',
    summary:
      'Automations and AI assistants that remove manual work and connect your tools.',
    description:
      'We build smart automation solutions including business process automation, marketing workflows, and system integrations to reduce manual work, improve efficiency, and ensure smooth data flow across your business tools.',
    capabilities: ['Process Automation', 'Marketing Workflows', 'System Integrations', 'AI Assistants'],
  },
  {
    id: 'crm-services',
    index: '05',
    title: 'CRM Services',
    layer: 'CRM creates memory',
    summary:
      'One system that keeps every lead, pipeline and follow-up in one place.',
    description:
      'We implement CRM systems that organise every customer relationship — pipelines, follow-ups, and customer data unified in one place so your team never loses a lead and every conversation builds on the last.',
    capabilities: ['CRM Implementation', 'Sales Pipelines', 'Lead Management', 'Reporting'],
  },
  {
    id: 'strategic-planning',
    index: '06',
    title: 'Strategic Planning',
    layer: 'Strategy draws the blueprint',
    summary:
      'A measurable roadmap — markets, channels, budgets and milestones.',
    description:
      'We map long-term digital roadways — market analysis, channel strategy, budgets and milestones — so every campaign, website and system is built against a clear, measurable growth plan.',
    capabilities: ['Market Analysis', 'Channel Strategy', 'Budget Planning', 'Growth Roadmaps'],
  },
  {
    id: 'pr-events', index: '07', title: 'PR & Events', layer: 'Events bring people together', summary:
      'PR and event experiences, promoted digitally from registration to the room.', description: 'We help brands, businesses and communities organize impactful PR events through digital promotion, online registrations, attendee coordination and engaging event experiences.', capabilities: ['Event Promotion', 'Digital Registrations', 'Audience Engagement', 'Attendee Coordination']
  },
];

export const HERO = {
  badge: 'Helping Brands Grow Faster Online.',
  titleLines: ['The Right', 'Partner For', 'Digital Growth'],
  heading: 'The Right Partner For Digital Growth',
  kicker: 'Helping Businesses Scale with Data-Driven Marketing',
  sub: 'We grow your business with SEO, digital marketing, high converting websites, and performance campaigns that bring real leads and sales.',
  reviews: '200+ 5 Star Reviews',
  cta: 'Contact Us',
};

export interface StatItem {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

export const STATS: StatItem[] = [
  { value: 98, suffix: '%', label: 'Client Success Rate' },
  { value: 200, suffix: '+', label: 'Campaigns Launched' },
  { value: 150, suffix: '%', label: 'Revenue Increased' },
  { value: 200, suffix: '+', label: '5 Star Reviews' },
];

export const FEATURES = [
  {
    title: 'Results Driven Strategy',
    description:
      'We build digital marketing strategies focused on measurable growth, stronger visibility, and consistent lead generation to help your business scale with confidence.',
  },
  {
    title: 'Tailored Business Solutions',
    description:
      'Every business is unique, so we design customised websites, campaigns, and automation systems aligned with your goals, audience, and long-term growth plans.',
  },
  {
    title: 'Client Focused Partnership',
    description:
      'Your success comes first. We provide transparent communication, reliable support, and continuous optimisation to ensure your digital performance keeps improving.',
  },
];

export const CHECKLIST = [
  'Dedicated Client Support',
  'Proven Business Results',
  'Commitment to Quality',
  'Data Driven Execution',
];

export interface CaseStudy {
  id: string;
  index: string;
  client: string;
  title: string;
  summary: string;
  sector: string;
  services: string[];
  outcome: string;
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'hreemkar-papers',
    index: '01',
    client: 'Hreemkar Papers',
    title: 'Corporate Website for Paper Manufacturing & Supply Company',
    summary:
      'A complete corporate web presence built to present manufacturing capability, product ranges and supply reliability — structured for search visibility and wholesale enquiries.',
    sector: 'Manufacturing & Supply',
    services: ['Website Development', 'SEO', 'Content'],
    outcome: 'A discovery-ready corporate platform that turned product catalogues into qualified B2B enquiries.',
  },
  {
    id: 'elevex-rentals',
    index: '02',
    client: 'ELEVEX Rentals',
    title: 'Complete Digital Transformation for Equipment Rentals',
    summary:
      'A complete digital transformation combining website redesign, equipment focused content, SEO, and conversion focused design for ELEVEX Rentals.',
    sector: 'Equipment Rentals',
    services: ['Website Redesign', 'SEO', 'CRO', 'Content'],
    outcome: 'Higher rental enquiries through equipment-first content and a conversion-tuned booking journey.',
  },
  {
    id: 'geeta-home-appliances',
    index: '03',
    client: 'Geeta Home Appliances',
    title: 'Shopify E-Commerce Website',
    summary:
      'A complete E-commerce foundation designed to help Geeta Home Appliances establish its online sales channel and scale its digital product catalogue.',
    sector: 'E-Commerce / Retail',
    services: ['Shopify Development', 'E-Commerce Strategy', 'Catalogue Design'],
    outcome: 'A scalable online sales channel with a catalogue architecture ready to grow product lines.',
  },
  {
    id: 'sandhatri-amaraone',
    index: '04',
    client: 'Sandhatri Group — Amaraone',
    title: 'Digital-First Real Estate Presence',
    summary:
      'A digital-first real estate presence combining a dedicated project website with ongoing marketing and lead-generation activities.',
    sector: 'Real Estate',
    services: ['Project Website', 'Digital Marketing', 'Lead Generation'],
    outcome: 'A continuous pipeline of project enquiries powered by an always-on lead-generation engine.',
  },
];

export const TESTIMONIALS = [
  {
    name: 'Jonathan Zrihen',
    role: 'CEO',
    company: 'Clarins',
    quote: 'They refined our brand’s digital presence and increased customer retention. The personalised strategies made a huge impact.',
  },
  {
    name: 'Laurie Kane',
    role: 'CEO',
    company: 'SolarPlus',
    quote: 'Their marketing approach brought in more foot traffic and online orders. The data driven insights made all the difference.',
  },
  {
    name: 'Ollie Gordon',
    role: 'Founder',
    company: 'Local Valuers',
    quote: 'Their system improved our client engagement and lead conversions. The easy to use tools streamlined our entire sales process.',
  },
  {
    name: 'Daniel Foster',
    role: 'CEO',
    company: 'House Finder',
    quote: 'Their system improved our client engagement and lead conversions. The easy to use tools streamlined our entire sales process.',
  },
  {
    name: 'Brian White',
    role: 'MD',
    company: 'Ray White',
    quote: 'Their platform transformed how we approach campaigns. The intuitive tools and seamless integrations saved us a lot of time.',
  },
  {
    name: 'Arpan Choudhary',
    role: 'Founder',
    company: 'Architecture',
    quote: 'Their platform enhanced project coordination and design workflow. The advanced tools helped us meet deadlines stress-free.',
  },
];

export const WHY_US = {
  kicker: 'Why Us',
  title: 'Why Thinklab Digital Solutions Stands Out',
  body: 'We combine strategic digital marketing, high performance website development, and intelligent automation to help businesses increase traffic, generate qualified leads, and grow revenue consistently. Our approach focuses on measurable results, transparent reporting, and continuous optimisation to ensure long-term digital success.',
  visibility:
    'Our integrated digital strategy ensures sustainable visibility growth, stronger engagement, and increased website enquiries within the first few months of campaign execution.',
  values: [
    'Quality',
    'Personalization',
    'Reliability',
    'Collaboration',
    'Innovation',
    'Customer Focus',
    'Long-Term Relationships',
    'Positive Experience',
    'Trustworthiness',
    'Passion',
    'Customer Support',
    'Enhanced Brand Visibility',
  ],
};

export const WHY_CHOOSE = [
  {
    title: 'Proven Growth Results',
    description:
      'We deliver measurable improvements in website traffic, lead generation, and online visibility through structured marketing strategies and continuous performance optimisation.',
  },
  {
    title: 'Custom Digital Solutions',
    description:
      'Every business has different goals, so we create tailored marketing campaigns, website systems, and automation workflows built specifically for your needs.',
  },
  {
    title: 'Client-Focused Partnership',
    description:
      'We work closely with your team, understand your objectives, and ensure every strategy aligns with your business growth and long term digital success.',
  },
  {
    title: 'Clear & Transparent Reporting',
    description:
      'Receive regular updates, honest performance insights, and clear communication so you always understand campaign progress and measurable outcomes.',
  },
  {
    title: 'Reliable Ongoing Support',
    description:
      'Our team provides consistent technical guidance, marketing assistance, and responsive support to keep your digital systems running smoothly.',
  },
  {
    title: 'Multi-Industry Experience',
    description:
      'We have worked with businesses across multiple sectors, allowing us to apply proven digital strategies that adapt to different markets and audiences.',
  },
];

export const BLOGS = [
  {
    title: 'Creative Marketing Agency in Vijayawada: How Creative Strategy Drives Real Business Growth',
    date: 'Apr 30, 2026',
    tag: 'Creative Strategy',
    slug: 'creative-marketing-agency-in-vijayawada-how-creative-strategy-drives-real-business-growth',
    featured: true,
  },
  {
    title: 'Website Development Services in Hyderabad',
    date: 'Mar 9, 2026',
    tag: 'Web Development',
    slug: 'website-development-hyderabad',
    featured: false,
  },
  {
    title: 'Workflow & AI Automation Services in Mumbai',
    date: 'Mar 9, 2026',
    tag: 'Automation',
    slug: 'workflow-ai-automation-mumbai',
    featured: false,
  },
  {
    title: 'Strategic Planning Services in Hyderabad',
    date: 'Mar 9, 2026',
    tag: 'Strategy',
    slug: 'strategic-planning-services-hyderabad',
    featured: false,
  },
  {
    title: 'Brand Strategy Services in Kolkata',
    date: 'Mar 9, 2026',
    tag: 'Branding',
    slug: 'brand-strategy-services-kolkata',
    featured: false,
  },
  {
    title: 'CRM Services in Pune',
    date: 'Mar 9, 2026',
    tag: 'CRM',
    slug: 'crm-services-pune',
    featured: false,
  },
];

export const HOME_FAQS = [
  {
    q: 'How does your marketing approach stand out from competitors?',
    a: 'We combine SEO, paid advertising, website development and automation into one integrated system rather than isolated services. Every decision is tied to measurable outcomes — traffic, qualified leads and revenue — and optimised continuously, so your marketing compounds instead of resetting each month.',
  },
  {
    q: 'What makes your lead generation strategies effective?',
    a: 'We align high-converting landing pages, precise audience targeting and intent-driven campaigns, then connect everything to your CRM so no enquiry is lost. Continuous testing of creative, offers and funnels keeps cost-per-lead falling while lead quality rises.',
  },
  {
    q: 'How do you accurately measure the success of a campaign?',
    a: 'Every campaign is instrumented with analytics, conversion tracking and call/form attribution. You receive transparent reports that map spend to traffic, enquiries and sales — so performance is always visible in business terms, not vanity metrics.',
  },
  {
    q: 'How can I easily get started with your services today?',
    a: 'Start with a free strategy conversation. We audit your current digital presence, identify the fastest growth opportunities, and present a tailored roadmap with clear priorities, timelines and pricing — you can begin with a single service or a full growth program.',
  },
  {
    q: 'What platforms do you specialise in for digital marketing?',
    a: 'We work across Google Ads, Meta (Facebook & Instagram), LinkedIn, YouTube and organic search, alongside Shopify, WordPress and modern web stacks, with CRM and automation platforms connecting everything behind the scenes.',
  },
  {
    q: 'Do you offer tailored solutions for different industries?',
    a: 'Yes. We have delivered growth for e-commerce, real estate, manufacturing, equipment rentals, professional services and more. Every strategy, website and automation system is customised to your industry, audience and growth stage.',
  },
];

export const ABOUT = {
  kicker: 'Who we are',
  title: 'About our Company',
  pillars: [
    {
      index: '01',
      title: 'Our History',
      body: 'Thinklab Digital Solutions began as a small team of strategists and engineers who believed digital growth should be measurable, honest and built to last. Today we operate from Vijayawada, India and Mascot, Sydney — delivering measurable business outcomes through data-driven digital execution and continuous campaign improvement.',
    },
    {
      index: '02',
      title: 'Our Mission',
      body: 'To grow businesses with SEO, digital marketing, high-converting websites and performance campaigns that bring real leads and sales — executed with transparent communication, reliable support and continuous optimisation.',
    },
    {
      index: '03',
      title: 'Our Vision',
      body: 'A world where every ambitious business — regardless of size or geography — has access to the same intelligent, integrated digital systems that compound visibility, leads and revenue over time.',
    },
  ],
  brandsLabel: 'Brands we have worked with',
  brands: [
    'Clarins',
    'SolarPlus',
    'Local Valuers',
    'House Finder',
    'Ray White',
    'Hreemkar Papers',
    'ELEVEX Rentals',
    'Geeta Home Appliances',
    'Sandhatri Group',
  ],
  founder: {
    kicker: 'About Founder',
    title: 'Meet The Founder',
    traits: ['Digital Strategist', 'Market Analyst', 'Solution Oriented', 'Execution Focused'],
    body: 'Ajay Kumar Kattamuri is a marketing expert and digital strategist who combines analytical thinking with creative problem solving. His approach brings a strong focus on client relationships, thoughtful strategy and practical execution.',
  },
  featuredIn: ['Vijayawada', 'Hyderabad', 'Mumbai', 'Kolkata', 'Pune', 'Sydney'],
  process: {
    kicker: 'How We Work',
    title: 'Our 4 Stage Process',
    stages: [
      {
        index: '01',
        title: 'Discovery & Audit',
        body: 'We map your market, audience, data and existing systems to find the gaps where growth is leaking.',
      },
      {
        index: '02',
        title: 'Strategy & Blueprint',
        body: 'A tailored roadmap: channels, website architecture, automation and budgets — prioritised by impact.',
      },
      {
        index: '03',
        title: 'Execution & Launch',
        body: 'Design, development, campaigns and integrations ship in focused sprints with transparent reporting.',
      },
      {
        index: '04',
        title: 'Optimisation & Growth',
        body: 'Continuous testing and optimisation compound results — the system gets smarter every month.',
      },
    ],
  },
  team: {
    kicker: 'Team Members',
    title: 'Say Hello to Our Squad',
    body: 'Get ready to meet the faces behind the magic, the dreamers, the doers, and the unstoppable force driving our success.',
    disciplines: [
      'Growth Strategists',
      'Web Engineers',
      'Brand Designers',
      'Performance Marketers',
      'Automation Architects',
      'Client Partners',
    ],
  },
  faqKicker: 'Frequently Asked Questions',
  faqTitle: 'Got Questions? We’ve Got Answers!',
};

export const ABOUT_FAQS = [
  {
    q: 'What services does Thinklab Digital Solutions provide?',
    a: 'We are a full-service digital marketing agency: SEO, Google Ads and social media marketing, website design and development, brand strategy, CRM services, strategic planning and AI/workflow automation — delivered as one integrated growth system.',
  },
  {
    q: 'What industries do you work with?',
    a: 'We work across e-commerce, real estate, manufacturing, equipment rentals, professional services, architecture and local retail. Our multi-industry experience lets us adapt proven digital strategies to different markets and audiences.',
  },
  {
    q: 'How is TLDS different from other digital agencies?',
    a: 'We connect marketing, websites and automation into a single measurable system. You get transparent reporting, honest communication and continuous optimisation — a partnership focused on long-term digital success, not disconnected one-off deliverables.',
  },
  {
    q: 'Do you provide customised digital solutions?',
    a: 'Always. Every business has different goals, so every campaign, website and automation workflow is built specifically for your objectives, audience and long-term growth plans.',
  },
  {
    q: 'Can TLDS support businesses internationally?',
    a: 'Yes. With teams in Vijayawada, India and Mascot, Sydney, Australia, we support clients across time zones with the same responsiveness — from local service businesses to international brands.',
  },
  {
    q: 'Do you offer long term support after project completion?',
    a: 'Absolutely. We provide reliable ongoing support — technical guidance, marketing assistance and continuous optimisation — so your digital systems keep improving long after launch.',
  },
];

export const CONTACT_META = {
  finalHeadline: 'What will we build next?',
  kicker: 'Contact',
  title: 'Start the next spark',
  body: 'Tell us where your business is today and where it needs to be. We will respond with a clear, honest growth plan.',
};

export const CTA = {
  services: 'View All Services',
  projects: 'View All Projects',
  reviews: 'View All Reviews',
  blogs: 'Read Blogs',
  contact: 'Contact Us',
};
