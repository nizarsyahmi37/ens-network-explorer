import { Link, useParams } from 'react-router-dom';
import { useENS } from '../hooks/useENS';
import { ProfileCard } from '../components/ProfileCard/ProfileCard';
import { ProfileSkeleton } from '../components/ProfileCard/Skeleton';
import { SearchBar } from '../components/SearchBar';

export function ProfilePage() {
  const { ensName = '' } = useParams<{ ensName: string }>();
  const { profile, loading, error } = useENS(ensName);

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8">
        <SearchBar initialValue={ensName} />
      </div>

      {loading && <ProfileSkeleton />}

      {!loading && error && !profile?.address && (
        <article className="card max-w-[520px] mx-auto text-center">
          <div className="section-label mb-6 justify-center">
            <span>Not Found</span>
          </div>
          <div className="font-mono text-[18px] mb-3" style={{ color: 'var(--c-ink)' }}>
            {ensName}
          </div>
          <p className="t-body" style={{ fontSize: 14 }}>{error}</p>
          <div className="mt-6">
            <Link to="/" className="btn-ghost no-underline">
              Try another name
            </Link>
          </div>
        </article>
      )}

      {!loading && profile?.address && <ProfileCard profile={profile} />}
    </div>
  );
}
