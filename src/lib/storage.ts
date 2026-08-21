import type {
  AppState,
  CertificationItem,
  Contact,
  DesignSettings,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeData,
  SectionKey,
  SkillGroup,
  TemplateId,
} from '../types';
import { stableId } from './text';

export const STORAGE_KEY = 'resume-ai.state.v1';
export const SCHEMA_VERSION = 1;

/* ------------------------------------------------------------------ *
 * Import hardening
 *
 * A resume JSON file can come from anywhere — a forum, a friend, a
 * "template pack" download. It is the only untrusted input in the app, so it
 * is rebuilt field by field against a whitelist rather than trusted or merged.
 * Nothing from the file reaches React except plain, length-capped strings.
 * ------------------------------------------------------------------ */

const LIMITS = {
  short: 200,
  medium: 600,
  long: 6000,
  bullets: 40,
  items: 60,
  groups: 20,
  skillsPerGroup: 60,
  file: 2_000_000,
} as const;

/**
 * Strips control characters, zero-width characters and bidi overrides, keeping
 * only tab and newline. Bidi marks matter here: a U+202E inside an imported
 * job title can visually reverse the text around it, which is a cheap way to
 * make a file display something other than what it actually contains.
 */
const UNSAFE_CHARS =
  /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

function str(value: unknown, max: number = LIMITS.medium): string {
  if (typeof value !== 'string') return '';
  return value.replace(UNSAFE_CHARS, '').slice(0, max);
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, parsed));
}

