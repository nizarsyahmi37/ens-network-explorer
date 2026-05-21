import { Outlet } from 'react-router-dom';
import { Masthead } from './Masthead';

const YEAR = new Date().getFullYear();

export function Layout() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1180px]">
        <Masthead />
        <main className="px-6 sm:px-9 py-10">
          <Outlet />
        </main>
        <footer
          className="px-6 sm:px-9 pb-10 pt-6 text-center"
          style={{ borderTop: '0.5px solid var(--c-border-gold)' }}
        >
          <div className="t-caption" style={{ maxWidth: 360, margin: '0 auto' }}>
            Resolved via PublicNode Ethereum RPC · Mainnet
            <br />
            The art of meaningful emptiness — 間 <em>(Ma)</em>
          </div>

          <div className="ma-rule mx-auto" style={{ maxWidth: 180 }}>
            <div className="ma-rule-line" />
            <div className="ma-rule-diamond" />
            <div className="ma-rule-line" />
          </div>

          <div
            className="text-[11px]"
            style={{
              color: 'var(--c-fog)',
              letterSpacing: '0.1em',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            © {YEAR} · Crafted by{' '}
            <a
              href="https://github.com/nizarsyahmi37"
              target="_blank"
              rel="noreferrer noopener"
              className="transition-opacity hover:opacity-75"
              style={{ color: 'var(--c-gold-dark)', textDecoration: 'none' }}
            >
              Nizar Syahmi
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
