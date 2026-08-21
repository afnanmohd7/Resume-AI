import { create } from 'zustand';
import type {
  AppState,
  CertificationItem,
  Contact,
  DesignSettings,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  SectionKey,
  SkillGroup,
} from './types';
import { defaultState, emptyResume, sampleResume, SAMPLE_JOB_DESCRIPTION } from './lib/defaults';
import { loadState, saveState, clearState } from './lib/storage';
import { stableId } from './lib/text';

const HISTORY_LIMIT = 60;
/** Edits with the same label inside this window collapse into one undo step. */
const COALESCE_MS = 800;

interface Store {
  present: AppState;
  past: AppState[];
  future: AppState[];
  lastLabel: string;
  lastAt: number;
  dirty: boolean;

  mutate: (label: string, recipe: (draft: AppState) => void) => void;
  undo: () => void;
  redo: () => void;
  replaceAll: (state: AppState) => void;

  setContact: (patch: Partial<Contact>) => void;
  setSummary: (value: string) => void;

  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  moveExperience: (id: string, direction: -1 | 1) => void;
  reorderExperience: (fromId: string, toId: string) => void;
  setBullet: (roleId: string, index: number, value: string) => void;
  addBullet: (roleId: string, value?: string) => void;
  removeBullet: (roleId: string, index: number) => void;
  moveBullet: (roleId: string, index: number, direction: -1 | 1) => void;

  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  moveEducation: (id: string, direction: -1 | 1) => void;
  reorderEducation: (fromId: string, toId: string) => void;

  addSkillGroup: () => void;
  updateSkillGroup: (id: string, patch: Partial<SkillGroup>) => void;
  removeSkillGroup: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, patch: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  moveProject: (id: string, direction: -1 | 1) => void;
  reorderProject: (fromId: string, toId: string) => void;
  setProjectBullet: (projectId: string, index: number, value: string) => void;
  addProjectBullet: (projectId: string) => void;
  removeProjectBullet: (projectId: string, index: number) => void;

  addCertification: () => void;
  updateCertification: (id: string, patch: Partial<CertificationItem>) => void;
  removeCertification: (id: string) => void;

  toggleSection: (key: SectionKey) => void;
  moveSection: (key: SectionKey, direction: -1 | 1) => void;
  reorderSection: (from: SectionKey, to: SectionKey) => void;
  renameSection: (key: SectionKey, heading: string) => void;

  setDesign: (patch: Partial<DesignSettings>) => void;
  setJobDescription: (value: string) => void;
  setCoverLetter: (value: string) => void;

  loadSample: () => void;
  resetAll: () => void;
}

function move<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list;
  const next = [...list];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

const initial = loadState(defaultState()) ?? defaultState();

