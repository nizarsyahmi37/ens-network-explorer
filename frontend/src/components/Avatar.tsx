import { useState } from 'react';
import { initialFrom } from '../lib/ens-utils';

interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
}

export function Avatar({ src, name, size = 96 }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;
  const ring = Math.max(2, Math.round(size * 0.03));
  const inner = size - ring * 2;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid var(--c-gold)',
        padding: ring,
        background: 'var(--c-cream)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #2D3561 0%, #4A5240 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--c-on-dark)',
          fontFamily: 'Cormorant Garamond, serif',
          fontWeight: 300,
          fontSize: Math.max(14, inner * 0.42),
          letterSpacing: '0.04em',
        }}
      >
        {showImage ? (
          <img
            src={src}
            alt={`${name} avatar`}
            width={inner}
            height={inner}
            onError={() => setErrored(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initialFrom(name)
        )}
      </div>
    </div>
  );
}
