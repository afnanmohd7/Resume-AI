import type { ResumeData } from '../types';
import { extractKeywords, resumeText } from './ats';
import { yearsOfExperience } from './dates';
import {
  canonicalSkill,
  detectDomain,
  extractSkills,
  isKnownSkill,
  skillLabel,
  type Domain,
} from './taxonomy';
import { canonical, hasMetric, overlap, tidy, uniq } from './text';

export type LetterTone = 'professional' | 'warm' | 'direct';

export interface CoverLetterOptions {
  company: string;
  role: string;
  hiringManager: string;
  tone: LetterTone;
  includeDate: boolean;
}

export const TONE_LABELS: Record<LetterTone, string> = {
  professional: 'Professional',
  warm: 'Warm',
  direct: 'Direct',
};

/**
 * Plain-prose names for each field. DOMAIN_LABELS are UI chips ("Design &
 * Creative") and read badly inside a sentence.
 */
const DOMAIN_PROSE: Record<Domain, string> = {
  engineering: 'software engineering',
  data: 'data and analytics',
  design: 'product design',
  product: 'product management',
  marketing: 'marketing',
  sales: 'sales',
  finance: 'finance',
  operations: 'operations',
  support: 'customer support',
  healthcare: 'healthcare',
  education: 'education',
  general: 'my field',
};

/**
 * Best-effort pull of the role title and company name out of a raw posting.
 *
 * Company detection is deliberately conservative and confined to the opening
 * lines: scanning the whole body once produced "Familiarity with HTML" ->
 * company "HTML". A blank company is far better than a wrong one, and the
 * field is editable either way.
 */
export function guessJobMeta(jd: string): { role: string; company: string } {
  const lines = jd
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let role = '';
  let company = '';

  const labelledRole = jd.match(/^(?:job title|position|role)\s*[:\-]\s*(.+)$/im);
  if (labelledRole) role = labelledRole[1].trim();
  const labelledCompany = jd.match(/^(?:company|organisation|organization|employer)\s*[:\-]\s*(.+)$/im);
  if (labelledCompany) company = labelledCompany[1].trim();

  if (!role && lines.length) {
    const first = lines[0];
    if (first.length <= 90 && !/[.!?]$/.test(first)) {
      // "Senior Product Designer — Fintech Platform" -> the title only.
      role = first.split(/\s+[—–|]\s+|\s+\u2013\s+/)[0].trim();
    }
  }

  if (!company) {
    const header = lines.slice(0, 6).join('\n');
    const atMatch = header.match(
      /\b(?:at|join|for)\s+([A-Z][\w&.'-]*(?:\s+[A-Z][\w&.'-]*){0,3})(?=[\s,.]|$)/,
    );
    const candidate = atMatch?.[1]?.trim() ?? '';
    // Reject anything that is really a technology or a bare acronym.
    const looksLikeTech = candidate ? isKnownSkill(candidate) : true;
    const looksLikeAcronym = /^[A-Z]{2,5}$/.test(candidate);
    if (candidate && !looksLikeTech && !looksLikeAcronym) company = candidate;
  }

  return { role: role.slice(0, 80), company: company.slice(0, 60) };
}

/** Ranks the resume's bullets by relevance to the posting. */
function relevantAchievements(resume: ResumeData, jd: string, limit: number): string[] {
  const keywords = extractKeywords(jd).slice(0, 20);
  const scored = resume.experience
    .flatMap((role) => role.bullets.map((bullet) => ({ bullet, company: role.company })))
    .filter((entry) => entry.bullet.trim().length > 20)
    .map((entry) => {
      const keywordScore = keywords.reduce(
        (sum, keyword) =>
          ` ${canonical(entry.bullet)} `.includes(` ${keyword.term} `) ? sum + keyword.weight : sum,
        0,
      );
      const looseScore = keywords.reduce((sum, keyword) => sum + overlap(keyword.term, entry.bullet), 0);
      return {
        ...entry,
        score: keywordScore * 2 + looseScore + (hasMetric(entry.bullet) ? 3 : 0),
      };
    })
    .sort((a, b) => b.score - a.score);

  return uniq(scored.map((entry) => entry.bullet)).slice(0, limit);
}

