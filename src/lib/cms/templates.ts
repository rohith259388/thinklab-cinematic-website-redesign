import { emptyContent, type Content } from './schema';

export interface ProjectTemplateInput {
  title: string;
  slug: string;
  category: string;
  tags: string;
  image: string;
  alt: string;
  summary: string;
  metric1Value?: string;
  metric1Label?: string;
  metric2Value?: string;
  metric2Label?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  source?: string;
}

export interface BlogTemplateInput {
  title: string;
  slug: string;
  category: string;
  date: string;
  image: string;
  alt: string;
  summary: string;
  intro?: string;
  mainBody?: string;
  keyTakeaways?: string;
  conclusion?: string;
}

export interface CareerTemplateInput {
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  date: string;
  apply: string;
  summary: string;
  image?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
}

export function buildProjectContent(input: ProjectTemplateInput): Content {
  const content = emptyContent(input.title);
  content.summary = input.summary || 'Project case study for Thinklab Digital Solutions.';
  content.category = input.category || 'Design & Development';
  content.tags = input.tags || 'Design · Development · Strategy';
  content.image = input.image || '';
  content.alt = input.alt || input.title;
  content.date = new Date().getFullYear().toString();
  content.source = input.source || '';
  content.seoTitle = `${input.title} — Thinklab Case Study`;
  content.seoDescription = input.summary.slice(0, 155);

  const blocks: { type: string; text: string }[] = [];

  // Metrics (DetailPage.tsx reads first two pairs starting with number or #)
  if (input.metric1Value && input.metric1Label) {
    blocks.push({ type: 'p', text: input.metric1Value });
    blocks.push({ type: 'p', text: input.metric1Label });
  }
  if (input.metric2Value && input.metric2Label) {
    blocks.push({ type: 'p', text: input.metric2Value });
    blocks.push({ type: 'p', text: input.metric2Label });
  }

  // Challenge section
  blocks.push({ type: 'h2', text: 'The Challenge & Context' });
  blocks.push({
    type: 'p',
    text:
      input.challenge ||
      'Understanding the brand’s digital opportunities and creating a tailored user experience that aligns with measurable business growth.',
  });

  // Solution section
  blocks.push({ type: 'h2', text: 'Our Solution & Craft' });
  blocks.push({
    type: 'p',
    text:
      input.solution ||
      'Engineered a modern, responsive digital presence with fluid animations, intuitive navigation, and high-performance frontend architecture.',
  });

  // Results / Impact
  blocks.push({ type: 'h2', text: 'Measurable Impact' });
  blocks.push({
    type: 'p',
    text:
      input.results ||
      'Accelerated customer engagement, enhanced conversion pathways, and established a scalable digital foundation for ongoing expansion.',
  });

  content.blocks = blocks;
  return content;
}

export function buildBlogContent(input: BlogTemplateInput): Content {
  const content = emptyContent(input.title);
  content.summary = input.summary || 'Insights and perspective from Thinklab Digital Solutions.';
  content.category = input.category || 'Strategy';
  content.tags = `${input.category || 'Insights'}, Strategy, Digital`;
  content.date = input.date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  content.image = input.image || '';
  content.alt = input.alt || input.title;
  content.seoTitle = `${input.title} — Thinklab Insights`;
  content.seoDescription = input.summary.slice(0, 155);

  const blocks: { type: string; text: string }[] = [];

  // Intro
  blocks.push({
    type: 'p',
    text:
      input.intro ||
      input.summary ||
      'Exploring how strategy, design, and technology intersect to create sustainable business advantage.',
  });

  // Main body section
  blocks.push({ type: 'h2', text: 'Strategic Perspectives' });
  blocks.push({
    type: 'p',
    text:
      input.mainBody ||
      'Modern digital brands must balance aesthetic precision with measurable velocity. Here is how leading teams navigate this dynamic.',
  });

  // Key takeaways
  if (input.keyTakeaways) {
    blocks.push({ type: 'h2', text: 'Key Takeaways' });
    const lines = input.keyTakeaways.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      blocks.push({ type: 'li', text: line.replace(/^[•*-]\s*/, '').trim() });
    }
  }

  // Conclusion
  blocks.push({ type: 'h2', text: 'Moving Forward' });
  blocks.push({
    type: 'p',
    text:
      input.conclusion ||
      'By turning insights into intentional design and technical execution, organizations establish compounding advantages in their category.',
  });

  content.blocks = blocks;
  return content;
}

export function buildCareerContent(input: CareerTemplateInput): Content {
  const content = emptyContent(input.title);
  content.summary = input.summary || `Join the Thinklab team as ${input.title}.`;
  content.image = input.image || '';
  content.category = input.department || 'Engineering';
  content.tags = `${input.department}, ${input.type || 'Full-time'}`;
  content.date = input.date || 'Immediate';
  content.apply = input.apply || 'mailto:info@thinklabdigitalsolutions.com';
  content.seoTitle = `${input.title} — Careers at Thinklab`;
  content.seoDescription = input.summary.slice(0, 155);

  const blocks: { type: string; text: string }[] = [];

  // Required by careers/page.tsx: job.blocks.find(b => b.text.startsWith('Location:'))
  const loc = input.location || 'Vijayawada · Hybrid';
  blocks.push({ type: 'p', text: `Location: ${loc}` });

  // Role Overview
  blocks.push({ type: 'h2', text: 'Role Overview' });
  blocks.push({
    type: 'p',
    text:
      input.summary ||
      `We are looking for a talented ${input.title} to help design, engineer, and scale impactful digital experiences for forward-thinking clients.`,
  });

  // Responsibilities
  blocks.push({ type: 'h2', text: 'What You Will Do' });
  if (input.responsibilities) {
    const lines = input.responsibilities.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      blocks.push({ type: 'li', text: line.replace(/^[•*-]\s*/, '').trim() });
    }
  } else {
    blocks.push({ type: 'li', text: 'Collaborate with cross-functional strategists, designers, and developers.' });
    blocks.push({ type: 'li', text: 'Deliver high-craft solutions that meet demanding performance and visual standards.' });
    blocks.push({ type: 'li', text: 'Continuously iterate based on real feedback, testing, and team reviews.' });
  }

  // Requirements
  blocks.push({ type: 'h2', text: 'What You Bring' });
  if (input.requirements) {
    const lines = input.requirements.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      blocks.push({ type: 'li', text: line.replace(/^[•*-]\s*/, '').trim() });
    }
  } else {
    blocks.push({ type: 'li', text: 'Proven experience and a strong portfolio demonstrating relevant domain expertise.' });
    blocks.push({ type: 'li', text: 'Deep curiosity, collaborative mindset, and commitment to visual and technical excellence.' });
    blocks.push({ type: 'li', text: 'Clear communication skills and pride in shipping polished work.' });
  }

  // Benefits
  if (input.benefits) {
    blocks.push({ type: 'h2', text: 'What We Offer' });
    const lines = input.benefits.split('\n').filter((l) => l.trim().length > 0);
    for (const line of lines) {
      blocks.push({ type: 'li', text: line.replace(/^[•*-]\s*/, '').trim() });
    }
  }

  content.blocks = blocks;
  return content;
}

