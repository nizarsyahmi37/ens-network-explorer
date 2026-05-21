import type { ENSProfile } from '../../types';

interface Item {
  key: keyof ENSProfile;
  label: string;
  href: (v: string) => string;
  display: (v: string) => string;
}

const ITEMS: Item[] = [
  {
    key: 'twitter',
    label: 'Twitter',
    href: (v) => `https://x.com/${v.replace(/^@/, '')}`,
    display: (v) => `@${v.replace(/^@/, '')}`,
  },
  {
    key: 'github',
    label: 'GitHub',
    href: (v) => `https://github.com/${v}`,
    display: (v) => v,
  },
  {
    key: 'discord',
    label: 'Discord',
    href: () => '#',
    display: (v) => v,
  },
  {
    key: 'telegram',
    label: 'Telegram',
    href: (v) => `https://t.me/${v.replace(/^@/, '')}`,
    display: (v) => `@${v.replace(/^@/, '')}`,
  },
  {
    key: 'email',
    label: 'Email',
    href: (v) => `mailto:${v}`,
    display: (v) => v,
  },
  {
    key: 'url',
    label: 'Website',
    href: (v) => (v.startsWith('http') ? v : `https://${v}`),
    display: (v) => v.replace(/^https?:\/\//, ''),
  },
];

export function SocialLinks({ profile }: { profile: ENSProfile }) {
  const visible = ITEMS.filter((i) => !!profile[i.key]);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {visible.map((item) => {
        const raw = String(profile[item.key]);
        const href = item.href(raw);
        const isLink = href !== '#';
        const text = item.display(raw);
        const className = 'pill no-underline transition-colors hover:text-ink';
        return isLink ? (
          <a key={item.key} className={className} href={href} target="_blank" rel="noreferrer noopener" title={item.label}>
            {text}
          </a>
        ) : (
          <span key={item.key} className={className} title={item.label}>
            {text}
          </span>
        );
      })}
    </div>
  );
}
