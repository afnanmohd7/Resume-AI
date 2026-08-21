import type { IssueLevel, ResumeData } from '../types';
import { analyzeBullet, repeatedOpeners } from './bullets';
import {
  ALL_SKILLS,
  canonicalSkill,
  detectDomain,
  isKnownSkill,
  isSoftSkill,
  skillLabel,
  surfaceForms,
  type Domain,
} from './taxonomy';
import { STOPWORDS, canonical, clamp, hasMetric, ngrams, overlap, tokenize, wordCount } from './text';

/** Flattened once at module load; scanned per JD line during extraction. */
const KNOWN_SKILL_KEYS: string[] = Array.from(ALL_SKILLS.keys());

export interface Keyword {
  term: string;
  display: string;
  weight: number;
  isSkill: boolean;
  matched: boolean;
}

export interface CheckItem {
  id: string;
  label: string;
  detail: string;
  passed: boolean;
  level: IssueLevel;
}

export interface Suggestion {
  keyword: string;
  where: string;
  hint: string;
}

export interface AtsReport {
  overall: number;
  hasJD: boolean;
  domain: Domain;
  keywordScore: number;
  skillScore: number;
  structureScore: number;
  qualityScore: number;
  keywords: Keyword[];
  matched: Keyword[];
  missing: Keyword[];
  checks: CheckItem[];
  quantifiedRatio: number;
  averageBulletScore: number;
  suggestions: Suggestion[];
}

/** Headings under which a JD lists the things it actually screens for. */
const REQUIREMENT_HEADINGS =
  /\b(requirements?|qualifications?|what you.{0,6}ll need|must have|we.{0,6}re looking for|skills?|about you|your profile|essential)\b/i;
const NICE_TO_HAVE = /\b(nice to have|bonus|preferred|plus if|desirable)\b/i;

export function allBullets(resume: ResumeData): string[] {
  return [
    ...resume.experience.flatMap((role) => role.bullets),
    ...resume.projects.flatMap((project) => project.bullets),
  ].filter((bullet) => bullet.trim().length > 0);
}

export function resumeText(resume: ResumeData): string {
  const { contact } = resume;
  return [
    contact.fullName,
    contact.headline,
    resume.summary,
    ...resume.experience.flatMap((role) => [role.role, role.company, ...role.bullets]),
    ...resume.education.flatMap((entry) => [entry.degree, entry.school, entry.detail]),
    ...resume.skills.flatMap((group) => [group.label, ...group.items]),
    ...resume.projects.flatMap((project) => [project.name, project.stack, ...project.bullets]),
    ...resume.certifications.flatMap((cert) => [cert.name, cert.issuer]),
  ]
    .filter(Boolean)
    .join(' \n ');
}

/**
 * Pulls the terms a job description is really screening for: known hard skills
 * first, then repeated multi-word phrases, then frequent single words. Terms
 * appearing under a requirements heading are weighted up; "nice to have"
 * sections are weighted down so they cannot dominate the score.
 */
export function extractKeywords(jd: string): Keyword[] {
  if (!jd.trim()) return [];

  const lines = jd.split(/\r?\n/);
  const weightedLines: Array<{ text: string; factor: number }> = [];
  let factor = 1;
  for (const line of lines) {
    if (REQUIREMENT_HEADINGS.test(line) && line.trim().length < 80) factor = 1.8;
    else if (NICE_TO_HAVE.test(line) && line.trim().length < 80) factor = 0.6;
    else if (/^\s*$/.test(line)) factor = factor === 1.8 ? 1.8 : 1;
    weightedLines.push({ text: line, factor });
  }

  const scores = new Map<string, { weight: number; count: number; display: string; isSkill: boolean }>();
  const add = (term: string, weight: number, display: string, isSkill: boolean) => {
    const key = canonicalSkill(term);
    if (!key || key.length < 2) return;
    const existing = scores.get(key);
    if (existing) {
      existing.weight += weight;
      existing.count += 1;
      if (isSkill) existing.isSkill = true;
    } else {
      scores.set(key, { weight, count: 1, display, isSkill });
    }
  };

  for (const { text, factor: lineFactor } of weightedLines) {
    // Known hard skills are the highest-signal terms in any posting and are
    // matched against the whole line, before it is cut up.
    const paddedLine = ` ${canonical(text)} `;
    for (const form of KNOWN_SKILL_KEYS) {
      if (paddedLine.includes(` ${form} `)) add(form, 3 * lineFactor, form, true);
    }

    // Phrases are only built inside a clause. Without this, "Figma and modern
    // prototyping" yields the meaningless bigram "figma and modern".
    const segments = text.split(/[,;:()[\]/|•·—–]| \band\b | \bor\b /i);
    for (const segment of segments) {
      const tokens = tokenize(segment);
      for (const size of [3, 2]) {
        for (const phrase of ngrams(tokens, size)) {
          const parts = phrase.split(' ');
          // A stopword anywhere means the phrase spans a grammatical joint.
          if (parts.some((part) => STOPWORDS.has(part) || part.length < 3)) continue;
          add(phrase, (size === 3 ? 1.1 : 1.4) * lineFactor, phrase, isKnownSkill(phrase));
        }
      }
      for (const token of tokens) {
        if (STOPWORDS.has(token) || token.length < 3 || /^\d+$/.test(token)) continue;
        add(token, 0.8 * lineFactor, token, isKnownSkill(token));
      }
    }
  }

  const ranked = Array.from(scores.entries())
    .map(([term, meta]) => ({ term, ...meta }))
    // A phrase mentioned once in passing is not what the posting screens on.
    // Recognised skills earn their place on the first mention.
    .filter((entry) => entry.isSkill || entry.count >= 2)
    .sort((a, b) => b.weight - a.weight);

  // Drop a short term when a higher-ranked phrase already contains it.
  const kept: typeof ranked = [];
  for (const candidate of ranked) {
    const covered = kept.some(
      (other) => other.term !== candidate.term && ` ${other.term} `.includes(` ${candidate.term} `),
    );
    if (!covered) kept.push(candidate);
    if (kept.length >= 28) break;
  }

  return kept.map((entry) => ({
    term: entry.term,
    display: entry.isSkill ? skillLabel(entry.term) : entry.display,
    weight: Math.round(entry.weight * 10) / 10,
    isSkill: entry.isSkill,
    matched: false,
  }));
}

