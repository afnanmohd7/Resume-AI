import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, Minus, Plus, Printer } from 'lucide-react';
import type { DesignSettings, ResumeData } from '../types';
import { PAGE_SIZES, ResumeDocument } from '../templates';
import { Button, IconButton } from './ui';

interface PreviewProps {
  resume: ResumeData;
  design: DesignSettings;
  onPagesChange: (pages: number) => void;
  onPrint: () => void;
}

export function Preview({ resume, design, onPagesChange, onPrint }: PreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState<number | null>(null); // null = fit to width
  const [contentHeight, setContentHeight] = useState(0);

  const page = PAGE_SIZES[design.paper];
  const scale = zoom ?? fitScale;

  const measureFit = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const available = frame.clientWidth - 48;
    setFitScale(Math.min(1.4, Math.max(0.25, available / page.width)));
  }, [page.width]);

  useLayoutEffect(() => {
    measureFit();
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measureFit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [measureFit]);

  /**
   * Measure the rendered document so the page count reflects reality rather
   * than a word-count guess — the ATS panel consumes this too.
   *
   * On small screens this pane is hidden with display:none while the editor
   * is open, and a hidden element reports a height of zero. Latching that
   * would claim "1 page" for a three-page resume, so hidden measurements are
   * discarded and the last real height is kept.
   */
  const measureDoc = useCallback(() => {
    const node = docRef.current;
    if (!node) return;
    if (node.offsetParent === null && node.scrollHeight === 0) return;
    setContentHeight(node.scrollHeight);
  }, []);

  // Intentionally runs after every render: a tab switch changes visibility
  // without changing any prop the observer watches.
  useLayoutEffect(() => {
    measureDoc();
    const frame = requestAnimationFrame(measureDoc);
    const node = docRef.current;
    let observer: ResizeObserver | undefined;
    if (node && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measureDoc);
      observer.observe(node);
    }
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  });

  const pages = Math.max(1, Math.ceil((contentHeight - 2) / page.height));

  useEffect(() => {
    onPagesChange(pages);
  }, [pages, onPagesChange]);

  const guides = Array.from({ length: Math.max(0, pages - 1) }, (_, index) => (index + 1) * page.height);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap text-[12px] text-[var(--text-muted)]">
          <span className="tabular-nums">
            {pages} page{pages === 1 ? '' : 's'}
          </span>
          <span className="hidden text-[var(--border-strong)] sm:inline">·</span>
          <span className="hidden truncate sm:inline">{page.label}</span>
          {pages > 2 ? (
            <span className="ml-1 rounded px-1.5 py-0.5 text-[11px]" style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}>
              Over two pages
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            label="Zoom out"
            onClick={() => setZoom(Math.max(0.25, Math.round((scale - 0.1) * 100) / 100))}
          >
            <Minus size={15} />
          </IconButton>
          <span className="w-10 text-center text-[11px] tabular-nums text-[var(--text-muted)]">
            {Math.round(scale * 100)}%
          </span>
          <IconButton
            label="Zoom in"
            onClick={() => setZoom(Math.min(2, Math.round((scale + 0.1) * 100) / 100))}
          >
            <Plus size={15} />
          </IconButton>
          <IconButton label="Fit to width" onClick={() => setZoom(null)}>
            <Maximize2 size={14} />
          </IconButton>
          <Button variant="primary" size="sm" icon={<Printer size={14} />} onClick={onPrint} className="ml-1">
            <span className="hidden sm:inline">Download&nbsp;</span>PDF
          </Button>
        </div>
      </div>

      <div ref={frameRef} className="scroll-slim min-h-0 flex-1 overflow-auto bg-[var(--surface-2)] p-6">
        <div
          style={{
            width: page.width * scale,
            height: Math.max(page.height, contentHeight) * scale,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              width: page.width,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'relative',
            }}
          >
            <div ref={docRef} className="page-shadow">
              <ResumeDocument resume={resume} design={design} />
            </div>
            {guides.map((top) => (
              <div key={top} className="page-break-guide" style={{ top }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