function arr(value: unknown, max: number): unknown[] {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringList(value: unknown, max: number, maxLength: number): string[] {
  return arr(value, max)
    .map((entry) => str(entry, maxLength))
    .filter((entry) => entry.trim().length > 0);
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const TEMPLATES: TemplateId[] = ['classic', 'modern', 'compact', 'minimal'];
const SECTION_KEYS: SectionKey[] = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];

function sanitizeContact(value: unknown): Contact {
  const source = obj(value);
  return {
    fullName: str(source.fullName, LIMITS.short),
    headline: str(source.headline, LIMITS.short),
    email: str(source.email, LIMITS.short),
    phone: str(source.phone, LIMITS.short),
    location: str(source.location, LIMITS.short),
    website: str(source.website, LIMITS.short),
    linkedin: str(source.linkedin, LIMITS.short),
    github: str(source.github, LIMITS.short),
  };
}

function sanitizeExperience(value: unknown): ExperienceItem[] {
  return arr(value, LIMITS.items).map((entry) => {
    const source = obj(entry);
    return {
      id: str(source.id, 40) || stableId('exp'),
      role: str(source.role, LIMITS.short),
      company: str(source.company, LIMITS.short),
      location: str(source.location, LIMITS.short),
      start: str(source.start, 40),
      end: str(source.end, 40),
      current: bool(source.current),
      bullets: stringList(source.bullets, LIMITS.bullets, LIMITS.medium),
    };
  });
}

function sanitizeEducation(value: unknown): EducationItem[] {
  return arr(value, LIMITS.items).map((entry) => {
    const source = obj(entry);
    return {
      id: str(source.id, 40) || stableId('edu'),
      degree: str(source.degree, LIMITS.short),
      school: str(source.school, LIMITS.short),
      location: str(source.location, LIMITS.short),
      start: str(source.start, 40),
      end: str(source.end, 40),
      detail: str(source.detail, LIMITS.medium),
    };
  });
}

function sanitizeProjects(value: unknown): ProjectItem[] {
  return arr(value, LIMITS.items).map((entry) => {
    const source = obj(entry);
    return {
      id: str(source.id, 40) || stableId('prj'),
      name: str(source.name, LIMITS.short),
      link: str(source.link, LIMITS.short),
      stack: str(source.stack, LIMITS.short),
      bullets: stringList(source.bullets, LIMITS.bullets, LIMITS.medium),
    };
  });
}

function sanitizeSkills(value: unknown): SkillGroup[] {
  return arr(value, LIMITS.groups).map((entry) => {
    const source = obj(entry);
    return {
      id: str(source.id, 40) || stableId('skl'),
      label: str(source.label, LIMITS.short),
      items: stringList(source.items, LIMITS.skillsPerGroup, 80),
    };
  });
}

function sanitizeCertifications(value: unknown): CertificationItem[] {
  return arr(value, LIMITS.items).map((entry) => {
    const source = obj(entry);
    return {
      id: str(source.id, 40) || stableId('crt'),
      name: str(source.name, LIMITS.short),
      issuer: str(source.issuer, LIMITS.short),
      date: str(source.date, 40),
      credential: str(source.credential, LIMITS.short),
    };
  });
}

function sanitizeSectionOrder(value: unknown): SectionKey[] {
  const listed = arr(value, 12)
    .map((entry) => str(entry, 40))
    .filter((entry): entry is SectionKey => (SECTION_KEYS as string[]).includes(entry));
  const deduped = Array.from(new Set(listed));
  // Any section missing from the file is appended so nothing silently vanishes.
  return [...deduped, ...SECTION_KEYS.filter((key) => !deduped.includes(key))];
}

function sanitizeHeadings(value: unknown): Partial<Record<SectionKey, string>> {
  const source = obj(value);
  const out: Partial<Record<SectionKey, string>> = {};
  for (const key of SECTION_KEYS) {
    const heading = str(source[key], 60);
    if (heading) out[key] = heading;
  }
  return out;
}

export function sanitizeResume(value: unknown): ResumeData {
  const source = obj(value);
  return {
    contact: sanitizeContact(source.contact),
    summary: str(source.summary, LIMITS.long),
    experience: sanitizeExperience(source.experience),
    education: sanitizeEducation(source.education),
    skills: sanitizeSkills(source.skills),
    projects: sanitizeProjects(source.projects),
    certifications: sanitizeCertifications(source.certifications),
    sectionOrder: sanitizeSectionOrder(source.sectionOrder),
    hidden: arr(source.hidden, 12)
      .map((entry) => str(entry, 40))
      .filter((entry): entry is SectionKey => (SECTION_KEYS as string[]).includes(entry)),
    headings: sanitizeHeadings(source.headings),
  };
}

export function sanitizeDesign(value: unknown, fallback: DesignSettings): DesignSettings {
  const source = obj(value);
  const template = str(source.template, 20) as TemplateId;
  const accent = str(source.accent, 20);
  const family = str(source.fontFamily, 10);
  return {
    template: TEMPLATES.includes(template) ? template : fallback.template,
    accent: HEX_COLOR.test(accent) ? accent : fallback.accent,
    fontFamily: family === 'serif' || family === 'sans' ? family : fallback.fontFamily,
    fontScale: num(source.fontScale, fallback.fontScale, 0.8, 1.25),
    lineHeight: num(source.lineHeight, fallback.lineHeight, 1.1, 1.9),
    sectionGap: num(source.sectionGap, fallback.sectionGap, 4, 28),
    margin: num(source.margin, fallback.margin, 24, 88),
    paper: str(source.paper, 10) === 'letter' ? 'letter' : 'a4',
    uppercaseHeadings: bool(source.uppercaseHeadings, fallback.uppercaseHeadings),
    showIcons: bool(source.showIcons, fallback.showIcons),
    bulletPeriods: bool(source.bulletPeriods, fallback.bulletPeriods),
  };
}

export function sanitizeState(value: unknown, defaults: AppState): AppState {
  const source = obj(value);
  return {
    resume: sanitizeResume(source.resume),
    design: sanitizeDesign(source.design, defaults.design),
    jobDescription: str(source.jobDescription, 20000),
    coverLetter: str(source.coverLetter, 20000),
  };
}

/* ------------------------------------------------------------------ *
 * Persistence
 * ------------------------------------------------------------------ */

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, savedAt: new Date().toISOString(), ...state }),
    );
  } catch {
    // Private browsing or a full quota — the app keeps working in memory.
  }
}

export function loadState(defaults: AppState): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeState(JSON.parse(raw), defaults);
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}

export function toExportJSON(state: AppState): string {
  return JSON.stringify(
    { app: 'Resume AI', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), ...state },
    null,
    2,
  );
}

export interface ImportResult {
  ok: boolean;
  state?: AppState;
  error?: string;
}

export function fromImportJSON(raw: string, defaults: AppState): ImportResult {
  if (raw.length > LIMITS.file) {
    return { ok: false, error: 'That file is larger than 2 MB — it is not a Resume AI export.' };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  const source = obj(parsed);
  if (!source.resume) {
    return { ok: false, error: 'No resume data found in that file.' };
  }
  const state = sanitizeState(source, defaults);
  if (!state.resume.contact.fullName && !state.resume.experience.length) {
    return { ok: false, error: 'That file parsed, but contained no usable resume content.' };
  }
  return { ok: true, state };
}

/** Triggers a download without ever touching the network. */
export function downloadFile(filename: string, contents: string, mime = 'application/json'): void {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Only http(s) and mailto survive — blocks javascript: and data: in links. */
export function safeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}