/**
 * A term counts as covered when it (or an alias) appears verbatim. For loose
 * descriptive phrases we also accept all the words being present separately —
 * "accessibility standards" is covered by a resume listing "Accessibility" and
 * "WCAG". Recognised hard skills always require a verbatim match, so
 * "product analytics" is never satisfied by "Product" plus "Analytics".
 */
function isPresent(term: string, haystack: string, isSkill: boolean): boolean {
  if (surfaceForms(term).some((form) => haystack.includes(` ${form} `))) return true;
  if (isSkill) return false;
  const parts = term.split(' ').filter((part) => part.length > 2 && !STOPWORDS.has(part));
  return parts.length > 1 && parts.every((part) => haystack.includes(` ${part} `));
}

function structureChecks(resume: ResumeData, measuredPages: number | null): CheckItem[] {
  const { contact } = resume;
  const bullets = allBullets(resume);
  const checks: CheckItem[] = [];
  const push = (id: string, label: string, passed: boolean, detail: string, level: IssueLevel = 'warn') =>
    checks.push({ id, label, passed, detail, level });

  push('name', 'Name present', Boolean(contact.fullName.trim()), 'Parsers key on the name at the top of the document.', 'error');
  push(
    'email',
    'Reachable email',
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email.trim()),
    'A valid email is the single most important field for an applicant tracking system.',
    'error',
  );
  push('phone', 'Phone number', contact.phone.trim().length >= 7, 'Recruiters still call. Include a number with country code if applying abroad.');
  push('location', 'Location', Boolean(contact.location.trim()), 'City and country help with location filters — a full street address is unnecessary.', 'info');
  push('experience', 'Work history', resume.experience.length > 0, 'At least one role with dates is required for most parsers to build a profile.', 'error');
  push(
    'dates',
    'Every role dated',
    resume.experience.every((role) => role.start.trim() && (role.current || role.end.trim())),
    'Missing dates create gaps a screener will read as a red flag.',
  );
  push(
    'bulletCount',
    'Bullets per role',
    resume.experience.every((role) => role.bullets.filter(Boolean).length >= 2 && role.bullets.length <= 8),
    'Aim for 3–6 bullets per role; more than 8 dilutes your strongest points.',
    'info',
  );
  push('skills', 'Skills listed', resume.skills.flatMap((group) => group.items).filter(Boolean).length >= 6, 'A skills block gives keyword parsers something clean to read. List at least 6.');
  push(
    'summary',
    'Summary length',
    (() => {
      const words = wordCount(resume.summary);
      return words === 0 || (words >= 25 && words <= 90);
    })(),
    'Keep the summary between 25 and 90 words, or leave it out entirely.',
    'info',
  );
  push(
    'quantified',
    'Quantified bullets',
    bullets.length > 0 && bullets.filter(hasMetric).length / bullets.length >= 0.4,
    'At least 40% of bullets should carry a number. Numbers are what get remembered.',
  );
  push(
    'firstPerson',
    'No first person',
    !/\b(I|my|me)\b/.test(bullets.join(' ') + ' ' + resume.summary),
    'Resume convention drops “I” and “my” — the implied subject is you.',
    'info',
  );
  push(
    'variety',
    'Verb variety',
    resume.experience.every((role) => repeatedOpeners(role.bullets).length === 0),
    'Repeating the same opening verb within a role makes the writing flat.',
    'info',
  );
  if (measuredPages !== null) {
    push(
      'length',
      'Page count',
      measuredPages <= 2,
      `Your resume renders to ${measuredPages} page${measuredPages === 1 ? '' : 's'}. One page is expected under ~10 years of experience; two is the ceiling for most roles.`,
    );
  }
  push(
    'placeholders',
    'No unfilled placeholders',
    !/\[[XN][^\]]*\]|\[timeframe\]|\[metric\]/i.test(resumeText(resume)),
    'Bracketed slots like [X]% are drafting aids — replace them before you export.',
    'error',
  );

  return checks;
}

