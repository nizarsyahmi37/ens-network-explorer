export function ProfileSkeleton() {
  return (
    <article className="card max-w-[520px] mx-auto" aria-busy="true" aria-label="Loading profile">
      <div className="section-label mb-6">
        <span>Resolving</span>
      </div>

      <div className="flex flex-col items-center text-center gap-4">
        <div className="skeleton" style={{ width: 104, height: 104, borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: 180, height: 28 }} />
        <div className="skeleton" style={{ width: 140, height: 14 }} />
        <div className="skeleton" style={{ width: 320, height: 12 }} />
        <div className="skeleton" style={{ width: 280, height: 12 }} />
        <div className="flex gap-2 mt-2">
          <div className="skeleton" style={{ width: 70, height: 22, borderRadius: 100 }} />
          <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 100 }} />
          <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 100 }} />
        </div>
      </div>
    </article>
  );
}
