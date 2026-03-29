/**
 * Wikimedia "On this day" feed — no API key, changes daily per calendar date (UTC).
 * @see https://api.wikimedia.org/wiki/Feed_API/Get_feed_of_onthisday_events
 */
import type { Lang } from '../hooks/useTranslation';
import { utcDateSeed } from '../utils/hubDailySeed';

export type WikiLangCode = 'en' | 'nl' | 'pt' | 'ta';

export function wikiLangFromUi(lang: Lang): WikiLangCode {
  switch (lang) {
    case 'NL':
      return 'nl';
    case 'PT':
      return 'pt';
    case 'TA':
      return 'ta';
    default:
      return 'en';
  }
}

export type OnThisDayHighlight = {
  text: string;
  url: string;
  year?: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pickEventIndex(total: number, seed: number): number {
  if (total <= 0) return 0;
  return seed % Math.min(total, 12);
}

export async function fetchOnThisDayHighlight(wikiLang: WikiLangCode): Promise<OnThisDayHighlight | null> {
  const d = new Date();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/${wikiLang}/onthisday/events/${m}/${day}`;

  let res = await fetch(url);
  if (!res.ok && wikiLang !== 'en') {
    res = await fetch(
      `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${m}/${day}`
    );
  }
  if (!res.ok) return null;

  const data = (await res.json()) as {
    events?: Array<{
      text?: string;
      year?: number;
      pages?: Array<{
        content_urls?: { desktop?: { page?: string } };
        titles?: { normalized?: string };
      }>;
    }>;
  };

  const events = data.events;
  if (!events?.length) return null;

  const seed = utcDateSeed(d);
  const ev = events[pickEventIndex(events.length, seed)];
  if (!ev?.text) return null;

  const pageUrl =
    ev.pages?.[0]?.content_urls?.desktop?.page ??
    `https://${wikiLang}.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(ev.text.slice(0, 80))}`;

  const text = (ev.year != null ? `${ev.year}: ${ev.text}` : ev.text).slice(0, 480);

  return { text, url: pageUrl, year: ev.year };
}
