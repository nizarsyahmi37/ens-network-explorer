import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { isValidEnsName, normaliseEns } from '../../lib/ens-utils';

interface EdgeEditorProps {
  onAdd: (source: string, target: string) => Promise<void>;
  busy?: boolean;
}

export function EdgeEditor({ onAdd, busy }: EdgeEditorProps) {
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);

  const s = normaliseEns(source);
  const t = normaliseEns(target);
  const valid = isValidEnsName(s) && isValidEnsName(t) && s !== t;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid) {
      setError('Both fields must be valid .eth names and differ.');
      return;
    }
    try {
      await onAdd(s, t);
      toast.success(`Edge added · ${s} ↔ ${t}`);
      setSource('');
      setTarget('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add edge';
      setError(message);
      toast.error(message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card">
      <div className="section-label mb-5">
        <span>Add Edge</span>
      </div>
      <div className="flex flex-col gap-3">
        <input
          className="input-mono"
          type="text"
          placeholder="source.eth"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Source ENS name"
        />
        <div className="text-center text-[14px]" style={{ color: 'var(--c-gold)' }} aria-hidden>
          ↕
        </div>
        <input
          className="input-mono"
          type="text"
          placeholder="target.eth"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          aria-label="Target ENS name"
        />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className="btn-gold" disabled={!valid || busy}>
          {busy ? 'Saving…' : 'Add Edge'}
        </button>
        {error && (
          <span className="text-[11px] tracking-[0.05em]" style={{ color: 'var(--c-rust)' }}>
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
