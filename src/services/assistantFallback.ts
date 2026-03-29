import { getHubConfig } from '../config/appConfig';
import type { Lang } from '../hooks/useTranslation';
import { fetchOnThisDayHighlight, wikiLangFromUi } from './wikipediaOnThisDay';

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

/**
 * When Gemini is unavailable (permission, quota, etc.), still give a useful squad reply
 * from public APIs — Wikipedia “on this day” and Open-Meteo weather.
 */
export async function getCultureFallbackReply(query: string, lang: Lang): Promise<string> {
  const lower = query.toLowerCase();
  const wiki = wikiLangFromUi(lang);

  if (
    lower.includes('/weather') ||
    lower.includes('weer') ||
    lower.includes('weather') ||
    lower.includes('temp')
  ) {
    const w = await hubWeatherLines();
    const weatherLabel =
      lang === 'NL'
        ? '⛅ Live weer (Open-Meteo)'
        : lang === 'PT'
          ? '⛅ Tempo ao vivo (Open-Meteo)'
          : lang === 'TA'
            ? '⛅ நேரடி வானிலை (Open-Meteo)'
            : '⛅ Live weather (Open-Meteo)';
    return `${weatherLabel}: ${w}`;
  }

  const otd = await fetchOnThisDayHighlight(wiki);
  if (otd) {
    const headline =
      lang === 'NL'
        ? '📚 Vandaag (Wikipedia)'
        : lang === 'PT'
          ? '📚 Hoje (Wikipedia)'
          : lang === 'TA'
            ? '📚 இன்று (விக்கிப்பீடியா)'
            : '📚 On this day (Wikipedia)';

    const name = getHubConfig().assistantName;
    const tip =
      lang === 'NL'
        ? `✨ Tip: zet “Generative Language API” aan in Google Cloud voor volledige AI-antwoorden van ${name}.`
        : lang === 'PT'
          ? `✨ Ative a “Generative Language API” no Google Cloud para respostas completas de ${name}.`
          : lang === 'TA'
            ? `✨ முழு AI பதில்களுக்கு Google Cloud-ல் “Generative Language API”-யை இயக்கவும் (${name}).`
            : `✨ Enable “Generative Language API” in Google Cloud for full AI replies from ${name}.`;
    return `${headline}: ${otd.text}\n🔗 ${otd.url}\n\n${tip}`;
  }

  const offline =
    lang === 'NL'
      ? '📚 Geen live Wikipedia-tip geladen. Controleer je verbinding. Voor AI: schakel de Generative Language API in (Google Cloud → Library).'
      : lang === 'PT'
        ? '📚 Não foi possível carregar a dica da Wikipedia. Verifica a ligação. Para IA: ativa a Generative Language API no Google Cloud.'
        : lang === 'TA'
          ? '📚 விக்கிப்பீடியா உதவி ஏற்ற முடியவில்லை. இணைப்பைச் சரிபார்க்கவும். AI-க்கு Google Cloud-ல் Generative Language API-யை இயக்கவும்.'
          : '📚 Could not load a live Wikipedia tip. Check your connection. For AI: enable Generative Language API in Google Cloud → Library.';
  return offline;
}