export function scoreResume(
  resume: ResumeData,
  jobDescription: string,
  options: { measuredPages?: number | null } = {},
): AtsReport {
  const measuredPages = options.measuredPages ?? null;
  const text = ` ${canonical(resumeText(resume))} `;
  const bullets = allBullets(resume);
  const domain = detectDomain(
    [resume.contact.headline, ...resume.experience.map((role) => role.role)],
    resumeText(resume),
  );

  const keywords = extractKeywords(jobDescription).map((keyword) => ({
    ...keyword,
    matched: isPresent(keyword.term, text, keyword.isSkill),
  }));
  const hasJD = keywords.length > 0;

  const totalWeight = keywords.reduce((sum, keyword) => sum + keyword.weight, 0);
  const matchedWeight = keywords.filter((k) => k.matched).reduce((sum, k) => sum + k.weight, 0);
  const keywordScore = totalWeight ? clamp((matchedWeight / totalWeight) * 100, 0, 100) : 0;

  const skillKeywords = keywords.filter((keyword) => keyword.isSkill && !isSoftSkill(keyword.term));
  const skillScore = skillKeywords.length
    ? clamp((skillKeywords.filter((k) => k.matched).length / skillKeywords.length) * 100, 0, 100)
    : 0;

  const checks = structureChecks(resume, measuredPages);
  const weightedChecks = checks.map((check) => ({
    passed: check.passed,
    weight: check.level === 'error' ? 3 : check.level === 'warn' ? 2 : 1,
  }));
  const checkTotal = weightedChecks.reduce((sum, c) => sum + c.weight, 0);
  const structureScore = checkTotal
    ? clamp((weightedChecks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0) / checkTotal) * 100, 0, 100)
    : 0;

  const analyses = bullets.map(analyzeBullet);
  const averageBulletScore = analyses.length
    ? analyses.reduce((sum, analysis) => sum + analysis.score, 0) / analyses.length
    : 0;
  const quantifiedRatio = bullets.length ? bullets.filter(hasMetric).length / bullets.length : 0;
  const qualityScore = clamp(averageBulletScore * 0.7 + quantifiedRatio * 100 * 0.3, 0, 100);

  const overall = hasJD
    ? Math.round(keywordScore * 0.42 + skillScore * 0.18 + structureScore * 0.22 + qualityScore * 0.18)
    : Math.round(structureScore * 0.55 + qualityScore * 0.45);

  const missing = keywords.filter((keyword) => !keyword.matched);
  const suggestions = buildSuggestions(missing, resume);

  return {
    overall: clamp(overall, 0, 100),
    hasJD,
    domain,
    keywordScore: Math.round(keywordScore),
    skillScore: Math.round(skillScore),
    structureScore: Math.round(structureScore),
    qualityScore: Math.round(qualityScore),
    keywords,
    matched: keywords.filter((keyword) => keyword.matched),
    missing,
    checks,
    quantifiedRatio,
    averageBulletScore: Math.round(averageBulletScore),
    suggestions,
  };
}

/**
 * For each missing keyword, names the most plausible home for it: the skills
 * block for hard skills, otherwise the existing bullet it is closest to.
 */
function buildSuggestions(missing: Keyword[], resume: ResumeData): Suggestion[] {
  const out: Suggestion[] = [];
  for (const keyword of missing.slice(0, 12)) {
    if (keyword.isSkill && !isSoftSkill(keyword.term)) {
      out.push({
        keyword: keyword.display,
        where: 'Skills',
        hint: `Add “${keyword.display}” to your skills block — but only if you have genuinely used it.`,
      });
      continue;
    }

    let bestScore = 0;
    let bestLabel = '';
    let bestBullet = '';
    for (const role of resume.experience) {
      for (const bullet of role.bullets) {
        const score = overlap(keyword.term, bullet);
        if (score > bestScore) {
          bestScore = score;
          bestLabel = `${role.role || 'Experience'}${role.company ? ` · ${role.company}` : ''}`;
          bestBullet = bullet;
        }
      }
    }

    if (bestScore >= 0.15 && bestBullet) {
      out.push({
        keyword: keyword.display,
        where: bestLabel,
        hint: `Closest bullet: “${bestBullet.slice(0, 90)}${bestBullet.length > 90 ? '…' : ''}” — work the phrase in if it honestly applies.`,
      });
    } else {
      out.push({
        keyword: keyword.display,
        where: 'Summary',
        hint: `Nothing in your resume covers “${keyword.display}”. If you have the experience, give it a bullet; if not, skip it.`,
      });
    }
  }
  return out;
}

export function scoreBand(score: number): { label: string; tone: 'good' | 'ok' | 'poor' } {
  if (score >= 80) return { label: 'Strong match', tone: 'good' };
  if (score >= 60) return { label: 'Competitive', tone: 'ok' };
  if (score >= 40) return { label: 'Needs work', tone: 'poor' };
  return { label: 'Weak match', tone: 'poor' };
}
