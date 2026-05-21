import { useState } from 'react';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore — clipboard may be blocked
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[10px] tracking-[0.14em] uppercase px-2 py-1 rounded transition-colors"
      style={{
        color: copied ? 'var(--c-gold-dark)' : '#A8A29E',
        background: copied ? 'rgba(201,169,110,0.12)' : 'transparent',
        border: '0.5px solid var(--c-border-gold)',
        fontFamily: 'DM Sans',
      }}
      aria-label={`Copy ${label}`}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
