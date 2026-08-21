import type { ResumeData } from '../types';
import { analyzeBullet } from './bullets';
import { yearsOfExperience } from './dates';
import { DOMAIN_LABELS, detectDomain, extractSkills } from './taxonomy';
import { hasMetric, tidy, uniq, wordCount } from './text';
import { resumeText } from './ats';

export interface SummaryDraft {
  text: string;
  style: string;
  note: string;
}

function topSkills(resume: ResumeData, limit: number): string[] {
  const declared = resume.skills.flatMap((group) => group.items).filter(Boolean);
  const inferred = extractSkills(resumeText(resume));
  return uniq([...declared, ...inferred])
    .filter((skill) => skill.length > 1)
    .slice(0, limit);
}

/** The most quantified, highest-scoring bullet, trimmed to a clause. */
function headlineAchievement(resume: ResumeData): string {
  const candidates = resume.experience
    .flatMap((role) => role.bullets)
    .filter((bullet) => bullet.trim().length > 15)
    .map((bullet) => ({ bullet, score: analyzeBullet(bullet).score + (hasMetric(bullet) ? 20 : 0) }))
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return '';
  let text = candidates[0].bullet.trim().replace(/\.$/, '');
  // Keep the first two clauses so the summary stays readable.
  const parts = text.split(/,\s+/);
  if (parts.length > 2) text = parts.slice(0, 2).join(', ');
  return tidy(text);
}

function currentTitle(resume: ResumeData): string {
  if (resume.contact.headline.trim()) return resume.contact.headline.trim();
  const current = resume.experience.find((role) => role.current) ?? resume.experience[0];
  return current?.role?.trim() || 'Professional';
}

function yearsPhrase(years: number): string {
  if (years >= 1.5) return `${Math.floor(years)}+ years of experience`;
  if (years > 0) return 'hands-on experience';
  return 'a track record';
}

export function generateSummaries(resume: ResumeData): SummaryDraft[] {
  const title = currentTitle(resume);
  const years = yearsOfExperience(resume.experience);
  const domain = detectDomain([resume.contact.headline, ...resume.experience.map((r) => r.role)], resumeText(resume));
  const skills = topSkills(resume, 6);
  const achievement = headlineAchievement(resume);
  const companies = uniq(resume.experience.map((role) => role.company).filter(Boolean));
  const degree = resume.education[0]?.degree?.trim() ?? '';

  const skillPhrase = skills.length
    ? skills.slice(0, 4).join(', ').replace(/,([^,]*)$/, ' and$1')
    : DOMAIN_LABELS[domain].toLowerCase();

  const achievementSentence = achievement
    ? `Recent work includes ${achievement.charAt(0).toLowerCase()}${achievement.slice(1)}.`
    : '';

  const drafts: SummaryDraft[] = [];

  drafts.push({
    style: 'Concise',
    note: 'Two lines. The safest default and the easiest to scan.',
    text: tidy(
      `${title} with ${yearsPhrase(years)} across ${skillPhrase}. ${achievementSentence} Looking to bring the same focus on measurable outcomes to the next role.`,
    ),
  });

  drafts.push({
    style: 'Impact-forward',
    note: 'Leads with your strongest result — use when your numbers are the selling point.',
    text: tidy(
      achievement
        ? `${achievement.charAt(0).toUpperCase()}${achievement.slice(1)}. ${title} with ${yearsPhrase(years)}${companies.length ? ` at ${companies.slice(0, 2).join(' and ')}` : ''}, specialising in ${skillPhrase}.`
        : `${title} with ${yearsPhrase(years)}, specialising in ${skillPhrase}. Known for turning ambiguous problems into shipped, measurable work.`,
    ),
  });

  drafts.push({
    style: 'Skills-first',
    note: 'Front-loads keywords — helpful when a resume screener reads only the top third.',
    text: tidy(
      `${title} skilled in ${skillPhrase}. ${yearsPhrase(years).replace(/^\w/, (c) => c.toUpperCase())} delivering ${DOMAIN_LABELS[domain].toLowerCase()} work${companies.length ? ` for teams including ${companies[0]}` : ''}. ${achievementSentence}`,
    ),
  });

  if (degree && years < 2) {
    drafts.push({
      style: 'Early career',
      note: 'Leads with education and potential rather than years served.',
      text: tidy(
        `${degree} graduate moving into ${DOMAIN_LABELS[domain].toLowerCase()}, with practical experience in ${skillPhrase}. ${achievementSentence} Fast to learn, comfortable owning work end to end, and looking for a first team to grow with.`,
      ),
    });
  }

  return drafts.map((draft) => ({ ...draft, text: tidy(draft.text) })).filter((draft) => wordCount(draft.text) > 8);
}
