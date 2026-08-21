import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store';
import { TEMPLATE_META } from '../templates';
import { DEFAULT_DESIGN } from '../lib/defaults';
import { Button, Callout, Card, SectionHeading, Select, Slider, Toggle } from './ui';

const ACCENTS = [
  { name: 'Slate ink', value: '#20242c' },
  { name: 'Deep blue', value: '#1f4d7a' },
  { name: 'Teal', value: '#116466' },
  { name: 'Forest', value: '#2c5f2d' },
  { name: 'Burgundy', value: '#6d2932' },
  { name: 'Plum', value: '#54325c' },
  { name: 'Rust', value: '#9c4221' },
  { name: 'Graphite', value: '#4a5568' },
];

export function DesignPanel() {
  const design = useStore((state) => state.present.design);
  const setDesign = useStore((state) => state.setDesign);
  const activeTemplate = TEMPLATE_META.find((template) => template.id === design.template);

  return (
    <div className="space-y-3">
      <SectionHeading
        title="Design"
        description="Layout and typography only — the text on paper is always real, selectable text, never an image."
      />

      <Card className="p-3">
        <p className="mb-2 text-[11px] font-medium tracking-wide text-[var(--text-muted)]">Template</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATE_META.map((template) => {
            const active = design.template === template.id;
            return (
              <button
                key={template.id}
                onClick={() => setDesign({ template: template.id })}
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  active
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border)] hover:bg-[var(--surface-2)]'
                }`}
              >
                <TemplateThumb id={template.id} accent={design.accent} active={active} />
                <p className="mt-1.5 text-[12px] font-semibold text-[var(--text)]">{template.name}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{template.blurb}</p>
              </button>
            );
          })}
        </div>
        {activeTemplate?.atsNote ? (
          <div className="mt-2">
            <Callout tone="ok">
              <span className="flex gap-1.5">
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                {activeTemplate.atsNote}
              </span>
            </Callout>
          </div>
        ) : null}
      </Card>

      <Card className="p-3">
        <p className="mb-2 text-[11px] font-medium tracking-wide text-[var(--text-muted)]">Accent colour</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {ACCENTS.map((accent) => (
            <button
              key={accent.value}
              title={accent.name}
              aria-label={accent.name}
              onClick={() => setDesign({ accent: accent.value })}
              className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                design.accent === accent.value ? 'border-[var(--text)]' : 'border-transparent'
              }`}
              style={{ background: accent.value }}
            />
          ))}
          <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
            Custom
            <input
              type="color"
              value={design.accent}
              onChange={(event) => setDesign({ accent: event.target.value })}
              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] text-[var(--text-faint)]">
          Dark, low-saturation colours print reliably and photocopy cleanly. Bright colours are the first
          thing to look cheap on paper.
        </p>
      </Card>

      <Card className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-2.5">
          <Select
            label="Typeface"
            value={design.fontFamily}
            onChange={(event) => setDesign({ fontFamily: event.target.value as 'sans' | 'serif' })}
          >
            <option value="sans">Sans-serif (system)</option>
            <option value="serif">Serif (Georgia)</option>
          </Select>
          <Select
            label="Paper size"
            value={design.paper}
            onChange={(event) => setDesign({ paper: event.target.value as 'a4' | 'letter' })}
          >
            <option value="a4">A4 (most of the world)</option>
            <option value="letter">US Letter</option>
          </Select>
        </div>

        <Slider
          label="Text size"
          value={design.fontScale}
          min={0.85}
          max={1.15}
          step={0.01}
          onChange={(fontScale) => setDesign({ fontScale })}
          format={(value) => `${Math.round(value * 100)}%`}
        />
        <Slider
          label="Line height"
          value={design.lineHeight}
          min={1.15}
          max={1.75}
          step={0.01}
          onChange={(lineHeight) => setDesign({ lineHeight })}
          format={(value) => value.toFixed(2)}
        />
        <Slider
          label="Space between sections"
          value={design.sectionGap}
          min={6}
          max={26}
          step={1}
          onChange={(sectionGap) => setDesign({ sectionGap })}
          format={(value) => `${value}px`}
        />
        <Slider
          label="Page margin"
          value={design.margin}
          min={28}
          max={84}
          step={1}
          onChange={(margin) => setDesign({ margin })}
          format={(value) => `${Math.round((value / 96) * 25.4)}mm`}
        />
      </Card>

      <Card className="p-3">
        <Toggle
          label="Uppercase section headings"
          checked={design.uppercaseHeadings}
          onChange={(uppercaseHeadings) => setDesign({ uppercaseHeadings })}
        />
        <Toggle
          label="Full stops at the end of bullets"
          description="Pick one and be consistent. Both are correct."
          checked={design.bulletPeriods}
          onChange={(bulletPeriods) => setDesign({ bulletPeriods })}
        />
        <Toggle
          label="Icons in the contact line"
          description="Some parsers read icon glyphs as junk characters. Off is the safer choice."
          checked={design.showIcons}
          onChange={(showIcons) => setDesign({ showIcons })}
        />
      </Card>

      <Button variant="ghost" size="sm" onClick={() => setDesign({ ...DEFAULT_DESIGN })}>
        Reset design to defaults
      </Button>
    </div>
  );
}

/** Tiny abstract preview of each layout — cheaper and clearer than a screenshot. */
function TemplateThumb({ id, accent, active }: { id: string; accent: string; active: boolean }) {
  const bar = (width: string, color: string, height = 3) => (
    <div style={{ width, height, background: color, borderRadius: 1 }} />
  );
  const muted = active ? 'rgba(0,0,0,0.22)' : 'var(--border-strong)';

  return (
    <div
      className="flex h-[62px] w-full flex-col gap-1 overflow-hidden rounded border border-[var(--border)] bg-white p-1.5"
      aria-hidden
    >
      {id === 'compact' ? (
        <>
          <div style={{ background: accent, margin: '-6px -6px 2px', padding: '5px 6px' }}>
            {bar('50%', 'rgba(255,255,255,0.95)', 4)}
          </div>
          <div className="flex flex-1 gap-1.5">
            <div className="flex flex-1 flex-col gap-1">
              {bar('60%', accent)}
              {bar('100%', muted, 2)}
              {bar('92%', muted, 2)}
              {bar('80%', muted, 2)}
            </div>
            <div className="flex w-[30%] flex-col gap-1">
              {bar('80%', accent, 2)}
              {bar('100%', muted, 2)}
              {bar('70%', muted, 2)}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={id === 'classic' ? 'flex flex-col items-center gap-1' : 'flex flex-col gap-1'}>
            {bar('55%', '#20242c', 5)}
            {bar('35%', accent, 2)}
          </div>
          {id === 'modern' ? bar('100%', accent, 2) : null}
          <div className="mt-0.5 flex flex-1 flex-col gap-1">
            {bar('42%', accent, 2)}
            {id !== 'minimal' ? bar('100%', muted, 1) : null}
            {bar('100%', muted, 2)}
            {bar('88%', muted, 2)}
            {bar('42%', accent, 2)}
            {bar('95%', muted, 2)}
          </div>
        </>
      )}
    </div>
  );
}
