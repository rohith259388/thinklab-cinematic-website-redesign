import type { Section, SectionItem, SectionType } from './schema';

/**
 * The component library shown in the Studio. Everything here is plain data so the
 * same definitions drive the picker, the friendly editor and the page templates.
 */

/** Which editable inputs a section shows, in the order they appear. */
export type SectionFieldKey =
  | 'kicker'
  | 'title'
  | 'body'
  | 'image'
  | 'alt'
  | 'label'
  | 'href';

export type ItemFieldKey = keyof SectionItem;

export type SectionDefinition = {
  label: string;
  description: string;
  group: 'Basics' | 'Content' | 'Social proof' | 'Conversion';
  fields: SectionFieldKey[];
  /** Labels shown to editors instead of technical names. */
  fieldLabels?: Partial<Record<SectionFieldKey, string>>;
  items?: {
    noun: string;
    fields: ItemFieldKey[];
    labels: Partial<Record<ItemFieldKey, string>>;
    max: number;
  };
  layouts?: { value: string; label: string }[];
  defaults: () => Partial<Section>;
};

const columns = [
  { value: '2', label: '2 columns' },
  { value: '3', label: '3 columns' },
  { value: '4', label: '4 columns' },
];

export const sectionCatalog: Record<SectionType, SectionDefinition> = {
  hero: {
    label: 'Hero banner',
    description: 'Big headline at the top of a page, with an optional button.',
    group: 'Basics',
    fields: ['kicker', 'title', 'body', 'label', 'href', 'image', 'alt'],
    fieldLabels: {
      kicker: 'Small text above the headline',
      title: 'Headline',
      body: 'Supporting text',
      label: 'Button text',
      href: 'Button link',
      image: 'Background image (optional)',
    },
    defaults: () => ({
      kicker: 'WELCOME',
      title: 'A headline that says what you do.',
      body: 'One or two sentences that explain the value you bring to your customers.',
      label: 'Get in touch',
      href: '/contact',
      padding: 120,
    }),
  },
  text: {
    label: 'Text block',
    description: 'A heading with paragraphs of text. Great for stories and explanations.',
    group: 'Basics',
    fields: ['kicker', 'title', 'body'],
    fieldLabels: { kicker: 'Small label', title: 'Heading', body: 'Text' },
    defaults: () => ({
      title: 'Section heading',
      body: 'Write your text here. Press Enter twice to start a new paragraph.',
    }),
  },
  image: {
    label: 'Image',
    description: 'A large picture with an optional caption.',
    group: 'Basics',
    fields: ['image', 'alt', 'title', 'body'],
    fieldLabels: {
      title: 'Caption heading (optional)',
      body: 'Caption text (optional)',
    },
    defaults: () => ({}),
  },
  imageText: {
    label: 'Image + text',
    description: 'A picture beside a heading, text and button.',
    group: 'Basics',
    fields: ['kicker', 'title', 'body', 'label', 'href', 'image', 'alt'],
    fieldLabels: {
      kicker: 'Small label',
      title: 'Heading',
      body: 'Text',
      label: 'Button text (optional)',
      href: 'Button link',
    },
    layouts: [
      { value: 'left', label: 'Image on the left' },
      { value: 'right', label: 'Image on the right' },
    ],
    defaults: () => ({
      title: 'Tell your story',
      body: 'Pair a strong image with a short explanation of what makes you different.',
      layout: 'left',
    }),
  },
  features: {
    label: 'Feature cards',
    description: 'A grid of cards: services, benefits or reasons to choose you.',
    group: 'Content',
    fields: ['kicker', 'title', 'body'],
    fieldLabels: { kicker: 'Small label', title: 'Heading', body: 'Intro text (optional)' },
    items: {
      noun: 'card',
      fields: ['title', 'body', 'image', 'href'],
      labels: { title: 'Card title', body: 'Card text', image: 'Card image (optional)', href: 'Card link (optional)' },
      max: 12,
    },
    layouts: columns,
    defaults: () => ({
      title: 'What we offer',
      layout: '3',
      items: [
        item('Strategy', 'Clear plans built around your goals.'),
        item('Design', 'Experiences people enjoy using.'),
        item('Growth', 'Marketing that brings measurable results.'),
      ],
    }),
  },
  stats: {
    label: 'Numbers',
    description: 'Big numbers that show results, e.g. “250+ projects”.',
    group: 'Social proof',
    fields: ['kicker', 'title'],
    fieldLabels: { kicker: 'Small label', title: 'Heading (optional)' },
    items: {
      noun: 'number',
      fields: ['title', 'body'],
      labels: { title: 'Number (e.g. 250+)', body: 'What it means' },
      max: 8,
    },
    layouts: columns,
    defaults: () => ({
      layout: '4',
      items: [
        item('250+', 'Projects delivered'),
        item('8', 'Years of experience'),
        item('98%', 'Happy clients'),
        item('2', 'Countries'),
      ],
    }),
  },
  faq: {
    label: 'FAQ',
    description: 'Questions and answers grouped into categories. Answers open when clicked.',
    group: 'Basics',
    fields: ['kicker', 'title', 'body'],
    fieldLabels: { kicker: 'Small label', title: 'Heading', body: 'Intro text (optional)' },
    items: {
      noun: 'question',
      fields: ['title', 'body'],
      labels: { title: 'Question', body: 'Answer' },
      max: 200,
    },
    defaults: () => ({
      kicker: 'FAQ',
      title: 'Frequently asked questions',
      items: [
        item('Do you work with small businesses?', 'Yes. We work with teams of every size, from new start-ups to established brands.', 'General'),
        item('Where are you based?', 'Our studios are in Vijayawada, India and Sydney, Australia, and we work with clients everywhere.', 'General'),
        item('How long does a project take?', 'Most projects take between four and eight weeks, depending on scope.', 'Projects & pricing'),
        item('How much does a website cost?', 'Every project is different. Tell us what you need and we will send a clear quote.', 'Projects & pricing'),
        item('How do we get started?', 'Send us a message and we will set up a short call to understand your goals.', 'Getting started'),
      ],
    }),
  },
  testimonials: {
    label: 'Testimonials',
    description: 'Quotes from happy customers.',
    group: 'Social proof',
    fields: ['kicker', 'title'],
    fieldLabels: { kicker: 'Small label', title: 'Heading' },
    items: {
      noun: 'testimonial',
      fields: ['body', 'title', 'image'],
      labels: { body: 'Quote', title: 'Name, role and company', image: 'Photo (optional)' },
      max: 12,
    },
    layouts: columns,
    defaults: () => ({
      kicker: 'TESTIMONIALS',
      title: 'What our clients say',
      layout: '3',
      items: [
        item('Priya S., Bliss Valley', '“The team understood our business and delivered beyond expectations.”'),
        item('Arjun K., Udyaan', '“Fast, thoughtful and genuinely creative. Highly recommended.”'),
        item('Meera R., ImpactGrad', '“Our enquiries doubled within three months of launch.”'),
      ],
    }),
  },
  gallery: {
    label: 'Image gallery',
    description: 'A grid of pictures.',
    group: 'Content',
    fields: ['kicker', 'title'],
    fieldLabels: { kicker: 'Small label', title: 'Heading (optional)' },
    items: {
      noun: 'image',
      fields: ['image', 'title'],
      labels: { image: 'Image', title: 'Caption (optional)' },
      max: 24,
    },
    layouts: columns,
    defaults: () => ({ layout: '3', items: [item('', ''), item('', ''), item('', '')] }),
  },
  logos: {
    label: 'Logo strip',
    description: 'A row of client or partner logos.',
    group: 'Social proof',
    fields: ['kicker'],
    fieldLabels: { kicker: 'Label (e.g. Trusted by)' },
    items: {
      noun: 'logo',
      fields: ['image', 'title'],
      labels: { image: 'Logo image', title: 'Company name' },
      max: 24,
    },
    defaults: () => ({ kicker: 'TRUSTED BY', align: 'center', items: [] }),
  },
  cta: {
    label: 'Call to action',
    description: 'A banner that asks visitors to take the next step.',
    group: 'Conversion',
    fields: ['title', 'body', 'label', 'href'],
    fieldLabels: { title: 'Heading', body: 'Text', label: 'Button text', href: 'Button link' },
    defaults: () => ({
      title: 'Ready to start your project?',
      body: 'Tell us what you have in mind. We reply within one working day.',
      label: 'Let’s talk',
      href: '/contact',
      align: 'center',
    }),
  },
  quote: {
    label: 'Quote',
    description: 'One large quote or statement.',
    group: 'Content',
    fields: ['body', 'title'],
    fieldLabels: { body: 'Quote', title: 'Who said it (optional)' },
    defaults: () => ({
      body: 'Good design is good business.',
      title: 'Thomas J. Watson',
      align: 'center',
    }),
  },
  video: {
    label: 'Video',
    description: 'Embed a YouTube or Vimeo video.',
    group: 'Content',
    fields: ['title', 'href', 'body'],
    fieldLabels: {
      title: 'Heading (optional)',
      href: 'YouTube or Vimeo link',
      body: 'Text below the video (optional)',
    },
    defaults: () => ({ title: '', href: '' }),
  },
  contact: {
    label: 'Contact form',
    description: 'The enquiry form. Messages arrive in your inbox.',
    group: 'Conversion',
    fields: ['kicker', 'title', 'body'],
    fieldLabels: { kicker: 'Small label', title: 'Heading', body: 'Text beside the form' },
    defaults: () => ({
      kicker: 'CONTACT',
      title: 'Start a conversation',
      body: 'Tell us about your project and we will get back to you within 24 hours.',
    }),
  },
  divider: {
    label: 'Divider / space',
    description: 'A thin line with space around it, to separate sections.',
    group: 'Basics',
    fields: [],
    defaults: () => ({ padding: 40 }),
  },
};

