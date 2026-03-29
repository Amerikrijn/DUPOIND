/** Shared UTC calendar day + stable hash so all hubs see the same daily picks. */

export function getUtcYmd(d = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function utcDateSeed(d = new Date()): number {
  return d.getUTCFullYear() * 366 + (d.getUTCMonth() + 1) * 31 + d.getUTCDate();
}

export function stableHash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
