export interface Holiday {
  date: string;
  localName: string;
  name: string;
}

/**
 * Nager.Date sometimes returns an empty body for certain regions (e.g. IN under load).
 * We treat that as "no data", try a year-list fallback, and never throw on empty.
 */
export async function fetchNextPublicHoliday(countryCode: string): Promise<Holiday | null> {
  const next = await tryNextEndpoint(countryCode);
  if (next) return next;
  return tryYearListFallback(countryCode);
}

async function tryNextEndpoint(countryCode: string): Promise<Holiday | null> {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${countryCode}`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text?.trim()) return null;
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return null;
    }
    if (!Array.isArray(data) || data.length === 0) return null;
    const h = data[0] as Holiday;
    if (h?.date && h?.localName) return h;
  } catch {
    /* ignore */
  }
  return null;
}

async function tryYearListFallback(countryCode: string): Promise<Holiday | null> {
  const year = new Date().getFullYear();
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text?.trim()) return null;
    let list: Holiday[];
    try {
      list = JSON.parse(text) as Holiday[];
    } catch {
      return null;
    }
    if (!Array.isArray(list) || list.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = list
      .filter((h) => h?.date && h.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  } catch {
    return null;
  }
}
