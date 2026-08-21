# Resume AI

A free resume builder with no sign-up, no server and no tracking. Everything —
editing, the writing assistance, the ATS scoring, the cover letter and the PDF
export — happens inside the browser tab.

## What it does

**A guided builder, one step at a time.** Rather than a wall of form fields,
the builder walks through seven short steps — details, experience, education,
skills, extras, summary, review — with a progress rail you can jump around in.
Each step states what it is for, shows only its own fields, and keeps a live
preview beside it. Within a step, entries collapse to one-line rows and open one
at a time, so six jobs read as six tidy rows rather than six open forms.

Nothing is ever locked. Pressing Continue with a required field empty marks it
and says what is missing; press again and it lets you through, because people
arrive without their exact start dates to hand. Optional steps offer a Skip.

**Document control.** Four print-tuned templates, adjustable type scale, line
height, margins, accent colour, and A4 / US Letter. Sections can be renamed,
reordered and hidden. Work autosaves to `localStorage`; JSON export and import
give you a real backup.

**Writing assistance.** Every bullet is scored out of 100 against the things
that actually get resumes rejected — weak openers, first person, passive voice,
filler, missing numbers, missing outcomes. Alongside the critique it offers a
concrete rewrite and three alternative shapes (impact-led, result-first, scope
and scale), plus a composer that turns a plain note like *"i was responsible for
the weekly sales reports"* into publishable bullets. Summaries are drafted from
whatever is already in the resume.

**Job-description matching.** Paste a posting and it extracts the terms being
screened for, weights them by where they appear, reports coverage, and says
where each gap belongs — the skills block for hard skills, the closest existing
bullet otherwise. A structural checklist covers contact fields, dated roles,
bullet counts, quantification rate, verb variety and page count. The skills step
also suggests terms common to your detected field, so it is useful before you
have any posting to paste.

**A review step that tells you where to go next.** The final step scores the
resume, lists what is still missing with a jump-to-fix link per item, and hands
off to tailoring, the cover letter, or the design panel.

**Cover letters.** Assembled from the resume and the posting, selecting the
achievements most relevant to that job and leading with the skills the posting
weights most heavily. Three tones, fully editable, printable in matching styles.

## How the "AI" works — and what it is not

There is no model call. The engine is a deterministic NLP pipeline written in
TypeScript: action-verb and skill taxonomies, weak-verb substitution, clause
parsing with table-backed conjugation, and TF-weighted keyword extraction with
alias resolution.

That is a deliberate trade. It is instant, works offline, costs nothing to run,
and no employment history ever leaves the device. In exchange it cannot invent
experience or write genuinely novel prose — it reshapes what you write, and
tells you what is missing. Where it needs a number it does not have, it leaves
an explicit `[X]%` placeholder for you to fill rather than making one up.

The ATS score is a rehearsal, not a verdict. Real applicant tracking systems
vary and none publish their scoring. Treat the panel as a checklist that catches
common, avoidable failures.

## Privacy and security

- **No network calls at runtime.** Production builds ship a CSP with
  `default-src 'none'` and `connect-src 'none'`, so injected code has nowhere to
  send anything. No fonts, scripts or styles are loaded from third parties.
- **No account, no analytics, no cookies.** Data lives in `localStorage` on your
  device and is erased by the Clear button or by clearing site data.
- **Imported JSON is untrusted input** and is rebuilt field by field against a
  whitelist: unknown keys dropped, types coerced, lengths capped, control and
  bidirectional-override characters stripped, enums and colours validated, and
  no object merging (so no prototype pollution).
- **Links are protocol-checked** — only `http`, `https` and `mailto` survive.

## PDF export

Export goes through the browser's own print pipeline, so the PDF contains real,
selectable, parseable text rather than a rasterised image. Page margins are set
on the `@page` box so every page after the first keeps its margin.

In the print dialog choose **Save as PDF** and turn **headers and footers off**.

## Running it

```bash
npm install
npm run dev
```

```bash
npm run build
```

The build is static and relative-pathed — deploy `dist/` to GitHub Pages,
Netlify, Cloudflare Pages, or open `dist/index.html` from disk.

## Layout

```
src/
  lib/
    text.ts        tokenising, stemming, metric detection
    taxonomy.ts    skill dictionary, aliases, domain detection, display casing
    verbs.ts       action verbs, weak-verb map, outcome scaffolds
    bullets.ts     bullet scoring, rewriting, generation, conjugation tables
    ats.ts         keyword extraction, matching, scoring, structural checks
    summary.ts     summary drafting
    coverLetter.ts letter assembly
    dates.ts       date parsing, overlap-aware experience totals
    storage.ts     persistence, import hardening, URL safety
    steps.ts       the seven-step model and per-step completeness
  components/
    wizard/        step flow, rail, welcome, review
    parts.tsx      collapsible entry cards, empty states
    ...            design/tailor/letter panels, bullet coach, preview
  templates/       the four resume layouts
```

## Keyboard

`Ctrl/Cmd + Enter` continue to the next step · `Ctrl/Cmd + P` export ·
`Ctrl/Cmd + Z` undo · `Ctrl/Cmd + Shift + Z` redo

## Licence

MIT — see [LICENSE](LICENSE). Use it, fork it, ship your own version.