function item(title: string, body: string, group = ''): SectionItem {
  return { title, body, image: '', href: '', group };
}

export function newSection(type: SectionType): Section {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return {
    id,
    type,
    kicker: '',
    image: '',
    alt: '',
    title: '',
    body: '',
    href: '',
    label: '',
    background: '',
    color: '',
    padding: 72,
    align: 'left',
    layout: '',
    hidden: false,
    items: [],
    ...sectionCatalog[type].defaults(),
  };
}

export const emptyItem = (): SectionItem => item('', '');

/** Starting points for the “New page” dialog. */
export const pageTemplates: {
  id: string;
  label: string;
  description: string;
  sections: SectionType[];
}[] = [
  {
    id: 'blank',
    label: 'Blank page',
    description: 'A hero banner and an FAQ section. Add anything else yourself.',
    sections: ['hero', 'faq'],
  },
  {
    id: 'landing',
    label: 'Landing page',
    description: 'Hero, features, numbers, testimonials, FAQ and a call to action.',
    sections: ['hero', 'features', 'stats', 'testimonials', 'faq', 'cta'],
  },
  {
    id: 'service',
    label: 'Service page',
    description: 'Explain one service with image, benefits, FAQ and contact form.',
    sections: ['hero', 'imageText', 'features', 'faq', 'contact'],
  },
  {
    id: 'about',
    label: 'About / story',
    description: 'Tell your story with text, images, numbers, a quote and FAQ.',
    sections: ['hero', 'text', 'imageText', 'stats', 'quote', 'faq', 'cta'],
  },
  {
    id: 'contact',
    label: 'Contact page',
    description: 'A short intro, the enquiry form and common questions.',
    sections: ['hero', 'contact', 'faq'],
  },
];

