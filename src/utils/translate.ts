/**
 * CULTURAL_PHRASES: A mapping of common squad-slang to ensure
 * translations maintain context and "energy" rather than literal word-for-word.
 */
import type { Lang } from '../hooks/useTranslation';

const CULTURAL_PHRASES: Record<string, Record<string, string>> = {
  'lekker bezig': {
    nl: 'Lekker bezig!',
    pt: 'Arrasou!',
    ta: 'மிகவும் நன்று!',
    en: 'Doing great!',
  },
  'bom trabalho': {
    nl: 'Goed gewerkt!',
    pt: 'Bom trabalho!',
    ta: 'நல்ல வேலை!',
    en: 'Great work!',
  },
  'vera level': {
    nl: 'Top niveau!',
    pt: 'Nível Vera!',
    ta: 'சிறந்த நிலை!',
    en: 'Next level!',
  },
};

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

const PROXY = String(import.meta.env.VITE_TRANSLATE_PROXY_URL ?? '').trim();

export function uiLangToTarget(lang: Lang): 'nl' | 'pt' | 'ta' | 'en' {
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

async function translateViaProxy(
  text: string,
  toLang: 'nl' | 'pt' | 'ta' | 'en',
  fromLang?: string
): Promise<string | null> {
  if (!PROXY) return null;
  try {
    const res = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        to: toLang,
        from: fromLang && fromLang.length > 0 ? fromLang : 'Autodetect',
      }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { translatedText?: string };
    return typeof j.translatedText === 'string' ? j.translatedText : null;
  } catch {
    return null;
  }
}

function normFromLang(fromLang?: string): string | undefined {
  if (!fromLang?.trim()) return undefined;
  return fromLang.trim().toLowerCase();
}

/** MyMemory sometimes returns error prose instead of a translation. */
export function isFaultyMachineTranslation(s: string | undefined | null): boolean {
  if (s == null || !String(s).trim()) return true;
  const u = String(s).trim().toUpperCase();
  if (u.length > 600) return false;
  return (
    u.includes('PLEASE SELECT') ||
    u.includes('MYMEMORY') ||
    u.includes('QUERY LENGTH') ||
    u.includes('LIMIT EXCEEDED') ||
    u.includes('INVALID LANGUAGE') ||
    u.includes('LANGPAIR') ||
    u.includes('DAILY REQ') ||
    (u.startsWith('TRANSLATION') && u.includes('ERROR'))
  );
}

async function fetchMyMemoryPair(text: string, pair: string): Promise<string | null> {
  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(pair)}&de=contact@dupoind.hub`;
  const response = await fetch(url);
  const data = (await response.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
  };
  const raw = data?.responseData?.translatedText;
  if (typeof raw !== 'string') return null;
  return raw;
}

export async function translateText(
  text: string,
  toLang: 'nl' | 'pt' | 'ta' | 'en',
  fromLang?: string
) {
  const cleanText = text.trim().toLowerCase();

  for (const phrase in CULTURAL_PHRASES) {
    if (cleanText.includes(phrase)) {
      return CULTURAL_PHRASES[phrase][toLang] || text;
    }
  }

  const from = normFromLang(fromLang);
  try {
    if (from && from === toLang) return text;

    const proxied = await translateViaProxy(text, toLang, from);
    if (proxied != null && !isFaultyMachineTranslation(proxied)) {
      return proxied;
    }

    const tryPairs = from
      ? [`${from}|${toLang}`, `Autodetect|${toLang}`]
      : [`Autodetect|${toLang}`];

    for (const pair of tryPairs) {
      const out = await fetchMyMemoryPair(text, pair);
      if (out != null && !isFaultyMachineTranslation(out)) {
        return out;
      }
    }
    return text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}

/**
 * Returns translation objects for NL, PT, TA and EN (for UI language switching).
 */
export async function getFullTranslation(text: string, fromLang?: string) {
  const [nl, pt, ta, en] = await Promise.all([
    translateText(text, 'nl', fromLang),
    translateText(text, 'pt', fromLang),
    translateText(text, 'ta', fromLang),
    translateText(text, 'en', fromLang),
  ]);

  return { nl, pt, ta, en };
}

export type ChatTrans = { nl: string; pt: string; ta: string; en?: string };

/** Pick the best line for the current UI language; skip bogus API error strings. */
export function pickChatDisplayLine(original: string, trans: ChatTrans | undefined, uiLang: Lang): string {
  const tr = trans ?? { nl: '', pt: '', ta: '', en: '' };
  const pref: 'nl' | 'pt' | 'ta' | 'en' =
    uiLang === 'EN' ? 'en' : (uiLang.toLowerCase() as 'nl' | 'pt' | 'ta');

  const order: string[] = [
    pref === 'en' ? (tr.en ?? '') : (tr[pref] ?? ''),
    tr.en ?? '',
    original,
    tr.nl,
    tr.pt,
    tr.ta,
  ];

  const tried = new Set<string>();
  for (const c of order) {
    const v = c?.trim();
    if (!v || tried.has(v)) continue;
    tried.add(v);
    if (!isFaultyMachineTranslation(v)) return v;
  }
  return original.trim();
}
