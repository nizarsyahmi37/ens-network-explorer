import { useEffect, useState } from 'react';
import type { ENSProfile } from '../types';
import { fetchProfile } from '../services/ens';
import { isValidEnsName, normaliseEns } from '../lib/ens-utils';

interface UseENSResult {
  profile: ENSProfile | null;
  loading: boolean;
  error: string | null;
}

const DEBOUNCE_MS = 250;

export function useENS(rawName: string | undefined): UseENSResult {
  const [profile, setProfile] = useState<ENSProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawName) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }
    const name = normaliseEns(rawName);
    if (!isValidEnsName(name)) {
      setProfile(null);
      setError('Invalid ENS name — must end in .eth');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfile(null);

    const timer = setTimeout(() => {
      fetchProfile(name)
        .then((p) => {
          if (cancelled) return;
          setProfile(p);
          if (!p.address) {
            setError(`${name} is not registered.`);
          }
        })
        .catch(() => {
          if (cancelled) return;
          setError('Resolution failed. Check your connection and try again.');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [rawName]);

  return { profile, loading, error };
}
