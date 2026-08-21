import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, LayoutTemplate, Mail, PenLine, Target } from 'lucide-react';
import { useStore } from './store';
import { DesignPanel } from './components/DesignPanel';
import { AtsPanel } from './components/AtsPanel';
import { CoverLetterPanel } from './components/CoverLetterPanel';
import { Preview } from './components/Preview';
import { TopBar } from './components/TopBar';
import { Wizard } from './components/wizard/Wizard';
import { Welcome } from './components/wizard/Welcome';
import { ResumeDocument, PAGE_SIZES } from './templates';
import { TONE_STYLES } from './components/ui';
import { isResumeEmpty, overallProgress, type StepId } from './lib/steps';

type Tab = 'build' | 'tailor' | 'design' | 'letter' | 'preview';
type PrintTarget = 'resume' | 'letter';

const TABS: Array<{ id: Tab; label: string; icon: typeof PenLine; mobileOnly?: boolean }> = [
  { id: 'build', label: 'Build', icon: PenLine },
  { id: 'tailor', label: 'Tailor', icon: Target },
  { id: 'design', label: 'Design', icon: LayoutTemplate },
  { id: 'letter', label: 'Letter', icon: Mail },
  { id: 'preview', label: 'Preview', icon: FileText, mobileOnly: true },
];

const THEME_KEY = 'resume-ai.theme';
const STARTED_KEY = 'resume-ai.started';

