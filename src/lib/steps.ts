import type { ResumeData } from '../types';
import { wordCount } from './text';

export type StepId =
  | 'personal'
  | 'experience'
  | 'education'
  | 'skills'
  | 'extras'
  | 'summary'
  | 'review';

export interface StepDef {
  id: StepId;
  /** Rail label. Kept to one or two words so the rail stays scannable. */
  label: string;
  /** Heading at the top of the step. */
  title: string;
  /** One line telling the person what this step is for. */
  blurb: string;
  /** Optional steps never show a warning when left empty. */
  optional?: boolean;
}

export const STEPS: StepDef[] = [
  {
    id: 'personal',
    label: 'About you',
    title: 'Start with your details',
    blurb: 'How an employer reaches you. This sits at the very top of the page.',
  },
  {
    id: 'experience',
    label: 'Experience',
    title: 'Where have you worked?',
    blurb: 'Most recent role first. This is the section recruiters read properly.',
  },
  {
    id: 'education',
    label: 'Education',
    title: 'Your education',
    blurb: 'Degrees, diplomas, or training. Keep it short once you have work history.',
    optional: true,
  },
  {
    id: 'skills',
    label: 'Skills',
    title: 'What are you good at?',
    blurb: 'Group related skills together. This block is easy for screening software to read.',
  },
  {
    id: 'extras',
    label: 'Extras',
    title: 'Projects & certifications',
    blurb: 'Optional, but useful early in a career or when changing field.',
    optional: true,
  },
  {
    id: 'summary',
    label: 'Summary',
    title: 'Your opening paragraph',
    blurb: 'Written last on purpose — now there is something to summarise.',
    optional: true,
  },
  {
    id: 'review',
    label: 'Review',
    title: 'Check and download',
    blurb: 'What is strong, what is missing, and where to go next.',
  },
];

export const STEP_IDS: StepId[] = STEPS.map((step) => step.id);

export function stepIndex(id: StepId): number {
  return Math.max(0, STEP_IDS.indexOf(id));
}

export interface StepState {
  /** Enough content for this step to count as done. */
  complete: boolean;
  /** Things that must be filled in — these block Continue once, then yield. */
  blocking: string[];
  /** Things worth adding that never block. */
  advice: string[];
  /** Any content at all, used to tell "skipped" from "untouched". */
  started: boolean;
}

const EMPTY: StepState = { complete: false, blocking: [], advice: [], started: false };

function filled(value: string | undefined): boolean {
  return Boolean(value && value.trim());
}

export function stepState(resume: ResumeData, id: StepId): StepState {
  switch (id) {
    case 'personal': {
      const { contact } = resume;
      const blocking: string[] = [];
      const advice: string[] = [];
      if (!filled(contact.fullName)) blocking.push('Your full name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim())) {
        blocking.push('A valid email address');
      }
      if (!filled(contact.phone)) advice.push('A phone number — recruiters still call');
      if (!filled(contact.location)) advice.push('Your city and country, for location filters');
      if (!filled(contact.headline)) {
        advice.push('A headline matching the job title you are applying for');
      }
      return {
        complete: blocking.length === 0,
        blocking,
        advice,
        started: Object.values(contact).some(filled),
      };
    }

    case 'experience': {
      const roles = resume.experience;
      const real = roles.filter(
        (role) => filled(role.role) || filled(role.company) || role.bullets.some(filled),
      );
      const blocking: string[] = [];
      const advice: string[] = [];
      if (!real.length) blocking.push('At least one role');
      else {
        const incomplete = real.filter((role) => !filled(role.role) || !filled(role.company));
        if (incomplete.length) blocking.push('A job title and company for every role');
        const undated = real.filter((role) => !filled(role.start) || (!role.current && !filled(role.end)));
        if (undated.length) advice.push('Dates on every role — gaps read as red flags');
        const thin = real.filter((role) => role.bullets.filter(filled).length < 2);
        if (thin.length) advice.push('At least two achievements per role');
      }
      return {
        complete: blocking.length === 0,
        blocking,
        advice,
        started: real.length > 0,
      };
    }

    case 'education': {
      const real = resume.education.filter((entry) => filled(entry.degree) || filled(entry.school));
      return {
        complete: real.length > 0,
        blocking: [],
        advice: real.some((entry) => !filled(entry.school)) ? ['An institution for each qualification'] : [],
        started: real.length > 0,
      };
    }

    case 'skills': {
      const items = resume.skills.flatMap((group) => group.items).filter(filled);
      const advice: string[] = [];
      if (items.length > 0 && items.length < 6) advice.push('Six or more skills reads as substantial');
      return {
        complete: items.length >= 3,
        blocking: items.length === 0 ? ['At least a few skills'] : [],
        advice,
        started: items.length > 0,
      };
    }

    case 'extras': {
      const projects = resume.projects.filter((p) => filled(p.name) || p.bullets.some(filled));
      const certs = resume.certifications.filter((c) => filled(c.name));
      return {
        complete: projects.length + certs.length > 0,
        blocking: [],
        advice: [],
        started: projects.length + certs.length > 0,
      };
    }

    case 'summary': {
      const words = wordCount(resume.summary);
      const advice: string[] = [];
      if (words > 90) advice.push('Trim to under 90 words — this gets about four seconds of attention');
      if (words > 0 && words < 25) advice.push('Under 25 words rarely says anything');
      return { complete: words >= 25 && words <= 90, blocking: [], advice, started: words > 0 };
    }

    case 'review':
      return { ...EMPTY, complete: true, started: true };

    default:
      return EMPTY;
  }
}

/** Fraction of the non-optional steps that are done, 0..1. */
export function overallProgress(resume: ResumeData): number {
  const counted = STEPS.filter((step) => step.id !== 'review');
  const done = counted.filter((step) => {
    const state = stepState(resume, step.id);
    return step.optional ? state.started || state.complete : state.complete;
  });
  return counted.length ? done.length / counted.length : 0;
}

export function isResumeEmpty(resume: ResumeData): boolean {
  return (
    !Object.values(resume.contact).some(filled) &&
    !filled(resume.summary) &&
    !resume.experience.some((role) => filled(role.role) || filled(role.company) || role.bullets.some(filled)) &&
    !resume.education.some((entry) => filled(entry.degree) || filled(entry.school)) &&
    !resume.skills.some((group) => group.items.filter(filled).length > 0)
  );
}
