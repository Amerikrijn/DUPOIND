import { getHubConfig } from '../config/appConfig';
import type { Lang } from '../hooks/useTranslation';
import { translateStatic } from '../hooks/useTranslation';
import { translateText } from '../utils/translate';
import { fetchOnThisDayHighlight } from './wikipediaOnThisDay';

async function hubWeatherLines(): Promise<string> {
  const cities = getHubConfig().cities;
  const parts: string[] = [];
  for (const c of cities) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&current=temperature_2m,weather_code&timezone=auto`;
      const res = await fetch(url);
      const data = (await res.json()) as { current?: { temperature_2m: number } };
      const t = data.current?.temperature_2m;
      if (typeof t === 'number') parts.push(`${c.displayName}: ${Math.round(t)}°C`);
    } catch {
      parts.push(`${c.displayName}: —`);
    }
  }
  return parts.join(' · ');
}

function targetMem(lang: Lang): 'nl' | 'pt' | 'ta' | 'en' {
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

/**
 * When Gemini is unavailable (permission, quota, etc.), still give a useful squad reply
 * from public APIs — Wikipedia “on this day” (shared EN feed) and Open-Meteo weather.
 */
export async function getCultureFallbackReply(query: string, lang: Lang): Promise<string> {
  const lower = query.toLowerCase();

  if (
    lower.includes('/weather') ||
    lower.includes('weer') ||
    lower.includes('weather') ||
    lower.includes('temp')
  ) {
    const w = await hubWeatherLines();
    return `${translateStatic(lang, 'fallback_weather_label')}: ${w}`;
  }

  const otd = await fetchOnThisDayHighlight('en');
  if (otd) {
    const to = targetMem(lang);
    const body = to === 'en' ? otd.text : await translateText(otd.text, to, 'en');
    const name = getHubConfig().assistantName;
    const headline = translateStatic(lang, 'fallback_otd_headline');
    const tip = translateStatic(lang, 'fallback_gemini_tip', { name });
    return `${headline}: ${body}\n🔗 ${otd.url}\n\n${tip}`;
  }

  return translateStatic(lang, 'fallback_otd_offline');
}
