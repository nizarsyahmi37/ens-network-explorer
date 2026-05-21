import { JsonRpcProvider, getAddress } from 'ethers';
import type { ENSProfile } from '../types';
import { normaliseEns } from '../lib/ens-utils';

const RPC_URL = 'https://cloudflare-eth.com';

let providerSingleton: JsonRpcProvider | null = null;
function getProvider(): JsonRpcProvider {
  if (!providerSingleton) {
    providerSingleton = new JsonRpcProvider(RPC_URL, 'mainnet', {
      staticNetwork: true,
    });
  }
  return providerSingleton;
}

const TEXT_KEYS = [
  'avatar',
  'name',
  'description',
  'url',
  'com.twitter',
  'com.github',
  'com.discord',
  'org.telegram',
  'email',
] as const;

type TextKey = (typeof TEXT_KEYS)[number];

const TEXT_KEY_TO_FIELD: Record<TextKey, keyof ENSProfile> = {
  avatar: 'avatar',
  name: 'displayName',
  description: 'description',
  url: 'url',
  'com.twitter': 'twitter',
  'com.github': 'github',
  'com.discord': 'discord',
  'org.telegram': 'telegram',
  email: 'email',
};

const profileCache = new Map<string, Promise<ENSProfile>>();

export async function resolveAddress(ensName: string): Promise<string | null> {
  const name = normaliseEns(ensName);
  try {
    const provider = getProvider();
    const addr = await provider.resolveName(name);
    return addr ? getAddress(addr) : null;
  } catch (err) {
    console.warn('[ens] resolveAddress failed', name, err);
    return null;
  }
}

async function fetchProfileInner(ensName: string): Promise<ENSProfile> {
  const name = normaliseEns(ensName);
  const provider = getProvider();
  const profile: ENSProfile = { name, address: null };

  let resolver: Awaited<ReturnType<typeof provider.getResolver>> = null;
  try {
    resolver = await provider.getResolver(name);
  } catch (err) {
    console.warn('[ens] getResolver failed', name, err);
  }

  if (!resolver) {
    return profile;
  }

  const [addrResult, ...textResults] = await Promise.allSettled([
    resolver.getAddress(),
    ...TEXT_KEYS.map((k) => resolver!.getText(k)),
  ]);

  if (addrResult.status === 'fulfilled' && addrResult.value) {
    try {
      profile.address = getAddress(addrResult.value);
    } catch {
      profile.address = addrResult.value;
    }
  }

  textResults.forEach((r, idx) => {
    if (r.status === 'fulfilled' && r.value) {
      const field = TEXT_KEY_TO_FIELD[TEXT_KEYS[idx]];
      (profile[field] as string) = r.value;
    }
  });

  return profile;
}

export function fetchProfile(ensName: string): Promise<ENSProfile> {
  const name = normaliseEns(ensName);
  const cached = profileCache.get(name);
  if (cached) return cached;
  const pending = fetchProfileInner(name).catch((err) => {
    profileCache.delete(name);
    throw err;
  });
  profileCache.set(name, pending);
  return pending;
}

export function avatarUrlFor(profile: ENSProfile): string | undefined {
  if (!profile.avatar) return undefined;
  // ipfs:// → public gateway
  if (profile.avatar.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${profile.avatar.slice(7)}`;
  }
  // eip155 NFT avatars need on-chain resolution we don't support here — fall back
  if (profile.avatar.startsWith('eip155:')) return undefined;
  return profile.avatar;
}