/** Labels for article blocks, in the order shown in the “Add” toolbar. */
export const blockCatalog: { type: string; label: string; hint: string }[] = [
  { type: 'p', label: 'Paragraph', hint: 'Normal text' },
  { type: 'h2', label: 'Heading', hint: 'Large heading' },
  { type: 'h3', label: 'Sub-heading', hint: 'Smaller heading' },
  { type: 'li', label: 'Bullet point', hint: 'Bulleted list item' },
  { type: 'ol', label: 'Numbered point', hint: 'Numbered list item' },
  { type: 'img', label: 'Image', hint: 'Picture with caption' },
  { type: 'quote', label: 'Quote', hint: 'Highlighted quote' },
  { type: 'faqs', label: 'FAQ', hint: 'Questions grouped into categories' },
  { type: 'button', label: 'Button', hint: 'Link button' },
  { type: 'divider', label: 'Divider', hint: 'Horizontal line' },
];

export const builtInPages = ['/', 'about', 'services', 'projects', 'reviews', 'blog', 'careers', 'contact'];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Converts a YouTube/Vimeo watch URL to its embed URL, or null if not recognised. */
export function videoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts)\/([\w-]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === 'player.vimeo.com') return url;
  } catch {}
  return null;
}

export type FaqGroup = { name: string; questions: { item: SectionItem; index: number }[] };

/**
 * Groups FAQ questions by category, in the order categories first appear.
 * `index` is the question's position in the section's flat item list.
 */
export function faqGroups(items: SectionItem[]): FaqGroup[] {
  const groups: FaqGroup[] = [];
  items.forEach((item, index) => {
    const name = item.group.trim();
    let g = groups.find((x) => x.name === name);
    if (!g) groups.push((g = { name, questions: [] }));
    g.questions.push({ item, index });
  });
  return groups;
}

/** Flattens edited groups back into the section's item list. */
export function flattenFaqGroups(groups: { name: string; items: SectionItem[] }[]): SectionItem[] {
  return groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.name })));
}
