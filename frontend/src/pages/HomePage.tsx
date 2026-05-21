import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';

const EXAMPLES = ['vitalik.eth', 'nick.eth', 'brantly.eth', 'balajis.eth'];

export function HomePage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <div className="text-center mb-10">
        <h2 className="t-display text-[40px] sm:text-[48px]">
          Network of <span className="t-display-em">Names</span>
        </h2>
        <p className="t-body mt-4 max-w-[480px] mx-auto">
          Every <code className="font-mono text-[0.95em]">.eth</code> name holds a story.
          Resolve, explore, and map the social fabric of the decentralised web.
        </p>
      </div>

      <div className="card">
        <div className="section-label mb-5">
          <span>Look up a Profile</span>
        </div>
        <SearchBar autoFocus />
        <div className="mt-6">
          <div className="t-label text-[10px] mb-3">Try one of these</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((name) => (
              <Link key={name} to={`/profile/${name}`} className="pill no-underline hover:text-ink transition-colors">
                {name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link to="/graph" className="btn-ghost no-underline">
          Explore the Graph
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}
