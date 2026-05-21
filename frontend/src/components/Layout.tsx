import { Outlet } from 'react-router-dom';
import { Masthead } from './Masthead';

export function Layout() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1180px]">
        <Masthead />
        <main className="px-6 sm:px-9 py-10">
          <Outlet />
        </main>
        <footer className="px-9 pb-10 pt-6 text-center" style={{ borderTop: '0.5px solid var(--c-border-gold)' }}>
          <div className="t-caption" style={{ maxWidth: 360, margin: '0 auto' }}>
            Resolved via Cloudflare Ethereum Gateway · Mainnet
            <br />
            The art of meaningful emptiness — 間 <em>(Ma)</em>
          </div>
        </footer>
      </div>
    </div>
  );
}
