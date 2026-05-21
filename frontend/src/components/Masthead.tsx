import { Link, useLocation } from 'react-router-dom';

export function Masthead() {
  const location = useLocation();
  const onGraph = location.pathname.startsWith('/graph');

  return (
    <header className="px-6 sm:px-9 pt-10 sm:pt-12 pb-8 text-center border-b" style={{ borderColor: 'var(--c-border-gold)' }}>
      <Link to="/" className="inline-block no-underline" aria-label="Home">
        <div className="font-mono font-light text-[52px] sm:text-[64px] leading-none" style={{ color: 'var(--c-gold)', opacity: 0.85 }}>
          間
        </div>
        <h1 className="t-display mt-3 text-[26px] sm:text-[34px]">Japandi ENS</h1>
        <div className="t-label text-[10px] mt-2" style={{ letterSpacing: '0.28em' }}>
          Network Explorer · v1.0
        </div>
      </Link>

      <div className="ma-rule mx-auto max-w-[280px]">
        <div className="ma-rule-line" />
        <div className="ma-rule-diamond" />
        <div className="ma-rule-line" />
      </div>

      <nav className="flex items-center justify-center gap-6 text-[11px] tracking-[0.18em] uppercase" style={{ fontFamily: 'DM Sans' }}>
        <Link
          to="/"
          className="no-underline transition-colors"
          style={{ color: !onGraph ? 'var(--c-ink)' : '#A8A29E' }}
        >
          Profile
        </Link>
        <span className="ma-rule-diamond" aria-hidden />
        <Link
          to="/graph"
          className="no-underline transition-colors"
          style={{ color: onGraph ? 'var(--c-ink)' : '#A8A29E' }}
        >
          Graph
        </Link>
      </nav>
    </header>
  );
}