function toClause(bullet: string): string {
  const text = tidy(bullet.replace(/\.$/, ''));
  if (!text) return '';
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

const OPENERS: Record<LetterTone, (role: string, company: string) => string> = {
  professional: (role, company) =>
    `I am writing to apply for the ${role} position at ${company}.`,
  warm: (role, company) =>
    `I was glad to come across the ${role} opening at ${company} — it lines up closely with the work I most want to be doing.`,
  direct: (role, company) => `I am applying for the ${role} role at ${company}. Here is why I am a fit.`,
};

const CLOSERS: Record<LetterTone, (company: string) => string> = {
  professional: (company) =>
    `Thank you for considering my application. I would welcome the chance to discuss how my experience could support ${company}'s goals.`,
  warm: (company) =>
    `I would love to talk about what ${company} is building and where I could help. Thank you for your time and consideration.`,
  direct: (company) =>
    `I would like to discuss the role in more detail. I am available at your convenience and can start on ${company}'s timeline.`,
};

const SIGN_OFFS: Record<LetterTone, string> = {
  professional: 'Sincerely,',
  warm: 'Warm regards,',
  direct: 'Best regards,',
};

export function generateCoverLetter(
  resume: ResumeData,
  jobDescription: string,
  options: CoverLetterOptions,
): string {
  const company = options.company.trim() || 'your organisation';
  const role = options.role.trim() || resume.contact.headline.trim() || 'the advertised role';
  const greetingName = options.hiringManager.trim();
  const greeting = greetingName ? `Dear ${greetingName},` : 'Dear Hiring Team,';

  const years = yearsOfExperience(resume.experience);
  const domain = detectDomain(
    [resume.contact.headline, ...resume.experience.map((r) => r.role)],
    resumeText(resume),
  );
  const currentRole = resume.experience.find((r) => r.current) ?? resume.experience[0];
  const title = resume.contact.headline.trim() || currentRole?.role || 'professional';

  // Ordered by how heavily the posting leans on each skill, so the letter
  // opens with the requirements rather than the "nice to have" list.
  const mySkills = new Set(extractSkills(resumeText(resume)).map(canonicalSkill));
  const shared = extractKeywords(jobDescription)
    .filter((keyword) => keyword.isSkill && mySkills.has(canonicalSkill(keyword.term)))
    .map((keyword) => keyword.term)
    .slice(0, 5);
  const sharedLabels = shared.map((skill) => skillLabel(skill, true));
  const skillPhrase = (sharedLabels.length ? sharedLabels : [...mySkills].slice(0, 4).map((skill) => skillLabel(skill, true)))
    .join(', ')
    .replace(/,([^,]*)$/, ' and$1');

  const achievements = relevantAchievements(resume, jobDescription, 3);

  const experienceLine = years >= 1.5
    ? `I am a ${title} with ${Math.floor(years)}+ years in ${DOMAIN_PROSE[domain]}`
    : `I am a ${title} building a career in ${DOMAIN_PROSE[domain]}`;

  const paragraphs: string[] = [];

  paragraphs.push(
    tidy(
      `${OPENERS[options.tone](role, company)} ${experienceLine}${
        currentRole?.company ? `, most recently at ${currentRole.company}` : ''
      }${skillPhrase ? `, working day to day with ${skillPhrase}` : ''}.`,
    ),
  );

  if (achievements.length) {
    const [first, second, third] = achievements;
    const body = [
      `In my current work I ${toClause(first)}.`,
      second ? `I also ${toClause(second)}.` : '',
      third ? `More recently, I ${toClause(third)}.` : '',
    ]
      .filter(Boolean)
      .join(' ');
    paragraphs.push(tidy(`${body} These are the kinds of results I would aim to repeat at ${company}.`));
  } else {
    paragraphs.push(
      tidy(
        `My background has taught me to own problems end to end — from framing the question through to delivering something measurable. I would bring that same ownership to ${company}.`,
      ),
    );
  }

  if (shared.length) {
    paragraphs.push(
      tidy(
        `Your posting emphasises ${sharedLabels
          .slice(0, 3)
          .join(', ')
          .replace(/,([^,]*)$/, ' and$1')}, which maps directly onto my day-to-day work — and I am comfortable picking up whatever else the team relies on.`,
      ),
    );
  } else if (jobDescription.trim()) {
    paragraphs.push(
      tidy(
        `Having read the posting closely, the part that stands out to me is the scope of ownership on offer. That is the environment where I do my best work.`,
      ),
    );
  }

  paragraphs.push(tidy(CLOSERS[options.tone](company)));

  const header = [
    resume.contact.fullName,
    [resume.contact.email, resume.contact.phone, resume.contact.location].filter(Boolean).join(' · '),
    resume.contact.linkedin,
  ]
    .filter(Boolean)
    .join('\n');

  const date = options.includeDate
    ? new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return [
    header,
    date,
    [greetingName ? '' : '', company !== 'your organisation' ? company : ''].filter(Boolean).join('\n'),
    greeting,
    ...paragraphs,
    `${SIGN_OFFS[options.tone]}\n${resume.contact.fullName}`,
  ]
    .filter((block) => block && block.trim())
    .join('\n\n');
}