export const useStore = create<Store>((set, get) => ({
  present: initial,
  past: [],
  future: [],
  lastLabel: '',
  lastAt: 0,
  dirty: false,

  /**
   * Every state change funnels through here. A structured clone keeps the
   * recipe simple and guarantees previous snapshots stay frozen for undo.
   */
  mutate(label, recipe) {
    const { present, past, lastLabel, lastAt } = get();
    const next = structuredClone(present) as AppState;
    recipe(next);

    const now = Date.now();
    const coalesce = label === lastLabel && now - lastAt < COALESCE_MS;
    const nextPast = coalesce ? past : [...past, present].slice(-HISTORY_LIMIT);

    set({ present: next, past: nextPast, future: [], lastLabel: label, lastAt: now, dirty: true });
  },

  undo() {
    const { past, present, future } = get();
    if (!past.length) return;
    const previous = past[past.length - 1];
    set({
      present: previous,
      past: past.slice(0, -1),
      future: [present, ...future].slice(0, HISTORY_LIMIT),
      lastLabel: '',
      lastAt: 0,
      dirty: true,
    });
  },

  redo() {
    const { past, present, future } = get();
    if (!future.length) return;
    set({
      present: future[0],
      past: [...past, present].slice(-HISTORY_LIMIT),
      future: future.slice(1),
      lastLabel: '',
      lastAt: 0,
      dirty: true,
    });
  },

  replaceAll(state) {
    const { past, present } = get();
    set({
      present: state,
      past: [...past, present].slice(-HISTORY_LIMIT),
      future: [],
      lastLabel: '',
      lastAt: 0,
      dirty: true,
    });
  },

  setContact(patch) {
    get().mutate('contact', (draft) => {
      draft.resume.contact = { ...draft.resume.contact, ...patch };
    });
  },

  setSummary(value) {
    get().mutate('summary', (draft) => {
      draft.resume.summary = value;
    });
  },

  addExperience() {
    get().mutate('experience:add', (draft) => {
      draft.resume.experience.unshift({
        id: stableId('exp'),
        role: '',
        company: '',
        location: '',
        start: '',
        end: '',
        current: false,
        bullets: [''],
      });
    });
  },

  updateExperience(id, patch) {
    get().mutate(`experience:${id}`, (draft) => {
      const role = draft.resume.experience.find((entry) => entry.id === id);
      if (role) Object.assign(role, patch);
    });
  },

  removeExperience(id) {
    get().mutate('experience:remove', (draft) => {
      draft.resume.experience = draft.resume.experience.filter((entry) => entry.id !== id);
    });
  },

  moveExperience(id, direction) {
    get().mutate('experience:move', (draft) => {
      const index = draft.resume.experience.findIndex((entry) => entry.id === id);
      draft.resume.experience = move(draft.resume.experience, index, direction);
    });
  },

  reorderExperience(fromId, toId) {
    get().mutate('experience:reorder', (draft) => {
      const from = draft.resume.experience.findIndex((entry) => entry.id === fromId);
      const to = draft.resume.experience.findIndex((entry) => entry.id === toId);
      draft.resume.experience = reorder(draft.resume.experience, from, to);
    });
  },

  setBullet(roleId, index, value) {
    get().mutate(`bullet:${roleId}:${index}`, (draft) => {
      const role = draft.resume.experience.find((entry) => entry.id === roleId);
      if (role && index >= 0 && index < role.bullets.length) role.bullets[index] = value;
    });
  },

  addBullet(roleId, value = '') {
    get().mutate('bullet:add', (draft) => {
      const role = draft.resume.experience.find((entry) => entry.id === roleId);
      if (role) role.bullets.push(value);
    });
  },

  removeBullet(roleId, index) {
    get().mutate('bullet:remove', (draft) => {
      const role = draft.resume.experience.find((entry) => entry.id === roleId);
      if (role) role.bullets.splice(index, 1);
    });
  },

  moveBullet(roleId, index, direction) {
    get().mutate('bullet:move', (draft) => {
      const role = draft.resume.experience.find((entry) => entry.id === roleId);
      if (role) role.bullets = move(role.bullets, index, direction);
    });
  },

  addEducation() {
    get().mutate('education:add', (draft) => {
      draft.resume.education.push({
        id: stableId('edu'),
        degree: '',
        school: '',
        location: '',
        start: '',
        end: '',
        detail: '',
      });
    });
  },

  updateEducation(id, patch) {
    get().mutate(`education:${id}`, (draft) => {
      const entry = draft.resume.education.find((item) => item.id === id);
      if (entry) Object.assign(entry, patch);
    });
  },

  removeEducation(id) {
    get().mutate('education:remove', (draft) => {
      draft.resume.education = draft.resume.education.filter((item) => item.id !== id);
    });
  },

  moveEducation(id, direction) {
    get().mutate('education:move', (draft) => {
      const index = draft.resume.education.findIndex((item) => item.id === id);
      draft.resume.education = move(draft.resume.education, index, direction);
    });
  },

  reorderEducation(fromId, toId) {
    get().mutate('education:reorder', (draft) => {
      const from = draft.resume.education.findIndex((item) => item.id === fromId);
      const to = draft.resume.education.findIndex((item) => item.id === toId);
      draft.resume.education = reorder(draft.resume.education, from, to);
    });
  },

  addSkillGroup() {
    get().mutate('skills:add', (draft) => {
      draft.resume.skills.push({ id: stableId('skl'), label: 'New group', items: [] });
    });
  },

  updateSkillGroup(id, patch) {
    get().mutate(`skills:${id}`, (draft) => {
      const group = draft.resume.skills.find((item) => item.id === id);
      if (group) Object.assign(group, patch);
    });
  },

  removeSkillGroup(id) {
    get().mutate('skills:remove', (draft) => {
      draft.resume.skills = draft.resume.skills.filter((item) => item.id !== id);
    });
  },

  addProject() {
    get().mutate('projects:add', (draft) => {
      draft.resume.projects.push({ id: stableId('prj'), name: '', link: '', stack: '', bullets: [''] });
      draft.resume.hidden = draft.resume.hidden.filter((key) => key !== 'projects');
    });
  },

  updateProject(id, patch) {
    get().mutate(`projects:${id}`, (draft) => {
      const project = draft.resume.projects.find((item) => item.id === id);
      if (project) Object.assign(project, patch);
    });
  },

  removeProject(id) {
    get().mutate('projects:remove', (draft) => {
      draft.resume.projects = draft.resume.projects.filter((item) => item.id !== id);
    });
  },

  moveProject(id, direction) {
    get().mutate('projects:move', (draft) => {
      const index = draft.resume.projects.findIndex((item) => item.id === id);
      draft.resume.projects = move(draft.resume.projects, index, direction);
    });
  },

  reorderProject(fromId, toId) {
    get().mutate('projects:reorder', (draft) => {
      const from = draft.resume.projects.findIndex((item) => item.id === fromId);
      const to = draft.resume.projects.findIndex((item) => item.id === toId);
      draft.resume.projects = reorder(draft.resume.projects, from, to);
    });
  },

  setProjectBullet(projectId, index, value) {
    get().mutate(`projectBullet:${projectId}:${index}`, (draft) => {
      const project = draft.resume.projects.find((item) => item.id === projectId);
      if (project && index >= 0 && index < project.bullets.length) project.bullets[index] = value;
    });
  },

  addProjectBullet(projectId) {
    get().mutate('projectBullet:add', (draft) => {
      const project = draft.resume.projects.find((item) => item.id === projectId);
      if (project) project.bullets.push('');
    });
  },

  removeProjectBullet(projectId, index) {
    get().mutate('projectBullet:remove', (draft) => {
      const project = draft.resume.projects.find((item) => item.id === projectId);
      if (project) project.bullets.splice(index, 1);
    });
  },

  addCertification() {
    get().mutate('certifications:add', (draft) => {
      draft.resume.certifications.push({
        id: stableId('crt'),
        name: '',
        issuer: '',
        date: '',
        credential: '',
      });
      draft.resume.hidden = draft.resume.hidden.filter((key) => key !== 'certifications');
    });
  },

  updateCertification(id, patch) {
    get().mutate(`certifications:${id}`, (draft) => {
      const cert = draft.resume.certifications.find((item) => item.id === id);
      if (cert) Object.assign(cert, patch);
    });
  },

  removeCertification(id) {
    get().mutate('certifications:remove', (draft) => {
      draft.resume.certifications = draft.resume.certifications.filter((item) => item.id !== id);
    });
  },

  toggleSection(key) {
    get().mutate('section:toggle', (draft) => {
      draft.resume.hidden = draft.resume.hidden.includes(key)
        ? draft.resume.hidden.filter((item) => item !== key)
        : [...draft.resume.hidden, key];
    });
  },

  moveSection(key, direction) {
    get().mutate('section:move', (draft) => {
      const index = draft.resume.sectionOrder.indexOf(key);
      draft.resume.sectionOrder = move(draft.resume.sectionOrder, index, direction);
    });
  },

  reorderSection(from, to) {
    get().mutate('section:reorder', (draft) => {
      const fromIndex = draft.resume.sectionOrder.indexOf(from);
      const toIndex = draft.resume.sectionOrder.indexOf(to);
      draft.resume.sectionOrder = reorder(draft.resume.sectionOrder, fromIndex, toIndex);
    });
  },

  renameSection(key, heading) {
    get().mutate(`section:rename:${key}`, (draft) => {
      if (heading.trim()) draft.resume.headings[key] = heading;
      else delete draft.resume.headings[key];
    });
  },

  setDesign(patch) {
    get().mutate('design', (draft) => {
      draft.design = { ...draft.design, ...patch };
    });
  },

  setJobDescription(value) {
    get().mutate('jd', (draft) => {
      draft.jobDescription = value;
    });
  },

  setCoverLetter(value) {
    get().mutate('coverLetter', (draft) => {
      draft.coverLetter = value;
    });
  },

  loadSample() {
    get().replaceAll({
      resume: sampleResume(),
      design: { ...get().present.design },
      jobDescription: SAMPLE_JOB_DESCRIPTION,
      coverLetter: '',
    });
  },

  resetAll() {
    clearState();
    get().replaceAll({ ...defaultState(), resume: emptyResume() });
  },
}));

/* ------------------------------------------------------------------ *
 * Autosave — debounced, local only.
 * ------------------------------------------------------------------ */

let saveTimer: number | undefined;
useStore.subscribe((state, previous) => {
  if (state.present === previous.present) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => saveState(state.present), 400);
});

export const canUndo = (state: Store): boolean => state.past.length > 0;
export const canRedo = (state: Store): boolean => state.future.length > 0;
