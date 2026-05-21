import type { ENSProfile } from '../../types';
import { Avatar } from '../Avatar';
import { CopyButton } from '../CopyButton';
import { SocialLinks } from './SocialLinks';
import { avatarUrlFor } from '../../services/ens';
import { truncateAddress } from '../../lib/ens-utils';

export function ProfileCard({ profile }: { profile: ENSProfile }) {
  const avatarUrl = avatarUrlFor(profile);
  const displayHeading = profile.displayName?.trim() ? profile.displayName : profile.name;

  return (
    <article className="card max-w-[520px] mx-auto">
      <div className="section-label mb-6">
        <span>ENS Profile</span>
      </div>

      <div className="flex flex-col items-center text-center gap-4">
        <Avatar src={avatarUrl} name={profile.name} size={104} />

        <div>
          <h2 className="t-display text-[34px]" style={{ fontWeight: 400 }}>
            <span className="t-display-em">{profile.name}</span>
          </h2>
          {profile.displayName && profile.displayName !== profile.name && (
            <div className="t-label text-[10px] mt-1">{displayHeading}</div>
          )}
        </div>

        {profile.address && (
          <div className="inline-flex items-center gap-3">
            <code className="t-mono text-[12px]" title={profile.address}>
              {truncateAddress(profile.address, 6, 5)}
            </code>
            <CopyButton value={profile.address} label="Copy" />
          </div>
        )}

        {profile.description && (
          <p className="t-body max-w-[420px] mt-2" style={{ fontSize: 14, lineHeight: 1.7 }}>
            {profile.description}
          </p>
        )}

        <SocialLinks profile={profile} />
      </div>

      <div className="ma-rule" style={{ maxWidth: 220, margin: '24px auto 0' }}>
        <div className="ma-rule-line" />
        <div className="ma-rule-diamond" />
        <div className="ma-rule-line" />
      </div>
      <div className="t-caption text-center text-[11px]" style={{ marginTop: 12 }}>
        Resolved on-chain via PublicNode Ethereum RPC
      </div>
    </article>
  );
}
