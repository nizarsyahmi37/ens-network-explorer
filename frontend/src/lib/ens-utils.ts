export function isValidEnsName(name: string): boolean {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed.endsWith('.eth')) return false;
  const label = trimmed.slice(0, -4);
  if (label.length === 0) return false;
  // basic ENS label rules: a-z, 0-9, hyphen (not leading/trailing)
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label);
}

export function normaliseEns(name: string): string {
  return name.trim().toLowerCase();
}

export function truncateAddress(addr: string, head = 6, tail = 4): string {
  if (!addr) return '';
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function initialFrom(name: string): string {
  const label = name.replace(/\.eth$/, '').replace(/[^a-z0-9]/gi, '');
  return (label[0] || '?').toUpperCase();
}
