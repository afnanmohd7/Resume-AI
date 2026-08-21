import { useRef, useState } from 'react';
import {
  FileJson,
  Moon,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Sun,
  Undo2,
  Upload,
} from 'lucide-react';
import { useStore } from '../store';
import { downloadFile, fromImportJSON, toExportJSON } from '../lib/storage';
import { defaultState } from '../lib/defaults';
import { Button, IconButton } from './ui';

export function TopBar({
  theme,
  onToggleTheme,
  onNotify,
}: {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNotify: (message: string, tone: 'good' | 'poor') => void;
}) {
  const present = useStore((state) => state.present);
  const canUndo = useStore((state) => state.past.length > 0);
  const canRedo = useStore((state) => state.future.length > 0);
  const { undo, redo, replaceAll, loadSample, resetAll } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleImport = async (file: File) => {
    const text = await file.text();
    const result = fromImportJSON(text, defaultState());
    if (result.ok && result.state) {
      replaceAll(result.state);
      onNotify('Resume imported.', 'good');
    } else {
      onNotify(result.error ?? 'Could not read that file.', 'poor');
    }
  };

  return (
    <header className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
      <div className="flex items-center gap-2">
        <div
          className="grid h-7 w-7 place-items-center rounded-lg text-[13px] font-bold text-white"
          style={{ background: 'var(--brand)' }}
          aria-hidden
        >
          R
        </div>
        <div className="leading-tight">
          <p className="text-[14px] font-semibold tracking-tight">Resume AI</p>
          <p className="hidden text-[11px] text-[var(--text-faint)] sm:block">
            Free · no sign up · nothing leaves your browser
          </p>
        </div>
      </div>

      <div className="ml-2 hidden items-center gap-0.5 md:flex">
        <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          <Undo2 size={15} />
        </IconButton>
        <IconButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          <Redo2 size={15} />
        </IconButton>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span
          className="hidden items-center gap-1 rounded-md px-2 py-1 text-[11px] lg:inline-flex"
          style={{ background: 'var(--good-soft)', color: 'var(--good)' }}
          title="This app makes no network requests. Your resume is stored only in this browser's local storage."
        >
          <ShieldCheck size={12} /> Offline &amp; private
        </span>

        <Button size="sm" variant="ghost" onClick={loadSample}>
          Example
        </Button>

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
        <Button size="sm" variant="ghost" icon={<Upload size={13} />} onClick={() => fileRef.current?.click()}>
          <span className="hidden sm:inline">Import</span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<FileJson size={13} />}
          onClick={() => {
            downloadFile(
              `${(present.resume.contact.fullName || 'resume').replace(/\s+/g, '-').toLowerCase()}-resume-ai.json`,
              toExportJSON(present),
            );
            onNotify('Saved a JSON backup you can re-import later.', 'good');
          }}
        >
          <span className="hidden sm:inline">Export</span>
        </Button>

        {confirmReset ? (
          <span className="flex items-center gap-1 rounded-lg px-1.5 py-1" style={{ background: 'var(--bad-soft)' }}>
            <span className="text-[11px]" style={{ color: 'var(--bad)' }}>
              Erase everything?
            </span>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                onNotify('Cleared. Nothing was ever sent anywhere.', 'good');
              }}
            >
              Yes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              No
            </Button>
          </span>
        ) : (
          <IconButton label="Clear everything" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={15} />
          </IconButton>
        )}

        <IconButton label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </IconButton>
      </div>
    </header>
  );
}
