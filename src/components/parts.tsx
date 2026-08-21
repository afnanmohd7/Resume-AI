import { useRef, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { IconButton } from './ui';

/** Header-strip drag reordering; arrow buttons remain for keyboard users. */
export function useSortable(onReorder: (fromId: string, toId: string) => void) {
  const dragId = useRef<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return {
    overId,
    handleProps: (id: string) => ({
      draggable: true,
      onDragStart: (event: React.DragEvent) => {
        dragId.current = id;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', id);
      },
      onDragEnd: () => {
        dragId.current = null;
        setOverId(null);
      },
    }),
    zoneProps: (id: string) => ({
      onDragOver: (event: React.DragEvent) => {
        if (!dragId.current || dragId.current === id) return;
        event.preventDefault();
        setOverId(id);
      },
      onDragLeave: () => setOverId((prev) => (prev === id ? null : prev)),
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        const from = dragId.current;
        if (from && from !== id) onReorder(from, id);
        dragId.current = null;
        setOverId(null);
      },
    }),
  };
}

/**
 * One entry in a list — a role, a qualification, a project.
 *
 * Collapsed by default and opened one at a time, so a person with six jobs
 * sees six tidy rows rather than six open forms.
 */
export function ItemCard({
  title,
  subtitle,
  meta,
  status,
  open,
  onToggle,
  isOver,
  handleProps,
  zoneProps,
  onMoveUp,
  onMoveDown,
  onRemove,
  children,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  status?: 'ok' | 'incomplete';
  open: boolean;
  onToggle: () => void;
  isOver: boolean;
  handleProps: Record<string, unknown>;
  zoneProps: Record<string, unknown>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div
      {...zoneProps}
      className={`overflow-hidden rounded-xl border bg-[var(--surface)] transition-all ${
        isOver
          ? 'border-[var(--brand)] ring-2 ring-[var(--brand)]/20'
          : open
            ? 'border-[var(--border-strong)] shadow-sm'
            : 'border-[var(--border)]'
      }`}
    >
      <div
        {...handleProps}
        className={`flex items-center gap-1 px-1.5 py-1.5 ${open ? 'border-b border-[var(--border)] bg-[var(--surface-2)]' : ''}`}
      >
        <span className="cursor-grab px-0.5 text-[var(--text-faint)] active:cursor-grabbing" aria-hidden>
          <GripVertical size={14} />
        </span>

        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-[var(--surface-2)]"
        >
          {status ? (
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: status === 'ok' ? 'var(--good)' : 'var(--warn)' }}
            />
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-[var(--text)]">
              {title || <span className="font-normal text-[var(--text-faint)]">Untitled</span>}
            </span>
            {subtitle || meta ? (
              <span className="block truncate text-[11px] text-[var(--text-faint)]">
                {[subtitle, meta].filter(Boolean).join(' · ')}
              </span>
            ) : null}
          </span>
          <ChevronDown
            size={15}
            className={`shrink-0 text-[var(--text-faint)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open ? (
          <>
            <IconButton label="Move up" onClick={onMoveUp}>
              <ChevronUp size={14} />
            </IconButton>
            <IconButton label="Move down" onClick={onMoveDown}>
              <ChevronDown size={14} />
            </IconButton>
            <IconButton label="Delete" onClick={onRemove}>
              <Trash2 size={14} />
            </IconButton>
          </>
        ) : null}
      </div>

      {open ? <div className="space-y-3 p-3">{children}</div> : null}
    </div>
  );
}

/** Friendly first-run state for an empty list. */
export function EmptyPrompt({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <button
      onClick={onAction}
      className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-strong)] px-4 py-7 text-center transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]/40"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
        {icon}
      </span>
      <span className="text-[13px] font-semibold text-[var(--text)]">{title}</span>
      <span className="max-w-sm text-[12px] leading-relaxed text-[var(--text-muted)]">{description}</span>
      <span className="mt-1 inline-flex items-center gap-1 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-[12px] font-medium text-white">
        <Plus size={13} /> {actionLabel}
      </span>
    </button>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

/** Collapsible "why this matters" note — help without permanent clutter. */
export function HelpNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2">
      <summary className="cursor-pointer list-none text-[12px] font-medium text-[var(--text-muted)] marker:hidden hover:text-[var(--text)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="grid h-4 w-4 place-items-center rounded-full border border-[var(--border-strong)] text-[10px]">
            ?
          </span>
          {title}
        </span>
      </summary>
      <div className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">{children}</div>
    </details>
  );
}