export default function App() {
  const resume = useStore((state) => state.present.resume);
  const design = useStore((state) => state.present.design);
  const coverLetter = useStore((state) => state.present.coverLetter);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);

  const [tab, setTab] = useState<Tab>('build');
  const [step, setStep] = useState<StepId>('personal');
  const [pages, setPages] = useState<number | null>(null);
  const [printTarget, setPrintTarget] = useState<PrintTarget>('resume');
  const [toast, setToast] = useState<{ message: string; tone: 'good' | 'poor' } | null>(null);

  // The welcome screen is shown until the person picks a way in. Kept out of
  // the undoable document state — it is about this browser, not this resume.
  const [started, setStarted] = useState(
    () => localStorage.getItem(STARTED_KEY) === '1' || !isResumeEmpty(useStore.getState().present.resume),
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // "Preview" is a small-screen-only tab. If the window grows past the
  // breakpoint while it is selected, fall back to the editor.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const sync = () => {
      if (wide.matches) setTab((current) => (current === 'preview' ? 'build' : current));
    };
    sync();
    wide.addEventListener('change', sync);
    return () => wide.removeEventListener('change', sync);
  }, []);

  const notify = useCallback((message: string, tone: 'good' | 'poor') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const beginBuilding = useCallback(() => {
    localStorage.setItem(STARTED_KEY, '1');
    setStarted(true);
  }, []);

  // Print is the export path: the browser's own PDF writer produces real,
  // selectable text rather than a rasterised image an ATS cannot read.
  const print = useCallback((target: PrintTarget) => {
    setPrintTarget(target);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.print()));
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        print('resume');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, print]);

  const pageStyle = useMemo(
    () =>
      `@page { size: ${design.paper === 'a4' ? 'A4' : 'letter'}; margin: ${Math.round((design.margin / 96) * 25.4)}mm; }`,
    [design.paper, design.margin],
  );

  const handlePagesChange = useCallback((next: number) => setPages(next), []);
  const goToTab = useCallback((next: 'tailor' | 'design' | 'letter') => setTab(next), []);
  const progress = overallProgress(resume);

  return (
    <>
      <style>{pageStyle}</style>

      <div className="app-shell flex h-full flex-col">
        <TopBar theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} onNotify={notify} />

        {/* Column on small screens so the tab bar stays reachable from the
            preview; two panes side by side from lg up. */}
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section
            className={`flex min-h-0 w-full flex-col border-[var(--border)] ${
              started
                ? 'lg:w-[560px] lg:shrink-0 lg:border-r xl:w-[600px]'
                : 'lg:w-full'
            } ${tab === 'preview' ? 'lg:flex-1' : 'flex-1'}`}
          >
            <nav
              className="relative flex shrink-0 items-center gap-0.5 border-b border-[var(--border)] bg-[var(--surface)] px-2 pt-1.5"
              role="tablist"
            >
              <div className="scroll-slim flex flex-1 gap-0.5 overflow-x-auto">
                {TABS.map((entry) => {
                  const Icon = entry.icon;
                  const active = tab === entry.id;
                  return (
                    <button
                      key={entry.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(entry.id)}
                      className={`flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                        entry.mobileOnly ? 'lg:hidden' : ''
                      } ${
                        active
                          ? 'border-[var(--brand)] text-[var(--text)]'
                          : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <Icon size={13} />
                      {entry.label}
                    </button>
                  );
                })}
              </div>

              {started ? (
                <span
                  className="mr-1 hidden shrink-0 items-center gap-1.5 pb-1 sm:flex"
                  title={`${Math.round(progress * 100)}% of the builder complete`}
                >
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-2)]">
                    <span
                      className="block h-full rounded-full transition-[width] duration-500"
                      style={{ width: `${progress * 100}%`, background: 'var(--good)' }}
                    />
                  </span>
                  <span className="text-[11px] tabular-nums text-[var(--text-faint)]">
                    {Math.round(progress * 100)}%
                  </span>
                </span>
              ) : null}
            </nav>

            <div
              className={`min-h-0 flex-1 ${tab === 'preview' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'}`}
            >
              {tab === 'build' ? (
                started ? (
                  <Wizard
                    step={step}
                    onStepChange={setStep}
                    measuredPages={pages}
                    onGoToTab={goToTab}
                    onPrint={() => print('resume')}
                  />
                ) : (
                  <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-3">
                    <Welcome onStart={beginBuilding} onNotify={notify} />
                  </div>
                )
              ) : (
                <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">
                  {tab === 'tailor' ? <AtsPanel measuredPages={pages} /> : null}
                  {tab === 'design' ? <DesignPanel /> : null}
                  {tab === 'letter' ? <CoverLetterPanel onPrint={() => print('letter')} /> : null}
                  <Footer />
                </div>
              )}
            </div>
          </section>

          <section
            className={`${tab === 'preview' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-1 ${
              started ? 'lg:flex' : 'lg:hidden'
            }`}
          >
            <div className="min-h-0 w-full">
              <Preview
                resume={resume}
                design={design}
                onPagesChange={handlePagesChange}
                onPrint={() => print('resume')}
              />
            </div>
          </section>
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-3 py-2 text-[12px] shadow-lg"
          style={{ background: TONE_STYLES[toast.tone].bg, color: TONE_STYLES[toast.tone].fg }}
        >
          {toast.message}
        </div>
      ) : null}

      <div id="print-root">
        {printTarget === 'resume' ? (
          <ResumeDocument resume={resume} design={design} forPrint />
        ) : (
          <div className="letter">{coverLetter}</div>
        )}
      </div>
    </>
  );
}

function Footer() {
  const paper = useStore((state) => state.present.design.paper);
  return (
    <footer className="mt-6 border-t border-[var(--border)] pt-3 text-[11px] leading-relaxed text-[var(--text-faint)]">
      <p className="mb-1.5">
        <strong className="text-[var(--text-muted)]">How the writing help works.</strong> Resume AI runs a
        local language engine — action-verb and skill dictionaries, pattern rewriting, and weighted keyword
        matching. There is no model call and no server, which is why it is instant, free and private. It also
        means it cannot invent experience for you: it reshapes what you write and tells you what is missing.
      </p>
      <p className="mb-1.5">
        <strong className="text-[var(--text-muted)]">Your data.</strong> Everything lives in this browser's
        local storage. Clearing site data or using the Clear button erases it for good, so export a JSON
        backup before you do. Exporting to PDF uses your browser's print dialog — choose &ldquo;Save as
        PDF&rdquo; and turn off headers and footers. Paper is set to {PAGE_SIZES[paper].label}.
      </p>
      <p>Press Ctrl/Cmd + P to export, Ctrl/Cmd + Z to undo.</p>
    </footer>
  );
}
