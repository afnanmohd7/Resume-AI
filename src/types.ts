export interface Contact {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
  detail: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  link: string;
  stack: string;
  bullets: string[];
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  credential: string;
}

export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications';

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
};

export interface ResumeData {
  contact: Contact;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  sectionOrder: SectionKey[];
  hidden: SectionKey[];
  headings: Partial<Record<SectionKey, string>>;
}

export type TemplateId = 'classic' | 'modern' | 'compact' | 'minimal';

export interface DesignSettings {
  template: TemplateId;
  accent: string;
  fontFamily: 'sans' | 'serif';
  fontScale: number;
  lineHeight: number;
  sectionGap: number;
  margin: number;
  paper: 'a4' | 'letter';
  uppercaseHeadings: boolean;
  showIcons: boolean;
  bulletPeriods: boolean;
}

export interface AppState {
  resume: ResumeData;
  design: DesignSettings;
  jobDescription: string;
  coverLetter: string;
}

/** Severity ordering matters: the UI sorts and colour-codes on it. */
export type IssueLevel = 'error' | 'warn' | 'info';

export interface BulletIssue {
  level: IssueLevel;
  label: string;
  detail: string;
}

export interface BulletAnalysis {
  score: number;
  issues: BulletIssue[];
  strengths: string[];
  wordCount: number;
  hasMetric: boolean;
}
