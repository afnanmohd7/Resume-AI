import type { AppState, DesignSettings, ResumeData } from '../types';
import { stableId } from './text';

export const DEFAULT_DESIGN: DesignSettings = {
  template: 'modern',
  accent: '#1f4d7a',
  fontFamily: 'sans',
  fontScale: 1,
  lineHeight: 1.42,
  sectionGap: 14,
  margin: 48,
  paper: 'a4',
  uppercaseHeadings: true,
  showIcons: false,
  bulletPeriods: false,
};

export function emptyResume(): ResumeData {
  return {
    contact: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
    },
    summary: '',
    experience: [
      {
        id: stableId('exp'),
        role: '',
        company: '',
        location: '',
        start: '',
        end: '',
        current: true,
        bullets: [''],
      },
    ],
    education: [
      { id: stableId('edu'), degree: '', school: '', location: '', start: '', end: '', detail: '' },
    ],
    skills: [{ id: stableId('skl'), label: 'Core skills', items: [] }],
    projects: [],
    certifications: [],
    sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
    hidden: ['projects', 'certifications'],
    headings: {},
  };
}

/**
 * Loaded by the "See an example" button. Deliberately written the way a good
 * resume reads — quantified, verb-led, no filler — so it doubles as a model.
 */
export function sampleResume(): ResumeData {
  return {
    contact: {
      fullName: 'Priya Raghunathan',
      headline: 'Senior Product Designer',
      email: 'priya.r@example.com',
      phone: '+44 7700 900112',
      location: 'Manchester, UK',
      website: 'priyar.design',
      linkedin: 'linkedin.com/in/example',
      github: '',
    },
    summary:
      'Senior product designer shaping data-heavy B2B products end to end. Recent work includes rebuilding a reporting suite used by 40,000 analysts, cutting time-to-first-insight by 38%. Happiest working close to engineering, where research turns into shipped interfaces.',
    experience: [
      {
        id: stableId('exp'),
        role: 'Senior Product Designer',
        company: 'Northwind Analytics',
        location: 'Manchester, UK',
        start: 'Feb 2021',
        end: '',
        current: true,
        bullets: [
          'Rebuilt the reporting suite used by 40,000 analysts, cutting median time-to-first-insight from 6.5 to 4 minutes',
          'Established a 60-component design system adopted by 4 product teams, halving handoff questions per sprint',
          'Ran 32 usability sessions across 3 markets, reshaping the onboarding flow and lifting week-one activation by 21%',
          'Partnered with engineering to cut unused CSS by 44%, improving mobile load time on low-bandwidth connections',
        ],
      },
      {
        id: stableId('exp'),
        role: 'Product Designer',
        company: 'Ledgerly',
        location: 'Remote',
        start: 'Jun 2018',
        end: 'Jan 2021',
        current: false,
        bullets: [
          'Designed the self-serve invoicing flow that grew paid conversions 17% quarter over quarter',
          'Introduced weekly design critiques across a 12-person product org, shortening review cycles by 3 days',
          'Audited 40 screens against WCAG 2.1 AA and remediated 90% of contrast and focus-order failures',
        ],
      },
    ],
    education: [
      {
        id: stableId('edu'),
        degree: 'BA (Hons) Graphic Communication Design',
        school: 'Central Saint Martins',
        location: 'London, UK',
        start: '2014',
        end: '2017',
        detail: 'First-class honours. Final project exhibited at the 2017 degree show.',
      },
    ],
    skills: [
      {
        id: stableId('skl'),
        label: 'Design',
        items: ['Figma', 'Design systems', 'Prototyping', 'Interaction design', 'Accessibility', 'WCAG'],
      },
      {
        id: stableId('skl'),
        label: 'Research',
        items: ['Usability testing', 'User research', 'A/B testing', 'Journey mapping'],
      },
      { id: stableId('skl'), label: 'Collaboration', items: ['Jira', 'Storybook', 'HTML', 'CSS'] },
    ],
    projects: [
      {
        id: stableId('prj'),
        name: 'Contrast Companion',
        link: 'github.com/example/contrast-companion',
        stack: 'TypeScript, Figma Plugin API',
        bullets: [
          'Built a Figma plugin that flags WCAG contrast failures in place, installed by 2,300 designers',
        ],
      },
    ],
    certifications: [
      {
        id: stableId('crt'),
        name: 'Certified Professional in Accessibility Core Competencies',
        issuer: 'IAAP',
        date: '2022',
        credential: '',
      },
    ],
    sectionOrder: ['summary', 'experience', 'skills', 'projects', 'education', 'certifications'],
    hidden: [],
    headings: {},
  };
}

export const SAMPLE_JOB_DESCRIPTION = `Senior Product Designer — Fintech Platform

About the role
We are looking for a senior product designer to own the end-to-end experience of our analytics and reporting products.

Requirements
- 5+ years designing complex B2B or data-heavy products
- Strong command of Figma and modern prototyping workflows
- Experience building and maintaining a design system
- Comfortable running user research and usability testing
- Working knowledge of accessibility standards (WCAG 2.1 AA)
- Ability to partner closely with engineering on implementation

Nice to have
- Familiarity with HTML and CSS
- Experience with A/B testing and product analytics
- Background in fintech or regulated industries`;

export function defaultState(): AppState {
  return {
    resume: emptyResume(),
    design: { ...DEFAULT_DESIGN },
    jobDescription: '',
    coverLetter: '',
  };
}
