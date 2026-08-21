import { useRef } from 'react';
import { ArrowRight, Eye, FileUp, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { useStore } from '../../store';
import { fromImportJSON } from '../../lib/storage';
import { defaultState } from '../../lib/defaults';
import { Button } from '../ui';

/**
 * First thing a new visitor sees. Three ways in, and the privacy promise up
 * front — it is the reason to use this over a site that wants an account.
 */
export function Welcome({
  onStart,
  onNotify,
}: {
  onStart: () => void;
  onNotify: (message: string, tone: 'good' | 'poor') => void;
}) {
  const loadSample = useStore((state) => state.loadSample);
  const replaceAll = useStore((state) => state.replaceAll);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File) => {
    const result = fromImportJSON(await file.text(), defaultState());
    if (result.ok && result.state) {
      replaceAll(result.state);
      onNotify('Resume imported.', 'good');
      onStart();
    } else {
      onNotify(result.error ?? 'Could not read that file.', 'poor');
    }
  };

  return (
    <div className="mx-auto max-w-lg px-1 py-6">
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl text-[18px] font-bold text-white"
          style={{ background: 'var(--brand)' }}
          aria-hidden
        >
          R
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight">Build a resume in about ten minutes</h1>
        <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-[var(--text-muted)]">
          Seven short steps, one at a time. You will see the page taking shape as you type, and get
          specific feedback on every line you write.
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={onStart}
          className="group flex w-full items-center gap-3 rounded-xl border border-[var(--brand)] bg-[var(--brand)] p-4 text-left text-white transition-transform hover:brightness-110"
        >
          <Sparkles size={18} className="shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">Start from scratch</span>
            <span className="mt-0.5 block text-[12px] text-white/80">
              Begin with your name and contact details.
            </span>
          </span>
          <ArrowRight size={16} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => {
            loadSample();
            onStart();
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:bg-[var(--surface-2)]"
        >
          <Eye size={17} className="shrink-0 text-[var(--text-muted)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium">Load a filled-in example</span>
            <span className="mt-0.5 block text-[12px] text-[var(--text-muted)]">
              See what good looks like, then edit over it.
            </span>
          </span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleImport(file);
            event.target.value = '';
          }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-left transition-colors hover:bg-[var(--surface-2)]"
        >
          <FileUp size={17} className="shrink-0 text-[var(--text-muted)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-medium">Import a saved backup</span>
            <span className="mt-0.5 block text-[12px] text-[var(--text-muted)]">
              A Resume AI JSON file you exported earlier.
            </span>
          </span>
        </button>
      </div>

      <ul className="mt-6 space-y-2 border-t border-[var(--border)] pt-5">
        {[
          { icon: <ShieldCheck size={14} />, text: 'No account, no email, no cookies. Your resume never leaves this browser.' },
          { icon: <Zap size={14} />, text: 'Feedback is instant and works offline — there is no server to wait for.' },
          { icon: <Sparkles size={14} />, text: 'Free, with no watermark, no paywall at the download, and no upsell.' },
        ].map((item) => (
          <li key={item.text} className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--text-muted)]">
            <span className="mt-0.5 shrink-0 text-[var(--good)]">{item.icon}</span>
            {item.text}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--text-faint)]">
        Already have a resume elsewhere? Start from scratch and paste your existing bullets in — the
        writing coach works on text you already have.
      </p>
      <div className="mt-3 flex justify-center">
        <Button size="sm" variant="ghost" onClick={onStart}>
          Skip and go straight to the editor
        </Button>
      </div>
    </div>
  );
}
