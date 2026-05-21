import { useTheme, type ThemeChoice } from '../hooks/useTheme';

const LABELS: Record<ThemeChoice, { glyph: string; name: string; next: string }> = {
  light: { glyph: '☀', name: 'Light', next: 'Switch to Dark' },
  dark: { glyph: '☾', name: 'Dark', next: 'Switch to Auto' },
  system: { glyph: '◐', name: 'Auto', next: 'Switch to Light' },
};

export function ThemeToggle() {
  const { choice, cycle } = useTheme();
  const meta = LABELS[choice];

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${meta.name} · ${meta.next}`}
      aria-label={`Theme: ${meta.name}. ${meta.next}.`}
      className="inline-flex items-center gap-2 rounded-btn px-3 py-[6px] transition-colors"
      style={{
        background: 'transparent',
        border: '0.5px solid var(--c-border-gold)',
        color: 'var(--c-ink)',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      <span
        aria-hidden
        style={{
          fontSize: 14,
          lineHeight: 1,
          color: 'var(--c-gold)',
          display: 'inline-block',
          width: 14,
          textAlign: 'center',
        }}
      >
        {meta.glyph}
      </span>
      <span className="hidden sm:inline">{meta.name}</span>
    </button>
  );
}
