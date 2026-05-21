import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { isValidEnsName, normaliseEns } from '../lib/ens-utils';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchBar({ initialValue = '', placeholder = 'vitalik.eth', autoFocus = false }: SearchBarProps) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const [touched, setTouched] = useState(false);

  const normalised = normaliseEns(value);
  const valid = isValidEnsName(normalised);
  const showError = touched && value.length > 0 && !valid;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    navigate(`/profile/${normalised}`);
  }

  return (
    <form onSubmit={onSubmit} className="w-full" noValidate>
      <div className="flex items-stretch gap-2">
        <input
          className="input-mono flex-1 min-w-0"
          type="text"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          aria-label="ENS name"
          aria-invalid={showError}
        />
        <button type="submit" className="btn-gold whitespace-nowrap" disabled={!valid}>
          Resolve
        </button>
      </div>
      <div className="mt-2 text-[10px] tracking-[0.12em] uppercase" style={{ color: showError ? '#8B4513' : '#A8A29E' }}>
        {showError ? 'Must end in .eth' : 'Enter any .eth name to explore'}
      </div>
    </form>
  );
}
